import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import TempMailbox from "../../../models/TempMailbox";
import TempMessage from "../../../models/TempMessage";
import { resolveViewer, type Viewer } from "../../../lib/tempMail";

function ownerFilter(viewer: Viewer) {
  const clauses: Record<string, unknown>[] = [{ ownerKey: viewer.ownerKey }];
  if (viewer.email) clauses.push({ userEmail: viewer.email });
  return { $or: clauses };
}

/**
 * GET /api/temp-mail/messages?address=abc123@domain&since=<iso>
 *
 * Returns message headers only — bodies are fetched one at a time from
 * /api/temp-mail/message/[id]. The UI polls this endpoint; `since` keeps the
 * polling payload small once the inbox has been loaded.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const viewer = await resolveViewer(req, res);
    if (!viewer) return res.status(500).json({ message: "Cannot resolve viewer" });

    const address = String(req.query.address || "").toLowerCase().trim();
    if (!address) return res.status(400).json({ message: "address required" });

    await connectToDatabase();
    const now = new Date();

    const box = await TempMailbox.findOne({ ...ownerFilter(viewer), address });
    if (!box) return res.status(404).json({ message: "ไม่พบกล่องนี้", code: "NOT_FOUND" });
    if (box.expiresAt.getTime() <= now.getTime()) {
      return res.status(410).json({ message: "กล่องนี้หมดอายุแล้ว", code: "EXPIRED" });
    }

    const query: Record<string, unknown> = { mailboxId: box._id, expiresAt: { $gt: now } };
    const since = String(req.query.since || "");
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) query.receivedAt = { $gt: sinceDate };
    }

    const messages = await TempMessage.find(query)
      .select("-html -text -attachments.content")
      .sort({ receivedAt: -1 })
      .limit(200)
      .lean();

    // Cheap "user is still here" signal; mailboxes idle past TTL simply expire.
    await TempMailbox.updateOne({ _id: box._id }, { $set: { lastSeenAt: now } });

    return res.status(200).json({
      plan: viewer.plan,
      mailbox: {
        address: box.address,
        plan: box.plan,
        expiresAt: box.expiresAt,
        expiresInMs: Math.max(0, box.expiresAt.getTime() - now.getTime()),
        messageCount: box.messageCount,
      },
      messages: messages.map((m) => ({
        id: String(m._id),
        fromName: m.fromName,
        fromAddress: m.fromAddress,
        subject: m.subject,
        preview: m.preview,
        read: m.read,
        size: m.size,
        hadAttachments: m.hadAttachments,
        attachmentCount: (m.attachments || []).length,
        receivedAt: m.receivedAt,
      })),
    });
  } catch (err) {
    console.error("[temp-mail/messages]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
