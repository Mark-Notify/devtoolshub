"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import Swal from "sweetalert2";
import {
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

export default function Base64Page() {
    const [inputData, setInputData] = useState<string>("");
    const [outputData, setOutputData] = useState<string>("");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [theme, setTheme] = useState<string | null>(null);
    const [mode, setMode] = useState<"encode" | "decode">("encode");

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        setTheme(storedTheme || "dark");

        const storedFullScreen = localStorage.getItem("isFullScreen");
        if (storedFullScreen) {
            setIsFullScreen(storedFullScreen === "true");
        }
    }, []);

    const processData = (newMode?: "encode" | "decode") => {
        try {
            const currentMode = newMode || mode;
            let result = "";
            if (currentMode === "decode") {
                result = atob(inputData.trim());
            } else {
                result = btoa(inputData.trim());
            }
            setOutputData(result);
        } catch (error) {
            console.error("Base64 Error:", error);
            setOutputData("Error: Invalid Base64 input!");
        }
    };

    const switchMode = (newMode: "encode" | "decode") => {
        setMode(newMode);
        processData(newMode);
    };

    const copyToClipboard = () => {
        if (!outputData.trim()) {
            alertError("Output is empty");
            return;
        }
        navigator.clipboard.writeText(outputData).catch(() => {
            alertError("Failed to copy output!");
        });
        alertCopy();
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) setOutputData(value);
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

    return (
        <div
            className={`mx-auto p-4 border bg-base-100 rounded-md shadow-md ${isFullScreen ? "min-w-screen" : "max-w-7xl"
                }`}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                    Base64 {mode === "encode" ? "Encoder" : "Decoder"}
                </h2>
                <div>
                    <button
                        className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
                        onClick={() => switchMode("encode")}
                        disabled={mode === "encode"}
                    >
                        Encode
                    </button>
                    <button
                        className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
                        onClick={() => switchMode("decode")}
                        disabled={mode === "decode"}
                    >
                        Decode
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="inputData">
                    Input Data ({mode === "decode" ? "Base64" : "Plain Text"})
                </label>
                <div className="float-right">
                    <button
                        className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
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
                    placeholder={`Paste your ${mode === "decode" ? "Base64" : "text"
                        } here...`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    style={{
                        border: "1px solid #555",
                        padding: "10px",
                        borderRadius: "5px",
                    }}
                ></textarea>
                <button className="btn btn-block mb-3 btn-accent" onClick={() => processData()}>
                    {mode === "decode" ? "Decode" : "Encode"}
                </button>
            </div>

            <div className="float-right">
                <button
                    className="rounded-md py-2 px-4 mb-2 mr-2 border bg-base-100"
                    type="button"
                    onClick={copyToClipboard}
                >
                    Copy
                </button>
            </div>

            <label htmlFor="outputData">Output</label>
            <div className="max-w-sm rounded overflow-hidden shadow-lg w-full lg:max-w-full lg:flex">
                <Editor
                    height="70vh"
                    language="plaintext"
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
