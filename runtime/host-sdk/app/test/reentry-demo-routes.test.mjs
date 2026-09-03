import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import { POST as createConsent } from "../app/api/reentry/consent/route.js";
import { POST as confirmConsent } from "../app/api/reentry/consent/status/route.js";
import { POST as sendEvent } from "../app/api/reentry/event/route.js";

const HOST_ORIGIN = "https://host.example";
const RECEIVER_ORIGIN = "https://receiver.example";
const ORGANIZATION_API_KEY = "org-key-demo-001";
const SESSION_ID = "consent_session_demo_001";
const CONSENT_TOKEN = "A".repeat(43);

test("demo routes use createReentry and keep the handle and continuation server-side", async () => {
  const harness = installHarness({ status: "approved" });

  const consentResponse = await createConsent(requestWithJson({}));
  assert.equal(consentResponse.status, 201);
  const consent = await consentResponse.json();
  assert.deepEqual(Object.keys(consent).sort(), [
    "consent_session_id",
    "consent_url",
    "reason",
    "title",
  ]);
  assert.equal(consent.consent_session_id, SESSION_ID);
  assert.equal(consent.consent_url, `${RECEIVER_ORIGIN}/consent?token=${CONSENT_TOKEN}`);
  assert.equal(JSON.stringify(consent).includes(ORGANIZATION_API_KEY), false);
  assert.equal(JSON.stringify(consent).includes("PRIVATE KEY"), false);

  assert.deepEqual(harness.calls.map((call) => `${call.method} ${call.path}`), [
    "POST /v0.1/host-keys",
    "POST /v0.1/consent-sessions",
  ]);
  const consentBody = JSON.parse(harness.calls[1].options.body);
  assert.equal(consentBody.host_subject_ref, "sdk_demo_user");
  assert.equal(consentBody.expected_origin, HOST_ORIGIN);
  assert.equal(consentBody.manifest.workflow.type, "domain-neutral-workflow");
  assert.equal(consentBody.manifest.workflow.state_version, 0);
  assert.equal(consentBody.manifest.workflow.canonical_url, `${HOST_ORIGIN}/`);
  assert.equal(consentBody.manifest.grant_request.event_type, "workflow.ready");
  assert.equal(consentBody.manifest.grant_request.max_runs, 1);
  assert.equal(consentBody.manifest.grant_request.human_boundary, "explicit_receiver_consent");
  assert.equal(JSON.stringify(consentBody).includes(ORGANIZATION_API_KEY), false);

  const statusResponse = await confirmConsent(requestWithJson({
    consent_session_id: SESSION_ID,
  }));
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), {
    status: "approved",
    continuation_id: SESSION_ID,
  });

  const eventResponse = await sendEvent(requestWithJson({ continuation_id: SESSION_ID }));
  assert.equal(eventResponse.status, 202);
  const eventAcceptance = await eventResponse.json();
  assert.deepEqual(Object.keys(eventAcceptance).sort(), ["accepted", "event_id", "status"]);
  assert.equal(eventAcceptance.accepted, true);
  assert.equal(eventAcceptance.status, "accepted");

  const eventCall = harness.calls.find((call) => call.path === "/v0.1/events");
  assert.ok(eventCall);
  assert.equal(eventCall.options.headers.Authorization, undefined);
  assert.equal(eventCall.options.body.includes(ORGANIZATION_API_KEY), false);
  assert.equal(eventCall.options.body.includes("sdk_demo_user"), false);
  assert.equal(eventCall.options.body.includes("Approve one future continuation"), false);
  const envelope = JSON.parse(eventCall.options.body);
  const event = JSON.parse(envelope.body);
  assert.equal(event.type, "webmcp.continuation_event");
  assert.equal(event.event_type, "workflow.ready");
  assert.equal(event.event_sequence, 1);
  assert.equal(event.workflow_id, consentBody.manifest.workflow.id);
  assert.equal(event.canonical_url, `${HOST_ORIGIN}/`);
});

