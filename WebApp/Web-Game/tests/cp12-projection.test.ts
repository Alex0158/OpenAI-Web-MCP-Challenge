import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { buildAccessibleMissionRows, buildCanvasDrawCommands, buildProjectionViewModel } from "../src/client/projection-model";
import { MissionDepositService } from "../src/server/mission-deposit-service";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionReturnService } from "../src/server/mission-return-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { MonsterCombatService } from "../src/server/monster-combat-service";
import { createPersistenceStore } from "../src/server/persistence/store";
import { WorldClock } from "../src/server/world-clock";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { ClientSnapshot } from "../src/server/world-projection";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp12-projection-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
}

function seedDatabase(dbPath: string): void {
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    createAndPersistG2Fixture(store, {
      worldId: WORLD_ID,
      playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
    });
  } finally {
    store.close();
  }
}

async function openRuntime(options: { gameplay?: boolean } = {}): Promise<{ runtime: Runtime; directory: string }> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-projection-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const travel = new MissionTravelService({ store });
  const returning = new MissionReturnService({ store });
  const extraction = new MissionExtractionService({ store });
  const deposit = new MissionDepositService({ store });
  const combat = new MonsterCombatService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    ...(options.gameplay ? {
      phaseHandlers: {
        movement: (context: { worldId: string; worldTime: number }) => {
          travel.advanceAtBoundary(context);
          returning.advanceAtBoundary(context);
        },
        extraction: (context: { worldId: string; worldTime: number }) => extraction.advanceAtBoundary(context),
        deposit: (context: { worldId: string; worldTime: number }) => deposit.advanceAtBoundary(context),
        contact: (context: { worldId: string; worldTime: number }) => combat.advanceContactAtBoundary(context),
        combat: (context: { worldId: string; worldTime: number }) => combat.advanceCombatAtBoundary(context),
      },
    } : {}),
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  runtime.worker.gateway?.close();
  await runtime.worker.stop();
  rmSync(directory, { recursive: true, force: true });
}

async function snapshot(runtime: Runtime, playerId: "player-a" | "player-b" = "player-a"): Promise<ClientSnapshot> {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.fullSnapshot({
    worldId: WORLD_ID,
    playerId,
    binding: playerId === "player-a" ? "binding-a" : "binding-b",
  });
}

async function dispatchGatherer(runtime: Runtime, options: {
  soldierId?: string;
  targetId?: "node-wood-a" | "node-rock-a";
  tool?: "AXE" | "PICKAXE";
  idempotencyKey?: string;
} = {}) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  const idempotencyKey = options.idempotencyKey ?? "cp12-dispatch-wood-a-01";
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: options.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: options.tool ?? "AXE",
    equipmentTier: 1,
    targetId: options.targetId ?? "node-wood-a",
    expectedSoldierRevision: 0,
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
}

async function dispatchHunter(runtime: Runtime) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-02",
    role: "HUNTER",
    tool: "SWORD",
    equipmentTier: 1,
    targetId: "monster-seeded-01",
    expectedSoldierRevision: 0,
    commandId: "command-cp12-dispatch-hunter-a-02",
    idempotencyKey: "cp12-dispatch-hunter-a-02",
  });
}

