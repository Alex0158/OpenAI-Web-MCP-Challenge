# TASK-018 — Prepare SDK to Cloud Receiver v2 Event Contract Verification

**Status:** `in_progress` — red suite prepared; green verification is blocked on the Cloud team's Feature 3 commit SHA
**Owner:** SDK development and Cloud Receiver v2 teams
**Profile:** Assured
**Scope:** `runtime/host-sdk/test/` plus the SDK Event evidence record; SDK production source remains unchanged
**Authority:** [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md)
**Source contract:** [Feature 03 — Signed Host Event Ingress](../Cloud-Receiver-Handoff/v2-build/03-signed-event-ingress.md) and the [SDK integration map](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md)

## Task Control

- Type: `verification`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: SDK development and Cloud Receiver v2 teams.
- Current increment: Prepare black-box `sendEvent()` contract tests for the signed Event envelope,
  acceptance, duplicate, Grant, origin, signature, and invalid-Event boundaries.
- Next gate: The Cloud team reports Feature 3 green and supplies its exact commit SHA; rerun the
  opt-in suite against that same SHA and a fresh disposable PostgreSQL database.
- Dependencies: [TASK-017](TASK-017-build-cloud-receiver-v2-signed-event-ingress.md),
  [CLOUD-016](../Development/CLOUD-016-cloud-receiver-v2-signed-event-ingress.md),
  [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md), and the
  [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## Objective

Verify that the unchanged SDK sends the documented v2 Event envelope to `POST /v0.1/events`, that
the Receiver returns only continuation acceptance, and that invalid signature, Grant, origin, and
Event inputs fail with bounded machine-readable errors before any run is consumed or delivery is
created.

## Acceptance gates

- `SDK-V2-EVENT-001` verifies the canonical Event body, detached Ed25519 signature over
  `<timestamp>.<body>`, exact request headers, absence of an organization API key, and the `202`
  `webmcp.continuation_acceptance` response.
- `SDK-V2-EVENT-002` verifies exact duplicate replay returns `202` with `duplicate: true`, the same
  identifiers, and no second Grant run consumption.
- `SDK-V2-EVENT-003` verifies an invalid signature returns `401` with `event_signature_invalid` and
  leaves the approved Grant active.
- `SDK-V2-EVENT-004` verifies an expired Grant returns `410` with `grant_expired` and leaves its run
  budget unchanged.
- `SDK-V2-EVENT-005` verifies a revoked Grant returns `422` with `grant_revoked` and leaves its run
  budget unchanged.
- `SDK-V2-EVENT-006` verifies a wrong issuer origin returns `422` with
  `event_origin_mismatch` and leaves its Grant unchanged.
- `SDK-V2-EVENT-007` verifies an invalid Event sequence returns `422` with
  `event_sequence_invalid` and leaves its Grant unchanged.
- The `202` response is asserted to contain no claim, lease, effect, or acknowledgement field.

## Assumptions and boundaries

- The SDK already implements the documented `sendEvent()` route and signing behavior. This task does
  not alter `runtime/host-sdk/src/` or add polling, fallback routes, alternate transports, retries,
  or response-shape coercion.
- Expected error-code/status pairs follow the existing Core protocol and Receiver authority:
  `event_signature_invalid`/`401`, `grant_expired`/`410`, `grant_revoked`/`422`,
  `event_origin_mismatch`/`422`, and `event_sequence_invalid`/`422`. A different Feature 3 mapping is
  an exact contract mismatch to report, not a reason to weaken the test.
- The test uses the real Express app through Supertest and disposable PostgreSQL. It creates an
  approved binding with the existing Feature 2 account flow, keeps the Connector process stopped,
  mutates expiry through the test database, and uses the configured internal revocation authority.
  It does not call Delivery Claim or Acknowledgement routes.
- A first `202` means accepted and queued only. It does not mean claimed, activated, or acknowledged.
- No green Feature 3 commit SHA has been supplied in this increment. Feature 2 commit
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5` is the red baseline only; it intentionally has no
  `/v0.1/events` route.

## Non-goals

- Do not modify SDK production code, the Core protocol, the v2 Receiver, or the Local Connector.
- Do not implement or verify Delivery Claim, leases, Agent activation, effects, or Acknowledgement.
- Do not claim deployment, hosted integration, or Feature 3 completion from the red baseline.

## Verification and current blocker

The test source is [`cloud-receiver-v2.event.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs).
It is opt-in so normal SDK tests do not require a Receiver or database:

```sh
cd runtime/host-sdk
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact Feature 3 checkout>" \
  DATABASE_URL="<fresh disposable PostgreSQL URL>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2.event.contract.mjs
```

Before the green run, the Cloud checkout's local `HEAD` and `origin/main` must both resolve to the
SHA reported by the Cloud team. The green command must use that exact checkout and a fresh database.

### Red evidence — 2026-09-02

- `node --check test/cloud-receiver-v2.event.contract.mjs`: passed.
- Default opt-out run: `7/7` cases skipped, `0` failed.
- Opt-in run against the clean Feature 2 baseline at `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`
  exited `1` as the intended pre-Feature 3 red result. `SDK-V2-EVENT-001` and `SDK-V2-EVENT-002`
  received `404` / `http_route_not_found`; `SDK-V2-EVENT-003` through `SDK-V2-EVENT-007` received
  the same missing-route error instead of their expected feature-specific errors.
- No green Event verification has been run. This task remains open until the exact Feature 3 SHA
  is supplied and the full suite passes against it.

## Closure condition

Close only after all seven SDK Event cases pass against the Cloud team's exact reported Feature 3
commit, the normal SDK suite remains green, the response/error and Grant-state assertions are
recorded in [SDK-004](../Development/SDK-004-cloud-receiver-v2-event-contract-tests.md), and no
claim or acknowledgement is inferred from `202`.

After closure, stop at Feature 3. Delivery Claim and Acknowledgement require separate gates.

## Reopen condition

Reopen if the Event body fields, signature bytes, route, acceptance shape, error mapping, Grant
authority, duplicate semantics, or `202` meaning changes; if the Cloud SHA cannot be matched; or if
future work proposes polling, a fallback route, an alternate transport, or a production SDK change.
