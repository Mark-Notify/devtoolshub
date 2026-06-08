import { connectToDatabase } from "../../../lib/mongodb";
import UserData from "../../../models/UserData";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/history/cleanup
 *
 * Deletes UserData records older than 1 month.
 * Protected by Bearer token matching the CRON_SECRET env var.
 * Called by Vercel Cron on the 1st of every month at 02:00 UTC.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[history/cleanup] CRON_SECRET env var is not set");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await connectToDatabase();

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await UserData.deleteMany({ createdAt: { $lt: cutoff } });

    return res.status(200).json({
      message: "Cleanup complete",
      deleted: result.deletedCount,
      cutoffDate: cutoff.toISOString(),
    });
  } catch (err) {
    console.error("[history/cleanup] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
