import { connectToDatabase } from "../../../../lib/mongodb";
import UserData from "../../../../models/UserData";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/history/share/[id]
 *
 * Public endpoint — no authentication required.
 * Returns a single history entry matched by its shareId.
 * Only safe fields are returned: tool, inputData, outputData, createdAt.
 * userEmail is never exposed.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query;
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    await connectToDatabase();

    const entry = await UserData.findOne({ shareId: id }).select(
      "tool inputData outputData createdAt shareId -_id"
    );

    if (!entry) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json(entry);
  } catch (err) {
    console.error("[history/share] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
