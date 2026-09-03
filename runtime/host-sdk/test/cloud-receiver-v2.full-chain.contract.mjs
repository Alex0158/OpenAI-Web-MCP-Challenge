import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test, { after, before } from "node:test";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import {
  verifyContinuationEventEnvelope,
} from "../../../reentry-core/src/protocol.mjs";
import { LocalConnector } from "../../local-connector/src/local-connector.mjs";
import { createReentryConsentAction, createReentryConsentPrompt } from "../src/client.mjs";
import { createHostSdk } from "../src/server.mjs";

// This is an opt-in release-gate suite. It is intentionally excluded from the normal SDK glob
// because it requires a pinned Cloud Receiver, a pinned Local Connector counterpart, disposable
// PostgreSQL, and an explicit project-manager ACK-003 decision. It must not be used as a fallback
// or as evidence that the full chain is complete before those gates are satisfied.
const enabled = process.env.CLOUD_RECEIVER_V2_FULL_CHAIN === "1";
const mappingApproved = process.env.CLOUD_RECEIVER_V2_ACK_MAPPING_APPROVED === "1";
const testOptions = enabled && mappingApproved
  ? { concurrency: false }
  : {
    skip: mappingApproved
      ? "Set CLOUD_RECEIVER_V2_FULL_CHAIN=1 with pinned v2 counterparts and disposable PostgreSQL"
      : "Set CLOUD_RECEIVER_V2_ACK_MAPPING_APPROVED=1 for the adopted ACK-003 mapping",
  };

const RECEIVER_ORIGIN = "http://127.0.0.1:4000";
const HOST_BROWSER_ORIGIN = "http://localhost:3000";
const EVENT_ROUTE = "/v0.1/events";
const CLAIM_ROUTE = "/v0.1/delivery-claims";
const ACK_ROUTE = "/v0.1/delivery-acknowledgements";
const REQUEST_TIMEOUT_MS = 5_000;

let harness;

