import { generateKeyPairSync } from "node:crypto";

import { ReentryHostSdk } from "../src/host-sdk.mjs";
import { serveProfileProcess } from "./process-rpc.mjs";

const HOST_ORIGIN = "https://host.conformance.example";
const HOST_KEY_ID = "host_conformance_key_001";
const CANONICAL_URL = `${HOST_ORIGIN}/workflows/workflow_conformance_001`;
const EFFECT_TOKEN = "effect_conformance_fixture_token";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const host = new ReentryHostSdk({
  origin: HOST_ORIGIN,
  privateKey,
  keyId: HOST_KEY_ID,
});

let eventEnvelope;

serveProfileProcess({
  initialize() {
    return {
      pid: process.pid,
      origin: HOST_ORIGIN,
      keyId: HOST_KEY_ID,
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      sqliteLoaded: sqliteLoaded(),
    };
  },

  issueManifest() {
    const now = new Date();
    return host.issueManifest({
      manifestId: "manifest_conformance_001",
      correlationId: "correlation_conformance_001",
      issuedAt: now.toISOString(),
      offerExpiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
      workflow: {
        id: "workflow_conformance_001",
        type: "domain-neutral-workflow",
        stateVersion: 1,
        canonicalUrl: CANONICAL_URL,
      },
      display: {
        title: "Continue the domain-neutral workflow",
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
    const origin = requireLoopbackOrigin(receiverOrigin);
    if (!replay) {
      const now = new Date();
      eventEnvelope = host.issueEvent({
        binding,
        eventId: "event_conformance_001",
        occurredAt: now.toISOString(),
        deliveryTimestamp: String(Math.floor(now.getTime() / 1_000)),
        workflow: {
          id: "workflow_conformance_001",
          stateVersion: 2,
          canonicalUrl: CANONICAL_URL,
        },
      });
    }
    if (!eventEnvelope) throw profileError("profile_event_missing");

    const response = await fetch(`${origin}/v0.1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: eventEnvelope.body, headers: eventEnvelope.headers }),
      redirect: "manual",
      signal: AbortSignal.timeout(2_000),
    });
    const responseBody = JSON.parse(await response.text());
    return {
      status: response.status,
      response: responseBody,
      eventId: JSON.parse(eventEnvelope.body).event_id,
    };
  },

  createEffect(input) {
    const context = requireEffectContext(input);
    return {
      effectToken: EFFECT_TOKEN,
      attestation: {
        type: "webmcp.host_effect_attestation",
        protocol_version: "0.1",
        effect_id: "effect_conformance_001",
        delivery_id: context.deliveryId,
        event_id: context.eventId,
        correlation_id: context.correlationId,
        workflow_id: context.workflowId,
        outcome: "effect_applied_awaiting_human",
        confirmed_at: new Date().toISOString(),
      },
    };
  },

  stop() {
    return { stopped: true };
  },
});

function requireLoopbackOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw profileError("profile_receiver_origin_invalid");
  }
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw profileError("profile_receiver_origin_invalid");
  }
  return url.origin;
}

function requireEffectContext(value) {
  const fields = ["correlationId", "deliveryId", "eventId", "workflowId"];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw profileError("profile_effect_context_invalid");
  }
  const actual = Object.keys(value).sort();
  if (actual.length !== fields.length || actual.some((key, index) => key !== fields[index])) {
    throw profileError("profile_effect_context_invalid");
  }
  for (const field of fields) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw profileError("profile_effect_context_invalid");
    }
  }
  return value;
}

function sqliteLoaded() {
  return process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite"));
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
