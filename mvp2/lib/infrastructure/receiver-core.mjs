import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  canonicalJson,
  validateContinuationEvent,
  validateReentryManifest,
} from "./protocol.mjs";
import {
  assertDeliveryResult,
  buildReentryInstruction,
} from "./agent-adapter.mjs";

export function createReceiverState() {
  return {
    grants: [],
    events: [],
    runs: [],
    audit: [],
  };
}

export class ReceiverCore {
  constructor({
    adapter,
    keyResolver,
    expectedOrigin,
    clock = () => new Date(),
    createId = randomUUID,
    maximumEventAgeMs = 5 * 60 * 1000,
    futureClockSkewMs = 60 * 1000,
  }) {
    if (!adapter || typeof adapter.deliver !== "function") {
      throw new TypeError("ReceiverCore requires an Agent Continuation Adapter");
    }
    if (typeof keyResolver !== "function") {
      throw new TypeError("ReceiverCore requires an issuer key resolver");
    }
    this.adapter = adapter;
    this.keyResolver = keyResolver;
    this.expectedOrigin = expectedOrigin;
    this.clock = clock;
    this.createId = createId;
    this.maximumEventAgeMs = maximumEventAgeMs;
    this.futureClockSkewMs = futureClockSkewMs;
  }

  activateGrant(receiverState, { manifest, eventType, humanApproved }) {
    requireReceiverState(receiverState);
    if (humanApproved !== true) {
      throw new ReceiverAuthorizationError(
        "Continuation Grant activation requires explicit human approval",
      );
    }
    validateReentryManifest(manifest, {
      keyResolver: this.keyResolver,
      expectedOrigin: this.expectedOrigin,
      now: this.clock(),
    });
    const point = manifest.reentryPoints.find(
      (candidate) => candidate.eventType === eventType,
    );
    if (!point) {
      throw new ReceiverScopeError("Requested event is not offered by the manifest");
    }

    const existing = receiverState.grants.find(
      (grant) =>
        grant.manifestId === manifest.manifestId &&
        grant.allowedEvents.includes(eventType) &&
        grant.status === "active",
    );
    if (existing) {
      if (existing.manifestCanonical !== canonicalJson(manifest)) {
        throw new ReceiverScopeError(
          "Manifest ID was already activated with different content",
        );
      }
      return publicGrantBinding(existing);
    }

    const grant = {
      grantId: `cg_${this.createId()}`,
      manifestId: manifest.manifestId,
      manifestCanonical: canonicalJson(manifest),
      workflowId: manifest.workflow.id,
      issuerOrigin: manifest.origin,
      allowedEvents: [eventType],
      status: "active",
      maximumRuns: point.defaultLimits.maximumExecutions,
      minimumIntervalSeconds: point.defaultLimits.minimumIntervalSeconds,
      runsUsed: 0,
      lastAcceptedStateVersion: manifest.workflow.stateVersion,
      lastAcceptedAt: null,
      expiresAt: point.defaultLimits.expiresAt,
      canonicalUrl: point.resumeUrl,
      reentryGoal: point.reentryGoal,
      permittedReadTools: structuredClone(point.permittedReadTools),
      permittedWriteTools: structuredClone(point.permittedWriteTools),
      requiredToolOrder: structuredClone(point.requiredToolOrder),
      actionsRequiringHumanApproval: structuredClone(
        point.actionsRequiringHumanApproval,
      ),
      consequentialActionsRequireHumanApproval:
        point.actionsRequiringHumanApproval.length > 0,
      attachedAt: this.clock().toISOString(),
    };
    receiverState.grants.push(grant);
    audit(receiverState, this.createId, this.clock, "grant.activated", {
      grantId: grant.grantId,
      workflowId: grant.workflowId,
      eventType,
    });
    return publicGrantBinding(grant);
  }

