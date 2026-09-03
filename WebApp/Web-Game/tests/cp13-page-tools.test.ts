import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import { LOCAL_FIXTURE_COOKIE_NAME } from "../src/server/fixture-session";
import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { WorldWorkerModule, type WorldWorkerOptions } from "../src/server/world-worker";
import {
  PAGE_TOOL_INPUT_SCHEMAS,
  PAGE_TOOLS_MAX_BODY_BYTES,
  PAGE_TOOLS_EXECUTE_PATH,
  parsePageToolExecutionRequest,
} from "../src/shared/page-tool-contract";
import { createWebMcpPageToolRegistrar } from "../src/client/webmcp-page-tools";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp13-page-tools-world" as const;

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

function openRuntime(options: Pick<WorldWorkerOptions, "signalEligibilityProvider"> = {}) {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp13-page-tools-");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seed.close();
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store, worldId: WORLD_ID, ...options });
  return { directory, store, worker };
}

function grantFor(context: { worldId: string; shelterId: string; soldierId: string }) {
  if (context.worldId !== WORLD_ID || context.shelterId !== "shelter-a") {
    return undefined;
  }
  return {
    shelterId: context.shelterId,
    opaqueBinding: "binding-a",
    grantId: "cp13-page-grant-v1",
    boundedAction: "force_recall_soldier",
    severity: "warning" as const,
    cooldownWorldSeconds: 60,
  };
}

async function closeRuntime(runtime: { directory: string; worker: WorldWorkerModule }): Promise<void> {
  await runtime.worker.stop();
  rmSync(runtime.directory, { recursive: true, force: true });
}

function pageRequest(tool: string, input: unknown): { tool: string; input: unknown } {
  return { tool, input };
}

function reorderSchemaKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reorderSchemaKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .reverse()
        .map(([key, child]) => [key, reorderSchemaKeys(child)]),
    );
  }
  return value;
}

test("page tool request parser freezes read, history, and signal-bound recall inputs", () => {
  assert.deepEqual(parsePageToolExecutionRequest(pageRequest("inspect_shelter_state", {})), {
    tool: "inspect_shelter_state",
    input: {},
  });
  assert.deepEqual(parsePageToolExecutionRequest(pageRequest("inspect_mission_history", { limit: 2 })), {
    tool: "inspect_mission_history",
    input: { limit: 2 },
  });
  const recall = {
    command_id: "page-recall-command:1",
    idempotency_key: "page-recall-idempotency:1",
    soldier_id: "soldier-a-01",
    mission_id: "mission-a-01",
    mission_attempt_id: "attempt-a-01",
    expected_entity_revisions: { soldier: 1, mission: 0, mission_attempt: 0 },
    signal_id: "signal-1",
    causal_event_id: "cargo-lost-1",
  };
  assert.deepEqual(parsePageToolExecutionRequest(pageRequest("force_recall_soldier", recall)), {
    tool: "force_recall_soldier",
    input: recall,
  });
  assert.throws(() => parsePageToolExecutionRequest(pageRequest("inspect_shelter_state", { player_id: "player-b" })), /PAGE_TOOL_INPUT_INVALID/);
  assert.throws(() => parsePageToolExecutionRequest(pageRequest("inspect_mission_history", { limit: 51 })), /PAGE_TOOL_INPUT_INVALID/);
  assert.throws(() => parsePageToolExecutionRequest(pageRequest("force_recall_soldier", { ...recall, signal_id: "" })), /PAGE_TOOL_INPUT_INVALID/);
  assert.equal((PAGE_TOOL_INPUT_SCHEMAS.force_recall_soldier.required as string[]).includes("signal_id"), true);
  assert.equal(PAGE_TOOL_INPUT_SCHEMAS.inspect_missions.additionalProperties, false);
});

