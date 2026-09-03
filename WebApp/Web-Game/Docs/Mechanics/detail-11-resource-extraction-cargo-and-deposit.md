# Resource Extraction, Cargo, and Deposit

**Mechanism:** M11
**Status:** MVP economy contract accepted; the local Wood/Rock extraction/cadence/`RETURNING`/same-worker contest/return-navigation/deposit boundaries are runtime-verified under [`SK-TASK-029`](../Tasks/SK-TASK-029-cp10-first-extraction-and-cargo.md) through [`SK-TASK-033`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md); production balance remains open
**Authority:** This file owns the resource-to-cargo-to-coin lifecycle. World generation owns nodes;
loot owns hostile transfer; upgrades own tool progression.

## Resource lifecycle

```text
resource node → extraction work → soldier cargo → return → shelter deposit → coins
```

The full typed resource set is Wood, Rock (the stone-tier name used by the MVP), and gold-bearing
material. They do not combine into crafting recipes in this baseline. Each type can have a different
coin conversion value, tool requirement, extraction time, route risk, and regeneration schedule.

For the accepted MVP slice, the visible resources are Wood and Rock. A tier-one gathering tool may
extract either type; each unit uses one equal-weight cargo slot, Wood deposits for one coin, and Rock
deposits for three coins. Each soldier has five equal-weight cargo slots in this slice. Gold remains
outside the first slice.

## Tool requirement and yield

A tool tier must meet a node's required tier. A valid tool increases yield from lower-tier resources:

```text
yield = base_yield × tool_tier_multiplier
```

The illustrative Starve.io-inspired progression is: a tier-one tool on low-tier Wood yields one unit;
a tier-two tool on the same Wood yields two units; a tier-two tool on a newly available Rock node yields
one unit. These are examples, not final balance values.

An invalid tool produces no extraction. A higher tool tier does not remove travel, extraction,
capacity, detection, or combat risk.

## Cargo

Cargo belongs to the soldier until the shelter deposit transaction commits. Every cargo record has
owner, source node, typed quantity, acquisition time, capacity usage, and current mission attempt.
The accepted MVP uses five equal-weight slots, one unit every two world seconds, Wood at one coin,
and Rock at three coins. A full typed-weight model remains `OPEN` for later progression.

The first CP-10 runtime boundary creates one exposed, provenance-linked cargo unit after its due
marker. The recurring cadence boundary extends that same equal-weight stack by one unit per due marker;
the stack's acquisition time is its first unit time and each later milestone remains in the event
history. When capacity reaches five or the node is depleted, the mission enters `RETURNING` in the
same transaction with a causal `MissionAutoReturned`; a final node unit also records the 30-second
depletion marker. A forced recall queues the same return. When same-worker due attempts target one
depleted node, the deterministic attempt-order winner owns the final unit and the loser receives an
atomic `MissionAutoReturned(reason = TARGET_DEPLETED)` with its existing cargo. A node that was empty
before the boundary and has no exposed cargo remains `TARGET_UNAVAILABLE`; the selected contest
behavior is runtime-verified under [`../Tasks/SK-TASK-031-cp10-contested-node-outcome.md`](../Tasks/SK-TASK-031-cp10-contested-node-outcome.md), with evidence in [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md). A full or depleted attempt then uses the verified CP-10 return boundary to reach the persisted home anchor, enter `DEPOSITING`, and emit `MissionHomeReached` while cargo remains exposed and unchanged; the boundary is evidenced in [`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md) and reviewed in [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md). Cargo remains exposed during travel and can be transferred or destroyed by combat.

## Deposit and coin conversion

At the shelter boundary, the worker accepts only an active G2 GATHERER in `DEPOSITING`, derives the
shelter from the soldier's durable ownership, validates every active-attempt cargo row, and computes
the coin delta from the fixed table. One transaction removes the validated cargo, credits the shelter
wallet, returns the soldier to `AT_SHELTER`, closes the attempt as terminal history, and records the
ordered `CargoDeposited` and (when the delta is positive) `CoinsCredited` events. A zero-cargo return
still completes with a zero-value `CargoDeposited` event and no positive coin event. Duplicate work
replays the stored result; malformed or cross-attempt cargo is a typed recovery fault and is never
silently discarded. The registered implementation boundary and resident mission-row reuse rule are
defined by [`SK-TASK-033`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md) and
[`ADR-GAME-0024`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md), and are
runtime-verified in [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md) with review in [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md). A soldier cannot spend or bank cargo in the field.

## Time and node interaction

Extraction consumes world time and decrements the node atomically. A node can be depleted, contested,
or regenerated by a scheduled milestone. Income per world minute includes outbound travel, extraction,
return travel, capacity, and expected loss risk.

## Invariants

- No coin is created before a valid shelter deposit.
- The same cargo cannot be deposited, looted, and destroyed twice.
- A node cannot yield more than its remaining quantity.
- Tool tier and role are read from the committed mission loadout.

## Open decisions

- production capacity and typed-resource weights;
- production conversion values and extraction durations;
- multi-worker reservation/fairness policy beyond the selected single-worker contest outcome; and
- whether future monster species create cargo, direct coin, or world-drop value.

## Related documents

- [`04-resources-tools-and-economy.md`](04-resources-tools-and-economy.md) — family overview;
- [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md);
- [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md);
- [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md); and
- [`Chains/02-dispatch-to-deposit.md`](Chains/02-dispatch-to-deposit.md).
