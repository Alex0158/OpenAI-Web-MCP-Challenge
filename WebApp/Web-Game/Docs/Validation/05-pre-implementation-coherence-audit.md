# Pre-Implementation Coherence Audit

**Role:** Validation record produced by a cross-document logic and chain review  
**Status:** VERIFIED audit; all B1-B4, D1, D2, C1, and C2 findings are resolved for `SK-MVP-0.2`; gameplay runtime implementation remains unverified  
**Date:** 2026-09-02  
**Scope:** Sleepless Kingdom game application only  
**Audience:** Reviewer asked to answer, refine, and optimize the findings below

## 1. Purpose and how to use this document

This audit asks one question: **are the current documents at an engineering-grade planning standard,
such that durable implementation can start without inventing rules in code?**

It reviews the logic, the causal chains, the ordering, and the design for contradictions, for values
that are load-bearing but undefined, and for problems not already recorded elsewhere.

The B1-B4, D2, C1, and C2 evidence below describes the historical `SK-MVP-0.1` gameplay baseline
reviewed before the owner accepted the `SK-MVP-0.2` revisions. D1 was resolved by `ADR-GAME-0009`;
the remaining findings are now resolved by `ADR-GAME-0010` and the reconciled owning documents.

This document is a finding record. It is not a new authority. It cannot change a rule. Every
resolution belongs to the owning module document plus, where the finding touches identity, event
order, cargo settlement, Re-entry authority, or the human boundary, a new contract version and an
updated `ADR-GAME-*` as required by
[`ADR-GAME-0006`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md).

A reviewer working from this document should, for each finding, confirm the historical evidence and
the accepted `SK-MVP-0.2` disposition. Section 9 records the closure questions and answers.

## 2. Verdict

| Gate | Ready | Reason |
|---|---|---|
| CP-02 capability and runtime probe | **Yes** | The probe exercises the Node worker, Canvas, realtime channel, SQLite WAL, and page-bound WebMCP registration. No finding in this audit affects it. It can start immediately. |
| CP-03 implementation task lock | **Yes** | B1 through B4, D2, C1, and C2 are closed by `ADR-GAME-0010`; `SK-TASK-003` now locks the G1/G2 implementation boundary and its static evidence is recorded in `SK-EVID-005`. |
| CP-04 and later durable code | **No** | CP-04 still requires its process-skeleton implementation and runtime evidence; this audit closes planning coherence only. |

The concept is coherent. The authority, settlement, and idempotency model is unusually disciplined
and is assessed as sound in section 7. The historical gaps were load-bearing numbers that had not
reached the normative document, two documents that disagreed about one state machine, an accepted
decision that had failed to land, and one timing assumption on the critical demo path. The current
`SK-MVP-0.2` contract records their dispositions; runtime behavior remains unverified.

## 3. Method and evidence base

Every checkpoint on the critical path was traced through its owning atomic mechanism, its
cross-mechanism chain, and the normative contract, looking for an input, an authoritative state
transition, a persistence boundary, an observable result, and a failure path.

Documents read in full for this audit: the contract sheet, the delivery roadmap, the build gate, the
mechanism inventory, chains C01 through C11, `detail-08`, `detail-12`, `detail-13`, `detail-19`,
`Engineering/03`, `Engineering/05`, `Scenarios/05`, and the three existing validation records.
Targeted searches were run across the whole `Docs/` tree for movement rates, radii, event names, and
timing values.

Findings already recorded in [`03-roadmap-gap-audit.md`](03-roadmap-gap-audit.md) as `OPEN`, and the
non-goals listed in contract section 11, are excluded by design. Section 8 states that boundary.

## 4. Historical blocking findings (all closed in `SK-MVP-0.2`)

### B1 — Movement speed is load-bearing but absent from the normative contract

**Finding.** Soldier travel speed exists nowhere in
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md). It appears only
in two non-normative documents.

**Evidence.**

- The historical `Engineering/07-hackathon-mvp-build-gate.md` proposal — "a soldier travel speed of
  3 tiles per world second" — without promoting it into the contract.
- The historical `04-mvp-decision-proposals.md` record — "For a node 12 tiles from the shelter and
  speed 3 tiles per world second".
- The historical contract sheet's only use of `speed` — "Higher `speed` acts first" — was combat
  initiative, not a movement rate.

**Why it blocks.** Contract section 5 defines
`gross_coin_rate = deposited_coin / (travel_out + extraction + travel_home)`, and contract section 3
schedules travel milestones. Both are uncomputable without a movement rate. The demo choreography in
contract section 10 depends on the gatherer meeting the monster at a specific point in the trip.

