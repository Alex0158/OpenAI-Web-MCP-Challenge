# WebMCP Re-entry Workflow — Current Project Status

**Role:** CANONICAL current truth  
**As of:** 2026-08-31, Europe/London  
**Selected direction:** Re-entry Core — the domain-neutral WebMCP re-entry workflow mechanism  
**Demo web application:** TBD  
**Final product name:** TBD  
**Phase:** The application-neutral Re-entry Core Program is complete at `locally_verified`; RECORE-001 through RECORE-004 and RECORE-006 are locally verified, and RECORE-005 is `separate_process_verified`. The v0.1 protocol, Host SDK, Receiver C1 authority, authenticated same-subject Grant inspection and atomic revocation, Connector delivery C2, transport and bounded fault-matrix test-process isolation, deterministic Agent Adapter C4b, private managed-context resolution C4c, source-repository conformance/development profile C6b, and local quality baseline pass on Node 24 and the current Node 26 runtime. The terminal RECORE-003 audit marks every Program Definition of Done row `MET`; the full suite passes 79 of 79 tests on both runtimes, and the package has zero runtime dependencies and 16 selected files. No administration HTTP route, production control session, arbitrary-crash safety, production ownership, process shell, consent or pairing, production binding capture or credential custody, real Host-effect verifier, supported Agent adapter, final app, deployment, product value, or judge portability is claimed. Those are follow-on gates, not inherited Core evidence. Bounded mechanism feasibility remains passed through P0, H1, H2a, and the synthetic H2 service contract, while both standalone App Server Desktop-Browser joins remain failed in the current build.  
**Controlling decisions:** [ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md), [ADR-0003](../Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md), [ADR-0004](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md), [ADR-0005](../Decisions/ADR-0005-run-additive-durable-enrollment-spike.md), [ADR-0006](../Decisions/ADR-0006-establish-reentry-core-development-baseline.md), [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md), [ADR-0008](../Decisions/ADR-0008-freeze-receiver-authority-and-durable-reservation.md), [ADR-0009](../Decisions/ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md), [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md), [ADR-0011](../Decisions/ADR-0011-freeze-agent-adapter-activation-boundary.md), [ADR-0012](../Decisions/ADR-0012-freeze-domain-neutral-conformance-profile.md), [ADR-0013](../Decisions/ADR-0013-freeze-receiver-grant-control-and-revocation.md), and [ADR-0014](../Decisions/ADR-0014-freeze-private-managed-context-binding-resolution.md)

## 1. Evidence chronology

This section preserves dated supporting detail. The phase line, decision layers, evidence
ledger, and highest-leverage sequence control current status.

The project has selected a mechanism, not a domain product.

The mechanism lets a user authorize a website-originated business event for future
continuation. The Receiver validates and records bounded pending work; a separate available
continuation adapter later resumes the bound Agent, which re-enters the authoritative web
application, rediscovers the tools valid for the new state, continues the work, and stops at
a human decision boundary.

The web application used to prove this mechanism has not been selected. The tender workflow
in the TenderRelay dossier is a detailed reference scenario, not the committed application,
customer, persona, market, or final project name.

The disposable P0 fixture is implemented, completed its frozen 37-test P0 suite, and has
completed one clean correlated Q1–Q5 run. In ChatGPT Desktop `26.825.41651` (build
`7345`), the run used genuine page-bound WebMCP in both stages, Receiver-owned consent and
private Grant binding, one authenticated event into the same bound task, canonical Browser
re-entry, fresh Stage-B discovery, continuation of the same artifact, and a stop before the
visible human commit control, which was not exposed as a Site Tool. Exact replay created no
second event, run, or write.

A separate post-fix runbook rehearsal repeated the same chain after a long-task response
exposed and motivated a compact relay-identity fix. The corrected relay returned only a
compact verified identity result, the authenticated event reached the same task, genuine
Stage-B continuation completed, and replay again produced no second event, run, task
dispatch, or artifact write. The original failed rehearsal is preserved separately from the
passing evidence.

A post-P0 correctness review found and fixed app-independent defects: stale Stage-A offers
and bindings were not rejected after transition, temporal fields accepted non-canonical or
overlong values, state transitions and artifact writes did not consistently use SQL-level
compare-and-swap,
and committed workflows could still advertise continuation. A
[genuine current-Desktop lifecycle probe](../../mvp/evidence/site-tool-lifecycle-probe-2026-08-30.json)
also proved that registration `AbortSignal` removes a Site Tool. The page now reconciles its
same-document Site Tool surface after reading a changed authoritative state, and server-side
state guards remain the enforcement layer. These fixes do not broaden the historical Q1–Q5
evidence claim.

Two Scheduled Task probes then tested a supported same-chat continuity route without the
private Desktop relay. H0a proved that one background run in an existing idle task could
open a fresh built-in Browser tab and genuinely invoke a read-only page-bound Site Tool, but
its prompt repeated the URL and action. H0b removed that false-positive path: a prior turn
stored a sealed bounded re-entry receipt, and a later scheduled prompt containing no canary,
workflow ID, URL, or Site Tool name recovered the receipt, opened the stored canonical URL,
rediscovered the fresh page tools, and invoked the stored read-only action role. The raw
canary matched and the workflow remained unchanged. This is a current-build empirical pass,
not a documented public guarantee for unattended Browser or Site Tool availability.

