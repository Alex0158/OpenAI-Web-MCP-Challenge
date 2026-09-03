import { randomUUID } from "node:crypto";

import { WorkerGatewayError, type WorkerCommandGateway } from "./worker-command-gateway";
import type { RealtimeSnapshotFrame } from "../client/realtime-projection";

export type { RealtimeSnapshotFrame } from "../client/realtime-projection";

export type RealtimeHubState = "READY" | "UNSUPPORTED" | "DRAINING" | "CLOSED";
export type RealtimeConnectionState = "CONNECTING" | "READY" | "STALE" | "CLOSED";
export type RealtimeCapability = "supported" | "unsupported";

export type RealtimeTransportErrorCode =
  | "REALTIME_INVALID_SCOPE"
  | "REALTIME_UNAVAILABLE"
  | "REALTIME_NOT_READY"
  | "REALTIME_DRAINING"
  | "REALTIME_CLOSED"
  | "REALTIME_SINK_FAILED";

export class RealtimeTransportError extends Error {
  readonly code: RealtimeTransportErrorCode;

  constructor(code: RealtimeTransportErrorCode, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "RealtimeTransportError";
    this.code = code;
  }
}

/**
 * The entrypoint creates this context after authentication. It is never read
 * from a client frame and the binding is intentionally not exposed by a
 * connection handle.
 */
export interface ServerBoundRealtimeContext {
  readonly worldId: string;
  readonly playerId: string;
  readonly binding: string;
}

export interface RealtimeSnapshotSink {
  send(frame: RealtimeSnapshotFrame): void | Promise<void>;
  close?(reason?: string): void | Promise<void>;
  /** Optional transport-visible notification for automatic publication failure. */
  notifyFailure?(code: RealtimeTransportErrorCode): void | Promise<void>;
}

export interface RealtimeConnection {
  readonly connectionId: string;
  readonly playerId: string;
  readonly state: RealtimeConnectionState;
  readonly lastSequence: number;
  markStale(): void;
  publishFullSnapshot(): Promise<RealtimeSnapshotFrame>;
  requestResync(): Promise<RealtimeSnapshotFrame>;
  close(reason?: string): Promise<void>;
}

export interface RealtimeSnapshotHubOptions {
  gateway: Pick<WorkerCommandGateway, "fullSnapshot">;
  enabled?: boolean;
}

interface ConnectionRecord {
  readonly connectionId: string;
  readonly context: ServerBoundRealtimeContext;
  readonly sink: RealtimeSnapshotSink;
  state: RealtimeConnectionState;
  lastSequence: number;
  lastSnapshotId: string | null;
  inFlight: Promise<RealtimeSnapshotFrame | null> | null;
  inFlightMode: "explicit" | "automatic" | null;
  pendingMode: "explicit" | "automatic" | null;
  automaticDrain: Promise<void> | null;
  explicitPending: Deferred<RealtimeSnapshotFrame> | null;
  closePromise: Promise<void> | null;
}

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function validString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isClosed(record: Pick<ConnectionRecord, "state">): boolean {
  return record.state === "CLOSED";
}

function copyContext(context: ServerBoundRealtimeContext): ServerBoundRealtimeContext {
  if (!validString(context.worldId) || !validString(context.playerId) || !validString(context.binding)) {
    throw new RealtimeTransportError("REALTIME_INVALID_SCOPE");
  }
  return Object.freeze({
    worldId: context.worldId,
    playerId: context.playerId,
    binding: context.binding,
  });
}

function mapGatewayError(error: unknown): unknown {
  if (!(error instanceof WorkerGatewayError)) {
    return error;
  }
  const code: RealtimeTransportErrorCode = error.code === "WORKER_NOT_READY"
    ? "REALTIME_NOT_READY"
    : error.code === "GATEWAY_CLOSED"
      ? "REALTIME_CLOSED"
      : "REALTIME_UNAVAILABLE";
  return new RealtimeTransportError(code, { cause: error });
}

function assertSink(sink: RealtimeSnapshotSink): void {
  if (!sink || typeof sink.send !== "function") {
    throw new RealtimeTransportError("REALTIME_SINK_FAILED");
  }
}

/**
 * Process-local projection registry. It has no timer and no wire dependency;
 * the entrypoint may later adapt a real upgrade to the sink interface without
 * moving command or world authority into a socket handler.
 */
