"use client";
import { useState, useMemo } from "react";
import { diffLines, Change } from "diff";
import ToolPage from "../ui/ToolPage";
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
    <ToolPage
      slug="diff-checker"
      description="Compare two texts line by line"
      variant="fill"
      actions={
        <>
          {(left || right) && (
            <span className="text-xs">
              {identical ? (
                <span className="text-success font-semibold">✓ Identical</span>
              ) : (
                <>
                  <span className="text-success mr-2">+{added} lines</span>
                  <span className="text-error">-{removed} lines</span>
                </>
              )}
            </span>
          )}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore whitespace
          </label>
          <button className="btn btn-sm btn-soft" onClick={copyDiff} disabled={!(left || right)}>Copy diff</button>
        </>
      }
    >
      <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
        {/* Input panes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-48 shrink-0">
          <div className="flex flex-col gap-1 min-h-0">
            <label className="tool-label">Original</label>
            <textarea
              className="input-area flex-1 resize-none font-mono text-xs"
              placeholder="Paste original text..."
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 min-h-0">
            <label className="tool-label">Modified</label>
            <textarea
              className="input-area flex-1 resize-none font-mono text-xs"
              placeholder="Paste modified text..."
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </div>
        </div>

        {/* Diff output */}
        <div className="flex flex-col gap-1 flex-1 min-h-0">
          <label className="tool-label">Diff</label>
          <div className="flex-1 overflow-auto rounded-lg border border-base-content/10 bg-base-200/50 font-mono text-xs p-2">
            {diff.length === 0 && <div className="opacity-40 p-2">Paste text on both sides to see the differences</div>}
            {diff.map((change: Change, i) => {
              const bg = change.added ? "bg-success/15 text-success" : change.removed ? "bg-error/15 text-error" : "opacity-60";
              const prefix = change.added ? "+" : change.removed ? "-" : " ";
              return change.value.split("\n").filter((_, li, arr) => li < arr.length - 1 || change.value.endsWith("\n") || arr[li] !== "").map((line, li) => (
                <div key={`${i}-${li}`} className={`px-2 py-0.5 rounded whitespace-pre-wrap break-all ${bg}`}>
                  <span className="mr-2 opacity-50">{prefix}</span>{line}
                </div>
              ));
            })}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
