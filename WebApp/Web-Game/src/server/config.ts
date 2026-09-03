import { resolve } from "node:path";

export type LogLevel = "error" | "warn" | "info" | "debug";

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
  const shutdownTimeoutMs = env.SHUTDOWN_TIMEOUT_MS
    ? parseInteger(env, "SHUTDOWN_TIMEOUT_MS", env.SHUTDOWN_TIMEOUT_MS, {
        required: false,
        min: 100,
        max: 30000,
      })
    : 2000;

  const host = env.HOST === undefined || env.HOST === "" ? "127.0.0.1" : env.HOST;
  const configuredDbPath = env.GAME_DB_PATH;
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

  return {
    host,
    port,
    shutdownTimeoutMs,
    gameDbPath,
    logLevel,
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    localFixtureMode,
    autonomousWorldMode,
  };
}
