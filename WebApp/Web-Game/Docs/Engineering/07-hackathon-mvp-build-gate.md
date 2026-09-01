# Hackathon MVP Build Gate

**Status:** ACCEPTED MVP PROFILE; PROPOSED IMPLEMENTATION INCREMENT
**Purpose:** Convert the concept baseline into the smallest implementation that can prove the
continuous-world and Re-entry thesis.

## Decision posture

The next step should be a short stack gate followed immediately by one vertical slice. The project
does not need a complete production-infrastructure decision before the first code, and it should not
start UI work before authority, persistence, and cargo settlement are explicit. This document is a
proposal for that first increment; it does not promote the target stack to an accepted production
architecture.

## Contracts to lock before code

| Contract | Minimum first-slice rule | Why it is binding |
|---|---|---|
| World time | One server-owned monotonic clock advances travel, extraction, combat, and respawn; a restart catches up from durable time | A disconnected browser must not pause the world |
| Identity | `shelter_id`, `soldier_id`, `mission_attempt_id`, `monster_id`, `encounter_id`, and `event_id` are distinct and stable where their lifecycle requires | Prevents duplicate soldiers, cargo, rewards, and events |
| Cargo settlement | Cargo converts to coins only at shelter deposit; PvP transfers it; a monster-caused soldier death destroys unbanked cargo and does not reward the killer | This is the clarified loss rule and the main economic risk |
| Mission authority | A field soldier keeps one role and loadout; ordinary death respawns the same identity and reissues a repeatable gathering or hunting mission | Preserves role strategy without frame-by-frame control |
| Event boundary | A committed domain event can be written to an outbox and read by the canonical page; WebMCP can only call permission-checked current commands | Keeps Re-entry useful without moving game authority into the Agent |

## Recommended MVP defaults

These values are deliberately small and deterministic. The owner accepted this shape with a larger
two-player map, Wood plus Rock, and a minimal Starve.io-inspired presentation. They are `ACCEPTED
MVP` defaults, not final game balance or a complete production topology. Keep them in one
configuration object so later tuning does not change the domain contracts or event names.

| Decision | Recommended first-slice default | Reason |
|---|---|---|
| World clock and tick | One world second equals one real second. The worker advances movement and visibility on a 100 ms simulation step, while combat, extraction, and respawn settle on integer world-second boundaries. A restart advances from durable `last_world_time` to current wall time and processes due milestones once. | Smooth movement does not require frame-rate authority; discrete game outcomes remain easy to explain and replay |
| Map and seed | One 128 × 128 logical-tile map, fixed seed `sleepless-mvp-01`, two symmetric protected starting shelters at least 80 tiles apart, five starter soldiers per shelter, one Wood node and one Rock node in each start zone, and one seeded monster. | Gives two players meaningful shared-world presence and travel space without procedural or population complexity |
| Combat cadence | One round per world second. Higher `speed` acts first; ties use ascending entity id. No miss, critical hit, random roll, or party formula in this slice. | Deterministic outcomes are easy to inspect in the dashboard and test after restart |
| Combat formula | `damage = max(1, attacker_attack + weapon_power + matchup_bonus - defender_defense)`. Gatherer: 100 HP, 8 attack, 2 defense, speed 3, pickaxe power 0. Hunter: 100 HP, 12 attack, 3 defense, speed 5, sword power 4, monster matchup bonus 4. Monster: 80 HP, 12 attack, 2 defense, speed 4. | Shows the role and tool difference with one readable formula |
| Cargo and extraction | First slice uses Wood and Rock: total capacity 5 equal-weight units, one unit extracted every 2 world seconds, Wood converts to one coin and Rock to three coins at shelter deposit. Each local node starts with 20 units and respawns after 30 world seconds. | Shows the owner's simple coin economy with two readable choices while preserving cargo risk without weights or crafting |
| Full resource progression | Gold remains a later tier at 8 coins per unit; tool tiers T1/T2/T3 yield 1×/2×/3× on lower-tier nodes. Keep first-slice cargo as equal-weight unit slots. | Retains the owner's simple coin economy and Starve.io-inspired yield progression without adding a crafting tree |
| Continuation event | `CargoLostToMonster` is the one continuation-eligible event. Deduplicate by `event_id`, allow at most one pending continuation per shelter, and require the existing user grant. | One meaningful event demonstrates re-entry without notification spam |
| Page tools | The Agent first calls `inspect_mission_history`, then may execute `force_recall_soldier` against the current revision with an idempotency key. Migration, siege, and destructive upgrades remain human-confirmed. | Gives the Agent a bounded recovery action while preserving consequence control |
| Local persistence and transport | One Node.js 24 world worker, SQLite in WAL mode, one durable snapshot plus event log and outbox transaction. Use typed HTTP commands and a WebSocket snapshot/event channel at about 10 Hz after an early capability probe; retain polling only as a visible diagnostic fallback. | Supports a fluid two-player view while keeping mutations explicit and proving restart recovery and current-state reads |

