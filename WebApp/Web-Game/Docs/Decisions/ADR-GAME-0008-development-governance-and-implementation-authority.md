# ADR-GAME-0008: Development Governance and Implementation Authority

**Status:** ACCEPTED DEVELOPMENT GOVERNANCE BASELINE  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation

## Context

The application has an accepted concept baseline, a historical `SK-MVP-0.1` gameplay baseline, an
owner-accepted coherent `SK-MVP-0.2` contract (including the Re-entry delivery revision and G2
geometry/state/vocabulary closure), an accepted visual boundary, and a sequenced roadmap. At the time
of this governance decision it had no code, task lifecycle, issue governance, evidence layer, or
mechanical gate. The outer repository's validators do not scan
`WebApp/Web-Game/`, so nothing currently checks this application's links, language, structure, or
record shape.

The owner already operates a mature development discipline on a separate product. That discipline
separates a short agent guide, a federated documentation authority map, a durable operating loop, a
session execution runbook, task and issue lifecycles with fixed control metadata, an evidence layer
with explicit claim limits, reusable record envelopes, and mechanical validators. The owner asked for
that discipline to be adapted to this application rather than reinvented, and asked that this
application govern its own development independently of the outer WebMCP Challenge process.

Two authority questions had to be answered before the adaptation could be written down: whether this
folder is bound by the outer repository's process, and whether implementation may begin.

## Decision

### 1. Scoped self-governance

This application owns its product truth, development process, task and issue governance, verification
cadence, and closure vocabulary. Outer WebMCP Challenge product documentation, task lifecycle,
engineering runbooks, and claim vocabulary do not govern work inside `WebApp/Web-Game/`.

Four constraints remain inherited because they are physical rather than stylistic:

1. the Git root is `WebMCP_Challenge`, so every branch, stage, commit, and push acts on that
   repository and must stage exact `WebApp/Web-Game/` paths only;
2. `reentry-core/` and `mvp/` are read-only dependencies;
3. every project-authored artifact is English, with non-English owner quotations permitted only
   inside fenced blocks in `Blueprint/01-raw-discussion-reference.md`; and
4. any Devpost eligibility or submission statement remains governed by the live Official Rules.

Importing any further outer rule requires a new accepted `ADR-GAME-*`.

### 2. Governance structure

Adopt the following layers:

- `AGENTS.md` — short, self-contained boundary, routing, authority, and claim guide;
- `Docs/README.md` — federated authority map and layering rules;
- `Docs/00-Workflow/README.md` — the durable operating loop, three risk profiles, evidence map,
  Challenge gate, a seven-level verification ladder, and eleven closure labels;
- `Docs/00-Workflow/01-session-runbook.md` — session ownership, supporting-agent limits, resume
  protocol, coherent increments, verification selection, and Git closure;
- `Docs/Tasks/` — bounded work as `SK-TASK-NNN` with a six-field `Task Control` block;
- `Docs/Issues/` — verified problems as `SK-ISSUE-NNN` with a state model and resolution order;
- `Docs/Evidence/` — executed results as `SK-EVID-NNN` with explicit claim limits;
- `Docs/Templates/` — seven record envelopes; and
- `scripts/validate_game_docs.py` with `scripts/test_validate_game_docs.py` as the mechanical gate.

`Docs/Decisions/` keeps the existing `ADR-GAME-*` identity. No second decision system is created.

### 3. Risk and verification translation

The `Assured` risk profile is defined by this application's own failure surface: world authority,
identity semantics, cargo and coin settlement, event ordering and idempotency, persistence and
`world_snapshot`/`client_snapshot` shape, the WebMCP tool surface, Re-entry action authority, the human consequence boundary,
the `SK-MVP-*` contract version, and hosted deployment.

The verification ladder is defined so that each level maps onto a roadmap release gate: static and
targeted evidence supports G0, process-runtime and capability evidence supports G1, aggregate through
slice-chain evidence supports G2, and hosted closure supports G3. A closure label may never exceed the
ladder level actually reached.

### 4. Implementation authority

Implementation is authorized. The prior documentation-first restriction, which forbade creating
implementation tasks, is lifted.

One gate remains: **CP-02, the capability and runtime probe, must pass or return a recorded
capability decision before CP-03 locks an implementation task and CP-04 begins durable code.** Until
CP-02 closes, code is limited to the disposable probe harness the roadmap describes. The probe
harness must not be mistaken for the game's durable state implementation.

## Alternatives considered

### Keep the outer repository process

Reusing the outer engineering runbooks would avoid a second system, but the outer process is built
around an application-neutral protocol library and its selection gates. Its task lifecycle, claim
vocabulary, and evidence boundaries do not describe a simulation with world time, settlement, and a
browser projection. Adapting it in place would also entangle this application with the RightSpot
lane, which uses a different multi-worktree orchestration model.

### Copy the reference process unchanged

Copying the source discipline's numbered directory topology would preserve familiarity, but this
application already has an established `Docs/` naming style and its own decomposition into
mechanisms, chains, and capabilities. Two parallel naming conventions would create ambiguity about
which map is authoritative.

### Documentation-only governance without validators

Written rules alone would be cheaper, but the outer validators do not scan this directory, so nothing
would detect a broken link, an unintended non-English artifact, a malformed task record, or a missing
required document. A mechanical gate with its own self-tests is the smallest durable control that
changes a real decision.

### Lift the implementation restriction with no gate

Removing the restriction entirely would be faster, but the roadmap identifies CP-02 as the riskiest
early check. Building durable code against an unproven page capability or worker lifetime is the one
failure the roadmap explicitly warns against.

## Consequences

Work inside this folder now has one entry point, one classification step, one registration decision,
one verification ladder, and one closure vocabulary. A claim can be checked against the level of
evidence that produced it. A malformed record, a broken link, or an unintended non-English artifact
fails mechanically instead of surviving review.

The cost is a real one: every non-trivial increment now carries a task record and an explicit claim
limit, and `Assured` work carries a Challenge. That cost is accepted because the demonstration this
application exists to produce depends on a replayable, exactly-once causal chain, and an unnoticed
settlement or ordering defect would invalidate it.

CP-02 was the next registered work item in the original governance baseline. It is now verified,
and CP-03 locked the bounded G1/G2 implementation route under `SK-TASK-003`. CP-04 has since been
locally runtime-verified under `SK-TASK-004`; CP-05 is now the next child checkpoint.

## Reopen triggers

Reopen this decision when:

- a control is repeatedly bypassed, or costs more than the failures it prevents;
- CP-02 returns a capability result that changes the runtime or verification ladder;
- the outer repository extends its validator scope to `WebApp/`, making a rule redundant;
- code arrives and the verification ladder needs concrete suite names and commands; or
- the owner changes the self-governance boundary or the implementation gate.
