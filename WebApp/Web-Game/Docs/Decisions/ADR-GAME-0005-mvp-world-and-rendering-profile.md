# ADR-GAME-0005: MVP World and Rendering Profile

**Status:** ACCEPTED MVP PROFILE; PRODUCTION SCALE OPEN  
**Date:** 2026-09-01

## Decision

The first playable slice uses one deterministic 128 × 128 logical-tile map with two player
shelters. Their starting shelters are placed symmetrically and at least 80 tiles apart, each with a
protected start zone, five starter soldiers, one Wood node, and one Rock node. The fixed seed is
`sleepless-mvp-01`; a small seeded monster supplies the first PvE pressure. The two resource types
are equal-weight cargo units. Wood converts to one coin and Rock to three coins at shelter deposit;
Gold remains a later progression tier.

The presentation follows a Starve.io-inspired minimal top-down 2D direction without copying its
assets, code, branding, or unverified backend assumptions. The page uses Canvas 2D for the world and
React for controls, dashboard, and overlays. The server remains authoritative: movement and sensor
simulation may step at 100 ms, combat and extraction settle on one-world-second boundaries, the
server publishes snapshots at about 10 Hz, and the browser renders at up to 60 FPS with interpolation.
Typed HTTP commands remain the mutation boundary; WebSocket is the preferred snapshot channel after
an early capability probe, with polling retained only as a diagnostic fallback.

The target implementation profile is Next.js App Router, React, and TypeScript for the page; a
Node.js 24 TypeScript worker for the world; SQLite WAL for the local harness; PostgreSQL for hosted
durability; and a transactional outbox into Re-entry Core. These are accepted MVP boundaries, not a
claim that the complete production topology or final balance has been selected.

## Consequences

Two players are visible in the same world without forcing an immediate PvP encounter. Symmetric
Wood and Rock access makes the first economy legible while the 80-tile separation leaves room for
exploration, monster pressure, and later intelligence-driven conflict. Canvas avoids a DOM node per
actor, and interpolation hides normal network jitter while the worker remains the only authority.

The first build must probe WebSocket early and show a visible degraded state if it is unavailable; it
must not silently make the browser authoritative. Map expansion, concurrent population, resource
density, exact visual assets, and the hosted database/worker arrangement remain tunable or open.

## Reopen triggers

Reopen if measured snapshot or pathfinding cost exceeds the two-player MVP budget, if the chosen host
cannot keep the worker alive, if WebSocket capability is unavailable without an acceptable fallback,
or if the owner changes the two-player, Wood-plus-Rock, or minimal 2D presentation direction.
