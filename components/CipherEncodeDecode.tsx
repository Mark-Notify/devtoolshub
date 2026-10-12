"use client";
import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import ToolPage, { Segmented } from "./ui/ToolPage";
import { toastSuccess, toastError } from "../lib/swal";
import { useToolHistory } from "../hooks/useToolHistory";
import { encodeFront, decodeFront } from "../lib/cipher";

export default function CipherEncodeDecode() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { saveHistory } = useToolHistory("cipher-encode-decode");
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // ขยายความสูงช่องผลลัพธ์ตามความยาวข้อมูล (สูงสุด 70vh แล้วค่อย scroll)
  useEffect(() => {
    const el = outputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, window.innerHeight * 0.7)}px`;
  }, [output]);

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
    return (
      <ToolPage slug="cipher-encode-decode" title="Cipher Encode / Decode">
        <div className="text-center opacity-60 text-sm mt-8">กำลังโหลด...</div>
      </ToolPage>
    );
  }

  if (!session) {
    return (
      <ToolPage slug="cipher-encode-decode" title="Cipher Encode / Decode" description="เข้ารหัสและถอดรหัสข้อความด้วย cipher เฉพาะของระบบ">
        <div className="max-w-sm w-full mx-auto mt-8 bg-base-100 rounded-2xl shadow-lg p-8 text-center border border-base-300">
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
      </ToolPage>
    );
  }

  return (
    <ToolPage
      slug="cipher-encode-decode"
      title="Cipher Encode / Decode"
      description="เข้ารหัสและถอดรหัสข้อความด้วย cipher เฉพาะของระบบ"
      width="narrow"
      actions={
        <Segmented
          value={mode}
          onChange={switchMode}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-1">
        <label className="tool-label">
          {mode === "encode" ? "ข้อความต้นฉบับ" : "ข้อความที่เข้ารหัสแล้ว (Base64)"}
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={mode === "encode" ? "พิมพ์ข้อความที่ต้องการเข้ารหัส..." : "วาง Base64 ที่ต้องการถอดรหัส..."}
          className="input-area h-36 resize-none font-mono text-sm"
          spellCheck={false}
        />
      </div>

      <button className="btn btn-sm btn-primary self-center" onClick={() => processData()}>
        {mode === "encode" ? "🔒 เข้ารหัส" : "🔓 ถอดรหัส"}
      </button>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="tool-label">ผลลัพธ์</label>
          <button className="btn btn-xs btn-soft" onClick={copyOutput}>
            📋 คัดลอกผลลัพธ์
          </button>
        </div>
        <textarea
          ref={outputRef}
          value={output}
          readOnly
          placeholder="ผลลัพธ์จะแสดงที่นี่..."
          className="input-area min-h-[9rem] resize-y font-mono text-sm"
          spellCheck={false}
        />
      </div>
    </ToolPage>
  );
}