test(
  "SDK-V2-E2E-001 runs the pinned Host-to-acknowledgement flow and exact replay",
  testOptions,
  async () => {
    harness = harness ?? await createHarness();
    const current = createCase(harness);
    const documentRef = new FakeDocument();
    const windowRef = new FakeWindow();
    const prompt = createReentryConsentPrompt({ documentRef, windowRef });
    const requests = current.requests;
    let createdSession;
    let approvedStatus;
    let resolveSession;
    const sessionReady = new Promise((resolve) => {
      resolveSession = resolve;
    });

    const requestReentry = createReentryConsentAction({
      prompt,
      async createConsentSession() {
        const manifest = current.sdk.createManifest({
          manifestId: `manifest-${harness.suffix}-e2e`,
          correlationId: `correlation-${harness.suffix}-e2e`,
          offerExpiresAt: isoIn(5 * 60_000),
          workflow: {
            id: `workflow-${harness.suffix}-e2e`,
            type: "review",
            stateVersion: 1,
            canonicalUrl: `${current.origin}/workflows/e2e`,
          },
          display: {
            title: "Continue this workflow?",
            reason: "A later step is ready for explicit review.",
          },
          grantRequest: {
            eventType: "workflow.ready",
            grantExpiresAt: isoIn(30 * 60_000),
            humanBoundary: "explicit_receiver_consent",
          },
        });
        createdSession = await current.sdk.createConsentSession({
          manifest,
          hostSubjectRef: `subject-${harness.suffix}-e2e`,
        });
        resolveSession(createdSession);
        return {
          title: createdSession.challenge.display.title,
          reason: createdSession.challenge.display.reason,
          consentUrl: createdSession.consent_url,
          consentSessionId: createdSession.consent_session_id,
        };
      },
      async confirmConsentSession({ consentSessionId }) {
        approvedStatus = await current.sdk.getConsentSession({ consentSessionId });
        return {
          status: approvedStatus.status,
          continuationId: `continuation-${harness.suffix}-e2e`,
        };
      },
    });

    await current.sdk.registerHostKey({ hostId: current.hostId });
    const actionPromise = requestReentry({ source: "button" });
    const session = await sessionReady;
    const pendingStatus = await current.sdk.getConsentSession({
      consentSessionId: session.consent_session_id,
    });
    assert.equal(pendingStatus.status, "pending");
    assert.equal(pendingStatus.binding, null);
    const consentToken = tokenFromUrl(session.consent_url);
    const consentPage = await harness.userAgent
      .get(`/consent?token=${encodeURIComponent(consentToken)}`);
    assert.equal(consentPage.status, 200);
    assert.match(consentPage.headers["content-type"] ?? "", /text\/html/);
    assert.equal(consentPage.text.includes(consentToken), false);
    assert.match(consentPage.text, /window\.opener\.postMessage/);
    assert.match(consentPage.text, /["']reentry\.consent\.complete["']/);

    const decision = await harness.userAgent
      .post("/v0.1/account-consent-decisions")
      .set("Origin", HOST_BROWSER_ORIGIN)
      .set("Content-Type", "application/json")
      .send({
        consent_token: consentToken,
        action: "approve",
        connector_id: harness.connectorId,
      });
    assert.equal(decision.status, 200);
    assert.equal(decision.body.status, "approved");

    await Promise.resolve();
    const dialog = documentRef.body.children.at(-1);
    assert.ok(dialog);
    findByText(dialog, "Review in Re-entry").click();
    assert.equal(windowRef.openedUrl, session.consent_url);
    windowRef.dispatchMessage({
      origin: RECEIVER_ORIGIN,
      source: windowRef.popup,
      data: {
        type: "reentry.consent.complete",
        consent_session_id: session.consent_session_id,
        status: "approved",
      },
    });

    const approval = await actionPromise;
    assert.deepEqual(approval, {
      status: "approved",
      continuationId: `continuation-${harness.suffix}-e2e`,
    });
    assert.equal(approvedStatus.status, "approved");
    assert.equal(approvedStatus.effective_status, "active");
    assert.ok(approvedStatus.binding);
    assert.equal(JSON.stringify(approvedStatus).includes(harness.connectorId), false);
    assert.equal(JSON.stringify(approvedStatus).includes(harness.connectorToken), false);
    assert.equal(JSON.stringify(approvedStatus).includes(harness.organizationApiKey), false);

    const binding = approvedStatus.binding;
    const eventId = `event-${harness.suffix}-e2e`;
    const eventInput = {
      binding,
      eventId,
      deliveryTimestamp: String(Math.floor(Date.now() / 1_000)),
      workflow: {
        id: binding.workflow_id,
        stateVersion: 2,
        canonicalUrl: current.canonicalUrl,
      },
    };
    const acceptance = await current.sdk.sendEvent(eventInput);
    assert.deepEqual(acceptance, {
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: eventId,
      correlation_id: binding.correlation_id,
      accepted: true,
      duplicate: false,
      status: "accepted",
    });
    assert.equal(acceptance.accepted, true);
    assert.equal(acceptance.status, "accepted");
    for (const field of ["claimed", "acknowledged", "delivery_id", "lease_token", "effect_token"]) {
      assert.equal(field in acceptance, false, `202 acceptance must not expose ${field}`);
    }

    const eventRequest = requests.find((request) => new URL(request.url).pathname === EVENT_ROUTE);
    assert.ok(eventRequest);
    assert.deepEqual(Object.keys(eventRequest.options.headers).sort(), ["Accept", "Content-Type"]);
    assert.equal("Authorization" in eventRequest.options.headers, false);
    assert.equal(eventRequest.options.body.includes(harness.organizationApiKey), false);
    const envelope = JSON.parse(eventRequest.options.body);
    assert.deepEqual(Object.keys(envelope).sort(), ["body", "headers"]);
    assert.deepEqual(Object.keys(envelope.headers).sort(), [
      "WebMCP-Reentry-Key-Id",
      "WebMCP-Reentry-Signature",
      "WebMCP-Reentry-Timestamp",
    ]);
    const eventBody = JSON.parse(envelope.body);
    assert.equal(eventBody.event_id, eventId);
    assert.equal(eventBody.binding_id, binding.binding_id);
    assert.deepEqual(
      verifyContinuationEventEnvelope(envelope, {
        now: new Date(),
        expectedOrigin: current.origin,
        keyResolver: () => current.keys.publicKey,
      }),
      eventBody,
    );
    assert.equal(requests.filter((request) => new URL(request.url).pathname === EVENT_ROUTE).length, 1);
    assert.deepEqual(
      requests.map((request) => new URL(request.url).pathname),
      [
        "/v0.1/host-keys",
        "/v0.1/consent-sessions",
        `/v0.1/consent-sessions/${session.consent_session_id}`,
        `/v0.1/consent-sessions/${session.consent_session_id}`,
        EVENT_ROUTE,
      ],
    );

    const grant = await harness.prisma.grant.findUnique({
      where: { consentSessionId: session.consent_session_id },
      select: { id: true, runsRemaining: true },
    });
    assert.ok(grant);
    assert.equal(grant.runsRemaining, 0);
    assert.equal(await countRows("cr2_events", eventId), 1);
    assert.equal(await countRows("cr2_deliveries", eventId), 1);
    const pendingDelivery = await readDeliveryByEvent(eventId);
    assert.equal(pendingDelivery.status, "pending");
    assert.equal(pendingDelivery.acknowledged_at ?? null, null);

    const effectTokens = new Map();
    const authorityCalls = [];
    const effectAuthority = {
      verifyEffect({ effectToken, expected }) {
        authorityCalls.push({ effectToken, expected: { ...expected } });
        const attestation = effectTokens.get(effectToken);
        if (!attestation) throw new Error("effect token is unknown");
        return attestation;
      },
    };
    harness.app.locals.effectAuthority = effectAuthority;

    let activationInput;
    const claimToken = randomBytes(32).toString("base64url");
    const connectorClient = new LocalConnectorClient({
      baseUrl: RECEIVER_ORIGIN,
      connectorToken: harness.connectorToken,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
    });
    const connector = new LocalConnector({
      client: connectorClient,
      adapter: {
        activate(input) {
          activationInput = input;
          return {
            type: "webmcp.agent_activation_result",
            protocol_version: "0.1",
            delivery_id: input.delivery_id,
            event_id: input.event_id,
            attempt: input.attempt,
            outcome: "accepted",
            code: "activation_dispatch_accepted",
            unavailable_capability: null,
          };
        },
      },
      clock: () => new Date(),
      activationTimeoutMs: REQUEST_TIMEOUT_MS,
      createClaimToken: () => claimToken,
    });

    const claimed = await withReceiverHandler(harness.app, async () => connector.runOnce());
    const activation = claimed.result;
    assert.equal(activation.status, "activation_result");
    assert.equal(activation.result.outcome, "accepted");
    assert.equal(claimed.requests.length, 1);
    assert.equal(new URL(claimed.requests[0].url).pathname, CLAIM_ROUTE);
    assert.equal("Authorization" in claimed.requests[0].options.headers, false);
    assert.equal("lease_token" in activationInput, false);
    assert.equal("connector_token" in activationInput, false);

    const leasedDelivery = await readDelivery(activation.delivery_id);
    assert.equal(leasedDelivery.status, "leased");
    assert.equal(leasedDelivery.current_attempt, 1);
    const leaseStartedAt = await readLeaseStart(activation.delivery_id);
    const effectToken = `effect-token-${harness.suffix}-e2e-${randomBytes(12).toString("base64url")}`;
    const effectId = `effect-${harness.suffix}-e2e`;
    effectTokens.set(effectToken, {
      type: "webmcp.host_effect_attestation",
      protocol_version: "0.1",
      effect_id: effectId,
      delivery_id: activation.delivery_id,
      event_id: eventId,
      correlation_id: binding.correlation_id,
      workflow_id: binding.workflow_id,
      outcome: "effect_applied_awaiting_human",
      confirmed_at: new Date(leaseStartedAt.getTime() + 1).toISOString(),
    });

    const acknowledged = await withReceiverHandler(harness.app, async () => {
      return connector.acknowledgeDelivery({
        deliveryId: activation.delivery_id,
        leaseToken: claimToken,
        effectToken,
      });
    });
    assert.deepEqual(acknowledged.result, {
      type: "webmcp.delivery_acknowledgement",
      protocol_version: "0.1",
      delivery_id: activation.delivery_id,
      event_id: eventId,
      effect_id: effectId,
      acknowledged: true,
      duplicate: false,
      status: "acknowledged",
    });
    assert.equal(acknowledged.requests.length, 1);
    assert.equal(new URL(acknowledged.requests[0].url).pathname, ACK_ROUTE);
    assert.deepEqual(Object.keys(acknowledged.requests[0].options.headers).sort(), [
      "Accept",
      "Content-Type",
    ]);
    assert.equal("Authorization" in acknowledged.requests[0].options.headers, false);
    assert.deepEqual(JSON.parse(acknowledged.requests[0].options.body), {
      connector_token: harness.connectorToken,
      delivery_id: activation.delivery_id,
      lease_token: claimToken,
      effect_token: effectToken,
    });
    assert.equal(authorityCalls.length, 1);
    assert.deepEqual(authorityCalls[0].expected, {
      delivery_id: activation.delivery_id,
      event_id: eventId,
      correlation_id: binding.correlation_id,
      workflow_id: binding.workflow_id,
      canonical_url: current.canonicalUrl,
      human_boundary: "explicit_receiver_consent",
      outcome: "effect_applied_awaiting_human",
    });

    const acknowledgedDelivery = await readDelivery(activation.delivery_id);
    assert.equal(acknowledgedDelivery.status, "acknowledged");
    assert.equal(acknowledgedDelivery.effect_id, effectId);
    assert.ok(acknowledgedDelivery.acknowledged_at);
    assert.equal(await countAttempts(activation.delivery_id), 1);

    const restartedApp = harness.createApp();
    restartedApp.locals.effectAuthority = effectAuthority;
    const restartedClient = new LocalConnectorClient({
      baseUrl: RECEIVER_ORIGIN,
      connectorToken: harness.connectorToken,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
    });
    const restartedConnector = new LocalConnector({
      client: restartedClient,
      adapter: { activate() { throw new Error("replay must not activate work"); } },
      clock: () => new Date(),
      activationTimeoutMs: REQUEST_TIMEOUT_MS,
      createClaimToken: () => randomBytes(32).toString("base64url"),
    });
    const replay = await withReceiverHandler(restartedApp, async () => (
      restartedConnector.acknowledgeDelivery({
        deliveryId: activation.delivery_id,
        leaseToken: claimToken,
        effectToken,
      })
    ));
    assert.deepEqual(replay.result, {
      ...acknowledged.result,
      duplicate: true,
    });
    assert.equal(replay.requests.length, 1);
    assert.equal(await countAttempts(activation.delivery_id), 1);
    assert.deepEqual(await readDelivery(activation.delivery_id), acknowledgedDelivery);

    const durable = await readDurableDeliveryText(activation.delivery_id);
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(harness.connectorToken)));
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(claimToken)));
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(effectToken)));
    assert.equal(JSON.stringify(replay.result).includes(effectToken), false);
  },
);

