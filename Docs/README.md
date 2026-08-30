# Documentation Map and Governance

**Role:** CANONICAL documentation governance and authority index  
**Status:** Current index  
**Project:** WebMCP re-entry workflow mechanism; demo app and final name TBD  
**Last updated:** 2026-08-30

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
| [`Scenarios/README.md`](Scenarios/README.md) | SUPPORTING | Concrete domain mappings that are not selected product truth |

[`Decisions/ADR-0001-select-tenderrelay.md`](Decisions/ADR-0001-select-tenderrelay.md) is
superseded historical evidence of the first formalization pass.

[`Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md`](Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md)
freezes the domain-neutral technical proof that precedes full application implementation.

[`Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md`](Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md)
separates the project-owned Website Backend-to-Receiver event protocol from the
platform-specific Agent transport and records the local Receiver deployment boundary.

[`Decisions/ADR-0005-run-additive-durable-enrollment-spike.md`](Decisions/ADR-0005-run-additive-durable-enrollment-spike.md)
authorizes an isolated H2 service-contract spike for crash-recoverable enrollment without
changing the frozen P0 or bounded H1 paths.

## 3. Challenge governance

These files remain active for the surfaces they own. They do not select the product.

- [`01-official-rules.md`](01-official-rules.md) — GOVERNING research copy of legal and submission constraints; refresh against live Devpost sources before relying on volatile facts.
- [`02-submission-evaluation-strategy.md`](02-submission-evaluation-strategy.md) — SUPPORTING competition and evaluation strategy.
- [`03-technical-build-verification.md`](03-technical-build-verification.md) — SUPPORTING general WebMCP implementation and verification guidance.
- [`05-requirement-evidence-audit.md`](05-requirement-evidence-audit.md) — SUPPORTING audit of the earlier challenge research package.

## 4. Technical research and evidence

These files preserve current analyses, bounded evidence, conditional risk catalogs, and
named-commit snapshots. Each file's own status banner controls whether it is current,
partially superseded, frozen, or historical; inclusion here does not make every conclusion
an active next step.

