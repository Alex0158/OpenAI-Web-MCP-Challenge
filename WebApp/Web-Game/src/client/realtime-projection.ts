import type { ClientSnapshot } from "../server/world-projection";
import { isRenderableClientSnapshot } from "./projection-model";

export type RealtimeConnectionState = "CONNECTING" | "READY" | "STALE" | "CLOSED";
export type RealtimeCapability = "supported" | "unsupported";

export interface RealtimeSnapshotFrame {
  readonly kind: "client_snapshot";
  readonly connectionId: string;
  readonly sequence: number;
  readonly snapshot: ClientSnapshot;
}

export type ProjectionRejectReason =
  | "INVALID_FRAME"
  | "CONNECTION_MISMATCH"
  | "SCOPE_MISMATCH"
  | "STALE_FRAME"
  | "CLOSED";

export type ProjectionAcceptResult =
  | { accepted: true; reason: "ACCEPTED" }
  | { accepted: false; reason: ProjectionRejectReason; resyncRequired: boolean };

export type ProjectionResyncReason = "STALE_FRAME" | "CONNECTION_LOST" | "EXPLICIT";

export function explicitResyncPresentationState(
  currentState: RealtimeConnectionState,
  outcome: "sent" | "failed",
): RealtimeConnectionState {
  return outcome === "sent" ? currentState : "STALE";
}

export interface RealtimeProjectionScopeOptions {
  contractVersion: string;
  worldId: string;
  playerId: string;
  shelterId: string;
}

export interface RealtimeProjectionClientOptions extends RealtimeProjectionScopeOptions {
  connectionId: string;
}

export interface RealtimeResyncRequest {
  kind: "resync_request";
  connectionId: string;
  reason: ProjectionResyncReason;
  lastAcceptedSequence: number;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function validString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Browser-safe replacement validation. This class owns no gameplay state; it
 * only accepts a newer, correctly scoped full projection and asks for a full
 * replacement when a frame cannot be trusted.
 */
export class RealtimeProjectionClient {
  private readonly expected: RealtimeProjectionScopeOptions;
  private boundConnectionId: string | null;
  private currentState: RealtimeConnectionState = "CONNECTING";
  private lastAccepted = 0;
  private currentSnapshot: ClientSnapshot | null = null;

  constructor(options: RealtimeProjectionClientOptions | RealtimeProjectionScopeOptions, prebound = false) {
    if ((!prebound && !validString((options as RealtimeProjectionClientOptions).connectionId))
      || !validString(options.contractVersion)
      || !validString(options.worldId)
      || !validString(options.playerId)
      || !validString(options.shelterId)) {
      throw new Error("REALTIME_INVALID_SCOPE");
    }
    this.expected = Object.freeze({
      contractVersion: options.contractVersion,
      worldId: options.worldId,
      playerId: options.playerId,
      shelterId: options.shelterId,
    });
    this.boundConnectionId = prebound ? null : (options as RealtimeProjectionClientOptions).connectionId;
  }

  static fromServerScope(options: RealtimeProjectionScopeOptions): RealtimeProjectionClient {
    return new RealtimeProjectionClient(options, true);
  }

  get state(): RealtimeConnectionState {
    return this.currentState;
  }

  get lastSequence(): number {
    return this.lastAccepted;
  }

  get connectionId(): string | null {
    return this.boundConnectionId;
  }

  get snapshot(): ClientSnapshot | null {
    return this.currentSnapshot ? cloneValue(this.currentSnapshot) : null;
  }

  accept(frame: unknown): ProjectionAcceptResult {
    if (this.currentState === "CLOSED") {
      return { accepted: false, reason: "CLOSED", resyncRequired: false };
    }
    if (!isRecord(frame)
      || frame.kind !== "client_snapshot"
      || !validString(frame.connectionId)
      || typeof frame.sequence !== "number"
      || !Number.isSafeInteger(frame.sequence)
      || frame.sequence <= 0
      || !isRenderableClientSnapshot(frame.snapshot)) {
      return this.reject("INVALID_FRAME", true);
    }
    const typedFrame = frame as {
      kind: "client_snapshot";
      connectionId: string;
      sequence: number;
      snapshot: ClientSnapshot;
    };
    if (this.boundConnectionId !== null && typedFrame.connectionId !== this.boundConnectionId) {
      return this.reject("CONNECTION_MISMATCH", true);
    }

    const snapshot = typedFrame.snapshot;
    if (snapshot.contractVersion !== this.expected.contractVersion
      || snapshot.worldId !== this.expected.worldId
      || snapshot.playerScope.playerId !== this.expected.playerId
      || snapshot.playerScope.shelterId !== this.expected.shelterId) {
      return this.reject("SCOPE_MISMATCH", true);
    }
    if (typedFrame.sequence <= this.lastAccepted) {
      return this.reject("STALE_FRAME", true);
    }

    if (this.boundConnectionId === null) {
      this.boundConnectionId = typedFrame.connectionId;
    }
    this.currentSnapshot = cloneValue(snapshot);
    this.lastAccepted = typedFrame.sequence;
    this.currentState = "READY";
    return { accepted: true, reason: "ACCEPTED" };
  }

  requestResync(reason: ProjectionResyncReason = "STALE_FRAME"): RealtimeResyncRequest {
    if (this.currentState !== "CLOSED") {
      this.currentState = "STALE";
    }
    if (this.boundConnectionId === null) {
      throw new Error("REALTIME_CONNECTION_UNBOUND");
    }
    return {
      kind: "resync_request",
      connectionId: this.boundConnectionId,
      reason,
      lastAcceptedSequence: this.lastAccepted,
    };
  }

  close(): void {
    this.currentState = "CLOSED";
  }

  private reject(reason: ProjectionRejectReason, resyncRequired: boolean): ProjectionAcceptResult {
    if (resyncRequired) {
      this.currentState = "STALE";
    }
    return { accepted: false, reason, resyncRequired };
  }
}
