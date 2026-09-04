import assert from "node:assert/strict";
import { mkdtemp, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  SCHEMA_SQL,
  STANDING_KEY_PIN_TRIGGERS_SQL,
  STANDING_LEGACY_KEY_FINGERPRINT,
} from "../src/sqlite-receiver-schema.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";

const PINNED_KEY_FINGERPRINT = "A".repeat(43);
const LEGACY_KEY_ID = "__migration_unset__";

function pendingChallenge() {
  return {
    challenge_id: "challenge_001",
    manifest_id: "manifest_001",
    manifest_json: JSON.stringify({
      display: {
        reason: "Review the approved workflow and prepare the next safe step.",
      },
    }),
    expected_origin: "https://host.example",
    effective_expires_at: "2026-08-31T03:25:00.000Z",
    status: "pending",
    decision_id: null,
    decision_action: null,
    subject_id: null,
    created_at: "2026-08-31T03:05:00.000Z",
    decided_at: null,
  };
}

test("SQLite store fences writes inside synchronous non-nested transactions", () => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  const challenge = pendingChallenge();

  assert.throws(
    () => store.insertChallenge(challenge),
    /writes require an active transaction/,
  );
  assert.throws(
    () => store.transaction(() => store.transaction(() => undefined)),
    /Nested SQLite Receiver transactions are not supported/,
  );
  assert.throws(
    () => store.transaction((transaction) => {
      transaction.insertChallenge(challenge);
      return Promise.resolve();
    }),
    /transaction callback must be synchronous/,
  );
  assert.equal(store.getChallengeById(challenge.challenge_id), undefined);

  store.transaction((transaction) => transaction.insertChallenge(challenge));
  assert.deepEqual(store.getChallengeById(challenge.challenge_id), challenge);
  store.close();
  store.close();
  assert.throws(() => store.getChallengeById(challenge.challenge_id), /store is closed/);
});

test("file store persists schema version, uses WAL, and rejects unknown databases", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-schema-"));
  const validPath = join(directory, "valid.sqlite");
  const futurePath = join(directory, "future.sqlite");
  const unversionedPath = join(directory, "unversioned.sqlite");
  t.after(async () => {
    for (const filename of [validPath, futurePath, unversionedPath]) {
      for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
        await unlinkIfPresent(path);
      }
    }
    await rmdir(directory);
  });

  const store = new SqliteReceiverStore({ filename: validPath });
  const probe = new DatabaseSync(validPath);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
  assert.equal(probe.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
  probe.close();
  store.close();

  const future = new DatabaseSync(futurePath);
  future.exec("PRAGMA user_version = 99");
  future.close();
  assert.throws(
    () => new SqliteReceiverStore({ filename: futurePath }),
    /Unsupported SQLite Receiver schema version: 99/,
  );

  const unversioned = new DatabaseSync(unversionedPath);
  unversioned.exec("CREATE TABLE unrelated (id INTEGER PRIMARY KEY)");
  unversioned.close();
  assert.throws(
    () => new SqliteReceiverStore({ filename: unversionedPath }),
    /Unversioned SQLite Receiver database is not empty/,
  );
});

