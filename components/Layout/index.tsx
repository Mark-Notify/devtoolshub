import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Header, { HeaderProps, menuItems } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon, ShareIcon, Bars3Icon as DragIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
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

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
  onThemeChange?: () => void;
}

// ─── Sortable menu item ───────────────────────────────────────────────────────
interface SortableItemProps {
  slug: string;
  isActive: boolean;
  isFav: boolean;
  showStar: boolean;
  onNavigate: (slug: string) => void;
  onToggleFav: (slug: string, e: React.MouseEvent) => void;
}

function SortableItem({ slug, isActive, isFav, showStar, onNavigate, onToggleFav }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug });

  const item = menuItems.find((m) => m.slug === slug);
  if (!item) return null;
  const Icon = item.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-center rounded-lg ${isActive ? "bg-blue-600 text-white shadow-sm" : "hover:bg-gray-500/10"}`}
    >
      {/* Drag handle — only shown when logged in */}
      {showStar && (
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 pl-2 opacity-0 group-hover:opacity-30 hover:!opacity-60 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <DragIcon className="w-3 h-3" />
        </button>
      )}

      {/* Nav button */}
      <button
        onClick={() => onNavigate(slug)}
        className="flex-1 flex items-center gap-2 px-2 py-2 text-sm min-w-0 text-left"
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>

      {/* Star button */}
      {showStar && (
        <button
          onClick={(e) => onToggleFav(slug, e)}
          className={`p-1.5 pr-2 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isFav ? "!opacity-100 text-yellow-500" : "hover:text-yellow-500"}`}
          title={isFav ? "Unstar" : "Star"}
        >
          {isFav ? (
            <StarSolidIcon className="w-3.5 h-3.5 text-yellow-500" />
          ) : (
            <StarIcon className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
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

  // Load favorites + menu order from server
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
          // Merge: add any new slugs not in saved order
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

  // Debounced save order to DB
  const saveOrder = useCallback((order: string[]) => {
    if (!session) return;
    if (saveOrderTimer.current) clearTimeout(saveOrderTimer.current);
    saveOrderTimer.current = setTimeout(() => {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuOrder: order }),
      }).catch((e) => console.error("[Layout] saveOrder error:", e));
    }, 800);
  }, [session]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menuOrder.indexOf(active.id as string);
    const newIndex = menuOrder.indexOf(over.id as string);
    const newOrder = arrayMove(menuOrder, oldIndex, newIndex);
    setMenuOrder(newOrder);
    saveOrder(newOrder);
  };

  const toggleFavorite = async (toolKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    const isFav = favorites.includes(toolKey);
    // Optimistic update
    setFavorites((prev) => isFav ? prev.filter((k) => k !== toolKey) : [...prev, toolKey]);
    try {
      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolKey }),
      });
      if (!res.ok) {
        // Rollback on error
        setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
        console.error("[Layout] toggleFavorite failed:", res.status);
      }
    } catch (err) {
      // Rollback on network error
      setFavorites((prev) => isFav ? [...prev, toolKey] : prev.filter((k) => k !== toolKey));
      console.error("[Layout] toggleFavorite error:", err);
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
        const url = `${window.location.origin}/shared/${shareId}`;
        await navigator.clipboard.writeText(url);
        setShareToast("Link copied to clipboard!");
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

  // Split menu: starred tools float to top section, rest below
  const starredInOrder = menuOrder.filter((s) => favorites.includes(s));
  const unstarredInOrder = menuOrder.filter((s) => !favorites.includes(s));

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'JetBrains Mono', sans-serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-gray-700/30 bg-base-100 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={menuOrder} strategy={verticalListSortingStrategy}>
                <nav className="p-2 space-y-0.5">
                  {/* Starred section */}
                  {session && starredInOrder.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-widest opacity-40 px-2 py-1 flex items-center gap-1">
                        <StarSolidIcon className="w-2.5 h-2.5 text-yellow-500" /> Starred
                      </div>
                      {starredInOrder.map((slug) => (
                        <SortableItem
                          key={slug}
                          slug={slug}
                          isActive={currentSlug === slug}
                          isFav={true}
                          showStar={!!session}
                          onNavigate={handleNavigation}
                          onToggleFav={toggleFavorite}
                        />
                      ))}
                      <div className="border-t border-gray-700/20 my-1" />
                    </>
                  )}

                  {/* All tools (unstarred) */}
                  {unstarredInOrder.map((slug) => (
                    <SortableItem
                      key={slug}
                      slug={slug}
                      isActive={currentSlug === slug}
                      isFav={false}
                      showStar={!!session}
                      onNavigate={handleNavigation}
                      onToggleFav={toggleFavorite}
                    />
                  ))}
                </nav>
              </SortableContext>
            </DndContext>
          </div>

          {/* Bottom bar */}
          <div className="p-2 border-t border-gray-700/30 space-y-1 shrink-0">
            {/* Share button */}
            {session && (
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={shareMenu}
                disabled={sharing}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-500/10 transition-colors opacity-60 hover:opacity-100"
                title="Share your menu layout"
              >
                <ShareIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{sharing ? "Sharing…" : "Share my menu"}</span>
              </motion.button>
            )}

            {/* Profile */}
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleNavigation("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentSlug === "profile" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-gray-500/10"
              }`}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-4 h-4 rounded-full shrink-0 object-cover" />
              ) : (
                <UserCircleIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{session?.user?.name?.split(" ")[0] ?? "Profile"}</span>
            </motion.button>
            <p className="text-[10px] opacity-40 text-center">&copy; {new Date().getFullYear()} DevToolsHub</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Analytics debug={process.env.NODE_ENV === "development"} />
          <AnimatePresence mode="wait">
            <motion.div
              key={refreshKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg border border-gray-700"
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
