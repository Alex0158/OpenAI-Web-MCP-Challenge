import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import { createHostSdk, HostSdkTransportError } from "../src/server.mjs";
import {
  verifyContinuationEventEnvelope,
  validateReentryManifest,
} from "../../../reentry-core/src/protocol.mjs";

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