test("schema version 1 migrates pending deliveries, instructions, and standing tables atomically to version 7", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-migration-"));
  const filename = join(directory, "receiver.sqlite");
  let store;
  t.after(async () => {
    store?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  store = new SqliteReceiverStore({ filename });
  store.transaction((transaction) => {
    transaction.insertChallenge(pendingChallenge());
    transaction.insertGrant({
      grant_id: "grant_001",
      challenge_id: "challenge_001",
      manifest_id: "manifest_001",
      binding_id: "binding_001",
      subject_id: "subject_001",
      delivery_target_id: "target_001",
      correlation_id: "correlation_001",
      issuer_origin: "https://host.example",
      workflow_type: "test.workflow",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: "https://host.example/workflows/workflow_001",
      expires_at: "2026-08-31T03:25:00.000Z",
      human_boundary: "explicit_receiver_consent",
      instruction: "Review the approved workflow and prepare the next safe step.",
      runs_remaining: 0,
      revoked_at: null,
      receipt_json: "{}",
      created_at: "2026-08-31T03:05:00.000Z",
    });
    transaction.insertEvent({
      event_id: "event_001",
      grant_id: "grant_001",
      canonical_body: "{}",
      acceptance_json: "{}",
      received_at: "2026-08-31T03:06:00.000Z",
    });
    transaction.insertDelivery({
      delivery_id: "delivery_001",
      event_id: "event_001",
      grant_id: "grant_001",
      delivery_target_id: "target_001",
      status: "pending",
      maximum_attempts: 1,
      created_at: "2026-08-31T03:06:00.000Z",
    });
  });
  store.close();
  store = undefined;

  const legacy = new DatabaseSync(filename);
  legacy.exec("DROP TABLE receiver_delivery_attempts");
  legacy.exec("DROP TABLE receiver_delivery_states");
  legacy.exec("DROP INDEX receiver_deliveries_target_order");
  legacy.exec("ALTER TABLE receiver_grants DROP COLUMN instruction");
  removeStandingSchema(legacy);
  legacy.exec("PRAGMA user_version = 1");
  legacy.close();

  store = new SqliteReceiverStore({ filename });
  const migrated = store.getDeliveryByEventId("event_001");
  assert.equal(migrated.status, "pending");
  assert.equal(migrated.maximum_attempts, 1);
  assert.equal(migrated.current_attempt, 0);
  assert.equal(migrated.current_lease_token_digest, null);
  assert.equal(
    migrated.instruction,
    "Review the approved workflow and prepare the next safe step.",
  );

  const probe = new DatabaseSync(filename);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
  assert.equal(
    probe.prepare("SELECT count(*) AS count FROM receiver_delivery_states").get().count,
    1,
  );
  assert.equal(
    probe.prepare("SELECT count(*) AS count FROM receiver_delivery_attempts").get().count,
    0,
  );
  probe.close();
});

test("schema version 2 derives the immutable instruction and migrates to version 7", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-instruction-migration-"));
  const filename = join(directory, "receiver.sqlite");
  let store;
  t.after(async () => {
    store?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  store = new SqliteReceiverStore({ filename });
  store.transaction((transaction) => {
    transaction.insertChallenge(pendingChallenge());
    transaction.insertGrant({
      grant_id: "grant_001",
      challenge_id: "challenge_001",
      manifest_id: "manifest_001",
      binding_id: "binding_001",
      subject_id: "subject_001",
      delivery_target_id: "target_001",
      correlation_id: "correlation_001",
      issuer_origin: "https://host.example",
      workflow_type: "test.workflow",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: "https://host.example/workflows/workflow_001",
      expires_at: "2026-08-31T03:25:00.000Z",
      human_boundary: "explicit_receiver_consent",
      instruction: "Review the approved workflow and prepare the next safe step.",
      runs_remaining: 1,
      revoked_at: null,
      receipt_json: "{}",
      created_at: "2026-08-31T03:05:00.000Z",
    });
  });
  store.close();
  store = undefined;

  const legacy = new DatabaseSync(filename);
  legacy.exec("ALTER TABLE receiver_grants DROP COLUMN instruction");
  removeStandingSchema(legacy);
  legacy.exec("PRAGMA user_version = 2");
  legacy.close();

  store = new SqliteReceiverStore({ filename });
  const migrated = store.getGrantByBindingId("binding_001");
  assert.equal(
    migrated.instruction,
    "Review the approved workflow and prepare the next safe step.",
  );

  const probe = new DatabaseSync(filename);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
  probe.close();
});

test("schema version 3 adds standing authorization tables and migrates to version 7", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-standing-migration-"));
  const filename = join(directory, "receiver.sqlite");
  let store;
  t.after(async () => {
    store?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  store = new SqliteReceiverStore({ filename });
  store.close();
  store = undefined;

  const prior = new DatabaseSync(filename);
  removeStandingSchema(prior);
  prior.exec("PRAGMA user_version = 3");
  prior.close();

  store = new SqliteReceiverStore({ filename });
  const probe = new DatabaseSync(filename);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
  assert.deepEqual(
    probe.prepare(`
      SELECT name
      FROM sqlite_schema
      WHERE type = 'table' AND name LIKE 'receiver_standing_%'
      ORDER BY name
    `).all().map((row) => row.name),
    [
      "receiver_standing_challenges",
      "receiver_standing_deliveries",
      "receiver_standing_events",
      "receiver_standing_grants",
    ],
  );
  probe.close();
});

test("SQLite standing store persists the consented key ID and public-key fingerprint", () => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  const grant = standingGrant("store");
  store.transaction((transaction) => {
    transaction.insertStandingChallenge(standingChallenge("store"));
    transaction.insertStandingGrant(grant);
  });
  assert.deepEqual(store.getStandingGrantByBindingId(grant.binding_id), grant);
  store.close();
});

for (const version of [4, 5]) {
  test(`schema version ${version} preserves standing history and revokes unpinned Grants in version 7`, async (t) => {
    const fixture = await databaseFixture(t, `standing-v${version}-migration`);
    const prior = createLegacyDatabase(fixture.filename, version);
    const active = standingGrant(`v${version}_active`, { last_event_sequence: 1 });
    const revoked = standingGrant(`v${version}_revoked`, {
      last_event_sequence: 1,
      revoked_at: "2026-09-03T03:06:00.000Z",
    });
    const unresolved = standingGrant(`v${version}_unresolved`, {
      issuer_key_id: LEGACY_KEY_ID,
      last_event_sequence: 1,
    });
    const originals = [active, revoked, unresolved];
    for (const grant of originals) seedLegacyStandingHistory(prior, grant, version);
    if (version === 4) {
      prior.prepare("UPDATE receiver_standing_challenges SET manifest_json = ? WHERE challenge_id = ?")
        .run("{", unresolved.challenge_id);
    }
    rawInsert(prior, "receiver_challenges", pendingChallenge());
    const preserved = snapshotRows(prior);
    prior.close();

    const store = fixture.openStore();
    for (const original of originals) {
      const migrated = store.getStandingGrantByBindingId(original.binding_id);
      assert.deepEqual(migrated, {
        ...original,
        issuer_key_fingerprint: STANDING_LEGACY_KEY_FINGERPRINT,
        revoked_at: original.revoked_at ?? original.created_at,
      });
    }
    const probe = fixture.openProbe();
    assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
    assert.deepEqual(snapshotRows(probe), preserved);
    assert.equal(
      probe.prepare("SELECT count(*) AS count FROM receiver_standing_grants").get().count,
      3,
    );
    for (const original of originals) {
      assert.throws(
        () => probe.prepare(`
          UPDATE receiver_standing_grants
          SET issuer_key_fingerprint = ?
          WHERE grant_id = ?
        `).run(PINNED_KEY_FINGERPRINT, original.grant_id),
        /standing_grant_key_pin_immutable/,
      );
    }
    store.close();
    fixture.openStore();
    assert.equal(
      probe.prepare("SELECT issuer_key_fingerprint FROM receiver_standing_grants WHERE grant_id = ?")
        .get(active.grant_id).issuer_key_fingerprint,
      STANDING_LEGACY_KEY_FINGERPRINT,
    );
  });
}

test("fresh and migrated standing schemas reject missing or invalid pins and forbid rebinding", async (t) => {
  for (const version of ["fresh", 4, 5]) {
    await t.test(`schema source ${version}`, async (t) => {
      const fixture = await databaseFixture(t, `standing-pins-${version}`);
      if (version !== "fresh") createLegacyDatabase(fixture.filename, version).close();
      fixture.openStore();
      const probe = fixture.openProbe();
      const suffix = `pins_${version}`;
      const grant = standingGrant(suffix);
      rawInsert(probe, "receiver_standing_challenges", standingChallenge(suffix));

      const columns = probe.prepare("PRAGMA table_info('receiver_standing_grants')").all();
      const keyColumn = columns.find((column) => column.name === "issuer_key_id");
      const fingerprintColumn = columns.find((column) => column.name === "issuer_key_fingerprint");
      assert.equal(keyColumn.notnull, 1);
      assert.equal(fingerprintColumn.notnull, 1);
      assert.equal(fingerprintColumn.dflt_value, `'${STANDING_LEGACY_KEY_FINGERPRINT}'`);
      // Fresh v5 had no key-ID default. Additive migration preserves that metadata while the
      // same triggers enforce identical omission and invalid-value behavior for every source.
      assert.equal(keyColumn.dflt_value, version === 5 ? null : `'${LEGACY_KEY_ID}'`);

      const invalidValues = [
        ["issuer_key_id", undefined],
        ["issuer_key_id", null],
        ["issuer_key_id", LEGACY_KEY_ID],
        ["issuer_key_id", ""],
        ["issuer_key_id", "-invalid"],
        ["issuer_key_id", "invalid key"],
        ["issuer_key_id", "a".repeat(161)],
        ["issuer_key_id", "key\u0000hidden"],
        ["issuer_key_fingerprint", undefined],
        ["issuer_key_fingerprint", null],
        ["issuer_key_fingerprint", STANDING_LEGACY_KEY_FINGERPRINT],
        ["issuer_key_fingerprint", "A".repeat(42)],
        ["issuer_key_fingerprint", "A".repeat(44)],
        ["issuer_key_fingerprint", `${"A".repeat(42)}+`],
        ["issuer_key_fingerprint", `${"A".repeat(42)}B`],
        ["issuer_key_fingerprint", `${PINNED_KEY_FINGERPRINT}\u0000hidden`],
      ];
      for (const [field, value] of invalidValues) {
        const invalid = { ...grant, [field]: value };
        if (value === undefined) delete invalid[field];
        assert.throws(
          () => rawInsert(probe, "receiver_standing_grants", invalid),
          /standing_grant_key_pin_invalid/,
          `${field} must reject ${JSON.stringify(value)}`,
        );
      }
      assert.equal(
        probe.prepare("SELECT count(*) AS count FROM receiver_standing_grants").get().count,
        0,
      );
      rawInsert(probe, "receiver_standing_grants", grant);
      for (const [field, value] of [
        ["issuer_key_id", "another_trusted_key"],
        ["issuer_key_id", LEGACY_KEY_ID],
        ["issuer_key_fingerprint", `${"B".repeat(42)}A`],
        ["issuer_key_fingerprint", STANDING_LEGACY_KEY_FINGERPRINT],
      ]) {
        assert.throws(
          () => probe.prepare(`UPDATE receiver_standing_grants SET ${field} = ?`).run(value),
          /standing_grant_key_pin_immutable/,
        );
      }
      probe.exec(`
        UPDATE receiver_standing_grants
        SET issuer_key_id = issuer_key_id, issuer_key_fingerprint = issuer_key_fingerprint;
      `);
      assert.equal(
        probe.prepare("SELECT issuer_key_fingerprint FROM receiver_standing_grants").get()
          .issuer_key_fingerprint,
        PINNED_KEY_FINGERPRINT,
      );
    });
  }
});

test("schema version 6 adds notification handoff columns without changing standing history", async (t) => {
  const fixture = await databaseFixture(t, "standing-v6-handoff-migration");
  const prior = createLegacyDatabase(fixture.filename, 6);
  const grant = standingGrant("v6_handoff", { last_event_sequence: 1 });
  seedLegacyStandingHistory(prior, grant, 6);
  prior.close();

  const store = fixture.openStore();
  const delivery = store.getStandingDeliveryById("standing_delivery_v6_handoff");
  assert.equal(delivery.handoff_id, null);
  assert.equal(delivery.runtime_admission_json, null);
  assert.equal(delivery.handoff_receipt_json, null);
  assert.equal(delivery.handoff_accepted_at, null);
  const probe = fixture.openProbe();
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 7);
  assert.deepEqual(
    probe.prepare("PRAGMA table_info('receiver_standing_deliveries')").all()
      .map((column) => column.name).slice(-4),
    ["handoff_id", "runtime_admission_json", "handoff_receipt_json", "handoff_accepted_at"],
  );
  store.close();
});

function standingChallenge(suffix) {
  return {
    challenge_id: `standing_challenge_${suffix}`,
    manifest_id: `standing_manifest_${suffix}`,
    manifest_json: JSON.stringify({ signature: { key_id: `standing_host_key_${suffix}` } }),
    expected_origin: "https://host.example",
    effective_expires_at: "2026-09-04T03:25:00.000Z",
    status: "approved",
    decision_id: `standing_decision_${suffix}`,
    decision_action: "approve",
    subject_id: `subject_${suffix}`,
    created_at: "2026-09-03T03:05:00.000Z",
    decided_at: "2026-09-03T03:05:00.000Z",
  };
}

function standingGrant(suffix, overrides = {}) {
  return {
    grant_id: `standing_grant_${suffix}`,
    challenge_id: `standing_challenge_${suffix}`,
    manifest_id: `standing_manifest_${suffix}`,
    binding_id: `standing_binding_${suffix}`,
    subject_id: `subject_${suffix}`,
    delivery_target_id: `target_${suffix}`,
    correlation_id: `correlation_${suffix}`,
    issuer_origin: "https://host.example",
    issuer_key_id: `standing_host_key_${suffix}`,
    issuer_key_fingerprint: PINNED_KEY_FINGERPRINT,
    workflow_type: "test.workflow",
    workflow_id: `workflow_${suffix}`,
    event_type: "workflow.ready",
    canonical_url: `https://host.example/workflows/workflow_${suffix}`,
    expires_at: "2026-09-04T03:25:00.000Z",
    human_boundary: "explicit_receiver_consent",
    instruction: "Review the approved workflow and prepare the next safe step.",
    authorization_mode: "standing",
    max_active_activations: 1,
    last_event_sequence: 0,
    revoked_at: null,
    receipt_json: JSON.stringify({ grant_id: `standing_grant_${suffix}` }),
    created_at: "2026-09-03T03:05:00.000Z",
    ...overrides,
  };
}

function createLegacyDatabase(filename, version) {
  const database = new DatabaseSync(filename);
  let schema = SCHEMA_SQL.replace(STANDING_KEY_PIN_TRIGGERS_SQL, "");
  if (version < 6) {
    schema = schema.replace(
      `  issuer_key_fingerprint TEXT NOT NULL DEFAULT '${STANDING_LEGACY_KEY_FINGERPRINT}',\n`,
      "",
    );
  }
  const keyDefinition = `  issuer_key_id TEXT NOT NULL DEFAULT '${LEGACY_KEY_ID}',\n`;
  assert.ok(schema.includes(keyDefinition));
  schema = schema.replace(keyDefinition, version === 4 ? "" : "  issuer_key_id TEXT NOT NULL,\n");
  database.exec(schema);
  if (version < 7) {
    database.exec("DROP INDEX receiver_standing_deliveries_handoff_id");
    for (const column of [
      "handoff_id",
      "runtime_admission_json",
      "handoff_receipt_json",
      "handoff_accepted_at",
    ]) {
      database.exec(`ALTER TABLE receiver_standing_deliveries DROP COLUMN ${column}`);
    }
  }
  database.exec(`PRAGMA user_version = ${version}`);
  return database;
}

function seedLegacyStandingHistory(database, grant, version) {
  const suffix = grant.grant_id.slice("standing_grant_".length);
  rawInsert(database, "receiver_standing_challenges", standingChallenge(suffix));
  const legacyGrant = { ...grant };
  delete legacyGrant.issuer_key_fingerprint;
  if (version === 4) delete legacyGrant.issuer_key_id;
  rawInsert(database, "receiver_standing_grants", legacyGrant);
  rawInsert(database, "receiver_standing_events", {
    event_id: `standing_event_${suffix}`,
    grant_id: grant.grant_id,
    event_sequence: 1,
    canonical_body: JSON.stringify({ event_id: `standing_event_${suffix}` }),
    acceptance_json: JSON.stringify({ accepted: true }),
    received_at: "2026-09-03T03:05:30.000Z",
  });
  rawInsert(database, "receiver_standing_deliveries", {
    delivery_id: `standing_delivery_${suffix}`,
    event_id: `standing_event_${suffix}`,
    grant_id: grant.grant_id,
    delivery_target_id: grant.delivery_target_id,
    status: "pending",
    created_at: "2026-09-03T03:05:30.000Z",
    updated_at: "2026-09-03T03:05:30.000Z",
  });
}

function snapshotRows(database) {
  return Object.fromEntries([
    "receiver_challenges",
    "receiver_standing_challenges",
    "receiver_standing_events",
    "receiver_standing_deliveries",
  ].map((table) => [
    table,
    database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all().map((row) => {
      const copy = { ...row };
      if (table === "receiver_standing_deliveries") {
        delete copy.handoff_id;
        delete copy.runtime_admission_json;
        delete copy.handoff_receipt_json;
        delete copy.handoff_accepted_at;
      }
      return copy;
    }),
  ]));
}

function rawInsert(database, table, record) {
  const fields = Object.keys(record);
  database.prepare(`
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES (${fields.map(() => "?").join(", ")})
  `).run(...Object.values(record));
}

function removeStandingSchema(database) {
  database.exec(`
    DROP TABLE receiver_standing_deliveries;
    DROP TABLE receiver_standing_events;
    DROP TABLE receiver_standing_grants;
    DROP TABLE receiver_standing_challenges;
  `);
}

async function databaseFixture(t, label) {
  const directory = await mkdtemp(join(tmpdir(), `webmcp-sqlite-${label}-`));
  const filename = join(directory, "receiver.sqlite");
  const handles = [];
  t.after(async () => {
    for (const handle of handles.reverse()) handle.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });
  return {
    filename,
    openStore() {
      const store = new SqliteReceiverStore({ filename });
      handles.push(store);
      return store;
    },
    openProbe() {
      const probe = new DatabaseSync(filename);
      handles.push(probe);
      return probe;
    },
  };
}

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
