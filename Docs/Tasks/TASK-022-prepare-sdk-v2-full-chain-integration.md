# TASK-022: Prepare SDK v2 Full-Chain Integration Contract

**Status:** `verification_pending` — SDK Host/Event/Claim gates and Cloud Feature 5/6 own tests pass against Cloud `300bce02`; received Acknowledgement is `5/5` after the approved ACK-003 mapping; combined flow remains open pending the exact clean Cloud SHA and effect-authority gate
**Owner:** SDK development team
**Profile:** Assured
**Scope:** SDK-owned contract tests and evidence documents only; no Cloud Receiver or Local Connector production changes
**Authority:** [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md), [ADR-0009](../Decisions/ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md), [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md), [ADR-0013](../Decisions/ADR-0013-freeze-receiver-grant-control-and-revocation.md), [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md), [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md), [ADR-0038](../Decisions/ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md), and [ADR-0039](../Decisions/ADR-0039-adopt-cloud-receiver-v2-transport-operations.md)
**Source contracts:** [SDK to Cloud Receiver v2 integration map](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md), [Feature 04 — Delivery Claim and Lease](../Cloud-Receiver-Handoff/v2-build/04-delivery-claim-and-lease.md), [Feature 05 — Delivery Acknowledgement](../Cloud-Receiver-Handoff/v2-build/05-delivery-acknowledgement.md), and [Feature 06 — Transport, Errors, Health, and Operations](../Cloud-Receiver-Handoff/v2-build/06-transport-and-operations.md)

## Task Control

