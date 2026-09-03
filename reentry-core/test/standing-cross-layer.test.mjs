import assert from "node:assert/strict";
import { verify as verifyBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runStandingAuthorizationV02Scenario } from "../conformance/standing-v0.2/scenario.mjs";
import {
  AGENT_ACTIVATION_RESULT_TYPE,
  dispatchAgentActivation,
} from "../src/agent-adapter.mjs";
import { createStandingCloudReceiverHttpHandler } from "../src/cloud-receiver-http.mjs";
import { StandingReentryHostSdk } from "../src/standing-host-sdk.mjs";
import { LocalConnectorClient } from "../src/local-connector-client.mjs";
import { REENTRY_HEADER_NAMES } from "../src/protocol.mjs";
import {
  STANDING_CONNECTOR_IDENTITY_TYPE,
  STANDING_CONSENT_DECISION_TYPE,
  STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
  STANDING_HOST_EFFECT_ATTESTATION_TYPE,
  STANDING_HOST_EFFECT_OUTCOME,
  StandingAuthorizationCore,
} from "../src/standing-authorization-core.mjs";
import {
  STANDING_PROTOCOL_VERSION,
} from "../src/standing-protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";
import { createTestKeys } from "./fixtures.mjs";

const HOST_ORIGIN = "https://standing-profile.example";
const HOST_KEY_ID = "standing_profile_host_key_001";
const ALTERNATE_HOST_KEY_ID = "standing_profile_host_key_002";
const WORKFLOW_ID = "workflow_standing_profile_001";
const CANONICAL_URL = `${HOST_ORIGIN}/workflows/${WORKFLOW_ID}`;
const SUBJECT_ID = "subject_standing_profile_001";
const TARGET_ID = "target_standing_profile_001";
const CONNECTOR_ID = "connector_standing_profile_001";
const CONNECTOR_TOKEN = "connector_standing_profile_secret";
const DECISION_TOKEN = "decision_standing_profile_secret";
const REBOUND_KEY_EVENT_ID = "event_standing_profile_rebound_key_001";

