import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createPersistenceStore, PersistenceError, PersistenceStore } from "./persistence/store";
import { PlayerMovementCadenceService } from "./player-movement-cadence";
import { ClientSnapshotService, PlayerMovementService } from "./world-projection";
import { WorkerCommandGateway } from "./worker-command-gateway";
import { MissionService } from "./mission-service";
import { MissionDepositService } from "./mission-deposit-service";
import { MissionExtractionService } from "./mission-extraction-service";
import { MissionReturnService } from "./mission-return-service";
import { MissionTravelService } from "./mission-travel-service";
import { MonsterCombatService, type MonsterCombatSignalEligibilityProvider } from "./monster-combat-service";
import { GameplayPhaseCoordinator } from "./gameplay-phase-coordinator";
import { WorldClock, type WorldClockAdvanceResult } from "./world-clock";
import { AutonomousWorldScheduler, defaultMonotonicNowMs } from "./autonomous-world-scheduler";
import { deriveTrustedRecoveryTarget } from "./trusted-world-time";

export type WorldWorkerState = "created" | "starting" | "ready" | "stopped";

export interface WorkerPersistence {
  open(): void;
  close(): void;
}

export interface WorkerClockLifecycle {
  start(): void;
  stop(): void;
  tick?(elapsedMs: number): WorldClockAdvanceResult;
}

export interface WorldWorkerOptions {
  failStart?: boolean;
  startDelayMs?: number;
  stopDelayMs?: number;
  dbPath?: string;
  store?: WorkerPersistence;
  clock?: WorkerClockLifecycle;
  worldId?: string;
  /** Enable the explicit worker-owned autonomous driver for this process. */
  autonomous?: boolean;
  serverTimeNowMs?: () => number;
  monotonicNowMs?: () => number;
  schedulerCadenceMs?: number;
  /** Optional server-owned grant policy for terminal eligible combat events. */
  signalEligibilityProvider?: MonsterCombatSignalEligibilityProvider;
}

export type WorkerFaultListener = (errorCode: "WORKER_FAULT") => void;
export type WorldAdvanceListener = (result: WorldClockAdvanceResult) => void;

export interface WorldWorker {
  readonly instanceId: string;
  readonly state: WorldWorkerState;
  /** The process-owned persistence instance, when the worker exposes one. */
  readonly persistence?: WorkerPersistence;
  readonly gateway?: WorkerCommandGateway;
  readonly clock?: WorkerClockLifecycle;
  readonly scheduler?: AutonomousWorldScheduler;
  readonly gameplayPhaseCoordinator?: GameplayPhaseCoordinator;
  start(): Promise<void>;
  stop(): Promise<void>;
  onFault(listener: WorkerFaultListener): void;
  /** Register a process-local observer for successful live advances. */
  onAdvance?(listener: WorldAdvanceListener): void;
  advance?(elapsedMs: number): WorldClockAdvanceResult;
}

export class WorkerStartError extends Error {
  readonly code = "WORKER_START_FAILED" as const;

  constructor() {
    super("WORKER_START_FAILED");
    this.name = "WorkerStartError";
  }
}

export class WorldWorkerModule implements WorldWorker {
  readonly instanceId = randomUUID();
  readonly gateway?: WorkerCommandGateway;
  readonly persistence: WorkerPersistence;
  private currentState: WorldWorkerState = "created";
  private startPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private stopRequested = false;
  private readonly options: WorldWorkerOptions;
  private readonly store: WorkerPersistence;
  private currentClock?: WorkerClockLifecycle;
  private currentCoordinator?: GameplayPhaseCoordinator;
  private currentScheduler?: AutonomousWorldScheduler;
  private readonly worldId?: string;
  private readonly cadence?: PlayerMovementCadenceService;
  private readonly listeners = new Set<WorkerFaultListener>();
  private readonly advanceListeners = new Set<WorldAdvanceListener>();
  private readonly serverTimeNowMs: () => number;
  private autonomousRecoveryBaseWorldTime: number | null = null;

