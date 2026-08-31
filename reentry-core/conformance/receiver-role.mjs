import { createPublicKey } from "node:crypto";
import { createServer } from "node:http";

import { createCloudReceiverHttpHandler } from "../src/cloud-receiver-http.mjs";
import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
  ReceiverCore,
} from "../src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../src/protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";

export function createReceiverRole({
  beforeHandleRequest,
  createStore = ({ filename }) => new SqliteReceiverStore({ filename }),
  grantControlAuthority,
} = {}) {
  if (beforeHandleRequest !== undefined && typeof beforeHandleRequest !== "function") {
    throw profileError("profile_receiver_hook_invalid");
  }
  if (typeof createStore !== "function") {
    throw profileError("profile_receiver_store_factory_invalid");
  }
  if (
    grantControlAuthority !== undefined &&
    typeof grantControlAuthority?.verifyControl !== "function"
  ) {
    throw profileError("profile_receiver_grant_control_invalid");
  }

  let receiver;
  let store;
  let server;
  let configuration;
  const effects = new Map();

  const handlers = {
    async start(input) {
      if (server) throw profileError("profile_receiver_already_started");
      configuration = input;
      const publicKey = createPublicKey(input.publicKeyPem);
      const authenticatedAt = new Date(Date.now() - 1_000).toISOString();
      const connectorExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
      store = createStore({ filename: input.databasePath });
      receiver = new ReceiverCore({
        store,
        keyResolver({ issuerOrigin, keyId, purpose }) {
          if (
            issuerOrigin === input.hostOrigin &&
            keyId === input.keyId &&
            ["manifest", "event"].includes(purpose)
          ) {
            return publicKey;
          }
          return undefined;
        },
        consentAuthority: {
          verifyDecision({ challengeId, decisionToken }) {
            if (decisionToken !== input.decisionToken) {
              throw new Error("Unknown decision token");
            }
            return {
              type: CONSENT_DECISION_TYPE,
              protocol_version: PROTOCOL_VERSION,
              decision_id: "decision_conformance_001",
              challenge_id: challengeId,
              action: "approve",
              subject_id: "subject_conformance_001",
              delivery_target_id: "target_conformance_001",
              decided_at: new Date().toISOString(),
            };
          },
        },
        grantControlAuthority: grantControlAuthority ?? {
          verifyControl() {
            throw new Error("Grant control is not configured in the conformance profile");
          },
        },
        connectorAuthority: {
          verifyConnector({ connectorToken }) {
            if (connectorToken !== input.connectorToken) {
              throw new Error("Unknown Connector token");
            }
            return {
              type: CONNECTOR_IDENTITY_TYPE,
              protocol_version: PROTOCOL_VERSION,
              connector_id: "connector_conformance_001",
              subject_id: "subject_conformance_001",
              delivery_target_id: "target_conformance_001",
              authenticated_at: authenticatedAt,
              expires_at: connectorExpiresAt,
            };
          },
        },
        effectAuthority: {
          verifyEffect({ effectToken }) {
            const attestation = effects.get(effectToken);
            if (!attestation) throw new Error("Unknown Host-effect token");
            return attestation;
          },
        },
        maximumGrantLifetimeMs: 15 * 60_000,
        leaseDurationMs: input.leaseDurationMs ?? 2 * 60_000,
        maximumDeliveryAttempts: 3,
      });

      const handler = createCloudReceiverHttpHandler({ receiver });
      server = createServer((request, response) => {
        beforeHandleRequest?.(request, response);
        handler(request, response);
      });
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(input.port, "127.0.0.1", resolve);
      });
      return {
        pid: process.pid,
        port: server.address().port,
        sqliteLoaded: sqliteLoaded(),
      };
    },

    enroll({ manifest }) {
      requireReceiver(receiver);
      return receiver.createConsentChallenge({
        manifest,
        expectedOrigin: configuration.hostOrigin,
      });
    },

    approve({ challengeId }) {
      requireReceiver(receiver);
      return receiver.decideConsent({
        challengeId,
        decisionToken: configuration.decisionToken,
      });
    },

    authorizeEffect({ effectToken, attestation }) {
      requireReceiver(receiver);
      effects.set(effectToken, attestation);
      return { authorized: true };
    },

    inspectDelivery({ eventId }) {
      requireReceiver(receiver);
      return store.getDeliveryByEventId(eventId) ?? null;
    },

    async stop() {
      await closeReceiver();
      return { stopped: true };
    },
  };

  if (grantControlAuthority !== undefined) {
    handlers.inspectGrant = (input) => {
      requireReceiver(receiver);
      return receiver.inspectGrant(input);
    };
    handlers.revokeGrant = (input) => {
      requireReceiver(receiver);
      return receiver.revokeGrant(input);
    };
  }

  return handlers;

  async function closeReceiver() {
    if (server) {
      const activeServer = server;
      server = undefined;
      const closed = new Promise((resolve, reject) => {
        activeServer.close((error) => error ? reject(error) : resolve());
      });
      activeServer.closeIdleConnections?.();
      await closed;
    }
    if (store) {
      store.close();
      store = undefined;
    }
    receiver = undefined;
  }
}

function requireReceiver(value) {
  if (!value) throw profileError("profile_receiver_not_started");
}

function sqliteLoaded() {
  return process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite"));
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
