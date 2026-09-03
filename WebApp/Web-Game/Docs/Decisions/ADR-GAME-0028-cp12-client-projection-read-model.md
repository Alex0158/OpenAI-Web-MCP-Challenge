# ADR-GAME-0028: CP-12 Client Projection Read Model

**Status:** ACCEPTED AND RUNTIME-VERIFIED FOR LOCAL CP-12 PROJECTION AND ONE-BROWSER HYDRATION BOUNDARY; independent two-browser delivery remains open  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Contract:** `SK-MVP-0.2`

## Context

The accepted `client_snapshot` contract requires visible actors and nodes, explored cells, shelter
and mission dashboard records, and recent causal events. The verified CP-08 serializer currently
provides the player, shelter, basic soldier rows, explored cells, map dimensions, visible player and
shelter actors, and permitted events, but it does not yet expose the resource-node read model or the
mission/route/cargo fields that CP-12 must present.

Adding a browser-owned reconstruction would create a second authority and could leak hidden state.
Adding a new command, persistence row, scheduler, or transport would expand CP-12 beyond its
presentation purpose. This decision defines the smallest additive projection boundary that lets the
first Canvas frame and accessible mission row consume the existing server state.

## Decision

1. **One server projection.** `ClientSnapshotService` remains the only producer of the page projection.
   It reads the existing world, fixture, shelter, soldier, mission, attempt, encounter, cargo, and
   event records through the existing store. No client component derives authoritative state or calls
   the store directly.
2. **Additive snapshot fields.** Under `SK-MVP-0.2`, the snapshot gains typed `resourceNodes`,
   `missions`, enriched soldier/actor projection data, `map.blockedCells`, and the existing emitted
   `worldEventCursor` in its TypeScript contract. These fields refine the already accepted names
   "visible actors and nodes" and "shelter and mission dashboard records"; they do not add a command,
   event, state transition, persistence table, or contract version.
3. **Visibility.** A player receives only its own shelter's missions, attempts, soldiers, cargo
   summaries, and active encounter details. Resource nodes are included only when inside the current
   shelter sensing radius and expose type, position, availability band, observed world time, and
   revision; exact node quantity is never sent. Other shelters, private cargo, hidden cells, and an
   unobserved monster position remain absent. An active encounter may expose its persisted engagement
   position and status to the owning shelter.
4. **Server-derived position.** Mission and soldier positions are derived from the persisted route,
   home anchor, transition time, and authoritative `worldTime` using the existing route-position
   function. A returning route is the validated reverse of the immutable outbound route. The client
   may interpolate a received projection but cannot submit or persist a position.
5. **Explicit mission read model.** Each owned mission row includes the stable mission and soldier
   identities, active attempt when present, role/tool/target, phase, route, derived position, cargo
   quantity/capacity/resource types, encounter summary when present, reissue review metadata, entity
   revisions, and a typed next-action label. A completed resident row remains visible with
   `DISPATCH` as its next action; an unavailable or malformed linked record fails the snapshot visibly
   instead of being silently omitted.
6. **Presentation boundary.** The CP-12 client component accepts a server-provided snapshot and
   connection/capability state. Canvas draws only the accepted projection; React/HTML renders HUD,
   mission/status rows, event history, and text equivalents. With no snapshot, the page shows an
   explicit waiting/degraded state and never invents a fixture, coin balance, mission, or actor.
7. **No live bootstrap in this increment.** Session issuance, default-world selection, page-to-worker
   realtime composition, state-changing controls, WebMCP registration, Re-entry, and two-browser
   delivery remain later gates. A test may supply a real file-backed snapshot to the component, but
   the fixture is not a production default.

## Alternatives considered

### Browser reconstruction from base fields

The browser could infer resource positions from a seed or mission state from event text. This is
rejected because it duplicates authority, leaks hidden data, and produces a misleading page when a
record is stale or missing.

### A second dashboard read API

A separate endpoint or store adapter would create another scope, identity, and serialization seam
before the canonical page/session boundary exists. It is deferred; `client_snapshot` is the existing
read contract.

### Full live page bootstrap

Wiring authentication, session resolution, realtime connection, commands, and browser interaction in
the same increment would make a UI task own deployment and capability decisions. It is deferred to the
registered CP-12 follow-up or the CP-13/16 gates.

## Consequences

The first visual slice has enough server-owned information to explain the two-player world, sensed
Wood/Rock nodes, mission role lock, route, cargo risk, death/review state, and causal history without
claiming live browser delivery. The snapshot becomes larger and its additive fields must be validated
and kept player-scoped. Earlier CP-08 projection evidence remains valid for its named base fields but
the additive shape is covered by [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md)
and [`Validation/42`](../Validation/42-cp12-client-projection-runtime-cross-functional-audit.md) before it
is used in a broader slice claim.

## Reopen triggers

- a field requires a new authority, event, persistence schema, or contract version;
- a projection exposes another shelter's private state, exact hidden quantity, or an unobserved actor;
- a client coordinate, browser timer, or fallback becomes authoritative;
- route derivation cannot reproduce the server's current position after restart;
- the page needs a live session/bootstrap or state-changing control to pass the bounded vectors; or
- the additive shape invalidates a predecessor claim beyond the documented scope.
