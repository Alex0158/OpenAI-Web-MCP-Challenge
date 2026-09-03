# SK-TASK-015: CP-15 Contract, Race, and Failure Verification Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-15`
- Owner: Game owner
- Current increment: Cross-functional CP-15 preparation is complete; no runtime code has started.
- Next gate: After CP-05 through CP-14 task records are stable, map every contract and failure code to a focused check, then run the minimum transitive aggregate once.

## Identity

- Task ID: SK-TASK-015
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the aggregate verification matrix that proves or explicitly gates every known G2 cross-boundary risk. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the aggregate verification matrix that proves or explicitly gates every known G2 cross-boundary risk.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: New gameplay behavior, balance tuning, production load testing, hosted proof, judge claims, external service implementation, or hiding a failing contract behind a test fixture.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-15 scenario fixture](../Scenarios/15-cp15-contract-race-verification-fixtures.md), and the owning documents named below.
- Out of scope: New gameplay behavior, balance tuning, production load testing, hosted proof, judge claims, external service implementation, or hiding a failing contract behind a test fixture.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: 00-Workflow verification ladder, Validation/03-roadmap-gap-audit.md, Engineering/09-mvp-contract-sheet.md, and all owning mechanisms/chains.
- Roadmap dependency: CP-05 through CP-14.
- Cross-functional handoff: A failing check may reopen CP-05 through CP-14 or an ADR; CP-16 consumes only stable evidence; CP-17/18 cannot upgrade local evidence into hosted/judge proof.
- Preparation audits: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and [CP-14–CP-16 preparation audit](../Validation/49-cp14-cp16-preparation-cross-functional-audit.md).

## Evidence status

- Verified: Verification must record exact source, fixture, ladder level, pass/fail/gated status, claim limit, intentionally unrun checks, and reopen triggers.
- Inferred: A coverage matrix keyed by contract section, mechanism, identity, event, failure code, and checkpoint is the smallest reliable aggregate boundary.
- Unknown: Final test runner, network/lease simulation harness, browser recording format, external handoff availability, flaky-artifact policy, and aggregate command orchestration.

## Current verification-surface readback

- The current repository uses focused `tsx --test` scripts per checkpoint. CP-12 fixture, projection, realtime, and wire checks are the immediate predecessor surfaces; CP-13 and CP-14 should add focused suites before any aggregate run is attempted.
- The CP-13 matrix must cover registration/readback, server-bound scope, snapshot and mission-history reads, valid and stale recall, duplicate idempotency, cross-shelter denial, unsupported WebMCP, and the human consequence boundary.
- The CP-14 matrix must cover eligibility filtering, one-slot coalescing, deferred cursor, cooldown history retention, lease conflict, retry with the same signal identity, acknowledgement, terminal rejection, active-Thread backpressure, fresh page reread, and external contract mismatch.
- The aggregate must preserve the distinction between a local fake, a local runtime trace, a real browser capability result, an external delivery trace, and hosted proof. A passing fake or contract test cannot upgrade a claim to live WebMCP, Re-entry, hosted, or judge evidence.
- Until CP-12 closes, these are preparation inputs only. The CP-15 runner must not compensate for a missing session boundary, page transport, or external handoff by adding hidden retries or a second authority.

## Preparation handoff packet

The matrix below is the CP-15 entry contract. It is keyed by an observable boundary rather than by a
private helper, and it deliberately records a gate when a predecessor is unavailable. A percentage
coverage score is not sufficient for closure: every row must be `pass`, `gated`, `expected-fail`,
`flaky`, or `not-run` with an explicit reason and claim limit.

### Cross-checkpoint verification matrix

