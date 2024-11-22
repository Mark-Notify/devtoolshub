"use client"; // Ensures this code only runs on the client

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { unserialize } from "php-serialize";
import Swal from "sweetalert2";

export default function HomePage() {
  const [inputData, setInputData] = useState<string>("");
  const [outputData, setOutputData] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode
  const [theme, setTheme] = useState<string | null>(null); // State to store theme

  useEffect(() => {
    // Get theme from localStorage once the component is mounted
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme); // Set the stored theme if available
    } else {
      // Default to light theme if no stored theme
      setTheme("dark");
    }
  }, []); // Run only once after the component mounts

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
      console.error("Failed to copy output: empty");
      alertError('Output is empty');
      return '';
    }
    navigator.clipboard.writeText(outputData).catch((err) => {
      console.error("Failed to copy output: ", err);
      alertError("Failed to copy output!");
    });
    alertCopy();
  };

  const copyToInlineClipboard = () => {
    try {
      // Check if outputData is a valid JSON string
      if (outputData.trim() === "") {
        console.error("Failed to copy output: empty");
        alertError('Output is empty');
        return '';
      }
      if (outputData.trim() === "") {
        console.error("Failed to copy output: empty");
        alertError('Output is empty');
        return '';
      }
      const jsonObject = JSON.parse(outputData);
      const inlineJSON = JSON.stringify(jsonObject);
      navigator.clipboard.writeText(inlineJSON).catch((err) => {
        console.error("Failed to copy output: ", err);
        alertError("Failed to copy output!");
      });
      alertCopy('Copied inline to clipboard!');
    } catch (error) {
      alertError("Invalid JSON format.");
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

  const alertCopy: (title?: string) => void = (title) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      iconColor: '#dfe6e9',
      title: title || 'Copied to clipboard!', // Use default text if no title is provided
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#4caf50',
      color: '#fff',
      width: 300,
      padding: '10px',
    });
  };

  const alertError: (message?: string) => void = (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      iconColor: '#dfe6e9',
      // title: 'Oops...',
      title: message || 'Something went wrong!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      // confirmButtonText: 'Close',
      background: '#fd79a8', // Red background for error
      color: '#fff', // White text
      width: 300,
      padding: '10px',
    });
  };

  return (
    <div className={`container mt-4 ${isFullScreen ? "fullscreen" : ""}`}>
      <div className="form-group">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <div className="float-right">
          <button
            className="rounded-md py-2 px-4 border"
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
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "5px",
          }}
        ></textarea>
      </div>

      <label htmlFor="outputData">Formatted Output</label>
      <div className="float-right">
        <button
          className="rounded-md rounded-r-none py-2 px-4 border"
          type="button"
          onClick={copyToInlineClipboard}
        >
          Copy Inline
        </button>
        <button
          className="rounded-md rounded-l-none py-2 px-4 border"
          type="button"
          onClick={copyToClipboard}
        >
          Copy
        </button>
        {/* <button
          className="rounded-md rounded-l-none py-2 px-4 border"
          type="button"
          onClick={toggleFullScreen}
        >
          Full
        </button> */}
      </div>
      <div className="max-w-sm rounded overflow-hidden shadow-lg w-full lg:max-w-full lg:flex">
        <Editor
          height={isFullScreen ? "100vh" : "80vh"}
          language="json"
          value={outputData}
          theme={theme === "dark" ? "vs-dark" : "vs-light"} // Use the theme from state
          onChange={handleEditorChange}
          options={{
            readOnly: false,
            automaticLayout: true,
          }}
        />
      </div>

      <style jsx>{`
        .fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          background: #1e1e1e; /* Dark background for fullscreen */
        }
      `}</style>
    </div>
  );
}
