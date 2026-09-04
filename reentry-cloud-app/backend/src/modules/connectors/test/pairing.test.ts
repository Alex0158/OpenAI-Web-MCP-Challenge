import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { clearTestAccounts } from "../../../test/helper";

const app = createApp();
const suffix = Date.now();
const userEmail = `pairing-red-user-${suffix}@example.com`;
const otherUserEmail = `pairing-red-other-${suffix}@example.com`;
const password = "correct horse battery staple";

const userAgent = request.agent(app);
const otherUserAgent = request.agent(app);
let otherUserId: string;

function expectExactKeys(value: object, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function expectIsoTimestamp(value: unknown, label: string): asserts value is string {
  expect(typeof value).toBe("string");
  expect(Number.isFinite(Date.parse(value as string))).toBe(true);
  expect(new Date(value as string).toISOString()).toBe(value);
  expect(label).toBeTruthy();
}

async function createPairing(): Promise<{
  pairingId: string;
  pairingCode: string;
  expiresAt: string;
}> {
  const response = await userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({});

  expect(response.status).toBe(201);
  expectExactKeys(response.body, [
    "type",
    "protocol_version",
    "pairing_id",
    "pairing_code",
    "expires_at",
  ]);
  expect(response.body.type).toBe("webmcp.connector_account_pairing");
  expect(response.body.protocol_version).toBe("0.1");
  expect(response.body.pairing_id).toEqual(expect.any(String));
  expect(response.body.pairing_code).toMatch(/^[A-F0-9]{8}$/);
  expectIsoTimestamp(response.body.expires_at, "expires_at");

  return {
    pairingId: response.body.pairing_id,
    pairingCode: response.body.pairing_code,
    expiresAt: response.body.expires_at,
  };
}

async function claimPairing(pairingCode: string, deviceName: string) {
  // This is deliberately a fresh SuperTest client: the CLI claim must not rely
  // on either browser session or Organization credentials.
  return request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairingCode, device_name: deviceName });
}

async function disconnectConnector(connectorToken: string) {
  return request(app)
    .post("/v0.1/connectors/disconnect")
    .set("Content-Type", "application/json")
    .send({ connector_token: connectorToken });
}

async function listConnectors(agent = userAgent) {
  return agent.get("/v0.1/account/connectors");
}

async function registerOtherUser(): Promise<string> {
  const response = await request(app)
    .post("/v1/auth/users/register")
    .send({ email: otherUserEmail, password });
  expect(response.status).toBe(201);
  return response.body.data.id as string;
}

