import { classifyPersistenceError, PersistenceError, type PersistenceErrorCode } from "./persistence/errors";
import type { WorldRecord } from "./persistence/types";

export const WORLD_CLOCK_STEP_MS = 100;
export const WORLD_CLOCK_WORLD_SECOND_MS = 1000;
export const MAX_RECOVERY_WORLD_SECONDS = 300;

export const WORLD_CLOCK_PHASES = [
  "movement",
  "deposit",
  "contact",
  "extraction",
  "combat",
  "settlement",
  "timers",
] as const;

export type WorldClockPhase = (typeof WORLD_CLOCK_PHASES)[number];
export type WorldClockState = "created" | "recovering" | "running" | "recovery_blocked" | "stopped";

export interface WorldClockPersistence {
  getWorld(worldId: string): WorldRecord | null;
  advanceWorldTime(worldId: string, worldTime: number): WorldRecord;
  beginWorldBoundary?(worldId: string, worldTime: number): WorldRecord;
  completeWorldBoundary?(worldId: string, worldTime: number, serverTimeAnchorMs?: number): WorldRecord;
}

export interface WorldClockContext {
  worldId: string;
  worldTime: number;
  phase: WorldClockPhase;
}

export type WorldClockPhaseHandler = (context: WorldClockContext) => void;

export interface WorldClockReconciliationContext {
  worldId: string;
  worldTime: number;
  elapsedMs: number;
}

export type WorldClockReconciliationHandler = (context: WorldClockReconciliationContext) => void;

export interface WorldClockOptions {
  worldId: string;
  persistence: WorldClockPersistence;
  maxRecoveryWorldSeconds?: number;
  phaseHandlers?: Partial<Record<WorldClockPhase, WorldClockPhaseHandler>>;
  reconciliationHandlers?: readonly WorldClockReconciliationHandler[];
  /** Optional trusted server observation used only by autonomous startup/live mode. */
  serverTimeAnchorProvider?: () => number;
}

export interface WorldClockSnapshot {
  state: WorldClockState;
  worldTime: number;
  interpolationElapsedMs: number;
  interpolationAlpha: number;
  lastErrorCode?: PersistenceErrorCode;
}

export interface WorldClockAdvanceResult {
  worldTime: number;
  processedBoundaries: number;
}

/**
 * Worker-owned authoritative clock. It deliberately accepts elapsed worker time
 * and explicit trusted recovery targets; browser time is not part of this API.
 */
export class WorldClock {
  private currentState: WorldClockState = "created";
  private currentWorldTime = 0;
  private interpolationElapsedMs = 0;
  private lastErrorCode: PersistenceErrorCode | undefined;
  private readonly worldId: string;
  private readonly persistence: WorldClockPersistence;
  private readonly maxRecoveryWorldSeconds: number;
  private readonly phaseHandlers: Partial<Record<WorldClockPhase, WorldClockPhaseHandler>>;
  private readonly reconciliationHandlers: readonly WorldClockReconciliationHandler[];
  private readonly serverTimeAnchorProvider?: () => number;

