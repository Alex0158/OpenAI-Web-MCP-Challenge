import { generateKeyPairSync } from "node:crypto";

import { ReentryHostSdk } from "../../src/host-sdk.mjs";
import { serveChildRpc } from "./child-rpc.mjs";

const HOST_ORIGIN = "https://host.process.example";
const HOST_KEY_ID = "host_process_key_001";
const CANONICAL_URL = `${HOST_ORIGIN}/workflows/workflow_process_001`;
const EFFECT_TOKEN = "effect_process_fixture_token";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const host = new ReentryHostSdk({
  origin: HOST_ORIGIN,
  privateKey,
  keyId: HOST_KEY_ID,
});

let eventEnvelope;

serveChildRpc({
  initialize() {
    return {
      pid: process.pid,
      origin: HOST_ORIGIN,
      keyId: HOST_KEY_ID,
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      sqliteLoaded: process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite")),
    };
  },

  issueManifest() {
    const now = new Date();
    return host.issueManifest({
      manifestId: "manifest_process_001",
      correlationId: "correlation_process_001",
      issuedAt: now.toISOString(),
      offerExpiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
      workflow: {
        id: "workflow_process_001",
        type: "domain-neutral-workflow",
        stateVersion: 1,
        canonicalUrl: CANONICAL_URL,
      },
      display: {
        title: "Continue the process-isolated workflow",
        reason: "The authoritative Host state changed while the Agent was away.",
      },
      grantRequest: {
        eventType: "workflow.ready",
        grantExpiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
        humanBoundary: "explicit_receiver_consent",
      },
    });
  },

  async sendEvent({ receiverOrigin, binding, replay = false }) {
    if (!replay) {
      const now = new Date();
      eventEnvelope = host.issueEvent({
        binding,
        eventId: "event_process_001",
        occurredAt: now.toISOString(),
        deliveryTimestamp: String(Math.floor(now.getTime() / 1_000)),
        workflow: {
          id: "workflow_process_001",
          stateVersion: 2,
          canonicalUrl: CANONICAL_URL,
        },
      });
    }
    if (!eventEnvelope) throw fixtureError("fixture_event_missing");

    const response = await fetch(`${receiverOrigin}/v0.1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: eventEnvelope.body, headers: eventEnvelope.headers }),
      redirect: "manual",
      signal: AbortSignal.timeout(2_000),
    });
    const responseBody = await response.text();
    return {
      status: response.status,
      response: JSON.parse(responseBody),
      eventId: JSON.parse(eventEnvelope.body).event_id,
    };
  },

  applyEffect({ lease }) {
    return {
      effectToken: EFFECT_TOKEN,
      attestation: {
        type: "webmcp.host_effect_attestation",
        protocol_version: "0.1",
        effect_id: "effect_process_001",
        delivery_id: lease.delivery_id,
        event_id: lease.event_id,
        correlation_id: lease.continuation.correlation_id,
        workflow_id: lease.continuation.workflow_id,
        outcome: "effect_applied_awaiting_human",
        confirmed_at: new Date().toISOString(),
      },
    };
  },

  stop() {
    return { stopped: true };
  },
});

function fixtureError(code) {
  return Object.assign(new Error(code), { code });
}
