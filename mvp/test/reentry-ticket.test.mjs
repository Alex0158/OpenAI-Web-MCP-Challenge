import { createHmac } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  ReentryTicketError,
  signDeliveryTicket,
  signEffectReceipt,
  verifyDeliveryTicket,
  verifyEffectReceipt,
} from "../src/reentry-ticket.mjs";

const SECRET = "h1-fixture-ticket-secret-32-bytes-minimum";
const NOW = new Date("2026-08-30T12:00:00.000Z");

function deliveryClaims(overrides = {}) {
  return {
    event_id: "evt_h1",
    run_id: "run_h1",
    delivery_id: "delivery_h1",
    grant_id: "grant_h1",
    workflow_id: "WF-001",
    event_type: "WORKFLOW_READY",
    canonical_url: "http://127.0.0.1:4317/workflows/WF-001",
    state_version: 2,
    expires_at: "2026-08-30T12:05:00.000Z",
    ...overrides,
  };
}

function effectClaims(overrides = {}) {
  return {
    event_id: "evt_h1",
    run_id: "run_h1",
    delivery_id: "delivery_h1",
    grant_id: "grant_h1",
    workflow_id: "WF-001",
    request_hash: "sha256_b6126ca4eb4805f050e174af0694ccc0db326c88e657da463dcf32e2c8017369",
    result_revision: 3,
    applied_at: "2026-08-30T12:01:00.000Z",
    ...overrides,
  };
}

function forge(kind, claims) {
  const encoded = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const input = `${kind}.${encoded}`;
  const signature = createHmac("sha256", SECRET).update(input).digest("base64url");
  return `${input}.${signature}`;
}

function assertTicketError(error, code, statusCode) {
  assert.ok(error instanceof ReentryTicketError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
}

test("delivery tickets round-trip with deterministic compact encoding", () => {
  const first = signDeliveryTicket(deliveryClaims(), { secret: SECRET, now: NOW });
  const reorderedInput = {
    workflow_id: "WF-001",
    event_id: "evt_h1",
    expires_at: "2026-08-30T12:05:00.000Z",
    run_id: "run_h1",
    state_version: 2,
    canonical_url: "http://127.0.0.1:4317/workflows/WF-001",
    event_type: "WORKFLOW_READY",
    grant_id: "grant_h1",
    delivery_id: "delivery_h1",
  };
  const second = signDeliveryTicket(reorderedInput, { secret: SECRET, now: NOW });

  assert.equal(first, second);
  assert.deepEqual(
    verifyDeliveryTicket(first, { secret: SECRET, now: NOW }),
    deliveryClaims(),
  );
  assert.equal(first.split(".").length, 3);
  assert.equal(first.includes("="), false);
});

test("effect receipts round-trip and bind the Host effect result", () => {
  const receipt = signEffectReceipt(effectClaims(), { secret: SECRET });

  assert.deepEqual(verifyEffectReceipt(receipt, { secret: SECRET }), effectClaims());
});

test("payload and signature tampering fail constant-time signature verification", () => {
  const ticket = signDeliveryTicket(deliveryClaims(), { secret: SECRET, now: NOW });
  const [kind, payload, signature] = ticket.split(".");
  const tamperedPayload = `${payload.slice(0, -1)}${payload.at(-1) === "A" ? "B" : "A"}`;
  const tamperedSignature = `${signature.slice(0, -1)}${signature.at(-1) === "A" ? "B" : "A"}`;

  for (const candidate of [
    `${kind}.${tamperedPayload}.${signature}`,
    `${kind}.${payload}.${tamperedSignature}`,
  ]) {
    assert.throws(
      () => verifyDeliveryTicket(candidate, { secret: SECRET, now: NOW }),
      (error) => assertTicketError(error, "ticket_signature_invalid", 401),
    );
  }
});

test("delivery verification rejects expired and non-canonical timestamps", () => {
  const ticket = signDeliveryTicket(deliveryClaims(), { secret: SECRET, now: NOW });
  assert.throws(
    () => verifyDeliveryTicket(ticket, {
      secret: SECRET,
      now: new Date("2026-08-30T12:05:00.000Z"),
    }),
    (error) => assertTicketError(error, "ticket_expired", 410),
  );

  const nonCanonical = forge("h1d1", deliveryClaims({
    expires_at: "2026-08-30T12:05:00Z",
  }));
  assert.throws(
    () => verifyDeliveryTicket(nonCanonical, { secret: SECRET, now: NOW }),
    (error) => assertTicketError(error, "ticket_claim_invalid", 422),
  );

  assert.throws(
    () => signEffectReceipt(effectClaims({ applied_at: "2026-08-30T12:01:00Z" }), {
      secret: SECRET,
    }),
    (error) => assertTicketError(error, "ticket_claim_invalid", 422),
  );
});

test("delivery tickets and effect receipts cannot be confused", () => {
  const ticket = signDeliveryTicket(deliveryClaims(), { secret: SECRET, now: NOW });
  const receipt = signEffectReceipt(effectClaims(), { secret: SECRET });

  assert.throws(
    () => verifyEffectReceipt(ticket, { secret: SECRET }),
    (error) => assertTicketError(error, "ticket_kind_mismatch", 422),
  );
  assert.throws(
    () => verifyDeliveryTicket(receipt, { secret: SECRET, now: NOW }),
    (error) => assertTicketError(error, "ticket_kind_mismatch", 422),
  );
});

test("signed payloads with extra, missing, or reordered fields fail the strict contract", () => {
  const extra = forge("h1d1", { ...deliveryClaims(), prompt: "continue anyway" });
  const { event_id: _eventId, ...missingClaims } = deliveryClaims();
  const missing = forge("h1d1", missingClaims);
  const reorderedClaims = {
    run_id: "run_h1",
    event_id: "evt_h1",
    delivery_id: "delivery_h1",
    grant_id: "grant_h1",
    workflow_id: "WF-001",
    event_type: "WORKFLOW_READY",
    canonical_url: "http://127.0.0.1:4317/workflows/WF-001",
    state_version: 2,
    expires_at: "2026-08-30T12:05:00.000Z",
  };
  const reordered = forge("h1d1", reorderedClaims);

  for (const candidate of [extra, missing, reordered]) {
    assert.throws(
      () => verifyDeliveryTicket(candidate, { secret: SECRET, now: NOW }),
      (error) => assertTicketError(
        error,
        candidate === reordered ? "ticket_payload_noncanonical" : "ticket_fields_invalid",
        422,
      ),
    );
  }
});
