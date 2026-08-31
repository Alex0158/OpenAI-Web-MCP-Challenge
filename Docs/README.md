# Documentation Map and Governance

**Role:** CANONICAL documentation governance and authority index  
**Status:** Current index  
**Project:** Re-entry Core; demo app and final app name TBD  
**Last updated:** 2026-08-31

This directory separates current product truth from challenge governance, evidence, and
historical ideation. A file's location does not by itself make it authoritative; use the
roles and precedence below.

## 1. Document roles

| Role | Meaning |
|---|---|
| **CANONICAL** | Controls an explicitly named project surface. Update it when that surface changes. |
| **DECISION** | Records an accepted durable choice, its context, and its consequences. |
| **GOVERNING** | Controls an external constraint such as official challenge rules. |
| **SUPPORTING** | Supplies research or implementation guidance but does not control product truth. |
| **REFERENCE** | Preserves source material or historical reasoning. Do not silently promote it into a decision. |
| **DEPRIORITIZED** | A preserved direction that is not part of the current project. |
| **SUPERSEDED** | Replaced by a named newer source. Retained only for traceability. |

## 2. Current mechanism core

| Document | Role | Owns |
|---|---|---|
| [`Core/00-current-status.md`](Core/00-current-status.md) | CANONICAL | Current phase, evidence state, binding assumptions, next gate |
| [`Decisions/ADR-0002-separate-mechanism-from-demo-app.md`](Decisions/ADR-0002-separate-mechanism-from-demo-app.md) | DECISION | Selection of the mechanism and separation from the unselected app/domain |
| [`Core/01-product-definition.md`](Core/01-product-definition.md) | CANONICAL | Selected concept and target product boundary; not current implementation status |
| [`Core/02-product-requirements.md`](Core/02-product-requirements.md) | CANONICAL | Target domain-neutral behavior and selected-app requirements; specialization remains pending |
| [`Core/03-system-design.md`](Core/03-system-design.md) | CANONICAL | Target architecture and logical contracts; current as-built truth remains in Core/00 and Core/05 |
| [`Core/04-trust-security-reliability.md`](Core/04-trust-security-reliability.md) | CANONICAL | Target authority, security, and reliability controls plus its dated evidence boundary |
| [`Core/05-validation-and-evidence.md`](Core/05-validation-and-evidence.md) | CANONICAL | Current proof matrix and future evidence gates |
| [`Core/06-mvp-and-demo.md`](Core/06-mvp-and-demo.md) | CANONICAL | App-selection and demo target; the scorecard is a supporting heuristic |
| [`Core/07-p0-technical-validation-mvp.md`](Core/07-p0-technical-validation-mvp.md) | CANONICAL | Frozen P0 implementation contract and dated verdict; not the current production architecture |
| [`Core/08-competition-thesis-and-positioning.md`](Core/08-competition-thesis-and-positioning.md) | CANONICAL | Competition-facing thesis, value proposition, differentiation, judging posture, and claim hierarchy; underlying status remains in Core/00 and Core/05 |
| [`Decisions/README.md`](Decisions/README.md) | DECISION INDEX | Accepted, superseded, and partially superseded durable choices through ADR-0014 |
| [`Development/README.md`](Development/README.md) | CANONICAL | Development workflow, runbook, bounded work records, verification, and closure states |
| [`Scenarios/README.md`](Scenarios/README.md) | SUPPORTING | Concrete domain mappings that are not selected product truth |

The [decision register](Decisions/README.md) owns the complete decision index. ADR-0001 is
superseded by ADR-0002; ADR-0004 is partially superseded by ADR-0006 and ADR-0007; ADR-0006 through
ADR-0014 control the current Re-entry Core source, topology, protocol, authority, delivery,
transport, deterministic Agent boundary, conformance, Grant control, and private binding
resolution. The index records decision status, not implementation or runtime proof.

## 3. Development and closure

- [`Development/README.md`](Development/README.md) — CANONICAL Re-entry Core development,
  verification, evidence, and closure workflow plus the work-record index.
- [`Development/REENTRY-CORE-PROGRAM.md`](Development/REENTRY-CORE-PROGRAM.md) — accepted Program
  contract; the application-neutral Program is complete at `locally_verified`.
- [`Development/REENTRY-CORE-RUNBOOK.md`](Development/REENTRY-CORE-RUNBOOK.md) — local resume,
  verification, failure-triage, evidence-writeback, and Git-closure procedure.
- RECORE-001 through RECORE-006 are closed at the evidence levels recorded in the
  [development index](Development/README.md). New selected-app or production work uses a new
  bounded record rather than silently widening a closed Core increment.

These records control active scope and closure state. They do not override the owning Core or
decision document and must not accumulate conversational history.

