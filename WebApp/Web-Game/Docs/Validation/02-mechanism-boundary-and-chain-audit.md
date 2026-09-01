# Mechanism, Capability, and Chain Boundary Audit

**Role:** Validation record for the documentation decomposition increment
**Status:** VERIFIED structural coverage; product values and runtime remain open
**Date:** 2026-09-01

## Audit method

This audit reads the child documentation map, the mechanism inventory, every `detail-*` mechanism
file, every capability contract, every logic chain, and the controlling ADR. It checks four things:

1. every named mechanism has one detail authority;
2. every player-facing capability has an entry state, action boundary, outcome, and mechanism links;
3. every cross-mechanism outcome has an ordered chain; and
4. every visible gap, cross-boundary dependency, and unaccepted value is labelled rather than hidden.

This is a documentation audit. It does not prove implementation, deployment, balance, persistence,
or WebMCP delivery.

## Coverage result

- **19/19 atomic mechanisms** have a dedicated `detail-*` authority under `Mechanics/`.
- **8/8 player capabilities** have a dedicated contract under `Design/Capabilities/`.
- **11/11 cross-mechanism logic chains** have a dedicated contract under `Mechanics/Chains/`.
- Every detail file names related mechanisms, invariants, and open decisions.
- Every capability names goal, entry state, visible data, action boundary, outcome, and dependencies.
- Every chain names trigger, ordered transitions, failure branches, invariants, and open decisions.
- No implementation task or code was introduced by this documentation increment.

## Atomic mechanism evidence

