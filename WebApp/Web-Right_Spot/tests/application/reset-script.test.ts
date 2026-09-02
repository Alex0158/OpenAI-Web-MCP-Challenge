import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { WorkflowApplication } from "../../src/server/application/workflow";
import { WORKFLOW_SNAPSHOT_TABLE } from "../../src/server/persistence/workflow-store";
import type { Actor, WorkflowState } from "../../src/server/domain/types";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const NOW = "2026-09-02T00:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const SECOND_TIME = "2026-09-04T10:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
const SCRIPT_PATH = resolve(process.cwd(), "scripts/reset-db.ts");
const TSX_PATH = resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
let sequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

type ResetResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type SnapshotInspection = {
  generation: number;
  snapshotGeneration: number;
  requestState: string | null;
  favourites: number;
  audit: number;
  processedCommands: number;
  listings: number;
  slots: number;
};

function isolatedDirectory(): string {
  sequence += 1;
  const directory = join(TEST_DIRECTORY, `reset-script-${process.pid}-${sequence}`);
  mkdirSync(directory, { recursive: true });
  return directory;
}

function runReset(cwd: string): ResetResult {
  const result = spawnSync(process.execPath, [TSX_PATH, SCRIPT_PATH], {
    cwd,
    encoding: "utf8",
    env: process.env,
  });
  return {
    status: result.status,
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  };
}

function inspectDatabase(databasePath: string): SnapshotInspection {
  const database = new DatabaseSync(databasePath);
  try {
    const metadata = database
      .prepare("SELECT generation FROM foundation_metadata WHERE id = 1")
      .get() as { generation: number };
    const snapshot = database
      .prepare(`SELECT fixture_generation, state_json FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
      .get() as { fixture_generation: number; state_json: string };
    const state = JSON.parse(snapshot.state_json) as WorkflowState;
    return {
      generation: metadata.generation,
      snapshotGeneration: snapshot.fixture_generation,
      requestState: state.request?.state ?? null,
      favourites: state.favourites.length,
      audit: state.audit.length,
      processedCommands: state.processedCommands.length,
      listings: state.listings.length,
      slots: state.slots.length,
    };
  } finally {
    database.close();
  }
}

function canReopen(databasePath: string): { ok: boolean; generation: number | null } {
  try {
    const application = new WorkflowApplication({ databasePath, initialTimestamp: NOW });
    try {
      return { ok: true, generation: application.readState().fixtureGeneration };
    } finally {
      application.close();
    }
  } catch {
    return { ok: false, generation: null };
  }
}

test("db:reset restores the full workflow fixture through repeated real script invocations", () => {
  const cwd = isolatedDirectory();
  const databasePath = join(cwd, "var/rightspot.sqlite");

  const first = runReset(cwd);
  const application = new WorkflowApplication({ databasePath, initialTimestamp: NOW });
  try {
    const draft = application.applyCommand({
      type: "CREATE_REQUEST_DRAFT",
      commandId: "reset-script-draft-1",
      actor: TENANT,
      fixtureGeneration: 1,
      requestId: "request-1",
      expectedRequestVersion: 0,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME, SECOND_TIME],
    }, NOW);
    assert.equal(draft.ok, true);
    const favourite = application.applyFavouriteCommand({
      type: "SAVE_FAVOURITE",
      commandId: "reset-script-favourite-1",
      actor: TENANT,
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      expectedFavouriteVersion: 0,
    }, NOW);
    assert.equal(favourite.ok, true);
  } finally {
    application.close();
  }

  const second = runReset(cwd);
  const afterSecond = inspectDatabase(databasePath);
  const reopenedAfterSecond = canReopen(databasePath);
  const third = runReset(cwd);
  const afterThird = inspectDatabase(databasePath);
  const reopenedAfterThird = canReopen(databasePath);

  assert.deepEqual({
    firstStatus: first.status,
    firstOutput: first.stdout.trim(),
    secondStatus: second.status,
    secondOutput: second.stdout.trim(),
    afterSecond,
    reopenedAfterSecond,
    thirdStatus: third.status,
    thirdOutput: third.stdout.trim(),
    afterThird,
    reopenedAfterThird,
  }, {
    firstStatus: 0,
    firstOutput: "workflow fixture generation 1",
    secondStatus: 0,
    secondOutput: "workflow fixture generation 2",
    afterSecond: {
      generation: 2,
      snapshotGeneration: 2,
      requestState: null,
      favourites: 0,
      audit: 0,
      processedCommands: 0,
      listings: 3,
      slots: 3,
    },
    reopenedAfterSecond: { ok: true, generation: 2 },
    thirdStatus: 0,
    thirdOutput: "workflow fixture generation 3",
    afterThird: {
      generation: 3,
      snapshotGeneration: 3,
      requestState: null,
      favourites: 0,
      audit: 0,
      processedCommands: 0,
      listings: 3,
      slots: 3,
    },
    reopenedAfterThird: { ok: true, generation: 3 },
  });
});
