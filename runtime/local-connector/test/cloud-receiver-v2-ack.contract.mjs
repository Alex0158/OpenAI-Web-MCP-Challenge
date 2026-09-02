import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import test, { after, before } from "node:test";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { canonicalJson } from "../../../reentry-core/src/protocol.mjs";
import { LocalConnector } from "../src/local-connector.mjs";

// This opt-in suite is the Local Connector side of the Feature 5 handoff. It
// uses the real v2 Express handler and disposable PostgreSQL state. The normal
// Connector package suite remains runnable without a Cloud Receiver database.
const enabled = process.env.CLOUD_RECEIVER_V2_ACK_CONTRACT === "1";
const testOptions = enabled
  ? { concurrency: false }
  : { skip: "Set CLOUD_RECEIVER_V2_ACK_CONTRACT=1 with a disposable v2 database to run" };

const RECEIVER_ORIGIN = "http://127.0.0.1:4000";
const HOST_BROWSER_ORIGIN = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 5_000;

let harness;
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

before(async () => {
  if (!enabled) return;
  harness = await createHarness();
  harness.app.locals.effectAuthority = effectAuthority;
});

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

test(
  "CONNECTOR-V2-ACK-001 keeps a claimed delivery leased after adapter success without acknowledgement",
  testOptions,
  async () => {
    const fixture = await seedDelivery("ack-001");
    const claimToken = createClaimToken();
    let adapterInput;

    const captured = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      const connector = new LocalConnector({
        client,
        adapter: {
          activate(input) {
            adapterInput = input;
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
      const result = await connector.runOnce();
      assert.equal(result.status, "activation_result");
      assert.equal(result.delivery_id, fixture.deliveryId);
      assert.equal(result.result.outcome, "accepted");
      return result;
    });

    assert.equal(captured.responses[0].status, 200);
    assert.equal(await countAttempts(fixture.deliveryId), 1);
    const row = await readDelivery(fixture.deliveryId);
    assert.equal(row.status, "leased");
    assert.equal(row.acknowledged_at ?? null, null);
    assert.equal("lease_token" in adapterInput, false);
    assert.equal("connector_token" in adapterInput, false);
    assert.equal(captured.requests.length, 1);
    assert.equal(captured.requests[0].url, `${RECEIVER_ORIGIN}/v0.1/delivery-claims`);
  },
);

test(
  "CONNECTOR-V2-ACK-002 posts the exact effect-backed acknowledgement and persists no raw secret",
  testOptions,
  async () => {
    const fixture = await seedDelivery("ack-002");
    const leaseClaimToken = createClaimToken();
    const rawEffectToken = createEffectToken("ack-002");
    const leaseStartedAt = new Date();
    const attestation = validEffect(
      fixture,
      `effect-${harness.suffix}-ack-002`,
      new Date(leaseStartedAt.getTime() + 1),
    );
    effectTokens.set(rawEffectToken, attestation);

    const captured = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      const claimed = await client.claimDelivery({ claimToken: leaseClaimToken });
      assert.ok(claimed);
      const storedLeaseStart = await readLeaseStart(fixture.deliveryId);
      const exactAttestation = validEffect(
        fixture,
        attestation.effect_id,
        new Date(storedLeaseStart.getTime() + 1),
      );
      effectTokens.set(rawEffectToken, exactAttestation);

      const connector = new LocalConnector({
        client,
        adapter: { activate() { throw new Error("adapter must not run during acknowledgement"); } },
        clock: () => new Date(),
        activationTimeoutMs: REQUEST_TIMEOUT_MS,
        createClaimToken,
      });
      const acknowledged = await connector.acknowledgeDelivery({
        deliveryId: fixture.deliveryId,
        leaseToken: claimed.lease.lease_token,
        effectToken: rawEffectToken,
      });
      assert.deepEqual(acknowledged, {
        type: "webmcp.delivery_acknowledgement",
        protocol_version: "0.1",
        delivery_id: fixture.deliveryId,
        event_id: fixture.eventId,
        effect_id: exactAttestation.effect_id,
        acknowledged: true,
        duplicate: false,
        status: "acknowledged",
      });
      return { acknowledged, exactAttestation };
    });

    assert.equal(captured.responses.length, 2);
    assert.equal(captured.responses[0].status, 200);
    assert.equal(captured.responses[1].status, 200);
    assert.equal(
      captured.responses[1].body,
      canonicalJson(captured.result.acknowledged),
    );
    assert.deepEqual(Object.keys(captured.requests[1].options.headers).sort(), [
      "Accept",
      "Content-Type",
    ]);
    assert.equal(captured.requests[1].options.method, "POST");
    assert.equal(captured.requests[1].options.cache, "no-store");
    assert.equal(captured.requests[1].options.credentials, "omit");
    assert.equal(captured.requests[1].options.redirect, "manual");
    assert.deepEqual(JSON.parse(captured.requests[1].options.body), {
      connector_token: fixture.connector.token,
      delivery_id: fixture.deliveryId,
      lease_token: leaseClaimToken,
      effect_token: rawEffectToken,
    });
    assert.equal("Authorization" in captured.requests[1].options.headers, false);
    assert.equal("Cookie" in captured.requests[1].options.headers, false);

    const authorityCall = authorityCalls.at(-1);
    assert.equal(authorityCall.effectToken, rawEffectToken);
    assert.deepEqual(authorityCall.expected, {
      delivery_id: fixture.deliveryId,
      event_id: fixture.eventId,
      correlation_id: fixture.correlationId,
      workflow_id: fixture.workflowId,
      canonical_url: fixture.canonicalUrl,
      human_boundary: fixture.humanBoundary,
      outcome: "effect_applied_awaiting_human",
    });

    const row = await readDelivery(fixture.deliveryId);
    assert.equal(row.status, "acknowledged");
    assert.equal(row.effect_id, captured.result.exactAttestation.effect_id);
    assert.match(row.effect_attestation_json, /host_effect_attestation/);
    assert.doesNotMatch(row.effect_attestation_json, new RegExp(escapeRegExp(rawEffectToken)));
    assert.doesNotMatch(captured.responses[1].body, new RegExp(escapeRegExp(rawEffectToken)));
    assert.doesNotMatch(captured.logs.join("\n"), new RegExp(escapeRegExp(rawEffectToken)));
    const durable = await readDurableDeliveryText(fixture.deliveryId);
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(fixture.connector.token)));
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(leaseClaimToken)));
    assert.doesNotMatch(durable, new RegExp(escapeRegExp(rawEffectToken)));
  },
);

