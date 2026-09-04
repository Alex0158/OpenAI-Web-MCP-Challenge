import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const backendDirectory = path.resolve(__dirname, "../../../../");
const restartPort = 4017;
const restartBaseUrl = `http://127.0.0.1:${restartPort}`;
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const createdUserIds: string[] = [];
const createdDeveloperIds: string[] = [];
let receiver: ChildProcess | null = null;
let receiverLogs = "";

type DeliveryFixture = {
  userId: string;
  developerId: string;
  connectorId: string;
  connectorToken: string;
  otherConnectorId: string | null;
  otherConnectorToken: string | null;
  deliveryId: string;
  eventId: string;
  grantId: string;
  bindingId: string;
  instruction: string;
  grantExpiresAt: Date;
  connectorExpiresAt: Date;
  workflowId: string;
  eventType: string;
  correlationId: string;
  canonicalUrl: string;
  occurredAt: Date;
  humanBoundary: string;
};

type JsonObject = Record<string, any>;

type DeliveryRow = {
  status: string;
  current_attempt: number;
  maximum_attempts: number;
  current_connector_id: string | null;
  current_claim_token_digest: string | null;
  current_lease_token_digest: string | null;
  lease_started_at: Date | null;
  lease_expires_at: Date | null;
  terminal_reason: string | null;
};

function claimToken(): string {
  return randomBytes(32).toString("base64url");
}

function expectExactKeys(value: JsonObject, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function expectNoWork(response: request.Response): void {
  expect(response.status).toBe(204);
  expect(response.text).toBe("");
  expect(response.headers["content-type"]).toBeUndefined();
  expect(response.headers["content-length"]).toBe("0");
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers.pragma).toBe("no-cache");
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
}

async function postClaim(
  receiver: ReturnType<typeof createApp>,
  connectorToken: string,
  token: string
) {
  return request(receiver)
    .post("/v0.1/delivery-claims")
    .set("Content-Type", "application/json")
    .send({ connector_token: connectorToken, claim_token: token });
}

function startReceiver(): void {
  if (receiver) throw new Error("Cloud Receiver process is already running");
  const child = spawn(process.execPath, [path.join(backendDirectory, "dist/index.js")], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(restartPort),
      FRONTEND_URL: "http://localhost:3000",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "",
      DIRECT_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk: Buffer | string) => {
    receiverLogs += chunk.toString();
  });
  child.stderr?.on("data", (chunk: Buffer | string) => {
    receiverLogs += chunk.toString();
  });
  receiver = child;
}

async function waitForLive(): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${restartBaseUrl}/health/live`);
      await response.text();
      if (response.ok) return;
    } catch {
      // The child may still be starting; continue until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Cloud Receiver did not become live within the test deadline");
}

async function stopReceiver(): Promise<void> {
  const child = receiver;
  receiver = null;
  if (!child || child.exitCode !== null) return;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      settle(new Error("Cloud Receiver did not stop after SIGTERM"));
    }, 10_000);
    const settle = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
    child.once("error", (error) => settle(error));
    child.once("exit", () => settle());
    child.kill("SIGTERM");
  });
}

async function postClaimToRestartedReceiver(
  connectorToken: string,
  token: string
) {
  return request(restartBaseUrl)
    .post("/v0.1/delivery-claims")
    .set("Content-Type", "application/json")
    .send({ connector_token: connectorToken, claim_token: token });
}

async function readDelivery(deliveryId: string): Promise<DeliveryRow> {
  const rows = await prisma.$queryRaw<DeliveryRow[]>`
    SELECT
      "status",
      "current_attempt",
      "maximum_attempts",
      "current_connector_id",
      "current_claim_token_digest",
      "current_lease_token_digest",
      "lease_started_at",
      "lease_expires_at",
      "terminal_reason"
    FROM "cr2_deliveries"
    WHERE "delivery_id" = ${deliveryId}
  `;
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function readAttemptCount(deliveryId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_delivery_attempts"
    WHERE "delivery_id" = ${deliveryId}
  `;
  return Number(rows[0]?.count ?? 0n);
}

async function expireLease(deliveryId: string): Promise<void> {
  const expiredAt = new Date(Date.now() - 1_000);
  await prisma.$executeRaw`
    UPDATE "cr2_deliveries"
    SET "lease_expires_at" = ${expiredAt}, "updated_at" = ${new Date()}
    WHERE "delivery_id" = ${deliveryId}
  `;
}

