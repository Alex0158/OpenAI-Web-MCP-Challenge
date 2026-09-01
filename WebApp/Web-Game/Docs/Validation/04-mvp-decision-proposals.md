# MVP Decision Proposals

**Role:** Proposed decision pack for the first playable slice  
**Status:** `PROPOSED`; not promoted to accepted product truth  
**Date:** 2026-09-01  
**Scope:** Sleepless Kingdom game child only

## Purpose

This pack turns the roadmap gaps into concrete, reviewable defaults. It is the input to CP-01, the
versioned MVP contract sheet. A proposal becomes product truth only when the owner promotes it and
the owning mechanic, chain, scenario, current status, and decision record agree.

The goal is a small, deterministic world that feels alive while the page is closed. Every rule below
is judged by four tests:

1. the server can own and replay it;
2. the player can understand what happened and what can happen next;
3. a retry, reconnect, or crash cannot duplicate value or identity; and
4. the rule leaves room for the full PvP, siege, migration, and breach game later.

## Inputs and boundaries

The proposals reconcile the accepted MVP profile in
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

| Gap | Proposed default | Player-facing consequence | Verify at |
|---|---|---|---|
| G-MVP-01 Identity and session | Use two deterministic fixture players with opaque `player_id` values. Bind each page session, command, and WebMCP tool to its shelter owner. | The player always sees one shelter and cannot accidentally issue another player's command. | CP-01 / CP-02 |
| G-MVP-02 Coordinates and distance | Use integer logical tiles. Shelter starts are `(16,64)` and `(112,64)` on a 128 × 128 map; the accepted separation is Euclidean distance; the camera is 32 × 20 tiles. | The world is visibly larger than one screen and two players have meaningful travel space. | CP-01 / CP-07 |
| G-MVP-03 Protected start | A shelter and its 12-tile radius reject hostile monster contact until the owner's first field dispatch or 120 world seconds, whichever comes first. Show the protection state and expiry trigger. | A new player can read the map and issue a first mission without an invisible spawn kill. | CP-01 / CP-07 |
| G-MVP-04 Node placement and contention | Give each start zone one 20-unit Wood node and one 20-unit Rock node 12–20 tiles from its shelter. Do not reserve a node; the first committed extraction transaction wins a unit. | The player chooses between nearby lower and higher value work; contention is explainable rather than queue magic. | CP-01 / CP-10 |
| G-MVP-05 Downtime catch-up | Persist `world_time`. On restart, advance to the current server time; replay consequential milestones individually and collapse routine extraction/respawn/projection work into bounded batches. | Closing the page or restarting the worker never pauses the world or causes a burst of duplicate events. | CP-01 / CP-06 |
| G-MVP-06 Same-time ordering | At a world-second boundary: apply movement and home-boundary deposits; lock new contacts; apply extraction only to soldiers still eligible; resolve one combat round; settle death/respawn/reissue; then apply timers, projections, snapshots, and outbox delivery. | A soldier that has crossed home is banked before danger; every other simultaneous result has one visible order. | CP-01 / CP-06 / CP-15 |
| G-MVP-07 Monster re-engagement | Ordinary death keeps `soldier_id`, clears field cargo, creates a new `mission_attempt_id`, and reissues the repeatable mission. Try one route around the last danger cell; use `WAITING_REVIEW` if no safe route exists. | The soldier resumes its job without teleporting or being trapped in an invisible death loop. | CP-01 / CP-11 |
| G-MVP-08 Mission terminal states | Use `TRAVELING`, `WORKING`, `RETURNING`, `WAITING_REVIEW`, `RESIDENT`, and `TERMINAL`. Empty target returns partial cargo; recall queues return; siege is reserved to end on death. | Every mission row has a clear next state and reason instead of disappearing. | CP-01 / CP-09 |
| G-MVP-09 Cargo boundary | Capacity is five equal-weight slots. Wood and Rock occupy one slot each. Extraction stops at capacity; coins exist only after an atomic shelter deposit. | The dashboard can show exactly what is at risk and why a death removed it. | CP-01 / CP-10 |
| G-MVP-10 Snapshot and resync | Send a full authoritative snapshot on connect/resync, then sequenced snapshots around 10 Hz with `snapshot_id`, `world_time`, and entity revisions. Mutations use typed HTTP commands. | A dropped connection shows stale status and then cleanly replaces local state; it never invents progress. | CP-01 / CP-08 |
| G-MVP-11 Persistence versions | Version schema, snapshots, and events. Reject incompatible versions visibly; do not perform an unverified live migration during the judge run. | Recovery failure is explicit and diagnosable instead of silently corrupting a world. | CP-01 / CP-05 |
| G-MVP-12 Re-entry eligibility | In G2, only `CargoLostToMonster` can create a continuation. Allow one pending continuation per shelter and a 60-world-second cooldown; deduplicate by `event_id`. | One meaningful loss produces one useful return instead of notification spam from repeated deaths. | CP-01 / CP-14 |
| G-MVP-13 WebMCP fallback | The human dashboard remains complete when WebMCP is unavailable. Show the exact capability result and never simulate a successful tool call. | The game is still playable and the demo can honestly show the capability boundary. | CP-02 / CP-13 |
| G-MVP-14 Demo reset | Fix the seed, two fixture players, and one deterministic monster route. Provide a server-owned reset that creates a new world; no manual database editing is part of the run. | A judge can reproduce the story and distinguish a real event from a staged screenshot. | CP-02 / CP-16 |
| G-MVP-15 Command security | Use opaque session tokens, shelter ownership checks, expected entity revisions, idempotency keys, and server-side reward/cargo validation. | Refreshes, duplicate clicks, and malicious client values cannot create coins or hidden information. | CP-01 / CP-15 |
| G-MVP-16 Presentation boundary | Target desktop WASD first. Use a device-pixel-ratio-aware Canvas, React text equivalents, visible reconnect state, and a mobile-later note. | The map feels fluid while the dashboard remains readable and usable without Canvas or WebMCP. | CP-02 / CP-12 |
| G-MVP-17 Process topology | Use one modular Node process locally. Hosted mode uses a long-running worker and durable storage; no serverless request owns world time. | A sleeping page does not stop the world and a process restart has a defined recovery path. | CP-02 / CP-17 |
| G-MVP-18 Evidence and redaction | Capture redacted IDs, revisions, world times, capability results, restart steps, and browser evidence. Exclude secrets, credentials, and raw Agent context. | The player-facing story and the judge proof can be inspected without exposing private state. | CP-03 / CP-16 / CP-18 |
| G-MVP-19 Combat contract | Resolve one deterministic round per world second. `damage = max(1, attack + weapon_power + matchup_bonus - defense)`; higher speed acts first and ties use ascending entity id. No random rolls, critical hits, or hidden party bonus in G2. | A gatherer is visibly vulnerable while a hunter has a clear reason to be effective; the history can explain every hit. | CP-01 / CP-11 |
| G-MVP-20 Economy calibration | Use Wood = 1 coin and Rock = 3 coins, one unit every 2 seconds, five-slot capacity, 20-unit nodes, and 30-second respawn. Exclude Gold and tier yield multipliers from G2. | Travel time, extraction time, cargo risk, and deposit timing matter without adding crafting complexity. | CP-01 / CP-10 / CP-16 |

