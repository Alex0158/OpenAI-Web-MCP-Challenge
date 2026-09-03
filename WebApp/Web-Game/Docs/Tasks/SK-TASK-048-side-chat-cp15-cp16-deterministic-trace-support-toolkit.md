# SK-TASK-048: Side Chat CP-15/CP-16 Deterministic Trace Support Toolkit

> **Side Chat support notice:** This task is authored and implemented by Side Chat as a bounded
> support increment for the primary development thread. Its purpose is to save the primary thread
> time by preparing a reusable test and trace backbone before CP-15/CP-16 integration. It does not
> introduce a second gameplay authority, scheduler, queue, persistence path, or product decision.
> The primary thread retains architecture, contract adaptation, integration, final verification,
> and closure authority; a new file appearing from this task is therefore intentional and labelled.

## Task Control

- Lifecycle state: `verified`
- Closure type: `contract_verified`
- Checkpoint: `CP-15`
- Owner: Side Chat support; primary session retains integration and closure authority
- Current increment: Primary review accepted the pure deterministic phase/event trace normalizer and assertion toolkit as isolated CP-15/CP-16 test support; focused verification and type/document checks are green
- Next gate: CP-15 may use the helper only as an observation/assertion utility; any live adapter from worker/store records remains owned by the primary CP-15 or CP-16 task

## Identity

- Task ID: `SK-TASK-048`
- Date: 2026-09-02
- Risk profile: `Fast`
- Reason for profile: The increment is additive test-support code in new paths, has no runtime
  consumer, does not alter a product contract, and is fully removable without changing gameplay
  state or authority.

## Objective

Provide a side-effect-free helper that turns phase visits and selected event observations into a
deterministic, reviewable trace. The helper must expose exact per-boundary phase-order checks,
duplicate-effect checks, and replay comparison without creating or mutating game state.

## Success and non-goals

- Success: A caller can assert that every observed boundary contains the exact accepted phase order,
  including explicit no-op phases supplied by the caller.
- Success: A caller can detect duplicate event IDs or duplicate effect keys within one trace.
- Success: Two traces can be compared through a stable serialization that preserves observed order
  and does not depend on object property insertion order.
- Success: The helpers copy their input and never mutate arrays or records supplied by a test.
- Non-goals: Scheduler or clock behavior, persistence, schema or migration, domain-event creation,
  mission/combat logic, WebMCP, Re-entry, UI, transport, deployment, package-script changes, or
  changes to any existing production or test file.

## Scope and authority

- In scope: `tests/support/trace-toolkit.ts`,
  `tests/side-chat-cp15-trace-toolkit.test.ts`, and the focused command needed to execute that new
  test file directly.
- Out of scope: `src/`, existing `tests/` files, `package.json`, `Docs/Core`, accepted ADRs, the
  active `SK-TASK-047` implementation, `reentry-core/`, `mvp/`, RightSpot, and external services.
- Allowed actions: Add the two isolated support files, run their focused Node 24 test and typecheck,
  and report a handoff; do not stage, commit, push, deploy, or edit primary-thread files.
- Revalidate when: The helper starts importing mutable production services, a caller needs it to
  sort away an observed ordering error, or the requested output changes a domain/schema/event
  contract.

## Owning authority

- Execution discipline: [`Session Runbook`](../00-Workflow/01-session-runbook.md)
- Verification policy: [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)
- Downstream matrix: [`CP-13 through CP-18 Seam Map`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
- Checkpoint route: [`Development Roadmap`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Controlling decision: None; this task deliberately makes no product or cross-boundary decision.

## Evidence status

- Verified: Existing CP-06/CP-08/CP-10/CP-11 tests already record phase callbacks and durable event
  observations that a later aggregate can adapt into a trace.
- Inferred: A generic, order-preserving assertion layer is safer than adding a scheduler-specific
  trace consumer before the primary thread finishes `SK-TASK-047`.
- Unknown: Which final CP-15/CP-16 runner will own the adapter from live store records to these
  generic observations; that integration remains with the primary session.

## Smallest reversible action

Write Red tests for exact phase order, missing or reordered visits, duplicate event/effect keys,
stable replay digest, and input immutability; implement only the new pure helper until those tests
are Green. Stop if the helper needs to read a store, emit an event, schedule work, or reinterpret an
accepted domain event.

## Verification and closure target

- Minimum verification: `npx tsx --test tests/side-chat-cp15-trace-toolkit.test.ts` and
  `npm run typecheck` under Node 24; no broad suite is due for a test-only support increment.
- Closure target: `runtime_verified` for the isolated test-support boundary; this does not close
  CP-15, CP-16, CP-06, or any primary gameplay task.
- Rollback or remediation: Remove only the two task-owned new files if the primary session rejects
  the contract; existing production and test behavior remains untouched.
- Reopen trigger: Any implementation that sorts observed records, hides a missing phase, imports a
  mutable authority, changes accepted event names, or becomes required for production runtime.

## Side Chat handoff

- Added only `tests/support/trace-toolkit.ts` and `tests/side-chat-cp15-trace-toolkit.test.ts`.
- The focused suite passes 5/5 under Node 24 (`v24.13.1`); `npm run typecheck` and
  `python3 scripts/validate_game_docs.py --root . --report` also pass.
- The helper is pure and order-preserving: it does not sort away an observed phase defect, read a
  store, create an event, schedule work, or change a domain contract.
- The primary session must choose the adapter from live `WorldClock`/worker records, decide whether
  the helper belongs in CP-15/CP-16, and rerun authoritative checks before any closure claim.

## Closure result

- Primary review found no second authority, mutable runtime import, ordering repair, hidden retry, or
  accepted-contract change. The helper remains unused by production code and preserves the observed
  order supplied by a later CP-15/CP-16 adapter.
- The focused suite passed 5/5 under Node.js `v24.13.1`; the repository typecheck and documentation
  validators passed after review. The isolated support boundary is recorded in
  [`SK-EVID-037`](../Evidence/SK-EVID-037-cp15-deterministic-trace-support-runtime-verification.md).
- This closure does not close CP-15, CP-16, WebMCP, Re-entry, hosted continuity, or a live external
  Receiver/Connector handoff.
