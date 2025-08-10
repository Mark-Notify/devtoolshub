import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const ComponentA: React.FC = () => {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleFormat = () => {
    try {
      const json = JSON.parse(input);
      const formatted = JSON.stringify(json, null, 2);
      setOutput(formatted);

      if (session) {
        fetch("/api/save-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: "JSON Formatter",
            inputData: input,
            outputData: formatted,
          }),
        });
      }
    } catch {
      setOutput("❌ Invalid JSON");
    }
  };

  return (
    <div className="p-4 border bg-base-100 rounded-md shadow-md min-h-screen">
      <h2 className="text-xl font-bold mb-4">JSON Formatter</h2>

      {!session ? (
        <div>
          <p className="mb-2">Please sign in to use JSON Formatter</p>
          <button
            className="btn btn-primary"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span>Signed in as {session.user?.email}</span>
            <button className="btn btn-sm btn-error" onClick={() => signOut()}>
              Sign out
            </button>
          </div>

          <textarea
            className="textarea textarea-bordered w-full mb-4"
            rows={6}
            placeholder="Paste your JSON here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button className="btn btn-primary mb-4" onClick={handleFormat}>
            Format JSON
          </button>

          {output && (
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentA;
