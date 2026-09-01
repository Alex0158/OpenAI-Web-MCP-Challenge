# Sleepless Kingdom

**Working title:** Sleepless Kingdom (provisional)  
**Role:** Persistent-world game candidate inside the WebMCP Challenge repository  
**Stage:** Documentation-first concept baseline; implementation has not started  
**Outer selection:** The Re-entry Core host-application decision remains pending

## Product thesis

Sleepless Kingdom is a persistent magical frontier in which a player's shelter dispatches
role-locked soldiers into an always-advancing world. Soldiers travel, gather, hunt, detect other
actors, fight, carry unbanked resources, and return without requiring the player to micromanage every
moment. Backend events preserve the causal history of what happened and can invite a bounded Agent
back into the canonical game page. The Agent reads the current world, discovers the page's current
WebMCP tools, continues one safe piece of work, and stops at the human consequence boundary.

The game is valuable to the challenge when the world would continue without the player and the
Agent's re-entry is useful because a meaningful event changed the player's situation. The game is
not a wrapper around a notification or a simulated task queue.

## Initial world loop

```text
shelter
-> assign a role, tool, target, route, and return policy
-> server-authoritative travel and work
-> resource discovery or actor encounter
-> deterministic battle or collection result
-> cargo remains at risk until shelter deposit
-> return, deposit, and convert resources to coins
-> event history updates the dashboard
-> human or Agent chooses the next bounded action
```

The current concept includes a fog-of-war player avatar, movable shelters, shelter detection,
role-locked missions, automatic encounters, monsters with their own state machine, siege parties,
resource/tool tiers, shelter breach, and the conversion of exposed soldiers into roaming monsters.

## Documentation map

- [`Docs/README.md`](Docs/README.md) — authority map and reading order;
- [`Docs/00-current-status.md`](Docs/00-current-status.md) — current state and claim boundary;
- [`Docs/Blueprint/`](Docs/Blueprint/) — game blueprint, competition thesis, and raw source reference;
- [`Docs/World/`](Docs/World/) — magical setting and continuous-world rules;
- [`Docs/Mechanics/`](Docs/Mechanics/) — 19 atomic mechanisms, family overviews, and 11 cross-mechanism
  logic chains;
- [`Docs/Characters/`](Docs/Characters/) — player, shelter, soldier, monster, and role definitions;
- [`Docs/Design/`](Docs/Design/) — player experience, 8 capability contracts, map, dashboard, and
  presentation direction;
- [`Docs/Engineering/`](Docs/Engineering/) — target stack, server architecture, persistence,
  simulation efficiency, WebMCP, and hosting;
- [`Docs/Scenarios/`](Docs/Scenarios/) — concrete world and re-entry walkthroughs;
- [`Docs/Research/`](Docs/Research/) — Starve.io and documentation-pattern references;
- [`Docs/Decisions/`](Docs/Decisions/) — durable game and documentation choices; and
- [`Docs/Validation/`](Docs/Validation/) — concept coherence and future proof obligations.

## Non-claims

No game server, Canvas client, database, production WebMCP surface, Agent adapter, public
deployment, balance result, or Hackathon proof exists in this folder yet. The proposed stack and
rules are targets or working decisions until implementation and evidence say otherwise.