| Row | Surface and failure mode | Smallest check | Expected assertion | Current state |
|---|---|---|---|---|
| V05 | Transaction, event, signal, and outbox atomicity | `npm run test:cp05` | Rollback leaves no partial state; event and signal identities are exactly once | Runtime-verified named CP-05 scope |
| V06 | Clock order, bounded recovery, restart | `npm run test:cp06` | Integer world time and due work recover deterministically without a loop | Runtime-verified named CP-06 scope |
| V07 | Seed, identity, reset, restart | `npm run test:cp07` | Same seed reproduces the same world and reset does not rewrite another world | Runtime-verified named CP-07 scope |
| V08 | Movement, gateway, projection, wire, reconnect | `npm run test:cp08`, `npm run test:cp08-cadence`, `npm run test:cp08-gateway`, `npm run test:cp08-realtime`, `npm run test:cp08-wire` | Server scope, FIFO order, full replacement, stale/foreign rejection, and visible lifecycle failure | Runtime-verified named CP-08 scopes |
| V09 | Mission role lock and route boundary | `npm run test:cp09` | Owned target, tool/role, route, due marker, arrival, and duplicate command remain consistent | Runtime-verified named CP-09 scopes |
| V10 | Extraction, contest, return, settlement | `npm run test:cp10`, `./node_modules/.bin/tsx --test tests/cp10-return-navigation.test.ts`, and `npm run test:cp10-deposit` | Cargo provenance, capacity/depletion, deterministic contest, home crossing, and coin settlement are atomic | Runtime-verified named CP-10 scopes |
| V11 | Combat, cargo loss, Hunter contrast, reissue | `npm run test:cp11`, `npm run test:cp11-hunter`, `./node_modules/.bin/tsx --test tests/cp11-reissue.test.ts` | Death destroys only field cargo, respawn preserves identity, Hunter victory returns, and reissue cannot loop | Runtime-verified named CP-11 scopes |
| V12 | Projection, visual/semantic parity, fixture session | `npm run test:cp12-projection`, `npm run test:cp12-visual`, `npm run test:cp12-fixture` plus the active browser task | Read model is server-scoped, deterministic, readable, and visibly stale when transport closes | One-context runtime verified; independent two-session gate open |
| V13 | Capability, schema, ownership, stale recall | Fresh supported-adapter discovery plus future focused CP-13 suite | Genuine page binding is proven before invocation; reads and recall return typed results | Gated by `SK-ISSUE-001`; no positive capability yet |
| V14 | Signal eligibility, coalescing, lease, retry, handoff | Future focused CP-14 local-stub suite after the CP-13 positive gate; versioned external handoff remains a separate live-integration gate | One signal slot, same identity on retry, deferred cursor preservation, and no gameplay mutation from delivery | Preparation only; external handoff open |
| V15 | Matrix integrity and transitive rerun | This matrix plus a recorded Verification Budget | Every applicable row has evidence or an explicit gate; no hidden skipped boundary | Preparation only |
| V16 | Clean two-player causal story | CP-16 replay runbook and timestamped trace | Browser absence, restart, signal coalescing, page reread, and typed late action are reproducible | Preparation only |

### Failure classification and response

| Failure | First response | Closure consequence |
|---|---|---|
| Malformed or unauthorized input | Reject before state/event/cargo/coin/signal mutation | The row passes only with a typed failure and unchanged durable state |
| Stale entity or mission revision | Return the contract's stale result and reread current state | Never overwrite a later attempt; reopen if a stale call commits |
| Duplicate command, event, or delivery | Return the original result or duplicate marker | Exactly one domain effect and one delivery event remain |
| Lease conflict or timeout | Preserve the signal identity and retry/terminally reject explicitly | No second wake, event, or command effect |
| Browser/transport loss | Keep the world moving and expose `STALE`, `CLOSED`, or unsupported state | No hidden retry or gameplay pause |
| Contract drift | Stop and record the changed field and owning decision | No silent adapter rewrite; predecessor remains gated |
| Sensitive evidence | Redact and retain only correlation/causal fields | A trace with secrets or hidden state is invalid evidence |

### Aggregate budget and closure rule

CP-15 does not currently have an aggregate `npm test` script. Before a future aggregate, record the
affected rows, reusable evidence, focused suites, the executable reopen trigger, the minimum failure
reproducer, and intentionally unrun rows in a Verification Budget. Run the focused predecessor and
new CP-13/14 suites first; run one aggregate only when its task owns that boundary. A green focused
suite cannot upgrade a gated capability, external delivery, two-session, hosted, or judge claim.

## Smallest reversible action

After CP-05 through CP-14 task records are stable, map every contract and failure code to a focused check, including the CP-13 page-tool and CP-14 delivery boundaries, then run the minimum transitive aggregate once. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-15 scenario fixture](../Scenarios/15-cp15-contract-race-verification-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-05 through CP-14, the owning contract, or the cross-functional handoff.
