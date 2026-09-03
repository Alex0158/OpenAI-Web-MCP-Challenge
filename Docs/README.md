# Documentation Map and Governance

**Role:** CANONICAL documentation governance and authority index  
**Status:** Current index  
**Project:** Re-entry Core; demo app and final app name TBD  
**Last updated:** 2026-09-03

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

## 2. Flagship Big Picture and authority map

`Docs/Core/` is the flagship Big Picture for current product direction, requirements,
architecture, trust, evidence gates, app selection, and competition positioning. Decisions explain
durable choices; Tasks control non-terminal work; Development records accepted execution and
closure. Neither Decisions nor Development replaces the owning Core truth.

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
| [`Core/09-business-flows-and-ux.md`](Core/09-business-flows-and-ux.md) | CANONICAL | Cross-layer business-flow sequence, portal redirects, UX handoffs, credential boundaries, and current-flow audit findings |
| [`Mechanisms/README.md`](Mechanisms/README.md) | CANONICAL MODULE INDEX | Stable Re-entry lifecycle and authority contracts, with code, test, and evidence routing |
| [`Decisions/README.md`](Decisions/README.md) | DECISION INDEX | Accepted, superseded, pending, and scoped durable choices through ADR-0041 |
| [`Tasks/README.md`](Tasks/README.md) | CANONICAL TASK INDEX | Unified lifecycle for pending work, problems, defects, investigations, risks, decisions, and verification gaps |
| [`Development/README.md`](Development/README.md) | CANONICAL | Program, implementation, verification, runbook, and closure records |
| [`Engineering/README.md`](Engineering/README.md) | CANONICAL ENGINEERING INDEX | Project-wide development, testing, verification, and execution controls |
| [`Challenge/README.md`](Challenge/README.md) | GOVERNING ROUTER | Current English routing for challenge constraints, volatile facts, and release refresh gates |
| [`Scenarios/README.md`](Scenarios/README.md) | SUPPORTING | Concrete domain mappings that are not selected product truth |

The [decision register](Decisions/README.md) owns the complete decision index. ADR-0001 is
superseded by ADR-0002; ADR-0004 is partially superseded by ADR-0006 and ADR-0007; ADR-0006 through
ADR-0032 control the Re-entry Core source, topology, protocol, authority, delivery, transport,
deterministic Agent boundary, conformance, Grant control, private binding resolution, modular
documentation ownership, unified task lifecycle, engineering governance baseline, and the retired
hosted Cloud Receiver preview. ADR-0032 retires `runtime/cloud-receiver/` and its hosted preview
while preserving reusable Core and integration contracts. ADR-0033 selects `saas-boilerplate/` as
the active v2 base; ADR-0035 through ADR-0041 control its accepted bounded increments. The index
records decision status, not implementation or runtime proof, and those v2 decisions do not resolve
the one-Receiver-Core architecture conflict recorded by TASK-028.

## 3. Tasks, development, and closure

- [`Tasks/README.md`](Tasks/README.md) — CANONICAL lifecycle authority for every registered
  non-terminal task, including problems and defects.
- [`Tasks/TASK-001-select-host-application.md`](Tasks/TASK-001-select-host-application.md) — current
  P0 task to produce and reconcile the application-selection ADR.
- [`Engineering/README.md`](Engineering/README.md) — CANONICAL project-wide development, testing,
  verification, and execution controls.
- [`Engineering/03-primary-development-runbook.md`](Engineering/03-primary-development-runbook.md) —
  repeatable task intake, implementation, verification, handoff, and delivery procedure.

- [`Development/README.md`](Development/README.md) — CANONICAL implementation,
  verification, evidence, runbook, and closure workflow plus the Program-record index.
- [`Development/REENTRY-CORE-PROGRAM.md`](Development/REENTRY-CORE-PROGRAM.md) — accepted Program
  contract; the application-neutral Program is complete at `locally_verified`.
- [`Development/REENTRY-CORE-RUNBOOK.md`](Development/REENTRY-CORE-RUNBOOK.md) — local resume,
  verification, failure-triage, evidence-writeback, and Git-closure procedure.
- RECORE-001 through RECORE-006 are closed at the evidence levels recorded in the
  [development index](Development/README.md). New selected-app or production work uses a new
  bounded record rather than silently widening a closed Core increment.

Task records control task lifecycle and the next gate. Development records control accepted
execution and closure detail. Neither overrides the owning Core, Mechanism, or Decision document,
and neither may accumulate conversational history.

## 4. Mechanism modules

- [`Mechanisms/README.md`](Mechanisms/README.md) — CANONICAL module map and ownership rules.
- [`Mechanisms/01-host-integration-manifest-and-enrollment.md`](Mechanisms/01-host-integration-manifest-and-enrollment.md) — Host offer, Manifest, enrollment, and opaque binding contract.
- [`Mechanisms/02-receiver-grant-and-event-authority.md`](Mechanisms/02-receiver-grant-and-event-authority.md) — Receiver-owned consent, Grant, event, and reservation authority.
- [`Mechanisms/03-delivery-lease-and-local-connector.md`](Mechanisms/03-delivery-lease-and-local-connector.md) — outbound delivery, lease, acknowledgement, and Connector boundary.
- [`Mechanisms/04-managed-context-and-agent-activation.md`](Mechanisms/04-managed-context-and-agent-activation.md) — private context resolution and replaceable Agent activation boundary.
- [`Mechanisms/05-host-reentry-webmcp-and-human-boundary.md`](Mechanisms/05-host-reentry-webmcp-and-human-boundary.md) — canonical return, fresh WebMCP tools, bounded continuation, and human decision boundary.

