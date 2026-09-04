import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { clearTestAccounts } from "../../../test/helper";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const ownerEmail = `portal-owner-${suffix}@example.com`;
const otherEmail = `portal-other-${suffix}@example.com`;
const eventUserEmail = `portal-event-user-${suffix}@example.com`;
const password = "correct horse battery staple";
const frontendOrigin = "http://localhost:3000";
const ownerAgent = request.agent(app);
const otherAgent = request.agent(app);
type TestAgent = ReturnType<typeof request.agent>;

type JsonObject = Record<string, any>;

type OrganizationSummary = {
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type ApiKeyReveal = {
  api_key_id: string;
  key_prefix: string;
  api_key: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

function expectSuccess(response: request.Response, status: number): JsonObject {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(true);
  expect(Object.keys(response.body).sort()).toEqual(["data", "success"]);
  return response.body.data as JsonObject;
}

function expectFailure(response: request.Response, status: number, code: string): void {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBe(code);
}

function expectOriginFailure(response: request.Response): void {
  expect(response.status).toBe(403);
  expect(response.body).toEqual({ error: { code: "csrf_origin_invalid" } });
}

function expectIso(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(new Date(value as string).toISOString()).toBe(value);
}

async function createOrganization(agent: TestAgent, name: string): Promise<{
  organization: OrganizationSummary;
  api_key: ApiKeyReveal;
}> {
  const response = await agent
    .post("/api/organizations")
    .set("Origin", frontendOrigin)
    .send({ name });
  const data = expectSuccess(response, 201) as {
    organization: OrganizationSummary;
    api_key: ApiKeyReveal;
  };
  expect(Object.keys(data).sort()).toEqual(["api_key", "organization"]);
  expect(Object.keys(data.organization).sort()).toEqual([
    "created_at",
    "name",
    "organization_id",
    "updated_at",
  ]);
  expect(Object.keys(data.api_key).sort()).toEqual([
    "api_key",
    "api_key_id",
    "created_at",
    "expires_at",
    "key_prefix",
    "revoked_at",
  ]);
  expect(data.organization.name).toBe(name);
  expect(data.api_key.api_key).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(data.api_key.key_prefix).toBe(data.api_key.api_key.slice(0, 8));
  expectIso(data.organization.created_at);
  expectIso(data.organization.updated_at);
  expectIso(data.api_key.created_at);
  expect(data.api_key.expires_at).toBeNull();
  expect(data.api_key.revoked_at).toBeNull();
  return data;
}

async function seedEventHistory(organizationId: string): Promise<{
  eventId: string;
  bindingId: string;
  grantId: string;
  connectorToken: string;
  privateBody: string;
}> {
  const now = new Date();
  const user = await prisma.userAccount.create({
    data: { email: eventUserEmail, passwordHash: "test-only-hash" },
  });
  const pairingSession = await prisma.pairingSession.create({
    data: {
      accountId: user.id,
      pairingCodeDigest: digestSecret(`portal-pairing-${suffix}`),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
      consumedAt: now,
    },
  });
  const connectorToken = randomBytes(32).toString("base64url");
  const connector = await prisma.connector.create({
    data: {
      accountId: user.id,
      pairingSessionId: pairingSession.id,
      deliveryTargetId: randomUUID(),
      tokenDigest: digestSecret(connectorToken),
      deviceName: "Portal fixture connector",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1_000),
    },
  });
  const bindingId = randomUUID();
  const hostSubjectDigest = digestSecret(`portal-subject-${suffix}`);
  await prisma.hostSubjectBinding.create({
    data: {
      id: bindingId,
      organizationId,
      hostSubjectRefDigest: hostSubjectDigest,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });
  const eventId = `portal-event-${suffix}`;
  const grantId = randomUUID();
  const consentSession = await prisma.consentSession.create({
    data: {
      id: randomUUID(),
      challengeId: randomUUID(),
      tokenDigest: digestSecret(`portal-consent-${suffix}`),
      organizationId,
      hostSubjectRefDigest: hostSubjectDigest,
      expectedOrigin: "https://portal-host.example",
      manifestId: `portal-manifest-${suffix}`,
      manifestJson: {
        private_body: "manifest-secret-must-not-appear",
        display: { reason: "Review the current workflow" },
      },
      expiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId: user.id,
    },
  });
  const grant = await prisma.grant.create({
    data: {
      id: grantId,
      consentSessionId: consentSession.id,
      organizationId,
      bindingId,
      accountId: user.id,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
      correlationId: `portal-correlation-${suffix}`,
      issuerOrigin: "https://portal-host.example",
      workflowId: `portal-workflow-${suffix}`,
      workflowType: "review",
      canonicalUrl: "https://portal-host.example/workflows/one",
      eventType: "review.requested",
      humanBoundary: "explicit_receiver_consent",
      expiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
      maxRuns: 1,
      runsRemaining: 0,
    },
  });
  const privateBody = "private-event-body-must-not-appear";
  const event = await prisma.event.create({
    data: {
      eventId,
      grantId: grant.id,
      bindingId,
      correlationId: grant.correlationId,
      issuerOrigin: grant.issuerOrigin,
      workflowId: grant.workflowId,
      eventType: grant.eventType,
      eventSequence: 1,
      stateVersion: 7n,
      occurredAt: new Date(now.getTime() - 1_000),
      canonicalUrl: grant.canonicalUrl,
      canonicalBody: canonicalJson({ privateBody }),
      receivedAt: now,
    },
  });
  await prisma.delivery.create({
    data: {
      eventId: event.eventId,
      grantId: grant.id,
      deliveryTargetId: grant.deliveryTargetId,
      status: "acknowledged",
      currentAttempt: 2,
      acknowledgedAt: now,
      createdAt: now,
    },
  });

  return { eventId, bindingId, grantId, connectorToken, privateBody };
}

describe("Cloud Receiver v2 developer portal", () => {
  beforeAll(async () => {
    await clearTestAccounts(ownerEmail);
    await clearTestAccounts(otherEmail);
    await clearTestAccounts(eventUserEmail);

    const owner = await ownerAgent
      .post("/v1/auth/developers/register")
      .send({ email: ownerEmail, password });
    expect(owner.status).toBe(201);
    const other = await otherAgent
      .post("/v1/auth/developers/register")
      .send({ email: otherEmail, password });
    expect(other.status).toBe(201);
  });

  afterAll(async () => {
    await clearTestAccounts(ownerEmail);
    await clearTestAccounts(otherEmail);
    await clearTestAccounts(eventUserEmail);
  });

  it("DEVELOPER-001 lists and creates organizations with strict developer ownership", async () => {
    const unauthenticated = await request(app).get("/api/organizations");
    expectFailure(unauthenticated, 401, "UNAUTHORIZED");

    const missingOrigin = await ownerAgent
      .post("/api/organizations")
      .send({ name: `Missing origin ${suffix}` });
    expectOriginFailure(missingOrigin);

    const wrongOrigin = await ownerAgent
      .post("/api/organizations")
      .set("Origin", "https://attacker.example")
      .send({ name: `Wrong origin ${suffix}` });
    expectOriginFailure(wrongOrigin);

    const initial = await ownerAgent.get("/api/organizations");
    const initialData = expectSuccess(initial, 200) as { organizations: OrganizationSummary[] };
    expect(Object.keys(initialData).sort()).toEqual(["organizations"]);
    expect(initialData.organizations).toEqual([]);

    const created = await createOrganization(ownerAgent, `Portal Org ${suffix}`);
    const ownerList = await ownerAgent.get("/api/organizations");
    const ownerData = expectSuccess(ownerList, 200) as { organizations: OrganizationSummary[] };
    expect(ownerData.organizations).toEqual([created.organization]);

    const otherList = await otherAgent.get("/api/organizations");
    const otherData = expectSuccess(otherList, 200) as { organizations: OrganizationSummary[] };
    expect(otherData.organizations).toEqual([]);

    const crossOwner = await otherAgent.get(
      `/api/organizations/${created.organization.organization_id}/api-keys`
    );
    expectFailure(crossOwner, 404, "ORGANIZATION_NOT_FOUND");
    expect(crossOwner.text).not.toContain(created.organization.organization_id);
  });

  it("DEVELOPER-002 reveals API keys once, stores only digest and prefix, and revokes idempotently", async () => {
    const created = await createOrganization(ownerAgent, `Key Org ${suffix}`);
    const organizationId = created.organization.organization_id;

    const logs: string[] = [];
    const logSpy = jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    const missingKeyOrigin = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys`)
      .send({});
    expectOriginFailure(missingKeyOrigin);

    const wrongKeyOrigin = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys`)
      .set("Origin", "https://attacker.example")
      .send({});
    expectOriginFailure(wrongKeyOrigin);

    let createdKey!: ApiKeyReveal;
    try {
      const response = await ownerAgent
        .post(`/api/organizations/${organizationId}/api-keys`)
        .set("Origin", frontendOrigin)
        .send({});
      const data = expectSuccess(response, 201) as { api_key: ApiKeyReveal };
      expect(Object.keys(data).sort()).toEqual(["api_key"]);
      createdKey = data.api_key;
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }

    expect(createdKey.api_key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(logs.join("\n")).not.toContain(createdKey.api_key);

    const stored = await prisma.organizationApiKey.findUnique({
      where: { id: createdKey.api_key_id },
    });
    expect(stored).not.toBeNull();
    expect(stored?.keyDigest).toBe(digestSecret(createdKey.api_key));
    expect(stored?.keyPrefix).toBe(createdKey.key_prefix);
    expect(stored?.keyDigest).not.toBe(createdKey.api_key);

    const listed = await ownerAgent.get(`/api/organizations/${organizationId}/api-keys`);
    const listData = expectSuccess(listed, 200) as { api_keys: Array<Record<string, unknown>> };
    expect(Object.keys(listData).sort()).toEqual(["api_keys"]);
    expect(listData.api_keys).toHaveLength(2);
    for (const key of listData.api_keys) {
      expect(Object.keys(key).sort()).toEqual([
        "api_key_id",
        "created_at",
        "expires_at",
        "key_prefix",
        "revoked_at",
      ]);
      expect(JSON.stringify(key)).not.toContain(createdKey.api_key);
    }
    expect(listed.text).not.toContain(createdKey.api_key);

    const revoked = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys/${createdKey.api_key_id}/revoke`)
      .set("Origin", frontendOrigin)
      .send({});
    const revokedData = expectSuccess(revoked, 200) as {
      api_key: Record<string, unknown>;
      duplicate: boolean;
    };
    expect(revokedData.duplicate).toBe(false);
    expect(Object.keys(revokedData.api_key).sort()).toEqual([
      "api_key_id",
      "created_at",
      "expires_at",
      "key_prefix",
      "revoked_at",
    ]);
    expect(revokedData.api_key.revoked_at).toEqual(expect.any(String));
    expect(revoked.text).not.toContain(createdKey.api_key);

    const missingRevokeOrigin = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys/${createdKey.api_key_id}/revoke`)
      .send({});
    expectOriginFailure(missingRevokeOrigin);

    const wrongRevokeOrigin = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys/${createdKey.api_key_id}/revoke`)
      .set("Origin", "https://attacker.example")
      .send({});
    expectOriginFailure(wrongRevokeOrigin);

    const replay = await ownerAgent
      .post(`/api/organizations/${organizationId}/api-keys/${createdKey.api_key_id}/revoke`)
      .set("Origin", frontendOrigin)
      .send({});
    const replayData = expectSuccess(replay, 200) as {
      api_key: Record<string, unknown>;
      duplicate: boolean;
    };
    expect(replayData).toEqual({ api_key: revokedData.api_key, duplicate: true });

    const crossOwner = await otherAgent
      .post(`/api/organizations/${organizationId}/api-keys/${createdKey.api_key_id}/revoke`)
      .set("Origin", frontendOrigin)
      .send({});
    expectFailure(crossOwner, 404, "ORGANIZATION_NOT_FOUND");
    expect(crossOwner.text).not.toContain(createdKey.api_key);
  });

  it("DEVELOPER-003 returns only redacted organization Event and Delivery history", async () => {
    const created = await createOrganization(ownerAgent, `Event Org ${suffix}`);
    const fixture = await seedEventHistory(created.organization.organization_id);

    const response = await ownerAgent.get(
      `/api/organizations/${created.organization.organization_id}/events`
    );
    const data = expectSuccess(response, 200) as { events: Array<Record<string, unknown>> };
    expect(Object.keys(data).sort()).toEqual(["events"]);
    expect(data.events).toHaveLength(1);
    expect(Object.keys(data.events[0]).sort()).toEqual([
      "acknowledged_at",
      "delivery_attempt",
      "delivery_state",
      "event_id",
      "event_type",
      "issuer_origin",
      "received_at",
      "terminal_reason",
      "workflow_id",
    ]);
    expect(data.events[0]).toEqual({
      event_id: fixture.eventId,
      event_type: "review.requested",
      issuer_origin: "https://portal-host.example",
      workflow_id: expect.stringMatching(/^portal-workflow-/),
      received_at: expect.any(String),
      delivery_state: "acknowledged",
      delivery_attempt: 2,
      acknowledged_at: expect.any(String),
      terminal_reason: null,
    });
    expectIso(data.events[0].received_at);
    expectIso(data.events[0].acknowledged_at);

    const responseText = response.text;
    expect(responseText).not.toContain(fixture.privateBody);
    expect(responseText).not.toContain(fixture.bindingId);
    expect(responseText).not.toContain(fixture.grantId);
    expect(responseText).not.toContain(fixture.connectorToken);
    expect(responseText).not.toContain("canonical_body");
    expect(responseText).not.toContain("canonical_url");
    expect(responseText).not.toContain("manifest-secret-must-not-appear");

    const crossOwner = await otherAgent.get(
      `/api/organizations/${created.organization.organization_id}/events`
    );
    expectFailure(crossOwner, 404, "ORGANIZATION_NOT_FOUND");
    expect(crossOwner.text).not.toContain(fixture.eventId);
  });
});
