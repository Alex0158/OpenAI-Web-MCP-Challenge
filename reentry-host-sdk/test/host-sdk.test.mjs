import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  createHostSdk,
  HOST_SDK_CONTROL_ROUTES,
  HostSdkTransportError,
} from "../src/server.mjs";
import {
  verifyContinuationEventEnvelope,
  validateReentryManifest,
} from "../../reentry-core/src/protocol.mjs";

const HOST_ORIGIN = "https://host.example";
const RECEIVER_ORIGIN = "https://receiver.example";
const NOW = new Date("2026-08-31T12:00:00.000Z");

function createSdk(fetchImpl) {
  const keys = generateKeyPairSync("ed25519");
  const sdk = createHostSdk({
    origin: HOST_ORIGIN,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId: "host_key_001",
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}_001`,
    fetchImpl,
  });
  return { keys, sdk };
}

test("server SDK creates a signed Manifest without sending it", () => {
  const { keys, sdk } = createSdk(() => {
    throw new Error("Manifest creation must not call fetch");
  });
  const manifest = sdk.createManifest({
    offerExpiresAt: "2026-08-31T12:05:00.000Z",
    workflow: {
      id: "workflow_001",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
    display: {
      title: "Continue this workflow",
      reason: "A later step is ready.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: "2026-08-31T12:30:00.000Z",
      humanBoundary: "explicit_receiver_consent",
    },
  });

  assert.deepEqual(validateReentryManifest(manifest, {
    now: NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => keys.publicKey,
  }), manifest);
});

test("server SDK signs and sends one Event through the existing Receiver route", async () => {
  let request;
  const { keys, sdk } = createSdk(async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: "event_001",
      correlation_id: "correlation_001",
      accepted: true,
      duplicate: false,
      status: "accepted",
    }), { status: 202 });
  });

  const acceptance = await sdk.sendEvent({
    binding: {
      type: "webmcp.reentry_binding",
      protocol_version: "0.1",
      binding_id: "binding_001",
      correlation_id: "correlation_001",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      expires_at: "2026-08-31T12:30:00.000Z",
      runs_remaining: 1,
      status: "active",
    },
    eventId: "event_001",
    deliveryTimestamp: "1788177600",
    workflow: {
      id: "workflow_001",
      stateVersion: 2,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
  });

  assert.equal(acceptance.accepted, true);
  assert.equal(request.url, `${RECEIVER_ORIGIN}/v0.1/events`);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.redirect, "manual");
  assert.equal(request.options.credentials, "omit");

  const envelope = JSON.parse(request.options.body);
  assert.deepEqual(verifyContinuationEventEnvelope(envelope, {
    now: NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => keys.publicKey,
  }).event_id, "event_001");
});

test("server SDK exposes bounded Receiver rejection without leaking response detail", async () => {
  const { sdk } = createSdk(async () => new Response(
    JSON.stringify({ error: { code: "event_scope_invalid", detail: "private detail" } }),
    { status: 403 },
  ));

  await assert.rejects(
    () => sdk.sendEvent(eventInput()),
    (error) => {
      assert.ok(error instanceof HostSdkTransportError);
      assert.equal(error.code, "event_scope_invalid");
      assert.equal(error.statusCode, 403);
      assert.equal(error.message.includes("private detail"), false);
      return true;
    },
  );
});

test("server SDK sends Host-key and consent control requests with server-only organization auth", async () => {
  const keys = generateKeyPairSync("ed25519");
  const requests = [];
  const consentToken = Buffer.alloc(32, 3).toString("base64url");
  const sdk = createHostSdk({
    origin: HOST_ORIGIN,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId: "host_key_control_001",
    organizationApiKey: "org-api-key-001",
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}_control_001`,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith(HOST_SDK_CONTROL_ROUTES.hostKeyRegistration)) {
        return new Response(JSON.stringify({ status: "active", duplicate: false }), { status: 201 });
      }
      if (url.endsWith(HOST_SDK_CONTROL_ROUTES.consentSession)) {
        return new Response(JSON.stringify({
          type: "webmcp.reentry_consent_session",
          consent_token: consentToken,
          challenge: { challenge_id: "challenge_control_001" },
        }), { status: 201 });
      }
      if (url.endsWith(`${HOST_SDK_CONTROL_ROUTES.consentSession}/consent_session_control_001`)) {
        return new Response(JSON.stringify({
          type: "webmcp.reentry_consent_status",
          consent_session_id: "consent_session_control_001",
          status: "approved",
          binding: { binding_id: "binding_control_001" },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        type: "webmcp.reentry_consent_decision",
        status: "approved",
      }), { status: 200 });
    },
  });
  const manifest = sdk.createManifest({
    offerExpiresAt: "2026-08-31T12:05:00.000Z",
    workflow: {
      id: "workflow_control_001",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_control_001`,
    },
    display: { title: "Continue", reason: "A later step is ready." },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: "2026-08-31T12:30:00.000Z",
      humanBoundary: "explicit_receiver_consent",
    },
  });

  await sdk.registerHostKey({ hostId: "host_control_001" });
  await sdk.createConsentSession({ manifest, hostSubjectRef: "host_user_control_001" });
  await sdk.decideConsent({
    challengeId: "challenge_control_001",
    hostSubjectRef: "host_user_control_001",
    action: "approve",
    consentToken,
  });
  const status = await sdk.getConsentSession({
    consentSessionId: "consent_session_control_001",
  });

  assert.equal(requests.length, 4);
  for (const request of requests.slice(0, 3)) {
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.credentials, "omit");
    assert.equal(request.options.redirect, "manual");
    assert.equal(request.options.headers.Authorization, "Bearer org-api-key-001");
  }
  const registration = JSON.parse(requests[0].options.body);
  assert.equal(registration.host_id, "host_control_001");
  assert.equal(registration.issuer_origin, HOST_ORIGIN);
  assert.equal(registration.key_id, "host_key_control_001");
  assert.equal(registration.public_key_pem, keys.publicKey.export({ type: "spki", format: "pem" }).toString());
  assert.equal(registration.public_key_pem.includes("PRIVATE KEY"), false);

  const session = JSON.parse(requests[1].options.body);
  assert.equal(session.host_subject_ref, "host_user_control_001");
  assert.equal(session.expected_origin, HOST_ORIGIN);
  assert.deepEqual(session.manifest, manifest);
  assert.deepEqual(JSON.parse(requests[2].options.body), {
    action: "approve",
    challenge_id: "challenge_control_001",
    consent_token: consentToken,
    host_subject_ref: "host_user_control_001",
  });
  assert.equal(requests[3].options.method, "GET");
  assert.equal(requests[3].options.headers.Authorization, "Bearer org-api-key-001");
  assert.equal(status.binding.binding_id, "binding_control_001");
});

test("server SDK requires an organization API key only when using Receiver control methods", async () => {
  const { sdk } = createSdk(() => {
    throw new Error("Control request must fail before fetch");
  });
  await assert.rejects(
    () => sdk.createConsentSession({ manifest: {}, hostSubjectRef: "host_user_001" }),
    /organizationApiKey is required/,
  );
});

function eventInput() {
  return {
    binding: {
      type: "webmcp.reentry_binding",
      protocol_version: "0.1",
      binding_id: "binding_001",
      correlation_id: "correlation_001",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      expires_at: "2026-08-31T12:30:00.000Z",
      runs_remaining: 1,
      status: "active",
    },
    workflow: {
      id: "workflow_001",
      stateVersion: 2,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
  };
}
