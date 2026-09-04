import { generateKeyPairSync, randomBytes, sign } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { appConfig } from "../../../config/config";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { clearTestAccounts } from "../../../test/helper";
import { revokeGrantInternally } from "../../consent/grant-control";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const userEmail = `event-user-${suffix}@example.com`;
const developerEmail = `event-developer-${suffix}@example.com`;
const password = "correct horse battery staple";
const origin = `https://event-host-${suffix}.example`;
const wrongOrigin = `https://wrong-event-host-${suffix}.example`;
const hostId = `event-host-${suffix}`;
const hostKeyId = `event-key-${suffix}`;
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

const userAgent = request.agent(app);
let userId = "";
let organizationId = "";
let organizationApiKey = "";
let stoppedConnectorId = "";

type JsonObject = Record<string, any>;
type EventBody = Record<string, unknown>;
type EventEnvelope = {
  body: string;
  headers: {
    "WebMCP-Reentry-Key-Id": string;
    "WebMCP-Reentry-Timestamp": string;
    "WebMCP-Reentry-Signature": string;
  };
};

function expectExactKeys(value: JsonObject, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function isoIn(milliseconds: number): string {
  return new Date(Date.now() + milliseconds).toISOString();
}

function manifestFor(manifestId: string, grantExpiry = isoIn(60 * 60 * 1_000)): JsonObject {
  const unsigned = {
    type: "webmcp.reentry_manifest",
    protocol_version: "0.1",
    manifest_id: manifestId,
    correlation_id: `correlation-${manifestId}`,
    issuer_origin: origin,
    issued_at: new Date(Date.now() - 1_000).toISOString(),
    offer_expires_at: isoIn(30 * 60 * 1_000),
    workflow: {
      id: `workflow-${manifestId}`,
      type: "review",
      state_version: 1,
      canonical_url: `${origin}/workflows/${manifestId}`,
    },
    display: {
      title: `Review ${manifestId}`,
      reason: "The Host requests one review continuation.",
    },
    grant_request: {
      event_type: "review.requested",
      grant_expires_at: grantExpiry,
      max_runs: 1,
      human_boundary: "explicit_receiver_consent",
    },
  };
  const signature = sign(null, Buffer.from(canonicalJson(unsigned), "utf8"), privateKey).toString(
    "base64url"
  );
  return {
    ...unsigned,
    signature: {
      algorithm: "Ed25519",
      key_id: hostKeyId,
      value: signature,
    },
  };
}

function consentTokenFromUrl(consentUrl: string): string {
  const token = new URL(consentUrl).searchParams.get("token");
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token as string;
}

async function createConsent(manifest: JsonObject, subject: string) {
  return request(app)
    .post("/v0.1/consent-sessions")
    .set("Authorization", `Bearer ${organizationApiKey}`)
    .send({ host_subject_ref: subject, expected_origin: origin, manifest });
}

async function decide(token: string, connectorId: string) {
  return userAgent
    .post("/v0.1/account-consent-decisions")
    .set("Origin", "http://localhost:4000")
    .set("Content-Type", "application/json")
    .send({ consent_token: token, action: "approve", connector_id: connectorId });
}

async function createConnector(deviceName: string): Promise<string> {
  const pairing = await userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", "http://localhost:3000")
    .set("Content-Type", "application/json")
    .send({});
  expect(pairing.status).toBe(201);

  const claim = await request(app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: deviceName });
  expect(claim.status).toBe(200);
  expect(claim.body.connector_token).toEqual(expect.any(String));
  return claim.body.connector_id as string;
}

async function createGrant(label: string) {
  const created = await createConsent(
    manifestFor(`manifest-event-${label}-${suffix}`),
    `subject-event-${label}-${suffix}`
  );
  expect(created.status).toBe(201);
  const decision = await decide(consentTokenFromUrl(created.body.consent_url), stoppedConnectorId);
  expect(decision.status).toBe(200);
  const grant = await prisma.grant.findUnique({
    where: { consentSessionId: created.body.consent_session_id },
  });
  expect(grant).not.toBeNull();
  return grant as NonNullable<typeof grant>;
}

