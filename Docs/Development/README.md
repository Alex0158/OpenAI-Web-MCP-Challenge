# Re-entry Core Development and Closure

**Role:** CANONICAL development workflow and active-work index  
**Status:** Active operating baseline  
**Last updated:** 2026-08-31

## Purpose

This directory controls how Re-entry Core moves from an accepted decision to implementation,
verification, evidence, and precise closure. It does not redefine product or architecture
semantics owned by `Docs/Core/` and `Docs/Decisions/`.

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
| Active bounded implementation | This directory |
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

## Active work

| ID | Scope | Status |
|---|---|---|
| [`RECORE-001`](RECORE-001-foundation.md) | Build the Re-entry Core baseline through protocol, Host, Receiver authority, and later process seams | `in_progress` |

## Lean implementation rules

- Prefer one narrow module and one real consumer over a generic framework.
- Add a dependency only when the standard library cannot meet a measured requirement safely.
- Do not add automatic fallback behavior to hide an unsupported capability.
- Use bounded payloads, explicit limits, indexed access paths, and no secret-bearing logs.
- Benchmark material hot paths and idle behavior before optimizing from intuition.
- Keep final-app domain language and state machines outside Re-entry Core.
- Record unresolved risks with impact and reopen conditions; do not let one independent unknown
  block unrelated safe increments.

## Git and evidence closure

Follow the repository `AGENTS.md` validated-goal gate. Stage exact paths only, preserve existing
dirty work, run the smallest meaningful checks, inspect the complete diff, fetch before push,
and distinguish local validation, local commit, remote delivery, runtime proof, and release.
