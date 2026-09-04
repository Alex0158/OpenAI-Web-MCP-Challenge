import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import { createStandingContinuationReceipt, STANDING_PROTOCOL_VERSION } from "@webmcp-challenge/reentry-core/standing-protocol";
import { LocalConnector } from "../src/local-connector.mjs";
import { LocalHandoffJournalStore } from "../src/handoff-journal.mjs";

const NOW = new Date("2026-09-04T12:00:00.000Z");
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");

test("journal quarantines a runtime-unknown outcome and never requeues the same task", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-connector-journal-"));
  try {
    const lease = standingLease();
    const client = new FakeStandingClient({ leases: [lease, lease] });
    let adapterCalls = 0;
    const journal = new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") });
    const connector = new LocalConnector({
      client,
      adapter: {
        async admitNotification() {
          adapterCalls += 1;
          throw new Error("runtime response was lost");
        },
      },
      clock: () => NOW,
      activationTimeoutMs: 1_000,
      createClaimToken: () => CLAIM_TOKEN,
      handoffJournal: journal,
    });

    const first = await connector.runOnce();
    assert.equal(first.admission.outcome, "outcome_unknown");
    assert.equal(first.receipt, null);
    assert.equal(adapterCalls, 1);
    assert.equal((await journal.get({ handoffId: first.handoff_id })).state, "runtime_unknown");

    const second = await connector.runOnce();
    assert.equal(second.admission, null);
    assert.equal(second.receipt, null);
    assert.equal(second.handoff_error.outcome, "outcome_unknown");
    assert.equal(adapterCalls, 1);
    assert.equal(client.handoffCalls.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("journal retries only the Receiver with one stored admission and settles after its receipt", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-connector-journal-"));
  try {
    const lease = standingLease();
    const client = new FakeStandingClient({
      leases: [lease, lease, lease],
      handoffResponses: ["network", "success", "success"],
    });
    const journal = new LocalHandoffJournalStore({ filename: join(directory, "handoff-journal.json") });
    let adapterCalls = 0;
    const connector = new LocalConnector({
      client,
      adapter: {
        async admitNotification({ activation, handoffId, now }) {
          adapterCalls += 1;
          return {
            type: "webmcp.runtime_admission_attestation",
            protocol_version: STANDING_PROTOCOL_VERSION,
            admission_id: "admission_journal_001",
            adapter_id: "codex_queue_local",
            binding_generation: "b".repeat(64),
            delivery_id: activation.delivery_id,
            event_id: activation.event_id,
            handoff_id: handoffId,
            accepted_at: now.toISOString(),
          };
        },
      },
      clock: () => NOW,
      activationTimeoutMs: 1_000,
      createClaimToken: () => CLAIM_TOKEN,
      handoffJournal: journal,
    });

    const first = await connector.runOnce();
    assert.equal(first.admission.outcome, "admitted");
    assert.equal(first.receipt, null);
    assert.equal(first.handoff_error.outcome, "outcome_unknown");
    assert.equal(adapterCalls, 1);
    assert.equal(client.handoffCalls.length, 1);
    assert.equal((await journal.get({ handoffId: first.handoff_id })).state, "handoff_pending");

    const second = await connector.runOnce();
    assert.equal(second.admission.outcome, "admitted");
    assert.equal(second.admission.code, "runtime_admission_recovered");
    assert.equal(second.receipt.status, "handed_off");
    assert.equal(adapterCalls, 1);
    assert.equal(client.handoffCalls.length, 2);
    assert.deepEqual(client.handoffCalls[0].runtimeAdmissionAttestation, client.handoffCalls[1].runtimeAdmissionAttestation);
    assert.equal((await journal.get({ handoffId: first.handoff_id })).state, "handed_off");

    const third = await connector.runOnce();
    assert.equal(third.receipt.status, "handed_off");
    assert.equal(adapterCalls, 1);
    assert.equal(client.handoffCalls.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

class FakeStandingClient extends LocalConnectorClient {
  #leases;
  #handoffResponses;
  handoffCalls = [];

  constructor({ leases, handoffResponses = [] }) {
    super({
      baseUrl: "https://receiver.example",
      connectorToken: Buffer.alloc(32, 8).toString("base64url"),
      requestTimeoutMs: 1_000,
      protocolVersion: STANDING_PROTOCOL_VERSION,
    });
    this.#leases = [...leases];
    this.#handoffResponses = [...handoffResponses];
  }

  async claimDelivery() {
    const lease = this.#leases.shift() ?? null;
    return lease === null ? null : { duplicate: false, lease };
  }

  async handoffNotification(input) {
    this.handoffCalls.push(input);
    const response = this.#handoffResponses.shift() ?? "success";
    if (response === "network") {
      const error = new Error("Receiver connection was lost");
      error.code = "connector_network_error";
      throw error;
    }
    return {
      type: "webmcp.notification_handoff_receipt",
      protocol_version: STANDING_PROTOCOL_VERSION,
      delivery_id: input.deliveryId,
      event_id: input.eventId,
      handoff_id: input.handoffId,
      correlation_id: "correlation_journal_001",
      workflow_id: "workflow_journal_001",
      status: "handed_off",
      duplicate: response === "duplicate",
      runtime_admission_ref: input.runtimeAdmissionAttestation.admission_id,
    };
  }
}

function standingLease() {
  const expiresAt = new Date(NOW.getTime() + 5 * 60_000).toISOString();
  return {
    type: "webmcp.delivery_lease",
    protocol_version: STANDING_PROTOCOL_VERSION,
    delivery_id: "delivery_journal_001",
    event_id: "event_journal_001",
    attempt: 1,
    lease_token: CLAIM_TOKEN,
    lease_expires_at: expiresAt,
    continuation: {
      correlation_id: "correlation_journal_001",
      workflow_id: "workflow_journal_001",
      event_type: "soldier.returned",
      event_sequence: 4,
      state_version: 9,
      occurred_at: NOW.toISOString(),
      canonical_url: "https://game.example/kingdom",
      instruction: "Read the current game state and decide according to the established strategy.",
    },
    receipt: createStandingContinuationReceipt({
      type: "webmcp.continuation_receipt",
      protocol_version: STANDING_PROTOCOL_VERSION,
      grant_id: "grant_journal_001",
      correlation_id: "correlation_journal_001",
      issuer_origin: "https://game.example",
      workflow_id: "workflow_journal_001",
      event_type: "soldier.returned",
      canonical_url: "https://game.example/kingdom",
      expires_at: expiresAt,
      human_boundary: "explicit_receiver_consent",
      authorization_mode: "standing",
      max_active_activations: 1,
      continuation_mode: "open_canonical_page_read_current_state",
    }),
  };
}
