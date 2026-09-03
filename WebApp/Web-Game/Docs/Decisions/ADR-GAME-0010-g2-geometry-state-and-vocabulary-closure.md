# ADR-GAME-0010: G2 Geometry, State, and Vocabulary Closure

**Status:** ACCEPTED G2 CONTRACT COMPLETION; gameplay runtime implementation remains unverified  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Completes:** `SK-MVP-0.2` coherence closure after `ADR-GAME-0009`  
**Resolves:** B1-B4, D2, C1, and C2 in `Validation/05-pre-implementation-coherence-audit.md`

## Context

The pre-implementation coherence audit found that the accepted gameplay and Re-entry decisions were
conceptually sound but still left load-bearing movement values, sensing boundaries, mission states,
anti-loop behavior, protected-start semantics, event names, and snapshot names open or contradictory.
Starting durable code with those gaps would make the implementation choose rules silently.

This ADR completes the owner-accepted `SK-MVP-0.2` contract. It preserves the real-time coalesced
Re-entry delivery policy in `ADR-GAME-0009`, the authority and settlement rules in `ADR-GAME-0006`,
and the two-player G2 boundary. It does not add full-game PvP, siege, migration, breach recovery,
Gold, or production balance.

## Decision

### 1. Movement rates are explicit and separate from combat initiative

All rates below use logical tiles per real world second. Movement may advance fractional coordinates on
the 100 ms reconciliation step; arrival and combat milestones still settle on integer world seconds.

| Actor or mode | G2 field | Value | Purpose |
|---|---|---:|---|
| Player avatar | `player_move_speed_tiles_per_world_second` | 4.0 | WASD exploration and fog discovery |
| Soldier, every G2 role | `soldier_move_speed_tiles_per_world_second` | 3.0 | Mission travel and return |
| Seeded monster patrol | `monster_patrol_speed_tiles_per_world_second` | 2.0 | Deterministic patrol lane |
| Seeded monster chase | `monster_chase_speed_tiles_per_world_second` | 4.0 | Threat pursuit after detection |

`initiative_speed` remains a separate combat-only field. The G2 combat table keeps gatherer 3, hunter
5, and monster 4 for initiative; those values never become movement rates. Terrain, equipment weight,
formation, migration, and production role modifiers remain post-G2 tuning.

### 2. Sensing and contact boundaries use one distance rule

Distances use Euclidean center-to-center distance in logical tiles. Every boundary below is inclusive
(`distance <= radius`) unless a later contract explicitly changes it.

| Boundary | G2 value | Consumer and effect |
|---|---:|---|
| `engagement_radius_tiles` | 1.0 | Physical contact can lock an encounter |
| `soldier_sensor_radius_tiles` | 6.0 | A field soldier can observe nearby actors |
| `monster_detection_radius_tiles` | 5.0 | The seeded monster can choose a visible target |
| `shelter_resource_sensing_radius_tiles` | 24.0 | A shelter can sense nearby Wood and Rock nodes |
| `player_fog_reveal_radius_tiles` | 4.0 | The avatar reveals traversed nearby cells |
| `protected_start_radius_tiles` | 12.0 | Hostile monster contact is rejected during onboarding |

G2 soldier sensor radius is uniform across gatherer and hunter roles. A shelter's 24-tile sensing field
does not reveal enemy shelters or hidden map cells. The monster detection range is deliberately
separate from the soldier sensor range so the seeded encounter has readable asymmetry.

The fixture generator places Wood and Rock outside the protected circle: Player A uses Wood `(30,64)`
and Rock `(34,64)`; Player B uses the mirrored Wood `(98,64)` and Rock `(94,64)`. These are 14 and 18
tiles from their shelters. Generated start-zone nodes must remain in the inclusive 14–20 tile band;
the prior 12–20 band is retired for G2. The seeded monster lane and walkability checks must preserve
the accepted Rock-route encounter trace.

### 3. Mission phase and encounter state are separate

The contract's two-field model is authoritative:

```text
soldier.lifecycle: AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER
mission.phase: AT_SHELTER | TRAVELLING | WORKING | RETURNING | DEPOSITING | WAITING_REVIEW | TERMINAL
encounter.status: NONE | OBSERVED | CONTACT | LOCKED | RESOLVING | RESOLVED
```

Dispatch moves a resident soldier to `FIELD` and its new mission to `TRAVELLING` in one transaction;
there is no G2 `DEPLOYING` phase. A passive encounter attaches an `encounter_id` and status to the
mission while leaving the mission phase at its prior value. Extraction is allowed only for a soldier
whose phase is `WORKING` and whose encounter status is not locked or resolving. Combat settlement
emits `EncounterResolved` and then resumes, returns, or terminates the mission according to its target.

Death is represented by the soldier lifecycle and events. The failed mission attempt becomes
`TERMINAL`; `DEAD` and `RESPAWNING_AT_SHELTER` are not mission phases. The old labels `DEPLOYING`,
`ENGAGING`, `RESPAWNING_AT_SHELTER`, and `TERMINAL_FAILURE` are retired from the G2 contract. Siege
may define additional post-G2 phases under a later contract version.