These contracts own stable module behavior and application obligations. They do not claim that a
production process shell, supported Agent adapter, selected application, or deployment exists.

## 5. Challenge governance

These files remain active for the surfaces they own. They do not select the product.

- [`Challenge/README.md`](Challenge/README.md) — GOVERNING ROUTER for current English challenge constraints and release refresh gates.
- [`01-official-rules.md`](01-official-rules.md) — GOVERNING research copy of legal and submission constraints; refresh against live Devpost sources before relying on volatile facts.
- [`02-submission-evaluation-strategy.md`](02-submission-evaluation-strategy.md) — SUPPORTING competition and evaluation strategy.
- [`03-technical-build-verification.md`](03-technical-build-verification.md) — SUPPORTING general WebMCP implementation and verification guidance.
- [`05-requirement-evidence-audit.md`](05-requirement-evidence-audit.md) — SUPPORTING audit of the earlier challenge research package.

## 6. Technical research and evidence

These files preserve current analyses, bounded evidence, conditional risk catalogs, and
named-commit snapshots. The [Research index](Research/README.md) owns detailed routing by platform,
runtime, product value, topology, and integration question. Each record's own status and claim
boundary controls its use; inclusion does not make a conclusion an active next step or product
decision.

- [`Research/23-three-candidate-competition-app-selection-review.md`](Research/23-three-candidate-competition-app-selection-review.md)
  — SUPPORTING source-backed comparison of Opportunity, Sleepless, and Greenlight, including the
  preserved original Greenlight ranking and a post-clarification update that makes Opportunity the
  provisional scenario-level lead. It does not select the app; TASK-001 and an accepted ADR remain
  controlling.

## 7. Deprioritized ideation

- [`04-research-judgment-and-project-options.md`](04-research-judgment-and-project-options.md) is a DEPRIORITIZED broad option map. It no longer selects the active mechanism or application.
- [`../References/Legacy-Ideation/README.md`](../References/Legacy-Ideation/README.md) records all earlier idea surfaces and their current status.
- The `TwinSurface` framing remains useful background but is not the selected concept identity or novelty claim.

## 8. Reference layer

- [`../References/TenderRelay/README.md`](../References/TenderRelay/README.md) — immutable dossier and tender reference package; not an app decision.
- [`../References/WebMCP/00-source-index.md`](../References/WebMCP/00-source-index.md) — official and primary WebMCP source index.
- [`../References/WebMCP_Analysis/README.md`](../References/WebMCP_Analysis/README.md) — broad WebMCP research dossier; supporting and partially historical.
- [`../References/Other/`](../References/Other/) — supporter resources, conflicts, and unresolved external questions.

## 9. Maintenance rules

1. Put canonical project behavior and status in `Core/`, not in the frozen dossier.
2. Use Core/00 and Core/05 for current implementation and evidence, Core/01–04 and Core/06 for target behavior and architecture, `Mechanisms/` for stable module contracts, `Engineering/` for project-wide development controls, and Core/07 only for the frozen P0 contract and its dated outcome.
3. Update `00-current-status.md` whenever phase, evidence, deployment, or submission truth changes.
4. Record a new ADR before changing the core mechanism, selecting or changing the host app, changing
   the authority model, moving the MVP boundary, or changing a project-wide engineering or
   collaboration control.
5. Label evidence-sensitive conclusions as **VERIFIED**, **INFERRED**, **MEMORY-ONLY**, **UNKNOWN**,
   or **CONFLICTED**. Use **TARGET** only for approved intended behavior, not as an evidence level.
6. Do not duplicate volatile challenge facts across Core docs; link to the governing source.
7. Keep the dossier snapshots byte-identical. Import a new version as a new file rather than overwriting version 1.1.
8. Select a host application only through a new ADR that specializes the domain-neutral Core requirements.
9. Product, development, and submission artifacts are written in English. Conversation may use the user's language.
10. Add every tracked decision, task, and research record to its local index; keep this root map focused on category and authority routing.
11. Follow the repository [collaboration and commit gates](../AGENTS.md) for every contributor integration, commit, merge, and push.
12. Do not create a second cross-layer register for facts already owned by Core, Mechanisms, ADRs, Tasks, Development, Research, or governing sources.
13. Register actionable non-terminal work in `Tasks/`; do not use Core, Research, or Development as an informal backlog.

## 10. Update sequence

When a decision or implementation changes:

1. Update the registered task lifecycle and exact next gate when applicable.
2. Update or add the relevant decision record.
3. Update the owning Core or Mechanism document.
4. Update current status and the evidence ledger.
5. Reconcile implementation, tests, demo evidence, and submission material.
6. Check links and verify that no frozen reference changed.
