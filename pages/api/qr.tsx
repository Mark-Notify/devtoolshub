import type { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";

// Preset สีพื้นฐาน
const styles: Record<string, { dark: string; light: string }> = {
  mono:  { dark: "#000000", light: "#FFFFFF" },
  neo:   { dark: "#111827", light: "#FFFFFF" },
  glass: { dark: "#74b9ff", light: "#FFFFFF" },
  candy: { dark: "#F472B6", light: "#FFFFFF" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text = "https://www.devtoolshub.org", size = "400", type = "png", style = "mono" } = req.query;

  try {
    const chosen = styles[(style as string).toLowerCase()] || styles["mono"];

    const buffer = await QRCode.toBuffer(text as string, {
      width: parseInt(size as string, 10),
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: chosen.dark,
        light: chosen.light,
      },
    });

    // รองรับเฉพาะ PNG ตอนนี้
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err: any) {
    console.error("QR API error:", err);
    res.status(500).json({ error: err.message });
  }
}
