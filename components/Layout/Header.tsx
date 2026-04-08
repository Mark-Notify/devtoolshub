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
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

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
  { slug: "html-render", label: "HTML Render", icon: DocumentTextIcon },
];

export default function Header(props: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const currentSlug = router.query.slug || router.query.type || "";
  const { data: session } = useSession();

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
      <header className="h-12 flex items-center justify-between px-4 border-b border-gray-700/30 bg-base-100 shrink-0 animate-slide-in-down">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="lg:hidden btn btn-ghost btn-sm btn-square"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sidebarOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Bars3Icon className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoonIcon className="w-5 h-5 text-blue-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-56 bg-base-100 border-r border-gray-700/30 lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-700/30 shrink-0">
              <span className="font-semibold text-sm">Tools</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>
            <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentSlug === item.slug;
                return (
                  <motion.button
                    key={item.slug}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNavigation(item.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-500/10"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </motion.button>
                );
              })}
            </nav>
            <div className="p-2 border-t border-gray-700/30 shrink-0 space-y-1">
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavigation("profile")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentSlug === "profile"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-gray-500/10"
                }`}
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-4 h-4 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{session?.user?.name?.split(" ")[0] || "Profile"}</span>
              </motion.button>
              <p className="text-[10px] opacity-40 text-center">
                &copy; {new Date().getFullYear()} DevToolsHub
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
