# SK-TASK-070: CP-16 Local Causal Restart and Recall Continuity

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: The same durable loss/reissue signal, page read state, and bounded recall survive a clean local entrypoint/worker restart without duplicate gameplay or delivery effects under [`SK-EVID-057`](../Evidence/SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md) and [`Validation/83`](../Validation/83-cp16-local-causal-restart-recall-continuity-runtime-cross-functional-audit.md); no downtime or hosted claim is made.
- Next gate: No further gate remains for this named local restart continuity composition; Eddy's versioned external Receiver/Local Connector handoff, genuine WebMCP dynamic recall, independent browser delivery, hosted continuity, and judge reproduction remain separate gates.

## Identity

- Task ID: `SK-TASK-070`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: This increment crosses process shutdown/startup, file-backed persistence, world/event/signal recovery, page session reuse, delivery acknowledgement, revision-gated recall, and duplicate safety. A restart can otherwise make a durable signal look lost or replay a gameplay effect.

## Objective

Add one replayable local integration trace that creates a real successful monster-loss/reissue signal,
stops the entrypoint before delivery, starts a new entrypoint against the same database, rereads the
same server-resolved page scope, delivers the recovered signal through the existing labelled local
port, and performs one current-revision, signal-provenance-bound recall with duplicate replay.

## Success and non-goals

- Success: A fresh file-backed `sleepless-mvp-01` fixture reaches world time `24` with one real `CargoLostToMonster`, one successful automatic reissue, and one pending signal/outbox pair.
- Success: After clean entrypoint/worker shutdown and restart on the same database, world time, event order, signal identity, active reissued mission, and pending delivery remain unchanged.
- Success: The recovered signal is acknowledged once, the canonical page HTTP reads expose current continuation/revisions/history, and a valid recall transitions the reissued mission to `RETURNING`.
- Success: Identical recall replay is idempotent and no second loss, reissue, acknowledgement, or recall event is created.
- Success: Focused CP-06/13/14/16 checks, typecheck, documentation validation, and a local-only evidence record pass.
- Non-goals: Autonomous wall-time catch-up during downtime, production source changes, browser/realtime/WebMCP adapter behavior, Agent/Receiver/Connector delivery, hosted continuity, independent browser isolation, or judge reproduction.

## Scope and authority

- In scope: one test file, one package script, this task, its evidence and validation records, and narrow task/index/current-status/roadmap/scenario/seam references.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, credentials, generated databases, screenshots, and unrelated dirty files.
- Allowed actions: Add a test-only restart/continuity trace using the existing entrypoint, worker, store, port, and page HTTP seam; run the smallest affected Node 24 checks and documentation validators; commit only the Game-owned scope. Do not push, merge, deploy, or contact external parties.
- Revalidate when: startup recovery, world snapshot/event replay, signal/outbox lifecycle, page session policy, recall contract, or Eddy's delivered external contract changes.

## Owning authority

