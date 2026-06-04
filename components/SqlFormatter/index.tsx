"use client";
import { useState, useEffect } from "react";
import { format } from "sql-formatter";
import Editor from "@monaco-editor/react";
import SplitPane from "../SplitPane";
import { toastSuccess, toastError } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";

type Dialect = "sql" | "mysql" | "postgresql" | "sqlite" | "tsql" | "bigquery";
const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "sql", label: "Standard SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "tsql", label: "T-SQL" },
  { value: "bigquery", label: "BigQuery" },
];

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [indent, setIndent] = useState(2);
  const [theme, setTheme] = useState("dark");
  const { saveHistory } = useToolHistory("sql-formatter");

  useEffect(() => { setTheme(localStorage.getItem("theme") || "dark"); }, []);

  useEffect(() => {
    doFormat(input, dialect, indent);
  }, [input, dialect, indent]);

  const doFormat = (sql: string, d: Dialect, ind: number) => {
    if (!sql.trim()) { setOutput(""); return; }
    try {
      const result = format(sql, { language: d, tabWidth: ind });
      setOutput(result);
      saveHistory(sql, result);
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  };

  const copy = () => {
    if (!output) { toastError("Output is empty"); return; }
    navigator.clipboard.writeText(output);
    toastSuccess("Copied!");
  };

  const vsTheme = theme === "dark" ? "vs-dark" : "vs-light";

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="select select-bordered select-sm"
          value={dialect}
          onChange={(e) => setDialect(e.target.value as Dialect)}
        >
          {DIALECTS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <span className="opacity-60">Indent:</span>
          <select className="select select-bordered select-sm w-16" value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>
        <button className="btn btn-sm btn-ghost border ml-auto" onClick={copy}>Copy</button>
      </div>

      <SplitPane
        left={
          <div className="flex flex-col flex-1 overflow-hidden gap-1 pr-1">
            <label className="text-xs font-semibold opacity-60 px-1">SQL Input</label>
            <div className="flex-1 overflow-hidden rounded">
              <Editor
                height="100%"
                language="sql"
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
            <label className="text-xs font-semibold opacity-60 px-1">Formatted Output</label>
            <div className="flex-1 overflow-hidden rounded">
              <Editor
                height="100%"
                language="sql"
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
