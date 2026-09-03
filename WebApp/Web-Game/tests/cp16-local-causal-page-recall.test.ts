import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import {
  LOCAL_FIXTURE_COOKIE_NAME,
  LOCAL_FIXTURE_HANDLE_B,
} from "../src/server/fixture-session";
import { PersistenceStore, createPersistenceStore } from "../src/server/persistence/store";
import {
  ReentryDeliveryPort,
  type ReentrySignalEnvelope,
} from "../src/server/reentry-delivery-port";
import { WorldWorkerModule } from "../src/server/world-worker";
import { PAGE_TOOLS_EXECUTE_PATH } from "../src/shared/page-tool-contract";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "sleepless-mvp-01" as const;
const BINDING_A = "fixture-binding-a" as const;
const BINDING_B = "fixture-binding-b" as const;

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

function pageRequest(tool: string, input: unknown): { tool: string; input: unknown } {
  return { tool, input };
}

async function executePageTool(base: string, cookie: string, tool: string, input: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(pageRequest(tool, input)),
  });
  assert.equal(response.status, 200, `${tool} should be accepted by the canonical page boundary`);
  return await response.json() as Record<string, unknown>;
}

function storeFrom(worker: WorldWorkerModule): PersistenceStore {
  assert.ok(worker.persistence instanceof PersistenceStore);
  return worker.persistence;
}

