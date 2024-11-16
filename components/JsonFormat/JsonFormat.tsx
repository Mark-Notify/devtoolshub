"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize } from "php-serialize";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");

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
    } else {
      // setOutputData("Error: Input data is neither JSON nor PHP serialized format.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
    });
  };

  const copyToInlineClipboard = () => {
    try {
      // แปลง jsonString เป็น object ก่อน
      const jsonObject = JSON.parse(outputData);

      // แปลงกลับไปเป็น string แบบ inline โดยไม่มีการจัดรูปแบบ
      const inlineJSON = JSON.stringify(jsonObject);

      // คัดลอก inline JSON ไปยัง clipboard โดยตรง (ไม่ต้อง JSON.stringify ซ้ำอีกครั้ง)
      navigator.clipboard.writeText(inlineJSON).catch((err) => {
        console.error("Failed to copy output: ", err);
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  };

  // ฟังก์ชันที่ใช้เก็บค่าจาก Monaco Editor
  const handleEditorChange = (value) => {
    setOutputData(value);
  };

  return (
    <div className="container mt-4">
      {/* <h1 className="text-center text-white">Programmer Helper Tool</h1> */}

      <div className="form-group text-white">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <div className="float-right">
          <button
            className="rounded-md bg-slate-800 py-2.5 px-5 border border-transparent text-center text-base text-white transition-all shadow-sm hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
            onClick={processData}
          >
            Process
          </button>
        </div>
        <textarea
          style={{
            fontFamily: "Prompt, sans-serif",
            backgroundColor: "#333", // Dark background color
            color: "#fff", // Light text color
            border: "1px solid #555", // Border color for a dark theme
            padding: "10px",
            borderRadius: "5px",
          }}
          id="inputData"
          className="input-area"
          placeholder="Paste your JSON or serialized data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
        ></textarea>
      </div>

      <label htmlFor="outputData" className="text-white">
        Formatted Output
      </label>
      <div className="float-right">
        <button
          className="rounded-md rounded-r-none bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
          onClick={copyToInlineClipboard}
        >
          Copy Inline
        </button>
        <button
          className="rounded-md rounded-l-none bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
          onClick={copyToClipboard}
        >
          Copy
        </button>
      </div>
      <Editor
        height="80vh"
        language="json"
        value={outputData}
        theme="vs-dark"
        onChange={handleEditorChange} // ติดตามการเปลี่ยนแปลงของ Monaco Editor
        options={{
          readOnly: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
