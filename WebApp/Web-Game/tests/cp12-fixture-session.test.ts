import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { WebSocket } from "ws";

import { loadRuntimeConfig, RuntimeConfigError } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import { createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { WorldWorkerModule } from "../src/server/world-worker";
import {
  LOCAL_FIXTURE_COOKIE_NAME,
  LOCAL_FIXTURE_HANDLE_A,
  LOCAL_FIXTURE_HANDLE_B,
  prepareLocalFixture,
  type LocalFixtureBootstrapPayload,
} from "../src/server/fixture-session";
import { ClientSnapshotService } from "../src/server/world-projection";
import type { RealtimeSnapshotFrame } from "../src/server/realtime-snapshot";
import { RealtimeProjectionClient } from "../src/client/realtime-projection";
import { localRealtimeUrl, parseLocalFixtureBootstrap } from "../src/client/local-fixture-bootstrap";
import { ASSIGN_SOLDIER_MISSION_COMMAND_PATH } from "../src/shared/assign-soldier-mission-command";
import { MOVE_PLAYER_COMMAND_PATH } from "../src/shared/move-player-command";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;

function tempDatabase(prefix: string): { directory: string; dbPath: string } {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  return { directory, dbPath: join(directory, "world.sqlite") };
}

function fakeNextApp() {
  return {
    async prepare() {},
    getRequestHandler() {
      return (_request: unknown, response: { statusCode: number; end(body?: string): void }) => {
        response.statusCode = 200;
        response.end("next");
      };
    },
  } as never;
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
  });
}

test("explicit fixture mode is opt-in and rejects unknown flag values", () => {
  assert.equal(loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }).localFixtureMode, false);
  assert.equal(loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1" }).localFixtureMode, true);
  assert.equal(loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "false" }).localFixtureMode, false);
  assert.throws(
    () => loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "maybe" }),
    (error: unknown) => error instanceof RuntimeConfigError && error.code === "CONFIG_INVALID" && error.field === "LOCAL_FIXTURE_MODE",
  );
});

test("the browser bootstrap parser accepts only the server scope contract", () => {
  const payload = {
    capability: "supported" as const,
    contractVersion: CONTRACT_VERSION,
    worldId: "sleepless-mvp-01",
    playerId: "player-a",
    shelterId: "shelter-a",
  };
  assert.deepEqual(parseLocalFixtureBootstrap(payload), payload);
  assert.equal(localRealtimeUrl({ protocol: "http:", host: "127.0.0.1:3000" }), "ws://127.0.0.1:3000/realtime");
  assert.equal(localRealtimeUrl({ protocol: "https:", host: "game.example" }), "wss://game.example/realtime");
  assert.throws(() => parseLocalFixtureBootstrap({ ...payload, binding: "private" }), /LOCAL_FIXTURE_BOOTSTRAP_INVALID/);
  assert.throws(() => parseLocalFixtureBootstrap({ ...payload, playerId: "" }), /LOCAL_FIXTURE_BOOTSTRAP_INVALID/);
});

