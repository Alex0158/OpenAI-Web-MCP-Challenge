# SK-TASK-068: CP-14 Causal Event-to-Local-Stub Trace

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-14`
- Owner: Game owner
- Current increment: The real local worker/combat `CargoLostToMonster` path composes with the verified game-side `ReentryDeliveryPort` and a labelled transport stub under [`SK-EVID-055`](../Evidence/SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md) and [`Validation/81`](../Validation/81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md); production authority and external boundaries are unchanged.
- Next gate: No further gate remains for this named local composition; live Receiver/Connector, Agent wake, WebMCP reread, dynamic recall, hosted continuity, independent browser, and judge evidence remain separate gates.

## Identity

- Task ID: `SK-TASK-068`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: This test crosses combat settlement, durable signal/outbox state, lease identity,
  delivery acknowledgement, and the later external Re-entry handoff. It must prove composition without
  turning a local stub into a live Receiver, Connector, Agent, or page claim.

## Objective

Add one replayable local integration trace that starts with the real seeded worker causing a granted
`CargoLostToMonster` event, observes the resulting coalesced signal and outbox row, pumps that row through
the existing game-side `ReentryDeliveryPort`, and verifies an accepted labelled transport outcome. The
trace must demonstrate that delivery acknowledgement settles only delivery state and does not repeat or
alter combat, cargo loss, respawn/review state, coins, or authoritative world time.

## Success and non-goals

- Success: A fresh file-backed `sleepless-mvp-01` fixture and real local worker advance produce exactly one
  terminal `CargoLostToMonster`, one scoped pending signal, and one pending outbox delivery for Player A.
- Success: `pumpOnce` sends one bounded envelope preserving contract version, world/shelter scope, opaque
  binding, signal identity, grant/action, cursor window, eligible summary, severity, and latest-event data.
- Success: An accepted labelled transport outcome creates one delivery acknowledgement, leaves the same
  signal identity settled, and leaves mission, soldier, cargo, coin, shelter, event history, and world time
  unchanged except for the documented delivery lifecycle and acknowledgement event.
- Success: A follow-up pump is idle/already-settled, no second delivery acknowledgement is created, and
  shelter B has no cross-scope signal or delivery.
- Success: Focused test output, affected CP-14/CP-16 suites, typecheck, build-independent documentation
  validation, and a precise local-only evidence record pass.
- Non-goals: Modifying combat, persistence, the worker, the delivery port, page tools, WebMCP, Agent grants,
  the Cloud Receiver, Local Connector, Codex Thread, hosted scheduling, deployment, or any external service.

## Scope and authority

- In scope: `tests/cp14-causal-event-to-local-stub-trace.test.ts`, its package script, this task, its
  evidence and validation records, and narrow task/index/current-status/roadmap references.
- Out of scope: `src/`, `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, credentials,
  deployment, generated runtime databases, screenshots, and unrelated dirty files.
- Allowed actions: Add a test-only local composition trace, run the smallest relevant Node 24 checks and
  documentation validators, and commit only the Game-owned task/test/docs scope. Do not push, merge, deploy,
  or contact external parties.
- Revalidate when: `CargoLostToMonster` eligibility, delivery envelope or acknowledgement semantics,
  `ReentryDeliveryPort`, CP-16 causal fixture, or Eddy's delivered external contract changes.

## Owning authority