- [`Research/01-agent-continuation-adapter-audit.md`](Research/01-agent-continuation-adapter-audit.md) — SUPPORTING evidence audit of exact-thread wake, context-carried continuation, Desktop Browser binding, and the unresolved adapter join.
- [`Research/02-p0-runtime-probe-log.md`](Research/02-p0-runtime-probe-log.md) — SUPPORTING reproducible log of component, App Server, Receiver, Desktop task-control, and Browser capability probes.
- [`Research/03-site-tools-runtime-availability-audit.md`](Research/03-site-tools-runtime-availability-audit.md) — SUPPORTING client prerequisite, feature-gate, App Server boundary, and safe newer-client migration audit.
- [`Research/04-platform-bridge-decision.md`](Research/04-platform-bridge-decision.md) — SUPPORTING current-build Desktop bridge decision, public-route gap, proof-substitution boundary, and P0-versus-production claim limit.
- [`Research/05-distributed-topology-and-hard-coupling-risk-review.md`](Research/05-distributed-topology-and-hard-coupling-risk-review.md) — SUPPORTING conditional production-risk catalog for local P0 topology, distributed seams, and coupling. Core/00 controls current sequencing; Research 07–20 preserve later mechanism evidence, durability, product tests, method calibration, clean-context portability, model variation, transport economics, and platform-boundary verdicts.
- [`Research/06-continuity-value-and-alternative-kill-tests.md`](Research/06-continuity-value-and-alternative-kill-tests.md) — SUPPORTING scientific and product test plan for page authority, exact-thread value, structured continuation memory, and measurable outcomes.
- [`Research/07-supported-reentry-transport-and-heartbeat-spike.md`](Research/07-supported-reentry-transport-and-heartbeat-spike.md) — SUPPORTING official-capability matrix plus the current-build H0b and event-gated H1 scheduled re-entry verdicts.
- [`Research/08-review-05-adjudication-and-p1-trust-delivery-plan.md`](Research/08-review-05-adjudication-and-p1-trust-delivery-plan.md) — SUPPORTING independent disposition of Research 05 and the additive P1 trust/delivery gate.
- [`Research/09-heartbeat-business-viability-and-bounded-use.md`](Research/09-heartbeat-business-viability-and-bounded-use.md) — SUPPORTING bounded H1 runtime evidence, polling economics, commercial kill conditions, and production claim limits.
- [`Research/10-post-h1-unknowns-and-validation-roadmap.md`](Research/10-post-h1-unknowns-and-validation-roadmap.md) — SUPPORTING post-H1 separation of verified mechanism facts, product kill tests, platform durability, production topology, identity, lifecycle, and distributed-reliability unknowns.
- [`Research/11-platform-durability-and-cold-start-audit.md`](Research/11-platform-durability-and-cold-start-audit.md) — SUPPORTING official capability boundary, H2a cold-runtime interpretation, and ordered Desktop/app/device durability protocol.
- [`Research/12-product-value-kill-test-preregistration.md`](Research/12-product-value-kill-test-preregistration.md) — SUPPORTING preregistered controls, safety gates, metrics, and provisional retain/demote/kill rules for notification, exact-task, capsule, and WebMCP materiality tests.
- [`Research/13-exact-task-vs-capsule-method-calibration.md`](Research/13-exact-task-vs-capsule-method-calibration.md) — SUPPORTING hash-frozen method calibration for exact-task history versus a strong bounded continuation capsule. The completed package is [`../Experiments/continuity-calibration/verdict.md`](../Experiments/continuity-calibration/verdict.md); its outcome is `REVISE_PROTOCOL`, with no product-value inference permitted.
- [`Research/14-clean-context-webmcp-portability-smoke.md`](Research/14-clean-context-webmcp-portability-smoke.md) — SUPPORTING verified same-environment C1 evidence. App-held traces show two fresh internal contexts discovering genuine Site Tools and invoking one manifest-annotated read-only tool on the official control and local P0 pages; account, workspace, machine, public deployment, and judge portability remain open.
- [`Research/15-sol-terra-webmcp-model-variation-smoke.md`](Research/15-sol-terra-webmcp-model-variation-smoke.md) — SUPPORTING bounded M1 compatibility evidence. One controller-assigned arm per documented eligible model discovered the same official and local manifests and completed one Site Tool invocation per page; this is not model parity, and scheduled continuation remains open.
- [`Research/16-scheduled-pull-unit-economics-and-transport-kill-model.md`](Research/16-scheduled-pull-unit-economics-and-transport-kill-model.md) — SUPPORTING first-principles watch-window economics, shared-usage stress, value equations, instrumentation, and hard transport falsifiers. It does not invent a Scheduled Task price or select production transport.
- [`Research/17-mvp1-mvp2-comparative-integration-review.md`](Research/17-mvp1-mvp2-comparative-integration-review.md) — SUPPORTING review of Eddie's parallel TenderRelay MVP2 branch against the current mechanism. It preserves MVP2 as a contributor reference, identifies selective UI/demo/adapter reuse, records critical authority and evidence gaps, and does not merge or select the app.
- [`Research/18-receiver-queue-and-wake-adapter-architecture-review.md`](Research/18-receiver-queue-and-wake-adapter-architecture-review.md) — SUPPORTING analysis that recommends a delivery-ledger-first Receiver boundary, treats Heartbeat as a bounded wake fallback, records the current Core decision to freeze D4, and isolates the unresolved supported-transport-to-Browser/WebMCP join.
- [`Research/19-app-server-desktop-browser-join-verdict.md`](Research/19-app-server-desktop-browser-join-verdict.md) — SUPPORTING empirical verdict: the tested cold App-Server-owned thread returned `iab-unavailable` before page access, while standalone resume of the supplied warm task returned an active-writer rejection. Warm priming and writer ownership are controller-attested, not independently proven by the public artifact.
- [`Research/20-workspace-agents-trigger-and-webmcp-boundary.md`](Research/20-workspace-agents-trigger-and-webmcp-boundary.md) — SUPPORTING official-capability audit: external trigger, durable queueing, and stable Workspace Agent conversations are documented, while Browser and genuine page-bound WebMCP remain unproven.

