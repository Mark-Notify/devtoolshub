"use client";

import { ViewColumnsIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { serialize } from "php-serialize";
import { toastSuccess, toastError } from "../../lib/swal";
import { xml2json, json2xml } from "xml-js";
import { XMLParser } from "fast-xml-parser";
import { useRouter } from "next/router";
import SplitPane from "../SplitPane";
import ToolPage, { Panel } from "../ui/ToolPage";

export default function XmlJsonTool({ stacked = false }: { stacked?: boolean }) {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [theme, setTheme] = useState<string | null>(null);
  const [inputType, setInputType] = useState<"json" | "xml">("json");
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (inputData) {
      processData();
    }
  }, [inputData]);

  const processData = () => {
    try {
      if (isJSON(inputData)) {
        setInputType("xml");
        const parsed = JSON.parse(inputData);
        // ใช้ json2xml สำหรับการแปลง JSON กลับเป็น XML หากต้องการ
        const xml = json2xml(parsed, { compact: true, ignoreComment: true, spaces: 2 });
        setOutputData(xml);
      } else if (isXML(inputData)) {
        setInputType("json");
        // ใช้ xml2json เพื่อแปลง XML เป็น JSON
        // const json = xml2json(inputData, { compact: true, spaces: 2 });
        const parser = new XMLParser();
        const parsed = parser.parse(inputData);
        setOutputData(JSON.stringify(parsed, null, 2));
      } else {
        toastError("Invalid input format. Please provide valid JSON or XML data.");
      }
    } catch (error) {
      toastError("An error occurred while processing the data.");
    }
  };


  const isJSON = (data: string): boolean => {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  };

  const isXML = (data: string): boolean => {
    try {
      // Use xml2json to test if it's valid XML
      xml2json(data, { compact: true });
      return true;
    } catch {
      return false;
    }
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

  const copyToClipboard = () => {
    if (outputData.trim() === "") {
      toastError("Output is empty");
      return;
    }
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
      toastError("Failed to copy output!");
    });
    toastSuccess();
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
      label="Input (JSON or XML)"
      footer={
        <button className="btn btn-block btn-sm btn-primary" onClick={processData}>
          Process
        </button>
      }
    >
      <textarea
        id="inputData"
        className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
        placeholder="Paste your JSON or XML data here..."
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
        language={inputType === "xml" ? "xml" : "json"}
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
      slug="xml-to-json-vertical"
      title="XML ↔ JSON Converter"
      description="Convert between XML and JSON — direction is detected from the input"
      variant="fill"
      actions={
        <button
          title={stacked ? "Side by side" : "Stacked"}
          className="btn btn-sm btn-soft btn-square"
          onClick={() => handleNavigation(stacked ? "xml-to-json-vertical" : "xml-to-json")}
        >
          {stacked ? <ViewColumnsIcon className="w-4 h-4" /> : <RectangleStackIcon className="w-4 h-4" />}
        </button>
      }
    >
      <SplitPane left={leftPanel} right={rightPanel} defaultSplit={40} stacked={stacked} />
    </ToolPage>
  );
}