test("gateway page reads use server scope, fixed summaries, and scope-bound history cursors", async () => {
  const runtime = openRuntime();
  await runtime.worker.start();
  try {
    const gateway = runtime.worker.gateway;
    assert.ok(gateway);
    const shelter = await gateway.inspectShelterState({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      requestId: "page-request-shelter",
    });
    assert.equal(shelter.shelter.resident_soldier_count, 5);
    assert.deepEqual(shelter.sensed_resources, { wood: 1, rock: 1 });
    assert.equal(shelter.continuation, null);

    const snapshot = await gateway.inspectClientSnapshot({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      requestId: "page-request-snapshot",
    });
    assert.equal(snapshot.snapshot.snapshot_version, "agent_snapshot_v1");
    assert.equal(JSON.stringify(snapshot).includes("exploredCells"), false);
    assert.equal(JSON.stringify(snapshot).includes("blockedCells"), false);
    assert.equal(snapshot.snapshot.counts.missions, 5);

    const missions = await gateway.inspectMissions({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      requestId: "page-request-missions",
    });
    assert.equal(missions.missions.length, 5);
    assert.equal(missions.missions[0]?.phase, "AT_SHELTER");
    assert.equal(JSON.stringify(missions).includes("waypoints"), false);

    await gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "AXE",
      equipmentTier: 1,
      targetId: "node-wood-a",
      expectedSoldierRevision: 0,
      commandId: "page-dispatch-command",
      idempotencyKey: "page-dispatch-idempotency",
    });
    await gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      soldierId: "soldier-a-02",
      role: "GATHERER",
      tool: "AXE",
      equipmentTier: 1,
      targetId: "node-wood-a",
      expectedSoldierRevision: 0,
      commandId: "page-dispatch-command-2",
      idempotencyKey: "page-dispatch-idempotency-2",
    });
    const first = await gateway.inspectMissionHistory({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      requestId: "page-request-history-1",
      limit: 1,
    });
    assert.equal(first.history.events.length, 1);
    assert.ok(first.history.next_cursor);
    assert.equal(first.history.events[0]?.event_type, "MissionDispatched");
    const second = await gateway.inspectMissionHistory({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      requestId: "page-request-history-2",
      cursor: first.history.next_cursor ?? undefined,
      limit: 1,
    });
    assert.equal(second.history.events.length, 1);
    assert.equal(second.history.events[0]?.event_type, "MissionDispatched");
    assert.equal(second.history.next_cursor, null);
    await assert.rejects(
      gateway.inspectMissionHistory({
        worldId: WORLD_ID,
        playerId: "player-b",
        binding: "binding-b",
        requestId: "page-request-history-foreign",
        cursor: first.history.next_cursor ?? undefined,
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
  } finally {
    await closeRuntime(runtime);
  }
});