  constructor(options: WorldClockOptions) {
    if (options.worldId.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (!Number.isSafeInteger(options.maxRecoveryWorldSeconds ?? MAX_RECOVERY_WORLD_SECONDS) || (options.maxRecoveryWorldSeconds ?? MAX_RECOVERY_WORLD_SECONDS) <= 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.worldId = options.worldId;
    this.persistence = options.persistence;
    this.maxRecoveryWorldSeconds = options.maxRecoveryWorldSeconds ?? MAX_RECOVERY_WORLD_SECONDS;
    this.phaseHandlers = options.phaseHandlers ?? {};
    this.reconciliationHandlers = options.reconciliationHandlers ?? [];
    this.serverTimeAnchorProvider = options.serverTimeAnchorProvider;
  }

  get state(): WorldClockState {
    return this.currentState;
  }

  start(): void {
    if (this.currentState === "running") {
      return;
    }
    if (this.currentState !== "created") {
      throw new PersistenceError("INVALID_INPUT");
    }

    const world = this.persistence.getWorld(this.worldId);
    if (!world || world.worldId !== this.worldId || !Number.isSafeInteger(world.worldTime) || world.worldTime < 0) {
      throw new PersistenceError(world ? "RECOVERY_REQUIRED" : "WORLD_NOT_FOUND");
    }
    this.currentWorldTime = world.worldTime;
    this.interpolationElapsedMs = 0;
    this.lastErrorCode = undefined;
    const inProgressWorldTime = world.inProgressWorldTime ?? null;
    if (inProgressWorldTime === null) {
      this.currentState = "running";
      return;
    }
    if (!Number.isSafeInteger(inProgressWorldTime) || inProgressWorldTime !== this.currentWorldTime + 1) {
      this.blockWith("RECOVERY_REQUIRED");
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    this.currentState = "recovering";
    try {
      // Complete the interrupted boundary without taking a new wall-time
      // observation. Autonomous startup must derive downtime from the anchor
      // that preceded the marker; refreshing it here would discard the gap
      // between the last completed boundary and this replay.
      this.processBoundary(inProgressWorldTime, false);
    } catch (error) {
      const typed = classifyPersistenceError(error, "RECOVERY_REQUIRED");
      this.blockWith(typed.code);
      throw typed;
    }
    this.currentState = "running";
  }

  stop(): void {
    this.currentState = "stopped";
    this.interpolationElapsedMs = 0;
  }

  tick(elapsedMs: number): WorldClockAdvanceResult {
    this.assertRunning();
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const previousInterpolationElapsedMs = this.interpolationElapsedMs;
    const totalElapsedMs = previousInterpolationElapsedMs + elapsedMs;
    const processedSeconds = Math.floor(totalElapsedMs / WORLD_CLOCK_WORLD_SECOND_MS);
    const remainderMs = totalElapsedMs - processedSeconds * WORLD_CLOCK_WORLD_SECOND_MS;
    if (processedSeconds > this.maxRecoveryWorldSeconds) {
      this.blockWith("RECOVERY_LIMIT_EXCEEDED");
      throw new PersistenceError("RECOVERY_LIMIT_EXCEEDED");
    }

    const firstStep = Math.floor(previousInterpolationElapsedMs / WORLD_CLOCK_STEP_MS) + 1;
    const lastStep = Math.floor(totalElapsedMs / WORLD_CLOCK_STEP_MS);
    this.currentState = processedSeconds > 0 ? "recovering" : "running";
    try {
      for (let step = firstStep; step <= lastStep; step += 1) {
        for (const handler of this.reconciliationHandlers) {
          handler({ worldId: this.worldId, worldTime: this.currentWorldTime, elapsedMs: WORLD_CLOCK_STEP_MS });
        }
        if (step % (WORLD_CLOCK_WORLD_SECOND_MS / WORLD_CLOCK_STEP_MS) === 0) {
          this.processBoundary(this.currentWorldTime + 1);
        }
      }
    } catch (error) {
      const typed = classifyPersistenceError(error, "RECOVERY_REQUIRED");
      this.blockWith(typed.code);
      throw typed;
    }
    this.interpolationElapsedMs = remainderMs;
    this.currentState = "running";
    return { worldTime: this.currentWorldTime, processedBoundaries: processedSeconds };
  }

  recoverTo(targetWorldTime: number): WorldClockAdvanceResult {
    this.assertStarted();
    if (!Number.isSafeInteger(targetWorldTime) || targetWorldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (targetWorldTime < this.currentWorldTime) {
      this.lastErrorCode = "WORLD_TIME_REGRESSION";
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }

    const gap = targetWorldTime - this.currentWorldTime;
    if (gap > this.maxRecoveryWorldSeconds) {
      this.blockWith("RECOVERY_LIMIT_EXCEEDED");
      throw new PersistenceError("RECOVERY_LIMIT_EXCEEDED");
    }

    this.interpolationElapsedMs = 0;
    const result = this.advanceTo(targetWorldTime);
    this.lastErrorCode = undefined;
    this.currentState = "running";
    return result;
  }

  snapshot(): WorldClockSnapshot {
    const snapshot: WorldClockSnapshot = {
      state: this.currentState,
      worldTime: this.currentWorldTime,
      interpolationElapsedMs: this.interpolationElapsedMs,
      interpolationAlpha: this.interpolationElapsedMs / WORLD_CLOCK_WORLD_SECOND_MS,
    };
    if (this.lastErrorCode) {
      snapshot.lastErrorCode = this.lastErrorCode;
    }
    return snapshot;
  }

  private advanceTo(targetWorldTime: number): WorldClockAdvanceResult {
    const processedBoundaries = targetWorldTime - this.currentWorldTime;
    if (processedBoundaries === 0) {
      return { worldTime: this.currentWorldTime, processedBoundaries: 0 };
    }

    this.currentState = "recovering";
    try {
      for (let worldTime = this.currentWorldTime + 1; worldTime <= targetWorldTime; worldTime += 1) {
        this.processBoundary(worldTime);
      }
    } catch (error) {
      const typed = classifyPersistenceError(error, "RECOVERY_REQUIRED");
      this.blockWith(typed.code);
      throw typed;
    }
    this.currentState = "running";
    return { worldTime: this.currentWorldTime, processedBoundaries };
  }

  private processBoundary(worldTime: number, updateServerTimeAnchor = true): void {
    const hasBegin = typeof this.persistence.beginWorldBoundary === "function";
    const hasComplete = typeof this.persistence.completeWorldBoundary === "function";
    if (hasBegin !== hasComplete) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    if (hasBegin && hasComplete) {
      const reserved = this.persistence.beginWorldBoundary!(this.worldId, worldTime);
      if (reserved.worldId !== this.worldId
        || !Number.isSafeInteger(reserved.worldTime)
        || reserved.worldTime !== worldTime - 1
        || reserved.inProgressWorldTime !== worldTime) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
    }
    for (const phase of WORLD_CLOCK_PHASES) {
      this.phaseHandlers[phase]?.({ worldId: this.worldId, worldTime, phase });
    }
    const persisted = hasBegin && hasComplete
      ? updateServerTimeAnchor && this.serverTimeAnchorProvider
        ? this.persistence.completeWorldBoundary!(this.worldId, worldTime, this.serverTimeAnchorProvider())
        : this.persistence.completeWorldBoundary!(this.worldId, worldTime)
      : this.persistence.advanceWorldTime(this.worldId, worldTime);
    if (persisted.worldId !== this.worldId || !Number.isSafeInteger(persisted.worldTime) || persisted.worldTime !== worldTime) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    if (hasBegin && hasComplete && persisted.inProgressWorldTime !== null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    this.currentWorldTime = persisted.worldTime;
  }

  private assertStarted(): void {
    if (this.currentState === "created") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (this.currentState === "stopped") {
      throw new PersistenceError("INVALID_INPUT");
    }
  }

  private assertRunning(): void {
    if (this.currentState !== "running") {
      throw new PersistenceError(this.currentState === "recovery_blocked" ? "RECOVERY_REQUIRED" : "INVALID_INPUT");
    }
  }

  private blockWith(code: PersistenceErrorCode): void {
    this.currentState = "recovery_blocked";
    this.lastErrorCode = code;
    this.interpolationElapsedMs = 0;
  }
}
