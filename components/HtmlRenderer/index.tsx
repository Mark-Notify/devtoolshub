"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
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
      padding: 2rem 3rem;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    h1 { margin: 0 0 0.5rem; font-size: 2rem; }
    p  { margin: 0; opacity: 0.85; }
  </style>
</head>
<body>
  <div class="card">
    <h1>👋 Hello, World!</h1>
    <p>Start editing to see your changes live.</p>
  </div>
</body>
</html>`;

export default function HtmlRenderer() {
  const [htmlCode, setHtmlCode] = useState<string>(DEFAULT_HTML);
  const [theme, setTheme] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    setTheme(storedTheme || "dark");
  }, []);

  // Update iframe content
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlCode);
        doc.close();
      }
    }
  }, [htmlCode]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = 2;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setLeftWidth((w) => Math.max(w - step, 15));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setLeftWidth((w) => Math.min(w + step, 85));
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(pct, 15), 85));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) setHtmlCode(value);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold">HTML Online Render</h2>
        <div className="flex gap-2">
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
            onClick={() => setLeftWidth(50)}
          >
            Reset Split
          </button>
        </div>
      </div>

      {/* Resizable panels */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden rounded-lg border border-gray-700/30 relative"
        style={{ minHeight: 0 }}
      >
        {/* Editor panel */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="px-3 py-1.5 text-xs font-semibold border-b border-gray-700/30 bg-base-200/50 shrink-0">
            HTML
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="html"
              value={htmlCode}
              theme={theme === "dark" ? "vs-dark" : "vs-light"}
              onChange={handleEditorChange}
              options={{
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                padding: { top: 8 },
              }}
            />
          </div>
        </div>

        {/* Drag handle */}
        <div
          className="w-2 cursor-col-resize flex items-center justify-center shrink-0 hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-x border-gray-700/30 z-10"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          role="separator"
          aria-label="Resize panels"
          tabIndex={0}
        >
          <div className="w-0.5 h-8 bg-gray-500/50 rounded-full" />
        </div>

        {/* Preview panel */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="px-3 py-1.5 text-xs font-semibold border-b border-gray-700/30 bg-base-200/50 shrink-0">
            Preview
          </div>
          <div className="flex-1 min-h-0 bg-white relative">
            <iframe
              ref={iframeRef}
              title="HTML Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
            {/* Overlay during drag to prevent iframe from capturing mouse events */}
            {isDragging && (
              <div className="absolute inset-0" style={{ zIndex: 1 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
