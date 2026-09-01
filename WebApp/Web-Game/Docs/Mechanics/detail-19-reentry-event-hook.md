# Event and Re-entry Game Hook

**Mechanism:** M19
**Status:** G2 Re-entry boundary accepted; runtime delivery is unverified
**Authority:** This file owns the game-facing event eligibility and continuation payload. The outer
Re-entry Core owns consent, Receiver delivery, private Agent context, and adapter behavior;
Engineering owns implementation contracts.

## Why this is a game mechanism

The game creates durable causal changes that can make a previous strategy insufficient: a gatherer
dies, cargo is looted, a shelter is attacked, a migration completes, or a breach creates roaming
monsters. The hook turns those domain events into a bounded continuation opportunity without making
the Agent the game authority.

## Event eligibility

Candidate domain events include:

- `MissionAutoReturned`;
- `MissionRecalled`;
- `SoldierEncountered`;
- `BattleResolved`;
- `SoldierDied` and `SoldierRespawned`;
- `CargoLooted` and `CargoLostToMonster`;
- `ShelterUnderAttack` and `ShelterBreached`;
- `SiegeRewarded` and `SoldierCorrupted`;
- `MigrationStarted` and `MigrationCompleted`; and
- `ResourceBelowThreshold`.

For G2, only `CargoLostToMonster` is continuation-eligible. One pending continuation is allowed per
shelter with a 60-world-second cooldown and `event_id` deduplication. Broader event eligibility and
the production matrix remain `OPEN`.

## Causal payload

The game event supplies an opaque player/shelter binding, event id, world time, causal type, affected
entity ids and versions, mission or shelter reference, and a bounded continuation hint. It never
includes raw Agent context, credentials, arbitrary prompt text, or hidden game state.

## Return and action

After the outer continuation path accepts delivery, the Agent returns to the canonical shelter page.
The page exposes current, permission-checked WebMCP tools. The Agent rereads shelter state, missions,
threats, cargo, and history before executing the accepted bounded `force_recall_soldier` action. The
command queues normal travel, preserves role and cargo, and does not create coins. Migration, siege,
destructive upgrades, and irreversible recovery remain human-confirmed.

High-consequence actions such as migration, siege, destructive upgrades, or irreversible recovery
remain subject to the final human boundary. The game remains fully playable by a human when WebMCP or
Re-entry is unavailable.

## Invariants

- Backend state and permissions remain authoritative.
- An event is a state change, not an instruction prompt.
- Re-entry never bypasses role lock, visibility, combat, cargo, migration, or breach rules.
- The Agent must reread current state and receive typed results or failures.
- A repeated delivery cannot duplicate a game command or reward.

## Proof obligations

The eventual implementation must show event commit, outbox delivery, canonical page return, fresh
tool discovery, one bounded action, typed result, and visible human decision boundary. A written event
list is not runtime evidence.

## Open decisions

- post-G2 event eligibility and grants;
- exact production tool names and authority matrix;
- future automatic versus preparation-only commands;
- production dedupe and continuation policy; and
- the minimum causal history for future event types.

## Related documents

- [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md);
- [`../Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md);
- [`../Design/Capabilities/07-event-driven-agent-continuation.md`](../Design/Capabilities/07-event-driven-agent-continuation.md); and
- [`Chains/08-event-to-reentry-action.md`](Chains/08-event-to-reentry-action.md).