test(
  "CONNECTOR-V2-ACK-003 rejects invalid, future, revoked, stale, and unsupported effects without mutation",
  testOptions,
  async () => {
    const fixture = await seedDelivery("ack-003");
    const leaseToken = createClaimToken();
    const captured = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      const claimed = await client.claimDelivery({ claimToken: leaseToken });
      assert.ok(claimed);
      const baseline = await readDelivery(fixture.deliveryId);

      const invalidEffectToken = createEffectToken("ack-003-invalid");
      await assert.rejects(
        client.acknowledgeDelivery({
          deliveryId: fixture.deliveryId,
          leaseToken,
          effectToken: invalidEffectToken,
        }),
        (error) => error?.code === "host_effect_invalid" && error?.statusCode === 403,
      );
      assert.deepEqual(await readDelivery(fixture.deliveryId), baseline);

      const futureEffectToken = createEffectToken("ack-003-future");
      effectTokens.set(
        futureEffectToken,
        validEffect(
          fixture,
          `effect-${harness.suffix}-ack-003-future`,
          new Date(Date.now() + 60 * 60 * 1_000),
        ),
      );
      await assert.rejects(
        client.acknowledgeDelivery({
          deliveryId: fixture.deliveryId,
          leaseToken,
          effectToken: futureEffectToken,
        }),
        (error) => error?.code === "host_effect_invalid" && error?.statusCode === 403,
      );
      assert.equal((await readDelivery(fixture.deliveryId)).status, "leased");

      const revokedEffectToken = createEffectToken("ack-003-revoked");
      const revocation = await harness.revokeGrantInternally({
        grantId: fixture.grantId,
        controlToken: harness.appConfig.grantControlToken,
      });
      effectTokens.set(
        revokedEffectToken,
        validEffect(
          fixture,
          `effect-${harness.suffix}-ack-003-revoked`,
          new Date(Date.parse(revocation.revokedAt) + 1),
        ),
      );
      await assert.rejects(
        client.acknowledgeDelivery({
          deliveryId: fixture.deliveryId,
          leaseToken,
          effectToken: revokedEffectToken,
        }),
        (error) => error?.code === "host_effect_time_invalid" && error?.statusCode === 403,
      );
      assert.equal((await readDelivery(fixture.deliveryId)).status, "leased");

      const staleFixture = await seedDelivery("ack-003-stale");
      const staleLeaseToken = createClaimToken();
      const staleClaim = await clientFor(harness.app, staleFixture.connector.token)
        .claimDelivery({ claimToken: staleLeaseToken });
      assert.ok(staleClaim);
      await expireLease(staleFixture.deliveryId);
      const freshLeaseToken = createClaimToken();
      const freshClaim = await clientFor(harness.app, staleFixture.connector.token)
        .claimDelivery({ claimToken: freshLeaseToken });
      assert.ok(freshClaim);
      const staleEffectToken = createEffectToken("ack-003-stale");
      effectTokens.set(
        staleEffectToken,
        validEffect(
          staleFixture,
          `effect-${harness.suffix}-ack-003-stale`,
          new Date(),
        ),
      );
      await assert.rejects(
        clientFor(harness.app, staleFixture.connector.token).acknowledgeDelivery({
          deliveryId: staleFixture.deliveryId,
          leaseToken: staleLeaseToken,
          effectToken: staleEffectToken,
        }),
        (error) => error?.code === "delivery_lease_invalid" && error?.statusCode === 403,
      );
      assert.equal((await readDelivery(staleFixture.deliveryId)).status, "leased");
      return { baseline };
    });

    const unsupportedApp = harness.createApp();
    const unsupportedToken = createEffectToken("ack-003-unsupported");
    const unsupported = await withReceiverHandler(
      unsupportedApp,
      fixture.connector.token,
      async ({ client }) => {
        await assert.rejects(
          client.acknowledgeDelivery({
            deliveryId: fixture.deliveryId,
            leaseToken,
            effectToken: unsupportedToken,
          }),
          (error) => error?.code === "host_effect_authority_unavailable" && error?.statusCode === 501,
        );
      },
    );
    assert.equal((await readDelivery(fixture.deliveryId)).status, "leased");
    assert.ok(captured.responses.some((response) => response.status === 403));
    assert.equal(unsupported.responses[0].status, 501);
  },
);

