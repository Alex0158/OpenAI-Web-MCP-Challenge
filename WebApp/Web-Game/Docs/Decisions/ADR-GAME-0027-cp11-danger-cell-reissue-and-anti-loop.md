# ADR-GAME-0027: CP-11 Danger-Cell Reissue and Anti-Loop Boundary

**Status:** ACCEPTED LOCAL IMPLEMENTATION BOUNDARY; runtime-verified for the named local worker scope  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-036`, automatic reissue after a monster-caused death  
**Contract:** `SK-MVP-0.2`; no contract-version change  
**Predecessors:** [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md), [`ADR-GAME-0026-cp11-hunter-victory-and-return.md`](ADR-GAME-0026-cp11-hunter-victory-and-return.md), and [`ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)

## Context

The accepted G2 contract gives every repeatable gathering or hunting mission chain one automatic
monster reissue. The CP-11 runtime now consumes a reissue budget, persists the losing danger cell,
creates a fresh attempt when a safe route exists, and stops a repeated death with a typed
`WAITING_REVIEW` state.

The next increment must preserve the existing combat, identity, route, cargo, settlement, event, and
world-clock boundaries. It must also survive a process replacement without leaving a soldier stranded
between death and reissue. The fixed G2 fixture deliberately puts the seeded Rock target on the
monster lane. If the losing danger cell is the target or its one-tile neighbourhood, the contract's
correct result is `NO_SAFE_REISSUE_ROUTE`; the implementation must not silently exempt the target or
pretend that a detour exists.

## Decisions

### 1. Keep reissue state on the mission aggregate

Schema version advances from 5 to 6 with migration id `cp11-002`. The `mission` row gains the minimum
durable fields needed to make the policy restartable and inspectable:

- `monster_reissue_budget` — integer `0` or `1`, initialized to `1` for a new repeatable chain;
- `danger_cell_json` — nullable integer `{x, y}` from the last monster-caused loss;
- `waiting_review_reason` — nullable `NO_SAFE_REISSUE_ROUTE` or `REPEATED_MONSTER_DEATH`.

The `mission_attempt` row gains `terminal_cause` so terminal history remains queryable after encounter
linkage is cleared. Existing rows migrate with a null danger cell, null review reason, and budget `1`;
the worker may consume the budget only when the current terminal combat transaction proves a matching
monster loss. Manual dispatch and successful deposit reset the next chain's budget to `1` and clear
the review metadata. No separate reissue table or hidden event-JSON state is introduced.

### 2. Commit death and the reissue outcome in one transaction

The terminal GATHERER combat transaction remains the single owner of the death boundary. When the
combat service supplies a server-derived reissue plan, the persistence transaction atomically:

1. validates the encounter, mission, attempt, soldier, cargo, revisions, and role;
2. deletes only the validated field cargo and records the existing loss/death/respawn events;
3. records the integer danger cell and consumes the one budget;
4. either inserts one fresh `mission_attempt_id` with the same role, tool, target, home anchor, and
   return policy, or changes the mission to `WAITING_REVIEW` with a typed reason; and
5. appends one `MissionReissued` event describing `REISSUED` or `WAITING_REVIEW`, then stores the
   complete result under the combat idempotency key.

This keeps state, event cursor, reissue attempt, cargo deletion, and idempotency atomic. A crash or
retry cannot expose a durable interval in which the soldier has respawned but the budget or next
attempt is unknown. A duplicate combat key replays the complete result; a changed request, stale
revision, ownership mismatch, malformed route, or injected failure makes no partial mutation.

### 3. Use a deterministic bounded route replan

The service rounds the persisted engagement position to the nearest integer cell before storing
`danger_cell`. The forbidden set is that cell plus every grid cell with Chebyshev distance at most
one. A reissued route must:

