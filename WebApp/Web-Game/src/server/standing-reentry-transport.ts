import { PersistenceError, PersistenceStore } from "./persistence/store";
import type { ReentrySignalEnvelope, ReentryTransportOutcome } from "./reentry-delivery-port";

const STANDING_PROTOCOL_VERSION = "0.2" as const;
const STANDING_BINDING_TYPE = "webmcp.reentry_binding" as const;
const STANDING_ACCEPTANCE_TYPE = "webmcp.continuation_acceptance" as const;
const STANDING_EVENT_TYPE = "CargoLostToMonster" as const;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const ACCEPTANCE_FIELDS = ["accepted", "correlation_id", "duplicate", "event_id", "protocol_version", "status", "type"] as const;
const RETRYABLE_PUBLISHER_CODES = new Set([
  "activation_in_progress",
  "receiver_busy",
  "receiver_timeout",
  "host_sdk_network_error",
  "host_sdk_request_timeout",
]);

export interface StandingPublicBinding {
  readonly type: typeof STANDING_BINDING_TYPE;
  readonly protocol_version: typeof STANDING_PROTOCOL_VERSION;
  readonly binding_id: string;
  readonly correlation_id: string;
  readonly workflow_id: string;
  readonly event_type: string;
  readonly expires_at: string;
  readonly authorization_mode: "standing";
  readonly max_active_activations: 1;
  readonly last_event_sequence: number;
  readonly status: "active" | "revoked" | "expired";
}

export interface StandingBindingResolution {
  /** The Game-side grant identity that was approved for this shelter. */
  readonly grantId: string;
  /** Public binding only; private task, Connector, and lease values are forbidden. */
  readonly binding: StandingPublicBinding;
  /** Exact origin configured on the server-side signing Host. */
  readonly issuerOrigin: string;
  /** Canonical page URL that the Agent will reread after notification. */
  readonly canonicalUrl: string;
}

export interface StandingBindingResolverInput {
  readonly worldId: string;
  readonly shelterId: string;
  readonly opaqueBinding: string;
  readonly grantId: string;
}

export interface StandingBindingResolver {
  resolve(input: StandingBindingResolverInput): StandingBindingResolution | null | Promise<StandingBindingResolution | null>;
}

export interface StandingEventInput {
  readonly binding: StandingPublicBinding;
  readonly workflow: {
    readonly id: string;
    readonly stateVersion: number;
    readonly canonicalUrl: string;
  };
  readonly eventId: string;
  readonly eventSequence: number;
  readonly occurredAt: string;
}

export interface StandingEventPublisher {
  sendEvent(input: StandingEventInput): unknown | Promise<unknown>;
}

export interface StandingReentryTransportOptions {
  readonly store: PersistenceStore;
  readonly bindingResolver: StandingBindingResolver;
  readonly eventPublisher: StandingEventPublisher;
  /** Stable epoch for the persisted Game world clock, in wall-clock milliseconds. */
  readonly worldTimeOriginMs?: number;
  /** Optional persisted-clock conversion for deployments with a non-epoch world origin. */
  readonly resolveOccurredAt?: (envelope: ReentrySignalEnvelope) => string;
  readonly now?: () => number;
}

