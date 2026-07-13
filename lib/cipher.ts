// Byte-exact TS port of the PHP encode_front()/decode_front() pair.
// Operates on UTF-8 bytes (not UTF-16 code units) to match PHP's byte-wise
// ord()/chr() semantics, so output is interoperable with the PHP version.

const PUBLIC_KEY = "112787D885GS544H5";
const PREFIX = "kjasghdikaj@";
const SUFFIX = "@agjsdgajshdg";

function getAlphabetPosition(letter: string): number {
  const a = "a".charCodeAt(0);
  return letter.toLowerCase().charCodeAt(0) - a + 1;
}

function keyValueAt(index: number): number {
  const ch = PUBLIC_KEY[index % PUBLIC_KEY.length];
  return /[0-9]/.test(ch) ? parseInt(ch, 10) : getAlphabetPosition(ch);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeFront(input: string): string {
  const bytes = new TextEncoder().encode(`${PREFIX}${input}${SUFFIX}`);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = (bytes[i] - keyValueAt(i) + 256) % 256;
  }
  return bytesToBase64(out);
}

export function decodeFront(input: string): string | Record<string, unknown> | false {
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(input.trim());
  } catch {
    return false;
  }

  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = (bytes[i] + keyValueAt(i)) % 256;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(out);
  } catch {
    return false;
  }

  const parts = text.split("@");
  if (parts.length <= 2) return false;

  try {
    const parsed = JSON.parse(parts[1]);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // not JSON, fall through to raw string
  }
  return parts[1];
}