test(
  "CONNECTOR-V2-ACK-004 replays the identical acknowledgement after app restart without a second transition",
  testOptions,
  async () => {
    const fixture = await seedDelivery("ack-004");
    const leaseToken = createClaimToken();
    const rawEffectToken = createEffectToken("ack-004");
    const attestation = validEffect(
      fixture,
      `effect-${harness.suffix}-ack-004`,
      new Date(Date.now() + 1),
    );
    effectTokens.set(rawEffectToken, attestation);

    const first = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      const claimed = await client.claimDelivery({ claimToken: leaseToken });
      assert.ok(claimed);
      const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
      effectTokens.set(
        rawEffectToken,
        validEffect(fixture, attestation.effect_id, new Date(leaseStartedAt.getTime() + 1)),
      );
      return client.acknowledgeDelivery({
        deliveryId: fixture.deliveryId,
        leaseToken,
        effectToken: rawEffectToken,
      });
    });
    assert.equal(first.result.duplicate, false);

    const restartedApp = harness.createApp();
    restartedApp.locals.effectAuthority = effectAuthority;
    const replay = await withReceiverHandler(restartedApp, fixture.connector.token, async ({ client }) => (
      client.acknowledgeDelivery({
        deliveryId: fixture.deliveryId,
        leaseToken,
        effectToken: rawEffectToken,
      })
    ));

    assert.equal(replay.result.duplicate, true);
    assert.deepEqual(replay.result, { ...first.result, duplicate: true });
    assert.equal((await readDelivery(fixture.deliveryId)).status, "acknowledged");
    assert.equal((await readDelivery(fixture.deliveryId)).current_attempt, 1);
    assert.equal(await countAttempts(fixture.deliveryId), 1);
    assert.doesNotMatch(replay.responses[0].body, new RegExp(escapeRegExp(rawEffectToken)));
    assert.doesNotMatch(replay.logs.join("\n"), new RegExp(escapeRegExp(rawEffectToken)));
  },
);