export class RealtimeSnapshotHub {
  private readonly gateway: Pick<WorkerCommandGateway, "fullSnapshot">;
  private readonly enabled: boolean;
  private readonly connections = new Map<string, ConnectionRecord>();
  private currentState: RealtimeHubState;
  private readonly automaticDrains = new Set<Promise<void>>();
  private automaticPump: Deferred<void> | null = null;
  private readonly closingRecords = new Set<Promise<void>>();

  constructor(options: RealtimeSnapshotHubOptions) {
    if (!options.gateway || typeof options.gateway.fullSnapshot !== "function") {
      throw new RealtimeTransportError("REALTIME_UNAVAILABLE");
    }
    this.gateway = options.gateway;
    this.enabled = options.enabled !== false;
    this.currentState = this.enabled ? "READY" : "UNSUPPORTED";
  }

  get state(): RealtimeHubState {
    return this.currentState;
  }

  get capability(): RealtimeCapability {
    return this.enabled ? "supported" : "unsupported";
  }

  async connect(context: ServerBoundRealtimeContext, sink: RealtimeSnapshotSink): Promise<RealtimeConnection> {
    this.assertConnectable();
    assertSink(sink);
    const record: ConnectionRecord = {
      connectionId: randomUUID(),
      context: copyContext(context),
      sink,
      state: "CONNECTING",
      lastSequence: 0,
      lastSnapshotId: null,
      inFlight: null,
      inFlightMode: null,
      pendingMode: null,
      automaticDrain: null,
      explicitPending: null,
      closePromise: null,
    };
    // Admit the record before its initial read so progress that arrives during
    // CONNECTING can set a trailing dirty bit instead of being lost.
    this.connections.set(record.connectionId, record);

    try {
      await this.publishRecord(record);
      if (this.currentState !== "READY" || record.state === "CLOSED") {
        await this.closeRecord(record, this.currentState === "DRAINING" ? "RUNTIME_DRAINING" : "RUNTIME_STOPPED");
        throw this.currentState === "DRAINING"
          ? new RealtimeTransportError("REALTIME_DRAINING")
          : new RealtimeTransportError("REALTIME_CLOSED");
      }
      record.state = "READY";
      if (record.pendingMode) {
        void this.ensureRecordDrain(record);
      }
      return this.handleFor(record);
    } catch (error) {
      await this.closeRecord(record, "REALTIME_CONNECT_FAILED");
      throw mapGatewayError(error);
    }
  }

  getConnection(connectionId: string): RealtimeConnection | null {
    const record = this.connections.get(connectionId);
    return record ? this.handleFor(record) : null;
  }

  /**
   * Request one bounded latest snapshot publication for every ready connection.
   * This is an entrypoint-owned progress seam, not a timer or a world driver.
   */
  publishCurrentSnapshots(): Promise<void> {
    if (this.currentState !== "READY") {
      return Promise.resolve();
    }
    // Admission is intentionally synchronous for every connected record. A
    // slow connection therefore cannot prevent a later wake from starting a
    // fast connection's own bounded drain.
    for (const record of this.connections.values()) {
      this.requestAutomaticPublication(record);
    }
    return this.ensureAutomaticPump();
  }

  private ensureAutomaticPump(): Promise<void> {
    if (this.automaticDrains.size === 0) {
      return Promise.resolve();
    }
    if (this.automaticPump) {
      return this.automaticPump.promise;
    }
    const pump = createDeferred<void>();
    this.automaticPump = pump;
    this.runAutomaticPump(pump);
    return pump.promise;
  }

  private runAutomaticPump(pump: Deferred<void>): void {
    // The hub owns the detached lifecycle reaction once per pump, rather than
    // allocating a new catch/finally chain for every worker wakeup.
    void this.drainAutomaticPublications().then(
      () => this.finishAutomaticPump(pump),
      () => this.finishAutomaticPump(pump),
    );
  }

  private finishAutomaticPump(pump: Deferred<void>): void {
    if (this.automaticPump !== pump) {
      return;
    }
    if (this.automaticDrains.size > 0 && this.currentState === "READY") {
      // A new drain can be admitted after the loop observed an empty set but
      // before its completion reaction runs. Keep the same public pump alive
      // and include that drain rather than returning a fulfilled old promise.
      this.runAutomaticPump(pump);
      return;
    }
    this.automaticPump = null;
    pump.resolve();
  }

