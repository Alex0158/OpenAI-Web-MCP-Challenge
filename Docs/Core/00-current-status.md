# WebMCP Re-entry Workflow — Current Project Status

**Role:** CANONICAL current project and evidence truth  
**As of:** 2026-09-03, Europe/London  
**Selected direction:** Application-neutral Re-entry Core  
**Host application:** Unselected  
**Agent continuation adapter:** Unselected  
**Phase:** Application-neutral Core remains current; the former `runtime/cloud-receiver/` account-
first runtime is deprecated historical evidence; active `saas-boilerplate/` Cloud Receiver v2,
macOS Connector/Host SDK previews, final application, production controls, and supported Agent
selection remain separately bounded work

## 1. Executive status

The project has implemented and locally verified the application-neutral Re-entry Core at the
scope accepted by ADR-0006 through ADR-0014. RECORE-001 through RECORE-004 and RECORE-006 are
`locally_verified`; RECORE-005 is `separate_process_verified`. The current aggregate Core suite
passes 81 of 81 tests on Node 24; earlier records also cover Node 26. The package has zero runtime
dependencies and 16 selected package files.

The completed Core covers strict protocol values, Host issuance, Receiver-owned enrollment and
Grant authority, signed event acceptance, exact replay, atomic pending delivery, authenticated
Grant control and revocation, target-scoped delivery leases, bounded HTTP and outbound Connector
transport, deterministic Agent activation, private managed-context resolution, process-fault
evidence, and a non-production conformance profile.

Historical records for ADR-0019 and CLOUD-001 describe a loopback-only Cloud Receiver process
shell under `runtime/cloud-receiver/`. ADR-0020 and CLOUD-002 describe a local browser-assisted
pairing control plane and a separately runnable outbound Local Connector under
`runtime/local-connector/`. ADR-0022 and CLOUD-005 describe an organization-authenticated Host-key
and consent-session handoff around the
unchanged Core. The historical runtime suites cover the generic Core flow, pairing and controlled
pairing-store reopen, Host-user mapping, local credential custody, Host-key registration and
migration, signed Manifest and consent-session flow, signed event ingress, Connector claim and
adapter handoff, exact Core-route delegation, bounded health and readiness, configuration failure,
and graceful shutdown.

ADR-0028 and CLOUD-010 added the former account-first product path. ADR-0030 and CLOUD-011
documented its normal enrollment path: the CLI immediately opened the dedicated Re-entry user
account page, the signed-in user clicked Pair this Mac in the dashboard, and the CLI redeemed the
short-lived code. The Host used a dashboard-issued organization key only from its backend, and
Re-entry owned consent and target-device selection. The Local Connector reused its restrictive
credential through a generated per-user macOS LaunchAgent and bounded outbound polling. That code
path remains local preview evidence, while its Cloud Receiver runtime is deprecated. CLOUD-012
replaced the opaque hosted snapshot persistence with native relational
Supabase/Prisma tables and a one-time backfill in the retired preview. The production variables and
additive migration remain historical configuration; the former external `/healthz`, `/readyz`,
canonical developer auth routes, and existing-session user dashboard checks are not current
availability evidence. No new hosted account-auth or pairing traffic is supported.

TASK-010 and HOST-002 add Host SDK v0.3 composition around that accepted path. One ordinary browser
JavaScript function now serves the Host button and a top-level WebMCP Site Tool, opens the exact
Re-entry handoff, and requires Host-server Receiver confirmation before returning a safe
continuation identifier. The Next.js sample separates this first consent request from the later
signed Event. Eighteen SDK tests pass on the recorded Node 24 and Node 26 runtimes; a live Codex
in-app Browser discovered and invoked the tool against an intentionally unconfigured test server.
That runtime evidence proves registration and handler execution, not a configured Browser-to-
Receiver-to-Connector return chain.

