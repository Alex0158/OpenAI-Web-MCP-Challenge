import { createHash, generateKeyPairSync } from "node:crypto";
import { mkdtemp, rmdir, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
  ReceiverCore,
} from "../src/receiver-core.mjs";
import {
  PROTOCOL_VERSION,
  createContinuationEvent,
  createContinuationEventEnvelope,
  createReentryManifest,
} from "../src/protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";

const SAMPLES = 7;
const OPERATIONS_PER_SAMPLE = 16;
const HOST_ORIGIN = "https://host.example";
const KEY_ID = "host_key_receiver_benchmark";
const NOW = new Date("2026-08-31T12:00:00.000Z");
const keys = generateKeyPairSync("ed25519");

try {
  const samples = [];
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    samples.push(await runSample(sample));
  }
  process.stdout.write(`${JSON.stringify(buildResult(samples), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: { code: boundedCode(error?.code) } })}\n`);
  process.exitCode = 1;
}

async function runSample(sample) {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-receiver-benchmark-"));
  const databasePath = join(directory, "receiver.sqlite");
  let store;

  try {
    const startupStarted = performance.now();
    store = new SqliteReceiverStore({ filename: databasePath });
    const startupMs = performance.now() - startupStarted;
    const harness = createHarness(store);
    const items = prepareItems(harness, sample);

    const eventAcceptanceMs = measureBatch(items, (item) => {
      item.acceptance = harness.core.acceptEvent(item.envelope);
    });
    for (const item of items) {
      expect(
        item.acceptance.accepted === true && item.acceptance.duplicate === false,
        "event_result_invalid",
      );
    }

    const deliveryClaimMs = measureBatch(items, (item) => {
      item.claim = harness.core.claimDelivery({
        connectorToken: item.connectorToken,
        claimToken: item.claimToken,
      });
    });
    for (const item of items) {
      expect(item.claim?.duplicate === false, "claim_result_invalid");
      expect(item.claim.lease.attempt === 1, "claim_attempt_invalid");
      const effectToken = `effect_token_${item.identity}`;
      harness.effects.set(effectToken, effectAttestation(item.claim.lease, item.identity));
      item.effectToken = effectToken;
    }

    const acknowledgementMs = measureBatch(items, (item) => {
      item.acknowledgement = harness.core.acknowledgeDelivery({
        connectorToken: item.connectorToken,
        deliveryId: item.claim.lease.delivery_id,
        leaseToken: item.claim.lease.lease_token,
        effectToken: item.effectToken,
      });
    });
    for (const item of items) {
      expect(
        item.acknowledgement.acknowledged === true && item.acknowledgement.duplicate === false,
        "acknowledgement_result_invalid",
      );
      expect(
        store.getDeliveryById(item.claim.lease.delivery_id)?.status === "acknowledged",
        "delivery_state_invalid",
      );
    }

    store.close();
    store = undefined;
    const databaseBytes = await fileSetBytes(databasePath);
    return {
      startupMs,
      eventAcceptanceMs,
      deliveryClaimMs,
      acknowledgementMs,
      databaseBytes,
    };
  } finally {
    store?.close();
    await removeFileSet(databasePath);
    await rmdir(directory);
  }
}