- Type: `verification`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: SDK development team.
- Current increment: Reconcile the approved ACK-003 mapping, rerun the received Acknowledgement matrix, and maintain the isolated SDK-owned SDK-V2-E2E-001 test while leaving SDK production code unchanged.
- Next gate: obtain the exact clean Cloud Receiver SHA, then run SDK-V2-E2E-001 with Cloud, Local Connector `4b821515`, fresh PostgreSQL, and the independent Host-effect authority.
- Dependencies: [SDK-005](../Development/SDK-005-cloud-receiver-v2-full-chain-contract.md), [TASK-019](TASK-019-build-cloud-receiver-v2-delivery-claim.md), [TASK-020](TASK-020-build-cloud-receiver-v2-delivery-acknowledgement.md), [TASK-021](TASK-021-build-cloud-receiver-v2-transport-operations.md), the Local Connector acknowledgement evidence, and the [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## 1. Problem and objective

The SDK already owns the Host-side setup, browser handoff, signed Manifest/Event construction, and
Receiver control/ingress calls. Delivery Claim, lease fencing, Host-effect verification, and
Acknowledgement are downstream Receiver and Local Connector boundaries. The project needs one
shared contract record that lets each team test the same requests, responses, failures, replay rules,
timing limits, durable assertions, and secret boundaries without adding SDK fallbacks or silently
changing protocol `0.1`.

The objective is to make the SDK-side integration evidence executable against the exact Cloud
Receiver and Local Connector commits once their Feature 5–6 gates are green, then run the combined
flow:

```text
Host SDK -> Cloud Receiver -> Local Connector -> Host effect -> acknowledgement
```

## 2. Authority and evidence

- `reentry-core/` and the accepted ADRs own protocol values, authority, delivery, acknowledgement,
  transport, replay, and secret rules.
- The SDK-to-Receiver map is supporting integration guidance; it does not add a route or change an
  accepted decision.
- The current Cloud Receiver checkout is a separate nested repository. Its clean local `HEAD` is
  `300bce02e6a6f9b643a6de95a3596691304749b7`; it is three commits ahead of `origin/main` at
  `b851c320fae0505e3cf098f979d149e04ab44310`. This is local checkout evidence, not remote delivery.
- The root SDK Event gate is recorded in [SDK-004](../Development/SDK-004-cloud-receiver-v2-event-contract-tests.md).
- The root SDK Host-key/consent/browser gate is recorded in [SDK-003](../Development/SDK-003-cloud-receiver-v2-contract-tests.md).
- No public Grant inspection or revocation route is part of this task. Grant negative cases use the
  already configured internal test authority only, subject to ADR-0013.

## 3. Scope and acceptance gates

### SDK-owned gates

- Re-run `SDK-V2-001` through `SDK-V2-004` against the exact Cloud Receiver checkout used for the
  current compatibility run.
- Re-run `SDK-V2-EVENT-001` through `SDK-V2-EVENT-007` against that same checkout and a fresh
  disposable PostgreSQL database.
- Confirm the SDK sends no organization API key on `/v0.1/events`, and that `202` means accepted and
  queued only.
- Keep the SDK production files unchanged: no polling, fallback route, response coercion, retry,
  alternate transport, or Claim/Acknowledgement methods.

### Exchanged downstream gates

- Run the received Local Connector Claim matrix against the exact Cloud Receiver Feature 4 commit;
  the SDK team may verify this compatibility but must not modify Connector or Receiver code.
- Once Cloud Feature 5 is green, run `ACK-001` through `ACK-005` through the real Connector client
  and Receiver handler with a configured test effect authority.
- Once Cloud Feature 6 is green, run `HTTP-001` through `HTTP-005` across every SDK/Connector request
  boundary.
- Run the combined flow only when the exact Cloud Receiver and Local Connector commits are recorded,
  the effect authority is configured, and all earlier gates remain green.

## 4. Non-goals

- Do not change `runtime/host-sdk/src/`, `reentry-core/`, `runtime/local-connector/src/`, or the
  nested `saas-boilerplate/` Receiver.
- Do not add public Grant inspection or revocation, a public effect-token format, polling, fallback
  routes, alternate transports, hidden retries, or direct database calls from production SDK code.
- Do not treat Event `202`, a successful claim, Connector health, adapter return, Agent start, or
  browser navigation as acknowledgement.
- Do not claim hosted, deployed, split-origin, public Browser, or whole-system completion from local
  tests.

## 5. Verification and closure

The detailed test requests, expected responses, error mappings, replay behavior, timing, durable
assertions, and secret boundaries are recorded in [SDK-005](../Development/SDK-005-cloud-receiver-v2-full-chain-contract.md).

Current local evidence on 2026-09-02:

- `SDK-V2-001` through `SDK-V2-004`: `4/4` passed against clean Cloud Receiver `300bce02` and fresh
  PostgreSQL.
- `SDK-V2-EVENT-001` through `SDK-V2-EVENT-007`: `7/7` passed against the same exact checkout and
  fresh PostgreSQL.
- Received `CONNECTOR-V2-CLAIM-001` through `CONNECTOR-V2-CLAIM-005`: `5/5` passed against the
  exact Cloud checkout and fresh PostgreSQL.
- Received `CONNECTOR-V2-ACK-001` through `CONNECTOR-V2-ACK-005`: `5/5` passed against Cloud
  `300bce02` and fresh PostgreSQL after the approved mapping; the exact Local test commit is
  `4b8215156d814551f8da06dad16319deaff549d7`.
- Cloud's own Feature 5 and Feature 6 tests: `10/10` passed against the exact Cloud checkout.
- Normal SDK verification: `18/18` passed on Node `v26.8.1`.
- The combined flow remains unverified. The project-manager decision adopts `host_effect_invalid`
  for malformed/far-future normalization and `host_effect_time_invalid` for a normalized effect
  outside the valid lease/Grant/revocation window. No implementation was weakened or changed by the SDK.
- The pre-decision ACK-003 red reproducer remains retained as historical evidence. The post-decision
  rerun passed `5/5`; no Core, ADR, Cloud, Connector, or SDK production behavior was changed by the
  SDK increment.
- The isolated SDK-owned `SDK-V2-E2E-001` test is syntax-checked and explicitly gated until the
  exact Cloud SHA, exact Local Connector SHA, and independent Host-effect authority are available.

The exact-commit run must record:

1. Cloud Receiver `HEAD`, supplied Feature 5/6 SHAs, and remote readback separately;
2. Local Connector commit and the exact Core dependency tree used;
3. Node version, PostgreSQL version, disposable database identity, migrations, and teardown;
4. every focused and aggregate test command with pass/fail counts;
5. the configured effect-authority fixture without recording its raw token; and
6. the combined-flow response sequence and durable final state.

The task remains open until the exact counterpart commits exist and the combined flow passes. A
missing route, missing authority fixture, response/status/code mismatch, stale lease, unexpected
mutation, secret leak, or failed earlier gate keeps the task open with the exact evidence recorded.

## 6. Reopen condition

Reopen if any team changes a route, field, status meaning, signature rule, token placement, replay
rule, lease timing, acknowledgement authority, or `202` meaning; proposes a public Grant route
outside ADR-0013; or adds polling, fallback, retry, or alternate transport behavior.