The additive H1 experiment then passed one bounded end-to-end scheduled-pull run on the same
Desktop build. A no-event scheduled turn opened only a fresh Receiver Inbox page and stopped
after the genuine pending-event Site Tool returned false. One authenticated event survived a
Receiver process restart, authorized a fresh canonical-page continuation through genuine
Inbox and Host Site Tools, and produced exactly one Host effect. Deliberately omitting the
first acknowledgement left the delivery pending; an exact semantic retry returned the prior
effect without another artifact revision and a genuine Inbox acknowledgement completed the
event. Exact event replay and a final scheduled check created no further effect. The
historical combined P0 and H1 deterministic suite passed 59 tests. This closes the bounded H1 mechanism
gate, not the production topology, platform-contract, enrollment-recovery, or product-value
questions.

H2a then removed one hidden-runtime false positive. The controlled task's old Node Browser
kernel was terminated while its parent tool service and Desktop app remained alive. A later
trigger-only scheduled turn started a new kernel, reconstructed the built-in Browser runtime,
satisfied its mandatory Browser documentation preflight, and genuinely called the Receiver
Inbox no-event Site Tool from a fresh page. It made no Host visit or mutation. This proves
cold task-tool-runtime recovery, not full Desktop app restart, sleep, offline catch-up, or
cross-account portability.

The additive H2 durable-enrollment spike then closed the concrete H1 approval-to-Inbox
dual-write gap at the service-contract level. One approval transaction atomically persists
the decided challenge, non-active Grant, non-active Inbox, and receipt outbox. A stable
dispatch ID and separate idempotent SQLite destination tolerate acknowledgement loss;
activation remains fenced until durable receipt delivery and exact Host binding. Real
process termination tests cover each material commit boundary, and two independent approval
processes converge on one enrollment. Sealed receipt ciphertext is purged after durable
acknowledgement, and H2 status and trace surfaces redact private authority data. The focused
H2 suite passes 30 tests and the current full suite passes 118 tests, including ten D4 lifecycle
classifications, three contamination-latch controls, thirteen automation-history scanner controls,
and four App Server join-probe evidence controls.
This is a synthetic
service-contract pass: the one-shot worker is not a supervised daemon, and no real Desktop
destination, hosted transport, production key lifecycle, identity boundary, or distributed
exactly-once claim has been proven. See the
[H2 verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md).

A first formal D4/H2b no-event attempt is preserved as `INCONCLUSIVE`. Normal `Cmd-Q` produced
an observer snapshot with zero Desktop main processes and zero processes in the then-current
main-process tree, but the harness had classified an unrelated long-lived P0 relay as a Desktop
lifecycle process. The helper therefore timed out without requesting automatic relaunch, and the
operator manually reopened the app only as post-failure recovery. The observer also latched a
temporary prompt-contract violation even though the eventual heartbeat envelope matched the
original pinned prompt. Three controller pause updates then reported success without changing the
persisted active schedule; the delayed turn ran after the Receiver had been stopped, reached no
Site Tool, and created no Receiver or Host effect. The event arm was not run. Observer and helper
now share a semantic lifecycle classifier, continuously latch that P0 relay as contamination, and
pass thirteen focused process controls plus thirteen automation-history scanner controls. The
then-current suite contained 114 tests; the current 118-test suite adds four App Server join-probe
evidence controls. The hardened scanner correctly refuses to certify this historical attempt
because its automation contract drifted and its row was later deleted. Full Desktop restart
continuity remains unknown until a fresh valid no-event arm and then event arm complete.
See the [inconclusive attempt](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md)
and [D4/H2b runbook](../../mvp/D4_H2B_RUNBOOK.md).

A domain-neutral exact-task-versus-capsule method calibration then completed eight no-retry
structured CLI runs. Its frozen verdict is `REVISE_PROTOCOL`, not a continuity-value result:
seven runs failed only an ambiguous self-reported tool-inventory gate, and fresh versus
resumed CLI sessions exposed condition-correlated diagnostics. All eight outputs passed the
action, revision, prior-rule, current-fact, stale-rejection, human-boundary, and privacy
checks, but that post-run description cannot override the invalid primary instrument. Exact-
task product value therefore remains unproven. See the
[calibration verdict](../../Experiments/continuity-calibration/verdict.md).

Two fresh internal Agent contexts then ran a zero-mutation-tool WebMCP portability smoke without
prior conversation turns or project-file access. One separately discovered the official
ChatGPT Learn page's current Site Tools and invoked only `lookup_context`; the other opened
the local P0 canonical page, discovered the current `READY` inventory, and invoked only
`get_workflow_context`. Both used a fresh tab and a freshly fetched page-bound handle. This
verifies C1 in the current installed environment and is evidence against prior project
conversation turns, an old tab, an old handle, or project-file access being necessary for
those two calls. The
tool manifests annotated both invoked tools as read-only, and the app-held traces contain no
mutating Site Tool invocation; the annotations alone are not a safety guarantee. C1 does not isolate
account, workspace, machine, Browser profile, client rollout, public deployment, or the full
workflow. The app retains the per-arm runtime traces, but the redacted repo package is not a
self-contained public audit record. See
[Research 14](../Research/14-clean-context-webmcp-portability-smoke.md).

