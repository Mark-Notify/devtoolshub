import { unserialize } from "php-serialize";

const PHP_SERIALIZED_PATTERN = /^(?:a:\d+:\{|O:\d+:|s:\d+:|i:-?\d+;|b:[01];|d:-?[\d.eE+]+;)/;

const MAX_DEPTH = 100;

export const isPHPSerialized = (data: string): boolean => {
  return PHP_SERIALIZED_PATTERN.test(data.trim());
};

// Data is often copied from a place where it was already escaped — inside a JSON
// string, a JS source file, or a DB/log export — so it arrives like
//   a:1:{i:0;a:8:{s:4:\"Date\";...}}
// instead of the raw form  a:1:{i:0;a:8:{s:4:"Date";...}}.
// The backslashes make php-serialize count the wrong byte length and throw, so
// we strip a single level of backslash-escaping before retrying. Done in one
// left-to-right pass so "\\" collapses to "\" correctly.
const unescapeSerialized = (data: string): string => data.replace(/\\(["\\/])/g, "$1");

/**
 * Unserialize PHP data, tolerating input whose quotes/backslashes were escaped
 * during copy-paste. Tries the raw string first, then an unescaped fallback.
 */
export const safeUnserialize = (data: string): unknown => {
  const trimmed = data.trim();
  try {
    return unserialize(trimmed);
  } catch (err) {
    const unescaped = unescapeSerialized(trimmed);
    if (unescaped !== trimmed) {
      return unserialize(unescaped);
    }
    throw err;
  }
};

export const deepUnserialize = (data: unknown, depth: number = 0): unknown => {
  if (depth >= MAX_DEPTH) {
    return data;
  }

  if (typeof data === "string" && isPHPSerialized(data)) {
    try {
      const unserialized = safeUnserialize(data);
      return deepUnserialize(unserialized, depth + 1);
    } catch {
      return data;
    }
  }

  if (data !== null && typeof data === "object") {
    if (Array.isArray(data)) {
      return data.map((item) => deepUnserialize(item, depth + 1));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = deepUnserialize(value, depth + 1);
    }
    return result;
  }

  return data;
};