ADR-0041, TASK-025, and SDK-006 add an application-neutral simple path over the active Cloud
Receiver v2 without replacing the strict protocol or advanced SDK. A Host developer supplies only
an authenticated subject, bounded prompt, and canonical URL; `createReentry()` derives the signed
Manifest and later Event fields. The v2 developer portal supplies owned organization creation,
one-time API-key reveal with digest-only storage, an interactive simple SDK guide, and redacted
Event/delivery history. One Node 24 disposable composition passed through the real Host SDK,
PostgreSQL Receiver, separately spawned Local Connector worker, independent Host-effect authority,
acknowledgement, and restart replay. Separate developer and end-user browser personas passed after
queued-state and plain-language usability corrections. This increment is
`separate_process_verified`; the Re-entry integration candidate is committed at
`4713024a027a8834745ecccaf88ee85f93cf2885` on `codex/reentry-main-candidate-preview`, and the
active-v2 candidate is committed at `0d7bc3c4282fd3db2e9558874a0941ece3df13f5` on
`codex/cloud-receiver-v2-clean-integration`. Both candidates are now merged into their respective
`main` branches: root merge commit `cdcc0a81aee0b58767ff8450f9a6757339974f92` and active-v2 merge
commit `6b4826f68bb3634d004c49259d9c5311c660d997`. Neither has been deployed from its exact merge
SHA, published, or exercised with a supported external Agent/Browser adapter. The older SDK `0.3.1` is published from exact Git source, but it predates the
working-tree simple facade; TASK-031 owns that separate package release. The published Connector
`0.2.20` reports root `gitHead` `733d77f`, whose source still records Connector version `0.2.14`,
and its bundled client rejects active v2's instruction-bearing lease. TASK-032 owns the exact-source
compatible Connector release; the approved local composition used the current checkout, not that
registry artifact.

The 2026-09-03 TASK-012 reconciliation found four material active-v2 gaps that the green local
suites do not close. **CONFLICTED:** ADR-0033's five-failed-claim pairing fence is not enforceable by
the current anonymous request and is not implemented; TASK-026 owns the decision. **CONFLICTED:**
the SDK requests separate five-minute offer and thirty-minute Grant windows, while v2 copies the
shorter Consent-session expiry into the Grant without displaying it; TASK-027 owns the policy.
**CONFLICTED:** active v2 independently implements Receiver authority despite ADR-0006's one-shared-
Receiver-Core invariant; TASK-028 owns that architecture decision. **VERIFIED OPEN:** the default
Connector dispatch path has no real Host-effect-to-acknowledgement integration and can therefore be
reclaimed within the accepted attempt bound; TASK-029 owns the selected-app completion path. These
findings limit production and whole-product claims; they do not erase the exact bounded test results.
Two additional P1 release findings keep the active install path open: TASK-031 owns the unpublished
simple SDK facade, and TASK-032 owns the non-reproducible, instruction-incompatible Connector
artifact.

CLOUD-006 adds `runtime/reference-system/`, a one-command generic reference consumer that crosses
the complete local path through an actual loopback Host page, pairing, Receiver-owned consent,
signed event, durable delivery, deterministic evidence-only Agent action, independent Host-effect
proof, acknowledgement, idle convergence, and acknowledgement replay after Receiver reopen.

ADR-0023 and HOST-001 add `runtime/application-demo/`, a bounded applicant/reviewer sample Host.
Its real local flow renders the Host SDK consent prompt, persists a simple application, commits
reviewer approval before sending `application.approved`, creates and acknowledges one Receiver
delivery, prepares the visible next-stage plan through an evidence-only Agent, exposes fresh
stage-derived page-bound WebMCP tools, and stops before applicant acceptance. It is integration
evidence only and does not select the final Host product.

The project has not selected or implemented the final Host application, public or production
Receiver profile, concrete Agent adapter, production consent and control sessions, binding capture
or custody, deployment, product validation, judge reproduction, or submission.

## 2. Selected concept

> A user authorizes one bounded future business event. After that event occurs, an available
> continuation adapter may return the bound Agent to the authoritative web page, where the Agent
> reads current state, discovers the Site Tools valid now, continues the same visible work, and
> stops at a human decision boundary.

```text
live WebMCP page
-> signed re-entry offer
-> Receiver-owned consent and scoped Grant
-> authoritative typed business event
-> accepted pending delivery
-> bounded Agent-context activation
-> canonical page re-entry
-> fresh state and Site Tool discovery
-> continued artifact or decision
-> human consequence boundary
```

