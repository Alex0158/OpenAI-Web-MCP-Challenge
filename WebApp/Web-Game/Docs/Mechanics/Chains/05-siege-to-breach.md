# Chain C05: Siege to Breach

**Status:** Working decision; assault window and recovery are open

## Trigger and outcome

An attacker returns with personal shelter intelligence, forms a siege party, and sends it toward a
target. The chain ends in failure/retreat or one atomic breach that changes both shelters and the
shared world.

## Ordered flow

1. C01 produces a time-stamped intelligence record and the attacker returns home.
2. `M07`/`M08` form a siege party with one role-locked loadout, target coordinate, route, and party
   mission.
3. `M09` moves the party toward the last-known position while the defender's `M15` defense state
   and `M17` veil state remain authoritative.
4. If no shelter is found or the target is concealed, the party follows the accepted stale-search
   rule or fails; it never receives hidden current location automatically.
5. At contact, `M13` resolves guards, turrets, shelter defense, and siege party strength.
6. If defense holds, the siege fails or retreats and the party returns or terminates.
7. If defense loses, `M16` commits the breach transaction: defender-held value penalty, separate
   attacker reward, mission termination, field cargo loss, and field-soldier conversion.
8. `M18` projects the committed event and `M19` evaluates continuation eligibility.

## Invariants

The breach id is exactly once. A soldier deposits before the boundary commit and remains resident;
one still outside converts to one roaming monster. Reward, penalty, and field cargo are separate
ledgers. No account is silently deleted.

## Failure branches

- Invalid or stale intelligence prevents dispatch.
- Migration begins before assault commitment and conceals the target.
- A version conflict aborts the breach without partial reward.
- Recovery remains unavailable until the damaged-core rule is accepted.

## Open decisions

Assault commitment, party aggregation, turret/guard formula, reward share/cap, repair duration/cost,
random penalty policy, and post-breach resident commands remain `OPEN`.

## Related mechanisms

- [`../detail-16-siege-assault-and-breach.md`](../detail-16-siege-assault-and-breach.md);
- [`../detail-15-shelter-defense-and-turrets.md`](../detail-15-shelter-defense-and-turrets.md); and
- [`../detail-14-loot-reward-and-atomic-transfer.md`](../detail-14-loot-reward-and-atomic-transfer.md).
