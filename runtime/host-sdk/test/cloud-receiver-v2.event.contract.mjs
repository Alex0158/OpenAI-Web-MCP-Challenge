import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { generateKeyPairSync, randomBytes, sign as signBytes } from "node:crypto";
import path from "node:path";
import test, { after, before } from "node:test";

import {
  canonicalJson,
  verifyContinuationEventEnvelope,
} from "../../../reentry-core/src/protocol.mjs";
import {
  createHostSdk,
  HostSdkTransportError,
} from "../src/server.mjs";

// This is an opt-in cross-repository contract suite. It needs the actual v2
// Receiver Feature 3 source and a disposable PostgreSQL database. The suite
// stays skipped until the Cloud team supplies a green Feature 3 commit SHA.
const enabled = process.env.CLOUD_RECEIVER_V2_EVENT_CONTRACT === "1";
const testOptions = enabled
  ? {}
  : { skip: "Set CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 with a disposable Feature 3 database to run" };

const RECEIVER_ORIGIN = "http://127.0.0.1:4000";
const EVENT_ROUTE = "/v0.1/events";
const HOST_BROWSER_ORIGIN = "http://localhost:3000";
const NOW = new Date();

let harness;

before(async () => {
  if (!enabled) return;
  harness = await createHarness();
});

after(async () => {
  if (!harness) return;
  const {
    prisma,
    organizationId,
    userEmail,
    developerEmail,
    clearTestAccounts,
  } = harness;
  try {
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
  } finally {
    await prisma.$disconnect();
  }
});

test(
  "SDK-V2-EVENT-001 sends the exact signed Event envelope without organization authentication",
  testOptions,
  async () => {
    const current = await createApprovedCase(harness, "accept");
    const input = eventInput(current, `event-${harness.suffix}-accept`);
    const issued = current.sdk.createEvent(input);
    const acceptance = await current.sdk.sendEvent(input);

    assert.deepEqual(acceptance, {
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: input.eventId,
      correlation_id: current.binding.correlation_id,
      accepted: true,
      duplicate: false,
      status: "accepted",
    });

    const eventRequests = current.requests.filter((request) => (
      new URL(request.url).pathname === EVENT_ROUTE
    ));
    assert.equal(eventRequests.length, 1);
    const eventRequest = eventRequests[0];
    assert.equal(eventRequest.options.method, "POST");
    assert.equal(eventRequest.options.cache, "no-store");
    assert.equal(eventRequest.options.credentials, "omit");
    assert.equal(eventRequest.options.redirect, "manual");
    assert.deepEqual(Object.keys(eventRequest.options.headers).sort(), [
      "Accept",
      "Content-Type",
    ]);
    assert.equal("Authorization" in eventRequest.options.headers, false);
    assert.equal(eventRequest.options.body.includes(harness.organizationApiKey), false);

    const envelope = JSON.parse(eventRequest.options.body);
    assert.deepEqual(Object.keys(envelope).sort(), ["body", "headers"]);
    assert.deepEqual(Object.keys(envelope.headers).sort(), [
      "WebMCP-Reentry-Key-Id",
      "WebMCP-Reentry-Signature",
      "WebMCP-Reentry-Timestamp",
    ]);
    assert.deepEqual(envelope, { body: issued.body, headers: issued.headers });
    assert.deepEqual(
      verifyContinuationEventEnvelope(envelope, {
        now: NOW,
        expectedOrigin: current.origin,
        keyResolver: () => current.keys.publicKey,
      }),
      issued.event,
    );

    assertAcceptanceMeansOnlyQueued(acceptance);
    const status = await current.sdk.getConsentSession({
      consentSessionId: current.consentSessionId,
    });
    assert.equal(status.effective_status, "exhausted");
    assert.equal(status.binding.runs_remaining, 0);
  },
);

