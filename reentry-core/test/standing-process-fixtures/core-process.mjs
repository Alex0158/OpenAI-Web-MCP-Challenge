import {
  createPrivateKey,
  createPublicKey,
} from "node:crypto";

import {
  STANDING_CONNECTOR_IDENTITY_TYPE,
  STANDING_CONSENT_DECISION_TYPE,
  STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
  STANDING_HOST_EFFECT_ATTESTATION_TYPE,
  STANDING_HOST_EFFECT_OUTCOME,
  StandingAuthorizationCore,
} from "../../src/standing-authorization-core.mjs";
import {
  STANDING_PROTOCOL_VERSION,
} from "../../src/standing-protocol.mjs";
import { StandingReentryHostSdk } from "../../src/standing-host-sdk.mjs";
import { SqliteReceiverStore } from "../../src/sqlite-receiver-store.mjs";
import { serveProfileProcess } from "../../conformance/process-rpc.mjs";

const HOST_ORIGIN = "https://standing-fresh-process.example";
const HOST_KEY_ID = "standing_fresh_process_key_001";
const CONNECTOR_TOKEN = "standing_fresh_process_connector_token";
const DECISION_TOKEN = "standing_fresh_process_decision_token";
const CONTROL_TOKEN = "standing_fresh_process_control_token";
const SUBJECT_ID = "standing_fresh_process_subject_001";
const DELIVERY_TARGET_ID = "standing_fresh_process_target_001";
const WORKFLOW_ID = "standing_fresh_process_workflow_001";
const EVENT_TYPE = "standing.fresh_process.ready";
const CANONICAL_URL = `${HOST_ORIGIN}/workflows/${WORKFLOW_ID}`;

let runtime;
let identifier = 0;
const effects = new Map();

