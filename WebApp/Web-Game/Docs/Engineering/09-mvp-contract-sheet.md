# Sleepless Kingdom MVP Contract Sheet

**Contract:** `SK-MVP-0.2`  
**Status:** OWNER-ACCEPTED COHERENT G2 CONTRACT; CP-04 process, CP-05 persistence, CP-06 clock/recovery, CP-08 local movement/cadence boundaries, the bounded CP-09 dispatch/route-arrival boundaries, the CP-10 extraction/cadence/`RETURNING`/same-worker contest/return-navigation/deposit boundaries, and CP-11 GATHERER-loss, HUNTER-victory, and bounded danger-cell reissue/review local boundaries are runtime-verified; one-browser hydration plus bounded ordinary-UI discrete movement, GATHERER dispatch, the named local server-owned continuous-intent path, and the CP-13 page-bound read/recall implementation are runtime-verified at their named local scopes; canonical-page four-read registration/readback and one supported read-only invocation are verified for one local `gpt-5.6-sol` plus `medium` session under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); dynamic recall grant delivery, independent two-browser delivery, and hosted gameplay remain open  
**Date:** 2026-09-02  
**Authority:** [`ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md), [`ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md), [`ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), [`ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), [`ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md), [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), [`ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md), [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md), [`ADR-GAME-0022-cp10-contested-node-outcome.md`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md), [`ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md), [`ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md), [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md), [`ADR-GAME-0026-cp11-hunter-victory-and-return.md`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md), and [`ADR-GAME-0036-cp12-server-owned-continuous-intent.md`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md)  
**Scope:** Local two-player vertical slice and its hosted proof boundary