function createHarness(store) {
  const decisions = new Map();
  const connectors = new Map();
  const effects = new Map();
  const counts = new Map();
  const core = new ReceiverCore({
    store,
    keyResolver({ issuerOrigin, keyId, purpose }) {
      if (
        issuerOrigin === HOST_ORIGIN &&
        keyId === KEY_ID &&
        ["manifest", "event"].includes(purpose)
      ) {
        return keys.publicKey;
      }
      return undefined;
    },
    consentAuthority: {
      verifyDecision({ decisionToken }) {
        const decision = decisions.get(decisionToken);
        if (!decision) throw benchmarkError("decision_token_unknown");
        return decision;
      },
    },
    grantControlAuthority: {
      verifyControl() {
        throw benchmarkError("grant_control_not_configured");
      },
    },
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        const connector = connectors.get(connectorToken);
        if (!connector) throw benchmarkError("connector_token_unknown");
        return connector;
      },
    },
    effectAuthority: {
      verifyEffect({ effectToken }) {
        const effect = effects.get(effectToken);
        if (!effect) throw benchmarkError("effect_token_unknown");
        return effect;
      },
    },
    maximumGrantLifetimeMs: 20 * 60_000,
    leaseDurationMs: 60_000,
    maximumDeliveryAttempts: 3,
    clock: () => NOW,
    createId(prefix) {
      const next = (counts.get(prefix) ?? 0) + 1;
      counts.set(prefix, next);
      return `${prefix}_${next}`;
    },
  });
  return { core, decisions, connectors, effects };
}

function prepareItems(harness, sample) {
  const items = [];
  for (let operation = 0; operation < OPERATIONS_PER_SAMPLE; operation += 1) {
    const identity = `${sample}_${operation}`;
    const correlationId = `correlation_${identity}`;
    const workflowId = `workflow_${identity}`;
    const canonicalUrl = `${HOST_ORIGIN}/workflows/${workflowId}`;
    const manifest = createReentryManifest({
      type: "webmcp.reentry_manifest",
      protocol_version: PROTOCOL_VERSION,
      manifest_id: `manifest_${identity}`,
      correlation_id: correlationId,
      issuer_origin: HOST_ORIGIN,
      issued_at: "2026-08-31T11:55:00.000Z",
      offer_expires_at: "2026-08-31T12:05:00.000Z",
      workflow: {
        id: workflowId,
        type: "domain-neutral-workflow",
        state_version: 1,
        canonical_url: canonicalUrl,
      },
      display: {
        title: "Continue this workflow",
        reason: "Authoritative Host state is ready for bounded continuation.",
      },
      grant_request: {
        event_type: "workflow.ready",
        grant_expires_at: "2026-08-31T13:00:00.000Z",
        max_runs: 1,
        human_boundary: "explicit_receiver_consent",
      },
    }, { privateKey: keys.privateKey, keyId: KEY_ID });
    const enrollment = harness.core.createConsentChallenge({
      manifest,
      expectedOrigin: HOST_ORIGIN,
    });
    const decisionToken = `decision_token_${identity}`;
    const deliveryTargetId = `target_${identity}`;
    harness.decisions.set(decisionToken, {
      type: CONSENT_DECISION_TYPE,
      protocol_version: PROTOCOL_VERSION,
      decision_id: `decision_${identity}`,
      challenge_id: enrollment.challenge.challenge_id,
      action: "approve",
      subject_id: "subject_benchmark",
      delivery_target_id: deliveryTargetId,
      decided_at: NOW.toISOString(),
    });
    const approval = harness.core.decideConsent({
      challengeId: enrollment.challenge.challenge_id,
      decisionToken,
    });
    const event = createContinuationEvent({
      type: "webmcp.continuation_event",
      protocol_version: PROTOCOL_VERSION,
      event_id: `event_${identity}`,
      correlation_id: correlationId,
      binding_id: approval.binding.binding_id,
      issuer_origin: HOST_ORIGIN,
      workflow_id: workflowId,
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 2,
      occurred_at: "2026-08-31T11:59:00.000Z",
      canonical_url: canonicalUrl,
    });
    const envelope = createContinuationEventEnvelope(event, {
      privateKey: keys.privateKey,
      keyId: KEY_ID,
      timestamp: String(Math.floor(NOW.getTime() / 1_000)),
    });
    const connectorToken = `connector_token_${identity}`;
    harness.connectors.set(connectorToken, {
      type: CONNECTOR_IDENTITY_TYPE,
      protocol_version: PROTOCOL_VERSION,
      connector_id: `connector_${identity}`,
      subject_id: "subject_benchmark",
      delivery_target_id: deliveryTargetId,
      authenticated_at: "2026-08-31T11:59:00.000Z",
      expires_at: "2026-08-31T12:10:00.000Z",
    });
    items.push({
      identity,
      envelope,
      connectorToken,
      claimToken: tokenFor(`claim_${identity}`),
    });
  }
  return items;
}