The mechanism is selected. The domain, user, application, event, artifact, tool schemas, concrete
Agent runtime, and final product name remain open until accepted decisions select them.

## 3. Current decision and evidence state

| Surface | State | Owner or evidence |
|---|---|---|
| Mechanism/application separation | **DECIDED** | ADR-0002 |
| Re-entry Core source and target topology | **DECIDED** | ADR-0006 |
| Protocol, Host, Receiver, delivery, transport, adapter, and private binding contracts | **DECIDED** | ADR-0007 through ADR-0014 |
| Application-neutral implementation | **LOCALLY VERIFIED** | `reentry-core/`, RECORE-001 through RECORE-006 |
| Exact bounded process-fault matrix | **SEPARATE-PROCESS VERIFIED** | RECORE-005 |
| Source conformance profile | **LOCALLY VERIFIED, NON-PRODUCTION** | ADR-0012 and direct conformance execution |
| Stage 1 Cloud Receiver shell | **DEPRECATED, HISTORICAL LOOPBACK EVIDENCE** | ADR-0019, CLOUD-001, and `runtime/cloud-receiver/`; retired by ADR-0032 |
| Local pairing and Local Connector preview | **LOCAL CONNECTOR PREVIEW RETAINED; CLOUD RECEIVER DEPENDENCY DEPRECATED** | ADR-0020, CLOUD-002, and `runtime/{cloud-receiver,local-connector}/` |
| Consent-session and Host SDK handoff preview | **CLOUD RECEIVER PREVIEW DEPRECATED; SDK CONTRACT RETAINED AS EVIDENCE** | ADR-0022, CLOUD-005, paired Host subject, signed Manifest, public challenge, opaque token, approval/decline fencing, public binding, restart, and no raw-token persistence |
| Shared Host UI/WebMCP consent action | **LOCALLY VERIFIED WITH BOUNDED BROWSER RUNTIME EVIDENCE** | TASK-010, HOST-002, Host SDK v0.3 tests/build, and live `request_codex_reentry` discovery plus bounded invocation |
| Simple subject/prompt/URL SDK and v2 developer flow | **SEPARATE-PROCESS VERIFIED; REGISTRY PATH OPEN** | ADR-0041, TASK-025, SDK-006, TASK-031, and TASK-032; 81 Core, 25 SDK, 56 Receiver, 47 Connector tests plus separate-process acknowledgement/restart replay and independent browser personas used current checkouts; published SDK `0.3.1` predates the facade and Connector `0.2.20` rejects its instruction-bearing lease |
| Active v2 contract reconciliation | **P0/P1 DECISIONS OPEN** | Core/09 AUDIT-V2-001 through AUDIT-V2-004 and TASK-026 through TASK-029; pairing abuse fence, Consent/Grant lifetime, Receiver-Core composition, and default effect acknowledgement remain unresolved |
| Re-entry Cloud console preview | **DEPRECATED, HISTORICAL LOOPBACK EVIDENCE** | CLOUD-004 and `runtime/cloud-receiver/`; retired by ADR-0032 |
| Complete generic reference flow | **LOCALLY VERIFIED, EVIDENCE-ONLY AGENT** | CLOUD-006 and `runtime/reference-system/` |
| Application-review sample Host | **LOCALLY VERIFIED, SAMPLE ONLY** | ADR-0023, HOST-001, and `runtime/application-demo/` |
| Frozen MVP1 mechanism proof | **VERIFIED, BOUNDED REFERENCE** | `mvp/` and its evidence index |
| Standalone App Server/Desktop Browser joins | **FAILED FOR BOTH TESTED ROUTES** | Research 19 and frozen probe artifacts |
| Current in-app Browser and page-bound WebMCP | **RUNTIME VERIFIED MANUALLY; CONNECTOR JOIN OPEN** | HOST-001 fresh DRAFT and resumed inventories plus exact resumed-stage invocation |
| Final Host application and user | **UNSELECTED** | new app-selection ADR required |
| Local Codex fresh-session adapter preview | **LOCALLY VERIFIED, PREVIEW ONLY** | ADR-0026, TASK-007, CLOUD-008, and `runtime/local-connector/` |
| macOS Local Connector readiness preview | **LOCALLY VERIFIED, PREVIEW ONLY** | ADR-0027, TASK-008, CLOUD-009, and `runtime/local-connector/` |
| Account-first consent and background Connector path | **CLOUD RECEIVER RUNTIME DEPRECATED; SDK/CONNECTOR SEAMS RETAINED AS PREVIEW EVIDENCE** | ADR-0028, TASK-009, CLOUD-010, and `runtime/{cloud-receiver,host-sdk,local-connector}/` |
| Concrete supported Agent adapter | **UNSELECTED / UNVERIFIED** | route-specific ADR and Browser/WebMCP runtime evidence required |
| Cloud Receiver deployment | **DEPRECATED SOURCE; HOSTED ALIAS NOT ARCHIVED** | ADR-0032, TASK-013, and `runtime/cloud-receiver/api/index.mjs`; the former alias may remain reachable until a separately authorized Vercel action |
| Active Cloud Receiver v2 and web deployment | **CONSENT OPENER FIX DEPLOYED; LIVE ROUTE, DATABASE, DASHBOARD, AND CONNECTOR SMOKES GREEN; FULL DEPLOYED POPUP AND EXACT GIT CLOSURE OPEN** | Active `saas-boilerplate/`; `cloud-receiver-delta.vercel.app` resolves to READY preview-target Receiver deployment `dpl_AVGD8hA7bNwhcEykUQ8BMDbEX2sd`, and `re-entry-weld.vercel.app` resolves to frontend `dpl_8Wy1bUScjdps4ZVscbHeH93f5sFq`. `/consent` now emits `Cross-Origin-Opener-Policy: unsafe-none` while unrelated routes retain `same-origin`; health, database readiness, frontend CORS, authenticated paired-device listing, and active Connector polling passed. No exact commit contains the deployed working-tree snapshot, and a complete deployed Host consent/popup/status/Event run remains open. CLOUD-022 records the bounded evidence and residuals. |
| Product value and judge reproducibility | **UNKNOWN** | selected-app evidence required |
| Submission | **NOT SUBMITTED** | live Devpost readback required |

