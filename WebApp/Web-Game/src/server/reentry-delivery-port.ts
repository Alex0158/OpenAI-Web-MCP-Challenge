import { PersistenceError, PersistenceStore } from "./persistence/store";
import type {
  DeliveryResult,
  SignalSeverity,
  SignalSlotRecord,
} from "./persistence/types";

/**
 * The only transport outcomes the game-side port accepts. The transport owns
 * serialization and delivery; the game owns the durable outcome transition.
 */
export type ReentryTransportOutcome =
  | { readonly kind: "accepted" }
  | { readonly kind: "retryable"; readonly code: string }
  | { readonly kind: "terminal"; readonly code: string };

export interface ReentrySignalEnvelope {
  readonly contractVersion: string;
  readonly worldId: string;
  readonly shelterId: string;
  readonly opaqueBinding: string;
  readonly signalId: string;
  readonly grantId: string;
  readonly boundedAction: string;
  readonly cursorStart: number;
  readonly cursorEnd: number;
  readonly eligibleEventCount: number;
  readonly eventTypes: readonly string[];
  readonly severity: SignalSeverity;
  readonly latestEventId: string;
  readonly latestEventType: string;
  readonly latestWorldTime: number;
}

export interface ReentryTransport {
  deliver(envelope: ReentrySignalEnvelope): ReentryTransportOutcome | Promise<ReentryTransportOutcome>;
}

export interface ReentryDeliveryPortOptions {
  readonly store: PersistenceStore;
  readonly transport: ReentryTransport;
  readonly leaseDurationMs: number;
}

export interface ReentryPumpInput {
  readonly worldId: string;
  readonly nowWallTimeMs: number;
  readonly leaseId: string;
}

export type ReentryPumpResult =
  | { readonly kind: "idle"; readonly signalId: null }
  | {
      readonly kind: "already_settled";
      readonly signalId: string;
      readonly status: "acknowledged" | "terminally_rejected";
    }
  | { readonly kind: "lease_conflict"; readonly signalId: string; readonly errorCode: "LEASE_CONFLICT" }
  | {
      readonly kind: "accepted";
      readonly signalId: string;
      readonly envelope: ReentrySignalEnvelope;
      readonly outcome: "ACCEPTED";
      readonly delivery: DeliveryResult;
    }
  | {
      readonly kind: "retryable";
      readonly signalId: string;
      readonly envelope: ReentrySignalEnvelope;
      readonly outcome: string;
      readonly delivery: DeliveryResult;
    }
  | {
      readonly kind: "terminally_rejected";
      readonly signalId: string;
      readonly envelope: ReentrySignalEnvelope;
      readonly outcome: string;
      readonly delivery: DeliveryResult;
    };

