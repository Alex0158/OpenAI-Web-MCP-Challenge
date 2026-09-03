import { PersistenceError } from "./persistence/errors";

export type AutonomousSchedulerState = "created" | "running" | "draining" | "stopped" | "failed";

export interface AutonomousWorldSchedulerOptions {
  cadenceMs?: number;
  monotonicNowMs: () => number;
  setTimeout?: (callback: () => void, delayMs: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  advance: (elapsedMs: number) => void | Promise<void>;
  onFault?: (error: unknown) => void;
}

export interface AutonomousSchedulerSnapshot {
  state: AutonomousSchedulerState;
  scheduled: boolean;
  inFlight: boolean;
  lastErrorCode?: string;
}

function defaultSetTimeout(callback: () => void, delayMs: number): unknown {
  return setTimeout(callback, delayMs);
}

function defaultClearTimeout(handle: unknown): void {
  clearTimeout(handle as NodeJS.Timeout);
}

export function defaultMonotonicNowMs(): number {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

/**
 * One worker-owned wakeup loop. The timer is only a wakeup; elapsed gameplay
 * time comes from the injected monotonic process clock.
 */
export class AutonomousWorldScheduler {
  private currentState: AutonomousSchedulerState = "created";
  private timerHandle: unknown | null = null;
  private inFlight: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private generation = 0;
  private lastMonotonicMs: number | null = null;
  private lastErrorCode: string | undefined;
  private faultNotified = false;
  private readonly cadenceMs: number;
  private readonly monotonicNowMs: () => number;
  private readonly scheduleTimeout: (callback: () => void, delayMs: number) => unknown;
  private readonly clearScheduledTimeout: (handle: unknown) => void;
  private readonly advance: (elapsedMs: number) => void | Promise<void>;
  private readonly onFault?: (error: unknown) => void;

  constructor(options: AutonomousWorldSchedulerOptions) {
    const cadenceMs = options.cadenceMs ?? 100;
    if (!Number.isSafeInteger(cadenceMs) || cadenceMs <= 0) {
      throw new Error("INVALID_SCHEDULER_CONFIG");
    }
    this.cadenceMs = cadenceMs;
    this.monotonicNowMs = options.monotonicNowMs;
    this.scheduleTimeout = options.setTimeout ?? defaultSetTimeout;
    this.clearScheduledTimeout = options.clearTimeout ?? defaultClearTimeout;
    this.advance = options.advance;
    this.onFault = options.onFault;
  }

  get state(): AutonomousSchedulerState {
    return this.currentState;
  }

  start(): void {
    if (this.currentState === "running") {
      throw new Error("SCHEDULER_ALREADY_STARTED");
    }
    if (this.currentState === "draining") {
      throw new Error("SCHEDULER_DRAINING");
    }
    if (this.currentState === "stopped") {
      throw new Error("SCHEDULER_STOPPED");
    }
    if (this.currentState === "failed") {
      throw new Error("SCHEDULER_FAILED");
    }

    const baseline = this.monotonicNowMs();
    this.assertMonotonicValue(baseline);
    this.lastMonotonicMs = baseline;
    this.currentState = "running";
    this.scheduleNextWakeup(this.generation);
  }

  stop(): Promise<void> {
    if (this.currentState === "created" || this.currentState === "stopped") {
      return Promise.resolve();
    }
    if (this.currentState === "draining" && this.stopPromise) {
      return this.stopPromise;
    }
    if (this.currentState === "failed") {
      this.clearWakeup();
      return Promise.resolve();
    }

    this.currentState = "draining";
    this.generation += 1;
    this.clearWakeup();
    const inFlight = this.inFlight;
    this.stopPromise = (inFlight ? inFlight.catch(() => undefined) : Promise.resolve()).then(() => {
      if (this.currentState === "draining") {
        this.currentState = "stopped";
      }
    });
    return this.stopPromise;
  }

  snapshot(): AutonomousSchedulerSnapshot {
    const snapshot: AutonomousSchedulerSnapshot = {
      state: this.currentState,
      scheduled: this.timerHandle !== null,
      inFlight: this.inFlight !== null,
    };
    if (this.lastErrorCode) {
      snapshot.lastErrorCode = this.lastErrorCode;
    }
    return snapshot;
  }

  private scheduleNextWakeup(generation: number): void {
    if (this.currentState !== "running" || generation !== this.generation || this.timerHandle !== null) {
      return;
    }
    this.timerHandle = this.scheduleTimeout(() => {
      this.timerHandle = null;
      void this.runWakeup(generation);
    }, this.cadenceMs);
  }

  private async runWakeup(generation: number): Promise<void> {
    if (this.currentState !== "running" || generation !== this.generation || this.inFlight !== null) {
      return;
    }

    const operation = Promise.resolve().then(() => {
      const now = this.monotonicNowMs();
      this.assertMonotonicValue(now);
      const previous = this.lastMonotonicMs;
      if (previous === null || now < previous) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      this.lastMonotonicMs = now;
      return this.advance(now - previous);
    });
    this.inFlight = operation;
    try {
      await operation;
    } catch (error) {
      this.fail(error);
    } finally {
      if (this.inFlight === operation) {
        this.inFlight = null;
      }
      if (this.currentState === "running" && generation === this.generation) {
        this.scheduleNextWakeup(generation);
      }
    }
  }

  private fail(error: unknown): void {
    if (this.currentState === "failed" || this.currentState === "stopped") {
      return;
    }
    this.currentState = "failed";
    this.generation += 1;
    this.clearWakeup();
    this.lastErrorCode = error instanceof PersistenceError
      ? error.code
      : error instanceof Error && error.message !== ""
        ? error.message
        : "SCHEDULER_FAILED";
    if (!this.faultNotified) {
      this.faultNotified = true;
      this.onFault?.(error);
    }
  }

  private clearWakeup(): void {
    if (this.timerHandle !== null) {
      this.clearScheduledTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private assertMonotonicValue(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  }
}
