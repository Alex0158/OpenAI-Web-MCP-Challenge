import { randomUUID } from "node:crypto";

import { PersistenceError } from "./persistence/store";
import type {
  ReentryDeliveryPort,
  ReentryPumpResult,
} from "./reentry-delivery-port";

export type ReentryDeliveryRunnerState = "created" | "running" | "draining" | "stopped";

export interface ReentryDeliveryRunnerOptions {
  readonly port: Pick<ReentryDeliveryPort, "pumpOnce">;
  readonly worldId: string;
  readonly nowWallTimeMs?: () => number;
  /** One process-owned lease identity; it is never sent to the Receiver. */
  readonly leaseId?: () => string;
  readonly onResult?: (result: ReentryPumpResult) => void;
  readonly onError?: (error: unknown) => void;
}

export interface ReentryDeliveryRunnerSnapshot {
  readonly state: ReentryDeliveryRunnerState;
  readonly pendingWake: boolean;
  readonly inFlight: boolean;
}

export interface ReentryDeliveryRunnerLifecycle {
  start(): void;
  requestWake(): void;
  stop(): Promise<void>;
}

/**
 * Drives the existing Game delivery port without adding a queue or a clock.
 * Completed world boundaries and startup request a wake; interpolation ticks
 * do not. This runner coalesces wakes while one pump is active and lets the
 * durable outbox decide whether work is pending, retryable, or settled.
 */
export class ReentryDeliveryRunner implements ReentryDeliveryRunnerLifecycle {
  private readonly port: Pick<ReentryDeliveryPort, "pumpOnce">;
  private readonly worldId: string;
  private readonly nowWallTimeMs: () => number;
  private readonly leaseId: () => string;
  private readonly onResult?: (result: ReentryPumpResult) => void;
  private readonly onError?: (error: unknown) => void;
  private currentState: ReentryDeliveryRunnerState = "created";
  private pendingWake = false;
  private inFlight: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private generation = 0;

  constructor(options: ReentryDeliveryRunnerOptions) {
    if (!options || !options.port || typeof options.port.pumpOnce !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (typeof options.worldId !== "string" || options.worldId.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.nowWallTimeMs !== undefined && typeof options.nowWallTimeMs !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.leaseId !== undefined && typeof options.leaseId !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.onResult !== undefined && typeof options.onResult !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.onError !== undefined && typeof options.onError !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.port = options.port;
    this.worldId = options.worldId;
    this.nowWallTimeMs = options.nowWallTimeMs ?? (() => Date.now());
    const defaultLeaseId = `game-delivery-runner:${process.pid}:${randomUUID()}`;
    this.leaseId = options.leaseId ?? (() => defaultLeaseId);
    this.onResult = options.onResult;
    this.onError = options.onError;
  }

  get state(): ReentryDeliveryRunnerState {
    return this.currentState;
  }

  snapshot(): ReentryDeliveryRunnerSnapshot {
    return {
      state: this.currentState,
      pendingWake: this.pendingWake,
      inFlight: this.inFlight !== null,
    };
  }

  start(): void {
    if (this.currentState === "running") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (this.currentState === "draining" || this.currentState === "stopped") {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.currentState = "running";
    this.requestWake();
  }

  /** Request one delivery check; repeated requests while active are coalesced. */
  requestWake(): void {
    if (this.currentState !== "running") return;
    this.pendingWake = true;
    if (this.inFlight === null) {
      const generation = this.generation;
      const operation = this.drain(generation);
      this.inFlight = operation;
      void operation.then(
        () => {
          if (this.inFlight === operation) this.inFlight = null;
        },
        () => {
          if (this.inFlight === operation) this.inFlight = null;
        },
      );
    }
  }

  stop(): Promise<void> {
    if (this.currentState === "created" || this.currentState === "stopped") {
      this.currentState = "stopped";
      return Promise.resolve();
    }
    if (this.currentState === "draining" && this.stopPromise) {
      return this.stopPromise;
    }
    this.currentState = "draining";
    this.generation += 1;
    this.pendingWake = false;
    const inFlight = this.inFlight;
    this.stopPromise = (inFlight ? inFlight.catch(() => undefined) : Promise.resolve()).then(() => {
      this.currentState = "stopped";
    });
    return this.stopPromise;
  }

  private async drain(generation: number): Promise<void> {
    while (this.currentState === "running" && generation === this.generation && this.pendingWake) {
      this.pendingWake = false;
      let result: ReentryPumpResult;
      try {
        const nowWallTimeMs = this.nowWallTimeMs();
        const leaseId = this.leaseId();
        if (!Number.isFinite(nowWallTimeMs) || nowWallTimeMs < 0
          || typeof leaseId !== "string" || leaseId.trim() === "") {
          throw new PersistenceError("INVALID_INPUT");
        }
        result = await this.port.pumpOnce({
          worldId: this.worldId,
          nowWallTimeMs,
          leaseId,
        });
      } catch (error) {
        this.notifyError(error);
        continue;
      }
      this.notifyResult(result);
    }
  }

  private notifyResult(result: ReentryPumpResult): void {
    if (!this.onResult) return;
    try {
      this.onResult(result);
    } catch (error) {
      this.notifyError(error);
    }
  }

  private notifyError(error: unknown): void {
    try {
      this.onError?.(error);
    } catch {
      // Observability is outside the delivery authority boundary.
    }
  }
}
