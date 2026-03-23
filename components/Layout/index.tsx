import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import Header, { HeaderProps, menuItems } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
  onThemeChange?: () => void;
}

export default function CommonLayout(props: CommonLayoutProps) {
  const { headerProps, children, onThemeChange } = props;
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const currentSlug = router.query.slug || router.query.type || "";

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
              return (
                <motion.button
                  key={item.slug}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.22 }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation(item.slug)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative overflow-hidden ${
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
              );
            })}
          </nav>
          <div className="p-2 border-t border-gray-700/30 text-center">
            <p className="text-[10px] opacity-40">
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
