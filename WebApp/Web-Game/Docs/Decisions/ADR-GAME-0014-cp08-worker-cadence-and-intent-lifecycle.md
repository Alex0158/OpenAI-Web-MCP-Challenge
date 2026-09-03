# ADR-GAME-0014: CP-08 Worker Cadence and Movement Intent Lifecycle

**Status:** ACCEPTED LOCAL CP-08 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Scope:** `SK-TASK-023`, worker-serialized player movement cadence  
**Related task:** [`../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md`](../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md)  
**Predecessors:** [`ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)

## Context

The first CP-08 increment proved one adjacent-tile `move_player` command and a full
player-scoped `client_snapshot`, but it intentionally did not connect movement to the CP-06
worker-owned 100 ms reconciliation cadence. The accepted G2 contract requires smooth movement
without allowing browser time, fractional coordinates, or a second worker to become gameplay
authority.

The cadence also needs an explicit retry and lifecycle rule. A movement key may be delivered more
than once, a player revision may become stale, and process-local fractional progress cannot survive
an uncommitted process boundary. If these cases are left implicit, a future transport can produce
duplicate moves, lost committed tiles, or an intent that silently continues after a restart.

## Decision

### 1. One fixed worker step drives the cadence

- `WorldClock.tick(elapsedMs)` remains the only healthy-world driver. It splits elapsed worker time
  into fixed `WORLD_CLOCK_STEP_MS = 100` ms steps and invokes optional reconciliation handlers once
  per complete step. A partial remainder stays in the clock's process-local interpolation field.
- Reconciliation handlers run synchronously for each fixed step before that step's integer-world-second
  boundary phases. When one `tick` contains more than one world second, the handlers and boundaries
  are interleaved in timeline order. Handlers receive the current persisted integer `worldTime`; they
  do not receive or create a fractional authoritative time.
- `WorldWorkerModule.advance(elapsedMs)` is the explicit worker-owned driver for a configured clock.
  This seam is testable with an injected elapsed value. No browser timer, page module, or second
  clock is introduced, and this task does not start a production wall-time loop.
- `recoverTo(targetWorldTime)` processes integer due-work boundaries only. It does not replay healthy
  100 ms movement intent steps during downtime; restart resumes from durable state and later intent
  input must be explicit.

### 2. Fractional movement is process-local and disposable

- The accepted player rate is `4.0` logical tiles per world second. One 100 ms step therefore adds
  `0.4` tile to an in-memory accumulator. The first integer crossing occurs on the third step
  (`1.2` accumulated, leaving `0.2`), and each later crossing consumes exactly one tile while
  retaining the remainder.
- Only the integer tile, player-owned explored cells, player revision, and `PlayerMoved` event are
  committed through the existing CP-05 transaction. Fractional progress never appears in a player
  row, event envelope, `world_time`, `world_snapshot`, or `client_snapshot`.
- The accumulator belongs to one worker process and one `(world_id, player_id, intent_id)`. Stopping
  the process or constructing a replacement worker discards it. A replacement worker starts at the
  last durable tile; no elapsed wall time invents movement.

### 3. Intent commands have one active owner and explicit retry semantics

- `set_movement_intent` and `stop_movement_intent` are server commands bound to one world, player,
  opaque binding, expected current player revision, and idempotency key. The command is accepted only
  through the worker-owned service and the existing store idempotency record.
- One player has at most one active intent. A new valid set replaces the previous direction and
  resets the new intent's process-local accumulator. A stop clears the active intent and discards its
  remainder; it never teleports or mutates the player's durable position by itself.
- A repeated key with the same request replays the original command result and never reactivates or
  clears a later intent. Reusing a key with a different request returns `DUPLICATE_COMMAND`.
  An expected revision that is no longer current returns `STALE_REVISION` and cannot replace a newer
  intent. These command records are durable for retry identity, while the active intent itself is
  deliberately not durable in this increment.
- Each integer crossing reuses `PlayerMovementService.move` with a deterministic derived key scoped
  by world, player, intent, and crossing sequence. A duplicate crossing key replays the original
  tile/event result; it cannot award a second move. A stale or blocked crossing clears that intent
  and reports the typed failure instead of retrying forever.

### 4. Boundary and deterministic ordering

- The cadence iterates active intents in stable `(world_id, player_id)` order. The worker remains the
  serialization boundary; direct page calls cannot mutate the position outside the same service.
- A crossing validates the persisted CP-07 fixture bounds and walkability before the CP-05 transaction.
  No movement step can leave the map or enter a blocked cell. Immutable open-grid fixture rejection
  is visible; if terrain can mutate later, the rejected-command idempotency policy must be reopened.
- Movement events produced during a healthy sub-second step carry the current integer world time. At
  an exact second, all movement steps are applied before that `tick` call's integer boundary phases,
  so the boundary observes the post-movement tile. Integer combat, extraction, death, respawn, node
  timers, and cooldown milestones remain owned by the CP-06 boundary order.

## Alternatives considered

| Alternative | Disposition |
|---|---|
| Browser `requestAnimationFrame` or keyboard timer advances position | Rejected: makes client timing authoritative and breaks reconnect/replay determinism. |
| Persist fractional coordinates every 100 ms | Rejected: expands the durable contract and snapshot schema before transport evidence justifies it. |
| Let each HTTP/WebSocket request own its own movement loop | Rejected: creates duplicate clocks and races across sessions. |
| Add a real wall-time interval in this task | Deferred: the explicit worker driver proves the authority seam first; hosted scheduling and measured load belong to later runtime work. |
| Keep direct adjacent commands only | Rejected for this increment: it leaves the accepted 100 ms contract unconnected to the worker and cannot provide a continuous projection seam. |

## Consequences and limits

This boundary gives CP-08 one deterministic worker path from a 100 ms clock step to an existing
transaction, while preserving integer persistence and full-snapshot reconnect. It intentionally does
not define WebSocket messages, browser input, interpolation correction, visible terrain or remote
actors, pathfinding, soldiers, missions, WebMCP, Re-entry, or hosted scheduling. Clearing active
intent on process replacement means a reconnect must send a fresh intent; this is explicit and avoids
inventing movement during downtime.

The current store and clock are synchronous local seams. Event-loop latency, multi-world scheduling,
transport backpressure, and a real always-on timer remain measured later; a local fake-step pass does
not prove hosted continuity or a 10 Hz production budget.

## Verification and reopen triggers

The task must prove three 100 ms steps produce one tile crossing with a retained `0.2` process-local
remainder, deterministic ordering for multiple players, set/stop replacement, ownership and stale
revision rejection, duplicate command and crossing replay, blocked/bounds handling, and restart from
the last durable tile. Reopen this decision if a browser or wall clock advances movement, a fractional
value becomes durable, an intent survives restart without an explicit policy, a repeated key produces
more than one tile/event, a stale command overwrites a newer intent, or the worker seam requires a
second clock or transport authority.
