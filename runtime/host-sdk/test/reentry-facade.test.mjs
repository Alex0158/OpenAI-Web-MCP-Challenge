import assert from "node:assert/strict";
import { createHash, generateKeyPairSync } from "node:crypto";
import test from "node:test";

import {
  createHostSdk,
  createReentry,
  HostSdkTransportError,
} from "../src/server.mjs";
import {
  verifyContinuationEventEnvelope,
  validateReentryManifest,
} from "../../../reentry-core/src/protocol.mjs";

const HOST_ORIGIN = "https://host.example";
const RECEIVER_ORIGIN = "https://receiver.example";
const SUBJECT = "user_001";
const PROMPT = "Review the completed report and prepare the next safe step.";
const WORKFLOW_URL = `${HOST_ORIGIN}/reports/123`;
const NOW = new Date("2026-08-31T12:00:00.000Z");
const OFFER_EXPIRES_AT = "2026-08-31T12:05:00.000Z";
const GRANT_EXPIRES_AT = "2026-08-31T12:30:00.000Z";
const CONSENT_SESSION_ID = "consent_session_001";
const CONSENT_TOKEN = Buffer.alloc(32, 7).toString("base64url");

test("createReentry completes request, confirm, and trigger with the strict signed contracts", async () => {
  const harness = createHarness();
  const reentry = harness.reentry;

  const request = await reentry.request({
    subject: SUBJECT,
    prompt: PROMPT,
    url: WORKFLOW_URL,
  });

  assert.deepEqual(Object.keys(request).sort(), ["consentSessionId", "consentUrl", "handle"]);
  assert.equal(request.consentSessionId, CONSENT_SESSION_ID);
  assert.equal(request.consentUrl, `${RECEIVER_ORIGIN}/consent?token=${CONSENT_TOKEN}`);
  assert.deepEqual(Object.keys(request.handle).sort(), ["consentSessionId", "workflow"]);
  assert.equal(request.handle.consentSessionId, CONSENT_SESSION_ID);
  assert.equal(request.handle.workflow.id, "workflow_001");
  assert.equal(JSON.stringify(request.handle).includes(SUBJECT), false);
  assert.equal(JSON.stringify(request.handle).includes(PROMPT), false);

  assert.deepEqual(harness.requests.map((entry) => entry.path), [
    "/v0.1/host-keys",
    "/v0.1/consent-sessions",
  ]);
  const registrationRequest = harness.requests[0];
  assert.equal(registrationRequest.options.headers.Authorization, "Bearer org-key-001");
  assert.deepEqual(JSON.parse(registrationRequest.options.body), {
    host_id: expectedHostId(),
    issuer_origin: HOST_ORIGIN,
    key_id: "host_key_001",
    public_key_pem: harness.keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
  });
  assert.equal(registrationRequest.options.body.includes("PRIVATE KEY"), false);

  const consentRequest = harness.requests.find((entry) => entry.path === "/v0.1/consent-sessions");
  assert.ok(consentRequest);
  assert.equal(consentRequest.options.headers.Authorization, "Bearer org-key-001");
  const consentBody = JSON.parse(consentRequest.options.body);
  assert.deepEqual(Object.keys(consentBody).sort(), ["expected_origin", "host_subject_ref", "manifest"]);
  assert.equal(consentBody.host_subject_ref, SUBJECT);
  assert.equal(consentBody.expected_origin, HOST_ORIGIN);
  assert.deepEqual(Object.keys(consentBody.manifest).sort(), [
    "correlation_id",
    "display",
    "grant_request",
    "issued_at",
    "issuer_origin",
    "manifest_id",
    "offer_expires_at",
    "protocol_version",
    "signature",
    "type",
    "workflow",
  ]);
  assert.equal(consentBody.manifest.type, "webmcp.reentry_manifest");
  assert.equal(consentBody.manifest.protocol_version, "0.1");
  assert.equal(consentBody.manifest.issuer_origin, HOST_ORIGIN);
  assert.equal(consentBody.manifest.issued_at, NOW.toISOString());
  assert.equal(consentBody.manifest.offer_expires_at, OFFER_EXPIRES_AT);
  assert.deepEqual(consentBody.manifest.display, {
    title: "Review the completed report and prepare the next safe step",
    reason: PROMPT,
  });
  assert.deepEqual(consentBody.manifest.workflow, {
    id: request.handle.workflow.id,
    type: "domain-neutral-workflow",
    state_version: 0,
    canonical_url: WORKFLOW_URL,
  });
  assert.deepEqual(consentBody.manifest.grant_request, {
    event_type: "workflow.ready",
    grant_expires_at: GRANT_EXPIRES_AT,
    human_boundary: "explicit_receiver_consent",
    max_runs: 1,
  });
  assert.equal(JSON.stringify(consentBody).includes("org-key-001"), false);

  validateReentryManifest(consentBody.manifest, {
    now: NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => harness.keys.publicKey,
  });

  let callbackValue;
  const continuation = await reentry.confirm(
    JSON.parse(JSON.stringify(request.handle)),
    {
      async onApproved(value) {
        callbackValue = value;
      },
    },
  );
  assert.strictEqual(callbackValue, continuation);
  assert.deepEqual(Object.keys(continuation).sort(), ["binding", "workflow"]);
  assert.deepEqual(continuation.workflow, request.handle.workflow);
  assert.equal(continuation.binding.status, "active");
  assert.equal(continuation.binding.runs_remaining, 1);
  assert.equal(JSON.stringify(continuation).includes(SUBJECT), false);
  assert.equal(JSON.stringify(continuation).includes(PROMPT), false);
  assert.equal(JSON.stringify(continuation).includes("org-key-001"), false);

  const acceptance = await reentry.trigger(continuation);
  assert.deepEqual(acceptance, {
    type: "webmcp.continuation_acceptance",
    protocol_version: "0.1",
    event_id: "event_001",
    correlation_id: "correlation_001",
    accepted: true,
    duplicate: false,
    status: "accepted",
  });

  const eventRequest = harness.requests.find((entry) => entry.path === "/v0.1/events");
  assert.ok(eventRequest);
  assert.equal(eventRequest.options.headers.Authorization, undefined);
  assert.equal(eventRequest.options.credentials, "omit");
  const envelope = JSON.parse(eventRequest.options.body);
  const event = JSON.parse(envelope.body);
  assert.deepEqual(Object.keys(event).sort(), [
    "binding_id",
    "canonical_url",
    "correlation_id",
    "event_id",
    "event_sequence",
    "event_type",
    "issuer_origin",
    "occurred_at",
    "protocol_version",
    "state_version",
    "type",
    "workflow_id",
  ]);
  assert.deepEqual(event, {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: "event_001",
    correlation_id: "correlation_001",
    binding_id: "binding_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: continuation.workflow.id,
    event_type: "workflow.ready",
    event_sequence: 1,
    state_version: 0,
    occurred_at: NOW.toISOString(),
    canonical_url: WORKFLOW_URL,
  });
  assert.deepEqual(Object.keys(envelope.headers).sort(), [
    "WebMCP-Reentry-Key-Id",
    "WebMCP-Reentry-Signature",
    "WebMCP-Reentry-Timestamp",
  ]);
  assert.equal(envelope.headers["WebMCP-Reentry-Timestamp"], "1788177600");
  assert.equal(
    verifyContinuationEventEnvelope(envelope, {
      now: NOW,
      expectedOrigin: HOST_ORIGIN,
      keyResolver: () => harness.keys.publicKey,
    }).event_id,
    "event_001",
  );
  assert.equal(envelope.body.includes(PROMPT), false);
  assert.equal(envelope.body.includes(SUBJECT), false);
});

