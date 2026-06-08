"use client";
import { useState, useMemo } from "react";
import { diffLines, Change } from "diff";
import { toastSuccess } from "../../lib/swal";

export default function DiffChecker() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diff = useMemo(() => {
    if (!left && !right) return [];
    return diffLines(left, right, { ignoreWhitespace });
  }, [left, right, ignoreWhitespace]);

  const added = diff.filter((c) => c.added).reduce((s, c) => s + (c.count ?? 0), 0);
  const removed = diff.filter((c) => c.removed).reduce((s, c) => s + (c.count ?? 0), 0);
  const identical = !diff.some((c) => c.added || c.removed);

  const copyDiff = () => {
    const text = diff.map((c) => {
      const prefix = c.added ? "+" : c.removed ? "-" : " ";
      return c.value.split("\n").filter((l) => l !== "").map((l) => `${prefix} ${l}`).join("\n");
    }).join("\n");
    navigator.clipboard.writeText(text);
    toastSuccess("Diff copied!");
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
          />
          Ignore whitespace
        </label>
        {(left || right) && (
          <div className="flex items-center gap-3 ml-auto text-xs">
            {identical ? (
              <span className="text-green-400 font-semibold">✓ Identical</span>
            ) : (
              <>
                <span className="text-green-400">+{added} lines</span>
                <span className="text-red-400">-{removed} lines</span>
              </>
            )}
            <button className="btn btn-xs btn-ghost border" onClick={copyDiff}>Copy diff</button>
          </div>
        )}
      </div>

      {/* Input panes */}
      <div className="grid grid-cols-2 gap-2 h-40">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-60">Original</label>
          <textarea
            className="input-area flex-1 resize-none font-mono text-xs"
            placeholder="Paste original text..."
            value={left}
            onChange={(e) => setLeft(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-60">Modified</label>
          <textarea
            className="input-area flex-1 resize-none font-mono text-xs"
            placeholder="Paste modified text..."
            value={right}
            onChange={(e) => setRight(e.target.value)}
          />
        </div>
      </div>

      {/* Diff output */}
      {diff.length > 0 && (
        <div className="flex flex-col gap-1 flex-1 overflow-hidden">
          <label className="text-xs font-semibold opacity-60">Diff</label>
          <div className="flex-1 overflow-auto rounded-lg bg-base-200 font-mono text-xs p-2">
            {diff.map((change: Change, i) => {
              const bg = change.added ? "bg-green-900/40 text-green-300" : change.removed ? "bg-red-900/40 text-red-300" : "opacity-60";
              const prefix = change.added ? "+" : change.removed ? "-" : " ";
              return change.value.split("\n").filter((_, li, arr) => li < arr.length - 1 || change.value.endsWith("\n") || arr[li] !== "").map((line, li) => (
                <div key={`${i}-${li}`} className={`px-2 py-0.5 rounded ${bg}`}>
                  <span className="mr-2 opacity-50">{prefix}</span>{line}
                </div>
              ));
            })}
          </div>
        </div>
      )}
    </div>
  );
}
