# API and WebMCP Surface

**Status:** TARGET contract; schemas are not implemented

## Human and Agent commands

The application should expose the same authorized domain operations to the human UI and the WebMCP
adapter. Candidate page tools are:

- `inspect_shelter_state`;
- `inspect_world_snapshot`;
- `inspect_nearby_resources`;
- `inspect_missions`;
- `inspect_mission_history`;
- `inspect_incoming_threats`;
- `assign_soldier_mission`;
- `force_recall_soldier`;
- `set_defense_posture`;
- `start_shelter_migration`;
- `prepare_siege_party`; and
- `review_reentry_event`.

High-consequence commands such as migration, siege, and accepting a destructive upgrade should
return an explicit reviewable preparation or human boundary according to the final game policy.

## Tool invariants

Every tool must validate JSON Schema, current shelter ownership, entity version, role lock, migration
state, target visibility, and command idempotency. A tool result should include the current version,
what changed, and any typed failure. The Agent must reread current state after re-entry; a cached
conversation state is not authoritative.

## Re-entry events

Candidate event types include `MissionAutoReturned`, `MissionRecalled`, `SoldierEncountered`,
`BattleResolved`, `SoldierDied`, `SoldierRespawned`, `CargoLooted`, `CargoLostToMonster`,
`ShelterUnderAttack`, `ShelterBreached`, `SiegeRewarded`, `SoldierCorrupted`, `MigrationStarted`,
`MigrationCompleted`, and `ResourceBelowThreshold`.

An event carries an opaque player/shelter binding, event id, world time, entity versions, causal type,
mission or shelter references, and a bounded continuation hint. It does not carry raw Agent context,
credentials, or an instruction prompt.

## WebMCP boundary

WebMCP is the page capability surface, not the scheduler or backend authority. The game must remain a
normal human-facing web application when WebMCP is unavailable. The Re-entry Core handles future
continuation delivery and canonical return; the game page exposes only current, permission-checked
operations.
