# ADR-GAME-0004: Mechanism, Capability, and Logic-Chain Decomposition

**Status:** ACCEPTED FOR CONCEPT DOCUMENTATION
**Date:** 2026-09-01
**Scope:** `WebApp/Web-Game/Docs/Mechanics/` and `Docs/Design/Capabilities/`

## Context

The first concept pass grouped several independent rules in eight broad Mechanics files. That made
it difficult to tell which state transition owns a rule, which user capability depends on it, and
where a multi-step outcome such as a breach or re-entry changes authority. The owner asked for every
mechanism, feature, ability, and logic chain to be documented at a reasonable independent boundary
before implementation tasks begin.

## Decision

Use three documentation layers:

1. **Atomic mechanisms:** 19 `detail-*` files in `Mechanics/`. Each owns one state transition,
   authority boundary, failure surface, balance surface, or verification surface.
2. **Player capabilities:** eight files in `Design/Capabilities/`. Each owns a user-facing goal,
   entry state, visible data, available actions, outcomes, and human/Agent boundary.
3. **Logic chains:** eleven files in `Mechanics/Chains/`. Each owns ordered composition across atomic
   mechanisms, event boundaries, failure branches, and cross-mechanism invariants.

The existing eight top-level Mechanics files remain family overviews for orientation. They route to
the atomic detail files and must not introduce a second conflicting rule. The inventory file is the
authoritative map of counts, ownership, links, and gaps.

## Boundary rules

- A mechanism file may be implemented by one worker or transaction with another mechanism, but its
  domain rule remains separately testable and reviewable.
- A capability file does not create backend authority; it points to the mechanism and page contract
  that authorizes the action.
- A chain file does not replace an atomic rule or scenario; it specifies ordering and settlement.
- Scenarios illustrate one path and cannot silently close an `OPEN` value.
- Every unresolved cross-boundary question appears in the inventory and the relevant owner files.

## Alternatives considered

- **Keep eight broad files only:** rejected because detection, pathfinding, combat, loot, migration,
  and breach each have independent failure and transaction boundaries.
- **Create a file for every sentence or data field:** rejected because it would mirror prose or
  implementation rather than a durable authority boundary.
- **Put capabilities in Mechanics:** rejected because user goals and backend state transitions have
  different consumers and update cadence.
- **Put chains only in Scenarios:** rejected because scenarios are examples while chains need to be
  reusable ordering contracts.

## Consequences

The concept can be reviewed requirement by requirement and implemented without hiding authority or
logic in a large document. Cross-links increase maintenance work, so the inventory, family overviews,
capability index, chain index, and current status must be updated together when a boundary changes.
No implementation tasks or code are created by this decomposition increment.

## Reopen triggers

Reopen when implementation proves that two mechanisms share one inseparable authority and test
surface, when a new user capability has no owning mechanism, when a chain requires an unowned state,
or when the owner changes the documentation granularity.