test(
  "CONNECTOR-V2-ACK-005 rejects a wrong Connector and different effect while preserving the original acknowledgement",
  testOptions,
  async () => {
    const fixture = await seedDelivery("ack-005");
    const other = await createConnector("ack-005-other");
    const leaseToken = createClaimToken();
    const firstEffectToken = createEffectToken("ack-005-first");
    const secondEffectToken = createEffectToken("ack-005-second");
    const firstEffect = validEffect(
      fixture,
      `effect-${harness.suffix}-ack-005-first`,
      new Date(Date.now() + 1),
    );
    const secondEffect = validEffect(
      fixture,
      `effect-${harness.suffix}-ack-005-second`,
      new Date(Date.now() + 2),
    );
    effectTokens.set(firstEffectToken, firstEffect);
    effectTokens.set(secondEffectToken, secondEffect);

    const first = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      const claimed = await client.claimDelivery({ claimToken: leaseToken });
      assert.ok(claimed);
      const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
      effectTokens.set(
        firstEffectToken,
        validEffect(fixture, firstEffect.effect_id, new Date(leaseStartedAt.getTime() + 1)),
      );
      effectTokens.set(
        secondEffectToken,
        validEffect(fixture, secondEffect.effect_id, new Date(leaseStartedAt.getTime() + 2)),
      );
      return client.acknowledgeDelivery({
        deliveryId: fixture.deliveryId,
        leaseToken,
        effectToken: firstEffectToken,
      });
    });
    assert.equal(first.result.duplicate, false);

    const wrongConnector = await withReceiverHandler(harness.app, other.token, async ({ client }) => {
      await assert.rejects(
        client.acknowledgeDelivery({
          deliveryId: fixture.deliveryId,
          leaseToken,
          effectToken: firstEffectToken,
        }),
        (error) => error?.code === "connector_delivery_scope_invalid" && error?.statusCode === 403,
      );
    });
    assert.equal(wrongConnector.responses[0].status, 403);

    const conflict = await withReceiverHandler(harness.app, fixture.connector.token, async ({ client }) => {
      await assert.rejects(
        client.acknowledgeDelivery({
          deliveryId: fixture.deliveryId,
          leaseToken,
          effectToken: secondEffectToken,
        }),
        (error) => error?.code === "delivery_effect_conflict" && error?.statusCode === 409,
      );
    });
    assert.equal(conflict.responses[0].status, 409);
    const row = await readDelivery(fixture.deliveryId);
    assert.equal(row.status, "acknowledged");
    assert.equal(row.effect_id, firstEffect.effect_id);
    assert.doesNotMatch(conflict.responses[0].body, new RegExp(escapeRegExp(firstEffectToken)));
    assert.doesNotMatch(conflict.responses[0].body, new RegExp(escapeRegExp(secondEffectToken)));
  },
);

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
  const receiverRequest = require(path.join(receiverRoot, "node_modules/supertest"));
  const app = createApp();
  const userAgent = receiverRequest.agent(app);
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const userEmail = `connector-ack-user-${suffix}@example.com`;
  const developerEmail = `connector-ack-developer-${suffix}@example.com`;
  const password = "correct horse battery staple";

  appConfig.receiverPublicUrl = RECEIVER_ORIGIN;
  appConfig.frontendUrl = HOST_BROWSER_ORIGIN;
  await clearTestAccounts(userEmail);
  await clearTestAccounts(developerEmail);

  const user = await userAgent
    .post("/v1/auth/users/register")
    .send({ email: userEmail, password });
  assert.equal(user.status, 201);
  const developer = await receiverRequest(app)
    .post("/v1/auth/developers/register")
    .send({ email: developerEmail, password });
  assert.equal(developer.status, 201);
  const organization = await prisma.organization.create({
    data: { developerId: developer.body.data.id, name: `Connector Ack ${suffix}` },
  });

  return {
    app,
    createApp,
    appConfig,
    digestSecret,
    prisma,
    receiverRequest,
    userAgent,
    suffix,
    accountId: user.body.data.id,
    organizationId: organization.id,
    userEmail,
    developerEmail,
    clearTestAccounts,
    revokeGrantInternally,
  };
}

