# CP-12 Client Projection and Accessible Mission Row Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-037`](../Tasks/SK-TASK-037-cp12-client-projection-and-mission-row.md)
- Evidence: [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md)
- Governing decision: [`ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Pre-implementation challenge: [`41-cp12-client-projection-preimplementation-challenge.md`](41-cp12-client-projection-preimplementation-challenge.md)
- Contract: `SK-MVP-0.2`; schema `6`; migration `cp11-002`
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL LEVEL-4 PROJECTION AND RENDERER SCOPE**

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Snapshot authority | `ClientSnapshotService` is the only producer. It joins existing world, fixture, shelter, soldier, mission, attempt, encounter, cargo, and event rows without adding a command, transition, scheduler, or persistence table. | Accepted; the focused projection vectors pass and no authoritative state is changed by the read. |
| Contract and compatibility | The new resource, mission, actor, map, and cursor fields are additive under `SK-MVP-0.2`. Existing full replacement and sequence semantics remain owned by the CP-08 realtime boundary. | Accepted; typecheck, CP-08 realtime, and wire regressions pass. |
| Identity and privacy | The server filters soldiers and missions by the bound shelter, filters nodes to the current shelter sensing radius, omits exact node quantity, and exposes only an owning active encounter. Player B's projection contains no Player A mission, soldier, shelter, or binding. | Accepted; two-player privacy assertions pass. |
| Fog and map geometry | Blocked cells are projected only when they are in the player's explored set. The G2 fixture is an open grid, so the runtime vector has an empty blocked list; an out-of-bounds blocked cell is rejected by the client model. | Accepted; the future non-empty obstacle path remains a separate fixture gate. |
| Mission lifecycle | Resident, active travelling, returning Hunter, and `WAITING_REVIEW` rows preserve stable soldier/mission/attempt identity, role/tool lock, target, route, cargo risk, encounter cause, reissue metadata, revision, and the next valid action. | Accepted; the five CP-12 vectors cover each named row and the predecessor services remain green. |
| Route and time authority | Travelling positions use `deriveRoutePosition` with the persisted attempt start and authoritative world time. Returning positions use a validated reverse of the immutable outbound route. Browser time and client coordinates are not inputs. | Accepted; the active gatherer and returning Hunter positions match the server route at deterministic boundaries. |
| Cargo and economy | The projection reports only the active attempt's validated cargo summary and capacity. It never converts cargo, credits coins, deletes cargo, or changes a settlement boundary. | Accepted; cargo remains exposed until the existing deposit transaction and all CP-10/11 regressions pass. |
| Encounter visibility | A current locked/resolving encounter may expose its persisted engagement position and status to the owning shelter; a resolved encounter is retained as causal mission context. No unobserved patrol position is created by the projection. | Accepted for the seeded encounter and Hunter victory traces; broader monster visibility remains open. |
| Realtime trust boundary | The client model rejects malformed coordinates, revisions, phases, cargo, route adjacency, mission lifecycle combinations, out-of-scope soldier actors, and hidden blocked cells before rendering. CP-08 still rejects wrong connection, scope, sequence, and replacement frames. | Accepted; invalid frames become explicit `INVALID_FRAME`/`STALE` states and never merge into a base snapshot. |
| Canvas and React boundary | Canvas consumes deterministic draw commands for explored tiles, resources, routes, actors, and placeholders. React/HTML provides world time, connection/capability status, shelter value, semantic mission rows, and causal history. Neither layer mutates gameplay state. | Accepted; repeated snapshots produce identical commands and readable text output. |
| Accessibility and degraded UX | Mission rows state identity, phase, role, tool, target, cargo, risk, next action, and terminal/review cause. Null, stale, unsupported, and invalid states remain visible without color or animation. | Accepted for the local component; focus order and live browser keyboard behavior remain later gates. |
| Performance and assets | The first surface uses one Canvas with a bounded 32 × 20 viewport and a single effect-free draw pass with device-pixel-ratio support. Geometric placeholders preserve the accepted asset vocabulary. | Accepted for a static local frame; no production FPS, atlas, animation, or population-scale claim is made. |
| Handoff boundaries | The page is mounted with an explicit null snapshot and unsupported capability. Session/bootstrap, state-changing controls, genuine WebMCP, Agent Signal, Re-entry, and hosted runtime remain outside this task. | Accepted; no `reentry-core/` or `mvp/` file was changed and no false live claim is introduced. |

## Invariants rechecked

- The server and worker remain the only authority for world time, positions, mission phases, cargo,
  encounters, revisions, visibility, events, and settlement.
- A snapshot is a replaceable read model. The client never reconstructs a seed, route, node quantity,
  mission outcome, coin balance, or browser-time transition.
- Resource visibility is limited to the shelter sensing field and exposes availability rather than
  exact node quantity; player-scoped mission and cargo data does not cross the shelter boundary.
- Route positions remain reproducible after a worker restart because they use durable route and
  transition inputs; return uses the same route in reverse.
- A malformed or inconsistent linked record fails visibly instead of being silently omitted. A stale,
  null, unsupported, or invalid frame leaves no fabricated game state or state-changing control.
- Existing CP-08 through CP-11 identity, event, idempotency, extraction, combat, reissue, return, and
  settlement behavior remains green under the recorded local aggregate.

## Verification disposition

The runtime and code review support local level-4 evidence for the server projection, pure client
model, deterministic draw command boundary, semantic mission rows, privacy checks, and explicit
degraded states. The page build proves compilation and mounting only; it does not prove a browser
session, Canvas pixels, keyboard input, interpolation, or a genuine page-bound capability.

## Residual risks and reopen triggers

The named local result does not cover live session/bootstrap, browser two-session UX, keyboard
movement, remote interpolation, a non-empty obstacle/fog fixture, final art or animation, genuine
WebMCP registration, Agent Signal or Re-entry delivery, default all-phase scheduling, production
identity, hosted continuity, deployment, performance at population scale, or judge reproduction.
Reopen this audit if a snapshot field requires a new authority or contract version, another shelter's
private state appears, exact hidden quantity or hidden geometry is exposed, a client-derived position
is persisted, mission lifecycle validation rejects a canonical server state, or the page needs a live
command/capability to remain truthful.

