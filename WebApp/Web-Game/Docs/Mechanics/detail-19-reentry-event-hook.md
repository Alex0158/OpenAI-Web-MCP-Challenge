# Event and Re-entry Game Hook

**Mechanism:** M19
**Status:** G2 Re-entry boundary and delivery policy accepted; local worker-to-port-to-page-HTTP-to-recall composition is runtime-verified; external delivery remains unverified
**Authority:** This file owns the game-facing event eligibility and continuation payload. The outer
Re-entry Core owns consent, Receiver delivery, private Agent context, and adapter behavior;
Engineering owns implementation contracts.

## Why this is a game mechanism

The game creates durable causal changes that can make a previous strategy insufficient: a gatherer
dies, cargo is looted, a shelter is attacked, a migration completes, or a breach creates roaming
monsters. The hook turns those domain events into a bounded continuation opportunity without making
the Agent the game authority.

The successful local loss/reissue-to-page-recall composition is recorded under
[`SK-TASK-069`](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md) and
[`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md).
The clean restart continuity and real burst/page-context extensions are recorded under
[`SK-TASK-070`](../Tasks/SK-TASK-070-cp16-local-causal-restart-recall-continuity.md),
[`SK-EVID-057`](../Evidence/SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md),
[`SK-TASK-071`](../Tasks/SK-TASK-071-cp16-real-event-burst-page-context.md), and
[`SK-EVID-058`](../Evidence/SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md).
These records remain local process/page evidence with a labelled transport; external Re-entry remains open.

## Event eligibility

The broader post-G2 candidate domain events include:

- `ActorObserved`;
- `MissionAutoReturned`;
- `MissionRecalled`;
- `EncounterLocked`;
- `BattleRoundResolved` and `EncounterResolved`;
- `SoldierDied` and `SoldierRespawned`;
- `CargoLooted` and `CargoLostToMonster`;
- `ShelterUnderAttack` and `ShelterBreached`;
- `SiegeRewarded` and `SoldierCorrupted`;
- `MigrationStarted` and `MigrationCompleted`; and
- `ResourceBelowThreshold`.

`SoldierEncountered` and `BattleResolved` are retired names and must not be emitted by an
authoritative G2 handler. `CargoLooted` remains a post-G2 PvP settlement event; the G2 monster trace
uses `CargoLostToMonster` instead. `BattleRoundResolved` is per round and `EncounterResolved` is per
terminal encounter.

For G2, only `CargoLostToMonster` is continuation-eligible. One pending continuation is allowed per
shelter with a 60-world-second cooldown and `event_id` deduplication. The cooldown limits creation of
a new wake; it never removes a Domain Event. An event may merge into an active delivery slot, while an
event inside the cooldown with no active slot remains history-only. Broader event eligibility and the
production matrix remain `OPEN`.

## Causal payload

The game event supplies an opaque player/shelter binding, globally unique event id, monotonic
`world_event_cursor` scoped to its world, world time, causal type, affected entity ids and versions,
mission or shelter reference, and a bounded continuation hint. It never includes raw Agent context,
credentials, arbitrary prompt text, or hidden game state.

## Domain Events and Agent Signals

Every committed state change remains a durable Domain Event. The Re-entry path does not relay every
Domain Event to the Cloud Receiver or Codex Thread. A derived Agent Signal is created only for an
eligible actionable event and may summarize a `world_event_cursor` range with an eligible event count,
event types, highest severity, latest event, latest world time, and relevant entity versions. The range
is a page-read window and may include routine events that do not create a signal.

For each opaque continuation binding and shelter, at most one Agent Signal is pending or in flight.
Later eligible events merge into that signal. Retries reuse its identity. Routine movement, world
ticks, ordinary combat rounds, and repeated projection changes do not wake the Agent. A critical event
may raise the pending severity but does not interrupt an active Codex Thread turn or create a duplicate
wake-up. After handoff, new events remain in the delivery slot's deferred cursor until the current
signal is acknowledged or terminally rejected. The Local Connector delivers one coalesced context at
the next safe turn boundary.

This is notification backpressure, not a gameplay delay. The world clock and mission transitions do
not wait for the Agent.

## Return and action

After the outer continuation path accepts delivery, the Agent returns to the canonical shelter page.
The page exposes current, permission-checked WebMCP tools. The Agent rereads shelter state, missions,
threats, cargo, the delivered event digest, and history before executing the accepted bounded
`force_recall_soldier` action. The command queues normal travel, preserves role and cargo, and does not
create coins. If the world has already advanced, the server returns a typed live-state result instead
of a silent no-op. Migration, siege, destructive upgrades, and irreversible recovery remain
human-confirmed.

High-consequence actions such as migration, siege, destructive upgrades, or irreversible recovery
remain subject to the final human boundary. The game remains fully playable by a human when WebMCP or
Re-entry is unavailable.

## Invariants

- Backend state and permissions remain authoritative.
- An event is a state change, not an instruction prompt.
- Re-entry never bypasses role lock, visibility, combat, cargo, migration, or breach rules.
- The Agent must reread current state and receive typed results or failures.
- A high-frequency event burst cannot enqueue an unbounded number of Agent or Codex Thread messages.
- A repeated delivery cannot duplicate a game command or reward.

## Proof obligations

The eventual implementation must show event commit, outbox delivery, canonical page return, fresh
tool discovery, one bounded action, typed result, and visible human decision boundary. A written event
list is not runtime evidence.

## Open decisions

- post-G2 event eligibility and grants;
- exact production tool names and authority matrix;
- future automatic versus preparation-only commands;
- post-G2 production eligibility and grant policy; and
- the minimum causal history for future event types.

## Related documents

- [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md);
- [`../Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md);
- [`../Design/Capabilities/07-event-driven-agent-continuation.md`](../Design/Capabilities/07-event-driven-agent-continuation.md); and
- [`Chains/08-event-to-reentry-action.md`](Chains/08-event-to-reentry-action.md).
