# WebMCP Re-entry Workflow — Current Project Status

**Role:** CANONICAL current truth  
**As of:** 2026-08-30, Europe/London  
**Selected direction:** WebMCP re-entry workflow mechanism  
**Demo web application:** TBD  
**Final product name:** TBD  
**Phase:** P0, current-build H0b/H1, H2a cold-runtime recovery, and the H2 durable-enrollment service contract passed; C1 clean Agent-context discovery and one M1 discovery-and-read run on each documented eligible model were verified in the same installed environment; production transport, product value, demo-app selection, and judge portability remain open  
**Controlling decisions:** [ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md), [ADR-0003](../Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md)

## 1. Executive status

The project has selected a mechanism, not a domain product.

The mechanism enables a user to authorize a website-originated business event to resume a
previous Agent-assisted workflow, re-enter the authoritative web application, rediscover
the tools valid for the new state, continue the work, and stop at a human decision boundary.

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
H2 suite passes 30 tests and the current full suite passes 88 tests. This is a synthetic
service-contract pass: the one-shot worker is not a supervised daemon, and no real Desktop
destination, hosted transport, production key lifecycle, identity boundary, or distributed
exactly-once claim has been proven. See the
[H2 verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md).

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
> future business event to bring the Agent back to the authoritative page and continue under
> current state, current tools, and current human controls.

The selected end-to-end loop is:

~~~text
live WebMCP session
-> website-authored re-entry offer
-> user-scoped continuation grant
-> workflow waits after the page or turn ends
-> authoritative business event
-> validated Agent-context resume
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
| Re-entry workflow mechanism | **DECIDED** | Enrollment, grant, event, resume, canonical re-entry, dynamic tools, human boundary |
| Platform bridge | **P0 PASS; PRODUCTION UNRESOLVED** | The current-build private Desktop bridge completed the same-task Stage-B join; no documented public production bridge has been proven |
| Supported bridge mechanism | **H0B AND H1 PASS IN CURRENT BUILD; PRODUCTION OPEN** | A same-chat Scheduled heartbeat recovered a bounded prior receipt, polled a genuine Receiver event gate, and conditionally produced one idempotent Host effect; no public compatibility or production transport contract is proven |
| P0 technical MVP boundary | **PASSED** | One harness answered all five frozen questions in one clean correlated run under ADR-0003 |
| Exact-thread product value | **UNPROVEN; METHOD REQUIRES REVISION** | The [bounded calibration](../../Experiments/continuity-calibration/verdict.md) found no interpretable exact-task advantage and falsified its self-reported tool-inventory instrument; the selected-app study must use actual runtime traces and environment parity |
| Demo application domain | **TBD** | Must be selected through the criteria in 06-mvp-and-demo.md |
| Primary user and customer | **TBD** | Depend on the selected application |
| Domain event and state machine | **TBD** | Must come from the selected application, not the tender example by default |
| Site Tool names and schemas | **TBD** | Must express the selected domain workflow |
| Final product and app name | **TBD** | TenderRelay remains a reference-package codename only |

## 4. Validated premise and evidence boundary

