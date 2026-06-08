"use client"; // Ensures this code only runs on the client

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useToolHistory } from "../../hooks/useToolHistory";
import SaveSnippetButton from "../SaveSnippetButton";

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

  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-80px)]">
        {/* Input Section */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <label htmlFor="inputData" className="text-sm font-semibold mb-1">
            JWT Token Input
          </label>
          <textarea
            id="inputData"
            className="input-area mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste your JWT Token here..."
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            style={{
              minHeight: "150px",
              resize: "vertical",
            }}
          />

          <label
            htmlFor="secretKey"
            className="text-sm font-semibold mb-1 mt-2"
          >
            Secret Key (signature verification)
          </label>
          <input
            id="secretKey"
            type="text"
            className="input p-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Enter secret key for signature verification..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />

          <button className="btn btn-sm btn-accent mt-2 mb-2" onClick={processData}>
            Process JWT
          </button>

          <div>
            <span className={`text-sm font-semibold ${isVerified ? "text-green-500" : "text-red-500"}`}>
              {isVerified ? "✓ Signature verified!" : "✗ Invalid Signature"}
            </span>
          </div>
        </div>

        {/* Output Section */}
        <div className="w-full lg:w-2/3 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold">
              JWT Parts (Header, Payload, Signature)
            </label>
            <SaveSnippetButton
              toolKey="jwt-decode"
              content={inputData ? JSON.stringify({ header, payload, signature }, null, 2) : ""}
              disabled={!inputData}
            />
          </div>

          <div>
            <h3 className="font-semibold text-sm">Header</h3>
            <pre className="p-3 bg-base-100 rounded-md text-sm">
              {JSON.stringify(header, null, 4)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-sm">Payload</h3>
            <pre className="p-3 bg-base-100 rounded-md text-sm">
              {JSON.stringify(payload, null, 4)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-sm">Signature</h3>
            <pre className="p-3 bg-base-100 rounded-md text-sm">
              {signature || `""`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
