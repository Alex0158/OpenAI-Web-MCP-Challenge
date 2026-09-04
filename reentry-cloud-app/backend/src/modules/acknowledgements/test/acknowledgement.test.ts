import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { createApp } from "../../../app";
import { appConfig } from "../../../config/config";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { clearTestAccounts } from "../../../test/helper";
import { revokeGrantInternally } from "../../consent/grant-control";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const userEmail = `ack-user-${suffix}@example.com`;
const developerEmail = `ack-developer-${suffix}@example.com`;
const password = "correct horse battery staple";
const origin = `https://ack-host-${suffix}.example`;
const userAgent = request.agent(app);

type JsonObject = Record<string, any>;
type EffectAttestation = {
  type: "webmcp.host_effect_attestation";
  protocol_version: "0.1";
  effect_id: string;
  delivery_id: string;
  event_id: string;
  correlation_id: string;
  workflow_id: string;
  outcome: "effect_applied_awaiting_human";
  confirmed_at: string;
};
type Connector = {
  id: string;
  token: string;
  deliveryTargetId: string;
  expiresAt: Date;
};
type DeliveryFixture = {
  deliveryId: string;
  grantId: string;
  eventId: string;
  connector: Connector;
  correlationId: string;
  bindingId: string;
  workflowId: string;
  canonicalUrl: string;
  humanBoundary: string;
  instruction: string;
};

const effectTokens = new Map<string, EffectAttestation | (() => EffectAttestation)>();
const authorityCalls: Array<{ effectToken: string; expected: Record<string, string> }> = [];

const effectAuthority = {
  verifyEffect({ effectToken, expected }: { effectToken: string; expected: Record<string, string> }) {
    authorityCalls.push({ effectToken, expected: { ...expected } });
    const value = effectTokens.get(effectToken);
    if (!value) throw new Error("effect token is unknown");
    return typeof value === "function" ? value() : value;
  },
};

// The authority is injected only by the test composition. It has no token
// format or production credential behavior.
app.locals.effectAuthority = effectAuthority;

let accountId = "";
let organizationId = "";

function claimToken(fill = 7): string {
  return Buffer.alloc(32, fill).toString("base64url");
}

function expectExactKeys(value: JsonObject, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function effectToken(label: string): string {
  return `effect-${label}-${randomBytes(16).toString("base64url")}`;
}

async function createConnector(label: string): Promise<Connector> {
  const pairing = await userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({});
  expect(pairing.status).toBe(201);

  const claimed = await request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: `Ack ${label}` });
  expect(claimed.status).toBe(200);

  const connector = await prisma.connector.findUnique({
    where: { id: claimed.body.connector_id },
    select: { id: true, deliveryTargetId: true, expiresAt: true },
  });
  expect(connector).not.toBeNull();
  return {
    id: connector?.id as string,
    token: claimed.body.connector_token as string,
    deliveryTargetId: connector?.deliveryTargetId as string,
    expiresAt: connector?.expiresAt as Date,
  };
}

