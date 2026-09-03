import assert from "node:assert/strict";
import { test } from "node:test";

import { createConnectionAttemptGate } from "../src/client/connection-attempt-gate";
import { snapshotMatchesBootstrapScope } from "../src/client/local-fixture-bootstrap";
import { buildProjectionViewModel } from "../src/client/projection-model";
import type { ClientSnapshot } from "../src/server/world-projection";

test("a reconnect gate rejects duplicate starts and supersedes callbacks after settlement", () => {
  const gate = createConnectionAttemptGate();
  const first = gate.begin();
  const duplicate = gate.begin();

  assert.equal(typeof first, "number");
  assert.equal(duplicate, null);
  assert.equal(gate.isCurrent(first), true);

  gate.complete(first);
  const second = gate.begin();

  assert.equal(typeof second, "number");
  assert.equal(gate.isCurrent(first), false);
  assert.equal(gate.isCurrent(second), true);

  gate.invalidate();
  assert.equal(gate.isCurrent(second), false);
});

test("a closed state exposes recovery wording without inventing a projection", () => {
  const closed = buildProjectionViewModel({ snapshot: null, connectionState: "CLOSED", capability: "supported" });
  assert.equal(closed.snapshotStatus, "WAITING_FOR_SNAPSHOT");
  assert.equal(closed.worldTime, null);
  assert.match(closed.statusMessage, /reconnect/i);
});

test("a reconnect retains a snapshot only when the fresh bootstrap scope is identical", () => {
  const snapshot = {
    contractVersion: "SK-MVP-0.2",
    worldId: "sleepless-mvp-01",
    playerScope: { playerId: "player-a", shelterId: "shelter-a" },
  } as ClientSnapshot;
  const scope = {
    capability: "supported" as const,
    contractVersion: "SK-MVP-0.2",
    worldId: "sleepless-mvp-01",
    playerId: "player-a",
    shelterId: "shelter-a",
  };

  assert.equal(snapshotMatchesBootstrapScope(snapshot, scope), true);
  assert.equal(snapshotMatchesBootstrapScope(snapshot, { ...scope, playerId: "player-b" }), false);
  assert.equal(snapshotMatchesBootstrapScope(snapshot, { ...scope, shelterId: "shelter-b" }), false);
  assert.equal(snapshotMatchesBootstrapScope(snapshot, { ...scope, worldId: "other-world" }), false);
  assert.equal(snapshotMatchesBootstrapScope(snapshot, { ...scope, contractVersion: "SK-MVP-0.3" }), false);
});