  acceptEvent(receiverState, event, authoritativeWorkflow) {
    requireReceiverState(receiverState);
    validateContinuationEvent(event, {
      keyResolver: this.keyResolver,
      expectedOrigin: this.expectedOrigin,
    });

    const duplicate = receiverState.events.find(
      (existing) =>
        existing.eventId === event.eventId ||
        existing.idempotencyKey === event.idempotencyKey,
    );
    if (duplicate) {
      if (!isDeepStrictEqual(duplicate.payload, event)) {
        throw new ReceiverScopeError(
          "Event identity or idempotency key was reused for a different payload",
        );
      }
      return {
        accepted: true,
        duplicate: true,
        eventId: duplicate.eventId,
        runId: duplicate.runId,
        status: duplicate.deliveryStatus,
      };
    }

    const grant = receiverState.grants.find(
      (candidate) => candidate.grantId === event.grantId,
    );
    if (!grant) throw new ReceiverScopeError("Event does not resolve to a Grant");
    validateGrant(grant, event, authoritativeWorkflow, this.clock(), {
      maximumEventAgeMs: this.maximumEventAgeMs,
      futureClockSkewMs: this.futureClockSkewMs,
    });

    const runId = `run_${this.createId()}`;
    const acceptedAt = this.clock().toISOString();
    receiverState.events.push({
      eventId: event.eventId,
      idempotencyKey: event.idempotencyKey,
      grantId: grant.grantId,
      runId,
      signatureStatus: "verified",
      deliveryStatus: "reserved",
      acceptedAt,
      payload: structuredClone(event),
    });
    receiverState.runs.push({
      runId,
      eventId: event.eventId,
      grantId: grant.grantId,
      status: "reserved",
      createdAt: acceptedAt,
      resumeUrl: event.resumeUrl,
      adapter: this.adapter.id,
      proofClassification: this.adapter.proofClassification,
    });
    grant.lastAcceptedStateVersion = event.stateVersion;
    grant.lastAcceptedAt = acceptedAt;
    grant.runsUsed += 1;
    audit(receiverState, this.createId, this.clock, "continuation.event_reserved", {
      eventId: event.eventId,
      runId,
      workflowId: event.workflowId,
      eventType: event.eventType,
    });
    return {
      accepted: true,
      duplicate: false,
      eventId: event.eventId,
      runId,
      status: "reserved",
    };
  }

  async dispatch(receiverState, reservation) {
    requireReceiverState(receiverState);
    const eventRecord = receiverState.events.find(
      (event) => event.eventId === reservation.eventId,
    );
    const run = receiverState.runs.find(
      (candidate) => candidate.runId === reservation.runId,
    );
    if (!eventRecord || !run) {
      throw new ReceiverScopeError("Reserved continuation run was not found");
    }
    if (reservation.duplicate || run.status !== "reserved") {
      return {
        status: run.status,
        adapter: run.adapter,
        proofClassification: run.proofClassification,
        duplicate: true,
        ...(run.delivery ? { ...run.delivery } : {}),
      };
    }
    const grant = receiverState.grants.find(
      (candidate) => candidate.grantId === eventRecord.grantId,
    );
    if (!grant || grant.status !== "active") {
      throw new ReceiverScopeError("Grant became inactive before delivery");
    }
    const instruction = buildReentryInstruction({
      event: eventRecord.payload,
      grant,
    });

    try {
      const delivery = assertDeliveryResult(
        await this.adapter.deliver({
          event: structuredClone(eventRecord.payload),
          grant: publicGrantForAdapter(grant),
          instruction,
          runId: run.runId,
        }),
        this.adapter,
      );
      run.status = delivery.status;
      run.completedAt = this.clock().toISOString();
      run.delivery = redactDelivery(delivery);
      eventRecord.deliveryStatus = delivery.status;
      audit(receiverState, this.createId, this.clock, "agent.reentry_dispatched", {
        eventId: eventRecord.eventId,
        runId: run.runId,
        adapter: delivery.adapter,
        deliveryStatus: delivery.status,
      });
      return delivery;
    } catch (error) {
      run.status = "failed";
      run.completedAt = this.clock().toISOString();
      run.delivery = { error: error.message };
      eventRecord.deliveryStatus = "failed";
      audit(receiverState, this.createId, this.clock, "agent.reentry_failed", {
        eventId: eventRecord.eventId,
        runId: run.runId,
        adapter: this.adapter.id,
        error: error.message,
      });
      return {
        status: "failed",
        adapter: this.adapter.id,
        proofClassification: this.adapter.proofClassification,
        error: error.message,
      };
    }
  }

  diagnostics(receiverState) {
    requireReceiverState(receiverState);
    return {
      adapter: this.adapter.describe(),
      grants: receiverState.grants.map(publicGrantBinding),
      events: receiverState.events.map((event) => ({
        eventId: event.eventId,
        eventType: event.payload.eventType,
        workflowId: event.payload.workflowId,
        stateVersion: event.payload.stateVersion,
        signature: {
          algorithm: event.payload.signature.algorithm,
          keyId: event.payload.signature.keyId,
        },
        signatureStatus: event.signatureStatus,
        deliveryStatus: event.deliveryStatus,
        runId: event.runId,
        acceptedAt: event.acceptedAt,
      })),
      runs: structuredClone(receiverState.runs),
      audit: structuredClone(receiverState.audit),
    };
  }
}

