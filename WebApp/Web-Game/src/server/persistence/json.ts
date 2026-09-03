import { PersistenceError } from "./errors";

export function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "bigint") {
    return JSON.stringify(value.toString());
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  throw new PersistenceError("INVALID_INPUT");
}

export function parseJson<T>(value: string, code: "RECOVERY_REQUIRED" | "INVALID_INPUT" = "INVALID_INPUT"): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new PersistenceError(code, { cause: error });
  }
}
