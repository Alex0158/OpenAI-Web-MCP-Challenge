import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import path from "node:path";
import test, { after, before } from "node:test";

import { createHostSdk } from "../src/server.mjs";

// This is an opt-in cross-repository contract suite. It needs a disposable
// PostgreSQL database and the actual v2 Receiver source; the normal SDK suite
// remains independent of the Cloud Receiver. Skipping without the opt-in is
// test-environment gating, not a production fallback.
const enabled = process.env.CLOUD_RECEIVER_V2_CONTRACT === "1";
const testOptions = enabled
  ? {}
  : { skip: "Set CLOUD_RECEIVER_V2_CONTRACT=1 with a disposable v2 database to run" };

const RECEIVER_ORIGIN = "http://127.0.0.1:4000";

let harness;

before(async () => {
  if (!enabled) return;
  harness = await createHarness();
});

after(async () => {
  if (!harness) return;
  const { prisma, organizationId, userEmail, developerEmail, clearTestAccounts } = harness;
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

test("SDK-V2-001 registers a Host key through the real Receiver contract", testOptions, async () => {
  const { sdk, origin, hostId, keyId, publicKeyPem, requests } = createCase(harness, "register");
  const result = await sdk.registerHostKey({ hostId });

  assert.deepEqual(Object.keys(result).sort(), [
    "duplicate",
    "host_id",
    "issuer_origin",
    "key_id",
    "protocol_version",
    "status",
    "type",
  ]);
  assert.deepEqual(result, {
    type: "webmcp.reentry_host_key",
    protocol_version: "0.1",
    host_id: hostId,
    issuer_origin: origin,
    key_id: keyId,
    status: "active",
    duplicate: false,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${RECEIVER_ORIGIN}/v0.1/host-keys`);
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers.Authorization, `Bearer ${harness.organizationApiKey}`);
  assert.equal(requests[0].options.credentials, "omit");
  assert.equal(requests[0].options.redirect, "manual");
  assert.equal(requests[0].options.cache, "no-store");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    host_id: hostId,
    issuer_origin: origin,
    key_id: keyId,
    public_key_pem: publicKeyPem,
  });
  assert.equal(requests[0].options.body.includes("PRIVATE KEY"), false);

  const duplicate = await sdk.registerHostKey({ hostId });
  assert.equal(duplicate.duplicate, true);
  assert.equal(requests.length, 2);
});

test("SDK-V2-002 creates an opaque consent session from an SDK-signed Manifest", testOptions, async () => {
  const current = createCase(harness, "session");
  await current.sdk.registerHostKey({ hostId: current.hostId });
  const manifest = current.sdk.createManifest({
    manifestId: `manifest-${harness.suffix}-session`,
    correlationId: `correlation-${harness.suffix}-session`,
    offerExpiresAt: isoIn(5 * 60_000),
    workflow: {
      id: `workflow-${harness.suffix}-session`,
      type: "review",
      stateVersion: 1,
      canonicalUrl: `${current.origin}/workflows/session`,
    },
    display: {
      title: "Review this workflow",
      reason: "A later step is ready for explicit approval.",
    },
    grantRequest: {
      eventType: "review.requested",
      grantExpiresAt: isoIn(30 * 60_000),
      humanBoundary: "explicit_receiver_consent",
    },
  });

  const hostSubjectRef = `subject-${harness.suffix}-session`;
  const result = await current.sdk.createConsentSession({ manifest, hostSubjectRef });

  assert.deepEqual(Object.keys(result).sort(), [
    "challenge",
    "consent_session_id",
    "consent_url",
    "duplicate",
    "expires_at",
    "protocol_version",
    "type",
  ]);
  assert.equal(result.type, "webmcp.reentry_consent_session");
  assert.equal(result.protocol_version, "0.1");
  assert.equal(result.duplicate, false);
  assert.equal(typeof result.consent_session_id, "string");
  assert.deepEqual(Object.keys(result.challenge).sort(), [
    "challenge_id",
    "correlation_id",
    "display",
    "grant_scope",
    "issuer_origin",
    "manifest_id",
    "offer_expires_at",
    "status",
    "workflow",
  ]);
  assert.equal(result.challenge.status, "pending");
  assert.equal(result.challenge.manifest_id, manifest.manifest_id);
  assert.equal(result.challenge.correlation_id, manifest.correlation_id);
  assert.equal(result.challenge.issuer_origin, current.origin);
  assert.equal(result.challenge.grant_scope.event_type, manifest.grant_request.event_type);
  assert.equal(result.challenge.grant_scope.max_runs, 1);
  assert.equal(result.challenge.grant_scope.expires_at, result.expires_at);

  const consentUrl = new URL(result.consent_url);
  assert.equal(consentUrl.origin, RECEIVER_ORIGIN);
  assert.equal(consentUrl.pathname, "/consent");
  assert.deepEqual([...consentUrl.searchParams.keys()], ["token"]);
  assert.match(consentUrl.searchParams.get("token") ?? "", /^[A-Za-z0-9_-]{43}$/);
  assert.equal(result.consent_url.includes(hostSubjectRef), false);
  assert.equal(JSON.stringify(result).includes(harness.organizationApiKey), false);

  const controlRequest = current.requests[1];
  assert.equal(controlRequest.url, `${RECEIVER_ORIGIN}/v0.1/consent-sessions`);
  assert.equal(controlRequest.options.headers.Authorization, `Bearer ${harness.organizationApiKey}`);
  assert.deepEqual(JSON.parse(controlRequest.options.body), {
    host_subject_ref: hostSubjectRef,
    expected_origin: current.origin,
    manifest,
  });
});

test("SDK-V2-003 reads pending and approved consent status without private target data", testOptions, async () => {
  const current = createCase(harness, "status");
  await current.sdk.registerHostKey({ hostId: current.hostId });
  const manifest = createManifest(current, "status");
  const hostSubjectRef = `subject-${harness.suffix}-status`;
  const created = await current.sdk.createConsentSession({ manifest, hostSubjectRef });
  const token = tokenFromUrl(created.consent_url);

  const pending = await current.sdk.getConsentSession({
    consentSessionId: created.consent_session_id,
  });
  assert.deepEqual(Object.keys(pending).sort(), [
    "binding",
    "challenge_id",
    "consent_session_id",
    "effective_status",
    "expires_at",
    "protocol_version",
    "status",
    "type",
  ]);
  assert.equal(pending.type, "webmcp.reentry_consent_status");
  assert.equal(pending.status, "pending");
  assert.equal(pending.effective_status, null);
  assert.equal(pending.binding, null);

  const decision = await harness.userAgent
    .post("/v0.1/account-consent-decisions")
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({ consent_token: token, action: "approve", connector_id: harness.connectorId });
  assert.equal(decision.status, 200);
  assert.equal(decision.body.status, "approved");

  const approved = await current.sdk.getConsentSession({
    consentSessionId: created.consent_session_id,
  });
  assert.equal(approved.status, "approved");
  assert.equal(approved.effective_status, "active");
  assert.deepEqual(Object.keys(approved.binding).sort(), [
    "binding_id",
    "correlation_id",
    "event_type",
    "expires_at",
    "protocol_version",
    "runs_remaining",
    "status",
    "type",
    "workflow_id",
  ]);
  assert.equal(approved.binding.type, "webmcp.reentry_binding");
  assert.equal(approved.binding.status, "active");
  assert.equal(approved.binding.runs_remaining, 1);
  assert.equal(JSON.stringify(approved).includes(harness.connectorId), false);
  assert.equal(JSON.stringify(approved).includes(harness.deliveryTargetId), false);
  assert.equal(JSON.stringify(approved).includes(harness.organizationApiKey), false);
});

test("SDK-V2-004 exposes the exact Receiver-to-popup completion event required by the browser SDK", testOptions, async () => {
  const current = createCase(harness, "browser");
  await current.sdk.registerHostKey({ hostId: current.hostId });
  const created = await current.sdk.createConsentSession({
    manifest: createManifest(current, "browser"),
    hostSubjectRef: `subject-${harness.suffix}-browser`,
  });
  const token = tokenFromUrl(created.consent_url);

  const page = await harness.userAgent.get(`/consent?token=${encodeURIComponent(token)}`);
  assert.equal(page.status, 200);
  assert.match(page.headers["content-type"] ?? "", /text\/html/);
  assert.equal(page.text.includes(token), false);

  // The SDK client trusts only this exact event, exact popup source, and exact
  // origin; the Receiver page must emit it after the account decision succeeds.
  assert.match(page.text, /window\.opener\.postMessage/);
  assert.match(page.text, /["']reentry\.consent\.complete["']/);
  assert.match(page.text, /consent_session_id/);
  assert.match(page.text, /status/);
  assert.match(page.text, /(?:window\.)?location\.origin/);
});

function createCase(h, label) {
  const keys = generateKeyPairSync("ed25519");
  const origin = `https://sdk-v2-${h.suffix}-${label}.example`;
  const hostId = `host-${h.suffix}-${label}`;
  const keyId = `host-key-${h.suffix}-${label}`;
  const publicKeyPem = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
  const requests = [];
  let sequence = 0;
  const sdk = createHostSdk({
    origin,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId,
    organizationApiKey: h.organizationApiKey,
    clock: () => new Date(),
    createId: (prefix) => `${prefix}-${h.suffix}-${label}-${++sequence}`,
    fetchImpl: h.receiverFetch(requests),
  });
  return { sdk, origin, hostId, keyId, publicKeyPem, requests };
}

function createManifest(current, label) {
  return current.sdk.createManifest({
    manifestId: `manifest-${harness.suffix}-${label}`,
    correlationId: `correlation-${harness.suffix}-${label}`,
    offerExpiresAt: isoIn(5 * 60_000),
    workflow: {
      id: `workflow-${harness.suffix}-${label}`,
      type: "review",
      stateVersion: 1,
      canonicalUrl: `${current.origin}/workflows/${label}`,
    },
    display: {
      title: `Review ${label}`,
      reason: "A later step is ready for explicit approval.",
    },
    grantRequest: {
      eventType: "review.requested",
      grantExpiresAt: isoIn(30 * 60_000),
      humanBoundary: "explicit_receiver_consent",
    },
  });
}

function tokenFromUrl(consentUrl) {
  const token = new URL(consentUrl).searchParams.get("token");
  assert.match(token ?? "", /^[A-Za-z0-9_-]{43}$/);
  return token;
}

function isoIn(milliseconds) {
  return new Date(Date.now() + milliseconds).toISOString();
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
  const request = require(path.join(receiverRoot, "node_modules/supertest"));
  const app = createApp();
  const userAgent = request.agent(app);
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const userEmail = `sdk-v2-user-${suffix}@example.com`;
  const developerEmail = `sdk-v2-developer-${suffix}@example.com`;
  const password = "correct horse battery staple";

  appConfig.receiverPublicUrl = RECEIVER_ORIGIN;
  await clearTestAccounts(userEmail);
  await clearTestAccounts(developerEmail);

  const user = await userAgent.post("/v1/auth/users/register").send({ email: userEmail, password });
  assert.equal(user.status, 201);
  const developer = await request(app)
    .post("/v1/auth/developers/register")
    .send({ email: developerEmail, password });
  assert.equal(developer.status, 201);

  const organization = await prisma.organization.create({
    data: { developerId: developer.body.data.id, name: `SDK v2 Contract ${suffix}` },
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
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({});
  assert.equal(pairing.status, 201);
  const claim = await request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: "SDK Contract Connector" });
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
  };
  harnessValue.receiverFetch = (requests) => async (url, options = {}) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, RECEIVER_ORIGIN);
    requests.push({
      url,
      options: {
        ...options,
        headers: { ...(options.headers ?? {}) },
      },
    });

    const method = String(options.method ?? "GET").toLowerCase();
    const requestBuilder = request(app)[method](parsed.pathname + parsed.search);
    for (const [name, value] of Object.entries(options.headers ?? {})) {
      requestBuilder.set(name, String(value));
    }
    if (options.body !== undefined) {
      requestBuilder.send(options.body);
    }
    const response = await requestBuilder;
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }
    return new Response(response.text, { status: response.status, headers });
  };
  return harnessValue;
}
