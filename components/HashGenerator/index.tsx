"use client";
import { useState } from "react";
import CryptoJS from "crypto-js";
import { toastSuccess, toastError } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";

const ALGORITHMS = [
  { key: "MD5", fn: (t: string) => CryptoJS.MD5(t).toString() },
  { key: "SHA1", fn: (t: string) => CryptoJS.SHA1(t).toString() },
  { key: "SHA256", fn: (t: string) => CryptoJS.SHA256(t).toString() },
  { key: "SHA512", fn: (t: string) => CryptoJS.SHA512(t).toString() },
  { key: "SHA3-256", fn: (t: string) => CryptoJS.SHA3(t, { outputLength: 256 }).toString() },
  { key: "RIPEMD160", fn: (t: string) => CryptoJS.RIPEMD160(t).toString() },
];

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const { saveHistory } = useToolHistory("hash-generator");

  const getHash = (fn: (t: string) => string) => {
    const h = fn(input);
    return uppercase ? h.toUpperCase() : h;
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(`${label} copied!`);
    saveHistory(input, text);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Input Text</label>
        <textarea
          className="input-area resize-none h-28 font-mono text-sm"
          placeholder="Enter text to hash..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input type="checkbox" className="checkbox checkbox-sm" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase output
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ALGORITHMS.map(({ key, fn }) => {
          const hash = input ? getHash(fn) : "";
          return (
            <div key={key} className="flex flex-col gap-1 bg-base-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">{key}</span>
                <button
                  className="btn btn-xs btn-ghost"
                  disabled={!input}
                  onClick={() => copy(hash, key)}
                >
                  Copy
                </button>
              </div>
              <span className="font-mono text-xs break-all opacity-80 min-h-[1.5em]">
                {hash || <span className="opacity-30">—</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