  async drain(reason = "RUNTIME_DRAINING"): Promise<void> {
    if (this.currentState === "CLOSED") {
      await Promise.all(this.closingRecords);
      return;
    }
    this.currentState = "DRAINING";
    const records = [...this.connections.values()];
    const pump = this.automaticPump;
    await Promise.all([
      ...records.map((record) => this.closeRecord(record, reason)),
      ...(pump ? [pump.promise] : []),
      ...this.closingRecords,
    ]);
  }

  async close(reason = "RUNTIME_STOPPED"): Promise<void> {
    if (this.currentState !== "CLOSED") {
      this.currentState = "CLOSED";
    }
    const records = [...this.connections.values()];
    const pump = this.automaticPump;
    await Promise.all([
      ...records.map((record) => this.closeRecord(record, reason)),
      ...(pump ? [pump.promise] : []),
      ...this.closingRecords,
    ]);
  }

  private assertConnectable(): void {
    if (this.currentState === "UNSUPPORTED") {
      throw new RealtimeTransportError("REALTIME_UNAVAILABLE");
    }
    if (this.currentState === "DRAINING") {
      throw new RealtimeTransportError("REALTIME_DRAINING");
    }
    if (this.currentState === "CLOSED") {
      throw new RealtimeTransportError("REALTIME_CLOSED");
    }
  }

  private handleFor(record: ConnectionRecord): RealtimeConnection {
    return {
      get connectionId() {
        return record.connectionId;
      },
      get playerId() {
        return record.context.playerId;
      },
      get state() {
        return record.state;
      },
      get lastSequence() {
        return record.lastSequence;
      },
      markStale: () => {
        if (record.state !== "CLOSED") {
          record.state = "STALE";
        }
      },
      publishFullSnapshot: () => this.publishRecord(record),
      requestResync: () => {
        if (record.state === "CLOSED") {
          return Promise.reject(new RealtimeTransportError("REALTIME_CLOSED"));
        }
        record.state = "STALE";
        return this.publishRecord(record);
      },
      close: (reason?: string) => this.closeRecord(record, reason ?? "CLIENT_CLOSED"),
    };
  }

  private publishRecord(record: ConnectionRecord): Promise<RealtimeSnapshotFrame> {
    if (record.state === "CLOSED") {
      return Promise.reject(new RealtimeTransportError("REALTIME_CLOSED"));
    }
    if (this.currentState === "UNSUPPORTED") {
      return Promise.reject(new RealtimeTransportError("REALTIME_UNAVAILABLE"));
    }
    if (this.currentState === "DRAINING") {
      return Promise.reject(new RealtimeTransportError("REALTIME_DRAINING"));
    }
    if (this.currentState === "CLOSED") {
      return Promise.reject(new RealtimeTransportError("REALTIME_CLOSED"));
    }

    if (record.inFlight) {
      if (record.inFlightMode === "explicit") {
        return record.inFlight as Promise<RealtimeSnapshotFrame>;
      }
      return this.queueExplicitPublication(record);
    }

    // An automatic request may already be admitted to the per-connection
    // drain even though its read has not started. Explicit recovery subsumes
    // that one trailing automatic slot instead of creating a second queue.
    if (record.pendingMode || record.automaticDrain) {
      return this.queueExplicitPublication(record);
    }

    // Explicit mode is forced and therefore never returns the automatic
    // publisher's `null` skip. Returning the shared operation preserves the
    // existing concurrent-request identity guarantee.
    return this.startPublication(record, "explicit") as Promise<RealtimeSnapshotFrame>;
  }

  private queueExplicitPublication(record: ConnectionRecord): Promise<RealtimeSnapshotFrame> {
    record.pendingMode = "explicit";
    if (!record.explicitPending) {
      record.explicitPending = createDeferred<RealtimeSnapshotFrame>();
      void record.explicitPending.promise.catch(() => undefined);
    }
    void this.ensureRecordDrain(record);
    return record.explicitPending.promise;
  }

  private startPublication(
    record: ConnectionRecord,
    mode: "explicit" | "automatic",
  ): Promise<RealtimeSnapshotFrame | null> {
    if (record.inFlight) {
      return record.inFlight;
    }

    const operation = this.readAndSend(record, mode);
    record.inFlight = operation;
    record.inFlightMode = mode;
    void operation.finally(() => {
      if (record.inFlight === operation) {
        record.inFlight = null;
        record.inFlightMode = null;
      }
    }).catch(() => undefined);
    void operation.then(
      () => this.schedulePendingDrain(record),
      () => this.schedulePendingDrain(record),
    );
    return operation;
  }

