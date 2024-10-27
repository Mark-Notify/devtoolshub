// pages/api/generateQRCode.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type QRCodeRequestBody = {
  text: string;
  download?: boolean;
  type?: 'svg' | 'png' | 'jpeg';
  logo?: 'kbank' | 'gother';
};

type QRCodeResponseData = {
  imageUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QRCodeResponseData>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text, download = false, type = 'svg', logo = 'kbank' } = req.body as QRCodeRequestBody;

  const img_logo =
    logo === 'gother'
      ? 'https://d3p9pa0orw8xnp.cloudfront.net/images/gother/logo/logo-qr-round.png'
      : 'https://d3p9pa0orw8xnp.cloudfront.net/images/gother/kpoint-klub/kpoint_klub_logo.jpg';

  const data = {
    data: text,
    config: {
      body: 'circle',
      logo: img_logo,
    },
    size: 150,
    download,
    file: type,
  };

  try {
    const response = await fetch('https://api.qrcode-monkey.com/qr/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    const result = await response.json();

    if (download) {
      const imageUrl = `https:${result.imageUrl}`;
      res.status(200).json({ imageUrl });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
