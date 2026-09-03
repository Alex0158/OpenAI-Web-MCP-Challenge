# CP-12 Keyboard Movement Pre-Implementation Challenge

**Status:** CLOSED; BOUNDED LOCAL RUNTIME VERIFIED UNDER `SK-TASK-044`  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-044`](../Tasks/SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md)  
**Decision:** [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)  
**Date:** 2026-09-02

## Question

What is the smallest truthful W-A-S-D path that can move the local player now, preserve the accepted
server authority and identity rules, and avoid pulling the deferred all-phase scheduler into a CP-12
browser increment?

## Evidence that changes the initial hypothesis

- `PlayerMovementService.move()` already owns one adjacent-tile mutation, collision, explored-cell
  persistence, `PlayerMoved`, revision checking, and idempotency. The process-local gateway does not
  expose this command yet.
- `PlayerMovementCadenceService` is the accepted continuous-intent path, but it crosses a tile only
  when the worker-owned `WorldClock` advances. The default browser fixture constructs no clock or host
  scheduler, so accepting an intent alone cannot move the player.
- Adding a 100 ms browser loop, advancing the worker from a request handler, or creating a
  movement-only server interval would violate the clock boundary or leave mission, extraction,
  combat, and return phases on a different scheduler composition.
- The accepted realtime wire is projection/resync-only. Adding movement frames would reopen its
  protocol and identity contract, while the normative G2 command contract already selects typed HTTP
  commands.
- `LocalFixtureSessionResolver.resolveBootstrap()` deliberately issues Player A's opaque cookie when
  bootstrap receives no cookie. Its current `resolve()` delegation inherits that permissive behavior.
  A mutation adapter must not treat an absent cookie as authorization for Player A.
- The G2 lock requires `command_id` and `idempotency_key` to remain distinct. The current direct move
  service has only the latter and uses it as event causation, which is insufficient for the first
  public command envelope.

## Options

### Option A — Add the default all-phase host scheduler now

This would unlock continuous held-key intent and the eventual always-running world. It also requires
composition, lifecycle, drift/backpressure, catch-up, and cross-phase evidence for every implemented
due-work handler. That is valuable later work but is not the smallest CP-12 presentation increment.

### Option B — One discrete authoritative move per physical key press (selected)

Ignore OS key-repeat and accept one W-A-S-D or arrow-key command only when the page is visible and
focused, the target is not interactive, the realtime projection is `READY`, a full scoped snapshot is
present, and no previous move is awaiting reconciliation. POST one typed `move_player` envelope to an
entrypoint-owned non-production adapter. The server derives world, player, shelter, and binding only
from an already-issued opaque fixture cookie, serializes the existing move through the worker gateway,
and returns an acknowledgement with the committed revision and event id but no position projection.
The client then sends the existing WebSocket `resync_request` and re-enables movement only after a
newer full frame proves the acknowledged player revision.

### Option C — Put commands on `/realtime`

This saves one local request but changes the accepted projection-only protocol, mixes command and
frame backpressure, and duplicates command validation in the socket adapter. It is rejected for this
increment.

### Option D — Return and render a snapshot in the HTTP response

This removes one local round trip but creates a second projection ingress that has no WebSocket
sequence. It then needs a causal merge rule to stop a later socket frame rolling the page backwards.
The existing explicit resync is smaller and keeps one projection authority, so this option is
rejected.

## Selected boundary

1. **Discrete input.** One non-repeat keydown equals one adjacent command. Holding a key creates no
   browser-timed movement. Continuous 4-tiles-per-world-second intent remains verified at the worker
   seam and awaits a separately accepted all-phase scheduler/browser transport increment.
2. **Strict command session.** Bootstrap may issue the default local opaque cookie. Realtime and
   mutation admission require an existing recognized cookie; absent, malformed, or unknown cookies
   never default to Player A. Query and body player identifiers are ignored or rejected as invalid
   command shape. Mutation resolves that existing session before media/body parsing, so
   unauthenticated malformed or oversized bodies remain `401` rather than exposing parser detail.
3. **Exact HTTP envelope.** The request carries distinct `command_id`, `command_type`,
   `contract_version`, scoped `expected_entity_revisions`, `idempotency_key`, and
   `typed_arguments`. The HttpOnly cookie is the transport representation of `session_binding`; raw
   binding never enters page data or JSON.
4. **Gateway and transaction.** The entrypoint parses and bounds transport input, then calls one
   `WorkerCommandGateway.movePlayer()` operation. The gateway delegates to the existing movement
   service; collision, fog reveal, event persistence, ownership, revision, and idempotency stay in the
   domain transaction.
5. **Causal identity.** `command_id` becomes `PlayerMoved.causation_id` and remains different from the
   event's `idempotency_key`. A retry reuses both identifiers; reusing one idempotency key with a
   different command shape or command id is `DUPLICATE_COMMAND`. On a new key, revision validation
   precedes collision; stale and blocked results are durably replayable after restart or later state.
6. **One projection ingress.** A success acknowledgement never moves Canvas. It triggers the existing
   WebSocket full resync; only `RealtimeProjectionClient.accept()` can replace rendered state. The
   gateway FIFO orders the resync read after the acknowledged command.
7. **Bounded causal resync.** The acknowledged player revision is the reconciliation target. If an
   already in-flight hub read produces one lower-revision frame, the client requests at most one
   follow-up resync after that frame settles. A second lower-revision frame leaves movement visibly
   stale and requires manual reconnect; it never creates a read loop.
8. **Unknown or late outcome.** A lost HTTP response is never automatically retried. The page requests
   one authoritative resync and reports that the command outcome was unknown. `STALE_REVISION` also
   resyncs. A successful response arriving after reconnect requests a fresh read on the current socket
   only when the server-derived scope is unchanged; a changed-scope callback is ignored. A persisted
   `MOVEMENT_BLOCKED` rejection is stable under retry even if later commands change the player's tile.
   Authenticated, valid definitive rejections return a bounded typed command result with current
   player revision; transport/auth/readiness/admission failures remain transport errors.
9. **Focus and accessibility.** Keyboard input is owned by one explicitly focusable map movement
   surface, not a document-global listener. It ignores repeat, composition, handled events, and
   modifier shortcuts. Visible directional buttons provide the same bounded command for users who do
   not use W-A-S-D. Status text announces submitting, blocked, reconciling, accepted, and unavailable
   outcomes without relying on Canvas or color; reconnect never steals map focus.

## Cross-module acceptance matrix

| Surface | Positive proof | Negative or boundary proof |
|---|---|---|
| Identity | Existing alpha cookie moves only Player A | No or unknown cookie fails without mutation; a body player field is rejected; a query player selector is ignored and can never select or mutate Player B |
| Command | Exact typed envelope commits one adjacent move | Extra keys, wrong contract, equal command/idempotency ids, stale revision, duplicate conflict, and oversize body are typed failures |
| Persistence | Position, explored cells, revision, event, and idempotency commit together | Blocked or rejected input creates no move/event/fog effect and replays the same rejection after later state changes |
| Ordering | HTTP acknowledgement settles before WebSocket resync is requested | No route calls the store/service outside the gateway; no request advances world time |
| Projection | A newer full frame reaches the acknowledged player revision and shows position/fog | HTTP result cannot set Canvas; one coalesced low-revision frame gets one follow-up read, then fails stale without a loop |
| Input | One focused map-surface non-repeat W-A-S-D/arrow action submits once | Key repeat, modifier/IME input, focus outside the map, hidden page, stale connection, missing snapshot, and in-flight input submit zero commands |
| Lifecycle | Ready fixture admits; shutdown/reconnect remains visible | Connecting, stale, closed, degraded, missing session, and production mode reject commands visibly |
| Scope | Local desktop fixture only | No continuous intent UX, all-phase scheduler, production auth, mobile/touch, WebMCP, Re-entry, or hosted claim |

## Minimum TDD and runtime proof

1. Red: strict existing-session admission, exact command parser, distinct command/idempotency identity,
   stable blocked replay, gateway move ordering, typed HTTP outcomes, focused-map keyboard admission,
   late same-scope completion, and bounded acknowledgement-to-resync state.
2. Green: the smallest resolver, gateway, entrypoint adapter, client command gate, status/controls, and
   resync composition that satisfy those contracts.
3. Refactor only after the focused tests pass; retain one command path and one projection ingress.
4. Regress CP-08 movement/gateway/wire and CP-12 fixture/reconnect/projection surfaces, then run
   typecheck/build and one isolated browser proof with an accepted move and a blocked move.

## Recovery and reopen triggers

Remove only the new adapter/input surface if it cannot preserve the existing read-only projection;
the direct movement service and realtime transport remain valid predecessors. Reopen this challenge
before implementation changes if acceptable UX requires held-key cadence, local prediction, a
periodic publisher, an all-phase scheduler, a new session issuer, a WebSocket command, a changed
snapshot shape, or a second projection ingress.

## Post-implementation challenge result

The adversarial Red pass found one cross-module ordering defect: a command that was both stale and
geometrically blocked was initially persisted as `MOVEMENT_BLOCKED`, which would have let the client
clear its pending state without resyncing. The final transaction now replays an existing key first,
then durably rejects stale revision before collision. The same review required strict session
resolution before body parsing and a complete typed definitive-failure result instead of a bare
error code.

The final source, optimized browser runtime, persisted movement/fog/event state, restart, and clean
shutdown are accepted in [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md)
and [`Validation/53`](53-cp12-keyboard-movement-runtime-cross-functional-audit.md). Global
`command_id` reuse across a new idempotency key, realtime/gateway public-load admission, continuous
movement, scheduler composition, independent sessions, WebMCP, and Re-entry remain explicit later
gates.
