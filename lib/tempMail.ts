import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { connectToDatabase } from "./mongodb";
import ProWhitelist from "../models/ProWhitelist";
import type { MailPlan } from "../models/TempMailbox";

export type { MailPlan };

export type PlanLimits = {
  key: MailPlan;
  label: string;
  /** Mailbox lifetime in minutes. */
  ttlMinutes: number;
  /** How many mailboxes may be alive at the same time. */
  maxMailboxes: number;
  attachments: boolean;
  customPrefix: boolean;
  /** Newest N messages kept per mailbox. */
  maxMessages: number;
  /** Per-file cap for stored attachments, in bytes. */
  maxAttachmentBytes: number;
  /** Combined cap for all attachments of one message, in bytes. */
  maxTotalAttachmentBytes: number;
};

export const PLANS: Record<MailPlan, PlanLimits> = {
  free: {
    key: "free",
    label: "Free",
    ttlMinutes: 10,
    maxMailboxes: 1,
    attachments: false,
    customPrefix: false,
    maxMessages: 30,
    maxAttachmentBytes: 0,
    maxTotalAttachmentBytes: 0,
  },
  pro: {
    key: "pro",
    label: "Pro",
    ttlMinutes: 24 * 60,
    maxMailboxes: 5,
    attachments: true,
    customPrefix: true,
    maxMessages: 200,
    maxAttachmentBytes: 1024 * 1024,
    maxTotalAttachmentBytes: 4 * 1024 * 1024,
  },
};

/** Local parts nobody is allowed to claim, even on Pro. */
export const RESERVED_PREFIXES = new Set([
  "abuse", "admin", "administrator", "billing", "contact", "help", "hostmaster",
  "info", "mail", "mailer-daemon", "no-reply", "noreply", "postmaster", "root",
  "sales", "security", "ssl-admin", "support", "sysadmin", "webmaster",
]);

export const OWNER_COOKIE = "tm_owner";
const OWNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getDomains(): string[] {
  const raw = process.env.TEMP_MAIL_DOMAINS || "";
  const domains = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains;
}

export function defaultDomain(): string {
  return getDomains()[0] || "";
}

function readCookie(req: NextApiRequest, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/**
 * Stable anonymous identity for a browser. Free users never sign in, so mailbox
 * ownership hangs off this httpOnly cookie rather than an account.
 */
export function getOrCreateOwnerKey(req: NextApiRequest, res: NextApiResponse): string {
  const existing = readCookie(req, OWNER_COOKIE);
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;

  const ownerKey = crypto.randomBytes(16).toString("hex");
  const attrs = [
    `${OWNER_COOKIE}=${ownerKey}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${OWNER_COOKIE_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") attrs.push("Secure");

  // Append rather than assign — NextAuth may also be writing session cookies on
  // this response, and a bare setHeader would drop them.
  const existingHeader = res.getHeader("Set-Cookie");
  const cookies = Array.isArray(existingHeader)
    ? existingHeader.map(String)
    : existingHeader
    ? [String(existingHeader)]
    : [];
  res.setHeader("Set-Cookie", [...cookies, attrs.join("; ")]);
  return ownerKey;
}

export function getOwnerKey(req: NextApiRequest): string | null {
  const existing = readCookie(req, OWNER_COOKIE);
  return existing && /^[a-f0-9]{32}$/.test(existing) ? existing : null;
}

export async function isProEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  await connectToDatabase();
  const entry = await ProWhitelist.findOne({
    email: email.toLowerCase().trim(),
    active: true,
  }).lean();
  return Boolean(entry);
}

export type Viewer = {
  ownerKey: string;
  email: string | null;
  plan: MailPlan;
  limits: PlanLimits;
};

/**
 * Resolves who is asking and which plan they get. Pro is granted only when the
 * signed-in Google email is on the Mongo allow-list — there is no payment flow.
 */
export async function resolveViewer(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: { create?: boolean } = {}
): Promise<Viewer | null> {
  // Session first: getServerSession may write its own Set-Cookie, and the owner
  // cookie is appended after so both survive.
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email?.toLowerCase() ?? null;

  const ownerKey = opts.create === false ? getOwnerKey(req) : getOrCreateOwnerKey(req, res);
  if (!ownerKey) return null;

  const plan: MailPlan = (await isProEmail(email)) ? "pro" : "free";

  return { ownerKey, email, plan, limits: PLANS[plan] };
}

// Deliberately excludes the characters that get misread off a screen — 0/o,
// 1/l/i — because people do retype these addresses into signup forms by hand.
const LOCAL_PART_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const LOCAL_PART_LENGTH = 10;

/**
 * 31^10 ≈ 8.2e14 addresses. `randomInt` draws from a uniform range rather than
 * taking `Math.random() % n`, so no character is favoured over another.
 */
export function randomLocalPart(): string {
  let localPart = "";
  for (let i = 0; i < LOCAL_PART_LENGTH; i++) {
    localPart += LOCAL_PART_ALPHABET[crypto.randomInt(0, LOCAL_PART_ALPHABET.length)];
  }
  return localPart;
}

export type PrefixCheck = { ok: true; value: string } | { ok: false; error: string };

export function normalizePrefix(raw: string): PrefixCheck {
  const value = String(raw || "").trim().toLowerCase();
  if (value.length < 3 || value.length > 32) {
    return { ok: false, error: "ชื่อกล่องต้องยาว 3-32 ตัวอักษร" };
  }
  if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(value)) {
    return { ok: false, error: "ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีดกลาง และ _ (ขึ้นต้น/ลงท้ายด้วยตัวอักษรหรือตัวเลข)" };
  }
  if (RESERVED_PREFIXES.has(value)) {
    return { ok: false, error: "ชื่อนี้ถูกสงวนไว้ ใช้ไม่ได้" };
  }
  return { ok: true, value };
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Best-effort HTML scrub for message bodies. The client additionally renders the
 * result inside a `sandbox`-ed iframe with no `allow-scripts`, so this is the
 * outer layer of a defence-in-depth pair rather than the only barrier.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let html = input;
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|iframe|object|embed|link|meta|base|form|input|button)\b[^>]*>/gi, "");
  // inline event handlers: onclick="..." / onerror='...' / onload=...
  html = html.replace(/\son[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src|action|formaction|xlink:href)\s*=\s*("|')?\s*(javascript|vbscript|data:text\/html)[^"'>\s]*("|')?/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  return html;
}

export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function makePreview(text: string, html: string): string {
  const source = text?.trim() ? text : stripHtml(html || "");
  return source.replace(/\s+/g, " ").trim().slice(0, 180);
}
