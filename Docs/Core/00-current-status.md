# WebMCP Re-entry Workflow — Current Project Status

**Role:** CANONICAL current project and evidence truth  
**As of:** 2026-09-03, Europe/London  
**Selected direction:** Re-entry Core with Sleepless Kingdom as the first Host application  
**Host application:** Sleepless Kingdom, selected by ADR-0042  
**Agent continuation adapter:** Unselected  
**Phase:** Application-neutral Core remains current; the former `runtime/cloud-receiver/` account-
first runtime is deprecated historical evidence; active `saas-boilerplate/` Cloud Receiver v2,
macOS Connector/Host SDK previews, selected Game integration, active-v2 standing-authorization
adoption, production controls, and supported Agent selection remain separately bounded work

## 1. Executive status

The project has implemented and locally verified the application-neutral Re-entry Core at the
scope accepted by ADR-0006 through ADR-0014. RECORE-001 through RECORE-004, RECORE-006, and the
additive ADR-0043 through ADR-0045 RECORE-007 reference are `locally_verified`; RECORE-005 is
`separate_process_verified`. The current aggregate Core suite passes 153 of 153 tests on Node 24.
The package has zero runtime dependencies and 19 selected package files.

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
ADR-0044 resolves the implementation-identity decision: active v2 may remain independently
implemented only behind the pinned normative Receiver conformance suite. **VERIFICATION PENDING:**
the active-v2 standing kernel is locally committed, its exact-source PostgreSQL upgrade preserves
the old fixture rows, and the minimum shared trace passes against a reviewed Core commit. Full
pinned conformance, recovery coverage, and release enforcement remain open under TASK-028. **VERIFIED
OPEN:** the default Connector dispatch path has no real Host-effect-to-acknowledgement integration
and can therefore be reclaimed within the accepted attempt bound; TASK-029 owns the selected-app
completion path. These
findings limit production and whole-product claims; they do not erase the exact bounded test results.
Two additional P1 release findings keep the active install path open: TASK-031 owns the unpublished
simple SDK facade, and TASK-032 owns the non-reproducible, instruction-incompatible Connector
artifact.

ADR-0043 through ADR-0045 accept an additive protocol-v0.2 standing-authorization and transport
profile: one informed Consent decision may authorize repeated ordered Agent signals while each
signal still receives only one bounded activation. RECORE-007 now locally verifies the
application-neutral chain through a low-level standing Host SDK, exact `/v0.2` HTTP Receiver,
Core/SQLite, version-selected Connector client, Agent Adapter, two deterministic effect
acknowledgements, restart, inspection, revocation, and historical replay. The Node 24 aggregate is
green at 153/153 after the CLOUD-023 source-owner review. The reference now keeps the private receipt out of Host-visible approval, pins
each standing Grant to the consented Host key ID and public-key material, rejects approval/Event
timestamps at their expiry boundaries, and fails closed on inconsistent private Delivery state.
Mutating reference operations resolve time and live authority after the SQLite writer lock;
20 deterministic boundary regressions cover stale-authority and backdated-revocation risks.
The shared scenario checks exact success envelopes and correlation, with 21 oracle self-tests;
these additions do not establish the full shared race, rollback, or crash matrix.
Schema 6 preserves but security-disables older preview Grants lacking key-material evidence;
ordinary new-Grant restarts do not require another Consent. **LOCALLY VERIFIED, NOT RELEASED:** the
active Receiver `Re-Entry` source now adds separate standing tables and real Express v0.2
routes. Its 156-test backend aggregate, type-check, build, and shared two-signal trace passed against
disposable PostgreSQL. Consent/control are internal seams and Host-effect authority is deterministic;
both Core and Receiver sources are committed locally, the minimum pinned trace passes, and the
exact-commit six-to-seven PostgreSQL upgrade preserves 13 old tables and 10 fixture rows before
any reseeding. Full release conformance is unproved. The normal Host facade,
product/published Connector v0.2 selection, Sleepless Kingdom, and an external Agent/Browser remain
unintegrated. TASK-028/TASK-033 and the
[Receiver verification record](../../saas-boilerplate/backend/conformance/standing-v0.2/README.md)
own the remaining source, control, and adoption gates.

ADR-0042 selects Sleepless Kingdom under `WebApp/Web-Game/` as the first Host application and
challenge-demo carrier. The selected v0.1 compatibility slice is one shelter owner, one approved
`CargoLostToMonster` Event, fresh canonical-page reads, and a conditional
`force_recall_soldier` action, while high-consequence Game actions remain human-confirmed. The Game
already has bounded local gameplay, causal-signal, WebMCP-read, and local page-recall evidence, but
those pieces are not a live Receiver-to-Connector-to-Agent-to-authenticated-page chain. ADR-0045's
repeatable standing mode now has a local application-neutral SDK-to-Adapter reference proof, but it
does not turn the current Game, active Receiver, normal Host facade, product Connector, or external
runtime into v0.2 evidence.

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

