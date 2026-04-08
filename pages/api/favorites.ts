import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import Favorite from "../../models/Favorite";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await connectToDatabase();
  const userEmail = session.user.email;

  if (req.method === "GET") {
    const favorites = await Favorite.find({ userEmail }).sort({ createdAt: -1 });
    return res.status(200).json(favorites);
  }

  if (req.method === "POST") {
    const { toolKey } = req.body;
    if (!toolKey) return res.status(400).json({ message: "toolKey required" });
    try {
      const fav = await Favorite.create({ userEmail, toolKey });
      return res.status(201).json(fav);
    } catch {
      // Already exists (duplicate key)
      return res.status(409).json({ message: "Already favorited" });
    }
  }

  if (req.method === "DELETE") {
    const { toolKey } = req.body;
    if (!toolKey) return res.status(400).json({ message: "toolKey required" });
    await Favorite.deleteOne({ userEmail, toolKey });
    return res.status(200).json({ message: "Removed" });
  }

  return res.status(405).end();
}
