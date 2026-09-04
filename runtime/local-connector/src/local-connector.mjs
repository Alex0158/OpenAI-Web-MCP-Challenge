import { createHash, randomBytes } from "node:crypto";

import {
  dispatchAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import {
  dispatchRuntimeAdmission,
  RUNTIME_ADMISSION_RESULT_TYPE,
} from "@webmcp-challenge/reentry-core/runtime-admission";

const OPTION_FIELDS = Object.freeze([
  "client",
  "adapter",
  "clock",
  "activationTimeoutMs",
  "createClaimToken",
  "createHandoffId",
  "handoffJournal",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze(OPTION_FIELDS.filter((field) => !["createHandoffId", "handoffJournal"].includes(field)));
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 60_000;

export class LocalConnector {
  #client;
  #adapter;
  #clock;
  #activationTimeoutMs;
  #createClaimToken;
  #createHandoffId;
  #handoffJournal;

  constructor(options) {
    requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Local Connector options");
    if (!(options.client instanceof LocalConnectorClient)) {
      throw new TypeError("Local Connector client must be a LocalConnectorClient");
    }
    if (
      !options.adapter ||
      (typeof options.adapter.activate !== "function"
        && typeof options.adapter.admitNotification !== "function")
    ) {
      throw new TypeError("Local Connector adapter must implement activate or admitNotification");
    }
    if (typeof options.clock !== "function") throw new TypeError("Local Connector clock must be a function");
    if (!Number.isSafeInteger(options.activationTimeoutMs) || options.activationTimeoutMs < MIN_TIMEOUT_MS || options.activationTimeoutMs > MAX_TIMEOUT_MS) {
      throw new TypeError("Local Connector activationTimeoutMs is invalid");
    }
    if (typeof options.createClaimToken !== "function") throw new TypeError("Local Connector createClaimToken must be a function");
    if (options.createHandoffId !== undefined && typeof options.createHandoffId !== "function") {
      throw new TypeError("Local Connector createHandoffId must be a function");
    }
    if (options.handoffJournal !== undefined) requireHandoffJournal(options.handoffJournal);
    this.#client = options.client;
    this.#adapter = options.adapter;
    this.#clock = options.clock;
    this.#activationTimeoutMs = options.activationTimeoutMs;
    this.#createClaimToken = options.createClaimToken;
    this.#createHandoffId = options.createHandoffId ?? createStableHandoffId;
    this.#handoffJournal = options.handoffJournal;
  }

  async runOnce() {
    const claimToken = this.#createClaimToken();
    const claim = await this.#client.claimDelivery({ claimToken });
    if (claim === null) return Object.freeze({ status: "idle" });
    if (this.#client.protocolVersion === "0.2") {
      return this.#runStandingHandoff(claim.lease);
    }
    const result = await dispatchAgentActivation({
      adapter: this.#adapter,
      lease: claim.lease,
      now: this.#readClock(),
      timeoutMs: this.#activationTimeoutMs,
    });
    return Object.freeze({
      status: "activation_result",
      delivery_id: claim.lease.delivery_id,
      event_id: claim.lease.event_id,
      result,
    });
  }

  acknowledgeDelivery(input) {
    return this.#client.acknowledgeDelivery(input);
  }

  async #runStandingHandoff(lease) {
    const handoffId = this.#createHandoffId({
      deliveryId: lease.delivery_id,
      eventId: lease.event_id,
    });
    if (this.#handoffJournal !== undefined) {
      return this.#runJournaledStandingHandoff(lease, handoffId);
    }
    const admission = await dispatchRuntimeAdmission({
      adapter: this.#adapter,
      lease,
      handoffId,
      now: this.#readClock(),
      timeoutMs: this.#activationTimeoutMs,
    });
    if (admission.outcome !== "admitted") {
      return Object.freeze({
        status: "handoff_result",
        delivery_id: lease.delivery_id,
        event_id: lease.event_id,
        handoff_id: handoffId,
        admission,
        receipt: null,
      });
    }
    try {
      const receipt = await this.#client.handoffNotification({
        deliveryId: lease.delivery_id,
        eventId: lease.event_id,
        leaseToken: lease.lease_token,
        handoffId,
        runtimeAdmissionAttestation: admission.attestation,
      });
      return Object.freeze({
        status: "handoff_result",
        delivery_id: lease.delivery_id,
        event_id: lease.event_id,
        handoff_id: handoffId,
        admission,
        receipt,
      });
    } catch (error) {
      return Object.freeze({
        status: "handoff_result",
        delivery_id: lease.delivery_id,
        event_id: lease.event_id,
        handoff_id: handoffId,
        admission,
        receipt: null,
        handoff_error: Object.freeze({
          code: error?.code ?? "notification_handoff_failed",
          outcome: isUnknownHandoffError(error) ? "outcome_unknown" : "rejected",
          retryable: error?.retryable === true,
        }),
      });
    }
  }

  async #runJournaledStandingHandoff(lease, handoffId) {
    const existing = await this.#handoffJournal.get({ handoffId });
    if (existing !== null) {
      assertJournalIdentity(existing, lease, handoffId);
      if (existing.state === "handed_off") {
        return handoffResult({
          lease,
          handoffId,
          admission: recoveredAdmission(lease, handoffId, existing.runtime_admission_attestation),
          receipt: existing.receipt,
        });
      }
      if (existing.state === "handoff_pending") {
        return this.#resumeJournaledReceiverHandoff(lease, handoffId, existing);
      }
      if (existing.state === "runtime_pending" || existing.state === "runtime_unknown") {
        return unknownJournalResult(lease, handoffId, "runtime_admission_outcome_unknown");
      }
      // `unsupported` is the only journal state that may start a fresh capability check.
    }

    const reservation = await this.#handoffJournal.begin({
      handoffId,
      deliveryId: lease.delivery_id,
      eventId: lease.event_id,
      recordedAt: this.#readClock(),
    });
    assertJournalIdentity(reservation, lease, handoffId);
    if (reservation.state === "handed_off") {
      return handoffResult({
        lease,
        handoffId,
        admission: recoveredAdmission(lease, handoffId, reservation.runtime_admission_attestation),
        receipt: reservation.receipt,
      });
    }
    if (reservation.state === "handoff_pending") {
      return this.#resumeJournaledReceiverHandoff(lease, handoffId, reservation);
    }

    const admission = await dispatchRuntimeAdmission({
      adapter: this.#adapter,
      lease,
      handoffId,
      now: this.#readClock(),
      timeoutMs: this.#activationTimeoutMs,
    });
    if (admission.outcome === "unsupported") {
      await this.#handoffJournal.recordUnsupported({
        handoffId,
        deliveryId: lease.delivery_id,
        eventId: lease.event_id,
        code: admission.code,
        recordedAt: this.#readClock(),
      });
      return handoffResult({ lease, handoffId, admission, receipt: null });
    }
    if (admission.outcome !== "admitted") {
      await this.#handoffJournal.recordRuntimeUnknown({
        handoffId,
        deliveryId: lease.delivery_id,
        eventId: lease.event_id,
        code: admission.code,
        recordedAt: this.#readClock(),
      });
      return handoffResult({ lease, handoffId, admission, receipt: null });
    }

    try {
      await this.#handoffJournal.recordAdmission({
        handoffId,
        deliveryId: lease.delivery_id,
        eventId: lease.event_id,
        attestation: admission.attestation,
        recordedAt: this.#readClock(),
      });
    } catch (error) {
      return handoffResult({
        lease,
        handoffId,
        admission,
        receipt: null,
        handoffError: {
          code: error?.code ?? "local_handoff_journal_failed",
          outcome: "outcome_unknown",
          retryable: false,
        },
      });
    }
    return this.#submitJournaledReceiverHandoff(lease, handoffId, admission.attestation);
  }

  async #resumeJournaledReceiverHandoff(lease, handoffId, entry) {
    return this.#submitJournaledReceiverHandoff(
      lease,
      handoffId,
      entry.runtime_admission_attestation,
    );
  }

  async #submitJournaledReceiverHandoff(lease, handoffId, runtimeAdmissionAttestation) {
    const admission = recoveredAdmission(lease, handoffId, runtimeAdmissionAttestation);
    try {
      const receipt = await this.#client.handoffNotification({
        deliveryId: lease.delivery_id,
        eventId: lease.event_id,
        leaseToken: lease.lease_token,
        handoffId,
        runtimeAdmissionAttestation,
      });
      try {
        await this.#handoffJournal.recordHandoff({
          handoffId,
          deliveryId: lease.delivery_id,
          eventId: lease.event_id,
          receipt,
          recordedAt: this.#readClock(),
        });
      } catch (error) {
        return handoffResult({
          lease,
          handoffId,
          admission,
          receipt,
          handoffError: {
            code: error?.code ?? "local_handoff_journal_failed",
            outcome: "outcome_unknown",
            retryable: false,
          },
        });
      }
      return handoffResult({ lease, handoffId, admission, receipt });
    } catch (error) {
      return handoffResult({
        lease,
        handoffId,
        admission,
        receipt: null,
        handoffError: {
          code: error?.code ?? "notification_handoff_failed",
          outcome: isUnknownHandoffError(error) ? "outcome_unknown" : "rejected",
          retryable: error?.retryable === true,
        },
      });
    }
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new TypeError("Local Connector clock must return a valid Date");
    return new Date(value.getTime());
  }
}

