# ADR-0017: Adopt a Project-Wide Engineering Governance Baseline

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Project-wide development standards, testing and verification, Agent routing, and CI

## Context

The repository has a mature documentation authority map, a unified task lifecycle, a detailed
Re-entry Core Program contract, a Core-specific development runbook, and a precise collaboration
and Git-delivery gate. The Core Program is now closed at `locally_verified`, while the selected Host
application and its implementation remain undecided.

The next development phase needs reusable project-wide engineering governance. Expanding the
Core-specific runbook would mix module procedure with application procedure. Expanding
`AGENTS.md` into a complete engineering manual would consume context, duplicate documents, and
make mechanical enforcement unclear. Copying Emorapy's full governance and CI topology would also
import controls designed for a larger database, browser, provider, and release surface that this
project does not yet have.

Current local evidence shows a small zero-runtime-dependency Node package with fast tests and
conformance checks, but no tracked CI workflow or durable repository validator. This supports a
small always-run baseline rather than change classification or multiple remote profiles.

## Decision

### 1. Establish a scoped Engineering authority

`Docs/Engineering/` owns project-wide development standards, testing and verification policy, and
the primary implementation runbook. It does not own product semantics, task lifecycle,
implementation history, runtime evidence, deployment, or release state.

The initial authority consists of:

- `README.md` for routing and maintenance;
- `01-development-standard.md` for code, module, dependency, failure, security, performance, and
  documentation quality;
- `02-testing-and-verification.md` for test layers, selection, compatibility, CI, benchmark, and
  claim boundaries; and
- `03-primary-development-runbook.md` for the repeatable current-state-to-closure procedure.

### 2. Keep AGENTS as the routing control plane

The repository `AGENTS.md` keeps repository identity, required reading, language, registration,
engineering non-negotiables, verification routing, change safety, collaboration, and completion
claims. Long explanations and command procedures remain in Engineering or module runbooks.

### 3. Preserve scoped runbooks

`Docs/Development/REENTRY-CORE-RUNBOOK.md` remains authoritative for Re-entry Core increments.
Selected-application or runtime procedures may be added only when their first real implementation
requires a distinct operational owner. They must refine, not duplicate, the project-wide runbook.

### 4. Use proportionate verification

Inner loops use the smallest stable affected checks. A coherent closure candidate runs the complete
applicable local baseline once. A repeated complete run requires an executable change that can
invalidate earlier evidence, not documentation volume or elapsed time alone. Aggregate failure is
preserved and reduced to a minimum reproducer before another aggregate run.

### 5. Start with native, lightweight enforcement

The first baseline uses Python standard-library repository validators, Node native syntax and test
commands, the existing conformance runner, an actual package dry run, and one always-run GitHub
Actions workflow. It adds no runtime dependency, no speculative framework, no coverage quota, no
formatter rewrite, and no CI change classifier.

A linter, formatter, type checker, coverage threshold, browser lane, database lane, deployment gate,
or application quality profile requires a current consumer, an identified defect class or claim,
and its own bounded decision or task when material.

### 6. Make Node 24 the closure baseline

Node 24 is the reproducible minimum closure runtime. Successful checks on a newer local Node
version are useful compatibility evidence but do not replace Node 24 closure. The package may retain
its `>=24` minimum while claims name the exact versions actually executed.

### 7. Use responsibility-based split triggers

File length is a review signal, not a defect or automatic split trigger. Split a source or document
when it develops a distinct authority, state model, consumer, failure boundary, test surface, or
update cadence that can be maintained independently. Do not refactor stable Core modules merely to
satisfy a numeric threshold.

## Consequences

### Positive

- New sessions receive a short route to the correct authority and commands.
- Application development can reuse one engineering baseline without widening Core documents.
- Documented repository, test, secret, and CI controls become executable.
- Fast Core checks allow simple always-run CI instead of an expensive classifier.
- New controls require demonstrated value and remain removable.

### Costs and risks

- Engineering indexes and commands must remain synchronized with code and CI.
- A validator can create false positives if its active scope or historical exceptions are unclear.
- A project-wide standard can become generic prose unless it names exact triggers and owners.
- Application selection will still require new, concrete browser, UI, data, and runtime gates.

## Rejected alternatives

- **Put every rule in `AGENTS.md`:** rejected because it duplicates runbooks, increases mandatory
  context, and makes procedures harder to test and maintain.
- **Extend only the Re-entry Core runbook:** rejected because application work is a separate domain
  and must not silently widen a closed Core Program.
- **Copy the full Emorapy structure and CI profiles:** rejected because the current project lacks
  Emorapy's database, browser, provider, release, and expensive aggregate constraints.
- **Create separate Workflow and Testing directory trees now:** rejected because four scoped
  Engineering documents provide distinct ownership without premature directory depth.
- **Add universal line, file, coverage, or commit quotas:** rejected because they optimize proxies
  rather than responsibility, risk, evidence, or coherent outcomes.

## Reopen triggers

Reopen if selected-application development cannot fit the Engineering authority without mixed
ownership, the always-run CI becomes materially expensive, Node compatibility requirements change,
validators repeatedly block correct work, or measured defects justify a stronger lint, type,
coverage, browser, release, or deployment control.
