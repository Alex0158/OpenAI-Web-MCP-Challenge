# Development and Closure

**Role:** CANONICAL Program, implementation, verification, runbook, and closure index  
**Status:** Application-neutral Core and project-wide engineering-governance closure baseline  
**Last updated:** 2026-08-31

## Purpose

This directory records bounded implementation, verification, evidence, and precise closure for
Re-entry Core and cross-project engineering increments. It does not redefine product or architecture
semantics owned by `Docs/Core/` and `Docs/Decisions/`, project-wide engineering controls owned by
[`Docs/Engineering/`](../Engineering/README.md), or task lifecycle owned by
[`Docs/Tasks/`](../Tasks/README.md).

The binding program mandate, execution boundaries, anti-bloat rules, and Definition of Done are
owned by the [Re-entry Core Program Contract](REENTRY-CORE-PROGRAM.md).
The [development runbook](REENTRY-CORE-RUNBOOK.md) owns the repeatable local resume,
verification, failure-triage, evidence-writeback, and Git-closure procedure.

The operating loop is:

```text
objective
-> authority and boundaries
-> challenge
-> smallest coherent increment
-> implementation
-> targeted verification
-> aggregate verification when warranted
-> current-truth and evidence writeback
-> exact Git closure
```

The application-neutral Program is complete at `locally_verified` under the terminal
[RECORE-003 audit](RECORE-003-program-completion-audit.md). New selected-app, production, or Agent
runtime work uses its own bounded record and decision; it does not silently widen a closed Core
increment.

## Authority routing

| Question | Owning surface |
|---|---|
| Program outcome, execution boundaries, and completion | [`REENTRY-CORE-PROGRAM.md`](REENTRY-CORE-PROGRAM.md) |
| Current phase and verified state | `Docs/Core/00-current-status.md` |
| Durable concept and requirements | `Docs/Core/01-product-definition.md` and `02-product-requirements.md` |
| Architecture and logical contracts | `Docs/Core/03-system-design.md` |
| Trust, security, and reliability | `Docs/Core/04-trust-security-reliability.md` |
| Validation gates and claim limits | `Docs/Core/05-validation-and-evidence.md` |
| Accepted durable choice | `Docs/Decisions/` |
| Registered task lifecycle, owner, current increment, dependency, and next gate | `Docs/Tasks/` |
| Accepted Program, implementation, verification, and closure detail | This directory |
| Project-wide development, testing, and execution controls | [`Docs/Engineering/`](../Engineering/README.md) |
| Local development resume, verification, and Git closure | [`REENTRY-CORE-RUNBOOK.md`](REENTRY-CORE-RUNBOOK.md) |
| Supporting analysis or unresolved research | `Docs/Research/` |
| Implemented behavior | Current code and tests |
| Runtime, deployment, or submission truth | Current runtime and release evidence |

A summary, index, test count, or historical report cannot override the owning surface.

## Increment contract

Every code-bearing increment records:

1. objective and closure level;
2. owning decisions and requirements;
3. affected and explicitly unaffected processes, modules, data, and claims;
4. evidence that could falsify the chosen path;
5. minimal implementation and non-goals;
6. positive, negative, boundary, and failure verification;
7. performance or resource budget when material;
8. stop, remediation, and reopen conditions; and
9. exact current-truth, evidence, commit, and remote state.

One increment must produce one coherent outcome. Do not absorb unrelated work to make a test or
commit appear complete.

## Closure labels

Use only the highest state supported by current evidence:

```text
decided
specified
implemented
locally_verified
separate_process_verified
runtime_verified
deployed
judge_reproducible
submitted
```

Passing unit tests does not prove process separation, Agent activation, Browser acquisition,
genuine WebMCP, deployment, or judge reproducibility.

## Program records

| ID | Scope | Status |
|---|---|---|
| [`RECORE-001`](RECORE-001-foundation.md) | Build the Re-entry Core baseline through protocol, Host, Receiver authority, process seams, and deterministic conformance profile | `locally_verified` |
| [`RECORE-002`](RECORE-002-quality-and-weight.md) | Measure bounded Receiver durability, source-profile startup, and package weight without changing runtime behavior | `locally_verified` |
| [`RECORE-003`](RECORE-003-program-completion-audit.md) | Audit every Program completion gate, drive bounded gaps to closure, and record the terminal application-neutral result | `locally_verified` |
| [`RECORE-004`](RECORE-004-grant-control.md) | Implement Receiver-authenticated Grant inspection and atomic revocation without adding a production administration surface | `locally_verified` |
| [`RECORE-005`](RECORE-005-separate-process-fault-matrix.md) | Verify bounded revocation, stale-worker, conflicting-effect, and mid-transaction termination behavior across test processes | `separate_process_verified` |
| [`RECORE-006`](RECORE-006-private-managed-context-binding.md) | Implement private Grant-to-context resolution without exposing a raw platform locator or selecting an Agent runtime | `locally_verified` |
| [`DOCS-001`](DOCS-001-documentation-architecture-reconciliation.md) | Reconcile repository entry points, documentation routing, Core completion wording, and future source placement without changing product behavior | `locally_verified` |
| [`DOCS-002`](DOCS-002-modular-authority-and-core-denoising.md) | Establish mechanism-module ownership, reduce mixed-role Core content, and remove the duplicate Knowledge routing layer | `locally_verified` |
| [`DOCS-003`](DOCS-003-unified-task-authority.md) | Establish one unified task lifecycle for pending work, problems, defects, investigations, and decision needs | `locally_verified` |
| [`ENG-001`](ENG-001-project-engineering-governance-baseline.md) | Establish the project-wide engineering authority, mechanical repository checks, aggregate Core verification, and CI baseline | `locally_verified` with exact-source CI success |
| [`ENG-002`](ENG-002-collaborator-agent-guidance-reconciliation.md) | Make repository contributor guidance self-contained and restore the AGENTS, Runbook, Core, and evidence placement boundary | `locally_verified` |
| [`ENG-003`](ENG-003-collaborative-source-of-truth-and-git-gates.md) | Establish human-request authority checks, canonical writeback, and multi-computer Git synchronization gates | `locally_verified` |

## Lean implementation rules

- Prefer one narrow module and one real consumer over a generic framework.
- Add a dependency only when the standard library cannot meet a measured requirement safely.
- Do not add automatic fallback behavior to hide an unsupported capability.
- Use bounded payloads, explicit limits, indexed access paths, and no secret-bearing logs.
- Benchmark material hot paths and idle behavior before optimizing from intuition.
- Keep final-app domain language and state machines outside Re-entry Core.
- Record unresolved risks with impact and reopen conditions; do not let one independent unknown
  block unrelated safe increments.
- Keep task lifecycle and next-gate metadata in `Docs/Tasks/`; link to it rather than creating a
  second active-work register here.

## Git and evidence closure

Follow the repository `AGENTS.md` validated-goal gate. Stage exact paths only, preserve existing
dirty work, run the smallest meaningful checks, inspect the complete diff, fetch before push,
and distinguish local validation, local commit, remote delivery, runtime proof, and release.