test("demo status route does not persist a continuation before approval", async () => {
  const harness = installHarness({ status: "pending", sessionId: "consent_session_pending_001" });
  const sessionId = "consent_session_pending_001";

  const consentResponse = await createConsent(requestWithJson({}));
  assert.equal(consentResponse.status, 201);
  const statusResponse = await confirmConsent(requestWithJson({
    consent_session_id: sessionId,
  }));
  assert.deepEqual(await statusResponse.json(), { status: "pending" });

  const eventResponse = await sendEvent(requestWithJson({ continuation_id: sessionId }));
  assert.equal(eventResponse.status, 404);
  assert.deepEqual(await eventResponse.json(), {
    error: { code: "sdk_demo_continuation_not_found" },
  });
  assert.equal(harness.calls.some((call) => call.path === "/v0.1/events"), false);
});

test("demo consent route does not accept browser-supplied identity or workflow fields", async () => {
  const harness = installHarness({ status: "approved", sessionId: "consent_session_rejected_001" });
  const response = await createConsent(requestWithJson({
    subject: "browser-controlled-subject",
    prompt: "browser-controlled-prompt",
    url: `${HOST_ORIGIN}/browser-controlled-url`,
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: { code: "sdk_demo_request_invalid" } });
  assert.equal(harness.calls.length, 0);
});

function installHarness({ status, sessionId = SESSION_ID }) {
  const keys = generateKeyPairSync("ed25519");
  process.env.HOST_ORIGIN = HOST_ORIGIN;
  process.env.RECEIVER_ORIGIN = RECEIVER_ORIGIN;
  process.env.REENTRY_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.REENTRY_KEY_ID = "host_key_demo_001";
  process.env.REENTRY_ORGANIZATION_API_KEY = ORGANIZATION_API_KEY;

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const call = {
      method: options.method ?? "GET",
      path: parsed.pathname,
      options: { ...options, headers: { ...(options.headers ?? {}) } },
    };
    calls.push(call);

    if (parsed.pathname === "/v0.1/host-keys") {
      return jsonResponse({
        type: "webmcp.reentry_host_key",
        protocol_version: "0.1",
        host_id: JSON.parse(options.body).host_id,
        issuer_origin: HOST_ORIGIN,
        key_id: "host_key_demo_001",
        status: "active",
        duplicate: false,
      }, 201);
    }
    if (parsed.pathname === "/v0.1/consent-sessions") {
      return jsonResponse({
        type: "webmcp.reentry_consent_session",
        protocol_version: "0.1",
        consent_session_id: sessionId,
        consent_url: `${RECEIVER_ORIGIN}/consent?token=${CONSENT_TOKEN}`,
        duplicate: false,
      }, 201);
    }
    if (parsed.pathname === `/v0.1/consent-sessions/${sessionId}`) {
      const manifest = JSON.parse(calls[1].options.body).manifest;
      return jsonResponse({
        type: "webmcp.reentry_consent_status",
        protocol_version: "0.1",
        consent_session_id: sessionId,
        challenge_id: "challenge_demo_001",
        status,
        effective_status: status === "approved" ? "active" : null,
        expires_at: "2099-01-01T00:00:00.000Z",
        binding: status === "approved"
          ? {
            type: "webmcp.reentry_binding",
            protocol_version: "0.1",
            binding_id: "binding_demo_001",
            correlation_id: manifest.correlation_id,
            workflow_id: manifest.workflow.id,
            event_type: "workflow.ready",
            expires_at: "2099-01-01T00:00:00.000Z",
            runs_remaining: 1,
            status: "active",
          }
          : null,
      }, 200);
    }
    if (parsed.pathname === "/v0.1/events") {
      const envelope = JSON.parse(options.body);
      const event = JSON.parse(envelope.body);
      return jsonResponse({
        type: "webmcp.continuation_acceptance",
        protocol_version: "0.1",
        event_id: event.event_id,
        correlation_id: event.correlation_id,
        accepted: true,
        duplicate: false,
        status: "accepted",
      }, 202);
    }
    throw new Error(`Unexpected demo route ${options.method ?? "GET"} ${parsed.pathname}`);
  };
  return { calls };
}

function requestWithJson(value) {
  return new Request("https://host.example/api/reentry/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

function jsonResponse(value, status) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
