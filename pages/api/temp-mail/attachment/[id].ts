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

/** Keep the browser from being talked into rendering a hostile attachment inline. */
function safeFilename(name: string): string {
  return (name || "attachment").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
}

/**
 * GET /api/temp-mail/attachment/[id]?index=0
 * Pro-only download. Free mailboxes never store attachment bytes at all.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const id = String(req.query.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const index = Number(req.query.index ?? 0);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ message: "invalid index" });
    }

    const viewer = await resolveViewer(req, res, { create: false });
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });
    if (viewer.plan !== "pro") {
      return res.status(403).json({ message: "ดาวน์โหลดไฟล์แนบได้เฉพาะแผน Pro", code: "PRO_ONLY" });
    }

    await connectToDatabase();
    const now = new Date();

    const message = await TempMessage.findOne({ _id: id, expiresAt: { $gt: now } });
    if (!message) return res.status(404).json({ message: "ไม่พบอีเมลนี้" });

    const box = await TempMailbox.findOne({ ...ownerFilter(viewer), _id: message.mailboxId });
    if (!box) return res.status(403).json({ message: "Forbidden" });

    const attachment = message.attachments[index];
    if (!attachment || !attachment.stored || !attachment.content) {
      return res.status(404).json({ message: "ไม่มีไฟล์แนบนี้เก็บไว้" });
    }

    const buffer = Buffer.from(attachment.content, "base64");
    res.setHeader("Content-Type", attachment.contentType || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(attachment.filename)}"`
    );
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("[temp-mail/attachment]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
