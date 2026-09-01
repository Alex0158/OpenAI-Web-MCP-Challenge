# Game Decisions

This index owns durable choices made for the game child application. A decision here must state its
scope, alternatives, consequences, and reopen triggers. Exploratory ideas remain in Blueprint,
Research, or a Scenario until accepted.

- [`ADR-GAME-0001-documentation-authority-and-initial-baseline.md`](ADR-GAME-0001-documentation-authority-and-initial-baseline.md)
  — modular documentation structure and source/reference separation;
- [`ADR-GAME-0002-continuous-world-and-mission-authority.md`](ADR-GAME-0002-continuous-world-and-mission-authority.md)
  — persistent world, server authority, role-locked missions, cargo, death, migration, and breach;
- [`ADR-GAME-0003-combat-formula-co-design-boundary.md`](ADR-GAME-0003-combat-formula-co-design-boundary.md)
  — keeps combat variables explicit while leaving final numbers open;
- [`ADR-GAME-0004-mechanism-capability-and-chain-decomposition.md`](ADR-GAME-0004-mechanism-capability-and-chain-decomposition.md)
  — separates atomic mechanisms, player capabilities, and cross-mechanism logic chains.
- [`ADR-GAME-0005-mvp-world-and-rendering-profile.md`](ADR-GAME-0005-mvp-world-and-rendering-profile.md)
  — fixes the two-player MVP map/resource profile and a smooth minimal 2D presentation target;
- [`ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
  — accepts the versioned G2 contract, protected start, deterministic combat, and bounded Re-entry action.
