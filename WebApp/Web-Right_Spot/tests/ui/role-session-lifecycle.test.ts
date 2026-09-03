import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createRoleSessionLifecycleMonitor,
  sameSessionActor,
  sessionActorKey,
} from "../../src/ui/shared/role-session-lifecycle";
import type { SessionActor } from "../../src/ui/shared/session-api";

class FakeEventTarget {
  private readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class FakeDocumentTarget extends FakeEventTarget {
  visibilityState: "hidden" | "visible" = "visible";
}

const TENANT: SessionActor = { id: "tenant-primary", role: "tenant" };

async function settleLifecycleRead(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

function failOnLifecycleError(error: unknown): never {
  assert.fail(error instanceof Error ? error : "unexpected lifecycle error");
}

test("actor identity distinguishes null, id, and role transitions while preserving same-actor keys", () => {
  assert.equal(sameSessionActor(TENANT, { ...TENANT }), true);
  assert.equal(sameSessionActor(TENANT, null), false);
  assert.equal(sameSessionActor(TENANT, { id: "tenant-secondary", role: "tenant" }), false);
  assert.equal(sameSessionActor(TENANT, { id: TENANT.id, role: "agent" }), false);
  assert.equal(sessionActorKey(TENANT), "tenant:tenant-primary");
  assert.equal(sessionActorKey({ id: "tenant-secondary", role: "tenant" }), "tenant:tenant-secondary");
});

test("monitor registers one focus and visibility listener and removes both on dispose", () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => TENANT,
    onActorChange: () => assert.fail("same actor must not emit a transition"),
    onError: failOnLifecycleError,
  });

  assert.equal(windowTarget.listenerCount("focus"), 1);
  assert.equal(documentTarget.listenerCount("visibilitychange"), 1);
  dispose();
  assert.equal(windowTarget.listenerCount("focus"), 0);
  assert.equal(documentTarget.listenerCount("visibilitychange"), 0);
});

test("focus and visible visibility checkpoints revalidate while hidden visibility does not", async () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  let reads = 0;
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => {
      reads += 1;
      return TENANT;
    },
    onActorChange: () => assert.fail("same actor must not emit a transition"),
    onError: failOnLifecycleError,
  });

  documentTarget.visibilityState = "hidden";
  documentTarget.dispatch("visibilitychange");
  await settleLifecycleRead();
  assert.equal(reads, 0);

  windowTarget.dispatch("focus");
  await settleLifecycleRead();
  assert.equal(reads, 1);

  documentTarget.visibilityState = "visible";
  documentTarget.dispatch("visibilitychange");
  await settleLifecycleRead();
  assert.equal(reads, 2);
  dispose();
});

test("overlapping lifecycle checkpoints coalesce to one in-flight session read", async () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  let reads = 0;
  let release: ((actor: SessionActor | null) => void) | undefined;
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => {
      reads += 1;
      return await new Promise<SessionActor | null>((resolve) => { release = resolve; });
    },
    onActorChange: () => assert.fail("same actor must not emit a transition"),
    onError: failOnLifecycleError,
  });

  windowTarget.dispatch("focus");
  documentTarget.dispatch("visibilitychange");
  windowTarget.dispatch("focus");
  assert.equal(reads, 1);
  release?.(TENANT);
  await settleLifecycleRead();

  windowTarget.dispatch("focus");
  assert.equal(reads, 2);
  dispose();
});

test("monitor emits null, id, and role transitions but no same-actor transition", async () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  const results: Array<SessionActor | null> = [
    { ...TENANT },
    null,
    { id: "tenant-secondary", role: "tenant" },
    { id: "agent-primary", role: "agent" },
  ];
  const transitions: Array<SessionActor | null> = [];
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => results.shift() ?? null,
    onActorChange: (actor) => transitions.push(actor),
    onError: failOnLifecycleError,
  });

  for (let index = 0; index < 4; index += 1) {
    windowTarget.dispatch("focus");
    await settleLifecycleRead();
  }

  assert.deepEqual(transitions, [
    null,
    { id: "tenant-secondary", role: "tenant" },
    { id: "agent-primary", role: "agent" },
  ]);
  dispose();
});

test("non-authentication errors preserve actor identity and a later checkpoint may retry", async () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  const failure = new Error("session unavailable");
  let reads = 0;
  const errors: unknown[] = [];
  const transitions: Array<SessionActor | null> = [];
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => {
      reads += 1;
      if (reads === 1) throw failure;
      return { ...TENANT };
    },
    onActorChange: (actor) => transitions.push(actor),
    onError: (error) => errors.push(error),
  });

  windowTarget.dispatch("focus");
  await settleLifecycleRead();
  windowTarget.dispatch("focus");
  await settleLifecycleRead();

  assert.deepEqual(errors, [failure]);
  assert.deepEqual(transitions, []);
  assert.equal(reads, 2);
  dispose();
});

test("dispose suppresses a late session settlement", async () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeDocumentTarget();
  let release: ((actor: SessionActor | null) => void) | undefined;
  const transitions: Array<SessionActor | null> = [];
  const dispose = createRoleSessionLifecycleMonitor({
    windowTarget,
    documentTarget,
    initialActor: TENANT,
    readSession: async () => await new Promise<SessionActor | null>((resolve) => { release = resolve; }),
    onActorChange: (actor) => transitions.push(actor),
    onError: failOnLifecycleError,
  });

  windowTarget.dispatch("focus");
  dispose();
  release?.(null);
  await settleLifecycleRead();
  assert.deepEqual(transitions, []);
});
