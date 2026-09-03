# CP-12 Client Projection and Accessible Mission Row Pre-Implementation Challenge

## Identity

- Challenge for: [`SK-TASK-037`](../Tasks/SK-TASK-037-cp12-client-projection-and-mission-row.md)
- Promoted decision: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation under the delegated implementation scope
- Date: 2026-09-02

## Decision question

What is the smallest CP-12 implementation that gives the Canvas and accessible dashboard a truthful
server-owned projection, while keeping missing session capability and incomplete upstream state
visible?

## Binding constraints

- Preserve `SK-MVP-0.2`, CP-08 realtime replacement/sequence semantics, CP-09 through CP-11 mission,
  cargo, encounter, death, reissue, and event identities, and the existing one-process worker/store
  authority.
- Extend the existing `client_snapshot` read model additively; do not create a second endpoint,
  client state machine, persistence row, scheduler, command, event, or contract version.
- Keep resource visibility inside the shelter's 24-tile sensing field and expose availability rather
  than exact hidden quantity. Keep owned mission/cargo details scoped to the bound shelter.
- Derive actor positions from persisted server inputs. Canvas interpolation and draw state are
  replaceable; no browser timer, local prediction, or fallback becomes authoritative.
- Keep no-snapshot, stale/reconnecting, unsupported capability, and missing asset states explicit.
- Do not claim live browser, WebMCP, Re-entry, default-world bootstrap, or hosted behavior from this
  increment.

## Current evidence and falsifiers

### Verified predecessor facts

- CP-08 provides a server-bound full replacement snapshot, player/shelter scope, explored cells,
  event filtering, sequence validation, and local authenticated wire lifecycle.
- CP-09 through CP-11 persist role/tool/target/route/phase, cargo, encounter, death, reissue/review,
  revisions, and causal events needed by a dashboard.
- The visual specification assigns Canvas terrain/actors/effects and React/HTML HUD, mission rows,
  history, controls, and accessible equivalents; placeholders are accepted.

### Falsifiers that reopen this challenge

- Required mission or node fields cannot be read from current authoritative rows without inventing
  state or adding an unapproved authority.
- A player-scoped snapshot includes another shelter, exact hidden node quantity, hidden cells, or an
  unobserved monster position.
- Derived mission positions disagree with route, home anchor, world time, or return semantics after
  restart.
- The component needs a state-changing command, session issuer, new transport, WebMCP registration,
  Re-entry action, or default fixture to render the first frame.
- The snapshot validator accepts malformed coordinates, revisions, phases, or stale scope and the
  renderer can crash or display false success.

## Cross-functional challenge matrix

| Surface | Required behavior | Main risk | Boundary selected |
|---|---|---|---|
| Snapshot authority | One `ClientSnapshotService` serializes current records | Browser reconstructs or trusts stale state | Existing worker gateway and store read boundary |
| Visibility | Own missions/cargo/soldiers and sensed Wood/Rock only | Private data or exact hidden quantity leak | Shelter scope, 24-tile filter, availability band |
| Identity/revisions | Stable player/shelter/soldier/mission/attempt ids remain visible and scoped | Row joins the wrong life or player | Server joins plus entity revision map |
| Route/position | Active and returning positions derive from durable route/time | Teleport, jittering false location, or client authority | Existing `deriveRoutePosition` and validated reverse route |
| Mission lifecycle | Phase, encounter, reissue/review, cargo and next action agree | UI shows a valid action that backend rejects | Typed projection label derived from canonical phase |
| Resource nodes | Type, exact coordinate when sensed, availability, observation time, revision | Depletion or hidden quantity is fabricated | Fixture positions plus persisted quantity band |
| Realtime client | Accept only newer full scoped snapshots; stale state is visible | Malformed frame crashes or merges | Existing `RealtimeProjectionClient` plus strict model validation |
| Canvas | Draw accepted projection with deterministic placeholders | Art layer becomes authority or hides state | Pure draw model and one effect-free render pass |
| React/accessibility | Text rows explain connection, mission phase, cargo risk, cause, and next action | Color/animation-only or inaccessible causal trace | Semantic HTML, labels, live status, reduced-motion-safe output |
| Missing capability | Human-readable waiting/unsupported state remains usable | Fake fixture or false WebMCP claim | Explicit null snapshot and capability status |
| Performance | One Canvas for repeated world actors, no per-actor DOM tree | Unmeasured animation or unnecessary dependencies | Static frame draw; no FPS claim in this task |
| Handoff | CP-13/14 can consume stable page/read model later | UI invents tool or Agent state | No WebMCP/Re-entry code in this increment |