test("fixture preparation seeds an empty store once and loads the exact fixture on restart", () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-fixture-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    const first = prepareLocalFixture(store);
    assert.deepEqual(store.listWorldIds(), ["sleepless-mvp-01"]);
    assert.equal(first.fixture.worldId, "sleepless-mvp-01");
    assert.equal(first.resolver.resolve({ headers: {} }), null);
    const bootstrap = first.resolver.resolveBootstrap({ headers: {} });
    assert.equal(bootstrap.kind, "resolved");
    if (bootstrap.kind === "resolved") {
      assert.equal(bootstrap.context.playerId, "player-a");
      assert.equal(bootstrap.issueCookie, true);
    }
    assert.equal(first.resolver.resolve({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_B}` } })?.playerId, "player-b");
    const second = prepareLocalFixture(store);
    assert.equal(second.fixture.snapshot.state !== null, true);
    assert.deepEqual(store.listWorldIds(), ["sleepless-mvp-01"]);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fixture resolver rejects unknown, malformed, duplicate, and client-selected sessions", () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-resolver-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    const { resolver } = prepareLocalFixture(store);
    assert.deepEqual(resolver.resolveExistingSession({ headers: {} }), {
      kind: "rejected",
      reason: "MISSING_SESSION",
    });
    assert.equal(resolver.resolve({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=unknown` } }), null);
    assert.deepEqual(resolver.resolveExistingSession({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=unknown` } }), {
      kind: "rejected",
      reason: "UNKNOWN_SESSION",
    });
    assert.equal(resolver.resolve({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}` } }), null);
    assert.deepEqual(resolver.resolveExistingSession({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}` } }), {
      kind: "rejected",
      reason: "MALFORMED_SESSION",
    });
    assert.equal(resolver.resolve({ headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_A}; ${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_B}` } }), null);
    const bootstrap = resolver.resolveBootstrap({
      url: "/api/local-fixture/bootstrap?player_id=player-b",
      headers: {},
    });
    assert.equal(bootstrap.kind, "resolved");
    if (bootstrap.kind === "resolved") {
      assert.equal(bootstrap.context.playerId, "player-a");
      assert.equal(bootstrap.issueCookie, true);
      assert.equal("binding" in bootstrap, false);
    }
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fixture preparation rejects a non-empty store without overwriting it", () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-fixture-extra-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    createAndPersistG2Fixture(store, { worldId: "other-world" });
    assert.throws(
      () => prepareLocalFixture(store),
      (error: unknown) => error instanceof Error && error.message === "FIXTURE_STORE_NOT_EMPTY",
    );
    assert.deepEqual(store.listWorldIds(), ["other-world"]);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("pre-bound projection binds only after a valid scoped first frame and cannot resync before binding", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-projection-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    const fixture = prepareLocalFixture(store);
    const bootstrap = fixture.resolver.resolveBootstrap({ headers: {} });
    assert.equal(bootstrap.kind, "resolved");
    if (bootstrap.kind !== "resolved") {
      throw new Error("fixture bootstrap unexpectedly rejected");
    }
    const player = bootstrap.context;
    const snapshot = await new ClientSnapshotService({ store }).full({
      worldId: player.worldId,
      playerId: player.playerId,
      binding: player.binding,
    });
    const client = RealtimeProjectionClient.fromServerScope({
      contractVersion: CONTRACT_VERSION,
      worldId: player.worldId,
      playerId: player.playerId,
      shelterId: bootstrap.context.shelterId,
    });
    assert.equal(client.connectionId, null);
    assert.throws(() => client.requestResync(), (error: unknown) => error instanceof Error && error.message === "REALTIME_CONNECTION_UNBOUND");
    const invalid = client.accept({ kind: "client_snapshot", connectionId: "server-1", sequence: 1, snapshot: { ...snapshot, playerScope: { ...snapshot.playerScope, playerId: "player-b" } } });
    assert.equal(invalid.accepted, false);
    assert.equal(client.connectionId, null);
    const accepted = client.accept({ kind: "client_snapshot", connectionId: "server-1", sequence: 1, snapshot });
    assert.deepEqual(accepted, { accepted: true, reason: "ACCEPTED" });
    assert.equal(client.connectionId, "server-1");
    assert.equal(client.accept({ kind: "client_snapshot", connectionId: "server-2", sequence: 2, snapshot }).reason, "CONNECTION_MISMATCH");
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("ready entrypoint bootstrap and realtime frame share server scope and ignore query player ids", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-entrypoint-");
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
  });
  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const bootstrapResponse = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap?player_id=player-b`);
    assert.equal(bootstrapResponse.status, 200);
    assert.equal(bootstrapResponse.headers.get("cache-control"), "no-store");
    assert.equal(bootstrapResponse.headers.get("vary"), "Cookie");
    const payload = await bootstrapResponse.json() as LocalFixtureBootstrapPayload;
    assert.equal(payload.playerId, "player-a");
    assert.equal("binding" in payload, false);
    const cookie = bootstrapResponse.headers.get("set-cookie");
    assert.match(cookie ?? "", new RegExp(`${LOCAL_FIXTURE_COOKIE_NAME}=`));
    const methodResponse = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`, { method: "POST" });
    assert.equal(methodResponse.status, 405);
    assert.equal(methodResponse.headers.get("allow"), "GET");
    assert.deepEqual(await methodResponse.json(), { error_code: "LOCAL_FIXTURE_METHOD_NOT_ALLOWED" });
    const unknownSession = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`, {
      headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=unknown` },
    });
    assert.equal(unknownSession.status, 401);
    assert.deepEqual(await unknownSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_UNKNOWN" });
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/realtime?player_id=player-b`, { headers: { cookie: cookie?.split(";", 1)[0] } });
    const frame = await nextMessage(socket) as RealtimeSnapshotFrame;
    assert.equal(frame.snapshot.playerScope.playerId, payload.playerId);
    const client = RealtimeProjectionClient.fromServerScope(payload);
    assert.equal(client.accept(frame).accepted, true);
    socket.close();
    await new Promise<void>((resolve) => socket.once("close", () => resolve()));
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fixture bootstrap stays non-ready while the shared worker is starting", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-readiness-");
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => new WorldWorkerModule({ store: options?.store, startDelayMs: 40 }),
  });
  try {
    const starting = entrypoint.start();
    for (let attempt = 0; attempt < 50 && !entrypoint.address(); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error_code: "LOCAL_FIXTURE_NOT_READY" });
    await starting;
    const ready = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`);
    assert.equal(ready.status, 200);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fixture startup rejects a worker that does not share the entrypoint store", async () => {
  const fixture = tempDatabase("sleepless-kingdom-cp12-store-boundary-");
  const workerStore = tempDatabase("sleepless-kingdom-cp12-store-other-");
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: fixture.dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: () => new WorldWorkerModule({ dbPath: workerStore.dbPath }),
  });
  try {
    await assert.rejects(() => entrypoint.start(), /FIXTURE_STORE_NOT_SHARED/);
    assert.equal(entrypoint.registry.state, "failed");
    assert.equal(entrypoint.address(), null);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(workerStore.directory, { recursive: true, force: true });
  }
});