| ID | Detail authority | Boundary verified | Main unresolved gate |
|---|---|---|---|
| M01 | [`detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md) | one world clock, milestones, replay, event order | world-time rate and downtime catch-up |
| M02 | [`detail-02-world-generation-and-resource-spawn.md`](../Mechanics/detail-02-world-generation-and-resource-spawn.md) | seed, nodes, regions, placement, depletion | production map scale, spawn density, protected start beyond the accepted MVP profile |
| M03 | [`detail-03-shelter-state-and-command.md`](../Mechanics/detail-03-shelter-state-and-command.md) | shelter state, residents, command preconditions | recovery command set and level effects |
| M04 | [`detail-04-shelter-sensing.md`](../Mechanics/detail-04-shelter-sensing.md) | bounded resource sensing and snapshot freshness | exact payload and refresh policy |
| M05 | [`detail-05-shelter-upgrades-and-progression.md`](../Mechanics/detail-05-shelter-upgrades-and-progression.md) | branch purchase transaction and projections | prices, prerequisites, caps, breach target |
| M06 | [`detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md) | stable identity, death, respawn, corruption | boundary race and resident deaths |
| M07 | [`detail-07-role-and-loadout-lock.md`](../Mechanics/detail-07-role-and-loadout-lock.md) | role/tool lock and fallback combat | tool stats, weight, durability |
| M08 | [`detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md) | one active mission, return, recall, terminal states | retries and partial success |
| M09 | [`detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md) | route, waypoints, moving home anchor, replan | terrain cost and stale-target search |
| M10 | [`detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md) | fog, avatar discovery, return-home handoff | expiry, confidence, shared intel |
| M11 | [`detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md) | node-to-cargo-to-coins lifecycle | capacity and conversion table |
| M12 | [`detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md) | generated/corrupted state and target policy | species values, target switching, and shelter/veil policy |
| M13 | [`detail-13-encounter-and-combat-resolution.md`](../Mechanics/detail-13-encounter-and-combat-resolution.md) | contact lock and shared explainable formula | stats, rounds, modifiers, party math |
| M14 | [`detail-14-loot-reward-and-atomic-transfer.md`](../Mechanics/detail-14-loot-reward-and-atomic-transfer.md) | field cargo, shelter value, siege reward ledgers | overflow, reward share/cap, anti-farming |
| M15 | [`detail-15-shelter-defense-and-turrets.md`](../Mechanics/detail-15-shelter-defense-and-turrets.md) | residents, turrets, alert and assault states | target policy and defense numbers |
| M16 | [`detail-16-siege-assault-and-breach.md`](../Mechanics/detail-16-siege-assault-and-breach.md) | siege phases and atomic breach | assault window, repair, reward, random loss |
| M17 | [`detail-17-shelter-migration-and-veil.md`](../Mechanics/detail-17-shelter-migration-and-veil.md) | paid committed movement and concealment | cooldown, cap, attack ordering |
| M18 | [`detail-18-leaderboard-and-progression.md`](../Mechanics/detail-18-leaderboard-and-progression.md) | global projection and recomputable score | metric, season, anti-farming |
| M19 | [`detail-19-reentry-event-hook.md`](../Mechanics/detail-19-reentry-event-hook.md) | game event eligibility and page action boundary | grant, eligibility, tool authority, runtime proof |

## Capability evidence

| Capability | Contract | Mechanisms covered | Chain coverage |
|---|---|---|---|
| Explore and discover | [`../Design/Capabilities/01-player-exploration-and-discovery.md`](../Design/Capabilities/01-player-exploration-and-discovery.md) | M01, M03, M10 | C01 |
| Command and upgrade | [`../Design/Capabilities/02-shelter-command-and-upgrade.md`](../Design/Capabilities/02-shelter-command-and-upgrade.md) | M03, M04, M05, M15, M17 | C06, C09 plus command preconditions |
| Operate soldiers | [`../Design/Capabilities/03-soldier-operations.md`](../Design/Capabilities/03-soldier-operations.md) | M06–M09 | C02, C07 |
| Plan economy | [`../Design/Capabilities/04-resource-and-economy-planning.md`](../Design/Capabilities/04-resource-and-economy-planning.md) | M02, M05, M08, M11, M14 | C02–C04 |
| Defend, siege, migrate | [`../Design/Capabilities/05-defense-siege-and-migration.md`](../Design/Capabilities/05-defense-siege-and-migration.md) | M03, M14–M17 | C05, C06 |
| Review consequences and recover | [`../Design/Capabilities/06-consequence-review-and-recovery.md`](../Design/Capabilities/06-consequence-review-and-recovery.md) | M01, M06, M14, M16, M18 | C07 |
| Continue with an Agent | [`../Design/Capabilities/07-event-driven-agent-continuation.md`](../Design/Capabilities/07-event-driven-agent-continuation.md) | M19 plus event producers | C08 |
| Compare progress | [`../Design/Capabilities/08-leaderboard-and-competition.md`](../Design/Capabilities/08-leaderboard-and-competition.md) | M01, M14, M18 | C11 projection and dashboard contract |

## Logic-chain evidence

| Chain | Required cross-boundary behavior | Main risk checked |
|---|---|---|
| C01 | player movement → observation → return-home intelligence | exploration must not grant attack authority |
| C02 | role dispatch → travel → extraction → return → deposit | cargo must remain exposed until deposit |
| C03 | sensor → contact → lock → combat → PvP cargo → respawn | one encounter and one cargo settlement |
| C04 | hunter → monster state → combat → value or loss | monster value and target/state transitions |
| C05 | intelligence → siege → defense → breach → reward/corruption | three value ledgers and boundary race |
| C06 | payment → veil → movement → home anchor → arrival | migration cannot erase committed assault |
| C07 | death → cargo settlement → respawn, terminal, or corruption | no respawn/corruption duplicate |
| C08 | event → eligibility → delivery → fresh page read → bounded action | no prompt injection or stale command |
| C09 | upgrade request → atomic payment → capability projection | no partial wallet or active-loadout mutation |
| C10 | world clock → due milestone → snapshot/outbox → restart recovery | no lost or duplicated world progress |
| C11 | committed event → projection → explainable rank change | no leaderboard authority or duplicate score |

## Cross-boundary findings

### Authority

The backend owns world time, positions, mission phases, cargo, combat, shelter, rewards, and
corruption. The browser and WebMCP page expose current commands but cannot award value, reveal hidden
locations, resolve combat, or restore a converted soldier. The outer Re-entry Core owns consent,
delivery, and private Agent context.

### State and event order

The most sensitive ordering boundaries are: deposit versus breach conversion; death versus respawn;
assault commitment versus migration; moving home anchor versus arrival; and event commit versus
continuation delivery. The detail and chain documents name each boundary, but the final tie-break
rules remain open.

### Value and identity

Field cargo, shelter-held value, and attacker siege reward have separate ledgers. `soldier_id` remains
stable through ordinary death while `mission_attempt_id` changes; breach conversion removes the
command link and creates one monster entity. These rules prevent duplicate cargo, coins, soldiers, or
rewards but still need executable transaction tests after implementation begins.

### Information

Shelter sensing, soldier sensing, and player exploration are separate visibility systems. Intelligence
is time-stamped and can become stale. The veil hides fresh discovery while preserving a last-known
position. Exact payloads, expiry, and search behavior are open and must be resolved together.

### Human and Agent boundary

The Agent can reread and prepare bounded actions after a user-authorized event. Migration, siege,
destructive upgrades, and irreversible recovery remain candidate human-boundary actions. The exact
authority matrix, event eligibility, and tool names are not accepted yet.

## Gaps by decision impact

### Blocking before a playable balanced MVP

1. Combat stats, round cadence, role matchups, turret/guard contribution, and party aggregation.
2. Production world dimensions, world-time rate, resource/monster spawn, and protected-start rules
   beyond the accepted 128 × 128 two-player profile.
3. Cargo capacity, extraction values, conversion values, upgrade prices, and level caps.
4. Breach repair duration/cost, reward share/cap, and deterministic versus bounded-random penalty.
5. Migration cooldown, charge cap, destination constraints, and committed-assault visibility.
6. Leaderboard metric, season/reset policy, and anti-farming protection.

### Blocking before a genuine Re-entry demonstration

1. Continuation-eligible event and grant matrix.
2. Exact page tool schemas and automatic/preparation/human authority levels.
3. Causal history payload sufficient for the Agent and human to explain the next action.
4. Deployment and restart evidence proving the hosted world clock and outbox survive downtime.

### Later refinement

Terrain cost, line-of-sight modifiers, equipment durability, monster drops, visual interpolation,
formation spacing, and additional species can follow after the core loop is verified.

The gates above are required before claiming a balanced playable MVP or hosted continuity. They do not
block a deliberately unbalanced vertical slice: the first slice may use a fixed seed and tunable
values after the stack, authority, persistence, and cargo-settlement contracts are accepted.

## Recommended decision order

Resolve the gates in this order because each later decision depends on the prior authority:

1. production world scale, spawn, and protected-start expansion beyond the accepted MVP;
2. shelter and soldier progression values;
3. resource/cargo economy;
4. combat and defense formula;
5. siege, breach, and recovery settlement;
6. migration and stale-intelligence timing;
7. leaderboard and anti-farming policy; and
8. Re-entry event eligibility and WebMCP authority matrix.

Until then, the documentation is structurally complete and the unchosen values remain explicitly
`OPEN`, `TARGET`, or `WORKING ASSUMPTION`.

## Verification run

The structural checks for this increment reported:

- 19 `detail-*.md` files, 11 numbered chain files, and 8 numbered capability files;
- 102 Markdown files in the child tree;
- zero missing relative Markdown links;
- zero CJK characters outside the intentionally fenced raw-source quotations; and
- zero missing required sections in mechanism, chain, and capability detail files.

Repository governance checks also passed: `validate_docs.py`, `validate_repository.py`,
`test_validators.py`, `test_sensitive_scan.py`, and `scan_sensitive_patterns.py`.
