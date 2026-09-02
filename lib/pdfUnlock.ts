// Removes the password from an encrypted PDF, entirely in the browser.
// Powered by qpdf compiled to WebAssembly — the file is written to an in-memory
// virtual filesystem and never leaves the device.

type QpdfInstance = {
  callMain: (args: string[]) => number;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
  };
};

/** Served from public/wasm — kept in sync by scripts/copy-qpdf.mjs. */
const WASM_URL = "/wasm/qpdf.wasm";

export type UnlockErrorCode = "wrong-password" | "not-a-pdf" | "failed";

export class PdfUnlockError extends Error {
  code: UnlockErrorCode;
  detail: string;
  constructor(code: UnlockErrorCode, detail = "") {
    super(detail || code);
    this.name = "PdfUnlockError";
    this.code = code;
    this.detail = detail;
  }
}

let instancePromise: Promise<QpdfInstance> | null = null;
let messages: string[] = [];

async function getQpdf(): Promise<QpdfInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const createModule = (await import("@neslinesli93/qpdf-wasm")).default;
      // This build binds console.log / console.error when the module factory runs
      // and ignores the usual print/printErr options, so patch the console around
      // the call to capture qpdf's own diagnostics (e.g. "invalid password").
      const realLog = console.log;
      const realError = console.error;
      const collect = (...args: unknown[]) => { messages.push(args.map(String).join(" ")); };
      console.log = collect;
      console.error = collect;
      try {
        const create = createModule as unknown as (opts: unknown) => Promise<QpdfInstance>;
        return await create({ locateFile: () => WASM_URL, noInitialRun: true });
      } finally {
        console.log = realLog;
        console.error = realError;
      }
    })();
    instancePromise.catch(() => { instancePromise = null; });
  }
  return instancePromise;
}

/** Warm up the WASM module ahead of time so the first unlock feels instant. */
export function preloadQpdf(): void {
  getQpdf().catch(() => { /* retried on first real use */ });
}

/**
 * Returns a decrypted copy of `bytes`. `password` is the user (open) password —
 * pass an empty string for a PDF that is only owner-password protected.
 */
export async function removePdfPassword(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const qpdf = await getQpdf();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const input = `/in_${stamp}.pdf`;
  const output = `/out_${stamp}.pdf`;

  messages = [];
  qpdf.FS.writeFile(input, bytes);

  let code: number;
  try {
    code = qpdf.callMain([`--password=${password}`, "--decrypt", input, output]);
  } catch (err) {
    // An abort leaves the WASM runtime unusable — drop it so the next try rebuilds.
    instancePromise = null;
    throw new PdfUnlockError("failed", String(err));
  } finally {
    try { qpdf.FS.unlink(input); } catch { /* already gone */ }
  }

  const detail = messages.join("\n").trim();

  // qpdf exits 0 on success and 3 when it succeeded with warnings; 2 means errors.
  if (code === 0 || code === 3) {
    try {
      const result = qpdf.FS.readFile(output);
      return result;
    } catch {
      throw new PdfUnlockError("failed", detail);
    } finally {
      try { qpdf.FS.unlink(output); } catch { /* never written */ }
    }
  }

  try { qpdf.FS.unlink(output); } catch { /* never written */ }

  if (/invalid password/i.test(detail)) throw new PdfUnlockError("wrong-password", detail);
  if (/not a (pdf|file)|unable to find|no pdf header/i.test(detail)) throw new PdfUnlockError("not-a-pdf", detail);
  throw new PdfUnlockError("failed", detail);
}

/** "report.pdf" -> "report_no_pass.pdf" */
export function unlockedFileName(name: string): string {
  const base = name.replace(/\.pdf$/i, "");
  return `${base || "document"}_no_pass.pdf`;
}