A paired model-variation smoke intended to vary the eligible model between GPT-5.6 Sol and
GPT-5.6 Terra. Both fresh no-history contexts separately returned the same official
and local genuine Site Tool inventories and invoked the same manifest-annotated read-only
context tools once per page. Both capability-documentation preflights failed; each actual
Site Tool invocation then succeeded once without invocation retry. This verifies one bounded
discovery-and-read run per documented eligible model in the current environment and is
evidence that the observed capability was not Sol-only; it does not verify model parity.
The full ambient instruction surfaces were not byte-identical: the Terra arm also received
one unrelated repository-collaboration rule added after the Sol run. The experimental prompt
and Browser objective were the same, but M1 is an existence result, not a controlled causal
model-effect comparison.
Scheduled receipt recovery,
event reasoning, mutation quality, usage, and selected-app outcomes remain untested across
models. The app retains the runtime traces, but the repo record is not a self-contained public
model-assignment and runtime-evidence package. See
[Research 15](../Research/15-sol-terra-webmcp-model-variation-smoke.md).

The current operating research now treats a complete watch window, rather than one positive
event, as the economic unit. Official documentation confirms shared ChatGPT Work/Codex usage
but publishes no dedicated Scheduled Task per-run price or latency SLA. The
[Research 16 model](../Research/16-scheduled-pull-unit-economics-and-transport-kill-model.md)
therefore derives no-op load, useful-run ratio, latency, usage per safe success, lifecycle
burden, and expected net value from measured inputs. It identifies continuous sparse polling
as structurally weak while preserving short bounded windows as a candidate demo transport.

Eddie's parallel `codex/mvp2-tenderrelay` branch has now been reviewed through runtime tip
`fab956e3a64c3bc127016266e45441c844e6906d` and documentation tip
`3f746694069486d3d48d5c6a26c73942ff6eab42` without merging its runtime. The modularized
runtime passes 18 deterministic tests in total, including an eight-test cross-domain
conformance subset. It contributes strict protocol-validation ideas, Host and Agent Adapter
seams, a Host SDK, a second-domain fixture, state-derived Site Tool lifecycle, a useful
two-actor UI, a visible artifact, and demo choreography. It still has weaker context authority,
consent, persistence, delivery/effect acknowledgement, and evidence contracts than the
mainline mechanism. Its direct-queue path proves enqueue in tests and one bounded local
observation, not dormant wake, Browser acquisition, or genuine WebMCP.

The later documentation-only commit proposed a hosted Cloud Receiver plus outbound Local
Connector. ADR-0006 now selects a reconciled version as the active Re-entry Core development
topology: one Receiver Core, a Cloud Receiver service shell, and a separately runnable outbound
Local Connector. This is an architecture and source-ownership decision, not runtime proof. The
concrete Connector-to-Agent adapter remains unselected and must fail visibly rather than use an
undeclared fallback. The contributor branch remains preserved; source assets require selective,
provenance-aware adaptation.
See [Research 17](../Research/17-mvp1-mvp2-comparative-integration-review.md),
[Research 21](../Research/21-cloud-receiver-local-connector-candidate-topology.md), and
[Research 22](../Research/22-mvp2-selective-integration-provenance.md).

The first fail-closed App Server Browser-join probe now separates cold task creation from
Desktop Browser attachment. ChatGPT Desktop's bundled App Server `0.151.0-alpha.7.1`
created a new managed context and a fresh process resumed that exact context. The later turn
reported receipt recovery and reproduced the unstated canonical URL, but pre-turn `thread/read`
did not expose the injected receipt, so that part is corroborating Agent output rather than an
independently inspectable receipt assertion. The only permitted
built-in Browser selector then failed with `Browser is not available: iab`; no Chrome,
extension, REST, DOM, generic MCP, dynamic tool, or manual fallback counted. This is a
reproducible negative result for an App-Server-owned cold thread, not yet a verdict on
resuming an existing Desktop-owned task with a live Browser backend. See the
[redacted cold-join evidence](../../mvp/evidence/app-server-browser-join-probe-2026-08-30.json).

A separate warm-join controller then primed a disposable task through one genuine read-only
`lookup_context` Site Tool call and supplied that exact task to the standalone probe. The same
bundled App Server returned `already has an active writer` at `thread/resume`, before
`thread/read` or a later turn. The public JSON directly proves that rejection but not writer
ownership, idle state, or the live `iab` precondition; those remain controller-side setup
attestations. Together, the two tested standalone Desktop joins failed and are removed from
current selection unless a materially different supported contract or topology appears. See the
[redacted warm-join evidence](../../mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json).

This closes the frozen P0 **technical-composability** question in one controlled, same-user
local environment. It does not close the production architecture: the historical P0 join
used an undocumented local bridge, while H1's scheduled route remains current-build
empirical behavior rather than a supported external Receiver API. The project is not yet
deployed, clean-room judge-reproducible, submitted, or specialized to a selected domain.
See [P0 Technical Validation MVP](07-p0-technical-validation-mvp.md), the
[runtime probe log](../Research/02-p0-runtime-probe-log.md), and the
[clean-run verdict](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md), plus
the [post-fix rehearsal](../../mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md).

