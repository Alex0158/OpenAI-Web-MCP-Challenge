import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  captureCurrentCodexTaskBinding,
  LOCAL_TASK_BINDING_PROTOCOL_VERSION,
  LOCAL_TASK_BINDING_TYPE,
  LocalTaskBindingStore,
  summarizeTaskBindings,
} from "../src/task-binding.mjs";

const NOW = new Date("2026-09-04T12:00:00.000Z");

test("task binding store captures an exact trusted runtime task and survives reload", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const filename = join(directory, "private", "task-bindings.json");
    const store = new LocalTaskBindingStore({ filename });
    const binding = await captureCurrentCodexTaskBinding({
      store,
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      environment: { CODEX_SESSION_ID: "task_001" },
      boundAt: NOW,
    });

    assert.deepEqual(
      {
        type: binding.type,
        protocol_version: binding.protocol_version,
        grant_id: binding.grant_id,
        adapter_id: binding.adapter_id,
        binding_ref: binding.binding_ref,
        bound_at: binding.bound_at,
        status: binding.status,
      },
      {
        type: LOCAL_TASK_BINDING_TYPE,
        protocol_version: LOCAL_TASK_BINDING_PROTOCOL_VERSION,
        grant_id: "grant_001",
        adapter_id: "codex_queue_local",
        binding_ref: "task_001",
        bound_at: NOW.toISOString(),
        status: "active",
      },
    );
    assert.match(binding.binding_generation, /^[0-9a-f]{64}$/);
    assert.deepEqual(await store.resolve({ grantId: "grant_001", adapterId: "codex_queue_local" }), binding);

    const reloaded = new LocalTaskBindingStore({ filename });
    assert.deepEqual(await reloaded.resolve({ grantId: "grant_001", adapterId: "codex_queue_local" }), binding);
    const persisted = JSON.parse(await readFile(filename, "utf8"));
    assert.equal(persisted.bindings[0].binding_ref, "task_001");
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
    assert.equal((await stat(join(directory, "private"))).mode & 0o777, 0o700);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("task binding store refuses relative paths so protecting the parent cannot change a project directory", () => {
  assert.throws(
    () => new LocalTaskBindingStore({ filename: "task-bindings.json" }),
    /absolute filename/,
  );
});

test("binding resolution is exact, private, and does not cross Grant or Adapter scope", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const store = new LocalTaskBindingStore({ filename: join(directory, "task-bindings.json") });
    await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_001",
      boundAt: NOW,
    });
    assert.equal(await store.resolve({ grantId: "grant_002", adapterId: "codex_queue_local" }), null);
    assert.equal(await store.resolve({ grantId: "grant_001", adapterId: "other_adapter" }), null);

    const summary = summarizeTaskBindings(await store.load());
    assert.equal(summary.bindings[0].grant_id, "grant_001");
    assert.equal("binding_ref" in summary.bindings[0], false);
    assert.equal(JSON.stringify(summary).includes("task_001"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("capture is idempotent for one task and refuses silent rebinding", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const store = new LocalTaskBindingStore({ filename: join(directory, "task-bindings.json") });
    const first = await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_001",
      boundAt: NOW,
    });
    const same = await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_001",
      boundAt: new Date(NOW.getTime() + 1_000),
    });
    assert.deepEqual(same, first);
    await assert.rejects(
      store.capture({
        grantId: "grant_001",
        adapterId: "codex_queue_local",
        bindingRef: "task_002",
        boundAt: NOW,
      }),
      (error) => error?.code === "local_task_binding_conflict",
    );
    assert.deepEqual(await store.resolve({ grantId: "grant_001", adapterId: "codex_queue_local" }), first);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("retiring a binding blocks resolution and permits a new explicit capture generation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const store = new LocalTaskBindingStore({ filename: join(directory, "task-bindings.json") });
    const first = await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_001",
      boundAt: NOW,
    });
    assert.equal(await store.retire({ grantId: "grant_001", adapterId: "codex_queue_local" }), true);
    assert.equal(await store.resolve({ grantId: "grant_001", adapterId: "codex_queue_local" }), null);
    assert.equal(await store.retire({ grantId: "grant_001", adapterId: "codex_queue_local" }), false);

    const second = await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_002",
      boundAt: NOW,
    });
    assert.notEqual(second.binding_generation, first.binding_generation);
    assert.equal(second.binding_ref, "task_002");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("retireAll fences every active local binding without deleting the private store", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const filename = join(directory, "task-bindings.json");
    const store = new LocalTaskBindingStore({ filename });
    await store.capture({
      grantId: "grant_001",
      adapterId: "codex_queue_local",
      bindingRef: "task_001",
      boundAt: NOW,
    });
    await store.capture({
      grantId: "grant_002",
      adapterId: "codex_queue_local",
      bindingRef: "task_002",
      boundAt: NOW,
    });
    assert.equal(await store.retireAll(), 2);
    assert.equal(await store.retireAll(), 0);
    assert.equal(await store.resolve({ grantId: "grant_001", adapterId: "codex_queue_local" }), null);
    assert.equal(await store.resolve({ grantId: "grant_002", adapterId: "codex_queue_local" }), null);
    assert.equal((await stat(filename)).isFile(), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("capture fails closed when the trusted runtime does not provide a task identity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const store = new LocalTaskBindingStore({ filename: join(directory, "task-bindings.json") });
    await assert.rejects(
      captureCurrentCodexTaskBinding({
        store,
        grantId: "grant_001",
        adapterId: "codex_queue_local",
        environment: {},
        boundAt: NOW,
      }),
      (error) => error?.code === "local_task_binding_runtime_unavailable",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("malformed persisted bindings are rejected instead of being used as a task target", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-binding-"));
  try {
    const filename = join(directory, "task-bindings.json");
    const store = new LocalTaskBindingStore({ filename });
    await store.save({
      version: 1,
      bindings: [{
        type: LOCAL_TASK_BINDING_TYPE,
        protocol_version: LOCAL_TASK_BINDING_PROTOCOL_VERSION,
        grant_id: "grant_001",
        adapter_id: "codex_queue_local",
        binding_ref: "task_001",
        binding_generation: "not-a-digest",
        bound_at: NOW.toISOString(),
        status: "active",
      }],
    }).catch((error) => assert.equal(error?.code, "local_task_binding_invalid"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
