import test from "node:test";
import assert from "node:assert/strict";
import { approvedEnrollment, testRuntime } from "./helpers.mjs";

test("Site Tool inventory is state-derived and never exposes human commit", async () => {
  const runtime = testRuntime();
  assert.deepEqual(runtime.domain.siteToolNames(), [
    "get_workflow_context",
    "prepare_artifact",
    "get_reentry_offer",
    "register_reentry_binding",
  ]);
  assert.equal(runtime.domain.siteToolNames().includes("commit_artifact"), false);

  runtime.domain.prepareArtifact({ content: "Initial revision", expected_revision: 0 }, "corr_state");
  await approvedEnrollment(runtime, "corr_state");
  runtime.domain.transitionToReady("corr_state");
  assert.deepEqual(runtime.domain.siteToolNames(), ["get_workflow_context", "continue_artifact"]);
  assert.equal(runtime.domain.siteToolNames().includes("prepare_artifact"), false);
  assert.equal(runtime.domain.siteToolNames().includes("commit_artifact"), false);
  runtime.domain.commitByHuman("corr_state");
  assert.deepEqual(runtime.domain.siteToolNames(), ["get_workflow_context"]);
  runtime.database.close();
});

test("transition rejects a state race at the SQL compare-and-swap boundary", async () => {
  const runtime = testRuntime();
  await approvedEnrollment(runtime, "corr_transition_race");
  const readWorkflow = runtime.domain.getWorkflow.bind(runtime.domain);
  let injectRace = true;
  runtime.domain.getWorkflow = () => {
    const workflow = readWorkflow();
    if (injectRace) {
      injectRace = false;
      runtime.database.prepare(`
        UPDATE workflows SET state = 'READY', state_version = 2 WHERE workflow_id = 'WF-001'
      `).run();
    }
    return workflow;
  };

  assert.throws(
    () => runtime.domain.transitionToReady("corr_transition_race"),
    /state changed during transition/,
  );
  assert.equal(readWorkflow().state, "READY");
  runtime.database.close();
});

test("continuation updates the same artifact with state and revision guards", async () => {
  const runtime = testRuntime();
  const prepared = runtime.domain.prepareArtifact({
    content: "Initial revision",
    expected_revision: 0,
  }, "corr_continue");
  await approvedEnrollment(runtime, "corr_continue");
  const { workflow: ready } = runtime.domain.transitionToReady("corr_continue");
  const continued = runtime.domain.continueArtifact({
    content: "Initial revision\n\nStage-B continuation",
    expected_state_version: ready.state_version,
    expected_revision: prepared.artifact.revision,
  }, "corr_continue");

  assert.equal(continued.artifact.id, "continuation_note");
  assert.equal(continued.artifact.revision, 2);
  assert.match(continued.artifact.content, /Stage-B continuation/);
  assert.equal(continued.human_boundary.committed, false);
  assert.throws(
    () => runtime.domain.continueArtifact({
      content: "Stale write",
      expected_state_version: ready.state_version,
      expected_revision: 1,
    }, "corr_continue"),
    /revision is stale/,
  );
  runtime.database.close();
});

test("preparation rejects an artifact race at the SQL compare-and-swap boundary", () => {
  const runtime = testRuntime();
  const readWorkflow = runtime.domain.getWorkflow.bind(runtime.domain);
  let injectRace = true;
  runtime.domain.getWorkflow = () => {
    const workflow = readWorkflow();
    if (injectRace) {
      injectRace = false;
      runtime.database.prepare(`
        UPDATE workflows
        SET artifact_content = 'Concurrent preparation', artifact_revision = 1
        WHERE workflow_id = 'WF-001'
      `).run();
    }
    return workflow;
  };

  assert.throws(
    () => runtime.domain.prepareArtifact({
      content: "Stale preparation",
      expected_revision: 0,
    }, "corr_prepare_race"),
    /changed during preparation/,
  );
  const stored = readWorkflow();
  assert.equal(stored.artifact.content, "Concurrent preparation");
  assert.equal(stored.artifact.revision, 1);
  runtime.database.close();
});

test("continuation rejects a commit race at the SQL compare-and-swap boundary", async () => {
  const runtime = testRuntime();
  const prepared = runtime.domain.prepareArtifact({
    content: "Initial revision",
    expected_revision: 0,
  }, "corr_continue_race");
  await approvedEnrollment(runtime, "corr_continue_race");
  const { workflow: ready } = runtime.domain.transitionToReady("corr_continue_race");
  const readWorkflow = runtime.domain.getWorkflow.bind(runtime.domain);
  let injectRace = true;
  runtime.domain.getWorkflow = () => {
    const workflow = readWorkflow();
    if (injectRace) {
      injectRace = false;
      runtime.database.prepare(`
        UPDATE workflows SET committed = 1 WHERE workflow_id = 'WF-001'
      `).run();
    }
    return workflow;
  };

  assert.throws(
    () => runtime.domain.continueArtifact({
      content: "Continuation after a concurrent commit",
      expected_state_version: ready.state_version,
      expected_revision: prepared.artifact.revision,
    }, "corr_continue_race"),
    /changed during continuation/,
  );
  const stored = readWorkflow();
  assert.equal(stored.artifact.content, "Initial revision");
  assert.equal(stored.artifact.revision, 1);
  assert.equal(stored.human_boundary.committed, true);
  runtime.database.close();
});

test("human commit rejects an artifact race at the SQL compare-and-swap boundary", async () => {
  const runtime = testRuntime();
  runtime.domain.prepareArtifact({
    content: "Initial revision",
    expected_revision: 0,
  }, "corr_commit_race");
  await approvedEnrollment(runtime, "corr_commit_race");
  runtime.domain.transitionToReady("corr_commit_race");
  const readWorkflow = runtime.domain.getWorkflow.bind(runtime.domain);
  let injectRace = true;
  runtime.domain.getWorkflow = () => {
    const workflow = readWorkflow();
    if (injectRace) {
      injectRace = false;
      runtime.database.prepare(`
        UPDATE workflows
        SET artifact_content = 'Concurrent continuation', artifact_revision = 2
        WHERE workflow_id = 'WF-001'
      `).run();
    }
    return workflow;
  };

  assert.throws(
    () => runtime.domain.commitByHuman("corr_commit_race"),
    /changed during commit/,
  );
  const stored = readWorkflow();
  assert.equal(stored.artifact.content, "Concurrent continuation");
  assert.equal(stored.artifact.revision, 2);
  assert.equal(stored.human_boundary.committed, false);
  runtime.database.close();
});
