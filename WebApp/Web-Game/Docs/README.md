# Sleepless Kingdom Documentation Map

**Role:** Application documentation authority map
**Status:** Active authority map
**Last updated:** 2026-09-02

## 1. Purpose

This directory is the single entry point for Sleepless Kingdom product, world, mechanics, design,
engineering, process, task, issue, decision, and evidence documentation.

Authority is federated. The document that owns a question decides that question. Current code,
tests, and runtime evidence decide implemented and deployed behavior; no document can decide that on
their behalf.

## 2. Authority order

For non-trivial work:

1. read [`00-Workflow/README.md`](00-Workflow/README.md) to classify the task, risk profile,
   evidence, registration, verification, and closure requirements;
2. read [`00-current-status.md`](00-current-status.md) for current application truth;
3. read the module document that owns the question;
4. read the controlling `ADR-GAME-*` decision and any Chain or Scenario that constrains ordering;
5. check [`Issues/`](Issues/README.md) before changing a behavior or cross-boundary contract;
6. check [`Tasks/`](Tasks/README.md) for the active bounded work and its next gate; and
7. use [`Evidence/`](Evidence/README.md) and [`Research/`](Research/README.md) to support a claim,
   never to redefine product truth.

When documents, code, tests, or runtime evidence conflict:

1. identify the question and its owning authority;
2. record the contradiction instead of silently choosing the convenient source;
3. use current code or runtime only to determine implemented behavior, not intended rules;
4. stop implementation when the conflict touches world authority, identity, settlement, event
   ordering, the Re-entry boundary, or a `SK-MVP-*` contract rule; and
5. reconcile the owning document before closing the increment.

## 3. Authority layers

| Area | Owns | Does not own |
|---|---|---|
| [`00-current-status.md`](00-current-status.md) | Current phase, claims, assumptions, and next gate | Module rules or procedure |
| [`00-Workflow/`](00-Workflow/README.md) | Operating loop, risk profiles, Challenge gate, verification ladder, closure labels, session runbook, and test/verification procedure | Any game behavior |
| [`Blueprint/`](Blueprint/README.md) | Product thesis, pillars, game boundary, competition thesis, and preserved owner source | Detailed mechanism rules |
| [`World/`](World/README.md) | Setting, magic, world time, map, and lore rules | Implementation shape |
| [`Mechanics/`](Mechanics/README.md) | Atomic state transitions under `detail-*`; cross-mechanism ordering under `Chains/` | User-facing contracts |
| [`Characters/`](Characters/README.md) | Player, shelter, soldier, monster, and role semantics | Balance values |
| [`Design/`](Design/README.md) | Player experience, capability contracts, map, dashboard, visual direction, demo framing | Authoritative state rules |
| [`Engineering/`](Engineering/README.md) | Target stack, architecture, persistence, simulation, WebMCP obligations, roadmap, and the `SK-MVP-0.2` contract sheet | Product desirability |
| [`Decisions/`](Decisions/README.md) | Accepted durable choices as `ADR-GAME-*` and their consequences | Current status or evidence |
| [`Tasks/`](Tasks/README.md) | Bounded work lifecycle as `SK-TASK-*` | Product behavior or evidence |
| [`Issues/`](Issues/README.md) | Verified defects, contradictions, and blocking uncertainty as `SK-ISSUE-*` | Planned work or specifications |
| [`Evidence/`](Evidence/README.md) | Fresh verification results and claim limits as `SK-EVID-*` | Product policy |
| [`Validation/`](Validation/README.md) | Concept coherence audits and future proof obligations | Proof itself |
| [`Scenarios/`](Scenarios/README.md) | Concrete examples that exercise canonical rules | New rules |
| [`Research/`](Research/README.md) | External observations and pattern references | Product truth |
| [`Templates/`](Templates/README.md) | Reusable record envelopes | Completed records |

## 4. Directory topology

```text
Docs/
  README.md
  00-current-status.md
  00-Workflow/
  Blueprint/
  World/
  Mechanics/
    Chains/
  Characters/
  Design/
    Capabilities/
  Engineering/
  Decisions/
  Tasks/
  Issues/
  Evidence/
  Validation/
  Scenarios/
  Research/
  Templates/
```

A directory exists only when it has real content. Do not create an empty state or index directory in
advance.

## 5. Layering rules

1. `00-Workflow/` defines how work proceeds; it never defines game behavior.
2. `Blueprint/` states the product promise; module documents state the rules that keep it.
3. `Mechanics/detail-*` owns one atomic rule; `Mechanics/Chains/` owns ordering across rules;
   `Design/Capabilities/` owns one player-facing contract.
4. `Engineering/` owns the target architecture and the normative first-slice contract.
5. `Decisions/` owns durable choices; a decision changes current truth only after the owning module
   and `00-current-status.md` are reconciled.
6. `Tasks/` coordinates bounded work; it cannot redefine specifications or turn a plan into evidence.
7. `Issues/` tracks verified problems; it does not replace a specification.
8. `Evidence/` supports claims; evidence context never becomes product policy on its own.
9. `Validation/` is a proof plan, not proof.
10. `Research/` and the raw discussion reference are supporting or historical only.

## 6. Two label vocabularies

These are separate and must not be mixed.

**Document status labels** describe how settled a statement is:
`VERIFIED`, `DECIDED`, `WORKING DECISION`, `WORKING ASSUMPTION`, `TARGET`, `OPEN`, `UNKNOWN`,
`REFERENCE`, `NON-CLAIM`.

**Closure labels** describe how far a piece of work actually got, and are defined in
[`00-Workflow/README.md`](00-Workflow/README.md#12-closure).

## 7. README contract

Every scoped `README.md` does only four things:

1. state the directory's responsibility and authority boundary;
2. route readers to the current authoritative entries;
3. state what must not be placed there; and
4. define maintenance and conflict rules.

A scoped README must not accumulate task narration, round-by-round history, command output, or a
second status register.

## 8. Maintenance rules

Before adding a document:

1. identify the question it owns;
2. search for an existing owner that can absorb it;
3. decide whether the content is current truth, a task, an issue, a decision, evidence, or history;
4. update an existing authority when it can own the content without ambiguity;
5. create a new document only when its identity and maintenance responsibility are distinct;
6. add it to the nearest scoped README; and
7. verify links, English-only content, and the absence of duplicated authority.

Rewrite current truth in place. Do not append conversational or round-by-round history to a
specification. Close mechanical documentation work with
`python3 scripts/validate_game_docs.py --root .` from the application root.
