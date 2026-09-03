# Discussion Coverage Audit

**Role:** Validation record for the concept-initialization discussion  
**Status:** VERIFIED documentation coverage; runtime claims remain out of scope  
**Date:** 2026-09-01  

## Audit method

This audit compares the nine exact initial owner request bodies, one exact labeled owner
clarification, and one later exact owner MVP decision preserved in
[`Blueprint/01-raw-discussion-reference.md`](../Blueprint/01-raw-discussion-reference.md) with the
canonical child documents. It also reviews the assistant synthesis records that shaped the baseline
(session records 64, 136, 156, 221, 311, 366, and 394). The earlier project-wide Core and
competition reading is represented by record 64, the initial game-document decomposition by record
156, and the detailed game synthesis and Starve.io observations by the remaining records. Owner
requirements, owner overrides, working decisions, and still-open proposals are classified
separately.

The browser ambient envelope is not part of the owner source. The raw reference preserves the owner
request bodies; the canonical documents preserve the organized interpretation and the assistant
synthesis is not copied into a second uncontrolled transcript.

## Assistant-synthesis traceability

The assistant's substantive synthesis is represented once in the canonical modules below. This
table prevents a useful proposal from disappearing while keeping assistant suggestions distinct from
owner-confirmed rules.

| Session record | Synthesis contribution | Canonical landing |
|---|---|---|
| 64 | Core problem, re-entry mechanism, WebMCP boundary, human boundary, and competition frame | [`Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md), [`Research/03-webmcp-and-reentry-reference.md`](../Research/03-webmcp-and-reentry-reference.md), [`Mechanics/detail-19-reentry-event-hook.md`](../Mechanics/detail-19-reentry-event-hook.md) |
| 136 | Concept-only comparison with RightSpot and the requirement that player strategy remain meaningful | [`Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md), [`00-current-status.md`](../00-current-status.md) |
| 156 | Brainstorming layers, status labels, loophole review, and the decision to defer task decomposition | [`Docs/README.md`](../README.md), [`Decisions/ADR-GAME-0001-documentation-authority-and-initial-baseline.md`](../Decisions/ADR-GAME-0001-documentation-authority-and-initial-baseline.md) |
| 221 | Initial game loop, Starve.io reference boundary, server continuity, efficiency shape, and candidate open questions | [`Blueprint/00-game-blueprint.md`](../Blueprint/00-game-blueprint.md), [`Research/01-starve-io-reference.md`](../Research/01-starve-io-reference.md), [`Engineering/`](../Engineering/README.md), [`Mechanics/00-mechanism-inventory-and-gaps.md`](../Mechanics/00-mechanism-inventory-and-gaps.md) |
| 311 | Live browser observations and the boundary between client clues and unknown backend stack | [`Research/01-starve-io-reference.md`](../Research/01-starve-io-reference.md) |
| 366 | Canonical game model, role/loadout split, cargo lifecycle, migration, breach, simulation, and Re-entry hooks | [`Blueprint/00-game-blueprint.md`](../Blueprint/00-game-blueprint.md), [`Mechanics/README.md`](../Mechanics/README.md), [`Engineering/`](../Engineering/README.md) |
| 394 | Owner-accepted mission, death, breach, migration, combat, and event baseline plus the next co-design gates | [`Decisions/ADR-GAME-0002-continuous-world-and-mission-authority.md`](../Decisions/ADR-GAME-0002-continuous-world-and-mission-authority.md), [`Decisions/ADR-GAME-0003-combat-formula-co-design-boundary.md`](../Decisions/ADR-GAME-0003-combat-formula-co-design-boundary.md), [`Mechanics/Chains/`](../Mechanics/Chains/README.md) |
| Owner source 11 | Owner acceptance of a larger two-player MVP map, minimum shelter separation, Wood plus Rock, and a smooth minimal Starve.io-inspired surface | [`Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md), [`Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md), [`Design/04-visual-and-interaction-direction.md`](../Design/04-visual-and-interaction-direction.md) |

## Coverage result

All explicit owner rule families are now represented in an owning canonical document. This audit
found and corrected these omissions in the first documentation pass:

- a successful siege now has a separate attacker reward transfer, distinct from field cargo and the
  defender penalty;
- the breach baseline now records one-level soldier or military-upgrade loss as well as shelter
  level loss;