async function createConnector(
  userId: string,
  label: string,
  now: Date
): Promise<{ id: string; token: string; deliveryTargetId: string; expiresAt: Date }> {
  const pairingSession = await prisma.pairingSession.create({
    data: {
      accountId: userId,
      pairingCodeDigest: digestSecret(`pairing-${suffix}-${label}-${randomUUID()}`),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1_000),
      consumedAt: now,
    },
  });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
  const connector = await prisma.connector.create({
    data: {
      accountId: userId,
      pairingSessionId: pairingSession.id,
      deliveryTargetId: randomUUID(),
      tokenDigest: digestSecret(token),
      deviceName: `Stopped Connector ${label}`,
      expiresAt,
    },
  });
  return { id: connector.id, token, deliveryTargetId: connector.deliveryTargetId, expiresAt };
}

async function createFixture(label: string, withOtherConnector = false): Promise<DeliveryFixture> {
  const now = new Date();
  const user = await prisma.userAccount.create({
    data: {
      email: `claim-user-${suffix}-${label}@example.com`,
      passwordHash: "test-only-hash",
    },
  });
  const developer = await prisma.developerAccount.create({
    data: {
      email: `claim-developer-${suffix}-${label}@example.com`,
      passwordHash: "test-only-hash",
    },
  });
  createdUserIds.push(user.id);
  createdDeveloperIds.push(developer.id);

  const organization = await prisma.organization.create({
    data: { developerId: developer.id, name: `Claim Organization ${label}` },
  });
  const connector = await createConnector(user.id, `${label}-primary`, now);
  const otherConnector = withOtherConnector
    ? await createConnector(user.id, `${label}-other`, now)
    : null;

  const grantExpiresAt = new Date(now.getTime() + 60 * 60 * 1_000);
  const consentSessionId = randomUUID();
  const manifestId = `claim-manifest-${suffix}-${label}`;
  const workflowId = `claim-workflow-${suffix}-${label}`;
  const eventType = "claim.requested";
  const correlationId = `claim-correlation-${suffix}-${label}`;
  const canonicalUrl = `https://claim-host-${suffix}.example/workflows/${label}`;
  const humanBoundary = "stop_before_final_submission";
  const instruction = `Continue the ${label} workflow.`;
  const manifest: Prisma.InputJsonObject = {
    type: "webmcp.reentry_manifest",
    protocol_version: "0.1",
    manifest_id: manifestId,
    correlation_id: correlationId,
    issuer_origin: `https://claim-host-${suffix}.example`,
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    offer_expires_at: new Date(now.getTime() + 30 * 60 * 1_000).toISOString(),
    workflow: {
      id: workflowId,
      type: "review",
      state_version: 1,
      canonical_url: canonicalUrl,
    },
    display: {
      title: "Review continuation",
      reason: instruction,
    },
    grant_request: {
      event_type: eventType,
      human_boundary: humanBoundary,
      grant_expires_at: grantExpiresAt.toISOString(),
      max_runs: 1,
    },
    signature: {
      algorithm: "Ed25519",
      key_id: "fixture-key",
      value: "A".repeat(86),
    },
  };
  const consent = await prisma.consentSession.create({
    data: {
      id: consentSessionId,
      challengeId: randomUUID(),
      tokenDigest: digestSecret(`consent-${randomUUID()}`),
      organizationId: organization.id,
      hostSubjectRefDigest: digestSecret(`subject-${suffix}-${label}`),
      expectedOrigin: `https://claim-host-${suffix}.example`,
      manifestId,
      manifestJson: manifest,
      expiresAt: grantExpiresAt,
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId: user.id,
    },
  });
  const binding = await prisma.hostSubjectBinding.create({
    data: {
      organizationId: organization.id,
      hostSubjectRefDigest: consent.hostSubjectRefDigest,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });
  const grant = await prisma.grant.create({
    data: {
      consentSessionId: consent.id,
      organizationId: organization.id,
      bindingId: binding.id,
      accountId: user.id,
      connectorId: connector.id,
      deliveryTargetId: binding.deliveryTargetId,
      correlationId,
      issuerOrigin: `https://claim-host-${suffix}.example`,
      workflowId,
      workflowType: "review",
      canonicalUrl,
      eventType,
      humanBoundary,
      expiresAt: grantExpiresAt,
      maxRuns: 1,
      runsRemaining: 0,
    },
  });
  const occurredAt = new Date(now.getTime() - 1_000);
  const event = await prisma.event.create({
    data: {
      eventId: `claim-event-${suffix}-${label}`,
      grantId: grant.id,
      bindingId: binding.id,
      correlationId,
      issuerOrigin: `https://claim-host-${suffix}.example`,
      workflowId,
      eventType,
      eventSequence: 1,
      stateVersion: 1n,
      occurredAt,
      canonicalUrl,
      canonicalBody: canonicalJson({
        type: "webmcp.continuation_event",
        protocol_version: "0.1",
        event_id: `claim-event-${suffix}-${label}`,
        correlation_id: correlationId,
        binding_id: binding.id,
        issuer_origin: `https://claim-host-${suffix}.example`,
        workflow_id: workflowId,
        event_type: eventType,
        event_sequence: 1,
        state_version: 1,
        occurred_at: occurredAt.toISOString(),
        canonical_url: canonicalUrl,
      }),
      receivedAt: now,
    },
  });
  const delivery = await prisma.delivery.create({
    data: {
      eventId: event.eventId,
      grantId: grant.id,
      deliveryTargetId: binding.deliveryTargetId,
      status: "pending",
      createdAt: now,
    },
  });

  return {
    userId: user.id,
    developerId: developer.id,
    connectorId: connector.id,
    connectorToken: connector.token,
    otherConnectorId: otherConnector?.id ?? null,
    otherConnectorToken: otherConnector?.token ?? null,
    deliveryId: delivery.deliveryId,
    eventId: event.eventId,
    grantId: grant.id,
    bindingId: binding.id,
    instruction,
    grantExpiresAt,
    connectorExpiresAt: connector.expiresAt,
    workflowId,
    eventType,
    correlationId,
    canonicalUrl,
    occurredAt,
    humanBoundary,
  };
}

describe("Cloud Receiver v2 delivery claim and lease red tests", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await stopReceiver();
    for (const developerId of createdDeveloperIds) {
      await prisma.developerAccount.delete({ where: { id: developerId } });
    }
    for (const userId of createdUserIds) {
      await prisma.userAccount.delete({ where: { id: userId } });
    }
  });

  it("CLAIM-001 returns one exact lease for work and exact empty 204 for no work", async () => {
    const fixture = await createFixture("001", true);
    const claim = await postClaim(app, fixture.connectorToken, claimToken());

    expect(claim.status).toBe(200);
    expectExactKeys(claim.body, ["duplicate", "lease"]);
    expect(claim.body.duplicate).toBe(false);
    expectExactKeys(claim.body.lease, [
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

    const noWork = await postClaim(
      app,
      fixture.otherConnectorToken as string,
      claimToken()
    );
    expectNoWork(noWork);
  });

  it("CLAIM-002 exactly replays a live lease, prevents concurrent second leases, and survives app restart", async () => {
    const fixture = await createFixture("002");
    const firstToken = claimToken();
    const first = await postClaim(app, fixture.connectorToken, firstToken);
    expect(first.status).toBe(200);
    expect(first.body.lease.lease_token).toBe(firstToken);
    expect(first.body.lease.attempt).toBe(1);

    const replay = await postClaim(app, fixture.connectorToken, firstToken);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ ...first.body, duplicate: true });

    const concurrent = await Promise.all([
      postClaim(app, fixture.connectorToken, claimToken()),
      postClaim(app, fixture.connectorToken, claimToken()),
    ]);
    concurrent.forEach(expectNoWork);

    startReceiver();
    await waitForLive();
    const claimThroughReceiver = await postClaimToRestartedReceiver(
      fixture.connectorToken,
      firstToken
    );
    expect(claimThroughReceiver.status).toBe(200);
    expect(claimThroughReceiver.body).toEqual({ ...first.body, duplicate: true });
    await stopReceiver();

    startReceiver();
    await waitForLive();
    const replayAfterRestart = await postClaimToRestartedReceiver(
      fixture.connectorToken,
      firstToken
    );
    expect(replayAfterRestart.status).toBe(200);
    expect(replayAfterRestart.body).toEqual({ ...first.body, duplicate: true });
    await stopReceiver();

    const row = await readDelivery(fixture.deliveryId);
    expect(row.status).toBe("leased");
    expect(row.current_attempt).toBe(1);
    expect(await readAttemptCount(fixture.deliveryId)).toBe(1);
    expect(receiverLogs).not.toContain(fixture.connectorToken);
    expect(receiverLogs).not.toContain(firstToken);
  });

  it("CLAIM-003 isolates targets with a fresh token and rejects cross-Connector token reuse", async () => {
    const fixture = await createFixture("003", true);
    const wrongTarget = await postClaim(
      app,
      fixture.otherConnectorToken as string,
      claimToken()
    );
    expectNoWork(wrongTarget);

    const firstToken = claimToken();
    const first = await postClaim(app, fixture.connectorToken, firstToken);
    expect(first.status).toBe(200);

    const crossConnectorReplay = await postClaim(
      app,
      fixture.otherConnectorToken as string,
      firstToken
    );
    expect(crossConnectorReplay.status).toBe(403);
    expect(crossConnectorReplay.body).toEqual({
      error: { code: "delivery_lease_scope_invalid" },
    });

    const invalid = await postClaim(app, "invalid-connector-token", claimToken());
    expect(invalid.status).toBe(403);
    expect(invalid.body).toEqual({ error: { code: "connector_identity_invalid" } });

    const row = await readDelivery(fixture.deliveryId);
    expect(row.status).toBe("leased");
    expect(row.current_attempt).toBe(1);
    expect(row.current_connector_id).toBe(fixture.connectorId);
  });

  it("CLAIM-004 reclaims expired leases through three attempts and then returns no-work for durable exhaustion", async () => {
    const fixture = await createFixture("004");

    const first = await postClaim(app, fixture.connectorToken, claimToken());
    expect(first.status).toBe(200);
    expect(first.body.lease.attempt).toBe(1);
    await expireLease(fixture.deliveryId);

    const second = await postClaim(app, fixture.connectorToken, claimToken());
    expect(second.status).toBe(200);
    expect(second.body.lease.attempt).toBe(2);
    await expireLease(fixture.deliveryId);

    const third = await postClaim(app, fixture.connectorToken, claimToken());
    expect(third.status).toBe(200);
    expect(third.body.lease.attempt).toBe(3);
    await expireLease(fixture.deliveryId);

    const exhausted = await postClaim(app, fixture.connectorToken, claimToken());
    expectNoWork(exhausted);

    const row = await readDelivery(fixture.deliveryId);
    expect(row.status).toBe("retry_exhausted");
    expect(row.current_attempt).toBe(3);
    expect(row.maximum_attempts).toBe(3);
    expect(row.terminal_reason).toBe("attempt_limit_reached");
    expect(await readAttemptCount(fixture.deliveryId)).toBe(3);
  });

  it("CLAIM-005 returns bounded receipt timestamps and keeps Connector/claim secrets out of state and logs", async () => {
    const fixture = await createFixture("005");
    const connectorToken = fixture.connectorToken;
    const claim = claimToken();
    const logs: string[] = [];
    const logSpy = jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      const response = await postClaim(app, connectorToken, claim);
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(response.body.duplicate).toBe(false);
      const lease = response.body.lease;
      expect(lease.type).toBe("webmcp.delivery_lease");
      expect(lease.protocol_version).toBe("0.1");
      expect(lease.delivery_id).toBe(fixture.deliveryId);
      expect(lease.event_id).toBe(fixture.eventId);
      expect(lease.attempt).toBe(1);
      expect(lease.lease_token).toBe(claim);
      expect(Date.parse(lease.lease_expires_at)).toBeGreaterThan(Date.now());
      expect(Date.parse(lease.lease_expires_at)).toBeLessThanOrEqual(
        fixture.grantExpiresAt.getTime()
      );
      expect(Date.parse(lease.lease_expires_at)).toBeLessThanOrEqual(
        fixture.connectorExpiresAt.getTime()
      );
      expect(lease.continuation).toEqual({
        correlation_id: fixture.correlationId,
        workflow_id: fixture.workflowId,
        event_type: fixture.eventType,
        event_sequence: 1,
        state_version: 1,
        occurred_at: fixture.occurredAt.toISOString(),
        canonical_url: fixture.canonicalUrl,
        instruction: fixture.instruction,
      });
      expect(lease.receipt).toEqual({
        type: "webmcp.continuation_receipt",
        protocol_version: "0.1",
        grant_id: fixture.grantId,
        correlation_id: fixture.correlationId,
        issuer_origin: `https://claim-host-${suffix}.example`,
        workflow_id: fixture.workflowId,
        event_type: fixture.eventType,
        canonical_url: fixture.canonicalUrl,
        expires_at: fixture.grantExpiresAt.toISOString(),
        human_boundary: fixture.humanBoundary,
        continuation_mode: "open_canonical_page_read_current_state",
      });
      expect(JSON.stringify(response.body)).not.toContain(connectorToken);
      expect(JSON.stringify(response.body)).not.toContain(fixture.bindingId);
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }

    const delivery = await readDelivery(fixture.deliveryId);
    expect(delivery.current_claim_token_digest).not.toBe(claim);
    expect(delivery.current_lease_token_digest).not.toBe(claim);
    const connectorRows = await prisma.$queryRaw<Array<{ connector_token_digest: string }>>`
      SELECT "connector_token_digest"
      FROM "cr2_connectors"
      WHERE "connector_id" = ${fixture.connectorId}
    `;
    expect(connectorRows[0]?.connector_token_digest).not.toBe(connectorToken);
    const attemptRows = await prisma.$queryRaw<
      Array<{ claim_token_digest: string; lease_token_digest: string }>
    >`
      SELECT "claim_token_digest", "lease_token_digest"
      FROM "cr2_delivery_attempts"
      WHERE "delivery_id" = ${fixture.deliveryId}
    `;
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0].claim_token_digest).not.toBe(claim);
    expect(attemptRows[0].lease_token_digest).not.toBe(claim);
    expect(logs.join("\n")).not.toContain(connectorToken);
    expect(logs.join("\n")).not.toContain(claim);
  });
});
