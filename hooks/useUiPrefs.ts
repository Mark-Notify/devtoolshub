import { useEffect, useState } from "react";

// Shared UI preferences (colour theme + layout template). Kept in a tiny
// module-level store so the header, sidebar and layout all stay in sync
// without prop drilling. Persisted to localStorage and mirrored onto <html>
// as data-theme / data-ui (the same attributes the pre-paint script in
// _document.tsx sets, so the first paint already matches).

export type Theme = "light" | "dark";
export type UiTemplate = "classic" | "glass";

type Prefs = { theme: Theme; template: UiTemplate; ready: boolean };

const SERVER: Prefs = { theme: "dark", template: "classic", ready: false };
let state: Prefs = SERVER;
const listeners = new Set<() => void>();

function read(): Prefs {
  let theme: Theme = "dark";
  let template: UiTemplate = "classic";
  try {
    const t = localStorage.getItem("theme");
    theme = t === "light" || t === "dark" ? t : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    template = localStorage.getItem("ui-template") === "glass" ? "glass" : "classic";
  } catch {}
  return { theme, template, ready: true };
}

function set(next: Partial<Prefs>) {
  state = { ...state, ...next };
  const el = document.documentElement;
  el.setAttribute("data-theme", state.theme);
  el.setAttribute("data-ui", state.template);
  try {
    localStorage.setItem("theme", state.theme);
    localStorage.setItem("ui-template", state.template);
  } catch {}
  listeners.forEach((l) => l());
}


export function useUiPrefs() {
  // Start from the server snapshot so hydration matches, then sync in an effect.
  const [prefs, setPrefs] = useState<Prefs>(SERVER);
  useEffect(() => {
    const sync = () => setPrefs(state);
    listeners.add(sync);
    if (!state.ready) set(read()); else sync();
    return () => { listeners.delete(sync); };
  }, []);

  const toggleTheme = () => {
    const theme: Theme = state.theme === "dark" ? "light" : "dark";
    set({ theme });
    try { (window as any).monaco?.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light"); } catch {}
  };

  const toggleTemplate = () => set({ template: state.template === "glass" ? "classic" : "glass" });

  return { ...prefs, toggleTheme, toggleTemplate };
}
