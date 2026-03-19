"use client";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize, serialize } from "php-serialize";
import Swal from "sweetalert2";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [theme, setTheme] = useState<string | null>(null);
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
    <div className="h-full p-4">
      <div className="form-group">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="inputData" className="text-sm font-semibold">Input Data (JSON or Serialized)</label>
          <button
            title="Vertical"
            className="rounded-md py-1.5 px-3 border bg-base-100 text-white"
            onClick={() => handleNavigation("json-format-vertical")}
          >
            <Image
              src="/horizontal-to-vertical.svg"
              className="svg-icon-theme" alt="Vertical Icon"
              style={{ color: "#fff" }} width={20} height={20} />
          </button>
        </div>
        <textarea
          id="inputData"
          className="input-area"
          placeholder="Paste your JSON or Serialized data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
        ></textarea>
        <button className="btn btn-block btn-sm mb-3 btn-accent" onClick={processData}>
          Process
        </button>
      </div>

      <div className="flex items-center justify-between mb-1">
        <label htmlFor="outputData" className="text-sm font-semibold">Formatted Output</label>
        <div className="flex gap-2">
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
            type="button"
            onClick={copySerializedOutput}
          >
            Copy Serialized
          </button>
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
            type="button"
            onClick={copyToInlineClipboard}
          >
            Copy Inline
          </button>
          <button
            className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
            type="button"
            onClick={copyToClipboard}
          >
            Copy
          </button>
        </div>
      </div>
      <div className="w-full rounded overflow-hidden shadow-sm">
        <Editor
          height="calc(100vh - 360px)"
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
  );
}
