# CP-12 Browser Hydration and Two-Session Pre-Implementation Challenge

**Status:** ACCEPTED CHALLENGE; one-browser implementation/runtime evidence accepted; independent two-session proof remains open  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-040`](../Tasks/SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md)  
**Date:** 2026-09-02

## Question

Can the existing CP-12 page and the owner-accepted local fixture session be proven in an actual
browser without adding a second identity, transport, worker, or capability authority?

## Evidence that could disprove the path

- The page loads but never hydrates or reports a client exception.
- Bootstrap and WebSocket scopes differ, or a first frame can bind a player without the server-derived
  scope that arrived before it.
- Canvas and semantic output disagree about the accepted snapshot or expose hidden/foreign state.
- A socket or capability failure causes an infinite retry, a false success state, or an unusable human
  page.
- Two browser contexts share a cookie, projection singleton, mutable socket, or private state.

## Options

### Option A — Process evidence only

Keep the current level-4 process result as the only claim. This is safe but leaves the browser page and
human presentation unproven, which blocks the CP-12-to-CP-13 handoff.

### Option B — Exact browser smoke on the existing boundary (selected)

Start one explicit local fixture process, load the canonical page in the selected browser, read the
semantic and Canvas-facing state, and use a second isolated context when the browser supports it. Keep
the bootstrap cookie and first-frame scope server-derived, keep the page read-only during hydration, and
record any unavailable browser or adapter capability as a limitation. This adds no game authority and
directly tests the next acceptance boundary.

### Option C — Add a browser-specific adapter or mock

Introduce a test-only or production-looking page adapter to manufacture a successful render. This may
make screenshots easier but would hide the actual browser/network boundary and could be mistaken for
WebMCP or hosted evidence; it is rejected.

## Selected boundary

Use Option B. The process remains the same entrypoint-owned fixture composition from
[`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md). The browser is a
projection consumer: it receives the bootstrap scope, validates the first full frame, and only then
correlates the server-issued connection id. It may read status and pixels but cannot authoritatively
choose a player, coordinate, clock, mission, cargo, or capability result.

## Cross-functional acceptance matrix

| Surface | Positive proof | Negative or boundary proof | Owner |
|---|---|---|---|
| HTTP/page | Canonical page returns and hydrates | Bootstrap/process unavailable remains visible; no retry storm | Entrypoint + client |
| Session identity | Alpha maps to player-a and shelter-a | Beta is isolated; query/body player selection is ignored | Fixture resolver |
| Realtime | First full frame matches pre-bound scope and reaches projection | Foreign/malformed/stale frame is rejected or shown stale | Wire + projection |
| Presentation | Semantic status, mission/resource text, and Canvas frame agree | Missing frame/asset leaves readable fallback | React/Canvas |
| Lifecycle | Closing the socket updates status and leaves history readable | No command is sent during hydration; no hidden success | Client |
| Capability | Human UI works with no WebMCP adapter | `document.modelContext` status is not misreported as invocation | CP-13 handoff |
| Operations | Isolated file-backed fixture process starts and shuts down | No production/hosted/always-on claim | Entrypoint/runbook |

## Reopen conditions

Reopen this challenge and its task if the page needs a new hello/ticket protocol, a second worker/store,
client-selected identity, a browser command during hydration, a hidden fallback, or a change to the
accepted projection/session contract. A genuine WebMCP discovery or invocation result is recorded by
CP-13, not retroactively attributed here.