## 4. Current implementation map

The current reusable contract source is `reentry-core/`. Its stable contracts are routed through the
[Mechanism index](../Mechanisms/README.md):

1. [Host integration, Manifest, and enrollment](../Mechanisms/01-host-integration-manifest-and-enrollment.md);
2. [Receiver Grant and event authority](../Mechanisms/02-receiver-grant-and-event-authority.md);
3. [delivery lease and Local Connector](../Mechanisms/03-delivery-lease-and-local-connector.md);
4. [managed context and Agent activation](../Mechanisms/04-managed-context-and-agent-activation.md); and
5. [Host re-entry, WebMCP, and human boundary](../Mechanisms/05-host-reentry-webmcp-and-human-boundary.md).

The first four have application-neutral local contract evidence. The fifth is a selected-app
obligation with frozen bounded MVP1 evidence; it is not implemented in `reentry-core/`.

`mvp/` is a frozen MVP1 proof fixture. MVP2 remains a preserved contributor reference. Neither is
the active source baseline for new application-neutral behavior.

The first runtime consumer was `runtime/cloud-receiver/`. It wrapped the existing Receiver Core
and HTTP adapter without changing their contracts. Its former product-preview composition added
account-linked Connector authorization, organization-scoped Host-key registration, Re-entry-owned
consent and device selection, and the same verified Connector identity seam. This runtime is now
deprecated under ADR-0032; its source and tests remain historical evidence only. The earlier
Host-code-first pairing and Host-forwarded consent routes remain as historical local evidence, not
the normal product path. `runtime/local-connector/` is one separate outbound-only Node process that
consumes the existing Local Connector client, can run under a generated per-user macOS LaunchAgent,
and contains the opt-in local Codex fresh-session adapter behind the Agent Adapter contract. It
remains a loopback/local preview surface, not a public or production Agent implementation.
CLOUD-004 and CLOUD-010 provide the local Re-entry account, organization, API-key, connected-Mac,
consent, and installation UI; they do not replace Core authority or claim production
authentication. The UI's activity projection is redacted and read-only, not account-scoped
analytics.

