import * as React from "react";
import NextLink from "next/link";
import {
  Bars3Icon,
  CodeBracketIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";

export interface HeaderProps {
  hideMenu?: boolean;
  onThemeChange?: () => void;
}

export default function Header(props: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const router = useRouter();
  const { type } = router.query;

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setTheme(systemTheme);
    }
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  if (theme === null) {
    return <div style={{ visibility: "hidden" }}>Loading...</div>;
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    try {
      window.monaco.editor.setTheme(theme === "dark" ? "vs-light" : "vs-dark");
    } catch { }
  };

  const handleNavigation = (slug: string) => {
    setDropdownOpen(false);
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  // 🧭 รายการเมนู
  const menuItems = [
    { slug: "json-format-vertical", label: "JSON Format" },
    { slug: "json-to-array-vertical", label: "JSON → Array" },
    { slug: "xml-to-json-vertical", label: "XML → JSON" },
    { slug: "jwt-decode", label: "JWT Decode" },
    { slug: "base64", label: "Base64" },
    { slug: "morse-code-decoder", label: "Morse Code" },
    { slug: "qr-code-generator", label: "QR Code" },
    // { slug: "component-a", label: "Component A" },
  ];

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&"
          rel="stylesheet"
        />
      </Head>

      <div className="navbar bg-base-100 mx-auto max-w-7xl mt-4 shadow-xl rounded-box">
        {/* START */}
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
              <div
                tabIndex={0}
                className="dropdown-content mt-3 p-5 shadow bg-base-100 rounded-box border border-white"
                style={{
                  width: "auto",
                  maxWidth: "90vw",
                  minWidth: "400px",
                }}
              >
                {/* ✅ เรียงลงล่างครบ 4 ปุ่ม แล้วค่อยขยับขวา */}
                <div className="grid grid-rows-4 grid-flow-col gap-3">
                  {menuItems.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => handleNavigation(item.slug)}
                      className={`btn btn-sm whitespace-normal ${type === item.slug ? "btn-primary" : "btn-outline"
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="navbar-center">
          <NextLink
            href="/"
            className="btn btn-ghost normal-case text-xl flex items-center"
          >
            <CodeBracketIcon className="w-8 h-8" />
            <span className="hidden sm:inline ml-2">Programmer Helper Tools</span>
            <span className="inline sm:hidden ml-2">Dev Tools</span>
          </NextLink>
        </div>

        {/* END */}
        <div className="navbar-end">
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
