// import QRCodeComponent from "../components/QRCodeComponent";
import RootLayout from "../components/RootLayout";

// export default function Home() {
//   return (
//     <div>
//       <center>
//         <h1>QR Code Generate</h1>
//       </center>
//       <QRCodeComponent />
//     </div>
//   );
// }

// src/app/page.tsx

"use client";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // Load RequireJS and Monaco Editor
    const loadEditor = async () => {
      await Promise.all([
        import("https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js"),
        import("https://cdn.jsdelivr.net/npm/php-unserialize@0.0.1/php-unserialize.js"),
      ]);

      // Configure Monaco
      require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs" } });
      require(["vs/editor/editor.main"], function () {
        window.editor = monaco.editor.create(document.getElementById("editor"), {
          value: "",
          language: "json",
          theme: "vs-dark",
          automaticLayout: true,
        });
      });
    };

    loadEditor();
  }, []);

  const processData = () => {
    const inputData = (document.getElementById("inputData") as HTMLTextAreaElement).value;
    let result = "";

    const isJSON = (data: string) => {
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    };

    try {
      if (isJSON(inputData)) {
        const jsonData = JSON.parse(inputData);
        result = JSON.stringify(jsonData, null, 4);
        window.editor.setValue(result);
        monaco.editor.setModelLanguage(window.editor.getModel(), "json");
      } else {
        const unserializedData = PHPUnserialize.unserialize(inputData);
        result = JSON.stringify(unserializedData, null, 4);
        window.editor.setValue(result);
        monaco.editor.setModelLanguage(window.editor.getModel(), "json");
      }
    } catch {
      window.editor.setValue("Error: Invalid input data!");
      monaco.editor.setModelLanguage(window.editor.getModel(), "plaintext");
    }
  };

  const copyToClipboard = () => {
    const output = window.editor.getValue();
    navigator.clipboard.writeText(output).catch((err) => {
      alert("Failed to copy output: ", err);
    });
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center">Programmer Helper Tool</h1>

      <div className="form-group">
        <label htmlFor="inputData">Input Data (JSON or Serialized)</label>
        <textarea
          id="inputData"
          className="input-area"
          placeholder="Paste your JSON or serialized data here..."
          onInput={processData}
        ></textarea>
      </div>

      <label htmlFor="outputData">Formatted Output</label>
      <button className="btn btn-secondary btn-sm float-right" onClick={copyToClipboard}>
        Copy
      </button>
      <div id="editor"></div>
    </div>
  );
}

