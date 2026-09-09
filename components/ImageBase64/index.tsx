"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  MapPinIcon,
  PhotoIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toastError, toastSuccess } from "../../lib/swal";
import {
  ContainerInfo,
  InfoRow,
  ORIENTATION_NAMES,
  aspectRatio,
  base64ToBytes,
  bytesToBase64,
  humanBytes,
  inspectBytes,
  parseBase64Input,
} from "../../lib/imageInfo";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB — the data URL lives in browser memory
const SAMPLE_EDGE = 240; // pixels are analysed on a downscaled copy of the image

type Mode = "encode" | "decode";

type Asset = {
  base64: string;
  mime: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  lastModified: number | null;
  source: "upload" | "base64";
  container: ContainerInfo;
};

type Dimensions = { width: number; height: number };

type PixelStats = {
  average: string;
  averageRgb: string;
  brightness: number;
  luminance: number;
  grayscale: boolean;
  hasAlpha: boolean;
  transparentPct: number;
  sampledColors: number;
  dominant: { hex: string; pct: number }[];
};

// ─── small helpers ────────────────────────────────────────────
const hex2 = (n: number) => n.toString(16).padStart(2, "0");
const toHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

function baseName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Read the intrinsic size of an image from its data URL. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Browser could not decode this image"));
    img.src = dataUrl;
  });
}

/** Average / dominant colors and transparency, measured on a downscaled copy. */
function analysePixels(img: HTMLImageElement): PixelStats | null {
  const scale = Math.min(1, SAMPLE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null; // tainted canvas — should not happen for data: URLs
  }

  let rs = 0, gs = 0, bs = 0, opaque = 0, transparent = 0;
  let grayscale = true;
  let hasAlpha = false;
  const buckets: Record<number, number> = {};
  const exact: Record<number, boolean> = {};
  let exactCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 255) hasAlpha = true;
    if (a < 16) { transparent++; continue; }
    opaque++;
    rs += r; gs += g; bs += b;
    if (Math.abs(r - g) > 8 || Math.abs(g - b) > 8 || Math.abs(r - b) > 8) grayscale = false;

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    buckets[key] = (buckets[key] || 0) + 1;
    const exactKey = (r << 16) | (g << 8) | b;
    if (!exact[exactKey]) { exact[exactKey] = true; exactCount++; }
  }

  const total = opaque + transparent;
  if (!opaque) {
    return {
      average: "#000000", averageRgb: "rgba(0, 0, 0, 0)", brightness: 0, luminance: 0,
      grayscale: true, hasAlpha: true, transparentPct: 100, sampledColors: 0, dominant: [],
    };
  }

  const ar = Math.round(rs / opaque);
  const ag = Math.round(gs / opaque);
  const ab = Math.round(bs / opaque);

  const dominant = Object.keys(buckets)
    .map((k) => ({ key: Number(k), count: buckets[Number(k)] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ key, count }) => ({
      // Re-expand the 4-bit bucket to the middle of its range.
      hex: toHex((((key >> 8) & 0xf) << 4) | 8, (((key >> 4) & 0xf) << 4) | 8, ((key & 0xf) << 4) | 8),
      pct: Math.round((count / opaque) * 1000) / 10,
    }));

  return {
    average: toHex(ar, ag, ab),
    averageRgb: `rgb(${ar}, ${ag}, ${ab})`,
    brightness: Math.round((ar + ag + ab) / 3),
    luminance: Math.round(0.2126 * ar + 0.7152 * ag + 0.0722 * ab),
    grayscale,
    hasAlpha,
    transparentPct: Math.round((transparent / total) * 1000) / 10,
    sampledColors: exactCount,
    dominant,
  };
}

// ─── info rendering ───────────────────────────────────────────
const ACCENTS: Record<string, string> = {
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  violet: "text-violet-400",
  orange: "text-orange-400",
  rose: "text-rose-400",
};

function InfoSection({
  title, rows, accent, onCopy,
}: { title: string; rows: InfoRow[]; accent: string; onCopy: (v: string, l: string) => void }) {
  if (!rows.length) return null;
  return (
    <div className="border border-base-300 rounded-xl overflow-hidden">
      <div className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide bg-base-200/60 ${ACCENTS[accent] || ""}`}>
        {title}
      </div>
      <div className="divide-y divide-base-300/60">
        {rows.map((row, i) => (
          <div key={`${row.label}-${i}`} className="group flex items-start gap-2 px-3 py-1.5">
            <span className="text-xs opacity-55 w-36 shrink-0 leading-relaxed">{row.label}</span>
            <span className="font-mono text-xs flex-1 break-all leading-relaxed">{row.value}</span>
            <button
              className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
              title={`Copy ${row.label}`}
              onClick={() => onCopy(row.value, row.label)}
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────
export default function ImageBase64() {
  const [mode, setMode] = useState<Mode>("encode");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [pixels, setPixels] = useState<PixelStats | null>(null);
  const [renderable, setRenderable] = useState(true);
  const [base64Input, setBase64Input] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fitPreview, setFitPreview] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setAsset(null);
    setDims(null);
    setPixels(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const copy = useCallback((value: string, label: string) => {
    if (!value) { toastError("ไม่มีข้อมูลให้คัดลอก"); return; }
    navigator.clipboard.writeText(value)
      .then(() => toastSuccess(`คัดลอก ${label} แล้ว`))
      .catch(() => toastError("คัดลอกไม่สำเร็จ"));
  }, []);

  /** Build the asset from raw bytes + a base64 payload, then measure it. */
  const applyAsset = useCallback(async (next: Asset) => {
    setAsset(next);
    setDims(null);
    setPixels(null);
    setRenderable(true);
    try {
      const img = await loadImage(next.dataUrl);
      setDims({ width: img.naturalWidth, height: img.naturalHeight });
      setPixels(analysePixels(img));
    } catch {
      setRenderable(false);
      // Container info is still useful even when the browser cannot render it
      // (HEIC on some browsers, corrupt payloads, …).
      setError("เบราว์เซอร์แสดงผลรูปนี้ไม่ได้ — แต่ยังอ่าน metadata จากไฟล์ได้");
    }
  }, []);

  // ── upload path ──
  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toastError(`ไฟล์ใหญ่เกินไป (สูงสุด ${humanBytes(MAX_SIZE)})`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const container = inspectBytes(bytes);
      if (!container.format && !file.type.startsWith("image/")) {
        setError("ไฟล์นี้ไม่ใช่รูปภาพที่รู้จัก");
        setBusy(false);
        return;
      }
      const mime = container.format?.mime || file.type || "application/octet-stream";
      const base64 = bytesToBase64(bytes);
      await applyAsset({
        base64,
        mime,
        dataUrl: `data:${mime};base64,${base64}`,
        fileName: file.name,
        fileSize: bytes.length,
        lastModified: file.lastModified || null,
        source: "upload",
        container,
      });
      setMode("encode");
    } catch (err) {
      console.error("[ImageBase64] read failed:", err);
      setError(`อ่านไฟล์ไม่สำเร็จ: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [applyAsset]);

  // ── decode path (auto-runs while typing / pasting) ──
  const decodeBase64 = useCallback(async (raw: string) => {
    if (!raw.trim()) { reset(); return; }
    const parsed = parseBase64Input(raw);
    if (!parsed) {
      setError("อ่านไม่ออก — วาง data URL หรือสตริง Base64 ของรูปภาพ");
      setAsset(null);
      setDims(null);
      setPixels(null);
      return;
    }
    try {
      const bytes = base64ToBytes(parsed.base64);
      const container = inspectBytes(bytes);
      if (!container.format && !parsed.mime.startsWith("image/")) {
        setError("ถอดรหัสได้ แต่ข้อมูลนี้ไม่ใช่รูปภาพที่รู้จัก");
        setAsset(null);
        setDims(null);
        setPixels(null);
        return;
      }
      setError("");
      // Trust the magic bytes over a hand-typed data URL MIME.
      const mime = container.format?.mime || parsed.mime;
      const ext = container.format?.ext || "bin";
      await applyAsset({
        base64: parsed.base64,
        mime,
        dataUrl: `data:${mime};base64,${parsed.base64}`,
        fileName: `pasted-image.${ext}`,
        fileSize: bytes.length,
        lastModified: null,
        source: "base64",
        container,
      });
    } catch (err) {
      setError(`ถอดรหัส Base64 ไม่สำเร็จ: ${(err as Error).message}`);
      setAsset(null);
      setDims(null);
      setPixels(null);
    }
  }, [applyAsset, reset]);

  const onBase64Change = (value: string) => {
    setBase64Input(value);
    decodeBase64(value);
  };

  // Paste an image straight from the clipboard, anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files || []).find((f) => f.type.startsWith("image/"));
      if (file) { e.preventDefault(); handleFile(file); }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const download = () => {
    if (!asset) return;
    const a = document.createElement("a");
    a.href = asset.dataUrl;
    a.download = asset.fileName;
    a.click();
  };

  const downloadText = () => {
    if (!asset) return;
    const blob = new Blob([asset.dataUrl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(asset.fileName)}.base64.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── derived info rows ──
  const fileRows = useMemo<InfoRow[]>(() => {
    if (!asset) return [];
    const rows: InfoRow[] = [
      { label: "Source", value: asset.source === "upload" ? "Uploaded file" : "Pasted Base64" },
      { label: "File name", value: asset.fileName },
      { label: "MIME type", value: asset.mime },
      { label: "Format", value: asset.container.format?.label || "Unknown / not detected" },
      { label: "Extension", value: `.${asset.container.format?.ext || "?"}` },
      { label: "File size", value: `${humanBytes(asset.fileSize)} (${asset.fileSize.toLocaleString()} bytes)` },
    ];
    if (asset.lastModified) {
      rows.push({ label: "Last modified", value: new Date(asset.lastModified).toLocaleString() });
    }
    return rows;
  }, [asset]);

  const base64Rows = useMemo<InfoRow[]>(() => {
    if (!asset) return [];
    const prefix = `data:${asset.mime};base64,`;
    const padding = (asset.base64.match(/=+$/) || [""])[0].length;
    const overhead = asset.fileSize ? ((asset.base64.length / asset.fileSize - 1) * 100).toFixed(1) : "0";
    return [
      { label: "Data URL prefix", value: prefix },
      { label: "Base64 length", value: `${asset.base64.length.toLocaleString()} chars` },
      { label: "Data URL length", value: `${(prefix.length + asset.base64.length).toLocaleString()} chars` },
      { label: "Encoded size", value: humanBytes(asset.base64.length) },
      { label: "Size overhead", value: `+${overhead}% vs binary` },
      { label: "Padding", value: padding ? `${padding} x "="` : "none" },
      { label: "Alphabet", value: /[-_]/.test(asset.base64) ? "URL-safe (-, _)" : "Standard (+, /)" },
    ];
  }, [asset]);

  const dimensionRows = useMemo<InfoRow[]>(() => {
    if (!dims) return [];
    const { width, height } = dims;
    const px = width * height;
    const rows: InfoRow[] = [
      { label: "Dimensions", value: `${width} x ${height} px` },
      { label: "Aspect ratio", value: `${aspectRatio(width, height)} (${(width / height).toFixed(4)})` },
      { label: "Orientation", value: width > height ? "Landscape" : width < height ? "Portrait" : "Square" },
      { label: "Total pixels", value: `${px.toLocaleString()} px` },
      { label: "Megapixels", value: `${(px / 1e6).toFixed(px < 1e5 ? 4 : 2)} MP` },
      { label: "Uncompressed RGBA", value: humanBytes(px * 4) },
    ];
    if (asset?.fileSize) {
      rows.push({ label: "Compression ratio", value: `${((px * 4) / asset.fileSize).toFixed(1)} : 1` });
      rows.push({ label: "Bytes per pixel", value: `${(asset.fileSize / px).toFixed(3)} B/px` });
    }
    const orientation = asset?.container.exif.orientation;
    if (orientation) {
      rows.push({ label: "EXIF orientation", value: `${ORIENTATION_NAMES[orientation] || "Unknown"} (${orientation})` });
    }
    return rows;
  }, [dims, asset]);

  const colorRows = useMemo<InfoRow[]>(() => {
    if (!pixels) return [];
    return [
      { label: "Average color", value: `${pixels.average} · ${pixels.averageRgb}` },
      { label: "Brightness", value: `${pixels.brightness} / 255 (${Math.round((pixels.brightness / 255) * 100)}%)` },
      { label: "Perceived luminance", value: `${pixels.luminance} / 255 — ${pixels.luminance > 140 ? "light image" : "dark image"}` },
      { label: "Grayscale", value: pixels.grayscale ? "Yes — no visible color channels" : "No — colored" },
      { label: "Alpha channel", value: pixels.hasAlpha ? "Yes — has transparent pixels" : "No — fully opaque" },
      { label: "Transparent area", value: `${pixels.transparentPct}%` },
      { label: "Distinct colors", value: `~${pixels.sampledColors.toLocaleString()} (sampled at ${SAMPLE_EDGE}px)` },
    ];
  }, [pixels]);

  const allInfo = useMemo(() => {
    if (!asset) return "";
    const sections: [string, InfoRow[]][] = [
      ["File", fileRows],
      ["Base64", base64Rows],
      ["Image", dimensionRows],
      ["Color analysis", colorRows],
      [`Format details (${asset.container.format?.ext.toUpperCase() || "?"})`, asset.container.formatRows],
      ["EXIF / camera", asset.container.exif.rows],
      ["Location (GPS)", asset.container.exif.gpsRows],
    ];
    return sections
      .filter(([, rows]) => rows.length)
      .map(([title, rows]) => `# ${title}\n${rows.map((r) => `${r.label}: ${r.value}`).join("\n")}`)
      .join("\n\n");
  }, [asset, fileRows, base64Rows, dimensionRows, colorRows]);

  const gps = asset?.container.exif.gps || null;

  // ── render ──
  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-4">

        {/* Intro */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shrink-0">
            <PhotoIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Image ↔ Base64</h1>
            <p className="text-xs opacity-60 mt-0.5">
              อัปโหลดรูปเพื่อแปลงเป็น Base64 หรือวาง Base64 / data URL เพื่อ render กลับเป็นรูป
              พร้อมอ่านข้อมูลของรูปทั้งหมด — ทำงานในเบราว์เซอร์ ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์
            </p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="tabs tabs-boxed bg-base-200/60 self-start">
          <button
            className={`tab tab-sm gap-1.5 ${mode === "encode" ? "tab-active" : ""}`}
            onClick={() => setMode("encode")}
          >
            <PhotoIcon className="w-4 h-4" /> รูป → Base64
          </button>
          <button
            className={`tab tab-sm gap-1.5 ${mode === "decode" ? "tab-active" : ""}`}
            onClick={() => setMode("decode")}
          >
            <Squares2X2Icon className="w-4 h-4" /> Base64 → รูป
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Left: input ── */}
          <div className="flex flex-col gap-3">
            {mode === "encode" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl px-5 py-8 text-center cursor-pointer transition-all ${
                  dragging ? "border-emerald-400 bg-emerald-500/10" : "border-base-300 hover:border-emerald-400/60 hover:bg-base-200/40"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {busy
                  ? <ArrowPathIcon className="w-8 h-8 mx-auto opacity-40 animate-spin" />
                  : <PhotoIcon className="w-8 h-8 mx-auto opacity-40" />}
                <div className="mt-2 text-sm font-medium">คลิกเพื่อเลือกรูป ลากมาวาง หรือกด Ctrl+V</div>
                <div className="text-xs opacity-50 mt-0.5">
                  PNG · JPEG · GIF · WebP · SVG · BMP · ICO · AVIF — สูงสุด {humanBytes(MAX_SIZE)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold opacity-60">วาง Base64 หรือ data URL</label>
                <textarea
                  className="textarea textarea-bordered font-mono text-xs h-40 resize-y"
                  placeholder={'data:image/png;base64,iVBORw0KGgo...\nหรือวางเฉพาะสตริง Base64 / <img src="..."> / url(...)'}
                  value={base64Input}
                  onChange={(e) => onBase64Change(e.target.value)}
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-ghost border" onClick={() => { setBase64Input(""); reset(); }}>
                    ล้าง
                  </button>
                  <span className="text-[11px] opacity-45 self-center">
                    render อัตโนมัติทันทีที่วาง
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-warning text-sm py-2.5">
                <XMarkIcon className="w-4 h-4 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}

            {/* Base64 output */}
            {asset && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold opacity-60">Base64 / data URL</label>
                  <span className="text-[11px] opacity-45 font-mono">
                    {asset.base64.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  className="textarea textarea-bordered font-mono text-[11px] h-32 resize-y bg-base-200/40"
                  value={asset.dataUrl}
                  readOnly
                  spellCheck={false}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-accent" onClick={() => copy(asset.dataUrl, "Data URL")}>
                    <ClipboardDocumentIcon className="w-4 h-4" /> Copy Data URL
                  </button>
                  <button className="btn btn-sm btn-ghost border" onClick={() => copy(asset.base64, "Base64")}>
                    Copy Base64 ล้วน
                  </button>
                  <button
                    className="btn btn-sm btn-ghost border"
                    onClick={() => copy(`<img src="${asset.dataUrl}" alt="" />`, "&lt;img&gt; tag")}
                  >
                    Copy &lt;img&gt;
                  </button>
                  <button
                    className="btn btn-sm btn-ghost border"
                    onClick={() => copy(`background-image: url("${asset.dataUrl}");`, "CSS")}
                  >
                    Copy CSS
                  </button>
                  <button
                    className="btn btn-sm btn-ghost border"
                    onClick={() => copy(`![${baseName(asset.fileName)}](${asset.dataUrl})`, "Markdown")}
                  >
                    Copy Markdown
                  </button>
                  <button className="btn btn-sm btn-ghost border" onClick={downloadText}>
                    <ArrowDownTrayIcon className="w-4 h-4" /> .txt
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: preview ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold opacity-60">Preview</label>
              {asset && (
                <div className="flex gap-1">
                  <button
                    className="btn btn-xs btn-ghost border"
                    onClick={() => setFitPreview((f) => !f)}
                    title="สลับระหว่างย่อให้พอดีกับขนาดจริง"
                  >
                    {fitPreview ? "ขนาดจริง (1:1)" : "ย่อให้พอดี"}
                  </button>
                  <button className="btn btn-xs btn-ghost border" onClick={download}>
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" /> ดาวน์โหลดรูป
                  </button>
                  <button className="btn btn-xs btn-ghost border" onClick={() => { setBase64Input(""); reset(); }}>
                    ล้าง
                  </button>
                </div>
              )}
            </div>

            <div
              className="border border-base-300 rounded-2xl min-h-[240px] flex items-center justify-center overflow-auto p-3"
              style={{
                // Checkerboard so transparency is visible.
                backgroundImage:
                  "linear-gradient(45deg, rgba(128,128,128,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.18) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              {asset && renderable ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.dataUrl}
                  alt={asset.fileName}
                  className={fitPreview ? "max-w-full max-h-[420px] object-contain" : "max-w-none"}
                />
              ) : (
                <div className="text-center opacity-40 text-xs px-6">
                  <PhotoIcon className="w-10 h-10 mx-auto mb-2" />
                  {asset
                    ? "เบราว์เซอร์นี้แสดงผลไฟล์ดังกล่าวไม่ได้ — ดูข้อมูลของไฟล์ด้านล่างแทน"
                    : "ยังไม่มีรูป — อัปโหลดหรือวาง Base64 เพื่อดูตัวอย่างที่นี่"}
                </div>
              )}
            </div>

            {/* Color swatches */}
            {pixels && pixels.dominant.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] opacity-50">สีเด่น:</span>
                <button
                  className="w-7 h-7 rounded-lg border border-white/10 shadow"
                  style={{ background: pixels.average }}
                  title={`Average ${pixels.average} — คลิกเพื่อคัดลอก`}
                  onClick={() => copy(pixels.average, "Average color")}
                />
                <span className="text-[11px] opacity-40">|</span>
                {pixels.dominant.map((d, i) => (
                  <button
                    key={`${d.hex}-${i}`}
                    className="w-7 h-7 rounded-lg border border-white/10 shadow"
                    style={{ background: d.hex }}
                    title={`${d.hex} — ${d.pct}% — คลิกเพื่อคัดลอก`}
                    onClick={() => copy(d.hex, d.hex)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Image info ── */}
        {asset && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Image Info</h2>
              <button className="btn btn-xs btn-ghost border" onClick={() => copy(allInfo, "ข้อมูลรูปทั้งหมด")}>
                <ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy ทั้งหมด
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoSection title="File" rows={fileRows} accent="blue" onCopy={copy} />
              <InfoSection title="Base64" rows={base64Rows} accent="emerald" onCopy={copy} />
              <InfoSection title="Image" rows={dimensionRows} accent="violet" onCopy={copy} />
              <InfoSection title="Color analysis" rows={colorRows} accent="orange" onCopy={copy} />
              <InfoSection
                title={`Format details — ${asset.container.format?.ext.toUpperCase() || "unknown"}`}
                rows={asset.container.formatRows}
                accent="blue"
                onCopy={copy}
              />
              <InfoSection title="EXIF / camera" rows={asset.container.exif.rows} accent="rose" onCopy={copy} />
            </div>

            {/* Where was this taken — the most interesting EXIF answer, so it gets its own card. */}
            {asset.container.exif.gpsRows.length > 0 && (
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5" /> Location — ถ่ายที่ไหน
                </div>
                <div className="divide-y divide-base-300/60">
                  {asset.container.exif.gpsRows.map((row, i) => (
                    <div key={`${row.label}-${i}`} className="group flex items-start gap-2 px-3 py-1.5">
                      <span className="text-xs opacity-55 w-36 shrink-0 leading-relaxed">{row.label}</span>
                      <span className="font-mono text-xs flex-1 break-all leading-relaxed">{row.value}</span>
                      <button
                        className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
                        title={`Copy ${row.label}`}
                        onClick={() => copy(row.value, row.label)}
                      >
                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {gps && (
                  <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-base-300/60">
                    <button
                      className="btn btn-xs btn-accent"
                      onClick={() => copy(`${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}`, "พิกัด")}
                    >
                      <ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy lat, lng
                    </button>
                    <a
                      className="btn btn-xs btn-ghost border"
                      href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lon}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Google Maps
                    </a>
                    <a
                      className="btn btn-xs btn-ghost border"
                      href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=17/${gps.lat}/${gps.lon}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      OpenStreetMap
                    </a>
                    <span className="text-[11px] opacity-45 self-center">
                      พิกัดไม่ถูกส่งไปไหนจนกว่าคุณจะกดเปิดแผนที่เอง
                    </span>
                  </div>
                )}
              </div>
            )}

            {!asset.container.exif.rows.length && asset.mime === "image/jpeg" && (
              <p className="text-[11px] opacity-40">
                ไม่พบ EXIF ในไฟล์นี้ — โซเชียลมีเดียส่วนใหญ่ลบ metadata ออกเมื่ออัปโหลด
              </p>
            )}

            {asset.container.exif.rows.length > 0 && !asset.container.exif.gpsRows.length && (
              <p className="text-[11px] opacity-40">
                มี EXIF แต่ไม่มีพิกัด GPS — กล้องหรือมือถืออาจปิด location ไว้ตอนถ่าย
                หรือพิกัดถูกลบออกภายหลัง
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] opacity-40 leading-relaxed">
          รูปและ Base64 ทั้งหมดถูกประมวลผลในเครื่องของคุณด้วย JavaScript — ไม่มีการส่งข้อมูลออกจากเบราว์เซอร์
        </p>
      </div>
    </div>
  );
}
