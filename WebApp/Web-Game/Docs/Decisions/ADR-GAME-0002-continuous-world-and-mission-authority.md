# ADR-GAME-0002: Continuous World and Mission Authority

**Status:** ACCEPTED WORKING BASELINE  
**Date:** 2026-09-01  
**Scope:** Initial game rules from the owner discussion

## Decision

Use one open world whose server clock advances while a player is offline. The backend owns world
state, mission phases, movement, sensing, encounters, battle, cargo, rewards, shelter migration,
breach, and monster conversion.

A starter shelter has a bounded resource-sensing field, a turret, upgrade branches, and five
soldiers. A soldier is assigned one role-locked mission and tool loadout. A full pack automatically
starts a return; a forced recall queues a return. Resources convert to coins only at shelter deposit.
Ordinary soldier death respawns the same identity at home with no respawn cooldown or replacement
fee: its repeatable gathering or hunting assignment is reissued under its recorded restart policy,
while siege ends. PvP winners receive exposed cargo; a monster kill destroys the soldier's unbanked
cargo without transferring it to the monster, and the killer remains in the normal monster state
machine.

Shelter migration is paid, committed, un-cancellable, veil-hidden, turret-disabled, and pauses new
deployments while existing field missions continue. A veil charge automatically recharges after its
cooldown and an expensive purchase can add a charge. A breach applies a shelter penalty, ends active
field missions, and converts field soldiers into uncontrolled roaming monsters; inside soldiers
remain with the damaged core.

## Consequences

The world creates durable, causal events that are useful for dashboard history and Re-entry Core.
Mission switching, combat, migration, and breach need explicit server versions and atomic event
ordering. Balance values remain open.

## Reopen triggers

Reopen if the owner changes the persistent-world promise, role lock, cargo settlement, migration
concealment, or breach consequence.
