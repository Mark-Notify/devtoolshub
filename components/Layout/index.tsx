import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Header, { HeaderProps, menuItems } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
  onThemeChange?: () => void;
}

export default function CommonLayout(props: CommonLayoutProps) {
  const { headerProps, children, onThemeChange } = props;
  const [refreshKey, setRefreshKey] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();
  const currentSlug = router.query.slug || router.query.type || "";
  const { data: session } = useSession();

  const fetchFavorites = useCallback(async () => {
    if (!session) { setFavorites([]); return; }
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.map((f: { toolKey: string }) => f.toolKey));
      }
    } catch { /* ignore */ }
  }, [session]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = async (toolKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    const isFav = favorites.includes(toolKey);
    setFavorites((prev) =>
      isFav ? prev.filter((k) => k !== toolKey) : [...prev, toolKey]
    );
    await fetch("/api/favorites", {
      method: isFav ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey }),
    });
  };

  const handleThemeChange = () => {
    setRefreshKey((prev) => prev + 1);
    if (onThemeChange) {
      onThemeChange();
    }
  };

  const handleNavigation = (slug: string) => {
    router.push(`/${slug}`, undefined, { shallow: true });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'JetBrains Mono', sans-serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-48 shrink-0 border-r border-gray-700/30 bg-base-100 overflow-y-auto">
          <nav className="p-2 space-y-0.5 flex-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentSlug === item.slug;
              const isFav = favorites.includes(item.slug);
              return (
                <div key={item.slug} className="relative group">
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNavigation(item.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative overflow-hidden pr-8 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-500/10"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-active-indicator"
                        className="absolute inset-0 rounded-lg bg-blue-600"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 shrink-0 relative z-10" />
                    <span className="truncate relative z-10">{item.label}</span>
                  </motion.button>
                  {session && (
                    <button
                      onClick={(e) => toggleFavorite(item.slug, e)}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 ${
                        isFav ? "opacity-100 text-yellow-500" : "hover:text-yellow-500"
                      }`}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
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
            })}
          </nav>
          <div className="p-2 border-t border-gray-700/30 space-y-1">
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
              <span className="truncate">{session?.user?.name?.split(" ")[0] ?? "Profile"}</span>
            </motion.button>
            <p className="text-[10px] opacity-40 text-center">
              &copy; {new Date().getFullYear()} DevToolsHub
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Analytics debug={process.env.NODE_ENV === "development"} />
          <AnimatePresence mode="wait">
            <motion.div
              key={refreshKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <SpeedInsights />
        </main>
      </div>
    </div>
  );
}
