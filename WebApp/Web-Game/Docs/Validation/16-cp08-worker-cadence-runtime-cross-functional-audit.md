# CP-08 Worker Cadence Runtime Cross-Functional Audit

## Review control

- Status: BOUNDED WORKER CADENCE REVIEW COMPLETE; BROADER CP-08 REMAINS OPEN
- Date: 2026-09-02
- Scope: `SK-TASK-023`, the CP-06 fixed-step clock seam, worker lifecycle, movement intent identity,
  process-local accumulation, CP-05 movement transactions, restart behavior, and handoffs to the
  remaining CP-08 and later checkpoints
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decisions: [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), and [`../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
- Task: [`../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md`](../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md)
- Evidence: [`../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md`](../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md)

## Verdict

The registered worker-cadence increment is coherent and locally `runtime_verified`. One explicit
`WorldWorkerModule.advance` call drives the existing `WorldClock`; each fixed 100 ms reconciliation
step processes active movement intents in stable order, and each integer crossing reuses the existing
server-authoritative movement transaction. The accumulator, active intent, and crossing sequence are
process-local; integer position, explored cells, revision, and `PlayerMoved` events remain durable.

This closes only the local worker cadence and intent lifecycle. It does not establish an always-on
host scheduler, a command queue or HTTP/WebSocket gateway, a 10 Hz snapshot stream, browser input,
visible terrain or actor policy, route planning, soldier movement, gameplay, WebMCP, Re-entry, or
hosted continuity.

## 1. Authority and timeline

| Boundary | Verified disposition | Handoff or residual |
|---|---|---|
| World time | `WorldClock` is the only local driver. Fixed 100 ms handlers run before the matching integer boundary; a tenth step completes the next world second. | A production scheduler and trusted wall-time catch-up remain later runtime/hosted work. |
| Worker lifecycle | `WorldWorkerModule.advance` is available only after `start()` and has no browser or wall-time timer. Stop and missing-clock states fail visibly. | A host-owned loop, lease, liveness, and failover policy require a separate task. |
| Position | The cadence calls `PlayerMovementService`; the CP-05 transaction owns bounds, revision, idempotency, event, and persistence. | A worker command queue must serialize external commands before live two-browser claims. |
| Sub-tile progress | Four tiles per world second becomes `0.4` per 100 ms; the third step crosses one tile and retains `0.2` in memory. | Fractional interpolation remains a presentation projection; it must not become durable gameplay state. |
| Boundary order | Active movement steps use the current integer world time, then the tenth step executes the existing CP-06 integer phases and persists the next second. | Deposit, contact, extraction, combat, settlement, and timers remain unimplemented handlers. |

## 2. Intent identity, ownership, and retry

- A set or stop command is scoped by `world_id`, `player_id`, and the opaque binding. The current
  player revision is checked before a new idempotency record is committed; a different request using
  an existing key is rejected by the CP-05 duplicate-command boundary.
- One active intent exists per world/player. A valid new set replaces the direction and resets the
  process-local accumulator. A valid stop removes the intent. Replaying an earlier stop key cannot
  clear a later intent because duplicate commands replay without reapplying the effect.
- Each integer crossing receives a deterministic key derived from the intent identity and sequence.
  A movement retry therefore reuses the CP-05 event/revision effect. A stale revision or blocked
  boundary is returned as a typed failure and the active intent is cleared; no retry loop invents a
  route or hides a rejected move.
- The direct service seam is synchronous in this local implementation. It has not yet proved ordering
  when external command arrival races a clock step; that is a transport/worker-gateway responsibility,
  not a reason to weaken revision checks.

## 3. Persistence and restart

- Schema version 2 stores integer player coordinates and the canonical explored-cell set. Every
  committed crossing advances the player revision and appends one `PlayerMoved` event in the same
  transaction.
- A worker replacement reloads the last committed tile and event cursor. It clears active intents,
  the fractional accumulator, and the in-memory crossing sequence; a reconnect must send a fresh
  intent. This avoids inventing movement during downtime and avoids persisting a representation the
  contract has not accepted.
- A process fault between a durable movement commit and local accumulator bookkeeping can at most
  replay the same crossing key; CP-05 idempotency prevents a second event. The next worker still
  starts from durable integer state.
- The local fixture uses a file-backed SQLite database per test. This proves the transaction and
  replacement seam, not multi-process locking, hosted durability, backup, or failover.

## 4. Cross-checkpoint handoffs

| Consumer | Safe contract now | Must remain separate |
|---|---|---|
| CP-06 clock/recovery | One worker clock, fixed-step handler ordering, integer world-time boundaries | Do not use browser time or replay healthy sub-second movement as downtime catch-up |
| CP-07 fixture | Persisted dimensions, bounds, shelter anchors, and stable world-scoped identities | Do not regenerate the fixture or treat a client coordinate as map authority |
| Remaining CP-08 | Durable position/exploration and a deterministic local cadence seam | Command queue, visible actor allowlists, pathfinding, snapshot cadence, delta protocol, and WebSocket delivery need separate increments |
| CP-09 missions | A stable player coordinate and revision boundary for future home/route transitions | Soldiers cannot inherit player intent, movement speed, or a route without their own role/mission contract |
| CP-12 Canvas | A future renderer may display authoritative positions and interpolate accepted frames | The browser cannot run the worker, commit movement, or preserve an intent across restart |
| CP-13 WebMCP | Future tools can read the same scoped snapshot and revision | Capability registration, tool auth, and command grants are not implied by this service |
| CP-14 Re-entry | A continuation may reread current state after an eligible event | Routine movement steps are not Agent Signals and do not wake a Thread |

## 5. Failure and user-flow review

- Not-ready, stopped, missing-clock, invalid input, wrong owner, missing entity, stale revision,
  duplicate misuse, and movement-blocked outcomes remain visible typed/lifecycle failures. No client
  correction or fallback worker masks them.
- The terminal boundary failure is retained in the cadence diagnostic until a new intent is accepted,
  so a large `advance()` cannot erase the reason a route stopped while processing later no-intent steps.
- The local increment has no browser surface. Therefore keyboard affordances, reconnect messaging,
  interpolation correction, stale snapshot handling, accessibility, and degraded realtime UX remain
  unverified and must not be claimed from the passing tests.

## 6. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P1 | `advance()` is an explicit driver rather than a wall-time scheduler or hosted always-on loop. | Accepted by ADR-GAME-0014. Register a later runtime/operations task before claiming G1 hosted liveness or G3 continuity. |
| P1 | Active intent and fractional progress are lost on worker replacement. | Accepted by ADR-GAME-0014 to avoid downtime-invented movement. Reopen only if product explicitly chooses durable intent semantics with a new identity and recovery contract. |
| P2 | Direct services are not yet behind an external command gateway or worker queue. | Accepted local seam. The next CP-08 task must serialize commands and snapshot reads before browser two-session claims. |
| P2 | The open-grid fixture proves only the map boundary as a blocked cell. | Accepted for the immutable G2 fixture. Reopen rejected-command idempotency when mutable terrain or walkability is introduced. |
| P2 | Synchronous SQLite writes happen once per integer crossing. | Measure event-loop, snapshot, and transport budgets before changing cadence or introducing a second topology. |

No finding blocks closure of `SK-TASK-023`. Each remaining concern has an owning future boundary and a
reopen condition; none is silently folded into this local increment.

## Closure disposition

`SK-TASK-023` may close as `runtime_verified` for worker-owned 100 ms movement cadence, intent
replacement/stop, deterministic ordering, integer tile persistence, typed boundary termination, and
restart semantics. The broader CP-08 roadmap remains `IN PROGRESS`; the next registered increment
should own the worker command/read gateway and full-snapshot transport seam before visibility and
browser work is presented as live.
