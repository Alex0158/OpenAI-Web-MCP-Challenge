# SK-TASK-007: CP-07 Deterministic World Fixture Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-07`
- Owner: Game owner
- Current increment: Cross-functional CP-07 seed, placement, identity, reset, and route fixture are prepared; no runtime code has started.
- Next gate: The CP-06 seam is locally runtime-verified; implementation proceeds in separately registered [`SK-TASK-021`](SK-TASK-021-cp07-deterministic-world-fixture-implementation.md), which must verify seed replay, world-scoped identity, placement invariants, and restart non-regeneration.

## Identity

- Task ID: `SK-TASK-007`
- Date: 2026-09-02
- Risk profile: `Assured`

## Objective

Prepare a deterministic two-player G2 world fixture that can be generated after CP-06 recovers the
authoritative world context. The package must make the accepted geometry, protected start, resource
placement, actor identities, reset isolation, and seeded Rock-route contrast testable without
introducing a general procedural world system.

## Scope

- In scope: the CP-07 portion of [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md) and [`../Scenarios/07-cp07-deterministic-world-fixture.md`](../Scenarios/07-cp07-deterministic-world-fixture.md).
- In scope: the accepted `128 × 128` seed fixture, two shelters at `(16,64)` and `(112,64)`,
  mirrored Wood/Rock nodes, five stable soldiers per shelter, one seeded monster, generation version,
  map fingerprint requirement, reset/new-world boundary, and downstream identity/visibility handoffs.
- Out of scope: CP-06 clock implementation, pathfinding runtime, fog, missions, extraction, combat,
  migration, siege, breach, Canvas, WebSocket, WebMCP, hosted deployment, or production population.

## Authority and assumptions

- `SK-MVP-0.2` and `ADR-GAME-0010` own the accepted seed, dimensions, coordinates, distances, rates,
  protected-start semantics, and identity rules.
- `g2-fixture-1` and the explicit monster waypoint route are preparation targets to be persisted and
  verified before CP-07 runtime closure; they are not silently promoted to a new gameplay contract.
- The smallest G2 implementation may be an explicit fixture preset keyed by seed/version rather than
  procedural noise, provided it produces a deterministic map fingerprint and stable output contract.

## Success and verification

- The fixture manifest and scenario vectors cover same-seed replay, reset isolation, exact distance
  boundaries, walkability, camera scale, route reachability, and restart non-regeneration.
- Every downstream consumer has a named handoff and no client-owned identity or hidden-state path.
- Documentation links, English-only rules, task shape, and scenario references pass the game validator.

## Closure and reopen condition

This task is `verified` at `specified` scope. Reopen it if the recovered world cannot persist the
seed/version/fingerprint, if the route cannot produce the accepted encounter contrast, if a reset
rewrites another world's history, or if CP-08/CP-11 require a different coordinate or identity
authority.
