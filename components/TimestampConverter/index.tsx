"use client";
import { useState, useEffect } from "react";
import ToolPage from "../ui/ToolPage";
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
  // null until mounted: server and client clocks/timezones differ, which breaks hydration
  const [now, setNow] = useState<number | null>(null);

  // Live clock
  useEffect(() => {
    setNow(Date.now());
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
    <ToolPage slug="timestamp-converter" title="Timestamp Converter" description="Convert Unix timestamps and dates" width="medium">
      {/* Live clock */}
      <div className="tool-card text-center">
        <div className="text-xs opacity-50 mb-1">Current time</div>
        <div className="font-mono text-lg">{now ? new Date(now).toLocaleString() : "—"}</div>
        <div className="text-xs opacity-50 mt-1">Unix: {now ? Math.floor(now / 1000) : "—"}</div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="tool-label">Input (Unix timestamp or date string)</label>
        <div className="flex gap-2">
          <input
            className="input input-bordered input-sm flex-1 font-mono"
            placeholder="e.g. 1718000000  or  2024-06-15T12:00:00"
            value={input}
            onChange={(e) => parse(e.target.value)}
          />
          <button className="btn btn-sm btn-primary" onClick={useNow}>Now</button>
        </div>
        {error && <p className="text-error text-xs">{error}</p>}
      </div>

      {/* Results */}
      {date && (
        <div className="grid grid-cols-1 gap-2">
          {FORMATS.map(({ label, fn }) => {
            const val = fn(date);
            return (
              <div key={label} className="flex items-center justify-between rounded-lg border border-base-content/10 bg-base-200/50 px-3 py-2">
                <span className="text-xs font-bold text-primary w-24 shrink-0">{label}</span>
                <span className="font-mono text-xs flex-1 break-all opacity-80">{val}</span>
                <button className="btn btn-xs btn-soft ml-2" onClick={() => copy(val, label)}>Copy</button>
              </div>
            );
          })}
        </div>
      )}
    </ToolPage>
  );
}
