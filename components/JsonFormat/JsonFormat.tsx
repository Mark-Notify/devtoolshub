"use client"; // Ensures this code only runs on the client
import Image from "next/image";
import { useRouter } from "next/router"; // ใช้สำหรับจัดการ Routing
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize, serialize } from "php-serialize";
import Swal from "sweetalert2";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode
  const [theme, setTheme] = useState<string | null>(null); // State to store theme
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
      <div className="form-group">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <div className="float-right">
          <button
            title="Vertical"
            className={`rounded-md py-2 px-4 mb-2 mr-2 border border-r-none bg-base-100 text-white ${type === "json-format-vertical" ? "active" : ""}`}
            onClick={() => handleNavigation("json-format-vertical")}
          >
            <Image
              src="/horizontal-to-vertical.svg"
              className="svg-white" alt="Vertical Icon"
              style={{ color: "#fff" }} width={24} height={24} />
          </button>
          <button
            className="rounded-md py-2 px-4 mb-2 border border-l-none bg-base-100"
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
          placeholder="Paste your JSON or Serialized data here..."
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
