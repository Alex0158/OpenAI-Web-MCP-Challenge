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

async function startRuntime(dbPath: string, expectCookie = true): Promise<Runtime> {
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
  const bootstrap = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`, {
    ...(expectCookie ? {} : { headers: { cookie: `${LOCAL_FIXTURE_COOKIE_NAME}=fixture-v1-alpha` } }),
  });
  assert.equal(bootstrap.status, 200);
  const issuedCookie = bootstrap.headers.get("set-cookie")?.split(";", 1)[0] ?? null;
  const cookieA = issuedCookie ?? `${LOCAL_FIXTURE_COOKIE_NAME}=fixture-v1-alpha`;
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
  assert.equal(response.status, 200, `${tool} should be accepted after restart`);
  return await response.json() as Record<string, unknown>;
}

test("pending causal delivery and page recall survive an entrypoint restart", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp16-restart-recall-");
  let first: Runtime | undefined;
  let second: Runtime | undefined;
  try {
    first = await startRuntime(dbPath);
    const gateway = first.worker.gateway;
    assert.ok(gateway);
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
      commandId: "cp16-restart-recall-dispatch",
      idempotencyKey: "cp16-restart-recall-dispatch-idempotency",
    });

    first.worker.advance(15_000);
    const encounter = first.store.listEncounters(WORLD_ID)[0];
    assert.ok(encounter);
    const database = new DatabaseSync(first.store.databasePath);
    database.prepare("UPDATE encounter SET engagement_x = 50, engagement_y = 64 WHERE world_id = ? AND encounter_id = ?")
      .run(WORLD_ID, encounter.encounterId);
    database.close();
    first.worker.advance(9_000);

    const beforeRestartWorld = first.store.getWorld(WORLD_ID);
    const beforeRestartEvents = first.store.events(WORLD_ID);
    const loss = beforeRestartEvents.find((event) => event.eventType === "CargoLostToMonster");
    const reissue = beforeRestartEvents.find((event) => event.eventType === "MissionReissued");
    const beforeRestartMission = first.store.getMission(WORLD_ID, dispatched.missionId);
    const beforeRestartSlot = first.store.signalSlot(WORLD_ID, "shelter-a", BINDING_A);
    assert.equal(beforeRestartWorld?.worldTime, 24);
    assert.ok(loss);
    assert.ok(reissue);
    assert.equal((reissue.typedPayload as { outcome?: unknown }).outcome, "REISSUED");
    assert.equal(beforeRestartMission?.phase, "TRAVELLING");
    assert.ok(beforeRestartMission?.activeAttemptId);
    assert.ok(beforeRestartSlot);
    assert.equal(beforeRestartSlot.status, "pending");
    assert.equal(first.store.outboxDelivery(WORLD_ID, beforeRestartSlot.signalId)?.status, "pending");
    const eventCountBeforeRestart = beforeRestartEvents.length;
    const signalId = beforeRestartSlot.signalId;
    const activeAttemptId = beforeRestartMission.activeAttemptId;

    await first.entrypoint.shutdown("test");
    first = undefined;

    second = await startRuntime(dbPath, false);
    const afterRestartWorld = second.store.getWorld(WORLD_ID);
    const afterRestartEvents = second.store.events(WORLD_ID);
    assert.equal(afterRestartWorld?.worldTime, beforeRestartWorld?.worldTime);
    assert.equal(afterRestartWorld?.worldEventCursor, beforeRestartWorld?.worldEventCursor);
    assert.equal(afterRestartEvents.length, eventCountBeforeRestart);
    assert.equal(afterRestartEvents.filter((event) => event.eventType === "CargoLostToMonster").length, 1);
    assert.equal(afterRestartEvents.filter((event) => event.eventType === "MissionReissued").length, 1);
    assert.equal(second.store.signalSlot(WORLD_ID, "shelter-a", BINDING_A)?.signalId, signalId);
    assert.equal(second.store.signalSlot(WORLD_ID, "shelter-a", BINDING_A)?.status, "pending");
    assert.deepEqual(second.store.getMission(WORLD_ID, dispatched.missionId), beforeRestartMission);
    assert.equal(second.store.getMission(WORLD_ID, dispatched.missionId)?.activeAttemptId, activeAttemptId);

    const envelopes: ReentrySignalEnvelope[] = [];
    const port = new ReentryDeliveryPort({
      store: second.store,
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
      leaseId: "cp16-restart-recall-lease-1",
    });
    assert.equal(delivered.kind, "accepted");
    assert.equal(envelopes.length, 1);
    assert.equal(envelopes[0]?.signalId, signalId);
    assert.equal(envelopes[0]?.latestEventId, loss.eventId);
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    assert.equal(second.store.getWorld(WORLD_ID)?.worldTime, 24);

    const shelterRead = await executePageTool(second.base, second.cookieA, "inspect_shelter_state", {});
    assert.deepEqual(shelterRead.scope, { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" });
    const continuation = shelterRead.continuation as {
      signal_id: string;
      status: string;
      bounded_action: string;
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
    assert.equal(continuation.bounded_action, "force_recall_soldier");
    assert.ok(continuation.cursor_start <= loss.worldEventCursor);
    assert.ok(loss.worldEventCursor <= continuation.cursor_end);
    assert.equal(continuation.eligible_event_count, 1);
    assert.deepEqual(continuation.event_types, ["CargoLostToMonster"]);
    assert.equal(continuation.latest_event_id, loss.eventId);
    assert.equal(continuation.latest_event_type, "CargoLostToMonster");
    assert.equal(continuation.latest_world_time, 24);
    const missionRead = await executePageTool(second.base, second.cookieA, "inspect_missions", {});
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
    const historyRead = await executePageTool(second.base, second.cookieA, "inspect_mission_history", { limit: 50 });
    const historyEvents = (historyRead.history as { events: Array<{ event_id: string; event_type: string }> }).events;
    assert.ok(historyEvents.some((event) => event.event_id === loss.eventId && event.event_type === "CargoLostToMonster"));
    assert.ok(historyEvents.some((event) => event.event_id === reissue.eventId && event.event_type === "MissionReissued"));

    const recallBody = {
      command_id: "cp16-restart-recall-command",
      idempotency_key: "cp16-restart-recall-idempotency",
      soldier_id: current.soldier_id,
      mission_id: current.mission_id,
      mission_attempt_id: current.mission_attempt_id,
      expected_entity_revisions: current.revisions,
      signal_id: signalId,
      causal_event_id: loss.eventId,
    };
    const recalled = await executePageTool(second.base, second.cookieA, "force_recall_soldier", recallBody);
    assert.equal(recalled.status, "committed");
    assert.equal(recalled.phase, "RETURNING");
    const duplicate = await executePageTool(second.base, second.cookieA, "force_recall_soldier", recallBody);
    assert.equal(duplicate.status, "committed");
    assert.equal(duplicate.duplicate, true);
    assert.equal(second.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, 1);
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "MissionReissued").length, 1);
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);

    const betaCookie = `${LOCAL_FIXTURE_COOKIE_NAME}=${LOCAL_FIXTURE_HANDLE_B}`;
    const beta = await executePageTool(second.base, betaCookie, "inspect_shelter_state", {});
    assert.deepEqual(beta.scope, { world_id: WORLD_ID, player_id: "player-b", shelter_id: "shelter-b" });
    assert.equal(beta.continuation, null);
    const betaHistory = await executePageTool(second.base, betaCookie, "inspect_mission_history", { limit: 50 });
    const betaEvents = (betaHistory.history as { events: Array<{ event_type: string }> }).events;
    assert.equal(betaEvents.some((event) => event.event_type === "CargoLostToMonster"), false);
  } finally {
    if (first) {
      await first.entrypoint.shutdown("test");
    }
    if (second) {
      await second.entrypoint.shutdown("test");
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
