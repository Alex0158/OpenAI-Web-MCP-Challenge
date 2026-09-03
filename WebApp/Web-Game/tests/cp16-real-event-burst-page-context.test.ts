import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint, type Entrypoint } from "../src/server/entrypoint";
import {
  LOCAL_FIXTURE_COOKIE_NAME,
  LOCAL_FIXTURE_HANDLE_B,
} from "../src/server/fixture-session";
import { PersistenceStore } from "../src/server/persistence/store";
import {
  ReentryDeliveryPort,
  type ReentrySignalEnvelope,
} from "../src/server/reentry-delivery-port";
import { WorldWorkerModule } from "../src/server/world-worker";
import { PAGE_TOOLS_EXECUTE_PATH } from "../src/shared/page-tool-contract";

const WORLD_ID = "sleepless-mvp-01" as const;
const BINDING_A = "fixture-binding-a" as const;

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

interface Runtime {
  readonly entrypoint: Entrypoint;
  readonly worker: WorldWorkerModule;
  readonly store: PersistenceStore;
  readonly base: string;
  readonly cookieA: string;
}

async function startRuntime(dbPath: string): Promise<Runtime> {
  let worker: WorldWorkerModule | undefined;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      const created = new WorldWorkerModule({
        store: options?.store,
        signalEligibilityProvider: options?.signalEligibilityProvider,
      });
      worker = created;
      return created;
    },
  });
  await entrypoint.start();
  const address = entrypoint.address();
  assert.ok(address && typeof address === "object");
  assert.ok(worker);
  const bootstrap = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`);
  assert.equal(bootstrap.status, 200);
  const cookieA = bootstrap.headers.get("set-cookie")?.split(";", 1)[0] ?? null;
  assert.equal(cookieA, `${LOCAL_FIXTURE_COOKIE_NAME}=fixture-v1-alpha`);
  assert.ok(worker.persistence instanceof PersistenceStore);
  return {
    entrypoint,
    worker,
    store: worker.persistence,
    base: `http://127.0.0.1:${address.port}`,
    cookieA,
  };
}

async function executePageTool(base: string, cookie: string, tool: string, input: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ tool, input }),
  });
  assert.equal(response.status, 200, `${tool} should be accepted by the canonical page boundary`);
  return await response.json() as Record<string, unknown>;
}

async function readAllMissionHistory(
  base: string,
  cookie: string,
): Promise<Array<{ event_id: string; event_type: string }>> {
  const events: Array<{ event_id: string; event_type: string }> = [];
  let cursor: string | undefined;
  for (let page = 0; page < 4; page += 1) {
    const input = cursor === undefined ? { limit: 50 } : { cursor, limit: 50 };
    const result = await executePageTool(base, cookie, "inspect_mission_history", input);
    const history = result.history as {
      events: Array<{ event_id: string; event_type: string }>;
      next_cursor: string | null;
    };
    events.push(...history.events);
    if (history.next_cursor === null) {
      return events;
    }
    cursor = history.next_cursor;
  }
  throw new Error("history pagination exceeded the bounded local fixture limit");
}

function moveEncounterToSafeReissue(store: PersistenceStore, encounterId: string): void {
  const database = new DatabaseSync(store.databasePath);
  database.prepare("UPDATE encounter SET engagement_x = 50, engagement_y = 64 WHERE world_id = ? AND encounter_id = ?")
    .run(WORLD_ID, encounterId);
  database.close();
}

