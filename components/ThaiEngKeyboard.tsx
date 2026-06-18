"use client";
import { useState, useEffect, useMemo } from "react";
import { toastSuccess, toastError } from "../lib/swal";
import { useToolHistory } from "../hooks/useToolHistory";

// ─────────────────────────────────────────────────────────────────────────────
// แมปแป้นพิมพ์: ปุ่มจริงบนคีย์บอร์ดหนึ่งปุ่มให้ตัวอักษร EN (US QWERTY) และ
// ตัวอักษรไทย (Kedmanee) คนละตัว เวลาลืมสลับภาษาจึงพิมพ์ออกมาผิด เช่น
// ตั้งใจพิมพ์ "สวัสดี" แต่ลืมเปลี่ยนเป็นไทย เลยได้ "l;ylfu"
// EN_TO_TH = แปลงตัวที่พิมพ์ผิด (อังกฤษ) กลับเป็นไทยที่ตั้งใจ
// ─────────────────────────────────────────────────────────────────────────────
const EN_TO_TH: Record<string, string> = {
  // number row (unshifted)
  "1": "ๅ", "2": "/", "3": "-", "4": "ภ", "5": "ถ",
  "6": "ุ", "7": "ึ", "8": "ค", "9": "ต", "0": "จ",
  "-": "ข", "=": "ช",
  // number row (shifted)
  "!": "+", "@": "๑", "#": "๒", "$": "๓", "%": "๔",
  "^": "ู", "&": "฿", "*": "๕", "(": "๖", ")": "๗",
  "_": "๘", "+": "๙",
  // top letter row (unshifted)
  q: "ๆ", w: "ไ", e: "ำ", r: "พ", t: "ะ", y: "ั", u: "ี", i: "ร", o: "น", p: "ย",
  "[": "บ", "]": "ล", "\\": "ฃ",
  // top letter row (shifted)
  Q: "๐", W: "\"", E: "ฎ", R: "ฑ", T: "ธ", Y: "ํ", U: "๊", I: "ณ", O: "ฯ", P: "ญ",
  "{": "ฐ", "}": ",", "|": "ฅ",
  // home row (unshifted)
  a: "ฟ", s: "ห", d: "ก", f: "ด", g: "เ", h: "้", j: "่", k: "า", l: "ส",
  ";": "ว", "'": "ง",
  // home row (shifted)
  A: "ฤ", S: "ฆ", D: "ฏ", F: "โ", G: "ฌ", H: "็", J: "๋", K: "ษ", L: "ศ",
  ":": "ซ", '"': ".",
  // bottom row (unshifted)
  z: "ผ", x: "ป", c: "แ", v: "อ", b: "ิ", n: "ื", m: "ท",
  ",": "ม", ".": "ใ", "/": "ฝ",
  // bottom row (shifted)
  Z: "(", X: ")", C: "ฉ", V: "ฮ", B: "ฺ", N: "์", M: "?",
  "<": "ฒ", ">": "ฬ", "?": "ฦ",
  // backtick
  "`": "_", "~": "%",
};

// TH_TO_EN = แปลงตัวที่พิมพ์ผิด (ไทย) กลับเป็นอังกฤษที่ตั้งใจ (อินเวอร์สของด้านบน)
const TH_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_TH).map(([en, th]) => [th, en])
);

type Dir = "auto" | "en2th" | "th2en";

const THAI_RE = /[฀-๿]/;

/** ตรวจว่าควรแปลงทิศทางไหน: ถ้ามีอักษรไทยอยู่ → เจ้าของตั้งใจพิมพ์อังกฤษ */
const detectDir = (text: string): "en2th" | "th2en" =>
  THAI_RE.test(text) ? "th2en" : "en2th";

const convert = (text: string, dir: "en2th" | "th2en"): string => {
  const map = dir === "en2th" ? EN_TO_TH : TH_TO_EN;
  return Array.from(text)
    .map((ch) => map[ch] ?? ch)
    .join("");
};

