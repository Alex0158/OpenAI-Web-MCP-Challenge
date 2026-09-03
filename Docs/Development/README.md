# Development and Closure

**Role:** CANONICAL Program, implementation, verification, runbook, and closure index  
**Status:** Application-neutral Core and project-wide engineering-governance closure baseline  
**Last updated:** 2026-09-03

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
| [`RECORE-007`](RECORE-007-standing-authorization-v0.2-reference.md) | Prove additive standing authorization through one Consent, two sequential acknowledged signals, one-active backpressure, restart, replay, and revocation while preserving v0.1 | `locally_verified` application-neutral SDK/HTTP/Core/Connector/Adapter reference; active-v2 and product adoption open |
| [`DOCS-001`](DOCS-001-documentation-architecture-reconciliation.md) | Reconcile repository entry points, documentation routing, Core completion wording, and future source placement without changing product behavior | `locally_verified` |
| [`DOCS-002`](DOCS-002-modular-authority-and-core-denoising.md) | Establish mechanism-module ownership, reduce mixed-role Core content, and remove the duplicate Knowledge routing layer | `locally_verified` |
| [`DOCS-003`](DOCS-003-unified-task-authority.md) | Establish one unified task lifecycle for pending work, problems, defects, investigations, and decision needs | `locally_verified` |
| [`DOCS-004`](DOCS-004-business-flow-reconciliation.md) | Reconcile the canonical business-flow map with current implementation, tests, user-facing guides, and evidence | `in_progress` |
| [`DOCS-005`](DOCS-005-sleepless-kingdom-application-selection.md) | Select Sleepless Kingdom as the Host application and reconcile the outer Core, Mechanism, Task, scenario, and index authorities | `locally_verified` |
| [`ENG-001`](ENG-001-project-engineering-governance-baseline.md) | Establish the project-wide engineering authority, mechanical repository checks, aggregate Core verification, and CI baseline | `locally_verified` with exact-source CI success |
| [`ENG-002`](ENG-002-collaborator-agent-guidance-reconciliation.md) | Make repository contributor guidance self-contained and restore the AGENTS, Runbook, Core, and evidence placement boundary | `locally_verified` |
| [`ENG-003`](ENG-003-collaborative-source-of-truth-and-git-gates.md) | Establish human-request authority checks, canonical writeback, and multi-computer Git synchronization gates | `locally_verified` |
| [`CLOUD-001`](CLOUD-001-stage-one-cloud-receiver-shell.md) | Implement the loopback-only Cloud Receiver process shell around the existing Core and file-backed SQLite | `locally_verified` |
| [`CLOUD-002`](CLOUD-002-local-pairing-and-connector-preview.md) | Implement the local browser-assisted pairing control plane and separate outbound Local Connector preview | `locally_verified` |
| [`CLOUD-003`](CLOUD-003-host-key-registration-and-event-ingress-preview.md) | Register one Host public key and prove signed event acceptance becomes a claimable delivery | `locally_verified` |
| [`CLOUD-004`](CLOUD-004-cloud-console-preview.md) | Add the local Re-entry Cloud landing page, lightweight account flow, organization dashboard, and API-key preview | `locally_verified` |
| [`CLOUD-005`](CLOUD-005-consent-session-preview.md) | Connect signed Host Manifests and the browser decision prompt to Receiver-owned Grant creation | `locally_verified` |
| [`CLOUD-006`](CLOUD-006-complete-local-reference-flow.md) | Run the complete generic Host-to-Reentry-to-Connector-to-effect reference flow with an evidence-only Agent | `locally_verified` |
| [`HOST-001`](HOST-001-application-review-sample.md) | Build an application-review sample Host across consent, reviewer approval, continuation, effect acknowledgement, and a human-only final boundary | `locally_verified` |
| [`HOST-002`](HOST-002-webmcp-host-sdk-composition.md) | Compose one Host JavaScript action across normal UI, WebMCP registration, Re-entry consent, server confirmation, and the separate later Event | `locally_verified` with bounded Browser runtime evidence |
| [`CLOUD-007`](CLOUD-007-local-codex-queue-adapter-preview.md) | Add an opt-in local Codex queue adapter inside the one-process Local Connector | `locally_verified` |
| [`CLOUD-008`](CLOUD-008-local-fresh-codex-session-preview.md) | Start a fresh local Codex session with validated continuation context from the one-process Local Connector | `locally_verified` |
| [`CLOUD-009`](CLOUD-009-macos-local-connector-readiness.md) | Preflight the macOS Local Connector and document installation and pairing | `locally_verified` |
| [`CLOUD-010`](CLOUD-010-account-first-connector-flow.md) | Connect Re-entry account authorization, browser consent, background Connector delivery, and fresh Codex dispatch | `locally_verified` |
| [`CLOUD-011`](CLOUD-011-dashboard-issued-connector-pairing.md) | Replace hidden device authorization with dashboard-issued Connector pairing code redemption | `locally_verified` |
| [`CLOUD-012`](CLOUD-012-native-relational-cloud-schema.md) | Replace opaque hosted snapshots with a native relational Cloud Receiver schema and one-time backfill | `verification_pending` |
| [`CLOUD-013`](CLOUD-013-retire-current-cloud-receiver-runtime.md) | Mark the current Cloud Receiver runtime, hosted preview, and supporting records as deprecated while preserving historical evidence | `locally_verified` |
| [`CLOUD-014`](CLOUD-014-cloud-receiver-v2-pairing.md) | Cloud Receiver v2 Pairing Feature 1 and process-restart evidence in the replacement SaaS boilerplate | `closed` — locally verified |
| [`CLOUD-015`](CLOUD-015-cloud-receiver-v2-consent-targeting.md) | Cloud Receiver v2 Consent, Targeting, and Internal Revocation | `locally_verified` — Feature 2 closed |
| [`SDK-003`](SDK-003-cloud-receiver-v2-contract-tests.md) | Prepare SDK Host-key, consent-session, status, and browser-handoff contract tests against Cloud Receiver v2 | `verified` — local contract and browser flows passed |
| [`CLOUD-016`](CLOUD-016-cloud-receiver-v2-signed-event-ingress.md) | Cloud Receiver v2 signed Host Event ingress and atomic pending-delivery creation | `locally_verified` — Feature 3 closed |
| [`CLOUD-017`](CLOUD-017-cloud-receiver-v2-delivery-claim.md) | Cloud Receiver v2 target-scoped Delivery Claim, bounded lease, replay, and retry exhaustion | `locally_verified` — Feature 4 closed |
| [`CLOUD-018`](CLOUD-018-cloud-receiver-v2-delivery-acknowledgement.md) | Cloud Receiver v2 effect-backed Delivery Acknowledgement and durable replay | `locally_verified` — Feature 5 mapping resolved; default product effect authority remains separately open under TASK-029 |
| [`CLOUD-019`](CLOUD-019-cloud-receiver-v2-transport-operations.md) | Cloud Receiver v2 bounded HTTP transport, errors, health, readiness, and redacted operations | `locally_verified` — Feature 6 closed |
| [`CLOUD-020`](../Cloud-Receiver-Handoff/v2-build/09-cloud-receiver-test-exchange.md) | Exchange exact Cloud Receiver, Local Connector, and SDK integration tests | `verification_pending` — counterpart SHA and Core mapping decision remain |
| [`CLOUD-021`](CLOUD-021-connector-self-disconnection.md) | Active v2 Connector self-disconnection, remote-first local cleanup, and disconnected account-device projection | `hosted_runtime_verified` — exact Git closure pending |
| [`CLOUD-022`](CLOUD-022-v2-consent-and-developer-experience.md) | Active v2 consent/auth UX, Receiver-origin decision guard, session-aware entry, and interactive SDK guidance | `verification_pending` — local popup decision green and opener fix deployed; exact Git plus complete deployed popup flow open; guide session CTA remains inconsistent |
| [`CLOUD-023`](CLOUD-023-standing-receiver-source-gate.md) | Additive standing Receiver kernel and fail-closed committed-source preflight | Core and Receiver locally committed; minimum pinned real-store trace and exact-commit PostgreSQL upgrade `locally_verified`; full release conformance and public controls remain open |
| [`SDK-004`](SDK-004-cloud-receiver-v2-event-contract-tests.md) | Prepare SDK `sendEvent()` contract verification for Cloud Receiver v2 Feature 3 | `closed` — `7/7` Event cases and normal SDK `18/18` passed against `b851c320` |
| [`SDK-005`](SDK-005-cloud-receiver-v2-full-chain-contract.md) | Prepare SDK-to-Receiver full-chain contract coverage through downstream acknowledgement | `local_release_gate_complete / publication_blocked` — pinned local full chain passed; npm authentication and deployed smoke remained external gates |
| [`SDK-006`](SDK-006-simple-consented-continuation-flow.md) | Add the simple subject/prompt/URL facade, developer self-service portal, consented instruction, and coordinated full-chain proof | `separate_process_verified` — aggregate tests, browser personas, acknowledgement, and restart replay green from current checkouts; registry SDK `0.3.1` predates the facade and Connector `0.2.20` rejects the active instruction-bearing lease, so TASK-031/TASK-032 plus deployment and concrete Agent gates remain open |

The [Feature 2 implementation summary](CLOUD-015-feature2-implementation-summary.md) is retained as
companion implementation detail for CLOUD-015; it does not own a separate lifecycle or evidence
status.

## Verification reports

- [`SDK v2 Verification Report`](SDK-V2-Verification-Report.md) — post-push SDK-to-Cloud-Receiver v2
  contract and real-browser evidence.
- [`SDK v2 Full-Chain Verification Report`](SDK-V2-Full-Chain-Verification-Report.md) — exact
  Cloud Receiver Feature 4–6 compatibility history and the later closed local release gate.
- [`SDK-006 Simple Consented Continuation Flow`](SDK-006-simple-consented-continuation-flow.md) —
  current simple-facade, developer-portal, separate-process, browser-persona, and claim-boundary
  evidence.
- [`LOCAL-001 Local Connector v2 Claim/Acknowledgement Integration`](LOCAL-001-cloud-receiver-v2-claim-ack-integration.md) — exact Local Connector counterpart, Claim/Acknowledgement matrices, runtime/database evidence, and the open ACK-003 mapping gate.

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
