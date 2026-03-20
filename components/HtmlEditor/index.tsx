"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { margin: 0; opacity: 0.85; }
  </style>
</head>
<body>
  <div class="card">
    <h1>👋 Hello, World!</h1>
    <p>Start editing to see live changes.</p>
  </div>
</body>
</html>`;

export default function HtmlEditorPage() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Draggable divider logic (mouse) ── */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(15, Math.min(85, pct));
      setSplitPercent(pct);
    };
    const onMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  /* ── Touch support for mobile ── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      let pct = ((touch.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(15, Math.min(85, pct));
      setSplitPercent(pct);
    };
    const onTouchEnd = () => {
      setIsDragging(false);
    };
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging]);

  /* ── Rendered HTML for iframe ── */
  const srcDoc = html;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/30 bg-base-100 shrink-0">
        <h2 className="text-sm font-semibold">HTML Online Render</h2>
        <div className="flex gap-2">
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs hover:bg-gray-500/10 transition-colors"
            onClick={() => setHtml(DEFAULT_HTML)}
          >
            Reset
          </button>
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs hover:bg-gray-500/10 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(html).catch(() => {
                /* clipboard may be unavailable */
              });
            }}
          >
            Copy HTML
          </button>
        </div>
      </div>

      {/* Split pane container */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden relative"
        style={{ cursor: isDragging ? "col-resize" : undefined }}
      >
        {/* Editor pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${splitPercent}%` }}
        >
          <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0">
            HTML Code
          </div>
          <textarea
            className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            placeholder="Type your HTML here..."
          />
        </div>

        {/* Draggable divider */}
        <div
          className="w-2 shrink-0 bg-gray-700/30 hover:bg-blue-500/60 active:bg-blue-500/80 transition-colors flex items-center justify-center"
          style={{
            cursor: "col-resize",
            touchAction: "none",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div className="w-0.5 h-8 bg-gray-400/50 rounded-full" />
        </div>

        {/* Preview pane */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${100 - splitPercent}%` }}
        >
          <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0">
            Preview
          </div>
          <iframe
            className="flex-1 w-full bg-white"
            srcDoc={srcDoc}
            title="HTML Preview"
            sandbox="allow-scripts"
          />
        </div>

        {/* Transparent overlay while dragging to prevent iframe stealing events */}
        {isDragging && (
          <div className="absolute inset-0 z-10" style={{ cursor: "col-resize" }} />
        )}
      </div>
    </div>
  );
}