## 5. Deprioritized ideation

- [`04-research-judgment-and-project-options.md`](04-research-judgment-and-project-options.md) is a DEPRIORITIZED broad option map. It no longer selects the active mechanism or application.
- [`../References/Legacy-Ideation/README.md`](../References/Legacy-Ideation/README.md) records all earlier idea surfaces and their current status.
- The `TwinSurface` framing remains useful background but is not the selected concept identity or novelty claim.

## 6. Reference layer

- [`../References/TenderRelay/README.md`](../References/TenderRelay/README.md) — immutable dossier and tender reference package; not an app decision.
- [`../References/WebMCP/00-source-index.md`](../References/WebMCP/00-source-index.md) — official and primary WebMCP source index.
- [`../References/WebMCP_Analysis/README.md`](../References/WebMCP_Analysis/README.md) — broad WebMCP research dossier; supporting and partially historical.
- [`../References/Other/`](../References/Other/) — supporter resources, conflicts, and unresolved external questions.

## 7. Knowledge governance

- [`Knowledge/README.md`](Knowledge/README.md) — cross-layer routing and non-destructive governance for high-value knowledge.
- [`Knowledge/01-priority-and-classification.md`](Knowledge/01-priority-and-classification.md) — four attention levels and independent evidence metadata.
- [`Knowledge/02-high-value-register.md`](Knowledge/02-high-value-register.md) — curated statements that can change a decision, claim, or next validation step.
- [`Knowledge/03-source-reconciliation.md`](Knowledge/03-source-reconciliation.md) — source-family disposition, conflicts, and ordered cleanup backlog.
- [`Knowledge/04-thread-and-memory-distillation.md`](Knowledge/04-thread-and-memory-distillation.md) — redacted synthesis of relevant Codex threads and Memory, without authority over current files.
- [`Knowledge/05-challenge-governance-snapshot.md`](Knowledge/05-challenge-governance-snapshot.md) — English operational digest of challenge hard gates; the Official Rules remain controlling.

The Knowledge package is additive. Core, ADR, governing, evidence, and immutable reference
files retain ownership of their surfaces; the register provides cross-layer routing rather
than a second source of truth.

## 8. Maintenance rules

1. Put canonical project behavior and status in `Core/`, not in the frozen dossier.
2. Use Core/00 and Core/05 for current implementation and evidence, Core/01–04 and Core/06 for target behavior and architecture, and Core/07 only for the frozen P0 contract and its dated outcome.
3. Update `00-current-status.md` whenever phase, evidence, deployment, or submission truth changes.
4. Record a new ADR before changing the core mechanism, selecting or changing the host app, changing the authority model, or moving the MVP boundary.
5. Label statements as **VERIFIED**, **WORKING ASSUMPTION**, **INFERENCE**, **TARGET**, or **UNKNOWN** where status could affect a decision.
6. Do not duplicate volatile challenge facts across Core docs; link to the governing source.
7. Keep the dossier snapshots byte-identical. Import a new version as a new file rather than overwriting version 1.1.
8. Select a host application only through a new ADR that specializes the domain-neutral Core requirements.
9. Product, development, and submission artifacts are written in English. Conversation may use the user's language.

## 9. Update sequence

When a decision or implementation changes:

1. Update or add the relevant decision record.
2. Update the owning Core document.
3. Update current status and the evidence ledger.
4. Reconcile implementation, tests, demo evidence, and submission material.
5. Check links and verify that no frozen reference changed.
