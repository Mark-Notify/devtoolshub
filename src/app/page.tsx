"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize } from 'php-serialize';

export const Metadata = {
  title: "Programmer Helper Tools",
  description: "Format JSON and Unserialize Data in one place with a user-friendly Monaco editor.",
  keywords: "Programmer Helper, JSON formatter, Unserialize, Monaco editor, Developer tools",
  openGraph: {
    title: "Programmer Helper Tools",
    description: "A tool for developers to format JSON and unserialize data with ease.",
    type: "website",
  },
};

export default function HomePage() {
  const [inputData, setInputData] = useState("");
  const [outputData, setOutputData] = useState("");

  useEffect(() => {
    processData();
  }, [inputData]);

  const processData = () => {
    let result = "";

    const isJSON = (data) => {
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    };

    const isPHPSerialized = (data) => {
      return data.startsWith("a:") || data.startsWith("O:") || data.startsWith("s:") || data.startsWith("i:") || data.startsWith("b:") || data.startsWith("d:");
    };

    if (isJSON(inputData)) {
      const jsonData = JSON.parse(inputData.trim());
      result = JSON.stringify(jsonData, null, 4);
      setOutputData(result);
    } else if (isPHPSerialized(inputData)) {
      try {
        // แปลงข้อมูลจาก PHP serialization เป็น JavaScript object
        const unserializedData = unserialize(inputData.trim());
        result = JSON.stringify(unserializedData, null, 4);
        setOutputData(result);
      } catch (error) {
        console.error("Unserialization error:", error);
        setOutputData(`Error: Invalid PHP serialized data! ${error.message}`);
      }
    } else {
      // setOutputData("Error: Input data is neither JSON nor PHP serialized format.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
    });
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center text-white">Programmer Helper Tools</h1>

      <div className="form-group text-white">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <textarea
          id="inputData"
          className="input-area opacity-55"
          placeholder="Paste your JSON or serialized data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
        ></textarea>
      </div>

      <label htmlFor="outputData" className="text-white">
        Formatted Output
      </label>
      <button
        className="btn btn-secondary btn-sm float-right"
        onClick={copyToClipboard}
      >
        Copy
      </button>
      <Editor
        height="70vh"
        language="json"
        value={outputData}
        theme="vs-dark"
        options={{
          readOnly: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
