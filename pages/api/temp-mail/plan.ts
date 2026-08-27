import type { NextApiRequest, NextApiResponse } from "next";
import { PLANS, getDomains, resolveViewer } from "../../../lib/tempMail";

/**
 * GET /api/temp-mail/plan
 * Reports which plan the caller gets plus the limits of both tiers, so the UI
 * can render the locked Pro card without a second round-trip.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const viewer = await resolveViewer(req, res);
    if (!viewer) return res.status(500).json({ message: "Cannot resolve viewer" });

    return res.status(200).json({
      plan: viewer.plan,
      email: viewer.email,
      signedIn: Boolean(viewer.email),
      limits: viewer.limits,
      plans: PLANS,
      domains: viewer.plan === "pro" ? getDomains() : getDomains().slice(0, 1),
    });
  } catch (err) {
    console.error("[temp-mail/plan]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