serveProfileProcess({
  start(input) {
    if (runtime) throw profileError("standing_process_already_started");
    requireStartInput(input);
    const privateKey = createPrivateKey(input.privateKeyPem);
    const publicKey = createPublicKey(input.publicKeyPem);
    const store = new SqliteReceiverStore({ filename: input.databasePath });
    const host = new StandingReentryHostSdk({
      origin: HOST_ORIGIN,
      privateKey,
      keyId: HOST_KEY_ID,
    });
    const core = new StandingAuthorizationCore({
      store,
      keyResolver({ issuerOrigin, keyId, purpose }) {
        if (
          issuerOrigin === HOST_ORIGIN &&
          keyId === HOST_KEY_ID &&
          ["manifest", "event"].includes(purpose)
        ) {
          return publicKey;
        }
        return undefined;
      },
      consentAuthority: {
        verifyDecision({ challengeId, decisionToken }) {
          if (decisionToken !== DECISION_TOKEN) throw new Error("unknown standing decision token");
          return {
            type: STANDING_CONSENT_DECISION_TYPE,
            protocol_version: STANDING_PROTOCOL_VERSION,
            decision_id: "standing_fresh_process_decision_001",
            challenge_id: challengeId,
            action: "approve",
            subject_id: SUBJECT_ID,
            delivery_target_id: DELIVERY_TARGET_ID,
            decided_at: new Date().toISOString(),
          };
        },
      },
      grantControlAuthority: {
        verifyControl({ bindingId, action, controlToken }) {
          if (controlToken !== CONTROL_TOKEN) throw new Error("unknown standing control token");
          const now = new Date();
          return {
            type: STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
            protocol_version: STANDING_PROTOCOL_VERSION,
            binding_id: bindingId,
            action,
            subject_id: SUBJECT_ID,
            authenticated_at: new Date(now.getTime() - 1_000).toISOString(),
            expires_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
          };
        },
      },
      connectorAuthority: {
        verifyConnector({ connectorToken }) {
          if (connectorToken !== CONNECTOR_TOKEN) throw new Error("unknown standing connector token");
          const now = new Date();
          return {
            type: STANDING_CONNECTOR_IDENTITY_TYPE,
            protocol_version: STANDING_PROTOCOL_VERSION,
            connector_id: "standing_fresh_process_connector_001",
            subject_id: SUBJECT_ID,
            delivery_target_id: DELIVERY_TARGET_ID,
            authenticated_at: new Date(now.getTime() - 1_000).toISOString(),
            expires_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
          };
        },
      },
      effectAuthority: {
        verifyEffect({ effectToken }) {
          const effect = effects.get(effectToken);
          if (!effect) throw new Error("unknown standing effect token");
          return effect;
        },
      },
      maximumGrantLifetimeMs: 15 * 60_000,
      leaseDurationMs: 2 * 60_000,
      createId(prefix) {
        identifier += 1;
        return `${prefix}_fresh_process_${identifier}`;
      },
    });
    effects.clear();
    runtime = { core, host, store, binding: undefined };
    return {
      pid: process.pid,
      sqliteLoaded: sqliteLoaded(),
    };
  },

  prepare() {
    requireRuntime();
    if (runtime.binding) throw profileError("standing_process_already_prepared");
    const now = new Date();
    const manifest = runtime.host.issueManifest({
      manifestId: "standing_fresh_process_manifest_001",
      correlationId: "standing_fresh_process_correlation_001",
      issuedAt: now.toISOString(),
      offerExpiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
      workflow: {
        id: WORKFLOW_ID,
        type: "domain-neutral-workflow",
        stateVersion: 1,
        canonicalUrl: CANONICAL_URL,
      },
      display: {
        title: "Continue the standing fresh-process workflow",
        reason: "Read the current authoritative state and prepare the next safe step.",
      },
      grantRequest: {
        eventType: EVENT_TYPE,
        grantExpiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
        humanBoundary: "confirm_irreversible_action",
      },
    });
    const enrollment = runtime.core.createConsentChallenge({
      manifest,
      expectedOrigin: HOST_ORIGIN,
    });
    const approval = runtime.core.decideConsent({
      challengeId: enrollment.challenge.challenge_id,
      decisionToken: DECISION_TOKEN,
    });
    const event = runtime.host.issueEvent({
      binding: approval.binding,
      eventId: "standing_fresh_process_event_001",
      eventSequence: 1,
      occurredAt: now.toISOString(),
      deliveryTimestamp: String(Math.floor(now.getTime() / 1_000)),
      workflow: {
        id: WORKFLOW_ID,
        stateVersion: 2,
        canonicalUrl: CANONICAL_URL,
      },
    });
    const envelope = {
      body: event.body,
      headers: event.headers,
    };
    const acceptance = runtime.core.acceptEvent(envelope);
    runtime.binding = approval.binding;
    return {
      approval,
      event: event.event,
      envelope,
      acceptance,
      claimToken: Buffer.alloc(32, 7).toString("base64url"),
    };
  },

  inspect({ bindingId }) {
    requireRuntime();
    return runtime.core.inspectGrant({ bindingId, controlToken: CONTROL_TOKEN });
  },

  claim({ claimToken }) {
    requireRuntime();
    return runtime.core.claimDelivery({
      connectorToken: CONNECTOR_TOKEN,
      claimToken,
    });
  },

  authorizeEffect({ lease, effectToken }) {
    requireRuntime();
    effects.set(effectToken, {
      type: STANDING_HOST_EFFECT_ATTESTATION_TYPE,
      protocol_version: STANDING_PROTOCOL_VERSION,
      effect_id: "standing_fresh_process_effect_001",
      delivery_id: lease.delivery_id,
      event_id: lease.event_id,
      correlation_id: lease.continuation.correlation_id,
      workflow_id: lease.continuation.workflow_id,
      outcome: STANDING_HOST_EFFECT_OUTCOME,
      confirmed_at: new Date().toISOString(),
    });
    return { authorized: true };
  },

  acknowledge({ deliveryId, leaseToken, effectToken }) {
    requireRuntime();
    return runtime.core.acknowledgeDelivery({
      connectorToken: CONNECTOR_TOKEN,
      deliveryId,
      leaseToken,
      effectToken,
    });
  },

  replay({ envelope }) {
    requireRuntime();
    return runtime.core.acceptEvent(envelope);
  },

  crash() {
    requireRuntime();
    process.kill(process.pid, "SIGKILL");
    throw profileError("standing_process_crash_not_terminated");
  },

  async stop() {
    await closeRuntime();
    return { stopped: true };
  },
});

async function closeRuntime() {
  if (!runtime) return;
  const current = runtime;
  runtime = undefined;
  effects.clear();
  current.store.close();
}

function requireRuntime() {
  if (!runtime) throw profileError("standing_process_not_started");
}

function requireStartInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw profileError("standing_process_start_invalid");
  }
  for (const field of ["databasePath", "privateKeyPem", "publicKeyPem"]) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw profileError("standing_process_start_invalid");
    }
  }
}

function sqliteLoaded() {
  return process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite"));
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
