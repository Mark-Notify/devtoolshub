import * as React from "react";
import NextLink from "next/link";
import {
  Bars3Icon,
  CodeBracketIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

import { useRouter } from "next/router"; // ใช้สำหรับจัดการ Routing
import Head from "next/head";
import { useState, useEffect } from "react";

export interface HeaderProps {
  hideMenu?: boolean;
  onThemeChange?: () => void; // Callback to notify parent of theme change
}

export default function Header(props: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null); // Initial state includes null for SSR safety
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const router = useRouter();
  const { type } = router.query; // ดึง query parameter จาก URL

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
    }
  }, [theme]);

  if (theme === null) {
    return <div style={{ visibility: "hidden" }}>Loading...</div>;
  }

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    try {
      window.monaco.editor.setTheme(theme === "dark" ? "vs-light" : "vs-dark");
    } catch (error) {

    }
  };

  // ฟังก์ชันเปลี่ยน URL และ Component
  // const handleNavigation = (componentType: string) => {
  //   router.push(`/?type=${componentType}`, undefined, { shallow: true });
  // };

  const handleNavigation = (slug: string) => {
    setDropdownOpen(false); // Hide dropdown after click
    router.push(`/${slug}`, undefined, { shallow: true });
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
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <Bars3Icon className="w-6 h-6" />
            </label>
            {dropdownOpen && (
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-5 shadow bg-base-100 rounded-box w-80 border border-white"
              >
                <li>
                  <button
                    onClick={() => handleNavigation("json-format-vertical")}
                    className={type === "json-format" ? "active" : ""}
                  >
                    JSON Format
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("json-to-array-vertical")}
                    className={type === "json-to-array-vertical" ? "active" : ""}
                  >
                    Json to Array
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("xml-to-json-vertical")}
                    className={type === "xml-to-json" ? "active" : ""}
                  >
                    XML to JSON
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("jwt-decode")}
                    className={type === "jwt-decode" ? "active" : ""}
                  >
                    JWT Decode
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("qr-code-generator")}
                    className={type === "qr-code-generator" ? "active" : ""}
                  >
                    QR Code Generator
                  </button>
                </li>
                <li>
                <button
                  onClick={() => handleNavigation("component-a")}
                  className={type === "component-a" ? "active" : ""}
                >
                  Component A
                </button>
              </li>
              </ul>
            )}

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
