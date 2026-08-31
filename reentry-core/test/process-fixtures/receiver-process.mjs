import { createPublicKey } from "node:crypto";
import { createServer } from "node:http";

import { createCloudReceiverHttpHandler } from "../../src/cloud-receiver-http.mjs";
import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
  ReceiverCore,
} from "../../src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../src/protocol.mjs";
import { SqliteReceiverStore } from "../../src/sqlite-receiver-store.mjs";
import { serveChildRpc } from "./child-rpc.mjs";

let receiver;
let store;
let server;
let configuration;
let dropNextAcknowledgementResponse = false;
const effects = new Map();

serveChildRpc({
  async start(input) {
    if (server) throw fixtureError("fixture_receiver_already_started");
    configuration = input;
    const publicKey = createPublicKey(input.publicKeyPem);
    const authenticatedAt = new Date(Date.now() - 1_000).toISOString();
    const connectorExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    store = new SqliteReceiverStore({ filename: input.databasePath });
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
          if (decisionToken !== input.decisionToken) throw new Error("Unknown decision token");
          return {
            type: CONSENT_DECISION_TYPE,
            protocol_version: PROTOCOL_VERSION,
            decision_id: "decision_process_001",
            challenge_id: challengeId,
            action: "approve",
            subject_id: "subject_process_001",
            delivery_target_id: "target_process_001",
            decided_at: new Date().toISOString(),
          };
        },
      },
      connectorAuthority: {
        verifyConnector({ connectorToken }) {
          if (connectorToken !== input.connectorToken) throw new Error("Unknown Connector token");
          return {
            type: CONNECTOR_IDENTITY_TYPE,
            protocol_version: PROTOCOL_VERSION,
            connector_id: "connector_process_001",
            subject_id: "subject_process_001",
            delivery_target_id: "target_process_001",
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
      leaseDurationMs: 2 * 60_000,
      maximumDeliveryAttempts: 3,
    });

    const handler = createCloudReceiverHttpHandler({ receiver });
    server = createServer((request, response) => {
      if (
        dropNextAcknowledgementResponse &&
        request.method === "POST" &&
        request.url === "/v0.1/delivery-acknowledgements"
      ) {
        dropNextAcknowledgementResponse = false;
        response.end = function dropResponse() {
          this.destroy();
          return this;
        };
      }
      handler(request, response);
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(input.port, "127.0.0.1", resolve);
    });
    return {
      pid: process.pid,
      port: server.address().port,
      sqliteLoaded: process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite")),
    };
  },

  enroll({ manifest }) {
    return receiver.createConsentChallenge({
      manifest,
      expectedOrigin: configuration.hostOrigin,
    });
  },

  approve({ challengeId }) {
    return receiver.decideConsent({
      challengeId,
      decisionToken: configuration.decisionToken,
    });
  },

  authorizeEffect({ effectToken, attestation }) {
    effects.set(effectToken, attestation);
    return { authorized: true };
  },

  inspectDelivery({ eventId }) {
    return store.getDeliveryByEventId(eventId) ?? null;
  },

  dropNextAcknowledgementResponse() {
    dropNextAcknowledgementResponse = true;
    return { armed: true };
  },

  async stop() {
    await closeReceiver();
    return { stopped: true };
  },
});

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

function fixtureError(code) {
  return Object.assign(new Error(code), { code });
}
