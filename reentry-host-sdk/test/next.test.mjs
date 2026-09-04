import assert from "node:assert/strict";
import test from "node:test";

import {
  createConsentDecisionRoute,
  createConsentSessionRoute,
  createEventRoute,
  createManifestRoute,
} from "../src/next.mjs";

test("Next event route loads server input and returns the Receiver acceptance", async () => {
  let received;
  const POST = createEventRoute({
    sdk: {
      async sendEvent(input) {
        received = input;
        return { accepted: true, event_id: "event_001" };
      },
    },
    async getEventInput({ body }) {
      return {
        bodyFromBrowser: body,
        binding: "loaded-on-server",
        workflow: "loaded-on-server",
      };
    },
  });

  const response = await POST(new Request("https://host.example/api/reentry/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bindingId: "browser-value" }),
  }));

  assert.equal(response.status, 202);
  assert.deepEqual(received, {
    bodyFromBrowser: { bindingId: "browser-value" },
    binding: "loaded-on-server",
    workflow: "loaded-on-server",
  });
  assert.deepEqual(await response.json(), { accepted: true, event_id: "event_001" });
});

test("Next Manifest route returns the signed Manifest produced by the server SDK", async () => {
  const GET = createManifestRoute({
    sdk: {
      createManifest(input) {
        return { type: "webmcp.reentry_manifest", title: input.title };
      },
    },
    async getManifestInput() {
      return { title: "Continue this workflow" };
    },
  });

  const response = await GET(new Request("https://host.example/api/reentry/manifest"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    type: "webmcp.reentry_manifest",
    title: "Continue this workflow",
  });
});

test("Next route maps invalid JSON and bounded SDK errors to small error responses", async () => {
  const POST = createEventRoute({
    sdk: { sendEvent: async () => ({ accepted: true }) },
    getEventInput: async () => {
      const error = new Error("private detail");
      error.code = "event_scope_invalid";
      error.statusCode = 403;
      throw error;
    },
  });

  const malformed = await POST(new Request("https://host.example/api/reentry/event", {
    method: "POST",
    body: "{",
  }));
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: { code: "host_sdk_request_invalid" } });

  const rejected = await POST(new Request("https://host.example/api/reentry/event", {
    method: "POST",
    body: "{}",
  }));
  assert.equal(rejected.status, 403);
  assert.deepEqual(await rejected.json(), { error: { code: "event_scope_invalid" } });
});

test("Next consent routes keep the Host subject and token on the server boundary", async () => {
  let sessionInput;
  let sessionTrigger;
  let decisionInput;
  const sdk = {
    async createConsentSession(input) {
      sessionInput = input;
      return { type: "webmcp.reentry_consent_session", duplicate: false };
    },
    async decideConsent(input) {
      decisionInput = input;
      return { type: "webmcp.reentry_consent_decision", status: "approved" };
    },
  };
  const createSession = createConsentSessionRoute({
    sdk,
    async getConsentSessionInput({ body }) {
      sessionTrigger = body.trigger;
      return {
        manifest: { manifestFrom: "host-server" },
        hostSubjectRef: "session-user-001",
      };
    },
  });
  const createDecision = createConsentDecisionRoute({
    sdk,
    async getConsentDecisionInput({ body }) {
      return {
        challengeId: "challenge_001",
        hostSubjectRef: "session-user-001",
        action: body.action,
        consentToken: "token-held-by-host-server",
      };
    },
  });

  const sessionResponse = await createSession(new Request("https://host.example/api/reentry/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "button-click" }),
  }));
  assert.equal(sessionResponse.status, 201);
  assert.equal(sessionTrigger, "button-click");
  assert.deepEqual(sessionInput, {
    manifest: { manifestFrom: "host-server" },
    hostSubjectRef: "session-user-001",
  });

  const decisionResponse = await createDecision(new Request("https://host.example/api/reentry/consent/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve" }),
  }));
  assert.equal(decisionResponse.status, 200);
  assert.deepEqual(decisionInput, {
    challengeId: "challenge_001",
    hostSubjectRef: "session-user-001",
    action: "approve",
    consentToken: "token-held-by-host-server",
  });
});
