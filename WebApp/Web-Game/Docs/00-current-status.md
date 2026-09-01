# Sleepless Kingdom — Current Status

**Role:** Canonical current status for the game child application  
**As of:** 2026-09-01, Europe/London  
**Stage:** Documentation baseline and delivery roadmap; implementation not started  
**Working title:** Sleepless Kingdom (provisional)  
**Implementation:** Not started  
**Outer host selection:** Unselected

The owner intends to produce MVPs for this game and the separate RightSpot candidate before making
the final concept selection. This child currently records the game concept and target delivery roadmap;
implementation task creation has not started.

## Current outcome

The blank `WebApp/Web-Game/` folder now has a modular documentation architecture, a preserved
owner-source reference, an accepted two-player MVP profile, and a sequenced delivery roadmap. The
decomposition currently tracks 19 atomic mechanisms, 8 player-facing capabilities, and 11
cross-mechanism logic chains. The concept is coherent enough to close the MVP contract and runtime
capability gates before creating a bounded implementation task. Balance, production topology, exact
event ordering, and several Re-entry authority details remain open. No implementation, deployment,
runtime, or judge claim follows from this documentation work.

The owner has agreed with the other proposed MVP defaults, including the deterministic combat contrast
and the discovered-landmark presentation. Re-entry action authority and the protected-start boundary
remain the two clarification gates before CP-01 promotion.

The structural coverage result and cross-boundary gaps are recorded in
[`Validation/02-mechanism-boundary-and-chain-audit.md`](Validation/02-mechanism-boundary-and-chain-audit.md).
The roadmap-driven decisions and edge cases are recorded in
[`Validation/03-roadmap-gap-audit.md`](Validation/03-roadmap-gap-audit.md).
Recommended defaults and chain-level UX contracts for closing those decisions are recorded in
[`Validation/04-mvp-decision-proposals.md`](Validation/04-mvp-decision-proposals.md).

## Working concept baseline

- The game is an open, continuously advancing magical world.
- A player's shelter is a protected command base with resource sensing, soldiers, upgrades, and
  turrets.
- Soldiers have role-locked missions and tools: gathering, hunting, siege, or shelter defense.
- Soldiers travel through the world, collect cargo, detect actors, and automatically engage when an
  encounter becomes contact.
- Cargo is not converted to coins until it reaches the shelter; exposed cargo can be lost or looted.
- A full pack automatically starts a return. A forced recall queues a return and does not teleport a
  soldier.
- Soldiers respawn instantly at the shelter after ordinary death, keep their identity, and have no
  respawn cooldown or replacement fee in this baseline. Their repeatable gathering or hunting
  assignment is reissued under its restart policy, so the cost is travelling back; siege ends on
  death.
- A shelter migration costs currency, cannot be cancelled, consumes a stealth charge, hides the
  shelter from new discovery, stops turrets, and allows existing field missions to continue.
- Stealth recharges automatically after cooldown and additional charges may be purchased at high
  cost.
- A shelter breach ends active missions. Field soldiers lose the shelter's magic and become roaming
  monsters; soldiers inside survive as part of the damaged shelter state.
- The deterministic breach baseline reduces defender-held value by 50%, lowers shelter and soldier
  upgrade levels by one within minimum bounds, and gives the attacker a separately recorded siege
  reward whose exact share remains open.
- A monster killing a soldier destroys only that soldier's unbanked cargo; the soldier still
  respawns unless the shelter has breached, and the killer remains in the normal monster state
  machine.
- A global world leaderboard records player progress; the ranking metric (coins, score, or both) is
  still open.
- Re-entry Core receives typed backend events, returns an Agent to the canonical page, and lets the
  Agent read current state and perform one bounded WebMCP action.
- The accepted MVP profile uses one seeded 128 × 128 map with two protected player shelters at least
  80 tiles apart, five starter soldiers per shelter, and symmetric Wood and Rock nodes near each
  start. The full production map and population can grow later.
- The accepted MVP presentation is a minimal top-down Canvas 2D surface with React controls and
  overlays. A server snapshot stream targets about 10 Hz while the browser renders up to 60 FPS with
  interpolation; the server remains authoritative for all outcomes.

## Open design gates

1. Combat numbers and matchup modifiers remain to be co-designed.
2. The accepted two-player MVP map is fixed; production world scale, active population, and spawn
   rates remain open.
3. Shelter repair timing after a breach needs one simple accepted rule.
4. The accepted MVP cargo and node values need playtest calibration; full upgrade pricing and caps
   remain open.
5. Last-known-position expiry and siege failure at a moved target need confirmation.
6. The siege reward share/cap and the precise leaderboard metric need confirmation.
7. The MVP stack boundaries are accepted for the slice; final hosted topology and its proof remain
   open.

## Recommended next step

The next action is CP-01, a versioned MVP contract sheet that reviews the proposed defaults and closes
identity, coordinates, protected starts, event ordering, persistence versions, snapshot shape, combat,
economy, and cargo settlement. Follow it with
CP-02, a short capability and runtime probe for the selected Node worker, Canvas page, realtime
transport, durable store, and genuine page-bound WebMCP surface. Only after those gates pass should a
bounded implementation task be created. Keep combat values, spawn rates, prices, and visual assets or
polish as tunable MVP configuration.

The accepted first slice is: one seeded 128 × 128 map, two protected shelters at least 80 tiles
apart, five soldiers per player, symmetric Wood and Rock nodes, one seeded monster, one gather
mission, one monster encounter, cargo loss on a monster-caused death, same-identity respawn and
mission reissue, a causal dashboard history, and one event-to-page WebMCP read or bounded action. It
must survive a browser disconnect and a local process restart by replaying durable world time. The
build boundary and implementation profile are recorded in
[`Engineering/07-hackathon-mvp-build-gate.md`](Engineering/07-hackathon-mvp-build-gate.md).

The complete sequence, dependencies, release gates, and checkpoint closure packet are recorded in
[`Engineering/08-development-roadmap-and-checkpoints.md`](Engineering/08-development-roadmap-and-checkpoints.md).

## Current non-claims

This folder does not yet prove a running server, persistent database, pathfinding implementation,
Canvas renderer, WebSocket transport, WebMCP registration, Agent wake path, public hosting,
performance, balance, anti-cheat, or Hackathon submission readiness.
