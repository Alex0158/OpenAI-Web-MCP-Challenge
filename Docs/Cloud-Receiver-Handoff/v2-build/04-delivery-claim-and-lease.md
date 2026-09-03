# Feature 04 — Delivery Claim and Lease

**Build gate:** `CLAIM-001`–`CLAIM-005`

**Owner:** Cloud Receiver v2 outbound Connector delivery boundary

**Contract status:** Accepted; Feature 4 implementation is locally verified

**Implementation evidence:** [CLOUD-017](../../Development/CLOUD-017-cloud-receiver-v2-delivery-claim.md)

**Compatibility source:** [Local Connector handoff 04](../04-delivery-claim.md)

## Goal

Let an authenticated Connector claim at most one eligible delivery with a short, bounded lease.
Claims are target-scoped, replay-safe, and durable. No work and terminally exhausted work use the
same exact empty `204` response.

## Accepted v2 defaults

- Maximum delivery attempts: `3`.
- Lease duration: `60 seconds`.
- Local Connector delivery polling interval: `5 seconds`.
- Local Connector delivery request timeout: `5 seconds`.

The `5-second` request timeout applies to delivery transport only. Existing pairing behavior and its
separate pairing timeout remain unchanged. These are the existing PM values; this correction does
not change the Core or Local Connector protocol.

## Wire contract

```http
POST /v0.1/delivery-claims
Content-Type: application/json

{
  "connector_token": "opaque-secret",
  "claim_token": "32-byte-base64url-idempotency-token"
}
```

The Connector sends its token in JSON, not an Authorization header. It sends no browser cookie or
organization API key.

### No work

Return exactly `204 No Content`, an empty body, and no `Content-Type` header. The response uses
`Cache-Control: no-store`, `Content-Length: 0`, `Pragma: no-cache`, and
`X-Content-Type-Options: nosniff`.

An already exhausted delivery, or a delivery that reaches the attempt limit during this claim
transaction, returns this same no-work response. The HTTP caller cannot distinguish no eligible
work from `retry_exhausted`.

### Work available

Return `200` with the exact v0.1 lease and receipt fields defined in the parent handoff. The
`lease_token` must equal the submitted `claim_token`; the response must contain no Connector token
or private binding secret.

## State and transaction rules

1. Hash and verify the Connector token; resolve its fixed `delivery_target_id`.
2. Hash the claim token; never persist the raw value.
3. Select one eligible `PENDING` delivery for that target.
4. Atomically transition `PENDING -> LEASED`, assign attempt number, lease expiry, and claim digest.
5. If the same claim digest is replayed while the lease is live, return the same lease with
   `duplicate: true`.
6. Do not issue a second live lease for the same target/delivery.
7. Reclaim expired leases only within the configured attempt bound. When the third attempt expires,
   persist `retry_exhausted` with `current_attempt = 3` and return the same empty `204` response as
   no work; do not loop forever or expose exhaustion over the v0.1 wire.
8. Ensure lease expiry is in the future and no later than receipt, Grant, or Connector expiry.

The lease and receipt identifiers must agree exactly with the stored Event, Grant, workflow,
correlation, canonical URL, and human boundary. Continuation data must be safe for the local
adapter and must not include secrets or private bindings.

## Minimal data design

Keep lease state on the delivery row or in one delivery-state row:

- delivery id, Event id, Grant id, target id, state, attempt count;
- current claim digest, lease start/expiry, and current lease token digest;
- immutable receipt context and acknowledgement/effect reference;
- unique live-lease constraint or transaction lock per delivery/target.

Use a transaction/compare-and-set for claim, replay, and expired-lease reclaim. Process memory is
not sufficient.

## Red tests

| ID | Arrange and act | Required assertion |
|---|---|---|
| `CLAIM-001` | Valid Connector posts exactly `connector_token` and `claim_token`, once with work and once without. | Work: canonical `200` lease. No work: empty `204` with no `Content-Type`; no browser/org auth required. |
| `CLAIM-002` | Replay the same claim token while its lease is live. | Same lease; `duplicate: true`; one delivery, one live lease, one attempt; lease token equals submitted claim token. |
| `CLAIM-003` | Use a **fresh claim token** with another valid target; separately reuse the current claim token from another Connector; separately use an invalid Connector token. | Fresh wrong-target claim receives `204` with no state/secret leak. Same-token cross-Connector replay remains a scope error. Invalid identity receives `401`/`403 connector_identity_invalid`. |
| `CLAIM-004` | Let a lease expire, reclaim with fresh tokens until the third attempt, then claim again. | Attempts increment atomically to `3`; the expired third lease transitions to durable `retry_exhausted`; the next claim returns the same empty `204` as no work, with no exhaustion error on the v0.1 wire and no unbounded loop. |
| `CLAIM-005` | Inspect a successful lease with boundary timestamps and receipt fields. | Future lease expiry; expiry ordering is valid; identifiers/context agree; canonical JSON; no secret/private binding. |

Inspect durable state after concurrent claim races, same-token replay, expired lease, and wrong-target
cases.

## Green implementation order

1. Add Connector digest lookup and fixed target resolution.
2. Add eligible-delivery query with target and Grant effective-state checks.
3. Add atomic lease creation and attempt counting.
4. Add exact no-work response handling.
5. Add same-token replay and expired-lease reclaim.
6. Add bounded attempt exhaustion, the `retry_exhausted` durable state, and exact receipt/continuation projection.
7. Add stable identity, conflict, and persistence error mapping.

## Refactor checklist

- Test concurrent claims with two distinct Connector processes.
- Test process restart while a lease is live and after it expires.
- Keep no-work and exhausted behavior intentionally identical on the wire, while distinguishing them
  through durable-state inspection.
- Use a fresh claim token for a genuine wrong-target test; assert a same-token replay from another
  Connector is a scope error.
- Keep the raw claim token out of logs and database rows while still returning the same lease on
  replay.
- Re-run all earlier Pairing, Consent, Target, Revocation, and Event tests after delivery indexes
  or transaction code changes.

## Exit condition

Do not start Acknowledgement until every Claim case passes through the real Connector HTTP client
policy and durable lease state. This Feature 4 gate does not authorize any acknowledgement route or
Connector protocol change.

## Feature 4 integration questions

These questions are for the Cloud Receiver v2 implementation team. They clarify implementation and
evidence without changing the accepted v0.1 contract:

1. Which PostgreSQL transaction/lock or compare-and-set protects two concurrent claims from creating
   two live leases for one delivery?
2. What deterministic ordering selects one delivery when several eligible deliveries share a target?
3. How will the test harness inspect `retry_exhausted`, `current_attempt`, lease expiry, and raw-token
   absence directly in PostgreSQL without adding a production inspection route?
4. Which configured Connector authority verifies token scope, and which exact stable error does it
   return for invalid identity versus a valid Connector outside the delivery scope?
5. After a process restart, how are live leases preserved and expired leases reclaimed without
   reusing an old claim token?
6. How will the v2 tests inject a deterministic clock and persistence contention while exercising
   the real HTTP handler?

The agreed answers must be recorded with the Feature 4 verification evidence. They must not add
pairing fields, move the Connector token to an authorization header, expose exhaustion as a new HTTP
status, or implement Acknowledgement.