- Restart and world recovery: [`SK-TASK-047`](SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md), [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md), and [`Validation/59`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md)
- Local causal page composition: [`SK-TASK-069`](SK-TASK-069-cp16-local-causal-page-recall-composition.md), [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md), and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md)
- Persistence and delivery: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md), and [`SK-TASK-068`](SK-TASK-068-cp14-causal-event-to-local-stub-trace.md)
- Page tools and recall: [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md), and [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Scenario and controls: [`CP-16 fixtures`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md), [`Session Runbook`](../00-Workflow/01-session-runbook.md), and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: worker startup recovery, file-backed event/signal persistence, local port delivery, canonical page HTTP reads, and the provenance-bound recall transition are each runtime-verified in separate local scopes.
- Gap: no one test proves a pending signal and active reissued mission survive a full entrypoint/worker restart before delivery and action.
- Claim limit: this task uses explicit manual clock advances and a labelled local transport. It cannot support autonomous downtime catch-up, live Receiver/Connector delivery, Codex Thread wake, genuine WebMCP dynamic invocation, browser/realtime behavior, hosted continuity, or judge reproduction.

## Smallest reversible action

1. Add a fresh two-process-in-one-test trace using the same temporary database: produce loss/reissue and pending delivery in process A, then cleanly stop it.
2. Start process B against the same database and assert stable world/event/signal/mission identity before any delivery.
3. Deliver the recovered signal through the labelled port, reread shelter/missions/history through the canonical HTTP page boundary, recall with current revisions and provenance, and replay the same body.
4. Assert once-only event effects, clean shutdown, focused checks, and evidence/validation updates.

## Cross-functional assertions

- Startup recovery is the only source of resumed state; no second world, worker, resolver, signal, or identity map is created.
- The test uses explicit clock advances before shutdown and does not claim automatic world progression while stopped.
- The signal id, event id, mission/attempt ids, binding, and revisions are read from durable/page state; the test never reconstructs them.
- Delivery acknowledgement changes only delivery state and the documented delivery event. Recall remains a normal server transition and cannot replay combat or cargo loss.
- The same fixed alpha cookie resolves to the same server-owned scope after restart; beta privacy remains covered by Task 069 and is not reimplemented here.

## Verification and closure target

- Minimum verification: `npm run test:cp16-restart-recall`, existing CP-06 startup/recovery checks, CP-13 page/recall checks, CP-14 causal/port/signal checks, CP-16 local regression, typecheck, documentation self-tests and validator, and `git diff --check -- WebApp/Web-Game`.
- Closure target: `runtime_verified` for the named local restart-to-page-recall continuity composition only.
- Intentionally unrun: autonomous downtime catch-up, production build/browser/WebMCP, external Receiver/Connector, Agent, hosted, independent-browser, and judge checks unless a source change requires a focused recheck.
- Rollback or remediation: revert only the task-owned test/script/evidence/docs if the restart loses durable identity, duplicates an event/effect, accepts stale revisions, or crosses scope.
- Reopen trigger: restart requires production changes, pending signals are not recoverable, page scope changes after restart, duplicate recall is possible, or a local result is presented as hosted/external proof.

## Test and evidence note

This is a test-only resilience composition increment. Existing startup, persistence, port, page, and
recall implementations already own the behavior; the test joins them across one clean process boundary
without adding a scheduler, queue, or recovery workaround.

## Execution result

- Added `tests/cp16-local-causal-restart-recall.test.ts` and the named `test:cp16-restart-recall` script.
- Process A reached world time `24` with one real `CargoLostToMonster`, one successful automatic
  `MissionReissued` outcome, one active reissued attempt, and one pending signal/outbox pair. It then
  shut down through the existing entrypoint lifecycle.
- Process B opened the same file-backed database and preserved world/event cursor, event count/order,
  signal identity/status, mission identity, and active attempt identity before delivery. The recovered
  signal was acknowledged once through the labelled local port, canonical page HTTP reads returned the
  current continuation/revisions/history, and a provenance-bound recall committed `RETURNING`.
- The identical recall replay returned `duplicate = true`; exactly one loss, reissue, delivery
  acknowledgement, and recall event remained. The beta fixture scope saw no alpha continuation or loss.

## Verification and closure

- `npm run test:cp16-restart-recall`: **1/1 passed**; `npm run test:cp06-autonomous-runtime`: **3/3
  passed**; `npm run test:cp13-page-tools`: **9/9 passed**; `npm run test:cp13-recall`: **9/9 passed**.
- `npm run test:cp14-causal`: **1/1 passed**; CP-14 port suite **5/5**; signal policy suite **11/11**;
  `npm run test:cp16-local`: **3/3 passed**; `npm run typecheck`: **passed**.
- Documentation self-tests, the repository validator, and `git diff --check -- WebApp/Web-Game` passed
  in the closure commit.
- Closure: `verified` with `runtime_verified` for the named local clean-restart-to-page-recall
  continuity composition only. External delivery, Agent/WebMCP dynamic action, independent browser,
  hosted, crash-recovery, and judge gates remain open.
