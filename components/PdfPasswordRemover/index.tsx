"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  LockOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toastError, toastSuccess } from "../../lib/swal";
import { useToolHistory } from "../../hooks/useToolHistory";
import {
  PdfUnlockError,
  preloadQpdf,
  removePdfPassword,
  unlockedFileName,
} from "../../lib/pdfUnlock";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB — everything runs in browser memory

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

type Result = { url: string; name: string; size: number };

export default function PdfPasswordRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<Result | null>(null);
  const { saveHistory } = useToolHistory("pdf-remove-password");

  // Fetch + compile the qpdf WASM while the user is still picking a file.
  useEffect(() => { preloadQpdf(); }, []);

  // Keep a ref of the current result so unmount can revoke the last object URL.
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => () => { if (resultRef.current) URL.revokeObjectURL(resultRef.current.url); }, []);

  const clearResult = () => {
    setResult((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null; });
  };

  const pickFile = (picked: File | undefined | null) => {
    if (!picked) return;
    if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") {
      toastError("รองรับเฉพาะไฟล์ .pdf");
      return;
    }
    if (picked.size > MAX_SIZE) {
      toastError(`ไฟล์ใหญ่เกินไป (สูงสุด ${formatSize(MAX_SIZE)})`);
      return;
    }
    clearResult();
    setError("");
    setFile(picked);
  };

  const reset = () => {
    clearResult();
    setFile(null);
    setPassword("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const unlock = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    clearResult();
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const decrypted = await removePdfPassword(bytes, password);
      const name = unlockedFileName(file.name);
      const url = URL.createObjectURL(new Blob([decrypted], { type: "application/pdf" }));
      setResult({ url, name, size: decrypted.length });
      triggerDownload(url, name);
      toastSuccess("ปลดล็อกสำเร็จ — กำลังดาวน์โหลด");
      saveHistory(file.name, name);
    } catch (err) {
      const code = err instanceof PdfUnlockError ? err.code : "failed";
      const message =
        code === "wrong-password"
          ? "รหัสผ่านไม่ถูกต้อง ลองตรวจสอบอีกครั้ง"
          : code === "not-a-pdf"
          ? "อ่านไฟล์ไม่ได้ — ไฟล์นี้อาจไม่ใช่ PDF ที่ถูกต้อง"
          : `ปลดล็อกไม่สำเร็จ: ${(err as Error).message || "unknown error"}`;
      setError(message);
      toastError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">

        {/* Intro */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0">
            <LockOpenIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">PDF Remove Password</h1>
            <p className="text-xs opacity-60 mt-0.5">
              อัปโหลด PDF ที่ล็อกรหัส ใส่รหัสผ่านที่คุณมี แล้วดาวน์โหลดไฟล์ที่ไม่ต้องใส่รหัส
              — ประมวลผลในเบราว์เซอร์ทั้งหมด ไฟล์ไม่ถูกส่งขึ้นเซิร์ฟเวอร์
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl px-5 py-8 text-center cursor-pointer transition-all ${
            dragging ? "border-violet-400 bg-violet-500/10" : "border-base-300 hover:border-violet-400/60 hover:bg-base-200/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <DocumentArrowUpIcon className="w-8 h-8 mx-auto opacity-40" />
          {file ? (
            <>
              <div className="mt-2 text-sm font-semibold break-all">{file.name}</div>
              <div className="text-xs opacity-50 mt-0.5">{formatSize(file.size)} · คลิกเพื่อเปลี่ยนไฟล์</div>
            </>
          ) : (
            <>
              <div className="mt-2 text-sm font-medium">คลิกเพื่อเลือกไฟล์ PDF หรือลากมาวางที่นี่</div>
              <div className="text-xs opacity-50 mt-0.5">สูงสุด {formatSize(MAX_SIZE)}</div>
            </>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-60">รหัสผ่านของไฟล์</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                className="input input-bordered w-full pr-10 font-mono text-sm"
                placeholder="ใส่รหัสผ่านที่ใช้เปิดไฟล์"
                value={password}
                autoComplete="off"
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") unlock(); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-square"
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            <button className="btn btn-primary" onClick={unlock} disabled={!file || busy}>
              {busy
                ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> กำลังปลดล็อก…</>
                : <><LockOpenIcon className="w-4 h-4" /> ปลดล็อก &amp; ดาวน์โหลด</>}
            </button>
          </div>
          <p className="text-[11px] opacity-45">
            ถ้าไฟล์ล็อกเฉพาะสิทธิ์ (owner password) และเปิดอ่านได้โดยไม่ต้องใส่รหัส ให้เว้นช่องนี้ว่างไว้
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-sm py-2.5">
            <XMarkIcon className="w-4 h-4 shrink-0" />
            <span className="break-all">{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="border border-base-300 rounded-2xl p-4 flex items-center gap-3 bg-base-200/40">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <LockOpenIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{result.name}</div>
              <div className="text-xs opacity-50">{formatSize(result.size)} · ไม่มีรหัสผ่านแล้ว</div>
            </div>
            <button className="btn btn-sm btn-accent" onClick={() => triggerDownload(result.url, result.name)}>
              <ArrowDownTrayIcon className="w-4 h-4" /> ดาวน์โหลด
            </button>
            <button className="btn btn-sm btn-ghost border" onClick={reset}>ล้าง</button>
          </div>
        )}

        <p className="text-[11px] opacity-40 leading-relaxed">
          ⚠️ ใช้เครื่องมือนี้กับไฟล์ที่คุณเป็นเจ้าของหรือได้รับอนุญาตเท่านั้น —
          เครื่องมือนี้ไม่ได้เดารหัสผ่าน คุณต้องรู้รหัสผ่านของไฟล์อยู่แล้ว
        </p>
      </div>
    </div>
  );
}
