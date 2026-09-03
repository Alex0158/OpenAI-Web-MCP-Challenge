# Roadmap-Driven Design Gap Audit

**Role:** Validation record produced by the delivery-roadmap review  
**Status:** VERIFIED planning audit; the historical `SK-MVP-0.1` defaults are reconciled by the coherent `SK-MVP-0.2` contract, runtime evidence pending  
**Date:** 2026-09-01  
**Scope:** Sleepless Kingdom game child only

## Purpose and method

This audit uses [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
as a forcing function. Every checkpoint was reviewed for an input, an authoritative state
transition, a persistence boundary, an observable result, and a failure or recovery path. A missing
choice is recorded here instead of being silently invented in code.

Concrete defaults for the gaps are recorded in
[`04-mvp-decision-proposals.md`](04-mvp-decision-proposals.md). That pack is the historical gameplay
baseline captured by `SK-MVP-0.1`; the owner-accepted Re-entry delivery, geometry, state, anti-loop,
protected-start, event, and `world_snapshot`/`client_snapshot` revisions are now recorded in `SK-MVP-0.2` and runtime evidence
remains a later gate.

The review does not change the product thesis. It confirms that the concept is coherent enough for a
contract gate and a runtime capability probe, while separating the two-player demonstration from the
larger PvP, siege, migration, breach, progression, and leaderboard game.

## Findings

The existing mechanism, capability, and chain documents cover the intended player loop. The roadmap
exposed 20 MVP decisions that were required before implementation could be trusted. The owner accepted
the historical defaults in `04-mvp-decision-proposals.md` and they were recorded in the `SK-MVP-0.1`
gameplay baseline. `ADR-GAME-0010` now reconciles the load-bearing geometry, state, anti-loop,
protected-start, event, and `world_snapshot`/`client_snapshot` terms in `SK-MVP-0.2`; the Re-entry delivery policy remains owned
by `ADR-GAME-0009`. The audit also exposed eight full-game decisions that should remain outside the first
vertical slice. None of these findings requires adding a feature to the MVP; most require naming a
default, an ordering rule, or an evidence boundary.

## MVP decisions audited and closed at design level

| Gap | Decision boundary | Accepted MVP default | Roadmap gate |
|---|---|---|---|
| G-MVP-01 | Player/session identity and fixture ownership | Use two deterministic fixture players with opaque `player_id` values; bind every command and page tool to a server session and shelter owner | CP-01 |
| G-MVP-02 | Coordinate and distance semantics | Use logical-tile coordinates; use inclusive Euclidean center distance for separation, sensing, fog, and contact; start shelters at `(16,64)` and `(112,64)`; use a documented 32 × 20 camera viewport | CP-01 |
| G-MVP-03 | Protected-start boundary | Protect each start shelter and its inclusive 12-tile radius from hostile monster contact until `start_world_time + 120` world seconds; first dispatch does not shorten it and equality is expired before contact detection | CP-01 |
| G-MVP-04 | Node placement and contention | Place one 20-unit Wood node and one 20-unit Rock node in the inclusive 14–20-tile band from each start (fixture positions 14 and 18); do not reserve nodes; the authoritative extraction transaction wins each unit | CP-01 |
| G-MVP-05 | Offline and downtime catch-up | On restart, advance from persisted `world_time` to current time deterministically; apply consequential events individually and routine respawn/projection work in bounded summaries | CP-01 / CP-06 |
| G-MVP-06 | Same-time event order | Apply movement and home-boundary deposit, lock contacts, extract only eligible soldiers, resolve one combat round, settle death/respawn/reissue, then timers, projections, and outbox delivery at one world-second boundary | CP-01 / CP-06 |
| G-MVP-07 | Monster re-engagement after death | Reissue the same soldier identity once, consume a one-mission-chain budget, avoid the last danger cell and its one-tile neighbourhood, and enter typed `WAITING_REVIEW` after no safe route or a second monster death | CP-01 / CP-11 |
| G-MVP-08 | Mission terminal states | Keep `soldier.lifecycle`, `mission.phase`, and `encounter.status` separate; empty or depleted targets return the soldier with partial cargo; an unreachable route becomes `WAITING_REVIEW`; recall preserves role and cargo while queuing travel; siege ends on death | CP-01 / CP-09 |
| G-MVP-09 | Cargo boundary and mixed cargo | Extract only remaining capacity; Wood and Rock share equal-weight slots; no resource converts to coins until the shelter deposit transaction commits | CP-01 / CP-10 |
| G-MVP-10 | Realtime snapshot and resync contract | Send a full `client_snapshot` on connect/resync, then sequenced 10 Hz projections carrying `client_snapshot_id`, optional `base_client_snapshot_id`, `world_time`, and entity revisions; keep durable restart state in `world_snapshot`; use typed HTTP commands for mutations | CP-01 / CP-08 |
| G-MVP-11 | Persistence and version compatibility | Version schema, `world_snapshot`/`client_snapshot`, and events; reject incompatible versions with a visible recovery state; do not perform live schema migration during the judge run | CP-01 / CP-05 |
| G-MVP-12 | Re-entry eligibility and grant | Only `CargoLostToMonster` is eligible in G2; retain every Domain Event, derive one coalesced Agent Signal per bound shelter/Thread, preserve the opaque binding, and let the Agent execute `force_recall_soldier` under the bounded grant without pausing the world | CP-01 / CP-14 |
| G-MVP-13 | WebMCP unavailable behavior | Keep the human dashboard fully usable; show the exact capability result and offer no silent simulated tool success | CP-02 / CP-13 |
| G-MVP-14 | Demo choreography and reset | Fix the seed, two fixture players, one deterministic monster route, and a reset command that creates a new world without manual database edits | CP-02 / CP-16 |
| G-MVP-15 | Basic session and command security | Use opaque session tokens, ownership checks, command rate limits, and server-side reward validation; never accept client coins, cargo, positions, or hidden cells | CP-01 / CP-15 |
| G-MVP-16 | Presentation and browser boundary | Target desktop WASD first; make Canvas device-pixel-ratio aware; expose React text equivalents, reconnect state, and a mobile-later note | CP-02 / CP-12 |
| G-MVP-17 | Process topology | Use one Node process with clear modules locally; hosted deployment uses a long-running worker and durable database, with no timer owned by a serverless request | CP-02 / CP-17 |
| G-MVP-18 | Evidence and redaction | Capture redacted IDs, revisions, world times, capability results, restart steps, and browser evidence; never include secrets, credentials, or raw Agent context | CP-03 / CP-16 / CP-18 |
| G-MVP-19 | Deterministic combat contract | Use one round per world second, the readable additive damage formula, `initiative_speed` with entity-id tie-break, and no random or hidden party modifier in G2; movement rates remain separate | CP-01 / CP-11 |
| G-MVP-20 | Economy calibration | Use Wood = 1 coin, Rock = 3 coins, five equal-weight slots, one unit per 2 seconds, 20-unit nodes, and 30-second respawn; defer Gold and yield multipliers | CP-01 / CP-10 / CP-16 |

The recommendations are deliberately conservative. They make the first story deterministic and
reviewable without claiming that production balance, authentication, or world scale has been solved.
Any change now requires a recorded contract revision and updates to the affected mechanism, chain,
scenario, and checkpoint.

## Full-game gates revealed by the roadmap

These decisions are real product work, but they should follow the local G2 proof rather than block it.

| Gap | Decision required | Why it can wait |
|---|---|---|
| G-FULL-01 | PvP initiative, retreat, simultaneous contact, cargo transfer, overflow, and repeat-attack abuse | The first slice uses a seeded monster encounter; PvP is a separate contested-value loop |
| G-FULL-02 | Guard/turret targeting, siege party aggregation, assault window, breach transaction, and attacker reward ledger | These depend on the stable combat, identity, and value ledgers proved in G2 |
| G-FULL-03 | Migration cooldown, charge cap, destination constraints, veil duration, and last-known-position search | Migration needs a real moving home anchor and stale-intelligence playtest |
| G-FULL-04 | Breach repair, corruption recovery, outside-soldier conversion, and minimum shelter state | Recovery is consequential and should be balanced after breach evidence exists |
| G-FULL-05 | Tool tiers, upgrade prices, prerequisites, caps, and soldier quantity/attribute curves | Economy values need extraction and combat telemetry rather than guesses |
| G-FULL-06 | Leaderboard metric, season/reset policy, reward projection, and anti-farming rules | Ranking is a projection of committed events, not an MVP authority |
| G-FULL-07 | Additional resource/monster species, terrain, spawn pressure, and population budgets | Content scale should be derived from measured tick and persistence budgets |
| G-FULL-08 | Public authentication, moderation, retention, cost controls, migration tooling, and incident operations | Hosted G3 needs only the narrow judge identity and recovery boundary |

## Edge-case review

| Situation | Required result before the slice is called reliable |
|---|---|
| Extraction and monster contact resolve in the same second | Apply the documented boundary order once; the cargo either enters the soldier ledger or is destroyed, never both |
| Deposit and shelter breach resolve in the same second | Use the same transaction/order rule for shelter-held value and field cargo; record both causal outcomes |
| State commit succeeds but outbox delivery fails | Keep the event and delivery row durable; retry at least once without repeating the domain effect |
| Worker crashes during combat | Replay the committed event or roll back the transaction; never create a second death, coin, or soldier |
| WebSocket drops during a mission | Continue world simulation; mark the page stale and replace local state with a full `client_snapshot` on reconnect |
| Duplicate or stale recall command arrives | Idempotency key returns the original result; stale entity revision is rejected without changing mission state |
| Monster is near a respawning node | Spawn only after the node timer and walkability checks; do not create an unavoidable contact at the shelter start |
| Two soldiers reach the last node unit | One extraction transaction wins; the other gets a deterministic depleted/partial result |
| Player B joins late | The new page receives the current authoritative `client_snapshot` projection and only its permitted fog/intelligence view |
| Wall clock jumps or the service is down for a long interval | Use persisted world time and bounded catch-up; record a recovery summary and keep the server responsive |

## Decision order

G-MVP-01 through G-MVP-20 are closed at the design level by the `SK-MVP-0.1` baseline plus the
`SK-MVP-0.2` coherence revision in `ADR-GAME-0010`. The local CP-02 runtime, page,
realtime, persistence, and visible degradation result is recorded in
[`../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md).
The simulation and ledger checkpoints must still provide evidence for the same contracts, while the
external Agent adapter remains a later CP-13/CP-14 gate. Review the full-game gaps after CP-16, when
two-player telemetry and a real event trace exist.

CP-03 is now the verified bounded implementation-task and release lock in `SK-TASK-003`. CP-02 is
locally verified and `ADR-GAME-0010` closes the remaining G2 coherence findings; the next safe action
is CP-04 under the child task route, with its own focused implementation acceptance cases.

## Scope conclusion

The roadmap is implementable as a staged MVP. The concept does not need another top-level feature to
become coherent; it needs explicit defaults at the 20 MVP boundaries above, then evidence that the
world, cargo ledger, restart path, and page-bound Re-entry action behave as one causal system.
