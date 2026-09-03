import assert from "node:assert/strict";
import { test } from "node:test";

import type { ClientSnapshot } from "../src/server/world-projection";
import {
  RealtimeSnapshotHub,
  type RealtimeSnapshotFrame,
  type RealtimeSnapshotSink,
} from "../src/server/realtime-snapshot";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { WorldClockAdvanceResult } from "../src/server/world-clock";

const WORLD_ID = "cp12-publication-world";

class MemorySink implements RealtimeSnapshotSink {
  readonly frames: RealtimeSnapshotFrame[] = [];
  readonly closeReasons: string[] = [];

  send(frame: RealtimeSnapshotFrame): void {
    this.frames.push(frame);
  }

  close(reason?: string): void {
    this.closeReasons.push(reason ?? "");
  }
}

function scope(playerId = "player-a") {
  return {
    worldId: WORLD_ID,
    playerId,
    binding: `${playerId}-binding`,
  } as const;
}

function snapshot(id: string, marker: number): ClientSnapshot {
  return { clientSnapshotId: id, marker } as unknown as ClientSnapshot;
}

function publishCurrentSnapshots(hub: RealtimeSnapshotHub): Promise<void> {
  return (hub as unknown as { publishCurrentSnapshots(): Promise<void> }).publishCurrentSnapshots();
}

test("successful worker progress automatically publishes a changed full snapshot", async () => {
  const first = snapshot("snapshot-1", 1);
  const second = snapshot("snapshot-2", 2);
  let calls = 0;
  const gateway = {
    fullSnapshot: async () => {
      calls += 1;
      return calls === 1 ? first : second;
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);

  await publishCurrentSnapshots(hub);

  assert.equal(calls, 2);
  assert.equal(sink.frames.length, 2);
  assert.equal(sink.frames[1]?.sequence, 2);
  assert.equal(sink.frames[1]?.snapshot.clientSnapshotId, "snapshot-2");
  assert.equal(connection.lastSequence, 2);
});

test("automatic publication suppresses equal content while explicit resync remains forced", async () => {
  const same = snapshot("same-snapshot", 1);
  const gateway = {
    fullSnapshot: async () => same,
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);

  await publishCurrentSnapshots(hub);
  assert.equal(sink.frames.length, 1);

  const explicit = await connection.requestResync();
  assert.equal(explicit.sequence, 2);
  assert.equal(explicit.snapshot.clientSnapshotId, "same-snapshot");
  assert.equal(sink.frames.length, 2);
});

test("a publication after an empty automatic wake does not reuse a fulfilled pump", async () => {
  let calls = 0;
  let releaseResync!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(snapshot("snapshot-1", 1));
      }
      if (calls === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          releaseResync = resolve;
        });
      }
      return Promise.resolve(snapshot("snapshot-3", 3));
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);
  connection.markStale();

  const empty = publishCurrentSnapshots(hub);
  const explicit = connection.requestResync();
  await Promise.resolve();
  const progress = publishCurrentSnapshots(hub);
  assert.notStrictEqual(progress, empty);
  let progressFinished = false;
  void progress.then(() => {
    progressFinished = true;
  });
  await Promise.resolve();
  assert.equal(progressFinished, false);

  releaseResync(snapshot("snapshot-2", 2));
  await Promise.all([empty, explicit, progress]);
  assert.equal(calls, 3);
  assert.deepEqual(sink.frames.map((frame) => frame.sequence), [1, 2, 3]);
});

