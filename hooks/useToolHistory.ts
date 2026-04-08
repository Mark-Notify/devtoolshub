import { useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook that saves tool usage history to the database.
 * Debounced to avoid saving on every keystroke.
 */
export function useToolHistory(toolKey: string) {
  const { data: session } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const saveHistory = useCallback(
    (inputData: string, outputData: string, debounceMs = 2000) => {
      if (!session) return;
      if (!inputData || !outputData) return;

      const key = `${inputData}|${outputData}`;
      if (key === lastSavedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          await fetch("/api/save-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tool: toolKey,
              // Truncate to 500 chars to avoid excessive DB storage on large inputs
              inputData: inputData.slice(0, 500),
              outputData: outputData.slice(0, 500),
            }),
          });
          lastSavedRef.current = key;
        } catch (err) {
          console.error("[useToolHistory] Failed to save history:", err);
        }
      }, debounceMs);
    },
    [session, toolKey]
  );

  return { saveHistory };
}