after(async () => {
  if (!harness) return;
  try {
    if (harness.organizationId) {
      await harness.prisma.organization.deleteMany({ where: { id: harness.organizationId } });
    }
    await harness.clearTestAccounts(harness.userEmail);
    await harness.clearTestAccounts(harness.developerEmail);
  } finally {
    await harness.prisma.$disconnect();
  }
});

function createCase(h) {
  const keys = generateKeyPairSync("ed25519");
  const origin = `https://sdk-v2-${h.suffix}-e2e.example`;
  const hostId = `host-${h.suffix}-e2e`;
  const keyId = `host-key-${h.suffix}-e2e`;
  const requests = [];
  let sequence = 0;
  const sdk = createHostSdk({
    origin,
    receiverOrigin: RECEIVER_ORIGIN,
    privateKey: keys.privateKey,
    keyId,
    organizationApiKey: h.organizationApiKey,
    clock: () => new Date(),
    createId: (prefix) => `${prefix}-${h.suffix}-e2e-${++sequence}`,
    fetchImpl: h.receiverFetch(requests),
  });
  return {
    sdk,
    keys,
    origin,
    canonicalUrl: `${origin}/workflows/e2e`,
    hostId,
    requests,
  };
}

async function createHarness() {
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../../saas-boilerplate/", import.meta.url));
  assertPinnedCounterparts(receiverRoot);
  const backendRoot = path.join(receiverRoot, "backend");
  const require = createRequire(import.meta.url);
  process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
  require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));

  const { createApp } = require(path.join(backendRoot, "src/app.ts"));
  const { appConfig } = require(path.join(backendRoot, "src/config/config.ts"));
  const { prisma } = require(path.join(backendRoot, "src/db/index.ts"));
  const { digestSecret } = require(path.join(backendRoot, "src/middleware/organization-auth.ts"));
  const { clearTestAccounts } = require(path.join(backendRoot, "src/test/helper.ts"));
  const receiverRequest = require(path.join(receiverRoot, "node_modules/supertest"));
  const app = createApp();
  const userAgent = receiverRequest.agent(app);
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const userEmail = `sdk-v2-e2e-user-${suffix}@example.com`;
  const developerEmail = `sdk-v2-e2e-developer-${suffix}@example.com`;
  const password = "correct horse battery staple";

  appConfig.receiverPublicUrl = RECEIVER_ORIGIN;
  appConfig.frontendUrl = HOST_BROWSER_ORIGIN;
  await clearTestAccounts(userEmail);
  await clearTestAccounts(developerEmail);

  const user = await userAgent.post("/v1/auth/users/register").send({ email: userEmail, password });
  assert.equal(user.status, 201);
  const developer = await receiverRequest(app)
    .post("/v1/auth/developers/register")
    .send({ email: developerEmail, password });
  assert.equal(developer.status, 201);
  const organization = await prisma.organization.create({
    data: { developerId: developer.body.data.id, name: `SDK v2 E2E ${suffix}` },
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
  const claim = await receiverRequest(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: "SDK v2 E2E Connector" });
  assert.equal(claim.status, 200);
  const connector = await prisma.connector.findUnique({
    where: { id: claim.body.connector_id },
    select: { deliveryTargetId: true },
  });
  assert.ok(connector);

  const value = {
    app,
    createApp,
    appConfig,
    prisma,
    receiverRequest,
    userAgent,
    suffix,
    userEmail,
    developerEmail,
    organizationId: organization.id,
    organizationApiKey,
    connectorId: claim.body.connector_id,
    connectorToken: claim.body.connector_token,
    deliveryTargetId: connector.deliveryTargetId,
    clearTestAccounts,
  };
  value.receiverFetch = (requests) => async (url, options = {}) => {
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
    const requestBuilder = receiverRequest(app)[method](parsed.pathname + parsed.search);
    for (const [name, headerValue] of Object.entries(options.headers ?? {})) {
      requestBuilder.set(name, String(headerValue));
    }
    if (options.body !== undefined) requestBuilder.send(options.body);
    const response = await requestBuilder;
    const headers = new Headers();
    for (const [name, headerValue] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(headerValue) ? headerValue.join(", ") : String(headerValue));
    }
    return new Response(response.text ?? "", { status: response.status, headers });
  };
  return value;
}

