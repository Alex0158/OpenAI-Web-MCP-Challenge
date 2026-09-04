import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { WorldWorkerModule } from "../src/server/world-worker";
import { WorkerCommandGateway, WorkerGatewayError } from "../src/server/worker-command-gateway";
import type { AssignSoldierMissionInput } from "../src/server/mission-service";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp09-mission-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  gateway: WorkerCommandGateway;
}

async function openRuntime(): Promise<{ runtime: Runtime; directory: string }> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp09-mission-"));
  const dbPath = join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  createAndPersistG2Fixture(seedStore, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seedStore.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store });
  await worker.start();
  if (!worker.gateway) {
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
    throw new Error("worker gateway unavailable");
  }
  return { runtime: { store, worker, gateway: worker.gateway }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  rmSync(directory, { recursive: true, force: true });
}

function gathererInput(overrides: Partial<AssignSoldierMissionInput> = {}): AssignSoldierMissionInput {
  const idempotencyKey = overrides.idempotencyKey ?? "dispatch-wood-a-01";
  return {
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId: "node-wood-a",
    expectedSoldierRevision: 0,
    ...overrides,
    idempotencyKey,
    commandId: overrides.commandId ?? `command-${idempotencyKey}`,
  };
}

test("a resident gatherer dispatch is one durable server-owned handoff", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const result = await runtime.gateway.assignSoldierMission(gathererInput());

    assert.equal(result.effect, "mission_dispatched");
    assert.equal(result.worldId, WORLD_ID);
    assert.equal(result.soldierId, "soldier-a-01");
    assert.equal(result.role, "GATHERER");
    assert.equal(result.tool, "AXE");
    assert.equal(result.targetId, "node-wood-a");
    assert.equal(result.phase, "TRAVELLING");
    assert.equal(result.soldierState, "FIELD");
    assert.equal(result.route.status, "PLANNED");
    assert.equal(result.route.walkabilityVersion, runtime.store.getWorld(WORLD_ID)?.mapFingerprint);
    assert.deepEqual(result.route.source, { x: 16, y: 64 });
    assert.deepEqual(result.route.target, { x: 30, y: 64 });
    assert.equal(result.route.waypoints.length, 15);

    const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.deepEqual(soldier, {
      worldId: WORLD_ID,
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: "FIELD",
      role: "GATHERER",
      tool: "AXE",
      revision: 1,
    });
    const mission = runtime.store.getMission(WORLD_ID, result.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, result.missionAttemptId);
    assert.equal(mission?.phase, "TRAVELLING");
    assert.equal(mission?.activeAttemptId, result.missionAttemptId);
    assert.equal(attempt?.phase, "TRAVELLING");
    assert.equal(attempt?.role, "GATHERER");
    assert.equal(attempt?.tool, "AXE");
    assert.equal(attempt?.equipmentTier, 1);
    assert.deepEqual(attempt?.homeAnchor, { x: 16, y: 64 });
    const dispatchEvents = runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched");
    assert.equal(dispatchEvents.length, 1);
    assert.equal(dispatchEvents[0]?.causationId, "command-dispatch-wood-a-01");
    assert.equal(dispatchEvents[0]?.idempotencyKey, "dispatch-wood-a-01");
    assert.equal(runtime.store.idempotency(WORLD_ID, "dispatch-wood-a-01")?.outcome, "committed");
    assert.equal(
      JSON.parse(runtime.store.idempotency(WORLD_ID, "dispatch-wood-a-01")?.requestFingerprint ?? "null").commandId,
      "command-dispatch-wood-a-01",
    );
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("dispatch retry returns the original assignment without a second attempt or event", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const input = gathererInput();
    const first = await runtime.gateway.assignSoldierMission(input);
    const duplicate = await runtime.gateway.assignSoldierMission({ ...input });

    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.missionId, first.missionId);
    assert.equal(duplicate.missionAttemptId, first.missionAttemptId);
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 1);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("dispatch command identity is required, distinct from retry identity, and fingerprinted", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ commandId: "" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ commandId: "dispatch-wood-a-01" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );

    const input = gathererInput();
    await runtime.gateway.assignSoldierMission(input);
    await assert.rejects(
      runtime.gateway.assignSoldierMission({ ...input, commandId: "command-dispatch-wood-a-01-rewritten" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission({ ...input, targetId: "node-rock-a", tool: "PICKAXE" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("stale, wrong-owner, cross-shelter, and incompatible-tool dispatches leave no partial state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ expectedSoldierRevision: 1, idempotencyKey: "dispatch-stale" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ binding: "binding-b", idempotencyKey: "dispatch-binding" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ targetId: "node-wood-b", idempotencyKey: "dispatch-target-owner" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "TARGET_UNAVAILABLE",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ tool: "PICKAXE", idempotencyKey: "dispatch-wrong-tool" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "TOOL_INCOMPATIBLE",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({ targetId: "node-missing", idempotencyKey: "dispatch-missing-target" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "TARGET_UNAVAILABLE",
    );

    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
    assert.equal(runtime.store.listSoldiers(WORLD_ID).every((soldier) => soldier.state === "AT_SHELTER"), true);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a rejected dispatch key replays its typed outcome without creating state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const input = gathererInput({ expectedSoldierRevision: 1, idempotencyKey: "dispatch-rejected-replay" });
    await assert.rejects(
      runtime.gateway.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    await assert.rejects(
      runtime.gateway.assignSoldierMission({ ...input }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotencyKey)?.outcome, "rejected");
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("stale soldier revision precedes mutable role, target, and tool policy", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const input = gathererInput({
      expectedSoldierRevision: 1,
      targetId: "node-missing",
      tool: "PICKAXE",
      idempotencyKey: "dispatch-stale-precedence",
      commandId: "command-dispatch-stale-precedence",
    });
    await assert.rejects(
      runtime.gateway.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.deepEqual(runtime.store.idempotency(WORLD_ID, input.idempotencyKey)?.result, {
      errorCode: "STALE_REVISION",
    });
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the transaction recheck keeps stale precedence when persisted state changes after preflight", async () => {
  const { runtime, directory } = await openRuntime();
  const originalCommitMissionDispatch = runtime.store.commitMissionDispatch;
  try {
    runtime.store.commitMissionDispatch = (input) => {
      const concurrent = new DatabaseSync(runtime.store.databasePath);
      concurrent.prepare("UPDATE soldier SET revision = 1 WHERE world_id = ? AND soldier_id = ?").run(
        WORLD_ID,
        input.soldierId,
      );
      concurrent.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(
        WORLD_ID,
        input.targetId,
      );
      concurrent.close();
      return originalCommitMissionDispatch.call(runtime.store, input);
    };
    const input = gathererInput({
      idempotencyKey: "dispatch-transaction-stale-precedence",
      commandId: "command-dispatch-transaction-stale-precedence",
    });
    await assert.rejects(
      runtime.gateway.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.deepEqual(runtime.store.idempotency(WORLD_ID, input.idempotencyKey)?.result, {
      errorCode: "STALE_REVISION",
    });
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
  } finally {
    runtime.store.commitMissionDispatch = originalCommitMissionDispatch;
    await closeRuntime(runtime, directory);
  }
});

test("a definitive preflight rejection is not returned when its retry outcome cannot be stored", async () => {
  const { runtime, directory } = await openRuntime();
  const originalRecordRejected = runtime.store.recordRejectedIdempotency;
  try {
    runtime.store.recordRejectedIdempotency = () => {
      throw new Error("injected rejected-idempotency write failure");
    };
    const input = gathererInput({
      expectedSoldierRevision: 1,
      idempotencyKey: "dispatch-rejection-write-failure",
      commandId: "command-dispatch-rejection-write-failure",
    });
    await assert.rejects(
      runtime.gateway.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "STORE_OPEN_FAILED",
    );
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotencyKey), null);
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
  } finally {
    runtime.store.recordRejectedIdempotency = originalRecordRejected;
    await closeRuntime(runtime, directory);
  }
});

test("a definitive transaction rejection is not returned when its retry outcome cannot be stored", async () => {
  const { runtime, directory } = await openRuntime();
  const originalCommitMissionDispatch = runtime.store.commitMissionDispatch;
  const originalRecordRejected = runtime.store.recordRejectedIdempotency;
  try {
    runtime.store.commitMissionDispatch = (input) => {
      const concurrent = new DatabaseSync(runtime.store.databasePath);
      concurrent.prepare("UPDATE soldier SET revision = 1 WHERE world_id = ? AND soldier_id = ?").run(
        WORLD_ID,
        input.soldierId,
      );
      concurrent.close();
      return originalCommitMissionDispatch.call(runtime.store, input);
    };
    runtime.store.recordRejectedIdempotency = () => {
      throw new Error("injected transaction rejection write failure");
    };
    const input = gathererInput({
      idempotencyKey: "dispatch-transaction-rejection-write-failure",
      commandId: "command-dispatch-transaction-rejection-write-failure",
    });
    await assert.rejects(
      runtime.gateway.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "STORE_OPEN_FAILED",
    );
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotencyKey), null);
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).length, 0);
  } finally {
    runtime.store.commitMissionDispatch = originalCommitMissionDispatch;
    runtime.store.recordRejectedIdempotency = originalRecordRejected;
    await closeRuntime(runtime, directory);
  }
});

test("a field soldier cannot switch role or tool before the current attempt ends", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const first = await runtime.gateway.assignSoldierMission(gathererInput());
    await assert.rejects(
      runtime.gateway.assignSoldierMission(gathererInput({
        role: "HUNTER",
        tool: "SWORD",
        targetId: "node-wood-a",
        idempotencyKey: "dispatch-role-switch",
        expectedSoldierRevision: first.soldierRevision,
      })),
      (error: unknown) => error instanceof PersistenceError && error.code === "ROLE_LOCKED",
    );

    const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.equal(soldier?.role, "GATHERER");
    assert.equal(soldier?.tool, "AXE");
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("rock dispatch derives the deterministic pickaxe route from the persisted fixture", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const result = await runtime.gateway.assignSoldierMission(gathererInput({
      soldierId: "soldier-a-02",
      targetId: "node-rock-a",
      tool: "PICKAXE",
      idempotencyKey: "dispatch-rock-a-02",
    }));
    assert.equal(result.tool, "PICKAXE");
    assert.deepEqual(result.route.source, { x: 16, y: 64 });
    assert.deepEqual(result.route.target, { x: 34, y: 64 });
    assert.deepEqual(result.route.waypoints[0], { x: 16, y: 64 });
    assert.deepEqual(result.route.waypoints.at(-1), { x: 34, y: 64 });
    assert.equal(result.route.waypoints.every((point, index) => point.y === 64 && point.x === 16 + index), true);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the FIFO gateway serializes two dispatches for one soldier", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const first = gathererInput({ idempotencyKey: "dispatch-race-a", targetId: "node-wood-a" });
    const second = gathererInput({ idempotencyKey: "dispatch-race-b", targetId: "node-rock-a", tool: "PICKAXE" });
    const outcomes = await Promise.allSettled([
      runtime.gateway.assignSoldierMission(first),
      runtime.gateway.assignSoldierMission(second),
    ]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
    const rejected = outcomes.find((outcome) => outcome.status === "rejected");
    assert.equal((rejected as PromiseRejectedResult).reason instanceof PersistenceError, true);
    assert.equal((rejected as PromiseRejectedResult).reason.code, "STALE_REVISION");
    assert.equal(runtime.store.listMissions(WORLD_ID).length, 1);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("schema 2 databases migrate to the CP-09 mission columns atomically", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp09-migration-"));
  const dbPath = join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  createAndPersistG2Fixture(seedStore, { worldId: WORLD_ID });
  seedStore.close();
  const database = new DatabaseSync(dbPath);
  for (const column of ["phase", "tool", "return_policy", "active_attempt_id", "next_due_world_time"]) {
    database.exec(`ALTER TABLE mission DROP COLUMN ${column}`);
  }
  for (const column of ["phase", "role", "tool", "equipment_tier", "target_id", "route_json", "home_anchor_json", "return_policy", "start_world_time", "last_transition_world_time", "next_due_world_time"]) {
    database.exec(`ALTER TABLE mission_attempt DROP COLUMN ${column}`);
  }
  database.prepare("UPDATE schema_meta SET schema_version = 2, migration_id = 'cp08-001' WHERE schema_meta_id = 'singleton'").run();
  database.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.equal(store.metadata().schemaVersion, 9);
    assert.equal(store.metadata().migrationId, "cp14-001");
    const migrated = new DatabaseSync(dbPath);
    const missionColumns = new Set((migrated.prepare("PRAGMA table_info(mission)").all() as Array<{ name?: unknown }>).map((row) => row.name));
    const attemptColumns = new Set((migrated.prepare("PRAGMA table_info(mission_attempt)").all() as Array<{ name?: unknown }>).map((row) => row.name));
    assert.equal(["phase", "tool", "return_policy", "active_attempt_id", "next_due_world_time"].every((column) => missionColumns.has(column)), true);
    assert.equal(["phase", "role", "tool", "equipment_tier", "target_id", "route_json", "home_anchor_json", "return_policy", "start_world_time", "last_transition_world_time", "next_due_world_time"].every((column) => attemptColumns.has(column)), true);
    assert.equal(migrated.prepare("SELECT next_due_world_time FROM mission WHERE world_id = ?").get(WORLD_ID)?.next_due_world_time ?? null, null);
    assert.equal(migrated.prepare("SELECT next_due_world_time FROM mission_attempt WHERE world_id = ?").get(WORLD_ID)?.next_due_world_time ?? null, null);
    migrated.close();
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a gateway without the mission capability fails visibly", async () => {
  const gateway = new WorkerCommandGateway({
    worker: { state: "ready" },
    movement: {} as never,
    cadence: {} as never,
    snapshot: {} as never,
  });
  try {
    await assert.rejects(
      gateway.assignSoldierMission(gathererInput()),
      (error: unknown) => error instanceof WorkerGatewayError && error.code === "MISSION_UNAVAILABLE",
    );
  } finally {
    gateway.close();
  }
});