test("createReentry rejects invalid subject, prompt, URL, and unsupported request fields before network I/O", async () => {
  const harness = createHarness();
  const valid = { subject: SUBJECT, prompt: PROMPT, url: WORKFLOW_URL };

  await assert.rejects(
    () => harness.reentry.request({ ...valid, subject: "user with spaces" }),
    /Re-entry subject is invalid/,
  );
  await assert.rejects(
    () => harness.reentry.request({ ...valid, prompt: "🙂".repeat(126) }),
    /Re-entry prompt is invalid/,
  );
  await assert.rejects(
    () => harness.reentry.request({ ...valid, prompt: "Review\u0000this" }),
    /Re-entry prompt is invalid/,
  );
  await assert.rejects(
    () => harness.reentry.request({ ...valid, url: "https://other.example/reports/123" }),
    /Re-entry URL is invalid/,
  );
  await assert.rejects(
    () => harness.reentry.request({ ...valid, url: `${WORKFLOW_URL}#unsafe` }),
    /Re-entry URL is invalid/,
  );
  await assert.rejects(
    () => harness.reentry.request({ ...valid, extra: "not allowed" }),
    /Re-entry request contains an unsupported field/,
  );
  assert.equal(harness.requests.length, 0);
});

test("serialized handles and continuations remain origin-bound after round-trip", async () => {
  const harness = createHarness();
  const request = await harness.reentry.request({ subject: SUBJECT, prompt: PROMPT, url: WORKFLOW_URL });
  const differentOriginHandle = JSON.parse(JSON.stringify(request.handle));
  differentOriginHandle.workflow.canonicalUrl = "https://other.example/reports/123";

  await assert.rejects(
    () => harness.reentry.confirm(differentOriginHandle),
    /Re-entry URL is invalid/,
  );

  const continuation = await harness.reentry.confirm(request.handle);
  const differentOriginContinuation = JSON.parse(JSON.stringify(continuation));
  differentOriginContinuation.workflow.canonicalUrl = "https://other.example/reports/123";
  await assert.rejects(
    () => harness.reentry.trigger(differentOriginContinuation),
    /Re-entry URL is invalid/,
  );
});

