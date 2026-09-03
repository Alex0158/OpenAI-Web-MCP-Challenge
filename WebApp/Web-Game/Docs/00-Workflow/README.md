# Sleepless Kingdom Workflow and Closure

**Role:** Active operating baseline
**Status:** Active
**Last updated:** 2026-09-02

## 1. Purpose

This directory defines how a Sleepless Kingdom task moves from a request or observation to evidence,
decision, implementation, verification, current-truth updates, and precise closure.

It applies to concept work, documentation, implementation, testing, capability probes, deployment,
and maintenance. It does not define game behavior; that remains owned by the modules routed from
[`../README.md`](../README.md).

Session execution discipline is refined by the
[Session Runbook](01-session-runbook.md). That runbook does not replace this loop.

Test design, fixture selection, command routing, failure triage, and test-evidence binding are
defined by the [Test and Verification Runbook](02-test-and-verification-runbook.md). It does not
replace checkpoint acceptance or game behavior documents.

The operating loop is:

```text
Objective
-> Boundary and Authority
-> Classification
-> Evidence
-> Challenge
-> Decision and Registration
-> Smallest Reversible Path
-> Implementation
-> Verification
-> Record
-> Checkpoint Closure
-> Workflow Evolution
```

The sequence may be compressed for small tasks. A later phase can never be used to fabricate
evidence that an earlier gate was satisfied.

## 2. Risk profiles

| Profile | Typical work | Minimum control set |
|---|---|---|
| `Fast` | Read-only inspection, a reversible typo, formatting, or link repair | Boundary, current evidence, smallest action, readback, precise claim |
| `Standard` | Ordinary mechanic implementation, documentation authoring, test work, tunable configuration change | Task record, evidence map, affected surfaces, targeted verification, current-truth update, closure label |
| `Assured` | Any change to world authority, identity semantics, cargo or coin settlement, event ordering or idempotency, persistence or `world_snapshot`/`client_snapshot` shape, the WebMCP tool surface, Re-entry action authority, the human consequence boundary, the `SK-MVP-*` contract, or hosted deployment | Challenge gate, explicit authority, `ADR-GAME-*` or `SK-ISSUE-*` record, recovery path, multi-layer verification, `SK-EVID-*` record |

Anything that can silently create, destroy, or duplicate cargo, coins, soldiers, events, or
continuations defaults to `Assured`, even in a fixture world, because one such defect invalidates the
determinism claim the whole demo rests on.

## 3. Stage 0 — objective

Define the outcome before selecting a solution. Record the player or system outcome, the success
conditions, the non-goals, the binding constraints, and the intended closure level.

Do not substitute a convenient checkpoint milestone for the requested outcome.

## 4. Stage 1 — boundary and authority

Identify the owning directory and module, the exact target and environment, who may act, the allowed
mutation classes (read, edit, write, run, commit, deploy), the lifetime, and the stop or rollback
condition.

Read access does not imply write access. Local edit permission does not imply commit, push,
deployment, or destructive permission. Authority granted for one increment does not carry to the
next.

## 5. Stage 2 — classification

Classify before collecting broad evidence:

```text
quick answer | current-state investigation | diagnosis only | design decision |
implementation or refactor | capability probe | test or evidence work |
deployment or operations | documentation evolution
```

Select `Fast`, `Standard`, or `Assured` and record why the profile fits the blast radius,
reversibility, uncertainty, and intended claim.

## 6. Stage 3 — evidence map

Route evidence by question:

1. intended game behavior: the owning Blueprint, World, Mechanic, Character, Design, or Engineering
   document;
2. normative first-slice rules: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md);
3. ordering across mechanisms: the owning `Mechanics/Chains/` document;
4. implemented behavior: current code and migrations;
5. tested behavior: current test source and fresh results;
6. runtime behavior: the actual process, world time, database, `world_snapshot`/`client_snapshot`, and log readback;
7. capability behavior: the exact browser, page, and recorded probe result; and
8. history: `ADR-GAME-*`, Git history, `Evidence/`, or the raw discussion reference.