test("standing v0.2 crosses Host SDK, HTTP Receiver, Connector, Agent Adapter, restart, and revoke", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-standing-cross-layer-"));
  const databasePath = join(directory, "receiver.sqlite");
  const keys = createTestKeys();
  const alternateKeys = createTestKeys();
  const clockRef = { value: new Date() };
  const effects = new Map();
  const controls = new Map();
  let decisionVerificationCount = 0;
  let activationCalls = 0;
  let identifier = 0;
  let consentedKeyMaterial = keys.publicKey;
  let reboundKeyEvent;
  const keyMaterialOverrides = [];
  let store;
  let core;
  let server;
  let connector;

  const host = new StandingReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: keys.privateKey,
    keyId: HOST_KEY_ID,
    clock: () => clockRef.value,
  });
  const alternateHost = new StandingReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: alternateKeys.privateKey,
    keyId: ALTERNATE_HOST_KEY_ID,
    clock: () => clockRef.value,
  });
  const sameIdReplacementHost = new StandingReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: alternateKeys.privateKey,
    keyId: HOST_KEY_ID,
    clock: () => clockRef.value,
  });

  const authorities = {
    keyResolver({ issuerOrigin, keyId, purpose }) {
      if (issuerOrigin !== HOST_ORIGIN || !["manifest", "event"].includes(purpose)) return undefined;
      if (keyId === HOST_KEY_ID) return consentedKeyMaterial;
      if (keyId === ALTERNATE_HOST_KEY_ID) return alternateKeys.publicKey;
      return undefined;
    },
    consentAuthority: {
      verifyDecision({ challengeId, decisionToken }) {
        decisionVerificationCount += 1;
        if (decisionToken !== DECISION_TOKEN) throw new Error("Unknown decision token");
        return {
          type: STANDING_CONSENT_DECISION_TYPE,
          protocol_version: STANDING_PROTOCOL_VERSION,
          decision_id: "decision_standing_profile_001",
          challenge_id: challengeId,
          action: "approve",
          subject_id: SUBJECT_ID,
          delivery_target_id: TARGET_ID,
          decided_at: clockRef.value.toISOString(),
        };
      },
    },
    grantControlAuthority: {
      verifyControl({ controlToken }) {
        const control = controls.get(controlToken);
        if (!control) throw new Error("Unknown control token");
        return control;
      },
    },
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        if (connectorToken !== CONNECTOR_TOKEN) throw new Error("Unknown Connector token");
        return {
          type: STANDING_CONNECTOR_IDENTITY_TYPE,
          protocol_version: STANDING_PROTOCOL_VERSION,
          connector_id: CONNECTOR_ID,
          subject_id: SUBJECT_ID,
          delivery_target_id: TARGET_ID,
          authenticated_at: new Date(clockRef.value.getTime() - 1_000).toISOString(),
          expires_at: new Date(clockRef.value.getTime() + 60 * 60_000).toISOString(),
        };
      },
    },
    effectAuthority: {
      verifyEffect({ effectToken }) {
        const effect = effects.get(effectToken);
        if (!effect) throw new Error("Unknown effect token");
        return effect;
      },
    },
  };

  function createCore() {
    return new StandingAuthorizationCore({
      store,
      ...authorities,
      maximumGrantLifetimeMs: 2 * 60 * 60_000,
      leaseDurationMs: 10 * 60_000,
      clock: () => clockRef.value,
      createId(prefix) {
        identifier += 1;
        return `${prefix}_profile_${identifier}`;
      },
    });
  }

  async function startRuntime() {
    store = new SqliteReceiverStore({ filename: databasePath });
    core = createCore();
    server = createServer(createStandingCloudReceiverHttpHandler({ receiver: core }));
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    connector = new LocalConnectorClient({
      baseUrl: origin,
      connectorToken: CONNECTOR_TOKEN,
      requestTimeoutMs: 2_000,
      protocolVersion: STANDING_PROTOCOL_VERSION,
    });
    return origin;
  }

  async function stopRuntime() {
    connector = undefined;
    core = undefined;
    if (server) {
      const activeServer = server;
      server = undefined;
      activeServer.closeAllConnections();
      await new Promise((resolve, reject) => {
        activeServer.close((error) => error ? reject(error) : resolve());
      });
    }
    if (store) {
      store.close();
      store = undefined;
    }
  }

  let receiverOrigin = await startRuntime();
  t.after(async () => {
    await stopRuntime();
    await rm(directory, { recursive: true, force: true });
  });

  const driver = {
    issueManifest() {
      const now = clockRef.value;
      return host.issueManifest({
        manifestId: "manifest_standing_profile_001",
        correlationId: "correlation_standing_profile_001",
        issuedAt: now.toISOString(),
        offerExpiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
        workflow: {
          id: WORKFLOW_ID,
          type: "domain-neutral-workflow",
          stateVersion: 0,
          canonicalUrl: CANONICAL_URL,
        },
        display: {
          title: "Continue the standing workflow",
          reason: "Read current authoritative state and prepare the next safe step.",
        },
        grantRequest: {
          eventType: "workflow.ready",
          grantExpiresAt: new Date(now.getTime() + 60 * 60_000).toISOString(),
          humanBoundary: "confirm_irreversible_action",
        },
      });
    },

    enroll({ manifest }) {
      return core.createConsentChallenge({ manifest, expectedOrigin: HOST_ORIGIN });
    },

    approve({ challengeId }) {
      return core.decideConsent({ challengeId, decisionToken: DECISION_TOKEN });
    },

    issueEvent({ binding, ordinal, signer = "consented" }) {
      const signers = {
        consented: { host, eventId: `event_standing_profile_00${ordinal}` },
        "alternate-trusted": { host: alternateHost, eventId: "event_standing_profile_wrong_key_001" },
        "same-id-replacement": { host: sameIdReplacementHost, eventId: REBOUND_KEY_EVENT_ID },
      };
      const selected = signers[signer];
      assert.ok(selected, "Unknown standing scenario signer");
      const issued = selected.host.issueEvent({
        binding,
        eventId: selected.eventId,
        eventSequence: ordinal,
        occurredAt: clockRef.value.toISOString(),
        deliveryTimestamp: String(Math.floor(clockRef.value.getTime() / 1_000)),
        workflow: {
          id: WORKFLOW_ID,
          stateVersion: ordinal,
          canonicalUrl: CANONICAL_URL,
        },
      });
      if (signer === "same-id-replacement") reboundKeyEvent = issued;
      return issued;
    },

    // This hook belongs only to the Receiver test fixture, not the Host SDK or any HTTP route.
    setConsentedKeyMaterialForTest({ material }) {
      assert.ok(["replacement", "consented"].includes(material));
      keyMaterialOverrides.push(material);
      consentedKeyMaterial = material === "replacement" ? alternateKeys.publicKey : keys.publicKey;
    },

    async sendEvent({ envelope }) {
      const response = await fetch(`${receiverOrigin}/v0.2/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
        redirect: "manual",
        signal: AbortSignal.timeout(2_000),
      });
      return {
        statusCode: response.status,
        body: JSON.parse(await response.text()),
      };
    },

    claim({ claimToken }) {
      return connector.claimDelivery({ claimToken });
    },

    dispatch({ lease }) {
      return dispatchAgentActivation({
        lease,
        now: clockRef.value,
        timeoutMs: 1_000,
        adapter: {
          activate(activation) {
            activationCalls += 1;
            return {
              type: AGENT_ACTIVATION_RESULT_TYPE,
              protocol_version: activation.protocol_version,
              delivery_id: activation.delivery_id,
              event_id: activation.event_id,
              attempt: activation.attempt,
              outcome: "accepted",
              code: "activation_dispatch_accepted",
              unavailable_capability: null,
            };
          },
        },
      });
    },

    authorizeEffect({ lease, sequence }) {
      const effectToken = `effect_standing_profile_secret_${sequence}`;
      effects.set(effectToken, {
        type: STANDING_HOST_EFFECT_ATTESTATION_TYPE,
        protocol_version: STANDING_PROTOCOL_VERSION,
        effect_id: `effect_standing_profile_00${sequence}`,
        delivery_id: lease.delivery_id,
        event_id: lease.event_id,
        correlation_id: lease.continuation.correlation_id,
        workflow_id: lease.continuation.workflow_id,
        outcome: STANDING_HOST_EFFECT_OUTCOME,
        confirmed_at: clockRef.value.toISOString(),
      });
      return effectToken;
    },

    acknowledge({ deliveryId, leaseToken, effectToken }) {
      return connector.acknowledgeDelivery({ deliveryId, leaseToken, effectToken });
    },

    async restart() {
      await stopRuntime();
      receiverOrigin = await startRuntime();
    },

    inspect({ bindingId }) {
      const controlToken = "inspect_standing_profile_secret";
      controls.set(controlToken, controlAuthorization(bindingId, "inspect", clockRef.value));
      return core.inspectGrant({ bindingId, controlToken });
    },

    revoke({ bindingId }) {
      const controlToken = "revoke_standing_profile_secret";
      controls.set(controlToken, controlAuthorization(bindingId, "revoke", clockRef.value));
      return core.revokeGrant({ bindingId, controlToken });
    },
  };

  const claimTokens = [1, 2, 3].map((value) => Buffer.alloc(32, value).toString("base64url"));
  const result = await runStandingAuthorizationV02Scenario({ driver, claimTokens });

  assert.equal(result.status, "passed");
  assert.equal(result.consent_decisions, 1);
  assert.equal(result.consented_host_key_enforced, true);
  assert.equal(result.consented_host_key_material_enforced, true);
  assert.deepEqual(result.accepted_sequences, [1, 2]);
  assert.equal(result.backpressure.retryable, true);
  assert.equal(result.revocation.third_event_rejected, true);
  assert.equal(decisionVerificationCount, 1);
  assert.equal(activationCalls, 2);
  assert.deepEqual(keyMaterialOverrides, ["replacement", "consented"]);
  assert.equal(consentedKeyMaterial, keys.publicKey);
  assert.equal(reboundKeyEvent.headers[REENTRY_HEADER_NAMES.keyId], HOST_KEY_ID);
  assert.equal(verifyBytes(
    null,
    Buffer.from(`${reboundKeyEvent.headers[REENTRY_HEADER_NAMES.timestamp]}.${reboundKeyEvent.body}`),
    alternateKeys.publicKey,
    Buffer.from(reboundKeyEvent.headers[REENTRY_HEADER_NAMES.signature], "base64url"),
  ), true);
  assert.equal(store.getStandingEventById(REBOUND_KEY_EVENT_ID), undefined);
  assert.equal(store.getStandingDeliveryByEventId(REBOUND_KEY_EVENT_ID), undefined);
});

function controlAuthorization(bindingId, action, now) {
  return {
    type: STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: bindingId,
    action,
    subject_id: SUBJECT_ID,
    authenticated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
  };
}
