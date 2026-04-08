import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import SavedSnippet from "../../models/SavedSnippet";
import type { NextApiRequest, NextApiResponse } from "next";

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
    const { toolKey, title, content, isFavorite } = req.body;
    if (!toolKey || !title || !content) {
      return res.status(400).json({ message: "toolKey, title, and content are required" });
    }
    const snippet = await SavedSnippet.create({
      userEmail,
      toolKey,
      title,
      content,
      isFavorite: isFavorite ?? false,
    });
    return res.status(201).json(snippet);
  }

  if (req.method === "PUT") {
    const { id, title, content, isFavorite } = req.body;
    if (!id) return res.status(400).json({ message: "id required" });
    const snippet = await SavedSnippet.findOneAndUpdate(
      { _id: id, userEmail },
      { title, content, isFavorite },
      { new: true }
    );
    if (!snippet) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(snippet);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id required" });
    await SavedSnippet.deleteOne({ _id: id, userEmail });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