  constructor(options: WorldWorkerOptions = {}) {
    this.options = options;
    this.store = options.store ?? createPersistenceStore({ dbPath: resolve(options.dbPath ?? "tmp/runtime/world.sqlite") });
    this.persistence = this.store;
    this.currentClock = options.clock;
    this.worldId = options.worldId;
    this.serverTimeNowMs = options.serverTimeNowMs ?? (() => Date.now());
    if (this.store instanceof PersistenceStore) {
      const movement = new PlayerMovementService({ store: this.store });
      const cadence = new PlayerMovementCadenceService({ store: this.store, movement });
      this.cadence = cadence;
      const snapshot = new ClientSnapshotService({ store: this.store });
      const mission = new MissionService({ store: this.store });
      this.gateway = new WorkerCommandGateway({ worker: this, movement, cadence, snapshot, mission });
    }
  }

  get state(): WorldWorkerState {
    return this.currentState;
  }

  get clock(): WorkerClockLifecycle | undefined {
    return this.currentClock;
  }

  get gameplayPhaseCoordinator(): GameplayPhaseCoordinator | undefined {
    return this.currentCoordinator;
  }

  get scheduler(): AutonomousWorldScheduler | undefined {
    return this.currentScheduler;
  }

  onFault(listener: WorkerFaultListener): void {
    this.listeners.add(listener);
  }

  onAdvance(listener: WorldAdvanceListener): void {
    if (typeof listener !== "function") {
      throw new TypeError("WORLD_ADVANCE_LISTENER_INVALID");
    }
    this.advanceListeners.add(listener);
  }

  /**
   * Drive one explicit worker-owned clock advance. Autonomous mode calls this
   * same seam from its monotonic scheduler; browser timing is never accepted.
   */
  advance(elapsedMs: number): WorldClockAdvanceResult {
    if (this.currentState !== "ready") {
      throw new Error("WORKER_NOT_READY");
    }
    if (!this.currentClock?.tick) {
      throw new Error("WORKER_CLOCK_UNAVAILABLE");
    }
    const result = this.currentClock.tick(elapsedMs);
    for (const listener of this.advanceListeners) {
      try {
        listener(result);
      } catch {
        // Observers are projection-side notifications. A faulty observer must
        // never reject or fault the authoritative world advance.
      }
    }
    return result;
  }

