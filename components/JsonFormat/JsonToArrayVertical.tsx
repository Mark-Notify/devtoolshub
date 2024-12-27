"use client"; // Ensures this code only runs on the client

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from "next/router"; // ใช้สำหรับจัดการ Routing
import Editor from "@monaco-editor/react";
import Swal from "sweetalert2";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

const JsonToArrayVertical: React.FC = () => {
  const [jsonData, setJsonData] = useState<string>('');
  const [phpArrayData, setPhpArrayData] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode
  const [theme, setTheme] = useState<string | null>(null); // State to store theme
  const router = useRouter();
  const { type } = router.query; // ดึง query parameter จาก URL

  useEffect(() => {
    // Get theme from localStorage once the component is mounted
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme); // Set the stored theme if available
    } else {
      // Default to light theme if no stored theme
      setTheme("dark");
    }
    const storedFullScreen = localStorage.getItem("isFullScreen");
    if (storedFullScreen) {
      setIsFullScreen(storedFullScreen === "true"); // Convert string to boolean
    }
  }, []); // Run only once after the component mounts

  useEffect(() => {
    processData();
  }, [jsonData]);
  
  const processData = () => {
    if (!jsonData.trim()) {
      setPhpArrayData('');
      return;
    }

    try {
      let parsedData;
      try {
        // Check if the JSON format is valid before parsing
        if (/^[\],:{}\s]*$/.test(jsonData.replace(/\\["\\\/bfnrtu]/g, '@')
          .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
          .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
          parsedData = JSON.parse(jsonData);
        } else {
          alertError('Invalid JSON format');
          return;
        }
      } catch (error) {
        console.error('Invalid JSON data', error);
        alertError('Invalid JSON data');
        setPhpArrayData('Error: Invalid JSON data');
        return;
      }
      if (parsedData === null || parsedData === undefined) {
        setPhpArrayData('Error: Parsed data is null or undefined');
        return;
      }

      const resultArray = Array.isArray(parsedData)
        ? parsedData
        : Object.entries(parsedData).map(([key, value]) => ({
            key,
            value,
          }));

      const phpArrayString = arrayToPhpFormat(resultArray);
      setPhpArrayData(phpArrayString);
    } catch (error) {
      console.error('Invalid JSON data', error);
      alertError('Invalid JSON data');
      if (error instanceof Error) {
        setPhpArrayData(`Error: ${error.message}`); // Show error message in the output
      } else {
        setPhpArrayData('Error: An unknown error occurred'); // Fallback for unknown error type
      }
    }
  };

  const arrayToPhpFormat = (array: any[]): string => {
    const phpArrayItems = array
      .map(item => {
        const key = JSON.stringify(item.key);
        const value = JSON.stringify(item.value);
        return `    ${key} => ${value}`;
      })
      .join(",\n");

    return `<?php\n$arrayVar = [\n${phpArrayItems}\n];`;
  };

  const copyToClipboard = () => {
    if (phpArrayData.trim() === "") {
      console.error("Failed to copy output: empty");
      alertError("Output is empty");
      return "";
    }
    navigator.clipboard.writeText(phpArrayData).catch((err) => {
      console.error("Failed to copy output: ", err);
      alertError("Failed to copy output!");
    });
    alertCopy();
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
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Input Section - Smaller Width */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <label htmlFor="inputData" className="text-lg font-semibold mb-2">
            Input Data (JSON)
          </label>
          <div className="flex justify-end mt-2 gap-2">
            <button
              title="Vertical"
              className={`rounded-md py-2 px-4 border bg-base-100 text-white ${type === "json-format-vertical" ? "active" : ""}`}
              onClick={() => handleNavigation("json-format")}
            >
              <Image
                src="/horizontal-to-vertical.svg"
                className="svg-icon-theme" alt="Vertical Icon"
                style={{ color: "#fff" }} width={24} height={24} />
            </button>

            <button
              className="rounded-md py-2 px-4 border bg-base-100"
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <ArrowsPointingInIcon className="w-6 h-6" /> : <ArrowsPointingOutIcon className="w-6 h-6" />}
            </button>
          </div>
          <textarea
            id="inputData"
            className="input-area mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste your JSON data here..."
            value={jsonData}
            onChange={(e) => {
              setJsonData(e.target.value);
              processData();
            }}
            style={{
              minHeight: "200px",
              resize: "vertical",
            }}
          />
          <button className="btn btn-accent" onClick={processData}>
            Convert JSON to PHP Array
          </button>
        </div>

        {/* Output Section - Larger Width */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <label htmlFor="outputData" className="text-lg font-semibold mb-2">
            PHP Array Output
          </label>
          <div className="flex justify-end gap-2 mb-2">
            <button
              className="rounded-md py-2 px-4 border bg-base-100"
              onClick={copyToClipboard}
            >
              Copy
            </button>
          </div>
          <div className="editor-container mt-2 border rounded-md shadow-md">
            <Editor
              height="68vh"
              language="php"
              value={phpArrayData}
              theme={theme === "dark" ? "vs-dark" : "vs-light"}
              options={{
                readOnly: true,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonToArrayVertical;