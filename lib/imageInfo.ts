// =============================================================
// Image metadata extraction — pure client-side, no dependencies.
// Reads the raw bytes of an image and pulls out everything the
// container format is willing to tell us: format-specific header
// fields, embedded EXIF/GPS, text chunks, and so on.
// =============================================================

export type InfoRow = { label: string; value: string };

// ─── formatting helpers ───────────────────────────────────────
export function humanBytes(n: number): string {
  if (!isFinite(n) || n < 0) return "-";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function aspectRatio(w: number, h: number): string {
  if (!w || !h) return "-";
  const g = gcd(w, h) || 1;
  const rw = w / g;
  const rh = h / g;
  // Ratios like 1920:1279 are noise — fall back to a decimal form.
  if (rw > 40 || rh > 40) return `${(w / h).toFixed(3)} : 1`;
  return `${rw} : ${rh}`;
}

function ascii(b: Uint8Array, start: number, len: number): string {
  let s = "";
  for (let i = start; i < start + len && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

function bytesEqual(b: Uint8Array, offset: number, sig: number[]): boolean {
  for (let i = 0; i < sig.length; i++) if (b[offset + i] !== sig[i]) return false;
  return true;
}

// ─── format detection ─────────────────────────────────────────
export type DetectedFormat = { mime: string; label: string; ext: string };

export function detectFormat(b: Uint8Array): DetectedFormat | null {
  if (b.length < 4) return null;
  if (bytesEqual(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: "image/png", label: "PNG (Portable Network Graphics)", ext: "png" };
  if (bytesEqual(b, 0, [0xff, 0xd8, 0xff]))
    return { mime: "image/jpeg", label: "JPEG (JFIF / Exif)", ext: "jpg" };
  if (ascii(b, 0, 4) === "GIF8")
    return { mime: "image/gif", label: `GIF (${ascii(b, 0, 6)})`, ext: "gif" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP")
    return { mime: "image/webp", label: "WebP", ext: "webp" };
  if (bytesEqual(b, 0, [0x42, 0x4d]))
    return { mime: "image/bmp", label: "BMP (Windows Bitmap)", ext: "bmp" };
  if (bytesEqual(b, 0, [0x00, 0x00, 0x01, 0x00]))
    return { mime: "image/x-icon", label: "ICO (Windows Icon)", ext: "ico" };
  if (bytesEqual(b, 0, [0x49, 0x49, 0x2a, 0x00]) || bytesEqual(b, 0, [0x4d, 0x4d, 0x00, 0x2a]))
    return { mime: "image/tiff", label: "TIFF", ext: "tif" };
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (brand === "avif" || brand === "avis")
      return { mime: "image/avif", label: `AVIF (brand: ${brand})`, ext: "avif" };
    return { mime: "image/heic", label: `HEIF / HEIC (brand: ${brand})`, ext: "heic" };
  }
  const head = ascii(b, 0, 300).trim();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.indexOf("<svg") !== -1))
    return { mime: "image/svg+xml", label: "SVG (Scalable Vector Graphics)", ext: "svg" };
  return null;
}

// ─── PNG ──────────────────────────────────────────────────────
const PNG_COLOR_TYPES: Record<number, string> = {
  0: "Grayscale",
  2: "Truecolor (RGB)",
  3: "Indexed color (palette)",
  4: "Grayscale + alpha",
  6: "Truecolor + alpha (RGBA)",
};

function parsePng(b: Uint8Array): InfoRow[] {
  const rows: InfoRow[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let off = 8;
  const chunks: string[] = [];
  const texts: InfoRow[] = [];

  while (off + 8 <= b.length) {
    const len = dv.getUint32(off);
    const type = ascii(b, off + 4, 4);
    const dataAt = off + 8;
    if (len > b.length) break;
    chunks.push(type);

    if (type === "IHDR" && len >= 13) {
      const bitDepth = b[dataAt + 8];
      const colorType = b[dataAt + 9];
      rows.push({ label: "Bit depth", value: `${bitDepth} bit / channel` });
      rows.push({ label: "Color type", value: `${PNG_COLOR_TYPES[colorType] || "Unknown"} (${colorType})` });
      rows.push({ label: "Compression", value: b[dataAt + 10] === 0 ? "Deflate/Inflate (0)" : String(b[dataAt + 10]) });
      rows.push({ label: "Filter method", value: b[dataAt + 11] === 0 ? "Adaptive (0)" : String(b[dataAt + 11]) });
      rows.push({ label: "Interlace", value: b[dataAt + 12] === 1 ? "Adam7" : "None" });
      const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : 4;
      rows.push({ label: "Bits per pixel", value: `${bitDepth * channels} bpp` });
    } else if (type === "pHYs" && len >= 9) {
      const px = dv.getUint32(dataAt);
      const py = dv.getUint32(dataAt + 4);
      const unit = b[dataAt + 8];
      rows.push({
        label: "Physical size",
        value: unit === 1
          ? `${px} x ${py} px/m (~${Math.round(px * 0.0254)} x ${Math.round(py * 0.0254)} DPI)`
          : `${px} x ${py} (aspect only)`,
      });
    } else if (type === "gAMA" && len >= 4) {
      rows.push({ label: "Gamma", value: (dv.getUint32(dataAt) / 100000).toFixed(5) });
    } else if (type === "sRGB" && len >= 1) {
      rows.push({ label: "sRGB rendering intent", value: String(b[dataAt]) });
    } else if (type === "tRNS") {
      rows.push({ label: "Transparency chunk", value: `Yes (tRNS, ${len} bytes)` });
    } else if (type === "acTL" && len >= 8) {
      const frames = dv.getUint32(dataAt);
      const plays = dv.getUint32(dataAt + 4);
      rows.push({ label: "Animated PNG", value: `Yes — ${frames} frames, ${plays === 0 ? "infinite" : plays} plays` });
    } else if (type === "tEXt" || type === "iTXt") {
      const raw = ascii(b, dataAt, Math.min(len, 400));
      const nul = raw.indexOf("\0");
      if (nul > 0) texts.push({ label: `Text: ${raw.slice(0, nul)}`, value: raw.slice(nul + 1).replace(/\0/g, " ").trim() });
    } else if (type === "iCCP") {
      const raw = ascii(b, dataAt, Math.min(len, 80));
      rows.push({ label: "ICC profile", value: raw.split("\0")[0] || "embedded" });
    } else if (type === "IEND") {
      break;
    }
    off = dataAt + len + 4; // + CRC
  }

  rows.push({ label: "Chunks", value: chunks.join(", ") });
  return rows.concat(texts);
}

// ─── JPEG ─────────────────────────────────────────────────────
const JPEG_SOF: Record<number, string> = {
  0xc0: "Baseline DCT", 0xc1: "Extended sequential DCT", 0xc2: "Progressive DCT",
  0xc3: "Lossless (sequential)", 0xc5: "Differential sequential DCT",
  0xc6: "Differential progressive DCT", 0xc7: "Differential lossless",
  0xc9: "Extended sequential DCT (arithmetic)", 0xca: "Progressive DCT (arithmetic)",
  0xcb: "Lossless (arithmetic)", 0xcd: "Differential sequential DCT (arithmetic)",
  0xce: "Differential progressive DCT (arithmetic)", 0xcf: "Differential lossless (arithmetic)",
};

function parseJpeg(b: Uint8Array): { rows: InfoRow[]; exifOffset: number } {
  const rows: InfoRow[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let off = 2;
  let exifOffset = -1;
  const segments: string[] = [];
  let quantTables = 0;
  let huffTables = 0;

  while (off + 4 <= b.length) {
    if (b[off] !== 0xff) { off++; continue; }
    const marker = b[off + 1];
    if (marker === 0xd8 || marker === 0x01 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
    if (marker === 0xda) { segments.push("SOS"); break; } // start of scan — compressed data follows
    const len = dv.getUint16(off + 2);
    if (len < 2) break;
    const dataAt = off + 4;

    if (JPEG_SOF[marker]) {
      segments.push("SOF" + (marker - 0xc0).toString(16).toUpperCase());
      rows.push({ label: "Encoding", value: JPEG_SOF[marker] });
      rows.push({ label: "Sample precision", value: `${b[dataAt]} bit` });
      const comps = b[dataAt + 5];
      const model = comps === 1 ? "Grayscale" : comps === 3 ? "YCbCr" : comps === 4 ? "CMYK / YCCK" : "unknown";
      rows.push({ label: "Components", value: `${comps} (${model})` });
      const sampling: string[] = [];
      for (let c = 0; c < comps; c++) {
        const s = b[dataAt + 6 + c * 3 + 1];
        sampling.push(`${s >> 4}x${s & 0x0f}`);
      }
      if (sampling.length) rows.push({ label: "Chroma sampling", value: sampling.join(", ") });
    } else if (marker === 0xe0 && ascii(b, dataAt, 4) === "JFIF") {
      segments.push("APP0/JFIF");
      const unit = b[dataAt + 7];
      const xd = dv.getUint16(dataAt + 8);
      const yd = dv.getUint16(dataAt + 10);
      rows.push({ label: "JFIF version", value: `${b[dataAt + 5]}.${String(b[dataAt + 6]).padStart(2, "0")}` });
      rows.push({
        label: "Density",
        value: `${xd} x ${yd} ${unit === 1 ? "DPI" : unit === 2 ? "dots/cm" : "(aspect ratio only)"}`,
      });
    } else if (marker === 0xe1 && ascii(b, dataAt, 4) === "Exif") {
      segments.push("APP1/Exif");
      exifOffset = dataAt + 6;
    } else if (marker === 0xe1 && ascii(b, dataAt, 5) === "http:") {
      segments.push("APP1/XMP");
      rows.push({ label: "XMP metadata", value: `Yes (${len} bytes)` });
    } else if (marker === 0xe2 && ascii(b, dataAt, 4) === "ICC_") {
      segments.push("APP2/ICC");
      rows.push({ label: "ICC profile", value: `Embedded (${len} bytes)` });
    } else if (marker === 0xed) {
      segments.push("APP13/IPTC");
      rows.push({ label: "IPTC / Photoshop", value: `Yes (${len} bytes)` });
    } else if (marker === 0xee && ascii(b, dataAt, 5) === "Adobe") {
      segments.push("APP14/Adobe");
      rows.push({ label: "Adobe marker", value: `Yes — color transform ${b[dataAt + 11]}` });
    } else if (marker === 0xdb) {
      quantTables++;
    } else if (marker === 0xc4) {
      huffTables++;
    } else if (marker === 0xfe) {
      segments.push("COM");
      rows.push({ label: "Comment", value: ascii(b, dataAt, Math.min(len - 2, 200)).trim() });
    }
    off = off + 2 + len;
  }

  if (quantTables) rows.push({ label: "Quantization tables", value: String(quantTables) });
  if (huffTables) rows.push({ label: "Huffman tables", value: String(huffTables) });
  rows.push({ label: "Segments", value: segments.join(", ") });
  return { rows, exifOffset };
}

// ─── GIF ──────────────────────────────────────────────────────
function parseGif(b: Uint8Array): InfoRow[] {
  const rows: InfoRow[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  rows.push({ label: "Version", value: ascii(b, 0, 6) });
  rows.push({ label: "Logical screen", value: `${dv.getUint16(6, true)} x ${dv.getUint16(8, true)} px` });
  const packed = b[10];
  const hasGct = (packed & 0x80) !== 0;
  rows.push({ label: "Global color table", value: hasGct ? `Yes — ${1 << ((packed & 0x07) + 1)} colors` : "No" });
  rows.push({ label: "Color resolution", value: `${((packed >> 4) & 0x07) + 1} bit` });
  rows.push({ label: "Background color index", value: String(b[11]) });
  rows.push({ label: "Pixel aspect ratio", value: b[12] === 0 ? "Square (1:1)" : String((b[12] + 15) / 64) });

  // Count image descriptors (0x2C) to work out the frame count.
  let frames = 0;
  let loop = "";
  for (let i = 13; i < b.length - 1; i++) {
    if (b[i] === 0x2c) frames++;
    else if (b[i] === 0x21 && b[i + 1] === 0xff && ascii(b, i + 3, 11) === "NETSCAPE2.0") {
      const count = dv.getUint16(i + 16, true);
      loop = count === 0 ? "infinite" : `${count}x`;
    }
  }
  rows.push({ label: "Frames", value: `${frames}${frames > 1 ? " (animated)" : ""}` });
  if (loop) rows.push({ label: "Loop count", value: loop });
  return rows;
}

// ─── WebP ─────────────────────────────────────────────────────
function parseWebp(b: Uint8Array): InfoRow[] {
  const rows: InfoRow[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  rows.push({ label: "RIFF size", value: humanBytes(dv.getUint32(4, true) + 8) });
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8 ") {
    rows.push({ label: "Compression", value: "Lossy (VP8)" });
  } else if (chunk === "VP8L") {
    rows.push({ label: "Compression", value: "Lossless (VP8L)" });
    rows.push({ label: "Alpha", value: (b[24] & 0x10) !== 0 ? "Yes" : "No" });
  } else if (chunk === "VP8X") {
    const flags = b[20];
    rows.push({ label: "Compression", value: "Extended (VP8X)" });
    rows.push({ label: "Alpha", value: (flags & 0x10) !== 0 ? "Yes" : "No" });
    rows.push({ label: "Animation", value: (flags & 0x02) !== 0 ? "Yes" : "No" });
    rows.push({ label: "ICC profile", value: (flags & 0x20) !== 0 ? "Yes" : "No" });
    rows.push({ label: "EXIF", value: (flags & 0x08) !== 0 ? "Yes" : "No" });
    rows.push({ label: "XMP", value: (flags & 0x04) !== 0 ? "Yes" : "No" });
    const cw = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const ch = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    rows.push({ label: "Canvas", value: `${cw} x ${ch} px` });
  }
  return rows;
}

// ─── BMP ──────────────────────────────────────────────────────
const BMP_COMPRESSION: Record<number, string> = {
  0: "BI_RGB (none)", 1: "BI_RLE8", 2: "BI_RLE4", 3: "BI_BITFIELDS",
  4: "BI_JPEG", 5: "BI_PNG", 6: "BI_ALPHABITFIELDS",
};

function parseBmp(b: Uint8Array): InfoRow[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const rows: InfoRow[] = [];
  rows.push({ label: "Declared file size", value: humanBytes(dv.getUint32(2, true)) });
  rows.push({ label: "Pixel data offset", value: `${dv.getUint32(10, true)} bytes` });
  rows.push({ label: "DIB header size", value: `${dv.getUint32(14, true)} bytes` });
  rows.push({ label: "Color planes", value: String(dv.getUint16(26, true)) });
  rows.push({ label: "Bits per pixel", value: `${dv.getUint16(28, true)} bpp` });
  const comp = dv.getUint32(30, true);
  rows.push({ label: "Compression", value: BMP_COMPRESSION[comp] || String(comp) });
  const xppm = dv.getInt32(38, true);
  const yppm = dv.getInt32(42, true);
  if (xppm || yppm) rows.push({ label: "Resolution", value: `${Math.round(xppm * 0.0254)} x ${Math.round(yppm * 0.0254)} DPI` });
  const palette = dv.getUint32(46, true);
  rows.push({ label: "Palette colors", value: palette ? String(palette) : "all" });
  return rows;
}

// ─── ICO ──────────────────────────────────────────────────────
function parseIco(b: Uint8Array): InfoRow[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const count = dv.getUint16(4, true);
  const rows: InfoRow[] = [{ label: "Images in file", value: String(count) }];
  const sizes: string[] = [];
  for (let i = 0; i < count && 6 + i * 16 + 16 <= b.length; i++) {
    const at = 6 + i * 16;
    const w = b[at] === 0 ? 256 : b[at];
    const h = b[at + 1] === 0 ? 256 : b[at + 1];
    sizes.push(`${w}x${h}@${dv.getUint16(at + 6, true)}bpp`);
  }
  if (sizes.length) rows.push({ label: "Entries", value: sizes.join(", ") });
  return rows;
}

// ─── SVG ──────────────────────────────────────────────────────
function parseSvg(b: Uint8Array): InfoRow[] {
  const rows: InfoRow[] = [];
  let text = "";
  try {
    text = new TextDecoder("utf-8").decode(b.slice(0, 4000));
  } catch {
    text = ascii(b, 0, 4000);
  }
  const pick = (attr: string) => {
    const m = text.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
    return m ? m[1] : "";
  };
  const vb = pick("viewBox");
  if (vb) rows.push({ label: "viewBox", value: vb });
  const w = pick("width");
  const h = pick("height");
  if (w || h) rows.push({ label: "Declared size", value: `${w || "auto"} x ${h || "auto"}` });
  const version = pick("version");
  if (version) rows.push({ label: "SVG version", value: version });
  const title = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (title) rows.push({ label: "Title", value: title[1].trim() });
  rows.push({ label: "Has <script>", value: /<script[\s>]/i.test(text) ? "Yes — treat with care" : "No" });
  return rows;
}

// ─── EXIF ─────────────────────────────────────────────────────
const EXIF_TAGS: Record<number, string> = {
  0x010e: "Image description", 0x010f: "Camera make", 0x0110: "Camera model",
  0x0112: "Orientation", 0x011a: "X resolution", 0x011b: "Y resolution",
  0x0128: "Resolution unit", 0x0131: "Software", 0x0132: "Modified date",
  0x013b: "Artist", 0x8298: "Copyright", 0x9003: "Date taken",
  0x9004: "Date digitized", 0x829a: "Exposure time", 0x829d: "F number",
  0x8822: "Exposure program", 0x8827: "ISO", 0x9201: "Shutter speed",
  0x9202: "Aperture", 0x9204: "Exposure bias", 0x9205: "Max aperture",
  0x9207: "Metering mode", 0x9208: "Light source", 0x9209: "Flash",
  0x920a: "Focal length", 0x9286: "User comment", 0xa001: "Color space",
  0xa002: "Pixel X dimension", 0xa003: "Pixel Y dimension",
  0xa402: "Exposure mode", 0xa403: "White balance", 0xa404: "Digital zoom",
  0xa405: "Focal length (35mm)", 0xa406: "Scene capture type",
  0xa408: "Contrast", 0xa409: "Saturation", 0xa40a: "Sharpness",
  0xa430: "Camera owner", 0xa431: "Body serial", 0xa432: "Lens spec",
  0xa433: "Lens make", 0xa434: "Lens model", 0xa435: "Lens serial",
};

const GPS_TAGS: Record<number, string> = {
  0x0000: "GPS version", 0x0001: "Latitude ref", 0x0002: "Latitude",
  0x0003: "Longitude ref", 0x0004: "Longitude", 0x0005: "Altitude ref",
  0x0006: "Altitude", 0x0007: "GPS timestamp", 0x000b: "GPS accuracy",
  0x0010: "Image direction", 0x001d: "GPS date",
};

export const ORIENTATION_NAMES: Record<number, string> = {
  1: "Normal", 2: "Mirrored horizontally", 3: "Rotated 180°",
  4: "Mirrored vertically", 5: "Mirrored + rotated 270° CW",
  6: "Rotated 90° CW", 7: "Mirrored + rotated 90° CW", 8: "Rotated 270° CW",
};

const ENUM_MAPS: Record<number, Record<number, string>> = {
  0x0112: ORIENTATION_NAMES,
  0x0128: { 1: "None", 2: "Inch", 3: "Centimeter" },
  0x8822: { 0: "Not defined", 1: "Manual", 2: "Normal program", 3: "Aperture priority", 4: "Shutter priority", 5: "Creative", 6: "Action", 7: "Portrait", 8: "Landscape" },
  0x9207: { 0: "Unknown", 1: "Average", 2: "Center weighted", 3: "Spot", 4: "Multi-spot", 5: "Pattern", 6: "Partial", 255: "Other" },
  0x9209: { 0: "Did not fire", 1: "Fired", 5: "Fired, no return", 7: "Fired, return detected", 9: "Fired (compulsory)", 16: "Off", 24: "Auto, did not fire", 25: "Auto, fired", 32: "No flash function" },
  0xa001: { 1: "sRGB", 2: "Adobe RGB", 0xffff: "Uncalibrated" },
  0xa402: { 0: "Auto", 1: "Manual", 2: "Auto bracket" },
  0xa403: { 0: "Auto", 1: "Manual" },
  0xa406: { 0: "Standard", 1: "Landscape", 2: "Portrait", 3: "Night scene" },
  0xa408: { 0: "Normal", 1: "Soft", 2: "Hard" },
  0xa409: { 0: "Normal", 1: "Low", 2: "High" },
  0xa40a: { 0: "Normal", 1: "Soft", 2: "Hard" },
};

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

type ExifValue = { nums: number[]; str: string; text: string };

function readExifValue(dv: DataView, entryAt: number, tiffStart: number, le: boolean): ExifValue | null {
  const type = dv.getUint16(entryAt + 2, le);
  const count = dv.getUint32(entryAt + 4, le);
  const size = TYPE_SIZES[type];
  if (!size || count > 100000) return null;
  const total = size * count;
  const valueAt = total <= 4 ? entryAt + 8 : tiffStart + dv.getUint32(entryAt + 8, le);
  if (valueAt < 0 || valueAt + total > dv.byteLength) return null;

  if (type === 2) {
    let s = "";
    for (let i = 0; i < count; i++) {
      const c = dv.getUint8(valueAt + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return { nums: [], str: s.trim(), text: s.trim() };
  }
  if (type === 7) return { nums: [], str: "", text: `<binary, ${count} bytes>` };

  const nums: number[] = [];
  for (let i = 0; i < count && i < 64; i++) {
    const at = valueAt + i * size;
    switch (type) {
      case 1: case 6: nums.push(dv.getUint8(at)); break;
      case 3: nums.push(dv.getUint16(at, le)); break;
      case 8: nums.push(dv.getInt16(at, le)); break;
      case 4: nums.push(dv.getUint32(at, le)); break;
      case 9: nums.push(dv.getInt32(at, le)); break;
      case 5: { const n = dv.getUint32(at, le), d = dv.getUint32(at + 4, le); nums.push(d ? n / d : 0); break; }
      case 10: { const n = dv.getInt32(at, le), d = dv.getInt32(at + 4, le); nums.push(d ? n / d : 0); break; }
      case 11: nums.push(dv.getFloat32(at, le)); break;
      case 12: nums.push(dv.getFloat64(at, le)); break;
    }
  }
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100000) / 100000));
  return { nums, str: "", text: nums.slice(0, 8).map(fmt).join(", ") };
}

function dmsToDecimal(parts: number[], ref: string): number | null {
  if (parts.length < 3) return null;
  const dec = parts[0] + parts[1] / 60 + parts[2] / 3600;
  return ref === "S" || ref === "W" ? -dec : dec;
}

/** 13.75 → 13° 45' 0.00" N */
function decimalToDms(dec: number, positive: string, negative: string): string {
  const abs = Math.abs(dec);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}" ${dec >= 0 ? positive : negative}`;
}

export type ExifResult = {
  rows: InfoRow[];
  /** GPS rows are kept apart so the UI can surface "where was this taken". */
  gpsRows: InfoRow[];
  gps: { lat: number; lon: number } | null;
  orientation: number | null;
};

/** Parse an EXIF/TIFF block. `tiffStart` points at the "II"/"MM" header. */
export function parseExif(b: Uint8Array, tiffStart: number): ExifResult {
  const empty: ExifResult = { rows: [], gpsRows: [], gps: null, orientation: null };
  if (tiffStart < 0 || tiffStart + 8 > b.length) return empty;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const byteOrder = dv.getUint16(tiffStart, false);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return empty;
  const le = byteOrder === 0x4949;
  if (dv.getUint16(tiffStart + 2, le) !== 0x002a) return empty;

  const rows: InfoRow[] = [];
  let orientation: number | null = null;
  const gpsRaw: Record<number, ExifValue> = {};
  const seen: Record<number, boolean> = {};

  // Sub-IFD pointers are queued as { at, kind } so GPS entries get the
  // GPS tag dictionary instead of the main EXIF one.
  const queue: { at: number; gps: boolean }[] = [];

  const readIfd = (ifdAt: number, isGps: boolean) => {
    if (ifdAt + 2 > dv.byteLength || seen[ifdAt]) return;
    seen[ifdAt] = true;
    const count = dv.getUint16(ifdAt, le);
    if (count > 512) return;
    for (let i = 0; i < count; i++) {
      const entryAt = ifdAt + 2 + i * 12;
      if (entryAt + 12 > dv.byteLength) break;
      const tag = dv.getUint16(entryAt, le);

      if (!isGps && (tag === 0x8769 || tag === 0x8825 || tag === 0xa005)) {
        const ptr = readExifValue(dv, entryAt, tiffStart, le);
        if (ptr && ptr.nums.length) queue.push({ at: tiffStart + ptr.nums[0], gps: tag === 0x8825 });
        continue;
      }

      const name = (isGps ? GPS_TAGS : EXIF_TAGS)[tag];
      if (!name) continue;
      const val = readExifValue(dv, entryAt, tiffStart, le);
      if (!val) continue;
      if (isGps) { gpsRaw[tag] = val; continue; }

      let text = val.text;
      if (tag === 0x0112 && val.nums.length) orientation = val.nums[0];
      const enumMap = ENUM_MAPS[tag];
      if (enumMap && val.nums.length) {
        text = `${enumMap[val.nums[0]] || "Unknown"} (${val.nums[0]})`;
      } else if (tag === 0x829a && val.nums[0]) {
        const s = val.nums[0];
        text = s >= 1 ? `${s} s` : `1/${Math.round(1 / s)} s`;
      } else if (tag === 0x829d && val.nums.length) {
        text = `f/${val.nums[0]}`;
      } else if ((tag === 0x920a || tag === 0xa405) && val.nums.length) {
        text = `${val.nums[0]} mm`;
      } else if (tag === 0x0132 || tag === 0x9003 || tag === 0x9004) {
        // EXIF dates are "YYYY:MM:DD hh:mm:ss" — normalise the date half.
        text = text.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      }
      if (text) rows.push({ label: name, value: text });
    }
  };

  readIfd(tiffStart + dv.getUint32(tiffStart + 4, le), false);
  while (queue.length) {
    const next = queue.shift() as { at: number; gps: boolean };
    readIfd(next.at, next.gps);
  }

  const gpsRows: InfoRow[] = [];
  let gps: { lat: number; lon: number } | null = null;
  const latVal = gpsRaw[0x0002];
  const lonVal = gpsRaw[0x0004];
  if (latVal && lonVal) {
    const latRef = gpsRaw[0x0001]?.str || "N";
    const lonRef = gpsRaw[0x0003]?.str || "E";
    const lat = dmsToDecimal(latVal.nums, latRef);
    const lon = dmsToDecimal(lonVal.nums, lonRef);
    if (lat !== null && lon !== null) {
      gps = { lat, lon };
      gpsRows.push({ label: "Latitude / Longitude", value: `${lat.toFixed(6)}, ${lon.toFixed(6)}` });
      gpsRows.push({ label: "Latitude", value: `${lat.toFixed(6)} (${latRef})` });
      gpsRows.push({ label: "Longitude", value: `${lon.toFixed(6)} (${lonRef})` });
      gpsRows.push({
        label: "DMS",
        value: `${decimalToDms(lat, "N", "S")}, ${decimalToDms(lon, "E", "W")}`,
      });
    }
  }
  const alt = gpsRaw[0x0006];
  if (alt && alt.nums.length) {
    const below = gpsRaw[0x0005]?.nums[0] === 1;
    gpsRows.push({ label: "Altitude", value: `${below ? "-" : ""}${alt.nums[0].toFixed(1)} m` });
  }
  const gpsDate = gpsRaw[0x001d];
  if (gpsDate) gpsRows.push({ label: "GPS date", value: gpsDate.text.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3") });
  const gpsTime = gpsRaw[0x0007];
  if (gpsTime && gpsTime.nums.length >= 3) {
    const pad = (n: number) => String(Math.round(n)).padStart(2, "0");
    gpsRows.push({ label: "GPS time (UTC)", value: `${pad(gpsTime.nums[0])}:${pad(gpsTime.nums[1])}:${pad(gpsTime.nums[2])}` });
  }
  const dir = gpsRaw[0x0010];
  if (dir && dir.nums.length) gpsRows.push({ label: "Camera direction", value: `${dir.nums[0].toFixed(2)}°` });
  const acc = gpsRaw[0x000b];
  if (acc && acc.nums.length) gpsRows.push({ label: "Positional accuracy", value: `${acc.nums[0].toFixed(2)}` });

  return { rows, gpsRows, gps, orientation };
}

// ─── entry point ──────────────────────────────────────────────
export type ContainerInfo = {
  format: DetectedFormat | null;
  formatRows: InfoRow[];
  exif: ExifResult;
};

/** Read every container-level detail we can from the raw bytes. */
export function inspectBytes(b: Uint8Array): ContainerInfo {
  const format = detectFormat(b);
  let formatRows: InfoRow[] = [];
  let exif: ExifResult = { rows: [], gpsRows: [], gps: null, orientation: null };

  try {
    switch (format?.mime) {
      case "image/png": formatRows = parsePng(b); break;
      case "image/jpeg": {
        const r = parseJpeg(b);
        formatRows = r.rows;
        if (r.exifOffset > 0) exif = parseExif(b, r.exifOffset);
        break;
      }
      case "image/gif": formatRows = parseGif(b); break;
      case "image/webp": formatRows = parseWebp(b); break;
      case "image/bmp": formatRows = parseBmp(b); break;
      case "image/x-icon": formatRows = parseIco(b); break;
      case "image/svg+xml": formatRows = parseSvg(b); break;
      case "image/tiff": exif = parseExif(b, 0); break;
      default: break;
    }
  } catch (err) {
    console.error("[imageInfo] Failed to parse container:", err);
  }

  return { format, formatRows, exif };
}

// ─── base64 helpers ───────────────────────────────────────────
const DATA_URL_RE = /^data:([^;,]*)?((?:;[^;,]+)*),/i;

export type ParsedBase64 = { mime: string; base64: string; isDataUrl: boolean } | null;

/**
 * Accepts a bare base64 payload, a full data: URL, or a copied
 * `src="..."` / `url(...)` fragment, and normalises it.
 */
export function parseBase64Input(input: string): ParsedBase64 {
  let s = input.trim();
  if (!s) return null;

  // Unwrap common copy/paste wrappers.
  const urlFn = s.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
  if (urlFn) s = urlFn[1].trim();
  const srcAttr = s.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcAttr) s = srcAttr[1].trim();

  const m = s.match(DATA_URL_RE);
  if (m) {
    if (!/;base64/i.test(m[2] || "")) return null;
    return {
      mime: (m[1] || "text/plain").toLowerCase(),
      base64: s.slice(m[0].length).replace(/\s/g, ""),
      isDataUrl: true,
    };
  }

  const cleaned = s.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cleaned) || cleaned.length < 8) return null;
  return { mime: "", base64: cleaned, isDataUrl: false };
}

/** Decode base64 (standard or URL-safe) into bytes. */
export function base64ToBytes(base64: string): Uint8Array {
  let s = base64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "").replace(/=+$/, "");
  const pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  else if (pad === 1) throw new Error("Invalid base64 length");
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}