**Two further problems inside this one.**

1. **The term `speed` is overloaded.** The historical contract's combat table assigns `speed` values
   of 3 to the gatherer, 5 to the hunter, and 4 to the seeded monster, used only for
   initiative order. The travel rate is a separate concept that happens to be 3 for all soldiers. The
   values overlap, so an implementer is likely to treat the combat column as a movement rate and give
   the hunter 5 tiles per world second.
2. **Monster movement speed is undefined entirely.** `detail-12` gives the monster a `speed` attribute
   and a `CHASE` state but no rate. This single number decides whether a loaded gatherer can ever
   escape toward home. If the monster is faster than 3, contact is always fatal and the risk economy
   offers no real choice. If it is slower, escape always succeeds and the monster is not a threat.

**Historical decision question.** One movement rate per actor class, expressed in logical tiles per world second,
in the normative contract; whether movement rate is uniform across roles or derived per role; the
monster's movement rate and whether `CHASE` uses a different rate from `PATROL`; and a distinct field
name so that movement is never confused with combat initiative.

**Owning documents.** Contract sections 2, 3, 5, and 6;
[`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md);
[`../Mechanics/detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md).

**Resolution in `SK-MVP-0.2`.** `ADR-GAME-0010` fixes movement fields and values: player
`4.0`, every G2 soldier `3.0`, seeded-monster patrol `2.0`, and chase `4.0` logical tiles per world
second. Fractional positions reconcile every 100 ms; integer milestones remain authoritative. The
combat-only field is `initiative_speed` (gatherer 3, hunter 5, monster 4), so movement and initiative
cannot be conflated. The contract, navigation, monster, build-gate, and decision documents now agree.

### B2 — Three radii are load-bearing but have no value anywhere in the tree

**Finding.** `engagement radius`, `sensor radius`, and `detection radius` are referenced as
authoritative concepts across at least eight documents. No numeric value for any of them exists in
the application.

**Evidence.**

| Concept | Depends on it | Value |
|---|---|---|
| `engagement radius` | Historical contract section 3 contact locking; the historical `detail-13` transition `UNSEEN → OBSERVED → CONTACT → LOCKED`; `Chains/03`; and `detail-12` targeting | None |
| `sensor radius` | `detail-13:20` "Each field soldier has a sensor radius"; `Chains/03:13`; `Mechanics/05-detection-pathfinding-and-encounters.md:14` | None |
| `detection radius` | Shelter resource sensing in `World/00:34`, `Blueprint/00:63`, `Scenarios/01:10`, `Design/02:13` | None |

The historical `detail-04`, `detail-10`, and `Design/02-map-fog-and-exploration.md` records contained
no numeric tile or cell value. The historical contract's only distance values were the 12-tile
protected-start radius and the 12 to 20 tile node placement band.

**Why it blocks.** CP-08 cannot implement fog reveal or soldier sensing, and CP-11 cannot implement
the sensor-to-contact lock, without these three numbers. They also determine whether the seeded demo
trace is reproducible: the point at which the monster detects the gatherer sets where the encounter
occurs.

**Historical decision question.** A numeric engagement radius; a numeric soldier sensor radius, and whether it
varies by role in G2 or is uniform; a numeric shelter detection radius; the player fog reveal radius;
and whether the monster's detection range is a separate value from the soldier sensor radius.

