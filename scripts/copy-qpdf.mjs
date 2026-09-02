// Copies the qpdf WASM binary out of node_modules into public/wasm so the
// browser can fetch it at runtime (see lib/pdfUnlock.ts).
// The copy is committed, so `next dev` works without running this first;
// `npm run build` re-runs it to keep it in sync with the installed package.
import { copyFileSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = require.resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm");
const destDir = join(root, "public", "wasm");
const dest = join(destDir, "qpdf.wasm");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-qpdf] ${src} -> ${dest}`);