export function publicGrantBinding(grant) {
  if (!grant) return null;
  return {
    grantId: grant.grantId,
    manifestId: grant.manifestId,
    workflowId: grant.workflowId,
    allowedEvents: structuredClone(grant.allowedEvents),
    status: grant.status,
    maximumRuns: grant.maximumRuns,
    runsUsed: grant.runsUsed,
    expiresAt: grant.expiresAt,
    consequentialActionsRequireHumanApproval:
      grant.consequentialActionsRequireHumanApproval,
  };
}

function publicGrantForAdapter(grant) {
  return {
    ...publicGrantBinding(grant),
    canonicalUrl: grant.canonicalUrl,
    reentryGoal: grant.reentryGoal,
    permittedReadTools: structuredClone(grant.permittedReadTools),
    permittedWriteTools: structuredClone(grant.permittedWriteTools),
    requiredToolOrder: structuredClone(grant.requiredToolOrder),
    actionsRequiringHumanApproval: structuredClone(
      grant.actionsRequiringHumanApproval,
    ),
  };
}

function validateGrant(
  grant,
  event,
  workflow,
  now,
  { maximumEventAgeMs, futureClockSkewMs },
) {
  if (grant.status !== "active") throw new ReceiverScopeError("Grant is inactive");
  if (Date.parse(grant.expiresAt) <= now.getTime()) {
    throw new ReceiverScopeError("Grant has expired");
  }
  if (event.manifestId !== grant.manifestId) {
    throw new ReceiverScopeError("Manifest mismatch");
  }
  if (event.origin !== grant.issuerOrigin) {
    throw new ReceiverScopeError("Issuer origin mismatch");
  }
  if (event.workflowId !== grant.workflowId) {
    throw new ReceiverScopeError("Workflow mismatch");
  }
  if (!grant.allowedEvents.includes(event.eventType)) {
    throw new ReceiverScopeError("Event type is outside the approved Grant");
  }
  if (event.resumeUrl !== grant.canonicalUrl) {
    throw new ReceiverScopeError("Canonical URL is outside the approved Grant");
  }
  if (!workflow || workflow.id !== grant.workflowId) {
    throw new ReceiverScopeError("Authoritative workflow was not found");
  }
  if (event.stateVersion !== workflow.stateVersion) {
    throw new ReceiverScopeError(
      "Event state version does not match authoritative Host state",
    );
  }
  if (event.stateVersion <= grant.lastAcceptedStateVersion) {
    throw new ReceiverScopeError("Continuation event is stale");
  }
  if (grant.runsUsed >= grant.maximumRuns) {
    throw new ReceiverScopeError("Grant run budget is exhausted");
  }
  const occurredAt = Date.parse(event.occurredAt);
  if (occurredAt > now.getTime() + futureClockSkewMs) {
    throw new ReceiverScopeError("Continuation event occurredAt is in the future");
  }
  if (now.getTime() - occurredAt > maximumEventAgeMs) {
    throw new ReceiverScopeError("Continuation event is outside the accepted time window");
  }
  if (occurredAt >= Date.parse(grant.expiresAt)) {
    throw new ReceiverScopeError("Continuation event occurred after Grant expiry");
  }
  if (grant.lastAcceptedAt) {
    const elapsed = now.getTime() - Date.parse(grant.lastAcceptedAt);
    if (elapsed < grant.minimumIntervalSeconds * 1000) {
      throw new ReceiverScopeError("Grant minimum run interval has not elapsed");
    }
  }
}

function requireReceiverState(state) {
  if (
    !state ||
    !Array.isArray(state.grants) ||
    !Array.isArray(state.events) ||
    !Array.isArray(state.runs) ||
    !Array.isArray(state.audit)
  ) {
    throw new TypeError("Receiver state does not implement the required repository shape");
  }
}

function audit(state, createId, clock, action, details) {
  state.audit.push({
    id: createId(),
    action,
    details,
    createdAt: clock().toISOString(),
  });
}

function redactDelivery(delivery) {
  const allowed = [
    "status",
    "adapter",
    "proofClassification",
    "contextBindingHash",
    "transportAcknowledged",
    "error",
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => Object.hasOwn(delivery, key))
      .map((key) => [key, delivery[key]]),
  );
}

export class ReceiverAuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReceiverAuthorizationError";
    this.statusCode = 403;
  }
}

export class ReceiverScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReceiverScopeError";
    this.statusCode = 422;
  }
}