**Owning documents.** Contract section 2 and a new sensing subsection;
[`../Mechanics/detail-04-shelter-sensing.md`](../Mechanics/detail-04-shelter-sensing.md);
[`../Mechanics/detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md);
[`../Mechanics/detail-13-encounter-and-combat-resolution.md`](../Mechanics/detail-13-encounter-and-combat-resolution.md).

**Resolution in `SK-MVP-0.2`.** `ADR-GAME-0010` fixes inclusive Euclidean center-to-center
boundaries: engagement `1.0`, soldier sensor `6.0`, monster detection `5.0`, shelter resource
sensing `24.0`, player fog reveal `4.0`, and protected start `12.0` logical tiles. Soldier sensing
is uniform for G2 gatherers and hunters; monster detection is intentionally separate. The contract,
sensing, fog, encounter, and family documents now use the same named fields and comparison rule.

### B3 — Two documents define different mission state machines and both claim ownership

**Finding.** `detail-08` and the contract sheet specify incompatible mission state models.

**Evidence.**

The historical version of `../Mechanics/detail-08-mission-dispatch-return-and-recall.md` declared
"This file owns the mission state machine and command transitions." Its historical machine was:

```text
AT_SHELTER → DEPLOYING → TRAVELLING → WORKING → RETURNING → DEPOSITING → AT_SHELTER
                         ↘ ENGAGING ↗
                         ↘ DEAD → RESPAWNING_AT_SHELTER
                         ↘ TERMINAL_FAILURE
```

The historical `SK-MVP-0.1` contract specified:

```text
soldier.lifecycle: AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER
mission.phase: AT_SHELTER | TRAVELLING | WORKING | RETURNING | DEPOSITING | WAITING_REVIEW | TERMINAL
```

`DEPLOYING`, `ENGAGING`, `RESPAWNING_AT_SHELTER`, and `TERMINAL_FAILURE` existed only in the
historical `detail-08`; `WAITING_REVIEW` existed only in the historical contract.

**Why it blocks.** This is a modelling divergence, not a naming difference. The contract keeps combat
participation outside `mission.phase` and expresses it as a separate condition at contract section 3
step 4, "apply extraction only to soldiers still in `WORKING` and not locked in contact". `detail-08`
models the same fact as an `ENGAGING` phase. Those produce different schemas, different snapshot
fields, and different dashboard rows. The contract also separates `soldier.lifecycle` from
`mission.phase`, a two-field model `detail-08` does not have.

**Historical decision question.** One state model, one owner, and whether encounter participation is a mission
phase or a separate locked-contact flag. If the contract's two-field model wins, `detail-08` must be
rewritten and its authority line corrected.

**Owning documents.** `detail-08`; contract section 4; every chain that names a phase.

**Resolution in `SK-MVP-0.2`.** The contract's two-field model is authoritative and now has a third,
separate `encounter.status` field. `detail-08`, the soldier family, lifecycle detail, encounter
mechanism, visual asset spec, and affected chains all use `AT_SHELTER | TRAVELLING | WORKING |
RETURNING | DEPOSITING | WAITING_REVIEW | TERMINAL` for `mission.phase`,
`AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER` for `soldier.lifecycle`, and
`NONE | OBSERVED | CONTACT | LOCKED | RESOLVING | RESOLVED` for `encounter.status`. `DEPLOYING`,
`ENGAGING`, `RESPAWNING_AT_SHELTER`, and `TERMINAL_FAILURE` are retired from G2; death/respawn remain
events and lifecycle transitions.

### B4 — An accepted anti-loop rule never reached the contract, and a VERIFIED record claims it did

**Finding.** Owner-accepted decision G-MVP-07 is absent from the normative contract, while two
validation records state that all twenty accepted defaults are recorded in `SK-MVP-0.1`.

**Evidence.**

- The historical `04-mvp-decision-proposals.md` record accepts G-MVP-07: "Try one route around the
  last danger cell; use `WAITING_REVIEW` if no safe route exists", justified as "The soldier resumes
  its job without teleporting or being trapped in an invisible death loop."
- The historical `03-roadmap-gap-audit.md` record states that the pack and all twenty defaults are
  captured by the `SK-MVP-0.1` contract, while carrying a `VERIFIED` status label.
- The historical contract's actual reissue rule reads: "Ordinary monster death marks the current
  attempt failed, clears field cargo, respawns the same `soldier_id` at its shelter immediately in
  world time, creates a new `mission_attempt_id`, and reissues the repeatable gathering or hunting
  assignment." It contains no danger-cell avoidance and no anti-loop condition.
- The historical contract's only `WAITING_REVIEW` trigger is an unreachable route with a typed reason;
  that is a pathfinding failure, a different condition from repeated death on a reachable route.

**Why it blocks.** Implemented literally, the contract produces the exact death loop G-MVP-07 was
accepted to prevent. It also compounds D1 below. Separately, a validation record labelled `VERIFIED`
currently makes a claim about the contract that the contract does not support, which weakens every
other claim those records make.

**Historical decision question.** Whether to add G-MVP-07 to the contract as accepted, or to supersede it with a
different anti-loop rule; and a correction to `03-roadmap-gap-audit.md` so that its coverage claim
matches the contract. A verification pass over the other nineteen defaults is recommended, since one
already failed to land.

**Owning documents.** Contract section 4; `03-roadmap-gap-audit.md`; `detail-08`;
[`../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../Mechanics/Chains/07-death-to-respawn-or-corruption.md).

