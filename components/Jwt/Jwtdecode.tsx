"use client"; // Ensures this code only runs on the client

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { log } from "util";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>(""); // JWT Token
  const [header, setHeader] = useState<string | object>({});
  const [payload, setPayload] = useState<string | object>({});
  const [signature, setSignature] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>(""); // Secret Key
  const [isVerified, setIsVerified] = useState<boolean | null>(null); // State สำหรับผลการตรวจสอบ
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode

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

  // ฟังก์ชันสำหรับ Full Screen Toggle
  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    localStorage.setItem("isFullScreen", newFullScreenState.toString());
  };

  return (
    <div
      className={`min-h-fit mx-auto p-4 border bg-base-100 rounded-md shadow-md ${isFullScreen ? "min-w-screen" : "max-w-7xl"
        }`}
    >
      <div className="flex flex-grow flex-col lg:flex-row gap-6">
        {/* Input Section */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <div className="flex mt-2 gap-2 items-center justify-between">
            <label htmlFor="inputData" className="text-lg font-semibold mb-2">
              JWT Token Input
            </label>
            {/* <button
              className="rounded-md py-2 px-4 border bg-base-100"
              onClick={toggleFullScreen}
            >
              {isFullScreen ? (
                <ArrowsPointingInIcon className="w-6 h-6" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6" />
              )}
            </button> */}
          </div>
          <textarea
            id="inputData"
            className="input-area mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste your JWT Token here..."
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            style={{
              minHeight: "200px",
              resize: "vertical",
            }}
          />

          {/* Secret Key Section */}
          <label
            htmlFor="secretKey"
            className="text-lg font-semibold mb-2 mt-4"
          >
            Secret Key (signature verification)
          </label>
          <input
            id="secretKey"
            type="text"
            className="input p-3 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter secret key for signature verification..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />

          {/* Process JWT Button */}
          <button className="btn btn-accent mt-2 mb-2" onClick={processData}>
            Process JWT
          </button>

          {/* Verification Result */}
          <div>
            <h1 className={`text-2xl ${isVerified ? "text-green-500" : "text-red-500"}`}>
              {isVerified ? "Signature verified!" : "Invalid Signature!"}
            </h1>
          </div>
        </div>

        {/* Output Section */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <label htmlFor="outputData" className="text-lg font-semibold mb-2">
            JWT Parts (Header, Payload, Signature)
          </label>

          {/* Header Section */}
          <div>
            <h3 className="font-semibold text-lg">Header</h3>
            <pre className="p-3 bg-base-100 rounded-md">
              {JSON.stringify(header, null, 4)}
            </pre>
          </div>

          {/* Payload Section */}
          <div>
            <h3 className="font-semibold text-lg">Payload</h3>
            <pre className="p-3 bg-base-100 rounded-md">
              {JSON.stringify(payload, null, 4)}
            </pre>
          </div>

          {/* Signature Section */}
          <div>
            <h3 className="font-semibold text-lg">Signature</h3>
            <pre className="p-3 bg-base-100 rounded-md">
              {signature || `""`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