Classify every material conclusion as `Verified`, `Inferred`, or `Unknown`, and record a falsifier
when a wrong assumption would change the implementation or the risk.

## 7. Stage 4 — Challenge gate

Write a Challenge before implementation when work affects:

- world authority, or would move an authoritative decision into the browser;
- identity semantics for `world_id`, `player_id`, `shelter_id`, `soldier_id`, `mission_attempt_id`,
  `monster_id`, `encounter_id`, `event_id`, or `idempotency_key`;
- cargo settlement, coin credit, loot transfer, or any exactly-once effect;
- world-clock units, the due-work phase order, downtime catch-up, or replay;
- persistence schema, `world_snapshot`/`client_snapshot` shape, entity revisions, or the outbox;
- the page-bound WebMCP tool surface, the Re-entry action authority, or the human consequence
  boundary;
- the `SK-MVP-*` contract version; or
- hosted deployment, a judge claim, or an irreversible action.

Minimum Challenge content:

1. evidence that could disprove the current hypothesis;
2. affected and explicitly unaffected mechanisms, chains, capabilities, events, and surfaces;
3. likely failure modes: duplicate effect, lost event, stale revision, race at a shelter boundary,
   authority leak into the client, unbounded catch-up loop, hidden fallback;
4. minimal, conservative, and expanded alternatives with trade-offs;
5. the chosen path and why;
6. non-goals;
7. the minimum meaningful verification and the recovery path; and
8. reopen triggers.

A Challenge prevents work on the wrong layer or the wrong objective. Length is not the point. Reuse a
completed Challenge while its assumptions and boundaries hold; reopen it when new evidence changes an
assumption, contract, failure mode, capability result, or verification path.

## 8. Stage 5 — decision and registration

Decide whether the task needs direct execution only, an update to an active `SK-TASK-*`, a new
`SK-TASK-*`, a new or updated `SK-ISSUE-*`, an `ADR-GAME-*`, a `SK-EVID-*`, or analysis without
mutation.

Registration is normally required when work changes or exposes uncertainty in game behavior, a
canonical state transition, identity, settlement, event ordering, persistence, the WebMCP or
Re-entry boundary, or a checkpoint gate. Typographical, formatting, link, and behavior-preserving
test-only changes usually do not. When registration is skipped for a non-trivial change, record the
reason, the assumptions, the risk boundary, and the minimum verification.

## 9. Stage 6 — smallest reversible path

Design the path as:

```text
preconditions
-> smallest coherent action
-> targeted verification
-> stop or remediation condition
-> next-entry condition
```

"Smallest" means the smallest action that genuinely advances the requested end state. It must not
narrow the authorized objective merely to make the work easier to finish or test.

For a defect or a contract change, prefer:

```text
Evidence -> reproducible failure proof -> fix -> behavior-preserving refactor -> record
```

If an automated failing test is not possible, preserve the strongest equivalent evidence and state
its limitation.

## 10. Stage 7 — implementation

1. name the owning mechanism, chain, capability, and contract section;
2. modify the owning layer rather than adding a parallel workaround;
3. preserve unrelated dirty changes and unrelated applications;
4. keep the server authoritative and the browser a projection;
5. commit state mutation, event append, and eligible outbox row in one transaction;
6. make every command carry an expected entity revision and an idempotency key;
7. verify incrementally at each coherent boundary; and
8. stop when repeated failure produces no new evidence, and revisit the assumption or the design.

## 11. Stage 8 — verification ladder

