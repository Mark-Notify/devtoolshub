"use client"; // Ensures this code only runs on the client

import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize, serialize } from "php-serialize";
import { toastSuccess, toastError } from "../../lib/swal";
import { isPHPSerialized, deepUnserialize } from "../../lib/phpUnserialize";
import { useToolHistory } from "../../hooks/useToolHistory";
import SaveSnippetButton from "../SaveSnippetButton";
import SplitPane from "../SplitPane";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [theme, setTheme] = useState<string | null>(null);
  const router = useRouter();
  const { saveHistory } = useToolHistory("json-format-vertical");

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

    if (isJSON(inputData)) {
      const jsonData = JSON.parse(inputData.trim());
      result = JSON.stringify(jsonData, null, 4);
      setOutputData(result);
      saveHistory(inputData, result);
    } else if (isPHPSerialized(inputData)) {
      try {
        const unserializedData = unserialize(inputData.trim());
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
    <>
      <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0">
        Input (JSON or Serialized)
      </div>
      <textarea
        id="inputData"
        className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
        placeholder="Paste your JSON or Serialized data here..."
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        spellCheck={false}
      />
      <div className="px-3 py-2 border-t border-gray-700/30 bg-base-100 shrink-0">
        <button className="btn btn-block btn-sm btn-accent" onClick={processData}>
          Process
        </button>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0 flex items-center justify-between">
        <span>Formatted Output</span>
        <div className="flex items-center gap-1">
          <SaveSnippetButton toolKey="json-format-vertical" content={outputData} disabled={!outputData} />
          <button
            className="rounded-md py-1 px-2 border bg-base-100 text-xs"
            type="button"
            onClick={copySerializedOutput}
          >
            Copy Serialized
          </button>
          <button
            className="rounded-md py-1 px-2 border bg-base-100 text-xs"
            onClick={copyToInlineClipboard}
          >
            Copy Inline
          </button>
          <button
            className="rounded-md py-1 px-2 border bg-base-100 text-xs"
            onClick={copyToClipboard}
          >
            Copy
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
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
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/30 bg-base-100 shrink-0">
        <h2 className="text-sm font-semibold">JSON Formatter</h2>
        <button
          title="Horizontal"
          className="rounded-md py-1.5 px-3 border bg-base-100 text-white"
          onClick={() => handleNavigation("json-format")}
        >
          <Image
            src="/horizontal-to-vertical.svg"
            className="svg-icon-theme" alt="Vertical Icon"
            style={{ color: "#fff" }} width={20} height={20} />
        </button>
      </div>
      <SplitPane left={leftPanel} right={rightPanel} defaultSplit={40} />
    </div>
  );
}
