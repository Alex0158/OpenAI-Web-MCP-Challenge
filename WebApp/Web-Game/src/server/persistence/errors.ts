export type PersistenceErrorCode =
  | "INVALID_DB_PATH"
  | "STORE_NOT_OPEN"
  | "STORE_OPEN_FAILED"
  | "STORE_CLOSE_FAILED"
  | "SCHEMA_INCOMPATIBLE"
  | "RECOVERY_REQUIRED"
  | "RECOVERY_LIMIT_EXCEEDED"
  | "WORLD_NOT_FOUND"
  | "ENTITY_NOT_FOUND"
  | "OWNERSHIP_DENIED"
  | "MOVEMENT_BLOCKED"
  | "STALE_REVISION"
  | "WORLD_TIME_REGRESSION"
  | "DUPLICATE_COMMAND"
  | "EVENT_CONFLICT"
  | "SNAPSHOT_INVALID"
  | "BUSY_RETRYABLE"
  | "INJECTED_FAILURE"
  | "SIGNAL_NOT_FOUND"
  | "LEASE_CONFLICT"
  | "ROLE_LOCKED"
  | "NOT_AT_SHELTER"
  | "TARGET_UNAVAILABLE"
  | "CARGO_FULL"
  | "TOOL_INCOMPATIBLE"
  | "MISSION_ACTIVE"
  | "ROLE_UNAVAILABLE"
  | "ALREADY_AT_SHELTER"
  | "STALE_REENTRY_CONTEXT"
  | "IN_COMBAT"
  | "MOVEMENT_INTENT_SESSION_CLOSED"
  | "INVALID_INPUT"
  | "MIGRATION_FAILED";

const RETRYABLE_CODES = new Set<PersistenceErrorCode>(["BUSY_RETRYABLE", "LEASE_CONFLICT"]);
const ERROR_CODES = new Set<PersistenceErrorCode>([
  "INVALID_DB_PATH",
  "STORE_NOT_OPEN",
  "STORE_OPEN_FAILED",
  "STORE_CLOSE_FAILED",
  "SCHEMA_INCOMPATIBLE",
  "RECOVERY_REQUIRED",
  "RECOVERY_LIMIT_EXCEEDED",
  "WORLD_NOT_FOUND",
  "ENTITY_NOT_FOUND",
  "OWNERSHIP_DENIED",
  "MOVEMENT_BLOCKED",
  "STALE_REVISION",
  "WORLD_TIME_REGRESSION",
  "DUPLICATE_COMMAND",
  "EVENT_CONFLICT",
  "SNAPSHOT_INVALID",
  "BUSY_RETRYABLE",
  "INJECTED_FAILURE",
  "SIGNAL_NOT_FOUND",
  "LEASE_CONFLICT",
  "ROLE_LOCKED",
  "NOT_AT_SHELTER",
  "TARGET_UNAVAILABLE",
  "CARGO_FULL",
  "TOOL_INCOMPATIBLE",
  "MISSION_ACTIVE",
  "ROLE_UNAVAILABLE",
  "ALREADY_AT_SHELTER",
  "STALE_REENTRY_CONTEXT",
  "IN_COMBAT",
  "MOVEMENT_INTENT_SESSION_CLOSED",
  "INVALID_INPUT",
  "MIGRATION_FAILED",
]);

export function isPersistenceErrorCode(value: unknown): value is PersistenceErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value as PersistenceErrorCode);
}

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;
  readonly retryable: boolean;

  constructor(code: PersistenceErrorCode, options: { retryable?: boolean; cause?: unknown } = {}) {
    super(code, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "PersistenceError";
    this.code = code;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
  }
}

export function classifyPersistenceError(error: unknown, fallback: PersistenceErrorCode): PersistenceError {
  if (error instanceof PersistenceError) {
    return error;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED" || /database is locked|database table is locked/i.test(message)) {
    return new PersistenceError("BUSY_RETRYABLE", { cause: error });
  }
  return new PersistenceError(fallback, { cause: error });
}
