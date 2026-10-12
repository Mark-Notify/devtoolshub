"use client"; // Ensures this code only runs on the client

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useToolHistory } from "../../hooks/useToolHistory";
import SaveSnippetButton from "../SaveSnippetButton";
import ToolPage from "../ui/ToolPage";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>(""); // JWT Token
  const [header, setHeader] = useState<string | object>({});
  const [payload, setPayload] = useState<string | object>({});
  const [signature, setSignature] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>(""); // Secret Key
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const { saveHistory } = useToolHistory("jwt-decode");

  // useEffect ที่จะทำงานเมื่อ JWT Token หรือ Secret Key มีการเปลี่ยนแปลง
  useEffect(() => {
    if (inputData || secretKey) {
      processData();
    }
  }, [inputData, secretKey]);

  // ฟังก์ชัน base64UrlEncode สำหรับการ encode
  const base64UrlEncode = (input: string) => {
    return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // ฟังก์ชันสำหรับคำนวณ Signature ด้วย HMACSHA256
  const calculateSignature = (data: string, secretKey: string) => {
    const crypto = require("crypto");
    return base64UrlEncode(
      crypto.createHmac("sha256", secretKey).update(data).digest("base64")
    );
  };

  // ฟังก์ชันสำหรับตรวจสอบและคำนวณ Signature
  const verifyJWTSignature = (token: string, secretKey: string) => {
    const parts = token.split(".");

    if (parts.length !== 3) return false;

    const tokenWithoutSignature = parts[0] + "." + parts[1];
    const computedSignature = calculateSignature(tokenWithoutSignature, secretKey);

    return computedSignature === parts[2];
  };

  // ฟังก์ชันที่ใช้ในการประมวลผล JWT และตรวจสอบ
  const processData = () => {
    const isJWT = (data: string): boolean => {
      const parts = data.split(".");
      return parts.length === 3;
    };

    if (isJWT(inputData)) {
      const parts = inputData.split(".");

      try {
        const decodedHeader = JSON.parse(atob(parts[0]));
        const decodedPayload = JSON.parse(atob(parts[1]));

        setHeader(decodedHeader);
        setPayload(decodedPayload);
        setSignature(parts[2]);

        const outputPreview = JSON.stringify({ header: decodedHeader, payload: decodedPayload }, null, 2);
        saveHistory(inputData, outputPreview);

        if (secretKey) {
          const isValid = verifyJWTSignature(inputData, secretKey);
          setIsVerified(isValid);
          // Swal.fire({
          //   toast: true,
          //   position: "top-end",
          //   icon: isValid ? "success" : "error",
          //   title: isValid ? "JWT Signature is valid!" : "Invalid Signature!",
          //   showConfirmButton: false,
          //   timer: 2000,
          //   background: isValid ? "#4caf50" : "#fd79a8",
          //   color: "#fff",
          // });
        }
      } catch (error) {
        console.error("JWT Decode Error:", error);
        // Swal.fire({
        //   toast: true,
        //   position: "top-end",
        //   icon: "error",
        //   title: "Invalid JWT Token!",
        //   showConfirmButton: false,
        //   timer: 2000,
        //   background: "#fd79a8",
        //   color: "#fff",
        // });
      }
    } else {
      // Swal.fire({
      //   toast: true,
      //   position: "top-end",
      //   icon: "error",
      //   title: "Invalid JWT Format!",
      //   showConfirmButton: false,
      //   timer: 2000,
      //   background: "#fd79a8",
      //   color: "#fff",
      // });
    }
  };

  const parts: { label: string; value: string }[] = [
    { label: "Header", value: JSON.stringify(header, null, 4) },
    { label: "Payload", value: JSON.stringify(payload, null, 4) },
    { label: "Signature", value: signature || `""` },
  ];

  return (
    <ToolPage
      slug="jwt-decode"
      description="Decode JSON Web Tokens and verify HS256 signatures"
      actions={
        <SaveSnippetButton
          toolKey="jwt-decode"
          content={inputData ? JSON.stringify({ header, payload, signature }, null, 2) : ""}
          disabled={!inputData}
        />
      }
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Input Section */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="inputData" className="tool-label">JWT Token</label>
            <textarea
              id="inputData"
              className="input-area font-mono h-48 resize-y break-all"
              placeholder="Paste your JWT Token here..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="secretKey" className="tool-label">Secret Key (signature verification)</label>
            <input
              id="secretKey"
              type="text"
              className="input input-bordered input-sm font-mono"
              placeholder="Enter secret key for signature verification..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
          <button className="btn btn-sm btn-primary" onClick={processData}>
            Process JWT
          </button>
          {secretKey && isVerified !== null && (
            <div className={`text-sm font-semibold ${isVerified ? "text-success" : "text-error"}`}>
              {isVerified ? "✓ Signature verified" : "✗ Invalid signature"}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="w-full lg:w-2/3 flex flex-col gap-3">
          {parts.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="tool-label">{label}</span>
              <pre className="tool-card text-sm font-mono whitespace-pre-wrap break-all m-0">{value}</pre>
            </div>
          ))}
        </div>
      </div>
    </ToolPage>
  );
}
