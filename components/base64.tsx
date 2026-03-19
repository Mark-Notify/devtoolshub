"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import Swal from "sweetalert2";

export default function Base64Page() {
    const [inputData, setInputData] = useState<string>("");
    const [outputData, setOutputData] = useState<string>("");
    const [theme, setTheme] = useState<string | null>(null);
    const [mode, setMode] = useState<"encode" | "decode">("encode");

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        setTheme(storedTheme || "dark");
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
        <div className="h-full p-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-semibold">
                    Base64 {mode === "encode" ? "Encoder" : "Decoder"}
                </h2>
                <div className="flex gap-2">
                    <button
                        className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
                        onClick={() => switchMode("encode")}
                        disabled={mode === "encode"}
                    >
                        Encode
                    </button>
                    <button
                        className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
                        onClick={() => switchMode("decode")}
                        disabled={mode === "decode"}
                    >
                        Decode
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="inputData" className="text-sm font-semibold">
                    Input Data ({mode === "decode" ? "Base64" : "Plain Text"})
                </label>
                <textarea
                    id="inputData"
                    className="input-area"
                    placeholder={`Paste your ${mode === "decode" ? "Base64" : "text"} here...`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                ></textarea>
                <button className="btn btn-block btn-sm mb-3 btn-accent" onClick={() => processData()}>
                    {mode === "decode" ? "Decode" : "Encode"}
                </button>
            </div>

            <div className="flex items-center justify-between mb-1">
                <label htmlFor="outputData" className="text-sm font-semibold">Output</label>
                <button
                    className="rounded-md py-1.5 px-3 border bg-base-100 text-xs"
                    type="button"
                    onClick={copyToClipboard}
                >
                    Copy
                </button>
            </div>
            <div className="w-full rounded overflow-hidden shadow-sm">
                <Editor
                    height="calc(100vh - 370px)"
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