function assertNonEmpty(value: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertCanonicalTimestamp(value: string): void {
  if (typeof value !== "string" || value !== new Date(value).toISOString()) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertIdentifier(value: unknown): asserts value is string {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === [...expected].sort()[index]);
}

function assertPublicBinding(value: unknown): asserts value is StandingPublicBinding {
  if (!isPlainRecord(value)) throw new PersistenceError("RECOVERY_REQUIRED");
  const binding = value as Record<string, unknown>;
  const expected = [
    "authorization_mode", "binding_id", "correlation_id", "event_type", "expires_at",
    "last_event_sequence", "max_active_activations", "protocol_version", "status", "type", "workflow_id",
  ];
  if (!hasExactKeys(binding, expected)
    || binding.type !== STANDING_BINDING_TYPE
    || binding.protocol_version !== STANDING_PROTOCOL_VERSION
    || binding.authorization_mode !== "standing"
    || binding.max_active_activations !== 1
    || !["active", "revoked", "expired"].includes(binding.status as string)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  assertIdentifier(binding.binding_id);
  assertIdentifier(binding.correlation_id);
  assertIdentifier(binding.workflow_id);
  assertIdentifier(binding.event_type);
  try {
    assertCanonicalTimestamp(binding.expires_at as string);
  } catch {
    // A public binding is persisted/received authority data. Accepting a
    // Date.parse-compatible but non-canonical value would let the Event
    // signer and Receiver derive different expiry bytes.
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (!Number.isSafeInteger(binding.last_event_sequence) || (binding.last_event_sequence as number) < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertCanonicalOrigin(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (!(parsed.protocol === "http:" || parsed.protocol === "https:")
    || parsed.origin !== value
    || parsed.username !== ""
    || parsed.password !== "") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertCanonicalUrl(value: string, expectedOrigin: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (!(["http:", "https:"] as string[]).includes(parsed.protocol)
    || parsed.username !== ""
    || parsed.password !== ""
    || parsed.href !== value
    || parsed.hash !== ""
    || parsed.origin !== expectedOrigin) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertAcceptance(value: unknown, expected: { eventId: string; correlationId: string }): void {
  if (!isPlainRecord(value) || !hasExactKeys(value, ACCEPTANCE_FIELDS)
    || value.type !== STANDING_ACCEPTANCE_TYPE
    || value.protocol_version !== STANDING_PROTOCOL_VERSION
    || value.event_id !== expected.eventId
    || value.correlation_id !== expected.correlationId
    || value.accepted !== true
    || typeof value.duplicate !== "boolean"
    || value.status !== "accepted") {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function publisherFailure(error: unknown): ReentryTransportOutcome {
  const candidate = error as { code?: unknown; statusCode?: unknown; retryable?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const statusCode = typeof candidate.statusCode === "number" ? candidate.statusCode : null;
  if (candidate.retryable === true || RETRYABLE_PUBLISHER_CODES.has(code)
    || statusCode === 408 || statusCode === 425 || statusCode === 429 || (statusCode !== null && statusCode >= 500)) {
    return { kind: "retryable", code: "RECEIVER_OUTCOME_UNKNOWN" };
  }
  if (statusCode !== null && statusCode >= 400 && statusCode < 500) {
    return { kind: "terminal", code: "RECEIVER_REJECTED" };
  }
  return { kind: "retryable", code: "RECEIVER_OUTCOME_UNKNOWN" };
}

function occurredAtFor(options: StandingReentryTransportOptions, envelope: ReentrySignalEnvelope): string | null {
  try {
    const value = options.resolveOccurredAt
      ? options.resolveOccurredAt(envelope)
      : new Date((options.worldTimeOriginMs as number) + envelope.latestWorldTime * 1_000).toISOString();
    assertCanonicalTimestamp(value);
    return value;
  } catch {
    return null;
  }
}

/**
 * Maps one Game publication envelope to the exact standing v0.2 Host Event
 * input. It owns no timer, lease, or retry loop; the Game port settles those
 * boundaries after this method returns a typed outcome.
 */
export class StandingReentryTransport {
  private readonly store: PersistenceStore;
  private readonly bindingResolver: StandingBindingResolver;
  private readonly eventPublisher: StandingEventPublisher;
  private readonly worldTimeOriginMs: number | undefined;
  private readonly resolveOccurredAt: ((envelope: ReentrySignalEnvelope) => string) | undefined;
  private readonly now: () => number;

  constructor(options: StandingReentryTransportOptions) {
    if (!options || !(options.store instanceof PersistenceStore)
      || !options.bindingResolver || typeof options.bindingResolver.resolve !== "function"
      || !options.eventPublisher || typeof options.eventPublisher.sendEvent !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.worldTimeOriginMs === undefined && typeof options.resolveOccurredAt !== "function") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (options.worldTimeOriginMs !== undefined && (!Number.isSafeInteger(options.worldTimeOriginMs) || options.worldTimeOriginMs < 0)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.store = options.store;
    this.bindingResolver = options.bindingResolver;
    this.eventPublisher = options.eventPublisher;
    this.worldTimeOriginMs = options.worldTimeOriginMs;
    this.resolveOccurredAt = options.resolveOccurredAt;
    this.now = options.now ?? (() => Date.now());
    if (typeof this.now !== "function") throw new PersistenceError("INVALID_INPUT");
  }

  async deliver(envelope: ReentrySignalEnvelope): Promise<ReentryTransportOutcome> {
    assertNonEmpty(envelope.worldId);
    assertNonEmpty(envelope.shelterId);
    assertNonEmpty(envelope.opaqueBinding);
    assertNonEmpty(envelope.signalId);
    assertNonEmpty(envelope.grantId);
    assertNonEmpty(envelope.latestEventId);
    if (envelope.latestEventType !== STANDING_EVENT_TYPE
      || !envelope.eventTypes.includes(STANDING_EVENT_TYPE)
      || !Number.isSafeInteger(envelope.latestWorldTime)
      || envelope.latestWorldTime < 0) {
      return { kind: "terminal", code: "REENTRY_EVENT_TYPE_UNSUPPORTED" };
    }

    let resolution: StandingBindingResolution | null;
    try {
      resolution = await this.bindingResolver.resolve({
        worldId: envelope.worldId,
        shelterId: envelope.shelterId,
        opaqueBinding: envelope.opaqueBinding,
        grantId: envelope.grantId,
      });
    } catch (error) {
      return publisherFailure(error);
    }
    if (!resolution) return { kind: "terminal", code: "REENTRY_BINDING_UNAVAILABLE" };
    assertNonEmpty(resolution.grantId);
    assertPublicBinding(resolution.binding);
    assertCanonicalOrigin(resolution.issuerOrigin);
    assertCanonicalUrl(resolution.canonicalUrl, resolution.issuerOrigin);
    if (resolution.grantId !== envelope.grantId) return { kind: "terminal", code: "REENTRY_GRANT_SCOPE_MISMATCH" };
    if (resolution.binding.status !== "active") return { kind: "terminal", code: "REENTRY_BINDING_INACTIVE" };
    if (resolution.binding.event_type !== envelope.latestEventType) return { kind: "terminal", code: "REENTRY_EVENT_SCOPE_MISMATCH" };
    const now = this.now();
    if (!Number.isFinite(now)) throw new PersistenceError("INVALID_INPUT");
    if (Date.parse(resolution.binding.expires_at) <= now) return { kind: "terminal", code: "REENTRY_BINDING_EXPIRED" };

    const latestEventCursor = this.store.eventCursor(envelope.worldId, envelope.latestEventId);
    if (!Number.isSafeInteger(envelope.cursorStart) || envelope.cursorStart < 1
      || !Number.isSafeInteger(envelope.cursorEnd) || envelope.cursorEnd < envelope.cursorStart
      || latestEventCursor === null || latestEventCursor < envelope.cursorStart
      || latestEventCursor > envelope.cursorEnd) {
      return { kind: "terminal", code: "REENTRY_EVENT_CONTEXT_UNAVAILABLE" };
    }
    const occurredAt = occurredAtFor({
      store: this.store,
      bindingResolver: this.bindingResolver,
      eventPublisher: this.eventPublisher,
      ...(this.worldTimeOriginMs === undefined ? {} : { worldTimeOriginMs: this.worldTimeOriginMs }),
      ...(this.resolveOccurredAt === undefined ? {} : { resolveOccurredAt: this.resolveOccurredAt }),
      now: this.now,
    }, envelope);
    if (!occurredAt) return { kind: "terminal", code: "REENTRY_OCCURRENCE_UNAVAILABLE" };

    const context = this.store.prepareReentryEventContext({
      worldId: envelope.worldId,
      signalId: envelope.signalId,
      opaqueBinding: envelope.opaqueBinding,
      occurredAt,
      // cursorEnd is the authoritative causal page version for the complete
      // coalesced signal window. latestEventId is checked above only to prove
      // that the selected eligible event is inside that durable window.
      stateVersion: envelope.cursorEnd,
    });
    let acceptance: unknown;
    try {
      acceptance = await this.eventPublisher.sendEvent(Object.freeze({
        binding: resolution.binding,
        workflow: Object.freeze({
          id: resolution.binding.workflow_id,
          stateVersion: context.stateVersion,
          canonicalUrl: resolution.canonicalUrl,
        }),
        eventId: envelope.signalId,
        eventSequence: context.eventSequence,
        occurredAt: context.occurredAt,
      }));
    } catch (error) {
      return publisherFailure(error);
    }
    assertAcceptance(acceptance, {
      eventId: envelope.signalId,
      correlationId: resolution.binding.correlation_id,
    });
    return { kind: "accepted", boundary: "receiver_queue_accepted" };
  }

}

export function createStandingReentryTransport(options: StandingReentryTransportOptions): StandingReentryTransport {
  return new StandingReentryTransport(options);
}