test("disabled and production entrypoints keep fixture bootstrap and command routes visibly unsupported", async () => {
  for (const nodeEnv of ["test", "production"] as const) {
    const { directory, dbPath } = tempDatabase(`sleepless-kingdom-cp12-disabled-${nodeEnv}-`);
    const entrypoint = createEntrypoint({
      config: loadRuntimeConfig({ PORT: "0", NODE_ENV: nodeEnv, LOCAL_FIXTURE_MODE: nodeEnv === "production" ? "1" : "0", GAME_DB_PATH: dbPath }),
      createNextApp: () => fakeNextApp(),
    });
    try {
      await entrypoint.start();
      const address = entrypoint.address();
      assert.ok(address && typeof address === "object");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      assert.equal(response.headers.get("set-cookie"), null);
      const moveResponse = await fetch(`http://127.0.0.1:${address.port}${MOVE_PLAYER_COMMAND_PATH}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      assert.equal(moveResponse.status, 503);
      assert.deepEqual(await moveResponse.json(), { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      assert.equal(moveResponse.headers.get("set-cookie"), null);
      const dispatchResponse = await fetch(`http://127.0.0.1:${address.port}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      assert.equal(dispatchResponse.status, 503);
      assert.deepEqual(await dispatchResponse.json(), { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      assert.equal(dispatchResponse.headers.get("set-cookie"), null);
    } finally {
      await entrypoint.shutdown("test");
      const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
      try {
        store.open();
        assert.deepEqual(store.listWorldIds(), []);
      } finally {
        store.close();
        rmSync(directory, { recursive: true, force: true });
      }
    }
  }
});
