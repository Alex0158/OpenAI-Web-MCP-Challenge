import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import {
  CLERK_SESSION_COOKIE_NAME,
  createClerkGameSessionResolver,
} from "../src/server/game-session";
import { createPersistenceStore, type PersistenceStore } from "../src/server/persistence/store";
import { ensureProductionWorld } from "../src/server/production-bootstrap";
import {
  ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
  type AssignSoldierMissionCommandEnvelope,
} from "../src/shared/assign-soldier-mission-command";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp17-cross-scope-world" as const;

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

function missionCommand(input: {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly soldierId: "soldier-a-01" | "soldier-b-01";
  readonly targetId: "node-wood-a" | "node-wood-b";
}): AssignSoldierMissionCommandEnvelope {
  return {
    command_id: input.commandId,
    command_type: "assign_soldier_mission",
    contract_version: CONTRACT_VERSION,
    expected_entity_revisions: { soldier: 0 },
    idempotency_key: input.idempotencyKey,
    typed_arguments: {
      soldier_id: input.soldierId,
      role: "GATHERER",
      tool: "AXE",
      equipment_tier: 1,
      target_id: input.targetId,
      return_policy: "WHEN_FULL",
    },
  };
}

function postJson(base: string, cookie: string, body: unknown): Promise<Response> {
  return fetch(`${base}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function stateDigest(store: PersistenceStore): Record<string, unknown> {
  return {
    world: store.getWorld(WORLD_ID),
    shelters: store.listShelters(WORLD_ID),
    soldiers: store.listSoldiers(WORLD_ID),
    resourceNodes: store.listResourceNodes(WORLD_ID),
    missions: store.listMissions(WORLD_ID),
    attempts: store.listMissionAttempts(WORLD_ID),
    events: store.events(WORLD_ID),
  };
}

test("Clerk-mode HTTP rejects bidirectional cross-scope mission commands without mutation", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp17-cross-scope-");
  const observer = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  observer.open();
  ensureProductionWorld(observer, WORLD_ID);
  const resolver = createClerkGameSessionResolver({
    store: observer,
    worldId: WORLD_ID,
    subjects: { playerA: "subject-a", playerB: "subject-b" },
    verifyToken: async (token) => ({ sub: token }),
  });
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({
      PORT: "0",
      NODE_ENV: "test",
      GAME_AUTH_PROVIDER: "clerk",
      GAME_WORLD_ID: WORLD_ID,
      GAME_DB_PATH: dbPath,
    }),
    createNextApp: () => fakeNextApp(),
    gameSessionResolver: resolver,
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;

    const playerA = await fetch(`${base}/api/game/bootstrap`, {
      headers: { cookie: `${CLERK_SESSION_COOKIE_NAME}=subject-a` },
    });
    assert.equal(playerA.status, 200);
    assert.deepEqual(await playerA.json(), {
      capability: "supported",
      contractVersion: CONTRACT_VERSION,
      worldId: WORLD_ID,
      playerId: "player-a",
      shelterId: "shelter-a",
    });
    const playerB = await fetch(`${base}/api/game/bootstrap`, {
      headers: { authorization: "Bearer subject-b" },
    });
    assert.equal(playerB.status, 200);
    assert.deepEqual(await playerB.json(), {
      capability: "supported",
      contractVersion: CONTRACT_VERSION,
      worldId: WORLD_ID,
      playerId: "player-b",
      shelterId: "shelter-b",
    });

    const before = stateDigest(observer);
    const aToB = missionCommand({
      commandId: "cross-scope-a-to-b-command",
      idempotencyKey: "cross-scope-a-to-b-retry",
      soldierId: "soldier-b-01",
      targetId: "node-wood-b",
    });
    const aToBResponse = await postJson(
      base,
      `${CLERK_SESSION_COOKIE_NAME}=subject-a`,
      aToB,
    );
    assert.equal(aToBResponse.status, 403);
    assert.deepEqual(await aToBResponse.json(), {
      command_id: aToB.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "NOT_OWNER",
      current_entity_revisions: {},
    });

    const bToA = missionCommand({
      commandId: "cross-scope-b-to-a-command",
      idempotencyKey: "cross-scope-b-to-a-retry",
      soldierId: "soldier-a-01",
      targetId: "node-wood-a",
    });
    const bToAResponse = await postJson(
      base,
      `${CLERK_SESSION_COOKIE_NAME}=subject-b`,
      bToA,
    );
    assert.equal(bToAResponse.status, 403);
    assert.deepEqual(await bToAResponse.json(), {
      command_id: bToA.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "NOT_OWNER",
      current_entity_revisions: {},
    });

    assert.deepEqual(stateDigest(observer), before);
    assert.equal(observer.idempotency(WORLD_ID, aToB.idempotency_key)?.outcome, "rejected");
    assert.equal(observer.idempotency(WORLD_ID, bToA.idempotency_key)?.outcome, "rejected");

    const retry = await postJson(
      base,
      `${CLERK_SESSION_COOKIE_NAME}=subject-a`,
      aToB,
    );
    assert.equal(retry.status, 403);
    assert.deepEqual(await retry.json(), {
      command_id: aToB.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "NOT_OWNER",
      current_entity_revisions: {},
    });
    assert.deepEqual(stateDigest(observer), before);

    const clientSelectedScope = await postJson(
      base,
      `${CLERK_SESSION_COOKIE_NAME}=subject-a`,
      { ...aToB, command_id: "cross-scope-client-selected-field", player_id: "player-b" },
    );
    assert.equal(clientSelectedScope.status, 400);
    assert.deepEqual(await clientSelectedScope.json(), {
      error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID",
    });
    assert.deepEqual(stateDigest(observer), before);
  } finally {
    await entrypoint.shutdown("test");
    observer.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
