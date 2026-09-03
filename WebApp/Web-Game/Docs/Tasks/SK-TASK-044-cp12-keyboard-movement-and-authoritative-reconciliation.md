# SK-TASK-044: CP-12 Keyboard Movement and Authoritative Reconciliation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: One focused non-repeat W-A-S-D/arrow or labelled direction-button action now submits one strictly scoped adjacent move through the shared worker gateway and reconciles position/fog only from the existing full WebSocket snapshot path.
- Next gate: Enter [`SK-TASK-045`](SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md) for the ordinary-UI GATHERER dispatch and authoritative-reconciliation path; continuous movement remains outside this closure.

## Identity

- Task ID: `SK-TASK-044`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Keyboard input crosses browser focus and repeat behavior, movement command transport, player ownership, expected revision/idempotency, worker serialization, projection reconciliation, fog persistence, reconnect state, and accessibility. A convenient client loop could accidentally become a second clock or position authority.

## Objective

Close the next CP-12 presentation gate with one responsive desktop directional-input path. The
browser submits intent without prediction; every accepted position, explored cell, revision, and
event remains owned by the existing worker command/projection path. The increment remains usable and
truthful when realtime is stale or WebMCP is unavailable.

## Success and non-goals

- Success: W-A-S-D or an accepted equivalent issues a bounded owned-player movement intent only when the canonical page has focus and a current authoritative scope.
- Success: The command reaches the existing server-authoritative movement service through one explicit transport contract with revision/idempotency protection; browser timers never advance world time or decide position.
- Success: Accepted snapshots reconcile Canvas and semantic state, persist explored cells, and expose blocked/stale/unauthorized outcomes without silent fallback.
- Success: Typing in an interactive control, holding a key, reconnecting, or receiving a late response cannot duplicate movement, steal focus, or mutate another player.
- Non-goals: Soldier mission commands, combat, shelter movement, mobile/touch controls, final interpolation polish, WebMCP tools, Re-entry, automatic scheduler work, production identity, independent two-session proof, hosted continuity, or balance tuning.

## Scope and authority

- In scope: Canonical page keyboard/focus handling, existing player movement command/read gateway, the smallest accepted HTTP or realtime command adapter, current connection/revision state, Canvas/semantic reconciliation, fog readback, focused tests, and one local browser runtime proof.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, new world clocks, new player-position authority, new persistence schema unless separately decided, mission/combat/economy behavior, external services, and any hidden compatibility fallback.
- Allowed actions: Perform the pre-implementation challenge, record any required decision, add the smallest page/server adapter and focused tests, run an isolated local fixture browser proof, and update linked evidence/audit/current-status documents. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: Movement command input, player revision/idempotency, route/collision rules, projection shape, connection lifecycle, focus policy, or transport ownership changes.

## Owning authority

