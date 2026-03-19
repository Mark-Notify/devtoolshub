"use client"; // Ensures this code only runs on the client

import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize, serialize } from "php-serialize";
import Swal from "sweetalert2";
import { isPHPSerialized, deepUnserialize } from "../../lib/phpUnserialize";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [theme, setTheme] = useState<string | null>(null);
  const router = useRouter();

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
      alertError("Output is empty");
      return "";
    }
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
      alertError("Failed to copy output!");
    });
    alertCopy();
  };

  const copyToInlineClipboard = () => {
    try {
      if (outputData.trim() === "") {
        alertError("Output is empty");
        return;
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

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setOutputData(value);
    }
  };

  const alertCopy: (title?: string) => void = (title) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      iconColor: "#dfe6e9",
      title: title || "Copied to clipboard!", // Use default text if no title is provided
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#4caf50",
      color: "#fff",
      width: 300,
      padding: "10px",
    });
  };

  const alertError: (message?: string) => void = (message) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      iconColor: "#dfe6e9",
      // title: 'Oops...',
      title: message || "Something went wrong!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      // confirmButtonText: 'Close',
      background: "#fd79a8", // Red background for error
      color: "#fff", // White text
      width: 300,
      padding: "10px",
    });
  };

  const handleNavigation = (slug: string) => {
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  return (
    <div className="h-full p-4">
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Input Section */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <label htmlFor="inputData" className="text-sm font-semibold mb-1">
            Input Data (JSON or Serialized)
          </label>
          <div className="flex justify-end gap-2">
            <button
              title="Horizontal"
              className={`rounded-md py-1.5 px-3 border bg-base-100 text-white`}
              onClick={() => handleNavigation("json-format")}
            >
              <Image
                src="/horizontal-to-vertical.svg"
                className="svg-icon-theme" alt="Vertical Icon"
                style={{ color: "#fff" }} width={20} height={20} />
            </button>
          </div>
          <textarea
            id="inputData"
            className="input-area mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            placeholder="Paste your JSON or Serialized data here..."
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            style={{
              minHeight: "150px",
              resize: "vertical",
            }}
          />
          <button className="btn btn-sm btn-accent" onClick={processData}>
            Process
          </button>
        </div>

        {/* Output Section */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <label htmlFor="outputData" className="text-sm font-semibold mb-1">
            Formatted Output
          </label>
          <div className="flex justify-end gap-2 mb-1">
            <button
              className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
              type="button"
              onClick={copySerializedOutput}
            >
              Copy Serialized
            </button>

            <button
              className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
              onClick={copyToInlineClipboard}
            >
              Copy Inline
            </button>
            <button
              className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
              onClick={copyToClipboard}
            >
              Copy
            </button>
          </div>
          <div className="flex-1 border rounded-md shadow-sm" style={{ minHeight: "300px" }}>
            <Editor
              height="calc(100vh - 180px)"
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
        </div>
      </div>
    </div>
  );
}