test("registration failure stops request before consent-session creation", async () => {
  const harness = createHarness({ registrationFailure: true });

  await assert.rejects(
    () => harness.reentry.request({ subject: SUBJECT, prompt: PROMPT, url: WORKFLOW_URL }),
    (error) => {
      assert.ok(error instanceof HostSdkTransportError);
      assert.equal(error.code, "host_registration_failed");
      assert.equal(error.statusCode, 503);
      return true;
    },
  );
  assert.deepEqual(harness.requests.map((entry) => entry.path), ["/v0.1/host-keys"]);
});

test("pending and declined confirmation returns visible status without invoking the save callback", async () => {
  for (const status of ["pending", "declined"]) {
    const harness = createHarness({ consentStatus: status });
    const request = await harness.reentry.request({
      subject: SUBJECT,
      prompt: PROMPT,
      url: WORKFLOW_URL,
    });
    let callbackCalls = 0;

    const result = await harness.reentry.confirm(request.handle, {
      onApproved: async () => {
        callbackCalls += 1;
      },
    });

    assert.deepEqual(result, { status });
    assert.equal(callbackCalls, 0);
  }
});

test("trigger delegates one-time enforcement to Receiver binding status", async () => {
  const harness = createHarness({ secondEventStatus: 409 });
  const request = await harness.reentry.request({
    subject: SUBJECT,
    prompt: PROMPT,
    url: WORKFLOW_URL,
  });
  const continuation = await harness.reentry.confirm(request.handle);

  await harness.reentry.trigger(continuation);
  await assert.rejects(
    () => harness.reentry.trigger(continuation),
    (error) => {
      assert.ok(error instanceof HostSdkTransportError);
      assert.equal(error.code, "grant_exhausted");
      assert.equal(error.statusCode, 409);
      return true;
    },
  );
  assert.equal(harness.requests.filter((entry) => entry.path === "/v0.1/events").length, 2);
});