async function createConnector(label) {
  const pairing = await harness.userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", HOST_BROWSER_ORIGIN)
    .set("Content-Type", "application/json")
    .send({});
  assert.equal(pairing.status, 201);

  const claimed = await harness.receiverRequest(harness.app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: `Ack Connector ${label}` });
  assert.equal(claimed.status, 200);

  const connector = await harness.prisma.connector.findUnique({
    where: { id: claimed.body.connector_id },
    select: { id: true, accountId: true, deliveryTargetId: true, expiresAt: true },
  });
  assert.ok(connector);
  return {
    id: connector.id,
    accountId: connector.accountId,
    token: claimed.body.connector_token,
    deliveryTargetId: connector.deliveryTargetId,
    expiresAt: connector.expiresAt,
  };
}

async function seedDelivery(label) {
  const connector = await createConnector(label);
  const eventId = `event-${harness.suffix}-${label}`;
  const bindingId = randomUUID();
  const correlationId = `correlation-${harness.suffix}-${label}`;
  const workflowId = `workflow-${harness.suffix}-${label}`;
  const eventType = "workflow.ready";
  const canonicalUrl = `${HOST_BROWSER_ORIGIN}/workflows/${label}`;
  const occurredAt = new Date(Date.now() - 1_000).toISOString();
  const event = {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: eventId,
    correlation_id: correlationId,
    binding_id: bindingId,
    issuer_origin: HOST_BROWSER_ORIGIN,
    workflow_id: workflowId,
    event_type: eventType,
    event_sequence: 1,
    state_version: 2,
    occurred_at: occurredAt,
    canonical_url: canonicalUrl,
  };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60_000);
  const subject = `subject-${harness.suffix}-${label}`;

  await harness.prisma.hostSubjectBinding.create({
    data: {
      id: bindingId,
      organizationId: harness.organizationId,
      hostSubjectRefDigest: harness.digestSecret(subject),
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });
  const consentSession = await harness.prisma.consentSession.create({
    data: {
      id: `consent-${harness.suffix}-${label}`,
      challengeId: `challenge-${harness.suffix}-${label}`,
      tokenDigest: harness.digestSecret(`consent-token-${harness.suffix}-${label}`),
      organizationId: harness.organizationId,
      hostSubjectRefDigest: harness.digestSecret(subject),
      expectedOrigin: HOST_BROWSER_ORIGIN,
      manifestId: `manifest-${harness.suffix}-${label}`,
      manifestJson: { fixture: label },
      expiresAt,
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId: harness.accountId,
    },
  });
  const grant = await harness.prisma.grant.create({
    data: {
      consentSessionId: consentSession.id,
      organizationId: harness.organizationId,
      bindingId,
      accountId: harness.accountId,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
      correlationId,
      issuerOrigin: HOST_BROWSER_ORIGIN,
      workflowId,
      workflowType: "review",
      canonicalUrl,
      eventType,
      humanBoundary: "explicit_receiver_consent",
      expiresAt,
      maxRuns: 1,
      runsRemaining: 0,
    },
  });
  const storedEvent = await harness.prisma.event.create({
    data: {
      eventId,
      grantId: grant.id,
      bindingId,
      correlationId,
      issuerOrigin: HOST_BROWSER_ORIGIN,
      workflowId,
      eventType,
      eventSequence: 1,
      stateVersion: BigInt(event.state_version),
      occurredAt: new Date(occurredAt),
      canonicalUrl,
      canonicalBody: canonicalJson(event),
      receivedAt: now,
    },
  });
  const delivery = await harness.prisma.delivery.create({
    data: {
      eventId: storedEvent.eventId,
      grantId: grant.id,
      deliveryTargetId: connector.deliveryTargetId,
      status: "pending",
      createdAt: now,
    },
  });

  return {
    deliveryId: delivery.deliveryId,
    eventId,
    grantId: grant.id,
    connector,
    correlationId,
    bindingId,
    workflowId,
    canonicalUrl,
    humanBoundary: "explicit_receiver_consent",
  };
}

