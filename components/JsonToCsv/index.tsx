"use client";
import { useState, useMemo } from "react";
import { toastSuccess, toastError } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";

function jsonToCsv(data: unknown[]): string {
  if (!data.length) return "";
  const keys = Array.from(new Set(data.flatMap((row) => Object.keys(row as object))));
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = data.map((row) => keys.map((k) => escape((row as Record<string, unknown>)[k])).join(","));
  return [keys.join(","), ...rows].join("\n");
}

export default function JsonToCsv() {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const { saveHistory } = useToolHistory("json-to-csv");

  const { csv, error, rows, cols } = useMemo(() => {
    if (!input.trim()) return { csv: "", error: "", rows: 0, cols: 0 };
    try {
      const parsed = JSON.parse(input);
      const arr: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      const result = jsonToCsv(arr).replace(/,/g, delimiter === "\t" ? "\t" : delimiter);
      const lines = result.split("\n");
      return { csv: result, error: "", rows: lines.length - 1, cols: lines[0]?.split(delimiter).length ?? 0 };
    } catch (e) {
      return { csv: "", error: (e as Error).message, rows: 0, cols: 0 };
    }
  }, [input, delimiter]);

  const copy = () => {
    if (!csv) { toastError("Output is empty"); return; }
    navigator.clipboard.writeText(csv);
    toastSuccess("CSV copied!");
    saveHistory(input, csv);
  };

  const download = () => {
    if (!csv) { toastError("Output is empty"); return; }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess("Downloaded!");
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm">
          <span className="opacity-60">Delimiter:</span>
          <select className="select select-bordered select-sm" value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
            <option value=",">, (comma)</option>
            <option value=";">; (semicolon)</option>
            <option value={"\t"}>⇥ (tab)</option>
            <option value="|">| (pipe)</option>
          </select>
        </div>
        {csv && (
          <span className="text-xs opacity-60">{rows} rows × {cols} cols</span>
        )}
        <div className="flex gap-2 ml-auto">
          <button className="btn btn-sm btn-ghost border" onClick={copy}>Copy</button>
          <button className="btn btn-sm btn-accent" onClick={download}>Download .csv</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden">
        <div className="flex flex-col gap-1 overflow-hidden">
          <label className="text-xs font-semibold opacity-60">JSON Input (array or object)</label>
          <textarea
            className="input-area flex-1 resize-none font-mono text-xs"
            placeholder={'[\n  {"name": "Alice", "age": 30},\n  {"name": "Bob", "age": 25}\n]'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <label className="text-xs font-semibold opacity-60">CSV Output</label>
          <textarea
            className="input-area flex-1 resize-none font-mono text-xs"
            readOnly
            value={csv}
          />
        </div>
      </div>
    </div>
  );
}
