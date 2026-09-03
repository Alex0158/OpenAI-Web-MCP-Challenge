# Mechanism Inventory and Boundary Gaps

**Role:** Canonical inventory for the game's atomic mechanisms
**Status:** Working decomposition baseline
**Count:** 19 atomic mechanisms, 8 player-facing capabilities, and 11 cross-mechanism logic chains

## Counting rule

An item is an atomic mechanism when it has an independent state transition, authority boundary,
failure mode, balance surface, or verification surface. A feature is a player-facing capability that
composes one or more mechanisms. A logic chain is an ordered causal flow that crosses mechanism
boundaries and must preserve state, cargo, identity, and event order.

The count is a documentation boundary, not a claim that the game has nineteen independent services.
Several mechanisms can run in one world worker and one database transaction while remaining separate
for design, testing, and review.

## Atomic mechanism inventory

| ID | Mechanism | Owns | Detail file | Current status / gap |
|---|---|---|---|---|
| M01 | World clock and continuity | World time, offline progress, restart recovery, scheduled milestones, event order | [`detail-01-world-clock-and-continuity.md`](detail-01-world-clock-and-continuity.md) | Rules are working; tick, downtime catch-up, and ordering cases need final values |
| M02 | World generation and resource spawn | Seeded terrain, resource nodes, monster regions, depletion, respawn, placement | [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md) | Accepted MVP map/start profile; production dimensions and spawn rates are open |
| M03 | Shelter state and command authority | Shelter lifecycle, home anchor, residents, command eligibility, recovery state | [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md) | Working decision; repair and minimum-state rules are open |
| M04 | Shelter sensing | Shelter resource field, sensing visibility, sensing upgrades, `client_snapshot` boundary | [`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md) | G2 radius fixed; exact resource payload and refresh cadence are open |
| M05 | Shelter upgrades and progression | Upgrade branches, prerequisites, prices, caps, level effects | [`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md) | Branch shape is accepted; numerical economy is open |
| M06 | Soldier identity and lifecycle | Stable identity, roster, field presence, death, respawn, terminal/lost states | [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md) | Immediate same-identity respawn is working; breach interaction needs final cases |
| M07 | Role and loadout lock | Gatherer, hunter, siege, guard roles; tools; role-specific posture | [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md) | Role lock is accepted; exact equipment stats are open |
| M08 | Mission dispatch, return, and recall | Mission creation, one active assignment, passive encounter interrupt, return policies, terminal states | [`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md) | Working rule; retry and partial-success policy needs examples |
| M09 | Navigation and pathfinding | Route creation, waypoint cache, obstacles, moving home anchor, route invalidation | [`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md) | Target implementation; collision and replanning thresholds are open |
| M10 | Player exploration, fog, and intelligence | Avatar movement, explored map, shelter discovery, time-stamped intelligence handoff | [`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md) | Working design; stale-intel expiry and search behavior are open |
| M11 | Resource extraction, cargo, and deposit | Tool requirements, yield multiplier, extraction cycles, capacity, deposit-to-coins | [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md) | Lifecycle is accepted; values, capacity, and conversion table are open |
| M12 | Monster state and targeting | Generated/corrupted monster states, target policy, pursuit, attack, retreat, death | [`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md) | State machine target; species values, target switching, and shelter/veil policy are open |
| M13 | Encounter lock and combat resolution | Detection-to-contact transition, participant lock, rounds, formula, matchup modifiers | [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md) | Framework accepted; all balance values and round cases are open |
| M14 | Loot, rewards, and atomic transfer | PvP cargo, monster cargo loss, siege reward, exactly-once settlement | [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md) | Ledgers are separated; reward share and caps are open |
| M15 | Shelter defense and turrets | Resident guards, turret targeting, defense posture, incoming assault state | [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md) | Turret baseline exists; targeting and defense numbers are open |
| M16 | Siege, assault, and breach | Siege party, assault phases, breach transaction, mission termination, corruption trigger | [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md) | Breach baseline exists; repair, assault window, and reward policy are open |
| M17 | Shelter migration and veil | Paid movement, duration, concealment, charge, turret shutdown, moving home anchor | [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md) | Working rule; cooldown, charge cap, and assault ordering are open |
| M18 | Leaderboard and progression metrics | Global ranking projection, wealth/score definitions, reset and anti-farming boundary | [`detail-18-leaderboard-and-progression.md`](detail-18-leaderboard-and-progression.md) | Leaderboard is required; metric and season policy are open |
| M19 | Event and Re-entry game hook | Domain event eligibility, causal payload, page return, current WebMCP action boundary | [`detail-19-reentry-event-hook.md`](detail-19-reentry-event-hook.md) | Target integration; no runtime or delivery proof exists |

## Player-facing capability inventory

Capabilities are documented separately because the same mechanism can support a human action, an
Agent action, or a visible read-only report.

