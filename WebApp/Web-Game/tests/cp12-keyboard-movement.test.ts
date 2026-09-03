import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { WebSocket } from "ws";

import {
  createHeldMovementController,
  createMovementReconciliationGate,
  directionForMapKey,
  shouldBlockHeldMovement,
  shouldSuppressMapKeyDefault,
  shouldSuppressDirectionButtonKey,
} from "../src/client/keyboard-movement";
import { parseLocalFixtureBootstrap } from "../src/client/local-fixture-bootstrap";
import { RealtimeProjectionClient } from "../src/client/realtime-projection";
import { createScopedCommandAdmission } from "../src/server/scoped-command-admission";
import { loadRuntimeConfig } from "../src/server/config";
import { createEntrypoint } from "../src/server/entrypoint";
import { createPersistenceStore } from "../src/server/persistence/store";
import type { RealtimeSnapshotFrame } from "../src/server/realtime-snapshot";
import {
  MOVE_PLAYER_COMMAND_PATH,
  parseMovePlayerCommandEnvelope,
  parseMovePlayerCommandFailure,
  parseMovePlayerCommandSuccess,
  type MovePlayerCommandEnvelope,
} from "../src/shared/move-player-command";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const GAME_PROJECTION_SOURCE = readFileSync(new URL("../src/client/game-projection.tsx", import.meta.url), "utf8");
const LIVE_PROJECTION_SOURCE = readFileSync(new URL("../src/client/live-game-projection.tsx", import.meta.url), "utf8");
const GAME_PROJECTION_CSS_SOURCE = readFileSync(new URL("../src/client/game-projection.module.css", import.meta.url), "utf8");

function fakeScheduler() {
  let nextId = 0;
  const callbacks = new Map<number, () => void>();
  const delays: number[] = [];
  return {
    setTimeout(callback: () => void, delayMs: number): number {
      const id = ++nextId;
      callbacks.set(id, callback);
      delays.push(delayMs);
      return id;
    },
    clearTimeout(handle: unknown): void {
      if (typeof handle === "number") {
        callbacks.delete(handle);
      }
    },
    runNext(): void {
      const next = callbacks.keys().next();
      if (next.done) {
        throw new Error("NO_SCHEDULED_CALLBACK");
      }
      const callback = callbacks.get(next.value);
      callbacks.delete(next.value);
      callback?.();
    },
    get size(): number {
      return callbacks.size;
    },
    get delays(): readonly number[] {
      return delays;
    },
  };
}

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

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
  });
}

function command(options: Partial<MovePlayerCommandEnvelope> = {}): MovePlayerCommandEnvelope {
  return {
    command_id: "move-command:00000000-0000-4000-8000-000000000001",
    command_type: "move_player",
    contract_version: CONTRACT_VERSION,
    expected_entity_revisions: { player: 0 },
    idempotency_key: "move-idempotency:00000000-0000-4000-8000-000000000002",
    typed_arguments: { direction: "right" },
    ...options,
  };
}

test("map input admits one focused physical direction and ignores timing or shortcut input", () => {
  const ready = {
    repeat: false,
    isComposing: false,
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    pageFocused: true,
    pageVisible: true,
    movementSurfaceFocused: true,
    connectionReady: true,
    snapshotReady: true,
    commandPending: false,
  };

  assert.equal(directionForMapKey({ ...ready, key: "w" }), "up");
  assert.equal(directionForMapKey({ ...ready, key: "A" }), "left");
  assert.equal(directionForMapKey({ ...ready, key: "ArrowDown" }), "down");
  assert.equal(directionForMapKey({ ...ready, key: "ArrowRight" }), "right");
  assert.equal(directionForMapKey({ ...ready, key: "x" }), null);
  for (const blocked of [
    { repeat: true },
    { isComposing: true },
    { defaultPrevented: true },
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { pageFocused: false },
    { pageVisible: false },
    { movementSurfaceFocused: false },
    { connectionReady: false },
    { snapshotReady: false },
    { commandPending: true },
  ]) {
    assert.equal(directionForMapKey({ ...ready, key: "d", ...blocked }), null);
  }
});

