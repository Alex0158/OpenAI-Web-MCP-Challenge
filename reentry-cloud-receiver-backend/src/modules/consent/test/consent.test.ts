import { generateKeyPairSync, sign, randomBytes } from "node:crypto";
import { runInNewContext } from "node:vm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { appConfig } from "../../../config/config";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { digestSecret } from "../../../middleware/organization-auth";
import { clearTestAccounts } from "../../../test/helper";
import { assertGrantAllowsNewWork, revokeGrantInternally } from "../grant-control";
import { canonicalJson } from "../manifest";

const app = createApp();
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const userEmail = `consent-user-${suffix}@example.com`;
const developerEmail = `consent-developer-${suffix}@example.com`;
const password = "correct horse battery staple";
const origin = `https://consent-host-${suffix}.example`;
const hostId = `host-${suffix}`;
const hostKeyId = `host-key-${suffix}`;
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

const userAgent = request.agent(app);
let userId = "";
let organizationId = "";
let organizationApiKey = "";
let firstConnectorId = "";
let firstDeliveryTargetId = "";
let secondConnectorId = "";

type JsonObject = Record<string, any>;

function expectExactKeys(value: JsonObject, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function expectNoPrivateHostValues(body: JsonObject, ...values: string[]): void {
  const serialized = JSON.stringify(body);
  for (const value of values) {
    expect(serialized).not.toContain(value);
  }
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

async function getConsentStatus(consentSessionId: string) {
  return request(app)
    .get(`/v0.1/consent-sessions/${consentSessionId}`)
    .set("Authorization", `Bearer ${organizationApiKey}`);
}

async function decide(token: string, action: "approve" | "decline", connectorId?: string) {
  const body: JsonObject = { consent_token: token, action };
  if (action === "approve") body.connector_id = connectorId;
  return userAgent
    .post("/v0.1/account-consent-decisions")
    .set("Origin", "http://localhost:4000")
    .set("Content-Type", "application/json")
    .send(body);
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

async function runConsentPageDecision(
  page: string,
  token: string,
  action: "approve" | "decline",
  responseOk: boolean
): Promise<{
  messages: Array<{ message: JsonObject; targetOrigin: string }>;
  requestBody: JsonObject;
  resultText: string;
}> {
  const script = page.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];
  expect(script).toBeDefined();

  const clickHandlers = new Map<string, () => void>();
  const result = { textContent: "" };
  const connector = { value: firstConnectorId };
  const card = { classList: { add: jest.fn() } };
  const button = (selector: string) => ({
    disabled: false,
    addEventListener: (_type: string, listener: () => void) => {
      clickHandlers.set(selector, listener);
    },
    remove: jest.fn(),
  });
  const elements: Record<string, any> = {
    'input[name="connector"]': connector,
    'input[name="connector"]:checked': connector,
    ".consent-card": card,
    "#result": result,
    "#approve": button("#approve"),
    "#decline": button("#decline"),
  };
  const messages: Array<{ message: JsonObject; targetOrigin: string }> = [];
  let requestBody: JsonObject = {};

  runInNewContext(script ?? "", {
    URLSearchParams,
    location: {
      search: `?token=${encodeURIComponent(token)}`,
      origin: "http://localhost:4000",
    },
    window: {
      location: {
        origin: "http://localhost:4000",
        search: `?token=${encodeURIComponent(token)}`,
      },
      opener: {
        postMessage(message: JsonObject, targetOrigin: string) {
          messages.push({ message, targetOrigin });
        },
      },
    },
    document: {
      querySelector(selector: string) {
        const element = elements[selector];
        if (!element) throw new Error(`Unexpected selector: ${selector}`);
        return element;
      },
    },
    fetch: async (_url: string, options: { body: string }) => {
      requestBody = JSON.parse(options.body) as JsonObject;
      return {
        ok: responseOk,
        json: async () => (responseOk ? { status: action === "approve" ? "approved" : "declined" } : {}),
      };
    },
  });

  const click = clickHandlers.get(`#${action}`);
  expect(click).toBeDefined();
  click?.();
  await new Promise<void>((resolve) => setImmediate(resolve));

  return { messages, requestBody, resultText: result.textContent };
}

describe("Cloud Receiver v2 Consent, Target, and revocation red tests", () => {
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
      data: { developerId: developer.body.data.id as string, name: `Consent Org ${suffix}` },
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
    expectExactKeys(hostKey.body, [
      "type",
      "protocol_version",
      "host_id",
      "issuer_origin",
      "key_id",
      "status",
      "duplicate",
    ]);
    expect(hostKey.body.issuer_origin).toBe(origin);
    expect(hostKey.body.duplicate).toBe(false);

    firstConnectorId = await createConnector("Consent Mac One");
    const firstConnector = await prisma.connector.findUnique({
      where: { id: firstConnectorId },
      select: { deliveryTargetId: true },
    });
    expect(firstConnector).not.toBeNull();
    firstDeliveryTargetId = firstConnector?.deliveryTargetId ?? "";
  });

  afterAll(async () => {
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await clearTestAccounts(userEmail);
    await clearTestAccounts(developerEmail);
  });

  it("CONSENT-001 registers Host keys and creates an opaque, digest-backed consent session", async () => {
    const subject = `subject-consent-001-${suffix}`;
    const manifest = manifestFor(`manifest-consent-001-${suffix}`);
    const response = await createConsent(manifest, subject);

    expect(response.status).toBe(201);
    expectExactKeys(response.body, [
      "type",
      "protocol_version",
      "consent_session_id",
      "challenge",
      "consent_url",
      "expires_at",
      "duplicate",
    ]);
    expect(response.body.type).toBe("webmcp.reentry_consent_session");
    expect(response.body.protocol_version).toBe("0.1");
    expect(response.body.consent_session_id).toEqual(expect.any(String));
    expect(response.body.duplicate).toBe(false);
    expect(response.body.consent_url).toMatch(/^http:\/\/localhost:4000\/consent\?token=/);
    expectExactKeys(response.body.challenge, [
      "challenge_id",
      "manifest_id",
      "correlation_id",
      "status",
      "issuer_origin",
      "offer_expires_at",
      "workflow",
      "display",
      "grant_scope",
    ]);
    expect(response.body.challenge.status).toBe("pending");
    expect(response.body.challenge.grant_scope.expires_at).toBe(response.body.expires_at);

    const token = consentTokenFromUrl(response.body.consent_url);
    expectNoPrivateHostValues(
      response.body,
      userId,
      firstConnectorId,
      firstDeliveryTargetId,
      subject
    );

    const session = await prisma.consentSession.findUnique({
      where: { id: response.body.consent_session_id },
    });
    expect(session).not.toBeNull();
    expect(session?.tokenDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(session?.tokenDigest).not.toBe(token);
    expect(session?.hostSubjectRefDigest).toBe(digestSecret(subject));
    expect(session?.hostSubjectRefDigest).not.toBe(subject);
    expect(session?.status).toBe("pending");
    expect(JSON.stringify(session)).not.toContain(token);

    const duplicate = await createConsent(manifest, subject);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect(duplicate.body.consent_session_id).toBe(response.body.consent_session_id);
    expect(duplicate.body.consent_url).toBe(response.body.consent_url);
  });

  it("CONSENT-002 persists approval, decline, and pending decisions with one Grant only for approval", async () => {
    const approved = await createConsent(
      manifestFor(`manifest-consent-002-approved-${suffix}`),
      `subject-consent-002-approved-${suffix}`
    );
    expect(approved.status).toBe(201);
    const approvedToken = consentTokenFromUrl(approved.body.consent_url);
    const approval = await decide(approvedToken, "approve", firstConnectorId);
    expect(approval.status).toBe(200);
    expectExactKeys(approval.body, [
      "type",
      "protocol_version",
      "consent_session_id",
      "challenge_id",
      "status",
      "duplicate",
    ]);
    expect(approval.body.status).toBe("approved");
    expect(approval.body.duplicate).toBe(false);

    const approvedRow = await prisma.consentSession.findUnique({
      where: { id: approved.body.consent_session_id },
      include: { grant: true },
    });
    expect(approvedRow?.status).toBe("approved");
    expect(approvedRow?.decisionAction).toBe("approve");
    expect(approvedRow?.decisionAt).not.toBeNull();
    expect(approvedRow?.accountId).toBe(userId);
    expect(approvedRow?.grant).toEqual(
      expect.objectContaining({
        accountId: userId,
        connectorId: firstConnectorId,
        deliveryTargetId: firstDeliveryTargetId,
        runsRemaining: 1,
        maxRuns: 1,
      })
    );

    const approvalReplay = await decide(approvedToken, "approve", firstConnectorId);
    expect(approvalReplay.status).toBe(200);
    expect(approvalReplay.body.duplicate).toBe(true);
    expect(
      await prisma.grant.count({ where: { consentSessionId: approved.body.consent_session_id } })
    ).toBe(1);

    const declined = await createConsent(
      manifestFor(`manifest-consent-002-declined-${suffix}`),
      `subject-consent-002-declined-${suffix}`
    );
    const decline = await decide(consentTokenFromUrl(declined.body.consent_url), "decline");
    expect(decline.status).toBe(200);
    expect(decline.body.status).toBe("declined");
    const declinedRow = await prisma.consentSession.findUnique({
      where: { id: declined.body.consent_session_id },
      include: { grant: true },
    });
    expect(declinedRow?.status).toBe("declined");
    expect(declinedRow?.decisionAction).toBe("decline");
    expect(declinedRow?.grant).toBeNull();

    const pending = await createConsent(
      manifestFor(`manifest-consent-002-pending-${suffix}`),
      `subject-consent-002-pending-${suffix}`
    );
    const pendingStatus = await getConsentStatus(pending.body.consent_session_id);
    expect(pendingStatus.status).toBe(200);
    expect(pendingStatus.body.status).toBe("pending");
    expect(pendingStatus.body.effective_status).toBeNull();
    expect(pendingStatus.body.binding).toBeNull();
    expectNoPrivateHostValues(pendingStatus.body, userId, firstConnectorId, firstDeliveryTargetId);

    const pendingToken = consentTokenFromUrl(pending.body.consent_url);
    const unauthenticatedPage = await request(app).get(
      `/consent?token=${encodeURIComponent(pendingToken)}`
    );
    expect(unauthenticatedPage.status).toBe(302);
    expect(unauthenticatedPage.headers["cross-origin-opener-policy"]).toBe("unsafe-none");
    expect(unauthenticatedPage.headers.location).toContain("/user-login?return_to=");
    const authenticatedPage = await userAgent.get(
      `/consent?token=${encodeURIComponent(pendingToken)}`
    );
    expect(authenticatedPage.status).toBe(200);
    expect(authenticatedPage.headers["cross-origin-opener-policy"]).toBe("unsafe-none");
    expect(authenticatedPage.text).toContain("Review manifest-consent-002-pending");
    expect(authenticatedPage.text).not.toContain(pendingToken);

    const unknownPage = await userAgent.get(`/consent?token=${"A".repeat(43)}`);
    expect(unknownPage.status).toBe(404);
    expect(unknownPage.body.error?.code).toBe("consent_token_invalid");
  });

  it("CONSENT-003 derives active, expired, exhausted, and revoked without changing the decision fact", async () => {
    const response = await createConsent(
      manifestFor(`manifest-consent-003-${suffix}`),
      `subject-consent-003-${suffix}`
    );
    const decision = await decide(
      consentTokenFromUrl(response.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(decision.status).toBe(200);
    const grant = await prisma.grant.findUnique({
      where: { consentSessionId: response.body.consent_session_id },
    });
    expect(grant).not.toBeNull();
    const grantId = grant?.id ?? "";

    let status = await getConsentStatus(response.body.consent_session_id);
    expect(status.body.status).toBe("approved");
    expect(status.body.effective_status).toBe("active");

    await prisma.grant.update({
      where: { id: grantId },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    status = await getConsentStatus(response.body.consent_session_id);
    expect(status.body.status).toBe("approved");
    expect(status.body.effective_status).toBe("expired");
    await expect(assertGrantAllowsNewWork(grantId)).rejects.toMatchObject({ code: "grant_expired" });

    await prisma.grant.update({
      where: { id: grantId },
      data: { expiresAt: new Date(Date.now() + 60_000), runsRemaining: 0 },
    });
    status = await getConsentStatus(response.body.consent_session_id);
    expect(status.body.effective_status).toBe("exhausted");
    await expect(assertGrantAllowsNewWork(grantId)).rejects.toMatchObject({ code: "grant_exhausted" });

    await prisma.grant.update({
      where: { id: grantId },
      data: { revokedAt: new Date(), runsRemaining: 1 },
    });
    status = await getConsentStatus(response.body.consent_session_id);
    expect(status.body.effective_status).toBe("revoked");
    await expect(assertGrantAllowsNewWork(grantId)).rejects.toMatchObject({ code: "grant_revoked" });
    const unchanged = await prisma.consentSession.findUnique({
      where: { id: response.body.consent_session_id },
    });
    expect(unchanged?.status).toBe("approved");
  });

  it("TARGET-001 converges same-subject approvals on one target and never creates a second binding", async () => {
    const subject = `subject-target-001-${suffix}`;
    const first = await createConsent(manifestFor(`manifest-target-001-first-${suffix}`), subject);
    const firstDecision = await decide(
      consentTokenFromUrl(first.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(firstDecision.status).toBe(200);

    const replay = await decide(
      consentTokenFromUrl(first.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);

    const second = await createConsent(manifestFor(`manifest-target-001-second-${suffix}`), subject);
    const secondDecision = await decide(
      consentTokenFromUrl(second.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(secondDecision.status).toBe(200);
    expect(secondDecision.body.duplicate).toBe(false);

    const bindings = await prisma.hostSubjectBinding.findMany({
      where: { organizationId, hostSubjectRefDigest: digestSecret(subject) },
    });
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toEqual(
      expect.objectContaining({ connectorId: firstConnectorId, deliveryTargetId: firstDeliveryTargetId })
    );
    const grants = await prisma.grant.findMany({
      where: {
        organizationId,
        consentSessionId: { in: [first.body.consent_session_id, second.body.consent_session_id] },
      },
    });
    expect(grants).toHaveLength(2);
    expect(new Set(grants.map((grant) => grant.deliveryTargetId))).toEqual(
      new Set([firstDeliveryTargetId])
    );
  });

  it("TARGET-002 rejects a different Connector without changing the original binding or leaking credentials", async () => {
    secondConnectorId = await createConnector("Consent Mac Two");
    const subject = `subject-target-002-${suffix}`;
    const first = await createConsent(manifestFor(`manifest-target-002-first-${suffix}`), subject);
    const firstDecision = await decide(
      consentTokenFromUrl(first.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(firstDecision.status).toBe(200);

    const conflicting = await createConsent(manifestFor(`manifest-target-002-conflict-${suffix}`), subject);
    const decision = await decide(
      consentTokenFromUrl(conflicting.body.consent_url),
      "approve",
      secondConnectorId
    );
    expect(decision.status).toBe(409);
    expect(decision.body.error?.code).toBe("host_subject_binding_conflict");
    expectNoPrivateHostValues(decision.body, secondConnectorId, firstConnectorId, firstDeliveryTargetId);

    const binding = await prisma.hostSubjectBinding.findUnique({
      where: {
        organizationId_hostSubjectRefDigest: {
          organizationId,
          hostSubjectRefDigest: digestSecret(subject),
        },
      },
    });
    expect(binding).toEqual(
      expect.objectContaining({ connectorId: firstConnectorId, deliveryTargetId: firstDeliveryTargetId })
    );
    expect(
      await prisma.grant.count({ where: { consentSessionId: conflicting.body.consent_session_id } })
    ).toBe(0);
    const stillPending = await getConsentStatus(conflicting.body.consent_session_id);
    expect(stillPending.body.status).toBe("pending");
    expect(stillPending.body.binding).toBeNull();
  });

  it("REVOKE-001 revokes through the configured internal authority, fences new work, and keeps public Grant routes blocked", async () => {
    const response = await createConsent(
      manifestFor(`manifest-revoke-001-${suffix}`),
      `subject-revoke-001-${suffix}`
    );
    const decision = await decide(
      consentTokenFromUrl(response.body.consent_url),
      "approve",
      firstConnectorId
    );
    expect(decision.status).toBe(200);
    const grant = await prisma.grant.findUnique({
      where: { consentSessionId: response.body.consent_session_id },
    });
    expect(grant).not.toBeNull();
    const grantId = grant?.id ?? "";
    expect(appConfig.grantControlToken).toEqual(expect.any(String));

    const publicInspect = await request(app)
      .get(`/v0.1/grants/${grantId}`)
      .set("Authorization", `Bearer ${organizationApiKey}`);
    const publicRevoke = await request(app)
      .post(`/v0.1/grants/${grantId}/revoke`)
      .set("Authorization", `Bearer ${organizationApiKey}`)
      .send({});
    expect(publicInspect.status).toBe(404);
    expect(publicRevoke.status).toBe(404);
    expect(publicInspect.body.error?.code).toBe("http_route_not_found");
    expect(publicRevoke.body.error?.code).toBe("http_route_not_found");

    const revoked = await revokeGrantInternally({
      grantId,
      controlToken: appConfig.grantControlToken as string,
    });
    expect(revoked.duplicate).toBe(false);
    expect(revoked.revokedAt).toEqual(expect.any(String));
    const replay = await revokeGrantInternally({
      grantId,
      controlToken: appConfig.grantControlToken as string,
    });
    expect(replay).toEqual({ ...revoked, duplicate: true });

    const stored = await prisma.grant.findUnique({ where: { id: grantId } });
    expect(stored?.revokedAt?.toISOString()).toBe(revoked.revokedAt);
    expect(stored).not.toBeNull();
    await expect(assertGrantAllowsNewWork(grantId)).rejects.toMatchObject({ code: "grant_revoked" });

    const status = await getConsentStatus(response.body.consent_session_id);
    expect(status.status).toBe(200);
    expect(status.body.status).toBe("approved");
    expect(status.body.effective_status).toBe("revoked");
    expectNoPrivateHostValues(status.body, userId, firstConnectorId, firstDeliveryTargetId);

    const eventRoute = await request(app)
      .post("/v0.1/events")
      .set("Authorization", `Bearer ${organizationApiKey}`)
      .send({});
    expect(eventRoute.status).toBe(400);
    expect(eventRoute.body.error?.code).toBe("http_body_invalid");
  });

  it("DISCONNECT-003 excludes a remotely disconnected Mac from new consent choices", async () => {
    const deviceName = `Disconnected Consent Mac ${suffix}`;
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

    const pending = await createConsent(
      manifestFor(`manifest-disconnect-003-${suffix}`),
      `subject-disconnect-003-${suffix}`,
    );
    expect(pending.status).toBe(201);
    const token = consentTokenFromUrl(pending.body.consent_url);

    const beforeDisconnect = await userAgent.get(
      `/consent?token=${encodeURIComponent(token)}`,
    );
    expect(beforeDisconnect.status).toBe(200);
    expect(beforeDisconnect.text).toContain(deviceName);

    const disconnected = await request(app)
      .post("/v0.1/connectors/disconnect")
      .set("Content-Type", "application/json")
      .send({ connector_token: claim.body.connector_token });
    expect(disconnected.status).toBe(200);

    const afterDisconnect = await userAgent.get(
      `/consent?token=${encodeURIComponent(token)}`,
    );
    expect(afterDisconnect.status).toBe(200);
    expect(afterDisconnect.text).not.toContain(deviceName);
    expect(afterDisconnect.text).toContain("Consent Mac One");
  });

  it("CONSENT-004 sends only the public completion message after a successful popup decision", async () => {
    const approved = await createConsent(
      manifestFor(`manifest-consent-004-approved-${suffix}`),
      `subject-consent-004-approved-${suffix}`
    );
    const approvedToken = consentTokenFromUrl(approved.body.consent_url);
    const approvedPage = await userAgent.get(
      `/consent?token=${encodeURIComponent(approvedToken)}`
    );
    expect(approvedPage.status).toBe(200);

    const approval = await runConsentPageDecision(
      approvedPage.text,
      approvedToken,
      "approve",
      true
    );
    expect(approval.messages).toEqual([
      {
        message: {
          type: "reentry.consent.complete",
          consent_session_id: approved.body.consent_session_id,
          status: "approved",
        },
        targetOrigin: origin,
      },
    ]);
    expect(approval.requestBody).toEqual({
      consent_token: approvedToken,
      action: "approve",
      connector_id: firstConnectorId,
    });
    expect(approval.resultText).toBe("Approved. The return path is ready.");
    expect(JSON.stringify(approval.messages)).not.toContain(approvedToken);
    expect(JSON.stringify(approval.messages)).not.toContain(firstConnectorId);

    const declined = await createConsent(
      manifestFor(`manifest-consent-004-declined-${suffix}`),
      `subject-consent-004-declined-${suffix}`
    );
    const declinedToken = consentTokenFromUrl(declined.body.consent_url);
    const declinedPage = await userAgent.get(
      `/consent?token=${encodeURIComponent(declinedToken)}`
    );
    const decline = await runConsentPageDecision(
      declinedPage.text,
      declinedToken,
      "decline",
      true
    );
    expect(decline.messages).toEqual([
      {
        message: {
          type: "reentry.consent.complete",
          consent_session_id: declined.body.consent_session_id,
          status: "declined",
        },
        targetOrigin: origin,
      },
    ]);
    expect(decline.requestBody).toEqual({
      consent_token: declinedToken,
      action: "decline",
    });
    expect(decline.resultText).toBe("Declined. Nothing was approved.");

    const failed = await runConsentPageDecision(
      approvedPage.text,
      approvedToken,
      "approve",
      false
    );
    expect(failed.messages).toEqual([]);
    expect(failed.resultText).toBe("The decision could not be saved. Please try again.");
  });

  it("CONSENT-005 rejects a decision submitted from the frontend origin", async () => {
    const response = await createConsent(
      manifestFor(`manifest-consent-005-${suffix}`),
      `subject-consent-005-${suffix}`
    );
    const token = consentTokenFromUrl(response.body.consent_url);

    const rejected = await userAgent
      .post("/v0.1/account-consent-decisions")
      .set("Origin", "http://localhost:3000")
      .set("Content-Type", "application/json")
      .send({
        consent_token: token,
        action: "approve",
        connector_id: firstConnectorId,
      });

    expect(rejected.status).toBe(403);
    expect(rejected.body).toEqual({ error: { code: "csrf_origin_invalid" } });
    expect((await getConsentStatus(response.body.consent_session_id)).body.status).toBe("pending");
  });
});