## Required vectors

1. **Initial scoped snapshot:** A file-backed G2 fixture produces a full snapshot with map bounds,
   explored cells, the own shelter/player/roster, sensed Wood/Rock availability, no private second
   shelter, and no exact hidden node quantity.
2. **Mission row at shelter:** A resident row exposes stable identity, empty role/tool/target,
   `AT_SHELTER`, empty cargo, revisions, and `DISPATCH` as the next action.
3. **Mission row in transit/work:** A dispatched gatherer exposes the committed role/tool/target,
   immutable route, server-derived position, phase, cargo summary, and a non-dispatch next action;
   the projection does not mutate the mission.
4. **Combat/review visibility:** An encounter or `WAITING_REVIEW` row exposes only the owning
   shelter's status, cause/reason, reissue budget/danger metadata, and next valid action; hidden or
   malformed linked state fails visibly.
5. **Canvas command model:** The renderer produces deterministic draw commands for the map viewport,
   explored cells, sensed nodes, shelter, player, owned soldiers, routes, and active encounter actor
   when present. Repeating the same snapshot produces the same commands.
6. **Accessible equivalent:** Semantic output names world time, connection/capability status,
   shelter/coins, actor location/state, mission role/tool/phase/cargo/risk/next action, and recent
   causal events without relying on color or animation.
7. **Stale/unsupported/null:** A missing snapshot, stale connection, invalid scope, malformed frame,
   or unsupported capability shows a typed status and leaves no fabricated game state or enabled
   state-changing action.
8. **Projection privacy:** Player B's snapshot cannot contain Player A's private mission, cargo,
   shelter, binding, hidden cells, or unobserved actor details.
9. **Predecessor regression:** CP-08 realtime projection/wire and CP-09 through CP-11 focused suites
   remain green after the additive snapshot fields are introduced.

## Selected implementation path

1. Add the additive typed read-model fields and strict server serializer joins without changing the
   event, persistence, command, or contract version boundaries.
2. Add pure client projection validation/model and deterministic Canvas draw commands; keep all
   coordinate, route, phase, and visibility decisions based on the accepted snapshot.
3. Add a client component with a Canvas layer, semantic HUD/mission rows/history, explicit stale and
   capability states, and deterministic placeholders. Mount it on the page with a null snapshot until
   a later session task supplies a server projection.
4. Write Red tests for scope/privacy, resident and active mission rows, route-derived position,
   malformed/stale/null handling, deterministic draw output, and accessibility text before the Green
   implementation. Refactor only after the focused tests pass.
5. Review the complete snapshot → renderer → accessible history chain and synchronise the task,
   contract links, visual spec, scenario, current status, and fresh evidence after runtime checks.

## Non-goals

Live session/bootstrap, authenticated browser delivery, movement commands, mission dispatch controls,
default scheduler composition, new persistence schema, WebMCP, Agent Signal/Re-entry delivery,
external services, hosted continuity, final art, elaborate animation, mobile optimization, and a
measured production FPS claim.

## Runtime follow-through

The accepted implementation path is runtime-verified for its named local projection and renderer
boundary in [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md)
and [`42-cp12-client-projection-runtime-cross-functional-audit.md`](42-cp12-client-projection-runtime-cross-functional-audit.md).
The additive snapshot remains a replaceable read model; live session/bootstrap, browser delivery,
WebMCP, Re-entry, and hosted claims remain separate gates.

## Closure and reopen

Preparation is accepted at documentation level. Runtime closure requires local focused tests,
typecheck/build, and the affected predecessor suites, plus a cross-functional runtime audit and
evidence record bound to the additive projection and renderer scope; that closure is now recorded
above for the local boundary. Reopen before implementation if
the selected read model requires a new authority or contract version, if privacy or route derivation
cannot be proven, or if the page cannot remain truthful without live capability.