The first 18 rows came from the roadmap audit. G-MVP-19 and G-MVP-20 are added here because a
deterministic playable slice still needs an explicit combat and economy contract even when the values
remain tunable after the first trace.

## Proposed combat and economy profile

### Combat

Use the following deliberately readable values for the first trace:

| Actor | HP | Attack | Defense | Speed | Tool power | Matchup bonus |
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

For a node 12 tiles from the shelter and speed 3 tiles per world second, a no-interruption trip takes
about four seconds out, ten seconds to extract five units, and about four seconds home: 18 seconds
before any server or route overhead. The resulting gross rates are approximately 0.28 coins per
second for Wood and 0.83 coins per second for Rock. The player should see ETA, capacity, and known risk;
the UI should not pretend that gross rate is guaranteed profit.

Use this internal calibration model:

```text
gross_coin_rate = deposited_coin / (travel_out + extraction + travel_home)
risk_adjusted_rate = (success_probability × deposited_coin - expected_field_loss) / elapsed_world_time
```

The G2 acceptance target is not a perfect economy. It is that the player can understand why a nearby
Rock run may be worth more while a threatened Wood run may be safer, and that the monster event can
remove exposed cargo before deposit. Any later tuning must preserve the cargo-to-deposit boundary.

## Cross-mechanism chain contracts

### Dispatch to deposit

```text
RESIDENT
  -> dispatch(role, tool, target, route, expected_revision)
  -> TRAVELING
  -> WORKING
  -> cargo += extracted_unit  [until capacity or target depletion]
  -> RETURNING              [full pack, recall, or terminal work]
  -> home boundary crossed
  -> atomic deposit and coin projection
  -> RESIDENT
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
       append causal event and outbox row
       keep soldier_id, clear cargo
       create new mission_attempt_id
       respawn at shelter and reissue repeatable mission
  -> Re-entry delivery after eligibility/cooldown check
  -> Agent returns to canonical page
  -> fresh inspect_mission_history
  -> one bounded recall action or visible prepared result
```

The event payload carries an opaque binding, event id, world time, affected entity versions, and a
bounded causal summary. It carries no prompt, credential, hidden map cell, or stale command. The page
reads current state again before any action.

### Disconnect and recovery

```text
page closes or WebSocket drops
  -> world worker continues from authoritative clock
  -> due event commits to snapshot + event log + outbox in one transaction
  -> page reconnects
  -> full snapshot replaces local projection
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
  reissued mission attempt;
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

## Decisions that still need owner confirmation

The following are the only high-impact product choices I recommend reviewing before promotion:

1. whether the G2 Re-entry action may auto-execute `force_recall_soldier`, or must stop at a prepared
   action for human confirmation;
2. whether the 12-tile/120-second protected-start rule feels sufficiently safe without removing the
   first meaningful risk;
3. whether a gatherer losing and a hunter winning against the seeded monster creates the intended
   emotional contrast; and
4. whether the G2 page should show the other shelter as a discovered world landmark while keeping
   all active PvP attack commands disabled until the post-G2 slice.

Everything else in this pack is an engineering or verification default that can be changed through a
recorded CP-01 decision if the prototype produces contrary evidence.

## Promotion checklist

Before CP-01 closes, the owner and implementation record must:

1. mark each proposal `ACCEPTED`, `REVISED`, or `DEFERRED`;
2. assign one authority file to every accepted field;
3. update the affected mechanism detail, chain, scenario, and current status;
4. add state, event, idempotency, revision, and failure cases to the versioned contract; and
5. leave the full-game gaps explicitly outside the G2 non-goal boundary.

Until that checklist is complete, this file remains a proposal and the current game remains
documentation-only.
