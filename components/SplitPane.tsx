"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

const MOBILE_BREAKPOINT = 1024;

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultSplit?: number;
}

export default function SplitPane({ left, right, defaultSplit = 40 }: SplitPaneProps) {
  const [splitPercent, setSplitPercent] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(15, Math.min(85, pct));
      setSplitPercent(pct);
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const onTouchStart = useCallback((_e: React.TouchEvent) => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      let pct = ((touch.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(15, Math.min(85, pct));
      setSplitPercent(pct);
    };
    const onTouchEnd = () => setIsDragging(false);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging]);

  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden flex-1">{left}</div>
        <div className="h-2 shrink-0 bg-gray-700/30 flex items-center justify-center">
          <div className="h-0.5 w-8 bg-gray-400/50 rounded-full" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">{right}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden relative"
      style={{ cursor: isDragging ? "col-resize" : undefined }}
    >
      <div className="flex flex-col overflow-hidden" style={{ width: `${splitPercent}%` }}>
        {left}
      </div>

      <div
        className="w-2 shrink-0 bg-gray-700/30 hover:bg-blue-500/60 active:bg-blue-500/80 transition-colors flex items-center justify-center"
        style={{ cursor: "col-resize", touchAction: "none" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="w-0.5 h-8 bg-gray-400/50 rounded-full" />
      </div>

      <div className="flex flex-col overflow-hidden" style={{ width: `${100 - splitPercent}%` }}>
        {right}
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-10" style={{ cursor: "col-resize" }} />
      )}
    </div>
  );
}