function assertNonEmpty(value: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertWallTime(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertOutcomeCode(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.trim() === "" || value.length > 128) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function parseTransportOutcome(value: unknown): ReentryTransportOutcome {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError("INVALID_INPUT");
  }
  const candidate = value as { kind?: unknown; code?: unknown };
  if (candidate.kind === "accepted") {
    return { kind: "accepted" };
  }
  if (candidate.kind === "retryable" || candidate.kind === "terminal") {
    assertOutcomeCode(candidate.code);
    return { kind: candidate.kind, code: candidate.code };
  }
  throw new PersistenceError("INVALID_INPUT");
}

function envelopeFromSlot(slot: SignalSlotRecord, contractVersion: string): ReentrySignalEnvelope {
  return {
    contractVersion,
    worldId: slot.worldId,
    shelterId: slot.shelterId,
    opaqueBinding: slot.opaqueBinding,
    signalId: slot.signalId,
    grantId: slot.grantId,
    boundedAction: slot.boundedAction,
    cursorStart: slot.cursorStart,
    cursorEnd: slot.cursorEnd,
    eligibleEventCount: slot.eligibleEventCount,
    eventTypes: [...slot.eventTypes],
    severity: slot.severity,
    latestEventId: slot.latestEventId,
    latestEventType: slot.latestEventType,
    latestWorldTime: slot.latestWorldTime,
  };
}

/**
 * Game-side, transport-neutral delivery boundary. A host or test must invoke
 * pumpOnce explicitly; this class owns no timer, worker, queue, or gameplay
 * clock and cannot execute a page command.
 */
export class ReentryDeliveryPort {
  private readonly store: PersistenceStore;
  private readonly transport: ReentryTransport;
  private readonly leaseDurationMs: number;

  constructor(options: ReentryDeliveryPortOptions) {
    if (!options || !(options.store instanceof PersistenceStore) || !options.transport
      || typeof options.transport.deliver !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (!Number.isFinite(options.leaseDurationMs) || options.leaseDurationMs <= 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.store = options.store;
    this.transport = options.transport;
    this.leaseDurationMs = options.leaseDurationMs;
  }

  async pumpOnce(input: ReentryPumpInput): Promise<ReentryPumpResult> {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.leaseId);
    assertWallTime(input.nowWallTimeMs);

    const candidate = this.store.nextDeliveryCandidate(input.worldId, input.nowWallTimeMs);
    if (!candidate) {
      return { kind: "idle", signalId: null };
    }

    let claimed;
    try {
      claimed = this.store.claimDelivery({
        worldId: input.worldId,
        signalId: candidate.signalId,
        leaseId: input.leaseId,
        nowWallTimeMs: input.nowWallTimeMs,
        leaseDurationMs: this.leaseDurationMs,
      });
    } catch (error) {
      if (error instanceof PersistenceError && error.code === "LEASE_CONFLICT") {
        return { kind: "lease_conflict", signalId: candidate.signalId, errorCode: "LEASE_CONFLICT" };
      }
      throw error;
    }

    if (claimed.status === "acknowledged" || claimed.status === "terminally_rejected") {
      return { kind: "already_settled", signalId: claimed.signalId, status: claimed.status };
    }
    if (claimed.status !== "in_flight") {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }

    const slot = this.store.signalSlot(input.worldId, claimed.shelterId, claimed.opaqueBinding);
    if (!slot || slot.signalId !== claimed.signalId || slot.status !== "in_flight") {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const envelope = envelopeFromSlot(slot, this.store.contractVersion);

    let outcome: ReentryTransportOutcome;
    try {
      outcome = parseTransportOutcome(await this.transport.deliver(envelope));
    } catch (error) {
      if (error instanceof PersistenceError && error.code === "INVALID_INPUT") {
        // An invalid transport response leaves the lease in flight. The host
        // can reclaim it after expiry; no unknown state is treated as success.
        throw error;
      }
      outcome = { kind: "retryable", code: "TRANSPORT_EXCEPTION" };
    }

    if (outcome.kind === "accepted") {
      const delivery = this.store.acknowledgeDelivery({
        worldId: input.worldId,
        signalId: claimed.signalId,
        leaseId: input.leaseId,
        nowWallTimeMs: input.nowWallTimeMs,
      });
      return { kind: "accepted", signalId: claimed.signalId, envelope, outcome: "ACCEPTED", delivery };
    }
    if (outcome.kind === "retryable") {
      const delivery = this.store.retryDelivery({
        worldId: input.worldId,
        signalId: claimed.signalId,
        leaseId: input.leaseId,
        nowWallTimeMs: input.nowWallTimeMs,
      }, outcome.code);
      return { kind: "retryable", signalId: claimed.signalId, envelope, outcome: outcome.code, delivery };
    }

    const delivery = this.store.terminalRejectDelivery({
      worldId: input.worldId,
      signalId: claimed.signalId,
      leaseId: input.leaseId,
      nowWallTimeMs: input.nowWallTimeMs,
    }, outcome.code);
    return { kind: "terminally_rejected", signalId: claimed.signalId, envelope, outcome: outcome.code, delivery };
  }
}
