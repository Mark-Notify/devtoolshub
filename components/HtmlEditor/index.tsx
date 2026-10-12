"use client";

import { useState } from "react";
import SplitPane from "../SplitPane";
import ToolPage, { Panel } from "../ui/ToolPage";
import { toastSuccess, toastError } from "../../lib/swal";

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

  const copyHtml = () => {
    navigator.clipboard
      .writeText(html)
      .then(() => toastSuccess("HTML copied!"))
      .catch(() => toastError("Failed to copy"));
  };

  return (
    <ToolPage
      slug="html-render"
      title="HTML Online Render"
      description="Write HTML, CSS and JS and see the result live"
      variant="fill"
      actions={
        <>
          <button className="btn btn-sm btn-soft" onClick={() => setHtml(DEFAULT_HTML)}>
            Reset
          </button>
          <button className="btn btn-sm btn-soft" onClick={copyHtml}>
            Copy HTML
          </button>
        </>
      }
    >
      <SplitPane
        defaultSplit={50}
        left={
          <Panel label="HTML Code">
            <textarea
              className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              placeholder="Type your HTML here..."
            />
          </Panel>
        }
        right={
          <Panel label="Preview">
            {/* white backdrop on purpose: it previews the user's page, not our theme */}
            <iframe className="flex-1 w-full bg-white" srcDoc={html} title="HTML Preview" sandbox="allow-scripts" />
          </Panel>
        }
      />
    </ToolPage>
  );
}
