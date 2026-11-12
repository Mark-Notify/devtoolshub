import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useUiPrefs } from "hooks/useUiPrefs";

// One-time suggestion shown to returning users who are still on the Classic
// layout. Disappears for good once they try Glass, switch template or close it.
export default function GlassTip() {
  const { ready, template, showGlassTip, tryGlass, dismissGlassTip } = useUiPrefs();
  const open = ready && template === "classic" && showGlassTip;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 30, delay: 0.6 } }}
          exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } }}
          className="absolute top-3 right-3 left-3 sm:left-auto sm:w-[320px] z-40 rounded-xl border border-base-content/10 bg-base-100/95 backdrop-blur shadow-2xl p-3.5"
        >
          <button
            type="button"
            onClick={dismissGlassTip}
            className="absolute top-2 right-2 p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-base-content/10"
            aria-label="Dismiss tip"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <div className="flex gap-3 pr-5">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-violet-500 to-pink-500 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Try the new Glass layout</div>
              <p className="text-xs opacity-60 mt-0.5 leading-relaxed">
                A fresh look for all your tools. You can switch back anytime from the button at the top right.
              </p>
              <div className="flex gap-2 mt-2.5">
                <button type="button" className="btn btn-primary btn-xs" onClick={tryGlass}>Try Glass</button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={dismissGlassTip}>Not now</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
