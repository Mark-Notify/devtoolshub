"use client"; // Ensures this code only runs on the client

import { ViewColumnsIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { serialize } from "php-serialize";
import { toastSuccess, toastError } from "../../lib/swal";
import { isPHPSerialized, deepUnserialize, safeUnserialize } from "../../lib/phpUnserialize";
import { useToolHistory } from "../../hooks/useToolHistory";
import SaveSnippetButton from "../SaveSnippetButton";
import SplitPane from "../SplitPane";
import ToolPage, { Panel } from "../ui/ToolPage";

export default function JsonFormatTool({ stacked = false }: { stacked?: boolean }) {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [theme, setTheme] = useState<string | null>(null);
  const router = useRouter();
  const { saveHistory } = useToolHistory(stacked ? "json-format" : "json-format-vertical");

  useEffect(() => {
    // Get theme from localStorage once the component is mounted
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    processData();
  }, [inputData]);

  const processData = () => {
    let result = "";

    const isJSON = (data: string): boolean => {
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    };

    const deepParseJSON = (value: unknown): unknown => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && isJSON(trimmed)) {
          return deepParseJSON(JSON.parse(trimmed));
        }
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(deepParseJSON);
      }
      if (value !== null && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepParseJSON(v)])
        );
      }
      return value;
    };

    if (isJSON(inputData)) {
      const jsonData = JSON.parse(inputData.trim());
      const deepResult = deepParseJSON(jsonData);
      result = JSON.stringify(deepResult, null, 4);
      setOutputData(result);
      saveHistory(inputData, result);
    } else if (isPHPSerialized(inputData)) {
      try {
        const unserializedData = safeUnserialize(inputData);
        const deepResult = deepUnserialize(unserializedData);
        result = JSON.stringify(deepResult, null, 4);
        setOutputData(result);
      } catch (error) {
        console.error("Unserialization error:", error);
        const errorMessage =
          (error as Error).message || "Unknown error occurred";
        setOutputData(`Error: Invalid PHP serialized data! ${errorMessage}`);
      }
    }
  };

  const copyToClipboard = () => {
    if (outputData.trim() === "") {
      console.error("Failed to copy output: empty");
      toastError("Output is empty");
      return "";
    }
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
      toastError("Failed to copy output!");
    });
    toastSuccess();
  };

  const copyToInlineClipboard = () => {
    try {
      if (outputData.trim() === "") {
        toastError("Output is empty");
        return;
      }
      const jsonObject = JSON.parse(outputData);
      const inlineJSON = JSON.stringify(jsonObject);
      navigator.clipboard.writeText(inlineJSON).catch((err) => {
        console.error("Failed to copy output: ", err);
        toastError("Failed to copy output!");
      });
      toastSuccess("Copied inline to clipboard!");
    } catch (error) {
      toastError("Invalid JSON format.");
    }
  };

  const copySerializedOutput = () => {
    try {
      if (outputData.trim() === "") {
        toastError("Output is empty");
        return;
      }
      const jsonObject = JSON.parse(outputData);
      const serializedData = serialize(jsonObject); // Serialize the JSON output
      navigator.clipboard.writeText(serializedData).catch((err) => {
        console.error("Failed to copy serialized output: ", err);
        toastError("Failed to copy serialized output!");
      });
      toastSuccess("Serialized output copied to clipboard!");
    } catch (error) {
      console.error("Serialization error:", error);
      toastError("Failed to serialize output!");
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setOutputData(value);
    }
  };

  const handleNavigation = (slug: string) => {
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  const leftPanel = (
    <Panel
      label="Input (JSON or Serialized)"
      footer={
        <button className="btn btn-block btn-sm btn-primary" onClick={processData}>
          Process
        </button>
      }
    >
      <textarea
        id="inputData"
        className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
        placeholder="Paste your JSON or Serialized data here..."
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        spellCheck={false}
      />
    </Panel>
  );

  const rightPanel = (
    <Panel
      label="Formatted Output"
      actions={
        <>
          <SaveSnippetButton toolKey="json-format-vertical" content={outputData} disabled={!outputData} />
          <button className="btn btn-xs btn-soft" type="button" onClick={copySerializedOutput}>
            Copy Serialized
          </button>
          <button className="btn btn-xs btn-soft" onClick={copyToInlineClipboard}>
            Copy Inline
          </button>
          <button className="btn btn-xs btn-soft" onClick={copyToClipboard}>
            Copy
          </button>
        </>
      }
    >
      <Editor
        height="100%"
        language="json"
        value={outputData}
        theme={theme === "dark" ? "vs-dark" : "vs-light"}
        onChange={handleEditorChange}
        options={{
          readOnly: false,
          automaticLayout: true,
        }}
      />
    </Panel>
  );

  return (
    <ToolPage
      slug="json-format-vertical"
      title="JSON Formatter"
      description="Format, beautify and unserialize JSON or PHP serialized data"
      variant="fill"
      actions={
        <button
          title={stacked ? "Side by side" : "Stacked"}
          className="btn btn-sm btn-soft btn-square"
          onClick={() => handleNavigation(stacked ? "json-format-vertical" : "json-format")}
        >
          {stacked ? <ViewColumnsIcon className="w-4 h-4" /> : <RectangleStackIcon className="w-4 h-4" />}
        </button>
      }
    >
      <SplitPane left={leftPanel} right={rightPanel} defaultSplit={40} stacked={stacked} />
    </ToolPage>
  );
}
