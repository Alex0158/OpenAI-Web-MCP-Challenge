# Loot, Rewards, and Atomic Transfer

**Mechanism:** M14
**Status:** Transaction boundary accepted; shares and caps are open
**Authority:** This file owns hostile cargo/reward settlement. Resource deposit owns ordinary banking;
breach owns the surrounding shelter transaction.

## Three value ledgers

The game keeps three different value paths explicit:

1. **Field cargo:** typed resource units carried by a soldier and exposed until shelter deposit.
2. **Shelter-held value:** deposited resources or coins inside the defender's shelter.
3. **Siege reward:** the attacker's separately recorded share created by a successful breach.

These ledgers can settle in one atomic breach transaction, but one value unit must never be counted
as both field loot and shelter reward.

## PvP field loot

When a locked field encounter resolves, the winner receives the loser's unbanked cargo exactly once.
The loser receives the ordinary death and respawn outcome. If the winner has insufficient capacity,
the overflow policy is `OPEN` and must be explicit; it cannot disappear silently.

## Monster loss

When a monster kills a soldier, the soldier's exposed cargo is destroyed in the monster-combat
transaction; it is not transferred to the killer. The same soldier identity respawns at the shelter
unless breach state prevents it. The killer remains governed by the normal monster state machine.
The respawned soldier has empty field cargo; the destroyed units cannot be recovered by the player or
Agent.
Whether some monster species later create a world drop is an explicit extension, not an implicit
rule.

## Siege reward

When an assault breaches a shelter, the server calculates the defender penalty and attacker siege
reward from the shelter-held ledger. The reward is transferred to the attacker exactly once and is
not treated as field cargo. The reward event identifies attacker, defender, breach id, value basis,
share, cap, and resulting wallets.

## Atomicity and idempotency

A settlement transaction claims the encounter or breach id, verifies participant and shelter
versions, writes all ledger changes, records cargo destruction or transfer, updates mission states,
and emits events. A retry with the same id cannot duplicate a transfer. If a version check fails,
the transaction aborts with no partial reward.

## Invariants

- A cargo unit has one owner at every committed point.
- Shelter-held value cannot be taken by a field encounter.
- A successful siege produces one reward and one breach settlement.
- Every loss and transfer is visible in mission and event history.

## Open decisions

- overflow cargo behavior;
- exact siege reward share, cap, and minimum value;
- anti-farming and repeat-attack protections;
- random versus deterministic breach penalty; and
- monster value as cargo, direct coin, or world drop.

## Related documents

- [`06-combat-and-loot.md`](06-combat-and-loot.md) — family overview;
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md);
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md); and
- [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md).
