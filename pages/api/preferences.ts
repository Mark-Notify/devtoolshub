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
    const body = req.body ?? {};
    const theme = typeof body.theme === "string" ? body.theme : undefined;
    const jsonIndent = typeof body.jsonIndent === "number" ? body.jsonIndent : undefined;
    const autoCopy = typeof body.autoCopy === "boolean" ? body.autoCopy : undefined;
    const sidebarCollapsed = typeof body.sidebarCollapsed === "boolean" ? body.sidebarCollapsed : undefined;
    const defaultTool = typeof body.defaultTool === "string" ? body.defaultTool : undefined;

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (theme !== undefined) update.theme = theme;
    if (jsonIndent !== undefined) update.jsonIndent = jsonIndent;
    if (autoCopy !== undefined) update.autoCopy = autoCopy;
    if (sidebarCollapsed !== undefined) update.sidebarCollapsed = sidebarCollapsed;
    if (defaultTool !== undefined) update.defaultTool = defaultTool;

    const prefs = await UserPreferences.findOneAndUpdate(
      { userEmail },
      { $set: update },
      { upsert: true, new: true }
    );
    return res.status(200).json(prefs);
  }

  return res.status(405).end();
}