test("progress during an automatic read keeps one trailing latest request", async () => {
  const first = snapshot("snapshot-1", 1);
  const middle = snapshot("snapshot-2", 2);
  const latest = snapshot("snapshot-3", 3);
  let calls = 0;
  let resolveMiddle!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      if (calls === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          resolveMiddle = resolve;
        });
      }
      return Promise.resolve(latest);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  await hub.connect(scope(), sink);

  const firstPublication = publishCurrentSnapshots(hub);
  await Promise.resolve();
  const trailingPublication = publishCurrentSnapshots(hub);
  assert.equal(calls, 2);

  resolveMiddle(middle);
  await Promise.all([firstPublication, trailingPublication]);

  assert.equal(calls, 3);
  assert.deepEqual(
    sink.frames.map((frame) => frame.snapshot.clientSnapshotId),
    ["snapshot-1", "snapshot-2", "snapshot-3"],
  );
});

test("progress arriving during the initial connect read is retained for the first trailing publication", async () => {
  const first = snapshot("snapshot-1", 1);
  const changed = snapshot("snapshot-2", 2);
  let calls = 0;
  let resolveInitial!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return new Promise<ClientSnapshot>((resolve) => {
          resolveInitial = resolve;
        });
      }
      return Promise.resolve(changed);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connecting = hub.connect(scope(), sink);
  await Promise.resolve();

  const progress = publishCurrentSnapshots(hub);
  resolveInitial(first);
  const connection = await connecting;
  await progress;

  assert.equal(connection.state, "READY");
  assert.equal(calls, 2);
  assert.deepEqual(sink.frames.map((frame) => frame.snapshot.clientSnapshotId), ["snapshot-1", "snapshot-2"]);
});

test("progress arriving during the initial connect send is retained for the first trailing publication", async () => {
  const first = snapshot("snapshot-1", 1);
  const changed = snapshot("snapshot-2", 2);
  let calls = 0;
  let resolveInitialSend!: () => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      return Promise.resolve(calls === 1 ? first : changed);
    },
  };
  const sink = new MemorySink();
  const originalSend = sink.send.bind(sink);
  sink.send = (frame) => {
    if (frame.snapshot.clientSnapshotId === first.clientSnapshotId) {
      return new Promise<void>((resolve) => {
        resolveInitialSend = () => {
          originalSend(frame);
          resolve();
        };
      });
    }
    originalSend(frame);
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const connecting = hub.connect(scope(), sink);
  await Promise.resolve();

  const progress = publishCurrentSnapshots(hub);
  resolveInitialSend();
  const connection = await connecting;
  await progress;

  assert.equal(connection.state, "READY");
  assert.equal(calls, 2);
  assert.deepEqual(sink.frames.map((frame) => frame.snapshot.clientSnapshotId), ["snapshot-1", "snapshot-2"]);
});

test("repeated progress notifications share one hub pump while a connection is slow", async () => {
  const first = snapshot("snapshot-1", 1);
  const resolvers: Array<(value: ClientSnapshot) => void> = [];
  let calls = 0;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      return new Promise<ClientSnapshot>((resolve) => {
        resolvers.push(resolve);
      });
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  await hub.connect(scope(), sink);

  const pumps = Array.from({ length: 1000 }, () => publishCurrentSnapshots(hub));
  const firstPump = pumps[0]!;
  for (const pump of pumps) {
    assert.strictEqual(pump, firstPump);
  }
  assert.equal(calls, 2);
  resolvers[0]?.(snapshot("snapshot-2", 2));
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls, 3);
  resolvers[1]?.(snapshot("snapshot-3", 3));
  await firstPump;
  assert.equal(calls, 3);
});

test("a slow connection does not delay a fast connection's automatic publication", async () => {
  const counts = new Map<string, number>();
  let releaseSlow!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: ({ playerId }: { playerId: string }) => {
      const count = (counts.get(playerId) ?? 0) + 1;
      counts.set(playerId, count);
      if (playerId === "player-a" && count === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          releaseSlow = resolve;
        });
      }
      return Promise.resolve(snapshot(`${playerId}-${count}`, count));
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sinkA = new MemorySink();
  const sinkB = new MemorySink();
  await hub.connect(scope("player-a"), sinkA);
  await hub.connect(scope("player-b"), sinkB);

  const pump = publishCurrentSnapshots(hub);
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(sinkA.frames.length, 1);
  assert.equal(sinkB.frames.at(-1)?.snapshot.clientSnapshotId, "player-b-2");
  const secondPump = publishCurrentSnapshots(hub);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(sinkA.frames.length, 1);
  assert.equal(sinkB.frames.at(-1)?.snapshot.clientSnapshotId, "player-b-3");
  releaseSlow(snapshot("player-a-2", 2));
  await Promise.all([pump, secondPump]);
  assert.equal(sinkA.frames.at(-1)?.snapshot.clientSnapshotId, "player-a-3");
});

