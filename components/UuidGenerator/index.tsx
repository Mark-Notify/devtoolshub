"use client";
import { useState, useEffect } from "react";
import ToolPage from "../ui/ToolPage";
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
  // generated after mount: a random initial value would differ between SSR and hydration
  const [uuids, setUuids] = useState<string[]>([]);
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

  useEffect(() => {
    setUuids([uuidv4()]);
  }, []);

  const copyOne = (id: string) => {
    navigator.clipboard.writeText(format(id));
    toastSuccess("UUID copied!");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.map(format).join("\n"));
    toastSuccess(`${uuids.length} UUIDs copied!`);
  };

  return (
    <ToolPage
      slug="uuid-generator"
      title="UUID Generator"
      description="Generate random v4 UUIDs"
      width="medium"
      actions={<button className="btn btn-sm btn-soft" onClick={copyAll}>Copy All</button>}
    >
      {/* Controls */}
      <div className="tool-card flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="tool-label">Count</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input input-bordered input-sm w-24"
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer h-8">
          <input type="checkbox" className="checkbox checkbox-sm" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer h-8">
          <input type="checkbox" className="checkbox checkbox-sm" checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)} />
          No dashes
        </label>
        <button className="btn btn-primary btn-sm ml-auto" onClick={generate}>Generate</button>
      </div>

      {/* UUID list */}
      <div className="flex flex-col gap-1.5">
        {uuids.map((id, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-base-content/10 bg-base-200/50 px-3 py-2">
            <span className="font-mono text-sm break-all">{format(id)}</span>
            <button className="btn btn-xs btn-soft" onClick={() => copyOne(id)}>Copy</button>
          </div>
        ))}
      </div>
    </ToolPage>
  );
}
