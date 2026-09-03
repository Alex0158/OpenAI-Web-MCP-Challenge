import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import {
  G2_FIXTURE_GENERATION_VERSION,
  G2_FIXTURE_SEED,
  createG2FixtureManifest,
  createAndPersistG2Fixture,
  loadPersistedG2Fixture,
  validateG2FixtureManifest,
} from "../src/server/world-fixture";
import { WorldClock } from "../src/server/world-clock";
import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";

test("the accepted seed and generation version replay the same fixture manifest", () => {
  const first = createG2FixtureManifest(G2_FIXTURE_SEED, G2_FIXTURE_GENERATION_VERSION);
  const second = createG2FixtureManifest(G2_FIXTURE_SEED, G2_FIXTURE_GENERATION_VERSION);

  assert.deepEqual(first, second);
  assert.equal(first.mapFingerprint.length, 64);
  validateG2FixtureManifest(first);
});

test("unsupported seed or generation version fails visibly", () => {
  assert.throws(
    () => createG2FixtureManifest("unseeded-world", G2_FIXTURE_GENERATION_VERSION),
    (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
  );
  assert.throws(
    () => createG2FixtureManifest(G2_FIXTURE_SEED, "g2-fixture-unsupported"),
    (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
  );
});

test("fixture placement satisfies separation, start-zone, camera, and route invariants", () => {
  const manifest = createG2FixtureManifest(G2_FIXTURE_SEED, G2_FIXTURE_GENERATION_VERSION);
  const shelters = new Map(manifest.shelters.map((shelter) => [shelter.shelterId, shelter]));
  const nodes = manifest.resourceNodes;
  const coordinateKey = (point: { x: number; y: number }) => `${point.x},${point.y}`;
  const initialCoordinates = [
    ...manifest.shelters.map((shelter) => shelter.position),
    ...nodes.map((node) => node.position),
    manifest.monster.position,
  ].map(coordinateKey);

  assert.equal(new Set(initialCoordinates).size, initialCoordinates.length);
  assert.equal(manifest.players.length, 2);
  assert.equal(manifest.shelters.length, 2);
  assert.equal(manifest.soldiers.length, 10);
  assert.equal(manifest.resourceNodes.length, 4);
  assert.equal(manifest.monster.monsterId, "monster-seeded-01");
  assert.ok(Math.hypot(112 - 16, 64 - 64) >= 80);
  assert.ok(Math.abs(16 - 112) > manifest.cameraTarget.width);
  assert.ok(manifest.monster.patrolRoute.some((point) => coordinateKey(point) === "34,64"));

  for (const node of nodes) {
    const shelter = shelters.get(node.ownerShelterId);
    assert.ok(shelter);
    const distance = Math.hypot(node.position.x - shelter.position.x, node.position.y - shelter.position.y);
    assert.ok(distance >= 14 && distance <= 20);
    assert.ok(distance > manifest.protectedStart.radiusTiles);
    assert.equal(node.quantity, 20);
  }
  for (const soldier of manifest.soldiers) {
    assert.equal(soldier.lifecycle, "AT_SHELTER");
    assert.equal(soldier.revision, 0);
  }
});

test("fixture persistence is atomic, world-scoped, and restart does not regenerate", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp07-fixture-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });

  try {
    store.open();
    const first = createAndPersistG2Fixture(store, { worldId: "fixture-world-a" });
    const second = createAndPersistG2Fixture(store, { worldId: "fixture-world-b" });

    assert.notEqual(first.worldId, second.worldId);
    assert.equal(store.listPlayers(first.worldId).length, 2);
    assert.equal(store.listShelters(first.worldId).length, 2);
    assert.equal(store.listSoldiers(first.worldId).length, 10);
    assert.ok(store.listSoldiers(first.worldId).every((soldier) => soldier.state === "AT_SHELTER"));
    assert.equal(store.listResourceNodes(first.worldId).length, 4);
    assert.equal(store.listMonsters(first.worldId).length, 1);
    assert.equal(store.listMonsters(first.worldId)[0]?.state, "PATROL");
    assert.equal(store.getWorld(first.worldId)?.mapFingerprint, first.manifest.mapFingerprint);
    assert.equal(store.getWorld(first.worldId)?.worldSeed, first.manifest.worldSeed);
    assert.equal(store.getWorld(first.worldId)?.generationVersion, first.manifest.generationVersion);
    const clock = new WorldClock({ worldId: first.worldId, persistence: store });
    clock.start();
    clock.recoverTo(5);
    assert.equal(store.getWorld(first.worldId)?.worldTime, 5);
    assert.deepEqual(loadPersistedG2Fixture(store, second.worldId).manifest, second.manifest);

    assert.throws(
      () => createAndPersistG2Fixture(store, { worldId: first.worldId }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    assert.equal(store.listSoldiers(first.worldId).length, 10);

    store.commitTransition({
      worldId: first.worldId,
      worldTime: 5,
      idempotency: { key: "fixture-a-test-event", binding: "fixture-binding-a", request: { kind: "fixture-test" } },
      stateMutations: [{ entityType: "shelter", entityId: "shelter-a", expectedRevision: 0, patch: { coins: 1 } }],
      events: [{ eventId: "fixture-a-test-event-1", eventType: "FixtureTest", aggregateType: "shelter", aggregateId: "shelter-a", visibilityScope: { kind: "shelter", shelterId: "shelter-a" }, typedPayload: { kind: "fixture-test" } }],
    });
    assert.equal(store.events(first.worldId).length, 1);
    assert.equal(store.events(second.worldId).length, 0);

    store.close();
    store.open();
    const recovered = loadPersistedG2Fixture(store, first.worldId);
    assert.deepEqual(recovered.manifest, first.manifest);
    assert.equal(store.listSoldiers(first.worldId).length, 10);
    assert.equal(store.listResourceNodes(first.worldId).length, 4);
    assert.equal(store.listMonsters(first.worldId).length, 1);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid snapshot rolls back every fixture row", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp07-rollback-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });

  try {
    store.open();
    assert.throws(
      () => store.createWorldFixture({
        world: { worldId: "fixture-world-invalid", worldTime: 0 },
        players: [],
        shelters: [],
        soldiers: [],
        resourceNodes: [],
        monsters: [],
        snapshot: {
          worldId: "fixture-world-invalid",
          worldSnapshotId: "",
          worldTime: 0,
          lastWorldEventCursor: 0,
          entityRevisions: {},
          state: { invalid: true },
        },
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "SNAPSHOT_INVALID",
    );
    assert.equal(store.getWorld("fixture-world-invalid"), null);
    assert.throws(
      () => store.events("fixture-world-invalid"),
      (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_NOT_FOUND",
    );
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
