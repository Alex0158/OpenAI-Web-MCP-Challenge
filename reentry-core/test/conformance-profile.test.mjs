import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { spawnProfileProcess } from "../conformance/process-rpc.mjs";

const execFileAsync = promisify(execFile);
const PROFILE_FIELDS = [
  "activation",
  "delivery",
  "effect",
  "event",
  "process_isolation",
  "profile",
  "protocol_version",
  "status",
];
const PRIVATE_VALUES = [
  "connector_conformance_fixture_token",
  "decision_conformance_fixture_token",
  Buffer.alloc(32, 13).toString("base64url"),
  "effect_conformance_unknown_token",
  "effect_conformance_fixture_token",
  "PRIVATE KEY",
  "PUBLIC KEY",
  "receiver.sqlite",
];

test("domain-neutral conformance profile completes one redacted process-isolated flow", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [fileURLToPath(new URL("../conformance/run.mjs", import.meta.url))],
    { encoding: "utf8", timeout: 15_000, maxBuffer: 64 * 1_024 },
  );
  assert.equal(stderr, "");
  for (const privateValue of PRIVATE_VALUES) {
    assert.equal(stdout.includes(privateValue), false, `profile output leaked ${privateValue}`);
  }

  const result = JSON.parse(stdout);
  assert.deepEqual(Object.keys(result).sort(), PROFILE_FIELDS);
  assert.equal(result.profile, "reentry-core-domain-neutral-conformance");
  assert.equal(result.protocol_version, "0.1");
  assert.equal(result.status, "passed");
  assert.deepEqual(result.process_isolation, {
    distinct_roles: true,
    receiver_only_sqlite: true,
  });
  assert.deepEqual(result.event, { accepted: true, duplicate: false });
  assert.deepEqual(result.delivery, { claimed: true, attempt: 1 });
  assert.deepEqual(result.activation, {
    outcome: "accepted",
    code: "activation_dispatch_accepted",
    calls: 1,
  });
  assert.deepEqual(result.effect, {
    pre_authorization_rejected: true,
    acknowledged: true,
    duplicate: false,
  });
});

test("profile control excludes test-only Grant control and rejects extended input", async (t) => {
  const child = spawnProfileProcess(new URL("../conformance/host-process.mjs", import.meta.url));
  const receiver = spawnProfileProcess(
    new URL("../conformance/receiver-process.mjs", import.meta.url),
  );
  t.after(() => child.terminate());
  t.after(() => receiver.terminate());
  await assert.rejects(child.request("constructor"), { code: "profile_command_unknown" });
  await assert.rejects(
    receiver.request("inspectGrant"),
    { code: "profile_command_unknown" },
  );
  await assert.rejects(
    child.request("createEffect", {
      correlationId: "correlation_conformance_001",
      deliveryId: "delivery_conformance_001",
      eventId: "event_conformance_001",
      workflowId: "workflow_conformance_001",
      leaseToken: "must_not_cross_host_boundary",
    }),
    { code: "profile_effect_context_invalid" },
  );
  await receiver.close();
  await child.close();
});
