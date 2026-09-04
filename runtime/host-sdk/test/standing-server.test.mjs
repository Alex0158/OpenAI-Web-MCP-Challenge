import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  createStandingContinuationAcceptance,
  createStandingPublicBinding,
} from "@webmcp-challenge/reentry-core/standing-protocol";
import { createStandingHostSdk, STANDING_HOST_SDK_CONTROL_ROUTES } from "../src/standing-server.mjs";

const origin = "https://game.example.test";
const receiver = "https://receiver.example.test";
const now = new Date("2026-09-04T12:00:00.000Z");
const keys = generateKeyPairSync("ed25519");

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sdkWith(fetchImpl) {
  return createStandingHostSdk({
    origin,
    privateKey: keys.privateKey,
    keyId: "game-key",
    receiverOrigin: receiver,
    organizationApiKey: "org-secret",
    clock: () => now,
    fetchImpl,
  });
}

test("standing Host SDK uses exact v0.2 control and Event routes", async () => {
  const calls = [];
  const sdk = sdkWith(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith(STANDING_HOST_SDK_CONTROL_ROUTES.hostKeyRegistration)) {
      return response({
        type: "webmcp.reentry_host_key",
        protocol_version: "0.2",
        host_id: "game-host",
        issuer_origin: origin,
        key_id: "game-key",
        status: "active",
        duplicate: false,
      }, 201);
    }
    if (url.endsWith(STANDING_HOST_SDK_CONTROL_ROUTES.consentSession)) {
      return response({
        type: "webmcp.reentry_consent_session",
        protocol_version: "0.2",
        consent_session_id: "consent-1",
        challenge: { challenge_id: "challenge-1" },
        consent_url: `${receiver}/consent?token=${"A".repeat(43)}`,
        expires_at: "2026-09-04T12:05:00.000Z",
        duplicate: false,
      }, 201);
    }
    if (url.includes(`${STANDING_HOST_SDK_CONTROL_ROUTES.consentSession}/consent-1`)) {
      return response({
        type: "webmcp.reentry_consent_status",
        protocol_version: "0.2",
        consent_session_id: "consent-1",
        challenge_id: "challenge-1",
        status: "approved",
        effective_status: "active",
        expires_at: "2026-09-04T12:05:00.000Z",
        binding: createStandingPublicBinding({
          type: "webmcp.reentry_binding",
          protocol_version: "0.2",
          binding_id: "binding-1",
          correlation_id: "correlation-1",
          workflow_id: "workflow-1",
          event_type: "CargoLostToMonster",
          expires_at: "2026-09-04T12:05:00.000Z",
          authorization_mode: "standing",
          max_active_activations: 1,
          last_event_sequence: 0,
          status: "active",
        }),
      });
    }
    if (url.endsWith("/v0.2/events")) {
      return response(createStandingContinuationAcceptance({
        type: "webmcp.continuation_acceptance",
        protocol_version: "0.2",
        event_id: "event-1",
        correlation_id: "correlation-1",
        accepted: true,
        duplicate: false,
        status: "accepted",
      }), 202);
    }
    throw new Error(`unexpected route ${url}`);
  });

  const key = await sdk.registerHostKey({ hostId: "game-host" });
  assert.equal(key.protocol_version, "0.2");
  const manifest = sdk.createManifest({
    manifestId: "manifest-1",
    correlationId: "correlation-1",
    issuedAt: now.toISOString(),
    offerExpiresAt: "2026-09-04T12:05:00.000Z",
    workflow: { id: "workflow-1", type: "game", stateVersion: 7, canonicalUrl: `${origin}/game` },
    display: { title: "Cargo loss", reason: "Read the current shelter state" },
    grantRequest: { eventType: "CargoLostToMonster", grantExpiresAt: "2026-09-04T12:10:00.000Z", humanBoundary: "human_review" },
  });
  const session = await sdk.createConsentSession({ hostSubjectRef: "player-1", manifest, maximumGrantLifetimeMs: 300_000 });
  assert.equal(session.consent_session_id, "consent-1");
  const status = await sdk.getConsentSession({ consentSessionId: session.consent_session_id });
  assert.equal(status.binding.binding_id, "binding-1");
  const acceptance = await sdk.sendEvent({
    binding: status.binding,
    workflow: { id: "workflow-1", stateVersion: 8, canonicalUrl: `${origin}/game` },
    eventId: "event-1",
    eventSequence: 1,
    occurredAt: now.toISOString(),
  });
  assert.equal(acceptance.event_id, "event-1");
  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), [
    "/v0.2/host-keys",
    "/v0.2/consent-sessions",
    "/v0.2/consent-sessions/consent-1",
    "/v0.2/events",
  ]);
  assert.equal(JSON.parse(calls[0].options.body).public_key_pem.includes("PRIVATE KEY"), false);
  assert.equal(calls[3].options.body.includes("org-secret"), false);
});

test("standing Host SDK rejects a malformed control response", async () => {
  const sdk = sdkWith(async () => response({ nope: true }, 200));
  await assert.rejects(
    sdk.registerHostKey({ hostId: "game-host" }),
    (error) => error?.code === "host_sdk_response_invalid",
  );
});
