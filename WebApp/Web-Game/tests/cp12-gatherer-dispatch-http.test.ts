import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import { LOCAL_FIXTURE_COOKIE_NAME } from "../src/server/fixture-session";
import { createPersistenceStore, PersistenceError, PersistenceStore } from "../src/server/persistence/store";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { WorkerCommandGateway } from "../src/server/worker-command-gateway";
import {
  ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
  parseAssignSoldierMissionCommandEnvelope,
  parseAssignSoldierMissionCommandFailure,
  parseAssignSoldierMissionCommandSuccess,
  type AssignSoldierMissionCommandEnvelope,
} from "../src/shared/assign-soldier-mission-command";
import {
  MOVE_PLAYER_COMMAND_PATH,
  type MovePlayerCommandEnvelope,
} from "../src/shared/move-player-command";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "sleepless-mvp-01" as const;

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

function dispatchCommand(
  overrides: Partial<AssignSoldierMissionCommandEnvelope> = {},
): AssignSoldierMissionCommandEnvelope {
  return {
    command_id: "dispatch-command:00000000-0000-4000-8000-000000000001",
    command_type: "assign_soldier_mission",
    contract_version: CONTRACT_VERSION,
    expected_entity_revisions: { soldier: 0 },
    idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000002",
    typed_arguments: {
      soldier_id: "soldier-a-01",
      role: "GATHERER",
      tool: "AXE",
      equipment_tier: 1,
      target_id: "node-wood-a",
      return_policy: "WHEN_FULL",
    },
    ...overrides,
  };
}

function moveCommand(): MovePlayerCommandEnvelope {
  return {
    command_id: "move-command:00000000-0000-4000-8000-000000000011",
    command_type: "move_player",
    contract_version: CONTRACT_VERSION,
    expected_entity_revisions: { player: 0 },
    idempotency_key: "move-idempotency:00000000-0000-4000-8000-000000000012",
    typed_arguments: { direction: "right" },
  };
}

function postJson(base: string, path: string, cookie: string, body: unknown): Promise<Response> {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deferred(): { readonly promise: Promise<void>; resolve(): void } {
  let complete: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    complete = resolve;
  });
  return {
    promise,
    resolve() {
      complete?.();
    },
  };
}

test("the gatherer command and result envelopes are exact, fixed, and privacy preserving", () => {
  const value = dispatchCommand();
  assert.deepEqual(parseAssignSoldierMissionCommandEnvelope(value), value);
  assert.throws(
    () => parseAssignSoldierMissionCommandEnvelope({ ...value, player_id: "player-b" }),
    /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
  );
  assert.throws(
    () => parseAssignSoldierMissionCommandEnvelope({ ...value, idempotency_key: value.command_id }),
    /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
  );
  for (const typed_arguments of [
    { ...value.typed_arguments, role: "HUNTER" },
    { ...value.typed_arguments, tool: "SWORD" },
    { ...value.typed_arguments, equipment_tier: 2 },
    { ...value.typed_arguments, return_policy: "ON_RECALL" },
    { ...value.typed_arguments, route: [{ x: 1, y: 1 }] },
  ]) {
    assert.throws(
      () => parseAssignSoldierMissionCommandEnvelope({ ...value, typed_arguments }),
      /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
    );
  }

  const success = {
    command_id: value.command_id,
    command_type: "assign_soldier_mission",
    contract_version: CONTRACT_VERSION,
    effect: "mission_dispatched",
    duplicate: false,
    soldier_id: "soldier-a-01",
    mission_id: "mission-1",
    mission_attempt_id: "mission-attempt-1",
    event_id: "mission-dispatched-1",
    committed_entity_revisions: { soldier: 1, mission: 0, mission_attempt: 0 },
  };
  assert.deepEqual(parseAssignSoldierMissionCommandSuccess(success, {
    commandId: value.command_id,
    contractVersion: CONTRACT_VERSION,
  }), success);
  assert.throws(
    () => parseAssignSoldierMissionCommandSuccess({ ...success, route: { source: { x: 1, y: 1 } } }, {
      commandId: value.command_id,
      contractVersion: CONTRACT_VERSION,
    }),
    /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
  );

  const ownedFailure = {
    command_id: value.command_id,
    command_type: "assign_soldier_mission",
    contract_version: CONTRACT_VERSION,
    effect: "rejected",
    error_code: "STALE_REVISION",
    current_entity_revisions: { soldier: 3 },
  };
  assert.deepEqual(parseAssignSoldierMissionCommandFailure(ownedFailure, {
    commandId: value.command_id,
    contractVersion: CONTRACT_VERSION,
  }), ownedFailure);
  const privateFailure = { ...ownedFailure, error_code: "NOT_OWNER", current_entity_revisions: {} };
  assert.deepEqual(parseAssignSoldierMissionCommandFailure(privateFailure, {
    commandId: value.command_id,
    contractVersion: CONTRACT_VERSION,
  }), privateFailure);
  assert.throws(
    () => parseAssignSoldierMissionCommandFailure({ ...ownedFailure, error_code: "NOT_OWNER" }, {
      commandId: value.command_id,
      contractVersion: CONTRACT_VERSION,
    }),
    /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
  );
  assert.throws(
    () => parseAssignSoldierMissionCommandFailure({ ...ownedFailure, current_entity_revisions: {} }, {
      commandId: value.command_id,
      contractVersion: CONTRACT_VERSION,
    }),
    /ASSIGN_SOLDIER_MISSION_COMMAND_INVALID/,
  );
});