**Resolution in `SK-MVP-0.2`.** G-MVP-07 is adopted with one `monster_reissue_budget` per repeatable
gather/hunt mission chain. After a monster death, the same soldier respawns, the failed attempt is
terminal, and one fresh attempt may avoid the recorded integer `danger_cell` plus its one-tile
neighbourhood. No safe route yields `WAITING_REVIEW / NO_SAFE_REISSUE_ROUTE`; a second monster death
before successful deposit yields `WAITING_REVIEW / REPEATED_MONSTER_DEATH`. A successful deposit or
new manual dispatch resets the budget. The contract, roadmap audit, mission detail, death chain, and
dashboard expectations now agree.

## 5. Historical design tensions and accepted dispositions

### D1 — The Re-entry action has no demonstrated time window, on the CP-14 competition gate

**Disposition:** Resolved as a delivery-policy decision on 2026-09-02. The owner rejected a fixed
gameplay waiting window and accepted real-time coalesced Agent Signal delivery. The world continues
through respawn and mission reissue; a late action is allowed to fail with a typed live-state result.
The delivery policy is recorded in [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
and `SK-MVP-0.2`.

**Finding.** The accepted rules, composed, leave no reliable interval during which
`force_recall_soldier` is a meaningful action. This is the demonstration the application exists to
produce.

**Evidence, composed from accepted rules.**

1. The historical `SK-MVP-0.1` mission contract — ordinary monster death respawns the same soldier at
   the shelter immediately in world time **and reissues the repeatable mission**. The soldier begins
   travelling out again at once.
2. The historical monster detail — the killing monster "remains in the normal monster state machine
   after the attack and is not removed by this cargo-loss rule". The threat is still alive, on the same
   lane.
3. The historical contract placed the seeded monster patrol across the Rock route and nodes 12 to 20
   tiles from the shelter. At the historical B1 travel rate of 3 tiles per world second, the reissued
   soldier re-entered the monster's lane roughly four world seconds after respawning.
4. `ADR-GAME-0006` and contract section 7 allow one pending continuation per shelter with a
   60-world-second cooldown and `event_id` deduplication. The second death therefore emits no second
   continuation.

Against that, the Agent side must complete Receiver acceptance, adapter activation of the private
context, canonical page load, a full state reread, and tool invocation.
[`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md),
[`../Mechanics/detail-19-reentry-event-hook.md`](../Mechanics/detail-19-reentry-event-hook.md),
[`../Scenarios/05-reentry-agent-loop.md`](../Scenarios/05-reentry-agent-loop.md), and the contract
contain **no latency bound, budget, or assumption** for that path.

**Consequence.** When the Agent invokes `force_recall_soldier`, the soldier is most likely dead
again, or respawned and standing at the shelter, or, had B4's rule landed, already stopped in
`WAITING_REVIEW`. In all three states the recall is a no-op or a typed failure. Contract section 8
lists `NOT_AT_SHELTER`, `IN_COMBAT`, and `WAITING_REVIEW` among the failure codes, but does not say
which applies to a recall issued against a soldier that is already home.

**The tension is two-sided.** Adding B4's anti-loop rule makes the game self-correct, which removes
the Agent's reason to act. Omitting it produces a death loop the Agent cannot reach in time.
`ADR-GAME-0006` explicitly rejected prepare-only Re-entry in order to prove "that an event can cause
useful bounded work"; the current composition makes that work unlikely to be reachable.

**Options and disposition.**

| Option | Effect | Cost |
|---|---|---|
| Real-time coalesced delivery **(accepted)** | Keep immediate respawn/reissue, retain every Domain Event, aggregate Agent Signals, and reject late actions explicitly | Requires a delivery-policy revision and burst/backpressure tests; no gameplay hold |
| Reissue with a hold: the respawned soldier waits at the shelter in a review state until a human or the Agent acts | Recall, or a resume command, becomes genuinely meaningful and the causal story is legible | Contradicts "reissues the repeatable mission"; requires a contract revision and a new phase |
| Change the bounded action to one that is still meaningful with the soldier at home, such as retarget, reroute, or set return policy | Preserves an executed, consequential Agent action | `force_recall_soldier` is no longer the accepted action; requires an `ADR-GAME-0006` revision |
| Lengthen the loop: longer route, slower world seconds, or a monster cooldown after a kill | Cheapest; pure configuration | Depends on B1 being fixed first; must be shown to produce a reliable window, not an accidental one |
| Accept prepare-only Re-entry | Removes the timing problem entirely | Explicitly rejected by `ADR-GAME-0006`; weakens the competition thesis |

**Resolution.** This `Assured` decision is recorded in
[`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
and `SK-MVP-0.2`. The world stays real-time, Domain Events remain durable, and one coalesced Agent
Signal is allowed per bound shelter and Thread while pending or in flight. The Local Connector holds
merged context until a safe Thread turn boundary. No fixed gameplay window or Agent wait is introduced.
The static delivery-policy evidence is recorded in
[`../Evidence/SK-EVID-002-reentry-delivery-policy-contract-verification.md`](../Evidence/SK-EVID-002-reentry-delivery-policy-contract-verification.md).

### D2 — The protected start did almost no work in the historical G2 trace

**Finding (closed).** The historical rule ended at first dispatch and overlapped the old 12–20 node
band, so its boundary and player-facing purpose were unclear.

**Evidence.** The `SK-MVP-0.1` contract ended protection at the owner's first field dispatch or 120
world seconds, whichever came first, and placed nodes as close as 12 tiles. This made a dispatch end
the timer immediately and left exact-12 membership undefined.

**Resolution in `SK-MVP-0.2`.** `ADR-GAME-0010` fixes a 120-world-second shield from
`start_world_time`, independent of dispatch. Hostile monster contact at inclusive distance `<= 12`
tiles from the shelter is rejected while `world_time < protected_start_until`; equality is expired
before contact detection. The shelter and resident soldiers remain covered until expiry, while a
field soldier is exposed once outside the radius. Fixture nodes are at `(30,64)` and `(34,64)` for
Player A, mirrored for Player B, and all start-zone nodes remain in the inclusive 14–20-tile band.
The dashboard exposes the active shield and expiry time. This preserves onboarding without making the
first mission risk-free.

## 6. Historical consistency defects and accepted dispositions

### C1 — Event vocabulary has split between the contract and three documents

**Finding (closed).** The historical `SK-MVP-0.1` names were semantically ambiguous: a round event and
a terminal battle event were being treated as synonyms.

**Resolution in `SK-MVP-0.2`.** `ADR-GAME-0010` makes `EncounterLocked` the contact-lock event,
`BattleRoundResolved` the per-round event, and `EncounterResolved` the one-per-terminal-encounter
event. `ActorObserved` covers visibility observation. `CargoLooted` is reserved for post-G2 PvP and
`CargoLostToMonster` covers the G2 monster settlement. `SoldierEncountered` and `BattleResolved` are
retired from authoritative handlers, with no G2 compatibility alias. The API, encounter chain,
Re-entry mechanism, contract, and death chain now use the same names and granularity.

### C2 — The word "snapshot" carried two unrelated meanings

**Finding (closed).** The historical documents used one noun for a durable restart artifact and a
player-scoped network projection with different cadence and lifetime.

**Resolution in `SK-MVP-0.2`.** The durable restart row is `world_snapshot` and carries
`world_snapshot_id`, `snapshot_version`, `contract_version`, `world_time`,
`last_world_event_cursor`, and entity revisions. The server-to-browser projection is `client_snapshot`
and carries `client_snapshot_id`, optional `base_client_snapshot_id`, `contract_version`,
`world_time`, `player_scope`, visible actors, explored cells, and permitted dashboard records. The
client projection is sent on connect/resync and about 10 Hz; it cannot replace persistence. The page
tool is `inspect_client_snapshot`. The contract, persistence engineering, tick chain, API, and
current-status documents now qualify every use.

## 7. Assessed as sound — do not change without new evidence

This audit found the following to be correct and well reasoned. They should be preserved through any
revision that answers the findings above.

1. **The authority and settlement invariants.** No coin exists before deposit; one database
   transaction writes the state mutation, the event log entry, and the eligible outbox row;
   at-least-once delivery with exactly-once domain effect keyed by `event_id` and idempotency key; a
   participant is claimed by at most one resolving encounter; the client cannot submit authoritative
   player, shelter, cargo, coin, position, or hidden-cell values. This is the hard part of the design
   and it is right.
2. **The due-work phase order in contract section 3.** Applying movement first, then committing
   home-boundary deposits, then locking contacts, then extracting only uncontested `WORKING`
   soldiers, then resolving combat, resolves the deposit-versus-death race that the edge-case table in
   `03-roadmap-gap-audit.md` identifies. The ordering is stated with a readable reason rather than
   asserted.
3. **The identity split.** A stable `soldier_id` across ordinary respawn with a new
   `mission_attempt_id` per sortie is the correct model for a causal dashboard, and it is applied
   consistently across the contract, `detail-06`, `detail-08`, and C07.
4. **Deterministic combat with no random rolls in G2.** This makes restart replay and the reviewer
   narrative checkable. The readability gained is worth the content lost.
5. **The claim discipline throughout.** Status labels, explicit non-claims, and the rule that a
   described feature is never implementation evidence are applied consistently.

## 8. Explicitly out of scope for this audit

The following are already recorded and are not re-reported as findings:

- the eight full-game gates `G-FULL-01` through `G-FULL-08` in `03-roadmap-gap-audit.md`;
- the non-goals listed in contract section 11, including PvP field loot, siege, breach, migration
  veil, Gold, tier multipliers, shelter upgrades, public authentication, seasons, leaderboard balance,
  additional monster species, population scaling, and mobile optimization;
- production balance values, spawn rates, prices, and final visual assets, which
  `ADR-GAME-0006` deliberately keeps as tunable configuration; and
- the open decisions each mechanism and chain document already lists under its own `Open decisions`
  heading, except where this audit shows the item is load-bearing for G2 rather than post-G2.

The distinction applied throughout: an item is a finding here only if G2 cannot be implemented or
demonstrated without resolving it, or if two current documents contradict each other.

## 9. Closure questions and accepted answers

| Finding | Accepted answer in `SK-MVP-0.2` |
|---|---|
| B1 | Player movement is `4.0`, every G2 soldier is `3.0`, monster patrol is `2.0`, and monster chase is `4.0` logical tiles per world second. `initiative_speed` is a separate combat-only field. |
| B2 | Inclusive Euclidean center distance uses engagement `1.0`, soldier sensor `6.0`, monster detection `5.0`, shelter resource sensing `24.0`, player fog reveal `4.0`, and protected start `12.0` tiles. |
| B3 | `soldier.lifecycle`, `mission.phase`, and `encounter.status` are separate fields. Encounter participation is never an `ENGAGING` mission phase. |
| B4 | G-MVP-07 is adopted with one danger-cell-avoiding reissue budget. No safe route or a second monster death enters typed `WAITING_REVIEW`; successful deposit/manual dispatch resets the budget. |
| D1 | `ADR-GAME-0009` accepts real-time coalesced Agent Signals with one pending/in-flight gate per shelter and Thread. A late command rereads live state and returns a typed result such as `STALE_REENTRY_CONTEXT` or `ALREADY_AT_SHELTER`. |
| D2 | The inclusive 12-tile shield lasts from `start_world_time` to `+120` world seconds, independent of first dispatch; equality is expired before contact detection, and nodes start in the 14–20-tile band. |
| C1 | `EncounterLocked`, per-round `BattleRoundResolved`, and terminal `EncounterResolved` are canonical. `SoldierEncountered` and `BattleResolved` are retired; `CargoLooted` is post-G2 PvP only. |
| C2 | Durable restart state is `world_snapshot`; the player-scoped network projection is `client_snapshot`. |
| General | No additional G2 load-bearing value or ordering contradiction was found in the final static cross-reference. Runtime behavior, hosted latency, and external Agent discovery remain unverified and are tracked separately. |

## 10. Closure disposition

1. CP-02 is verified locally and remains unaffected by this audit.
2. B1 through B4 and D2 are resolved in the `SK-MVP-0.2` contract and
   [`ADR-GAME-0010`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md).
3. D1 remains resolved by
   [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md); no
   gameplay wait is introduced.
4. C1 and C2 are reconciled in the contract and affected API, mechanism, chain, design, and status
   documents.
5. The closure task is [`../Tasks/SK-TASK-002-pre-implementation-coherence-closure.md`](../Tasks/SK-TASK-002-pre-implementation-coherence-closure.md),
   the resolved issue is recorded under [`../Issues/resolved/`](../Issues/resolved/), and static
   verification is recorded in
   [`../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md).

## 11. Reopen and closure

This audit is closed for `SK-MVP-0.2`: every finding is resolved in its owning document or has a
recorded decision. Reopen it when the contract version changes, when a new chain or mechanism is added,
or when runtime evidence invalidates a current assumption.

Current status of the application is recorded in [`../00-current-status.md`](../00-current-status.md).
This audit and its evidence establish document coherence only; they do not constitute runtime,
capability, hosted, or gameplay evidence.