## 2. The selected concept

> WebMCP makes the current page actionable. The re-entry workflow lets a user authorize a
> future business event to create bounded pending work; an available continuation adapter
> may later return the bound Agent to the authoritative page under current state, current
> tools, and current human controls.

The selected end-to-end loop is:

~~~text
live WebMCP session
-> website-authored re-entry offer
-> user-scoped continuation grant
-> workflow waits after the page or turn ends
-> authoritative business event
-> Receiver accepts one bounded pending delivery
-> available continuation adapter activates the bound context
-> canonical page re-entry
-> fresh state verification
-> stage-appropriate Site Tool discovery
-> continued preparation or action
-> human decision boundary
~~~

## 3. Decision layers

| Layer | Current status | Meaning |
|---|---|---|
| Core problem class | **DECIDED** | Multi-stage web work breaks when page-scoped Agent sessions end before later business events |
| Re-entry workflow mechanism | **DECIDED** | Enrollment, Grant, authenticated pending delivery, separate activation, canonical re-entry, dynamic tools, human boundary |
| Re-entry Core identity and source baseline | **APPLICATION-NEUTRAL PROGRAM COMPLETE AT LOCAL EVIDENCE** | ADR-0006 establishes `reentry-core/`, freezes MVP1/MVP2 as references, and selects one Receiver Core with Cloud Receiver and outbound Local Connector boundaries. RECORE-001 through RECORE-006 and the terminal RECORE-003 audit close the Program without claiming production shells |
| Re-entry Core v0.1 contract kernel | **LOCALLY VERIFIED FOR PROTOCOL AND HOST SDK** | ADR-0007 fixes the contract; RECORE-001 records Node 24 and current-runtime conformance, strict negative and boundary behavior, and a frozen vector without claiming Receiver or process behavior |
| Receiver authority and durable reservation | **LOCALLY VERIFIED IN PROCESS AND ACROSS FILE REOPEN** | ADR-0008 and RECORE-001 C1b now cover the consent-authority port, effective private Grant, exact event replay, atomic one-run reservation, private pending delivery, rollback, and SQLite close-and-reopen behavior without claiming a consent UI, Connector, Agent, service, or OS-crash boundary |
| Connector lease and effect acknowledgement | **LOCALLY VERIFIED IN PROCESS AND ACROSS FILE REOPEN** | ADR-0009 and RECORE-001 C2b verify trusted Connector identity, a client-replayable claim token, one target-scoped short lease, persisted bounded attempts, stale-worker fencing, and acknowledgement only through a trusted correlated Host-effect attestation. Pairing, HTTP, separate processes, real Host effects, and Agent activation remain unproved |
| Receiver HTTP and outbound Connector transport | **TRANSPORT AND FAULT-MATRIX TEST ISOLATION LOCALLY VERIFIED** | ADR-0010, RECORE-001 C3d, and RECORE-005 verify three strict bounded JSON routes, a no-retry outbound client, independent Host/Receiver/Connector children, forced restart, revocation races, expired-lease fencing, effect replay/conflict, and one exact pre-commit `SIGKILL` rollback point. Production shells, arbitrary-crash safety, TLS, pairing, real effects, and Agent behavior remain unproved |
| Agent Adapter activation contract | **LOCALLY VERIFIED WITH DETERMINISTIC ADAPTER** | ADR-0011 and RECORE-001 C4b verify one credential-free lease-derived activation, four explicit result classes, bounded one-call invocation, and a strict no-effect/no-fallback boundary. No real Agent platform is selected or proven |
| Private managed-context binding resolution | **LOCALLY VERIFIED WITH DETERMINISTIC AUTHORITY** | ADR-0014 and RECORE-006 verify one exact private Grant and configured-adapter lookup, activation and binding lifetime fencing, one driver call, visible missing/failure outcomes, and raw-reference non-disclosure. Production capture, persistence, custody, retirement, and real activation remain unproved |
| Domain-neutral conformance/development profile | **LOCALLY VERIFIED, NON-PRODUCTION** | ADR-0012 and RECORE-001 C6b run one source-repository-only loopback profile with distinct Host, Receiver, and Connector children, deterministic Agent dispatch, separate synthetic Host effect, redacted output, exact cleanup, and no runtime package inclusion |
| App-independent quality and weight baseline | **LOCALLY VERIFIED, NON-SLA** | RECORE-002 adds bounded protocol, Agent Adapter, file-backed Receiver, and cold source-profile regression entrypoints. They run on Node 24 and the current Node 26 runtime, add no dependency, change no runtime source behavior, and remain outside package files |
| Receiver-to-Agent continuation adapter | **UNSELECTED FOR PRODUCTION** | The current-build private Desktop bridge completed P0; Scheduled pull passed bounded current-build probes; neither is a documented production bridge |
| Standalone App Server Browser join | **BOTH TESTED VARIANTS FAILED IN CURRENT BUILD** | The cold thread's Browser selector returned `iab-unavailable` before page access; that signal does not identify the absent precondition. Exact warm resume returned an active-writer rejection for the supplied task. The warm public artifact does not independently prove writer ownership or priming. These tested joins are not the selected Desktop adapter |
| P0 technical MVP boundary | **PASSED** | One harness answered all five frozen questions in one clean correlated run under ADR-0003 |
| Exact-thread product value | **UNPROVEN; METHOD REQUIRES REVISION** | The [bounded calibration](../../Experiments/continuity-calibration/verdict.md) found no interpretable exact-task advantage and falsified its self-reported tool-inventory instrument; the selected-app study must use actual runtime traces and environment parity |
| Demo application domain | **TBD** | Must be selected through the criteria in 06-mvp-and-demo.md |
| Primary user and customer | **TBD** | Depend on the selected application |
| Domain event and state machine | **TBD** | Must come from the selected application, not the tender example by default |
| Site Tool names and schemas | **TBD** | Must express the selected domain workflow |
| Final product and app name | **TBD** | TenderRelay remains a reference-package codename only |

