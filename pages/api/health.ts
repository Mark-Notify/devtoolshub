import { connectToDatabase } from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    await connectToDatabase();
    return res.status(200).json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] DB connection failed:", err);
    return res.status(503).json({
      status: "error",
      db: "disconnected",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
}
