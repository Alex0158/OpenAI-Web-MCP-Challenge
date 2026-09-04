import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { clearTestAccounts } from "../../../test/helper";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const userEmail = `claim-user-${suffix}@example.com`;
const developerEmail = `claim-developer-${suffix}@example.com`;
const password = "correct horse battery staple";
const origin = `https://claim-host-${suffix}.example`;

const userAgent = request.agent(app);
let organizationId = "";
let accountId = "";

type JsonObject = Record<string, any>;

type ConnectorFixture = {
  id: string;
  token: string;
  deliveryTargetId: string;
  expiresAt: Date;
};

type DeliveryFixture = {
  deliveryId: string;
  grantId: string;
  eventId: string;
  instruction: string;
  connector: ConnectorFixture;
  event: {
    correlation_id: string;
    binding_id: string;
    issuer_origin: string;
    workflow_id: string;
    event_type: string;
    event_sequence: 1;
    state_version: number;
    occurred_at: string;
    canonical_url: string;
  };
};

type DeliveryState = {
  status: string;
  current_attempt: number;
  current_claim_token_digest: string | null;
  lease_expires_at: Date | null;
};

function claimToken(): string {
  return randomBytes(32).toString("base64url");
}

function expectExactKeys(value: JsonObject, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function expectNoWork(response: request.Response): void {
  expect(response.status).toBe(204);
  expect(response.text ?? "").toBe("");
  expect(response.headers["content-type"]).toBeUndefined();
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers["content-length"]).toBe("0");
}

async function createConnector(deviceName: string): Promise<ConnectorFixture> {
  const pairing = await userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({});
  expect(pairing.status).toBe(201);

  const claimed = await request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: deviceName });
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

