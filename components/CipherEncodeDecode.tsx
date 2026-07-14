"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { toastSuccess, toastError } from "../lib/swal";
import { useToolHistory } from "../hooks/useToolHistory";
import { encodeFront, decodeFront } from "../lib/cipher";

export default function CipherEncodeDecode() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { saveHistory } = useToolHistory("cipher-encode-decode");

  const runCipher = (text: string, currentMode: "encode" | "decode") => {
    if (currentMode === "encode") {
      const result = encodeFront(text);
      setOutput(result);
      saveHistory(text, result);
    } else {
      const result = decodeFront(text);
      if (result === false) {
        setOutput("Error: ข้อมูลไม่ถูกต้อง ไม่สามารถถอดรหัสได้");
        return;
      }
      const decoded = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      setOutput(decoded);
      saveHistory(text, decoded);
    }
  };

  const processData = (newMode?: "encode" | "decode") => {
    const currentMode = newMode || mode;
    if (!input.trim()) {
      toastError("กรุณากรอกข้อความก่อน");
      return;
    }
    runCipher(input, currentMode);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!value.trim()) {
      setOutput("");
      return;
    }
    runCipher(value, mode);
  };

  const switchMode = (newMode: "encode" | "decode") => {
    setMode(newMode);
    setInput("");
    setOutput("");
  };

  const copyOutput = () => {
    if (!output.trim()) {
      toastError("ไม่มีผลลัพธ์ให้คัดลอก");
      return;
    }
    navigator.clipboard
      .writeText(output)
      .then(() => toastSuccess("คัดลอกผลลัพธ์แล้ว"))
      .catch(() => toastError("คัดลอกไม่สำเร็จ"));
  };

  if (status === "loading") {
    return <div className="h-full flex items-center justify-center opacity-60 text-sm">กำลังโหลด...</div>;
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-base-100 rounded-2xl shadow-lg p-8 text-center border border-base-300">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">ต้องเข้าสู่ระบบก่อนใช้งาน</h2>
          <p className="text-sm opacity-60 mb-6">
            เครื่องมือนี้จำกัดให้ใช้ได้เฉพาะผู้ที่เข้าสู่ระบบแล้วเท่านั้น
          </p>
          <button className="btn btn-primary w-full" onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Cipher Encode / Decode</h1>
          <p className="text-gray-400 text-sm">เข้ารหัสและถอดรหัสข้อความด้วย cipher เฉพาะของระบบ</p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "encode" ? "bg-accent text-accent-content" : "border border-gray-700/50 opacity-70 hover:opacity-100"
            }`}
            onClick={() => switchMode("encode")}
          >
            Encode
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "decode" ? "bg-accent text-accent-content" : "border border-gray-700/50 opacity-70 hover:opacity-100"
            }`}
            onClick={() => switchMode("decode")}
          >
            Decode
          </button>
        </div>

        <label className="block text-xs font-medium opacity-60 mb-1">
          {mode === "encode" ? "ข้อความต้นฉบับ" : "ข้อความที่เข้ารหัสแล้ว (Base64)"}
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={mode === "encode" ? "พิมพ์ข้อความที่ต้องการเข้ารหัส..." : "วาง Base64 ที่ต้องการถอดรหัส..."}
          className="w-full h-36 p-3 mb-4 rounded-xl bg-base-200 border border-gray-700/50 focus:ring-2 focus:ring-accent outline-none resize-none font-mono text-sm"
          spellCheck={false}
        />

        <div className="flex justify-center mb-4">
          <button className="btn btn-sm btn-accent" onClick={() => processData()}>
            {mode === "encode" ? "🔒 เข้ารหัส" : "🔓 ถอดรหัส"}
          </button>
        </div>

        <label className="block text-xs font-medium opacity-60 mb-1">ผลลัพธ์</label>
        <textarea
          value={output}
          readOnly
          placeholder="ผลลัพธ์จะแสดงที่นี่..."
          className="w-full h-36 min-h-[9rem] p-3 mb-4 rounded-xl bg-base-300 border border-gray-700/50 resize-y font-mono text-sm"
          spellCheck={false}
        />

        <div className="flex justify-center">
          <button className="btn btn-sm btn-ghost" onClick={copyOutput}>
            📋 คัดลอกผลลัพธ์
          </button>
        </div>
      </div>
    </div>
  );
}