  private async readAndSend(
    record: ConnectionRecord,
    mode: "explicit" | "automatic",
  ): Promise<RealtimeSnapshotFrame | null> {
    try {
      const snapshot = await this.gateway.fullSnapshot({ ...record.context });
      if (record.state === "CLOSED") {
        throw new RealtimeTransportError("REALTIME_CLOSED");
      }
      if (this.currentState !== "READY") {
        throw this.currentState === "DRAINING"
          ? new RealtimeTransportError("REALTIME_DRAINING")
          : new RealtimeTransportError("REALTIME_CLOSED");
      }
      if (mode === "automatic" && snapshot.clientSnapshotId === record.lastSnapshotId) {
        return null;
      }
      const frame: RealtimeSnapshotFrame = {
        kind: "client_snapshot",
        connectionId: record.connectionId,
        sequence: record.lastSequence + 1,
        snapshot: cloneValue(snapshot),
      };
      try {
        await record.sink.send(cloneValue(frame));
      } catch (error) {
        if (!isClosed(record)) {
          record.state = "STALE";
        }
        throw new RealtimeTransportError("REALTIME_SINK_FAILED", { cause: error });
      }
      if (isClosed(record)) {
        throw new RealtimeTransportError("REALTIME_CLOSED");
      }
      if (this.currentState !== "READY") {
        throw this.currentState === "DRAINING"
          ? new RealtimeTransportError("REALTIME_DRAINING")
          : new RealtimeTransportError("REALTIME_CLOSED");
      }
      // Sequence and content cursors advance only after the sink accepts the
      // complete replacement. Failed or skipped publications consume neither.
      record.lastSequence = frame.sequence;
      record.lastSnapshotId = snapshot.clientSnapshotId;
      record.state = "READY";
      return cloneValue(frame);
    } catch (error) {
      if (error instanceof RealtimeTransportError) {
        if (error.code === "REALTIME_NOT_READY" || error.code === "REALTIME_UNAVAILABLE" || error.code === "REALTIME_SINK_FAILED") {
          if (record.state !== "CLOSED") {
            record.state = "STALE";
          }
        }
        throw error;
      }
      const mapped = mapGatewayError(error);
      if (mapped instanceof RealtimeTransportError) {
        if (mapped.code !== "REALTIME_DRAINING" && mapped.code !== "REALTIME_CLOSED") {
          if (record.state !== "CLOSED") {
            record.state = "STALE";
          }
        }
        throw mapped;
      }
      if (record.state !== "CLOSED") {
        record.state = "STALE";
      }
      throw mapped;
    }
  }

  private requestAutomaticPublication(record: ConnectionRecord): void {
    if (this.currentState !== "READY" || record.state === "CLOSED") {
      return;
    }
    // A stale idle connection is an explicit recovery boundary. Progress may
    // remain queued only while an explicit read is already in flight.
    if (record.state === "STALE" && !record.inFlight) {
      return;
    }
    if (record.pendingMode !== "explicit") {
      record.pendingMode = "automatic";
    }
    if (record.state === "CONNECTING" && !record.inFlight) {
      return;
    }
    void this.ensureRecordDrain(record);
  }

  private async drainAutomaticPublications(): Promise<void> {
    while (this.currentState === "READY") {
      const drains = [...this.automaticDrains];
      if (drains.length === 0) {
        return;
      }
      await Promise.allSettled(drains);
    }
  }

  private ensureRecordDrain(record: ConnectionRecord): Promise<void> {
    if (record.automaticDrain) {
      return record.automaticDrain;
    }
    const drain = this.drainRecord(record);
    record.automaticDrain = drain;
    this.automaticDrains.add(drain);
    const finalize = (): void => {
      if (record.automaticDrain === drain) {
        record.automaticDrain = null;
      }
      this.automaticDrains.delete(drain);
      // A new wake may arrive in the settlement window between the drain's
      // resolution and this cleanup reaction. Re-admit that one pending mode
      // before leaving the hub, otherwise its dirty bit would be stranded.
      if (record.pendingMode && this.currentState === "READY" && !isClosed(record)) {
        void this.ensureRecordDrain(record);
        this.ensureAutomaticPump();
      }
    };
    void drain.then(
      finalize,
      (error) => {
        finalize();
        // A publication failure is connection-local. Keep the promise
        // observed so a detached worker notification cannot become unhandled.
        void error;
      },
    );
    return drain;
  }