| Level | Evidence | Maximum supported claim |
|---|---|---|
| 1 | Static: diff, link check, contract cross-reference, schema readback | The intended structure or change exists |
| 2 | Targeted: unit and contract checks on the changed module, including negative and boundary cases | The named contract passes in the tested scope |
| 3 | Aggregate: the application's complete local suite | The executed suite passed; untested runtime surfaces remain separate |
| 4 | Process runtime: worker start, restart, durable replay, health readback, deterministic catch-up | The named path worked in the exact local environment |
| 5 | Slice chain: browser page, `client_snapshot` stream, typed command, worker, durable store, and event history acting together across two sessions | The end-to-end slice worked together |
| 6 | Capability and artifact binding: genuine page-bound WebMCP registration and invocation, or a proven source-to-build-to-runtime identity | The exact capability or artifact binding is proven |
| 7 | Hosted closure: always-on hosted worker, clean-identity reproduction, residual risk owned | A reviewer can reproduce the named journey |

Verification must include positive, negative, boundary, and failure cases in proportion to risk.
Verification that deploys, restarts a shared service, or mutates a public surface requires separate
authority.

These levels map onto the roadmap gates: level 1–2 supports G0, level 4 and 6 support G1, level 3–5
support G2, and level 7 supports G3.

## 12. Closure

A task closes only when the requested objective is proven at the intended evidence level.

Closure audit:

- the objective is achieved without shrinking the requested scope;
- boundaries and authority were respected;
- the exact changes are identified;
- the minimum verification passed;
- claims do not exceed evidence;
- current truth and the owning documents are reconciled;
- residual risk has an owner and a reopen condition; and
- unrelated work remains untouched.

Use only these closure labels:

```text
answered
diagnosed
specified
decided
implemented
integrated
contract-verified
runtime-verified
slice-verified
hosted-verified
judge-reproducible
```

`contract-verified` requires ladder level 2 or 3. `runtime-verified` requires level 4.
`slice-verified` requires level 5. `hosted-verified` requires level 7 infrastructure evidence.
`judge-reproducible` requires level 7 with an independent clean-identity run. If a higher level is
unproven, report the level actually achieved rather than using completion language.

## 13. Stage 9 — record

Write results to the owning layer:

- game intent or rules: the owning Blueprint, World, Mechanic, Character, Design, or Engineering
  document;
- normative first-slice change: the contract sheet plus a new contract version and an `ADR-GAME-*`;
- bounded work: the active `SK-TASK-*`;
- verified problem: a `SK-ISSUE-*`;
- durable choice: an `ADR-GAME-*`;
- fresh results and claim limits: a `SK-EVID-*`;
- reusable process improvement: this directory, a template, or a validator rule; and
- superseded material: a recoverable historical record outside the current authority layer.

Rewrite current truth in place. Do not append round-by-round history to a specification.

## 14. Stage 10 — checkpoint closure

The roadmap in [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
owns checkpoint scope and dependencies. A checkpoint closes only with its complete closure packet:
named task and exact source state, changed surface, focused tests and the minimum transitive
aggregate, runtime or capability evidence when the claim requires it, updated owning documents,
residual risk with an executable reopen trigger, and one coherent commit with unrelated work absent.

Use [`../Templates/checkpoint-closure.md`](../Templates/checkpoint-closure.md).

## 15. Stage 11 — workflow evolution

After a repeated success or failure:

1. identify the repeated trigger and its cost;
2. select the smallest durable landing point;
3. define positive, negative, and boundary trigger cases;
4. verify that the new control runs and changes a real decision; and
5. retain, revise, merge, or remove the control based on evidence.

Landing points, in increasing operational weight:

```text
decision or issue -> current docs -> runbook or template -> validator rule -> automated test
```

Do not measure maturity by the number of rules, documents, records, or agents. Measure it by
decision quality, prevented failures, evidence strength, and verified closure.

## 16. Maintenance boundary

This README owns the durable operating loop. Session execution discipline belongs in the
[Session Runbook](01-session-runbook.md), test design and execution in the
[Test and Verification Runbook](02-test-and-verification-runbook.md), record envelopes in [`../Templates/`](../Templates/README.md),
lifecycle in [`../Tasks/`](../Tasks/README.md) and [`../Issues/`](../Issues/README.md), and results in
[`../Evidence/`](../Evidence/README.md). Game semantics must never be added here.