## 4. Validated premise and evidence boundary

> **VERIFIED FOR CONTROLLED P0:** The Receiver accepted one validated event, and a private
> current-build adapter returned the intended local Desktop task to its WebMCP-capable
> built-in Browser, opened the canonical workflow URL, discovered the new-stage page tools,
> and invoked the genuine continuation Site Tool.

This is runtime evidence for technical composability in the tested current build. It is not
evidence that the private bridge is a documented platform contract, production-stable,
hosted, cross-user, or clean-room judge-reproducible.

## 5. Evidence ledger

| Claim or surface | Current state | Evidence meaning |
|---|---|---|
| Re-entry workflow selected as the core concept | **DECIDED** | ADR-0002 |
| P0 technical validation target frozen | **DECIDED** | ADR-0003 and Core/07 |
| TenderRelay dossier and diagram preserved | **VERIFIED** | Byte-identical immutable snapshots |
| Tender is only a reference scenario | **DECIDED** | ADR-0002 |
| WebMCP can expose page-native structured tools | **VERIFIED IN P0** | Genuine Stage-A and Stage-B page-bound discovery and invocation occurred in the clean run |
| Grants, signed events, replay control, and bounded trace are implementable | **P0 VERIFIED** | P0 source, the frozen 37-test P0 report, the current 118-test full suite, the frozen clean correlated package, and the post-fix rehearsal; production durability remains deferred |
| Receiver-owned consent and private exact-task binding | **VERIFIED FOR Q2** | Explicit user-authorized Receiver approval, one active Grant, one private task binding, one opaque host binding, and same-task receipt delivery |
| Exact stored Agent context can be resumed through App Server | **VERIFIED FOR Q3, NO BROWSER JOIN** | App Server independently proves persisted exact-thread resume and prior receipt recovery |
| Private Desktop adapter delivered one accepted-event continuation to the same bound task | **VERIFIED FOR CONTROLLED P0 ONLY** | The clean event appeared in the bound task and the private current-build bridge opened the exact canonical page; this is not a public transport contract |
| Cold App Server-to-Desktop Browser join | **FAILED IN CURRENT ENVIRONMENT** | A fresh App-Server-owned thread resumed exactly; the later turn reported receipt recovery, but this is not independently exposed by pre-turn `thread/read`. The built-in Browser selector returned `iab-unavailable`; no fallback surface counted |
| Warm App Server-to-existing Desktop Browser join | **FAILED FOR THE TESTED INPUT; PRECONDITION ATTESTATION IS NOT SELF-CONTAINED** | Standalone `thread/resume` returned an active-writer rejection for the exact task supplied by the controlled Desktop-priming step before a later turn could start. The public JSON does not independently prove writer ownership, idle state, or the live `iab` precondition |
| Workspace Agents external trigger and conversation continuity | **EXTERNALLY VERIFIED; LOCAL ENTITLEMENT UNKNOWN** | Official API docs define durable trigger queueing, idempotent retries, run status, and stable `conversation_key`; the current account has not been verified or used |
| Workspace Agents Browser and genuine page-bound WebMCP join | **UNKNOWN** | Official trigger docs do not state that an API-triggered run receives a Browser or Desktop Site Tools; this is a distinct hosted topology, not local Desktop-task continuation |
| Current Desktop Browser exposes genuine WebMCP | **VERIFIED IN CURRENT CLIENT** | `/Applications/ChatGPT.app` `26.825.41651` exposes `webmcp` on official-control and local P0 pages; the exact enabling account, workspace, permission, or rollout condition was not isolated |
| Fresh Agent context can discover genuine Site Tools without prior project turns or project-file access | **C1 VERIFIED IN SAME ENVIRONMENT** | App-held traces show two separate no-history, no-project-file probes using fresh tabs and fresh page-bound handles for the official control and local P0 Host; each invoked one manifest-annotated read-only Site Tool, and no mutating Site Tool was invoked. Fresh user-visible task, account/workspace, machine, public deployment, and judge portability remain untested |
| Both documented eligible models can perform fresh Site Tool discovery and one current-state read | **M1 VERIFIED ONCE PER MODEL IN SAME ENVIRONMENT** | Controller-assigned low-effort Sol and Terra arms returned the same official and local manifests and invoked the same manifest-annotated read-only tools once per page. Both documentation preflights failed before the Site Tool calls; no Site Tool invocation retry or mutating Site Tool occurred. This is not model parity, and the repo record is not a self-contained public model-assignment package |
| Scheduled-pull production economics | **STRUCTURALLY CONSTRAINED; APP INPUTS UNKNOWN** | The watch-window model quantifies no-op runs, latency, usage stress, lifecycle burden, and expected value, but exact per-run usage, persistent-event observation probability or a replacement arrival/availability model, value, and tolerance must be measured for the selected app |
| Eddie MVP2 and Cloud Receiver/Local Connector proposal | **SELECTIVELY ADOPTED THROUGH ADR-0006; CONTRIBUTOR RUNTIME UNMERGED** | Re-entry Core adopts the reconciled process shape, not MVP2 Receiver authority, JSON persistence, caller-asserted consent, queue assumptions, or runtime claims |
| Re-entry Core v0.1 protocol and Host SDK | **LOCALLY VERIFIED IN PROCESS** | RECORE-001 Increment B2 passes strict Manifest, binding, receipt, canonical event, Ed25519, origin-anchor, tamper, boundary, frozen-vector, and Host-isolation tests on Node 24.20.0 and the current Node 26.5.0; this is not Receiver, durability, or separate-process evidence |
| Re-entry Core Receiver authority C1 | **LOCALLY VERIFIED** | RECORE-001 C1b passes consent, privacy, replay, rollback, expiry, scope, transaction, WAL/schema, and file close-and-reopen tests on Node 24.20.0 and Node 26.5.0; no production session, service, Connector, Agent, or OS-crash behavior is inferred |
| Re-entry Core Connector delivery C2 | **LOCALLY VERIFIED** | ADR-0009 and RECORE-001 C2b pass identity scope, exact claim replay, persisted attempt bounds, stale-worker fencing, effect-only acknowledgement, rollback, schema-version migration, token non-persistence, and file reopen on Node 24.20.0 and Node 26.5.0. No production pairing, network, separate process, real Host effect, Connector daemon, or Agent behavior is inferred |
| Re-entry Core transport and process faults C3/P | **TRANSPORT AND FAULT-MATRIX TEST ISOLATION LOCALLY VERIFIED** | ADR-0010, RECORE-001 C3d, and RECORE-005 pass 71 aggregate tests on Node 24.20.0 and Node 26.5.0. Independent Host, Receiver, and Connector children prove signed HTTP event acceptance, restart replay, acknowledgement-response-loss recovery, revocation-before-event, lease-before-revocation convergence, expired-lease stale-worker fencing, exact and conflicting effect behavior, one exact pre-commit `SIGKILL` rollback point, Receiver-only SQLite ownership, and bounded raw-token absence. No arbitrary-crash or power-loss safety, concurrent ownership, production shell, TLS, pairing, real Host-effect verifier, or Agent behavior is inferred |
| Re-entry Core Agent Adapter C4 | **LOCALLY VERIFIED WITH DETERMINISTIC ADAPTER** | ADR-0011 and RECORE-001 C4b pass strict activation/result, expiry, correlation, immutability, credential omission, four outcome, four unsupported-capability, timeout, exception, malformed-result, and no-retry tests on Node 24.20.0 and Node 26.5.0. No real adapter, Agent, Browser, WebMCP, Host effect, or delivery acknowledgement is proven |
| Re-entry Core private binding resolution C4c | **LOCALLY VERIFIED WITH DETERMINISTIC AUTHORITY** | ADR-0014 and RECORE-006 pass 8 focused managed-context tests, 14 combined adapter tests, and 79 aggregate tests on Node 24.20.0 and Node 26.5.0. Only the private receipt `grant_id` and configured adapter ID enter one lookup; active, missing, expired, lease-shorter, late, mismatch, malformed, exception, timeout, invalid-result, and non-disclosure paths are bounded. No production binding lifecycle or real activation is inferred |
| Re-entry Core conformance profile C6 | **LOCALLY VERIFIED, NON-PRODUCTION** | ADR-0012 and RECORE-001 C6b pass direct profile execution and 56 aggregate tests on Node 24.20.0 and Node 26.5.0. The profile proves distinct role processes, Receiver-only SQLite, existing HTTP event/claim/acknowledgement, one deterministic Agent dispatch, pre-effect acknowledgement rejection, separate synthetic effect authorization, redacted output, and exact temporary cleanup. It proves no production identity, process, effect, Agent, Browser, WebMCP, app, or deployment |
| Re-entry Core quality and weight baseline | **LOCALLY VERIFIED, NON-SLA** | RECORE-002 runs bounded protocol, deterministic Agent Adapter, file-backed SQLite Receiver, and cold source-profile benchmarks on Node 24.20.0 and Node 26.5.0. RECORE-006 rechecks the unchanged Agent benchmark and exact package boundary: zero runtime dependencies, 16 selected files, 34,227 compressed bytes, and 180,301 unpacked bytes; benchmark, conformance, and test sources remain excluded. This is same-machine regression evidence, not hosted throughput, version ranking, production latency, or an app budget |
| Re-entry Core Program completion audit | **COMPLETE AT APPLICATION-NEUTRAL `LOCALLY_VERIFIED` BOUNDARY** | Terminal RECORE-003 maps every Definition of Done item to direct evidence and marks all rows `MET`. Production, selected-runtime, selected-app, deployment, judge, and submission gates remain separate |
| Receiver Grant control | **LOCALLY VERIFIED IN CORE AND BOUNDED TEST PROCESSES** | ADR-0013 and RECORE-004 verify the in-process authority and persistence contract; RECORE-005 adds exact test-process revocation/restart/race evidence. No control HTTP, UI/session, anti-CSRF boundary, or production identity is proven; ADR-0014 separately owns private context resolution |
| Stage-A page can deliver the bounded manifest through genuine WebMCP | **VERIFIED FOR Q1** | Clean-run discovery and invocation returned manifest `rm_ZGVXl-elc3QTTA`, matched to the Receiver trace |
| Resumed run can invoke next-stage Site Tools | **VERIFIED FOR Q4** | The event-opened page read `READY`, exposed only the Stage-B inventory, and genuinely invoked `continue_artifact` |
| Same-document Site Tool surface changes with authoritative state | **VERIFIED IN CURRENT CLIENT** | The [isolated genuine Browser probe](../../mvp/evidence/site-tool-lifecycle-probe-2026-08-30.json) changed `INITIAL` to `READY`; registration `AbortSignal` removed Stage-A tools, exposed Stage-B tools, and made the prior handle stale |
| Scheduled same-task re-entry can recover a bounded prior receipt and regain genuine Site Tools | **H0B VERIFIED IN CURRENT CLIENT** | The [sealed-context H0b probe](../../mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md) used a trigger-only scheduled prompt, recovered the stored URL and action role, opened a fresh Browser tab, and called the read-only page tool without the private relay or a substitute state path |
| Scheduled pull can enforce an authenticated event gate and one idempotent Host effect | **H1 VERIFIED IN CURRENT CLIENT** | The [H1 verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) proves no-event stopping, pending-event persistence across Receiver restart, fresh genuine Inbox and Host Site Tools, acknowledgement-loss retry, exact event replay, and one uncommitted artifact effect |
| Scheduled re-entry can recover from loss of its task-scoped Node Browser kernel | **H2A VERIFIED IN CURRENT CLIENT** | The [H2a verdict](../../mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md) proves same-turn Browser runtime reconstruction and a genuine no-event Inbox call after the old kernel was terminated; the Desktop app itself remained running |
| Crash-recoverable enrollment service contract | **H2 VERIFIED IN SYNTHETIC SERVICE HARNESS** | The [H2 verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md) proves atomic enrollment, an at-least-once outbox with an idempotent durable destination, crash recovery at four process boundaries, concurrent approval convergence, activation fencing, sealed-receipt purge, and redaction; no real Agent destination or production daemon is claimed |
| Full Desktop restart with independent Receiver validation harness | **FIRST NO-EVENT ATTEMPT INCONCLUSIVE; HARNESS REPAIRED; VALID ARMS NOT COMPLETED** | The [first formal attempt](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md) proved normal app closure but exposed an over-broad lifecycle classifier and a persisted-schedule discrepancy; no Site Tool or workflow effect occurred. The repaired [D4/H2b runbook](../../mvp/D4_H2B_RUNBOOK.md) still requires a fresh valid no-event arm before the event arm |
| Same artifact stops at human boundary | **VERIFIED FOR Q5** | Revision 1 continued to revision 2; commit remained false and unavailable as a Site Tool |
| Exact thread adds value beyond structured continuation memory | **UNKNOWN** | Requires the controlled comparison in Research/06 |
| Demo app meets a real user need | **UNKNOWN** | Domain and user not selected |
| Challenge implementation | **APPLICATION-NEUTRAL RE-ENTRY CORE PROGRAM COMPLETE AT LOCAL EVIDENCE** | Protocol, Host SDK, bounded Receiver authority and Grant control, lease, effect acknowledgement, HTTP mapping, outbound client, exact test-process fault matrix, deterministic Agent Adapter and private binding-resolution contracts, non-production conformance profile, and local regression benchmarks are verified. Production process shells and binding custody, real Agent activation, selected app, deployment, demo, and submission remain open |
| Public deployment and clean-room judge flow | **NOT STARTED** | C1 clean Agent-context discovery was verified only in the current local environment; no public selected-app or independent-environment end-to-end evidence exists |
| Devpost submission | **NOT VERIFIED AS SUBMITTED** | Requires live readback before any status change |

