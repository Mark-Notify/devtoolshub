"use client";
import { useState, useEffect } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import SplitPane from "../SplitPane";
import ToolPage, { Panel, Segmented } from "../ui/ToolPage";
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
    <ToolPage
      slug="yaml-json"
      description="Convert YAML to JSON and back"
      variant="fill"
      actions={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "yaml-to-json", label: "YAML → JSON" },
              { value: "json-to-yaml", label: "JSON → YAML" },
            ]}
          />
          <button className="btn btn-sm btn-soft" onClick={swap}>⇄ Swap</button>
          <button className="btn btn-sm btn-soft" onClick={copy}>Copy</button>
        </>
      }
    >
      <SplitPane
        left={
          <Panel label={`${inputLang.toUpperCase()} Input`}>
            <Editor
              height="100%"
              language={inputLang}
              value={input}
              theme={vsTheme}
              onChange={(v) => setInput(v ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
            />
          </Panel>
        }
        right={
          <Panel label={`${outputLang.toUpperCase()} Output`}>
            <Editor
              height="100%"
              language={outputLang}
              value={output}
              theme={vsTheme}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
            />
          </Panel>
        }
      />
    </ToolPage>
  );
}
