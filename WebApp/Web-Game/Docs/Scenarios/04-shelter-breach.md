# Scenario: Shelter Breach

**Status:** Target scenario

**Logic chains:** [`../Mechanics/Chains/05-siege-to-breach.md`](../Mechanics/Chains/05-siege-to-breach.md),
[`../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../Mechanics/Chains/07-death-to-respawn-or-corruption.md)

1. A siege party reaches an enemy shelter while it is stable and its turret and resident guards are
   active.
2. The server resolves the assault and commits a breach transaction if the defense loses.
3. Shelter-held value is reduced by the deterministic 50% baseline, shelter and soldier or military
   levels are lowered by one, and a separate siege reward is recorded for the attacker.
4. Field soldiers become uncontrolled roaming monsters, with their cargo discarded. Soldiers inside
   remain with the damaged core.
5. The dashboard shows attacker, defense result, penalty, converted soldiers, and recovery choices.
6. A later Agent continuation can help the player assess the loss and choose a new bounded action;
   it cannot silently restore a converted soldier.