export function createRandomClaimToken() {
  return randomBytes(32).toString("base64url");
}

export function createStableHandoffId({ deliveryId, eventId }) {
  if (typeof deliveryId !== "string" || typeof eventId !== "string") {
    throw new TypeError("Local Connector handoff identity inputs are invalid");
  }
  const digest = createHash("sha256")
    .update(`${deliveryId}\0${eventId}`, "utf8")
    .digest("hex");
  return `handoff_${digest}`;
}

function isUnknownHandoffError(error) {
  return [
    "connector_request_timeout",
    "connector_network_error",
    "connector_redirect_rejected",
    "connector_http_error",
    "connector_response_invalid",
    "connector_response_too_large",
  ].includes(error?.code);
}

function requireHandoffJournal(value) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.get !== "function" ||
    typeof value.begin !== "function" ||
    typeof value.recordUnsupported !== "function" ||
    typeof value.recordRuntimeUnknown !== "function" ||
    typeof value.recordAdmission !== "function" ||
    typeof value.recordHandoff !== "function"
  ) {
    throw new TypeError("Local Connector handoffJournal must implement the journal interface");
  }
}

function assertJournalIdentity(entry, lease, handoffId) {
  if (
    !entry ||
    entry.handoff_id !== handoffId ||
    entry.delivery_id !== lease.delivery_id ||
    entry.event_id !== lease.event_id
  ) {
    const error = new Error("Local handoff journal identity does not match the claimed lease");
    error.code = "local_handoff_journal_identity_conflict";
    throw error;
  }
}

function recoveredAdmission(lease, handoffId, attestation) {
  return Object.freeze({
    type: RUNTIME_ADMISSION_RESULT_TYPE,
    protocol_version: lease.protocol_version,
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    attempt: lease.attempt,
    handoff_id: handoffId,
    outcome: "admitted",
    code: "runtime_admission_recovered",
    unavailable_capability: null,
    attestation,
  });
}

function handoffResult({ lease, handoffId, admission, receipt, handoffError }) {
  const result = {
    status: "handoff_result",
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    handoff_id: handoffId,
    admission,
    receipt,
  };
  if (handoffError !== undefined) result.handoff_error = Object.freeze(handoffError);
  return Object.freeze(result);
}

function unknownJournalResult(lease, handoffId, code) {
  return handoffResult({
    lease,
    handoffId,
    admission: null,
    receipt: null,
    handoffError: {
      code,
      outcome: "outcome_unknown",
      retryable: false,
    },
  });
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) throw new TypeError(`${label} fields are invalid`);
}
