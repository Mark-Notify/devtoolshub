// components/QRCodeComponent.tsx
"use client";
import { useEffect, useState } from 'react';

type QRCodeApiResponse = {
  imageUrl?: string;
  error?: string;
};

function QRCodeComponent() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        const response = await fetch('/api/generateQRCode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'https://example.com',
            download: true,
            logo: 'gother', // Adjust as needed
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data: QRCodeApiResponse = await response.json();
        
        if (data.imageUrl) {
          setQrCodeUrl(data.imageUrl);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to generate QR Code');
        console.error('QR Code generation error:', err);
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, []); // Empty dependency array to run this effect only once when the component mounts

  return (
    <center>
      <div>
        {loading && <p>Loading QR Code...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
      </div>
    </center>
  );
}

export default QRCodeComponent;