test("repeated progress during automatic work plus explicit recovery keeps one trailing operation", async () => {
  const first = snapshot("snapshot-1", 1);
  const automaticResult = snapshot("snapshot-2", 2);
  let calls = 0;
  let releaseAutomatic!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      if (calls === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          releaseAutomatic = resolve;
        });
      }
      return Promise.resolve(automaticResult);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);

  const automatic = publishCurrentSnapshots(hub);
  await Promise.resolve();
  const duplicateAutomatic = publishCurrentSnapshots(hub);
  const anotherAutomatic = publishCurrentSnapshots(hub);
  const explicit = connection.requestResync();
  releaseAutomatic(automaticResult);

  await Promise.all([automatic, duplicateAutomatic, anotherAutomatic, explicit]);
  assert.equal(calls, 3);
  assert.deepEqual(sink.frames.map((frame) => frame.sequence), [1, 2, 3]);
  assert.equal((await explicit).snapshot.clientSnapshotId, "snapshot-2");
});

test("a wake in the settled-drain cleanup window is admitted as a new automatic read", async () => {
  let calls = 0;
  let releaseSink!: () => void;
  let acceptedSinkWrite: Promise<void> | null = null;
  let latePublication: Promise<void> | null = null;
  let hub!: RealtimeSnapshotHub;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      return Promise.resolve(snapshot(`snapshot-${calls}`, calls));
    },
  };
  const sink = new MemorySink();
  const originalSend = sink.send.bind(sink);
  sink.send = (frame) => {
    originalSend(frame);
    if (frame.sequence === 2) {
      acceptedSinkWrite = new Promise<void>((resolve) => {
        releaseSink = resolve;
      });
      // Register the external wake after the hub has registered its own
      // continuation on the accepted sink promise. The nested microtask lands
      // between drain settlement and the drain cleanup reaction.
      acceptedSinkWrite.then(() => queueMicrotask(() => {
        latePublication = publishCurrentSnapshots(hub);
      }));
      return acceptedSinkWrite;
    }
  };
  hub = new RealtimeSnapshotHub({ gateway });
  await hub.connect(scope(), sink);

  const publication = publishCurrentSnapshots(hub);
  await Promise.resolve();
  assert.ok(acceptedSinkWrite);
  releaseSink();
  await publication;
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.ok(latePublication);
  await latePublication;

  assert.equal(calls, 3);
  assert.deepEqual(sink.frames.map((frame) => frame.sequence), [1, 2, 3]);
});

test("multiple progress notifications during initial connect keep one trailing automatic operation", async () => {
  const first = snapshot("snapshot-1", 1);
  const changed = snapshot("snapshot-2", 2);
  let calls = 0;
  let resolveInitial!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return new Promise<ClientSnapshot>((resolve) => {
          resolveInitial = resolve;
        });
      }
      return Promise.resolve(changed);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connecting = hub.connect(scope(), sink);
  await Promise.resolve();

  const firstProgress = publishCurrentSnapshots(hub);
  const secondProgress = publishCurrentSnapshots(hub);
  const thirdProgress = publishCurrentSnapshots(hub);
  resolveInitial(first);
  const connection = await connecting;
  await Promise.all([firstProgress, secondProgress, thirdProgress]);

  assert.equal(connection.state, "READY");
  assert.equal(calls, 2);
  assert.deepEqual(sink.frames.map((frame) => frame.snapshot.clientSnapshotId), ["snapshot-1", "snapshot-2"]);
});

