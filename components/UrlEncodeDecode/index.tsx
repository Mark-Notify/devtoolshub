"use client";
import { useState, useEffect } from "react";
import SplitPane from "../SplitPane";
import ToolPage, { Panel, Segmented } from "../ui/ToolPage";
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
    <ToolPage
      slug="url-encode-decode"
      description="Percent-encode text for URLs or decode it back"
      variant="fill"
      actions={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />
          <button className="btn btn-sm btn-soft" onClick={swap} title="Swap input/output">⇄ Swap</button>
          <button className="btn btn-sm btn-soft" onClick={copy}>Copy</button>
        </>
      }
    >
      <SplitPane
        left={
          <Panel label="Input">
            <textarea
              className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
              placeholder={mode === "encode" ? "Paste text or URL to encode..." : "Paste encoded URL to decode..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </Panel>
        }
        right={
          <Panel label="Output">
            <textarea
              className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-200/40 outline-none"
              readOnly
              value={output}
            />
          </Panel>
        }
      />
    </ToolPage>
  );
}
