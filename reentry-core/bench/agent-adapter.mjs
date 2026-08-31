import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  createAgentActivation,
  dispatchAgentActivation,
} from "../src/agent-adapter.mjs";
import { continuationReceipt } from "../test/fixtures.mjs";

const ITERATIONS = 10_000;
const WARMUP_ITERATIONS = 1_000;
const COLD_IMPORT_ITERATIONS = 10;
const NOW = new Date("2026-08-31T12:00:00.000Z");
const lease = {
  type: "webmcp.delivery_lease",
  protocol_version: "0.1",
  delivery_id: "delivery_benchmark_001",
  event_id: "event_benchmark_001",
  attempt: 1,
  lease_token: Buffer.alloc(32, 9).toString("base64url"),
  lease_expires_at: "2026-08-31T12:05:00.000Z",
  continuation: {
    correlation_id: "correlation_001",
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    event_sequence: 1,
    state_version: 4,
    occurred_at: "2026-08-31T11:59:00.000Z",
    canonical_url: "https://host.example/workflows/workflow_001",
  },
  receipt: continuationReceipt({
    grant_id: "grant_benchmark_001",
    expires_at: "2026-08-31T13:00:00.000Z",
  }),
};
const adapter = {
  activate(activation) {
    return {
      type: AGENT_ACTIVATION_RESULT_TYPE,
      protocol_version: "0.1",
      delivery_id: activation.delivery_id,
      event_id: activation.event_id,
      attempt: activation.attempt,
      outcome: "accepted",
      code: "activation_dispatch_accepted",
      unavailable_capability: null,
    };
  },
};

function measure(name, operation) {
  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) operation();
  const started = performance.now();
  for (let index = 0; index < ITERATIONS; index += 1) operation();
  return result(name, performance.now() - started);
}

async function measureAsync(name, operation) {
  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) await operation();
  const started = performance.now();
  for (let index = 0; index < ITERATIONS; index += 1) await operation();
  return result(name, performance.now() - started);
}

function result(name, elapsedMs) {
  return {
    name,
    iterations: ITERATIONS,
    elapsed_ms: Number(elapsedMs.toFixed(3)),
    ops_per_second: Math.round((ITERATIONS * 1_000) / elapsedMs),
  };
}

function measureColdImport() {
  const measurements = [];
  const moduleUrl = new URL("../src/agent-adapter.mjs", import.meta.url).href;
  const script = `import(${JSON.stringify(moduleUrl)})`;
  for (let index = 0; index < COLD_IMPORT_ITERATIONS; index += 1) {
    const started = performance.now();
    const child = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
      encoding: "utf8",
      timeout: 5_000,
    });
    const elapsedMs = performance.now() - started;
    if (child.status !== 0 || child.error) {
      throw new Error("Cold Agent Adapter import did not exit cleanly");
    }
    measurements.push(elapsedMs);
  }
  measurements.sort((left, right) => left - right);
  return {
    name: "node_process_plus_agent_subpath_import",
    iterations: COLD_IMPORT_ITERATIONS,
    minimum_ms: Number(measurements[0].toFixed(3)),
    median_ms: Number(measurements[Math.floor(measurements.length / 2)].toFixed(3)),
    maximum_ms: Number(measurements.at(-1).toFixed(3)),
  };
}

console.log(JSON.stringify({
  runtime: process.version,
  claim: "single-process deterministic local regression baseline; not Agent or service latency",
  startup: measureColdImport(),
  results: [
    measure("activation_derive", () => createAgentActivation({ lease, now: NOW })),
    await measureAsync("accepted_dispatch", () => dispatchAgentActivation({
      adapter,
      lease,
      now: NOW,
      timeoutMs: 1_000,
    })),
  ],
}, null, 2));