- Player movement and projection: [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), [`../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)
- Worker command/read ordering: [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Browser projection and session: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Keyboard command boundary: [`../Validation/52-cp12-keyboard-movement-preimplementation-challenge.md`](../Validation/52-cp12-keyboard-movement-preimplementation-challenge.md), [`../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
- UX and vectors: [`../Design/02-map-fog-and-exploration.md`](../Design/02-map-fog-and-exploration.md), [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md), especially `V12-02` and `V12-06`

## Evidence status

- Verified predecessor: CP-08 proves server-owned movement, collision, fog persistence, revision/idempotency, scoped snapshots, and worker serialization in local fixtures.
- Verified predecessor: CP-12 proves one real browser projection, explicit fixture/session scope, first-frame validation, and manual reconnect/stale fallback through [`SK-EVID-032`](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md).
- Accepted current boundary: one physical non-repeat W-A-S-D/arrow input posts one strictly scoped typed HTTP command, then the existing WebSocket full resync supplies the only renderable replacement.
- Accepted current boundary: no local prediction or scheduler enters this slice; visible directional buttons and textual command status are the minimum accessible equivalent.
- Verified runtime: [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md) binds the focused Node 24 contracts, optimized build, real browser movement/blocked/restart readback, SQLite effects, and clean optimized shutdown to the final source.
- Accepted audit: [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md) closes this local discrete path while retaining explicit command-ledger, gateway-admission, scheduler, independent-session, WebMCP, Re-entry, and hosted limits.

## Cross-functional checks

1. **Authority:** Key input expresses intent only. The server owns scope, collision, accepted position, exploration, revision, event, and world time.
2. **Transport:** Reuse the worker gateway and one entrypoint-owned adapter; do not introduce a second worker, queue, clock, route planner, or client position ledger.
3. **Ordering:** One physical press is single-flight until its acknowledged revision is accepted. Distinct command/idempotency identity, stale-before-collision validation, bounded late-response handling, and reconnect ownership are explicit.
4. **UX/focus:** Ignore movement while a text/control surface owns focus; expose keyboard help and typed blocked/stale outcomes without relying on Canvas or color alone.
5. **Projection:** Reconcile from a fresh accepted snapshot. This slice has no local prediction or second position ledger.
6. **Cross-module effects:** Fog discovery follows the accepted movement transaction; no mission, combat, cargo, settlement, WebMCP, or Re-entry side effect is added.

## Smallest reversible action

The completed reversible increment adds one strict-session HTTP adapter, one gateway method, distinct
command and idempotency identity, durable stale/blocked failures, one client single-flight gate, and
one focusable movement surface. It reuses the existing movement transaction and projection-only
WebSocket; no scheduler, new persistence schema, or second renderable response was added.

## Verification and closure target

- Minimum verification: focused movement/transport/input tests, existing CP-08 and CP-12 regressions, typecheck/build, a real local browser W-A-S-D readback including one blocked move and fog/position reconciliation, and documentation/evidence validation.
- Closure target: `runtime_verified` for one local desktop keyboard movement path. No multiplayer, mobile, WebMCP, Re-entry, hosted, or final-feel claim follows.
- Rollback or remediation: Remove no unrelated files. If the browser becomes authoritative, input bypasses focus/revision controls, or the transport needs a new unaccepted wire rule, stop at the challenge/decision gate and preserve the verified read-only projection.
- Reopen trigger: key input advances position without server acceptance, duplicate/held input creates multiple effects, stale scope can move, focus handling captures typing, authoritative correction cannot replace prediction, or a new persistence/wire/identity contract is required.

## Execution result

- TDD: Initial focused Reds exposed the absent keyboard seam, collapsed command/idempotency causation,
  non-durable blocked replay, stale-plus-blocked precedence error, and missing definitive-failure
  parser. The final implementation replays existing keys first, rejects stale revision before
  collision, and returns a complete typed failure for valid authenticated domain rejections.
- Focused verification: Final Node 24 runs passed CP-08 movement 4/4, cadence 5/5, gateway 7/7,
  realtime projection 6/6, realtime wire 8/8, CP-12 keyboard 6/6, fixture/session 10/10, projection
  5/5, reconnect 3/3, and visual 4/4; typecheck and the optimized Next build passed.
- Browser runtime: The real local page accepted one focused key per adjacent move, ignored synthetic
  repeat and key input outside the map, exposed labelled buttons and textual status, preserved a
  blocked boundary as no-effect, reopened the same SQLite state, and reconciled revisions `21` and
  `22` only through full realtime snapshots.
- Persistence and lifecycle: The final database contained 24 `PlayerMoved` events, 24 committed and
  three rejected movement idempotency records, and no event with equal causation/idempotency identity.
  The optimized entrypoint stopped without timeout or error and released port `3191`.
- Evidence and audit: [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md) and [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md).

## Analysis and closure

- Exact conclusion: **This task is `runtime_verified` for one local discrete desktop movement and
  authoritative reconciliation path. It changes no world clock, mission/combat/economy, realtime
  frame, WebMCP, Re-entry, production identity, or hosted authority.**
- Residual risk: The local slice does not globally reserve `command_id` across different idempotency
  keys, and the inherited realtime connection/read queue has no public-load admission cap. Reopen
  before multiple mutation callers or hostile/public traffic share this surface.
- Remaining gates: Continuous held movement with an all-phase scheduler, independent sessions,
  positive WebMCP, Re-entry, production identity, hosted continuity, and level-5 proof remain
  separate.
