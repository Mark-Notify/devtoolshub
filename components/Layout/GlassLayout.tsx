import * as React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import type { Session } from "next-auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  StarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { menuItems, groupConfig, GroupName } from "./Header";
import ThemeControls from "./ThemeControls";

interface GlassLayoutProps {
  children: React.ReactNode;
  session: Session | null;
  currentSlug: string;
  menuOrder: string[];
  favorites: string[];
  onToggleFav: (slug: string, e: React.MouseEvent) => void;
}

type Item = (typeof menuItems)[number];

const byslug = (slug: string) => menuItems.find((m) => m.slug === slug);
const matches = (item: Item, q: string) => {
  const s = q.trim().toLowerCase();
  return !s || item.label.toLowerCase().includes(s) || item.slug.includes(s) || item.group.toLowerCase().includes(s);
};

export default function GlassLayout({ children, session, currentSlug, menuOrder, favorites, onToggleFav }: GlassLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [filter, setFilter] = useState("");
  const [palette, setPalette] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("ui-sidebar") === "collapsed"); } catch {}
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("ui-sidebar", c ? "open" : "collapsed"); } catch {}
      return !c;
    });
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setDrawer(false); }, [currentSlug]);

  // ⌘K / Ctrl+K opens the quick switcher; "/" too, when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = byslug(currentSlug);
  const ordered = menuOrder.map(byslug).filter(Boolean) as Item[];

  const sidebar = (mobile: boolean) => {
    const isRail = collapsed && !mobile;
    const visible = ordered.filter((i) => matches(i, filter));
    const starred = session ? visible.filter((i) => favorites.includes(i.slug)) : [];
    const rest = visible.filter((i) => !starred.includes(i));
    const groups = Array.from(new Set(rest.map((i) => i.group))) as GroupName[];

    const navItem = (item: Item, fav: boolean) => {
      const Icon = item.icon;
      const active = item.slug === currentSlug;
      const cfg = groupConfig[item.group];
      return (
        <Link
          key={item.slug}
          href={`/${item.slug}`}
          title={isRail ? item.label : undefined}
          aria-current={active ? "page" : undefined}
          className={`gl-nav ${active ? "is-active" : ""}`}
        >
          <Icon className={`gl-nav-icon ${active ? cfg.iconColor : ""}`} />
          {!isRail && <span className="flex-1 truncate">{item.label}</span>}
          {!isRail && session && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={fav ? `Unstar ${item.label}` : `Star ${item.label}`}
              onClick={(e) => { e.preventDefault(); onToggleFav(item.slug, e); }}
              className={`gl-star ${fav ? "is-on" : ""}`}
            >
              {fav ? <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" /> : <StarIcon className="w-3.5 h-3.5" />}
            </span>
          )}
        </Link>
      );
    };

    return (
      <aside className={`gl-sidebar glass ${isRail ? "is-rail" : ""} ${mobile ? "is-drawer" : ""}`}>
        <div className="gl-brand">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={36} height={36} className="gl-brand-mark" />
            {!isRail && (
              <span className="min-w-0">
                <span className="block font-bold text-[15px] leading-tight">DevToolsHub</span>
                <span className="block text-[11.5px] gl-muted">Developer toolbox</span>
              </span>
            )}
          </Link>
          {mobile && (
            <button className="gl-icon-btn ml-auto" onClick={() => setDrawer(false)} aria-label="Close menu">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isRail && (
          <label className="gl-filter">
            <MagnifyingGlassIcon className="w-4 h-4 gl-muted shrink-0" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tools…"
              aria-label="Filter tools"
            />
            {filter && (
              <button onClick={() => setFilter("")} aria-label="Clear filter" className="gl-muted hover:opacity-100">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </label>
        )}

        <nav className="gl-nav-scroll">
          {starred.length > 0 && (
            <div className="gl-group">
              {!isRail ? <div className="gl-group-label">⭐ Starred</div> : <div className="gl-rail-sep" />}
              {starred.map((i) => navItem(i, true))}
            </div>
          )}
          {groups.map((g) => (
            <div key={g} className="gl-group">
              {!isRail ? <div className="gl-group-label">{groupConfig[g].emoji} {groupConfig[g].label}</div> : <div className="gl-rail-sep" />}
              {rest.filter((i) => i.group === g).map((i) => navItem(i, false))}
            </div>
          ))}
          {visible.length === 0 && <p className="px-3 py-6 text-center text-xs gl-muted">No tools match “{filter}”</p>}
        </nav>

        <div className="gl-sidebar-foot">
          {session ? (
            <Link href="/profile" className={`gl-nav ${currentSlug === "profile" ? "is-active" : ""}`} title={isRail ? "Profile" : undefined}>
              {session.user?.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                : <UserCircleIcon className="gl-nav-icon" />}
              {!isRail && (
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold truncate">{session.user?.name?.split(" ")[0]}</span>
                  <span className="block text-[11px] gl-muted truncate">{session.user?.email}</span>
                </span>
              )}
            </Link>
          ) : (
            <button onClick={() => signIn("google")} className="gl-nav w-full" title={isRail ? "Sign in" : undefined}>
              <ArrowRightOnRectangleIcon className="gl-nav-icon" />
              {!isRail && <span>Sign in</span>}
            </button>
          )}
          {!mobile && (
            <button onClick={toggleCollapsed} className="gl-nav w-full" title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <ChevronDoubleRightIcon className="gl-nav-icon" /> : <ChevronDoubleLeftIcon className="gl-nav-icon" />}
              {!isRail && <span className="gl-muted">Collapse</span>}
            </button>
          )}
        </div>
      </aside>
    );
  };

  return (
    <div className="gl-root">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <div className="gl-backdrop" aria-hidden>
        <div className="gl-blob b1" /><div className="gl-blob b2" /><div className="gl-blob b3" /><div className="gl-blob b4" />
        <div className="gl-grain" />
      </div>

      <div className={`gl-shell ${collapsed ? "is-collapsed" : ""}`}>
        <div className="hidden lg:flex min-h-0">{sidebar(false)}</div>

        <div className="gl-main">
          <header className="gl-topbar glass">
            <button className="gl-icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
              <Bars3Icon className="w-5 h-5" />
            </button>

            <div className="gl-crumb">
              {current ? (
                <>
                  <span className="gl-muted hidden md:inline">{groupConfig[current.group].label}</span>
                  <span className="gl-muted hidden md:inline">/</span>
                  <span className="font-semibold truncate">{current.label}</span>
                </>
              ) : (
                <span className="font-semibold truncate">DevToolsHub</span>
              )}
            </div>

            <button className="gl-search" onClick={() => setPalette(true)} aria-label="Search tools">
              <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline flex-1 text-left">Search tools…</span>
              <kbd className="hidden md:inline">{isMac ? "⌘" : "Ctrl"} K</kbd>
            </button>

            <ThemeControls variant="glass" />
          </header>

          <main className="gl-content glass">{children}</main>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div key="ov" className="gl-overlay lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div key="dr" className="gl-drawer lg:hidden" initial={{ x: "-105%" }} animate={{ x: 0 }} exit={{ x: "-105%" }} transition={{ type: "spring", stiffness: 340, damping: 34 }}>
              {sidebar(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {palette && <CommandPalette ordered={ordered} favorites={favorites} onClose={() => setPalette(false)} onPick={(slug) => { setPalette(false); router.push(`/${slug}`); }} />}
      </AnimatePresence>
    </div>
  );
}

// ── Quick switcher (⌘K) ──────────────────────────────────────────────────────
function CommandPalette({ ordered, favorites, onClose, onPick }: { ordered: Item[]; favorites: string[]; onClose: () => void; onPick: (slug: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const r = ordered.filter((i) => matches(i, q));
    return [...r.filter((i) => favorites.includes(i.slug)), ...r.filter((i) => !favorites.includes(i.slug))];
  }, [ordered, favorites, q]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[idx]) { e.preventDefault(); onPick(results[idx].slug); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }, [results, idx, onPick, onClose]);

  return (
    <motion.div className="gl-palette-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div
        role="dialog"
        aria-label="Search tools"
        className="gl-palette glass"
        initial={{ y: -12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="gl-palette-input">
          <MagnifyingGlassIcon className="w-5 h-5 gl-muted shrink-0" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Jump to a tool…" aria-label="Search tools" />
          <kbd>Esc</kbd>
        </div>
        <div className="gl-palette-list" ref={listRef}>
          {results.map((item, i) => {
            const Icon = item.icon;
            const cfg = groupConfig[item.group];
            return (
              <button key={item.slug} data-i={i} onMouseEnter={() => setIdx(i)} onClick={() => onPick(item.slug)} className={`gl-palette-item ${i === idx ? "is-active" : ""}`}>
                <Icon className={`w-[18px] h-[18px] shrink-0 ${cfg.iconColor}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {favorites.includes(item.slug) && <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" />}
                <span className="text-[11px] gl-muted">{cfg.label}</span>
              </button>
            );
          })}
          {results.length === 0 && <p className="px-4 py-8 text-center text-sm gl-muted">No tools found</p>}
        </div>
        <div className="gl-palette-foot gl-muted">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