const DIR_LABELS: Record<Dir, string> = {
  auto: "อัตโนมัติ",
  en2th: "EN → ไทย",
  th2en: "ไทย → EN",
};

export default function ThaiEngKeyboard() {
  const [input, setInput] = useState("");
  const [dir, setDir] = useState<Dir>("auto");
  const { saveHistory } = useToolHistory("thai-eng-keyboard");

  const effDir: "en2th" | "th2en" =
    dir === "auto" ? detectDir(input) : dir;

  const output = useMemo(() => convert(input, effDir), [input, effDir]);

  useEffect(() => {
    if (input && output) saveHistory(input, output);
  }, [input, output, saveHistory]);

  // รองรับ ?text= สำหรับแชร์ลิงก์
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get("text");
    if (textParam) setInput(textParam);
  }, []);

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

  const useAsInput = () => {
    if (!output.trim()) return;
    setInput(output);
  };

  const clearAll = () => setInput("");

  const loadExample = () => {
    setDir("auto");
    setInput("l;ylfu");
  };

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">แก้ภาษาแป้นพิมพ์ ไทย ⇄ EN</h1>
          <p className="text-gray-400 text-sm">
            ลืมเปลี่ยนภาษาก่อนพิมพ์? วางข้อความที่เพี้ยน เช่น{" "}
            <code className="px-1.5 py-0.5 rounded bg-base-300 font-mono">l;ylfu</code>{" "}
            แล้วระบบจะแปลงกลับเป็น <span className="font-semibold">สวัสดี</span> ให้ทันที
          </p>
        </div>

        {/* ตัวเลือกทิศทาง */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="inline-flex rounded-lg border border-gray-700/50 overflow-hidden text-xs">
            {(["auto", "en2th", "th2en"] as Dir[]).map((d) => (
              <button
                key={d}
                onClick={() => setDir(d)}
                className={`px-3 py-1.5 transition-colors ${
                  dir === d
                    ? "bg-accent text-accent-content font-medium"
                    : "hover:bg-white/5 opacity-70"
                }`}
              >
                {DIR_LABELS[d]}
              </button>
            ))}
          </div>
          {dir === "auto" && input && (
            <span className="text-xs opacity-50">
              ตรวจพบ: {effDir === "en2th" ? "EN → ไทย" : "ไทย → EN"}
            </span>
          )}
        </div>

        {/* Input */}
        <label className="block text-xs font-medium opacity-60 mb-1">
          ข้อความที่พิมพ์ผิด
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="วางข้อความที่ลืมเปลี่ยนภาษาที่นี่..."
          className="w-full h-36 p-3 mb-4 rounded-xl bg-base-200 border border-gray-700/50 focus:ring-2 focus:ring-accent outline-none resize-none font-mono text-sm"
          spellCheck={false}
        />

        {/* Output */}
        <label className="block text-xs font-medium opacity-60 mb-1">
          ผลลัพธ์ที่แก้แล้ว
        </label>
        <textarea
          value={output}
          readOnly
          placeholder="ผลลัพธ์จะแสดงที่นี่..."
          className="w-full h-36 p-3 mb-4 rounded-xl bg-base-300 border border-gray-700/50 resize-none font-mono text-sm"
          spellCheck={false}
        />

        {/* ปุ่มต่าง ๆ */}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-sm btn-accent" onClick={copyOutput}>
            📋 คัดลอกผลลัพธ์
          </button>
          <button className="btn btn-sm btn-ghost" onClick={useAsInput}>
            ↩️ ใช้ผลลัพธ์เป็นข้อความตั้งต้น
          </button>
          <button className="btn btn-sm btn-ghost" onClick={loadExample}>
            ✨ ตัวอย่าง
          </button>
          <button className="btn btn-sm btn-ghost" onClick={clearAll}>
            🧹 ล้าง
          </button>
        </div>
      </div>
    </div>
  );
}