test("recognized focused movement keys suppress browser defaults even when command admission is blocked", () => {
  const ready = {
    key: "ArrowDown",
    isComposing: false,
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    pageFocused: true,
    pageVisible: true,
    movementSurfaceFocused: true,
  };
  assert.equal(shouldSuppressMapKeyDefault(ready), true);
  assert.equal(shouldSuppressMapKeyDefault({ ...ready, key: "ArrowDown", defaultPrevented: true }), false);
  assert.equal(shouldSuppressMapKeyDefault({ ...ready, key: "ArrowDown", isComposing: true }), false);
  assert.equal(shouldSuppressMapKeyDefault({ ...ready, key: "ArrowDown", movementSurfaceFocused: false }), false);
  assert.equal(shouldSuppressMapKeyDefault({ ...ready, key: "x" }), false);
});

test("direction buttons suppress only repeated keyboard activation", () => {
  assert.equal(shouldSuppressDirectionButtonKey({ key: "Enter", repeat: false }), false);
  assert.equal(shouldSuppressDirectionButtonKey({ key: " ", repeat: false }), false);
  assert.equal(shouldSuppressDirectionButtonKey({ key: "Enter", repeat: true }), true);
  assert.equal(shouldSuppressDirectionButtonKey({ key: " ", repeat: true }), true);
  assert.equal(shouldSuppressDirectionButtonKey({ key: "d", repeat: true }), false);
});

test("held movement is snapshot-gated and never queues or repeats after release", () => {
  const scheduler = fakeScheduler();
  const submissions: string[] = [];
  let ready = true;
  let pending = false;
  const controller = createHeldMovementController({
    scheduler,
    repeatDelayMs: 180,
    submit(direction) {
      submissions.push(direction);
      pending = true;
      return true;
    },
  });

  controller.setState({ available: ready, pending, blocked: false });
  assert.equal(controller.start("right"), true);
  assert.deepEqual(submissions, ["right"]);
  assert.equal(scheduler.size, 0);

  controller.setState({ available: ready, pending, blocked: false });
  assert.equal(scheduler.size, 0);

  controller.release();
  pending = false;
  controller.setState({ available: ready, pending, blocked: false });
  assert.equal(scheduler.size, 0);
  assert.deepEqual(submissions, ["right"]);
});

test("held movement resumes one step after authoritative settle and stops on blocked or unavailable state", () => {
  const scheduler = fakeScheduler();
  const submissions: string[] = [];
  let accepted = true;
  const controller = createHeldMovementController({
    scheduler,
    repeatDelayMs: 180,
    submit(direction) {
      submissions.push(direction);
      return accepted;
    },
  });

  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(controller.start("down"), true);
  assert.deepEqual(submissions, ["down"]);
  assert.equal(scheduler.size, 0);
  controller.setState({ available: true, pending: true, blocked: false });
  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(scheduler.size, 1);
  scheduler.runNext();
  assert.deepEqual(submissions, ["down", "down"]);

  controller.setState({ available: true, pending: true, blocked: false });
  assert.equal(scheduler.size, 0);
  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(scheduler.size, 1);
  accepted = false;
  scheduler.runNext();
  assert.equal(controller.activeDirection, null);
  assert.equal(scheduler.size, 0);

  accepted = true;
  assert.equal(controller.start("left"), true);
  controller.setState({ available: true, pending: false, blocked: true });
  assert.equal(controller.activeDirection, null);
  assert.equal(scheduler.size, 0);
  controller.setState({ available: false, pending: false, blocked: false });
  assert.equal(controller.activeDirection, null);
});

test("held direction changes only one active direction while a command is in flight", () => {
  const scheduler = fakeScheduler();
  const submissions: string[] = [];
  const controller = createHeldMovementController({
    scheduler,
    submit(direction) {
      submissions.push(direction);
      return true;
    },
  });

  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(controller.start("up"), true);
  controller.setState({ available: true, pending: true, blocked: false });
  assert.equal(controller.start("left"), true);
  assert.equal(controller.activeDirection, "left");
  assert.deepEqual(submissions, ["up"]);
  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(scheduler.size, 1);
  scheduler.runNext();
  assert.deepEqual(submissions, ["up", "left"]);
  assert.equal(scheduler.size, 0);
  controller.setState({ available: true, pending: true, blocked: false });
  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(scheduler.size, 1);
});

test("held movement enforces the 180 millisecond minimum delay", () => {
  const scheduler = fakeScheduler();
  const controller = createHeldMovementController({
    scheduler,
    repeatDelayMs: 1,
    submit() {
      return true;
    },
  });

  controller.setState({ available: true, pending: false, blocked: false });
  assert.equal(controller.start("right"), true);
  controller.setState({ available: true, pending: true, blocked: false });
  controller.setState({ available: true, pending: false, blocked: false });
  assert.deepEqual(scheduler.delays, [180]);
});