function eventFor(grant: {
  bindingId: string;
  correlationId: string;
  issuerOrigin: string;
  workflowId: string;
  eventType: string;
  canonicalUrl: string;
}, eventId: string, overrides: Partial<EventBody> = {}): EventBody {
  return {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: eventId,
    correlation_id: grant.correlationId,
    binding_id: grant.bindingId,
    issuer_origin: grant.issuerOrigin,
    workflow_id: grant.workflowId,
    event_type: grant.eventType,
    event_sequence: 1,
    state_version: 1,
    occurred_at: new Date(Date.now() - 1_000).toISOString(),
    canonical_url: grant.canonicalUrl,
    ...overrides,
  };
}

function signedEnvelope(
  event: EventBody,
  options: { timestamp?: string; keyId?: string } = {}
): EventEnvelope {
  const body = canonicalJson(event);
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1_000));
  const keyId = options.keyId ?? hostKeyId;
  const signature = sign(
    null,
    Buffer.from(`${timestamp}.${body}`, "utf8"),
    privateKey
  ).toString("base64url");
  return {
    body,
    headers: {
      "WebMCP-Reentry-Key-Id": keyId,
      "WebMCP-Reentry-Timestamp": timestamp,
      "WebMCP-Reentry-Signature": signature,
    },
  };
}

async function postEvent(envelope: JsonObject | string) {
  return request(app)
    .post("/v0.1/events")
    .set("Content-Type", "application/json")
    .send(envelope);
}

async function expectEventError(
  envelope: JsonObject | string,
  status: number,
  code: string
): Promise<void> {
  const response = await postEvent(envelope);
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code } });
}

