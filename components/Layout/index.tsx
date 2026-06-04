import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Header, { HeaderProps, menuItems, groupConfig, GroupName } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StarIcon,
  ShareIcon,
  Bars3Icon as GripIcon,
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

// ─── Sortable item ────────────────────────────────────────────────────────────
interface SortableItemProps {
  slug: string;
  isActive: boolean;
  isFav: boolean;
  showControls: boolean;
  onNavigate: (slug: string) => void;
  onToggleFav: (slug: string, e: React.MouseEvent) => void;
}

function SortableItem({ slug, isActive, isFav, showControls, onNavigate, onToggleFav }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slug });

  const item = menuItems.find((m) => m.slug === slug);
  if (!item) return null;

  const Icon = item.icon;
  const cfg = groupConfig[item.group as GroupName];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center rounded-lg border-l-2 transition-all duration-150 ${
        isActive
          ? `${cfg.activeBg} ${cfg.activeBorder} shadow-sm`
          : `border-l-transparent ${cfg.hoverBg}`
      }`}
    >
      {/* Drag grip */}
      {showControls && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 pl-1.5 pr-0.5 py-2 opacity-0 group-hover:opacity-25 hover:!opacity-50 cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
        >
          <GripIcon className="w-3 h-3" />
        </button>
      )}

      {/* Nav button */}
      <button
        onClick={() => onNavigate(slug)}
        className={`flex-1 flex items-center gap-2.5 py-2 text-[13px] font-medium min-w-0 text-left transition-colors ${
          showControls ? "pl-1 pr-1" : "pl-3 pr-3"
        } ${isActive ? cfg.activeText : "opacity-65 hover:opacity-100"}`}
      >
        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? cfg.iconColor : ""}`} />
        <span className="truncate">{item.label}</span>
      </button>

      {/* Star */}
      {showControls && (
        <button
          onClick={(e) => onToggleFav(slug, e)}
          className={`shrink-0 pr-2 py-2 transition-all ${
            isFav
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-40 hover:!opacity-100"
          }`}
          title={isFav ? "Unstar" : "Star"}
        >
          {isFav
            ? <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" />
            : <StarIcon className="w-3.5 h-3.5 hover:text-yellow-400" />
          }
        </button>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchPrefs = useCallback(async () => {
    if (!session) { setFavorites([]); return; }
    try {
      const [favRes, prefRes] = await Promise.all([
        fetch("/api/favorites"),
        fetch("/api/preferences"),
      ]);
      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(data.map((f: { toolKey: string }) => f.toolKey));
      }
      if (prefRes.ok) {
        const prefs = await prefRes.json();
        if (Array.isArray(prefs.menuOrder) && prefs.menuOrder.length > 0) {
          const saved: string[] = prefs.menuOrder;
          const all = menuItems.map((m) => m.slug);
          const merged = [...saved.filter((s) => all.includes(s)), ...all.filter((s) => !saved.includes(s))];
          setMenuOrder(merged);
        }
      }
    } catch (err) {
      console.error("[Layout] fetchPrefs error:", err);
    }
  }, [session]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const saveOrder = useCallback((order: string[]) => {
    if (!session) return;
    if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
    saveOrderTimer.current = setTimeout(() => {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuOrder: order }),
      }).catch(console.error);
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
      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolKey }),
      });
      if (!res.ok) setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
    } catch {
      setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
    }
  };

  const shareMenu = async () => {
    if (!session) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuOrder, pinnedSlugs: favorites }),
      });
      if (res.ok) {
        const { shareId } = await res.json();
        await navigator.clipboard.writeText(`${window.location.origin}/shared/${shareId}`);
        setShareToast("✓ Link copied!");
        setTimeout(() => setShareToast(""), 3000);
      }
    } catch {
      setShareToast("Failed to share");
      setTimeout(() => setShareToast(""), 3000);
    } finally {
      setSharing(false);
    }
  };

  const handleThemeChange = () => {
    setRefreshKey((prev) => prev + 1);
    if (onThemeChange) onThemeChange();
  };

  const handleNavigation = (slug: string) => {
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  // Starred tools float to top; unstarred grouped by category
  const starredInOrder = menuOrder.filter((s) => favorites.includes(s));
  const unstarredInOrder = menuOrder.filter((s) => !favorites.includes(s));

  // Build groups for unstarred
  const groups = Array.from(new Set(
    unstarredInOrder.map((s) => menuItems.find((m) => m.slug === s)?.group).filter(Boolean)
  )) as GroupName[];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'JetBrains Mono', sans-serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ─────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-base-300/50 bg-base-100 overflow-hidden">

          {/* Scrollable nav */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={menuOrder} strategy={verticalListSortingStrategy}>
                <nav className="px-2 py-3 space-y-4">

                  {/* ── Starred section ── */}
                  {session && starredInOrder.length > 0 && (
                    <div>
                      <SectionHeader emoji="⭐" label="Starred" />
                      <div className="space-y-0.5 mt-1">
                        {starredInOrder.map((slug) => (
                          <SortableItem
                            key={slug} slug={slug}
                            isActive={currentSlug === slug}
                            isFav={true}
                            showControls={true}
                            onNavigate={handleNavigation}
                            onToggleFav={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Grouped tools ── */}
                  {groups.map((group) => {
                    const cfg = groupConfig[group];
                    const slugsInGroup = unstarredInOrder.filter(
                      (s) => menuItems.find((m) => m.slug === s)?.group === group
                    );
                    if (!slugsInGroup.length) return null;
                    return (
                      <div key={group}>
                        <SectionHeader emoji={cfg.emoji} label={cfg.label} />
                        <div className="space-y-0.5 mt-1">
                          {slugsInGroup.map((slug) => (
                            <SortableItem
                              key={slug} slug={slug}
                              isActive={currentSlug === slug}
                              isFav={false}
                              showControls={!!session}
                              onNavigate={handleNavigation}
                              onToggleFav={toggleFavorite}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </SortableContext>
            </DndContext>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-base-300/50 p-2 space-y-1">
            {/* Share */}
            {session && (
              <button
                onClick={shareMenu}
                disabled={sharing}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all hover:bg-base-200 opacity-50 hover:opacity-80 disabled:opacity-30"
              >
                <ShareIcon className="w-4 h-4 shrink-0" />
                <span>{sharing ? "Generating…" : "Share my menu"}</span>
              </button>
            )}

            {/* Profile card */}
            {session ? (
              <button
                onClick={() => handleNavigation("profile")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all ${
                  currentSlug === "profile" ? "bg-base-300" : "hover:bg-base-200"
                }`}
              >
                {session.user?.image
                  ? <img src={session.user.image} alt="Profile" className="w-7 h-7 rounded-full object-cover ring-2 ring-base-300 shrink-0" />
                  : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0"><UserCircleIcon className="w-4 h-4 text-white" /></div>
                }
                <div className="text-left min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate">{session.user?.name?.split(" ")[0]}</div>
                  <div className="text-[10px] opacity-40 truncate">{session.user?.email}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all hover:bg-base-200 opacity-60 hover:opacity-100"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
                Sign in
              </button>
            )}

            <p className="text-[10px] opacity-25 text-center pb-1">&copy; {new Date().getFullYear()} DevToolsHub</p>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Analytics debug={process.env.NODE_ENV === "development"} />
          <AnimatePresence mode="wait">
            <motion.div
              key={refreshKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <SpeedInsights />

          {/* Share toast */}
          <AnimatePresence>
            {shareToast && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap"
              >
                {shareToast}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 mb-0.5">
      <span className="text-[11px] leading-none">{emoji}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-35">{label}</span>
    </div>
  );
}