test("unknown movement recovery blocks a new hold until its authoritative snapshot settles", () => {
  const gate = createMovementReconciliationGate();
  gate.setScope("world-a\u0000player-a\u0000shelter-a");
  const attempt = gate.begin(4);
  assert.ok(attempt);
  assert.equal(gate.markUnknown(attempt).kind, "request_resync");
  assert.equal(shouldBlockHeldMovement({
    recoveryRequired: gate.recoveryRequired,
    pageMutationPending: true,
    movementPending: gate.pending,
  }), true);

  const submissions: string[] = [];
  const controller = createHeldMovementController({
    submit(direction) {
      submissions.push(direction);
      return true;
    },
  });
  controller.setState({
    available: true,
    pending: gate.pending,
    blocked: shouldBlockHeldMovement({
      recoveryRequired: gate.recoveryRequired,
      pageMutationPending: true,
      movementPending: gate.pending,
    }),
  });
  assert.equal(controller.start("right"), false);
  assert.deepEqual(submissions, []);

  assert.equal(gate.acceptSnapshot(4).kind, "reconciled_unknown");
  controller.setState({
    available: true,
    pending: gate.pending,
    blocked: shouldBlockHeldMovement({
      recoveryRequired: gate.recoveryRequired,
      pageMutationPending: false,
      movementPending: gate.pending,
    }),
  });
  assert.equal(controller.start("right"), true);
  assert.deepEqual(submissions, ["right"]);
});

