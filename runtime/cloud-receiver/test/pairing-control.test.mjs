import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import {
  createPairingControlPlane,
} from "../src/pairing-control.mjs";
import { PairingStore } from "../src/pairing-store.mjs";

const HOST_API_KEY = "host-preview-api-key";
const CONNECTOR_SECRET = "connector-preview-secret";

test("browser-assisted pairing creates a durable Host-user to Connector mapping", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-pairing-"));
  const filename = join(directory, "pairing.sqlite");
  const now = { value: new Date("2026-08-31T12:00:00.000Z") };
  let sequence = 0;
  const store = new PairingStore({ filename });
  const control = createPairingControlPlane({
    store,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    pairingLifetimeMs: 5 * 60_000,
    connectorLifetimeMs: 24 * 60 * 60_000,
    clock: () => new Date(now.value),
    createId(prefix) {
      sequence += 1;
      return `${prefix}_pairing_${sequence}`;
    },
  });
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    controlHandler: control.handler,
    close() {},
    readiness: () => control.readiness(),
  });
  t.after(async () => {
    await service.stop();
    control.close();
    await rm(directory, { recursive: true, force: true });
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });

  const started = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_001" },
  });
  assert.equal(started.response.status, 201);
  assert.equal(started.body.type, "webmcp.connector_pairing");
  assert.equal(typeof started.body.pairing_id, "string");
  assert.match(started.body.user_code, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/);
  assert.match(started.body.verification_uri, /\/pairing\?code=/);
  assert.equal("device_code" in started.body, false);
  assert.equal("connector_token" in started.body, false);

  const claim = await request(address.origin, "/v0.1/pairing-sessions/claim", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(claim.response.status, 200);
  assert.equal(claim.body.pairing_id, started.body.pairing_id);
  assert.match(claim.body.device_code, /^[A-Za-z0-9_-]{43}$/);

  const page = await fetch(started.body.verification_uri);
  assert.equal(page.status, 200);
  const pageText = await page.text();
  assert.match(pageText, /Connect this computer/);
  assert.match(pageText, new RegExp(started.body.user_code));

  const pending = await request(address.origin, "/v0.1/pairing-sessions/poll", {
    body: { device_code: claim.body.device_code },
  });
  assert.equal(pending.response.status, 202);
  assert.equal(pending.body.status, "pending");

  const approval = await request(address.origin, "/v0.1/pairing-sessions/approve", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(approval.response.status, 200);
  assert.equal(approval.body.status, "approved");

  const credentials = await request(address.origin, "/v0.1/pairing-sessions/poll", {
    body: { device_code: claim.body.device_code },
  });
  assert.equal(credentials.response.status, 200);
  assert.equal(credentials.body.pairing_id, started.body.pairing_id);
  assert.match(credentials.body.connector_token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(credentials.body.duplicate, false);

  const identity = control.verifyConnector({ connectorToken: credentials.body.connector_token });
  assert.equal(identity.subject_id.startsWith("subject_pairing_"), true);
  assert.equal(identity.delivery_target_id.startsWith("target_pairing_"), true);
  assert.equal(control.resolveHostSubject({ host_subject_ref: "host_user_001" }).subject_id, identity.subject_id);

  const replay = await request(address.origin, "/v0.1/pairing-sessions/poll", {
    body: { device_code: claim.body.device_code },
  });
  assert.equal(replay.response.status, 200);
  assert.equal(replay.body.connector_token, credentials.body.connector_token);
  assert.equal(replay.body.duplicate, true);

  const persisted = await readFile(filename);
  for (const secret of [HOST_API_KEY, CONNECTOR_SECRET, claim.body.device_code, credentials.body.connector_token]) {
    assert.equal(persisted.includes(Buffer.from(secret)), false);
  }

  await service.stop();
  control.close();
  const restartedStore = new PairingStore({ filename });
  const restartedControl = createPairingControlPlane({
    store: restartedStore,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    pairingLifetimeMs: 5 * 60_000,
    connectorLifetimeMs: 24 * 60 * 60_000,
    clock: () => new Date(now.value),
    createId(prefix) {
      sequence += 1;
      return `${prefix}_pairing_${sequence}`;
    },
  });
  t.after(() => restartedControl.close());
  assert.equal(
    restartedControl.verifyConnector({ connectorToken: credentials.body.connector_token }).connector_id,
    credentials.body.connector_id,
  );
  assert.equal(
    restartedControl.resolveHostSubject({ host_subject_ref: "host_user_001" }).connector_id,
    credentials.body.connector_id,
  );
});

test("pairing refuses wrong organization credentials and duplicate Host users", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-pairing-errors-"));
  const filename = join(directory, "pairing.sqlite");
  const store = new PairingStore({ filename });
  let sequence = 0;
  const control = createPairingControlPlane({
    store,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    pairingLifetimeMs: 5 * 60_000,
    connectorLifetimeMs: 24 * 60 * 60_000,
    clock: () => new Date("2026-08-31T12:00:00.000Z"),
    createId(prefix) {
      sequence += 1;
      return `${prefix}_pairing_${sequence}`;
    },
  });
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    controlHandler: control.handler,
    close() {},
    readiness: () => control.readiness(),
  });
  t.after(async () => {
    await service.stop();
    control.close();
    await rm(directory, { recursive: true, force: true });
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });

  const wrong = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: "Bearer wrong-key" },
    body: { host_subject_ref: "host_user_001" },
  });
  assert.equal(wrong.response.status, 403);
  assert.deepEqual(wrong.body, { error: { code: "organization_auth_invalid" } });

  const first = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_001" },
  });
  assert.equal(first.response.status, 201);
  await request(address.origin, "/v0.1/pairing-sessions/claim", {
    body: { user_code: first.body.user_code },
  });
  const approval = await request(address.origin, "/v0.1/pairing-sessions/approve", {
    body: { user_code: first.body.user_code },
  });
  assert.equal(approval.response.status, 200);

  const duplicate = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_001" },
  });
  assert.equal(duplicate.response.status, 409);
  assert.deepEqual(duplicate.body, { error: { code: "host_subject_already_paired" } });

  const pendingSubject = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_pending" },
  });
  assert.equal(pendingSubject.response.status, 201);
  const pendingDuplicate = await request(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_pending" },
  });
  assert.equal(pendingDuplicate.response.status, 409);
  assert.deepEqual(pendingDuplicate.body, { error: { code: "host_subject_pairing_pending" } });
});

async function request(origin, path, { headers = {}, body }) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

function receiverStub() {
  return {
    acceptEvent() {
      return {};
    },
    claimDelivery() {
      return null;
    },
    acknowledgeDelivery() {
      return {};
    },
  };
}
