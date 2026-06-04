"use client";
import { useState, useMemo } from "react";
import { toastSuccess, toastError } from "../../lib/swal";

const BASES = [
  { label: "Binary", base: 2, prefix: "0b", placeholder: "e.g. 1010" },
  { label: "Octal", base: 8, prefix: "0o", placeholder: "e.g. 755" },
  { label: "Decimal", base: 10, prefix: "", placeholder: "e.g. 42" },
  { label: "Hexadecimal", base: 16, prefix: "0x", placeholder: "e.g. FF" },
];

export default function NumberBase() {
  const [values, setValues] = useState<Record<number, string>>({ 2: "", 8: "", 10: "", 16: "" });
  const [error, setError] = useState("");

  const updateFrom = (base: number, raw: string) => {
    const v = raw.trim().toUpperCase();
    const next: Record<number, string> = { 2: "", 8: "", 10: "", 16: "" };
    next[base] = v;
    if (!v) { setValues(next); setError(""); return; }
    try {
      const dec = parseInt(v, base);
      if (isNaN(dec)) throw new Error("Invalid");
      BASES.forEach(({ base: b }) => {
        if (b !== base) next[b] = dec.toString(b).toUpperCase();
      });
      setValues(next);
      setError("");
    } catch {
      setValues(next);
      setError(`Invalid ${BASES.find((b) => b.base === base)?.label} number`);
    }
  };

  const copy = (base: number) => {
    const v = values[base];
    if (!v) { toastError("Empty"); return; }
    const bDef = BASES.find((b) => b.base === base)!;
    navigator.clipboard.writeText(v);
    toastSuccess(`${bDef.label} copied!`);
  };

  // Bit visualization for binary
  const binVal = values[2];
  const padded = binVal ? binVal.padStart(Math.ceil(binVal.length / 8) * 8, "0") : "";
  const bytes = padded ? padded.match(/.{1,8}/g) ?? [] : [];

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-4">
      <div className="grid grid-cols-1 gap-3">
        {BASES.map(({ label, base, prefix, placeholder }) => (
          <div key={base} className="bg-base-200 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">{label} (base {base})</span>
              <div className="flex items-center gap-2">
                {prefix && <span className="text-xs opacity-40 font-mono">{prefix}</span>}
                <button className="btn btn-xs btn-ghost" disabled={!values[base]} onClick={() => copy(base)}>Copy</button>
              </div>
            </div>
            <input
              className="input input-bordered font-mono text-sm w-full"
              placeholder={placeholder}
              value={values[base]}
              onChange={(e) => updateFrom(base, e.target.value)}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Bit grid */}
      {bytes.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Bit Visualization</label>
          <div className="flex flex-wrap gap-3">
            {bytes.map((byte, bi) => (
              <div key={bi} className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5">
                  {byte.split("").map((bit, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded text-xs flex items-center justify-center font-mono font-bold ${bit === "1" ? "bg-blue-600 text-white" : "bg-base-300 opacity-40"}`}
                    >{bit}</div>
                  ))}
                </div>
                <span className="text-xs opacity-40">byte {bi}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