async function countRows(table: "cr2_events" | "cr2_deliveries", value: string) {
  const tableState = await prisma.$queryRaw<Array<{ relation_name: string | null }>>`
    SELECT to_regclass(${table})::text AS relation_name
  `;
  if (!tableState[0]?.relation_name) {
    return 0;
  }

  if (table === "cr2_events") {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "cr2_events"
      WHERE "event_id" = ${value}
    `;
    return Number(rows[0]?.count ?? 0n);
  }
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_deliveries"
    WHERE "grant_id" = ${value}
  `;
  return Number(rows[0]?.count ?? 0n);
}

async function grantState(grantId: string): Promise<{ runsRemaining: number; eventCount: number; deliveryCount: number }> {
  const grant = await prisma.grant.findUnique({ where: { id: grantId } });
  return {
    runsRemaining: grant?.runsRemaining ?? -1,
    eventCount: await countRows("cr2_events", `unused-${grantId}`),
    deliveryCount: await countRows("cr2_deliveries", grantId),
  };
}

describe("Cloud Receiver v2 signed Event ingress red tests", () => {
  beforeAll(async () => {
    await clearTestAccounts(userEmail);
    const user = await userAgent.post("/v1/auth/users/register").send({
      email: userEmail,
      password,
    });
    expect(user.status).toBe(201);
    userId = user.body.data.id as string;

    const developer = await request(app)
      .post("/v1/auth/developers/register")
      .send({ email: developerEmail, password });
    expect(developer.status).toBe(201);

    const organization = await prisma.organization.create({
      data: { developerId: developer.body.data.id as string, name: `Event Org ${suffix}` },
    });
    organizationId = organization.id;
    organizationApiKey = randomBytes(32).toString("base64url");
    await prisma.organizationApiKey.create({
      data: {
        organizationId,
        keyDigest: digestSecret(organizationApiKey),
        keyPrefix: organizationApiKey.slice(0, 8),
      },
    });

    const hostKey = await request(app)
      .post("/v0.1/host-keys")
      .set("Authorization", `Bearer ${organizationApiKey}`)
      .send({
        host_id: hostId,
        issuer_origin: origin,
        key_id: hostKeyId,
        public_key_pem: publicKeyPem,
      });
    expect(hostKey.status).toBe(201);

    // The fixture is paired and persisted, but no Connector process is started.
    // EVENT-001 must still be accepted and queued.
    stoppedConnectorId = await createConnector("Stopped Event Connector");
    expect(userId).toEqual(expect.any(String));
  });

  afterAll(async () => {
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
  });

  it("EVENT-001 accepts a valid signed Event and atomically creates one pending delivery with the Connector stopped", async () => {
    const grant = await createGrant("001");
    const event = eventFor(grant, `event-001-${suffix}`);
    const envelope = signedEnvelope(event);
    const response = await postEvent(envelope);

    expect(response.status).toBe(202);
    expectExactKeys(response.body, [
      "type",
      "protocol_version",
      "event_id",
      "correlation_id",
      "accepted",
      "duplicate",
      "status",
    ]);
    expect(response.body).toEqual({
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: event.event_id,
      correlation_id: event.correlation_id,
      accepted: true,
      duplicate: false,
      status: "accepted",
    });

    const events = await prisma.$queryRaw<Array<{ event_id: string; grant_id: string; canonical_body: string }>>`
      SELECT "event_id", "grant_id", "canonical_body"
      FROM "cr2_events"
      WHERE "event_id" = ${event.event_id as string}
    `;
    const deliveries = await prisma.$queryRaw<Array<{ event_id: string; grant_id: string; delivery_target_id: string; status: string }>>`
      SELECT "event_id", "grant_id", "delivery_target_id", "status"
      FROM "cr2_deliveries"
      WHERE "event_id" = ${event.event_id as string}
    `;
    const grantAfter = await prisma.grant.findUnique({ where: { id: grant.id } });

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      event_id: event.event_id,
      grant_id: grant.id,
      canonical_body: envelope.body,
    });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toEqual({
      event_id: event.event_id,
      grant_id: grant.id,
      delivery_target_id: grant.deliveryTargetId,
      status: "pending",
    });
    expect(grantAfter?.runsRemaining).toBe(0);
    expect(JSON.stringify(response.body)).not.toContain(stoppedConnectorId);

    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'cr2_events'
    `;
    expect(columns.map((column) => column.column_name)).not.toContain("signature");
  });

  it("EVENT-002 returns an exact duplicate without a second Event, delivery, or run reservation", async () => {
    const grant = await createGrant("002");
    const event = eventFor(grant, `event-002-${suffix}`);
    const envelope = signedEnvelope(event);
    const first = await postEvent(envelope);
    expect(first.status).toBe(202);

    const replay = await postEvent(envelope);
    expect(replay.status).toBe(202);
    expect(replay.body).toEqual({ ...first.body, duplicate: true });

    const conflicting = await postEvent(
      signedEnvelope({ ...event, state_version: 2 })
    );
    expect(conflicting.status).toBe(409);
    expect(conflicting.body).toEqual({ error: { code: "event_identity_conflict" } });

    const events = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "cr2_events" WHERE "event_id" = ${event.event_id as string}
    `;
    const deliveries = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "cr2_deliveries" WHERE "event_id" = ${event.event_id as string}
    `;
    const grantAfter = await prisma.grant.findUnique({ where: { id: grant.id } });
    expect(Number(events[0]?.count ?? 0n)).toBe(1);
    expect(Number(deliveries[0]?.count ?? 0n)).toBe(1);
    expect(grantAfter?.runsRemaining).toBe(0);

    const concurrentGrant = await createGrant("002-concurrent");
    const concurrentEvent = eventFor(concurrentGrant, `event-002-concurrent-${suffix}`);
    const concurrentEnvelope = signedEnvelope(concurrentEvent);
    const concurrent = await Promise.all([
      postEvent(concurrentEnvelope),
      postEvent(concurrentEnvelope),
    ]);
    expect(concurrent.map((response) => response.status)).toEqual([202, 202]);
    expect(concurrent.map((response) => response.body.duplicate).sort()).toEqual([false, true]);
    expect(
      await countRows("cr2_events", concurrentEvent.event_id as string)
    ).toBe(1);
    expect(
      await countRows("cr2_deliveries", concurrentGrant.id)
    ).toBe(1);
    expect(
      (await prisma.grant.findUnique({ where: { id: concurrentGrant.id } }))?.runsRemaining
    ).toBe(0);

    await prisma.$disconnect();
    const restartedApp = createApp();
    const replayAfterRestart = await request(restartedApp)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .send(concurrentEnvelope);
    expect(replayAfterRestart.status).toBe(202);
    expect(replayAfterRestart.body).toEqual({
      ...concurrent.find((response) => response.body.duplicate === false)?.body,
      duplicate: true,
    });
    expect(
      await countRows("cr2_events", concurrentEvent.event_id as string)
    ).toBe(1);
    expect(
      await countRows("cr2_deliveries", concurrentGrant.id)
    ).toBe(1);
  });

  it("EVENT-003 rejects bad signature, time, origin/key, binding, body, sequence, and state without mutation", async () => {
    const grant = await createGrant("003");
    const baseline = await grantState(grant.id);
    const validEvent = eventFor(grant, `event-003-base-${suffix}`);
    const validEnvelope = signedEnvelope(validEvent);

    await expectEventError(
      { body: canonicalJson({ ...validEvent, state_version: 2 }), headers: validEnvelope.headers },
      401,
      "event_signature_invalid"
    );
    await expectEventError(
      signedEnvelope(validEvent, {
        timestamp: String(Math.floor((Date.now() - 6 * 60 * 1_000) / 1_000)),
      }),
      401,
      "event_delivery_timestamp_outside_window"
    );
    await expectEventError(
      signedEnvelope(
        { ...validEvent, event_id: `event-003-future-${suffix}`, occurred_at: isoIn(2 * 60 * 1_000) }
      ),
      422,
      "event_occurred_in_future"
    );
    await expectEventError(
      signedEnvelope(
        {
          ...validEvent,
          event_id: `event-003-origin-${suffix}`,
          issuer_origin: wrongOrigin,
          canonical_url: `${wrongOrigin}/workflows/event-003-origin`,
        }
      ),
      422,
      "event_origin_mismatch"
    );
    await expectEventError(
      signedEnvelope(
        { ...validEvent, event_id: `event-003-key-${suffix}` },
        { keyId: `unknown-key-${suffix}` }
      ),
      401,
      "event_key_unavailable"
    );
    await expectEventError(
      signedEnvelope({ ...validEvent, event_id: `event-003-binding-${suffix}`, binding_id: `missing-binding-${suffix}` }),
      422,
      "event_scope_invalid"
    );
    await expectEventError(
      signedEnvelope({ ...validEvent, event_id: `event-003-sequence-${suffix}`, event_sequence: 2 }),
      422,
      "event_sequence_invalid"
    );
    await expectEventError(
      signedEnvelope({ ...validEvent, event_id: `event-003-state-${suffix}`, state_version: -1 }),
      422,
      "protocol_integer_invalid"
    );
    await expectEventError(
      { body: "not-json", headers: validEnvelope.headers },
      400,
      "event_body_invalid"
    );

    expect(await grantState(grant.id)).toEqual(baseline);
  });

  it("EVENT-004 rejects validly signed Events for expired, exhausted, and revoked Grants before queueing", async () => {
    const expired = await createGrant("004-expired");
    await prisma.grant.update({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await expectEventError(
      signedEnvelope(eventFor(expired, `event-004-expired-${suffix}`)),
      410,
      "grant_expired"
    );

    const exhausted = await createGrant("004-exhausted");
    await prisma.grant.update({ where: { id: exhausted.id }, data: { runsRemaining: 0 } });
    await expectEventError(
      signedEnvelope(eventFor(exhausted, `event-004-exhausted-${suffix}`)),
      409,
      "grant_exhausted"
    );

    const revoked = await createGrant("004-revoked");
    expect(appConfig.grantControlToken).toEqual(expect.any(String));
    await revokeGrantInternally({
      grantId: revoked.id,
      controlToken: appConfig.grantControlToken as string,
    });
    await expectEventError(
      signedEnvelope(eventFor(revoked, `event-004-revoked-${suffix}`)),
      422,
      "grant_revoked"
    );

    const events = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "cr2_events"
      WHERE "event_id" IN (
        ${`event-004-expired-${suffix}`},
        ${`event-004-exhausted-${suffix}`},
        ${`event-004-revoked-${suffix}`}
      )
    `;
    const deliveries = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "cr2_deliveries"
      WHERE "grant_id" IN (${expired.id}, ${exhausted.id}, ${revoked.id})
    `;
    expect(Number(events[0]?.count ?? 0n)).toBe(0);
    expect(Number(deliveries[0]?.count ?? 0n)).toBe(0);
    expect((await prisma.grant.findUnique({ where: { id: expired.id } }))?.runsRemaining).toBe(1);
    expect((await prisma.grant.findUnique({ where: { id: exhausted.id } }))?.runsRemaining).toBe(0);
    expect((await prisma.grant.findUnique({ where: { id: revoked.id } }))?.revokedAt).not.toBeNull();
  });
});