test("strict dispatch HTTP admits only an existing scope and returns whitelisted durable results", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-dispatch-http-");
  let gateway: WorkerCommandGateway | undefined;
  let snapshotReads = 0;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      const worker = new WorldWorkerModule({ store: options?.store });
      gateway = worker.gateway;
      if (gateway) {
        const original = gateway.fullSnapshot.bind(gateway);
        gateway.fullSnapshot = (input) => {
          snapshotReads += 1;
          return original(input);
        };
      }
      return worker;
    },
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const body = dispatchCommand();

    const noSession = await fetch(`${base}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}?player_id=player-b`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(noSession.status, 401);
    assert.equal(noSession.headers.get("set-cookie"), null);
    assert.deepEqual(await noSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_REQUIRED" });

    const bootstrapResponse = await fetch(`${base}/api/local-fixture/bootstrap`);
    assert.equal(bootstrapResponse.status, 200);
    const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);

    const unknownSession = await postJson(
      base,
      ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
      `${LOCAL_FIXTURE_COOKIE_NAME}=unknown`,
      body,
    );
    assert.equal(unknownSession.status, 401);
    assert.deepEqual(await unknownSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_UNKNOWN" });

    const malformedSession = await postJson(
      base,
      ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
      LOCAL_FIXTURE_COOKIE_NAME,
      body,
    );
    assert.equal(malformedSession.status, 401);
    assert.deepEqual(await malformedSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_MALFORMED" });

    const wrongMethod = await fetch(`${base}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}`, { headers: { cookie } });
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get("allow"), "POST");
    assert.deepEqual(await wrongMethod.json(), { error_code: "ASSIGN_SOLDIER_MISSION_METHOD_NOT_ALLOWED" });

    const wrongMedia = await fetch(`${base}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "text/plain" },
      body: JSON.stringify(body),
    });
    assert.equal(wrongMedia.status, 415);
    assert.deepEqual(await wrongMedia.json(), { error_code: "ASSIGN_SOLDIER_MISSION_UNSUPPORTED_MEDIA_TYPE" });

    const oversized = await fetch(`${base}${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, padding: "x".repeat(2048) }),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), { error_code: "ASSIGN_SOLDIER_MISSION_PAYLOAD_TOO_LARGE" });

    const query = await postJson(base, `${ASSIGN_SOLDIER_MISSION_COMMAND_PATH}?player_id=player-b`, cookie, body);
    assert.equal(query.status, 400);
    assert.deepEqual(await query.json(), { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID" });

    const extraScope = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, {
      ...body,
      player_id: "player-b",
    });
    assert.equal(extraScope.status, 400);
    assert.deepEqual(await extraScope.json(), { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID" });

    const wrongContract = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, {
      ...body,
      contract_version: "SK-MVP-9.9",
    });
    assert.equal(wrongContract.status, 400);
    assert.deepEqual(await wrongContract.json(), { error_code: "ASSIGN_SOLDIER_MISSION_CONTRACT_UNSUPPORTED" });

    const accepted = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, body);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.headers.get("cache-control"), "no-store");
    assert.equal(accepted.headers.get("vary"), "Cookie");
    const acknowledgement = parseAssignSoldierMissionCommandSuccess(await accepted.json(), {
      commandId: body.command_id,
      contractVersion: CONTRACT_VERSION,
    });
    assert.equal(acknowledgement.duplicate, false);
    assert.deepEqual(acknowledgement.committed_entity_revisions, {
      soldier: 1,
      mission: 0,
      mission_attempt: 0,
    });
    for (const forbidden of ["route", "home_anchor", "snapshot", "binding", "world_id", "target_id"]) {
      assert.equal(forbidden in acknowledgement, false);
    }

    const duplicate = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, body);
    assert.equal(duplicate.status, 200);
    assert.equal((await duplicate.json() as { duplicate?: unknown }).duplicate, true);

    const conflictingRetryBody = dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000031",
    });
    const conflictingRetry = await postJson(
      base,
      ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
      cookie,
      conflictingRetryBody,
    );
    assert.equal(conflictingRetry.status, 409);
    assert.deepEqual(await conflictingRetry.json(), {
      command_id: conflictingRetryBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "DUPLICATE_COMMAND",
      current_entity_revisions: { soldier: 1 },
    });
    assert.equal(snapshotReads, 1);

    const staleBody = dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000003",
      idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000004",
    });
    const stale = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, staleBody);
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), {
      command_id: staleBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "STALE_REVISION",
      current_entity_revisions: { soldier: 1 },
    });
    assert.equal(snapshotReads, 2);

    const roleLockedBody = dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000005",
      idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000006",
      expected_entity_revisions: { soldier: 1 },
    });
    const roleLocked = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, roleLockedBody);
    assert.equal(roleLocked.status, 409);
    assert.equal((await roleLocked.json() as { error_code?: unknown }).error_code, "ROLE_LOCKED");
    assert.equal(snapshotReads, 3);

    const wrongToolBody = dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000007",
      idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000008",
      typed_arguments: { ...body.typed_arguments, soldier_id: "soldier-a-02", tool: "PICKAXE" },
    });
    const wrongTool = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, wrongToolBody);
    assert.equal(wrongTool.status, 409);
    assert.deepEqual(await wrongTool.json(), {
      command_id: wrongToolBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "TOOL_INCOMPATIBLE",
      current_entity_revisions: { soldier: 0 },
    });
    assert.equal(snapshotReads, 4);

    const foreignTargetBody = dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000009",
      idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000010",
      typed_arguments: { ...body.typed_arguments, soldier_id: "soldier-a-03", target_id: "node-wood-b" },
    });
    const foreignTarget = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, foreignTargetBody);
    assert.equal(foreignTarget.status, 409);
    assert.deepEqual(await foreignTarget.json(), {
      command_id: foreignTargetBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "TARGET_UNAVAILABLE",
      current_entity_revisions: { soldier: 0 },
    });
    assert.equal(snapshotReads, 5);

    for (const [soldierId, requestCookie, suffix] of [
      ["soldier-missing", cookie, "011"],
      ["soldier-b-01", cookie, "013"],
      ["soldier-a-04", `${LOCAL_FIXTURE_COOKIE_NAME}=fixture-v1-beta`, "015"],
    ] as const) {
      const privateBody = dispatchCommand({
        command_id: `dispatch-command:00000000-0000-4000-8000-000000000${suffix}`,
        idempotency_key: `dispatch-idempotency:00000000-0000-4000-8000-000000000${Number(suffix) + 1}`,
        typed_arguments: { ...body.typed_arguments, soldier_id: soldierId },
      });
      const denied = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, requestCookie, privateBody);
      assert.equal(denied.status, 403);
      assert.deepEqual(await denied.json(), {
        command_id: privateBody.command_id,
        command_type: "assign_soldier_mission",
        contract_version: CONTRACT_VERSION,
        effect: "rejected",
        error_code: "NOT_OWNER",
        current_entity_revisions: {},
      });
    }
    assert.equal(snapshotReads, 7);
    assert.ok(gateway);
  } finally {
    await entrypoint.shutdown("test");
  }

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.equal(store.getWorld(WORLD_ID)?.worldTime, 0);
    assert.equal(store.listMissions(WORLD_ID).length, 1);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("movement and dispatch share one per-player HTTP admission in both overlap directions", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-dispatch-admission-");
  const dispatchEntered = deferred();
  const releaseDispatch = deferred();
  const movementEntered = deferred();
  const releaseMovement = deferred();
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      const worker = new WorldWorkerModule({ store: options?.store });
      const gateway = worker.gateway;
      if (gateway) {
        const originalDispatch = gateway.assignSoldierMission.bind(gateway);
        gateway.assignSoldierMission = async (input) => {
          dispatchEntered.resolve();
          await releaseDispatch.promise;
          return originalDispatch(input);
        };
        const originalMovement = gateway.movePlayer.bind(gateway);
        gateway.movePlayer = async (input) => {
          movementEntered.resolve();
          await releaseMovement.promise;
          return originalMovement(input);
        };
      }
      return worker;
    },
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const bootstrapResponse = await fetch(`${base}/api/local-fixture/bootstrap`);
    const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);

    const pendingDispatch = postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, dispatchCommand());
    await dispatchEntered.promise;
    const blockedMovement = await postJson(base, MOVE_PLAYER_COMMAND_PATH, cookie, moveCommand());
    assert.equal(blockedMovement.status, 429);
    assert.deepEqual(await blockedMovement.json(), { error_code: "MOVE_PLAYER_COMMAND_IN_FLIGHT" });
    releaseDispatch.resolve();
    assert.equal((await pendingDispatch).status, 200);

    const pendingMovement = postJson(base, MOVE_PLAYER_COMMAND_PATH, cookie, moveCommand());
    await movementEntered.promise;
    const blockedDispatch = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, dispatchCommand({
      command_id: "dispatch-command:00000000-0000-4000-8000-000000000021",
      idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000022",
      typed_arguments: { ...dispatchCommand().typed_arguments, soldier_id: "soldier-a-02" },
    }));
    assert.equal(blockedDispatch.status, 429);
    assert.deepEqual(await blockedDispatch.json(), { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_IN_FLIGHT" });
    releaseMovement.resolve();
    assert.equal((await pendingMovement).status, 200);
  } finally {
    releaseDispatch.resolve();
    releaseMovement.resolve();
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the direct gateway orders movement and dispatch before one full snapshot without advancing time", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-dispatch-gateway-");
  let fixtureStore: PersistenceStore | undefined;
  let gateway: WorkerCommandGateway | undefined;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      if (options?.store instanceof PersistenceStore) {
        fixtureStore = options.store;
      }
      const worker = new WorldWorkerModule({ store: options?.store });
      gateway = worker.gateway;
      return worker;
    },
  });

  try {
    await entrypoint.start();
    assert.ok(fixtureStore);
    assert.ok(gateway);
    const player = fixtureStore.getPlayer(WORLD_ID, "player-a");
    assert.ok(player);

    const movement = gateway.movePlayer({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: player.binding,
      commandId: "gateway-move-command:00000000-0000-4000-8000-000000000051",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "gateway-move-idempotency:00000000-0000-4000-8000-000000000052",
    });
    const dispatch = gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: player.binding,
      commandId: "gateway-dispatch-command:00000000-0000-4000-8000-000000000053",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "AXE",
      equipmentTier: 1,
      targetId: "node-wood-a",
      expectedSoldierRevision: 0,
      returnPolicy: "WHEN_FULL",
      idempotencyKey: "gateway-dispatch-idempotency:00000000-0000-4000-8000-000000000054",
    });
    const projection = gateway.fullSnapshot({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: player.binding,
    });

    const [movementResult, dispatchResult, current] = await Promise.all([movement, dispatch, projection]);
    assert.equal(movementResult.effect, "moved");
    assert.equal(dispatchResult.effect, "mission_dispatched");
    assert.deepEqual(current.player.position, { x: 17, y: 64 });
    assert.equal(current.player.revision, 1);
    const mission = current.missions.find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.equal(mission?.missionId, dispatchResult.missionId);
    assert.equal(mission?.missionAttemptId, dispatchResult.missionAttemptId);
    assert.equal(mission?.phase, "TRAVELLING");
    assert.equal(current.worldTime, 0);
    assert.deepEqual(
      fixtureStore.events(WORLD_ID).map((event) => event.eventType),
      ["PlayerMoved", "MissionDispatched"],
    );
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejected dispatch replay keeps its durable code while returning the post-gateway live privacy vector", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-dispatch-rejection-replay-");
  const staleBody = dispatchCommand({
    command_id: "dispatch-command:00000000-0000-4000-8000-000000000061",
    idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000062",
    expected_entity_revisions: { soldier: 1 },
  });
  const acceptedBody = dispatchCommand({
    command_id: "dispatch-command:00000000-0000-4000-8000-000000000063",
    idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000064",
  });
  const privateBody = dispatchCommand({
    command_id: "dispatch-command:00000000-0000-4000-8000-000000000065",
    idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000066",
    typed_arguments: { ...dispatchCommand().typed_arguments, soldier_id: "soldier-b-01" },
  });

  const start = async () => {
    const entrypoint = createEntrypoint({
      config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
      createNextApp: () => fakeNextApp(),
      createWorker: (options) => new WorldWorkerModule({ store: options?.store }),
    });
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const bootstrapResponse = await fetch(`${base}/api/local-fixture/bootstrap`);
    const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    return { entrypoint, base, cookie };
  };

  let first = await start();
  try {
    const stale = await postJson(first.base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, first.cookie, staleBody);
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), {
      command_id: staleBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "STALE_REVISION",
      current_entity_revisions: { soldier: 0 },
    });

    const accepted = await postJson(first.base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, first.cookie, acceptedBody);
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json() as { duplicate?: unknown }).duplicate, false);

    const denied = await postJson(first.base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, first.cookie, privateBody);
    assert.equal(denied.status, 403);
    assert.deepEqual(await denied.json(), {
      command_id: privateBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "NOT_OWNER",
      current_entity_revisions: {},
    });
  } finally {
    await first.entrypoint.shutdown("test");
  }

  const resumed = await start();
  try {
    const staleReplay = await postJson(
      resumed.base,
      ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
      resumed.cookie,
      staleBody,
    );
    assert.equal(staleReplay.status, 409);
    assert.deepEqual(await staleReplay.json(), {
      command_id: staleBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "STALE_REVISION",
      current_entity_revisions: { soldier: 1 },
    });

    const privateReplay = await postJson(
      resumed.base,
      ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
      resumed.cookie,
      privateBody,
    );
    assert.equal(privateReplay.status, 403);
    assert.deepEqual(await privateReplay.json(), {
      command_id: privateBody.command_id,
      command_type: "assign_soldier_mission",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "NOT_OWNER",
      current_entity_revisions: {},
    });
  } finally {
    await resumed.entrypoint.shutdown("test");
  }

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.deepEqual(store.idempotency(WORLD_ID, staleBody.idempotency_key)?.result, {
      errorCode: "STALE_REVISION",
    });
    assert.deepEqual(store.idempotency(WORLD_ID, privateBody.idempotency_key)?.result, {
      errorCode: "OWNERSHIP_DENIED",
    });
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a rejection-write failure remains an unknown recovery response at the HTTP boundary", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-dispatch-recovery-");
  let fixtureStore: PersistenceStore | undefined;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      if (options?.store instanceof PersistenceStore) {
        fixtureStore = options.store;
      }
      return new WorldWorkerModule({ store: options?.store });
    },
  });

  try {
    await entrypoint.start();
    assert.ok(fixtureStore);
    const originalRecordRejected = fixtureStore.recordRejectedIdempotency;
    fixtureStore.recordRejectedIdempotency = () => {
      throw new PersistenceError("INJECTED_FAILURE");
    };
    try {
      const address = entrypoint.address();
      assert.ok(address && typeof address === "object");
      const base = `http://127.0.0.1:${address.port}`;
      const bootstrapResponse = await fetch(`${base}/api/local-fixture/bootstrap`);
      const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie);
      const body = dispatchCommand({
        command_id: "dispatch-command:00000000-0000-4000-8000-000000000041",
        idempotency_key: "dispatch-idempotency:00000000-0000-4000-8000-000000000042",
        typed_arguments: { ...dispatchCommand().typed_arguments, tool: "PICKAXE" },
      });
      const response = await postJson(base, ASSIGN_SOLDIER_MISSION_COMMAND_PATH, cookie, body);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error_code: "RECOVERY_REQUIRED" });
    } finally {
      fixtureStore.recordRejectedIdempotency = originalRecordRejected;
    }
  } finally {
    await entrypoint.shutdown("test");
  }

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.equal(
      store.idempotency(WORLD_ID, "dispatch-idempotency:00000000-0000-4000-8000-000000000042"),
      null,
    );
    assert.equal(store.listMissions(WORLD_ID).length, 0);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 0);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
