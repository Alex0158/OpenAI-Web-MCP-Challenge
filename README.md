# OpenAI Web MCP Challenge

A technical-validation MVP for a consented WebMCP re-entry workflow.

> **Current status:** The domain-neutral mechanism has passed its controlled P0, H0b, H1,
> H2a, and H2 service-contract gates. The final application, production transport, public
> deployment, product value, and submission remain open.

This repository is an independent challenge project and is not an official OpenAI product.
The canonical status and claim boundary are maintained in
[`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md).

## What this project proves

The implemented fixture demonstrates that a user can authorize one bounded future business
event to return an Agent to the authoritative web workflow, rediscover the Site Tools valid
for the new state, continue the same artifact, and stop before a human-only commitment.

The evidence includes:

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

## Run the fixture

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

The current full deterministic suite contains 88 passing tests. Frozen historical evidence
retains the test counts observed when each acceptance package was captured.

## Evidence

- [`mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md`](mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md) — complete correlated Q1–Q5 Desktop pass.
- [`mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md`](mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md) — independent post-fix rehearsal.
- [`mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md`](mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md) — trigger-only prior-receipt recovery.
- [`mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md`](mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) — event-gated scheduled continuation and idempotency.
- [`mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md`](mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md) — cold Browser-runtime recovery.
- [`mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md`](mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md) — crash-recoverable enrollment service-contract pass.
- [`mvp/evidence/README.md`](mvp/evidence/README.md) — complete evidence index and redaction boundary.

## Start here

1. [`Docs/README.md`](Docs/README.md) — documentation map, authority, and maintenance rules.
2. [`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md) — current truth, phase, assumptions, and next gate.
3. [`Docs/Core/01-product-definition.md`](Docs/Core/01-product-definition.md) — concept, mechanism, application boundary, and claim boundary.
4. [`Docs/Core/02-product-requirements.md`](Docs/Core/02-product-requirements.md) — domain-neutral workflow behavior and acceptance criteria.
5. [`Docs/Core/03-system-design.md`](Docs/Core/03-system-design.md) — reusable architecture, lifecycle, contracts, and integration slots.
6. [`Docs/Core/04-trust-security-reliability.md`](Docs/Core/04-trust-security-reliability.md) — authority, controls, and failure semantics.
7. [`Docs/Core/05-validation-and-evidence.md`](Docs/Core/05-validation-and-evidence.md) — proof matrix and evidence gates.
8. [`Docs/Core/06-mvp-and-demo.md`](Docs/Core/06-mvp-and-demo.md) — demo-app selection, challenge scope, build order, and proof rhythm.
9. [`Docs/Core/07-p0-technical-validation-mvp.md`](Docs/Core/07-p0-technical-validation-mvp.md) — frozen technical-validation contract and Q1–Q5 proof boundary.
10. [`Docs/Scenarios/README.md`](Docs/Scenarios/README.md) — concrete examples that do not select the final application.
11. [`Docs/Knowledge/README.md`](Docs/Knowledge/README.md) — cross-layer priority model, high-value register, source reconciliation, and thread/Memory distillation.

## Source-of-truth hierarchy

1. Devpost Official Rules control legal eligibility and submission requirements.
2. [`ADR-0002`](Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md) controls the separation between the selected mechanism and the unselected demo app.
3. `Docs/Core/00-current-status.md` controls current project status and evidence claims.
4. Each named Core document controls its own product or system surface.
5. Selected scenario and application decisions require a separate accepted ADR.
6. The frozen TenderRelay dossier is an immutable concept reference, not a live specification or app decision.
7. General WebMCP research and earlier ideas are supporting or historical references only.

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
