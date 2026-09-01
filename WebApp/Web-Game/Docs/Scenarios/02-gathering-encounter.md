# Scenario: Gathering Encounter

**Status:** Target scenario

**Logic chain:** [`../Mechanics/Chains/03-encounter-to-loot.md`](../Mechanics/Chains/03-encounter-to-loot.md)

1. A gatherer travels to a wood node, extracts cargo, and approaches capacity.
2. Its sensor detects another player's gatherer. The server records an observation and both actors
   enter contact.
3. The combat resolver uses role, tool tier, level, health, and the future accepted formula.
4. If our gatherer wins, it receives the opponent's exposed cargo and starts its normal return when
   full. If it loses, the opponent receives the cargo and our soldier respawns at home.
5. The mission history records route, contact position, battle result, cargo transfer, death cause,
   respawn, and the next valid action.
