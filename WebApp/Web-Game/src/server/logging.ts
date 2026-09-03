import type { LogLevel } from "./config";

export interface LifecycleLog {
  event: string;
  level: LogLevel;
  wall_time: string;
  service: "sleepless-kingdom";
  process_instance_id: string | null;
  worker_instance_id: string | null;
  error_code: string | null;
}

export interface LoggerOptions {
  level: LogLevel;
  processInstanceId: string | null;
  workerInstanceId: string | null;
  write?: (line: string) => void;
}

const severity: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class JsonLogger {
  private readonly options: LoggerOptions;

  constructor(options: LoggerOptions) {
    this.options = options;
  }

  debug(event: string): void {
    this.emit("debug", event, null);
  }

  info(event: string): void {
    this.emit("info", event, null);
  }

  warn(event: string, errorCode: string | null = null): void {
    this.emit("warn", event, errorCode);
  }

  error(event: string, errorCode: string | null = null): void {
    this.emit("error", event, errorCode);
  }

  private emit(level: LogLevel, event: string, errorCode: string | null): void {
    if (severity[level] < severity[this.options.level]) {
      return;
    }

    const record: LifecycleLog = {
      event,
      level,
      wall_time: new Date().toISOString(),
      service: "sleepless-kingdom",
      process_instance_id: this.options.processInstanceId,
      worker_instance_id: this.options.workerInstanceId,
      error_code: errorCode,
    };

    const write = this.options.write ?? ((line: string) => process.stdout.write(line));
    write(`${JSON.stringify(record)}\n`);
  }
}

export function writeBootstrapError(code: string, write: (line: string) => void = (line) => process.stderr.write(line)): void {
  const record: LifecycleLog = {
    event: "startup_failed",
    level: "error",
    wall_time: new Date().toISOString(),
    service: "sleepless-kingdom",
    process_instance_id: null,
    worker_instance_id: null,
    error_code: code,
  };
  write(`${JSON.stringify(record)}\n`);
}