function assertPinnedCounterparts(receiverRoot) {
  const expectedCloudSha = process.env.CLOUD_RECEIVER_V2_CLOUD_SHA;
  const expectedConnectorSha = process.env.CLOUD_RECEIVER_V2_LOCAL_CONNECTOR_SHA;
  assert.match(
    expectedCloudSha ?? "",
    /^[0-9a-f]{40}$/,
    "CLOUD_RECEIVER_V2_CLOUD_SHA must be a full commit SHA",
  );
  assert.match(
    expectedConnectorSha ?? "",
    /^[0-9a-f]{40}$/,
    "CLOUD_RECEIVER_V2_LOCAL_CONNECTOR_SHA must be a full commit SHA",
  );

  const actualCloudSha = gitRevision(receiverRoot, ["rev-parse", "HEAD"]);
  assert.equal(actualCloudSha, expectedCloudSha, "Cloud Receiver checkout is not the supplied SHA");

  const sdkRoot = fileURLToPath(new URL("../../../", import.meta.url));
  for (const repositoryPath of [
    "runtime/local-connector/src",
    "runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs",
    "reentry-core/src/local-connector-client.mjs",
  ]) {
    const actualPathTree = gitRevision(sdkRoot, ["rev-parse", `HEAD:${repositoryPath}`]);
    const expectedPathTree = gitRevision(
      sdkRoot,
      ["rev-parse", `${expectedConnectorSha}:${repositoryPath}`],
    );
    assert.equal(
      actualPathTree,
      expectedPathTree,
      `Local Connector counterpart path changed: ${repositoryPath}`,
    );
  }
}

