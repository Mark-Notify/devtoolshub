import { useState } from 'react';
import Swal from 'sweetalert2';

export default function Home() {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState('');

  const generateQRCode = async () => {
    try {
      const response = await fetch('./api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, errorCorrectionLevel: 'H' }), // ใช้ระดับแก้ไขข้อผิดพลาดสูง
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: data.error || 'ไม่สามารถสร้าง QR Code ได้',
          cancelButtonColor: '#d33',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถสร้าง QR Code ได้',
        cancelButtonColor: '#d33',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'qrcode.png';
    link.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      generateQRCode();
    }
  };

  return (
    <div className="mx-auto p-4 border bg-base-100 rounded-md shadow-md min-h-screen max-w-7xl">
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 className="text-2xl font-bold mb-4">QR Code Generator</h1>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="กรอกข้อความ"
          className="text-center mt-2 p-3 border border-base-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            padding: '10px',
            width: '300px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
          }}
        />
        <br />
        <button
          className="rounded-md py-2 px-4 border bg-blue-500 text-white hover:bg-blue-600"
          onClick={generateQRCode}
          style={{ padding: '10px 20px', cursor: 'pointer', margin: '5px' }}
        >
          Generate QR Code
        </button>
        {qrCode && (
          <div>
            <h3 className="text-center font-semibold text-lg mb-4">ผลลัพธ์ QR Code</h3>
            <div className="relative flex justify-center items-center gap-2 mb-2">
              {/* QR Code Frame */}
              <div
                style={{
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #ccc',
                  backgroundColor: '#fff',
                }}
              >
                <img
                  src={qrCode}
                  alt="Generated QR Code"
                  style={{
                    height: '250px',
                    width: '250px',
                  }}
                />
              </div>
              {/* Center Icon */}
              {/* <div
                className="absolute"
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <img
                  src="https://www.gother.com/assets/images/logo.svg" // Replace with your icon path
                  alt="Center Icon"
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                  }}
                />
              </div> */}
            </div>
            <button
              className="rounded-md py-2 px-4 bg-green-500 text-white hover:bg-green-400 focus:ring-2 focus:ring-blue-300"
              onClick={downloadQRCode}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                margin: '5px',
              }}
            >
              Download QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
