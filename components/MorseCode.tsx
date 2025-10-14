"use client";
import { useState } from "react";
import Swal from "sweetalert2";

const morseMap: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----."
};

export default function MorseDecoder() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("decode");

  const process = () => {
    if (!text.trim()) {
      Swal.fire("Error", "กรุณากรอกข้อความ", "warning");
      return;
    }

    if (mode === "encode") {
      const encoded = text
        .toUpperCase()
        .split("")
        .map(ch => morseMap[ch] || ch)
        .join(" ");
      setText(encoded);
    } else {
      const reverseMap = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));
      const decoded = text
        .split(" ")
        .map(code => reverseMap[code] || code)
        .join("");
      setText(decoded);
    }
  };

  return (
    <div className="p-6 text-center max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Morse Code {mode === "encode" ? "Encoder" : "Decoder"}
      </h1>

      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={() => setMode(mode === "encode" ? "decode" : "encode")}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          🔄 สลับโหมด ({mode === "encode" ? "Decode" : "Encode"})
        </button>
        <button
          onClick={process}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
        >
          ⚙️ แปลง
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "encode" ? "พิมพ์ข้อความ เช่น HELLO" : "พิมพ์รหัสมอร์ส เช่น .... . .-.. .-.. ---"}
        className="w-full h-64 p-4 rounded-xl bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
      />

      <p className="mt-3 text-sm text-gray-400">
        รองรับตัวอักษร A-Z และตัวเลข 0-9
      </p>
    </div>
  );
}
