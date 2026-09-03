import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { WebSocket } from "ws";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import {
  CLERK_SESSION_COOKIE_NAME,
  createClerkGameSessionResolver,
} from "../src/server/game-session";
import { createPersistenceStore } from "../src/server/persistence/store";
import { ensureProductionWorld } from "../src/server/production-bootstrap";
import type { RealtimeSnapshotFrame } from "../src/server/realtime-snapshot";
import { MOVE_PLAYER_COMMAND_PATH } from "../src/shared/move-player-command";
import { PAGE_TOOLS_EXECUTE_PATH } from "../src/shared/page-tool-contract";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;

test("production Clerk configuration fails closed before startup when durable or autonomous settings are missing", () => {
  assert.throws(
    () => loadRuntimeConfig({ PORT: "0", NODE_ENV: "production", GAME_AUTH_PROVIDER: "clerk" }),
    (error: unknown) => error instanceof Error && "field" in error && error.field === "GAME_DB_PATH",
  );
  assert.throws(
    () => loadRuntimeConfig({
      PORT: "0",
      NODE_ENV: "production",
      GAME_AUTH_PROVIDER: "clerk",
      GAME_DB_PATH: "/data/world.sqlite",
    }),
    (error: unknown) => error instanceof Error && "field" in error && error.field === "AUTONOMOUS_WORLD_MODE",
  );
  assert.throws(
    () => loadRuntimeConfig({
      PORT: "0",
      NODE_ENV: "production",
      GAME_AUTH_PROVIDER: "clerk",
      GAME_DB_PATH: "/data/world.sqlite",
      AUTONOMOUS_WORLD_MODE: "1",
    }),
    (error: unknown) => error instanceof Error && "field" in error && error.field === "CLERK_SECRET_KEY",
  );
});

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

