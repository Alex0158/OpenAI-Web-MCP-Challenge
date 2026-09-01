# Game Blueprint — Sleepless Kingdom

**Role:** Canonical product concept  
**Status:** Working concept baseline from the owner discussion  
**Implementation:** Not started  
**Working title:** Sleepless Kingdom (provisional)

## One-sentence concept

A player builds and moves a magical shelter in a persistent open world, dispatches role-locked
soldiers to gather, hunt, defend, and raid, and later uses a bounded Agent to resume the same visible
world after a meaningful backend event changes the situation.

## The player problem

Most game interactions assume that the player remains present to issue every next command. That
model makes a persistent world feel paused when the player leaves and gives an Agent little to do
except send a notification or issue a new, contextless request. This game creates durable work with
real consequences: a soldier leaves, spends time travelling, carries exposed value, may encounter
another actor, may die, may return, or may be lost when the shelter is breached.

## The player promise

The player can express a doctrine, choose risk, and return to a world that has continued. The
player sees what happened, why it happened, what was lost, and what decisions are now available.
The Agent can pick up that same situation from the authoritative page without inventing a new task
or bypassing the game's rules.

## Design pillars

1. **Persistent world:** world time, resources, monsters, missions, movement, and player shelters
   advance while a player is away.
2. **Role-locked agency:** a soldier's job and equipment create meaningful preparation; a field
   soldier does not become a different job mid-route.
3. **Time-risk economy:** income is shaped by travel, extraction time, cargo capacity, detection,
   encounters, and the chance of losing unbanked cargo.
4. **Visible causality:** the dashboard records mission, route, cargo, encounter, result, death
   cause, and next available action.
5. **Strategic mobility:** migration can hide a shelter, but it costs money, disables turrets, and
   consumes a scarce stealth resource.
6. **Consequential continuity:** shelter breach can turn field soldiers into world monsters, making
   the world remember the player's setback.
7. **Human boundary:** an Agent may inspect and prepare bounded actions; irreversible high-consequence
   actions remain visible and subject to the designed human boundary.

## Core loop

```text
explore the fogged map
-> discover resources, monsters, or another shelter
-> return with intelligence
-> assign role, tool, target, route, and return policy
-> server simulates travel and work
-> soldier encounters an actor or fills its pack
-> cargo returns or is lost
-> shelter deposits cargo into coins
-> player or Agent reviews the causal report
-> upgrade, defend, relocate, hunt, or raid
```

## Starting state

The current baseline is a starter shelter with a bounded detection radius, a turret, a basic
upgrade path, and five soldiers. The player can keep soldiers at home for defense, send them to
collect resources, send them to hunt monsters, or form a siege party after discovering a target
shelter. A global leaderboard records each player's progress; whether it ranks coins, score, or a
combined measure remains open.

## Rules that define the current concept

- The backend is the authority for world time, location, mission state, cargo ownership, combat,
  shelter state, and rewards.
- A mission locks its role and equipment until the soldier returns, dies, or reaches a mission
  terminal state.
- A full backpack starts a return. A forced recall requests a return and preserves travel risk.
- Resources convert to coins at shelter deposit. A soldier's exposed cargo remains lootable or
  losable until that point.
- The global leaderboard projects player progress from a metric that is still open for balance
  design.
- A successful shelter breach creates a separate siege reward transfer from the defender's
  shelter-held value; the exact share and cap remain open.
- Ordinary soldier death is an instant respawn at the shelter with the same soldier identity and no
  respawn cooldown or replacement fee in this baseline. The repeatable gathering or hunting
  assignment is reissued under its recorded restart policy; siege ends.
- A migration is paid, committed, un-cancellable, stealthy, and turret-disabled. New field
  deployments wait until the shelter arrives; existing field soldiers continue and follow a moving
  home anchor when returning.
- A breach ends field missions and converts field soldiers into uncontrolled roaming monsters.
- A monster killing a soldier destroys only that soldier's unbanked cargo; the soldier's ordinary
  respawn still applies and the killer remains in the normal monster state machine.

## Out of scope for this baseline

The two-player MVP profile now fixes a 128 × 128 logical-tile map, a minimum 80-tile shelter
separation, Wood and Rock as the first resource types, and a minimal Canvas 2D presentation. The
concept still does not fix the full production map scale, exact damage values, upgrade prices, art
assets, database schema, authentication, monetization, or final hosted service topology. Those are
owned by the relevant modules and decisions once accepted.
