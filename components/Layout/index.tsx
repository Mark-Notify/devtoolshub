import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Header, { HeaderProps, menuItems, groupConfig, GroupName } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StarIcon,
  ShareIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { signIn } from "next-auth/react";

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
  onThemeChange?: () => void;
}

// ─── Sortable item ─────────────────────────────────────────────────────────────
interface SortableItemProps {
  slug: string;
  isActive: boolean;
  isFav: boolean;
  showControls: boolean;
  onToggleFav: (slug: string, e: React.MouseEvent) => void;
}

function SortableItem({ slug, isActive, isFav, showControls, onToggleFav }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slug });

  const item = menuItems.find((m) => m.slug === slug);
  if (!item) return null;

  const Icon = item.icon;
  const cfg = groupConfig[item.group as GroupName];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {/* Colored indicator bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200 ${
          isActive ? `${cfg.dot} h-5` : "h-0 bg-transparent"
        }`}
      />

      <Link
        href={`/${slug}`}
        {...(showControls ? attributes : {})}
        {...(showControls ? listeners : {})}
        className={`flex items-center gap-2 px-2.5 py-[7px] rounded-lg cursor-pointer select-none transition-all duration-150 ${
          isActive
            ? `${cfg.activeBg} shadow-sm`
            : `hover:bg-white/5`
        } ${showControls ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {/* Icon */}
        <span className={`shrink-0 transition-colors duration-150 ${isActive ? cfg.iconColor : "opacity-40 group-hover:opacity-70"}`}>
          <Icon className="w-[15px] h-[15px]" />
        </span>

        {/* Label */}
        <span className={`flex-1 text-[12.5px] font-medium truncate transition-colors duration-150 leading-none ${
          isActive ? cfg.activeText : "opacity-60 group-hover:opacity-90"
        }`}>
          {item.label}
        </span>

        {/* Star — right side */}
        {showControls && (
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(slug, e); }}
            className={`shrink-0 rounded p-0.5 transition-all duration-150 ${
              isFav
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-30 hover:!opacity-100"
            }`}
            title={isFav ? "Unstar" : "Star"}
          >
            {isFav
              ? <StarSolidIcon className="w-3 h-3 text-yellow-400" />
              : <StarIcon className="w-3 h-3" />
            }
          </span>
        )}
      </Link>
    </div>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export default function CommonLayout(props: CommonLayoutProps) {
  const { headerProps, children, onThemeChange } = props;
  const [refreshKey, setRefreshKey] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [menuOrder, setMenuOrder] = useState<string[]>(() => menuItems.map((m) => m.slug));
  const [shareToast, setShareToast] = useState("");
  const [sharing, setSharing] = useState(false);
  const saveOrderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const currentSlug = (router.query.slug || router.query.type || "") as string;
  const { data: session } = useSession();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetchPrefs = useCallback(async () => {
    if (!session) { setFavorites([]); return; }
    try {
      const [favRes, prefRes] = await Promise.all([fetch("/api/favorites"), fetch("/api/preferences")]);
      if (favRes.ok) setFavorites((await favRes.json()).map((f: { toolKey: string }) => f.toolKey));
      if (prefRes.ok) {
        const prefs = await prefRes.json();
        if (Array.isArray(prefs.menuOrder) && prefs.menuOrder.length > 0) {
          const all = menuItems.map((m) => m.slug);
          setMenuOrder([...prefs.menuOrder.filter((s: string) => all.includes(s)), ...all.filter((s) => !prefs.menuOrder.includes(s))]);
        }
      }
    } catch (err) { console.error("[Layout] fetchPrefs:", err); }
  }, [session]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const saveOrder = useCallback((order: string[]) => {
    if (!session) return;
    if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
    saveOrderTimer.current = setTimeout(() => {
      fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ menuOrder: order }) }).catch(console.error);
    }, 800);
  }, [session]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newOrder = arrayMove(menuOrder, menuOrder.indexOf(active.id as string), menuOrder.indexOf(over.id as string));
    setMenuOrder(newOrder);
    saveOrder(newOrder);
  };

  const toggleFavorite = async (toolKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    const isFav = favorites.includes(toolKey);
    setFavorites((prev) => isFav ? prev.filter((k) => k !== toolKey) : [...prev, toolKey]);
    try {
      const res = await fetch("/api/favorites", { method: isFav ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolKey }) });
      if (!res.ok) setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
    } catch {
      setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
    }
  };

  const shareMenu = async () => {
    if (!session) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share-menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ menuOrder, pinnedSlugs: favorites }) });
      if (res.ok) {
        const { shareId } = await res.json();
        await navigator.clipboard.writeText(`${window.location.origin}/shared/${shareId}`);
        setShareToast("✓ Link copied!");
        setTimeout(() => setShareToast(""), 2500);
      }
    } catch {
      setShareToast("Failed to share");
      setTimeout(() => setShareToast(""), 2500);
    } finally { setSharing(false); }
  };

  const handleThemeChange = () => { setRefreshKey((p) => p + 1); onThemeChange?.(); };

  const starredInOrder = menuOrder.filter((s) => favorites.includes(s));
  const unstarredInOrder = menuOrder.filter((s) => !favorites.includes(s));
  const groups = Array.from(new Set(unstarredInOrder.map((s) => menuItems.find((m) => m.slug === s)?.group).filter(Boolean))) as GroupName[];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-white/[0.06] bg-base-100 overflow-hidden">

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={menuOrder} strategy={verticalListSortingStrategy}>
                <nav className="px-2 pt-3 pb-2 flex flex-col gap-4">

                  {/* Starred */}
                  {session && starredInOrder.length > 0 && (
                    <Section label="Starred" emoji="⭐">
                      {starredInOrder.map((slug) => (
                        <SortableItem key={slug} slug={slug} isActive={currentSlug === slug} isFav showControls onToggleFav={toggleFavorite} />
                      ))}
                    </Section>
                  )}

                  {/* Grouped */}
                  {groups.map((group) => {
                    const cfg = groupConfig[group];
                    const slugs = unstarredInOrder.filter((s) => menuItems.find((m) => m.slug === s)?.group === group);
                    if (!slugs.length) return null;
                    return (
                      <Section key={group} label={cfg.label} emoji={cfg.emoji}>
                        {slugs.map((slug) => (
                          <SortableItem key={slug} slug={slug} isActive={currentSlug === slug} isFav={false} showControls={!!session} onToggleFav={toggleFavorite} />
                        ))}
                      </Section>
                    );
                  })}
                </nav>
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-2 py-2 border-t border-white/[0.06] flex flex-col gap-1">
            {/* {session && (
              <button onClick={shareMenu} disabled={sharing}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] opacity-40 hover:opacity-80 transition-all hover:bg-white/5 w-full text-left disabled:opacity-20">
                <ShareIcon className="w-3.5 h-3.5 shrink-0" />
                {sharing ? "Generating…" : "Share my menu"}
              </button>
            )} */}

            {session ? (
              <Link href="/profile"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full transition-all ${currentSlug === "profile" ? "bg-white/10" : "hover:bg-white/5"}`}>
                {session.user?.image
                  ? <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
                  : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0"><UserCircleIcon className="w-3.5 h-3.5 text-white" /></div>
                }
                <div className="min-w-0 text-left">
                  <div className="text-[11px] font-semibold truncate opacity-80">{session.user?.name?.split(" ")[0]}</div>
                  <div className="text-[10px] opacity-30 truncate">{session.user?.email}</div>
                </div>
              </Link>
            ) : (
              <button onClick={() => signIn("google")}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] opacity-40 hover:opacity-80 transition-all hover:bg-white/5 w-full">
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 shrink-0" />
                Sign in
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Analytics debug={process.env.NODE_ENV === "development"} />
          <AnimatePresence mode="wait">
            <motion.div key={refreshKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }} className="flex-1 flex flex-col overflow-hidden">
              {children}
            </motion.div>
          </AnimatePresence>
          <SpeedInsights />

          <AnimatePresence>
            {shareToast && (
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-950/95 backdrop-blur text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap">
                {shareToast}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ label, emoji, children }: { label: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 px-2 mb-0.5">
        <span className="text-[10px] leading-none">{emoji}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] opacity-30">{label}</span>
      </div>
      {children}
    </div>
  );
}
