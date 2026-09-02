# temp-mail-inbound (Cloudflare Email Worker)

Vercel cannot receive SMTP — serverless functions have no long-lived process and
no port 25. This Worker is the mail server half of the Temp Mail architecture:
Cloudflare accepts the message on its MX, this Worker parses the MIME, and the
result is POSTed as JSON to `/api/temp-mail/inbound` on the Next.js app.

```
Internet Mail ──► Cloudflare MX ──► Email Worker ──► POST /api/temp-mail/inbound ──► MongoDB
```

## Prerequisites

- A domain whose nameservers are on Cloudflare (free plan is enough).
- Email Routing enabled: **Cloudflare dashboard → your domain → Email → Email Routing**,
  then "Get started" so Cloudflare adds the MX/TXT records for you.

## Deploy

```bash
cd workers/temp-mail-inbound
npm install
```

Set the webhook target in `wrangler.toml` (`INBOUND_WEBHOOK_URL`), then store the
shared secret — it must equal `TEMP_MAIL_INBOUND_SECRET` in the Vercel project:

```bash
npx wrangler secret put INBOUND_SECRET
```

```bash
npx wrangler deploy
```

## Route the catch-all

In **Email → Email Routing → Routing rules → Catch-all address**, set the action
to **Send to a Worker** and pick `temp-mail-inbound`. Every address on the domain
now reaches the Worker; unknown or expired mailboxes are accepted and dropped by
the webhook.

Tail the logs while testing:

```bash
npx wrangler tail
```

## Limits worth knowing

| Limit | Value | Where it comes from |
|-------|-------|---------------------|
| Message size | 25 MB | Cloudflare Email Routing |
| Webhook body | ~4.5 MB | Vercel serverless request cap |
| Per-attachment stored | 1 MB | `MAX_ATTACHMENT_BYTES` (Worker) + `PLANS.pro` (app) |
| Total attachments per mail | 4 MB | `MAX_BODY_BYTES` (Worker) + `PLANS.pro` (app) |

Attachments above the cap still appear in the UI by name; only the bytes are
dropped. Free mailboxes never store attachment bytes at all.

## Payload contract

Any provider can drive `/api/temp-mail/inbound` — Mailgun, Resend, a self-hosted
MTA — as long as it sends this shape with the `x-tempmail-secret` header:

```json
{
  "to": "abc1234@yourdomain.com",
  "from": { "name": "GitHub", "address": "noreply@github.com" },
  "subject": "Verify your device",
  "messageId": "<...>",
  "text": "plain text body",
  "html": "<p>html body</p>",
  "size": 12345,
  "attachments": [
    { "filename": "a.pdf", "contentType": "application/pdf", "size": 8123, "content": "<base64>" }
  ]
}
```

Responses: `200` stored, `202` no active mailbox (accepted and dropped),
`401` bad secret, `4xx/5xx` cause the Worker to reject so the sender is told.
