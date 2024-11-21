"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize } from "php-serialize";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState(false); // State สำหรับโหมด Full Screen

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

    const isPHPSerialized = (data: string): boolean => {
      return (
        data.startsWith("a:") ||
        data.startsWith("O:") ||
        data.startsWith("s:") ||
        data.startsWith("i:") ||
        data.startsWith("b:") ||
        data.startsWith("d:")
      );
    };

    if (isJSON(inputData)) {
      const jsonData = JSON.parse(inputData.trim());
      result = JSON.stringify(jsonData, null, 4);
      setOutputData(result);
    } else if (isPHPSerialized(inputData)) {
      try {
        const unserializedData = unserialize(inputData.trim());
        result = JSON.stringify(unserializedData, null, 4);
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
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
    });
  };

  const copyToInlineClipboard = () => {
    try {
      const jsonObject = JSON.parse(outputData);
      const inlineJSON = JSON.stringify(jsonObject);
      navigator.clipboard.writeText(inlineJSON).catch((err) => {
        console.error("Failed to copy output: ", err);
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setOutputData(value);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
      className={`container mt-4 ${
        isFullScreen ? "fullscreen" : ""
      }`} // เพิ่มคลาส fullscreen
    >
      <div className="form-group text-white">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <div className="float-right">
          <button
            className="rounded-md bg-slate-800 py-2.5 px-5"
            type="button"
            onClick={processData}
          >
            Process
          </button>
        </div>
        <textarea
          id="inputData"
          className="input-area"
          placeholder="Paste your JSON or Serialized data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          style={{
            backgroundColor: "#333",
            color: "#fff",
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "5px",
          }}
        ></textarea>
      </div>

      <label htmlFor="outputData" className="text-white">
        Formatted Output
      </label>
      <div className="float-right">
        <button
          className="rounded-md rounded-r-none bg-slate-800 py-2 px-4"
          type="button"
          onClick={copyToInlineClipboard}
        >
          Copy Inline
        </button>
        <button
          className="rounded-md rounded-l-none bg-slate-800 py-2 px-4"
          type="button"
          onClick={copyToClipboard}
        >
          Copy
        </button>
        <button
          className="rounded-md bg-slate-800 py-2 px-4 ml-2"
          type="button"
          onClick={toggleFullScreen}
        >
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>
      </div>

      <Editor
        height={isFullScreen ? "100vh" : "80vh"}
        language="json"
        value={outputData}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{
          readOnly: false,
          automaticLayout: true,
        }}
      />

      <style jsx>{`
        .fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          background: #1e1e1e; /* สีพื้นหลัง */
        }
      `}</style>
    </div>
  );
}