- Delivery policy: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Causal chain: [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Local delivery seam: [`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md),
  [`SK-EVID-050`](../Evidence/SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md),
  and [`Validation/76`](../Validation/76-cp14-game-side-local-stub-delivery-port-runtime-cross-functional-audit.md)
- Real combat and outbox predecessor: [`SK-TASK-050`](SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md),
  [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md),
  and [`Validation/61`](../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md)
- Replay vectors: [`CP-14 fixtures`](../Scenarios/14-cp14-reentry-adapter-fixtures.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified: The real local worker/combat path produces a granted terminal loss, atomic coalesced signal,
  pending outbox row, same-identity respawn/review, and scoped history in the CP-16 local slice.
- Verified: The game-side port selects one durable candidate, preserves its envelope, claims a lease, and
  settles accepted/retryable/terminal outcomes against a labelled transport stub.
- Gap: Those two verified records do not yet exercise one continuous test path from the real combat event
  through the port's envelope and acknowledgement. This task closes only that local composition gap.
- Claim limit: A labelled local transport remains test instrumentation. The result cannot support a live
  Receiver, Local Connector, Codex Thread, Agent wake, WebMCP reread, Re-entry, hosted, or judge claim.

## Smallest reversible action

1. Add a test-only Red/probe trace using the existing worker, fixture, grant provider, and port; assert the
   causal event and pending delivery before invoking the stub.
2. Return an accepted transport outcome, capture the envelope, and assert acknowledgement, idempotent
   follow-up behavior, scope isolation, and no gameplay/world-time mutation.
3. Add one named `test:cp14-causal` script and run it with the existing CP-14 signal/port and CP-16 suites.
4. Record exact fixture, wall-time lease, identities, cursors, event counts, claim limits, and validator
   results in evidence and cross-functional validation records.

## Cross-functional assertions

- Combat and settlement remain server-owned; the test does not call a client command or create a second
  gameplay queue.
- `world_time` is advanced only by the worker's existing deterministic clock; delivery wall time is an
  explicit lease input and must not change it.
- `signal_id`, `event_id`, opaque binding, and lease identity are read back from durable state; the test
  must not reconstruct or replace them with client-selected values.
- Acceptance settles the delivery record only. The mission remains in its post-loss review state and the
  cargo remains destroyed according to the existing combat contract.
- Player B's world/shelter scope remains private, and no external adapter or page capability is invoked.

## Verification and closure target

- Minimum verification: `npm run test:cp14-causal`,
  `./node_modules/.bin/tsx --test tests/cp14-reentry-delivery-port.test.ts`,
  `./node_modules/.bin/tsx --test tests/cp14-signal-policy.test.ts`, `npm run test:cp16-local`, `npm run typecheck`, the documentation
  self-tests and validator, and `git diff --check -- WebApp/Web-Game`.
- Closure target: `runtime_verified` for the named local real-event-to-labelled-stub composition only.
- Intentionally unrun: production build and browser/WebMCP readback are unnecessary because this task
  changes only a Node test and documentation; live Receiver/Connector, Agent, page, hosted, and judge
  boundaries remain unrun by design.
- Rollback or remediation: Revert only the task-owned test/script/evidence/docs if the trace shows a
  duplicate acknowledgement, cross-scope row, gameplay mutation, world-time mutation, or identity mismatch.
- Reopen trigger: any production code change becomes necessary, the port envelope or acknowledgement
  contract changes, a local stub is presented as external proof, or the causal path loses an event or effect.

## Test and evidence note

This is a test-only composition increment. The existing production implementation is already verified at
its own boundaries, so the appropriate probe is a fresh real-worker trace rather than a new production
abstraction or a manufactured failing unit for an unchanged function. The evidence must explicitly retain
the local-stub and no-page/no-external limitations.

## Execution result

- Added `tests/cp14-causal-event-to-local-stub-trace.test.ts` and the named `test:cp14-causal` script.
- A fresh file-backed fixture and real worker advance produced exactly one granted terminal
  `CargoLostToMonster` at world time `24`, one scoped pending signal/outbox pair, and the existing
  same-identity shelter respawn/review state with cargo destroyed.
- The existing `ReentryDeliveryPort` delivered one envelope to the labelled accepted transport,
  preserving durable signal/cursor/binding/event metadata. Acknowledgement appended one
  `ContinuationDelivered` event, left gameplay records and world time unchanged, and made a follow-up
  pump idle; Player B remained out of scope.

## Verification and closure

- `npm run test:cp14-causal`: **1/1 passed**.
- Existing CP-14 port suite: **5/5 passed**; signal policy suite: **11/11 passed**; CP-16 local
  causal suite: **3/3 passed**; `npm run typecheck`: **passed**.
- Documentation self-tests: **22/22 passed**; documentation validator: **passed** with no
  non-terminal tasks after closure; `git diff --check -- WebApp/Web-Game`: **passed**.
- The production build, browser/WebMCP, external Receiver/Connector, Agent, hosted, and judge checks
  were intentionally not rerun because this increment is test-only and keeps those boundaries open.
- Closure: `verified` with `runtime_verified` for the named local real-event-to-labelled-stub
  composition only. Exact cross-functional review is [`Validation/81`](../Validation/81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md).
