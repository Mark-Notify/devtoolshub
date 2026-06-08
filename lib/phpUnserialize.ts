import { unserialize } from "php-serialize";

const PHP_SERIALIZED_PATTERN = /^(?:a:\d+:\{|O:\d+:|s:\d+:|i:-?\d+;|b:[01];|d:-?[\d.]+;)/;

const MAX_DEPTH = 100;

export const isPHPSerialized = (data: string): boolean => {
  return PHP_SERIALIZED_PATTERN.test(data);
};

export const deepUnserialize = (data: unknown, depth: number = 0): unknown => {
  if (depth >= MAX_DEPTH) {
    return data;
  }

  if (typeof data === "string" && isPHPSerialized(data)) {
    try {
      const unserialized = unserialize(data);
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
