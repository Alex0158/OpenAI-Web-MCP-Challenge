# CP-12 Server-Owned Continuous Movement Intent Pre-Implementation Challenge

**Status:** ACCEPTED; OWNER DECISION RECORDED  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-055`](../Tasks/SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Predecessors:** [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md), [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)  
**Scenario:** [`CP-08 fixtures`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md) and [`CP-12 fixtures`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)  
**Date:** 2026-09-03

## Decision question

Should the canonical page start and stop the existing server-owned movement intent so the worker's
100 ms cadence drives a continuous-feeling avatar while the page remains a projection and the world
continues independently? The answer must define when the intent stops if the page, realtime
connection, session scope, worker, or another page mutation disappears.

This is a new page transport and lifecycle boundary. It is not implied by the verified CP-08 service
or the CP-12 client-only hold, and it must not be implemented until the owner accepts one exact path.

## Current evidence and constraints

### Verified facts

1. `PlayerMovementCadenceService.setIntent()` and `stopIntent()` already validate world/player/binding,
   expected player revision, and idempotency through the existing store. A player has one active
   process-local intent; a new set replaces its direction and resets the accumulator.
2. Each 100 ms worker step adds 0.4 process-local tiles. Integer crossings call the existing
   `PlayerMovementService.move()` with derived command and idempotency keys, then update the player
   revision and event through the existing transaction.
3. `WorldWorker.advance()` is the only gameplay driver seam. The explicit autonomous scheduler may
   call it, and successful advances can publish full snapshots through the existing entrypoint hook.
4. `WorkerCommandGateway` already serializes set/stop intent calls with other page commands, but the
   automatic scheduler does not create a second page transport or queue.
5. The page's current Task054 controller owns only an input timer and emits one discrete command per
   settled snapshot. It stops on page lifecycle loss and does not create server intent.
6. The realtime adapter resolves a server-bound context and closes a connection on client close, but
   it does not currently expose an intent-lifetime callback to the gateway or cadence service.

### Binding constraints

- World time, position, collision, explored cells, revisions, events, and snapshot publication remain
  server/worker-owned.
- A page must never select `world_id`, `player_id`, `shelter_id`, or another binding in a command body
  or query. The existing fixture resolver remains the sole local identity source.
- A start command has no immediate position effect; only worker cadence crossings can move a player.
  A stop command clears the intent and any process-local fractional remainder without teleporting.
- Every start/stop request carries a distinct command identity, retry identity, current player
  revision, and the server-resolved binding. Duplicate replay returns the original result; a stale
  request cannot replace a newer intent.
- An intent must have one explicit lifetime. Page blur/hidden, realtime close, scope change, worker
  drain/fault, and a competing page mutation cannot leave an unbounded movement stream.
- The human page remains usable without this path. Unsupported or unavailable intent must be visible;
  a hidden fallback cannot silently switch authorities.
- A server intent may continue while the page is absent only if that is an explicit product rule with
  a bounded recovery and evidence path. It may not happen accidentally because a stop packet was lost.

### Cross-module race findings closed by the accepted boundary

- The current cadence map is keyed by `(world_id, player_id)` and therefore cannot be the session
  authority by itself. The runtime path carries an opaque server-issued connection owner in the
  in-memory intent record; a newer connection supersedes an older owner, and an old close can revoke
  only its own owner token.
- A client-supplied `expectedRevision` can become stale between a 100 ms crossing and a replacement
  command. A stale replacement fail-stops the same owner's active intent before returning the typed
  stale outcome. An explicit stop and a connection-close revoke use the current server revision or a
  synchronous owner revocation, so a stale stop cannot leave the old direction active.
- The accepted wire shape is one-shot WebSocket control messages, one frame for start or direction
  replacement and one frame for stop. The wire is not a periodic control stream; worker cadence and
  full snapshots remain the only clocks and renderable position ingress.
- No server lease or heartbeat is added for this MVP increment. Blur/hidden sends one best-effort stop;
  a realtime connection close, worker drain/fault/stop, or competing move/dispatch is the hard safety
  boundary. If product later requires bounded stop while a connection remains open, that is a new
  decision rather than an implicit timer.

## Affected business chain

```text
focused map/button gesture
  -> server-bound start/stop command
  -> page/server admission and WorkerCommandGateway FIFO
  -> one process-local intent for (world, player)
  -> 100 ms WorldClock reconciliation
  -> derived integer PlayerMovementService crossing
  -> durable position + explored cell + PlayerMoved event + revision
  -> automatic full client_snapshot publication
  -> page accepts only the newer authoritative snapshot
