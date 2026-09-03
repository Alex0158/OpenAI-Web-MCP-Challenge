# SK-TASK-071: CP-16 Real Event Burst and Page Context

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: Two real worker-generated `CargoLostToMonster` events in one active shelter window coalesce into one durable signal/outbox, preserve both causal events for paginated page history, and permit one current-revision recall from the latest reissued mission under [`SK-EVID-058`](../Evidence/SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md) and [`Validation/84`](../Validation/84-cp16-real-event-burst-page-context-runtime-cross-functional-audit.md); no external delivery claim is made.
- Next gate: No further gate remains for this named local burst composition; Eddy's versioned external Receiver/Local Connector handoff, Connector/Thread backpressure, genuine WebMCP dynamic recall, independent browser delivery, hosted continuity, and judge reproduction remain separate gates.

## Identity

- Task ID: `SK-TASK-071`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: This increment crosses two real combat losses, automatic reissue, signal coalescing, cursor windows, page history, latest-event provenance, delivery acknowledgement, and bounded recall. A burst path can otherwise lose causal context, create duplicate wakes, or select the wrong mission.

## Objective

Add one replayable local integration trace that dispatches two gatherers into the existing seeded
monster path, produces two real successful loss/reissue transitions before the first signal is
acknowledged, and verifies that the single coalesced signal carries the complete eligible summary while
the canonical page retains both causal events and recalls the latest active reissue once.

## Success and non-goals

- Success: A fresh file-backed `sleepless-mvp-01` fixture produces two real `CargoLostToMonster` events, two successful automatic reissues, and one pending signal/outbox identity for `shelter-a`.
- Success: The signal keeps one identity, `eligible_event_count = 2`, the first-to-second cursor range, one event type, and the second loss as latest event; routine events remain in durable history.
- Success: One labelled local delivery acknowledges the coalesced signal once, and the canonical page HTTP reads expose both loss/reissue records and the latest reissued mission revisions.
- Success: A current-revision, latest-event-provenance-bound recall commits `RETURNING`; identical replay is idempotent and no second gameplay or delivery effect appears.
- Success: Player B remains outside the continuation and causal history, and focused CP-13/14/16 checks, typecheck, documentation validation, and a local-only evidence record pass.
- Non-goals: Changing coalescing/cooldown policy, production source, browser/realtime/WebMCP adapter behavior, external Receiver/Connector delivery, Codex Thread wake/backpressure, hosted continuity, independent browser isolation, or judge reproduction.

## Scope and authority

- In scope: one test file, one package script, this task, its evidence and validation records, and narrow task/index/current-status/roadmap/scenario/seam references.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, credentials, generated databases, screenshots, and unrelated dirty files.
- Allowed actions: Add a test-only real-worker burst trace using the existing fixture, local port, and page HTTP seam; use the established CP-11 test-only encounter-cell setup to select the reachable reissue branch; run the smallest affected checks; commit only the Game-owned scope. Do not push, merge, deploy, or contact external parties.
- Revalidate when: signal aggregation, cursor/event projection, reissue policy, page continuation/history, recall provenance, fixture geometry, or Eddy's external contract changes.

## Owning authority

