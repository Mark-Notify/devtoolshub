import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { connectToDatabase } from "../../lib/mongodb";
import SharedMenu from "../../models/SharedMenu";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  // GET /api/share-menu?id=xxx  — public, no auth needed
  if (req.method === "GET") {
    const { id } = req.query;
    if (typeof id !== "string") return res.status(400).json({ message: "id required" });
    const doc = await SharedMenu.findOne({ shareId: id }).select("-ownerEmail -__v");
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(doc);
  }

  // POST /api/share-menu  — create or refresh share link (auth required)
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

    const { menuOrder, pinnedSlugs } = req.body ?? {};
    if (!Array.isArray(menuOrder)) return res.status(400).json({ message: "menuOrder required" });

    const shareId = randomBytes(8).toString("hex"); // 16-char hex token

    // Upsert by ownerEmail — one share link per user (overwrite on re-share)
    const doc = await SharedMenu.findOneAndUpdate(
      { ownerEmail: session.user.email },
      {
        shareId,
        ownerEmail: session.user.email,
        ownerName: session.user.name ?? "",
        menuOrder,
        pinnedSlugs: Array.isArray(pinnedSlugs) ? pinnedSlugs : [],
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return res.status(200).json({ shareId: doc.shareId });
  }

  return res.status(405).end();
}