  private initializeGameplayClock(): void {
    if (this.currentClock || !(this.store instanceof PersistenceStore) || !this.cadence) {
      return;
    }
    const worldIds = this.store.listWorldIds();
    if (worldIds.length === 0) {
      if (this.worldId) {
        throw new PersistenceError("WORLD_NOT_FOUND");
      }
      if (this.options.autonomous) {
        throw new PersistenceError("WORLD_NOT_FOUND");
      }
      return;
    }
    const worldId = this.worldId ?? (worldIds.length === 1 ? worldIds[0] : undefined);
    if (!worldId || !worldIds.includes(worldId)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const world = this.store.getWorld(worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    if (this.options.autonomous) {
      // Preserve the completed time from before an interrupted-boundary
      // replay. The replay advances the durable world by one boundary, but
      // downtime must still be measured from the anchor that preceded it.
      this.autonomousRecoveryBaseWorldTime = world.worldTime;
    }
    const travel = new MissionTravelService({ store: this.store });
    const returning = new MissionReturnService({ store: this.store });
    const deposit = new MissionDepositService({ store: this.store });
    const extraction = new MissionExtractionService({ store: this.store });
    const combat = new MonsterCombatService({
      store: this.store,
      signalEligibilityProvider: this.options.signalEligibilityProvider,
    });
    this.currentCoordinator = new GameplayPhaseCoordinator({ travel, returning, deposit, extraction, combat });
    this.currentClock = new WorldClock({
      worldId,
      persistence: this.store,
      reconciliationHandlers: [this.cadence.reconcile],
      phaseHandlers: this.currentCoordinator.phaseHandlers(),
      serverTimeAnchorProvider: this.options.autonomous ? this.serverTimeNowMs : undefined,
    });
  }

  private recoverAutonomousWorld(): void {
    if (!this.options.autonomous) {
      return;
    }
    if (!(this.store instanceof PersistenceStore) || !(this.currentClock instanceof WorldClock)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const worldId = this.worldId ?? this.store.listWorldIds()[0];
    if (!worldId) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    const world = this.store.getWorld(worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    const nowServerTimeMs = this.serverTimeNowMs();
    const currentWorldTime = this.currentClock.snapshot().worldTime;
    const target = deriveTrustedRecoveryTarget({
      completedWorldTime: this.autonomousRecoveryBaseWorldTime ?? currentWorldTime,
      serverTimeAnchorMs: world.serverTimeAnchorMs,
      nowServerTimeMs,
    });
    if (world.serverTimeAnchorMs === null) {
      const initialized = this.store.initializeServerTimeAnchor(worldId, target.serverTimeAnchorMs);
      if (initialized.serverTimeAnchorMs !== target.serverTimeAnchorMs) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      return;
    }
    // An interrupted boundary replay is already part of the recovered result.
    // Never regress it when the persisted anchor is less than one second old.
    const targetWorldTime = Math.max(currentWorldTime, target.targetWorldTime);
    if (targetWorldTime > currentWorldTime) {
      this.currentClock.recoverTo(targetWorldTime);
    }
  }

  private startAutonomousScheduler(): void {
    if (!this.options.autonomous) {
      return;
    }
    if (!this.currentClock?.tick) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    this.currentScheduler = new AutonomousWorldScheduler({
      cadenceMs: this.options.schedulerCadenceMs,
      monotonicNowMs: this.options.monotonicNowMs ?? defaultMonotonicNowMs,
      advance: (elapsedMs) => {
        this.advance(elapsedMs);
      },
      onFault: (error) => this.emitFault(error),
    });
    this.currentScheduler.start();
  }

  start(): Promise<void> {
    if (this.currentState === "ready") {
      return Promise.resolve();
    }
    if (this.currentState === "stopped") {
      return Promise.reject(new Error("WORKER_STOPPED"));
    }
    if (this.startPromise) {
      return this.startPromise;
    }

    this.currentState = "starting";
    this.stopRequested = false;
    this.startPromise = new Promise<void>((resolve, reject) => {
      const complete = async () => {
        if (this.stopRequested) {
          this.currentState = "stopped";
          reject(new Error("WORKER_STOPPED"));
          return;
        }
        try {
          this.store.open();
          this.initializeGameplayClock();
          this.currentClock?.start();
          this.recoverAutonomousWorld();
          if (this.options.failStart) {
            throw new WorkerStartError();
          }
          this.currentState = "ready";
          this.startAutonomousScheduler();
          resolve();
        } catch (error) {
          try {
            await this.currentScheduler?.stop();
          } catch {
            // Preserve the original startup failure.
          }
          try {
            this.currentClock?.stop();
          } catch {
            // Preserve the original startup failure.
          }
          try {
            this.store.close();
          } catch {
            // Preserve the startup failure and let the entrypoint publish its typed code.
          }
          this.currentState = "stopped";
          reject(error);
        }
      };

      if (this.options.startDelayMs && this.options.startDelayMs > 0) {
        setTimeout(complete, this.options.startDelayMs);
      } else {
        queueMicrotask(complete);
      }
    });

    return this.startPromise;
  }

  stop(): Promise<void> {
    if (this.currentState === "stopped") {
      return Promise.resolve();
    }
    if (this.stopPromise) {
      return this.stopPromise;
    }

    this.stopRequested = true;

    if (this.currentState === "starting" && this.startPromise) {
      this.stopPromise = this.startPromise
        .catch(() => undefined)
        .then(() => {
          this.currentState = "stopped";
        });
      return this.stopPromise;
    }

    this.stopPromise = new Promise<void>((resolve, reject) => {
      const complete = async () => {
        let failure: unknown;
        try {
          await this.currentScheduler?.stop();
        } catch (error) {
          failure = error;
        }
        try {
          this.currentClock?.stop();
        } catch (error) {
          failure = error;
        }
        this.cadence?.clearAllIntents();
        this.gateway?.close();
        try {
          this.store.close();
        } catch (error) {
          failure ??= error;
        }
        this.currentState = "stopped";
        if (failure) {
          reject(failure);
        } else {
          resolve();
        }
      };

      if (this.options.stopDelayMs && this.options.stopDelayMs > 0) {
        setTimeout(complete, this.options.stopDelayMs);
      } else {
        queueMicrotask(() => {
          void complete();
        });
      }
    });

    return this.stopPromise;
  }

  simulateFault(): void {
    if (this.currentState !== "ready") {
      return;
    }
    this.emitFault();
  }

  private emitFault(_error?: unknown): void {
    this.cadence?.clearAllIntents();
    for (const listener of this.listeners) {
      listener("WORKER_FAULT");
    }
  }
}
