# ADR-GAME-0035: CP-12 Snapshot-Gated Held Movement

**Status:** ACCEPTED; NAMED LOCAL CP-12 RUNTIME VERIFIED  
**Date:** 2026-09-03  
**Decision owner:** Active `SK-TASK-054` engineering authority under the owner-accepted G2 contract  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`../Validation/65-cp12-held-movement-preimplementation-challenge.md`](../Validation/65-cp12-held-movement-preimplementation-challenge.md)

## Context

[`ADR-GAME-0030`](ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md) established a
strict, single-flight browser movement path: one input expresses one adjacent `move_player` command,
the server owns position and collision, and only an accepted full snapshot replaces the projection.
The page now also receives successful worker progress automatically through
[`ADR-GAME-0034`](ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md). A single physical
press remains correct, but a player holding a direction or a touch direction button needs a bounded
continuous-feeling interaction for the MVP presentation.

Adding a browser interval or a second movement authority would create queued commands, stale
collisions, or client-owned timing. The decision therefore keeps the existing command and
reconciliation contracts and adds only a client input controller.

## Decision

### 1. A hold is a bounded sequence of existing discrete commands

The first non-repeat map keydown or ready direction-button pointer/keyboard activation submits one
existing `move_player` command immediately. After that command is authoritatively reconciled, the
controller waits at least 180 milliseconds and may submit at most one next command for the current
direction. The same rule repeats until the input is released or a stop condition occurs.

The controller has no position ledger, world clock, prediction, interpolation authority, command
queue, or retry. The existing page mutation gate and movement reconciliation gate remain the only
admission controls. A direction change replaces the local active direction while an existing command
is in flight; it does not start a concurrent request.

### 2. Keyboard, pointer, and assistive activation share one semantic surface

- A focused map accepts W-A-S-D and arrow keydown under the existing focus, visibility, modifier,
  composition, and connection checks. Keyup stops the hold. Map blur stops it only when focus leaves
  the map surface; moving focus to a descendant direction button does not accidentally cancel a
  pointer hold.
- A labelled direction button starts on primary pointer/touch down, uses pointer capture as a local
  delivery aid, and stops on pointerup, pointercancel, lost capture, lifecycle loss, or teardown.
  Enter and Space use the same hold controller; repeated activation is suppressed.
- A programmatic or assistive click that has no registered pointer or keyboard hold remains one
  discrete `onMove` activation. A generated click following a real pointer or keyboard hold is
  suppressed so one gesture cannot produce two commands.

### 3. Authority and lifecycle remain explicit

The hold is available only while the page has a `READY` connection and an authoritative snapshot.
The expected movement request is allowed to remain active while `movementPending` is true; a dispatch
mutation, stale or closed connection, hidden or blurred page, scope change, unmount, or definitive
movement rejection stops the controller and clears its timer. Unknown movement outcomes use the
existing mark-unknown/resync path and remain stopped until a fresh snapshot makes a new explicit
input safe. The page never waits for a hold to advance the world.

## Alternatives considered

- **Browser `setInterval` stream:** rejected because it can send while a prior command is pending,
  grow an unbounded queue, and flood stale or blocked requests.
- **Server-owned movement intent from the page:** deferred to a separate CP-08/host-scheduler
  decision because it would expand the command surface, cadence proof, lifecycle, and hosted
  topology.
- **Native browser key repeat only:** rejected because repeat cadence is browser-dependent and does
  not provide authoritative settle or explicit stop handling.
- **Client position prediction:** deferred; it would add a second renderable state and correction
  ledger without helping the small local MVP trace.

## Consequences and limits

The map and direction pad feel continuous enough for local play while every visible tile still comes
from the server snapshot. The 180 ms floor limits the client-side attempt rate to roughly 5.5 per
second before network latency, and the single-flight gate normally lowers it further. High latency
therefore slows the feel rather than creating a queue. The increment changes no server file, command
schema, worker cadence, persistence schema, realtime frame, WebMCP surface, Re-entry path, or
production identity.

This is a local desktop/touch presentation result. It does not prove the accepted worker cadence in a
browser, a default or hosted scheduler, independent browser identities, public-load capacity,
WebMCP, Re-entry, or final mobile layout quality.

## Verification and reopen triggers

The controller's injected-scheduler tests cover immediate start, settle-gated repeats, release,
direction changes, blocked/unavailable stops, and no queue. The local browser proof covers the real
page's labelled pointer-button and focused keyboard paths, one authoritative revision per gesture,
and clean entrypoint shutdown. Typecheck, optimized build, affected CP-12 regressions, and the
documentation validators remain required for closure.

Reopen this decision if a hold produces overlapping or queued requests, continues after release,
blur, hidden, stale, blocked, or scope change, renders a position without an accepted snapshot,
requires a server intent/schema or new clock, loses the semantic button path, or demonstrates that
the RTT-bound feel cannot meet the MVP trace without a separately reviewed server-owned intent.

The runtime result is recorded in [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md),
with the cross-functional disposition in [`Validation/66`](../Validation/66-cp12-held-movement-runtime-cross-functional-audit.md).
