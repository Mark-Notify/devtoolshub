import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { connectToDatabase } from "../../../../lib/mongodb";
import TempMailbox from "../../../../models/TempMailbox";
import TempMessage from "../../../../models/TempMessage";
import { resolveViewer, type Viewer } from "../../../../lib/tempMail";

function ownerFilter(viewer: Viewer) {
  const clauses: Record<string, unknown>[] = [{ ownerKey: viewer.ownerKey }];
  if (viewer.email) clauses.push({ userEmail: viewer.email });
  return { $or: clauses };
}

/**
 * GET    /api/temp-mail/message/[id]   full body (marks the message read)
 * DELETE /api/temp-mail/message/[id]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = String(req.query.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }

    const viewer = await resolveViewer(req, res, { create: false });
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    await connectToDatabase();
    const now = new Date();

    const message = await TempMessage.findOne({ _id: id, expiresAt: { $gt: now } });
    if (!message) return res.status(404).json({ message: "ไม่พบอีเมลนี้" });

    const box = await TempMailbox.findOne({ ...ownerFilter(viewer), _id: message.mailboxId });
    if (!box) return res.status(403).json({ message: "Forbidden" });

    if (req.method === "DELETE") {
      await TempMessage.deleteOne({ _id: message._id });
      await TempMailbox.updateOne({ _id: box._id }, { $inc: { messageCount: -1 } });
      return res.status(200).json({ message: "Deleted" });
    }

    if (req.method !== "GET") return res.status(405).end();

    if (!message.read) {
      message.read = true;
      await message.save();
    }

    const canReadAttachments = viewer.plan === "pro" && box.plan === "pro";

    return res.status(200).json({
      plan: viewer.plan,
      message: {
        id: String(message._id),
        fromName: message.fromName,
        fromAddress: message.fromAddress,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        size: message.size,
        receivedAt: message.receivedAt,
        hadAttachments: message.hadAttachments,
        attachmentsLocked: message.hadAttachments && !canReadAttachments,
        attachments: canReadAttachments
          ? message.attachments.map((a, index) => ({
              index,
              filename: a.filename,
              contentType: a.contentType,
              size: a.size,
              stored: a.stored,
            }))
          : [],
      },
    });
  } catch (err) {
    console.error("[temp-mail/message]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
