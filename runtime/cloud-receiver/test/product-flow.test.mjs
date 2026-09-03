import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { createHostSdk } from "../../host-sdk/src/server.mjs";
import { LocalConnectorPairingClient } from "../../local-connector/src/pairing-client.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import { createProductPreviewComposition } from "../src/product-preview-composition.mjs";

test("account-first flow connects one Mac, approves on Re-entry, and yields a claimable delivery", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-product-flow-"));
  const receiverDatabasePath = join(directory, "receiver.sqlite");
  const composition = createProductPreviewComposition({
    receiverDatabasePath,
    pairingDatabasePath: join(directory, "host-keys.sqlite"),
    accountDatabasePath: join(directory, "accounts.sqlite"),
    productDatabasePath: join(directory, "product.sqlite"),
    tokenSecret: "product-flow-test-secret-00000001",
  });
  const service = createCloudReceiverService(composition);
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  t.after(() => service.stop());

  const registration = await fetch(`${address.origin}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "person@example.test", password: "preview-password" }),
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get("set-cookie").split(";", 1)[0];

  const organizationResponse = await fetch(`${address.origin}/api/organizations`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Example Host" }),
  });
  assert.equal(organizationResponse.status, 201);
  const organization = await organizationResponse.json();
  const organizationApiKey = organization.api_key.secret;
  assert.match(organizationApiKey, /^re_org_/);

  let accountEntryPage;
  let approvalPage;
  const pairing = new LocalConnectorPairingClient({
    baseUrl: address.origin,
    sleep: async () => {},
    openBrowser: async (url) => {
      accountEntryPage = await fetch(url);
      assert.equal(accountEntryPage.status, 200);
      assert.equal(accountEntryPage.headers.get("location"), null);
      const accountEntryHtml = await accountEntryPage.text();
      assert.match(accountEntryHtml, /Connect your Mac to the return path/);
      assert.match(accountEntryHtml, /Create an account/);
      assert.match(accountEntryHtml, /Log in/);

      const token = new URL(url).searchParams.get("token");
      const returnPath = `/connect?token=${token}`;
      const login = await fetch(`${address.origin}/user-login?next=${encodeURIComponent(returnPath)}`);
      assert.equal(login.status, 200);
      const loginHtml = await login.text();
      assert.match(loginHtml, /Welcome back\. Connect your Mac/);
      assert.match(loginHtml, /Log in/);
      assert.match(loginHtml, /data-success-path="\/connect\?token=/);

      const register = await fetch(`${address.origin}/user-register?next=${encodeURIComponent(returnPath)}`);
      assert.equal(register.status, 200);
      const registerHtml = await register.text();
      assert.match(registerHtml, /Connect your Mac to Re-entry/);
      assert.match(registerHtml, /Create account/);
      assert.match(registerHtml, /data-success-path="\/connect\?token=/);

      approvalPage = await fetch(url, { headers: { Cookie: cookie } });
      assert.equal(approvalPage.status, 200);
      assert.match(await approvalPage.text(), /Connect Test Mac/);
      const decision = await fetch(`${address.origin}/v0.1/device-authorizations/decision`, {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ authorization_token: token, action: "approve" }),
      });
      assert.equal(decision.status, 200);
      return true;
    },
  });
  const credentials = await pairing.connect({ deviceName: "Test Mac" });
  assert.equal(credentials.browserOpened, true);
  assert.match(credentials.connector_id, /^connector_/);
  const devicesResponse = await fetch(`${address.origin}/v0.1/account/connectors`, {
    headers: { Cookie: cookie },
  });
  assert.equal(devicesResponse.status, 200);
  const devices = await devicesResponse.json();
  assert.deepEqual(devices.connectors.map((connector) => connector.device_name), ["Test Mac"]);
  assert.equal(Object.hasOwn(devices.connectors[0], "connector_token"), false);

  const hostOrigin = "http://127.0.0.1:44000";
  const keys = generateKeyPairSync("ed25519");
  const sdk = createHostSdk({
    origin: hostOrigin,
    receiverOrigin: address.origin,
    privateKey: keys.privateKey,
    keyId: "host_key_product_flow",
    organizationApiKey,
  });
  const registrationResult = await sdk.registerHostKey({ hostId: "host_product_flow" });
  assert.equal(registrationResult.organization_id, organization.organization.organization_id);

  const now = Date.now();
  const canonicalUrl = `${hostOrigin}/workflows/workflow_product_flow`;
  const manifest = sdk.createManifest({
    offerExpiresAt: new Date(now + 5 * 60_000).toISOString(),
    workflow: {
      id: "workflow_product_flow",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl,
    },
    display: {
      title: "Continue with Codex",
      reason: "One approved step is ready.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: new Date(now + 20 * 60_000).toISOString(),
      humanBoundary: "explicit_receiver_consent",
    },
  });
  const session = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: "host_user_product_flow",
  });
  assert.equal(typeof session.consent_url, "string");
  assert.equal(Object.hasOwn(session, "consent_token"), false);

  const consentPage = await fetch(session.consent_url, { headers: { Cookie: cookie } });
  assert.equal(consentPage.status, 200);
  const consentHtml = await consentPage.text();
  assert.match(consentHtml, /Continue with Codex/);
  assert.match(consentHtml, /Test Mac/);
  const consentToken = new URL(session.consent_url).searchParams.get("token");
  const decisionResponse = await fetch(`${address.origin}/v0.1/account-consent-decisions`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      consent_token: consentToken,
      action: "approve",
      connector_id: credentials.connector_id,
    }),
  });
  assert.equal(decisionResponse.status, 200);
  assert.equal((await decisionResponse.json()).status, "approved");

  const status = await sdk.getConsentSession({ consentSessionId: session.consent_session_id });
  assert.equal(status.status, "approved");
  assert.match(status.binding.binding_id, /^binding_/);
  assert.equal(Object.hasOwn(status, "account_id"), false);
  assert.equal(Object.hasOwn(status, "connector_id"), false);

  const acceptance = await sdk.sendEvent({
    binding: status.binding,
    eventId: "event_product_flow",
    deliveryTimestamp: String(Math.floor(Date.now() / 1_000)),
    workflow: {
      id: "workflow_product_flow",
      stateVersion: 2,
      canonicalUrl,
    },
  });
  assert.equal(acceptance.accepted, true);

  const connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: credentials.connector_token,
    requestTimeoutMs: 5_000,
  });
  const claim = await connector.claimDelivery({
    claimToken: randomBytes(32).toString("base64url"),
  });
  assert.equal(claim.lease.event_id, "event_product_flow");
  assert.equal(claim.lease.receipt.canonical_url, canonicalUrl);
});

test("dashboard-issued pairing code connects a fresh Local Connector", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-dashboard-pairing-"));
  const composition = createProductPreviewComposition({
    receiverDatabasePath: join(directory, "receiver.sqlite"),
    pairingDatabasePath: join(directory, "host-keys.sqlite"),
    accountDatabasePath: join(directory, "accounts.sqlite"),
    productDatabasePath: join(directory, "product.sqlite"),
    tokenSecret: "dashboard-pairing-test-secret-0001",
  });
  const service = createCloudReceiverService(composition);
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  t.after(() => service.stop());

  const registration = await fetch(`${address.origin}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "pairing@example.test", password: "preview-password" }),
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get("set-cookie").split(";", 1)[0];
  const dashboardPairing = await fetch(`${address.origin}/v0.1/account/pairing-sessions`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(dashboardPairing.status, 201);
  const pairing = await dashboardPairing.json();
  assert.match(pairing.pairing_code, /^[A-F0-9]{8}$/);
  assert.equal(Object.hasOwn(pairing, "connector_token"), false);

  const client = new LocalConnectorPairingClient({ baseUrl: address.origin });
  const credentials = await client.connectWithPairingCode({
    pairingCode: pairing.pairing_code,
    deviceName: "Fresh Test Mac",
  });
  assert.equal(credentials.pairing_id, pairing.pairing_id);
  assert.match(credentials.connector_token, /^[A-Za-z0-9_-]{43}$/);

  const devices = await fetch(`${address.origin}/v0.1/account/connectors`, { headers: { Cookie: cookie } });
  assert.equal(devices.status, 200);
  assert.deepEqual((await devices.json()).connectors.map((item) => item.device_name), ["Fresh Test Mac"]);
});
