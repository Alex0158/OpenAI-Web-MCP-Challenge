import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createAccountConsentControlPlane } from "../src/account-consent-control.mjs";
import { CloudAccountStore } from "../src/account-store.mjs";
import { createCloudConsoleControlPlane } from "../src/dashboard-control.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import { createCloudReceiverVercelHandler } from "../api/index.mjs";
import { renderAuthPageSimple } from "../src/console-pages.mjs";

test("Cloud console maps duplicate account identity to a stable conflict", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-cloud-errors-"));
  const store = new CloudAccountStore({ filename: join(directory, "accounts.sqlite") });
  const control = createCloudConsoleControlPlane({ store });
  t.after(() => {
    store.close();
    return rm(directory, { recursive: true, force: true });
  });

  const body = { identity: "duplicate@example.test", password: "preview-password" };
  const first = responseStub();
  await control.handler(jsonRequest("/api/auth/register", body), first);
  assert.equal(first.statusCode, 201);

  const duplicate = responseStub();
  await control.handler(jsonRequest("/api/auth/register", body), duplicate);
  assert.equal(duplicate.statusCode, 409);
  assert.deepEqual(JSON.parse(duplicate.body), { error: { code: "account_exists" } });
});

test("Cloud console contains route and storage failures without leaking internals", async () => {
  const routeControl = createCloudConsoleControlPlane({
    store: { getSession() { return null; } },
  });
  const routeResponse = responseStub();
  await routeControl.handler(
    { method: "GET", url: "/api/organizations/bad%2Fid/api-keys", headers: {} },
    routeResponse,
  );
  assert.equal(routeResponse.statusCode, 400);
  assert.deepEqual(JSON.parse(routeResponse.body), {
    error: { code: "console_route_invalid" },
  });

  const storageControl = createCloudConsoleControlPlane({
    store: {
      getSession() {
        throw Object.assign(new Error("private database detail"), {
          code: "ERR_SQLITE_ERROR",
        });
      },
    },
  });
  const pageResponse = responseStub();
  await storageControl.handler(
    { method: "GET", url: "/dashboard", headers: { cookie: "reentry_session=valid-session-token" } },
    pageResponse,
  );
  assert.equal(pageResponse.statusCode, 500);
  assert.match(pageResponse.body, /We couldn.t load this page/);
  assert.doesNotMatch(pageResponse.body, /private database detail/);

  const apiControl = createCloudConsoleControlPlane({
    store: {
      getSession() { return null; },
      registerAccount() {
        throw Object.assign(new Error("private database detail"), {
          code: "database_password_exposed",
        });
      },
    },
  });
  const apiResponse = responseStub();
  await apiControl.handler(jsonRequest("/api/auth/register", {
    identity: "safe@example.test",
    password: "preview-password",
  }), apiResponse);
  assert.equal(apiResponse.statusCode, 500);
  assert.deepEqual(JSON.parse(apiResponse.body), {
    error: { code: "console_internal_error" },
  });
});

test("Cloud console registration copy separates the account from organizations", () => {
  const html = renderAuthPageSimple("register");
  assert.match(html, /Create your developer account/);
  assert.match(html, /Create your developer account, then add the organizations/);
  assert.match(html, /account_exists: "This account already exists\. Use Log in instead\."/);
  assert.doesNotMatch(html, /Create your workspace/);
});

test("Consent page gives the current Connector setup when no Mac is connected", async () => {
  const token = "A".repeat(43);
  const control = createAccountConsentControlPlane({
    store: {
      ready() { return true; },
      createConsentSession() {},
      getConsentSessionById() { return null; },
      getConsentSessionByChallengeId() { return null; },
      getConsentSessionByTokenDigest() {
        return {
          consent_session_id: "consent_1",
          challenge_id: "challenge_1",
          organization_id: "org_1",
          status: "pending",
          expires_at: "2099-01-01T00:00:00.000Z",
        };
      },
      prepareConsentDecision() {},
      finalizeConsentSession() {},
    },
    connectorControl: {
      listAccountConnectors() { return []; },
      getAccountConnector() { return null; },
      bindHostSubject() {},
    },
    accountAuthority: {
      readAccount() {
        return { account_id: "acct_1", identity: "person@example.test" };
      },
    },
    getReceiver() {
      return {
        createConsentChallenge() {},
        getConsentChallenge() {
          return {
            issuer_origin: "https://host.example",
            display: { title: "Continue this workflow", reason: "A later step is ready." },
            workflow: { id: "workflow_1" },
            grant_scope: { event_type: "workflow.ready", expires_at: "2099-01-01T00:00:00.000Z" },
          };
        },
        decideConsent() {},
      };
    },
    authenticateOrganization() { return { organization_id: "org_1" }; },
    tokenSecret: "consent-test-secret",
    clock: () => new Date("2026-09-02T00:00:00.000Z"),
    createId: (prefix) => `${prefix}_1`,
  });
  const response = responseStub();
  await control.handler(
    { method: "GET", url: `/consent?token=${token}`, headers: {} },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Install the Re-entry Connector/);
  assert.match(response.body, /Pair this Mac/);
  assert.doesNotMatch(response.body, /reentry connect/);
});

test("Vercel readiness converts a persistence exception into a bounded response", async () => {
  const handler = createCloudReceiverVercelHandler({
    deprecated: false,
    createPersistence() {
      return {
        ready() {
          throw new Error("private database detail");
        },
      };
    },
    environment: {
      CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET: "handler-test-secret",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "postgresql://preview.invalid/reentry",
    },
  });
  const response = responseStub();

  await handler({ url: "/readyz" }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(JSON.parse(response.body), {
    error: "receiver_unavailable",
    status: "not_ready",
  });
});

test("Cloud Receiver service contains synchronous control-handler failures", async (t) => {
  const service = createCloudReceiverService({
    receiver: {
      acceptEvent() { return {}; },
      claimDelivery() { return null; },
      acknowledgeDelivery() { return {}; },
    },
    controlHandler() {
      throw new Error("private control detail");
    },
    readiness: () => true,
    close() {},
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  t.after(() => service.stop());

  const response = await fetch(`${address.origin}/console-failure`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: { code: "receiver_internal_error" },
  });
});

function jsonRequest(url, body) {
  const payload = JSON.stringify(body);
  const request = Readable.from([payload]);
  request.method = "POST";
  request.url = url;
  request.headers = {
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(payload)),
  };
  return request;
}

function responseStub() {
  return {
    body: "",
    destroyed: false,
    headers: {},
    headersSent: false,
    statusCode: undefined,
    writableEnded: false,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body = "") {
      this.body = body;
      this.writableEnded = true;
    },
  };
}
