import { performance } from "node:perf_hooks";

import {
  createContinuationEventEnvelope,
  createReentryManifest,
  validateReentryManifest,
  verifyContinuationEventEnvelope,
} from "../src/protocol.mjs";
import {
  FIXED_NOW,
  HOST_ORIGIN,
  continuationEvent,
  createTestKeys,
  manifestValue,
} from "../test/fixtures.mjs";

const ITERATIONS = 5_000;
const WARMUP_ITERATIONS = 500;
const KEY_ID = "host_key_benchmark";
const { privateKey, publicKey } = createTestKeys();
const manifestInput = manifestValue();
const eventInput = continuationEvent();
const manifest = createReentryManifest(manifestInput, {
  privateKey,
  keyId: KEY_ID,
});
const eventEnvelope = createContinuationEventEnvelope(eventInput, {
  privateKey,
  keyId: KEY_ID,
  timestamp: "1788145440",
});
const verificationOptions = {
  now: FIXED_NOW,
  expectedOrigin: HOST_ORIGIN,
  keyResolver: () => publicKey,
};

function measure(name, operation) {
  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) operation();
  const started = performance.now();
  for (let index = 0; index < ITERATIONS; index += 1) operation();
  const elapsedMs = performance.now() - started;
  return {
    name,
    iterations: ITERATIONS,
    elapsed_ms: Number(elapsedMs.toFixed(3)),
    ops_per_second: Math.round((ITERATIONS * 1_000) / elapsedMs),
  };
}

console.log(JSON.stringify({
  runtime: process.version,
  claim: "single-process local regression baseline; not an SLA",
  payload_bytes: {
    manifest: Buffer.byteLength(JSON.stringify(manifest), "utf8"),
    event_body: Buffer.byteLength(eventEnvelope.body, "utf8"),
  },
  results: [
    measure("manifest_sign", () => createReentryManifest(manifestInput, {
      privateKey,
      keyId: KEY_ID,
    })),
    measure("manifest_verify", () => validateReentryManifest(
      manifest,
      verificationOptions,
    )),
    measure("event_sign", () => createContinuationEventEnvelope(eventInput, {
      privateKey,
      keyId: KEY_ID,
      timestamp: "1788145440",
    })),
    measure("event_verify", () => verifyContinuationEventEnvelope(
      eventEnvelope,
      verificationOptions,
    )),
  ],
}, null, 2));