test("held movement wiring keeps pointer, keyboard, and page-gate boundaries explicit", () => {
  assert.match(GAME_PROJECTION_SOURCE, /onHoldStart: \(direction: MovePlayerDirection\) => boolean/);
  assert.match(GAME_PROJECTION_SOURCE, /onHoldStop: \(\) => void/);
  assert.match(GAME_PROJECTION_SOURCE, /onKeyUp=\{handleMapKeyUp\}/);
  assert.match(GAME_PROJECTION_SOURCE, /commandPending: pageMutationPending && !movementPending/);
  assert.match(GAME_PROJECTION_SOURCE, /onPointerDown=\{\(event\) => handleDirectionPointerDown\(event, "right"\)\}/);
  assert.match(GAME_PROJECTION_SOURCE, /onPointerCancel=\{handleDirectionPointerEnd\}/);
  assert.match(GAME_PROJECTION_SOURCE, /onLostPointerCapture=\{handleDirectionPointerEnd\}/);
  assert.match(GAME_PROJECTION_SOURCE, /event\.currentTarget\.contains\(event\.relatedTarget/);
  assert.match(GAME_PROJECTION_SOURCE, /suppressNextClickRef/);
  assert.match(GAME_PROJECTION_SOURCE, /event\.detail > 0/);
  assert.match(GAME_PROJECTION_SOURCE, /visibilitychange/);
  assert.match(GAME_PROJECTION_SOURCE, /handleDirectionButtonBlur/);
  assert.match(GAME_PROJECTION_SOURCE, /ignoredPointerTargetsRef/);
  assert.match(LIVE_PROJECTION_SOURCE, /createHeldMovementController/);
  assert.match(LIVE_PROJECTION_SOURCE, /shouldBlockHeldMovement/);
  assert.match(LIVE_PROJECTION_SOURCE, /movementRecoveryBlocked/);
  assert.match(LIVE_PROJECTION_SOURCE, /movementEnabled=\{connectionState === "READY" && snapshot !== null && !movementRecoveryBlocked && \(!pageMutationPending \|\| movementPending\)\}/);
  assert.match(GAME_PROJECTION_CSS_SOURCE, /\.directionButton[\s\S]*?touch-action: none/);
});

test("movement reconciliation is single-flight, scope-safe, and permits one causal follow-up", () => {
  const gate = createMovementReconciliationGate();
  gate.setScope("world-a\u0000player-a\u0000shelter-a");
  const first = gate.begin(3);
  assert.ok(first);
  assert.equal(gate.recoveryRequired, false);
  assert.equal(gate.begin(3), null);
  assert.equal(gate.acceptSnapshot(3).kind, "awaiting_command");
  assert.equal(gate.acknowledge(first, 4).kind, "request_resync");
  assert.equal(gate.acceptSnapshot(3).kind, "request_follow_up_resync");
  assert.equal(gate.acceptSnapshot(3).kind, "stale");
  assert.equal(gate.acceptSnapshot(4).kind, "reconciled");
  assert.equal(gate.pending, false);

  const sameScope = gate.begin(4);
  assert.ok(sameScope);
  gate.setScope("world-a\u0000player-a\u0000shelter-a");
  assert.equal(gate.acknowledge(sameScope, 5).kind, "request_resync");
  assert.equal(gate.acceptSnapshot(5).kind, "reconciled");

  const changedScope = gate.begin(5);
  assert.ok(changedScope);
  gate.setScope("world-a\u0000player-b\u0000shelter-b");
  assert.equal(gate.acknowledge(changedScope, 6).kind, "ignored");
  assert.equal(gate.pending, false);

  const unknown = gate.begin(0);
  assert.ok(unknown);
  assert.equal(gate.markUnknown(unknown).kind, "request_resync");
  assert.equal(gate.recoveryRequired, true);
  assert.equal(gate.acceptSnapshot(0).kind, "reconciled_unknown");
  assert.equal(gate.recoveryRequired, false);
});

test("the local command envelope is exact and keeps command identity separate", () => {
  const value = command();
  assert.deepEqual(parseMovePlayerCommandEnvelope(value), value);
  assert.throws(
    () => parseMovePlayerCommandEnvelope({ ...value, player_id: "player-b" }),
    /MOVE_PLAYER_COMMAND_INVALID/,
  );
  assert.throws(
    () => parseMovePlayerCommandEnvelope({ ...value, idempotency_key: value.command_id }),
    /MOVE_PLAYER_COMMAND_INVALID/,
  );
  assert.throws(
    () => parseMovePlayerCommandEnvelope({ ...value, typed_arguments: { direction: "diagonal" } }),
    /MOVE_PLAYER_COMMAND_INVALID/,
  );
  const failure = {
    command_id: value.command_id,
    command_type: "move_player",
    contract_version: CONTRACT_VERSION,
    effect: "rejected",
    error_code: "STALE_REVISION",
    current_entity_revisions: { player: 3 },
  };
  assert.deepEqual(parseMovePlayerCommandFailure(failure, {
    commandId: value.command_id,
    contractVersion: CONTRACT_VERSION,
  }), failure);
  assert.throws(
    () => parseMovePlayerCommandFailure({ ...failure, position: { x: 1, y: 1 } }, {
      commandId: value.command_id,
      contractVersion: CONTRACT_VERSION,
    }),
    /MOVE_PLAYER_COMMAND_INVALID/,
  );
});

test("per-player command admission is bounded and a foreign completion cannot release it", () => {
  const admission = createScopedCommandAdmission();
  const first = admission.begin("world-a\u0000player-a");
  assert.ok(first);
  assert.equal(admission.begin("world-a\u0000player-a"), null);
  const other = admission.begin("world-a\u0000player-b");
  assert.ok(other);
  admission.complete({ scope: first.scope, token: first.token + 1 });
  assert.equal(admission.begin("world-a\u0000player-a"), null);
  admission.complete(first);
  assert.ok(admission.begin("world-a\u0000player-a"));
  admission.complete(other);
});

test("strict HTTP movement acknowledges, then existing WebSocket resync supplies the projection", async () => {
  const { directory, dbPath } = tempDatabase("sleepless-kingdom-cp12-keyboard-");
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", LOCAL_FIXTURE_MODE: "1", GAME_DB_PATH: dbPath }),
    createNextApp: () => fakeNextApp(),
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const body = command();

    const noSession = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(noSession.status, 401);
    assert.equal(noSession.headers.get("set-cookie"), null);
    assert.deepEqual(await noSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_REQUIRED" });

    const noSessionMalformed = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(noSessionMalformed.status, 401);
    assert.deepEqual(await noSessionMalformed.json(), { error_code: "LOCAL_FIXTURE_SESSION_REQUIRED" });

    const noSessionOversized = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(4096),
    });
    assert.equal(noSessionOversized.status, 401);
    assert.deepEqual(await noSessionOversized.json(), { error_code: "LOCAL_FIXTURE_SESSION_REQUIRED" });

    const bootstrapResponse = await fetch(`${base}/api/local-fixture/bootstrap`);
    assert.equal(bootstrapResponse.status, 200);
    const bootstrap = parseLocalFixtureBootstrap(await bootstrapResponse.json());
    const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);

    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/realtime`, { headers: { cookie } });
    const initial = await nextMessage(socket) as RealtimeSnapshotFrame;
    const projection = RealtimeProjectionClient.fromServerScope(bootstrap);
    assert.equal(projection.accept(initial).accepted, true);
    assert.deepEqual(projection.snapshot?.player.position, { x: 16, y: 64 });

    const wrongMethod = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, { headers: { cookie } });
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get("allow"), "POST");

    const wrongMedia = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "text/plain" },
      body: JSON.stringify(body),
    });
    assert.equal(wrongMedia.status, 415);

    const oversized = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, padding: "x".repeat(2048) }),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), { error_code: "MOVE_PLAYER_PAYLOAD_TOO_LARGE" });

    const unknownSession = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie: "sk_local_fixture=unknown", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(unknownSession.status, 401);
    assert.deepEqual(await unknownSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_UNKNOWN" });

    const malformedSession = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie: "sk_local_fixture", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(malformedSession.status, 401);
    assert.deepEqual(await malformedSession.json(), { error_code: "LOCAL_FIXTURE_SESSION_MALFORMED" });

    const wrongContract = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, contract_version: "SK-MVP-9.9" }),
    });
    assert.equal(wrongContract.status, 400);
    assert.deepEqual(await wrongContract.json(), { error_code: "MOVE_PLAYER_CONTRACT_UNSUPPORTED" });

    const injected = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}?player_id=player-b`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, player_id: "player-b" }),
    });
    assert.equal(injected.status, 400);

    const moved = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}?player_id=player-b`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(moved.status, 200);
    assert.equal(moved.headers.get("cache-control"), "no-store");
    assert.equal(moved.headers.get("vary"), "Cookie");
    const acknowledgement = parseMovePlayerCommandSuccess(await moved.json(), {
      commandId: body.command_id,
      contractVersion: CONTRACT_VERSION,
    });
    assert.equal(acknowledgement.effect, "moved");
    assert.equal(acknowledgement.duplicate, false);
    assert.equal(acknowledgement.current_entity_revisions.player, 1);
    assert.equal("position" in acknowledgement, false);
    assert.equal("snapshot" in acknowledgement, false);
    assert.equal("binding" in acknowledgement, false);
    assert.deepEqual(projection.snapshot?.player.position, { x: 16, y: 64 });

    const replacementMessage = nextMessage(socket);
    socket.send(JSON.stringify(projection.requestResync("EXPLICIT")));
    const replacement = await replacementMessage as RealtimeSnapshotFrame;
    assert.equal(replacement.sequence, 2);
    assert.equal(projection.accept(replacement).accepted, true);
    assert.deepEqual(projection.snapshot?.player.position, { x: 17, y: 64 });
    assert.equal(projection.snapshot?.player.revision, 1);
    assert.ok(projection.snapshot?.player.exploredCells.some((cell) => cell.x === 21 && cell.y === 64));
    assert.equal(projection.snapshot?.recentEvents.filter((event) => event.eventType === "PlayerMoved").length, 1);

    const duplicate = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(duplicate.status, 200);
    assert.equal((await duplicate.json() as { duplicate?: unknown }).duplicate, true);

    const stale = await fetch(`${base}${MOVE_PLAYER_COMMAND_PATH}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(command({
        command_id: "move-command:00000000-0000-4000-8000-000000000003",
        idempotency_key: "move-idempotency:00000000-0000-4000-8000-000000000004",
      })),
    });
    assert.equal(stale.status, 409);
    const staleBody = command({
      command_id: "move-command:00000000-0000-4000-8000-000000000003",
      idempotency_key: "move-idempotency:00000000-0000-4000-8000-000000000004",
    });
    assert.deepEqual(await stale.json(), {
      command_id: staleBody.command_id,
      command_type: "move_player",
      contract_version: CONTRACT_VERSION,
      effect: "rejected",
      error_code: "STALE_REVISION",
      current_entity_revisions: { player: 1 },
    });

    socket.close();
    await new Promise<void>((resolve) => socket.once("close", () => resolve()));
  } finally {
    await entrypoint.shutdown("test");
  }

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    const playerA = store.getPlayer("sleepless-mvp-01", "player-a");
    const playerB = store.getPlayer("sleepless-mvp-01", "player-b");
    assert.deepEqual(playerA?.position, { x: 17, y: 64 });
    assert.deepEqual(playerB?.position, { x: 112, y: 64 });
    const events = store.events("sleepless-mvp-01").filter((event) => event.eventType === "PlayerMoved");
    assert.equal(events.length, 1);
    assert.equal(events[0]?.causationId, command().command_id);
    assert.equal(events[0]?.idempotencyKey, command().idempotency_key);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