`runtime/reference-system/` is the first complete local consumer of all implemented runtime
boundaries. Its reference Host serves a real canonical page with stage-scoped Site Tool
registration and a human-only final control. Its deterministic Agent drives only the local evidence
path; it is not a selected product adapter and its return value is not Host-effect authority.

`runtime/application-demo/` is the first application-shaped sample consumer. It serves one
durable applicant record and separate applicant/reviewer pages, uses the Host SDK browser and
server surfaces, and consumes the same local Receiver and Connector contracts. Its automatic Agent
step remains deterministic evidence; the final application and real Agent bridge remain open.

`runtime/host-sdk/` packages the Host consent action for ordinary UI and WebMCP and now adds the
ADR-0041 `createReentry()` server facade for the normal subject/prompt/URL path. Its Next.js sample
keeps organization and signing credentials in server routes, retains the approved continuation
only in a process-local demo server store, and sends the later Event through a separate route.
The advanced protocol API remains available. Production Host persistence and the selected app
remain open.

`saas-boilerplate/` is the active Cloud Receiver v2 implementation base. Its independently
deployable Express/Prisma backend and Next.js frontend implement separate user/developer sessions,
account pairing, Host-key registration, Receiver-owned consent and target binding, signed Event
ingress, delivery lease/acknowledgement, developer self-service, and bounded operations. It does not
import or compose `reentry-core`; that is a recorded architecture conflict under TASK-028 rather
than an accepted replacement for ADR-0006. Its local and preview-deployment evidence is bounded by
Core/05, CLOUD-022, and SDK-006.

`runtime/local-connector/` now has a terminal-testable Codex fresh-session preview. It can claim one
delivery and start one new local Codex session with a fixed prompt containing the validated
canonical page and continuation instructions; process completion is not Agent, Browser, WebMCP,
Host-effect, or acknowledgement evidence.

TASK-008, CLOUD-009, TASK-009, and CLOUD-010 add macOS Connector readiness and the current install
path. The CLI resolves Codex from
explicit configuration, `CODEX_BINARY`, PATH, or common app locations; validates Node 24+, the
Codex version, and the Host project directory before claiming work. The normal `reentry install`
path opens Re-entry account authorization, stores one delivery-only credential, and installs and
starts a user LaunchAgent. `reentry status`, readable TTY output, and `--json` support both people
and automation. This remains a preview and does not prove cross-machine, Browser, WebMCP, or
deployed reliability.

## 5. Evidence boundary

Current evidence supports these bounded claims:

- Core contracts pass their focused and aggregate local tests;
- exact process compositions cover the recorded revocation, lease, stale-worker, effect-conflict,
  restart, and pre-commit termination cases;
- the source conformance profile runs distinct Host, Receiver, and Connector children and emits a
  redacted result;
- the Stage 1 Cloud Receiver starts as a real child process, reports bounded readiness, closes its
  file-backed composition through `SIGTERM`, and preserves one tested acknowledgement across store
  reopen;
- the local preview creates one Host-user-to-Connector mapping, persists only pairing digests in the
  control store, survives a controlled pairing-store reopen, stores the Connector bearer in a
  restrictive local file, and performs one outbound claim and typed adapter handoff;
- the local preview registers one Host public key with organization authentication, survives a
  controlled control-store reopen, submits one signed Host Manifest through a paired consent
  session, returns one Receiver-owned public binding after approval, fences decline and replay, and
  exposes the resulting Event delivery to the authorized Connector;
- the account-first product path creates one dashboard-issued pairing code and approves one
  account-linked Mac without a Host-generated pairing code, reuses the restrictive local credential, uses a dashboard-issued organization key for
  Host control calls, keeps the approval on the Re-entry origin, targets an eligible device, and
  produces one claimable delivery through bounded background polling;
