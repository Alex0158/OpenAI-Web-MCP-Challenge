# Roadmap-Driven Design Gap Audit

**Role:** Validation record produced by the delivery-roadmap review  
**Status:** VERIFIED planning audit; listed decisions remain `OPEN` or `RECOMMENDED`  
**Date:** 2026-09-01  
**Scope:** Sleepless Kingdom game child only

## Purpose and method

This audit uses [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
as a forcing function. Every checkpoint was reviewed for an input, an authoritative state
transition, a persistence boundary, an observable result, and a failure or recovery path. A missing
choice is recorded here instead of being silently invented in code.

Concrete defaults for the gaps are proposed in
[`04-mvp-decision-proposals.md`](04-mvp-decision-proposals.md). That file is a proposal pack for
CP-01; it is not accepted product truth until the owner promotes each decision.

The review does not change the product thesis. It confirms that the concept is coherent enough for a
contract gate and a runtime capability probe, while separating the two-player demonstration from the
larger PvP, siege, migration, breach, progression, and leaderboard game.

## Findings

The existing mechanism, capability, and chain documents cover the intended player loop. The roadmap
exposed 20 MVP decisions that must be closed before implementation can be trusted. It also exposed
eight full-game decisions that should remain outside the first vertical slice. None of these findings
requires adding a feature to the MVP; most require naming a default, an ordering rule, or an evidence
boundary.

## MVP decisions to close before implementation

| Gap | Decision required | Recommended simple default | Roadmap gate |
|---|---|---|---|
| G-MVP-01 | Player/session identity and fixture ownership | Use two deterministic fixture players with opaque `player_id` values; bind every command and page tool to a server session and shelter owner | CP-01 |
| G-MVP-02 | Coordinate and distance semantics | Use integer logical tiles; use Euclidean distance for the 80-tile separation; start shelters at `(16,64)` and `(112,64)`; use a documented 32 × 20 camera viewport | CP-01 |
| G-MVP-03 | Protected-start boundary | Protect each start shelter and its 12-tile radius from hostile monster contact until the first dispatch or 120 world seconds, whichever comes first | CP-01 |
| G-MVP-04 | Node placement and contention | Place one 20-unit Wood node and one 20-unit Rock node 12–20 tiles from each start; do not reserve nodes; the authoritative extraction transaction wins each unit | CP-01 |
| G-MVP-05 | Offline and downtime catch-up | On restart, advance from persisted `world_time` to current time deterministically; apply consequential events individually and routine respawn/projection work in bounded summaries | CP-01 / CP-06 |
| G-MVP-06 | Same-time event order | Resolve contact/combat, shelter boundary and deposit, death/respawn, migration, extraction/respawn, then projections and outbox delivery at one world-second boundary | CP-01 / CP-06 |
| G-MVP-07 | Monster re-engagement after death | Reissue the same soldier identity and mission; make one route attempt around the last danger cell; if no safe route exists, enter `WAITING_REVIEW` instead of looping | CP-01 / CP-11 |
| G-MVP-08 | Mission terminal states | Empty or depleted targets return the soldier with partial cargo; an unreachable route becomes `WAITING_REVIEW`; recall preserves role and cargo while queuing travel; siege ends on death | CP-01 / CP-09 |
| G-MVP-09 | Cargo boundary and mixed cargo | Extract only remaining capacity; Wood and Rock share equal-weight slots; no resource converts to coins until the shelter deposit transaction commits | CP-01 / CP-10 |
| G-MVP-10 | Realtime snapshot and resync contract | Send a full snapshot on connect/resync, then sequenced 10 Hz snapshots carrying `snapshot_id`, `world_time`, and entity revisions; use typed HTTP commands for mutations | CP-01 / CP-08 |
| G-MVP-11 | Persistence and version compatibility | Version schema, snapshots, and events; reject incompatible versions with a visible recovery state; do not perform live schema migration during the judge run | CP-01 / CP-05 |
| G-MVP-12 | Re-entry eligibility and grant | Only `CargoLostToMonster` is eligible in G2; bind the event to an opaque player/shelter reference; `inspect` is automatic while `prepare/execute recall` uses the existing bounded grant | CP-01 / CP-14 |
| G-MVP-13 | WebMCP unavailable behavior | Keep the human dashboard fully usable; show the exact capability result and offer no silent simulated tool success | CP-02 / CP-13 |
| G-MVP-14 | Demo choreography and reset | Fix the seed, two fixture players, one deterministic monster route, and a reset command that creates a new world without manual database edits | CP-02 / CP-16 |
| G-MVP-15 | Basic session and command security | Use opaque session tokens, ownership checks, command rate limits, and server-side reward validation; never accept client coins, cargo, positions, or hidden cells | CP-01 / CP-15 |
| G-MVP-16 | Presentation and browser boundary | Target desktop WASD first; make Canvas device-pixel-ratio aware; expose React text equivalents, reconnect state, and a mobile-later note | CP-02 / CP-12 |
| G-MVP-17 | Process topology | Use one Node process with clear modules locally; hosted deployment uses a long-running worker and durable database, with no timer owned by a serverless request | CP-02 / CP-17 |
| G-MVP-18 | Evidence and redaction | Capture redacted IDs, revisions, world times, capability results, restart steps, and browser evidence; never include secrets, credentials, or raw Agent context | CP-03 / CP-16 / CP-18 |
| G-MVP-19 | Deterministic combat contract | Use one round per world second, the readable additive damage formula, speed initiative with entity-id tie-break, and no random or hidden party modifier in G2 | CP-01 / CP-11 |
| G-MVP-20 | Economy calibration | Use Wood = 1 coin, Rock = 3 coins, five equal-weight slots, one unit per 2 seconds, 20-unit nodes, and 30-second respawn; defer Gold and yield multipliers | CP-01 / CP-10 / CP-16 |

The recommendations are deliberately conservative. They make the first story deterministic and
reviewable without claiming that production balance, authentication, or world scale has been solved.
Each recommendation can be changed at CP-01 if the owner records the reason and updates the affected
mechanism, chain, scenario, and checkpoint.

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
| WebSocket drops during a mission | Continue world simulation; mark the page stale and replace local state with a full snapshot on reconnect |
| Duplicate or stale recall command arrives | Idempotency key returns the original result; stale entity revision is rejected without changing mission state |
| Monster is near a respawning node | Spawn only after the node timer and walkability checks; do not create an unavoidable contact at the shelter start |
| Two soldiers reach the last node unit | One extraction transaction wins; the other gets a deterministic depleted/partial result |
| Player B joins late | The new page receives the current authoritative snapshot and only its permitted fog/intelligence projection |
| Wall clock jumps or the service is down for a long interval | Use persisted world time and bounded catch-up; record a recovery summary and keep the server responsive |

## Decision order

Close G-MVP-01 through G-MVP-06 in CP-01 because identity, coordinates, protection, placement,
recovery, and ordering are the kernel contracts. Close G-MVP-07 through G-MVP-11 while implementing
the simulation and ledger foundation. Close G-MVP-12 through G-MVP-20 before the Re-entry and hosted
gates. Review the full-game gaps after CP-16, when two-player telemetry and a real event trace exist.

The next safe action is therefore CP-01, a versioned MVP contract sheet, followed by CP-02, a short
capability and runtime probe. Starting broad feature coding before those two gates would turn the
remaining unknowns into hidden implementation policy and make later recovery more expensive.

## Scope conclusion

The roadmap is implementable as a staged MVP. The concept does not need another top-level feature to
become coherent; it needs explicit defaults at the 20 MVP boundaries above, then evidence that the
world, cargo ledger, restart path, and page-bound Re-entry action behave as one causal system.
