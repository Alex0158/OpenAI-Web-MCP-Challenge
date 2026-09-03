# Cloud Receiver Handoff Pack

**Status:** PROPOSED CLOUD RECEIVER V2 INTEGRATION HANDOFF
**Owner:** Local Connector maintainers
**Audience:** Cloud Receiver rebuild team

> **Version scope — Cloud Receiver v2:** This folder is the handoff for the v2 rebuild. Cloud
> Receiver v1 is retired and retained only as historical compatibility evidence. The v2 service
> must implement the acceptance criteria below while preserving Local Connector protocol `0.1`
> compatibility. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md)
> for the v1 runtime disposition.

## Goal

Build the smallest Cloud Receiver that the current Local Connector can use without a client
rewrite. Replace the server internals freely, but preserve the wire contract in these files.

This pack is supporting handoff material. It does not override the canonical Core or Mechanism
documents until the project team accepts a new contract.

The Cloud Receiver v1 runtime is not the implementation target. The acceptance cases added below
are documentation-only contract tests: the Cloud Receiver v2 team must implement them in its
own test runner against its real HTTP handler, persistence, and authority composition.

## Required end-to-end result

```text
pair Mac
-> create approved Connector target
-> accept signed Host Event
-> queue one delivery
-> Connector claims a short lease
-> local adapter runs
-> trusted Host effect is acknowledged
```

## Files

1. [01-pairing-and-credentials.md](01-pairing-and-credentials.md) — pair a Mac and issue a
   delivery-only Connector credential.
2. [02-consent-and-targeting.md](02-consent-and-targeting.md) — connect a Host subject and a user
   selected Connector to one Grant and delivery target.
3. [03-signed-event-ingress.md](03-signed-event-ingress.md) — verify a Host Event and enqueue work.
4. [04-delivery-claim.md](04-delivery-claim.md) — let the Connector claim one leased delivery.
5. [05-delivery-acknowledgement.md](05-delivery-acknowledgement.md) — close a delivery only after
   trusted Host-effect verification.
6. [06-transport-errors-and-operations.md](06-transport-errors-and-operations.md) — common HTTP,
   error, health, security, and debugging rules.
7. [07-open-questions-for-cloud-receiver-team.md](07-open-questions-for-cloud-receiver-team.md) —
   answered implementation decisions and cross-team agreements.
8. [08-v2-build-questions-for-project-manager.md](08-v2-build-questions-for-project-manager.md) —
   consolidated decision questions for the replacement build; non-authoritative until accepted.

## Compatibility rule

The current Connector uses `POST` JSON requests, sends `connector_token` in the JSON body, rejects
redirects, and expects protocol version `0.1`. Do not move the token to an `Authorization` header,
rename fields, or change status meanings without an explicit protocol-version decision.

## Red-green-refactor handoff gate

Use the following sequence for every feature block:

1. **Red:** run the documented cases against the v2 Receiver before the behavior exists. Each
   unsupported case must fail visibly; the v1 `410 receiver_deprecated` response is not a pass.
2. **Green:** implement the smallest Receiver behavior that makes the cases pass, including the
   persistence and authority checks they exercise.
3. **Refactor:** change internal modules, schemas, or deployment details while keeping every case
   green. Re-run the complete matrix before handoff.

The tests must exercise the HTTP boundary and durable state. A unit test that bypasses token scope,
atomic transitions, signature verification, or the configured authority is not sufficient.

| Feature block | Required test IDs | Main contract proved |
|---|---|---|
| Pairing and credentials | `PAIR-001`–`PAIR-005` | one-time pairing, safe replay, token scope |
| Consent and targeting | `CONSENT-001`–`CONSENT-003`, `TARGET-001`–`TARGET-002`, `REVOKE-001` | decision facts, effective status, fixed target, revocation |
| Signed Event ingress | `EVENT-001`–`EVENT-004` | signature/origin checks, deduplication, one queued delivery |
| Delivery claim | `CLAIM-001`–`CLAIM-005` | scoped lease, idempotency, expiry, wrong-target isolation |
| Delivery acknowledgement | `ACK-001`–`ACK-005` | trusted effect proof and atomic acknowledgement |
| Transport and operations | `HTTP-001`–`HTTP-005` | bounded HTTP behavior, stable errors, safe operations |

The Cloud Receiver v2 team should record the test-runner name, commit, environment, and result for every ID.
Never include raw pairing codes, Connector tokens, lease tokens, effect tokens, cookies, or private
keys in that record.

## Non-goals for the first rebuild

- WebSockets, push delivery, or a Receiver-to-Receiver replication layer;
- inbound connections to the user's Mac;
- exposing private bindings or Host credentials to the Connector;
- claiming production identity, recovery, rate limiting, or multi-region capacity; or
- changing the Local Connector or Codex adapter.