  private schedulePendingDrain(record: ConnectionRecord): void {
    if (record.state === "CLOSED" || this.currentState !== "READY" || !record.pendingMode) {
      return;
    }
    void this.ensureRecordDrain(record);
  }

  private async drainRecord(record: ConnectionRecord): Promise<void> {
    while (record.pendingMode && this.currentState === "READY" && record.state !== "CLOSED") {
      const mode = record.pendingMode;
      record.pendingMode = null;
      const waitedForMode = record.inFlightMode;

      if (record.inFlight) {
        try {
          await record.inFlight;
        } catch {
          // The in-flight operation owns its typed state transition. A
          // trailing explicit request may still be allowed to recover it.
        }
      }
      if (isClosed(record) || this.currentState !== "READY") {
        break;
      }

      if (mode === "automatic") {
        // The initial connect/resync operation is already the first forced
        // replacement. Any automatic notifications that arrived while that
        // operation was in flight are represented by this one captured mode;
        // clear a duplicate dirty bit before starting it. Automatic work must
        // retain a dirty bit that arrived during another automatic operation,
        // because that is the one allowed trailing latest read.
        if (waitedForMode === "explicit" && record.pendingMode === "automatic") {
          record.pendingMode = null;
        }
        if (record.state === "CONNECTING") {
          // Initial connect owns the transition to READY; retain this one
          // trailing bit for its completion path.
          record.pendingMode = "automatic";
          break;
        }
        if (record.state !== "READY") {
          continue;
        }
        try {
          await this.startPublication(record, "automatic");
        } catch (error) {
          // A stale connection is never retried automatically. If a caller
          // already queued explicit recovery, continue to that one slot.
          await this.notifyAutomaticFailure(record, error);
        }
        continue;
      }

      const waiter = record.explicitPending;
      if (!waiter) {
        continue;
      }
      try {
        const frame = await this.startPublication(record, "explicit");
        waiter.resolve(frame as RealtimeSnapshotFrame);
      } catch (error) {
        waiter.reject(error);
      } finally {
        if (record.explicitPending === waiter) {
          record.explicitPending = null;
        }
      }
    }

    if (record.state === "CLOSED" && record.explicitPending) {
      record.explicitPending.reject(new RealtimeTransportError("REALTIME_CLOSED"));
      record.explicitPending = null;
    }
  }

  private async notifyAutomaticFailure(record: ConnectionRecord, error: unknown): Promise<void> {
    if (record.state === "CLOSED") {
      return;
    }
    const code = error instanceof RealtimeTransportError ? error.code : "REALTIME_UNAVAILABLE";
    if (code === "REALTIME_CLOSED" || code === "REALTIME_DRAINING") {
      return;
    }
    try {
      await record.sink.notifyFailure?.(code);
    } catch {
      // The connection is already stale; failure reporting is best effort.
    }
  }

  private async closeRecord(record: ConnectionRecord, reason: string): Promise<void> {
    if (record.closePromise) {
      return record.closePromise;
    }
    record.state = "CLOSED";
    record.pendingMode = null;
    this.connections.delete(record.connectionId);
    const inFlight = record.inFlight;
    const automaticDrain = record.automaticDrain;
    const explicitPending = record.explicitPending;
    record.explicitPending = null;
    explicitPending?.reject(new RealtimeTransportError("REALTIME_CLOSED"));
    const sinkClose = this.safeSinkClose(record.sink, reason);
    const closure = Promise.allSettled([sinkClose, inFlight, automaticDrain]).then(() => undefined);
    record.closePromise = closure;
    this.closingRecords.add(closure);
    void closure.then(
      () => this.closingRecords.delete(closure),
      () => this.closingRecords.delete(closure),
    );
    return closure;
  }

  private async safeSinkClose(sink: RealtimeSnapshotSink, reason: string): Promise<void> {
    try {
      await sink.close?.(reason);
    } catch {
      // Closing is best effort; the connection is already visibly closed.
    }
  }
}
