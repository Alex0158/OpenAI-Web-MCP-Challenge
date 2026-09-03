# SK-TASK-054: CP-12 Held Movement and Touch Input

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Add bounded held-key and pointer movement on top of the verified discrete authoritative move path, without adding a client clock, prediction, or command queue.
- Next gate: [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md) remains the pending CP-13 preparation gate; it needs owner acceptance and a supported WebMCP adapter before any CP-13 implementation task is admitted.

## Identity

- Task ID: `SK-TASK-054`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: Held input crosses browser focus, pointer/keyboard lifecycle, command admission, authoritative snapshot reconciliation, stale/blocked failures, and mobile interaction. A naive repeat loop could flood the server or continue after the page loses authority.

## Objective

Make the map feel responsive for a player who holds a direction or uses a touch direction pad while
preserving the existing server-owned movement transaction. Each repeat remains a discrete
`move_player` intent; the browser waits for authoritative reconciliation before issuing the next one.

## Success and non-goals

- Success: Holding one direction starts one immediate move and at most one subsequent move after each matching authoritative snapshot, with a minimum 180 ms repeat delay.
- Success: Releasing the pointer/key, losing page focus or visibility, disabling the command surface, a stale/closed connection, or a definitive blocked/rejected move stops the held action and leaves no pending timer or queued command.
- Success: A direction change stops the previous hold and takes effect only through the same single-flight server command gate; no predicted or fractional position is rendered.
- Success: Touch/pointer controls remain keyboard accessible and assistive click activation still performs one discrete move when no hold gesture is active.
- Success: Existing discrete movement, dispatch, worker cadence, revision, idempotency, persistence, and full-snapshot reconciliation contracts remain unchanged.
- Non-goals: New server commands, `set_movement_intent`, client-side position prediction, browser-owned world time, interpolation changes, mobile layout redesign, WebMCP/Re-entry, production identity, multiplayer isolation, or balance changes.

## Scope and authority

- In scope: `src/client/keyboard-movement.ts`, `src/client/game-projection.tsx`, the smallest related client tests, the CP-12 scenario/ADR/task/evidence records, and one local browser interaction proof.
- Out of scope: `src/server/`, shared command schemas, persistence, worker cadence, realtime wire, WebMCP, Re-entry Core, external services, and unrelated applications.
- Allowed actions: Add the task-owned challenge/decision, implement the client-only held-input controller and event wiring, run focused Node 24 tests and a local browser proof, and update English current-truth/evidence records. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: movement command admission, authoritative snapshot timing, focus/visibility semantics, pointer event handling, connection lifecycle, or CP-12 contract changes.

## Owning authority

