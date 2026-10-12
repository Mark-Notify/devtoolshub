"use client";
import { useState } from "react";
import CryptoJS from "crypto-js";
import ToolPage from "../ui/ToolPage";
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
    <ToolPage slug="hash-generator" title="Hash Generator" description="MD5, SHA-1, SHA-256, SHA-512, SHA3 and RIPEMD-160" width="medium">
      <div className="flex flex-col gap-2">
        <label className="tool-label">Input Text</label>
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
            <div key={key} className="tool-card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">{key}</span>
                <button className="btn btn-xs btn-soft" disabled={!input} onClick={() => copy(hash, key)}>
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
    </ToolPage>
  );
}
