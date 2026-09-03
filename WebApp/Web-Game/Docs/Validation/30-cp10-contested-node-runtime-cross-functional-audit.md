# CP-10 Contested Node Runtime Cross-Functional Audit

**Status:** Complete for the bounded local same-worker contested-node outcome  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-031`](../Tasks/SK-TASK-031-cp10-contested-node-outcome.md)  
**Evidence:** [`SK-EVID-020`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md)  
**Decision:** [`ADR-GAME-0022`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md)  
**Challenge:** [`29-cp10-contested-node-preimplementation-challenge.md`](29-cp10-contested-node-preimplementation-challenge.md)

## Verdict

The selected one-worker contest policy closes the normal same-node race without weakening the earlier
empty-target recovery contract. The authoritative phase orders due attempts by due world time and
mission-attempt id, reloads state before each candidate, lets the first available unit commit through
the existing extraction transaction, and atomically returns a later candidate after a same-boundary
depletion. Mission phase, paired due markers, node quantity, exposed cargo, revisions, event cursor,
and idempotency agree with `SK-MVP-0.2`. No cross-module contradiction remains inside this task.

## Business chain audit

```text
CP-09 dispatch
  → route arrival at T
  → paired extraction due at T + 2
  → ordered same-node candidates at due D
  → winner extracts one unit and owns node depletion
  → loser reloads zero node and returns with exposed cargo
  → later return navigation and shelter deposit
```

| Boundary | Verified behavior | Disposition |
|---|---|---|
| Identity and ownership | World, mission, attempt, soldier, node, cargo, and shelter visibility are checked; the store requires `worker:<worldId>` for the contest transaction | Pass |
| Role and loadout | Persisted GATHERER role plus Wood/Axe or Rock/Pickaxe remains authoritative; no client-selected reason or quantity | Pass |
| Due ordering | Candidates are ordered by `(next_due_world_time, mission_attempt_id)`; lower attempt id wins a tie inside the one worker | Pass |
| Node ownership | The winner decrements one available unit; the loser never decrements zero or emits a second depletion event | Pass |
| Cargo ownership | Winner cargo increments the existing provenance stack; loser cargo aggregate is preserved and remains field-exposed | Pass |
| Loser phase handoff | `WORKING → RETURNING`, paired due markers clear, `TARGET_DEPLETED` is explicit, and no teleport or deposit occurs | Pass |
| Pre-empty target | Zero before the boundary with no cargo remains `TARGET_UNAVAILABLE`; zero with existing cargo returns coherently | Pass |
| Event history | Winner order is `CargoExtracted`, optional `ResourceDepleted`, `MissionAutoReturned`; loser-only return has no extraction/depletion companion | Pass |
| Duplicate and idempotency | Stable contest work/event identity replays one result and one event; incompatible binding or request is rejected | Pass |
| Stale and malformed state | Positive node is not converted to loss; malformed cargo and revision drift remain visible recovery outcomes | Pass |
| Rollback | Failure after state or event work rolls back node, cargo, phases, due markers, cursor, and idempotency | Pass |
| Restart | Durable due markers resume once after reopening the file-backed store; repeated recovery is a no-op | Pass |
| World clock | The normal contest leaves the clock `running`; unrelated phases are not blocked by a valid loser | Pass |
| Return and settlement | The handoff carries cargo to a later return route; home crossing, deposit, and coins remain separate transactions | Deferred |
| Combat and death | No encounter, combat, loot, death, respawn, or breach effect is introduced | Deferred |
| UI/UX projection | Event payload is sufficient for a later dashboard history, but no browser snapshot or visual feedback is implemented here | Deferred to CP-12 |
| WebMCP and Re-entry | Routine contest events remain durable Domain Events; no Agent Signal or thread wake is generated | Deferred to CP-13/14 |
| Operations and hosting | Local injected phase seam uses WAL and restart; default all-phase scheduler and hosted continuity remain unproven | Deferred to CP-16/17 |

## Failure and race matrix

| Case | Required outcome | Runtime proof |
|---|---|---|
| Two attempts, one unit | Deterministic winner, one node decrement, loser return, clock continues | Focused contest test |
| Two attempts, two units | Each receives one unit; both remain `WORKING` | Focused sharing test |
| Node empty before due, no cargo | `TARGET_UNAVAILABLE`; no mutation or event | CP-10 regression test |
| Node empty before due, existing cargo | Return with aggregate cargo; no depletion duplicate | Pre-empty cargo test |
| Duplicate loser delivery | Stored result and event id, no second return | Idempotency test |
| Forged worker/payload | Typed rejection before mutation | Ownership/payload test |
| Positive node supplied to loss transaction | `TARGET_UNAVAILABLE`; state remains due | Stale-positive test |
| Failure after state/events | SQLite rollback; valid retry remains possible | Injected-failure test |
| Restart between candidates | Durable markers complete once after reopen | Restart test |
| Event order/cursor | Causal cursor sequence remains winner extraction, depletion, returns | Event assertions |

## Findings and residual gates

- **P2 — multi-worker fairness remains open:** the chosen tie-break is valid only while one worker owns a
  world. A hosted topology with multiple writers must add a reservation or ownership lease and reopen
  the ADR before claiming fairness.
- **P2 — return chain remains open:** `RETURNING` is now a verified durable handoff, but no route
  reversal, moving-home crossing, deposit, or coin settlement is implied. The next bounded task should
  define return navigation against the persisted route/home anchor before adding settlement.
- **P2 — scheduler composition remains open:** tests inject movement and extraction handlers into the
  clock. The default entrypoint still does not prove every gameplay phase runs continuously.
- **P3 — player-facing tie-break:** attempt-id order is deterministic infrastructure behavior, not a
  visible ranking or priority control. A later UI may explain a contest outcome from event history
  without offering a client winner selector.

Task-031 is closed as `runtime_verified` for the same-worker contest and clock-continuation boundary.
Reopen on a second authoritative worker, reservation/fairness requirement, new schema/event/contract
version, weighted or per-unit cargo, combat interaction, return navigation, settlement, browser/UI
authority, WebMCP, Re-entry, or hosted scheduler composition entering this boundary.