- start at the persisted shelter home anchor and end at the original target;
- use the fixture's server-owned dimensions, blocked-cell list, and walkability version;
- exclude every forbidden cell, including the target when the target is forbidden;
- use one deterministic breadth-first search with fixed neighbour order `right, down, left, up`;
- preserve adjacent-cell route validity and the existing three-tiles-per-world-second travel rate; and
- return no route rather than retrying, teleporting, or falling back to the old dangerous route.

The seeded Rock loss is therefore an explicit no-safe-route vector when its target overlaps the
forbidden set. A separate planner vector with a reachable target proves the positive detour branch;
the fixed fixture does not gain a target exemption merely to make that vector pass.

### 4. Define the anti-loop outcomes

- A first monster loss with budget `1` and a safe route creates a new active attempt, sets the soldier
  to `FIELD`, sets the mission to `TRAVELLING`, and leaves the budget at `0`.
- A first loss with no safe route leaves the same soldier at the shelter in `WAITING_REVIEW` with
  `NO_SAFE_REISSUE_ROUTE`, no active attempt, and no further automatic retry.
- A second monster loss before successful deposit finds budget `0` and leaves the soldier at the
  shelter in `WAITING_REVIEW` with `REPEATED_MONSTER_DEATH`, no new attempt, and no further retry.
- A successful deposit or a new manual dispatch clears the review reason and starts the next chain
  with budget `1`.
- HUNTER victory keeps its verified `DEAD` monster and zero-cargo return path. A future HUNTER loss
  uses the same role-preserving policy once a loss-producing fixture exists; this increment does not
  invent a weaker Hunter combat vector.

### 5. Preserve event and projection boundaries

`MissionReissued` is the only new event name. Its typed payload includes the prior attempt, the new
attempt when one exists, role/tool/target, budget before and after, danger cell, route when reissued,
outcome, reason when waiting, and world time. It is visible only to the owning shelter. No coins,
resource, monster reward, Agent Signal, WebMCP action, browser coordinate, or external delivery is
created by this transaction. The later dashboard may project the event and mission fields without
becoming an authority.

## Alternatives rejected

- A second transaction after `SoldierRespawned` was rejected because a process crash could leave an
  unmarked resident with an unconsumed budget and make automatic recovery ambiguous.
- Reconstructing the budget from event history was rejected because manual dispatch reset semantics,
  repeated death, and restart recovery would depend on brittle event scanning instead of current
  mission authority.
- Reusing the old route or allowing the target exception was rejected because it defeats the accepted
  danger-cell anti-loop contract and can immediately send a soldier through the known threat.
- A general pathfinding or terrain service was rejected for G2; the bounded open-grid planner is the
  smallest real consumer for this contract.
- Adding HUNTER defeat balance or PvP retry rules was rejected because the seeded HUNTER trace is a
  victory and those rules belong to later evidence.

## Consequences and reopen triggers

The reissue is durable, explainable, identity-preserving, and bounded. A player can distinguish a
successful detour from a review stop, while the fixed Rock trace honestly demonstrates the no-safe-
route branch instead of hiding a geometry conflict. The schema migration and terminal event extension
increase the CP-11 surface, so focused migration, route, rollback, duplicate, stale, owner, restart,
and exact-event tests are required before runtime closure.

Reopen this decision if a route must pass through a forbidden target, if the danger-cell rounding or
neighbourhood metric changes, if death and reissue cannot share one transaction, if a new event or
external handoff is required, if a future scheduler owns the boundary, or if a HUNTER loss fixture
requires a contract or combat-formula change.

## Verification target

`SK-TASK-036` proves the schema-6 migration, positive safe-detour planner vector, fixed-fixture
no-safe-route stop, repeated-death stop, same-identity reissue, manual/deposit reset, event order,
duplicate/stale/ownership/race/rollback behavior, and file-backed restart in
[`SK-EVID-025`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md), reviewed by
[`Validation40`](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md). The
claim is local worker-owned runtime verification only; browser, WebMCP, Re-entry, hosted, and judge
behavior remain separate gates.