The project has selected and partially implemented Sleepless Kingdom as the Host application. It has
not proved the Game's Manifest/Consent enrollment, external signed Event handoff, compatible
published Connector, concrete supported Agent adapter, authenticated Browser return, dynamic recall
through genuine WebMCP after Re-entry, production effect acknowledgement, public production
Receiver/Game profile, product validation, judge reproduction, or submission.

## 2. Selected concept

> A user authorizes one bounded future continuation relationship. Protocol v0.1 permits one Event;
> the accepted protocol-v0.2 standing mode permits repeated ordered Agent signals without repeated
> Consent. Every signal still creates only one bounded activation that returns the Agent to the
> authoritative page to read current state, discover the Site Tools valid now, continue visible
> work, and stop at the human boundary.

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

The mechanism and first Host are selected. Sleepless Kingdom supplies the shelter owner, persistent
mission decision, first `CargoLostToMonster` continuation, fresh Game reads, conditional recall, and
human-confirmed consequence boundary. The concrete Agent runtime, production profile, commercial
customer, cross-layer standing-mode adoption, and final market/distribution model remain open.

## 3. Current decision and evidence state

| Surface | State | Owner or evidence |
|---|---|---|
| Mechanism/application separation | **DECIDED** | ADR-0002 |
| Re-entry Core source and target topology | **DECIDED** | ADR-0006 |
| Protocol, Host, Receiver, delivery, transport, adapter, and private binding contracts | **DECIDED** | ADR-0007 through ADR-0014 |
| Standing authorization and repeatable activation | **LOCALLY VERIFIED APPLICATION-NEUTRAL CROSS-LAYER REFERENCE; ACTIVE/GAME ADOPTION OPEN** | ADR-0043 through ADR-0045, TASK-033, and RECORE-007; low-level Host SDK -> v0.2 HTTP -> Core/SQLite -> Connector -> Agent Adapter passed one Consent/two acknowledged signals/backpressure/restart/revoke on Node 24 |
| Application-neutral implementation | **LOCALLY VERIFIED** | `reentry-core/`, RECORE-001 through RECORE-007 |
| Exact bounded process-fault matrix | **SEPARATE-PROCESS VERIFIED** | RECORE-005 |
| Source conformance profile | **LOCALLY VERIFIED, NON-PRODUCTION** | ADR-0012 and direct conformance execution |
| Stage 1 Cloud Receiver shell | **DEPRECATED, HISTORICAL LOOPBACK EVIDENCE** | ADR-0019, CLOUD-001, and `runtime/cloud-receiver/`; retired by ADR-0032 |
| Local pairing and Local Connector preview | **LOCAL CONNECTOR PREVIEW RETAINED; CLOUD RECEIVER DEPENDENCY DEPRECATED** | ADR-0020, CLOUD-002, and `runtime/{cloud-receiver,local-connector}/` |
| Consent-session and Host SDK handoff preview | **CLOUD RECEIVER PREVIEW DEPRECATED; SDK CONTRACT RETAINED AS EVIDENCE** | ADR-0022, CLOUD-005, paired Host subject, signed Manifest, public challenge, opaque token, approval/decline fencing, public binding, restart, and no raw-token persistence |
| Shared Host UI/WebMCP consent action | **LOCALLY VERIFIED WITH BOUNDED BROWSER RUNTIME EVIDENCE** | TASK-010, HOST-002, Host SDK v0.3 tests/build, and live `request_codex_reentry` discovery plus bounded invocation |
| Simple subject/prompt/URL SDK and v2 developer flow | **SEPARATE-PROCESS VERIFIED; REGISTRY PATH OPEN** | ADR-0041, TASK-025, SDK-006, TASK-031, and TASK-032; 81 Core, 25 SDK, 56 Receiver, 47 Connector tests plus separate-process acknowledgement/restart replay and independent browser personas used current checkouts; published SDK `0.3.1` predates the facade and Connector `0.2.20` rejects its instruction-bearing lease |
| Active v2 contract reconciliation | **LOCAL SOURCE, UPGRADE, AND MINIMUM PINNED TRACE VERIFIED; RELEASE AND POLICY WORK OPEN** | ADR-0044, CLOUD-023, and TASK-028; the Express standing trace passes against committed Core and Receiver source, and the exact-commit additive upgrade preserves old rows/catalog on disposable PostgreSQL. Full conformance/recovery/release enforcement, public controls, pairing abuse fence, lifetime policy, and production effect acknowledgement remain open |
| Re-entry Cloud console preview | **DEPRECATED, HISTORICAL LOOPBACK EVIDENCE** | CLOUD-004 and `runtime/cloud-receiver/`; retired by ADR-0032 |
| Complete generic reference flow | **LOCALLY VERIFIED, EVIDENCE-ONLY AGENT** | CLOUD-006 and `runtime/reference-system/` |
| Application-review sample Host | **LOCALLY VERIFIED, SAMPLE ONLY** | ADR-0023, HOST-001, and `runtime/application-demo/` |
| Frozen MVP1 mechanism proof | **VERIFIED, BOUNDED REFERENCE** | `mvp/` and its evidence index |
| Standalone App Server/Desktop Browser joins | **FAILED FOR BOTH TESTED ROUTES** | Research 19 and frozen probe artifacts |
| Current in-app Browser and page-bound WebMCP | **RUNTIME VERIFIED MANUALLY; CONNECTOR JOIN OPEN** | HOST-001 fresh DRAFT and resumed inventories plus exact resumed-stage invocation |
| Host application and first user/workflow | **SELECTED; PARTIALLY IMPLEMENTED** | ADR-0042; Sleepless Kingdom under `WebApp/Web-Game/`; external vertical slice remains open |
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
obligation with frozen bounded MVP1 and partial Sleepless Kingdom evidence; it is not implemented in
`reentry-core/`.

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
step remains deterministic evidence; it is not the selected application, and the real Agent bridge
remains open.

