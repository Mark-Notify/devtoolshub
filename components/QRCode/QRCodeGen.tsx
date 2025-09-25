"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
// Install: npm i qr-code-styling
// This page uses the actively maintained API surface of qr-code-styling (shapes below are supported by this lib).
// NOTE: In earlier draft we used values like frame13/ball14 (those are for QRCode Monkey, not this lib) -> hence no visual change.
// This version maps to VALID shapes for qr-code-styling.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCodeStylingDefault, { QRCodeStyling as QRCodeStylingNamed } from "qr-code-styling";
const QRCodeStyling = (QRCodeStylingNamed || QRCodeStylingDefault) as any;

type ECC = "L" | "M" | "Q" | "H";

type DotType =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

type CornerSquareType = "square" | "dot" | "extra-rounded" | "classy" | "classy-rounded";

type CornerDotType = "square" | "dots" | "rounded";

type FileType = "png" | "svg" | "jpeg";

type GradientType = "linear" | "radial";

export default function QRStudio() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full-screen mode

  // Core
  const [data, setData] = useState("https://www.devtoolshub.org");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(16);
  const [ecc, setEcc] = useState<ECC>("H");
  const [fileType, setFileType] = useState<FileType>("png");

  // Dots & Eyes
  const [dotType, setDotType] = useState<DotType>("rounded");
  const [cornerSquare, setCornerSquare] = useState<CornerSquareType>("extra-rounded");
  const [cornerDot, setCornerDot] = useState<CornerDotType>("rounded");

  // Colors / gradients
  const [fg1, setFg1] = useState("#111827");
  const [fg2, setFg2] = useState("#3B82F6");
  const [useGradient, setUseGradient] = useState(true);
  const [gradType, setGradType] = useState<GradientType>("linear");
  const [gradRotation, setGradRotation] = useState(0); // 0..360 (linear only)

  const [eyeColor, setEyeColor] = useState("#111827");
  const [eyeDotColor, setEyeDotColor] = useState("#111827");

  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [transparentBg, setTransparentBg] = useState(false);

  // Logo
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [logoRatio, setLogoRatio] = useState(0.22);
  const [logoMargin, setLogoMargin] = useState(6);
  const [hideBgDotsBehindLogo, setHideBgDotsBehindLogo] = useState(true);

  // Presets that WORK with this library
  const presets = useMemo(
    () => [
      {
        key: "neo",
        label: "Neo Gradient",
        apply: () => {
          setDotType("rounded");
          setCornerSquare("extra-rounded");
          setCornerDot("rounded");
          setFg1("#111827");
          setFg2("#3B82F6");
          setUseGradient(true);
          setGradType("linear");
          setGradRotation(0);
          setEyeColor("#111827");
          setEyeDotColor("#111827");
          setBgColor("#FFFFFF");
          setTransparentBg(false);
        },
      },
      {
        key: "glass",
        label: "Glass",
        apply: () => {
          setDotType("classy-rounded");
          setCornerSquare("classy-rounded");
          setCornerDot("rounded");
          setFg1("#74b9ff");
          setFg2("#55efc4");
          setUseGradient(true);
          setGradType("radial");
          setGradRotation(0);
          setEyeColor("#74b9ff");
          setEyeDotColor("#55efc4");
          setTransparentBg(false);
          setBgColor("#FFFFFF");
        },
      },
      {
        key: "candy",
        label: "Candy",
        apply: () => {
          setDotType("dots");
          setCornerSquare("dot");
          setCornerDot("dots");
          setFg1("#F472B6");
          setFg2("#FB923C");
          setUseGradient(true);
          setGradType("radial");
          setGradRotation(0);
          setEyeColor("#F43F5E");
          setEyeDotColor("#FB923C");
          setBgColor("#FFFFFF");
          setTransparentBg(false);
        },
      },
      {
        key: "mono",
        label: "Mono Pro",
        apply: () => {
          setDotType("square");
          setCornerSquare("square");
          setCornerDot("square");
          setFg1("#000000");
          setFg2("#000000");
          setUseGradient(false);
          setEyeColor("#000000");
          setEyeDotColor("#000000");
          setBgColor("#FFFFFF");
          setTransparentBg(false);
        },
      },
    ],
    []
  );

  useEffect(() => setMounted(true), []);

  // init
  useEffect(() => {
    if (!mounted || !containerRef.current || !QRCodeStyling) return;
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: fileType,
        data,
        qrOptions: { errorCorrectionLevel: ecc, margin },
        dotsOptions: {
          type: dotType,
          color: fg1,
          gradient: useGradient
            ? {
              type: gradType,
              rotation: gradType === "linear" ? (gradRotation * Math.PI) / 180 : 0,
              colorStops: [
                { offset: 0, color: fg1 },
                { offset: 1, color: fg2 },
              ],
            }
            : undefined,
        },
        cornersSquareOptions: { type: cornerSquare, color: eyeColor },
        cornersDotOptions: { type: cornerDot, color: eyeDotColor },
        backgroundOptions: { color: transparentBg ? "rgba(0,0,0,0)" : bgColor },
        image: logoDataUrl,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: logoMargin,
          hideBackgroundDots: hideBgDotsBehindLogo,
          imageSize: logoRatio,
        },
      });
      containerRef.current.innerHTML = "";
      qrRef.current.append(containerRef.current);
    }
  }, [mounted]);

  // update
  useEffect(() => {
    if (!qrRef.current) return;
    const update: any = {
      width: size,
      height: size,
      data,
      type: fileType,
      qrOptions: { errorCorrectionLevel: ecc, margin },
      backgroundOptions: { color: transparentBg ? "rgba(0,0,0,0)" : bgColor },
      dotsOptions: {
        type: dotType,
        color: fg1,
        gradient: useGradient
          ? {
            type: gradType,
            rotation: gradType === "linear" ? (gradRotation * Math.PI) / 180 : 0,
            colorStops: [
              { offset: 0, color: fg1 },
              { offset: 1, color: fg2 },
            ],
          }
          : undefined,
      },
      cornersSquareOptions: { type: cornerSquare, color: eyeColor },
      cornersDotOptions: { type: cornerDot, color: eyeDotColor },
      image: logoDataUrl,
      imageOptions: {
        margin: logoMargin,
        hideBackgroundDots: hideBgDotsBehindLogo,
        imageSize: logoRatio,
      },
    };
    qrRef.current.update(update);
  }, [data, size, fileType, margin, ecc, dotType, cornerSquare, cornerDot, fg1, fg2, useGradient, gradType, gradRotation, eyeColor, eyeDotColor, bgColor, transparentBg, logoDataUrl, logoMargin, logoRatio, hideBgDotsBehindLogo]);

  const onDownload = async () => {
    if (!qrRef.current) return;
    if (typeof qrRef.current.download === "function") {
      qrRef.current.download({ name: "qr", extension: fileType });
      return;
    }
    if (typeof qrRef.current.getRawData === "function") {
      const blob = await qrRef.current.getRawData(fileType);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr.${fileType}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const onLogoFile = (file?: File | null) => {
    if (!file) {
      setLogoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };


  // ฟังก์ชันสำหรับ Full Screen Toggle
  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    localStorage.setItem("isFullScreen", newFullScreenState.toString());
  };

  return (
    <div
      className={`min-h-fit mx-auto p-4 border bg-base-100 rounded-md shadow-md ${isFullScreen ? "min-w-screen" : "max-w-7xl"
        }`}
    >
      <div className="flex flex-grow flex-col lg:flex-row gap-6"></div>
      <div className="min-h-screen w-full bg-gradient-to-b ">
        <div className="max-w-6xl mx-auto pt-6">
          <header className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">QR Studio — Custom QR Code Generator</h1>
            <div className="flex items-center gap-2">
              {presets.map((p) => (
                <button key={p.key} onClick={p.apply} className="px-3 py-2 rounded-xl shadow text-sm">
                  {p.label}
                </button>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="rounded-2xl shadow p-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-center" style={{ minHeight: size + 24 }}>
                <div ref={containerRef} className="[&_img]:mx-auto [&_svg]:mx-auto" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <select value={fileType} onChange={(e) => setFileType(e.target.value as FileType)} className="px-3 py-2 rounded-xl border">
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="jpeg">JPEG</option>
                </select>
                <button onClick={onDownload} className="px-4 py-2 rounded-xl bg-blue-600  shadow">Download</button>
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-2xl shadow p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data / URL</label>
                <input value={data} onChange={(e) => setData(e.target.value)} className="w-full px-3 py-2 rounded-xl border" placeholder="https://example.com" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Size (px)</label>
                  <input type="number" min={128} max={2048} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Margin</label>
                  <input type="number" min={0} max={64} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ECC</label>
                  <select value={ecc} onChange={(e) => setEcc(e.target.value as ECC)} className="w-full px-3 py-2 rounded-xl border">
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="Q">Q</option>
                    <option value="H">H</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dots (Body)</label>
                  <select value={dotType} onChange={(e) => setDotType(e.target.value as DotType)} className="w-full px-3 py-2 rounded-xl border">
                    <option>square</option>
                    <option>dots</option>
                    <option>rounded</option>
                    <option>classy</option>
                    <option>classy-rounded</option>
                    <option>extra-rounded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Eye Frame</label>
                  <select value={cornerSquare} onChange={(e) => setCornerSquare(e.target.value as CornerSquareType)} className="w-full px-3 py-2 rounded-xl border">
                    <option>square</option>
                    <option>dot</option>
                    <option>extra-rounded</option>
                    <option>classy</option>
                    <option>classy-rounded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Eye Ball</label>
                  <select value={cornerDot} onChange={(e) => setCornerDot(e.target.value as CornerDotType)} className="w-full px-3 py-2 rounded-xl border">
                    <option>square</option>
                    <option>dots</option>
                    <option>rounded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Foreground #1</label>
                  <input type="color" value={fg1} onChange={(e) => setFg1(e.target.value)} className="w-full h-10 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Foreground #2</label>
                  <input type="color" value={fg2} onChange={(e) => setFg2(e.target.value)} className="w-full h-10 rounded-xl border" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="useGradient" type="checkbox" checked={useGradient} onChange={(e) => setUseGradient(e.target.checked)} />
                  <label htmlFor="useGradient" className="text-sm">Use gradient</label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Gradient Type</label>
                  <select value={gradType} onChange={(e) => setGradType(e.target.value as GradientType)} className="w-full px-3 py-2 rounded-xl border">
                    <option value="linear">linear</option>
                    <option value="radial">radial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gradient Rotation (°)</label>
                  <input type="number" min={0} max={360} value={gradRotation} onChange={(e) => setGradRotation(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" />
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  Linear เท่านั้นที่ใช้ rotation ได้
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Eye Frame Color</label>
                  <input type="color" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className="w-full h-10 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Eye Ball Color</label>
                  <input type="color" value={eyeDotColor} onChange={(e) => setEyeDotColor(e.target.value)} className="w-full h-10 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Background</label>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-xl border" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="transparentBg" type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} />
                  <label htmlFor="transparentBg" className="text-sm">Transparent BG</label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Logo (PNG/SVG/JPEG)</label>
                  <input type="file" accept="image/*,image/svg+xml" onChange={(e) => onLogoFile(e.target.files?.[0])} className="w-full px-3 py-2 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo size (0.05–0.35)</label>
                  <input type="number" step={0.01} min={0.05} max={0.35} value={logoRatio} onChange={(e) => setLogoRatio(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Logo margin</label>
                  <input type="number" min={0} max={32} value={logoMargin} onChange={(e) => setLogoMargin(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input id="hideBgDots" type="checkbox" checked={hideBgDotsBehindLogo} onChange={(e) => setHideBgDotsBehindLogo(e.target.checked)} />
                  <label htmlFor="hideBgDots" className="text-sm">Hide background dots behind logo</label>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 leading-relaxed">
                <b>Scan tips</b>: ECC = H when using a logo; keep strong contrast; margin ≥ 4 modules.
              </div>
            </div>
          </div>

          {/* <footer className="mt-8 text-sm text-gray-500">
            Built with <code>qr-code-styling</code> (valid shape names only). Drop in <code>app/page.tsx</code>.
          </footer> */}
        </div>
      </div>
    </div>
  );
}