## 4. Challenge governance

These files remain active for the surfaces they own. They do not select the product.

- [`01-official-rules.md`](01-official-rules.md) — GOVERNING research copy of legal and submission constraints; refresh against live Devpost sources before relying on volatile facts.
- [`02-submission-evaluation-strategy.md`](02-submission-evaluation-strategy.md) — SUPPORTING competition and evaluation strategy.
- [`03-technical-build-verification.md`](03-technical-build-verification.md) — SUPPORTING general WebMCP implementation and verification guidance.
- [`05-requirement-evidence-audit.md`](05-requirement-evidence-audit.md) — SUPPORTING audit of the earlier challenge research package.

## 5. Technical research and evidence

These files preserve current analyses, bounded evidence, conditional risk catalogs, and
named-commit snapshots. The [Research index](Research/README.md) owns detailed routing by platform,
runtime, product value, topology, and integration question. Each record's own status and claim
boundary controls its use; inclusion does not make a conclusion an active next step or product
decision.


## 6. Deprioritized ideation

- [`04-research-judgment-and-project-options.md`](04-research-judgment-and-project-options.md) is a DEPRIORITIZED broad option map. It no longer selects the active mechanism or application.
- [`../References/Legacy-Ideation/README.md`](../References/Legacy-Ideation/README.md) records all earlier idea surfaces and their current status.
- The `TwinSurface` framing remains useful background but is not the selected concept identity or novelty claim.

## 7. Reference layer

- [`../References/TenderRelay/README.md`](../References/TenderRelay/README.md) — immutable dossier and tender reference package; not an app decision.
- [`../References/WebMCP/00-source-index.md`](../References/WebMCP/00-source-index.md) — official and primary WebMCP source index.
- [`../References/WebMCP_Analysis/README.md`](../References/WebMCP_Analysis/README.md) — broad WebMCP research dossier; supporting and partially historical.
- [`../References/Other/`](../References/Other/) — supporter resources, conflicts, and unresolved external questions.

## 8. Knowledge governance

- [`Knowledge/README.md`](Knowledge/README.md) — cross-layer routing and non-destructive governance for high-value knowledge.
- [`Knowledge/01-priority-and-classification.md`](Knowledge/01-priority-and-classification.md) — four attention levels and independent evidence metadata.
- [`Knowledge/02-high-value-register.md`](Knowledge/02-high-value-register.md) — curated statements that can change a decision, claim, or next validation step.
- [`Knowledge/03-source-reconciliation.md`](Knowledge/03-source-reconciliation.md) — source-family disposition, conflicts, and ordered cleanup backlog.
- [`Knowledge/04-thread-and-memory-distillation.md`](Knowledge/04-thread-and-memory-distillation.md) — redacted synthesis of relevant Codex threads and Memory, without authority over current files.
- [`Knowledge/05-challenge-governance-snapshot.md`](Knowledge/05-challenge-governance-snapshot.md) — English operational digest of challenge hard gates; the Official Rules remain controlling.

The Knowledge package is additive. Core, ADR, governing, evidence, and immutable reference
files retain ownership of their surfaces; the register provides cross-layer routing rather
than a second source of truth.

## 9. Maintenance rules

1. Put canonical project behavior and status in `Core/`, not in the frozen dossier.
2. Use Core/00 and Core/05 for current implementation and evidence, Core/01–04 and Core/06 for target behavior and architecture, and Core/07 only for the frozen P0 contract and its dated outcome.
3. Update `00-current-status.md` whenever phase, evidence, deployment, or submission truth changes.
4. Record a new ADR before changing the core mechanism, selecting or changing the host app, changing the authority model, or moving the MVP boundary.
5. Label statements as **VERIFIED**, **WORKING ASSUMPTION**, **INFERENCE**, **TARGET**, or **UNKNOWN** where status could affect a decision.
6. Do not duplicate volatile challenge facts across Core docs; link to the governing source.
7. Keep the dossier snapshots byte-identical. Import a new version as a new file rather than overwriting version 1.1.
8. Select a host application only through a new ADR that specializes the domain-neutral Core requirements.
9. Product, development, and submission artifacts are written in English. Conversation may use the user's language.
10. Add every tracked decision and research record to its local index; keep this root map focused on category and authority routing.
11. Follow the repository [collaboration and commit gates](../AGENTS.md) for every contributor integration, commit, merge, and push.

## 10. Update sequence

When a decision or implementation changes:

1. Update or add the relevant decision record.
2. Update the owning Core document.
3. Update current status and the evidence ledger.
4. Reconcile implementation, tests, demo evidence, and submission material.
5. Check links and verify that no frozen reference changed.