## 6. Mechanism invariants

- The host web application's backend owns authoritative business state.
- A continuation event is bounded authorization and durable work availability, not
  application truth, an Agent prompt, or proof that the Agent has been awakened. Activation
  belongs to a separate continuation adapter.
- The user explicitly chooses event type, scope, expiry, run limits, and approval boundary.
- The website receives an opaque workflow binding, not Agent credentials or a raw thread ID.
- A resumed run must return to an allowlisted canonical page and read current state.
- Site Tools are derived from current page and workflow state.
- **Shipping invariant:** Host-side mutations must validate current authorization, state
  version, and artifact revision. P0 currently proves the state/revision guards, not a real
  Host-session authorization boundary.
- Consequential commitment must remain human-controlled unless a later decision explicitly
  narrows and proves a safe alternative. Current P0 evidence proves behavioral stopping and
  Site Tool absence, not technical user exclusivity.
- The host application remains usable through a normal human interface.
- The challenge MVP proves one complete loop before generalizing the mechanism.

## 7. Binding challenge constraints

The governing rules research currently requires a working public URL, public source
repository and visible open-source license, genuine WebMCP implementation, English
submission materials, and a public narrated demo under three minutes. Volatile requirements
must be refreshed against live Devpost sources before release.

See [Official Rules research](../01-official-rules.md) and
[Submission and Evaluation Strategy](../02-submission-evaluation-strategy.md).

