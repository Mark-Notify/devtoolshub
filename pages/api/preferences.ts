import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { connectToDatabase } from "../../lib/mongodb";
import UserPreferences from "../../models/UserPreferences";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
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
    const body = req.body ?? {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.theme === "string") update.theme = body.theme;
    if (typeof body.jsonIndent === "number") update.jsonIndent = body.jsonIndent;
    if (typeof body.autoCopy === "boolean") update.autoCopy = body.autoCopy;
    if (typeof body.sidebarCollapsed === "boolean") update.sidebarCollapsed = body.sidebarCollapsed;
    if (typeof body.defaultTool === "string") update.defaultTool = body.defaultTool;
    if (Array.isArray(body.menuOrder)) update.menuOrder = body.menuOrder;

    const prefs = await UserPreferences.findOneAndUpdate(
      { userEmail },
      { $set: update },
      { upsert: true, new: true }
    );
    return res.status(200).json(prefs);
  }

  return res.status(405).end();
}