async function seedDelivery(label: string, connector: ConnectorFixture): Promise<DeliveryFixture> {
  const eventId = `event-${label}-${suffix}`;
  const bindingId = randomUUID();
  const correlationId = `correlation-${label}-${suffix}`;
  const workflowId = `workflow-${label}-${suffix}`;
  const eventType = `review.${label}`;
  const canonicalUrl = `${origin}/workflows/${label}`;
  const occurredAt = new Date(Date.now() - 1_000).toISOString();
  const event = {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: eventId,
    correlation_id: correlationId,
    binding_id: bindingId,
    issuer_origin: origin,
    workflow_id: workflowId,
    event_type: eventType,
    event_sequence: 1 as const,
    state_version: 4,
    occurred_at: occurredAt,
    canonical_url: canonicalUrl,
  };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1_000);
  const instruction = `Continue the ${label} workflow.`;
  const manifestJson = {
    type: "webmcp.reentry_manifest",
    protocol_version: "0.1",
    manifest_id: `manifest-${label}-${suffix}`,
    correlation_id: correlationId,
    issuer_origin: origin,
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    offer_expires_at: new Date(now.getTime() + 10 * 60 * 1_000).toISOString(),
    workflow: {
      id: workflowId,
      type: "review",
      state_version: event.state_version,
      canonical_url: canonicalUrl,
    },
    display: {
      title: "Review continuation",
      reason: instruction,
    },
    grant_request: {
      event_type: eventType,
      grant_expires_at: expiresAt.toISOString(),
      max_runs: 1,
      human_boundary: "explicit_receiver_consent",
    },
    signature: {
      algorithm: "Ed25519",
      key_id: "fixture-key",
      value: "A".repeat(86),
    },
  };

  await prisma.hostSubjectBinding.create({
    data: {
      id: bindingId,
      organizationId,
      hostSubjectRefDigest: digestSecret(`subject-${label}-${suffix}`),
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });

  const consentSession = await prisma.consentSession.create({
    data: {
      id: `consent-${label}-${suffix}`,
      challengeId: `challenge-${label}-${suffix}`,
      tokenDigest: digestSecret(`consent-token-${label}-${suffix}`),
      organizationId,
      hostSubjectRefDigest: digestSecret(`subject-${label}-${suffix}`),
      expectedOrigin: origin,
      manifestId: `manifest-${label}-${suffix}`,
      manifestJson,
      expiresAt,
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId,
    },
  });

  const grant = await prisma.grant.create({
    data: {
      consentSessionId: consentSession.id,
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
      eventType,
      humanBoundary: "explicit_receiver_consent",
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
      eventType,
      eventSequence: 1,
      stateVersion: BigInt(event.state_version),
      occurredAt: new Date(occurredAt),
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
    instruction,
    connector,
    event: {
      correlation_id: correlationId,
      binding_id: bindingId,
      issuer_origin: origin,
      workflow_id: workflowId,
      event_type: eventType,
      event_sequence: 1,
      state_version: event.state_version,
      occurred_at: occurredAt,
      canonical_url: canonicalUrl,
    },
  };
}

async function postClaim(
  connectorToken: string,
  claimTokenValue: string,
  receiverApp = app
): Promise<request.Response> {
  return request(receiverApp)
    .post("/v0.1/delivery-claims")
    .set("Content-Type", "application/json")
    .send({ connector_token: connectorToken, claim_token: claimTokenValue });
}

async function readDeliveryState(deliveryId: string): Promise<DeliveryState> {
  const rows = await prisma.$queryRaw<DeliveryState[]>`
    SELECT "status", "current_attempt", "current_claim_token_digest", "lease_expires_at"
    FROM "cr2_deliveries"
    WHERE "delivery_id" = ${deliveryId}
  `;
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function countAttempts(deliveryId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_delivery_attempts"
    WHERE "delivery_id" = ${deliveryId}
  `;
  return Number(rows[0]?.count ?? 0n);
}

describe("Cloud Receiver v2 delivery claim red tests", () => {
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
      data: { developerId: developer.body.data.id as string, name: `Claim Org ${suffix}` },
    });
    organizationId = organization.id;
  });

  afterAll(async () => {
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
  });

  it("CLAIM-001 claims one delivery, returns exact empty 204 for no work, and serializes concurrent claims", async () => {
    const connector = await createConnector("Claim One");
    const fixture = await seedDelivery("001", connector);
    const firstToken = claimToken();

    const first = await postClaim(connector.token, firstToken);
    expect(first.status).toBe(200);
    expect(first.headers["set-cookie"]).toBeUndefined();
    expectExactKeys(first.body, ["duplicate", "lease"]);

    const noWork = await postClaim(connector.token, claimToken());
    expectNoWork(noWork);

    const concurrentConnector = await createConnector("Claim One Concurrent");
    const concurrentFixture = await seedDelivery("001-concurrent", concurrentConnector);
    const concurrent = await Promise.all([
      postClaim(concurrentConnector.token, claimToken()),
      postClaim(concurrentConnector.token, claimToken()),
    ]);
    expect(concurrent.map((response) => response.status).sort()).toEqual([200, 204]);
    expect(await countAttempts(concurrentFixture.deliveryId)).toBe(1);
    expect((await readDeliveryState(concurrentFixture.deliveryId)).current_attempt).toBe(1);
    expect(fixture.deliveryId).not.toBe(concurrentFixture.deliveryId);
  });

  it("CLAIM-002 replays the same live lease exactly and preserves it across restart", async () => {
    const connector = await createConnector("Claim Two");
    const fixture = await seedDelivery("002", connector);
    const token = claimToken();

    const first = await postClaim(connector.token, token);
    expect(first.status).toBe(200);
    const replay = await postClaim(connector.token, token);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ duplicate: true, lease: first.body.lease });
    expect(replay.body.lease.lease_token).toBe(token);
    expect(await countAttempts(fixture.deliveryId)).toBe(1);

    await prisma.$disconnect();
    const restartedApp = createApp();
    const replayAfterRestart = await postClaim(connector.token, token, restartedApp);
    expect(replayAfterRestart.status).toBe(200);
    expect(replayAfterRestart.body).toEqual({ duplicate: true, lease: first.body.lease });
    expect(await countAttempts(fixture.deliveryId)).toBe(1);
    expect((await readDeliveryState(fixture.deliveryId)).status).toBe("leased");
  });

  it("CLAIM-003 isolates fresh wrong-target claims, rejects same-token cross-Connector replay, and redacts identity failures", async () => {
    const owner = await createConnector("Claim Three Owner");
    const other = await createConnector("Claim Three Other");
    const fixture = await seedDelivery("003", owner);
    const ownerToken = claimToken();

    const first = await postClaim(owner.token, ownerToken);
    expect(first.status).toBe(200);
    const stateBeforeWrongTarget = await readDeliveryState(fixture.deliveryId);

    const wrongTarget = await postClaim(other.token, claimToken());
    expectNoWork(wrongTarget);
    expect(wrongTarget.text).not.toContain(fixture.eventId);
    expect(await readDeliveryState(fixture.deliveryId)).toEqual(stateBeforeWrongTarget);

    const crossConnectorReplay = await postClaim(other.token, ownerToken);
    expect(crossConnectorReplay.status).toBe(403);
    expect(crossConnectorReplay.body).toEqual({
      error: { code: "delivery_lease_scope_invalid" },
    });
    expect(crossConnectorReplay.text).not.toContain(owner.token);

    const invalidIdentity = await postClaim("invalid-connector-token", claimToken());
    expect(invalidIdentity.status).toBe(403);
    expect(invalidIdentity.body).toEqual({ error: { code: "connector_identity_invalid" } });
    expect(invalidIdentity.text).not.toContain(fixture.eventId);
  });

  it("CLAIM-004 reclaims expired leases only three times, then durably exhausts with empty 204", async () => {
    const connector = await createConnector("Claim Four");
    const fixture = await seedDelivery("004", connector);
    const firstToken = claimToken();
    const secondToken = claimToken();
    const thirdToken = claimToken();

    const first = await postClaim(connector.token, firstToken);
    expect(first.status).toBe(200);
    await prisma.$executeRaw`
      UPDATE "cr2_deliveries"
      SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
      WHERE "delivery_id" = ${fixture.deliveryId}
    `;

    const second = await postClaim(connector.token, secondToken);
    expect(second.status).toBe(200);
    expect(second.body.lease.attempt).toBe(2);
    await prisma.$executeRaw`
      UPDATE "cr2_deliveries"
      SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
      WHERE "delivery_id" = ${fixture.deliveryId}
    `;

    const third = await postClaim(connector.token, thirdToken);
    expect(third.status).toBe(200);
    expect(third.body.lease.attempt).toBe(3);
    await prisma.$executeRaw`
      UPDATE "cr2_deliveries"
      SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
      WHERE "delivery_id" = ${fixture.deliveryId}
    `;

    const exhausted = await postClaim(connector.token, claimToken());
    expectNoWork(exhausted);

    const state = await readDeliveryState(fixture.deliveryId);
    expect(state.status).toBe("retry_exhausted");
    expect(state.current_attempt).toBe(3);
    expect(state.current_claim_token_digest).toBe(digestSecret(thirdToken));
    expect(await countAttempts(fixture.deliveryId)).toBe(3);
  });

  it("CLAIM-005 returns canonical receipt and continuation context with bounded timestamps and no raw secrets", async () => {
    const connector = await createConnector("Claim Five");
    const fixture = await seedDelivery("005", connector);
    const token = claimToken();

    const response = await postClaim(connector.token, token);
    expect(response.status).toBe(200);
    expect(response.text).toBe(canonicalJson(response.body));
    expect(response.body.duplicate).toBe(false);
    expectExactKeys(response.body.lease, [
      "type",
      "protocol_version",
      "delivery_id",
      "event_id",
      "attempt",
      "lease_token",
      "lease_expires_at",
      "continuation",
      "receipt",
    ]);
    expect(response.body.lease.lease_token).toBe(token);
    expect(response.body.lease.delivery_id).toBe(fixture.deliveryId);
    expect(response.body.lease.event_id).toBe(fixture.eventId);
    expect(response.body.lease.continuation).toEqual({
      correlation_id: fixture.event.correlation_id,
      workflow_id: fixture.event.workflow_id,
      event_type: fixture.event.event_type,
      event_sequence: fixture.event.event_sequence,
      state_version: fixture.event.state_version,
      occurred_at: fixture.event.occurred_at,
      canonical_url: fixture.event.canonical_url,
      instruction: fixture.instruction,
    });
    expect(response.body.lease.receipt).toEqual({
      type: "webmcp.continuation_receipt",
      protocol_version: "0.1",
      grant_id: fixture.grantId,
      correlation_id: fixture.event.correlation_id,
      issuer_origin: fixture.event.issuer_origin,
      workflow_id: fixture.event.workflow_id,
      event_type: fixture.event.event_type,
      canonical_url: fixture.event.canonical_url,
      expires_at: expect.any(String),
      human_boundary: "explicit_receiver_consent",
      continuation_mode: "open_canonical_page_read_current_state",
    });

    const leaseExpiry = Date.parse(response.body.lease.lease_expires_at);
    const receiptExpiry = Date.parse(response.body.lease.receipt.expires_at);
    expect(leaseExpiry).toBeGreaterThan(Date.now());
    expect(leaseExpiry).toBeLessThanOrEqual(receiptExpiry);
    expect(leaseExpiry).toBeLessThanOrEqual(connector.expiresAt.getTime());
    expect(response.text).not.toContain(connector.token);

    const stored = await prisma.$queryRaw<Array<{ row_text: string }>>`
      SELECT CONCAT(
        row_to_json(d)::text,
        COALESCE((SELECT row_to_json(a)::text FROM "cr2_delivery_attempts" a
          WHERE a."delivery_id" = d."delivery_id" LIMIT 1), '')
      ) AS row_text
      FROM "cr2_deliveries" d
      WHERE d."delivery_id" = ${fixture.deliveryId}
    `;
    expect(stored).toHaveLength(1);
    expect(stored[0].row_text).not.toContain(connector.token);
    expect(stored[0].row_text).not.toContain(token);
  });
});
