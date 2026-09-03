import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { SCHEMA_SQL } from "../../../reentry-core/src/sqlite-receiver-schema.mjs";
import { ReceiverActivityReader } from "../src/receiver-activity.mjs";

test("Receiver activity reader returns an empty, redacted snapshot", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-activity-empty-"));
  const filename = join(directory, "receiver.sqlite");
  const database = new DatabaseSync(filename);
  database.exec(SCHEMA_SQL);
  database.close();

  const reader = new ReceiverActivityReader({ filename, organizationId: "org_preview" });
  t.after(async () => {
    reader.close();
    await rm(directory, { recursive: true, force: true });
  });

  const snapshot = reader.snapshot({ limit: 25 });
  assert.equal(snapshot.available, true);
  assert.equal(snapshot.receiver_scope, "org_preview");
  assert.equal(Number.isFinite(Date.parse(snapshot.generated_at)), true);
  assert.deepEqual(snapshot.counts, { events: 0, pending_work: 0 });
  assert.deepEqual(snapshot.events, []);
  assert.deepEqual(snapshot.pending_work, []);
});

test("Receiver activity reader projects event and pending-delivery metadata without payloads", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-activity-seeded-"));
  const filename = join(directory, "receiver.sqlite");
  const database = new DatabaseSync(filename);
  database.exec(SCHEMA_SQL);
  const timestamp = "2026-09-01T12:00:00.000Z";
  database.prepare(`
    INSERT INTO receiver_challenges (
      challenge_id, manifest_id, manifest_json, expected_origin, effective_expires_at,
      status, decision_id, decision_action, subject_id, created_at, decided_at
    ) VALUES (?, ?, ?, ?, ?, 'approved', ?, 'approve', ?, ?, ?)
  `).run(
    "challenge_001",
    "manifest_001",
    '{"private":"not projected"}',
    "https://host.example",
    "2026-09-02T12:00:00.000Z",
    "decision_001",
    "subject_001",
    timestamp,
    timestamp,
  );
  database.prepare(`
    INSERT INTO receiver_grants (
      grant_id, challenge_id, manifest_id, binding_id, subject_id, delivery_target_id,
      correlation_id, issuer_origin, workflow_type, workflow_id, event_type, canonical_url,
      expires_at, human_boundary, instruction, runs_remaining, revoked_at, receipt_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
  `).run(
    "grant_001",
    "challenge_001",
    "manifest_001",
    "binding_001",
    "subject_001",
    "target_001",
    "correlation_001",
    "https://host.example",
    "review",
    "workflow_001",
    "workflow.ready",
    "https://host.example/workflows/workflow_001",
    "2026-09-02T12:00:00.000Z",
    "explicit_receiver_consent",
    "Review the approved workflow and prepare the next safe step.",
    '{"private":"not projected"}',
    timestamp,
  );
  database.prepare(`
    INSERT INTO receiver_events (
      event_id, grant_id, canonical_body, acceptance_json, received_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    "event_001",
    "grant_001",
    '{"private":"not projected"}',
    '{"receipt":"not projected"}',
    timestamp,
  );
  database.prepare(`
    INSERT INTO receiver_deliveries (
      delivery_id, event_id, grant_id, delivery_target_id, status, created_at
    ) VALUES (?, ?, ?, ?, 'pending', ?)
  `).run("delivery_001", "event_001", "grant_001", "target_001", timestamp);
  database.prepare(`
    INSERT INTO receiver_delivery_states (
      delivery_id, status, maximum_attempts, current_attempt, updated_at
    ) VALUES (?, 'pending', 3, 0, ?)
  `).run("delivery_001", timestamp);
  database.close();

  const reader = new ReceiverActivityReader({ filename, organizationId: "org_preview" });
  t.after(async () => {
    reader.close();
    await rm(directory, { recursive: true, force: true });
  });

  const snapshot = reader.snapshot({ limit: 10 });
  assert.equal(snapshot.counts.events, 1);
  assert.equal(snapshot.counts.pending_work, 1);
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].event_id, "event_001");
  assert.equal(snapshot.events[0].event_type, "workflow.ready");
  assert.equal(snapshot.events[0].delivery_status, "pending");
  assert.equal(snapshot.pending_work[0].delivery_id, "delivery_001");
  assert.equal(snapshot.pending_work[0].attempt, 0);
  assert.equal(Object.hasOwn(snapshot.events[0], "canonical_body"), false);
  assert.equal(Object.hasOwn(snapshot.events[0], "receipt_json"), false);
  assert.equal(Object.hasOwn(snapshot.events[0], "subject_id"), false);

  const reopened = new DatabaseSync(filename);
  reopened.prepare(`
    UPDATE receiver_delivery_states
    SET status = 'acknowledged', current_attempt = 1, current_connector_id = ?,
        current_lease_token_digest = ?, leased_at = ?, lease_expires_at = ?,
        effect_id = ?, effect_attestation_json = ?, acknowledged_at = ?, updated_at = ?
    WHERE delivery_id = ?
  `).run(
    "connector_001",
    "lease_digest_001",
    timestamp,
    "2026-09-01T12:01:00.000Z",
    "effect_001",
    '{"verified":true}',
    "2026-09-01T12:00:30.000Z",
    "2026-09-01T12:00:30.000Z",
    "delivery_001",
  );
  reopened.close();

  const acknowledged = reader.snapshot({ limit: 10 });
  assert.equal(acknowledged.counts.pending_work, 0);
  assert.equal(acknowledged.events[0].delivery_status, "acknowledged");
});