The CP-11 reissue decision is additionally governed by [`ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md); its local runtime result is bound to [`SK-EVID-025`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md) and [`Validation/40`](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md).

The bounded CP-12 human command adapters are additionally governed by
[`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
and [`ADR-GAME-0031`](../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md).
Their named local results are [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md)
and [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md);
neither result is a scheduler, WebMCP, Re-entry, or hosted claim.

The CP-06 boundary-safe composition and B autonomous extension are additionally governed by
[`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)
and [`ADR-GAME-0033`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md).
Their named local results are [`SK-EVID-035`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)
and [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md);
hosted continuity, timer reducers, and default-world selection remain outside this contract slice.

The CP-12 server-owned continuous-intent extension is additionally governed by
[`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md) and the accepted
Challenge [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md).
It adds one-shot WebSocket start/replacement/stop frames, an opaque connection owner, synchronous
close/drain/fault revocation, and server-side safety stops before competing move/dispatch mutations;
it does not change the contract version, world clock, event vocabulary, persistence schema, or
full-snapshot projection boundary. Its named local runtime result is recorded in
[`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).

## Contract posture

This is the normative input to the G1/G2 implementation route after CP-02. Version `SK-MVP-0.2`
supersedes the Re-entry delivery portion of `SK-MVP-0.1` and now carries the completed G2 geometry,
state, anti-loop, protected-start, event-vocabulary, and snapshot-vocabulary decisions. It freezes
identity, state, event, revision, time, cargo, combat, command, `world_snapshot`/`client_snapshot`, and
Re-entry boundaries while leaving visual assets and production balance tunable. Runtime code cannot claim this contract is
implemented until the checkpoint evidence passes.

The browser is a projection and command surface. The world worker owns time, positions, pathfinding,
missions, cargo, combat, resources, identity, and settlement. The Re-entry Core owns continuation
delivery and private Agent context. The page-bound WebMCP surface can request only the same
permission-checked operations available to the human UI.

The CP-04 process lifecycle is a separate operational contract. Its accepted local one-process
entrypoint, liveness/readiness semantics, and shutdown behavior are recorded in
[`ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md).
Its local process behavior is verified in `SK-EVID-007`; those fields do not create a `world_id`, advance `world_time`, or make process health equivalent to
world readiness before the persistence and recovery checkpoints are implemented.

## 1. Version, identity, and ownership

Every persisted Domain Event and `world_snapshot` carries `contract_version = SK-MVP-0.2`; each
`client_snapshot` projection carries the same version. The first fixture world
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
- Start zones: one Wood and one Rock node 14–20 tiles from each shelter, with symmetric placement and
  20 units per node. The fixture positions are Player A Wood `(30,64)` and Rock `(34,64)`; Player B
  uses the mirrored Wood `(98,64)` and Rock `(94,64)`.
- Seeded threat lane: the monster patrol crosses the higher-value Rock route after at least one
  extraction milestone. The Wood route remains the lower-risk comparison for the demo trace.
- Walkability, shelter overlap, node placement, and the seeded route are generated from the seed and
  verified on every fixture reset.
- Movement rates, sensing radii, and contact boundaries use the G2 values in the table below and
  Euclidean center-to-center distance in logical tiles.
- A protected start rejects hostile monster contact within 12 tiles of a shelter while
  `world_time < protected_start_until`, where `protected_start_until = start_world_time + 120`. The
  first dispatch does not shorten the timer; a field soldier is exposed after it leaves the radius,
  while the shelter and resident soldiers remain covered until expiry. Exploration and dashboard
  reads remain available during protection.

The protected-start rule is onboarding protection, not migration veil. It does not hide a shelter,
make the rest of the map safe, or protect a field soldier outside the radius. At exactly
`world_time == protected_start_until`, the shield has expired before contact detection.

| G2 movement or boundary field | Value | Rule |
|---|---:|---|
| `player_move_speed_tiles_per_world_second` | 4.0 | Player avatar movement |
| `soldier_move_speed_tiles_per_world_second` | 3.0 | All G2 soldier roles; travel and return |
| `monster_patrol_speed_tiles_per_world_second` | 2.0 | Seeded monster patrol |
| `monster_chase_speed_tiles_per_world_second` | 4.0 | Seeded monster pursuit |
| `engagement_radius_tiles` | 1.0 | Contact can lock an encounter |
| `soldier_sensor_radius_tiles` | 6.0 | Field soldier observation range |
| `monster_detection_radius_tiles` | 5.0 | Seeded monster target detection range |
| `shelter_resource_sensing_radius_tiles` | 24.0 | Shelter Wood/Rock sensing field |
| `player_fog_reveal_radius_tiles` | 4.0 | Player avatar cell reveal field |
| `protected_start_radius_tiles` | 12.0 | Hostile monster contact rejection during onboarding |

All radius comparisons are inclusive (`distance <= radius`). Soldier sensor radius is uniform for
G2 gatherers and hunters. Combat `initiative_speed` remains separate from every movement-rate field.

## 3. World clock and due-work order

- `world_time` is a non-negative integer count of world seconds. One world second equals one real
  second while the worker is healthy; CP-06 maps trusted server-time observations to integer recovery
  targets.
- The accepted B CP-06 extension stores one nullable `server_time_anchor_ms` only with a completed
  boundary and uses it only during explicitly enabled worker startup to derive a bounded recovery
  target. It never replaces `world_time`, drives healthy live progression, or accepts browser,
  WebMCP, or Agent time.
- Movement and visibility reconcile at 100 ms. Combat, extraction, death, respawn, and node timers
  settle on integer world-second boundaries. Fractional positions used between projections are
  process-local and never appear in persisted rows, event envelopes, Signal cooldowns, or snapshots.
- Browser presence, focus, or WebSocket connection never owns or pauses world time.
- On restart, the worker first replays an active `in_progress_world_time` boundary in full before it
  reports ready. It then advances from persisted completed `world_time` to the accepted integer
  recovery target. A forward gap of at most `MAX_RECOVERY_WORLD_SECONDS = 300` is processed in
  deterministic bounded batches; consequential events remain individually causal and replayable. A
  larger gap returns typed `RECOVERY_LIMIT_EXCEEDED`, preserves durable state and history, closes the
  world mutation gate, and never loops until caught up.
- A wall-clock anomaly that would move time backwards records a typed recovery warning and does not
  reverse committed state.

For the bounded CP-09 route, the server derives intermediate transit from the committed waypoints,
`start_world_time`, and the soldier movement rate. The dispatch stores one arrival due marker; the
movement phase commits `TRAVELLING` to `WORKING` with `MissionWorking` at or after that marker. The
verified CP-10 first-extraction boundary arms one successor marker two world seconds after arrival,
then atomically decrements one Wood/Rock node unit and creates provenance cargo. Each later due marker
increments the same equal-weight stack and advances from consumed due `D` to `D + 2`; capacity five or
node depletion clears both markers and hands the attempt to `RETURNING` in the same transaction. A
same-worker same-node tie is ordered by `(due, mission_attempt_id)`; an attempt that reloads a zero
  node receives the same `TARGET_DEPLETED` return handoff without a second node decrement. A node that
  was already empty before the boundary takes the same durable zero-cargo `TARGET_DEPLETED` return
  handoff; no
  per-waypoint event or client coordinate is authoritative. A `RETURNING` attempt derives the reverse
  of its immutable route from its persisted `home_anchor` and last transition time; at the due boundary
  exact arrival at that anchor changes the mission to `DEPOSITING` and emits routine `MissionHomeReached`
  without removing cargo or crediting coins. The same-worker contest, return-navigation/home-crossing,
  and deposit/coin settlement behaviors are runtime-verified locally under the bounded CP-10 task
  sequence.

At each integer boundary, apply due work in this order:

1. move actors and apply home-boundary crossings; a soldier that crosses home enters `DEPOSITING`;
2. commit valid deposits before the soldier can be treated as field cargo;
3. detect and lock new contacts using post-movement positions and entity revisions;
4. apply extraction only to soldiers still in `WORKING` and not locked in contact;
5. resolve one combat round for each locked encounter in deterministic initiative order;
6. apply existing combat-owned death, cargo loss or transfer, respawn, and repeatable mission reissue;
7. visit explicit settlement and timer phases (currently no-ops), then leave projection,
   `world_snapshot` persistence, `client_snapshot` delivery, and Agent Signal policy to their owning
   boundaries.

Migration, siege, breach, and other full-game boundaries are not G2 commands. When added later, they
must define their own ordering against this sequence and update the contract version.

## 4. Soldier lifecycle, roles, and missions

The soldier lifecycle and mission phase are separate fields:

```text
soldier.lifecycle: AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER
mission.phase: AT_SHELTER | TRAVELLING | WORKING | RETURNING | DEPOSITING | WAITING_REVIEW | TERMINAL
encounter.status: NONE | OBSERVED | CONTACT | LOCKED | RESOLVING | RESOLVED
```

G2 supports `GATHERER` and `HUNTER` roles. Guard and siege roles remain represented in the concept but
are not active commands in the slice. Dispatch stores role, tool, target, route, return policy,
expected revision, and `mission_attempt_id`. The role and loadout cannot change while the mission is
field-active. A HUNTER targets only the active seeded monster, requires tier-one `SWORD`, uses
`ON_RECALL`, and does not arm an extraction marker. The same seeded monster has at most one active
HUNTER reservation; the reservation remains through `RETURNING` and releases on mission completion.

Return policy is one of:

- `WHEN_FULL`: five cargo slots switches `WORKING` to `RETURNING`;
- `ON_TARGET_DEPLETED`: an empty node returns partial cargo;
- `ON_RECALL`: an accepted recall queues normal travel to the current home anchor.

Recall never teleports, changes role, clears cargo, bypasses combat, or creates coins. An unreachable
route enters `WAITING_REVIEW` with a typed reason rather than retrying forever. A passive encounter
attaches an `encounter_id` and status without introducing an `ENGAGING` mission phase. A terminal
mission remains in history with its cause and next valid command.

Ordinary monster death marks the current attempt `TERMINAL`, clears field cargo, respawns the same
`soldier_id` at its shelter immediately in world time, and applies the bounded reissue policy:

1. Each repeatable gathering or hunting mission chain starts with `monster_reissue_budget = 1`.
2. If the budget remains, consume it, record the integer `danger_cell` from the losing encounter, and
   create a new `mission_attempt_id` with the same role and target. The route planner makes one bounded
   replan that excludes the danger cell and every cell within one tile of it, using deterministic
   neighbour order.
3. If no safe route exists, or if the reissued attempt suffers another monster death before a
   successful deposit, the soldier remains at the shelter with `mission.phase = WAITING_REVIEW` and a
   typed reason (`NO_SAFE_REISSUE_ROUTE` or `REPEATED_MONSTER_DEATH`). No further automatic reissue
   follows.
4. A successful deposit or new manual dispatch resets the budget for the next mission chain.

A siege attempt, when implemented later, ends on death. Re-entry does not hold this transition or wait
for an Agent.

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

The first post-arrival extraction and schema-v4 cargo provenance are locally runtime-verified. The
recurring cadence/return increment extends the same equal-weight cargo stack by one unit per due marker,
enforces exact server-derived marker/event metadata, and atomically hands the mission to `RETURNING` at
five slots or node depletion. The selected same-worker contest outcome is recorded in
[`../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md)
and is runtime-verified in [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md), with cross-functional review in [`../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md). Return navigation and home crossing are runtime-verified under [`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md) and [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md); deposit and coin credit remain separate runtime boundaries. The current local claim is also bound to [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md).

The registered deposit boundary [`../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md) is runtime-verified under [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md) and [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md). It validates the complete active-attempt cargo aggregate, removes it, credits the owning shelter, emits ordered settlement events, and releases the resident mission/soldier atomically within the accepted design in [`../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md).

The selected settlement shape is `DEPOSITING -> AT_SHELTER` for the mission, `FIELD -> AT_SHELTER`
for the soldier, and a terminal completed attempt that retains its immutable history. The mission's
active attempt and assignment fields are cleared, and the completed resident row may be reused by a
later manual dispatch with a fresh attempt and incremented mission revision. `CargoDeposited` records
the complete validated pre-delete cargo list and coin delta; `CoinsCredited` follows only when the
delta is positive. These constraints are now runtime-verified only within the local process-runtime
claim bound in [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md).

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

Higher `initiative_speed` acts first. Equal initiative speed uses ascending `entity_id`. There are no random rolls, critical
hits, hidden party bonuses, or client-selected outcomes in G2.

| Actor/loadout | HP | Attack | Defense | initiative_speed | Tool power | Monster matchup |
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

The HUNTER terminal result uses `MONSTER_DEFEATED`, keeps the same soldier in `FIELD`, marks the
monster row `DEAD` for historical reads while removing it from active targeting, and moves the mission
to `RETURNING`. It emits no cargo, coin, death, respawn, or `CargoLostToMonster` effect. The existing
reverse route then reaches the home anchor, where an empty `CargoDeposited` with
`settlementReason = HUNTER_VICTORY` completes the attempt without `CoinsCredited`. This local boundary
is evidenced in [`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
and reviewed in [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md).

## 7. Event, revision, and persistence envelope

Every domain event contains:

```text
event_id
event_version
contract_version
event_type
world_id
world_event_cursor (monotonic within world; allocated atomically at commit)
world_time
causation_id
idempotency_key (when command-caused)
aggregate_type / aggregate_id / aggregate_revision
visibility_scope
typed_payload
```

The minimum event types for G2 are `PlayerMoved`, `MissionDispatched`, `MissionWorking`, `CargoExtracted`,
`MissionAutoReturned`, `MissionRecalled`, `ActorObserved`, `EncounterLocked`, `BattleRoundResolved`, `EncounterResolved`,
`MonsterDefeated`, `SoldierDied`, `CargoLostToMonster`, `SoldierRespawned`, `MissionReissued`,
`MissionHomeReached`, `CargoDeposited`, `CoinsCredited`, `ResourceDepleted`, `ResourceRespawned`, and
`ContinuationDelivered`.

One database transaction writes the authoritative state mutation, its Domain Event, and any eligible
delivery record. `world_snapshot` rows include `snapshot_version`, `contract_version`, `world_time`,
and entity revisions. Schema, `world_snapshot`, `client_snapshot`, and event versions are checked on
load; the current local persistence schema is version 8 (`cp06-004`). It migrates the CP-05 version 1
player shape, CP-08 version 2 mission shape, CP-09 version 3 due-work shape, CP-10 cargo provenance
shape, and CP-11 encounter/linkage shape transactionally, and adds the nullable
`world.in_progress_world_time` boundary marker plus nullable `world.server_time_anchor_ms` restart
observation. New cargo rows carry their soldier, mission attempt,
source node, acquisition time, quantity, and capacity usage; the active G2 extraction boundary
requires equal-weight `capacity_used = quantity`; legacy pre-v4 provenance may remain nullable. Other incompatible
versions enter a visible recovery state rather than being silently coerced.

### Domain Events and Agent Signals

A **Domain Event** is an authoritative state-changing record. Every committed transition retains its
event id, monotonic `world_event_cursor` scoped to its `world_id`, causal order, entity revision, and
typed payload in the durable event log. An **Agent Signal** is a derived delivery envelope and is never
game authority. It may summarize a `world_event_cursor` range of Domain Events for the bound shelter
and Agent context. The range is a page-read window and may contain routine events that are not counted
as eligible signal events.

The notification policy is:

- routine movement, world ticks, ordinary combat rounds, and repeated projection changes do not wake
  the Agent;
- an eligible actionable event creates or updates one coalesced signal;
- for each opaque continuation binding and shelter, at most one outgoing signal is pending or in
  flight; later events merge into its eligible event count, `world_event_cursor` range, event types,
  highest severity, latest event, and latest world time;
- after handoff to the Receiver, later events accumulate in the delivery slot's deferred cursor rather
  than creating a second outgoing signal; the deferred cursor is folded into the next signal only after
  the current delivery is acknowledged or terminally rejected;
- a retry reuses the same signal identity; the Local Connector never sends one Codex Thread message
  per Domain Event;
- while the Thread is running, the Connector holds the coalesced context and delivers it at the next
  safe turn boundary; and
- a critical transition that is enabled by the current product contract can raise the pending signal's
  severity but does not interrupt an active turn or create a duplicate wake-up. `ShelterBreached` is
  outside G2 eligibility.

The current G2 eligibility remains `CargoLostToMonster` only, with one continuation per shelter and
the accepted 60-world-second product cooldown. This delivery policy is transport backpressure, not a
gameplay delay. Outbox delivery is at-least-once; Domain Event and command effects remain exactly-once
by `event_id` and idempotency key. The cooldown gates creation of a new wake, not Domain Event
retention: an event may merge into an already pending or in-flight delivery slot, while an event inside
the cooldown with no active slot remains visible in history without creating a wake. Under the accepted
G2 policy, that cooldown-period event is deliberately history-only: it does not enter the active or
deferred Signal window and is not folded into a later Signal created after cooldown expiry. The Agent
must use the canonical page history when it needs the complete event sequence; a Signal count and
cursor range are a bounded notification summary, not a complete cooldown-period report.

`ContinuationDelivered` records acceptance of an Agent Signal delivery and its signal identity and
`world_event_cursor` range; it does not claim that the Agent has completed a command. A later command
still requires a fresh page read and live entity revisions.

An Agent Signal contains only an opaque binding, signal identity, causal `world_event_cursor` range,
eligible event count/types/severity, latest world time, relevant entity versions, and a bounded
continuation hint. It contains no prompt, credential, raw Agent context, or hidden map data. The Agent
must reread the canonical page and current state before acting.

## 8. Commands and page tools

Mutation commands use typed HTTP envelopes:

```text
command_id
command_type
contract_version
expected_entity_revisions
idempotency_key
typed_arguments
```

The authenticated transport context supplies `session_binding` separately from the exact command
JSON. In the local fixture HTTP adapter it is derived only from the recognized HttpOnly cookie; body
or query identity fields cannot select a world, player, shelter, or binding.

G2 mutation commands are `join_world`, `move_player`, `assign_soldier_mission`, `force_recall_soldier`,
and the server-owned fixture `reset_world`. Read tools are `inspect_shelter_state`,
`inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history`. The Re-entry path first reads current mission
history and the delivered event digest, then attempts `force_recall_soldier` under the accepted grant;
the server returns a typed result if the live revision no longer permits it. A late result is not a
silent no-op.

The implemented local-fixture `move_player` and `assign_soldier_mission` HTTP adapters, projection
reads, and explicit worker clock advances are serialized through the process-local
`WorkerCommandGateway`. This ordering seam does not create a durable queue; future recall, WebMCP,
or production adapters must preserve the same authority and revision rules. Both human adapters
return bounded results and reconcile visible state only through the existing full-snapshot ingress.

The accepted CP-12 continuous-intent adapter uses one-shot WebSocket frames only for start,
direction replacement, and stop. The frame is server-bound and carries no world/player/shelter/binding
or connection identity; the adapter supplies those values from the authenticated realtime context.
The command result carries metadata only. Worker cadence crossings and automatic full snapshots remain
the only movement effect and renderable position path.

An Agent-originated recall carries the delivered `signal_id` when available, the causal event id when
available, the target `soldier_id`, the expected current `mission_attempt_id`, and the expected entity
revisions. A mismatch between that context and the live mission returns `STALE_REENTRY_CONTEXT` and
cannot affect a later mission attempt. A human recall may omit the signal fields but still requires the
current entity revision and idempotency key.

Every authenticated, valid-envelope domain result includes `contract_version`, effect, the relevant
current revision or committed revision minima, event id when applicable, and a typed failure. Pre-authentication, framing,
readiness, admission, unknown-transport, and internal failures use bounded transport error responses
and do not invent domain effects. Minimum failure codes are `NOT_OWNER`, `STALE_REVISION`,
`DUPLICATE_COMMAND`, `MOVEMENT_BLOCKED`, `ROLE_LOCKED`, `NOT_AT_SHELTER`, `ALREADY_AT_SHELTER`, `STALE_REENTRY_CONTEXT`,
`TARGET_UNAVAILABLE`, `IN_COMBAT`, `WAITING_REVIEW`, `WEBMCP_UNAVAILABLE`, and
`RECOVERY_REQUIRED`.

## 9. Snapshot and visibility contract

A **`world_snapshot`** is the durable persistence row used to restart the authoritative worker. It
contains `world_snapshot_id`, `snapshot_version`, `contract_version`, `world_time`,
`last_world_event_cursor`, and entity revisions. The worker loads it and replays the event log.

A **`client_snapshot`** is the server-to-browser projection sent on connect or resync and then at about
10 Hz. Each client snapshot contains:

```text
client_snapshot_id
base_client_snapshot_id (optional)
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
the next full `client_snapshot` replaces local projection state before new commands are accepted. A
client snapshot is replaceable projection state and is never a persistence record.

## 10. G2 causal acceptance stories

### Gatherer loss and Re-entry

1. Player A dispatches a gatherer to the Rock route with `WHEN_FULL`.
2. The worker advances while the page is closed; the seeded monster contacts the gatherer after at
   least one extraction milestone.
3. The gatherer loses under the deterministic formula. One transaction destroys only field cargo,
   records `CargoLostToMonster`, respawns the same soldier, consumes the one monster reissue budget,
   records the danger cell, creates a new mission attempt, and reissues the repeatable mission along a
   bounded route that avoids that cell. A missing safe route or second monster death enters
   `WAITING_REVIEW` instead of looping.
4. The delivery policy creates one eligible coalesced Agent Signal without pausing the world. The
   Agent returns to the canonical page, rereads current mission history and revisions, and executes
   the accepted recall command when the live revision still permits it; an unavailable capability,
   stale command, or already-completed transition produces a visible typed result.
5. The dashboard shows route, cargo, combat, loss, respawn, reissue, continuation, and action result.

### Hunter contrast

The same seeded route with a hunter produces a five-round victory and no monster-kill cargo-loss
event. The history explains the role and tool difference using the same formula. The verified local
trace is [`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md);
browser, Agent, Re-entry, hosted continuity, and production identity claims remain separate gates.

### Disconnect and restart

The browser closes and the worker restarts after a known time gap. The recovered world advances due
work once, keeps the event and outbox identity, loads the latest `world_snapshot`, and sends a full
current `client_snapshot` on reconnect. No
browser timer or retry creates a second death, cargo settlement, respawn, coin, or continuation.

### Two-player landmark

Player B's shelter can appear as a discovered landmark after legal exploration. Active PvP attack
commands remain disabled in G2; hidden shelter state and undiscovered cells remain private.

## 11. Non-goals and versioning

The following are outside `SK-MVP-0.2`: active PvP field loot, siege and breach, migration veil,
Gold, tier yield multipliers, shelter upgrades, public authentication, seasons, leaderboard balance,
additional monster species, large population scaling, and mobile optimization.

Changing identity, event order, cargo settlement, Re-entry authority, or human boundary requires a new
contract version and an ADR update. Tuning combat numbers, node placement, or visual assets may remain
configuration changes when the causal contract and acceptance stories still hold.

## 12. CP-01 closure evidence

The coherent G2 contract is complete when this sheet, ADR-GAME-0009, ADR-GAME-0010, the Re-entry
mechanism and chain, the affected engineering and design documents, the issue/task records, and the
validation record agree; the owner decision is recorded; and the repository documentation gates pass.
Runtime and browser proof belong to CP-02 onward; this contract does not claim either.