test(
  "SDK-V2-EVENT-002 returns an exact duplicate acceptance without a second run",
  testOptions,
  async () => {
    const current = await createApprovedCase(harness, "duplicate");
    const input = eventInput(current, `event-${harness.suffix}-duplicate`);

    const first = await current.sdk.sendEvent(input);
    const duplicate = await current.sdk.sendEvent(input);

    assert.deepEqual(first, {
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: input.eventId,
      correlation_id: current.binding.correlation_id,
      accepted: true,
      duplicate: false,
      status: "accepted",
    });
    assert.deepEqual(duplicate, {
      ...first,
      duplicate: true,
    });
    assertAcceptanceMeansOnlyQueued(first);
    assertAcceptanceMeansOnlyQueued(duplicate);

    const eventRequests = current.requests.filter((request) => (
      new URL(request.url).pathname === EVENT_ROUTE
    ));
    assert.equal(eventRequests.length, 2);
    assert.equal(eventRequests[0].options.body, eventRequests[1].options.body);

    const status = await current.sdk.getConsentSession({
      consentSessionId: current.consentSessionId,
    });
    assert.equal(status.effective_status, "exhausted");
    assert.equal(status.binding.runs_remaining, 0);
  },
);

test(
  "SDK-V2-EVENT-003 rejects an invalid signature with a bounded error and no mutation",
  testOptions,
  async () => {
    const current = await createApprovedCase(
      harness,
      "invalid-signature",
      (rawBody) => {
        const envelope = JSON.parse(rawBody);
        envelope.headers["WebMCP-Reentry-Signature"] = "A".repeat(86);
        return canonicalJson(envelope);
      },
    );

    await assertReceiverError(
      () => current.sdk.sendEvent(eventInput(current, `event-${harness.suffix}-invalid-signature`)),
      { code: "event_signature_invalid", statusCode: 401 },
    );
    await assertGrantStatus(current, "active", 1);
  },
);

test(
  "SDK-V2-EVENT-004 rejects an expired Grant with a bounded error and no mutation",
  testOptions,
  async () => {
    const current = await createApprovedCase(harness, "expired-grant");
    const grant = await harness.prisma.grant.findUnique({
      where: { id: current.grantId },
      select: { id: true },
    });
    assert.ok(grant);
    await harness.prisma.grant.update({
      where: { id: grant.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    await assertReceiverError(
      () => current.sdk.sendEvent(eventInput(current, `event-${harness.suffix}-expired-grant`)),
      { code: "grant_expired", statusCode: 410 },
    );
    await assertGrantStatus(current, "expired", 1);
  },
);

test(
  "SDK-V2-EVENT-005 rejects a revoked Grant with a bounded error and no mutation",
  testOptions,
  async () => {
    const current = await createApprovedCase(harness, "revoked-grant");
    await harness.revokeGrantInternally({
      grantId: current.grantId,
      controlToken: harness.appConfig.grantControlToken,
    });

    await assertReceiverError(
      () => current.sdk.sendEvent(eventInput(current, `event-${harness.suffix}-revoked-grant`)),
      { code: "grant_revoked", statusCode: 422 },
    );
    await assertGrantStatus(current, "revoked", 1);
  },
);

test(
  "SDK-V2-EVENT-006 rejects an Event from the wrong origin with a bounded error and no mutation",
  testOptions,
  async () => {
    const current = await createApprovedCase(harness, "wrong-origin");
    const wrongOrigin = `https://wrong-origin-${harness.suffix}.example`;
    const wrongOriginSdk = createHostSdk({
      origin: wrongOrigin,
      receiverOrigin: RECEIVER_ORIGIN,
      privateKey: current.keys.privateKey,
      keyId: current.keyId,
      organizationApiKey: harness.organizationApiKey,
      clock: () => new Date(NOW),
      fetchImpl: harness.receiverFetch(current.requests),
    });

    await assertReceiverError(
      () => wrongOriginSdk.sendEvent(
        eventInput(current, `event-${harness.suffix}-wrong-origin`, wrongOrigin),
      ),
      { code: "event_origin_mismatch", statusCode: 422 },
    );
    await assertGrantStatus(current, "active", 1);
  },
);

test(
  "SDK-V2-EVENT-007 rejects an invalid Event body with a bounded error and no mutation",
  testOptions,
  async () => {
    const current = await createApprovedCase(
      harness,
      "invalid-event",
      (rawBody) => {
        const envelope = JSON.parse(rawBody);
        const event = JSON.parse(envelope.body);
        event.event_sequence = 2;
        const body = canonicalJson(event);
        const timestamp = envelope.headers["WebMCP-Reentry-Timestamp"];
        const signature = signBytes(
          null,
          Buffer.from(`${timestamp}.${body}`, "utf8"),
          current.keys.privateKey,
        ).toString("base64url");
        return canonicalJson({
          body,
          headers: {
            ...envelope.headers,
            "WebMCP-Reentry-Signature": signature,
          },
        });
      },
    );

    await assertReceiverError(
      () => current.sdk.sendEvent(eventInput(current, `event-${harness.suffix}-invalid-event`)),
      { code: "event_sequence_invalid", statusCode: 422 },
    );
    await assertGrantStatus(current, "active", 1);
  },
);

function assertAcceptanceMeansOnlyQueued(acceptance) {
  for (const field of [
    "claimed",
    "acknowledged",
    "delivery_id",
    "lease_token",
    "effect_token",
  ]) {
    assert.equal(field in acceptance, false, `202 acceptance must not expose ${field}`);
  }
  assert.equal(acceptance.status, "accepted");
  assert.equal(acceptance.accepted, true);
}

async function assertReceiverError(operation, expected) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof HostSdkTransportError);
    assert.equal(error.code, expected.code);
    assert.equal(error.statusCode, expected.statusCode);
    assert.equal(error.message, "Receiver rejected the signed event");
    return true;
  });
}