## 8. Current highest-leverage sequence

1. Preserve H1, H2a, and H2 as bounded mechanism and service-contract passes; do not promote
   scheduled pull or the synthetic H2 destination to production contracts. Use the
   [post-H1 roadmap](../Research/10-post-h1-unknowns-and-validation-roadmap.md) to keep
   verified facts separate from product and production unknowns.
2. Preserve C1 as a verified same-environment clean Agent-context result without promoting it
   to account, workspace, machine, public-deployment, or judge portability. Preserve M1 as
   one bounded run per documented eligible model without claiming parity.
3. Preserve [RECORE-001](../Development/RECORE-001-foundation.md) as the locally verified
   foundation record, [RECORE-002](../Development/RECORE-002-quality-and-weight.md) as the
   non-SLA local regression baseline, and
   [RECORE-003](../Development/RECORE-003-program-completion-audit.md) as the current completion
   ledger, [RECORE-004](../Development/RECORE-004-grant-control.md) as the locally verified
   Grant-control record, and
   [RECORE-005](../Development/RECORE-005-separate-process-fault-matrix.md) as the bounded
   separate-process fault record, and
   [RECORE-006](../Development/RECORE-006-private-managed-context-binding.md) as the locally
   verified private resolution record. Preserve the terminal RECORE-003 closure and open no new
   Core increment unless a stated reopen condition is met. Keep
   production single-owner enforcement and durable Connector custody gated on a selected runtime
   substrate; do not add lockfile, daemon, or credential-store workarounds speculatively.
