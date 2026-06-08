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
  LinkIcon,
  HashtagIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FingerPrintIcon,
  CircleStackIcon,
  TableCellsIcon,
  SwatchIcon,
  ShieldCheckIcon,
  CalculatorIcon,
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

export type GroupName = "Data" | "Encode" | "Text" | "Util" | "Fun";

export const groupConfig: Record<GroupName, {
  label: string;
  emoji: string;
  iconColor: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  hoverBg: string;
  dot: string;
}> = {
  Data:   { label: "Data",    emoji: "🗄️", iconColor: "text-blue-400",    activeBg: "bg-blue-500/15",    activeBorder: "border-l-blue-400",    activeText: "text-blue-300",    hoverBg: "hover:bg-blue-500/8",    dot: "bg-blue-400" },
  Encode: { label: "Encode",  emoji: "🔐", iconColor: "text-emerald-400", activeBg: "bg-emerald-500/15", activeBorder: "border-l-emerald-400", activeText: "text-emerald-300", hoverBg: "hover:bg-emerald-500/8", dot: "bg-emerald-400" },
  Text:   { label: "Text",    emoji: "📝", iconColor: "text-orange-400",  activeBg: "bg-orange-500/15",  activeBorder: "border-l-orange-400",  activeText: "text-orange-300",  hoverBg: "hover:bg-orange-500/8",  dot: "bg-orange-400" },
  Util:   { label: "Utility", emoji: "⚙️", iconColor: "text-violet-400",  activeBg: "bg-violet-500/15",  activeBorder: "border-l-violet-400",  activeText: "text-violet-300",  hoverBg: "hover:bg-violet-500/8",  dot: "bg-violet-400" },
  Fun:    { label: "Fun",     emoji: "🎮", iconColor: "text-rose-400",    activeBg: "bg-rose-500/15",    activeBorder: "border-l-rose-400",    activeText: "text-rose-300",    hoverBg: "hover:bg-rose-500/8",    dot: "bg-rose-400" },
};

export const menuItems = [
  { slug: "json-format-vertical", label: "JSON Format",    icon: CodeBracketSquareIcon, group: "Data"   as GroupName },
  { slug: "xml-to-json-vertical", label: "XML ↔ JSON",    icon: ArrowsRightLeftIcon,   group: "Data"   as GroupName },
  { slug: "yaml-json",            label: "YAML ↔ JSON",   icon: ArrowsRightLeftIcon,   group: "Data"   as GroupName },
  { slug: "json-to-csv",          label: "JSON → CSV",    icon: TableCellsIcon,        group: "Data"   as GroupName },
  { slug: "sql-formatter",        label: "SQL Formatter", icon: CircleStackIcon,       group: "Data"   as GroupName },
  { slug: "jwt-decode",           label: "JWT Decode",    icon: KeyIcon,               group: "Encode" as GroupName },
  { slug: "base64",               label: "Base64",        icon: LockClosedIcon,        group: "Encode" as GroupName },
  { slug: "url-encode-decode",    label: "URL Encode",    icon: LinkIcon,              group: "Encode" as GroupName },
  { slug: "hash-generator",       label: "Hash",          icon: HashtagIcon,           group: "Encode" as GroupName },
  { slug: "diff-checker",         label: "Diff Checker",  icon: DocumentDuplicateIcon, group: "Text"   as GroupName },
  { slug: "regex-tester",         label: "Regex Tester",  icon: MagnifyingGlassIcon,   group: "Text"   as GroupName },
  { slug: "html-render",          label: "HTML Render",   icon: DocumentTextIcon,      group: "Text"   as GroupName },
  { slug: "timestamp-converter",  label: "Timestamp",     icon: ClockIcon,             group: "Util"   as GroupName },
  { slug: "uuid-generator",       label: "UUID",          icon: FingerPrintIcon,       group: "Util"   as GroupName },
  { slug: "password-generator",   label: "Password Gen",  icon: ShieldCheckIcon,       group: "Util"   as GroupName },
  { slug: "number-base",          label: "Number Base",   icon: CalculatorIcon,        group: "Util"   as GroupName },
  { slug: "color-converter",      label: "Color",         icon: SwatchIcon,            group: "Util"   as GroupName },
  { slug: "qr-code-generator",    label: "QR Code",       icon: QrCodeIcon,            group: "Util"   as GroupName },
  { slug: "morse-code-decoder",   label: "Morse Code",    icon: SignalIcon,            group: "Fun"    as GroupName },
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
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    return () => { document.documentElement.removeAttribute("data-theme"); };
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  if (theme === null) return <div style={{ visibility: "hidden" }}>Loading...</div>;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    try { window.monaco.editor.setTheme(theme === "dark" ? "vs-light" : "vs-dark"); } catch { }
  };

  const handleNavigation = (slug: string) => {
    setSidebarOpen(false);
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  const groups = Array.from(new Set(menuItems.map((m) => m.group))) as GroupName[];

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-base-300/50 bg-base-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            className="lg:hidden btn btn-ghost btn-sm btn-square"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {sidebarOpen
                ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><XMarkIcon className="w-5 h-5" /></motion.span>
                : <motion.span key="b" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Bars3Icon className="w-5 h-5" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>

          {/* Logo */}
          <NextLink href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
              <CodeBracketIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">DevToolsHub</span>
          </NextLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm btn-square"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark"
                ? <motion.span key="sun" initial={{ rotate: -90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}><SunIcon className="w-5 h-5 text-yellow-400" /></motion.span>
                : <motion.span key="moon" initial={{ rotate: 90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: -90, scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}><MoonIcon className="w-5 h-5 text-blue-400" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-50 h-full w-60 bg-base-100 border-r border-base-300/50 lg:hidden flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <CodeBracketIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm">DevToolsHub</span>
              </div>
              <button className="btn btn-ghost btn-xs btn-square" onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
              {groups.map((group) => {
                const cfg = groupConfig[group];
                const items = menuItems.filter((m) => m.group === group);
                return (
                  <div key={group}>
                    {/* Group header */}
                    <div className="flex items-center gap-1.5 px-2 mb-1.5">
                      <span className="text-xs">{cfg.emoji}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-40">{cfg.label}</span>
                    </div>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSlug === item.slug;
                        return (
                          <button
                            key={item.slug}
                            onClick={() => handleNavigation(item.slug)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all border-l-2 ${
                              isActive
                                ? `${cfg.activeBg} border-l-2 ${cfg.activeBorder} ${cfg.activeText}`
                                : `border-l-transparent hover:bg-base-200 opacity-70 hover:opacity-100`
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? cfg.iconColor : ""}`} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Profile footer */}
            <div className="p-3 border-t border-base-300/50">
              <button
                onClick={() => handleNavigation("profile")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentSlug === "profile" ? "bg-base-300" : "hover:bg-base-200"
                }`}
              >
                {session?.user?.image
                  ? <img src={session.user.image} alt="Profile" className="w-7 h-7 rounded-full object-cover ring-2 ring-base-300" />
                  : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"><UserCircleIcon className="w-4 h-4 text-white" /></div>
                }
                <div className="text-left min-w-0">
                  <div className="truncate font-semibold text-xs">{session?.user?.name || "Sign in"}</div>
                  {session && <div className="text-[10px] opacity-40 truncate">{session.user?.email}</div>}
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
