"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { toastSuccess, toastError } from "../lib/swal";
import { useToolHistory } from "../hooks/useToolHistory";
import SaveSnippetButton from "./SaveSnippetButton";
import SplitPane from "./SplitPane";

export default function Base64Page() {
    const [inputData, setInputData] = useState<string>("");
    const [outputData, setOutputData] = useState<string>("");
    const [theme, setTheme] = useState<string | null>(null);
    const [mode, setMode] = useState<"encode" | "decode">("encode");
    const { saveHistory } = useToolHistory("base64");

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
            saveHistory(inputData, result);
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
            toastError("Output is empty");
            return;
        }
        navigator.clipboard.writeText(outputData).catch(() => {
            toastError("Failed to copy output!");
        });
        toastSuccess();
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) setOutputData(value);
    };

    const leftPanel = (
        <>
            <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0">
                Input ({mode === "decode" ? "Base64" : "Plain Text"})
            </div>
            <textarea
                className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
                placeholder={`Paste your ${mode === "decode" ? "Base64" : "text"} here...`}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                spellCheck={false}
            />
            <div className="px-3 py-2 border-t border-gray-700/30 bg-base-100 shrink-0">
                <button className="btn btn-block btn-sm btn-accent" onClick={() => processData()}>
                    {mode === "decode" ? "Decode" : "Encode"}
                </button>
            </div>
        </>
    );

    const rightPanel = (
        <>
            <div className="px-3 py-1.5 text-xs font-medium opacity-60 border-b border-gray-700/30 bg-base-100 shrink-0 flex items-center justify-between">
                <span>Output</span>
                <div className="flex items-center gap-1">
                    <SaveSnippetButton toolKey="base64" content={outputData} disabled={!outputData} />
                    <button
                        className="rounded-md py-1 px-2 border bg-base-100 text-xs"
                        type="button"
                        onClick={copyToClipboard}
                    >
                        Copy
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
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
        </>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/30 bg-base-100 shrink-0">
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
            <SplitPane left={leftPanel} right={rightPanel} defaultSplit={40} />
        </div>
    );
}
