"use client";
import { useState, useCallback } from "react";
import { toastSuccess } from "../../lib/swal";

const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function generate(len: number, opts: Record<string, boolean>): string {
  let pool = "";
  if (opts.upper) pool += CHARS.upper;
  if (opts.lower) pool += CHARS.lower;
  if (opts.numbers) pool += CHARS.numbers;
  if (opts.symbols) pool += CHARS.symbols;
  if (!pool) return "";

  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((n) => pool[n % pool.length]).join("");
}

function strength(pwd: string): { label: string; color: string; pct: number } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", pct: 25 };
  if (score <= 4) return { label: "Fair", color: "bg-yellow-500", pct: 50 };
  if (score <= 5) return { label: "Good", color: "bg-blue-500", pct: 75 };
  return { label: "Strong", color: "bg-green-500", pct: 100 };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: false });
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([generate(16, { upper: true, lower: true, numbers: true, symbols: false })]);

  const gen = useCallback(() => {
    setPasswords(Array.from({ length: Math.min(count, 50) }, () => generate(length, opts)));
  }, [length, opts, count]);

  const toggle = (key: keyof typeof opts) => {
    setOpts((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev; // keep at least one
      return next;
    });
  };

  const copy = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    toastSuccess("Password copied!");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(passwords.join("\n"));
    toastSuccess(`${passwords.length} passwords copied!`);
  };

  const pw0 = passwords[0] ?? "";
  const str = pw0 ? strength(pw0) : null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-4">
      {/* Options */}
      <div className="bg-base-200 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Length: {length}</span>
          </div>
          <input
            type="range" min={4} max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(opts) as (keyof typeof opts)[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" checked={opts[key]} onChange={() => toggle(key)} />
              {key === "upper" ? "A–Z" : key === "lower" ? "a–z" : key === "numbers" ? "0–9" : "!@#…"}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-60">Generate:</span>
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="input input-bordered input-sm w-16" />
          <span className="opacity-60">passwords</span>
        </div>

        <button className="btn btn-primary btn-sm" onClick={gen}>Generate</button>
      </div>

      {/* Strength bar */}
      {str && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="opacity-60">Strength</span>
            <span className={str.pct >= 75 ? "text-green-400" : str.pct >= 50 ? "text-yellow-400" : "text-red-400"}>{str.label}</span>
          </div>
          <div className="h-1.5 bg-base-300 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${str.color}`} style={{ width: `${str.pct}%` }} />
          </div>
        </div>
      )}

      {/* Password list */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">Passwords</label>
        {passwords.length > 1 && (
          <button className="btn btn-xs btn-ghost border" onClick={copyAll}>Copy All</button>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-1 overflow-auto">
        {passwords.map((pwd, i) => (
          <div key={i} className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 gap-2">
            <span className="font-mono text-sm break-all flex-1">{pwd}</span>
            <button className="btn btn-xs btn-ghost shrink-0" onClick={() => copy(pwd)}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
