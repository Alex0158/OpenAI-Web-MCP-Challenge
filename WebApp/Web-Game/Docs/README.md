# Sleepless Kingdom Documentation Map

**Role:** Child-application documentation authority map  
**Status:** Initial concept baseline  
**Parent authority:** `../AGENTS.md` and `../../../Docs/README.md`

For the complete mechanism, capability, and cross-mechanism chain inventory, start with
[`Mechanics/00-mechanism-inventory-and-gaps.md`](Mechanics/00-mechanism-inventory-and-gaps.md) and
[`Validation/02-mechanism-boundary-and-chain-audit.md`](Validation/02-mechanism-boundary-and-chain-audit.md).

## Authority layers

| Area | Owns | Status boundary |
|---|---|---|
| `00-current-status.md` | Current phase, claims, assumptions, and next concept gate | Current truth only |
| `Blueprint/` | Product thesis, problem, pillars, game boundary, and source wording | Canonical concept; raw source remains reference |
| `World/` | Setting, magic, world time, map, and lore rules | Canonical world behavior |
| `Mechanics/` | Atomic state transitions and rules under `detail-*`, plus cross-mechanism chains under `Chains/` | Canonical gameplay behavior |
| `Characters/` | Player, shelter, soldiers, monsters, and role definitions | Canonical actor semantics |
| `Design/` | Player experience, capability contracts, map presentation, dashboard, visual direction, and demo framing | Canonical experience intent |
| `Engineering/` | Target stack, authority boundaries, persistence, simulation, operations, WebMCP obligations, and delivery roadmap | Target architecture and roadmap until verified |
| `Scenarios/` | Concrete examples that exercise the canonical rules | Supporting behavioral examples |
| `Research/` | External observations and pattern references | Supporting evidence; never silently becomes product truth |
| `Decisions/` | Accepted durable choices and consequences | Decision authority for named choices |
| `Validation/` | Concept checks and future evidence gates | Proof plan, not proof |

## Reading rule

For a product or mechanics change, read `00-current-status.md`, the owning Blueprint, World, atomic
Mechanic detail, Character, Design capability, or Engineering document, and any controlling Decision,
Chain, and Scenario. The raw source reference is read when recovering what the owner actually said.
Do not treat a research observation, scenario, chain illustration, or implementation target as a
decision without an explicit promotion.

## Status labels

Use `VERIFIED`, `DECIDED`, `WORKING DECISION`, `WORKING ASSUMPTION`, `TARGET`, `OPEN`, `UNKNOWN`,
`REFERENCE`, and `NON-CLAIM` where status could change a decision. A described server or feature is
not implementation evidence.

## Documentation principles

- Split by independent authority, lifecycle, consumer, or update cadence.
- Keep one file per atomic mechanism, one file per player-facing capability, and one file per
  cross-mechanism causal chain when that boundary has independent rules or verification evidence.
- Keep the Blueprint concise and link to module owners instead of copying every rule everywhere.
- Keep the raw discussion immutable after initialization except for an explicitly labelled append.
- Avoid one document per source file and avoid copying the full Emorapy tree without a matching
  independent authority boundary.
- Keep implementation tasks out of this initialization increment, as requested by the owner.
- When implementation begins, reconcile current status, decisions, owning modules, code, tests, and
  evidence in that order.