4. Preserve both App Server Browser-join failures and the frozen D4 result. Do not retry the
   same route or hide it through polling, Chrome, REST, DOM automation, generic MCP, task
   detachment, manual reconstruction, or another undeclared fallback.
5. Keep production pairing, credential custody, and revocation distinct from the locally verified
   ADR-0009 identity port. Add only the minimum process and credential controls required to prove
   a real device-side boundary; do not treat deterministic authority fixtures as pairing evidence.
6. Continue final-app selection in parallel. The selected app specializes Re-entry Core through
   a Host Adapter and supplies event frequency, latency, offline, privacy, administration,
   economics, tool, artifact, and human-boundary requirements; it does not reopen core authority
   by default.
7. Test a materially different supported Agent adapter only through a bounded gate that
   distinguishes delivery retrieval, activation, Browser acquisition, canonical navigation,
   genuine Site Tool invocation, Host effect, and acknowledgement.
8. On the selected workflow, compare Agent re-entry with deterministic Host automation and a
   notification/deep link; compare exact-thread continuation with a strong bounded capsule; and
   compare genuine WebMCP re-entry with a strong authenticated API.
9. Repeat the selected process boundaries from a separate clean-room machine and reconcile code,
   tests, performance evidence, Core truth, and claim limits.
10. Build and deploy the selected-app vertical slice only after its accepted ADR, then capture
    the public demo and freeze the submission package.

## 9. Current non-claims

Do not claim that the project:

- has selected a final app, domain, user, customer, event, or product name;
- is a tender product merely because the reference dossier uses a tender scenario;
- has a supported production re-entry bridge, is production-ready, deployed, judge-reproducible, or submitted;
- has a public OpenAI compatibility promise that unattended Scheduled Tasks will always
  receive the built-in Browser and page-bound Site Tools;
- has a standalone App Server route that can attach to a Desktop-owned task and its live
  built-in Browser; both tested current-build join variants failed;
- has proved that an API-triggered Workspace Agent receives a Browser or genuine page-bound
  WebMCP Site Tools;
- requires Desktop Scheduled Tasks as a core mechanism rather than treating scheduled pull
  as one bounded compatibility adapter;
- has implemented a hosted Cloud Receiver or Local Connector merely because ADR-0006 selects
  that target topology;
- has delivered an H2 enrollment receipt to a real Desktop task, hosted Agent, or production
  connector, or operates a continuously supervised outbox worker;
- has proved production key rotation, multi-tenant isolation, remote topology, production
  human identity, or distributed exactly-once execution;
- has proved that a business event directly wakes the Agent rather than authorizing a later
  scheduled turn;
- has proven that exact-thread history is materially better than structured continuation memory;
- invents webhooks, queues, Agent triggers, thread resume, state machines, or human approval;
- is a new WebMCP standard or universally supported protocol;
- has validated market demand or measured user impact.

## 10. Update rule

Update this file whenever the demo app, Agent adapter, bridge evidence, implementation
phase, deployment, demo readiness, or submission state changes. Every change must link to
the relevant decision, test artifact, runtime evidence, or governing source.