async function connectorCount(connectorId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_connectors"
    WHERE "connector_id" = ${connectorId}
  `;
  return Number(rows[0]?.count ?? 0);
}

describe("Cloud Receiver v2 pairing red tests", () => {
  beforeAll(async () => {
    await clearTestAccounts(userEmail);
    await clearTestAccounts(otherUserEmail);

    const register = await userAgent
      .post("/v1/auth/users/register")
      .send({ email: userEmail, password });
    expect(register.status).toBe(201);
    otherUserId = await registerOtherUser();
  });

  afterAll(async () => {
    await clearTestAccounts(userEmail);
    await clearTestAccounts(otherUserEmail);
  });

  it("PAIR-001 creates an account pairing and persists only the code digest", async () => {
    const pairing = await createPairing();

    const rows = await prisma.$queryRaw<Array<{ pairing_code_digest: string }>>`
      SELECT "pairing_code_digest"
      FROM "cr2_pairing_sessions"
      WHERE "pairing_id" = ${pairing.pairingId}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0].pairing_code_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0].pairing_code_digest).not.toBe(pairing.pairingCode);
  });

  it("PAIR-002 lets a cookie-free CLI claim one durable Connector credential", async () => {
    const pairing = await createPairing();
    const response = await claimPairing(pairing.pairingCode, "Mac One");

    expect(response.status).toBe(200);
    expectExactKeys(response.body, [
      "type",
      "protocol_version",
      "pairing_id",
      "connector_id",
      "connector_token",
      "connector_expires_at",
      "duplicate",
    ]);
    expect(response.body.type).toBe("webmcp.connector_credentials");
    expect(response.body.protocol_version).toBe("0.1");
    expect(response.body.pairing_id).toBe(pairing.pairingId);
    expect(response.body.connector_id).toEqual(expect.any(String));
    expect(response.body.connector_token).toEqual(expect.any(String));
    expect(response.body.connector_token.length).toBeGreaterThan(0);
    expectIsoTimestamp(response.body.connector_expires_at, "connector_expires_at");
    expect(response.body.duplicate).toBe(false);
    expect(await connectorCount(response.body.connector_id)).toBe(1);

    const connectorSecret = await prisma.$queryRaw<Array<{ connector_token_digest: string }>>`
      SELECT "connector_token_digest"
      FROM "cr2_connectors"
      WHERE "connector_id" = ${response.body.connector_id}
    `;
    expect(connectorSecret).toHaveLength(1);
    expect(connectorSecret[0].connector_token_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(connectorSecret[0].connector_token_digest).not.toBe(response.body.connector_token);

    const consumed = await prisma.$queryRaw<Array<{ consumed_at: string | null }>>`
      SELECT "consumed_at"
      FROM "cr2_pairing_sessions"
      WHERE "pairing_id" = ${pairing.pairingId}
    `;
    expect(consumed).toHaveLength(1);
    expect(consumed[0].consumed_at).not.toBeNull();
  });

  it("PAIR-006 lists only safe Connector metadata for the signed-in account", async () => {
    const pairing = await createPairing();
    const claim = await claimPairing(pairing.pairingCode, "Dashboard Mac");
    expect(claim.status).toBe(200);

    const response = await listConnectors();

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expectExactKeys(response.body, ["type", "protocol_version", "connectors"]);
    expect(response.body.type).toBe("webmcp.connector_account_connectors");
    expect(response.body.protocol_version).toBe("0.1");

    const listed = response.body.connectors.find(
      (connector: { connector_id: string }) => connector.connector_id === claim.body.connector_id,
    );
    expect(listed).toBeDefined();
    if (!listed) throw new Error("claimed Connector was not listed for its account");
    expectExactKeys(listed, [
      "connector_id",
      "pairing_id",
      "device_name",
      "created_at",
      "expires_at",
      "revoked_at",
    ]);
    expect(listed.connector_id).toBe(claim.body.connector_id);
    expect(listed.pairing_id).toBe(pairing.pairingId);
    expect(listed.device_name).toBe("Dashboard Mac");
    expectIsoTimestamp(listed.created_at, "created_at");
    expectIsoTimestamp(listed.expires_at, "expires_at");
    expect(listed.revoked_at).toBeNull();
    expect(JSON.stringify(listed)).not.toContain("connector_token");

    const otherLogin = await otherUserAgent
      .post("/v1/auth/users/login")
      .send({ email: otherUserEmail, password });
    expect(otherLogin.status).toBe(200);
    const otherList = await listConnectors(otherUserAgent);
    expect(otherList.status).toBe(200);
    expect(otherList.body.connectors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ connector_id: claim.body.connector_id }),
      ]),
    );

    const unauthenticated = await request(app).get("/v0.1/account/connectors");
    expect(unauthenticated.status).toBe(401);
  });

  it("DISCONNECT-001 irreversibly revokes one Connector and exposes the lifecycle change", async () => {
    const pairing = await createPairing();
    const claim = await claimPairing(pairing.pairingCode, "Disconnected Mac");
    expect(claim.status).toBe(200);

    const response = await disconnectConnector(claim.body.connector_token);

    expect(response.status).toBe(200);
    expectExactKeys(response.body, ["type", "protocol_version", "status", "duplicate"]);
    expect(response.body).toEqual({
      type: "webmcp.connector_disconnection",
      protocol_version: "0.1",
      status: "disconnected",
      duplicate: false,
    });
    expect(response.text).not.toContain(claim.body.connector_token);

    const revoked = await prisma.connector.findUnique({
      where: { id: claim.body.connector_id },
      select: { revokedAt: true },
    });
    expect(revoked?.revokedAt).toBeInstanceOf(Date);

    const listed = await listConnectors();
    const connector = listed.body.connectors.find(
      (item: { connector_id: string }) => item.connector_id === claim.body.connector_id,
    );
    expectIsoTimestamp(connector?.revoked_at, "revoked_at");

    const claimAfterDisconnect = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({
        connector_token: claim.body.connector_token,
        claim_token: "A".repeat(43),
      });
    expect(claimAfterDisconnect.status).toBe(403);
    expect(claimAfterDisconnect.body).toEqual({
      error: { code: "connector_identity_invalid" },
    });
  });

  it("DISCONNECT-002 replays exactly and rejects an unknown Connector token", async () => {
    const pairing = await createPairing();
    const claim = await claimPairing(pairing.pairingCode, "Replay Mac");
    expect(claim.status).toBe(200);
    await prisma.connector.update({
      where: { id: claim.body.connector_id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const first = await disconnectConnector(claim.body.connector_token);
    expect(first.status).toBe(200);
    const firstRevokedAt = await prisma.connector.findUnique({
      where: { id: claim.body.connector_id },
      select: { revokedAt: true },
    });

    const replay = await disconnectConnector(claim.body.connector_token);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({
      type: "webmcp.connector_disconnection",
      protocol_version: "0.1",
      status: "disconnected",
      duplicate: true,
    });
    const replayedRevokedAt = await prisma.connector.findUnique({
      where: { id: claim.body.connector_id },
      select: { revokedAt: true },
    });
    expect(replayedRevokedAt?.revokedAt?.toISOString()).toBe(
      firstRevokedAt?.revokedAt?.toISOString(),
    );

    const unknown = await disconnectConnector("B".repeat(43));
    expect(unknown.status).toBe(403);
    expect(unknown.body).toEqual({ error: { code: "connector_identity_invalid" } });
  });

  it("PAIR-003 replays metadata without returning the raw token or creating a second target", async () => {
    const pairing = await createPairing();
    const first = await claimPairing(pairing.pairingCode, "Mac One");
    expect(first.status).toBe(200);

    const replay = await claimPairing(pairing.pairingCode, "Renamed Mac");

    expect(replay.status).toBe(200);
    expectExactKeys(replay.body, [
      "type",
      "protocol_version",
      "pairing_id",
      "connector_id",
      "connector_expires_at",
      "duplicate",
    ]);
    expect(replay.body.type).toBe("webmcp.connector_credentials");
    expect(replay.body.protocol_version).toBe("0.1");
    expect(replay.body.pairing_id).toBe(first.body.pairing_id);
    expect(replay.body.connector_id).toBe(first.body.connector_id);
    expect(replay.body.connector_expires_at).toBe(first.body.connector_expires_at);
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.connector_token).toBeUndefined();
    expect(await connectorCount(first.body.connector_id)).toBe(1);

    const connector = await prisma.$queryRaw<
      Array<{ delivery_target_id: string; device_name: string }>
    >`
      SELECT "delivery_target_id", "device_name"
      FROM "cr2_connectors"
      WHERE "connector_id" = ${first.body.connector_id}
    `;
    expect(connector).toHaveLength(1);
    expect(connector[0].delivery_target_id).toEqual(expect.any(String));
    expect(connector[0].device_name).toBe("Mac One");
  });

  it("PAIR-004 rejects an inconsistent persisted account identity without reassignment", async () => {
    const pairing = await createPairing();
    const first = await claimPairing(pairing.pairingCode, "Mac One");
    expect(first.status).toBe(200);
    const before = await connectorCount(first.body.connector_id);

    // Test-only disposable-database fixture: the public claim request has no
    // account field, so the conflict must be detected from stored identity.
    await prisma.$executeRaw`
      UPDATE "cr2_pairing_sessions"
      SET "account_id" = ${otherUserId}
      WHERE "pairing_id" = ${pairing.pairingId}
    `;

    const replay = await claimPairing(pairing.pairingCode, "Other Account Device");

    expect(replay.status).toBe(409);
    expect(replay.body.error?.code).toBe("account_pairing_identity_conflict");
    expect(await connectorCount(first.body.connector_id)).toBe(before);
  });

  it("PAIR-005 rejects an invalid Connector token before mutating delivery state", async () => {
    const response = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({
        connector_token: "invalid-connector-token",
        claim_token: "A".repeat(43),
      });

    expect([401, 403]).toContain(response.status);
    expect(response.body.error?.code).toBe("connector_identity_invalid");
  });
});
