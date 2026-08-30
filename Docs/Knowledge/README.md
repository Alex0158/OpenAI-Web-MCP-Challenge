# Knowledge Governance and Distillation

**Role:** SUPPORTING cross-layer governance index  
**Status:** Active  
**Observed:** 2026-08-30  
**Scope:** High-value knowledge extracted from the WebMCP Challenge repository, directly related Codex threads, and relevant Codex Memory summaries

## Purpose

This folder is the project's routing and reconciliation layer. It answers four questions
that a flat document list cannot answer reliably:

1. Which source controls a decision or claim?
2. What has actually been verified, and what is still an assumption or unknown?
3. Which material deserves immediate attention because it can change architecture,
   security, eligibility, product selection, or submission readiness?
4. Which historical or reference material should be preserved without being mistaken for
   current project truth?

This package does not replace the Core documents, accepted ADRs, governing challenge rules,
runtime evidence, or immutable references. It points to the owner of each statement and
records only cross-layer synthesis. The owning source remains authoritative for its own
surface.

## Start here

1. [Priority and classification](01-priority-and-classification.md) defines the four
   attention levels and the independent metadata needed to prevent information flattening.
2. [High-value register](02-high-value-register.md) contains the curated statements that
   can change a decision, a claim, or the next validation step.
3. [Source reconciliation](03-source-reconciliation.md) compares the existing Core, ADR,
   Research, Evidence, Experiment, Reference, thread, and Memory layers and records their
   disposition.
4. [Thread and Memory distillation](04-thread-and-memory-distillation.md) preserves the
   useful knowledge from related conversations without importing private transcripts,
   credentials, or raw runtime identifiers.
5. [Challenge governance snapshot](05-challenge-governance-snapshot.md) provides an
   English operational digest of the high-impact rules while keeping the Official Rules as
   the controlling source.

## Authority precedence

When two sources disagree, apply this order unless a newer accepted decision explicitly
changes it:

1. Current **GOVERNING** official rules and written organizer clarifications for legal or
   submission requirements.
2. Accepted **DECISION** records in `Docs/Decisions/`.
3. **CANONICAL** current status and Core documents in `Docs/Core/`.
4. Frozen, redacted runtime **evidence** and implementation tests for what the current
   build actually did.
5. Active **SUPPORTING** research and experiment plans.
6. **REFERENCE**, **DEPRIORITIZED**, or **SUPERSEDED** material, including old threads and
   Memory summaries.

The precedence order is not a claim that a lower layer is unimportant. A Level 2 failure
can force a Level 1 decision change; a Level 4 snapshot can contain the only record of why
an unsafe direction was rejected. It means only that lower layers do not silently rewrite
the current source of truth.

## Coverage boundary

The inventory was performed against:

- the Git repository at `WebMCP_Challenge/`;
- the current working tree and its redacted evidence surface;
- the visible recent project-related Codex threads, including the WebMCP research,
  Challenge ideation, Signal Rescue, project-understanding, and MVP-validation threads;
  and
- the directly relevant Codex Memory summaries and their referenced historical outcomes.

Private Memory files, raw thread transcripts, task identifiers, bearer capabilities,
machine-local databases, and mutable runtime traces are not copied into the repository.
Archived or unavailable conversations that were not visible in the project thread index are
not silently treated as reviewed. A future inventory may add a record, but it must keep the
same provenance and privacy boundary.

## Non-destructive maintenance

Cleaning means reconciling ownership, status labels, links, and dispositions. It does not
mean deleting historical material merely because it is old, verbose, non-English, or no
longer selected. Use a new English successor, a supersession label, or a disposition record
when a source needs to be demoted. Immutable TenderRelay snapshots must remain byte-identical.

Before promoting a statement into Core or an ADR, require:

- an explicit source and capture date;
- an evidence state such as `VERIFIED`, `DECIDED`, `WORKING ASSUMPTION`, `INFERENCE`,
  `TARGET`, `UNKNOWN`, or `SUPERSEDED`;
- a named owner document;
- a decision-impact assessment; and
- a small verification or review action when the statement is volatile or unproven.

Before treating a repository change as shareable evidence, apply the tracked collaboration
gate in [`../../AGENTS.md`](../../AGENTS.md): inspect status, preserve other contributors' work,
stage exact paths, validate the staged diff, fetch before pushing, and report local,
committed, pushed, and still-uncommitted state separately.

## Relationship to existing documentation

The existing [Documentation Map](../README.md) remains the navigation map and the Core/ADR
files remain the project authorities. This folder adds a cross-layer view so that a reader
can start with the highest-value statements instead of reading every research snapshot in
parallel. No existing canonical or immutable file is rewritten by this package.
