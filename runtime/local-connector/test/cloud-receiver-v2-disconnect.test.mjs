import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

import { LocalConnectorCredentialStore } from "../src/credentials.mjs";
import { disconnectConnectorLifecycle } from "../src/disconnect-lifecycle.mjs";
import { LocalConnectorPairingClient } from "../src/pairing-client.mjs";

const enabled = process.env.CLOUD_RECEIVER_V2_DISCONNECT_CONTRACT === "1";
const testOptions = enabled
  ? { concurrency: false, timeout: 30_000 }
  : { skip: "Set CLOUD_RECEIVER_V2_DISCONNECT_CONTRACT=1 with a disposable v2 database to run" };

const FRONTEND_ORIGIN = "http://localhost:3000";
let harness;

before(async () => {
  if (enabled) harness = await createHarness();
});

after(async () => {
  await harness?.close();
});

test(
  "CONNECTOR-V2-DISCONNECT-001 revokes through the real Receiver before clearing local credentials",
  testOptions,
  async () => {
    const store = new LocalConnectorCredentialStore({ filename: harness.credentialFile });
    const saved = await store.load();
    assert.ok(saved);

    const lifecycle = await disconnectConnectorLifecycle({
      credentials: saved,
      async revokeRemote(credentials) {
        const client = new LocalConnectorPairingClient({
          baseUrl: credentials.receiver_origin,
          requestTimeoutMs: 5_000,
        });
        return client.disconnectConnector({ connectorToken: credentials.connector_token });
      },
      async clearLocal() {
        await rm(harness.credentialFile, { force: true });
        return {
          supported: true,
          disconnected: true,
          removedPaths: [harness.credentialFile],
        };
      },
    });

    assert.deepEqual(lifecycle.remote, { status: "disconnected", duplicate: false });
    assert.equal(lifecycle.local.disconnected, true);
    assert.equal(await store.load(), null);

    const connector = await harness.prisma.connector.findUnique({
      where: { id: harness.connectorId },
      select: { revokedAt: true },
    });
    assert.ok(connector?.revokedAt);

    const listed = await sendJson(harness.origin, "/v0.1/account/connectors", {
      method: "GET",
      headers: { Cookie: harness.userCookie },
    });
    assert.equal(listed.status, 200);
    assert.equal(
      listed.body.connectors.find((item) => item.connector_id === harness.connectorId)?.revoked_at,
      connector.revokedAt.toISOString(),
    );

    const rejectedClaim = await sendJson(harness.origin, "/v0.1/delivery-claims", {
      body: {
        connector_token: saved.connector_token,
        claim_token: Buffer.alloc(32, 67).toString("base64url"),
      },
    });
    assert.equal(rejectedClaim.status, 403);
    assert.deepEqual(rejectedClaim.body, { error: { code: "connector_identity_invalid" } });

    const replayClient = new LocalConnectorPairingClient({
      baseUrl: harness.origin,
      requestTimeoutMs: 5_000,
    });
    assert.deepEqual(
      await replayClient.disconnectConnector({ connectorToken: saved.connector_token }),
      { status: "disconnected", duplicate: true },
    );
  },
);

async function createHarness() {
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../../saas-boilerplate/", import.meta.url));
  const backendRoot = path.join(receiverRoot, "backend");
  const require = createRequire(import.meta.url);
  process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
  require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));

  const { createApp } = require(path.join(backendRoot, "src/app.ts"));
  const { prisma } = require(path.join(backendRoot, "src/db/index.ts"));
  const { clearTestAccounts } = require(path.join(backendRoot, "src/test/helper.ts"));
  const stateDirectory = await mkdtemp(path.join(tmpdir(), "reentry-v2-disconnect-"));
  const email = `connector-disconnect-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = "correct horse battery staple";

  await clearTestAccounts(email);
  const app = createApp();
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    listener.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const registration = await sendJson(origin, "/v1/auth/users/register", {
      body: { email, password },
    });
    assert.equal(registration.status, 201);
    const userCookie = readSessionCookie(registration.response);

    const pairing = await sendJson(origin, "/v0.1/account/pairing-sessions", {
      headers: { Cookie: userCookie, Origin: FRONTEND_ORIGIN },
      body: {},
    });
    assert.equal(pairing.status, 201);

    const pairingClient = new LocalConnectorPairingClient({
      baseUrl: origin,
      requestTimeoutMs: 5_000,
    });
    const credentials = await pairingClient.connectWithPairingCode({
      pairingId: pairing.body.pairing_id,
      pairingCode: pairing.body.pairing_code,
      deviceName: "Disconnect Contract Mac",
    });
    const credentialFile = path.join(stateDirectory, "credentials.json");
    await new LocalConnectorCredentialStore({ filename: credentialFile }).save({
      version: 1,
      receiver_origin: origin,
      connector_id: credentials.connector_id,
      connector_token: credentials.connector_token,
      connector_expires_at: credentials.connector_expires_at,
    });

    return {
      origin,
      userCookie,
      connectorId: credentials.connector_id,
      credentialFile,
      prisma,
      async close() {
        await new Promise((resolve) => server.close(resolve));
        await clearTestAccounts(email);
        await prisma.$disconnect();
        await rm(stateDirectory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await new Promise((resolve) => server.close(resolve));
    await clearTestAccounts(email).catch(() => {});
    await prisma.$disconnect().catch(() => {});
    await rm(stateDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function sendJson(origin, route, options = {}) {
  const response = await fetch(`${origin}${route}`, {
    method: options.method ?? "POST",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
  });
  const text = await response.text();
  return {
    response,
    status: response.status,
    body: text.length === 0 ? null : JSON.parse(text),
  };
}

function readSessionCookie(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  const cookie = values.map((value) => value.split(";", 1)[0]).join("; ");
  assert.notEqual(cookie, "");
  return cookie;
}