- Signal policy and backpressure: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md), and [`SK-TASK-068`](SK-TASK-068-cp14-causal-event-to-local-stub-trace.md)
- Real loss/reissue and page composition: [`SK-TASK-069`](SK-TASK-069-cp16-local-causal-page-recall-composition.md), [`SK-TASK-070`](SK-TASK-070-cp16-local-causal-restart-recall-continuity.md), [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md), and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md)
- Page tools and action: [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md), and [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Scenario and controls: [`CP-16 fixtures`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md), [`Session Runbook`](../00-Workflow/01-session-runbook.md), and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: persistence-level burst coalescing, real single-loss/reissue delivery, page reread/recall, and clean restart continuity are each runtime-verified in separate local scopes.
- Gap: no one real worker trace proves multiple eligible losses merge before acknowledgement while both causal losses remain readable and the latest reissued mission can be recalled from fresh page state.
- Claim limit: the trace uses explicit clock advances, a labelled local transport, and a test-only encounter geometry update. It cannot support per-event Thread behavior, external delivery, genuine WebMCP dynamic invocation, browser/realtime behavior, hosted continuity, or judge reproduction.

## Smallest reversible action

1. Start a fresh entrypoint-owned fixture, dispatch two A gatherers, and advance the real worker through two reachable loss/reissue encounters before delivery.
2. Assert one pending signal/outbox identity with two eligible events, a continuous page cursor range, latest-event metadata, and preserved routine history.
3. Deliver the one coalesced envelope through the labelled port, reread shelter/missions/history through canonical HTTP, recall the latest reissued mission with current revisions and provenance, and replay the same body.
4. Assert once-only loss/reissue/delivery/recall counts, beta privacy, clean shutdown, focused verification, and evidence/validation updates.

## Cross-functional assertions

- The worker/combat/persistence path creates both domain events and reissues; the signal is derived from those durable events and never replaces them.
- The signal cursor range is a page-read window. `eligible_event_count` and `event_types` describe only eligible loss events even when routine battle/reissue events occupy intermediate cursors.
- Coalescing preserves the first signal identity and latest loss metadata; acknowledgement changes delivery state only.
- The page reads after acknowledgement are server-scoped and current. Recall uses the latest active mission/attempt revisions and the latest loss event's durable provenance.
- A duplicate recall cannot repeat combat, cargo loss, reissue, acknowledgement, or mission transition. Player B receives neither signal nor alpha private loss history.

## Verification and closure target

- Minimum verification: `npm run test:cp16-burst-page-context`, existing CP-13 page/recall checks, CP-14 causal/port/signal checks, CP-16 local and restart regressions, typecheck, documentation self-tests and validator, and `git diff --check -- WebApp/Web-Game`.
- Closure target: `runtime_verified` for the named local real-worker burst-to-page-context-to-recall composition only.
- Intentionally unrun: production build/browser/WebMCP, external Receiver/Connector, Agent, active-Thread, hosted, independent-browser, and judge checks.
- Rollback or remediation: revert only the task-owned test/script/evidence/docs if a burst creates a second signal, loses a causal event, selects stale/foreign state, duplicates an effect, or crosses scope.
- Reopen trigger: coalescing no longer preserves identity or causal range, page history omits either loss, latest-event provenance cannot select the active reissue, duplicate recall appends an event, or a local result is presented as external proof.

## Test and evidence note

This is a test-only CP-16 composition increment. Existing event aggregation, delivery, page, and recall
implementations own the behavior; the trace joins two real worker outcomes without adding a queue,
cooldown workaround, scheduler, or production branch.

## Execution result

- Added `tests/cp16-real-event-burst-page-context.test.ts` and the named
  `test:cp16-burst-page-context` script.
- A fresh entrypoint-owned fixture dispatched two A gatherers. The real worker produced two
  `CargoLostToMonster` events and two successful automatic `MissionReissued` outcomes before delivery;
  the first pending signal identity and one outbox row remained in place.
- The coalesced signal reported `eligible_event_count = 2`, only `CargoLostToMonster` in its eligible
  type list, a cursor window enclosing both loss events, and the second loss as latest metadata. One
  labelled local delivery acknowledged it; canonical page reads used bounded `next_cursor` pagination
  to recover both loss and reissue records.
- The latest reissued mission was recalled with current page revisions and the second loss provenance;
  duplicate replay returned `duplicate = true`. Exactly one delivery acknowledgement and recall event
  remained, and beta saw no alpha continuation or loss history.

## Verification and closure

- `npm run test:cp16-burst-page-context`: **1/1 passed**; `npm run test:cp16-restart-recall`: **1/1
  passed**; `npm run test:cp06-autonomous-runtime`: **3/3 passed**.
- `npm run test:cp13-page-tools`: **9/9 passed**; `npm run test:cp13-recall`: **9/9 passed**;
  `npm run test:cp14-causal`: **1/1 passed**; CP-14 port suite **5/5**; signal policy suite **11/11**;
  `npm run test:cp16-local`: **3/3 passed**; `npm run typecheck`: **passed**.
- Documentation self-tests, the repository validator, and `git diff --check -- WebApp/Web-Game` passed
  in the closure commit.
- Closure: `verified` with `runtime_verified` for the named local real-worker burst-to-page-context-
  to-recall composition only. External backpressure, delivery, Agent/WebMCP dynamic action,
  independent browser, hosted, and judge gates remain open.