function gitRevision(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

async function withReceiverHandler(receiverApp, callback) {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const responses = [];
  const logs = [];
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, RECEIVER_ORIGIN);
    requests.push({ url, options: { ...options, headers: { ...(options.headers ?? {}) } } });
    const method = String(options.method ?? "GET").toLowerCase();
    const requestBuilder = harness.receiverRequest(receiverApp)[method](
      parsed.pathname + parsed.search,
    );
    for (const [name, headerValue] of Object.entries(options.headers ?? {})) {
      requestBuilder.set(name, String(headerValue));
    }
    if (options.body !== undefined) requestBuilder.send(options.body);
    const response = await requestBuilder;
    const body = response.text ?? "";
    responses.push({ status: response.status, headers: response.headers, body });
    const headers = new Headers();
    for (const [name, headerValue] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(headerValue) ? headerValue.join(", ") : String(headerValue));
    }
    return new Response(response.status === 204 ? null : body, {
      status: response.status,
      headers,
    });
  };
  console.log = (...args) => logs.push(args.join(" "));
  console.error = (...args) => logs.push(args.join(" "));
  try {
    const client = new LocalConnectorClient({
      baseUrl: RECEIVER_ORIGIN,
      connectorToken: harness.connectorToken,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
    });
    const result = await callback({ client, requests, responses, logs });
    return { result, requests, responses, logs };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function tokenFromUrl(consentUrl) {
  const token = new URL(consentUrl).searchParams.get("token");
  assert.match(token ?? "", /^[A-Za-z0-9_-]{43}$/);
  return token;
}

function isoIn(milliseconds) {
  return new Date(Date.now() + milliseconds).toISOString();
}

async function countRows(table, eventId) {
  const rows = await harness.prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "event_id" = $1`,
    eventId,
  );
  return Number(rows[0]?.count ?? 0);
}

async function readDeliveryByEvent(eventId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT row_to_json(d)::text AS row_text
    FROM "cr2_deliveries" d
    WHERE d."event_id" = ${eventId}
  `;
  assert.equal(rows.length, 1);
  return JSON.parse(rows[0].row_text);
}

async function readDelivery(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT row_to_json(d)::text AS row_text
    FROM "cr2_deliveries" d
    WHERE d."delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  return JSON.parse(rows[0].row_text);
}

async function readLeaseStart(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT "lease_started_at"
    FROM "cr2_deliveries"
    WHERE "delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  assert.ok(rows[0].lease_started_at);
  return rows[0].lease_started_at;
}

async function countAttempts(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_delivery_attempts"
    WHERE "delivery_id" = ${deliveryId}
  `;
  return Number(rows[0]?.count ?? 0n);
}

async function readDurableDeliveryText(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT CONCAT(
      row_to_json(d)::text,
      COALESCE((SELECT string_agg(row_to_json(a)::text, '')
        FROM "cr2_delivery_attempts" a
        WHERE a."delivery_id" = d."delivery_id"), '')
    ) AS row_text
    FROM "cr2_deliveries" d
    WHERE d."delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  return rows[0].row_text;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findByText(element, text) {
  if (element.textContent === text) return element;
  for (const child of element.children) {
    const found = findByText(child, text);
    if (found) return found;
  }
  return undefined;
}

class FakeDocument {
  body = new FakeElement("body");

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

class FakeElement {
  children = [];
  listeners = new Map();
  parent;
  open = false;
  textContent = "";
  className = "";
  id = "";

  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
  }

  append(...children) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  setAttribute() {}

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  remove() {
    if (this.parent === undefined) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = undefined;
  }

  click() {
    this.listeners.get("click")?.();
  }
}

class FakeWindow {
  listeners = new Map();
  popup = {
    closed: false,
    close() { this.closed = true; },
    focus() {},
  };
  openedUrl;
  outerWidth = 1_200;
  outerHeight = 900;
  screenX = 0;
  screenY = 0;

  open(url) {
    this.openedUrl = url;
    this.popup.closed = false;
    return this.popup;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  dispatchMessage(event) {
    this.listeners.get("message")?.(event);
  }

  setInterval() {
    return 1;
  }

  clearInterval() {}
}