- the upgrade directions now name shelter protection, sensing, army quantity and attributes,
  equipment, boots, and turret quantity or attack;
- the Starve.io-inspired tool rule now includes the illustrative one-unit/two-unit progression; and
- player rest inside the shelter and a gatherer's tool-based fallback combat posture are explicit.

The later owner clarification closes the only source ambiguity: “disappears” refers to the soldier's
unbanked cargo, not to the monster. The canonical rule destroys that cargo, preserves ordinary
same-identity respawn unless breach state prevents it, and keeps the killer in the normal monster
state machine.

The later owner decision fixes the first-slice map and presentation profile: two shelters at least
80 logical tiles apart on a 128 × 128 map, Wood and Rock as the visible resources, and a minimal 2D
surface whose smoothness comes from a server `client_snapshot` stream plus client interpolation. Production scale and
final visual assets remain open.

## Owner requirement coverage

| Owner requirement | Canonical authority | Result |
|---|---|---|
| Open, continuously advancing world; backend/world clock continues while offline | [`World/00-world-overview.md`](../World/00-world-overview.md), [`Mechanics/01-world-simulation.md`](../Mechanics/01-world-simulation.md), [`Decisions/ADR-GAME-0002-continuous-world-and-mission-authority.md`](../Decisions/ADR-GAME-0002-continuous-world-and-mission-authority.md) | Captured; restart durability is a target, not a runtime claim |
| Generated resources, monsters, terrain, and other players | [`World/02-world-generation-and-zones.md`](../World/02-world-generation-and-zones.md), [`Characters/04-other-players-and-world-actors.md`](../Characters/04-other-players-and-world-actors.md) | Captured |
| Starter shelter, sensing radius, turret, five soldiers, and protected home | [`Blueprint/00-game-blueprint.md`](../Blueprint/00-game-blueprint.md), [`Characters/01-player-and-shelter.md`](../Characters/01-player-and-shelter.md) | Captured |
| Shelter upgrades for protection, sensing, soldiers, weapons, boots, and turrets | [`Mechanics/04-resources-tools-and-economy.md`](../Mechanics/04-resources-tools-and-economy.md) | Captured as a branch shape; prices, caps, and exact prerequisites remain open |
| Roles: guard, gather, hunt, and siege; role and tool lock outside shelter | [`Mechanics/03-soldier-roles-and-missions.md`](../Mechanics/03-soldier-roles-and-missions.md), [`Characters/02-soldiers-and-roles.md`](../Characters/02-soldiers-and-roles.md) | Captured; one active mission and passive encounter interrupts are explicit |
| Player avatar can rest at home, explore with directional movement, and reveal a fogged map | [`Characters/01-player-and-shelter.md`](../Characters/01-player-and-shelter.md), [`Design/02-map-fog-and-exploration.md`](../Design/02-map-fog-and-exploration.md) | Captured, including W-A-S-D as the reference control |
| Shelter sensing, soldier sensing, routes, pathfinding, and contact-triggered encounters | [`Mechanics/05-detection-pathfinding-and-encounters.md`](../Mechanics/05-detection-pathfinding-and-encounters.md) | Captured; line-of-sight and stale-intel search remain open |
| Resource cargo stays exposed until return and deposit; all types convert to coins without crafting | [`Mechanics/04-resources-tools-and-economy.md`](../Mechanics/04-resources-tools-and-economy.md) | Captured; owner choice overrides the earlier crafting-sink suggestion |
| Travel time and extraction time affect income and risk | [`Blueprint/00-game-blueprint.md`](../Blueprint/00-game-blueprint.md), [`Mechanics/04-resources-tools-and-economy.md`](../Mechanics/04-resources-tools-and-economy.md) | Captured |
| Tool tiers unlock higher resources and increase lower-tier yield | [`Mechanics/04-resources-tools-and-economy.md`](../Mechanics/04-resources-tools-and-economy.md) | Captured with illustrative progression; balance is open |
| Full cargo auto-returns; forced recall queues a return | [`Mechanics/03-soldier-roles-and-missions.md`](../Mechanics/03-soldier-roles-and-missions.md) | Captured |
| Ordinary death is immediate same-identity shelter respawn; the repeatable gathering/hunting assignment resumes and siege ends | [`Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md), [`Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md) | Captured; no respawn cooldown or replacement fee, with travel time, one bounded reissue, and exposed cargo as the cost |
| Field soldiers meet, fight automatically, and the winner takes unbanked PvP cargo | [`Mechanics/05-detection-pathfinding-and-encounters.md`](../Mechanics/05-detection-pathfinding-and-encounters.md), [`Mechanics/06-combat-and-loot.md`](../Mechanics/06-combat-and-loot.md) | Captured; final combat numbers are open |
| Monsters move, seek, attack, differ by speed/attack, and can be hunted for value | [`Mechanics/07-monsters-and-state-machine.md`](../Mechanics/07-monsters-and-state-machine.md), [`Characters/03-monsters.md`](../Characters/03-monsters.md) | Captured; species values and target transitions remain open |
| Clarification: a monster-caused soldier death destroys only unbanked cargo; the killer remains in its normal lifecycle | [`Blueprint/01-raw-discussion-reference.md`](../Blueprint/01-raw-discussion-reference.md), [`Mechanics/detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md), [`Mechanics/detail-14-loot-reward-and-atomic-transfer.md`](../Mechanics/detail-14-loot-reward-and-atomic-transfer.md) | Captured as the clarified baseline rule |
| Siege parties may share a route; ordinary soldiers do not collaborate | [`Mechanics/03-soldier-roles-and-missions.md`](../Mechanics/03-soldier-roles-and-missions.md) | Captured |
| Shelter migration is paid, timed, slower for larger shelters, committed, and uncancellable | [`Mechanics/02-shelter-and-migration.md`](../Mechanics/02-shelter-and-migration.md) | Captured; numerical timing and destination constraints are open |
| Migration veil uses one default charge, recharges, can be bought, hides fresh location, and stops turrets | [`World/01-magic-and-lore.md`](../World/01-magic-and-lore.md), [`Mechanics/02-shelter-and-migration.md`](../Mechanics/02-shelter-and-migration.md) | Captured; exact attack-window semantics remain event-order dependent |
| Existing field soldiers continue and return to the moving home anchor during migration | [`Mechanics/02-shelter-and-migration.md`](../Mechanics/02-shelter-and-migration.md) | Captured |
| Discovery of an enemy shelter requires personal exploration and a return-home intelligence handoff | [`Mechanics/05-detection-pathfinding-and-encounters.md`](../Mechanics/05-detection-pathfinding-and-encounters.md), [`Scenarios/03-attack-and-migration.md`](../Scenarios/03-attack-and-migration.md) | Captured |
| Breach ends field missions; outside soldiers lose magic and become roaming monsters; inside soldiers remain | [`Mechanics/08-breach-and-corruption.md`](../Mechanics/08-breach-and-corruption.md), [`Scenarios/04-shelter-breach.md`](../Scenarios/04-shelter-breach.md) | Captured |
| Breach reduces value and levels; attacker receives siege value separately | [`Mechanics/08-breach-and-corruption.md`](../Mechanics/08-breach-and-corruption.md), [`Mechanics/06-combat-and-loot.md`](../Mechanics/06-combat-and-loot.md) | Captured as a deterministic 50% / one-level baseline; reward share and random variant remain open |
| Global leaderboard records player progress using coins or score | [`World/00-world-overview.md`](../World/00-world-overview.md), [`Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md) | Captured; ranking metric is open |
| Dashboard explains mission, route, cargo, death cause, outcome, and next strategy | [`Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md), [`Mechanics/08-breach-and-corruption.md`](../Mechanics/08-breach-and-corruption.md) | Captured |
| Re-entry Core receives typed backend events; Agent returns to the same page and uses current WebMCP tools | [`Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md), [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md), [`Scenarios/05-reentry-agent-loop.md`](../Scenarios/05-reentry-agent-loop.md) | Captured as target mechanism; no runtime proof claimed |
| Both game concepts are intended to receive an MVP before final selection | [`00-current-status.md`](../00-current-status.md), [`Blueprint/01-raw-discussion-reference.md`](../Blueprint/01-raw-discussion-reference.md) | Captured as project intent; no task decomposition or implementation claim |
| Starve.io is a gameplay and client-surface reference, not a copied backend stack | [`Research/01-starve-io-reference.md`](../Research/01-starve-io-reference.md) | Captured with verified/unknown boundary |
| MVP uses a larger map with at least two separated players, Wood plus Rock, and a smooth minimal 2D presentation | [`Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md), [`Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md) | Captured as an accepted MVP profile; production scale remains open |
| Documentation is modular and source-of-truth-first; the initial task decomposition waits for the runtime gate | [`Docs/README.md`](../README.md), [`Decisions/ADR-GAME-0001-documentation-authority-and-initial-baseline.md`](../Decisions/ADR-GAME-0001-documentation-authority-and-initial-baseline.md) | Captured as the historical initial-pass decision; bounded implementation tasks were later admitted after CP-02 and CP-03 |
| “Codeas Mirror” means “Codex Memory” | [`Research/02-documentation-pattern-research.md`](../Research/02-documentation-pattern-research.md), [`Blueprint/01-raw-discussion-reference.md`](../Blueprint/01-raw-discussion-reference.md) | Captured and controlling reference corrected |

