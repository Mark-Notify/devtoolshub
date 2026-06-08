"use client";
import { useState } from "react";
import { toastSuccess } from "../../lib/swal";

function uuidv4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([uuidv4()]);
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);

  const format = (id: string) => {
    let s = id;
    if (noDashes) s = s.replace(/-/g, "");
    if (uppercase) s = s.toUpperCase();
    return s;
  };

  const generate = () => {
    setUuids(Array.from({ length: Math.min(count, 100) }, () => uuidv4()));
  };

  const copyOne = (id: string) => {
    navigator.clipboard.writeText(format(id));
    toastSuccess("UUID copied!");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.map(format).join("\n"));
    toastSuccess(`${uuids.length} UUIDs copied!`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-60">Count</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input input-bordered w-24 text-sm"
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer pb-1">
          <input type="checkbox" className="checkbox checkbox-sm" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer pb-1">
          <input type="checkbox" className="checkbox checkbox-sm" checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)} />
          No dashes
        </label>
        <button className="btn btn-primary btn-sm" onClick={generate}>Generate</button>
        <button className="btn btn-ghost border btn-sm ml-auto" onClick={copyAll}>Copy All</button>
      </div>

      {/* UUID list */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-auto">
        {uuids.map((id, i) => (
          <div key={i} className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
            <span className="font-mono text-sm">{format(id)}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => copyOne(id)}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
