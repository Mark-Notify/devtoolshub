import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import TempMailbox from "../../../models/TempMailbox";
import TempMessage, { type ITempAttachment } from "../../../models/TempMessage";
import { PLANS, makePreview, sanitizeHtml, timingSafeEqual } from "../../../lib/tempMail";

// Attachments arrive base64-encoded inside the JSON body. Vercel caps a
// serverless request at ~4.5 MB, so the worker must not send more than that.
export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

type IncomingAttachment = {
  filename?: string;
  contentType?: string;
  mimeType?: string;
  size?: number;
  content?: string;
};

type IncomingMail = {
  to?: string | string[];
  from?: string | { name?: string; address?: string };
  subject?: string;
  messageId?: string;
  text?: string;
  html?: string;
  size?: number;
  attachments?: IncomingAttachment[];
};

/** Pulls the bare address out of `"Some One" <a@b.com>` or a plain address. */
function parseAddress(raw: string): { name: string | null; address: string } {
  const value = String(raw || "").trim();
  const angled = value.match(/^(.*)<([^>]+)>\s*$/);
  if (angled) {
    const name = angled[1].trim().replace(/^["']|["']$/g, "");
    return { name: name || null, address: angled[2].trim().toLowerCase() };
  }
  return { name: null, address: value.toLowerCase() };
}

function firstRecipient(to: IncomingMail["to"]): string {
  if (Array.isArray(to)) return to.length ? String(to[0]) : "";
  return String(to || "");
}

/**
 * POST /api/temp-mail/inbound
 *
 * Called by the Cloudflare Email Worker (see workers/temp-mail-inbound), which
 * already parsed the MIME message. Authenticated with a shared secret header.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const secret = process.env.TEMP_MAIL_INBOUND_SECRET;
  if (!secret) {
    console.error("[temp-mail/inbound] TEMP_MAIL_INBOUND_SECRET is not set");
    return res.status(500).json({ message: "Server misconfiguration" });
  }
  const provided = String(req.headers["x-tempmail-secret"] || "");
  if (!provided || !timingSafeEqual(provided, secret)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const body = (req.body || {}) as IncomingMail;
    const recipient = parseAddress(firstRecipient(body.to)).address;
    if (!recipient || !recipient.includes("@")) {
      return res.status(400).json({ message: "missing recipient" });
    }

    await connectToDatabase();
    const now = new Date();

    const box = await TempMailbox.findOne({ address: recipient, expiresAt: { $gt: now } });
    if (!box) {
      // Unknown or expired address: accept and drop, so the sending MTA does not
      // retry and we do not confirm which addresses exist.
      return res.status(202).json({ message: "No active mailbox for recipient", stored: false });
    }

    const from =
      typeof body.from === "string"
        ? parseAddress(body.from)
        : {
            name: body.from?.name?.trim() || null,
            address: (body.from?.address || "unknown@unknown").toLowerCase(),
          };

    const limits = PLANS[box.plan] ?? PLANS.free;
    const incoming = Array.isArray(body.attachments) ? body.attachments : [];

    const attachments: ITempAttachment[] = [];
    let totalStored = 0;
    for (const att of incoming) {
      const contentType = att.contentType || att.mimeType || "application/octet-stream";
      const raw = typeof att.content === "string" ? att.content : "";
      const size = att.size ?? (raw ? Buffer.byteLength(raw, "base64") : 0);

      const withinCaps =
        limits.attachments &&
        Boolean(raw) &&
        size <= limits.maxAttachmentBytes &&
        totalStored + size <= limits.maxTotalAttachmentBytes;

      if (withinCaps) totalStored += size;

      attachments.push({
        filename: (att.filename || "attachment").slice(0, 160),
        contentType: contentType.slice(0, 120),
        size,
        // Free mailboxes keep the file name for display but never the bytes.
        content: withinCaps ? raw : null,
        stored: withinCaps,
      });
    }

    const html = sanitizeHtml(String(body.html || ""));
    const text = String(body.text || "").slice(0, 200_000);
    const subject = String(body.subject || "").trim().slice(0, 300) || "(ไม่มีหัวข้อ)";

    const message = await TempMessage.create({
      mailboxId: box._id,
      address: box.address,
      messageId: body.messageId ? String(body.messageId).slice(0, 300) : null,
      fromName: from.name,
      fromAddress: from.address,
      to: recipient,
      subject,
      text,
      html,
      preview: makePreview(text, html),
      attachments,
      hadAttachments: incoming.length > 0,
      size: Number(body.size) || Buffer.byteLength(text) + Buffer.byteLength(html),
      read: false,
      receivedAt: now,
      expiresAt: box.expiresAt,
    });

    await TempMailbox.updateOne({ _id: box._id }, { $inc: { messageCount: 1 } });

    // Keep only the newest N messages per mailbox.
    const overflow = await TempMessage.find({ mailboxId: box._id })
      .sort({ receivedAt: -1 })
      .skip(limits.maxMessages)
      .select("_id")
      .lean();
    if (overflow.length) {
      await TempMessage.deleteMany({ _id: { $in: overflow.map((m) => m._id) } });
    }

    return res.status(200).json({ message: "Stored", stored: true, id: String(message._id) });
  } catch (err) {
    console.error("[temp-mail/inbound]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