For a short demo, place each Wood or Rock node about 12 tiles from its shelter and use a soldier
travel speed of 3 tiles per world second. The gatherer reaches a node in about four seconds, extracts
visible cargo, and can meet the seeded monster before returning. A hunter with the recommended sword
values defeats that monster in a few rounds; a gatherer with a pickaxe is expected to lose, which makes
the cargo-loss and Agent-continuation path reliably observable while the second shelter remains a
visible, non-immediate PvP participant.

## Proposed implementation profile

| Layer | First-slice profile | Boundary |
|---|---|---|
| Page | Next.js App Router, React, and TypeScript | Human UI remains the ordinary fallback |
| Simulation | Node.js 24 and TypeScript authoritative world worker | No browser timer or client state decides outcomes |
| Local persistence | SQLite with a durable snapshot, event log, and outbox | Use PostgreSQL when hosted proof needs concurrent durable service behavior |
| Commands and updates | Typed HTTP commands plus a WebSocket snapshot/event stream at about 10 Hz | Probe capability early; polling is a visible diagnostic fallback and never becomes game authority |
| Rendering | Canvas 2D with a small sprite/tile atlas at up to 60 FPS, interpolating authoritative snapshots | React owns controls and accessible overlays; Canvas renders projections and never owns state |
| Re-entry | One outbox adapter seam plus one genuine page-bound WebMCP read or bounded action | Unsupported WebMCP must be reported visibly and leave the UI usable |
| Operations | One always-on worker process with health output and restart catch-up | Do not use a serverless-only timer for world authority |

Redis, a separate pathfinding service, a game engine, and a microservice split are deferred until a
measured performance or authority requirement makes one necessary.

## Vertical slice

The first slice should prove one complete causal loop with deliberately small content:

1. Seed one 128 × 128 map with two shelters at least 80 tiles apart, five starter soldiers per
   shelter, one Wood and one Rock node in each start zone, and one generated monster.
2. Assign one gatherer a locked tool and route. The server advances travel and extraction while the
   page is closed.
3. Let the monster encounter and defeat the gatherer. Commit `CargoLostToMonster`, destroy only the
   unbanked cargo, respawn the same soldier identity, and reissue its repeatable assignment.
4. Show the route, cargo, combat result, loss cause, respawn, and next valid action in dashboard
   history.
5. Deliver that causal event through the outbox, return to the canonical page, reread current state,
   and execute the bounded `force_recall_soldier` WebMCP action under the accepted grant when the
   current revision permits it. A missing capability or stale command must be visible; migration,
   siege, and destructive upgrades stay behind the human boundary.
6. Disconnect the browser and restart the local worker. The recovered state must follow durable
   world time without duplicating the encounter, cargo loss, respawn, or event delivery.

The PvP encounter, siege party, shelter breach conversion, migration veil, and global leaderboard
remain in the concept model and follow as later slices. The first slice establishes the authority
and event shape they will reuse.

## Exit criteria

Do not expand the slice until all of the following are reviewable:

- deterministic replay produces the same state and event order for the same seed and commands;
- ordinary UI can assign, observe, and recover the mission without WebMCP;
- cargo is destroyed exactly once on a monster-caused death and no coin is created before deposit;
- the same `soldier_id` respawns without a duplicate roster entry and its mission attempt changes;
- a duplicate command or delivery with the same idempotency key has no second effect;
- the event history explains what happened and why; and
- the Re-entry/WebMCP capability probe, result, and human boundary are visible in evidence.

After this gate, tune combat and economy values, add PvP and breach slices, then perform the hosted
always-on and judge-reproduction proof. A passing local slice is not deployment or submission proof.

## Reopen conditions

Reopen this proposal if the first implementation needs a different authority boundary, if SQLite
cannot support the required local replay, if the page cannot expose a genuine WebMCP surface, or if
the clarified cargo-loss rule changes.
