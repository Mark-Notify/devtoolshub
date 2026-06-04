"use client";
import { useState, useEffect } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import SplitPane from "../SplitPane";
import { toastSuccess, toastError } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";

type Mode = "yaml-to-json" | "json-to-yaml";

export default function YamlJson() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("yaml-to-json");
  const [theme, setTheme] = useState("dark");
  const { saveHistory } = useToolHistory("yaml-json");

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
  }, []);

  useEffect(() => {
    convert(input, mode);
  }, [input, mode]);

  const convert = (value: string, currentMode: Mode) => {
    if (!value.trim()) { setOutput(""); return; }
    try {
      if (currentMode === "yaml-to-json") {
        const parsed = yaml.load(value);
        const result = JSON.stringify(parsed, null, 2);
        setOutput(result);
        saveHistory(value, result);
      } else {
        const parsed = JSON.parse(value);
        const result = yaml.dump(parsed, { indent: 2 });
        setOutput(result);
        saveHistory(value, result);
      }
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  };

  const copy = () => {
    if (!output) { toastError("Output is empty"); return; }
    navigator.clipboard.writeText(output);
    toastSuccess("Copied!");
  };

  const swap = () => {
    const newMode: Mode = mode === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json";
    setInput(output);
    setMode(newMode);
  };

  const inputLang = mode === "yaml-to-json" ? "yaml" : "json";
  const outputLang = mode === "yaml-to-json" ? "json" : "yaml";
  const vsTheme = theme === "dark" ? "vs-dark" : "vs-light";

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="join">
          <button className={`join-item btn btn-sm ${mode === "yaml-to-json" ? "btn-primary" : "btn-ghost border"}`} onClick={() => setMode("yaml-to-json")}>YAML → JSON</button>
          <button className={`join-item btn btn-sm ${mode === "json-to-yaml" ? "btn-primary" : "btn-ghost border"}`} onClick={() => setMode("json-to-yaml")}>JSON → YAML</button>
        </div>
        <button className="btn btn-sm btn-ghost border" onClick={swap}>⇄ Swap</button>
        <button className="btn btn-sm btn-ghost border ml-auto" onClick={copy}>Copy</button>
      </div>

      <SplitPane
        left={
          <div className="flex flex-col flex-1 overflow-hidden gap-1 pr-1">
            <label className="text-xs font-semibold opacity-60 px-1">{inputLang.toUpperCase()} Input</label>
            <div className="flex-1 overflow-hidden rounded">
              <Editor
                height="100%"
                language={inputLang}
                value={input}
                theme={vsTheme}
                onChange={(v) => setInput(v ?? "")}
                options={{ minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </div>
        }
        right={
          <div className="flex flex-col flex-1 overflow-hidden gap-1 pl-1">
            <label className="text-xs font-semibold opacity-60 px-1">{outputLang.toUpperCase()} Output</label>
            <div className="flex-1 overflow-hidden rounded">
              <Editor
                height="100%"
                language={outputLang}
                value={output}
                theme={vsTheme}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
