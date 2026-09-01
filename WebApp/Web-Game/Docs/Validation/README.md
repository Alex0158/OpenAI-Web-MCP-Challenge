# Validation

This module records concept coherence checks now and implementation proof obligations later. It does
not claim that the game is built or balanced.

- [`01-discussion-coverage-audit.md`](01-discussion-coverage-audit.md) — source-to-canonical coverage,
  owner overrides, promoted working decisions, and remaining gates.
- [`02-mechanism-boundary-and-chain-audit.md`](02-mechanism-boundary-and-chain-audit.md) — atomic
  mechanism, player capability, logic-chain coverage, cross-boundary findings, and decision gates.
- [`03-roadmap-gap-audit.md`](03-roadmap-gap-audit.md) — roadmap-driven MVP decisions, edge cases,
  full-game gates, and the next design order.
- [`04-mvp-decision-proposals.md`](04-mvp-decision-proposals.md) — owner-accepted defaults, chain
  contracts, UX acceptance, and contract revision checklist.

## Current concept checks

- The world clock continues independently of browser presence.
- Every soldier has one explicit role, tool, mission, route, and return policy.
- Cargo remains exposed until shelter deposit.
- Detection, contact, combat, loot, death, respawn, and mission termination have an ordered path.
- Migration has cost, commitment, visibility, turret, destination, and field-soldier behavior.
- Breach explains what happens to inside and outside soldiers.
- A successful siege records an attacker reward separately from the defender penalty and field cargo.
- Shelter, soldier, equipment, turret, and sensing upgrade directions are represented without
  pretending that prices or caps are final.
- A monster-caused soldier death preserves same-identity respawn while destroying exposed cargo.
- The global leaderboard has an explicit, reviewable ranking metric before balance claims are made.
- Events contain enough causal history for a human or Agent to understand the next decision.
- WebMCP remains a page action surface; backend authority and Re-entry Core remain separate.

## Future evidence gates

1. Documentation consistency and link validation.
2. Domain state-machine and combat example tests.
3. Persistent world-clock and restart recovery.
4. Multi-actor encounter and atomic cargo transfer.
5. Migration concealment, turret shutdown, and moving home anchor.
6. Breach conversion without duplicate soldier entities.
7. Normal human game loop without WebMCP.
8. Genuine page-bound WebMCP registration and current-state tool discovery.
9. Bounded Re-entry Core continuation with a visible human boundary.
10. Hosted health, deployment, and judge reproduction.

## Non-claims

A written rule, scenario, schema sketch, or local test plan does not prove runtime behavior,
production availability, security, fairness, or Hackathon readiness.
