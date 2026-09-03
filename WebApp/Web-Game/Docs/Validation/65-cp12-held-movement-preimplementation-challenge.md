# CP-12 Held Movement and Touch Input Pre-Implementation Challenge

**Status:** ACCEPTED; IMPLEMENTATION VERIFIED FOR THE NAMED LOCAL CLIENT PRESENTATION SCOPE
**Checkpoint:** CP-12
**Task:** [`SK-TASK-054`](../Tasks/SK-TASK-054-cp12-held-movement-and-touch-input.md)
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
**Predecessor:** [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
**Decision:** [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)
**Scenario:** [`CP-12 Canvas and dashboard fixtures`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
**Runtime audit:** [`Validation/66`](66-cp12-held-movement-runtime-cross-functional-audit.md)
**Evidence:** [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md)
**Date:** 2026-09-03

## Decision question

Can CP-12 add continuous-feeling keyboard and touch input without changing the accepted movement
authority, command schema, worker cadence, or full-snapshot reconciliation? The proposed answer is a
client-only hold controller that emits one existing discrete move after each authoritative settle,
with explicit lifecycle stops and no queue.

## Binding constraints

- The server owns player position, collision, explored cells, revisions, events, and world time.
- The existing page mutation gate and movement reconciliation gate admit at most one movement command.
- A snapshot is the only renderable position replacement; the browser does not predict or accumulate tiles.
- A held input must stop when it loses focus, visibility, connection readiness, or a definitive command result.
- Ordinary click and keyboard activation must remain accessible; touch support cannot remove the semantic button path.
- No new server command, worker loop, schema field, WebMCP tool, Re-entry action, or mobile layout is admitted.

## Current evidence, inference, and unknowns

### Verified

1. The discrete movement path is runtime-verified locally and uses one typed HTTP command followed by a full WebSocket snapshot.
2. The worker already has an authoritative 100 ms cadence, but browser input does not own or drive that clock.
3. The current CP-12 scenario explicitly leaves continuous held input open and treats it as a presentation concern.
4. The current adapter/WebMCP capability remains unavailable; this task does not depend on it.
5. The named local implementation now passes the focused controller and shared-dispatch checks,
   typecheck, optimized build, and the local browser wiring proof recorded in [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md).

### Inferred

- Waiting for `movementPending` to clear and the matching snapshot to arrive gives smooth enough local movement while preserving the existing race and revision guards.
- A 180 ms minimum delay limits local request rate to roughly 5.5 attempts per second before network latency, while the single-flight gate normally lowers it further.
- Stopping at a blocked boundary is safer and clearer than repeatedly sending a known rejected move.

### Unknown

- Exact pointer-capture behavior in every browser and device; the selected in-app browser proof covers
  the integrated pointer lifecycle and `touch-action` boundary only.
- Feel under high latency and a trusted physical long-duration browser hold. The in-app Browser control
  can issue presses/clicks but cannot generate a controlled key-down/key-up or pointer-duration trace;
  injected-scheduler tests cover multiple repeat steps and lifecycle stops.
- Whether a future authoritative intent API is desirable; that would require a separate CP-08/ADR decision.

## Proposed interaction contract

| Input | Start | Repeat | Stop | Visible authority |
|---|---|---|---|---|
| Map key W/A/S/D or arrow | First non-repeat keydown while map is focused and ready | One existing `onMove` after the prior snapshot settles and 180 ms has elapsed | Keyup, blur, hidden page, disabled/stale/closed state, definitive rejection | Full `client_snapshot` only |
| Direction button pointer/touch | Pointerdown on a ready labelled button; pointer capture is local input state | Same one-at-a-time rule; no queued callbacks | Pointerup/cancel/lost capture, blur, hidden page, disabled/stale/closed state, definitive rejection | Full `client_snapshot` only |
| Assistive or programmatic click | One discrete `onMove` | None unless a real pointer/key hold was registered | N/A | Full `client_snapshot` only |

The proposed controller permits one active direction. A new direction replaces the held direction
after stopping the old one; if a command is in flight, the new direction waits for the existing gate
to settle and never sends a second request concurrently.

## Alternatives

| Option | Behavior | Trade-off | Disposition |
|---|---|---|---|
| A. Snapshot-gated client hold | Existing discrete command per settled snapshot, bounded 180 ms timer, explicit stop causes | Small client change, preserves every server contract; movement feels limited by round-trip time | **Recommended** |
| B. Browser `setInterval` command stream | Send on a fixed interval regardless of acknowledgement | Can build an unbounded queue, create stale collisions, and flood the server | Rejected |
| C. Expose server `set_movement_intent` to the page | Browser starts/stops a worker intent and receives cadence snapshots | More fluid, but expands page authority, schema, lifecycle, and recovery proof | Defer to a separate CP-08 decision |

## Cross-functional failure matrix

| Failure or race | Preventive rule | Expected result |
|---|---|---|
| Key auto-repeat fires | Ignore repeat keydown; controller owns one hold | No duplicate initial command |
| Pointer leaves or touch is cancelled | Pointer capture plus cancel/lost-capture stop | No hidden continuing hold |
| Page blurs or becomes hidden | Stop and clear timer on lifecycle event | No background command stream |
| Previous move is still pending | Snapshot-gated single-flight check | No queued or overlapping request |
| Map edge or blocked cell | Definitive rejection stops hold | One visible blocked result, no retry storm |
| Unknown HTTP/network result | Existing mark-unknown and resync path; stop hold | Fresh snapshot decides next explicit action |
| Direction changes during flight | Replace local held direction only; wait for gate | Previous command settles, then one new direction |
| Dispatch starts while holding | Shared page mutation gate disables/rejects movement | No movement/dispatch overlap |
| Scope changes or reconnect | Existing gate invalidation clears hold | Old pointer/key cannot move the new scope |
| Unmount or stale callback | Cleanup cancels timer and capture | No post-unmount request |

## Verification plan

### Red

- A hold starts only from a ready focused surface and rejects repeat, modifier, composing, hidden, or stale input.
- A second request cannot start before the first movement snapshot settles; timer callbacks never queue work.
- Release, blur, visibility change, pointer cancellation, blocked result, and scope invalidation stop the controller.
- A direction change preserves one active direction and never creates two in-flight attempts.

### Green and runtime

- Existing CP-12 keyboard/transport tests remain green.
- The focused controller tests prove the lifecycle and bounded timing with an injected scheduler.
- A real local Node 24 browser run verifies the canonical page's labelled pointer and keyboard paths,
  one authoritative revision per gesture, generated-click de-duplication, semantic controls,
  `touch-action: none`, empty warning/error logs, and clean SIGINT drain. The injected scheduler proves
  multiple held steps plus release, blocked, unavailable, and unknown-recovery stop behavior because
  the browser adapter cannot generate a trusted long-duration hold.
- Documentation validators and typecheck pass; no server, schema, persistence, WebMCP, or Re-entry test is added.

## Decision and reopen boundary

**Accepted path:** Option A, snapshot-gated client hold with a 180 ms minimum delay and explicit
lifecycle stops. The implementation is runtime-verified for the named local client presentation scope;
the browser limitation above is part of the claim boundary.

This is a CP-12 presentation increment, not a new gameplay intent contract. It can be implemented
under the registered Task054 while the CP-13 adapter gate remains open. Promote a separate ADR before
changing the server command surface, cadence authority, snapshot schema, or movement prediction.

Reopen this Challenge if local evidence shows poor usability that cannot be fixed within the client
hold boundary, any input path bypasses the existing gate, or a future design needs server-owned
continuous intent. The accepted local result does not close hosted/default continuous movement,
independent browser delivery, WebMCP, Re-entry, production identity, or final mobile quality.