test("the full projection includes sensed Wood/Rock nodes and a resident row without private quantity", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const current = await snapshot(runtime);
    assert.deepEqual(current.resourceNodes.map((node) => [node.resourceNodeId, node.resourceType, node.availability]), [
      ["node-rock-a", "rock", "AVAILABLE"],
      ["node-wood-a", "wood", "AVAILABLE"],
    ]);
    assert.equal(current.resourceNodes.every((node) => !("quantity" in node)), true);
    assert.deepEqual(current.map.blockedCells, []);
    assert.equal(current.worldEventCursor, 0);
    assert.equal(current.missions.length, 5);
    const resident = current.missions.find((mission) => mission.soldierId === "soldier-a-01");
    assert.ok(resident);
    assert.equal(resident.missionId, null);
    assert.equal(resident.phase, "AT_SHELTER");
    assert.equal(resident.role, null);
    assert.equal(resident.tool, null);
    assert.equal(resident.nextAction, "DISPATCH");
    assert.deepEqual(resident.cargo, { quantity: 0, capacityUsed: 0, capacity: 5, resourceTypes: [] });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("an active gatherer row and actor use the server-derived route position", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    assert.equal(dispatched.role, "GATHERER");
    await runtime.worker.advance(1000);
    const current = await snapshot(runtime);
    const mission = current.missions.find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.ok(mission);
    assert.equal(mission.missionId, dispatched.missionId);
    assert.equal(mission.missionAttemptId, dispatched.missionAttemptId);
    assert.equal(mission.phase, "TRAVELLING");
    assert.equal(mission.role, "GATHERER");
    assert.equal(mission.tool, "AXE");
    assert.deepEqual(mission.route?.source, { x: 16, y: 64 });
    assert.deepEqual(mission.route?.target, { x: 30, y: 64 });
    assert.deepEqual(mission.position, { x: 19, y: 64 });
    const actor = current.visibleActors.find((candidate) => candidate.kind === "soldier" && candidate.soldierId === "soldier-a-01");
    assert.deepEqual(actor?.position, mission.position);
    assert.equal(current.soldiers.find((soldier) => soldier.soldierId === "soldier-a-01")?.missionId, dispatched.missionId);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a returning hunter row reverses the durable route and retains the terminal encounter", async () => {
  const { runtime, directory } = await openRuntime({ gameplay: true });
  try {
    const dispatched = await dispatchHunter(runtime);
    await runtime.worker.advance(26000);
    let current = await snapshot(runtime);
    let mission = current.missions.find((candidate) => candidate.soldierId === "soldier-a-02");
    assert.ok(mission);
    assert.equal(mission.missionId, dispatched.missionId);
    assert.equal(mission.phase, "RETURNING");
    assert.equal(mission.nextAction, "MONITOR");
    assert.equal(mission.role, "HUNTER");
    assert.equal(mission.tool, "SWORD");
    assert.deepEqual(mission.position, { x: 48, y: 64 });
    assert.equal(mission.encounter?.terminalCause, "MONSTER_DEFEATED");

    await runtime.worker.advance(1000);
    current = await snapshot(runtime);
    mission = current.missions.find((candidate) => candidate.soldierId === "soldier-a-02");
    assert.ok(mission);
    assert.deepEqual(mission.position, { x: 45, y: 64 });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the projection keeps player scope and exposes a combat review outcome only to its owner", async () => {
  const { runtime, directory } = await openRuntime({ gameplay: true });
  try {
    await dispatchGatherer(runtime, { targetId: "node-rock-a", tool: "PICKAXE", idempotencyKey: "cp12-dispatch-rock-review" });
    await runtime.worker.advance(24000);
    const owner = await snapshot(runtime, "player-a");
    const review = owner.missions.find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.ok(review);
    assert.equal(review.phase, "WAITING_REVIEW");
    assert.equal(review.nextAction, "REVIEW");
    assert.equal(review.reissue.waitingReviewReason, "NO_SAFE_REISSUE_ROUTE");
    assert.equal(review.reissue.budget, 0);
    assert.equal(review.role, "GATHERER");
    assert.equal(review.tool, "PICKAXE");
    assert.equal(review.cargo.quantity, 0);
    assert.equal(review.encounter?.terminalCause, "GATHERER_LOST");
    assert.equal(JSON.stringify(owner).includes("shelter-b"), false);
    assert.equal(JSON.stringify(owner).includes("node-wood-b"), false);
    assert.equal(JSON.stringify(owner).includes("binding-b"), false);
    const other = await snapshot(runtime, "player-b");
    assert.equal(other.missions.some((candidate) => candidate.missionId === review.missionId), false);
    assert.equal(JSON.stringify(other).includes("soldier-a-01"), false);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the client model is deterministic, semantic, and explicit for null, stale, unsupported, and invalid states", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const current = await snapshot(runtime);
    const ready = buildProjectionViewModel({ snapshot: current, connectionState: "READY", capability: "unsupported" });
    assert.equal(ready.snapshotStatus, "READY");
    assert.equal(ready.capability, "unsupported");
    assert.match(ready.statusMessage, /Realtime capability unavailable; human controls remain available/);
    assert.deepEqual(buildCanvasDrawCommands(ready), buildCanvasDrawCommands(ready));
    const commands = buildCanvasDrawCommands(ready);
    assert.equal(commands.some((command) => command.kind === "resource" && command.resourceType === "wood"), true);
    assert.equal(commands.some((command) => command.kind === "actor" && command.actorKind === "shelter"), true);
    const rows = buildAccessibleMissionRows(ready);
    assert.equal(rows.some((row) => row.text.includes("soldier-a-01") && row.text.includes("AT_SHELTER") && row.text.includes("DISPATCH")), true);

    const waiting = buildProjectionViewModel({ snapshot: null, connectionState: "CONNECTING", capability: "unsupported" });
    assert.equal(waiting.snapshotStatus, "WAITING_FOR_SNAPSHOT");
    assert.match(waiting.statusMessage, /snapshot/i);
    const stale = buildProjectionViewModel({ snapshot: current, connectionState: "STALE", capability: "supported" });
    assert.equal(stale.snapshotStatus, "STALE");
    assert.equal(stale.missions.length, current.missions.length);
    assert.match(stale.statusMessage, /reconnect/i);
    const reconnecting = buildProjectionViewModel({ snapshot: current, connectionState: "CONNECTING", capability: "supported" });
    assert.equal(reconnecting.snapshotStatus, "STALE");
    assert.equal(reconnecting.shelter?.shelterId, current.shelter.shelterId);
    assert.equal(reconnecting.recentEvents.length, current.recentEvents.length);
    assert.match(reconnecting.statusMessage, /remains readable/i);
    const invalid = buildProjectionViewModel({
      snapshot: { ...current, map: { ...current.map, blockedCells: [{ x: 999, y: 999 }] } },
      connectionState: "READY",
      capability: "supported",
    });
    assert.equal(invalid.snapshotStatus, "INVALID_FRAME");
    assert.equal(invalid.missions.length, 0);
    assert.match(invalid.statusMessage, /invalid/i);
    const malformedMission = buildProjectionViewModel({
      snapshot: {
        ...current,
        missions: current.missions.map((mission, index) => index === 0
          ? { ...mission, missionState: "ACTIVE" }
          : mission),
      },
      connectionState: "READY",
      capability: "supported",
    });
    assert.equal(malformedMission.snapshotStatus, "INVALID_FRAME");
  } finally {
    await closeRuntime(runtime, directory);
  }
});