`WebApp/Web-Game/` is the ADR-0042 selected Host product layer. Its scoped authority owns Sleepless
Kingdom gameplay, state, tools, evidence, deployment, and task lifecycle. Current bounded evidence
covers the deterministic persistent world, browser-absent causal loss/signal, four canonical-page
WebMCP reads with one genuine read-only invocation, and a local labelled-port/page-HTTP/provenance-
bound recall composition. Game Manifest/Consent, external Receiver/Connector delivery, supported
Agent/browser return, genuine dynamic recall, effect acknowledgement, hosted continuity, and judge
reproduction remain separate open gates.

`runtime/host-sdk/` packages the Host consent action for ordinary UI and WebMCP and now adds the
ADR-0041 `createReentry()` server facade for the normal subject/prompt/URL path. Its Next.js sample
keeps organization and signing credentials in server routes, retains the approved continuation
only in a process-local demo server store, and sends the later Event through a separate route.
The advanced protocol API remains available. Production Host persistence and the selected app
integration remain open; Sleepless Kingdom must use the advanced surface rather than the generic
facade defaults.

`saas-boilerplate/` is the active Cloud Receiver v2 implementation base. Its independently
deployable Express/Prisma backend and Next.js frontend implement separate user/developer sessions,
account pairing, Host-key registration, Receiver-owned consent and target binding, signed Event
ingress, delivery lease/acknowledgement, developer self-service, and bounded operations. It does not
import or compose `reentry-core`. ADR-0044 accepts that independent implementation behind one
normative Receiver authority model and mandatory pinned black-box conformance. TASK-028 remains
verification-pending for the full pinned shared suite, recovery proof, and release enforcement.
The standing kernel and exact committed-source PostgreSQL upgrade are locally verified only; its new account control plane
is proposed, not implemented. Its local and preview-deployment evidence is bounded by Core/05,
CLOUD-022, SDK-006, and the Receiver standing verification record.

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
- Sleepless Kingdom locally proves persistent causal gameplay, four same-page WebMCP reads with one
  genuine read-only invocation, and a separate labelled-port/page-HTTP/provenance-bound recall
  composition, without claiming those pieces form an external Re-entry chain;
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

1. Finish [TASK-001](../Tasks/TASK-001-select-host-application.md) exact documentation and remote
   closure without absorbing owner-held Game or RightSpot work.
2. Close the Game's exact protocol-v0.2 advanced-SDK, active-Receiver, and compatible-Connector
   handoff gate; keep a v0.1 one-shot trace labelled as compatibility evidence only.
3. Select and verify an authenticated Agent-to-Browser-to-canonical-Game-page path with fresh
   WebMCP reads and conditional recall, or explicitly narrow the demo claim.
4. Prove signal 1 as queue acceptance, claim, activation, page action, independent Game effect, and
   ACK without collapsing those facts.
5. Under the same Consent, prove one-active backpressure, a second sequential signal/effect/ACK, then
   revocation; this is the minimum standing-mode Game claim under TASK-033.
6. Complete hosted identity/reset, product/Agent-value, transport-cost, clean-judge, deployment, and
   submission evidence.

Closed RECORE records are not reopened merely because application work begins.

## 8. Current non-claims

The project does not currently claim:

- a validated commercial product, customer problem, or player demand merely because Sleepless
  Kingdom is selected;
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