### 4. Monster reissue has one bounded anti-loop budget

Each repeatable gathering or hunting mission chain starts with `monster_reissue_budget = 1`.

1. A monster-caused death settles and destroys only field cargo, marks the failed attempt `TERMINAL`,
   and respawns the same `soldier_id` at its shelter.
2. If the budget remains, the server consumes it, records the integer `danger_cell` from the losing
   encounter, and creates one new `mission_attempt_id` with the same role and target. The route planner
   must avoid the danger cell and every cell within one tile of it, using the deterministic neighbor
   order; it may make one bounded replan.
3. If no safe route exists, the soldier remains at the shelter with `mission.phase = WAITING_REVIEW`
   and a typed reason `NO_SAFE_REISSUE_ROUTE`.
4. If the reissued attempt suffers another monster death before a successful deposit, the budget is
   exhausted and the soldier remains at the shelter in `WAITING_REVIEW` with reason
   `REPEATED_MONSTER_DEATH`; no automatic reissue follows.
5. A successful shelter deposit or a new manual dispatch resets the budget for the next mission chain.
   A hunter victory that clears the seeded monster ends its mission normally.

This keeps immediate same-identity respawn and real travel cost while preventing an invisible death
loop. `force_recall_soldier` can still queue a normal return for a reissued field mission; a soldier
already at the shelter returns the typed result `ALREADY_AT_SHELTER`.

### 5. Protected start is a fixed onboarding shield

Each fixture shelter has `protected_start_until = start_world_time + 120` world seconds. While
`world_time < protected_start_until`, hostile monster contact at a distance less than or equal to 12
tiles from the shelter center is rejected. At exactly `world_time == protected_start_until`, the shield
has expired before contact detection for that boundary. The first dispatch does not shorten the timer;
a field soldier becomes exposed once it leaves the protected radius, while the shelter and resident
soldiers remain covered until expiry.

The shield does not pause world time, hide the shelter, protect a soldier outside the radius, or apply
to PvP or siege. It is visible in the dashboard with its expiry time and protects onboarding without
making the first mission risk-free. Nodes are placed at least 14 tiles away so the resource target is
never ambiguously inside the shield.

### 6. G2 event vocabulary and granularity are canonical

The G2 event names are:

```text
MissionDispatched, MissionWorking, CargoExtracted, MissionAutoReturned, MissionRecalled,
EncounterLocked, BattleRoundResolved, EncounterResolved, MonsterDefeated, SoldierDied,
CargoLostToMonster, SoldierRespawned, MissionReissued, MissionHomeReached, CargoDeposited, CoinsCredited,
ResourceDepleted, ResourceRespawned, ContinuationDelivered
```

`BattleRoundResolved` is emitted once per deterministic combat round. `EncounterResolved` is emitted
once for the terminal encounter result. `ActorObserved` is the observation event for visibility
chains. The older `SoldierEncountered` and `BattleResolved` names are retired from authoritative
handlers; `CargoLooted` is reserved for a post-G2 PvP transfer and is not emitted by the G2 monster
trace. `MissionHomeReached` is the additive CP-10 return-navigation event defined by
`ADR-GAME-0023`; it remains routine history and does not change the `SK-MVP-0.2` envelope or
Re-entry eligibility. No compatibility alias is required in G2.

### 7. Persistence and client projections use distinct snapshot terms

- A **`world_snapshot`** is the durable persistence row used to restart the authoritative worker. It
  carries `world_snapshot_id`, `snapshot_version`, `contract_version`, `world_time`,
  `last_world_event_cursor`, and entity revisions. The worker loads it and replays the event log.
- A **`client_snapshot`** is a server-to-browser projection sent on connect/resync and at about 10 Hz.
  It carries `client_snapshot_id`, optional `base_client_snapshot_id`, `contract_version`,
  `world_time`, `player_scope`, visible actors, explored cells, and permitted dashboard records. It
  never exposes hidden world state.

The page tool is named `inspect_client_snapshot`; a client snapshot is replaceable projection state,
not a persistence record. Bare `snapshot` in implementation contracts must be qualified as one of these
two terms.

## Consequences and verification

These defaults make the G2 trace reproducible, keep route economics computable, preserve a readable
onboarding shield, and prevent the mission schema from diverging between modules. They also make the
remaining implementation tests concrete: movement timing, boundary comparisons, route avoidance,
state transitions, event-handler names, world restart, and client resync can each assert one contract.

The values are fixture calibration, not production balance. Reopen this ADR if the seeded trace cannot
produce a reachable monster encounter and a safe alternate route, if the protected boundary creates an
unavoidable spawn kill, if any G2 consumer requires a retired event or snapshot name, or if the two
snapshot artifacts cannot be recovered and projected independently.

The static contract verification is recorded in
[`../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md).
