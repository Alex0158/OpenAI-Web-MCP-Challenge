import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

import { POST as createConsent } from "../app/api/reentry/consent/route.js";
import { POST as confirmConsent } from "../app/api/reentry/consent/status/route.js";
import {
  getApprovedContinuation,
  TEST_PROMPT,
} from "../app/_lib/reentry-test.mjs";

const HOST_ORIGIN = "http://localhost:3000";
const RECEIVER_ORIGIN = "https://receiver.example";
const ORGANIZATION_API_KEY = "org-key-reentry-sdk-test";
const PRIVATE_KEY_MARKER = "PRIVATE KEY";

test("the test button path signs consent, confirms approval, and stores only an opaque continuation", async () => {
  const sessionId = "consent_session_test_001";
  const calls = installReceiverHarness({ sessionId, status: "approved" });

  const consentResponse = await createConsent(requestWithJson({}));
  assert.equal(consentResponse.status, 201);
  const consent = await consentResponse.json();
  assert.deepEqual(Object.keys(consent).sort(), [
    "consent_session_id",
    "consent_url",
    "reason",
    "title",
  ]);
  assert.equal(consent.consent_session_id, sessionId);
  assert.equal(consent.consent_url, `${RECEIVER_ORIGIN}/consent?token=${"A".repeat(43)}`);
  assert.equal(JSON.stringify(consent).includes(ORGANIZATION_API_KEY), false);
  assert.equal(JSON.stringify(consent).includes(PRIVATE_KEY_MARKER), false);

  const consentCall = calls.find((call) => call.path === "/v0.1/consent-sessions");
  assert.ok(consentCall);
  const manifest = JSON.parse(consentCall.options.body).manifest;
  assert.equal(manifest.workflow.canonical_url, `${HOST_ORIGIN}/`);
  assert.equal(manifest.grant_request.max_runs, 1);
  assert.equal(manifest.grant_request.event_type, "workflow.ready");
  assert.equal(manifest.display.reason, TEST_PROMPT);
  assert.equal(JSON.stringify(manifest).includes(ORGANIZATION_API_KEY), false);
  assert.equal(JSON.stringify(manifest).includes(PRIVATE_KEY_MARKER), false);

  const statusResponse = await confirmConsent(requestWithJson({
    consent_session_id: sessionId,
  }));
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), {
    status: "approved",
    continuation_id: sessionId,
  });

  const stored = getApprovedContinuation(sessionId);
  assert.equal(stored.binding.status, "active");
  assert.equal(stored.binding.runs_remaining, 1);
  assert.equal(stored.workflow.canonicalUrl, `${HOST_ORIGIN}/`);
  assert.equal(JSON.stringify(stored).includes(ORGANIZATION_API_KEY), false);
  assert.equal(calls.some((call) => call.path === "/v0.1/events"), false);
});

test("pending consent is visible and does not store a continuation", async () => {
  const sessionId = "consent_session_test_pending";
  installReceiverHarness({ sessionId, status: "pending" });

  const consentResponse = await createConsent(requestWithJson({}));
  assert.equal(consentResponse.status, 201);

  const statusResponse = await confirmConsent(requestWithJson({
    consent_session_id: sessionId,
  }));
  assert.deepEqual(await statusResponse.json(), { status: "pending" });
  assert.throws(() => getApprovedContinuation(sessionId), /reentry_test_continuation_not_found/);
});

test("consent route rejects browser-supplied identity and workflow data", async () => {
  const calls = installReceiverHarness({
    sessionId: "consent_session_test_rejected",
    status: "approved",
  });
  const response = await createConsent(requestWithJson({
    subject: "browser-controlled-subject",
    prompt: "browser-controlled-prompt",
    url: `${HOST_ORIGIN}/browser-controlled-url`,
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: "reentry_test_request_invalid" },
  });
  assert.equal(calls.length, 0);
});

function installReceiverHarness({ sessionId, status }) {
  const keys = generateKeyPairSync("ed25519");
  process.env.HOST_ORIGIN = HOST_ORIGIN;
  process.env.RECEIVER_ORIGIN = RECEIVER_ORIGIN;
  process.env.REENTRY_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.REENTRY_KEY_ID = "host_key_reentry_sdk_test";
  process.env.REENTRY_ORGANIZATION_API_KEY = ORGANIZATION_API_KEY;

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const call = {
      path: parsed.pathname,
      options: { ...options, headers: { ...(options.headers ?? {}) } },
    };
    calls.push(call);

    if (parsed.pathname === "/v0.1/host-keys") {
      return jsonResponse({ status: "active", duplicate: false }, 201);
    }
    if (parsed.pathname === "/v0.1/consent-sessions") {
      return jsonResponse({
        consent_session_id: sessionId,
        consent_url: `${RECEIVER_ORIGIN}/consent?token=${"A".repeat(43)}`,
        duplicate: false,
      }, 201);
    }
    if (parsed.pathname === `/v0.1/consent-sessions/${sessionId}`) {
      const manifest = JSON.parse(calls[1].options.body).manifest;
      return jsonResponse({
        consent_session_id: sessionId,
        status,
        binding: status === "approved"
          ? {
            type: "webmcp.reentry_binding",
            protocol_version: "0.1",
            binding_id: "binding_test_001",
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
    throw new Error(`Unexpected Receiver path: ${parsed.pathname}`);
  };

  return calls;
}

function requestWithJson(body) {
  return new Request(`${HOST_ORIGIN}/api/reentry/test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function jsonResponse(value, status) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}
