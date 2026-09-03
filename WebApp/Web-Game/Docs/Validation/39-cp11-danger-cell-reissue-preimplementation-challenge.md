# CP-11 Danger-Cell Reissue Pre-Implementation Challenge

## Identity

- Challenge for: [`SK-TASK-036`](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md)
- Promoted decision: [`ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation under the delegated implementation scope
- Date: 2026-09-02

## Decision question

What is the smallest durable implementation that turns the proven monster-caused death into one
same-identity, danger-cell-avoiding mission attempt, while making an impossible route and a repeated
death visibly stop in `WAITING_REVIEW`?

## Binding constraints

- Preserve the accepted `SK-MVP-0.2` mission, identity, route, cargo, event, world-clock, and
  settlement contracts. Do not change the contract version or the HUNTER victory boundary.
- Keep the worker/server authoritative for the budget, danger cell, route, mission attempt, soldier
  state, cargo deletion, event order, revisions, and idempotency. The browser and Agent remain
  projections or bounded command surfaces.
- Keep ordinary death immediate in world time and same-identity. A reissue adds real travel time and
  may not teleport, reuse a stale attempt, or start an unbounded retry loop.
- Keep the fixed G2 Rock geometry honest: if the danger cell makes the original target unreachable
  under the exact forbidden-set rule, enter `NO_SAFE_REISSUE_ROUTE` instead of weakening the rule.
- Do not add a second worker, scheduler, external service, WebMCP tool, Signal, or Re-entry wait.

## Current evidence and falsifiers

### Verified predecessor facts

- `SK-TASK-034` proves the GATHERER terminal transaction destroys validated field cargo, records
  `CargoLostToMonster`, respawns the same soldier, and retains terminal history.
- `SK-TASK-035` proves the HUNTER path remains role-aware, target-reserved, route-preserving, and
  zero-cargo on victory.
- The persistence store provides atomic state/event/idempotency transactions, schema-v5 migration,
  durable mission attempts, route/home-anchor JSON, and file-backed restart evidence.
- The accepted contract and ADR-0010 require one budget, integer danger cell, one bounded detour,
  typed no-route/repeated-death review, and reset after deposit or manual dispatch.

### Falsifiers that reopen this challenge

- The schema cannot migrate versions 1–5 without changing existing event or contract meaning.
- A combat retry can commit death or cargo loss without also committing the reissue outcome.
- A second worker or same-world command can consume the same budget or create two active attempts.
- The fixed route requires a target exemption or an undocumented change to contact geometry.
- A later consumer requires a new event, direct reward, browser authority, or external delivery.

## Cross-functional challenge matrix

| Surface | Required behavior | Main risk | Boundary selected |
|---|---|---|---|
| Combat/death | Extend the terminal GATHERER loss result with one reissue outcome | Partial death/reissue after crash | One persistence transaction and one combat idempotency result |
| Mission identity | Keep `soldier_id`, terminalize the old attempt, create at most one new attempt | Duplicate soldier or active-attempt race | Mission revision plus unique active soldier/mission checks |
| Persistence | Store budget, danger cell, review reason, and terminal cause | Restart loses policy state | Schema-v6 migration with typed nullable fields |
| Route | Replan from shelter to the same target around danger neighbourhood | Target overlaps forbidden cells | Deterministic BFS; no target exemption; no route is typed |
| World clock | Apply reissue in the existing settlement boundary at the same world time | Wrong phase or hidden gameplay wait | Combat transaction owns outcome; no Agent or timer dependency |
| Cargo/economy | Destroy exposed cargo once; reissue creates no cargo or coins | Duplicate loss or reward | Existing cargo validation and event order remain authoritative |
| Manual recovery | Allow a player dispatch after review and reset the next budget | Review state becomes dead-end | Dispatch explicitly clears review metadata and reuses the mission row |
| Dashboard handoff | Preserve reason, route, budget, and prior attempt for a future projection | UI invents action or hides stop | Event/persistence fields only; CP-12 remains separate |
| HUNTER | Do not alter verified victory; retain a generic role-preserving contract shape | Invented loss balance | Future loss fixture is a reopen trigger, not a fake proof |

## Hidden geometry issue resolved

The seeded Rock node is at `(34,64)` and the seeded patrol route visits `(34,64)`. The existing loss
trace reaches that cell, so its rounded danger cell and the forbidden Chebyshev-one neighbourhood
contain the original target. Under the accepted rule, this is a legitimate `NO_SAFE_REISSUE_ROUTE`
outcome. The task must include a separate route-planner vector whose target lies outside the forbidden
set to prove a positive detour, while the fixed fixture proves the honest stop. No implementation may
pass the test by allowing the target cell through the forbidden set.

## Required vectors

1. **Schema migration:** Open a representative schema-v5 file, migrate to v6, read budget/danger/
   reason/terminal-cause fields, restart, and prove old rows retain their meaning.
2. **Positive detour:** Plan one route around a danger cell and its eight neighbours with fixed
   neighbour order; assert adjacent waypoints, target arrival, and longer travel time.
3. **Fixed no-route:** Run the seeded Rock GATHERER loss; assert cargo loss, same identity at shelter,
   `WAITING_REVIEW`, `NO_SAFE_REISSUE_ROUTE`, budget `0`, one `MissionReissued` outcome event, and no
   second active attempt.
4. **Successful reissue:** Use a reachable target outside the forbidden set; assert one fresh attempt,
   same role/tool/target/home, budget `0`, real `TRAVELLING` due time, and one ordered event.
5. **Repeated death:** Apply a second monster loss before deposit; assert no new attempt, reason
   `REPEATED_MONSTER_DEATH`, resident state, and no further route or event loop.
6. **Reset:** Complete a valid deposit and issue a new manual dispatch; assert budget `1`, cleared
   review metadata, and a fresh chain.
7. **Authority and exactly-once:** Assert malformed route, target mismatch, stale revision, foreign
   binding, changed duplicate, concurrent budget consumption, injected failure, and duplicate replay
   leave no partial state or duplicate event/cargo effect.
8. **Restart:** Replace the process after a reissued attempt is travelling and after a review stop;
   assert the same mission/attempt/budget/reason and no regeneration or retry beyond the budget.
9. **Regression:** Re-run the focused CP-11 Hunter victory and CP-10 deposit boundaries affected by
   mission-row reset fields.

## Selected implementation path

1. Add the schema-v6 fields and typed records with strict validation and migration checks.
2. Add a bounded route planner option that accepts server-owned dimensions, blocked cells, and a
   forbidden-cell set while preserving the existing no-avoid route output.
3. Extend the worker combat terminal transaction to validate and commit the reissue outcome, including
   a fresh attempt insert or a typed review stop.
4. Update manual dispatch and deposit reset paths, then add focused Red/Green tests for the vectors
   above before any aggregate gate.
5. Review the entire death → reissue/review → travel → extraction/deposit chain and synchronise task,
   contract links, mechanics, evidence, and current status only after runtime evidence exists.

## Non-goals

PvP, siege, breach conversion, monster drops, HUNTER defeat balancing, party aggregation, automatic
target discovery, browser/UI, WebMCP, Agent Signal/Re-entry delivery, default all-phase scheduler,
hosted continuity, deployment, credentials, spend, and commit/push are outside this challenge.

## Closure and reopen

Preparation closes at documentation level when the task, ADR, challenge, scenario vectors, and links
agree. Runtime closure requires local process level-4 evidence for the named vectors and a new
cross-functional audit. Reopen before implementation if the selected transaction cannot preserve
exactly-once state/event/idempotency, if the route conflict requires changing the accepted contract,
or if a new authority or external boundary appears.