```

The chain must not pass through a browser timer, optimistic position, second movement ledger, direct
database write, WebSocket state mutation, or an Agent/Re-entry command. Mission dispatch, cargo,
combat, world-boundary phases, Signal delivery, and WebMCP remain downstream or separate authorities.

## Cross-functional findings to resolve

| Surface | Current fact | Required decision or proof |
|---|---|---|
| Intent authority | Cadence service and worker already own the effect | Page sends only start/stop; command responses contain metadata and never become position authority |
| Session lifetime | Realtime close currently removes a connection but does not stop movement intent | Accepted: opaque connection owner, newer-session supersession, synchronous owner revoke on close/drain/fault/stop; no MVP lease/heartbeat |
| Transport | Local movement uses HTTP; realtime carries projection/resync only | Accepted: one-shot WebSocket control frames; do not add HTTP repeats, a periodic stream, or a second worker/queue |
| Revision/idempotency | Service and store already have expected revision and retry identity | Preserve command/crossing identity separation; stale replacement fail-stops same owner and explicit stop resolves current revision |
| Page mutation gate | Movement and dispatch already share a page gate | Client gate remains presentation admission; server move/dispatch safety-stop any active intent before their mutation |
| Snapshot publication | Worker advances trigger the existing detached full-snapshot pump | Prove a slow/failed sink cannot delay gameplay or create one promise/retry per 100 ms step |
| Reconnect | Active intents are process-local and intentionally lost on worker replacement | Fresh connection requires a fresh explicit start; old command identities and owner tokens cannot affect it |
| Blocked/stale crossing | Cadence clears the intent and exposes a typed failure | Page must surface the stop reason and require a new explicit start; no retry storm |
| Scope/privacy | Binding is server-derived in current fixture mode | Foreign binding/player/query/body fields must be rejected or ignored without mutating another scope |
| Performance | One active intent can cross at most one tile per 250 ms at the accepted speed | Measure aggregate cadence and snapshot fan-out before any hosted/public claim; do not use browser rate as the limiter |
| Accessibility | Current semantic direction buttons support keyboard and assistive activation | Start/stop semantics must remain keyboard accessible and announce moving/stopped/recovery states without relying on animation |

## Alternatives

### Option A — Keep the snapshot-gated client hold

Retain Task054 as the only page movement path. The browser emits discrete commands after each accepted
snapshot and stops on lifecycle loss.

- **Benefit:** No new transport, server lifecycle, or contract surface.
- **Cost:** Movement speed is round-trip bound and can feel slow under latency; the worker cadence that
  already exists is not used for the avatar while the page is open.
- **Falsifier:** A measured MVP browser trace shows the local path is sufficiently responsive at the
  expected latency and no server-owned intent is needed.

### Option B — Server-owned intent with an explicit connection-bound lifetime (accepted)

Expose one exact start and one exact stop command through one-shot WebSocket frames on the existing
server-bound page/session boundary. The start command sets the existing cadence intent and returns
metadata only. The stop command clears it against the current server revision. The intent is bound to
the same server-issued realtime session; connection close, scope invalidation, worker drain/fault,
definitive crossing failure, or a competing state-changing page command stops it. A newer connection
may supersede an older owner, but an old close cannot stop the newer intent. A fresh connection
requires a fresh explicit start. Full snapshots remain the only renderable position ingress.

- **Benefit:** The worker's existing cadence supplies smooth continuous-feeling movement without a
  browser clock, per-step HTTP flood, prediction, or new gameplay authority. Unexpected page loss has
  a deterministic stop boundary.
- **Cost:** The realtime/session boundary must expose a safe stop hook or lease registry, and the page
  transport needs one additional command contract. Close ordering and start/stop races require level-4
  runtime proof.
- **Falsifier:** The current connection cannot be made the sole session owner, or the stop hook can
  race with a crossing such that an intent moves after the connection is definitively closed.

### Option C — Fixed browser interval or WebSocket control stream

Send repeated commands from `setInterval`, `requestAnimationFrame`, or a new control frame.

- **Benefit:** Familiar input implementation and potentially low perceived latency.
- **Cost:** It creates a browser timing authority or expands the realtime wire before the lifecycle,
  backpressure, and reconnect contracts are proven. It can overlap commands, leave an orphaned stream,
  or create a second queue.
- **Disposition:** Reject for this decision; a WebSocket control protocol would need a new CP-08/ADR
  decision even if it eventually wraps the same server intent.

## Implemented interaction contract under Option B

| Input | Server effect | Page behavior | Stop or recovery |
|---|---|---|---|
| First ready map/button press | One `set_movement_intent` with current revision and new idempotency key | Show `MOVING` only after typed acceptance; do not move the avatar from the response | Realtime close, scope change, worker fault/drain, dispatch start, or explicit release sends/records stop |
| Direction change | One replacement `set_movement_intent` after the latest accepted player revision | Replace local direction; do not overlap or queue a second intent | Stale result fail-stops the same owner's old direction, requests full resync, and requires a new explicit press |
| Release/blur/hidden/cancel | One `stop_movement_intent` when the session is still valid | Clear local active direction immediately; stop response is not a position update | If stop transport is unknown, mark recovery and do not silently retry; server connection-close hook is the safety boundary |
| Worker cadence crossing | Existing derived `move_player` transaction | Accept only the newer full snapshot and render it | Blocked/stale crossing clears intent and shows a typed stopped state |
| Reconnect | No automatic intent replay | Require a new explicit press after `READY` and fresh snapshot | Old command identities and old connection scope cannot affect the new session |

The exact command/result envelope, message handling, connection-owner close hook, and page lifecycle
described here are implemented under [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md)
and [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md). The local runtime
result is recorded in [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
and reviewed in [`Validation/71`](71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).

## Race and failure matrix

| Race or failure | Required invariant | Expected result |
|---|---|---|
| Start arrives while dispatch is pending | Shared page/server gate serializes state-changing work | Start is rejected or ordered after dispatch according to the accepted gate; no mission/movement overlap |
| Stop arrives while dispatch is pending | Release is safety-critical | Stop is admitted through the same worker FIFO or connection close clears the intent; no indefinite movement |
| Start and stop cross in transport | Command identity and FIFO ordering are authoritative | The later accepted operation wins; duplicate replay never replays against a newer intent |
| Direction replacement during a 100 ms step | Worker serialization, owner token, and current revision remain authoritative | At most one crossing uses the old intent; replacement uses the post-crossing revision or fail-stops the same owner before returning typed stale |
| Realtime close races a crossing | Close revokes the owner synchronously before its async cleanup | No crossing after the close boundary; if one crossing commits before close, it is exactly once and visible in the next snapshot |
| Two sessions use the same player | One player has one active intent and the owner token is checked on every stop/revoke | Newer session supersedes older intent; old stop/close is a typed no-op and cannot stop the newer owner |
| Stop carries a stale page revision | Explicit stop is a safety release, not a position mutation | Server resolves current revision, clears only the owning intent, and returns a typed stop result |
| Page loses focus but stop packet fails | Local UI cannot be the only safety boundary | Blur/hidden sends one best-effort stop; a definitive connection close revokes the owner synchronously. The MVP adds no lease or heartbeat, so an open-but-hidden connection can retain an accepted intent until an explicit stop, competing mutation, fault, drain, or close |
| Unknown start/stop result | Unknown is not success | Intent is marked recovery-required; page does not retry or re-arm until a fresh snapshot/session read |
| Worker drains or faults | Scheduler/gateway admission remains explicit | Intent is cleared or becomes unavailable; no queued movement after drain |
| Blocked map edge | Domain rejection is terminal for this intent | One visible stop reason, no repeated rejected crossings |
| Browser reconnects after worker restart | Process-local intent is not durable | Old intent is gone; fresh page session must explicitly start again |
| Foreign body/query identity | Session resolver is sole authority | Typed scope failure or ignored untrusted field, with no Player B mutation |
| Automatic snapshot publication is slow | Publication is detached from `advance()` | Gameplay continues; one coalesced per-connection publication pump, no per-step promise storm |

## Verification and evidence gate

### Preparation and implementation verification

- Confirm the current service, gateway, realtime close, page gate, and snapshot publication surfaces
  match the facts above.
- Confirm no existing contract or current runtime already defines the missing session stop/lease rule.
- Keep Task054's local client presentation result and CP-13 adapter blocker unchanged.

### Admission and runtime result

1. **Satisfied:** Owner accepted Option B, one-shot WebSocket control frames, connection-bound owner,
   newer-session supersession, no MVP lease/heartbeat, and best-effort blur/hidden stop on 2026-09-03.
2. The implementation task defines one transport, one server-derived session binding, command and
   crossing identity, and the stop/close ordering.
3. Red tests cover positive start/stop, duplicate replay, stale revision, direction replacement,
   foreign scope, dispatch overlap, close/lifecycle stop, blocked edge, unknown result, worker drain,
   reconnect, and no post-close crossing.
4. [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
   records the Green/runtime proof with a fresh file-backed fixture, the real worker cadence, the
   authenticated local wire, connection close, worker fault/stop cleanup, blocked-edge outcome, and
   clean drain. It records exact revisions and proves no second timer or queue.
5. [`Validation/71`](71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md) checks
   mission/cargo/combat/world-time/event/idempotency/privacy and UI accessibility surfaces. The named
   local implementation is runtime-verified; hosted continuity, independent browser identity,
   WebMCP, Re-entry, and public-load claims remain separate gates.

## Decision and reopen boundary

**Accepted path:** Option B, server-owned intent with one opaque connection-bound owner, one-shot
WebSocket start/replacement/stop command frames, worker cadence as the only movement driver, and full
snapshots as the only renderable position ingress. The MVP does not add a lease/heartbeat; blur/hidden
is best effort and connection close is the hard safety boundary.

**Decision status:** Owner accepted this path on 2026-09-03. The canonical decision is
[`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md), the implementation
task is [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md), the runtime result is
[`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md), and
the cross-functional audit is [`Validation/71`](71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
Task054 remains a supported discrete/snapshot-gated fallback presentation scope; implementation of
this path must not silently create a second renderable authority.

Reopen this Challenge if any option changes world authority, intent lifetime, session binding,
command identity, revision/idempotency, page gate, snapshot publication, reconnect behavior, or the
`SK-MVP-0.2` contract.
