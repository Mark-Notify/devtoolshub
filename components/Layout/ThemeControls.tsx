import * as React from "react";
import { MoonIcon, SunIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { useUiPrefs } from "hooks/useUiPrefs";

// Top-right utility cluster: layout-template switch sitting right next to the
// light/dark toggle, joined into one pill so they read as "appearance" controls.
export default function ThemeControls({ variant = "classic" }: { variant?: "classic" | "glass" }) {
  const { theme, template, toggleTheme, toggleTemplate } = useUiPrefs();
  const nextTemplate = template === "glass" ? "Classic" : "Glass";
  const TemplateIcon = template === "glass" ? Squares2X2Icon : SparklesIcon;

  return (
    <div className={`ui-controls ui-controls--${variant}`} role="group" aria-label="Appearance">
      <button
        type="button"
        onClick={toggleTemplate}
        className="ui-ctl ui-ctl--template"
        title={`Switch to ${nextTemplate} layout`}
        aria-label={`Switch to ${nextTemplate} layout`}
      >
        <TemplateIcon className="w-[18px] h-[18px]" />
        <span className="hidden sm:inline">{nextTemplate}</span>
      </button>
      <span className="ui-ctl-sep" aria-hidden />
      <button
        type="button"
        onClick={toggleTheme}
        className="ui-ctl ui-ctl--theme"
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark"
          ? <SunIcon className="w-[18px] h-[18px] text-yellow-400" />
          : <MoonIcon className="w-[18px] h-[18px] text-blue-500" />}
      </button>
    </div>
  );
}
