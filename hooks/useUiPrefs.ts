import { useEffect, useState } from "react";
import { editorTheme } from "lib/monacoTheme";

// Shared UI preferences (colour theme + layout template). Kept in a tiny
// module-level store so the header, sidebar and layout all stay in sync
// without prop drilling. Persisted to localStorage and mirrored onto <html>
// as data-theme / data-ui (the same attributes the pre-paint script in
// _document.tsx sets, so the first paint already matches).

export type Theme = "light" | "dark";
export type UiTemplate = "classic" | "glass";

type Prefs = { theme: Theme; template: UiTemplate; ready: boolean; showGlassTip: boolean };

const SERVER: Prefs = { theme: "dark", template: "classic", ready: false, showGlassTip: false };

// Template rollout: first-time visitors land on Glass; people who already used
// the site (the old version always wrote "theme") keep Classic and get a tip
// suggesting Glass. "ui-onboarded" marks that this decision has been made.
// Keep this in sync with the pre-paint script in pages/_document.tsx.
const ONBOARDED_KEY = "ui-onboarded";
const TIP_KEY = "glass-tip-dismissed";
let state: Prefs = SERVER;
const listeners = new Set<() => void>();

function read(): Prefs {
  let theme: Theme = "dark";
  let template: UiTemplate = "classic";
  let showGlassTip = false;
  try {
    const t = localStorage.getItem("theme");
    theme = t === "light" || t === "dark" ? t : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const stored = localStorage.getItem("ui-template");
    if (localStorage.getItem(ONBOARDED_KEY)) {
      template = stored === "glass" ? "glass" : "classic";
    } else {
      template = stored === "glass" || t === null ? "glass" : "classic";
      localStorage.setItem(ONBOARDED_KEY, "1");
    }
    showGlassTip = template === "classic" && !localStorage.getItem(TIP_KEY);
  } catch {}
  return { theme, template, ready: true, showGlassTip };
}

function dismissGlassTip() {
  try { localStorage.setItem(TIP_KEY, "1"); } catch {}
  set({ showGlassTip: false });
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
    try { (window as any).monaco?.editor.setTheme(editorTheme(theme)); } catch {}
  };

  const toggleTemplate = () => {
    // Any explicit template choice answers the tip, so it never comes back.
    try { localStorage.setItem(TIP_KEY, "1"); } catch {}
    set({ template: state.template === "glass" ? "classic" : "glass", showGlassTip: false });
    try { (window as any).monaco?.editor.setTheme(editorTheme(state.theme)); } catch {}
  };

  const tryGlass = () => {
    if (state.template !== "glass") toggleTemplate();
  };

  return { ...prefs, toggleTheme, toggleTemplate, tryGlass, dismissGlassTip };
}
