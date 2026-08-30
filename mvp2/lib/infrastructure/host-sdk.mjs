import { randomUUID } from "node:crypto";
import {
  createContinuationEvent,
  createReentryManifest,
  signContinuationEvent,
} from "./protocol.mjs";

export class ContinuationHostSdk {
  constructor({
    origin,
    signingSecret,
    keyId,
    clock = () => new Date(),
    createId = randomUUID,
  }) {
    requireOrigin(origin);
    requireText(signingSecret, "Host signing secret");
    requireText(keyId, "Host key id");
    this.origin = origin;
    this.signing = { secret: signingSecret, keyId };
    this.clock = clock;
    this.createId = createId;
  }

  issueManifest({ manifestId, workflow, reentryPoints, issuedAt }) {
    return createReentryManifest({
      manifestId: manifestId ?? `rm_${this.createId()}`,
      origin: this.origin,
      workflow,
      reentryPoints,
      issuedAt: issuedAt ?? this.clock().toISOString(),
      signing: this.signing,
    });
  }

  createUnsignedEvent({
    binding,
    workflow,
    eventType,
    resumeUrl,
    eventId,
    nonce,
    idempotencyKey,
  }) {
    requireBinding(binding, workflow.id, eventType);
    return createContinuationEvent({
      eventId: eventId ?? `evt_${this.createId()}`,
      grantId: binding.grantId,
      manifestId: binding.manifestId,
      origin: this.origin,
      workflowId: workflow.id,
      eventType,
      stateVersion: workflow.stateVersion,
      occurredAt: this.clock().toISOString(),
      resumeUrl,
      nonce: nonce ?? this.createId(),
      idempotencyKey:
        idempotencyKey ?? `${workflow.id}:${workflow.stateVersion}:${eventType}`,
    });
  }

  issueEvent(input) {
    return signContinuationEvent(this.createUnsignedEvent(input), this.signing);
  }
}

function requireBinding(binding, workflowId, eventType) {
  if (!binding || typeof binding !== "object") {
    throw new Error("An active continuation binding is required");
  }
  if (binding.status !== "active") {
    throw new Error("Continuation binding is inactive");
  }
  if (binding.workflowId !== workflowId) {
    throw new Error("Continuation binding workflow mismatch");
  }
  if (!binding.allowedEvents?.includes(eventType)) {
    throw new Error("Event type is outside the continuation binding");
  }
}

function requireOrigin(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    throw new TypeError("Host origin must be an absolute HTTP(S) origin");
  }
  if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) {
    throw new TypeError("Host origin must be an absolute HTTP(S) origin");
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} is required`);
  }
}