test("page HTTP transport derives the cookie scope and exposes a durable continuation-bound recall", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp13-page-http-");
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
    const noSession = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    assert.equal(noSession.status, 401);
    assert.deepEqual(await noSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_REQUIRED" });

    const bootstrap = await fetch(`${base}/api/local-fixture/bootstrap`);
    assert.equal(bootstrap.status, 200);
    const cookie = bootstrap.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    const queryIdentity = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}?player_id=player-b`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    assert.equal(queryIdentity.status, 400);
    assert.deepEqual(await queryIdentity.json(), { error_code: "PAGE_TOOL_INPUT_INVALID" });
    const unsupportedMedia = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "text/plain" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    assert.equal(unsupportedMedia.status, 415);
    assert.deepEqual(await unsupportedMedia.json(), { error_code: "PAGE_TOOL_UNSUPPORTED_MEDIA_TYPE" });
    const oversized = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: "x".repeat(PAGE_TOOLS_MAX_BODY_BYTES + 1),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), { error_code: "PAGE_TOOL_PAYLOAD_TOO_LARGE" });
    const unknownInput = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", { player_id: "player-b" })),
    });
    assert.equal(unknownInput.status, 400);
    assert.deepEqual(await unknownInput.json(), { error_code: "PAGE_TOOL_INPUT_INVALID" });
    const read = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    assert.equal(read.status, 200);
    assert.equal(read.headers.get("cache-control"), "no-store");
    const initial = await read.json() as { continuation: unknown; scope: { player_id: string } };
    assert.equal(initial.scope.player_id, "player-a");
    assert.equal(initial.continuation, null);

    assert.ok(runtimeWorker?.gateway);
    await runtimeWorker.gateway.assignSoldierMission({
      worldId: "sleepless-mvp-01",
      playerId: "player-a",
      binding: "fixture-binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: 0,
      commandId: "page-http-rock-command",
      idempotencyKey: "page-http-rock-idempotency",
    });
    runtimeWorker?.advance(24_000);
    const loss = runtimeWorker
      ? (runtimeWorker.persistence as ReturnType<typeof createPersistenceStore>).events("sleepless-mvp-01").find((event) => event.eventType === "CargoLostToMonster")
      : undefined;
    assert.ok(loss);
    const soldier = (runtimeWorker.persistence as ReturnType<typeof createPersistenceStore>).listSoldiers("sleepless-mvp-01").find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.ok(soldier);
    await runtimeWorker.gateway.assignSoldierMission({
      worldId: "sleepless-mvp-01",
      playerId: "player-a",
      binding: "fixture-binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "AXE",
      equipmentTier: 1,
      targetId: "node-wood-a",
      expectedSoldierRevision: soldier.revision,
      commandId: "page-http-wood-command",
      idempotencyKey: "page-http-wood-idempotency",
    });

    const continuationResponse = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    const continuation = await continuationResponse.json() as {
      continuation: { signal_id: string };
    };
    assert.ok(continuation.continuation.signal_id);
    const missionResponse = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_missions", {})),
    });
    const missionPayload = await missionResponse.json() as {
      missions: Array<{
        soldier_id: string;
        mission_id: string | null;
        mission_attempt_id: string | null;
        phase: string;
        revisions: { soldier: number; mission: number | null; mission_attempt: number | null };
      }>;
    };
    const active = missionPayload.missions.find((mission) => mission.soldier_id === "soldier-a-01");
    assert.ok(active?.mission_id && active.mission_attempt_id);
    assert.equal(active.phase, "TRAVELLING");
    const recallBody = pageRequest("force_recall_soldier", {
      command_id: "page-http-recall-command",
      idempotency_key: "page-http-recall-idempotency",
      soldier_id: "soldier-a-01",
      mission_id: active.mission_id,
      mission_attempt_id: active.mission_attempt_id,
      expected_entity_revisions: {
        soldier: active.revisions.soldier,
        mission: active.revisions.mission,
        mission_attempt: active.revisions.mission_attempt,
      },
      signal_id: continuation.continuation.signal_id,
      causal_event_id: loss.eventId,
    });
    const recalled = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(recallBody),
    });
    assert.equal(recalled.status, 200);
    const recalledPayload = await recalled.json() as { status: string; effect: string; phase: string; full_snapshot_required: boolean };
    assert.equal(recalledPayload.status, "committed");
    assert.equal(recalledPayload.effect, "mission_recalled");
    assert.equal(recalledPayload.phase, "RETURNING");
    assert.equal(recalledPayload.full_snapshot_required, true);
    const duplicate = await fetch(`${base}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(recallBody),
    });
    assert.equal(duplicate.status, 200);
    assert.equal((await duplicate.json() as { duplicate: boolean }).duplicate, true);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("page registrar keeps unsupported browsers usable and dynamically gates recall on a continuation", async () => {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const registered = new Map<string, { inputSchema: Record<string, unknown>; execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown> }>();
  const modelContext = {
    async registerTool(tool: { name: string; inputSchema: Record<string, unknown>; execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown> }, options?: { signal?: AbortSignal }) {
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      return undefined;
    },
    async getTools() {
      return [...registered.entries()].map(([name, tool]) => ({
        name,
        // Hosts may normalize schema object-key order; readback compares the
        // schema meaning rather than insertion order.
        inputSchema: JSON.stringify(reorderSchemaKeys(tool.inputSchema)),
      }));
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { modelContext } });
  try {
    const statuses: string[] = [];
    let fetchCount = 0;
    let reconciliations = 0;
    const registrar = createWebMcpPageToolRegistrar({
      onStatus: (status) => statuses.push(status),
      onReconcile: () => { reconciliations += 1; },
      fetchImpl: async (_input, init) => {
        fetchCount += 1;
        const body = JSON.parse(String(init?.body)) as { tool: string };
        const response = body.tool === "inspect_shelter_state"
          ? {
              contract_version: CONTRACT_VERSION,
              status: "ok",
              tool: body.tool,
              request_id: "request-1",
              scope: { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" },
              world_time: 1,
              continuation: {
                signal_id: "signal-1",
                bounded_action: "force_recall_soldier",
              },
            }
          : { contract_version: CONTRACT_VERSION, status: "committed", tool: body.tool };
        return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    await registrar.start();
    assert.equal(registrar.status, "registered");
    assert.deepEqual([...registered.keys()].sort(), [
      "inspect_client_snapshot",
      "inspect_mission_history",
      "inspect_missions",
      "inspect_shelter_state",
    ]);
    await registered.get("inspect_shelter_state")?.execute({}, { signal: new AbortController().signal });
    assert.equal(registered.has("force_recall_soldier"), true);
    const recall = registered.get("force_recall_soldier");
    assert.ok(recall);
    await assert.rejects(recall.execute({
      command_id: "command-1",
      idempotency_key: "idempotency-1",
      soldier_id: "soldier-a-01",
      mission_id: "mission-1",
      mission_attempt_id: "attempt-1",
      expected_entity_revisions: { soldier: 1, mission: 1, mission_attempt: 1 },
      signal_id: "wrong-signal-is-replaced-by-server-bound-signal",
    }, { signal: new AbortController().signal }), /STALE_REENTRY_CONTEXT/);
    assert.equal(fetchCount, 1);
    await recall?.execute({
      command_id: "command-1",
      idempotency_key: "idempotency-1",
      soldier_id: "soldier-a-01",
      mission_id: "mission-1",
      mission_attempt_id: "attempt-1",
      expected_entity_revisions: { soldier: 1, mission: 1, mission_attempt: 1 },
      signal_id: "signal-1",
    }, { signal: new AbortController().signal });
    assert.equal(fetchCount, 2);
    assert.equal(reconciliations, 1);
    registrar.stop("unmount");
    assert.equal(registered.size, 0, "aborting the registration generation unregisters every page tool");
    assert.equal(statuses.includes("registered"), true);
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  }
});

test("page registrar registers a continuation-bound recall only once when shelter reads race", async () => {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const registered = new Map<string, {
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  }>();
  let recallRegistrationCount = 0;
  let shelterResponseCount = 0;
  let releaseRecallRegistration!: () => void;
  let releaseRecallReadback!: () => void;
  let markFirstRecallRegistration!: () => void;
  let markRecallReadbackStarted!: () => void;
  let markSecondShelterResponse!: () => void;
  const firstRecallRegistrationStarted = new Promise<void>((resolve) => {
    markFirstRecallRegistration = resolve;
  });
  const secondShelterResponseSent = new Promise<void>((resolve) => {
    markSecondShelterResponse = resolve;
  });
  const recallRegistrationGate = new Promise<void>((resolve) => {
    releaseRecallRegistration = resolve;
  });
  const recallReadbackGate = new Promise<void>((resolve) => {
    releaseRecallReadback = resolve;
  });
  const recallReadbackStarted = new Promise<void>((resolve) => {
    markRecallReadbackStarted = resolve;
  });
  const modelContext = {
    async registerTool(tool: {
      name: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
    }, options?: { signal?: AbortSignal }) {
      if (tool.name === "force_recall_soldier") {
        recallRegistrationCount += 1;
        if (recallRegistrationCount === 1) {
          markFirstRecallRegistration();
        }
        await recallRegistrationGate;
      }
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      return undefined;
    },
    async getTools() {
      if (registered.has("force_recall_soldier")) {
        markRecallReadbackStarted();
        markRecallReadbackStarted = () => {};
        await recallReadbackGate;
      }
      return [...registered.entries()].map(([name, tool]) => ({ name, inputSchema: tool.inputSchema }));
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { modelContext } });
  try {
    const registrar = createWebMcpPageToolRegistrar({
      onStatus: () => {},
      onReconcile: () => {},
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { tool: string };
        if (body.tool === "inspect_shelter_state") {
          shelterResponseCount += 1;
          if (shelterResponseCount === 2) {
            markSecondShelterResponse();
            markSecondShelterResponse = () => {};
          }
        }
        const response = body.tool === "inspect_shelter_state"
          ? {
              contract_version: CONTRACT_VERSION,
              status: "ok",
              tool: body.tool,
              request_id: "request-race",
              scope: { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" },
              world_time: 1,
              continuation: { signal_id: "signal-race", bounded_action: "force_recall_soldier" },
            }
          : { contract_version: CONTRACT_VERSION, status: "committed", tool: body.tool };
        return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    await registrar.start();
    const shelterTool = registered.get("inspect_shelter_state");
    assert.ok(shelterTool);
    const firstRead = shelterTool.execute({}, { signal: new AbortController().signal });
    await firstRecallRegistrationStarted;
    const secondRead = shelterTool.execute({}, { signal: new AbortController().signal });
    await secondShelterResponseSent;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    releaseRecallRegistration();
    await recallReadbackStarted;
    let secondReadSettled = false;
    let thirdRead: Promise<unknown> | undefined;
    void secondRead.then(() => {
      secondReadSettled = true;
    });
    await Promise.resolve();
    try {
      assert.equal(secondReadSettled, false, "a concurrent read waits for recall readback");
      thirdRead = shelterTool.execute({}, { signal: new AbortController().signal });
      let thirdReadSettled = false;
      void thirdRead.then(() => {
        thirdReadSettled = true;
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      assert.equal(thirdReadSettled, false, "a later read waits for recall readback");
    } finally {
      releaseRecallReadback();
    }
    assert.ok(thirdRead);
    await Promise.all([firstRead, secondRead, thirdRead]);
    assert.equal(recallRegistrationCount, 1);
    assert.equal(registered.has("force_recall_soldier"), true);
    registrar.stop("unmount");
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  }
});

test("page registrar rejects a read response from a stopped registration generation", async () => {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const registered = new Map<string, {
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  }>();
  let releaseFetch!: (response: Response) => void;
  let markFetchStarted!: () => void;
  const fetchStarted = new Promise<void>((resolve) => {
    markFetchStarted = resolve;
  });
  const pendingResponse = new Promise<Response>((resolve) => {
    releaseFetch = resolve;
  });
  const modelContext = {
    async registerTool(tool: {
      name: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
    }, options?: { signal?: AbortSignal }) {
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      return undefined;
    },
    async getTools() {
      return [...registered.entries()].map(([name, tool]) => ({ name, inputSchema: tool.inputSchema }));
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { modelContext } });
  try {
    const registrar = createWebMcpPageToolRegistrar({
      onStatus: () => {},
      onReconcile: () => {},
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { tool: string };
        if (body.tool === "inspect_shelter_state") {
          markFetchStarted();
          markFetchStarted = () => {};
          return pendingResponse;
        }
        return new Response(JSON.stringify({
          contract_version: CONTRACT_VERSION,
          status: "ok",
          tool: body.tool,
          request_id: "request-stale-generation",
          scope: { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" },
          world_time: 1,
        }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    await registrar.start();
    assert.equal(registrar.status, "registered");
    const shelterTool = registered.get("inspect_shelter_state");
    assert.ok(shelterTool);
    const staleRead = shelterTool.execute({}, { signal: new AbortController().signal });
    await fetchStarted;
    registrar.stop("reconnect");
    releaseFetch(new Response(JSON.stringify({
      contract_version: CONTRACT_VERSION,
      status: "ok",
      tool: "inspect_shelter_state",
      request_id: "request-stale-generation",
      scope: { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" },
      world_time: 1,
      continuation: null,
    }), { status: 200, headers: { "content-type": "application/json" } }));
    await assert.rejects(staleRead, (error: unknown) => error instanceof DOMException && error.name === "AbortError");
    assert.equal(registrar.status, "stale");
    assert.equal(registered.size, 0);
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  }
});

test("page registrar fails closed on initial registration or readback failure while preserving human fallback", async () => {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const registered = new Map<string, {
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  }>();
  let mode: "registration" | "readback" = "registration";
  let registrationCount = 0;
  const statuses: Array<{ status: string; message: string }> = [];
  const modelContext = {
    async registerTool(tool: {
      name: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
    }, options?: { signal?: AbortSignal }) {
      registrationCount += 1;
      if (mode === "registration" && registrationCount === 2) {
        throw new Error("HOST_REGISTRATION_FAILED");
      }
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      return undefined;
    },
    async getTools() {
      return [...registered.entries()].map(([name, tool]) => ({
        name,
        inputSchema: mode === "readback" && name === "inspect_missions"
          ? { type: "object", properties: { unexpected: { type: "string" } }, additionalProperties: false }
          : tool.inputSchema,
      }));
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { modelContext } });
  try {
    const registrar = createWebMcpPageToolRegistrar({
      onStatus: (status, message) => statuses.push({ status, message }),
      onReconcile: () => {},
      fetchImpl: async () => new Response(JSON.stringify({}), { status: 200 }),
    });

    await registrar.start();
    assert.equal(registrar.status, "error");
    assert.equal(registered.size, 0, "a failed initial registration aborts already registered tools");
    assert.equal(statuses[statuses.length - 1]?.message, "WebMCP registration failed. Human controls remain available.");

    mode = "readback";
    registrationCount = 0;
    await registrar.start();
    assert.equal(registrar.status, "error");
    assert.equal(registered.size, 0, "a failed initial readback aborts the whole generation");
    assert.equal(statuses[statuses.length - 1]?.message, "WebMCP registration readback did not match the page contract. Human controls remain available.");
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  }
});

test("page registrar fails closed when continuation recall readback fails", async () => {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const registered = new Map<string, {
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  }>();
  const modelContext = {
    async registerTool(tool: {
      name: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
    }, options?: { signal?: AbortSignal }) {
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      return undefined;
    },
    async getTools() {
      return [...registered.entries()].map(([name, tool]) => ({
        name,
        inputSchema: name === "force_recall_soldier"
          ? { type: "object", properties: { unexpected: { type: "string" } }, additionalProperties: false }
          : tool.inputSchema,
      }));
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { modelContext } });
  try {
    const statuses: Array<{ status: string; message: string }> = [];
    const registrar = createWebMcpPageToolRegistrar({
      onStatus: (status, message) => statuses.push({ status, message }),
      onReconcile: () => {},
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { tool: string };
        const response = body.tool === "inspect_shelter_state"
          ? {
              contract_version: CONTRACT_VERSION,
              status: "ok",
              tool: body.tool,
              request_id: "request-recall-readback-failure",
              scope: { world_id: WORLD_ID, player_id: "player-a", shelter_id: "shelter-a" },
              world_time: 1,
              continuation: { signal_id: "signal-recall-readback-failure", bounded_action: "force_recall_soldier" },
            }
          : { contract_version: CONTRACT_VERSION, status: "committed", tool: body.tool };
        return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    await registrar.start();
    assert.equal(registrar.status, "registered");
    const shelterTool = registered.get("inspect_shelter_state");
    assert.ok(shelterTool);
    await assert.rejects(
      shelterTool.execute({}, { signal: new AbortController().signal }),
      /PAGE_TOOL_READBACK_MISMATCH/,
    );
    assert.equal(registrar.status, "error");
    assert.equal(registered.size, 0, "a failed continuation readback aborts the generation and unregisters every tool");
    assert.equal(statuses[statuses.length - 1]?.message, "WebMCP recall registration failed its page-contract readback. Human controls remain available.");
  } finally {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  }
});

test("disabled page transport reports unsupported without granting a fallback", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp13-page-disabled-");
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "0", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
  });
  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}${PAGE_TOOLS_EXECUTE_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pageRequest("inspect_shelter_state", {})),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error_code: "WEBMCP_UNAVAILABLE" });
    assert.equal(response.headers.get("set-cookie"), null);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});
