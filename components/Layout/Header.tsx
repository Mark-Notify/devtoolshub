import * as React from "react";
import NextLink from "next/link";
import {
  Bars3Icon,
  CodeBracketIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
  CodeBracketSquareIcon,
  KeyIcon,
  LockClosedIcon,
  SignalIcon,
  QrCodeIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect, useCallback } from "react";

export interface HeaderProps {
  hideMenu?: boolean;
  onThemeChange?: () => void;
}

export const menuItems = [
  { slug: "json-format-vertical", label: "JSON Format", icon: CodeBracketSquareIcon },
  { slug: "xml-to-json-vertical", label: "XML ↔ JSON", icon: ArrowsRightLeftIcon },
  { slug: "jwt-decode", label: "JWT Decode", icon: KeyIcon },
  { slug: "base64", label: "Base64", icon: LockClosedIcon },
  { slug: "morse-code-decoder", label: "Morse Code", icon: SignalIcon },
  { slug: "qr-code-generator", label: "QR Code", icon: QrCodeIcon },
];

export default function Header(props: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const currentSlug = router.query.slug || router.query.type || "";

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
    setSidebarOpen(false);
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-gray-700/30 bg-base-100 shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden btn btn-ghost btn-sm btn-square"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <NextLink href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src="/devtools-logo-full.png"
              alt="DevToolsHub"
              className="w-6 h-6 object-contain rounded"
            />
            <CodeBracketIcon className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-tight hidden sm:inline">DevToolsHub</span>
          </NextLink>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <MoonIcon className="w-5 h-5 text-blue-500" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-base-100 border-r border-gray-700/30 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-700/30">
          <span className="font-semibold text-sm">Tools</span>
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSlug === item.slug;
            return (
              <button
                key={item.slug}
                onClick={() => handleNavigation(item.slug)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-500/10"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
