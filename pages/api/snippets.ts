import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import SavedSnippet from "../../models/SavedSnippet";
import type { NextApiRequest, NextApiResponse } from "next";

function toStr(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await connectToDatabase();
  const userEmail = session.user.email;

  if (req.method === "GET") {
    const snippets = await SavedSnippet.find({ userEmail }).sort({ createdAt: -1 });
    return res.status(200).json(snippets);
  }

  if (req.method === "POST") {
    const toolKey = toStr(req.body?.toolKey);
    const title = toStr(req.body?.title);
    const content = toStr(req.body?.content);
    const isFavorite = typeof req.body?.isFavorite === "boolean" ? req.body.isFavorite : false;
    if (!toolKey || !title || !content) {
      return res.status(400).json({ message: "toolKey, title, and content are required" });
    }
    const snippet = await SavedSnippet.create({ userEmail, toolKey, title, content, isFavorite });
    return res.status(201).json(snippet);
  }

  if (req.method === "PUT") {
    const id = toStr(req.body?.id);
    if (!id) return res.status(400).json({ message: "id required" });

    // Build update with only provided fields to avoid clearing existing data
    const update: Record<string, unknown> = {};
    if (typeof req.body?.title === "string") update.title = req.body.title;
    if (typeof req.body?.content === "string") update.content = req.body.content;
    if (typeof req.body?.isFavorite === "boolean") update.isFavorite = req.body.isFavorite;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const snippet = await SavedSnippet.findOneAndUpdate(
      { _id: id, userEmail },
      { $set: update },
      { new: true }
    );
    if (!snippet) return res.status(404).json({ message: "Snippet not found or access denied" });
    return res.status(200).json(snippet);
  }

  if (req.method === "DELETE") {
    const id = toStr(req.body?.id);
    if (!id) return res.status(400).json({ message: "id required" });
    await SavedSnippet.deleteOne({ _id: id, userEmail });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
