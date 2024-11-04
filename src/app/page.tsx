"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize } from 'php-serialize';

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");

  useEffect(() => {
    processData();
  }, [inputData]);

  const processData = () => {
    let result = "";

    const isJSON = (data: string): boolean => { // กำหนดประเภทของ data เป็น string
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    };

    const isPHPSerialized = (data: string): boolean => { // กำหนดประเภทของ data เป็น string
      return data.startsWith("a:") || data.startsWith("O:") || data.startsWith("s:") || data.startsWith("i:") || data.startsWith("b:") || data.startsWith("d:");
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
        // ใช้ Type Assertion เพื่อให้ TypeScript รู้ว่า error เป็นประเภท Error
        const errorMessage = (error as Error).message || "Unknown error occurred";
        setOutputData(`Error: Invalid PHP serialized data! ${errorMessage}`);
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
      <h1 className="text-center text-white">Programmer Helper Tool</h1>

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
        height="80vh"
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
