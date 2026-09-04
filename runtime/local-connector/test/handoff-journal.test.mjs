import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  LocalHandoffJournalStore,
  LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
  LOCAL_HANDOFF_JOURNAL_TYPE,
  summarizeHandoffJournal,
} from "../src/handoff-journal.mjs";

const NOW = new Date("2026-09-04T12:00:00.000Z");

test("handoff journal is private, restart-safe, and redacts runtime binding material", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-handoff-journal-"));
  try {
    const filename = join(directory, "private", "handoff-journal.json");
    const store = new LocalHandoffJournalStore({ filename });
    await store.begin({
      handoffId: "handoff_001",
      deliveryId: "delivery_001",
      eventId: "event_001",
      recordedAt: NOW,
    });
    const unknown = await store.recordRuntimeUnknown({
      handoffId: "handoff_001",
      deliveryId: "delivery_001",
      eventId: "event_001",
      code: "runtime_admission_invocation_failed",
      recordedAt: NOW,
    });
    const reloaded = new LocalHandoffJournalStore({ filename });
    assert.deepEqual(await reloaded.get({ handoffId: "handoff_001" }), unknown);
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
    assert.equal((await stat(join(directory, "private"))).mode & 0o777, 0o700);
    const persisted = await readFile(filename, "utf8");
    assert.equal(persisted.includes("lease_token"), false);
    assert.equal(persisted.includes("binding_ref"), false);
    assert.equal(JSON.stringify(await store.summarize()).includes("runtime_admission_attestation"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("journal persists admission before Receiver handoff and accepts an idempotent receipt", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-handoff-journal-"));
  try {
    const store = new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") });
    const identity = {
      handoffId: "handoff_002",
      deliveryId: "delivery_002",
      eventId: "event_002",
    };
    await store.begin({ ...identity, recordedAt: NOW });
    const admission = await store.recordAdmission({
      ...identity,
      attestation: runtimeAdmission(identity),
      recordedAt: NOW,
    });
    assert.equal(admission.state, "handoff_pending");
    const receipt = notificationReceipt(identity, admission.runtime_admission_attestation.admission_id);
    const handedOff = await store.recordHandoff({ ...identity, receipt, recordedAt: NOW });
    assert.equal(handedOff.state, "handed_off");
    assert.deepEqual(await store.recordHandoff({ ...identity, receipt, recordedAt: new Date(NOW.getTime() + 1_000) }), handedOff);
    assert.deepEqual(
      await new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") }).get({ handoffId: identity.handoffId }),
      handedOff,
    );
    await assert.rejects(
      store.recordHandoff({
        ...identity,
        receipt: notificationReceipt(identity, "admission_other"),
        recordedAt: NOW,
      }),
      (error) => error?.code === "local_handoff_journal_invalid" || error?.code === "local_handoff_journal_conflict",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("runtime-pending and runtime-unknown entries quarantine the handoff against blind resend", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-handoff-journal-"));
  try {
    const store = new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") });
    const identity = {
      handoffId: "handoff_003",
      deliveryId: "delivery_003",
      eventId: "event_003",
    };
    const pending = await store.begin({ ...identity, recordedAt: NOW });
    assert.equal((await store.begin({ ...identity, recordedAt: new Date(NOW.getTime() + 1_000) })).state, "runtime_pending");
    const unknown = await store.recordRuntimeUnknown({
      ...identity,
      code: "runtime_admission_invocation_timed_out",
      recordedAt: NOW,
    });
    assert.equal(unknown.state, "runtime_unknown");
    assert.equal((await store.begin({ ...identity, recordedAt: new Date(NOW.getTime() + 2_000) })).state, "runtime_unknown");
    await assert.rejects(
      store.recordAdmission({ ...identity, attestation: runtimeAdmission(identity), recordedAt: NOW }),
      (error) => error?.code === "local_handoff_journal_conflict",
    );
    assert.deepEqual((await store.get({ handoffId: identity.handoffId })).state, unknown.state);
    assert.equal(pending.state, "runtime_pending");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("unsupported capability can be retried, but only before a runtime boundary", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-handoff-journal-"));
  try {
    const store = new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") });
    const identity = {
      handoffId: "handoff_004",
      deliveryId: "delivery_004",
      eventId: "event_004",
    };
    await store.begin({ ...identity, recordedAt: NOW });
    assert.equal((await store.recordUnsupported({
      ...identity,
      code: "runtime_admission_unavailable",
      recordedAt: NOW,
    })).state, "unsupported");
    assert.equal((await store.begin({ ...identity, recordedAt: NOW })).state, "runtime_pending");
    assert.equal((await store.recordAdmission({
      ...identity,
      attestation: runtimeAdmission(identity),
      recordedAt: NOW,
    })).state, "handoff_pending");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("journal normalizer rejects malformed records and summary never exposes task locator", () => {
  assert.throws(
    () => summarizeHandoffJournal({ version: 1, entries: [{ type: LOCAL_HANDOFF_JOURNAL_TYPE }] }),
    (error) => error?.code === "local_handoff_journal_invalid",
  );
  const summary = summarizeHandoffJournal({
    version: 1,
    entries: [{
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      handoff_id: "handoff_005",
      delivery_id: "delivery_005",
      event_id: "event_005",
      state: "runtime_unknown",
      code: "runtime_admission_invocation_failed",
      recorded_at: NOW.toISOString(),
      runtime_admission_attestation: null,
      receipt: null,
    }],
  });
  assert.equal(JSON.stringify(summary).includes("binding_ref"), false);
});

function runtimeAdmission(identity) {
  return {
    type: "webmcp.runtime_admission_attestation",
    protocol_version: "0.2",
    admission_id: `admission_${identity.handoffId}`,
    adapter_id: "codex_queue_local",
    binding_generation: "a".repeat(64),
    delivery_id: identity.deliveryId,
    event_id: identity.eventId,
    handoff_id: identity.handoffId,
    accepted_at: NOW.toISOString(),
  };
}

function notificationReceipt(identity, admissionId) {
  return {
    type: "webmcp.notification_handoff_receipt",
    protocol_version: "0.2",
    delivery_id: identity.deliveryId,
    event_id: identity.eventId,
    handoff_id: identity.handoffId,
    correlation_id: `correlation_${identity.handoffId}`,
    workflow_id: `workflow_${identity.handoffId}`,
    status: "handed_off",
    duplicate: false,
    runtime_admission_ref: admissionId,
  };
}
