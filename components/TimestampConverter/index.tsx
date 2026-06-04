"use client";
import { useState, useEffect } from "react";
import { toastSuccess } from "../../lib/swal";

const FORMATS = [
  { label: "Local", fn: (d: Date) => d.toLocaleString() },
  { label: "UTC", fn: (d: Date) => d.toUTCString() },
  { label: "ISO 8601", fn: (d: Date) => d.toISOString() },
  { label: "Date only", fn: (d: Date) => d.toLocaleDateString() },
  { label: "Time only", fn: (d: Date) => d.toLocaleTimeString() },
  { label: "Unix (s)", fn: (d: Date) => String(Math.floor(d.getTime() / 1000)) },
  { label: "Unix (ms)", fn: (d: Date) => String(d.getTime()) },
];

export default function TimestampConverter() {
  const [input, setInput] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parse = (value: string) => {
    setInput(value);
    if (!value.trim()) { setDate(null); setError(""); return; }
    const num = Number(value.trim());
    if (!isNaN(num)) {
      // auto-detect seconds vs milliseconds
      const ms = num < 1e12 ? num * 1000 : num;
      const d = new Date(ms);
      if (isNaN(d.getTime())) { setError("Invalid timestamp"); setDate(null); }
      else { setDate(d); setError(""); }
    } else {
      const d = new Date(value.trim());
      if (isNaN(d.getTime())) { setError("Invalid date string"); setDate(null); }
      else { setDate(d); setError(""); }
    }
  };

  const useNow = () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    parse(ts);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(`${label} copied!`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-4">
      {/* Live clock */}
      <div className="bg-base-200 rounded-lg p-3 text-center">
        <div className="text-xs opacity-50 mb-1">Current time</div>
        <div className="font-mono text-lg">{new Date(now).toLocaleString()}</div>
        <div className="text-xs opacity-50 mt-1">Unix: {Math.floor(now / 1000)}</div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Input (Unix timestamp or date string)</label>
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1 font-mono text-sm"
            placeholder="e.g. 1718000000  or  2024-06-15T12:00:00"
            value={input}
            onChange={(e) => parse(e.target.value)}
          />
          <button className="btn btn-sm btn-accent" onClick={useNow}>Now</button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Results */}
      {date && (
        <div className="grid grid-cols-1 gap-2">
          {FORMATS.map(({ label, fn }) => {
            const val = fn(date);
            return (
              <div key={label} className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-blue-400 w-24 shrink-0">{label}</span>
                <span className="font-mono text-xs flex-1 break-all opacity-80">{val}</span>
                <button className="btn btn-xs btn-ghost ml-2" onClick={() => copy(val, label)}>Copy</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