> **VERIFIED FOR CONTROLLED P0:** A validated event can return to the intended local Desktop
> task, obtain its WebMCP-capable built-in Browser, open the canonical workflow URL, discover
> the new-stage page tools, and invoke the genuine continuation Site Tool.

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
| Grants, signed events, replay control, and bounded trace are implementable | **P0 VERIFIED** | P0 source, the frozen 37-test P0 report, the current 88-test full suite, the frozen clean correlated package, and the post-fix rehearsal; production durability remains deferred |
| Receiver-owned consent and private exact-task binding | **VERIFIED FOR Q2** | Explicit user-authorized Receiver approval, one active Grant, one private task binding, one opaque host binding, and same-task receipt delivery |
| Managed Agent context can be resumed from a signed event | **VERIFIED FOR Q3, BOUNDED** | App Server independently proves persisted exact-thread resume; the clean Desktop run proves one deduplicated same-task event delivery but not crash-recoverable production exactly-once semantics |
| Desktop task-control can wake the same test task and open the canonical page | **VERIFIED IN CURRENT DESKTOP** | The clean event appeared in the bound task and opened the exact canonical page through the private current-build bridge |
| Current Desktop Browser exposes genuine WebMCP | **VERIFIED IN CURRENT CLIENT** | `/Applications/ChatGPT.app` `26.825.41651` exposes `webmcp` on official-control and local P0 pages; the exact enabling account, workspace, permission, or rollout condition was not isolated |
| Fresh Agent context can discover genuine Site Tools without prior project turns or project-file access | **C1 VERIFIED IN SAME ENVIRONMENT** | App-held traces show two separate no-history, no-project-file probes using fresh tabs and fresh page-bound handles for the official control and local P0 Host; each invoked one manifest-annotated read-only Site Tool, and no mutating Site Tool was invoked. Fresh user-visible task, account/workspace, machine, public deployment, and judge portability remain untested |
| Both documented eligible models can perform fresh Site Tool discovery and one current-state read | **M1 VERIFIED ONCE PER MODEL IN SAME ENVIRONMENT** | Controller-assigned low-effort Sol and Terra arms returned the same official and local manifests and invoked the same manifest-annotated read-only tools once per page. Both documentation preflights failed before the Site Tool calls; no Site Tool invocation retry or mutating Site Tool occurred. This is not model parity, and the repo record is not a self-contained public model-assignment package |
| Scheduled-pull production economics | **STRUCTURALLY CONSTRAINED; APP INPUTS UNKNOWN** | The watch-window model quantifies no-op runs, latency, usage stress, lifecycle burden, and expected value, but exact per-run usage, persistent-event observation probability or a replacement arrival/availability model, value, and tolerance must be measured for the selected app |
| Stage-A page can deliver the bounded manifest through genuine WebMCP | **VERIFIED FOR Q1** | Clean-run discovery and invocation returned manifest `rm_ZGVXl-elc3QTTA`, matched to the Receiver trace |
| Resumed run can invoke next-stage Site Tools | **VERIFIED FOR Q4** | The event-opened page read `READY`, exposed only the Stage-B inventory, and genuinely invoked `continue_artifact` |
| Same-document Site Tool surface changes with authoritative state | **VERIFIED IN CURRENT CLIENT** | The [isolated genuine Browser probe](../../mvp/evidence/site-tool-lifecycle-probe-2026-08-30.json) changed `INITIAL` to `READY`; registration `AbortSignal` removed Stage-A tools, exposed Stage-B tools, and made the prior handle stale |
| Scheduled same-task re-entry can recover a bounded prior receipt and regain genuine Site Tools | **H0B VERIFIED IN CURRENT CLIENT** | The [sealed-context H0b probe](../../mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md) used a trigger-only scheduled prompt, recovered the stored URL and action role, opened a fresh Browser tab, and called the read-only page tool without the private relay or a substitute state path |
| Scheduled pull can enforce an authenticated event gate and one idempotent Host effect | **H1 VERIFIED IN CURRENT CLIENT** | The [H1 verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) proves no-event stopping, pending-event persistence across Receiver restart, fresh genuine Inbox and Host Site Tools, acknowledgement-loss retry, exact event replay, and one uncommitted artifact effect |
| Scheduled re-entry can recover from loss of its task-scoped Node Browser kernel | **H2A VERIFIED IN CURRENT CLIENT** | The [H2a verdict](../../mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md) proves same-turn Browser runtime reconstruction and a genuine no-event Inbox call after the old kernel was terminated; the Desktop app itself remained running |
| Crash-recoverable enrollment service contract | **H2 VERIFIED IN SYNTHETIC SERVICE HARNESS** | The [H2 verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md) proves atomic enrollment, an at-least-once outbox with an idempotent durable destination, crash recovery at four process boundaries, concurrent approval convergence, activation fencing, sealed-receipt purge, and redaction; no real Agent destination or production daemon is claimed |
| Same artifact stops at human boundary | **VERIFIED FOR Q5** | Revision 1 continued to revision 2; commit remained false and unavailable as a Site Tool |
| Exact thread adds value beyond structured continuation memory | **UNKNOWN** | Requires the controlled comparison in Research/06 |
| Demo app meets a real user need | **UNKNOWN** | Domain and user not selected |
| Challenge implementation | **P0 TECHNICAL FIXTURE PASSED** | The generic mechanism proof is complete; selected-app, deployment, demo, and submission work remain |
| Public deployment and clean-room judge flow | **NOT STARTED** | C1 clean Agent-context discovery was verified only in the current local environment; no public selected-app or independent-environment end-to-end evidence exists |
| Devpost submission | **NOT VERIFIED AS SUBMITTED** | Requires live readback before any status change |

## 6. Mechanism invariants

- The host web application's backend owns authoritative business state.
- A continuation event is a bounded wake-up signal, not application truth or an Agent prompt.
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
3. Run one paired D4/H2b full-Desktop-restart experiment as the final app-neutral durability
   kill test. Use a new process identity, a no-event arm, an event arm, genuine page-bound
   Site Tools, an external durable observer, replay controls, and no due opportunity while
   Desktop is closed. Treat any pass as current-build compatibility evidence only.
4. Discuss and select the product layer and demo application with Eddy using observed
   workflow evidence plus explicit product, WebMCP, execution, judgeability, and
   watch-window economics gates.
5. On the selected workflow, run C2 with a self-contained redacted evidence package; compare
   Agent re-entry with deterministic Host automation and notification/deep link; compare
   exact-thread continuation with a strong bounded capsule; and compare genuine WebMCP
   re-entry with a strong authenticated API.
6. Select the transport from the app's latency, offline, privacy, administration, and cost
   requirements. Use Research 16 to measure no-op load, usage per safe success, lifecycle
   burden, and expected net value. Then test only the route-relevant D5/D6, busy-task,
   concurrency, and distributed seams.
7. After app and transport selection, build the additive P1 trust/delivery seam and repeat
   the end-to-end flow from a separate clean-room machine.
8. Build the selected-app vertical slice only after an accepted app-selection ADR, deploy
   it, capture the public demo, and freeze the submission package.

## 9. Current non-claims

Do not claim that the project:

- has selected a final app, domain, user, customer, event, or product name;
- is a tender product merely because the reference dossier uses a tender scenario;
- has a supported production re-entry bridge, is production-ready, deployed, judge-reproducible, or submitted;
- has a public OpenAI compatibility promise that unattended Scheduled Tasks will always
  receive the built-in Browser and page-bound Site Tools;
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
