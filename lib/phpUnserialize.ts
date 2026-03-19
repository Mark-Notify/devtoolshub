import { unserialize } from "php-serialize";

export const isPHPSerialized = (data: string): boolean => {
  return (
    data.startsWith("a:") ||
    data.startsWith("O:") ||
    data.startsWith("s:") ||
    data.startsWith("i:") ||
    data.startsWith("b:") ||
    data.startsWith("d:")
  );
};

export const deepUnserialize = (data: unknown): unknown => {
  if (typeof data === "string" && isPHPSerialized(data)) {
    try {
      const unserialized = unserialize(data);
      return deepUnserialize(unserialized);
    } catch {
      return data;
    }
  }

  if (data !== null && typeof data === "object") {
    if (Array.isArray(data)) {
      return data.map((item) => deepUnserialize(item));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = deepUnserialize(value);
    }
    return result;
  }

  return data;
};
