# Sleepless Kingdom MVP Contract Sheet

**Contract:** `SK-MVP-0.1`  
**Status:** ACCEPTED MVP CONTRACT; runtime implementation is unverified  
**Date:** 2026-09-01  
**Authority:** [`ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)  
**Scope:** Local two-player vertical slice and its hosted proof boundary

## Contract posture

This is the normative input to the first implementation task after CP-02. It freezes identity,
state, event, revision, time, cargo, combat, command, snapshot, and Re-entry boundaries while leaving
visual assets and production balance tunable. A runtime cannot claim this contract is implemented until
the checkpoint evidence passes.

The browser is a projection and command surface. The world worker owns time, positions, pathfinding,
missions, cargo, combat, resources, identity, and settlement. The Re-entry Core owns continuation
delivery and private Agent context. The page-bound WebMCP surface can request only the same
permission-checked operations available to the human UI.

## 1. Version, identity, and ownership

Every persisted event and snapshot carries `contract_version = SK-MVP-0.1`. The first fixture world
contains these opaque identities:

| Entity | Rule |
|---|---|
| `world_id` | One server-created fixture world; reset creates a new id and never edits state in place |
| `player_id` | Two deterministic fixture players, `player-a` and `player-b` represented externally by opaque session bindings |
| `shelter_id` | One shelter owned by each player; shelter identity survives migration in later versions |
| `soldier_id` | Five stable soldiers per shelter; ordinary death never creates a second roster entity |
| `mission_attempt_id` | New for every dispatch or repeatable reissue; history links it to the stable soldier |
| `monster_id` | One seeded monster with a stable identity and normal state machine |
| `resource_node_id` | One Wood and one Rock node per start zone; node quantity is authoritative |
| `encounter_id` | One locked contact; a participant cannot be in two resolving encounters |
| `event_id` | Globally unique domain event id; duplicate delivery is harmless |
| `idempotency_key` | Client or Agent command key; the same key returns the original result |

The server binds every command and WebMCP call to an opaque session and shelter owner. The client
cannot submit player, shelter, soldier, cargo, coin, position, or hidden-cell values as authoritative
state. A command must include the expected entity revision when it mutates an existing entity.

## 2. World geometry and fixture map

- Logical map: 128 × 128 integer tiles, fixed seed `sleepless-mvp-01`.
- Shelter centers: Player A `(16,64)` and Player B `(112,64)`; Euclidean center distance is 96
  tiles, satisfying the accepted minimum of 80.
- Camera target: 32 × 20 logical tiles. The Canvas may scale this projection for device-pixel ratio.
- Start zones: one Wood and one Rock node 12–20 tiles from each shelter, with symmetric placement and
  20 units per node.
- Seeded threat lane: the monster patrol crosses the higher-value Rock route after at least one
  extraction milestone. The Wood route remains the lower-risk comparison for the demo trace.
- Walkability, shelter overlap, node placement, and the seeded route are generated from the seed and
  verified on every fixture reset.
- A protected start rejects hostile monster contact within 12 tiles of a shelter until the owner's
  first field dispatch or 120 world seconds, whichever comes first. Exploration and dashboard reads
  remain available during protection.

The protected-start rule is onboarding protection, not migration veil. It does not hide a shelter,
protect an already-dispatched soldier, or make the rest of the map safe.

## 3. World clock and due-work order

- One world second equals one real second while the worker is healthy.
- Movement and visibility reconcile at 100 ms. Combat, extraction, death, respawn, and node timers
  settle on integer world-second boundaries.
- Browser presence, focus, or WebSocket connection never owns or pauses world time.
- On restart, the worker advances from persisted `world_time` to current server time. Routine due work
  may be summarized in bounded batches; consequential events remain individually causal and replayable.
- A wall-clock anomaly that would move time backwards records a typed recovery warning and does not
  reverse committed state.

At each integer boundary, apply due work in this order:

1. move actors and apply home-boundary crossings; a soldier that crosses home enters `DEPOSITING`;
2. commit valid deposits before the soldier can be treated as field cargo;
3. detect and lock new contacts using post-movement positions and entity revisions;
4. apply extraction only to soldiers still in `WORKING` and not locked in contact;
5. resolve one combat round for each locked encounter in deterministic initiative order;
6. settle death, cargo loss or transfer, respawn, and repeatable mission reissue;
7. apply resource/monster timers, projections, snapshots, and outbox delivery.

Migration, siege, breach, and other full-game boundaries are not G2 commands. When added later, they
must define their own ordering against this sequence and update the contract version.

## 4. Soldier lifecycle, roles, and missions

The soldier lifecycle and mission phase are separate fields:

```text
soldier.lifecycle: AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER
mission.phase: AT_SHELTER | TRAVELLING | WORKING | RETURNING | DEPOSITING | WAITING_REVIEW | TERMINAL
```

G2 supports `GATHERER` and `HUNTER` roles. Guard and siege roles remain represented in the concept but
are not active commands in the slice. Dispatch stores role, tool, target, route, return policy,
expected revision, and `mission_attempt_id`. The role and loadout cannot change while the mission is
field-active.

Return policy is one of:

- `WHEN_FULL`: five cargo slots switches `WORKING` to `RETURNING`;
- `ON_TARGET_DEPLETED`: an empty node returns partial cargo;
- `ON_RECALL`: an accepted recall queues normal travel to the current home anchor.

Recall never teleports, changes role, clears cargo, bypasses combat, or creates coins. An unreachable
route enters `WAITING_REVIEW` with a typed reason rather than retrying forever. A terminal mission
remains in history with its cause and next valid command.

Ordinary monster death marks the current attempt failed, clears field cargo, respawns the same
`soldier_id` at its shelter immediately in world time, creates a new `mission_attempt_id`, and
reissues the repeatable gathering or hunting assignment. A siege attempt, when implemented later,
ends on death.

## 5. Resources, cargo, and settlement

| Rule | G2 value |
|---|---:|
| Visible resource types | Wood and Rock |
| Cargo capacity | Five equal-weight unit slots |
| Extraction cadence | One unit every 2 world seconds |
| Node quantity | 20 units per node |
| Node respawn | 30 world seconds after depletion |
| Wood deposit value | 1 coin per unit |
| Rock deposit value | 3 coins per unit |
| Gold and yield multipliers | Deferred outside G2 |

Cargo belongs to the soldier until a shelter deposit transaction commits. A node quantity decrement,
cargo increment, and extraction event commit together. A full pack or recall begins return; only a
successful home-boundary deposit removes cargo and credits coins. A monster death destroys the
remaining field cargo and credits no killer reward. A G2 hunter victory clears the seeded monster and
emits `MonsterDefeated`; it creates no third resource or direct coin reward. A future PvP transfer is
a separate settlement event and cannot touch shelter-held value.

The internal calibration measures both time and risk:

```text
gross_coin_rate = deposited_coin / (travel_out + extraction + travel_home)
risk_adjusted_rate = (success_probability × deposited_coin - expected_field_loss) / elapsed_world_time
```

The formula is a tuning and dashboard explanation aid, not a client authority input.

## 6. Combat contract

G2 uses one deterministic round per world second:

```text
damage = max(1, attack + weapon_power + matchup_bonus - defense)
```

Higher `speed` acts first. Equal speed uses ascending `entity_id`. There are no random rolls, critical
hits, hidden party bonuses, or client-selected outcomes in G2.

| Actor/loadout | HP | Attack | Defense | Speed | Tool power | Monster matchup |
|---|---:|---:|---:|---:|---:|---:|
| Gatherer/pickaxe | 100 | 8 | 2 | 3 | 0 | 0 |
| Hunter/sword | 100 | 12 | 3 | 5 | 4 | 4 |
| Seeded monster | 80 | 12 | 2 | 4 | 0 | 0 |

The hunter deals 18 damage per round and defeats the seeded monster in five rounds. The monster
deals 9 damage per round to the hunter. The gatherer deals 6 damage per round and receives 10 damage
per round, creating the intended cargo-risk contrast. These values are accepted for the first trace,
not a claim of final balance.

Each combat event records encounter id, participants, role, tool, formula inputs, initiative order,
round number, damage, remaining HP, terminal cause, and settlement event id. A participant is claimed
by one resolving encounter and all settlement changes commit exactly once.

## 7. Event, revision, and persistence envelope

Every domain event contains:

```text
event_id
event_version
contract_version
event_type
world_id
world_time
causation_id
idempotency_key (when command-caused)
aggregate_type / aggregate_id / aggregate_revision
visibility_scope
typed_payload
```

The minimum event types for G2 are `MissionDispatched`, `MissionWorking`, `CargoExtracted`,
`MissionAutoReturned`, `MissionRecalled`, `EncounterLocked`, `BattleRoundResolved`, `MonsterDefeated`,
`SoldierDied`, `CargoLostToMonster`, `SoldierRespawned`, `MissionReissued`, `CargoDeposited`,
`CoinsCredited`, `ResourceDepleted`, `ResourceRespawned`, and `ContinuationDelivered`.

One database transaction writes the authoritative state mutation, event log entry, and eligible
outbox row. Snapshot rows include `snapshot_version`, `contract_version`, `world_time`, and entity
revisions. Schema, snapshot, and event versions are checked on load; incompatible versions enter a
visible recovery state rather than being silently coerced.

Outbox delivery is at-least-once. Domain effects are exactly-once by `event_id` and idempotency key.
An outbox payload contains only the opaque binding, causal event, versions, world time, and bounded
continuation hint. It contains no prompt, credential, raw Agent context, or hidden map data.

## 8. Commands and page tools

Mutation commands use typed HTTP envelopes:

```text
command_id
command_type
contract_version
session_binding
expected_entity_revisions
idempotency_key
typed_arguments
```

G2 mutation commands are `join_world`, `move_player`, `assign_soldier_mission`, `force_recall_soldier`,
and the server-owned fixture `reset_world`. Read tools are `inspect_shelter_state`,
`inspect_missions`, and `inspect_mission_history`. The Re-entry path first reads current mission
history and then attempts `force_recall_soldier` under the accepted grant; the server returns a typed
result if the revision no longer permits it.

Every result includes `contract_version`, current entity revision, effect, event id when applicable,
and a typed failure. Minimum failure codes are `NOT_OWNER`, `STALE_REVISION`, `DUPLICATE_COMMAND`,
`ROLE_LOCKED`, `NOT_AT_SHELTER`, `TARGET_UNAVAILABLE`, `IN_COMBAT`, `WAITING_REVIEW`,
`WEBMCP_UNAVAILABLE`, and `RECOVERY_REQUIRED`.

## 9. Snapshot and visibility contract

The page receives a full authoritative snapshot on connect or resync, followed by sequenced snapshots
around 10 Hz. Each snapshot contains:

```text
snapshot_id
base_snapshot_id (optional)
contract_version
world_time
player_scope
entity_revisions
visible actors and nodes
explored cells for this player
shelter and mission dashboard records
recent causal events permitted to this player
```

The browser may interpolate movement at up to 60 FPS. It cannot resolve combat, reveal hidden cells,
award coins, or rewrite a revision. A dropped connection marks the page `STALE`, then `RECONNECTING`;
the next full snapshot replaces local projection state before new commands are accepted.

## 10. G2 causal acceptance stories

### Gatherer loss and Re-entry

1. Player A dispatches a gatherer to the Rock route with `WHEN_FULL`.
2. The worker advances while the page is closed; the seeded monster contacts the gatherer after at
   least one extraction milestone.
3. The gatherer loses under the deterministic formula. One transaction destroys only field cargo,
   records `CargoLostToMonster`, respawns the same soldier, creates a new mission attempt, and
   reissues the repeatable mission.
4. The outbox delivers one eligible continuation. The Agent returns to the canonical page, rereads
   current mission history and revisions, and executes the accepted recall command when the current
   revision still permits it; an unavailable capability or stale command produces a visible typed
   result.
5. The dashboard shows route, cargo, combat, loss, respawn, reissue, continuation, and action result.

### Hunter contrast

The same seeded route with a hunter produces a five-round victory and no monster-kill cargo-loss
event. The history explains the role and tool difference using the same formula.

### Disconnect and restart

The browser closes and the worker restarts after a known time gap. The recovered world advances due
work once, keeps the event and outbox identity, and sends a full current snapshot on reconnect. No
browser timer or retry creates a second death, cargo settlement, respawn, coin, or continuation.

### Two-player landmark

Player B's shelter can appear as a discovered landmark after legal exploration. Active PvP attack
commands remain disabled in G2; hidden shelter state and undiscovered cells remain private.

## 11. Non-goals and versioning

The following are outside `SK-MVP-0.1`: active PvP field loot, siege and breach, migration veil,
Gold, tier yield multipliers, shelter upgrades, public authentication, seasons, leaderboard balance,
additional monster species, large population scaling, and mobile optimization.

Changing identity, event order, cargo settlement, Re-entry authority, or human boundary requires a new
contract version and an ADR update. Tuning combat numbers, node placement, or visual assets may remain
configuration changes when the causal contract and acceptance stories still hold.

## 12. CP-01 closure evidence

CP-01 is complete when this sheet, ADR-GAME-0006, the roadmap, current status, mechanism details,
chains, scenarios, and validation records agree; the owner-accepted choices are recorded; and the
repository documentation gates pass. Runtime and browser proof belong to CP-02 onward. No
implementation task is created by this document under the current child-stage rule.
