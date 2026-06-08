"use client";
import { useState, useMemo } from "react";
import { toastSuccess, toastError } from "../../lib/swal";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testStr, setTestStr] = useState("");

  const { regex, regexError } = useMemo(() => {
    if (!pattern) return { regex: null, regexError: "" };
    try {
      return { regex: new RegExp(pattern, flags), regexError: "" };
    } catch (e) {
      return { regex: null, regexError: (e as Error).message };
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!regex || !testStr) return [];
    const results: { match: string; index: number; groups: string[] }[] = [];
    let m: RegExpExecArray | null;
    const r = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    while ((m = r.exec(testStr)) !== null) {
      results.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
      });
      if (!flags.includes("g")) break;
    }
    return results;
  }, [regex, testStr, pattern, flags]);

  const highlightedHtml = useMemo(() => {
    if (!regex || !testStr || matches.length === 0) return testStr;
    let result = "";
    let last = 0;
    for (const m of matches) {
      result += escHtml(testStr.slice(last, m.index));
      result += `<mark class="bg-yellow-400/50 text-yellow-200 rounded px-0.5">${escHtml(m.match)}</mark>`;
      last = m.index + m.match.length;
    }
    result += escHtml(testStr.slice(last));
    return result;
  }, [matches, testStr]);

  function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const toggleFlag = (f: string) => {
    setFlags((prev) => prev.includes(f) ? prev.replace(f, "") : prev + f);
  };

  const copyPattern = () => {
    if (!pattern) { toastError("Pattern is empty"); return; }
    navigator.clipboard.writeText(`/${pattern}/${flags}`);
    toastSuccess("Pattern copied!");
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-4">
      {/* Pattern */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Regular Expression</label>
        <div className="flex gap-2 items-center">
          <span className="opacity-40 font-mono">/</span>
          <input
            className="input input-bordered flex-1 font-mono text-sm"
            placeholder="pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
          <span className="opacity-40 font-mono">/</span>
          <input
            className="input input-bordered w-20 font-mono text-sm"
            placeholder="flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            maxLength={6}
          />
          <button className="btn btn-sm btn-ghost border" onClick={copyPattern}>Copy</button>
        </div>
        {regexError && <p className="text-red-400 text-xs">{regexError}</p>}

        {/* Flag toggles */}
        <div className="flex gap-2 flex-wrap text-xs">
          {["g", "i", "m", "s"].map((f) => (
            <button
              key={f}
              onClick={() => toggleFlag(f)}
              className={`px-2 py-1 rounded border font-mono ${flags.includes(f) ? "bg-blue-600 border-blue-500 text-white" : "border-gray-600 opacity-60"}`}
            >
              {f} <span className="opacity-60">({f === "g" ? "global" : f === "i" ? "insensitive" : f === "m" ? "multiline" : "dotAll"})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Test string */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Test String</label>
        <textarea
          className="input-area resize-none h-32 font-mono text-sm"
          placeholder="Enter test string..."
          value={testStr}
          onChange={(e) => setTestStr(e.target.value)}
        />
      </div>

      {/* Highlighted */}
      {testStr && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold">Matches</label>
            <span className={`text-xs px-2 py-0.5 rounded ${matches.length > 0 ? "bg-green-700/40 text-green-300" : "bg-gray-700/40"}`}>
              {matches.length} match{matches.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div
            className="bg-base-200 rounded-lg p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlightedHtml || testStr }}
          />
        </div>
      )}

      {/* Match list */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Match Details</label>
          <div className="flex flex-col gap-1 max-h-48 overflow-auto">
            {matches.map((m, i) => (
              <div key={i} className="bg-base-200 rounded px-3 py-1.5 flex gap-3 text-xs font-mono">
                <span className="opacity-40">#{i + 1}</span>
                <span className="text-yellow-300">&quot;{m.match}&quot;</span>
                <span className="opacity-40">@{m.index}</span>
                {m.groups.length > 0 && (
                  <span className="opacity-60">groups: [{m.groups.map((g) => JSON.stringify(g ?? "")).join(", ")}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
