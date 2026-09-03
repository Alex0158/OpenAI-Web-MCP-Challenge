# SK-TASK-043: CP-12 Browser Reconnect and Stale Fallback

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: The local page now preserves same-scope stale mission/history/map state, rejects duplicate in-flight attempts and changed-scope retention, remains retryable after prompt bootstrap failure, and returns to `READY` after process restart plus one explicit reconnect.
- Next gate: Enter [`SK-TASK-044`](SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md) for the separately bounded keyboard/authoritative-reconciliation path; reopen this task before adding any silent-connection acceptance deadline.

## Identity

- Task ID: `SK-TASK-043`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The increment crosses React lifecycle, WebSocket ownership, bootstrap/session resolution, first-frame validation, stale projection semantics, and human controls. A reconnect loop or stale socket could duplicate subscriptions, hide lost state, or let a late frame replace a newer projection.

## Objective

Make the CP-12 human page recoverable after a realtime disconnect through one explicit, accessible
reconnect action. The page must retain a truthful last projection and visible stale/closed state while
the process or bootstrap is unavailable, then replace it only after a new server-derived scope and a
matching full `client_snapshot` are accepted. The world, worker, persistence, and identity authorities
remain unchanged.

## Success and non-goals

- Success: A socket close or failed bootstrap produces a visible `STALE`/`CLOSED` state, keeps the last readable mission/history projection, and exposes one human reconnect control.
- Success: A user-triggered reconnect closes or supersedes the prior socket, performs one bootstrap, creates one fresh pre-bound projection, and accepts only a matching server-issued first frame.
- Success: A successful reconnect returns to `READY` without resetting coins, missions, cargo, event history, or world authority; no duplicate socket or duplicate event is created.
- Success: If the process remains unavailable or the first frame is malformed/foreign, the page remains visibly degraded and the control can be tried again without an implicit retry storm.
- Non-goals: Automatic retry timers, browser keyboard movement, state-changing game commands, WebMCP, Re-entry, Agent Signal, new identity/cookie schemas, new wire messages, scheduler, production authentication, hosted continuity, or final visual polish.

## Scope and authority

- In scope: `LiveGameProjection`, `GameProjection`'s human reconnect affordance, existing `RealtimeProjectionClient` lifecycle, bootstrap/realtime composition, stale/closed status text, and task-owned browser/runtime evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, worker/store/persistence/schema, mission/combat/settlement logic, WebMCP, external services, automatic scheduling, and any second authority.
- Allowed actions: Make the smallest client/UI change under the existing projection and session boundary, add focused contract tests for lifecycle behavior, run an isolated local fixture process and browser readback, and update task/evidence/audit documents. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: The projection client state machine, fixture bootstrap contract, WebSocket first-frame validator, page lifecycle, or stale/fallback vocabulary changes.

## Owning authority

- Projection and lifecycle: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Fixture/session and first-frame binding: [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Browser vectors: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md), especially `V12-06` and `V12-07`
- Prior browser challenge/evidence: [`../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md`](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md), [`../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md), [`../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md`](../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md)

## Evidence status

- Verified runtime: [`SK-EVID-032`](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md) proves `READY -> CLOSED -> failed reconnect/CLOSED -> retry/READY` in one real local browser context, with the cross-functional disposition in [`Validation/50`](../Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md).
- Verified lifecycle: Pending duplicate starts are rejected, later attempts supersede old callbacks, and retained state survives only when the fresh bootstrap has the same contract/world/player/shelter scope.
- Verified claim limit: Mission/history/map state remains readable while stale; sensed Wood/Rock counts are hidden until a fresh full frame. A bootstrap or first frame that never settles remains an ADR reopen case because no acceptance deadline exists.

## Cross-functional checks

1. **Authority:** Reconnect only re-establishes the projection transport. It cannot choose a player, shelter, world, position, revision, or command result.
2. **Lifecycle:** One active socket belongs to one page lifecycle. Cleanup and supersession prevent late messages from an older socket updating the current projection.
3. **Projection:** Keep the last accepted snapshot readable while stale/closed; replace it only after a new pre-bound scope and full frame pass the existing validator.
4. **Failure:** Bootstrap errors, socket errors, malformed frames, and foreign frames remain visible and retryable without an automatic timer or hidden success.
5. **UX/accessibility:** The reconnect control has an accessible name, is disabled while a connection attempt is active, and does not make color or animation the only recovery signal.
6. **Effects:** No game command, event, outbox row, settlement, or world-time change is caused by reconnect.

## Smallest reversible action

Add one callback from `LiveGameProjection` to `GameProjection` for an explicit reconnect button.
Refactor the existing one-shot connection setup only enough to close/supersede the prior socket, retain
the last accepted snapshot during degradation, and bind a fresh projection after the next valid frame.
Cover success, unavailable bootstrap, duplicate-click, and stale/foreign-frame behavior before any
visual polish.

## Verification and closure target

- Minimum verification: focused lifecycle tests, typecheck, a local process/browser run that closes and restarts the process, semantic status/readback before and after reconnect, and documentation/evidence validation.
- Closure target: `runtime_verified` for the bounded manual reconnect and stale-fallback path. No automatic retry, keyboard, two-browser, WebMCP, Re-entry, hosted, or level-5 claim follows.
- Rollback or remediation: Remove no unrelated files. If reconnect introduces a second socket, hides stale state, or accepts an unbound frame, revert only the task-scoped client change and return to the verified one-context fallback.
- Reopen trigger: reconnect loops automatically, a late socket mutates current state, a failed bootstrap clears truthful history, a client-selected identity is accepted, a malformed/foreign frame binds, or the browser/runtime/session contract changes.

## Execution result

- TDD: The initial reconnect-gate test failed before the helper existed; the changed-scope retention test failed before the scope helper existed; the duplicate-start test failed before in-flight admission and settlement were implemented. The final reconnect suite passes 3/3 on Node.js `v26.5.0` and the Node.js `v24.13.1` baseline.
- Focused regressions: 5 projection, 10 fixture/session, and 4 visual tests passed with TypeScript checking and the optimized Next build.
- Browser lifecycle: A rebuilt production-mode local page reached `READY`, showed truthful `CLOSED` stale fallback after process loss, returned to retryable `CLOSED` after a failed reconnect while the process was down, and returned to `READY` after restart and one explicit reconnect.
- Closure checks: Documentation validator self-test passed 22/22, documentation validation passed with exactly one non-terminal task (`SK-TASK-044`), and `git diff --check -- .` reported no whitespace errors.
- Evidence and audit: [`SK-EVID-032`](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md) and [`Validation/50`](../Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md).

## Analysis and closure

- Exact conclusion: **This task is `runtime_verified` for the named local explicit reconnect and stale-fallback path. It changes no game, identity, persistence, wire, WebMCP, or Re-entry authority.**
- Residual risk: A peer that accepts bootstrap or WebSocket work but never settles can leave the page in `CONNECTING`. An acceptance deadline requires reopening `ADR-GAME-0029`; it is not silently added here.
- Remaining gates: Independent two-session delivery, keyboard input, positive WebMCP, Re-entry, scheduler, production identity, hosted continuity, and level-5 proof remain separate.