test("closing a connection while publication is pending prevents a late send", async () => {
  const first = snapshot("snapshot-1", 1);
  let resolveSecond!: (value: ClientSnapshot) => void;
  let calls = 0;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      return new Promise<ClientSnapshot>((resolve) => {
        resolveSecond = resolve;
      });
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);
  const publication = publishCurrentSnapshots(hub);
  await Promise.resolve();

  const closing = connection.close("CLIENT_CLOSED");
  await Promise.resolve();
  resolveSecond(snapshot("snapshot-2", 2));
  await closing;
  await publication;

  assert.equal(sink.frames.length, 1);
  assert.equal(connection.state, "CLOSED");
  assert.deepEqual(sink.closeReasons, ["CLIENT_CLOSED"]);
});

test("an automatic sink failure stays connection-local and explicit resync can recover", async () => {
  let calls = 0;
  let fail = false;
  const gateway = {
    fullSnapshot: async () => {
      calls += 1;
      return snapshot(`snapshot-${calls}`, calls);
    },
  };
  const sink = new MemorySink();
  const originalSend = sink.send.bind(sink);
  sink.send = (frame) => {
    if (fail) {
      throw new Error("SINK_WRITE_FAILED");
    }
    originalSend(frame);
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const connection = await hub.connect(scope(), sink);
  fail = true;

  await publishCurrentSnapshots(hub);

  assert.equal(connection.state, "STALE");
  assert.equal(connection.lastSequence, 1);
  assert.equal(sink.frames.length, 1);
  fail = false;
  const replacement = await connection.requestResync();
  assert.equal(replacement.sequence, 2);
  assert.equal(connection.state, "READY");
});

test("closing during an accepted sink operation does not resurrect the connection", async () => {
  const first = snapshot("snapshot-1", 1);
  let resolveSend!: () => void;
  let calls = 0;
  const gateway = {
    fullSnapshot: async () => {
      calls += 1;
      return snapshot(`snapshot-${calls}`, calls);
    },
  };
  const sink = new MemorySink();
  const originalSend = sink.send.bind(sink);
  sink.send = (frame) => {
    if (frame.snapshot.clientSnapshotId === first.clientSnapshotId) {
      originalSend(frame);
      return;
    }
    return new Promise<void>((resolve) => {
      resolveSend = () => {
        originalSend(frame);
        resolve();
      };
    });
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const connection = await hub.connect(scope(), sink);
  const publication = publishCurrentSnapshots(hub);
  await Promise.resolve();
  const closing = connection.close("CLIENT_CLOSED");
  await Promise.resolve();
  resolveSend();
  await closing;
  await publication;

  assert.equal(connection.state, "CLOSED");
  assert.equal(connection.lastSequence, 1);
});

test("hub drain joins a connection close that started before the drain snapshot", async () => {
  let signalCloseStarted!: () => void;
  let releaseClose!: () => void;
  const closeStarted = new Promise<void>((resolve) => {
    signalCloseStarted = resolve;
  });
  const gateway = {
    fullSnapshot: async () => snapshot("snapshot-1", 1),
  };
  const sink = new MemorySink();
  sink.close = () => {
    signalCloseStarted();
    return new Promise<void>((resolve) => {
      releaseClose = resolve;
    });
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const connection = await hub.connect(scope(), sink);

  const closing = connection.close("CLIENT_CLOSED");
  await closeStarted;
  const draining = hub.drain("RUNTIME_DRAINING");
  let drained = false;
  void draining.then(() => {
    drained = true;
  });
  await Promise.resolve();
  assert.equal(drained, false);

  releaseClose();
  await Promise.all([closing, draining]);
  assert.equal(drained, true);
  assert.equal(hub.state, "DRAINING");
});

test("automatic publication reads each immutable connection scope independently", async () => {
  const counts = new Map<string, number>();
  const gateway = {
    fullSnapshot: async (input: { playerId: string }) => {
      const count = (counts.get(input.playerId) ?? 0) + 1;
      counts.set(input.playerId, count);
      return snapshot(`${input.playerId}-${count}`, count);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sinkA = new MemorySink();
  const sinkB = new MemorySink();
  const connectionA = await hub.connect(scope("player-a"), sinkA);
  const connectionB = await hub.connect(scope("player-b"), sinkB);

  await publishCurrentSnapshots(hub);

  assert.equal(sinkA.frames.at(-1)?.snapshot.clientSnapshotId, "player-a-2");
  assert.equal(sinkB.frames.at(-1)?.snapshot.clientSnapshotId, "player-b-2");
  assert.equal(connectionA.playerId, "player-a");
  assert.equal(connectionB.playerId, "player-b");
});

test("an explicit resync arriving during automatic publication still receives a forced frame", async () => {
  const first = snapshot("snapshot-1", 1);
  const changed = snapshot("snapshot-2", 2);
  let calls = 0;
  let resolveAutomatic!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      if (calls === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          resolveAutomatic = resolve;
        });
      }
      return Promise.resolve(changed);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);

  const automatic = publishCurrentSnapshots(hub);
  await Promise.resolve();
  const explicit = connection.requestResync();
  resolveAutomatic(changed);
  await Promise.all([automatic, explicit]);

  assert.equal(calls, 3);
  assert.deepEqual(sink.frames.map((frame) => frame.sequence), [1, 2, 3]);
  assert.equal((await explicit).snapshot.clientSnapshotId, "snapshot-2");
});

test("progress arriving during explicit resync receives one trailing automatic latest frame", async () => {
  const first = snapshot("snapshot-1", 1);
  const resynced = snapshot("snapshot-2", 2);
  const latest = snapshot("snapshot-3", 3);
  let calls = 0;
  let resolveResync!: (value: ClientSnapshot) => void;
  const gateway = {
    fullSnapshot: () => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(first);
      }
      if (calls === 2) {
        return new Promise<ClientSnapshot>((resolve) => {
          resolveResync = resolve;
        });
      }
      return Promise.resolve(latest);
    },
  };
  const hub = new RealtimeSnapshotHub({ gateway });
  const sink = new MemorySink();
  const connection = await hub.connect(scope(), sink);

  const explicit = connection.requestResync();
  await Promise.resolve();
  const progress = publishCurrentSnapshots(hub);
  resolveResync(resynced);
  await Promise.all([explicit, progress]);

  assert.equal(calls, 3);
  assert.deepEqual(sink.frames.map((frame) => frame.sequence), [1, 2, 3]);
  assert.equal(connection.state, "READY");
});

test("worker notifies only after successful advance and does not notify a failed tick", async () => {
  let shouldFail = false;
  let worldTime = 0;
  const result = (): WorldClockAdvanceResult => ({ worldTime, processedBoundaries: 0 });
  const clock = {
    start(): void {},
    stop(): void {},
    tick(elapsedMs: number): WorldClockAdvanceResult {
      if (shouldFail) {
        throw new Error("CLOCK_FAILED");
      }
      worldTime += elapsedMs;
      return result();
    },
  };
  const persistence = {
    open(): void {},
    close(): void {},
  };
  const worker = new WorldWorkerModule({ clock, store: persistence });
  const observed: WorldClockAdvanceResult[] = [];
  (worker as unknown as { onAdvance(listener: (value: WorldClockAdvanceResult) => void): void }).onAdvance(
    (value) => observed.push(value),
  );

  await worker.start();
  worker.advance(100);
  shouldFail = true;
  assert.throws(() => worker.advance(100), /CLOCK_FAILED/);
  assert.equal(observed.length, 1);
  assert.equal(observed[0]?.worldTime, 100);
  await worker.stop();
});
