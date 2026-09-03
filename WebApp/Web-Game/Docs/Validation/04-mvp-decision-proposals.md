# MVP Decision Proposals

**Role:** Decision pack for the first playable slice  
**Status:** OWNER-ACCEPTED MVP DEFAULTS; historical gameplay baseline `SK-MVP-0.1`, coherent G2 contract `SK-MVP-0.2`  
**Date:** 2026-09-01  
**Scope:** Sleepless Kingdom game child only

## Purpose

This pack turned the roadmap gaps into concrete, reviewable defaults. The owner has accepted the
defaults and they are now recorded in CP-01's versioned MVP contract sheet. The owning mechanic,
chain, scenario, current status, and decision record must still remain synchronized as implementation
evidence arrives.

The goal is a small, deterministic world that feels alive while the page is closed. Every rule below
is judged by four tests:

1. the server can own and replay it;
2. the player can understand what happened and what can happen next;
3. a retry, reconnect, or crash cannot duplicate value or identity; and
4. the rule leaves room for the full PvP, siege, migration, and breach game later.

## Inputs and boundaries

This pack reconciles the accepted MVP profile in
[`Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md), the
delivery sequence in [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md),
the mechanism and chain owners, and the external Starve.io presentation observations in
[`Research/01-starve-io-reference.md`](../Research/01-starve-io-reference.md). The Starve.io reference
supports a readable top-down Canvas, visible resources, compact HUD, and continuous-world pressure;
it does not establish our server, database, combat, or WebMCP implementation.

This pack deliberately does not accept production world scale, public authentication, Gold or other
resource tiers, PvP field loot, siege, migration, breach recovery, seasons, or leaderboard balance.
Those remain post-G2 work unless the owner explicitly changes the release boundary.

## Decision summary

| Gap | Accepted MVP default | Player-facing consequence | Verify at |
|---|---|---|---|
| G-MVP-01 Identity and session | Use two deterministic fixture players with opaque `player_id` values. Bind each page session, command, and WebMCP tool to its shelter owner. | The player always sees one shelter and cannot accidentally issue another player's command. | CP-01 / CP-02 |
| G-MVP-02 Coordinates and distance | Use integer logical tiles. Shelter starts are `(16,64)` and `(112,64)` on a 128 × 128 map; the accepted separation is Euclidean distance; the camera is 32 × 20 tiles. | The world is visibly larger than one screen and two players have meaningful travel space. | CP-01 / CP-07 |
| G-MVP-03 Protected start | A shelter and its inclusive 12-tile radius reject hostile monster contact until `start_world_time + 120` world seconds. First dispatch does not shorten the timer; equality is expired before contact detection. Show the protection state and expiry time. | A new player can read the map and issue a first mission without an invisible spawn kill while the onboarding shield remains legible. | CP-01 / CP-07 |
| G-MVP-04 Node placement and contention | Give each start zone one 20-unit Wood node and one 20-unit Rock node in the inclusive 14–20-tile band (fixture positions 14 and 18) from its shelter. Do not reserve a node; the first committed extraction transaction wins a unit. | The player chooses between nearby lower and higher value work; contention is explainable rather than queue magic, and no node overlaps the protected circle. | CP-01 / CP-10 |
| G-MVP-05 Downtime catch-up | Persist `world_time`. On restart, advance to the current server time; replay consequential milestones individually and collapse routine extraction/respawn/projection work into bounded batches. | Closing the page or restarting the worker never pauses the world or causes a burst of duplicate events. | CP-01 / CP-06 |
| G-MVP-06 Same-time ordering | At a world-second boundary: apply movement and home-boundary deposits; lock new contacts; apply extraction only to soldiers still eligible; resolve one combat round; settle death/respawn/reissue; then apply timers, projections, `world_snapshot` persistence, `client_snapshot` delivery, and outbox policy. | A soldier that has crossed home is banked before danger; every other simultaneous result has one visible order. | CP-01 / CP-06 / CP-15 |
| G-MVP-07 Monster re-engagement | Ordinary death keeps `soldier_id`, clears field cargo, consumes one reissue budget, records the last danger cell, and makes one deterministic route attempt excluding that cell and its one-tile neighbourhood. A missing safe route or second monster death enters typed `WAITING_REVIEW`. | The soldier can resume with real travel cost without teleporting or being trapped in an invisible death loop. | CP-01 / CP-11 |
| G-MVP-08 Mission terminal states | Keep `soldier.lifecycle`, `mission.phase`, and `encounter.status` separate. Use `TRAVELLING`, `WORKING`, `RETURNING`, `WAITING_REVIEW`, `AT_SHELTER`, and `TERMINAL` for mission phases; empty target returns partial cargo; recall queues return; siege is reserved to end on death. | Every mission row has a clear state, encounter status, and reason instead of disappearing. | CP-01 / CP-09 |
| G-MVP-09 Cargo boundary | Capacity is five equal-weight slots. Wood and Rock occupy one slot each. Extraction stops at capacity; coins exist only after an atomic shelter deposit. | The dashboard can show exactly what is at risk and why a death removed it. | CP-01 / CP-10 |
| G-MVP-10 Snapshot and resync | Send a full `client_snapshot` on connect/resync, then sequenced projections around 10 Hz with `client_snapshot_id`, optional `base_client_snapshot_id`, `world_time`, and entity revisions. Keep durable restart state in `world_snapshot`; mutations use typed HTTP commands. | A dropped connection shows stale status and then cleanly replaces local state; it never invents progress or overwrites persistence. | CP-01 / CP-08 |
| G-MVP-11 Persistence versions | Version schema, `world_snapshot`/`client_snapshot`, and events. Reject incompatible versions visibly; do not perform an unverified live migration during the judge run. | Recovery failure is explicit and diagnosable instead of silently corrupting a world. | CP-01 / CP-05 |
| G-MVP-12 Re-entry eligibility | In G2, only `CargoLostToMonster` can create a continuation. Retain every Domain Event, derive one coalesced Agent Signal per bound shelter/Thread, enforce one pending or in-flight signal, and keep the 60-world-second product cooldown without pausing the world. | One meaningful loss produces one useful return without notification spam or a gameplay hold. | CP-01 / CP-14 |
| G-MVP-13 WebMCP fallback | The human dashboard remains complete when WebMCP is unavailable. Show the exact capability result and never simulate a successful tool call. | The game is still playable and the demo can honestly show the capability boundary. | CP-02 / CP-13 |
| G-MVP-14 Demo reset | Fix the seed, two fixture players, and one deterministic monster route. Provide a server-owned reset that creates a new world; no manual database editing is part of the run. | A judge can reproduce the story and distinguish a real event from a staged screenshot. | CP-02 / CP-16 |
| G-MVP-15 Command security | Use opaque session tokens, shelter ownership checks, expected entity revisions, idempotency keys, and server-side reward/cargo validation. | Refreshes, duplicate clicks, and malicious client values cannot create coins or hidden information. | CP-01 / CP-15 |
| G-MVP-16 Presentation boundary | Target desktop WASD first. Use a device-pixel-ratio-aware Canvas, React text equivalents, visible reconnect state, and a mobile-later note. | The map feels fluid while the dashboard remains readable and usable without Canvas or WebMCP. | CP-02 / CP-12 |
| G-MVP-17 Process topology | Use one modular Node process locally. Hosted mode uses a long-running worker and durable storage; no serverless request owns world time. | A sleeping page does not stop the world and a process restart has a defined recovery path. | CP-02 / CP-17 |
| G-MVP-18 Evidence and redaction | Capture redacted IDs, revisions, world times, capability results, restart steps, and browser evidence. Exclude secrets, credentials, and raw Agent context. | The player-facing story and the judge proof can be inspected without exposing private state. | CP-03 / CP-16 / CP-18 |
| G-MVP-19 Combat contract | Resolve one deterministic round per world second. `damage = max(1, attack + weapon_power + matchup_bonus - defense)`; higher `initiative_speed` acts first and ties use ascending entity id. Movement rates are separate. No random rolls, critical hits, or hidden party bonus in G2. | A gatherer is visibly vulnerable while a hunter has a clear reason to be effective; the history can explain every hit. | CP-01 / CP-11 |
| G-MVP-20 Economy calibration | Use Wood = 1 coin and Rock = 3 coins, one unit every 2 seconds, five-slot capacity, 20-unit nodes, and 30-second respawn. Exclude Gold and tier yield multipliers from G2. | Travel time, extraction time, cargo risk, and deposit timing matter without adding crafting complexity. | CP-01 / CP-10 / CP-16 |

The first 18 rows came from the roadmap audit. G-MVP-19 and G-MVP-20 are added here because a
deterministic playable slice still needs an explicit combat and economy contract even when the values
remain tunable after the first trace.

## Owner review status

**As of 2026-09-02:** The owner accepted all twenty MVP defaults in this pack, including the
gatherer-versus-hunter combat contrast, the discovered-landmark presentation, and the bounded
Re-entry recall. The historical gameplay choices are recorded as `SK-MVP-0.1`; the owner then
accepted the real-time coalesced Agent Signal delivery policy and the G2 geometry, state, anti-loop,
protected-start, event, and `world_snapshot`/`client_snapshot` closure in `SK-MVP-0.2` through
[`ADR-GAME-0010`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md). Runtime
and browser evidence remain future gates.

## Accepted combat and economy profile

### Combat

Use the following deliberately readable values for the first trace:

| Actor | HP | Attack | Defense | `initiative_speed` | Tool power | Matchup bonus |
|---|---:|---:|---:|---:|---:|---:|
| Gatherer with pickaxe | 100 | 8 | 2 | 3 | 0 | 0 against the seeded monster |
| Hunter with sword | 100 | 12 | 3 | 5 | 4 | 4 against the seeded monster |
| Seeded monster | 80 | 12 | 2 | 4 | 0 | 0 |

Use one round per world second. A hunter deals 18 damage per round to the seeded monster and wins in
five rounds. The monster deals 9 damage per round to the hunter. A gatherer deals 6 damage per round
and receives 10 damage per round, so the seeded route can demonstrate cargo loss without introducing
randomness. These are demonstration values, not balance claims.

The combat record must include participants, role, tool, formula inputs, initiative order, round
number, damage, remaining HP, terminal cause, and the resulting settlement event. The client may
animate the round, but it cannot choose the result.

For the repeatable demo trace, place the seeded monster's patrol across the higher-value Rock route
after the gatherer has completed at least one extraction milestone. The Wood route remains the lower-
risk comparison. A hunter sent to the same route can win the encounter; a gatherer sent there exposes
its carried cargo. This creates a visible strategic choice without adding PvP or a second monster
species.

### Economy and time cost

For the fixed Wood and Rock nodes at 14 and 18 tiles from the shelter, and
`soldier_move_speed_tiles_per_world_second = 3.0`, a no-interruption Wood trip takes about 4.7 seconds
out, ten seconds to extract five units, and about 4.7 seconds home: about 19.3 seconds before server
or route overhead. The Rock route takes about 22 seconds before overhead. The resulting gross rates
are approximately 0.26 coins per second for Wood and 0.68 coins per second for Rock. The player should
see ETA, capacity, and known risk;
the UI should not pretend that gross rate is guaranteed profit.

Use this internal calibration model:

```text
gross_coin_rate = deposited_coin / (travel_out + extraction + travel_home)
risk_adjusted_rate = (success_probability × deposited_coin - expected_field_loss) / elapsed_world_time
```

The G2 acceptance target is not a perfect economy. It is that the player can understand why a nearby
Rock run may be worth more while a threatened Wood run may be safer, and that the monster event can
remove exposed cargo before deposit. A hunter victory clears the seeded threat and emits
`MonsterDefeated` without adding a third resource or direct coin reward. Any later tuning must
preserve the cargo-to-deposit boundary.

## Cross-mechanism chain contracts

### Dispatch to deposit

```text
AT_SHELTER
  -> dispatch(role, tool, target, route, expected_revision)
  -> TRAVELLING
  -> WORKING
  -> cargo += extracted_unit  [until capacity or target depletion]
  -> RETURNING              [full pack, recall, or terminal work]
  -> home boundary crossed
  -> atomic deposit and coin projection
  -> AT_SHELTER
```

The page shows the current phase, route, cargo, ETA, and return trigger. A forced recall changes the
mission intent to `RETURNING`; it never teleports the soldier or mints coins. A depleted node ends
work with partial cargo and uses the same return path.

### Monster loss to Re-entry

```text
field soldier observes monster
  -> contact lock by entity revision
  -> one deterministic combat round per world second
  -> soldier HP reaches zero
  -> one CargoLostToMonster transaction
       destroy field cargo only
       append causal Domain Event and create or update one Agent Signal delivery record
       keep soldier_id, clear cargo
       respawn at shelter
       consume one monster reissue budget
       plan one danger-cell-avoiding route
       create new mission_attempt_id and reissue repeatable mission, or enter typed WAITING_REVIEW
  -> coalesced Re-entry Signal delivery after eligibility/cooldown check
  -> Agent returns to canonical page
  -> fresh inspect_mission_history
  -> force_recall_soldier result when the current revision permits it
```

The event payload carries an opaque binding, event id, world time, affected entity versions, and a
bounded causal summary. It carries no prompt, credential, hidden map cell, or stale command. The page
reads current state again before any action.

### Disconnect and recovery

```text
page closes or WebSocket drops
  -> world worker continues from authoritative clock
  -> due event commits to world_snapshot + Domain Event log + eligible Agent Signal record in one transaction
  -> page reconnects
  -> full client_snapshot replaces local projection
  -> history explains elapsed events and current valid commands
```

The UI uses a clear `STALE / RECONNECTING / CURRENT` status. A reconnect never replays local input as
if it were authoritative; it resubmits only a new command with a current revision and idempotency key.

## UX acceptance checklist

The slice is not complete when the formulas work but the player cannot understand them. The following
must be visible:

- before dispatch: role, tool, destination, estimated travel, capacity, known risk, and automatic
  return rule;
- during a mission: phase, route, current cargo, world time, target, ETA, and last server revision;
- after a node depletes: the partial result and the reason for returning;
- after death: the monster, world time, cargo destroyed, same soldier identity, respawn location, and
  either the reissued mission attempt or the typed `WAITING_REVIEW` reason;
- after reconnect: elapsed world time, event count, current state, and any command that became stale;
- for a rejected command: a typed reason such as `NOT_OWNER`, `STALE_REVISION`, `ROLE_LOCKED`,
  `MIGRATING`, or `WAITING_REVIEW`;
- for WebMCP: supported/unsupported capability result, current revision, effect, and typed failure;
  and
- for every irreversible future action: a human review boundary rather than an implicit Agent commit.

The dashboard should prefer one causal event card over several disconnected notifications. A useful
death card reads as a chain: “Gatherer S-001 reached Node R-001, carried 2 Rock, was defeated by
Monster M-001 at world time 42, lost 2 Rock, respawned at Shelter P-001, and received mission attempt
003.” The exact visual copy can change; the causal fields cannot.

## Owner-confirmed product choices

The following choices were reviewed because they change the game feel or the competition thesis. The
terms are defined here so the contract is about behavior rather than vocabulary.

### Re-entry action

Re-entry is the Agent returning to the canonical game page after a backend event, not a soldier
returning to its shelter. The accepted G2 flow is:

```text
page closed
  -> monster kills a gatherer
  -> CargoLostToMonster is committed and delivered
  -> Agent returns to the game page
  -> Agent reads fresh mission history and current revisions
  -> Agent executes force_recall_soldier when the current revision permits it
```

`force_recall_soldier` is a bounded, server-validated command. It queues the soldier's normal return,
does not teleport it, does not change its role, and does not create coins. The accepted choice is to
let the Agent execute this one low-consequence recovery action under the existing user grant when the
live revision permits it; an unavailable capability, stale command, or already-completed transition
returns a visible typed result. The world never waits for the Agent. Domain Events remain durable,
while the Cloud Receiver and Local Connector receive at most one coalesced Agent Signal for a bound
shelter/Thread at a time. An Agent recall carries the delivered signal and mission context when
available, so a late command cannot target a later mission attempt. Migration, siege, destructive
upgrades, and irreversible recovery remain human-confirmed.

### Protected start

Protected start is an onboarding shield around the initial shelter. Under the accepted contract, hostile
monster contact is rejected at an inclusive distance of 12 logical tiles until
`start_world_time + 120` world seconds. First dispatch does not shorten the timer, and equality at the
expiry time is treated as unprotected before contact detection. The page shows the active shield and
expiry time. This is separate from migration's veil: it does not hide the shelter, protect a field
soldier outside the radius, or make the whole map safe. PvP attack commands are outside G2, so the
contract only defines the monster-start boundary at this stage.

1. The G2 Re-entry action may auto-execute `force_recall_soldier` under the existing user grant. It
   remains a normal server command; migration, siege, destructive upgrades, and irreversible recovery
   require human confirmation.
2. The protected-start rule uses 12 tiles and a fixed 120-world-second duration. It protects the
   shelter and resident soldiers until expiry, while a field soldier is exposed once it leaves the
   radius; it does not depend on first dispatch.
3. A gatherer losing and a hunter winning against the seeded monster is the accepted first-trace
   emotional and strategic contrast.
4. The G2 page may show the other shelter as a discovered world landmark while all active PvP attack
   commands remain disabled until the post-G2 slice.

Everything else in this pack is an engineering or verification default that can be changed through a
recorded contract revision if the prototype produces contrary evidence.

## Promotion checklist

For CP-01 and every later contract revision, the implementation record must:

1. retain the owner decision as `ACCEPTED`, or record a named `REVISED` or `DEFERRED` decision;
2. assign one authority file to every accepted field;
3. update the affected mechanism detail, chain, scenario, and current status;
4. add state, event, idempotency, revision, and failure cases to the versioned contract; and
5. leave the full-game gaps explicitly outside the G2 non-goal boundary.

The defaults are accepted. `ADR-GAME-0010` promotes the G2 geometry, state, anti-loop, protected-start,
event, and `world_snapshot`/`client_snapshot` decisions into `SK-MVP-0.2`; the current game remains documentation-only until
CP-04 and the later implementation checkpoints provide runtime evidence; CP-03 only locks the route.
