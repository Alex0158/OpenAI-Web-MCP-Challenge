# Dashboard and Operations

**Status:** Working design; page tool surface is a later implementation contract

## Shelter view

The shelter dashboard shows level, coins, resource sensing, turret state, migration state, veil
charge and cooldown, resident soldiers, field soldiers, incoming threats, and available upgrades.
It also exposes the global leaderboard and labels its ranking metric when that metric is accepted.

The page also shows process connectivity separately from game readiness. During startup or a worker
fault, the player can read the current view and event history, while state-changing controls explain
that the runtime is `starting`, `degraded`, or `draining` and are disabled until the server reports
`ready`. The page never infers world readiness from a browser timer or an optimistic local state.

## Mission view

Each row shows soldier identity, role, equipment, target, route, mission phase, encounter status,
cargo, estimated return, death cause, and the next valid action. The UI must make role lock visible and
explain why an attempted in-field task switch is rejected.

## Event history

The event history is append-only from the player's perspective. It groups causal events such as
`MissionDispatched`, `MissionAutoReturned`, `MissionRecalled`, `EncounterLocked`,
`BattleRoundResolved`, `EncounterResolved`, `CargoLostToMonster`, and `SoldierRespawned`; later
migration, breach, and corruption events remain outside G2. It is the evidence surface that makes Re-entry Core useful. The dashboard
also shows Agent Signal eligible-event count, `world_event_cursor` range, severity, delivery state, and
whether events were coalesced; routine events remain visible in history without creating one Codex
Thread message each.

## Agent panel

The Agent panel can show the continuation event or coalesced event digest, current state readback, the
tool it wants to use, its arguments, its bounded result, and the human decision boundary. It must not
imply that a proposal was committed when the backend has only prepared it. A late or state-changed
action is shown as a typed result rather than as a silent no-op.