async function assertGrantStatus(current, effectiveStatus, runsRemaining) {
  const status = await current.sdk.getConsentSession({
    consentSessionId: current.consentSessionId,
  });
  assert.equal(status.status, "approved");
  assert.equal(status.effective_status, effectiveStatus);
  assert.equal(status.binding.runs_remaining, runsRemaining);
}

async function createApprovedCase(h, label, eventBodyTransform = undefined) {
  const keys = generateKeyPairSync("ed25519");
  const origin = `https://sdk-event-${h.suffix}-${label}.example`;
  const hostId = `host-${h.suffix}-${label}`;
  const keyId = `host-key-${h.suffix}-${label}`;
  const canonicalUrl = `${origin}/workflows/${label}`;
  const requests = [];
  let sequence = 0;
  const sdk = createHostSdk({
    origin,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId,
    organizationApiKey: h.organizationApiKey,
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}-${h.suffix}-${label}-${++sequence}`,
    fetchImpl: h.receiverFetch(requests, eventBodyTransform),
  });

  const registration = await sdk.registerHostKey({ hostId });
  assert.equal(registration.status, "active");
  const manifest = sdk.createManifest({
    manifestId: `manifest-${h.suffix}-${label}`,
    correlationId: `correlation-${h.suffix}-${label}`,
    issuedAt: new Date(NOW.getTime() - 1_000).toISOString(),
    offerExpiresAt: new Date(NOW.getTime() + 5 * 60_000).toISOString(),
    workflow: {
      id: `workflow-${h.suffix}-${label}`,
      type: "review",
      stateVersion: 1,
      canonicalUrl,
    },
    display: {
      title: `Review ${label}`,
      reason: "A later Host business event is ready.",
    },
    grantRequest: {
      eventType: "review.requested",
      grantExpiresAt: new Date(NOW.getTime() + 30 * 60_000).toISOString(),
      humanBoundary: "explicit_receiver_consent",
    },
  });
  const created = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: `subject-${h.suffix}-${label}`,
  });
  const token = new URL(created.consent_url).searchParams.get("token");
  assert.match(token ?? "", /^[A-Za-z0-9_-]{43}$/);

  const decision = await h.userAgent
    .post("/v0.1/account-consent-decisions")
    .set("Origin", HOST_BROWSER_ORIGIN)
    .set("Content-Type", "application/json")
    .send({ consent_token: token, action: "approve", connector_id: h.connectorId });
  assert.equal(decision.status, 200);
  assert.equal(decision.body.status, "approved");

  const status = await sdk.getConsentSession({
    consentSessionId: created.consent_session_id,
  });
  assert.equal(status.status, "approved");
  assert.equal(status.effective_status, "active");
  assert.ok(status.binding);
  const grant = await h.prisma.grant.findUnique({
    where: { consentSessionId: created.consent_session_id },
    select: { id: true },
  });
  assert.ok(grant);

  return {
    sdk,
    keys,
    keyId,
    origin,
    requests,
    binding: status.binding,
    canonicalUrl,
    consentSessionId: created.consent_session_id,
    grantId: grant.id,
  };
}

function eventInput(current, eventId, origin = current.origin) {
  return {
    binding: current.binding,
    eventId,
    deliveryTimestamp: String(Math.floor(NOW.getTime() / 1_000)),
    workflow: {
      id: current.binding.workflow_id,
      stateVersion: 2,
      canonicalUrl: origin === current.origin
        ? current.canonicalUrl
        : `${origin}${new URL(current.canonicalUrl).pathname}`,
    },
  };
}

async function createHarness() {
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../../saas-boilerplate/", import.meta.url));
  const backendRoot = path.join(receiverRoot, "backend");
  const require = createRequire(import.meta.url);
  process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
  require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));

  const { createApp } = require(path.join(backendRoot, "src/app.ts"));
  const { appConfig } = require(path.join(backendRoot, "src/config/config.ts"));
  const { prisma } = require(path.join(backendRoot, "src/db/index.ts"));
  const { digestSecret } = require(path.join(backendRoot, "src/middleware/organization-auth.ts"));
  const { clearTestAccounts } = require(path.join(backendRoot, "src/test/helper.ts"));
  const { revokeGrantInternally } = require(path.join(backendRoot, "src/modules/consent/grant-control.ts"));
  const request = require(path.join(receiverRoot, "node_modules/supertest"));
  const app = createApp();
  const userAgent = request.agent(app);
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const userEmail = `sdk-event-user-${suffix}@example.com`;
  const developerEmail = `sdk-event-developer-${suffix}@example.com`;
  const password = "correct horse battery staple";

  appConfig.receiverPublicUrl = RECEIVER_ORIGIN;
  appConfig.frontendUrl = HOST_BROWSER_ORIGIN;
  await clearTestAccounts(userEmail);
  await clearTestAccounts(developerEmail);

  const user = await userAgent.post("/v1/auth/users/register").send({ email: userEmail, password });
  assert.equal(user.status, 201);
  const developer = await request(app)
    .post("/v1/auth/developers/register")
    .send({ email: developerEmail, password });
  assert.equal(developer.status, 201);

  const organization = await prisma.organization.create({
    data: { developerId: developer.body.data.id, name: `SDK Event Contract ${suffix}` },
  });
  const organizationApiKey = randomBytes(32).toString("base64url");
  await prisma.organizationApiKey.create({
    data: {
      organizationId: organization.id,
      keyDigest: digestSecret(organizationApiKey),
      keyPrefix: organizationApiKey.slice(0, 8),
    },
  });

  const pairing = await userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", HOST_BROWSER_ORIGIN)
    .set("Content-Type", "application/json")
    .send({});
  assert.equal(pairing.status, 201);
  const claim = await request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: "SDK Event Contract Connector" });
  assert.equal(claim.status, 200);

  const connector = await prisma.connector.findUnique({
    where: { id: claim.body.connector_id },
    select: { deliveryTargetId: true },
  });
  assert.ok(connector);

  const harnessValue = {
    app,
    appConfig,
    prisma,
    request,
    userAgent,
    suffix,
    userEmail,
    developerEmail,
    organizationId: organization.id,
    organizationApiKey,
    connectorId: claim.body.connector_id,
    deliveryTargetId: connector.deliveryTargetId,
    clearTestAccounts,
    revokeGrantInternally,
  };
  harnessValue.receiverFetch = (requests, eventBodyTransform = undefined) => async (url, options = {}) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, RECEIVER_ORIGIN);
    let body = options.body;
    if (parsed.pathname === EVENT_ROUTE && typeof body === "string" && eventBodyTransform) {
      body = eventBodyTransform(body);
    }
    const capturedOptions = {
      ...options,
      body,
      headers: { ...(options.headers ?? {}) },
    };
    requests.push({ url, options: capturedOptions });

    const method = String(options.method ?? "GET").toLowerCase();
    const requestBuilder = request(app)[method](parsed.pathname + parsed.search);
    for (const [name, value] of Object.entries(capturedOptions.headers)) {
      requestBuilder.set(name, String(value));
    }
    if (body !== undefined) requestBuilder.send(body);
    const response = await requestBuilder;
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }
    return new Response(response.text ?? "", { status: response.status, headers });
  };
  return harnessValue;
}
