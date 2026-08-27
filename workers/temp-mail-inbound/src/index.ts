import PostalMime from "postal-mime";

export interface Env {
  /** Full URL of the Next.js webhook, e.g. https://www.devtoolshub.org/api/temp-mail/inbound */
  INBOUND_WEBHOOK_URL: string;
  /** Must match TEMP_MAIL_INBOUND_SECRET on the Next.js side. */
  INBOUND_SECRET: string;
  /** Optional: forward a copy of every message here for debugging. */
  FORWARD_TO?: string;
}

// Vercel rejects serverless request bodies above ~4.5 MB; stay under it.
const MAX_BODY_BYTES = 4_000_000;
const MAX_ATTACHMENT_BYTES = 1_000_000;

type ForwardableEmailMessage = {
  from: string;
  to: string;
  raw: ReadableStream;
  rawSize: number;
  setReject: (reason: string) => void;
  forward: (rcptTo: string) => Promise<void>;
};

function toBase64(data: ArrayBuffer | string): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const parsed = await PostalMime.parse(message.raw);

    let budget = MAX_BODY_BYTES;
    const attachments = (parsed.attachments || []).map((att) => {
      const content = att.content
        ? toBase64(att.content as ArrayBuffer | string)
        : "";
      const size = Math.ceil((content.length * 3) / 4);
      const keep = size > 0 && size <= MAX_ATTACHMENT_BYTES && size <= budget;
      if (keep) budget -= size;
      return {
        filename: att.filename || "attachment",
        contentType: att.mimeType || "application/octet-stream",
        size,
        // Oversized files still show up in the UI as a name, just not downloadable.
        content: keep ? content : "",
      };
    });

    const payload = {
      to: message.to,
      from: {
        name: parsed.from?.name || null,
        address: parsed.from?.address || message.from,
      },
      subject: parsed.subject || "",
      messageId: parsed.messageId || "",
      text: (parsed.text || "").slice(0, 200_000),
      html: (parsed.html || "").slice(0, 400_000),
      size: message.rawSize,
      attachments,
    };

    const response = await fetch(env.INBOUND_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tempmail-secret": env.INBOUND_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // A non-2xx tells Cloudflare to bounce, which makes delivery problems
      // visible to the sender instead of silently losing mail.
      const detail = await response.text().catch(() => "");
      console.error("inbound webhook failed", response.status, detail.slice(0, 500));
      message.setReject(`Mailbox unavailable (${response.status})`);
      return;
    }

    if (env.FORWARD_TO) {
      await message.forward(env.FORWARD_TO).catch(() => undefined);
    }
  },
};
