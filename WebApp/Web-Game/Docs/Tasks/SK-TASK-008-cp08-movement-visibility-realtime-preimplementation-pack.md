# SK-TASK-008: CP-08 Movement, Visibility, and Realtime Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: Cross-functional CP-08 movement, visibility, route, snapshot, and reconnect preparation is complete; no runtime code has started.
- Next gate: After CP-05 through CP-07 runtime closure, implement one authoritative player movement and full client_snapshot reconnect path before adding delta frames or broader sensor payloads.

## Identity

- Task ID: SK-TASK-008
- Date: 2026-09-02
- Risk profile: Assured
- Reason for profile: The checkpoint crosses world authority, visibility/privacy, revisions, realtime transport, reconnect recovery, and the client_snapshot boundary.

## Objective

Prepare a reviewable CP-08 contract and fixture package for authoritative movement, cached pathfinding,
player fog, sensor filtering, realtime projections, full resync, and visible unsupported-capability
behavior without introducing a second worker, timer, or command authority.

## Success and non-goals

- Success: The cross-functional audit names CP-05/06/07 handoff fields, the scenario pack covers
  movement, fog, scoped visibility, stale commands, route invalidation, packet loss, reconnect, and
  unsupported realtime capability, and all open transport/payload choices are explicitly gated.
- Non-goals: WebSocket runtime, movement implementation, persistence, clock recovery, fixture generation,
  combat, extraction, missions, WebMCP, Re-entry Core, hosted deployment, binary protocol, ECS, or
  production scaling.

## Scope and authority

- In scope: [CP-08/09 preparation audit](../Validation/09-cp08-cp09-preimplementation-audit.md), [CP-08 projection/pathfinding fixtures](../Scenarios/08-cp08-projection-pathfinding-fixtures.md), CP-08 references in the roadmap, snapshot/route/visibility cross-checks, and implementation entry gates.
- Out of scope: CP-05 persistence files, CP-06 clock runtime, CP-07 generator/runtime, reentry-core/, mvp/, RightSpot, and any external Receiver or Connector.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit runtime code or predecessor task files.
- Revalidate when: The client_snapshot contract, route authority, visibility policy, WebSocket capability,
  world-time order, or CP-05/06/07 handoff changes.

## Owning authority

- Owning module documents: [navigation mechanism](../Mechanics/detail-09-navigation-and-pathfinding.md), [fog mechanism](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md), and [detection family](../Mechanics/05-detection-pathfinding-and-encounters.md).
- Owning contract section: [snapshot and visibility contract](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract) and sections 2–3.
- Controlling decisions: [ADR-GAME-0010](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md) and [ADR-GAME-0011](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md).
- Constraining scenarios: [CP-07 fixture](../Scenarios/07-cp07-deterministic-world-fixture.md) and [CP-08 fixtures](../Scenarios/08-cp08-projection-pathfinding-fixtures.md).

## Evidence status

- Verified: G2 coordinate/radius/speed values, server authority, 100 ms movement reconciliation,
  approximately 10 Hz projection target, 60 FPS browser interpolation limit, full reconnect snapshot,
  player-scoped fog, one process /realtime ownership, and typed command/revision/idempotency envelope.
- Inferred: Full snapshots on connect/resync and one shared command gateway are the lowest-risk path for
  the two-player slice; delta frames and upgrade-carried commands should be added only after measurement.
- Unknown: Exact wire envelope, command transport, delta semantics, sensor payload/share policy, terrain
  costs, interpolation threshold, and production latency/event-loop budgets.

## Smallest reversible action

After the predecessor checkpoints provide the required state, implement one player movement command and
one full scoped client_snapshot over the CP-04 entrypoint. Stop if the worker cannot provide stable
revisions/active work, if visibility filtering requires a new authority decision, or if the realtime
capability cannot be reported truthfully.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; CP-08 runtime target is level 3–5 with two sessions,
  fake network loss, full resync, route invalidation, and capability-negative cases.
- Closure target: specified for this preparation task; CP-08 implementation may later target
  contract_verified or slice_verified according to actual evidence.
- Rollback or remediation: Preserve the preparation package, disable only the unverified realtime
  integration, and return to the canonical command/snapshot seam; do not add a silent fallback or a
  second authority.
- Reopen trigger: Any change to client_snapshot, visibility ownership, route/movement timing, CP-04
  upgrade ownership, or CP-05/06/07 durable handoff fields.