function request(headers: Record<string, string> = {}, url = "/"): IncomingMessage {
  return { headers, url } as unknown as IncomingMessage;
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

test("production bootstrap seeds one SQLite world once and rejects a different world", () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp17-bootstrap-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    ensureProductionWorld(store, "cp17-world");
    const first = store.getWorld("cp17-world");
    assert.ok(first);
    assert.deepEqual(store.listWorldIds(), ["cp17-world"]);

    ensureProductionWorld(store, "cp17-world");
    const second = store.getWorld("cp17-world");
    assert.deepEqual(second, first);
    assert.throws(() => ensureProductionWorld(store, "another-world"), /RECOVERY_REQUIRED/);
    assert.deepEqual(store.listWorldIds(), ["cp17-world"]);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Clerk resolver accepts only the two server-bound subjects", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp17-resolver-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    ensureProductionWorld(store, "cp17-world");
    const resolver = createClerkGameSessionResolver({
      store,
      worldId: "cp17-world",
      subjects: { playerA: "subject-a", playerB: "subject-b" },
      verifyToken: async (token) => ({ sub: token }),
    });
    assert.deepEqual(await resolver.resolveGameSession(request()), { kind: "rejected", reason: "MISSING_SESSION" });
    assert.deepEqual(await resolver.resolveGameSession(request({ authorization: "Bearer unknown" })), {
      kind: "rejected",
      reason: "IDENTITY_NOT_ALLOWED",
    });
    assert.deepEqual(await resolver.resolveGameSession(request({ cookie: `${CLERK_SESSION_COOKIE_NAME}=subject-a` }, "/?__session=subject-b")), {
      kind: "rejected",
      reason: "MALFORMED_SESSION",
    });
    const playerA = await resolver.resolveGameSession(request({ cookie: `${CLERK_SESSION_COOKIE_NAME}=subject-a` }));
    assert.equal(playerA.kind, "resolved");
    if (playerA.kind === "resolved") {
      assert.deepEqual(playerA.context, {
        worldId: "cp17-world",
        playerId: "player-a",
        shelterId: "shelter-a",
        binding: "game-binding-player-a",
        providerSubject: "subject-a",
      });
    }
    const playerB = await resolver.resolveGameSession(request({ authorization: "Bearer subject-b" }));
    assert.equal(playerB.kind, "resolved");
    if (playerB.kind === "resolved") {
      assert.equal(playerB.context.playerId, "player-b");
      assert.equal(playerB.context.shelterId, "shelter-b");
    }
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("production entrypoint runs the happy path through bootstrap, realtime, and a scoped command", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp17-entrypoint-");
  const authStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  authStore.open();
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({
      PORT: "0",
      NODE_ENV: "test",
      GAME_AUTH_PROVIDER: "clerk",
      GAME_WORLD_ID: "cp17-world",
      GAME_DB_PATH: dbPath,
    }),
    createNextApp: () => fakeNextApp(),
    gameSessionResolver: createClerkGameSessionResolver({
      store: authStore,
      worldId: "cp17-world",
      subjects: { playerA: "subject-a", playerB: "subject-b" },
      verifyToken: async (token) => ({ sub: token }),
    }),
  });
  let socket: WebSocket | null = null;
  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;

    const unauthenticated = await fetch(`${base}/api/game/bootstrap`);
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(await unauthenticated.json(), { error_code: "GAME_SESSION_REQUIRED" });

    const cookie = `${CLERK_SESSION_COOKIE_NAME}=subject-a`;
    const bootstrapResponse = await fetch(`${base}/api/game/bootstrap`, { headers: { cookie } });
    assert.equal(bootstrapResponse.status, 200);
    const bootstrap = await bootstrapResponse.json() as {
      contractVersion: string;
      worldId: string;
      playerId: string;
      shelterId: string;
    };
    assert.deepEqual(bootstrap, {
      capability: "supported",
      contractVersion: CONTRACT_VERSION,
      worldId: "cp17-world",
      playerId: "player-a",
      shelterId: "shelter-a",
    });

    const pageToolResponse = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ tool: "inspect_shelter_state", input: {} }),
    });
    assert.equal(pageToolResponse.status, 200);
    assert.equal(pageToolResponse.headers.get("cache-control"), "no-store");
    assert.equal(pageToolResponse.headers.get("vary"), "Cookie");
    const pageToolRead = await pageToolResponse.json() as {
      tool: string;
      scope: { world_id: string; player_id: string; shelter_id: string };
      shelter: { shelter_id: string; player_id: string };
      continuation: unknown;
    };
    assert.equal(pageToolRead.tool, "inspect_shelter_state");
    assert.deepEqual(pageToolRead.scope, {
      world_id: "cp17-world",
      player_id: "player-a",
      shelter_id: "shelter-a",
    });
    assert.equal(pageToolRead.shelter.shelter_id, "shelter-a");
    assert.equal(pageToolRead.shelter.player_id, "player-a");
    assert.equal(pageToolRead.continuation, null);

    const clientScopeOverride = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        tool: "inspect_shelter_state",
        input: { player_id: "player-b" },
      }),
    });
    assert.equal(clientScopeOverride.status, 400);
    assert.deepEqual(await clientScopeOverride.json(), { error_code: "PAGE_TOOL_INPUT_INVALID" });

    const playerBPageToolResponse = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: {
        cookie: `${CLERK_SESSION_COOKIE_NAME}=subject-b`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ tool: "inspect_shelter_state", input: {} }),
    });
    assert.equal(playerBPageToolResponse.status, 200);
    const playerBPageToolRead = await playerBPageToolResponse.json() as {
      scope: { world_id: string; player_id: string; shelter_id: string };
      shelter: { shelter_id: string; player_id: string };
    };
    assert.deepEqual(playerBPageToolRead.scope, {
      world_id: "cp17-world",
      player_id: "player-b",
      shelter_id: "shelter-b",
    });
    assert.equal(playerBPageToolRead.shelter.shelter_id, "shelter-b");
    assert.equal(playerBPageToolRead.shelter.player_id, "player-b");
    assert.equal(JSON.stringify(playerBPageToolRead).includes("shelter-a"), false);

    const fixtureRoute = await fetch(`${base}/api/local-fixture/bootstrap`);
    assert.equal(fixtureRoute.status, 503);
    assert.deepEqual(await fixtureRoute.json(), { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });

    socket = new WebSocket(`ws://127.0.0.1:${address.port}/realtime`, { headers: { cookie } });
    const frame = await nextMessage(socket) as RealtimeSnapshotFrame;
    assert.equal(frame.snapshot.playerScope.playerId, "player-a");
    assert.equal(frame.snapshot.playerScope.shelterId, "shelter-a");

    const moveResponse = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        command_id: "cp17-move-1",
        command_type: "move_player",
        contract_version: CONTRACT_VERSION,
        expected_entity_revisions: { player: frame.snapshot.player.revision },
        idempotency_key: "cp17-move-key-1",
        typed_arguments: { direction: "right" },
      }),
    });
    assert.equal(moveResponse.status, 200);
    const move = await moveResponse.json() as { effect?: string; contract_version?: string };
    assert.equal(move.effect, "moved");
    assert.equal(move.contract_version, CONTRACT_VERSION);
  } finally {
    socket?.close();
    await entrypoint.shutdown("test");
    authStore.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
