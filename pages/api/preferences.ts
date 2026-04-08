import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import UserPreferences from "../../models/UserPreferences";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await connectToDatabase();
  const userEmail = session.user.email;

  if (req.method === "GET") {
    const prefs = await UserPreferences.findOne({ userEmail });
    return res.status(200).json(prefs || {});
  }

  if (req.method === "POST") {
    const { theme, jsonIndent, autoCopy, sidebarCollapsed, defaultTool } = req.body;
    const prefs = await UserPreferences.findOneAndUpdate(
      { userEmail },
      { userEmail, theme, jsonIndent, autoCopy, sidebarCollapsed, defaultTool, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json(prefs);
  }

  return res.status(405).end();
}