- the Host SDK shared action passes the same function to ordinary UI and a top-level Site Tool,
  requires server confirmation after popup approval, rejects browser binding exposure, preserves a
  no-WebMCP UI path, and was discovered and invoked on one live local in-app Browser page;
- the simple SDK facade derives one signed consent request and later Event from subject, prompt, and
  canonical URL while keeping credentials and approved continuation server-only; a disposable v2
  composition crossed a separately spawned Connector worker to effect-backed acknowledgement and
  exact restart replay, and independent developer/end-user personas passed the browser flow after
  their findings were corrected;
- the current checkout's instruction-aware Connector passes its bounded local checks, while the
  published `@4xeoz/re-entry@0.2.20` artifact is not exact-source reproducible and rejects the active
  instruction-bearing lease; registry compatibility remains open under TASK-032;
- the local Re-entry Cloud console serves a branded landing page, protects the dashboard with a
  session cookie, creates a hashed preview account, and supports organization and API-key creation
  and revocation without returning stored secrets;
- the complete local reference command changes one visible Host draft, independently verifies the
  exact Host effect, acknowledges the delivery, converges to an idle Connector, and replays the
  acknowledgement after reopening the Receiver stores;
- the application-review sample crosses browser consent, submission, reviewer approval, stable
  event ingress, delivery, visible next-stage preparation, effect acknowledgement, fresh
  page-bound WebMCP invocation, and a negative human-boundary check in the recorded local run;
- the frozen MVP1 suite currently passes 118 tests; and
- bounded P0/H1/H2 evidence demonstrates technical composability in the recorded local/current-
  build environments.

The retired v1 hosted Receiver preview is historical. Active v2 has bounded local, browser, database,
separate-process, and preview-deployment evidence, but neither implementation establishes production
authentication or security controls, arbitrary-crash or power-loss safety, multi-replica behavior,
public Agent activation, cross-user or cross-machine portability, deployed full-chain behavior,
market value, or judge reproduction. Detailed current proof and future gates belong to
[Core/05](05-validation-and-evidence.md); dated history remains in Development, Research,
Experiments, and frozen evidence rather than this status file.

## 6. Binding mechanism invariants

- The Host application owns business truth and current workflow authorization.
- The Receiver owns future continuation authority and never trusts caller-asserted consent.
- The event is a bounded typed state-transition signal, not a prompt or artifact transport.
- Event acceptance, delivery, activation, Host effect, and acknowledgement are separate facts.
- The Host receives only an opaque binding; raw Agent-context custody stays private.
- Re-entry always revalidates the canonical page and discovers the current tool surface.
- The Agent cannot cross the selected human consequence boundary.
- Unsupported capability fails visibly; no hidden transport, retry, context, or tool fallback is
  permitted.

## 7. Current highest-leverage sequence

1. Complete [TASK-001](../Tasks/TASK-001-select-host-application.md) and accept the
   application-selection ADR using Core/06 and the candidate evidence.
2. Create a bounded selected-app Program and domain documentation layer.
3. Specialize the verified sample or implement the selected replacement as the real Host product.
4. Validate and select one supported continuation adapter or explicitly narrow the demo claim.
5. Implement only the production Receiver and Connector profiles required by that selected path.
6. Produce selected-app runtime, product, judge, deployment, and submission evidence.

Closed RECORE records are not reopened merely because application work begins.

## 8. Current non-claims

The project does not currently claim:

- a selected commercial product or validated customer problem;
- a new WebMCP standard or universal Agent continuation protocol;
- a supported public Codex or other Agent wake API;
- production consent identity, credential rotation/recovery, or administration;
- a public or production Cloud Receiver profile or production-grade Local Connector service;
- a production Host-effect verifier or real managed-context activation;
- public deployment, judge reproducibility, release, or submission; or
- historical originality beyond the bounded composition and evidence stated in Core/08.

## 9. Update rule

Update this file only when current phase, strongest evidence state, selected app/runtime,
deployment, or submission truth changes. Put module contracts in `Docs/Mechanisms/`, durable
choices in ADRs, implementation history in Development, and dated experiments in Research or the
owning evidence directory.