async function seedDelivery(label: string): Promise<DeliveryFixture> {
  const connector = await createConnector(label);
  const bindingId = randomUUID();
  const eventId = `event-ack-${label}-${suffix}`;
  const correlationId = `correlation-ack-${label}-${suffix}`;
  const workflowId = `workflow-ack-${label}-${suffix}`;
  const canonicalUrl = `${origin}/workflows/${label}`;
  const humanBoundary = "explicit_receiver_consent";
  const instruction = `Continue the ${label} workflow.`;
  const now = new Date();
  const occurredAt = new Date(now.getTime() - 1_000);
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1_000);
  const subject = `subject-ack-${label}-${suffix}`;
  const event = {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: eventId,
    correlation_id: correlationId,
    binding_id: bindingId,
    issuer_origin: origin,
    workflow_id: workflowId,
    event_type: "review.requested",
    event_sequence: 1,
    state_version: 1,
    occurred_at: occurredAt.toISOString(),
    canonical_url: canonicalUrl,
  };

  await prisma.hostSubjectBinding.create({
    data: {
      id: bindingId,
      organizationId,
      hostSubjectRefDigest: digestSecret(subject),
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });
  const consent = await prisma.consentSession.create({
    data: {
      id: `consent-ack-${label}-${suffix}`,
      challengeId: `challenge-ack-${label}-${suffix}`,
      tokenDigest: digestSecret(`consent-token-ack-${label}-${suffix}`),
      organizationId,
      hostSubjectRefDigest: digestSecret(subject),
      expectedOrigin: origin,
      manifestId: `manifest-ack-${label}-${suffix}`,
      manifestJson: {
        type: "webmcp.reentry_manifest",
        protocol_version: "0.1",
        manifest_id: `manifest-ack-${label}-${suffix}`,
        correlation_id: correlationId,
        issuer_origin: origin,
        issued_at: new Date(now.getTime() - 60_000).toISOString(),
        offer_expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
        workflow: {
          id: workflowId,
          type: "review",
          state_version: 0,
          canonical_url: canonicalUrl,
        },
        display: {
          title: `Continue ${label}`,
          reason: instruction,
        },
        grant_request: {
          event_type: "review.requested",
          grant_expires_at: expiresAt.toISOString(),
          max_runs: 1,
          human_boundary: humanBoundary,
        },
        signature: {
          algorithm: "Ed25519",
          key_id: `host-key-${label}`,
          value: Buffer.alloc(64, 7).toString("base64url"),
        },
      },
      expiresAt,
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId,
    },
  });
  const grant = await prisma.grant.create({
    data: {
      consentSessionId: consent.id,
      organizationId,
      bindingId,
      accountId,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
      correlationId,
      issuerOrigin: origin,
      workflowId,
      workflowType: "review",
      canonicalUrl,
      eventType: "review.requested",
      humanBoundary,
      expiresAt,
      maxRuns: 1,
      runsRemaining: 0,
    },
  });
  const storedEvent = await prisma.event.create({
    data: {
      eventId,
      grantId: grant.id,
      bindingId,
      correlationId,
      issuerOrigin: origin,
      workflowId,
      eventType: "review.requested",
      eventSequence: 1,
      stateVersion: BigInt(1),
      occurredAt,
      canonicalUrl,
      canonicalBody: canonicalJson(event),
      receivedAt: now,
    },
  });
  const delivery = await prisma.delivery.create({
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
    grantId: grant.id,
    eventId,
    connector,
    correlationId,
    bindingId,
    workflowId,
    canonicalUrl,
    humanBoundary,
    instruction,
  };
}

async function postClaim(fixture: DeliveryFixture, token = claimToken()): Promise<request.Response> {
  return request(app)
    .post("/v0.1/delivery-claims")
    .set("Content-Type", "application/json")
    .send({ connector_token: fixture.connector.token, claim_token: token });
}

async function readLeaseStart(deliveryId: string): Promise<Date> {
  const rows = await prisma.$queryRaw<Array<{ lease_started_at: Date | null }>>`
    SELECT "lease_started_at"
    FROM "cr2_deliveries"
    WHERE "delivery_id" = ${deliveryId}
  `;
  expect(rows).toHaveLength(1);
  expect(rows[0].lease_started_at).not.toBeNull();
  return rows[0].lease_started_at as Date;
}

async function readDeliveryRow(deliveryId: string): Promise<JsonObject> {
  const rows = await prisma.$queryRaw<Array<{ row_text: string }>>`
    SELECT row_to_json(d)::text AS row_text
    FROM "cr2_deliveries" d
    WHERE d."delivery_id" = ${deliveryId}
  `;
  expect(rows).toHaveLength(1);
  return JSON.parse(rows[0].row_text);
}

function validEffect(fixture: DeliveryFixture, effectId: string, confirmedAt: Date): EffectAttestation {
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

async function postAcknowledgement(
  fixture: DeliveryFixture,
  leaseToken: string,
  effectTokenValue: string,
  receiverApp = app
): Promise<request.Response> {
  return request(receiverApp)
    .post("/v0.1/delivery-acknowledgements")
    .set("Content-Type", "application/json")
    .send({
      connector_token: fixture.connector.token,
      delivery_id: fixture.deliveryId,
      lease_token: leaseToken,
      effect_token: effectTokenValue,
    });
}

describe("Cloud Receiver v2 delivery acknowledgement red tests", () => {
  beforeAll(async () => {
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
    const user = await userAgent.post("/v1/auth/users/register").send({ email: userEmail, password });
    expect(user.status).toBe(201);
    accountId = user.body.data.id as string;

    const developer = await request(app)
      .post("/v1/auth/developers/register")
      .send({ email: developerEmail, password });
    expect(developer.status).toBe(201);
    const organization = await prisma.organization.create({
      data: { developerId: developer.body.data.id as string, name: `Ack Org ${suffix}` },
    });
    organizationId = organization.id;
  });

  afterAll(async () => {
    if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } });
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
  });

  it("ACK-001 keeps a claimed delivery LEASED when the adapter succeeds without acknowledgement", async () => {
    const fixture = await seedDelivery("001");
    const claimed = await postClaim(fixture, claimToken(1));
    expect(claimed.status).toBe(200);
    expect(claimed.body.lease.continuation.instruction).toBe(fixture.instruction);
    const row = await readDeliveryRow(fixture.deliveryId);
    expect(row.status).toBe("leased");
    expect(row.acknowledged_at ?? null).toBeNull();
  });

  it("ACK-002 verifies exact Host-effect context and atomically acknowledges one lease", async () => {
    const fixture = await seedDelivery("002");
    const leaseToken = claimToken(2);
    const claimed = await postClaim(fixture, leaseToken);
    expect(claimed.status).toBe(200);
    const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
    const token = effectToken("002");
    const attestation = validEffect(fixture, `effect-002-${suffix}`, new Date(leaseStartedAt.getTime() + 1));
    effectTokens.set(token, attestation);

    const acknowledged = await postAcknowledgement(fixture, leaseToken, token);
    expect(acknowledged.status).toBe(200);
    expect(acknowledged.text).toBe(canonicalJson(acknowledged.body));
    expect(acknowledged.body).toEqual({
      type: "webmcp.delivery_acknowledgement",
      protocol_version: "0.1",
      delivery_id: fixture.deliveryId,
      event_id: fixture.eventId,
      effect_id: attestation.effect_id,
      acknowledged: true,
      duplicate: false,
      status: "acknowledged",
    });
    expect(acknowledged.text).not.toContain(fixture.connector.token);
    expect(acknowledged.text).not.toContain(leaseToken);
    expect(acknowledged.text).not.toContain(token);
    const call = authorityCalls.at(-1);
    expect(call?.effectToken).toBe(token);
    expect(call?.expected).toEqual({
      delivery_id: fixture.deliveryId,
      event_id: fixture.eventId,
      correlation_id: fixture.correlationId,
      workflow_id: fixture.workflowId,
      canonical_url: fixture.canonicalUrl,
      human_boundary: fixture.humanBoundary,
      outcome: "effect_applied_awaiting_human",
    });
    const row = await readDeliveryRow(fixture.deliveryId);
    expect(row.status).toBe("acknowledged");
    expect(row.effect_id).toBe(attestation.effect_id);
    expect(row.effect_attestation_json).toContain(attestation.effect_id);
    expect(row.effect_attestation_json).not.toContain(token);
  });

  it("ACK-003 rejects invalid, future, post-revocation, stale, and unsupported effects without mutation", async () => {
    const fixture = await seedDelivery("003");
    const leaseToken = claimToken(3);
    const claimed = await postClaim(fixture, leaseToken);
    expect(claimed.status).toBe(200);
    const baseline = await readDeliveryRow(fixture.deliveryId);

    const invalidToken = effectToken("003-invalid");
    await expect(postAcknowledgement(fixture, leaseToken, invalidToken)).resolves.toMatchObject({
      status: 403,
      body: { error: { code: "host_effect_invalid" } },
    });
    expect((await readDeliveryRow(fixture.deliveryId)).status).toBe(baseline.status);

    const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
    const futureToken = effectToken("003-future");
    effectTokens.set(futureToken, validEffect(fixture, `effect-003-future-${suffix}`, new Date(Date.now() + 2 * 60 * 60 * 1_000)));
    const future = await postAcknowledgement(fixture, leaseToken, futureToken);
    expect(future.status).toBe(403);
    expect(future.body).toEqual({ error: { code: "host_effect_invalid" } });

    const revokeToken = effectToken("003-revoked");
    const revocation = await revokeGrantInternally({
      grantId: fixture.grantId,
      controlToken: appConfig.grantControlToken as string,
    });
    effectTokens.set(
      revokeToken,
      validEffect(
        fixture,
        `effect-003-revoked-${suffix}`,
        new Date(Date.parse(revocation.revokedAt) + 1)
      )
    );
    const revoked = await postAcknowledgement(fixture, leaseToken, revokeToken);
    expect(revoked.status).toBe(403);
    expect(revoked.body).toEqual({ error: { code: "host_effect_time_invalid" } });

    const staleFixture = await seedDelivery("003-stale");
    const staleLeaseToken = claimToken(31);
    const staleClaim = await postClaim(staleFixture, staleLeaseToken);
    expect(staleClaim.status).toBe(200);
    await prisma.$executeRaw`
      UPDATE "cr2_deliveries"
      SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
      WHERE "delivery_id" = ${staleFixture.deliveryId}
    `;
    const freshClaim = await postClaim(staleFixture, claimToken(32));
    expect(freshClaim.status).toBe(200);
    const staleEffectToken = effectToken("003-stale");
    effectTokens.set(staleEffectToken, validEffect(staleFixture, `effect-003-stale-${suffix}`, new Date()));
    const stale = await postAcknowledgement(staleFixture, staleLeaseToken, staleEffectToken);
    expect(stale.status).toBe(403);
    expect(stale.body).toEqual({ error: { code: "delivery_lease_invalid" } });

    const unsupportedApp = createApp();
    const unsupported = await postAcknowledgement(fixture, leaseToken, invalidToken, unsupportedApp);
    expect(unsupported.status).toBe(501);
    expect(unsupported.body).toEqual({ error: { code: "host_effect_authority_unavailable" } });
    expect((await readDeliveryRow(fixture.deliveryId)).status).toBe("leased");
  });

  it("ACK-004 replays the identical acknowledgement after app recomposition without a second transition", async () => {
    const fixture = await seedDelivery("004");
    const leaseToken = claimToken(4);
    const claimed = await postClaim(fixture, leaseToken);
    expect(claimed.status).toBe(200);
    const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
    const token = effectToken("004");
    const attestation = validEffect(fixture, `effect-004-${suffix}`, new Date(leaseStartedAt.getTime() + 1));
    effectTokens.set(token, attestation);

    const first = await postAcknowledgement(fixture, leaseToken, token);
    expect(first.status).toBe(200);
    const restartedApp = createApp();
    restartedApp.locals.effectAuthority = effectAuthority;
    const replay = await postAcknowledgement(fixture, leaseToken, token, restartedApp);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ ...first.body, duplicate: true });
    const row = await readDeliveryRow(fixture.deliveryId);
    expect(row.status).toBe("acknowledged");
    expect(row.effect_id).toBe(attestation.effect_id);
  });

  it("ACK-005 rejects another Connector and a different effect while preserving the original acknowledgement", async () => {
    const fixture = await seedDelivery("005");
    const other = await createConnector("005-other");
    const leaseToken = claimToken(5);
    const claimed = await postClaim(fixture, leaseToken);
    expect(claimed.status).toBe(200);
    const leaseStartedAt = await readLeaseStart(fixture.deliveryId);
    const firstToken = effectToken("005-first");
    const firstEffect = validEffect(fixture, `effect-005-first-${suffix}`, new Date(leaseStartedAt.getTime() + 1));
    effectTokens.set(firstToken, firstEffect);
    const first = await postAcknowledgement(fixture, leaseToken, firstToken);
    expect(first.status).toBe(200);

    const wrongConnector = await request(app)
      .post("/v0.1/delivery-acknowledgements")
      .set("Content-Type", "application/json")
      .send({
        connector_token: other.token,
        delivery_id: fixture.deliveryId,
        lease_token: leaseToken,
        effect_token: firstToken,
      });
    expect(wrongConnector.status).toBe(403);
    expect(wrongConnector.body).toEqual({ error: { code: "connector_delivery_scope_invalid" } });

    const secondToken = effectToken("005-second");
    effectTokens.set(secondToken, validEffect(fixture, `effect-005-second-${suffix}`, new Date(leaseStartedAt.getTime() + 2)));
    const conflict = await postAcknowledgement(fixture, leaseToken, secondToken);
    expect(conflict.status).toBe(409);
    expect(conflict.body).toEqual({ error: { code: "delivery_effect_conflict" } });
    expect((await readDeliveryRow(fixture.deliveryId)).effect_id).toBe(firstEffect.effect_id);
    expect(JSON.stringify(conflict.body)).not.toContain(firstToken);
    expect(JSON.stringify(conflict.body)).not.toContain(secondToken);
  });
});
