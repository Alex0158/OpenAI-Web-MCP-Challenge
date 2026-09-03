# ADR-GAME-0036: CP-12 Server-Owned Continuous Movement Intent

**Status:** OWNER-ACCEPTED; RUNTIME-VERIFIED FOR THE NAMED LOCAL SERVER-TO-PAGE SCOPE  
**Date:** 2026-09-03  
**Decision owner:** Game owner  
**Accepted by owner:** 2026-09-03  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md)  
**Decision task:** [`../Tasks/SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md`](../Tasks/SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md)  
**Implementation task:** [`../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md)
**Runtime evidence:** [`../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)  
**Cross-functional audit:** [`../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md)

## Context

The CP-08 worker already owns a 100 ms movement cadence and derives integer `move_player` crossings,
while CP-12 currently presents a snapshot-gated client hold. The client hold is safe but remains
round-trip bound. Exposing the existing cadence can make a held direction feel continuous, provided a
page cannot create a second clock, renderable position ledger, or intent that survives the page's
server authority.

The preparation review found two concrete races. The cadence map is keyed only by `(world_id,
player_id)`, so a stale connection close could otherwise stop a newer session's movement. Also, a
background crossing can advance the player revision between a page direction replacement and its
execution; if the old intent remains active after a stale response, the page appears stopped while
the server keeps moving it.

## Decision

### 1. One-shot WebSocket commands

The canonical page sends one server-bound `movement_intent_command` frame when a direction starts or
changes and one frame when it stops. The frame carries a command identity, idempotency key, contract
version, expected player revision, and typed direction only. It never carries world, player, shelter,
binding, or connection identity. The realtime adapter derives all scope from its authenticated
connection and delegates through the existing `WorkerCommandGateway`.

The wire is deliberately not a browser interval, animation loop, heartbeat, or periodic control
stream. A command response contains typed metadata only. The worker cadence remains the sole movement
driver and the existing complete `client_snapshot` remains the sole renderable position ingress.

### 2. Connection ownership and supersession

Each session-owned intent stores an opaque server-issued realtime `connectionId`. A player still has
at most one active intent. A valid start from a newer connection supersedes an older owner for that
player. A stop or close from an old owner checks the token and becomes a typed no-op; it cannot clear
the newer intent. A fresh connection never replays an old command identity or intent.

Connection close, adapter drain/close, worker fault, and worker stop revoke the owner synchronously at
the cadence boundary before asynchronous cleanup. This prevents a later worker crossing from using a
closed owner even if the cleanup command is still queued. The MVP does not add a server lease or
heartbeat. Blur/hidden sends one best-effort stop; connection close is the hard safety boundary.

### 3. Revision, stop, and failure semantics

The worker gateway serializes start, replacement, stop, direct move, and mission dispatch operations.
An explicit stop is a safety release: the server resolves the current player revision and clears only
the matching owner, even if the page's expected revision is stale. A competing direct move or mission
dispatch first safety-stops any active intent in the same gateway operation, then executes its existing
transaction. This preserves one mutation authority across sessions.

A direction replacement must carry the latest accepted revision. If it is stale, the server
fail-stops that same owner's active intent before returning `STALE_REVISION`; an owner mismatch never
clears another session. Definitive blocked/stale cadence crossings also clear the intent. Unknown
transport outcomes stop local re-entry and require a fresh authoritative snapshot before a new press.

Command identities and cadence crossing identities remain separate. Duplicate command replay returns
the stored result and never reactivates or clears a later intent. Fractional progress remains
process-local and is discarded on stop, close, worker fault, drain, or restart.

### 4. Lifecycle and projection

The page may optimistically clear its local active direction on release/blur/hidden, but it never
renders a position from the command result. Worker crossings continue through `WorldClock` and
`PlayerMovementService`, persist the existing revision/event transaction, and publish the existing
full snapshot. Reconnect requires a fresh snapshot and a fresh explicit start. Unsupported or stale
movement is visible; there is no hidden fallback from server intent to a browser timer.

## Alternatives considered

| Alternative | Disposition |
|---|---|
| Keep only the CP-12 snapshot-gated client hold | Safe fallback, but RTT-bound and leaves the already verified worker cadence unused for the primary held interaction |
| Browser interval or animation loop | Rejected: creates a second clock, can overlap commands, and cannot guarantee close safety |
| Periodic WebSocket control stream | Rejected: expands backpressure and reconnect surface without improving the one command boundary |
| Server lease/heartbeat for this MVP | Deferred: useful only if product requires stop while a connection remains open; it needs a separate timing/expiry decision |
| Intent keyed only by player | Rejected: an older session could stop a newer session or a close race could leave ownership ambiguous |

## Consequences and limits

The page can express continuous-feeling movement using the worker's existing cadence without a browser
clock, per-step request flood, prediction, or second snapshot ledger. The server must maintain owner
tokens and synchronous close revocation, and the realtime wire gains one bounded command frame type.
Each movement frame also rechecks runtime admission at message handling time, so a connection that
survives until the worker or runtime becomes degraded cannot create a new intent after the scheduler
has stopped accepting work.
The no-lease choice makes blur/hidden best effort; a browser that remains connected after losing
visibility can keep an accepted intent until a stop or close boundary, which is a deliberate MVP
trade-off and a reopen trigger if unacceptable in playtest.

This ADR does not prove hosted continuity, public capacity, independent browser identity, WebMCP,
Re-entry, combat, mission, economy, or production scheduler behavior. It does not change the
`SK-MVP-0.2` version, event vocabulary, persistence schema, world clock, or snapshot shape.

## Verification and reopen triggers

`SK-TASK-057` and [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
prove Red → Green → Refactor coverage for frame parsing, session ownership, newer-session supersession,
stale replacement fail-stop, stale explicit stop, duplicate replay, close/drain/fault revocation, no
post-close crossing, move/dispatch safety stop, runtime-admission rejection, reconnect reset,
full-snapshot-only rendering, and client lifecycle. [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md)
reviews the worker, gateway, wire, client, projection, privacy, and downstream-module boundaries.

Reopen if an intent can survive owner close, an old owner can clear a newer one, a stale replacement
leaves the old direction active, a command response becomes a position source, a periodic browser or
wire timer appears, direct move/dispatch can overlap an intent, or the no-lease hidden-page behavior
fails the accepted MVP experience. Hosted, independent-browser, WebMCP, Re-entry, and public-load
claims always require their own evidence even while this local decision remains verified.
