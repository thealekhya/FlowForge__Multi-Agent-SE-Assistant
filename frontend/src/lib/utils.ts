type ClassValue = ClassValue[] | Record<string, boolean | null | undefined> | string | number | null | boolean | undefined;

export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];
  for (const item of classes) {
    if (!item) continue;
    if (typeof item === "string" || typeof item === "number") {
      result.push(String(item));
    } else if (Array.isArray(item)) {
      const nested = cn(...item);
      if (nested) result.push(nested);
    } else if (typeof item === "object") {
      for (const [key, val] of Object.entries(item)) {
        if (val) result.push(key);
      }
    }
  }
  return result.join(" ");
}

