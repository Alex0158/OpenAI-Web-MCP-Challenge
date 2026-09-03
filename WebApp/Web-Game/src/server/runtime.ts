import { randomUUID } from "node:crypto";

import type { RuntimeConfig } from "./config";
import type { WorldWorker } from "./world-worker";

export type LifecycleState = "created" | "starting" | "ready" | "degraded" | "draining" | "stopped" | "failed";
export type HealthStatus = "starting" | "ready" | "degraded" | "draining";

export interface RuntimeHealthSnapshot {
  schema_version: 1;
  service: "sleepless-kingdom";
  scope: "process";
  status: HealthStatus;
  live: boolean;
  ready: boolean;
  process_instance_id: string;
  worker_instance_id: string;
  node_version: string;
}

export class RuntimeLifecycleError extends Error {
  readonly code: "RUNTIME_STOPPED" | "RUNTIME_FAILED";

  constructor(code: "RUNTIME_STOPPED" | "RUNTIME_FAILED") {
    super(code);
    this.name = "RuntimeLifecycleError";
    this.code = code;
  }
}

export class RuntimeRegistry {
  readonly processInstanceId: string;
  readonly workerInstanceId: string;
  private currentState: LifecycleState = "created";
  private faultCode: string | null = null;

  constructor(processInstanceId: string = randomUUID(), workerInstanceId: string = randomUUID()) {
    this.processInstanceId = processInstanceId;
    this.workerInstanceId = workerInstanceId;
  }

  get state(): LifecycleState {
    return this.currentState;
  }

  get errorCode(): string | null {
    return this.faultCode;
  }

  beginStarting(): void {
    if (this.currentState === "created") {
      this.currentState = "starting";
    }
  }

  markReady(): void {
    if (this.currentState === "starting") {
      this.currentState = "ready";
      this.faultCode = null;
    }
  }

  markDegraded(code: string): void {
    if (this.currentState === "starting" || this.currentState === "ready") {
      this.currentState = "degraded";
      this.faultCode = code;
    }
  }

  beginDraining(): void {
    if (this.currentState !== "stopped" && this.currentState !== "failed") {
      this.currentState = "draining";
    }
  }

  markStopped(): void {
    this.currentState = "stopped";
  }

  markFailed(): void {
    if (this.currentState !== "stopped") {
      this.currentState = "failed";
    }
  }

  attachWorker(worker: WorldWorker, onFault: (code: "WORKER_FAULT") => void): void {
    worker.onFault(onFault);
  }

  health(nodeVersion = process.version): RuntimeHealthSnapshot {
    const status: HealthStatus =
      this.currentState === "ready"
        ? "ready"
        : this.currentState === "degraded"
          ? "degraded"
          : this.currentState === "draining"
            ? "draining"
            : "starting";
    const live = this.currentState === "starting" || this.currentState === "ready" || this.currentState === "degraded" || this.currentState === "draining";

    return {
      schema_version: 1,
      service: "sleepless-kingdom",
      scope: "process",
      status,
      live,
      ready: status === "ready",
      process_instance_id: this.processInstanceId,
      worker_instance_id: this.workerInstanceId,
      node_version: nodeVersion,
    };
  }
}

export type StartOutcome =
  | { kind: "started"; status: HealthStatus }
  | { kind: "already_started"; status: HealthStatus }
  | { kind: "degraded"; status: "degraded"; errorCode: string };

export interface RuntimeStartController {
  start(worker: WorldWorker): Promise<StartOutcome>;
  stop(worker: WorldWorker): Promise<void>;
}

export function createRuntimeStartController(
  registry: RuntimeRegistry,
  config: Pick<RuntimeConfig, "shutdownTimeoutMs">,
): RuntimeStartController {
  let startPromise: Promise<StartOutcome> | null = null;
  let stopPromise: Promise<void> | null = null;

  return {
    start(worker): Promise<StartOutcome> {
      if (registry.state === "draining" || registry.state === "stopped") {
        return Promise.reject(new RuntimeLifecycleError("RUNTIME_STOPPED"));
      }
      if (registry.state === "failed") {
        return Promise.reject(new RuntimeLifecycleError("RUNTIME_FAILED"));
      }
      if (startPromise) {
        return startPromise.then((result) => ({
          kind: "already_started" as const,
          status: result.status,
        }));
      }

      registry.beginStarting();
      startPromise = (async () => {
        registry.attachWorker(worker, (code) => registry.markDegraded(code));
        if (registry.state !== "starting") {
          throw new RuntimeLifecycleError("RUNTIME_STOPPED");
        }
        try {
          await worker.start();
          if (registry.state !== "starting") {
            throw new RuntimeLifecycleError("RUNTIME_STOPPED");
          }
          registry.markReady();
          return { kind: "started" as const, status: "ready" as const };
        } catch (error) {
          if (error instanceof RuntimeLifecycleError) {
            throw error;
          }
          const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
            ? error.message
            : "WORKER_START_FAILED";
          registry.markDegraded(code);
          return { kind: "degraded" as const, status: "degraded" as const, errorCode: code };
        }
      })();
      return startPromise;
    },

    stop(worker): Promise<void> {
      if (stopPromise) {
        return stopPromise;
      }
      registry.beginDraining();
      stopPromise = Promise.race([
        Promise.resolve().then(() => worker.stop()).catch(() => undefined),
        new Promise<void>((resolve) => {
          setTimeout(resolve, config.shutdownTimeoutMs);
        }),
      ]).then(() => undefined);
      return stopPromise;
    },
  };
}