test("real loss and reissue compose through local delivery, page reread, and provenance-bound recall", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp16-page-recall-");
  let runtimeWorker: WorldWorkerModule | undefined;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      const worker = new WorldWorkerModule({
        store: options?.store,
        signalEligibilityProvider: options?.signalEligibilityProvider,
      });
      runtimeWorker = worker;
      return worker;
    },
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const bootstrap = await fetch(`${base}/api/local-fixture/bootstrap`);
    assert.equal(bootstrap.status, 200);
    const cookieA = bootstrap.headers.get("set-cookie")?.split(";", 1)[0];
    assert.equal(cookieA, `${LOCAL_FIXTURE_COOKIE_NAME}=fixture-v1-alpha`);
    const cookieB = `${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_B}`;

    const worker = runtimeWorker;
    assert.ok(worker?.gateway);
    const store = storeFrom(worker);
    const gateway = worker.gateway;

    const dispatched = await gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: BINDING_A,
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: 0,
      commandId: "cp16-page-recall-dispatch",
      idempotencyKey: "cp16-page-recall-dispatch-idempotency",
    });

    worker.advance(15_000);
    const encounter = store.listEncounters(WORLD_ID)[0];
    assert.ok(encounter);
    // Keep the documented fixture encounter, but move its engagement cell to
    // the verified safe-reissue branch before the real terminal round.
    const database = new DatabaseSync(store.databasePath);
    database.prepare("UPDATE encounter SET engagement_x = 50, engagement_y = 64 WHERE world_id = ? AND encounter_id = ?")
      .run(WORLD_ID, encounter.encounterId);
    database.close();
    worker.advance(9_000);

    const beforeDeliveryWorld = store.getWorld(WORLD_ID);
    const loss = store.events(WORLD_ID).find((event) => event.eventType === "CargoLostToMonster");
    const reissue = store.events(WORLD_ID).find((event) => event.eventType === "MissionReissued");
    assert.ok(loss);
    assert.ok(reissue);
    assert.equal(beforeDeliveryWorld?.worldTime, 24);
    assert.equal((reissue.typedPayload as { outcome?: unknown }).outcome, "REISSUED");

    const activeMission = store.getMission(WORLD_ID, dispatched.missionId);
    assert.ok(activeMission?.activeAttemptId);
    assert.equal(activeMission.phase, "TRAVELLING");
    const activeAttempt = store.getMissionAttempt(WORLD_ID, activeMission.activeAttemptId);
    const activeSoldier = store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01");
    assert.ok(activeAttempt);
    assert.ok(activeSoldier);
    assert.equal(activeSoldier.state, "FIELD");

    const beforeDelivery = {
      shelter: store.getShelter(WORLD_ID, "shelter-a"),
      soldier: activeSoldier,
      mission: activeMission,
      attempt: activeAttempt,
      cargo: store.listCargo(WORLD_ID),
      cargoLosses: store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length,
    };
    const envelopes: ReentrySignalEnvelope[] = [];
    const port = new ReentryDeliveryPort({
      store,
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
      nowWallTimeMs: 1_000,
      leaseId: "cp16-page-recall-lease-1",
    });
    assert.equal(delivered.kind, "accepted");
    assert.equal(envelopes.length, 1);
    const envelope = envelopes[0];
    assert.ok(envelope);
    assert.equal(envelope.worldId, WORLD_ID);
    assert.equal(envelope.shelterId, "shelter-a");
    assert.equal(envelope.opaqueBinding, BINDING_A);
    assert.equal(envelope.boundedAction, "force_recall_soldier");
    assert.equal(envelope.latestEventId, loss.eventId);
    assert.equal(envelope.latestEventType, "CargoLostToMonster");
    assert.equal(envelope.latestWorldTime, 24);

    const afterDeliveryWorld = store.getWorld(WORLD_ID);
    assert.equal(afterDeliveryWorld?.worldTime, beforeDeliveryWorld?.worldTime);
    assert.equal(afterDeliveryWorld?.worldEventCursor, (beforeDeliveryWorld?.worldEventCursor ?? 0) + 1);
    assert.deepEqual(store.getShelter(WORLD_ID, "shelter-a"), beforeDelivery.shelter);
    assert.deepEqual(store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01"), beforeDelivery.soldier);
    assert.deepEqual(store.getMission(WORLD_ID, dispatched.missionId), beforeDelivery.mission);
    assert.deepEqual(store.getMissionAttempt(WORLD_ID, activeAttempt.missionAttemptId), beforeDelivery.attempt);
    assert.deepEqual(store.listCargo(WORLD_ID), beforeDelivery.cargo);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, beforeDelivery.cargoLosses);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);

    const shelterRead = await executePageTool(base, cookieA!, "inspect_shelter_state", {});
    const scope = shelterRead.scope as { world_id: string; player_id: string; shelter_id: string };
    assert.deepEqual(scope, { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" });
    const continuation = shelterRead.continuation as { signal_id: string; status: string; latest_event_id: string };
    assert.equal(continuation.signal_id, envelope.signalId);
    assert.equal(continuation.status, "acknowledged");
    assert.equal(continuation.latest_event_id, loss.eventId);

    const missionRead = await executePageTool(base, cookieA!, "inspect_missions", {});
    const missions = missionRead.missions as Array<{
      soldier_id: string;
      mission_id: string | null;
      mission_attempt_id: string | null;
      phase: string;
      revisions: { soldier: number; mission: number | null; mission_attempt: number | null };
    }>;
    const current = missions.find((mission) => mission.soldier_id === "soldier-a-01");
    assert.ok(current?.mission_id && current.mission_attempt_id);
    assert.equal(current.phase, "TRAVELLING");
    const historyRead = await executePageTool(base, cookieA!, "inspect_mission_history", { limit: 50 });
    const historyEvents = (historyRead.history as { events: Array<{ event_id: string; event_type: string }> }).events;
    assert.ok(historyEvents.some((event) => event.event_id === loss.eventId && event.event_type === "CargoLostToMonster"));
    assert.ok(historyEvents.some((event) => event.event_id === reissue.eventId && event.event_type === "MissionReissued"));

    const recallBody = {
      command_id: "cp16-page-recall-command",
      idempotency_key: "cp16-page-recall-idempotency",
      soldier_id: current.soldier_id,
      mission_id: current.mission_id,
      mission_attempt_id: current.mission_attempt_id,
      expected_entity_revisions: current.revisions,
      signal_id: envelope.signalId,
      causal_event_id: loss.eventId,
    };
    const recalled = await executePageTool(base, cookieA!, "force_recall_soldier", recallBody);
    assert.equal(recalled.status, "committed");
    assert.equal(recalled.effect, "mission_recalled");
    assert.equal(recalled.phase, "RETURNING");
    assert.equal(recalled.full_snapshot_required, true);

    const duplicate = await executePageTool(base, cookieA!, "force_recall_soldier", recallBody);
    assert.equal(duplicate.status, "committed");
    assert.equal(duplicate.duplicate, true);
    assert.equal(store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, 1);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);

    const betaShelterRead = await executePageTool(base, cookieB, "inspect_shelter_state", {});
    assert.deepEqual(betaShelterRead.scope, { world_id: WORLD_ID, player_id: "player-b", shelter_id: "shelter-b" });
    assert.equal(betaShelterRead.continuation, null);
    const betaHistoryRead = await executePageTool(base, cookieB, "inspect_mission_history", { limit: 50 });
    const betaEvents = (betaHistoryRead.history as { events: Array<{ event_type: string }> }).events;
    assert.equal(betaEvents.some((event) => event.event_type === "CargoLostToMonster"), false);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});
