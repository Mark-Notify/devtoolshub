import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import UserData from "../../models/UserData";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSession({ req });
  if (!session) return res.status(401).json({ message: "Unauthorized" });

  const { tool, inputData, outputData } = req.body;

  await connectToDatabase();
  await UserData.create({
    userEmail: session.user?.email,
    tool,
    inputData,
    outputData,
  });

  res.status(200).json({ message: "Data saved" });
}
