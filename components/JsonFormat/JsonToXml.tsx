"use client"; // Ensures this code only runs on the client

import Image from "next/image";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize, serialize } from "php-serialize";
import Swal from "sweetalert2";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { xml2json, json2xml } from "xml-js"; // Correct import for xml-js
import { XMLParser } from "fast-xml-parser"; // Ensure to install this library if not already included
import { useRouter } from "next/router"; // ใช้สำหรับจัดการ Routing

export default function HomePage() {
  const [inputData, setInputData] = useState<string>(""); // Input data state
  const [outputData, setOutputData] = useState<string>(""); // Output data state
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode
  const [theme, setTheme] = useState<string | null>(null); // State to store theme
  const [inputType, setInputType] = useState<"json" | "xml">("json"); // State for input type selection
  const router = useRouter();
  const { type } = router.query; // ดึง query parameter จาก URL

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme("dark");
    }
    const storedFullScreen = localStorage.getItem("isFullScreen");
    if (storedFullScreen) {
      setIsFullScreen(storedFullScreen === "true");
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
        alertError("Invalid input format. Please provide valid JSON or XML data.");
      }
    } catch (error) {
      alertError("An error occurred while processing the data.");
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
      // Check if outputData is a valid JSON string
      if (outputData.trim() === "") {
        console.error("Failed to copy output: empty");
        alertError("Output is empty");
        return "";
      }
      if (outputData.trim() === "") {
        console.error("Failed to copy output: empty");
        alertError("Output is empty");
        return "";
      }
      const jsonObject = JSON.parse(outputData);
      const inlineJSON = JSON.stringify(jsonObject);
      navigator.clipboard.writeText(inlineJSON).catch((err) => {
        console.error("Failed to copy output: ", err);
        alertError("Failed to copy output!");
      });
      alertCopy("Copied inline to clipboard!");
    } catch (error) {
      alertError("Invalid JSON format.");
    }
  };

  const copySerializedOutput = () => {
    try {
      if (outputData.trim() === "") {
        alertError("Output is empty");
        return;
      }
      const jsonObject = JSON.parse(outputData);
      const serializedData = serialize(jsonObject); // Serialize the JSON output
      navigator.clipboard.writeText(serializedData).catch((err) => {
        console.error("Failed to copy serialized output: ", err);
        alertError("Failed to copy serialized output!");
      });
      alertCopy("Serialized output copied to clipboard!");
    } catch (error) {
      console.error("Serialization error:", error);
      alertError("Failed to serialize output!");
    }
  };

  const copyToClipboard = () => {
    if (outputData.trim() === "") {
      alertError("Output is empty");
      return;
    }
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
      alertError("Failed to copy output!");
    });
    alertCopy();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setOutputData(value);
    }
  };

  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    localStorage.setItem("isFullScreen", newFullScreenState.toString());
  };

  const alertCopy = (title?: string) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      iconColor: "#dfe6e9",
      title: title || "Copied to clipboard!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#4caf50",
      color: "#fff",
      width: 300,
      padding: "10px",
    });
  };

  const alertError = (message?: string) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      iconColor: "#dfe6e9",
      title: message || "Something went wrong!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#fd79a8",
      color: "#fff",
      width: 300,
      padding: "10px",
    });
  };

  const handleNavigation = (slug: string) => {
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  return (
    <div
      className={`mx-auto p-4 border bg-base-100 rounded-md shadow-md ${isFullScreen ? "min-w-screen" : "max-w-7xl"
        }`}
    >
      {/* UI elements remain the same */}
      {/* <div className="form-group">
        <label htmlFor="inputType">Select Input Type</label>
        <div className="flex items-center">
          <button
            className={`px-4 py-2 mr-2 ${inputType === "json" ? "bg-blue-500" : "bg-gray-300"}`}
            onClick={() => setInputType("json")}
          >
            JSON
          </button>
          <button
            className={`px-4 py-2 ${inputType === "xml" ? "bg-blue-500" : "bg-gray-300"}`}
            onClick={() => setInputType("xml")}
          >
            XML
          </button>
        </div>
      </div> */}

      <div className="form-group">
        <label htmlFor="inputData">Input Data (JSON or XML)</label>
        <div className="float-right">
          <button
            title="Vertical"
            className={`rounded-md py-2 px-4 mb-2 mr-2 border border-r-none bg-base-100 text-white ${type === "xml-to-json-vertical" ? "active" : ""}`}
            onClick={() => handleNavigation("xml-to-json-vertical")}
          >
            <Image
              src="/horizontal-to-vertical.svg"
              className="svg-icon-theme" alt="Vertical Icon"
              style={{ color: "#fff" }} width={24} height={24} />
          </button>
          <button
            className="rounded-md py-2 px-4 mb-2 border bg-base-100"
            type="button"
            onClick={toggleFullScreen}
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="w-6 h-6" />
            ) : (
              <ArrowsPointingOutIcon className="w-6 h-6" />
            )}
          </button>
        </div>
        <textarea
          id="inputData"
          className="input-area"
          placeholder="Paste your JSON or XML data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          style={{
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "5px",
          }}
        ></textarea>
        <button className="btn btn-block mb-3 btn-accent" onClick={processData}>
          Process
        </button>
      </div>

      <div className="float-right">
        {inputType === "json" && (
          <>
            <button
              className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
              type="button"
              onClick={copySerializedOutput}
            >
              Copy Serialized
            </button>
            <button
              className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
              type="button"
              onClick={copyToInlineClipboard}
            >
              Copy Inline
            </button>
          </>
        )}
        <button
          className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
          type="button"
          onClick={copyToClipboard}
        >
          Copy
        </button>
      </div>

      <label htmlFor="outputData">Formatted Output</label>
      <div className="max-w-sm rounded overflow-hidden shadow-lg w-full lg:max-w-full lg:flex">
        <Editor
          height="80vh"
          language={inputType === "xml" ? "xml" : "josn"}
          value={outputData}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          onChange={handleEditorChange}
          options={{
            readOnly: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