test("two real losses coalesce into one page-readable signal and recall the latest reissue", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp16-burst-page-context-");
  let runtime: Runtime | undefined;
  try {
    runtime = await startRuntime(dbPath);
    const gateway = runtime.worker.gateway;
    assert.ok(gateway);

    const firstDispatch = await gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: BINDING_A,
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: 0,
      commandId: "cp16-burst-dispatch-a",
      idempotencyKey: "cp16-burst-dispatch-a-idempotency",
    });

    runtime.worker.advance(15_000);
    const firstEncounter = runtime.store.listEncounters(WORLD_ID)[0];
    assert.ok(firstEncounter);
    moveEncounterToSafeReissue(runtime.store, firstEncounter.encounterId);
    runtime.worker.advance(9_000);

    const firstLoss = runtime.store.events(WORLD_ID).find((event) => event.eventType === "CargoLostToMonster");
    const firstReissue = runtime.store.events(WORLD_ID).find((event) => event.eventType === "MissionReissued");
    assert.ok(firstLoss);
    assert.ok(firstReissue);
    assert.equal((firstReissue.typedPayload as { outcome?: unknown }).outcome, "REISSUED");
    const firstSlot = runtime.store.signalSlot(WORLD_ID, "shelter-a", BINDING_A);
    assert.ok(firstSlot);
    const signalId = firstSlot.signalId;
    assert.equal(firstSlot.status, "pending");
    assert.equal(firstSlot.eligibleEventCount, 1);

    const secondDispatch = await gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: BINDING_A,
      soldierId: "soldier-a-02",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: 0,
      commandId: "cp16-burst-dispatch-b",
      idempotencyKey: "cp16-burst-dispatch-b-idempotency",
    });

    // The second soldier reaches the shared fixture node at world time 37.
    // Move only its test encounter cell before the terminal combat boundary so
    // the existing deterministic safe-reissue branch is exercised twice.
    runtime.worker.advance(13_000);
    const secondEncounter = runtime.store.listEncounters(WORLD_ID)
      .find((encounter) => encounter.soldierId === "soldier-a-02" && encounter.state === "RESOLVING");
    assert.ok(secondEncounter);
    moveEncounterToSafeReissue(runtime.store, secondEncounter.encounterId);
    runtime.worker.advance(9_000);

    const events = runtime.store.events(WORLD_ID);
    const losses = events.filter((event) => event.eventType === "CargoLostToMonster");
    const reissues = events.filter((event) => event.eventType === "MissionReissued");
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 46);
    assert.equal(losses.length, 2);
    assert.equal(reissues.length, 2);
    assert.ok(losses[0]);
    assert.ok(losses[1]);
    assert.ok(reissues.every((event) => (event.typedPayload as { outcome?: unknown }).outcome === "REISSUED"));
    assert.ok(losses[0].worldEventCursor < losses[1].worldEventCursor);

    const slot = runtime.store.signalSlot(WORLD_ID, "shelter-a", BINDING_A);
    assert.ok(slot);
    assert.equal(slot.signalId, signalId);
    assert.equal(slot.status, "pending");
    assert.equal(slot.eligibleEventCount, 2);
    assert.ok(slot.cursorStart <= losses[0].worldEventCursor);
    assert.ok(losses[1].worldEventCursor <= slot.cursorEnd);
    assert.deepEqual(slot.eventTypes, ["CargoLostToMonster"]);
    assert.equal(slot.latestEventId, losses[1].eventId);
    assert.equal(slot.latestEventType, "CargoLostToMonster");
    assert.equal(slot.latestWorldTime, 46);
    assert.ok(slot.cursorEnd - slot.cursorStart > 1, "routine events remain inside the page cursor window");
    assert.ok(events.some((event) => event.eventType === "BattleRoundResolved"));
    assert.equal(runtime.store.outboxDelivery(WORLD_ID, signalId)?.status, "pending");

    const envelopes: ReentrySignalEnvelope[] = [];
    const port = new ReentryDeliveryPort({
      store: runtime.store,
      leaseDurationMs: 30_000,
      transport: {
        async deliver(envelope) {
          envelopes.push(envelope);
          return { kind: "accepted" as const };
        },
      },
    });
    const delivered = await port.pumpOnce({
      worldId: WORLD_ID,
      nowWallTimeMs: 2_000,
      leaseId: "cp16-burst-page-context-lease-1",
    });
    assert.equal(delivered.kind, "accepted");
    assert.equal(envelopes.length, 1);
    assert.equal(envelopes[0]?.signalId, signalId);
    assert.equal(envelopes[0]?.eligibleEventCount, 2);
    assert.ok((envelopes[0]?.cursorStart ?? Number.POSITIVE_INFINITY) <= losses[0].worldEventCursor);
    assert.ok(losses[1].worldEventCursor <= (envelopes[0]?.cursorEnd ?? Number.NEGATIVE_INFINITY));
    assert.equal(envelopes[0]?.latestEventId, losses[1].eventId);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);

    const shelterRead = await executePageTool(runtime.base, runtime.cookieA, "inspect_shelter_state", {});
    assert.deepEqual(shelterRead.scope, { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" });
    const continuation = shelterRead.continuation as {
      signal_id: string;
      status: string;
      cursor_start: number;
      cursor_end: number;
      eligible_event_count: number;
      event_types: string[];
      latest_event_id: string;
      latest_event_type: string;
      latest_world_time: number;
    };
    assert.equal(continuation.signal_id, signalId);
    assert.equal(continuation.status, "acknowledged");
    assert.ok(continuation.cursor_start <= losses[0].worldEventCursor);
    assert.ok(losses[1].worldEventCursor <= continuation.cursor_end);
    assert.equal(continuation.eligible_event_count, 2);
    assert.deepEqual(continuation.event_types, ["CargoLostToMonster"]);
    assert.equal(continuation.latest_event_id, losses[1].eventId);
    assert.equal(continuation.latest_event_type, "CargoLostToMonster");
    assert.equal(continuation.latest_world_time, 46);

    const historyEvents = await readAllMissionHistory(runtime.base, runtime.cookieA);
    assert.ok(historyEvents.some((event) => event.event_id === losses[0].eventId && event.event_type === "CargoLostToMonster"));
    assert.ok(historyEvents.some((event) => event.event_id === losses[1].eventId && event.event_type === "CargoLostToMonster"));
    assert.ok(historyEvents.some((event) => event.event_id === reissues[0].eventId && event.event_type === "MissionReissued"));
    assert.ok(historyEvents.some((event) => event.event_id === reissues[1].eventId && event.event_type === "MissionReissued"));

    const missionRead = await executePageTool(runtime.base, runtime.cookieA, "inspect_missions", {});
    const missions = missionRead.missions as Array<{
      soldier_id: string;
      mission_id: string | null;
      mission_attempt_id: string | null;
      phase: string;
      revisions: { soldier: number; mission: number | null; mission_attempt: number | null };
    }>;
    const latest = missions.find((mission) => mission.soldier_id === "soldier-a-02");
    assert.ok(latest?.mission_id && latest.mission_attempt_id);
    assert.equal(latest.phase, "TRAVELLING");

    const recallBody = {
      command_id: "cp16-burst-page-context-recall",
      idempotency_key: "cp16-burst-page-context-recall-idempotency",
      soldier_id: latest.soldier_id,
      mission_id: latest.mission_id,
      mission_attempt_id: latest.mission_attempt_id,
      expected_entity_revisions: latest.revisions,
      signal_id: signalId,
      causal_event_id: losses[1].eventId,
    };
    const recalled = await executePageTool(runtime.base, runtime.cookieA, "force_recall_soldier", recallBody);
    assert.equal(recalled.status, "committed");
    assert.equal(recalled.phase, "RETURNING");
    const duplicate = await executePageTool(runtime.base, runtime.cookieA, "force_recall_soldier", recallBody);
    assert.equal(duplicate.status, "committed");
    assert.equal(duplicate.duplicate, true);
    assert.equal(runtime.store.getMission(WORLD_ID, secondDispatch.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, 2);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionReissued").length, 2);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);

    const betaCookie = `${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_B}`;
    const beta = await executePageTool(runtime.base, betaCookie, "inspect_shelter_state", {});
    assert.deepEqual(beta.scope, { world_id: WORLD_ID, player_id: "player-b", shelter_id: "shelter-b" });
    assert.equal(beta.continuation, null);
    const betaEvents = await readAllMissionHistory(runtime.base, betaCookie);
    assert.equal(betaEvents.some((event) => event.event_type === "CargoLostToMonster"), false);
  } finally {
    if (runtime) {
      await runtime.entrypoint.shutdown("test");
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