function effectAttestation(lease, identity) {
  return {
    type: HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    effect_id: `effect_${identity}`,
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    correlation_id: lease.continuation.correlation_id,
    workflow_id: lease.continuation.workflow_id,
    outcome: HOST_EFFECT_OUTCOME,
    confirmed_at: NOW.toISOString(),
  };
}

function measureBatch(items, operation) {
  const started = performance.now();
  for (const item of items) operation(item);
  return performance.now() - started;
}

function buildResult(samples) {
  return {
    runtime: process.version,
    claim: "file-backed single-process local regression baseline; not a service SLA or capacity claim",
    configuration: {
      samples: SAMPLES,
      operations_per_sample: OPERATIONS_PER_SAMPLE,
      durability: "SQLite WAL with synchronous FULL",
      setup_excluded_from_timed_operations: true,
    },
    startup: summarizeDurations(
      "fresh_file_store_startup",
      samples.map((sample) => sample.startupMs),
    ),
    results: [
      summarize(
        "signed_event_durable_acceptance",
        samples.map((sample) => sample.eventAcceptanceMs),
        OPERATIONS_PER_SAMPLE,
      ),
      summarize(
        "target_scoped_delivery_claim",
        samples.map((sample) => sample.deliveryClaimMs),
        OPERATIONS_PER_SAMPLE,
      ),
      summarize(
        "host_effect_acknowledgement",
        samples.map((sample) => sample.acknowledgementMs),
        OPERATIONS_PER_SAMPLE,
      ),
    ],
    completed_database_file_set_bytes: summarizeIntegers(
      samples.map((sample) => sample.databaseBytes),
    ),
  };
}

function summarize(name, elapsedSamples, operationsPerSample) {
  const perOperation = elapsedSamples
    .map((elapsedMs) => elapsedMs / operationsPerSample)
    .sort((left, right) => left - right);
  const median = perOperation[Math.floor(perOperation.length / 2)];
  return {
    name,
    samples: perOperation.length,
    operations_per_sample: operationsPerSample,
    minimum_ms_per_operation: round(perOperation[0]),
    median_ms_per_operation: round(median),
    maximum_ms_per_operation: round(perOperation.at(-1)),
    median_operations_per_second: Math.round(1_000 / median),
  };
}

function summarizeDurations(name, measurements) {
  const sorted = [...measurements].sort((left, right) => left - right);
  return {
    name,
    samples: sorted.length,
    minimum_ms: round(sorted[0]),
    median_ms: round(sorted[Math.floor(sorted.length / 2)]),
    maximum_ms: round(sorted.at(-1)),
  };
}

function summarizeIntegers(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    minimum: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    maximum: sorted.at(-1),
  };
}

async function fileSetBytes(databasePath) {
  let bytes = 0;
  for (const path of databaseFiles(databasePath)) {
    try {
      bytes += (await stat(path)).size;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return bytes;
}

async function removeFileSet(databasePath) {
  for (const path of databaseFiles(databasePath)) {
    try {
      await unlink(path);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function databaseFiles(databasePath) {
  return [
    databasePath,
    `${databasePath}-journal`,
    `${databasePath}-shm`,
    `${databasePath}-wal`,
  ];
}

function tokenFor(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function expect(condition, code) {
  if (!condition) throw benchmarkError(code);
}

function benchmarkError(code) {
  return Object.assign(new Error(code), { code });
}

function boundedCode(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(value)
    ? value
    : "receiver_benchmark_failed";
}

function round(value) {
  return Number(value.toFixed(3));
}
