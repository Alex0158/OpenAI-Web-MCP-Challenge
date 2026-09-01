# Dashboard and Operations

**Status:** Working design; page tool surface is a later implementation contract

## Shelter view

The shelter dashboard shows level, coins, resource sensing, turret state, migration state, veil
charge and cooldown, resident soldiers, field soldiers, incoming threats, and available upgrades.
It also exposes the global leaderboard and labels its ranking metric when that metric is accepted.

## Mission view

Each row shows soldier identity, role, equipment, target, route, current phase, cargo, estimated
return, encounters, death cause, and the next valid action. The UI must make role lock visible and
explain why an attempted in-field task switch is rejected.

## Event history

The event history is append-only from the player's perspective. It groups causal events such as
mission start, auto-return, forced recall, encounter, battle result, cargo loss, respawn, migration,
breach, and corruption. It is the evidence surface that makes Re-entry Core useful.

## Agent panel

The Agent panel can show the continuation event, current state readback, the tool it wants to use,
its arguments, its bounded result, and the human decision boundary. It must not imply that a proposal
was committed when the backend has only prepared it.
