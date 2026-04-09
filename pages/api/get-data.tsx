import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import UserData from "../../models/UserData";
import crypto from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await connectToDatabase();

  // GET — list only the current user's history
  if (req.method === "GET") {
    const data = await UserData.find({ userEmail: session.user.email }).sort({ createdAt: -1 });
    return res.status(200).json(data);
  }

  // PATCH — generate a public shareId for one of the user's own history entries
  if (req.method === "PATCH") {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ message: "id required" });

    const entry = await UserData.findOne({ _id: id, userEmail: session.user.email });
    if (!entry) return res.status(404).json({ message: "Not found or access denied" });

    if (!entry.shareId) {
      entry.shareId = crypto.randomUUID();
      await entry.save();
    }

    return res.status(200).json({ shareId: entry.shareId });
  }

  return res.status(405).end();
}

