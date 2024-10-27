// components/QRCodeComponent.tsx
"use client";
import { useEffect, useState } from 'react';

type QRCodeApiResponse = {
  imageUrl?: string;
  error?: string;
};

function QRCodeComponent() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Function to generate QR code
  const generateQRCode = async (text: string) => {
    setLoading(true);
    setError(null); // Reset error state before fetching

    try {
      const response = await fetch('/api/generateQRCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
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

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      generateQRCode(inputValue.trim());
    }
  };

  return (
    <center>
      <div>
        <input 
          type="text" 
          placeholder="Enter text or URL"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress} 
          style={{ padding: '10px', width: '300px', marginBottom: '10px' }} // Basic styling
        />
        {loading && <p>Loading QR Code...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
      </div>
    </center>
  );
}

export default QRCodeComponent;
