"use client";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { toastSuccess, toastError } from "../lib/swal";
import { useToolHistory } from "../hooks/useToolHistory";
import SaveSnippetButton from "./SaveSnippetButton";
import SplitPane from "./SplitPane";
import ToolPage, { Panel, Segmented } from "./ui/ToolPage";

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
        <Panel
            label={`Input (${mode === "decode" ? "Base64" : "Plain Text"})`}
            footer={
                <button className="btn btn-block btn-sm btn-primary" onClick={() => processData()}>
                    {mode === "decode" ? "Decode" : "Encode"}
                </button>
            }
        >
            <textarea
                className="flex-1 w-full resize-none p-3 font-mono text-sm bg-base-100 outline-none"
                placeholder={`Paste your ${mode === "decode" ? "Base64" : "text"} here...`}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                spellCheck={false}
            />
        </Panel>
    );

    const rightPanel = (
        <Panel
            label="Output"
            actions={
                <>
                    <SaveSnippetButton toolKey="base64" content={outputData} disabled={!outputData} />
                    <button className="btn btn-xs btn-soft" type="button" onClick={copyToClipboard}>
                        Copy
                    </button>
                </>
            }
        >
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
        </Panel>
    );

    return (
        <ToolPage
            slug="base64"
            title={`Base64 ${mode === "encode" ? "Encoder" : "Decoder"}`}
            description="Encode plain text to Base64 or decode it back"
            variant="fill"
            actions={
                <Segmented
                    value={mode}
                    onChange={switchMode}
                    options={[
                        { value: "encode", label: "Encode" },
                        { value: "decode", label: "Decode" },
                    ]}
                />
            }
        >
            <SplitPane left={leftPanel} right={rightPanel} defaultSplit={40} />
        </ToolPage>
    );
}
