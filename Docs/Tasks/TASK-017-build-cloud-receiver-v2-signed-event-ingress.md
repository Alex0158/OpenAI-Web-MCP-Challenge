# TASK-017: Build Cloud Receiver v2 Signed Event Ingress

**Status:** `closed` — locally verified and pushed at the tested Receiver boundary; SDK verification remains pending
**Owner:** Cloud Receiver v2 event verification and enqueue boundary
**Profile:** Assured
**Scope:** `saas-boilerplate/` only, plus this Task's decision and development records
**Authority:** [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md)
**Source contract:** `Docs/Cloud-Receiver-Handoff/v2-build/03-signed-event-ingress.md`

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Cloud Receiver v2 implementation team.
- Current increment: Feature 3 signed Event verification and atomic Event-plus-pending-delivery
  creation is implemented and locally verified in `saas-boilerplate/`.
- Next gate: Delivery Claim/Connector lease is the next separate task; public Grant
  routes remain gated by ADR-0013. SDK verification remains pending as a separate verification
  boundary.
- Dependencies: Accepted Feature 2 at [TASK-015](TASK-015-build-cloud-receiver-v2-consent-targeting.md),
  [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md),
  [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md),
  [ADR-0008](../Decisions/ADR-0008-freeze-receiver-authority-and-durable-reservation.md), and the
  [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## Objective

Accept one valid signed Host Event for an active, target-bound Grant and atomically persist one
Event plus one private pending delivery while consuming the Grant's single run. Preserve exact
replay, signature/origin/scope/state validation, durable PostgreSQL state, and Connector-liveness
independence.

## Acceptance gates

- `EVENT-001` accepts one canonical Ed25519-signed Event with `202` and creates exactly one Event
  and one pending delivery for the fixed target while the Connector fixture is stopped.
- `EVENT-002` accepts the identical signed Event as an exact duplicate with no second Event,
  delivery, or run consumption; conflicting reuse of the Event ID is rejected.
- `EVENT-003` rejects invalid signatures, stale/future timestamps, wrong origin/key, unknown
  binding, malformed bodies, invalid sequence, and invalid state-version input without mutation.
- `EVENT-004` rejects validly signed Events for expired, revoked, or exhausted Grants before
  queueing and makes no Connector request.
- Pairing and Consent/Targeting/Internal Revocation regressions pass after implementation.
- Database inspection proves the Event, delivery, target, Grant run budget, and unchanged invalid
  or duplicate state; no raw signature or credential is persisted or logged.

## 4. Non-goals

- Do not implement Delivery Claim, Connector leasing, Acknowledgement, Agent activation, or Event
  effect handling.
- Do not add public Grant inspection/revocation routes; ADR-0013 and the existing public Grant
  decision boundary remain unchanged.
- Do not implement deployment, production identity, multi-replica guarantees, or a broker.
- Do not modify the frozen `mvp/`, immutable reference snapshots, retired v1 Receiver, Re-entry
  Core source, Local Connector source, or SDK production code.

## Verification record

Detailed commands, runtime, database, red/green results, durable assertions, commit, and remote
state are maintained in [`CLOUD-016`](../Development/CLOUD-016-cloud-receiver-v2-signed-event-ingress.md).

## Closure evidence

`EVENT-001`–`EVENT-004` pass over real Express and disposable PostgreSQL, including concurrent and
reconnect replay, stopped-Connector independence, invalid signature/time/origin/key/body/sequence/
state cases, expired/exhausted/revoked Grant fencing, and durable Event-plus-pending-Delivery
assertions. Pairing and Consent/Targeting regressions pass in the `21/21` backend aggregate. The
tested Receiver implementation is committed and pushed as
`b851c320fae0505e3cf098f979d149e04ab44310`; local `HEAD` and `origin/main` match this SHA exactly.
SDK verification remains pending and is not claimed by this Task.

## 5. Verification and closure

Close only when `EVENT-001`–`EVENT-004` pass over real HTTP against disposable PostgreSQL, the
stopped Connector fixture proves ingress does not consult Connector liveness, Pairing and Consent
regressions pass, and the tested implementation is committed and pushed with exact evidence. SDK
verification is separate; Delivery Claim is the next implementation gate and must not begin under
this Task.

## 6. Reopen condition

Reopen if the canonical Core event fields, signature input, Grant authority, replay semantics,
transaction boundary, durable delivery projection, or privacy boundary changes, or if a real
Connector consumer requires a new contract.
