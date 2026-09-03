import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { MissionService, planOpenGridRoute, type AssignSoldierMissionInput } from "../src/server/mission-service";
import { createPersistenceStore, PersistenceError, type PersistenceStore } from "../src/server/persistence/store";
import type { CommitMissionDispatchInput, IdempotencyInput } from "../src/server/persistence/types";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp12-dispatch-hardening-world";

interface StoreHarness {
  readonly directory: string;
  readonly store: PersistenceStore;
}

function openStore(): StoreHarness {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-dispatch-hardening-"));
  const store = createPersistenceStore({
    dbPath: join(directory, "world.sqlite"),
    contractVersion: CONTRACT_VERSION,
  });
  store.open();
  createAndPersistG2Fixture(store, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  return { directory, store };
}

function closeStore(harness: StoreHarness): void {
  harness.store.close();
  rmSync(harness.directory, { recursive: true, force: true });
}

function missionRequest(input: {
  readonly commandId: string;
  readonly playerId?: string;
  readonly soldierId?: string;
  readonly targetId?: string;
  readonly expectedSoldierRevision?: number;
}): Record<string, unknown> {
  return {
    kind: "assign_soldier_mission",
    playerId: input.playerId ?? "player-a",
    commandId: input.commandId,
    soldierId: input.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId: input.targetId ?? "node-wood-a",
    expectedSoldierRevision: input.expectedSoldierRevision ?? 0,
    returnPolicy: "WHEN_FULL",
  };
}

function dispatchInput(overrides: {
  readonly commandId?: string;
  readonly requestCommandId?: string;
  readonly idempotencyKey?: string;
  readonly eventCausationId?: string;
  readonly eventIdempotencyKey?: string;
  readonly typedPayload?: Record<string, unknown>;
} = {}): CommitMissionDispatchInput {
  const commandId = overrides.commandId ?? "command-dispatch-hardening-01";
  const idempotencyKey = overrides.idempotencyKey ?? "idempotency-dispatch-hardening-01";
  const soldierId = "soldier-a-01";
  const missionId = "mission-dispatch-hardening-01";
  const missionAttemptId = "mission-attempt-dispatch-hardening-01";
  const targetId = "node-wood-a";
  const route = planOpenGridRoute({ x: 16, y: 64 }, { x: 30, y: 64 }, "g2-fixture-1");
  const homeAnchor = { x: 16, y: 64 } as const;
  const typedPayload = {
    missionId,
    missionAttemptId,
    soldierId,
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId,
    route,
    homeAnchor,
    returnPolicy: "WHEN_FULL",
    phase: "TRAVELLING",
  };
  return {
    worldId: WORLD_ID,
    worldTime: 0,
    commandId,
    idempotency: {
      key: idempotencyKey,
      binding: "binding-a",
      request: missionRequest({ commandId: overrides.requestCommandId ?? commandId }),
    },
    soldierId,
    expectedSoldierRevision: 0,
    missionId,
    missionAttemptId,
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId,
    route,
    homeAnchor,
    returnPolicy: "WHEN_FULL",
    event: {
      eventId: "mission-dispatched-hardening-01",
      eventType: "MissionDispatched",
      causationId: overrides.eventCausationId ?? commandId,
      idempotencyKey: overrides.eventIdempotencyKey ?? idempotencyKey,
      aggregateType: "mission",
      aggregateId: missionId,
      aggregateRevision: null,
      visibilityScope: { kind: "shelter", shelterId: "shelter-a" },
      typedPayload: overrides.typedPayload ?? typedPayload,
    },
  };
}

function assertNoDispatchEffect(store: PersistenceStore, idempotencyKey: string): void {
  const soldier = store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
  assert.equal(soldier?.state, "AT_SHELTER");
  assert.equal(soldier?.revision, 0);
  assert.equal(store.listMissions(WORLD_ID).length, 0);
  assert.equal(store.listMissionAttempts(WORLD_ID).length, 0);
  assert.equal(store.events(WORLD_ID).length, 0);
  assert.equal(store.idempotency(WORLD_ID, idempotencyKey), null);
}

test("mission dispatch persistence binds command, retry, and payload identity before mutation", () => {
  const cases: ReadonlyArray<{
    readonly name: string;
    readonly input: () => CommitMissionDispatchInput;
  }> = [
    { name: "empty command identity", input: () => dispatchInput({ commandId: "" }) },
    {
      name: "collapsed command and retry identity",
      input: () => dispatchInput({
        commandId: "same-dispatch-identity",
        idempotencyKey: "same-dispatch-identity",
      }),
    },
    {
      name: "forged event causation",
      input: () => dispatchInput({ eventCausationId: "different-command" }),
    },
    {
      name: "forged fingerprint command identity",
      input: () => dispatchInput({ requestCommandId: "different-command" }),
    },
    {
      name: "forged event retry identity",
      input: () => dispatchInput({ eventIdempotencyKey: "different-retry-key" }),
    },
    {
      name: "forged event payload",
      input: () => dispatchInput({ typedPayload: { phase: "TRAVELLING", targetId: "node-rock-a" } }),
    },
  ];

  for (const scenario of cases) {
    const harness = openStore();
    try {
      const input = scenario.input();
      assert.throws(
        () => harness.store.commitMissionDispatch(input),
        (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
        scenario.name,
      );
      assertNoDispatchEffect(harness.store, input.idempotency.key);
    } finally {
      closeStore(harness);
    }
  }
});

test("a valid mission dispatch persists the exact command and retry identities", () => {
  const harness = openStore();
  try {
    const input = dispatchInput();
    const result = harness.store.commitMissionDispatch(input);
    assert.equal(result.effect, "mission_dispatched");
    const event = harness.store.events(WORLD_ID)[0];
    assert.equal(event?.causationId, input.commandId);
    assert.equal(event?.idempotencyKey, input.idempotency.key);
  } finally {
    closeStore(harness);
  }
});

function rejectedIdempotency(key: string, overrides: Partial<IdempotencyInput> = {}): IdempotencyInput {
  return {
    key,
    binding: "binding-a",
    request: missionRequest({ commandId: `command-${key}` }),
    ...overrides,
  };
}

test("an existing rejection is durable only when its complete identity and error match", () => {
  const exact = openStore();
  try {
    const idempotency = rejectedIdempotency("rejection-exact");
    exact.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION"));
    assert.doesNotThrow(() => {
      exact.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION"));
    });
    assert.throws(
      () => exact.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("TARGET_UNAVAILABLE")),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
  } finally {
    closeStore(exact);
  }

  for (const scenario of [
    {
      name: "changed request",
      mutate: (value: IdempotencyInput): IdempotencyInput => ({ ...value, request: { ...value.request as object, targetId: "node-rock-a" } }),
    },
    {
      name: "changed binding",
      mutate: (value: IdempotencyInput): IdempotencyInput => ({ ...value, binding: "binding-b" }),
    },
  ]) {
    const harness = openStore();
    try {
      const original = rejectedIdempotency(`rejection-${scenario.name.replace(" ", "-")}`);
      harness.store.recordRejectedIdempotency(WORLD_ID, original, new PersistenceError("STALE_REVISION"));
      assert.throws(
        () => harness.store.recordRejectedIdempotency(
          WORLD_ID,
          scenario.mutate(original),
          new PersistenceError("STALE_REVISION"),
        ),
        (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
        scenario.name,
      );
    } finally {
      closeStore(harness);
    }
  }

  const contractMismatch = openStore();
  try {
    const idempotency = rejectedIdempotency("rejection-contract-mismatch");
    contractMismatch.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION"));
    const database = new DatabaseSync(contractMismatch.store.databasePath);
    database.prepare("UPDATE idempotency_record SET contract_version = 'SK-MVP-legacy' WHERE world_id = ? AND idempotency_key = ?")
      .run(WORLD_ID, idempotency.key);
    database.close();
    assert.throws(
      () => contractMismatch.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION")),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
  } finally {
    closeStore(contractMismatch);
  }

  const corrupt = openStore();
  try {
    const idempotency = rejectedIdempotency("rejection-corrupt-result");
    corrupt.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION"));
    const database = new DatabaseSync(corrupt.store.databasePath);
    database.prepare("UPDATE idempotency_record SET result_json = '{}' WHERE world_id = ? AND idempotency_key = ?")
      .run(WORLD_ID, idempotency.key);
    database.close();
    assert.throws(
      () => corrupt.store.recordRejectedIdempotency(WORLD_ID, idempotency, new PersistenceError("STALE_REVISION")),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
  } finally {
    closeStore(corrupt);
  }

  const committed = openStore();
  try {
    const input = dispatchInput({
      commandId: "command-rejection-after-commit",
      idempotencyKey: "rejection-after-commit",
    });
    committed.store.commitMissionDispatch(input);
    assert.throws(
      () => committed.store.recordRejectedIdempotency(
        WORLD_ID,
        input.idempotency,
        new PersistenceError("STALE_REVISION"),
      ),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
  } finally {
    closeStore(committed);
  }
});

function gathererInput(overrides: Partial<AssignSoldierMissionInput> = {}): AssignSoldierMissionInput {
  const idempotencyKey = overrides.idempotencyKey ?? "foreign-target-replay";
  return {
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    commandId: overrides.commandId ?? `command-${idempotencyKey}`,
    soldierId: "soldier-a-01",
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId: "node-wood-b",
    expectedSoldierRevision: 0,
    returnPolicy: "WHEN_FULL",
    idempotencyKey,
    ...overrides,
  };
}

test("foreign gatherer target privacy is stored and replayed as TARGET_UNAVAILABLE", () => {
  const harness = openStore();
  try {
    const service = new MissionService({ store: harness.store });
    const input = gathererInput();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      assert.throws(
        () => service.assignSoldierMission(input),
        (error: unknown) => error instanceof PersistenceError && error.code === "TARGET_UNAVAILABLE",
      );
    }
    assert.deepEqual(harness.store.idempotency(WORLD_ID, input.idempotencyKey)?.result, {
      errorCode: "TARGET_UNAVAILABLE",
    });
    const soldier = harness.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === input.soldierId);
    assert.equal(soldier?.state, "AT_SHELTER");
    assert.equal(soldier?.revision, 0);
    assert.equal(harness.store.listMissions(WORLD_ID).length, 0);
    assert.equal(harness.store.listMissionAttempts(WORLD_ID).length, 0);
    assert.equal(harness.store.events(WORLD_ID).length, 0);
  } finally {
    closeStore(harness);
  }
});

test("foreign soldier ownership remains stored and replayed as OWNERSHIP_DENIED", () => {
  const harness = openStore();
  try {
    const service = new MissionService({ store: harness.store });
    const input = gathererInput({
      soldierId: "soldier-b-01",
      targetId: "node-wood-a",
      idempotencyKey: "foreign-soldier-replay",
      commandId: "command-foreign-soldier-replay",
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      assert.throws(
        () => service.assignSoldierMission(input),
        (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
      );
    }
    assert.deepEqual(harness.store.idempotency(WORLD_ID, input.idempotencyKey)?.result, {
      errorCode: "OWNERSHIP_DENIED",
    });
    assert.equal(harness.store.listMissions(WORLD_ID).length, 0);
    assert.equal(harness.store.events(WORLD_ID).length, 0);
  } finally {
    closeStore(harness);
  }
});

test("a pre-commandId mission fingerprint fails closed under the unchanged retry key", () => {
  const harness = openStore();
  try {
    const service = new MissionService({ store: harness.store });
    const input = gathererInput({
      targetId: "node-wood-a",
      idempotencyKey: "legacy-dispatch-key",
      commandId: "new-command-for-legacy-key",
    });
    const legacyRequest = missionRequest({ commandId: input.commandId });
    delete legacyRequest.commandId;
    harness.store.recordRejectedIdempotency(WORLD_ID, {
      key: input.idempotencyKey,
      binding: input.binding,
      request: legacyRequest,
    }, new PersistenceError("STALE_REVISION"));

    assert.throws(
      () => service.assignSoldierMission(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    assert.equal(harness.store.listMissions(WORLD_ID).length, 0);
    assert.equal(harness.store.events(WORLD_ID).length, 0);
  } finally {
    closeStore(harness);
  }
});
