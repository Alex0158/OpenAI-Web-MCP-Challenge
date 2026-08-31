# OpenAI Web MCP Challenge

An application-neutral Re-entry Core plus preserved technical evidence for a consented WebMCP
workflow that can continue after the original page session or Agent turn has ended.

> **Current status:** The application-neutral Re-entry Core Program is complete at its
> `locally_verified` boundary. The final Host application, production process shells, supported
> Agent continuation adapter, deployment, product proof, judge reproduction, and submission remain
> separate open gates.

This repository is an independent challenge project and is not an official OpenAI product.
The canonical status and claim boundary are maintained in
[`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md). The current reusable source is
[`reentry-core/`](reentry-core/); [`mvp/`](mvp/) is a frozen MVP1 proof and evidence reference.

## Repository layout

```text
reentry-core/             current application-neutral contracts and reference implementation
mvp/                      frozen MVP1 fixture, runbooks, and bounded evidence
Docs/Core/                canonical product, architecture, trust, and evidence truth
Docs/Mechanisms/          stable Re-entry lifecycle and authority module contracts
Docs/Decisions/           accepted durable choices
Docs/Development/         bounded implementation, verification, runbook, and closure records
Docs/Challenge/           current English challenge routing and refresh gates
Docs/Research/            supporting research and unresolved analysis
Docs/Scenarios/           unselected application mappings
Experiments/              isolated reproducible experiments and verdicts
References/               immutable, external, and historical reference material
```

After an accepted app-selection ADR, selected-app and deployable runtime code should default to
the following placement outside `reentry-core/` and `mvp/`, unless that ADR records a narrower
reasoned layout:

```text
app/                      selected Host application, Host backend, WebMCP tools, and Host Adapter
runtime/cloud-receiver/   hosted process shell around Receiver Core, when implemented
runtime/local-connector/  device-side Connector and concrete Agent adapter, when implemented
```

Do not create those directories before their first real implementation, and do not move current
Core code merely to anticipate a larger workspace.

## What has been verified

The current Re-entry Core locally verifies the application-neutral protocol, Host SDK, Receiver
authority and Grant control, Connector delivery, bounded HTTP transport, independent test-process
fault behavior, deterministic Agent Adapter contract, private managed-context resolution, and a
non-production conformance profile. The frozen MVP1 fixture separately demonstrates that a user
can authorize one bounded future business event to return an Agent to an authoritative web
workflow, rediscover the Site Tools valid for the new state, continue the same artifact, and stop
before a human-only commitment.

The frozen MVP1 runtime evidence includes:

- genuine page-bound WebMCP discovery and invocation in both workflow stages;
- Receiver-owned consent, scoped Grants, and private managed-context binding;
- authenticated typed events, run reservation, replay control, and opaque Host bindings;
- canonical page re-entry, fresh state validation, and state-derived Site Tools;
- one idempotent Host effect across acknowledgement loss and exact event replay;
- controlled recovery after task-scoped Browser-kernel loss; and
- an additive crash-recoverable enrollment service contract with a sealed outbox and an
  idempotent durable synthetic destination.

These are bounded technical results. They do not establish a supported production bridge,
cross-user or offline durability, a selected customer problem, market demand, deployment, or
submission readiness.

## End-to-end mechanism

```text
live WebMCP page
-> signed re-entry offer
-> Receiver validation and user consent
-> scoped Grant and opaque Host binding
-> authoritative typed business event
-> intended Agent-context continuation
-> canonical page re-entry
-> fresh state and Site Tool discovery
-> bounded continuation
-> human decision boundary
```

## Verify Re-entry Core

Requirements: Node.js 24 or newer.

```sh
cd reentry-core
npm test
node conformance/run.mjs
```

See [`reentry-core/README.md`](reentry-core/README.md) for focused checks and bounded benchmark
commands. Passing these checks does not prove deployment, a production service, or real Agent and
Browser activation.

## Run the frozen MVP1 fixture

Requirements: Node.js 24 or newer.

```sh
cd mvp
npm test
npm run reset
npm start
```

Then open `http://127.0.0.1:4317/workflows/WF-001`.

The default local server uses the deterministic synthetic adapter. It is useful for
development and contract testing but does not by itself prove Desktop task resumption.
Follow [`mvp/RUNBOOK.md`](mvp/RUNBOOK.md) for the bounded genuine-WebMCP P0 procedure and
[`mvp/H1_RUNBOOK.md`](mvp/H1_RUNBOOK.md) for the scheduled-pull experiment.

The current full deterministic suite contains 118 passing tests. Frozen historical evidence
retains the test counts observed when each acceptance package was captured, including the
88-test H2-era full-suite result.

Both standalone Codex App Server Browser-join arms failed on the tested current build. The cold
App-Server-owned thread resumed exactly, but the Browser selector returned `iab-unavailable`
before page access; that signal does not identify which precondition was absent. The warm arm
returned an active-writer rejection for the exact task supplied
by the controlled Desktop-priming step. These results reject both tested standalone App Server
Desktop joins and remove that route from current selection unless a materially different supported
contract or topology appears; they do not reject App Server thread control outside those tested
joins. App selection is the current gate. A published Workspace Agent is a
conditional distinct hosted-topology probe only when entitlement and the selected app justify it;
it must carry its own Browser/WebMCP evidence boundary. Scheduled Heartbeat remains a bounded
fallback experiment, not the core mechanism or a production transport. The preserved D4
Desktop-restart harness remains optional compatibility evidence.

## Frozen MVP1 evidence

- [`mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md`](mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md) — complete correlated Q1–Q5 Desktop pass.
- [`mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md`](mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md) — independent post-fix rehearsal.
- [`mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md`](mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md) — trigger-only prior-receipt recovery.
- [`mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md`](mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) — event-gated scheduled continuation and idempotency.
- [`mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md`](mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md) — cold Browser-runtime recovery.
- [`mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md`](mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md) — crash-recoverable enrollment service-contract pass.
- [`mvp/evidence/app-server-browser-join-probe-2026-08-30.json`](mvp/evidence/app-server-browser-join-probe-2026-08-30.json) — failed cold App Server/Desktop Browser join (`iab-unavailable`).
- [`mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json`](mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json) — failed exact warm join (active-writer rejection).
- [`mvp/evidence/README.md`](mvp/evidence/README.md) — complete evidence index and redaction boundary.

## Start here

1. [`Docs/README.md`](Docs/README.md) — documentation map, authority, and maintenance rules.
2. [`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md) — current truth, phase, assumptions, and next gate.
3. [`reentry-core/README.md`](reentry-core/README.md) — current package surface, commands, evidence boundary, and non-claims.
4. [`Docs/Mechanisms/README.md`](Docs/Mechanisms/README.md) — stable module contracts, code and test routing, and application obligations.
5. [`Docs/Development/README.md`](Docs/Development/README.md) — development workflow, runbook, Program records, and closure states.
6. [`Docs/Core/08-competition-thesis-and-positioning.md`](Docs/Core/08-competition-thesis-and-positioning.md) — competition thesis, core value, positioning, judging posture, and claim hierarchy.
7. [`Docs/Core/01-product-definition.md`](Docs/Core/01-product-definition.md) — concept, mechanism, application boundary, and claim boundary.
8. [`Docs/Core/02-product-requirements.md`](Docs/Core/02-product-requirements.md) — domain-neutral workflow behavior and acceptance criteria.
9. [`Docs/Core/03-system-design.md`](Docs/Core/03-system-design.md) — reusable architecture, lifecycle, contracts, and integration slots.
10. [`Docs/Core/04-trust-security-reliability.md`](Docs/Core/04-trust-security-reliability.md) — authority, controls, and failure semantics.
11. [`Docs/Core/05-validation-and-evidence.md`](Docs/Core/05-validation-and-evidence.md) — proof matrix and evidence gates.
12. [`Docs/Core/06-mvp-and-demo.md`](Docs/Core/06-mvp-and-demo.md) — demo-app selection, challenge scope, build order, and proof rhythm.
13. [`Docs/Challenge/README.md`](Docs/Challenge/README.md) — current challenge constraints and release refresh gates.
14. [`Docs/Core/07-p0-technical-validation-mvp.md`](Docs/Core/07-p0-technical-validation-mvp.md) — frozen technical-validation contract and Q1–Q5 proof boundary.
15. [`Docs/Scenarios/README.md`](Docs/Scenarios/README.md) — concrete examples that do not select the final application.

## Source-of-truth hierarchy

1. Devpost Official Rules control legal eligibility and submission requirements.
2. [`ADR-0002`](Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md) controls the separation between the selected mechanism and the unselected demo app.
3. [`ADR-0006`](Docs/Decisions/ADR-0006-establish-reentry-core-development-baseline.md) controls the current source root, MVP reference freeze, and Receiver/Connector topology.
4. `Docs/Core/00-current-status.md` controls current project status and evidence claims.
5. Each named Core document controls its own product or system surface.
6. Each Mechanism document controls its named lifecycle and authority module within the Core invariants.
7. Selected scenario and application decisions require a separate accepted ADR.
8. The frozen TenderRelay dossier is an immutable concept reference, not a live specification or app decision.
9. General WebMCP research and earlier ideas are supporting or historical references only.

## Preservation rule

The imported TenderRelay dossier and architecture image are byte-for-byte snapshots. They
must never be edited in place. Mechanism refinements belong in `Docs/Core/`; tender-specific
refinements belong in `Docs/Scenarios/`; application selection belongs in a new ADR.

## Historical research

The original 2026-08-28 non-English research entry point is preserved as a legacy snapshot
in
[`References/Legacy-Ideation/challenge-research-package-readme-2026-08-28.md`](References/Legacy-Ideation/challenge-research-package-readme-2026-08-28.md).
It is non-normative; current project truth lives in `Docs/Core/`.

## Publication boundary

Local databases, runtime secrets, private task identifiers, bearer capabilities, and mutable
development traces are intentionally excluded from version control. Public evidence retains
only the bounded redacted records needed to support its stated claims.

## License

Original project code and documentation are available under the [MIT License](LICENSE).
Reference material and third-party rights are described in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
