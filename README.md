# Re-entry

Re-entry lets a website ask once, wait for a real business event, and deliver the approved next
step to Codex on the user’s Mac.

```text
Host website -> Re-entry consent -> signed Host event -> background Connector -> fresh Codex session
```

> **Current status:** `saas-boilerplate/` is the active Cloud Receiver v2 bounded preview selected
> by ADR-0033 and extended through ADR-0041. Its local separate-process chain is verified, but it is
> not production-ready: pairing abuse-fence, Consent/Grant lifetime, shared-Core architecture,
> default effect acknowledgement, exact deployed Git, and full deployed-flow gates remain open.
> Only the older `runtime/cloud-receiver/` implementation and its former service are deprecated.

This is an independent challenge project, not an official OpenAI product. Canonical claims live in
[`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md); [`mvp/`](mvp/) remains frozen
technical evidence.

## Retired Cloud Receiver preview

The former account-first preview is no longer a supported product or integration target. Keep the
commands below only to reproduce historical evidence from the repository; do not point new Hosts,
Connectors, credentials, or production traffic at this runtime or at the former hosted alias.

Requirements: macOS for the Local Connector, Node.js 24+, and Codex installed and signed in.

Historical local commands:

```sh
cd runtime/cloud-receiver
npm install
npm start
```

The old preview opened `http://127.0.0.1:43224`, created an account and organization, and installed
the Connector once on the Mac where Codex opened. This flow is preserved for historical replay only:

```sh
npm install --global /absolute/path/to/OpenAI-Web-MCP-Challenge/runtime/local-connector
reentry install \
  --receiver http://127.0.0.1:43224 \
  --codex-cd /absolute/path/to/your/project
```

The historical CLI opened Re-entry in the browser, paired the Mac, and installed a per-user macOS
background job. Check a historical local run with:

```sh
reentry status
```

Do not use the former hosted receiver or its credentials for new work. Its source remains only for
bounded historical replay.

## Active Cloud Receiver v2 preview

`saas-boilerplate/` is the accepted active-v2 implementation base. It provides separate user and
developer accounts, organization/API-key management, account-owned Mac pairing, Receiver-owned
consent, signed Event ingress, delivery claim and acknowledgement APIs, and bounded operations.
The Host SDK and Local Connector target that active contract; current preview origins and exact
evidence are recorded in [Core/00](Docs/Core/00-current-status.md), not promoted here as a
production availability claim.

The active implementation is independently written and does not compose `reentry-core/`. That
conflicts with the accepted one-Receiver-authority architecture and remains a decision under
TASK-028. Pairing abuse fencing, effective Grant lifetime, and default Connector effect-to-ack
composition are also open under TASK-026, TASK-027, and TASK-029. Do not infer closure from green
component or integration tests.

The registry's SDK `0.3.1` is published from exact commit `9864ba0`, but it predates the current
checkout-only `createReentry()` facade shown in the active developer portal. TASK-031 owns the new
version and clean-consumer release gate; use the Host SDK README's local-checkout instruction for
that facade until the gate closes.

The registry's Connector `0.2.20` is also not the current simple-flow consumer. Its metadata reports
root commit `733d77f`, but that commit records Connector version `0.2.14`; the published bundle also
omits the current `continuation.instruction` field and rejects active-v2 leases with
`connector_response_invalid`. TASK-032 owns a new exact-source compatible release. The approved
local integration used the current checkout, so do not substitute `npx` availability for a working
registry-to-active-v2 claim.

## WebMCP and the SDK

The Host SDK now exports one browser action that can be called from normal UI and passed unchanged
to a top-level WebMCP Site Tool:

```text
Host button --------\
                    -> same JavaScript function -> SDK handoff -> Re-entry approval
WebMCP Site Tool ---/

later Host event -> signed Event -> background Connector -> fresh Codex session
```

The Site Tool is only another entrance to the Host's existing JavaScript logic. Browser safety
review is separate from Re-entry consent, and neither one triggers the later business event. See
the [Host SDK WebMCP integration](runtime/host-sdk/README.md#2-use-one-javascript-function-for-ui-and-webmcp)
for the complete code and runnable Next.js sample.

## What is actually connected

| Block | Input | Output |
| --- | --- | --- |
| Host SDK | Host user + current workflow state | signed Manifest, consent request, signed Event |
| Re-entry Cloud | organization auth + signature + account approval | scoped Grant, opaque binding, durable delivery |
| Local Connector | account-linked device credential | one claimed delivery and a bounded Codex activation |
| Codex adapter | canonical URL + workflow/event context | one fresh local `codex exec` process |

This table describes the reusable protocol boundaries and target topology. `saas-boilerplate/` is
the active bounded implementation; `runtime/cloud-receiver/` is deprecated historical evidence.
The table is not a production-availability or complete-product claim.

The Host never receives Re-entry account or device credentials. The Connector never receives Host
keys. Opening consent is not approval; only the authenticated Re-entry action creates a Grant.

## Ask a coding agent to install both sides

Copy this into a coding-agent task and supply only non-secret paths and origins:

```text
Use the reusable Re-entry contracts from this repository. Read Docs/README.md,
Docs/Core/00-current-status.md, Docs/Core/09-business-flows-and-ux.md, runtime/host-sdk/README.md,
runtime/local-connector/README.md, ADR-0032, and ADR-0033 through ADR-0041 first. Use Node.js 24 or
newer. Do not set up or target the deprecated runtime/cloud-receiver package. Use only the accepted
active-v2 Receiver origin for the bounded environment being verified. Integrate runtime/host-sdk
only in the Host server,
keeping the organization API key and Ed25519 private key in server environment configuration. Use
createReentryConsentAction as the one shared browser function for the Host button and the top-level
WebMCP Site Tool; use registerReentryWebMcpTool with a closed schema and preserve the normal button
when WebMCP is unavailable. Confirm approved Receiver status and store the opaque binding only on
the Host server. On the user Mac, install runtime/local-connector globally and run `reentry install`
with the Receiver origin and an absolute Codex project directory; pause for the human to approve the
browser page.
Never expose or commit account cookies, API keys, private keys, Connector tokens, generated
Receiver secrets, or SQLite files. Finish with package verification and an honest
list of unverified genuine Codex Site Tool invocation, production, deployment, and final-effect
assumptions.
```

## Repository layout

```text
reentry-core/             current application-neutral contracts and reference implementation
runtime/cloud-receiver/   [DEPRECATED] historical loopback Cloud Receiver service shell
saas-boilerplate/          active Cloud Receiver v2 bounded preview; production gates remain open
runtime/host-sdk/         Next.js-compatible Host server and browser handoff library
runtime/local-connector/  macOS background Connector and fresh Codex process adapter
mvp/                      frozen MVP1 fixture, runbooks, and bounded evidence
Docs/Core/                canonical product, architecture, trust, and evidence truth
Docs/Mechanisms/          stable Re-entry lifecycle and authority module contracts
Docs/Decisions/           accepted durable choices
Docs/Tasks/               unified lifecycle for pending work, problems, and defects
Docs/Development/         bounded implementation, verification, runbook, and closure records
Docs/Engineering/         project-wide development, testing, and execution controls
Docs/Challenge/           current English challenge routing and refresh gates
Docs/Research/            supporting research and unresolved analysis
Docs/Scenarios/           unselected application mappings
Experiments/              isolated reproducible experiments and verdicts
References/               immutable, external, and historical reference material
```

The reusable runtime integrations live outside `reentry-core/` and frozen `mvp/`:

```text
runtime/host-sdk/         Host server signing, Receiver calls, browser handoff, and Next helpers
runtime/local-connector/  dashboard pairing-code redemption, polling, and Codex activation
```

## What has been verified

The current Re-entry Core locally verifies the application-neutral protocol, Host SDK, Receiver
authority and Grant control, Connector delivery, bounded HTTP transport, independent test-process
fault behavior, deterministic Agent Adapter contract, private managed-context resolution, and a
non-production conformance profile. The active v2 chain additionally passed one Node 24 disposable
composition through the real Host SDK, PostgreSQL Receiver, a separate Local Connector process, an
independent test effect/ack authority, and Receiver restart replay. That proves the named test
composition, not default Connector acknowledgement, a supported external Agent/Browser path,
deployment identity, publication, or production readiness. The retired Stage 1 Cloud Receiver
additionally verified a
real loopback process shell, file-backed composition, redacted health and readiness, graceful
shutdown, and one generic event-to-acknowledgement flow with restart replay. The retired
account-first product preview added browser accounts, organizations and server keys, one-time
dashboard-issued Mac pairing, Re-entry-owned consent, opaque Host bindings, a background macOS
Connector, and a fresh Codex process adapter. Its real HTTP integration test crossed the whole path
through delivery claim. The frozen MVP1 fixture
separately demonstrates genuine page-bound WebMCP continuation and its human-effect boundary.

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
npm run verify
```

See [`reentry-core/README.md`](reentry-core/README.md) for focused checks and bounded benchmark
commands. Passing these checks does not prove deployment, a production service, or real Agent and
Browser activation.

## Verify the retired Cloud Receiver compatibility surface

Requirements: Node.js 24 or newer.

```sh
cd runtime/cloud-receiver
npm run verify
```

See [`runtime/cloud-receiver/README.md`](runtime/cloud-receiver/README.md) for the historical
composition, manual replay commands, retirement boundary, and non-production status. These checks
validate preserved source evidence; they do not establish a live service or supported deployment.

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
3. [`Docs/Tasks/README.md`](Docs/Tasks/README.md) — current non-terminal work, problems, defects, owners, and next gates.
4. [`Docs/Engineering/README.md`](Docs/Engineering/README.md) — project-wide development, testing, verification, and execution controls.
5. [`reentry-core/README.md`](reentry-core/README.md) — current package surface, commands, evidence boundary, and non-claims.
6. [`Docs/Mechanisms/README.md`](Docs/Mechanisms/README.md) — stable module contracts, code and test routing, and application obligations.
7. [`Docs/Development/README.md`](Docs/Development/README.md) — implementation, verification, runbook, and closure records.
8. [`Docs/Core/08-competition-thesis-and-positioning.md`](Docs/Core/08-competition-thesis-and-positioning.md) — competition thesis, core value, positioning, judging posture, and claim hierarchy.
9. [`Docs/Core/01-product-definition.md`](Docs/Core/01-product-definition.md) — concept, mechanism, application boundary, and claim boundary.
10. [`Docs/Core/02-product-requirements.md`](Docs/Core/02-product-requirements.md) — domain-neutral workflow behavior and acceptance criteria.
11. [`Docs/Core/03-system-design.md`](Docs/Core/03-system-design.md) — reusable architecture, lifecycle, contracts, and integration slots.
12. [`Docs/Core/04-trust-security-reliability.md`](Docs/Core/04-trust-security-reliability.md) — authority, controls, and failure semantics.
13. [`Docs/Core/05-validation-and-evidence.md`](Docs/Core/05-validation-and-evidence.md) — proof matrix and evidence gates.
14. [`Docs/Core/06-mvp-and-demo.md`](Docs/Core/06-mvp-and-demo.md) — demo-app selection, challenge scope, build order, and proof rhythm.
15. [`Docs/Challenge/README.md`](Docs/Challenge/README.md) — current challenge constraints and release refresh gates.
16. [`Docs/Core/07-p0-technical-validation-mvp.md`](Docs/Core/07-p0-technical-validation-mvp.md) — frozen technical-validation contract and Q1–Q5 proof boundary.
17. [`Docs/Scenarios/README.md`](Docs/Scenarios/README.md) — concrete examples that do not select the final application.

## Source-of-truth hierarchy

1. Devpost Official Rules control legal eligibility and submission requirements.
2. [`ADR-0002`](Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md) controls the separation between the selected mechanism and the unselected demo app.
3. [`ADR-0006`](Docs/Decisions/ADR-0006-establish-reentry-core-development-baseline.md) controls the current source root, MVP reference freeze, and Receiver/Connector topology.
4. `Docs/Core/00-current-status.md` controls current project status and evidence claims.
5. Each named Core document controls its own product or system surface.
6. Each Mechanism document controls its named lifecycle and authority module within the Core invariants.
7. Each Task record controls its own lifecycle, owner, current increment, dependencies, and next gate; it cannot redefine product truth.
8. `Docs/Engineering/` controls project-wide development, testing, verification, and execution procedure without redefining product truth.
9. Selected scenario and application decisions require a separate accepted ADR.
10. The frozen TenderRelay dossier is an immutable concept reference, not a live specification or app decision.
11. General WebMCP research and earlier ideas are supporting or historical references only.

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
