import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const SAMPLES = 7;
const profilePath = fileURLToPath(new URL("../conformance/run.mjs", import.meta.url));
const expectedResult = {
  profile: "reentry-core-domain-neutral-conformance",
  protocol_version: "0.1",
  status: "passed",
  process_isolation: {
    distinct_roles: true,
    receiver_only_sqlite: true,
  },
  event: {
    accepted: true,
    duplicate: false,
  },
  delivery: {
    claimed: true,
    attempt: 1,
  },
  activation: {
    outcome: "accepted",
    code: "activation_dispatch_accepted",
    calls: 1,
  },
  effect: {
    pre_authorization_rejected: true,
    acknowledged: true,
    duplicate: false,
  },
};

try {
  const measurements = [];
  let outputBytes;
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    const result = measureProfile();
    measurements.push(result.elapsedMs);
    outputBytes ??= result.outputBytes;
    assert.equal(result.outputBytes, outputBytes);
  }
  process.stdout.write(`${JSON.stringify({
    runtime: process.version,
    claim: "sequential cold local source-profile regression baseline; not production or end-to-end latency",
    configuration: {
      samples: SAMPLES,
      fresh_node_process_per_sample: true,
      runner_manages_bounded_ipc_and_cleanup: true,
    },
    startup: summarize(measurements),
    redacted_output_bytes: outputBytes,
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: { code: boundedCode(error?.code) } })}\n`);
  process.exitCode = 1;
}

function measureProfile() {
  const started = performance.now();
  const child = spawnSync(process.execPath, [profilePath], {
    encoding: "utf8",
    maxBuffer: 64 * 1_024,
  });
  const elapsedMs = performance.now() - started;
  if (child.error || child.status !== 0 || child.signal) {
    throw benchmarkError("profile_sample_failed");
  }
  const lines = child.stdout.trim().split(/\r?\n/);
  if (lines.length !== 1 || lines[0].length === 0) {
    throw benchmarkError("profile_output_invalid");
  }
  let parsed;
  try {
    parsed = JSON.parse(lines[0]);
  } catch {
    throw benchmarkError("profile_output_invalid");
  }
  try {
    assert.deepEqual(parsed, expectedResult);
  } catch {
    throw benchmarkError("profile_result_invalid");
  }
  return {
    elapsedMs,
    outputBytes: Buffer.byteLength(lines[0], "utf8"),
  };
}

function summarize(measurements) {
  const sorted = [...measurements].sort((left, right) => left - right);
  return {
    name: "node_process_plus_domain_neutral_conformance_profile",
    samples: sorted.length,
    minimum_ms: round(sorted[0]),
    median_ms: round(sorted[Math.floor(sorted.length / 2)]),
    maximum_ms: round(sorted.at(-1)),
  };
}

function benchmarkError(code) {
  return Object.assign(new Error(code), { code });
}

function boundedCode(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(value)
    ? value
    : "profile_benchmark_failed";
}

function round(value) {
  return Number(value.toFixed(3));
}
