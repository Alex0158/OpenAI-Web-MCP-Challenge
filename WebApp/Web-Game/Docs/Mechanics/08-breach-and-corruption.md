# Shelter Breach and Corruption

**Status:** Working decision from owner discussion

This is a family overview for M06 and M16. The detailed authorities are
[`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md) and
[`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md).

## Atomic breach transaction

When an assault defeats the shelter's defense, the server commits one breach transaction:

1. mark the shelter `BREACHED`;
2. calculate the defender penalty and a separately recorded attacker siege reward;
3. reduce shelter-held resources or coins by the accepted penalty;
4. lower shelter and soldier or military upgrade levels within their minimum bounds;
5. transfer the accepted siege reward exactly once without treating it as field cargo;
6. terminate every active field mission;
7. discard the cargo of affected field soldiers;
8. transform every field soldier into one uncontrolled roaming monster;
9. keep inside soldiers associated with the damaged shelter core; and
10. emit `ShelterBreached`, `SiegeRewarded`, and one `SoldierCorrupted` event per conversion.

The current deterministic baseline is a 50% reduction of defender-held value, one shelter-level
decrease, and one soldier or military-upgrade-level decrease, all bounded by minimum levels. A
random-loss variant may be explored later, but it must remain auditable and cannot replace the
explicit baseline without a new decision.

The breach is a setback with a recovery path. It does not delete the account or silently resurrect a
converted field soldier.

## Event order

A soldier that crosses the shelter boundary and deposits before the breach transaction is an inside
soldier for that event order. A soldier that remains outside is converted even if it was returning.
All boundary checks and cargo writes use one authoritative commit.

## Dashboard explanation

The dashboard must show the breach cause, attacker, defense result, penalty, converted soldier ids,
former roles, lost cargo, and the recovery actions available to the player or Agent.