test("legacy createHostSdk remains available alongside the high-level facade", () => {
  const keys = generateKeyPairSync("ed25519");
  const sdk = createHostSdk({
    origin: HOST_ORIGIN,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId: "host_key_legacy",
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}_legacy`,
    fetchImpl: () => {
      throw new Error("legacy manifest creation must not call fetch");
    },
  });

  const manifest = sdk.createManifest({
    offerExpiresAt: OFFER_EXPIRES_AT,
    workflow: {
      id: "workflow_legacy",
      type: "review",
      stateVersion: 1,
      canonicalUrl: `${HOST_ORIGIN}/legacy`,
    },
    display: { title: "Continue", reason: "A later step is ready." },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: GRANT_EXPIRES_AT,
      humanBoundary: "explicit_receiver_consent",
    },
  });

  assert.equal(manifest.workflow.id, "workflow_legacy");
  assert.equal(typeof sdk.sendEvent, "function");
});

function createHarness({ consentStatus = "approved", secondEventStatus = 202, registrationFailure = false } = {}) {
  const keys = generateKeyPairSync("ed25519");
  const requests = [];
  let eventCalls = 0;
  const reentry = createReentry({
    origin: HOST_ORIGIN,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId: "host_key_001",
    organizationApiKey: "org-key-001",
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}_001`,
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url);
      const entry = {
        path: parsed.pathname,
        url,
        options: { ...options, headers: { ...(options.headers ?? {}) } },
      };
      requests.push(entry);

      if (parsed.pathname === "/v0.1/host-keys" && options.method === "POST") {
        if (registrationFailure) {
          return new Response(JSON.stringify({ error: { code: "host_registration_failed" } }), {
            status: 503,
          });
        }
        const duplicate = requests.filter((candidate) => candidate.path === "/v0.1/host-keys").length > 1;
        return new Response(JSON.stringify({
          type: "webmcp.reentry_host_key",
          protocol_version: "0.1",
          host_id: expectedHostId(),
          issuer_origin: HOST_ORIGIN,
          key_id: "host_key_001",
          status: "active",
          duplicate,
        }), { status: duplicate ? 200 : 201 });
      }

      if (parsed.pathname === "/v0.1/consent-sessions" && options.method === "POST") {
        return new Response(JSON.stringify({
          type: "webmcp.reentry_consent_session",
          protocol_version: "0.1",
          consent_session_id: CONSENT_SESSION_ID,
          consent_url: `${RECEIVER_ORIGIN}/consent?token=${CONSENT_TOKEN}`,
          duplicate: false,
        }), { status: 201 });
      }

      if (parsed.pathname === `/v0.1/consent-sessions/${CONSENT_SESSION_ID}` && options.method === "GET") {
        const manifest = JSON.parse(
          requests.find((candidate) => candidate.path === "/v0.1/consent-sessions")?.options.body,
        ).manifest;
        const binding = consentStatus === "approved"
          ? {
            type: "webmcp.reentry_binding",
            protocol_version: "0.1",
            binding_id: "binding_001",
            correlation_id: manifest.correlation_id,
            workflow_id: manifest.workflow.id,
            event_type: "workflow.ready",
            expires_at: GRANT_EXPIRES_AT,
            runs_remaining: 1,
            status: "active",
          }
          : null;
        return new Response(JSON.stringify({
          type: "webmcp.reentry_consent_status",
          protocol_version: "0.1",
          consent_session_id: CONSENT_SESSION_ID,
          challenge_id: "challenge_001",
          status: consentStatus,
          effective_status: consentStatus === "approved" ? "active" : null,
          expires_at: GRANT_EXPIRES_AT,
          binding,
        }), { status: 200 });
      }

      if (parsed.pathname === "/v0.1/events" && options.method === "POST") {
        eventCalls += 1;
        if (eventCalls > 1 && secondEventStatus !== 202) {
          return new Response(JSON.stringify({ error: { code: "grant_exhausted" } }), {
            status: secondEventStatus,
          });
        }
        const envelope = JSON.parse(options.body);
        const event = JSON.parse(envelope.body);
        return new Response(JSON.stringify({
          type: "webmcp.continuation_acceptance",
          protocol_version: "0.1",
          event_id: event.event_id,
          correlation_id: event.correlation_id,
          accepted: true,
          duplicate: false,
          status: "accepted",
        }), { status: 202 });
      }

      throw new Error(`Unexpected test route ${options.method ?? "GET"} ${parsed.pathname}`);
    },
  });

  return { keys, reentry, requests };
}

function expectedHostId() {
  return `host_${createHash("sha256").update(`${HOST_ORIGIN}\nhost_key_001`).digest("hex")}`;
}
