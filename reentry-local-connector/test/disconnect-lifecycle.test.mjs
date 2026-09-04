import assert from "node:assert/strict";
import test from "node:test";

import { disconnectConnectorLifecycle } from "../src/disconnect-lifecycle.mjs";

const credentials = Object.freeze({
  version: 1,
  receiver_origin: "https://receiver.example",
  connector_id: "connector_123",
  connector_token: "A".repeat(43),
  connector_expires_at: "2099-01-01T00:00:00.000Z",
});

test("remote disconnection completes before local credentials are cleared", async () => {
  const calls = [];
  const result = await disconnectConnectorLifecycle({
    credentials,
    async revokeRemote(value) {
      calls.push(`remote:${value.connector_id}`);
      return { status: "disconnected", duplicate: false };
    },
    async clearLocal() {
      calls.push("local");
      return { supported: true, disconnected: true, removedPaths: ["credentials.json"] };
    },
  });

  assert.deepEqual(calls, ["remote:connector_123", "local"]);
  assert.deepEqual(result.remote, { status: "disconnected", duplicate: false });
  assert.equal(result.local.disconnected, true);
});

test("remote failure preserves the local credential", async () => {
  let localCleared = false;
  await assert.rejects(
    disconnectConnectorLifecycle({
      credentials,
      async revokeRemote() {
        const error = new Error("receiver unavailable");
        error.code = "pairing_network_error";
        throw error;
      },
      async clearLocal() {
        localCleared = true;
        return { supported: true, disconnected: true, removedPaths: [] };
      },
    }),
    (error) => error.code === "pairing_network_error",
  );
  assert.equal(localCleared, false);
});

test("missing credentials performs only idempotent local cleanup", async () => {
  let remoteCalled = false;
  const result = await disconnectConnectorLifecycle({
    credentials: null,
    async revokeRemote() {
      remoteCalled = true;
      return { status: "disconnected", duplicate: false };
    },
    async clearLocal() {
      return { supported: true, disconnected: false, removedPaths: [] };
    },
  });

  assert.equal(remoteCalled, false);
  assert.equal(result.remote, null);
  assert.equal(result.local.disconnected, false);
});