## Assistant suggestions: accepted, overridden, or still open

### Accepted or promoted as working decisions

- The initial decomposition into world rules, player play, Agent play, Re-entry Core, WebMCP tools,
  human boundaries, MVP scope, and loophole review was carried into this child documentation map;
  the later owner-requested modules give each area its own authority.
- Durable world snapshot, event history, restart recovery, and an outbox were promoted because the
  owner required a hosted world that continues while offline.
- Scheduled milestones, spatial indexing, cached pathfinding, server authority, atomic cargo
  transfer, idempotency, and dashboard causal history were promoted as the simple efficient shape.
- Role/tool lock, weak gatherer fallback combat, hunter and siege specialization, siege-party shared
  movement, moving `home_anchor`, a damaged breach core, and a human consequence boundary were
  promoted into the owning documents.
- Immediate same-identity respawn without a cooldown or replacement fee was retained; repeatable
  gathering and hunting assignments receive one danger-cell-avoiding reissue from the shelter, while
  siege remains one-shot.
- The owner's clarification was promoted: a monster-caused soldier death destroys only unbanked
  cargo, does not reward the killer, and leaves the killer in the normal monster state machine.
- A deterministic breach baseline was promoted: 50% defender-held value reduction and one-level
  shelter plus soldier or military-upgrade loss, with an exactly-once attacker reward left to tune.
