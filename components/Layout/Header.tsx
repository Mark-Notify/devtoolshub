import * as React from "react";
import NextLink from "next/link";
import {
  Bars3Icon,
  CodeBracketIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

import SettingMenu from "components/Layout/Menu";
import Head from "next/head";
import { useState, useEffect } from "react";

export interface HeaderProps {
  hideMenu?: boolean;
  onThemeChange?: () => void; // Callback to notify parent of theme change
}

export default function Header(props: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null); // Initial state includes null for SSR safety

  // Runs after the component is mounted (client-side only)
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme); // Apply saved theme
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setTheme(systemTheme); // Apply system theme
      console.log(systemTheme);
    }

    // Cleanup function to reset theme on unmount or if necessary
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  // Sync theme changes to HTML root element and localStorage
  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);

      // Notify parent component of theme change, if provided
      if (onratechange) onratechange;
    }
  }, [theme]);

  if (theme === null) {
    return <div style={{ visibility: "hidden" }}>Loading...</div>;
  }

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    window.monaco.editor.setTheme(theme === "dark" ? "vs-light" : "vs-dark");
  };

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&"
          rel="stylesheet"
        />
      </Head>
      <div className="navbar bg-base-100 mx-auto max-w-7xl mt-4 shadow-xl rounded-box">
        <div className="navbar-start">
          <div className="dropdown">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-circle content-center"
            >
              <Bars3Icon className="w-6 h-6" />
            </label>
            <SettingMenu />
          </div>
        </div>
        <div className="navbar-center">
          <NextLink href="/" className="btn btn-ghost normal-case text-xl">
            <CodeBracketIcon className="w-8 h-8" />
            Programmer Helper Tool
          </NextLink>
        </div>
        <div className="navbar-end">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle p-2"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="w-8 h-8 text-yellow-500" />
            ) : (
              <MoonIcon className="w-8 h-8 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
