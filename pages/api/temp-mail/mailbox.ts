import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import TempMailbox from "../../../models/TempMailbox";
import TempMessage from "../../../models/TempMessage";
import {
  defaultDomain,
  getDomains,
  normalizePrefix,
  randomLocalPart,
  resolveViewer,
  type Viewer,
} from "../../../lib/tempMail";

const MAX_CREATE_ATTEMPTS = 6;

function ownerFilter(viewer: Viewer) {
  const clauses: Record<string, unknown>[] = [{ ownerKey: viewer.ownerKey }];
  if (viewer.email) clauses.push({ userEmail: viewer.email });
  return { $or: clauses };
}

function serialize(box: {
  _id: unknown;
  address: string;
  domain: string;
  plan: string;
  createdAt: Date;
  expiresAt: Date;
  messageCount: number;
}) {
  return {
    id: String(box._id),
    address: box.address,
    domain: box.domain,
    plan: box.plan,
    createdAt: box.createdAt,
    expiresAt: box.expiresAt,
    expiresInMs: Math.max(0, new Date(box.expiresAt).getTime() - Date.now()),
    messageCount: box.messageCount,
  };
}

/**
 * GET    /api/temp-mail/mailbox            list the caller's live mailboxes
 * POST   /api/temp-mail/mailbox            create one (body: { prefix?, domain? })
 * PATCH  /api/temp-mail/mailbox            renew one (body: { address })
 * DELETE /api/temp-mail/mailbox?address=   destroy one and its messages
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const viewer = await resolveViewer(req, res);
    if (!viewer) return res.status(500).json({ message: "Cannot resolve viewer" });

    await connectToDatabase();
    const now = new Date();

    if (req.method === "GET") {
      const boxes = await TempMailbox.find({
        ...ownerFilter(viewer),
        expiresAt: { $gt: now },
      })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ plan: viewer.plan, mailboxes: boxes.map(serialize) });
    }

    if (req.method === "POST") {
      const domains = getDomains();
      if (domains.length === 0) {
        return res.status(503).json({
          message: "ยังไม่ได้ตั้งค่าโดเมนรับเมล (TEMP_MAIL_DOMAINS)",
        });
      }

      const live = await TempMailbox.countDocuments({
        ...ownerFilter(viewer),
        expiresAt: { $gt: now },
      });
      if (live >= viewer.limits.maxMailboxes) {
        return res.status(409).json({
          message:
            viewer.plan === "free"
              ? "แผน Free ใช้ได้ 1 กล่องต่อครั้ง — ลบกล่องเดิมก่อน หรืออัปเกรดเป็น Pro"
              : `ใช้ได้สูงสุด ${viewer.limits.maxMailboxes} กล่องพร้อมกัน`,
          code: "MAILBOX_LIMIT",
        });
      }

      // Domain choice is a Pro affordance; Free is pinned to the primary domain.
      let domain = defaultDomain();
      const requestedDomain = typeof req.body?.domain === "string" ? req.body.domain.toLowerCase().trim() : "";
      if (requestedDomain && requestedDomain !== domain) {
        if (viewer.plan !== "pro") {
          return res.status(403).json({ message: "เลือกโดเมนเองได้เฉพาะแผน Pro", code: "PRO_ONLY" });
        }
        if (!domains.includes(requestedDomain)) {
          return res.status(400).json({ message: "ไม่รู้จักโดเมนนี้" });
        }
        domain = requestedDomain;
      }

      const rawPrefix = typeof req.body?.prefix === "string" ? req.body.prefix : "";
      let fixedLocalPart: string | null = null;
      if (rawPrefix.trim()) {
        if (!viewer.limits.customPrefix) {
          return res.status(403).json({
            message: "ตั้งชื่อกล่องเองได้เฉพาะแผน Pro",
            code: "PRO_ONLY",
          });
        }
        const checked = normalizePrefix(rawPrefix);
        if (!checked.ok) return res.status(400).json({ message: checked.error });
        fixedLocalPart = checked.value;
      }

      const expiresAt = new Date(now.getTime() + viewer.limits.ttlMinutes * 60 * 1000);

      for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
        const localPart = fixedLocalPart ?? randomLocalPart();
        try {
          const box = await TempMailbox.create({
            address: `${localPart}@${domain}`,
            localPart,
            domain,
            ownerKey: viewer.ownerKey,
            userEmail: viewer.email,
            plan: viewer.plan,
            createdAt: now,
            expiresAt,
            lastSeenAt: now,
            messageCount: 0,
          });
          return res.status(201).json({ plan: viewer.plan, mailbox: serialize(box) });
        } catch (err) {
          const mongoErr = err as { code?: number };
          if (mongoErr?.code !== 11000) throw err;
          if (fixedLocalPart) {
            return res.status(409).json({ message: "ที่อยู่นี้ถูกใช้งานอยู่ ลองชื่ออื่น" });
          }
        }
      }
      return res.status(503).json({ message: "สร้างที่อยู่ไม่สำเร็จ ลองอีกครั้ง" });
    }

    if (req.method === "PATCH") {
      const address = typeof req.body?.address === "string" ? req.body.address.toLowerCase().trim() : "";
      if (!address) return res.status(400).json({ message: "address required" });

      const box = await TempMailbox.findOne({ ...ownerFilter(viewer), address, expiresAt: { $gt: now } });
      if (!box) return res.status(404).json({ message: "ไม่พบกล่องนี้ หรือหมดอายุแล้ว" });

      const expiresAt = new Date(now.getTime() + viewer.limits.ttlMinutes * 60 * 1000);
      box.expiresAt = expiresAt;
      box.lastSeenAt = now;
      await box.save();
      // Messages die with their mailbox, so push their TTL out too.
      await TempMessage.updateMany({ mailboxId: box._id }, { $set: { expiresAt } });

      return res.status(200).json({ plan: viewer.plan, mailbox: serialize(box) });
    }

    if (req.method === "DELETE") {
      const address = String(req.query.address || "").toLowerCase().trim();
      if (!address) return res.status(400).json({ message: "address required" });

      const box = await TempMailbox.findOne({ ...ownerFilter(viewer), address });
      if (!box) return res.status(404).json({ message: "ไม่พบกล่องนี้" });

      await TempMessage.deleteMany({ mailboxId: box._id });
      await TempMailbox.deleteOne({ _id: box._id });
      return res.status(200).json({ message: "Deleted" });
    }

    return res.status(405).end();
  } catch (err) {
    console.error("[temp-mail/mailbox]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
