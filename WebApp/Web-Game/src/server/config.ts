import { resolve } from "node:path";

export type LogLevel = "error" | "warn" | "info" | "debug";
export type GameAuthProvider = "none" | "clerk";

export interface RuntimeConfig {
  host: string;
  port: number;
  shutdownTimeoutMs: number;
  gameDbPath: string;
  logLevel: LogLevel;
  nodeEnv: "development" | "production" | "test";
  localFixtureMode: boolean;
  /** Explicit opt-in for the process-owned autonomous world driver. */
  autonomousWorldMode: boolean;
  /** Production admission provider. `none` keeps the server fail-closed. */
  authProvider: GameAuthProvider;
  /** Stable world identity used by the idempotent production bootstrap. */
  gameWorldId: string;
  /** Clerk verification material is kept in memory and never logged. */
  clerkSecretKey: string | null;
  clerkJwtKey: string | null;
  clerkAuthorizedParties: readonly string[];
  /** Fixed demo subject allow-list. The provider subject is never client-supplied. */
  clerkPlayerSubjects: Readonly<{
    playerA: string | null;
    playerB: string | null;
  }>;
}

export type ConfigErrorCode = "CONFIG_MISSING" | "CONFIG_INVALID";

export class RuntimeConfigError extends Error {
  readonly code: ConfigErrorCode;
  readonly field: string;

  constructor(code: ConfigErrorCode, field: string) {
    super(code);
    this.name = "RuntimeConfigError";
    this.code = code;
    this.field = field;
  }
}

function parseInteger(
  env: NodeJS.ProcessEnv,
  field: string,
  value: string | undefined,
  options: { required: boolean; min: number; max: number },
): number {
  if (value === undefined || value.trim() === "") {
    if (options.required) {
      throw new RuntimeConfigError("CONFIG_MISSING", field);
    }
    throw new RuntimeConfigError("CONFIG_INVALID", field);
  }

  if (!/^-?\d+$/.test(value)) {
    throw new RuntimeConfigError("CONFIG_INVALID", field);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < options.min || parsed > options.max) {
    throw new RuntimeConfigError("CONFIG_INVALID", field);
  }

  return parsed;
}

function parseNodeEnv(value: string | undefined): RuntimeConfig["nodeEnv"] {
  if (value === undefined || value === "") {
    return "development";
  }
  if (value === "development" || value === "production" || value === "test") {
    return value;
  }
  throw new RuntimeConfigError("CONFIG_INVALID", "NODE_ENV");
}

function parseAuthProvider(value: string | undefined): GameAuthProvider {
  if (value === undefined || value === "") {
    return "none";
  }
  if (value === "none" || value === "clerk") {
    return value;
  }
  throw new RuntimeConfigError("CONFIG_INVALID", "GAME_AUTH_PROVIDER");
}

function parseRequiredString(env: NodeJS.ProcessEnv, field: string, fallback: string): string {
  const value = env[field] === undefined || env[field] === "" ? fallback : env[field] as string;
  if (value.trim() === "") {
    throw new RuntimeConfigError("CONFIG_INVALID", field);
  }
  return value.trim();
}

function parseOptionalString(env: NodeJS.ProcessEnv, field: string): string | null {
  const value = env[field];
  if (value === undefined || value.trim() === "") {
    return null;
  }
  return value.trim();
}

function parseAuthorizedParties(env: NodeJS.ProcessEnv): readonly string[] {
  const raw = env.CLERK_AUTHORIZED_PARTIES;
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  const values = raw.split(",").map((value) => value.trim());
  if (values.some((value) => value === "") || new Set(values).size !== values.length) {
    throw new RuntimeConfigError("CONFIG_INVALID", "CLERK_AUTHORIZED_PARTIES");
  }
  return Object.freeze(values);
}

function parseBooleanFlag(env: NodeJS.ProcessEnv, field: string): boolean {
  const value = env[field];
  if (value === undefined || value === "") {
    return false;
  }
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  throw new RuntimeConfigError("CONFIG_INVALID", field);
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const port = parseInteger(env, "PORT", env.PORT, { required: true, min: 0, max: 65535 });
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const authProvider = parseAuthProvider(env.GAME_AUTH_PROVIDER);
  const shutdownTimeoutMs = env.SHUTDOWN_TIMEOUT_MS
    ? parseInteger(env, "SHUTDOWN_TIMEOUT_MS", env.SHUTDOWN_TIMEOUT_MS, {
        required: false,
        min: 100,
        max: 30000,
      })
    : 2000;

  const host = env.HOST === undefined || env.HOST === ""
    ? (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1")
    : env.HOST;
  const configuredDbPath = env.GAME_DB_PATH;
  if (nodeEnv === "production" && authProvider === "clerk" && (configuredDbPath === undefined || configuredDbPath.trim() === "")) {
    throw new RuntimeConfigError("CONFIG_MISSING", "GAME_DB_PATH");
  }
  if (configuredDbPath !== undefined && (configuredDbPath.trim() === "" || configuredDbPath.trim() === ":memory:")) {
    throw new RuntimeConfigError("CONFIG_INVALID", "GAME_DB_PATH");
  }
  const gameDbPath = resolve(configuredDbPath ?? "tmp/runtime/world.sqlite");
  const logLevel = env.LOG_LEVEL === undefined || env.LOG_LEVEL === "" ? "info" : env.LOG_LEVEL;
  if (logLevel !== "error" && logLevel !== "warn" && logLevel !== "info" && logLevel !== "debug") {
    throw new RuntimeConfigError("CONFIG_INVALID", "LOG_LEVEL");
  }
  const localFixtureMode = parseBooleanFlag(env, "LOCAL_FIXTURE_MODE");
  const autonomousWorldMode = parseBooleanFlag(env, "AUTONOMOUS_WORLD_MODE");
  const gameWorldId = parseRequiredString(env, "GAME_WORLD_ID", "sleepless-mvp-01");
  const clerkSecretKey = parseOptionalString(env, "CLERK_SECRET_KEY");
  const clerkJwtKey = parseOptionalString(env, "CLERK_JWT_KEY");
  const clerkPlayerSubjects = Object.freeze({
    playerA: parseOptionalString(env, "CLERK_PLAYER_A_SUBJECT"),
    playerB: parseOptionalString(env, "CLERK_PLAYER_B_SUBJECT"),
  });
  if (nodeEnv === "production" && authProvider === "clerk") {
    if (!autonomousWorldMode) {
      throw new RuntimeConfigError("CONFIG_INVALID", "AUTONOMOUS_WORLD_MODE");
    }
    if (clerkSecretKey === null && clerkJwtKey === null) {
      throw new RuntimeConfigError("CONFIG_MISSING", "CLERK_SECRET_KEY");
    }
    if (clerkPlayerSubjects.playerA === null) {
      throw new RuntimeConfigError("CONFIG_MISSING", "CLERK_PLAYER_A_SUBJECT");
    }
    if (clerkPlayerSubjects.playerB === null) {
      throw new RuntimeConfigError("CONFIG_MISSING", "CLERK_PLAYER_B_SUBJECT");
    }
  }

  return {
    host,
    port,
    shutdownTimeoutMs,
    gameDbPath,
    logLevel,
    nodeEnv,
    localFixtureMode,
    autonomousWorldMode,
    authProvider,
    gameWorldId,
    clerkSecretKey,
    clerkJwtKey,
    clerkAuthorizedParties: parseAuthorizedParties(env),
    clerkPlayerSubjects,
  };
}
