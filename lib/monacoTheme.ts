import { loader } from "@monaco-editor/react";

// Monaco themes for the Glass layout: same syntax colours as vs / vs-dark but
// with a transparent background so the editor blends into the frosted card.
// Registered on the shared loader promise, so they exist before any <Editor>
// mounts (the Editor awaits the same promise).

const clear = "#00000000";

if (typeof window !== "undefined") {
  loader.init().then((monaco) => {
    monaco.editor.defineTheme("glass-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": clear,
        "editorGutter.background": clear,
        "editorOverviewRuler.background": clear,
        "editorOverviewRuler.border": clear,
        "scrollbar.shadow": clear,
        "focusBorder": clear,
        "editorWidget.background": "#1a2034f2",
        "minimap.background": "#0b0f1c33",
        "editor.lineHighlightBackground": "#ffffff0d",
        "editor.lineHighlightBorder": clear,
        "editorLineNumber.foreground": "#8792ae99",
        "editorLineNumber.activeForeground": "#eef2ff",
        "editor.selectionBackground": "#5b8cff55",
        "scrollbarSlider.background": "#ffffff1a",
        "scrollbarSlider.hoverBackground": "#ffffff2e",
      },
    });
    monaco.editor.defineTheme("glass-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": clear,
        "editorGutter.background": clear,
        "editorOverviewRuler.background": clear,
        "editorOverviewRuler.border": clear,
        "scrollbar.shadow": clear,
        "focusBorder": clear,
        "editorWidget.background": "#fffffff2",
        "minimap.background": "#ffffff33",
        "editor.lineHighlightBackground": "#ffffff66",
        "editor.lineHighlightBorder": clear,
        "editorLineNumber.foreground": "#64748b99",
        "editorLineNumber.activeForeground": "#0f172a",
        "editor.selectionBackground": "#2f6bff33",
        "scrollbarSlider.background": "#0f172a1a",
        "scrollbarSlider.hoverBackground": "#0f172a2e",
      },
    });
  }).catch(() => {});
}

/** Monaco theme name for the current colour theme and layout template. */
export function editorTheme(theme?: string | null): string {
  const dark = (theme ?? (typeof document !== "undefined" ? document.documentElement.dataset.theme : "dark")) !== "light";
  const glass = typeof document !== "undefined" && document.documentElement.dataset.ui === "glass";
  if (glass) return dark ? "glass-dark" : "glass-light";
  return dark ? "vs-dark" : "vs-light";
}
