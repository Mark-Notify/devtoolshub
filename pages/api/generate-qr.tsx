import { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';

interface GenerateQRResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateQRResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { text, errorCorrectionLevel = 'H' } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'กรุณาส่งข้อมูล text เพื่อสร้าง QR Code' });
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel, // ใช้ Error Correction Level ที่รับมา
      margin: 2, // เพิ่มระยะขอบเพื่อให้อ่านง่ายขึ้น
      scale: 10,
    });
    res.status(200).json({ success: true, qrCode: qrCodeDataURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' });
  }
}