async function withReceiverHandler(receiverApp, connectorToken, callback) {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalError = console.error;
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
    for (const [name, value] of Object.entries(options.headers ?? {})) {
      requestBuilder.set(name, String(value));
    }
    if (options.body !== undefined) requestBuilder.send(options.body);
    const response = await requestBuilder;
    const body = response.text ?? "";
    responses.push({ status: response.status, headers: response.headers, body });
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }
    return new Response(response.status === 204 ? null : body, {
      status: response.status,
      headers,
    });
  };
  console.log = (...args) => logs.push(args.join(" "));
  console.error = (...args) => logs.push(args.join(" "));
  try {
    const result = await callback({
      client: clientFor(receiverApp, connectorToken),
    });
    return { result, requests, responses, logs };
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
  }
}

function clientFor(receiverApp, connectorToken) {
  assert.ok(receiverApp);
  return new LocalConnectorClient({
    baseUrl: RECEIVER_ORIGIN,
    connectorToken,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  });
}

function createClaimToken() {
  return randomBytes(32).toString("base64url");
}

function createEffectToken(label) {
  return `effect-token-${label}-${randomBytes(16).toString("base64url")}`;
}

function validEffect(fixture, effectId, confirmedAt) {
  return {
    type: "webmcp.host_effect_attestation",
    protocol_version: "0.1",
    effect_id: effectId,
    delivery_id: fixture.deliveryId,
    event_id: fixture.eventId,
    correlation_id: fixture.correlationId,
    workflow_id: fixture.workflowId,
    outcome: "effect_applied_awaiting_human",
    confirmed_at: confirmedAt.toISOString(),
  };
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

async function readDelivery(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT row_to_json(d)::text AS row_text
    FROM "cr2_deliveries" d
    WHERE d."delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  return JSON.parse(rows[0].row_text);
}

async function countAttempts(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_delivery_attempts"
    WHERE "delivery_id" = ${deliveryId}
  `;
  return Number(rows[0]?.count ?? 0n);
}

async function expireLease(deliveryId) {
  await harness.prisma.$executeRaw`
    UPDATE "cr2_deliveries"
    SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
    WHERE "delivery_id" = ${deliveryId}
  `;
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