| Capability | User outcome | Capability file |
|---|---|---|
| Explore and discover | Walk the fogged world, learn terrain, and bring shelter intelligence home | [`../Design/Capabilities/01-player-exploration-and-discovery.md`](../Design/Capabilities/01-player-exploration-and-discovery.md) |
| Command a shelter | Inspect the base, choose upgrades, manage residents, and issue valid commands | [`../Design/Capabilities/02-shelter-command-and-upgrade.md`](../Design/Capabilities/02-shelter-command-and-upgrade.md) |
| Operate soldiers | Assign locked roles, routes, targets, and return policies without frame-by-frame control | [`../Design/Capabilities/03-soldier-operations.md`](../Design/Capabilities/03-soldier-operations.md) |
| Plan economy | Select resources, account for travel risk, deposit cargo, and spend coins | [`../Design/Capabilities/04-resource-and-economy-planning.md`](../Design/Capabilities/04-resource-and-economy-planning.md) |
| Defend, raid, and relocate | Balance guards, turrets, siege parties, migration, and breach recovery | [`../Design/Capabilities/05-defense-siege-and-migration.md`](../Design/Capabilities/05-defense-siege-and-migration.md) |
| Review consequences | Understand mission history, cargo loss, deaths, breach, and world memory | [`../Design/Capabilities/06-consequence-review-and-recovery.md`](../Design/Capabilities/06-consequence-review-and-recovery.md) |
| Continue with an Agent | Let a bounded Agent return after a meaningful event and prepare the next action | [`../Design/Capabilities/07-event-driven-agent-continuation.md`](../Design/Capabilities/07-event-driven-agent-continuation.md) |
| Compare progress | Read a global, explainable leaderboard without gaining gameplay authority | [`../Design/Capabilities/08-leaderboard-and-competition.md`](../Design/Capabilities/08-leaderboard-and-competition.md) |

## Cross-mechanism logic-chain inventory

The chain documents are normative orchestration records. They do not replace the atomic mechanism
rules; they specify the order in which those rules compose and where a failure or event is emitted.

| Chain | Trigger and outcome | Chain file |
|---|---|---|
| C01 | Player exploration produces usable shelter intelligence | [`Chains/01-exploration-to-intelligence.md`](Chains/01-exploration-to-intelligence.md) |
| C02 | Mission dispatch produces cargo, return, deposit, or loss | [`Chains/02-dispatch-to-deposit.md`](Chains/02-dispatch-to-deposit.md) |
| C03 | Field contact produces a combat result and cargo settlement | [`Chains/03-encounter-to-loot.md`](Chains/03-encounter-to-loot.md) |
| C04 | Monster hunt produces value or soldier loss | [`Chains/04-monster-hunt-to-reward.md`](Chains/04-monster-hunt-to-reward.md) |
| C05 | Siege produces defense, assault, breach, reward, or failure | [`Chains/05-siege-to-breach.md`](Chains/05-siege-to-breach.md) |
| C06 | Migration produces a concealed moving shelter and reunified home anchor | [`Chains/06-migration-to-relocation.md`](Chains/06-migration-to-relocation.md) |
| C07 | Death produces respawn, mission restart, mission termination, or corruption | [`Chains/07-death-to-respawn-or-corruption.md`](Chains/07-death-to-respawn-or-corruption.md) |
| C08 | A causal backend event produces bounded Agent continuation | [`Chains/08-event-to-reentry-action.md`](Chains/08-event-to-reentry-action.md) |
| C09 | An upgrade produces a visible capability projection | [`Chains/09-upgrade-to-capability.md`](Chains/09-upgrade-to-capability.md) |
| C10 | World time produces durable state and restart recovery | [`Chains/10-world-tick-to-persistence.md`](Chains/10-world-tick-to-persistence.md) |
| C11 | A committed event produces an explainable leaderboard projection | [`Chains/11-event-to-leaderboard.md`](Chains/11-event-to-leaderboard.md) |

## Boundary gaps and questions

The following are explicit cross-boundary questions. They must be resolved in the owning mechanism
and then reflected in affected chains and scenarios; they must not be hidden in implementation code.

### Visibility and intelligence

- Does shelter sensing reveal only node type and approximate yield, or exact quantities and routes?
- Does a soldier's sensor reveal another soldier's role, cargo, or only an actor contact?
- When does a player-discovered shelter intelligence expire, and can a siege search nearby?
- Does a veil hide a shelter from all fresh sensors or only from player exploration?

### Time and event ordering

- What world-time unit is used for travel, extraction, combat rounds, migration, and cooldowns?
- Which due milestones are replayed after downtime, and how are overdue encounters ordered?
- If a soldier reaches the moving home anchor while a breach or migration completion is committing,
  which transaction wins?

### Identity, mission, and cargo

- After ordinary death, the baseline reissues gathering/hunting; which failed targets or future
  mission variants become terminal remains open.
- If a future monster drop is introduced, does it apply to every species or only a named subset? The
  current baseline destroys unbanked cargo on every monster-caused soldier death and creates no drop.
- Which soldier is considered inside when it crosses the shelter boundary during a breach?
- How is cargo capacity measured across typed resources with different weights, if at all?

### Combat, defense, and breach

- What are the final HP, attack, defense, speed, tool, role, turret, and party formulas?
- When does an assault become committed, and what attack window remains during migration?
- Is the breach penalty deterministic 50% plus one level, or a bounded auditable random variant?
- How much of the defender-held value becomes the attacker siege reward, and can it be farmed?

### Progression and competition

- Which upgrade branch owns shelter level, soldier level, and military equipment level?
- Does the leaderboard rank current coins, lifetime value, score, shelter power, or a combination?
- What prevents repeated attacks on a weaker shelter from becoming the dominant strategy?

### Agent and human boundary

- Which events are continuation-eligible, and which only update the dashboard?
- Which actions can an Agent commit automatically, which require preparation, and which require a
  human decision?
- What evidence proves that the Agent reread current state instead of acting on stale context?

## Authority rule

The detail file owns the atomic rule. A capability file owns the user-facing contract. A chain file
owns ordering across mechanisms. A scenario illustrates one case. The Blueprint states the product
promise. If two documents disagree, stop implementation and reconcile the owning detail file, the
affected chain, the controlling ADR, and `Docs/00-current-status.md`.