- Movement authority and reconciliation: [`ADR-GAME-0013`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md), and [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)
- Browser projection/session: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md) and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Challenge and vectors: [`Validation/65`](../Validation/65-cp12-held-movement-preimplementation-challenge.md) and [`Scenarios/12`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
- Execution discipline: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: one focused physical key or labelled direction-button activation reaches the existing strict-session HTTP command and is reconciled only by a full server snapshot.
- Verified predecessor: the worker-owned 100 ms movement cadence and its server-side intent lifecycle already exist; this task does not expose that command surface to the browser.
- Inferred: A client hold controller gated by the existing `movementPending` state is the smallest smooth UX improvement that does not create another clock or state authority.
- Verified locally: Pointer capture is released on the tested lifecycle paths, generated pointer clicks are deduplicated, recognized map keys suppress browser scrolling, and unknown movement recovery blocks re-entry until a fresh authoritative snapshot.
- Unknown: The selected in-app browser does not expose a trusted physical key-down/key-up duration or pointer hold primitive, so production latency/device feel and a real multi-step browser hold remain unmeasured; the injected scheduler is the direct cadence proof.

## Smallest reversible action

Write the pure hold lifecycle Red cases first. Add one client controller with a bounded repeat timer,
single-flight gating, and explicit stop causes. Wire it to map buttons and key/pointer lifecycle while
keeping the existing `onMove` transport and full-snapshot reconciliation untouched. Stop if a test
requires a second movement authority, queued commands, a server schema change, or a hidden retry.

## Verification and closure target

- Minimum verification: focused held-input and shared-dispatch tests, `npm run typecheck`, `npm run build`, the game documentation validators, and one Node 24 local browser proof for labelled pointer/keyboard gestures, authoritative revisions, click de-duplication, semantic accessibility, and clean shutdown. Injected-scheduler tests cover multiple held steps and lifecycle stops that the browser adapter cannot physically generate.
- Closure target: `runtime_verified` for one local desktop/touch held-input presentation path. This does not close independent browser, WebMCP, Re-entry, hosted, or production claims.
- Rollback or remediation: remove only the task-owned client controller/wiring and records if the challenge is rejected; preserve the verified discrete path and all server behavior.
- Reopen trigger: a hold produces overlapping requests, continues after release/blur/hidden/stale/blocked state, changes position without an accepted snapshot, floods rejected commands, or requires a new server contract.

## Implementation boundary

- The repeat timer is a presentation/input timer only. It may request one discrete command, but it never advances world time, predicts a tile, or stores fractional progress.
- The existing page mutation and movement gates remain the only admission controls. A timer callback that finds a pending command or non-ready projection does nothing and does not queue work.
- Definitive failures stop the hold. Unknown outcomes first use the existing authoritative resync path; the hold remains stopped until a fresh snapshot makes a new explicit press safe.
- Pointer capture is released on pointer-up, pointer-cancel, lost capture, blur, hidden visibility, disabled state, and component unmount.

## Execution result

- Red: Before implementation, the new controller cases failed because the hold controller was not exported; the failure preserved the missing behavior as the baseline.
- Green: `createHeldMovementController` now issues one immediate existing `move_player` request, waits for the matching authoritative snapshot, enforces a 180 ms minimum delay, and never queues or overlaps commands. Map, semantic-button, pointer, touch, focus, visibility, disabled, scope, stale, blocked, and unknown-recovery paths all share the existing gates.
- Review corrections: the implementation also suppresses recognized browser defaults, replaces rather than overlaps directions, clears pointer capture on every lifecycle exit, suppresses only generated pointer clicks, preserves detail-zero assistive clicks, stops button holds on focus transfer, ignores secondary pointers, and blocks new holds until unknown movement recovery settles.

## Verification and closure

| Check | Result |
|---|---|
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-keyboard` | Passed 13/13, including cadence, release, blocked, unavailable, direction replacement, default suppression, unknown recovery, reconciliation, envelope, and admission cases |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-dispatch` | Passed 31/31; movement and dispatch still share the page mutation gate |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run typecheck` | Passed |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run build` | Passed with Next.js 16.3.4 |
| Local browser proof | Passed for one authenticated in-app browser context: labelled pointer and keyboard gestures each reconciled one authoritative revision, no generated-click duplicate was observed, semantic labels and `touch-action: none` were present, browser warning/error logs were empty, and SIGINT drain stopped cleanly |
| Documentation validators | Passed after the Task/Validation/Evidence/index synchronization |

The browser adapter cannot create a trusted long-duration hold, so multiple repeat steps and release/
blocked/unknown timer behavior are established by the injected-scheduler tests. This is a limitation of
the evidence surface, not permission to claim production movement feel.

## Analysis and closure

- Failure classification: none for the named local client presentation scope.
- Cross-module result: no server, command schema, persistence, worker cadence, realtime frame, WebMCP,
  Re-entry, identity, mission, cargo, combat, or world-clock authority changed.
- Residual gates: production/default continuous movement feel, independent browser identities, hosted
  continuity, WebMCP, Re-entry delivery, and final mobile quality remain open under their existing tasks
  and issue gates.
- Reopen if a hold overlaps or queues requests, continues after release/blur/hidden/stale/blocked/scope
  loss, renders without an accepted snapshot, bypasses the shared page gate, or requires a new server
  intent, clock, schema, or projection ingress.
