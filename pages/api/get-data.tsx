import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../lib/mongodb";
import UserData from "../../models/UserData";

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
  const data = await UserData.find({ userEmail: session.user.email }).sort({ createdAt: -1 });

  res.status(200).json(data);
}
