"use client";
import { useState, useCallback } from "react";
import { toastSuccess } from "../../lib/swal";

// ─── conversion helpers ───────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

interface ColorState { hex: string; r: number; g: number; b: number; h: number; s: number; l: number; }

function fromHex(hex: string): ColorState | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);
  return { hex, r, g, b, h, s, l };
}

const PRESETS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#000000","#6b7280"];

export default function ColorConverter() {
  const [color, setColor] = useState<ColorState>(fromHex("#3b82f6")!);
  const [hexInput, setHexInput] = useState("#3b82f6");

  const updateFromHex = useCallback((hex: string) => {
    setHexInput(hex);
    const c = fromHex(hex.startsWith("#") ? hex : "#" + hex);
    if (c) setColor(c);
  }, []);

  const updateFromRgb = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    const [h, s, l] = rgbToHsl(r, g, b);
    setColor({ hex, r, g, b, h, s, l });
    setHexInput(hex);
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l);
    const hex = rgbToHex(r, g, b);
    setColor({ hex, r, g, b, h, s, l });
    setHexInput(hex);
  };

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toastSuccess(`${label} copied!`);
  };

  const formats = [
    { label: "HEX", value: color.hex.toUpperCase() },
    { label: "RGB", value: `rgb(${color.r}, ${color.g}, ${color.b})` },
    { label: "HSL", value: `hsl(${color.h}, ${color.s}%, ${color.l}%)` },
    { label: "RGB Raw", value: `${color.r}, ${color.g}, ${color.b}` },
    { label: "Tailwind-like", value: `rgba(${color.r},${color.g},${color.b},1)` },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-4">
      {/* Color preview + native picker */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl shadow-lg border border-white/10" style={{ background: color.hex }} />
        <div className="flex flex-col gap-1">
          <input
            type="color"
            value={color.hex}
            onChange={(e) => updateFromHex(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            title="Color picker"
          />
          <span className="text-xs opacity-50">Click to pick</span>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs opacity-60">HEX</label>
          <input
            className="input input-bordered font-mono text-sm w-36"
            value={hexInput}
            onChange={(e) => updateFromHex(e.target.value)}
            placeholder="#rrggbb"
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 gap-3">
        {/* RGB */}
        <div className="bg-base-200 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-xs font-bold text-blue-400">RGB</span>
          {(["r","g","b"] as const).map((ch, i) => (
            <div key={ch} className="flex items-center gap-2">
              <span className="text-xs w-4 opacity-60">{ch.toUpperCase()}</span>
              <input
                type="range" min={0} max={255}
                value={color[ch]}
                onChange={(e) => { const v = Number(e.target.value); const rgb: [number,number,number] = [color.r, color.g, color.b]; rgb[i] = v; updateFromRgb(...rgb); }}
                className="flex-1"
              />
              <input
                type="number" min={0} max={255}
                value={color[ch]}
                onChange={(e) => { const v = Math.min(255, Math.max(0, Number(e.target.value))); const rgb: [number,number,number] = [color.r, color.g, color.b]; rgb[i] = v; updateFromRgb(...rgb); }}
                className="input input-bordered input-xs w-16 font-mono"
              />
            </div>
          ))}
        </div>

        {/* HSL */}
        <div className="bg-base-200 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-xs font-bold text-purple-400">HSL</span>
          {([["h",360],["s",100],["l",100]] as [keyof ColorState, number][]).map(([ch, max]) => (
            <div key={ch} className="flex items-center gap-2">
              <span className="text-xs w-4 opacity-60">{String(ch).toUpperCase()}</span>
              <input
                type="range" min={0} max={max}
                value={color[ch] as number}
                onChange={(e) => { const v = Number(e.target.value); const hsl: [number,number,number] = [color.h, color.s, color.l]; hsl[["h","s","l"].indexOf(ch as string)] = v; updateFromHsl(...hsl); }}
                className="flex-1"
              />
              <input
                type="number" min={0} max={max}
                value={color[ch] as number}
                onChange={(e) => { const v = Math.min(max, Math.max(0, Number(e.target.value))); const hsl: [number,number,number] = [color.h, color.s, color.l]; hsl[["h","s","l"].indexOf(ch as string)] = v; updateFromHsl(...hsl); }}
                className="input input-bordered input-xs w-16 font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Formats */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">All Formats</label>
        {formats.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-blue-400 w-24">{label}</span>
            <span className="font-mono text-xs flex-1">{value}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => copy(value, label)}>Copy</button>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Presets</label>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              className="w-8 h-8 rounded-lg border border-white/10 shadow"
              style={{ background: p }}
              onClick={() => updateFromHex(p)}
              title={p}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
