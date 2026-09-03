import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createReferenceHost } from "../src/reference-host.mjs";
import { runReferenceSystem } from "../src/reference-system.mjs";

test("complete local reference flow crosses every handoff and survives Receiver reopen", async (t) => {
  const stateDirectory = await mkdtemp(join(tmpdir(), "webmcp-reference-test-"));
  t.after(() => rm(stateDirectory, { recursive: true, force: true }));
  const events = [];

  const result = await runReferenceSystem({
    stateDirectory,
    emit(value) {
      events.push(value);
    },
  });

  assert.equal(result.status, "locally_verified");
  assert.equal(result.host_state.status, "READY_FOR_HUMAN");
  assert.equal(result.host_state.artifact.revision, 1);
  assert.equal(result.host_state.human_boundary.committed, false);
  assert.deepEqual(events.map((value) => value.event), [
    "reference_host_started",
    "reentry_started",
    "host_key_registered",
    "connector_paired",
    "consent_approved",
    "event_accepted",
    "agent_activation_accepted",
    "host_effect_acknowledged",
    "connector_idle",
    "reentry_restarted",
    "restart_replay_verified",
    "reference_system_complete",
  ]);

  const receiverState = await readFile(join(stateDirectory, "receiver.sqlite"));
  const pairingState = await readFile(join(stateDirectory, "pairing.sqlite"));
  for (const event of events) {
    assert.equal("connector_token" in event, false);
    assert.equal("consent_token" in event, false);
    assert.equal("effect_token" in event, false);
    assert.equal("lease_token" in event, false);
  }
  assert.ok(receiverState.length > 0);
  assert.ok(pairingState.length > 0);
});

test("reference Host keeps final commit outside Site Tools and rejects blind control calls", async (t) => {
  const host = createReferenceHost();
  const address = await host.start();
  t.after(() => host.stop());

  const page = await fetch(address.canonicalUrl);
  assert.equal(page.status, 200);
  const source = await page.text();
  assert.match(source, /name:"get_current_workflow_state"/);
  assert.match(source, /name:"update_continuation_draft"/);
  assert.doesNotMatch(source, /name:"(?:commit|submit)[^"]*"/);

  const blindCommit = await fetch(`${address.origin}/api/workflows/workflow_reference_001/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commit_token: "wrong" }),
  });
  assert.equal(blindCommit.status, 403);
  assert.deepEqual(await blindCommit.json(), {
    error: { code: "reference_host_human_control_invalid" },
  });

  assert.equal(await requestWithHost(address, "example.invalid"), 421);
});

function requestWithHost(address, hostHeader) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: "127.0.0.1",
      port: address.port,
      path: `/workflows/workflow_reference_001`,
      method: "GET",
      headers: { Host: hostHeader },
    }, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode));
    });
    request.once("error", reject);
    request.end();
  });
}
