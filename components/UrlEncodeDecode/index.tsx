"use client";
import { useState, useEffect } from "react";
import SplitPane from "../SplitPane";
import { toastSuccess, toastError } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";
type Mode = "encode" | "decode";

export default function UrlEncodeDecode() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const { saveHistory } = useToolHistory("url-encode-decode");

  useEffect(() => {
    process(input, mode);
  }, [input, mode]);

  const process = (value: string, currentMode: Mode) => {
    if (!value) { setOutput(""); return; }
    try {
      const result = currentMode === "encode"
        ? encodeURIComponent(value)
        : decodeURIComponent(value);
      setOutput(result);
      saveHistory(value, result);
    } catch {
      setOutput("Error: Invalid input for decode");
    }
  };

  const copy = () => {
    if (!output) { toastError("Output is empty"); return; }
    navigator.clipboard.writeText(output);
    toastSuccess("Copied!");
  };

  const swap = () => {
    const newMode: Mode = mode === "encode" ? "decode" : "encode";
    setInput(output);
    setMode(newMode);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="join">
          <button
            className={`join-item btn btn-sm ${mode === "encode" ? "btn-primary" : "btn-ghost border"}`}
            onClick={() => setMode("encode")}
          >Encode</button>
          <button
            className={`join-item btn btn-sm ${mode === "decode" ? "btn-primary" : "btn-ghost border"}`}
            onClick={() => setMode("decode")}
          >Decode</button>
        </div>
        <button className="btn btn-sm btn-ghost border" onClick={swap} title="Swap input/output">⇄ Swap</button>
        <button className="btn btn-sm btn-ghost border ml-auto" onClick={copy}>Copy</button>
      </div>

      <SplitPane
        left={
          <div className="flex flex-col flex-1 overflow-hidden gap-1 pr-1">
            <label className="text-xs font-semibold opacity-60 px-1">Input</label>
            <textarea
              className="input-area flex-1 resize-none font-mono text-sm"
              placeholder={mode === "encode" ? "Paste text or URL to encode..." : "Paste encoded URL to decode..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        }
        right={
          <div className="flex flex-col flex-1 overflow-hidden gap-1 pl-1">
            <label className="text-xs font-semibold opacity-60 px-1">Output</label>
            <textarea
              className="input-area flex-1 resize-none font-mono text-sm"
              readOnly
              value={output}
            />
          </div>
        }
      />
    </div>
  );
}