- The shared combat formula is recorded as a readable placeholder, while the owner explicitly kept
  final numbers for co-design.

### Explicitly overridden by the owner

- The earlier suggestion to give resource types crafting or upgrade-specific sinks was rejected for
  this baseline: Wood, Rock, and gold-bearing material remain typed cargo that converts to different
  coin amounts at shelter deposit.
- The earlier concern about attrition or respawn cooldown was resolved by keeping immediate
  same-identity respawn; the cost is lost cargo and the time required to travel back to the mission.
- A field soldier cannot switch from gathering to attack in place; it must return to the shelter and
  receive the role, tool, target, and route again.
- A breach does not permanently delete the player; it ends field missions and turns exposed soldiers
  into roaming monsters while inside soldiers and a damaged core remain.

### Not explicitly accepted; intentionally still `TARGET` or `OPEN`

These were useful design proposals but were not promoted to owner-confirmed facts: active-region time
compression, a four-times migration cooldown or fixed thirty-minute minimum, a two-charge cap, a
population beyond the accepted two-player MVP and its exact demo choreography, a season-score formula,
exact state-specific tool names, a full Agent authority matrix, a siege loot cap, and anti-farming
rules. They remain targets or open questions in the relevant modules.

## Remaining gates

The audit finds no unrecorded explicit owner rule. The next decisions still required for the broader
playable game are:

1. Post-G2 combat tuning, party aggregation, and representative PvP/PvE/siege cases; G2 cadence,
   formula, and seeded actor values are fixed.
2. Production world dimensions, world-time scaling, active population, and resource/monster spawn
   rates beyond the accepted two-player MVP profile.
3. Full economy values beyond the accepted Wood/Rock slice, tool-tier values, upgrade prices, caps,
   and leaderboard metric.
4. Breach repair duration/cost, attacker reward share/cap, and random-versus-deterministic penalty policy.
5. Migration cooldown, stored-charge cap, visibility during committed assault, and stale-intel search.
6. Final hosted runtime topology, deployment, and proof of always-on persistence.

These are deliberately visible in [`Docs/00-current-status.md`](../00-current-status.md); none is
silently filled with an invented final value.
