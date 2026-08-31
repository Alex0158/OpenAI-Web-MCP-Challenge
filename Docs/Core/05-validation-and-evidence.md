# Re-entry Core — Validation and Evidence Plan

**Role:** CANONICAL proof matrix and evidence gates  
**Status:** Current proof matrix plus future evidence gates; the Re-entry Core v0.1 protocol, Host SDK, ADR-0008 Receiver C1 authority, ADR-0009 Connector delivery C2, ADR-0010 transport plus forced-restart test-process isolation, ADR-0011 deterministic Agent Adapter contract, and ADR-0012 non-production conformance/development profile are locally verified; mid-transaction crash injection and production process ownership remain open; bounded P0/H1/H2 reference evidence passed, D4 is inconclusive, and production consent, pairing, a real Host-effect verifier, a supported Agent adapter, private context binding, app, product, and judge gates remain open.  
**Last updated:** 2026-08-31

## 1. Evidence discipline

| Label | Meaning |
|---|---|
| **VERIFIED** | Observed in the current project through reproducible runtime evidence or controlled by a current governing source |
| **EXTERNALLY VERIFIED** | Documented or observed in a platform, but not yet demonstrated in this project |
| **ENGINEERING-FEASIBLE** | Uses ordinary implementable components but has not been built here |
| **WORKING ASSUMPTION** | Accepted temporarily for planning and still requires a named test |
| **INFERENCE** | Reasoned interpretation of evidence, not a platform or market guarantee |
| **TARGET** | Desired outcome, not current evidence |
| **UNKNOWN** | No sufficient evidence yet |

Reference scenarios, diagrams, pseudocode, and design documents are reasoning evidence. They
are not runtime evidence.

### Genuine Site Tool evidence admission

A genuine Site Tool discovery or invocation claim is admissible only when the evidence:

- comes from the exact page-bound Browser tool surface used for the call, with a direct fresh
  inventory captured before invocation;
- identifies the observed Browser or backend class, page origin and hostname, tool name,
  bounded input, untruncated classification-critical output, call count, stage, state
  version, and correlation path;
- uses client-specific provenance metadata only as dated corroboration, never as a WebMCP
  standard;
- rejects stale, decoy, or reassigned handles where lifecycle or identity is material;
- aggregates relevant Browser-client and Host-server observations across every phase of a
  multi-phase claim; and
- redacts, allowlists, or hashes raw task identifiers, canaries, credentials, local paths,
  and unrelated tool output.

Agent narration, source or DOM inspection, regex classification, mocks, remembered manifests,
and screenshots without correlated traces are corroboration or test scaffolding, not runtime
proof of a genuine invocation. Evidence outcomes remain distinct as `PASS`, classified
`FAIL`, or `INCONCLUSIVE`; an inconclusive run may not silently overwrite a prior decisive
result.

## 2. Critical proposition

The selected concept is proven only if one complete chain is observable:

~~~text
valid Host transition and outbox intent
-> Cloud Receiver authenticates and Receiver Core durably records one pending delivery
-> a paired Local Connector leases the delivery through its outbound channel
-> an available Agent Continuation Adapter activates the intended context
-> eligible browser context
-> canonical workflow page opens
-> current identity and state are verified
-> a new-stage WebMCP tool surface is discovered
-> a new-stage Site Tool is invoked
-> the same artifact or decision process continues
-> the defined human boundary is preserved
~~~

Showing isolated components or narrating intended behavior is insufficient.

On 2026-08-30, the domain-neutral P0 fixture completed this chain once in a controlled,
same-user local Desktop run. That result establishes the mechanism's technical
composability under the tested environment; it does not satisfy the selected-app,
production-support, deployment, or clean-room judge gates below.

### P0 decomposition

The first implementation uses one technical harness to answer five questions through three
gates:

1. genuine WebMCP Re-entry Manifest delivery;
2. Receiver-owned consent and secure Grant-to-context binding;
3. authenticated resumption of the intended managed context with one event identity and
   one run reservation, where exact replay starts no second run;
4. resumed canonical-page re-entry and new-stage Site Tool invocation;
5. continuation of the same artifact up to the human boundary.

Enrollment proves questions 1–2. Continuation and Re-entry proves questions 3–4. The
Closed-loop Workflow gate proves question 5 and repeats all five in one correlated run.
The binding implementation contract is
[P0 Technical Validation MVP](07-p0-technical-validation-mvp.md).

### Enrollment non-effect gate

Enrollment is not continuation. After approval and before the future business event, one
correlated machine-readable checkpoint must show:

- one approved Grant and one Trusted Continuation Receipt bound to the intended managed
  context;
- zero accepted business events;
- zero business-event deliveries;
- zero wake attempts or resumed continuation runs; and
- zero Stage-B Site Tool calls, artifact revisions, or Host workflow effects.

Receipt persistence and opaque Host binding are enrollment effects and are excluded from the
business-event delivery count. The later event arm must reuse the same Grant and correlation
path. A historical package that lacks one of these counters records an evidence limitation;
the missing value must not be inferred as zero or retroactively upgraded to a pass.

## 3. Current proof matrix

| Capability | Current status | Required project evidence |
|---|---|---|
| Core re-entry mechanism selected | VERIFIED AS DECISION | ADR-0002 |
| Re-entry Core identity, source root, and target process shape selected | VERIFIED AS DECISION | ADR-0006; implementation and runtime proof remain separate |
| Re-entry Core v0.1 contract kernel selected | LOCALLY VERIFIED FOR PROTOCOL AND HOST SDK | ADR-0007 plus RECORE-001 Increment B2; 14 aggregate tests and 10 protocol conformance tests pass on the current runtime, the aggregate suite also passes on Node 24.20.0, and the frozen vector verifies without a private key |
| Authoritative `reentry-core/` implementation | PARTIALLY LOCALLY VERIFIED | Protocol, Host SDK, Receiver authority, Connector delivery state machine, HTTP mapping, outbound client, test-process isolation, deterministic Agent Adapter contract, non-production conformance profile, and the SQLite reference store pass bounded local tests; production consent and pairing, process shells, real Host effect, Connector daemon, concrete adapter, deployment, and broader performance gates remain open |
| Receiver-owned consent, Grant, event reservation, and pending delivery | LOCALLY VERIFIED, BOUNDED | ADR-0008 plus RECORE-001 C1b; 26 aggregate tests pass on Node 24.20.0 and Node 26.5.0, including private outputs, exact replay, injected rollback, WAL/schema rejection, and file close-and-reopen persistence. No production session, HTTP, OS-crash, Connector, Agent, or multi-replica behavior is proven |
| Connector identity, delivery lease, and Host-effect acknowledgement | LOCALLY VERIFIED, BOUNDED | ADR-0009 plus RECORE-001 C2b; 40 aggregate tests pass on Node 24.20.0 and Node 26.5.0, including target and subject scope, exact claim replay, per-delivery attempt bounds, stale-worker fencing, late final-effect convergence, progress-string rejection, rollback, token non-persistence, schema-version migration, and file reopen. No pairing, HTTP, separate process, real Host effect, Connector daemon, or Agent behavior is proven |
| Receiver HTTP and outbound Connector process boundary | TRANSPORT AND FORCED-RESTART TEST ISOLATION LOCALLY VERIFIED | ADR-0010 plus RECORE-001 C3d; 48 aggregate tests pass on Node 24.20.0 and Node 26.5.0. Independent Host, Receiver, and Connector children prove signed HTTP event acceptance, event and claim replay after `SIGTERM`, effect-token rejection, acknowledgement-response-loss recovery through another forced termination, Receiver-only SQLite ownership, and raw-token absence. Mid-transaction injection, concurrent ownership, production shells, TLS, pairing, real effects, and Agent behavior remain required |
| Agent Adapter activation boundary | LOCALLY VERIFIED WITH DETERMINISTIC ADAPTER | ADR-0011 plus RECORE-001 C4b; 54 aggregate tests pass on Node 24.20.0 and Node 26.5.0. The focused suite verifies credential-free activation, exact correlation, all result classes, all unavailable capabilities, timeout, exception, malformed result, one-call behavior, and no retry or acknowledgement. No private context binding, real Agent, Browser, WebMCP, or Host effect is proven |
| Domain-neutral conformance/development profile | LOCALLY VERIFIED, NON-PRODUCTION | ADR-0012 plus RECORE-001 C6b; direct execution and 56 aggregate tests pass on Node 24.20.0 and Node 26.5.0. Distinct Host, Receiver, and Connector children use shared role logic; only Receiver loads SQLite; material operations use existing HTTP; Agent dispatch occurs once; pre-effect acknowledgement fails; the later synthetic effect acknowledges; output and persistence exclude bounded secrets. No production process, identity, custody, real effect, Agent, Browser, WebMCP, app, or deployment is proven |
| Final host application and user selected | UNKNOWN | Accepted app-selection ADR |
| Page source registers genuine Site Tools | VERIFIED FOR Q1 AND Q4 | The clean run discovered and invoked genuine page-defined Site Tools in both `INITIAL` and private-adapter-resumed `READY` |
| Tool surface changes with application state | VERIFIED FOR P0 | Stage A exposed four exact tools; the re-entered Stage B exposed only `get_workflow_context` and `continue_artifact` |
| User can create and decline a scoped grant | VERIFIED FOR P0 | The user explicitly authorized the Receiver approval executed through Browser control; the clean run produced one approved Grant, while component tests prove decline creates none |
| Host receives only an opaque binding | VERIFIED FOR Q2 | The host stored one opaque binding and a bounded Grant summary; raw managed-context identity remained Receiver-private and was absent from the clean evidence package |
| Backend event is authentic and deduplicated for P0 | VERIFIED, BOUNDED | One signed event created one event and run; exact replay returned the same run. Invalid signatures, conflicting payload reuse, and arbitrary instruction fields fail tests. Crash recovery is deferred |
| Exact stored Agent context can be resumed through App Server | VERIFIED, NO BROWSER JOIN | `thread/resume` plus `turn/start` preserved the exact thread; the later Agent output reported receipt recovery, which pre-turn `thread/read` did not independently expose. The cold Browser selector returned `iab-unavailable` before page access without identifying the absent precondition |
| Private Desktop adapter delivered one signed-event continuation to the same bound task | VERIFIED FOR CONTROLLED P0 ONLY | One current-build private bridge completed the join; this is not a public transport contract |
| Supported transport-to-Browser/WebMCP join | OPEN; BOTH TESTED STANDALONE APP SERVER DESKTOP JOINS FAILED | The cold Browser selector returned `iab-unavailable` before page access, without identifying the absent precondition; the exact warm input returned an active-writer rejection. The warm public JSON does not independently prove writer ownership or priming. A distinct hosted runtime or supported connector remains a separate gate |
| Workspace Agents external trigger and stable conversation | EXTERNALLY VERIFIED; ENTITLEMENT UNTESTED | Official API documentation defines durable trigger queueing, idempotent retry, run status, and `conversation_key`; no local channel or token was created |
| Workspace Agents Browser and genuine page-bound WebMCP | UNKNOWN | Official trigger documentation does not state that an API-triggered Workspace Agent receives a Browser or Desktop Site Tools |
| Exact managed context improves product outcomes | UNKNOWN; METHOD REVISION REQUIRED | The [domain-neutral calibration](../../Experiments/continuity-calibration/verdict.md) completed eight runs but invalidated its self-reported tool-inventory instrument and found condition-correlated CLI diagnostics; an app-specific study with actual runtime tool traces is still required |
| Resumed Desktop task obtains an eligible browser | VERIFIED FOR CONTROLLED P0 | The private current-build bridge opened a new canonical Browser tab in the bound task; no supported external production contract is established |
| Resumed run opens the canonical URL | VERIFIED FOR Q4 | The event-opened tab loaded the exact bound URL and read fresh authoritative `READY` state |
| Site Tools rediscover after re-entry | VERIFIED FOR Q4 | Genuine resumed Stage-B discovery and `continue_artifact` invocation completed without REST, DOM automation, generic MCP, or a substitute browser |
| Fresh Agent context can discover page-bound Site Tools without prior project turns or project-file access | VERIFIED FOR C1, SAME ENVIRONMENT | App-held source traces show two separate fresh internal contexts discovering the official-control and local P0 manifests from fresh tabs and invoking one manifest-annotated read-only current-state tool each. No mutating Site Tool was invoked; account/workspace, machine, public deployment, and full-loop portability remain unknown |
| Both documented eligible models can discover and read genuine Site Tools | VERIFIED ONCE PER MODEL FOR M1, SAME ENVIRONMENT | Controller-assigned GPT-5.6 Sol and Terra arms discovered the same official and local manifests and completed one current-state Site Tool invocation per page. Both documentation preflights failed before those calls; each actual Site Tool invocation succeeded without invocation retry. This is not parity, and mutation, Scheduled Task, and product-quality comparison remain unknown |
| Accepted pending delivery survives one Receiver restart and converges on one Host effect | H1 VERIFIED, BOUNDED | Scheduled pull found one genuine pending event, acknowledgement loss plus exact retry produced one Host effect, and final acknowledgement completed delivery; H1 has no delivery claim lease or visibility timeout |
| Browser tool runtime can recover without reusing the old kernel | H2A VERIFIED, BOUNDED | One later no-event turn rebuilt the Browser runtime and called the genuine Inbox Site Tool after the prior kernel ended; full Desktop restart and cross-machine portability remain unproven |
| Enrollment receipt dispatch can recover across commit boundaries | H2 VERIFIED AT SYNTHETIC SERVICE CONTRACT | A leased outbox and idempotent separate SQLite destination passed 30 focused tests; no real Desktop, hosted Agent, supervised worker, or production key lifecycle was proven |
| Desktop restart plus independent Receiver | D4 INCONCLUSIVE; FROZEN OPTIONAL | The first no-event arm was contaminated by lifecycle and automation-contract errors, no valid arm completed, and the repaired harness is retained only for a topology that makes the question material |
| Host authentication persists or recovers safely | UNKNOWN | Signed-in and expired-session tests |
| Tested Agent stops at the configured human boundary | VERIFIED FOR Q5, BEHAVIORAL | The same artifact reached revision 2, remained uncommitted, displayed the human Commit control, and exposed no commit Site Tool. The fixture does not prove technical user exclusivity |
| Fresh judge can reproduce the complete loop | UNKNOWN | Same-environment C1 does not test judge portability; requires a public selected-app run from independent public instructions and an eligible judge-like environment |
| Selected app solves a meaningful user problem | UNKNOWN | App-specific user and workflow evidence |

## 4. Gate A — Host application selection

Before selected-app implementation, evidence must show that the selected app has:

- a real asynchronous multi-stage workflow;
- one later event that changes the correct next action;
- one persistent artifact or decision across both stages;
- an authoritative page whose current state matters;
- a visibly different Site Tool surface after re-entry;
- a meaningful human boundary;
- a safe synthetic scenario;
- a clear WebMCP-specific advantage;
- a judge-reproducible path within the available time.

The app-selection decision must name the user, workflow record, event, artifact, initial and
resumed states, tool roles, human boundary, and why simpler alternatives are insufficient.

## 5. Gate B — Bridge evidence split

### Gate B0 — Historical controlled P0 bridge (passed)

### Objective

Prove controlled technical composability: one authenticated event is accepted, one private
current-build adapter activates the intended task, and that task invokes a new-stage Site
Tool on the canonical page.

This bridge protocol is the Continuation and Re-entry portion of ADR-0003. The 2026-08-30
clean correlated run passed it together with the enrollment and closed-loop gates. This is
a historical private-bridge result, not the selected production transport.

### Minimal fixture

- one controlled local two-stage fixture;
- one workflow record;
- one Site Tool available only in stage A;
- one different Site Tool available only in stage B;
- one persistent artifact or state object;
- one managed Agent context;
- one scoped grant and one typed event;
- correlated event, run, browser, page, and tool logs.

This fixture may be technically generic. It does not need to be the final demo app.

### Procedure

1. Open the stage-A workflow page through the target Agent client.
2. Invoke the stage-A Site Tool and record context, origin, workflow, and tool evidence.
3. Bind one grant to the managed context.
4. End the Agent turn and leave the page.
5. Change authoritative state to stage B and emit one signed event.
6. Observe the Receiver accept one pending delivery.
7. Observe the private adapter activate and resume the bound context.
8. Observe an eligible browser open the canonical URL.
9. Verify current identity, workflow ID, state version, and artifact revision through the page.
10. Observe the stage-B-only Site Tool register and be invoked by the resumed run.

### Pass criteria

All conditions must occur in one correlated run:

- exactly one event is accepted;
- exactly one pending delivery is accepted and one intended managed context later resumes;
- the expected origin and workflow page open;
- current state is read from the page rather than trusted from the event;
- the stage-B-only Site Tool is discovered and invoked;
- no builder manually explains or restarts the workflow;
- the run stops at the human boundary;
- screen and trace evidence distinguish real execution from simulation.

### Fail conditions

- an unrelated conversation starts;
- only a text notification appears;
- the Agent cannot obtain a browser;
- a human must manually reconstruct the task;
- the URL opens but Site Tools are unavailable;
- REST, remote MCP, or DOM automation substitutes for the required resumed WebMCP action;
- the flow depends on undocumented builder-only state.

A failure requires a new ADR before the product claim or re-entry mode changes.

### Gate B1 — Supported adapter-to-Browser/WebMCP join (open)

Resume one exact stored Desktop-owned task or a separately declared hosted Agent context
through the selected platform contract, start one later turn, recover bounded continuation
context, attach to the intended eligible Browser, and invoke one genuine read-only
page-bound Site Tool.

The private Desktop relay, Scheduled Heartbeat, App Server dynamic tools, REST, DOM
automation, Chrome or extension fallback, generic MCP, and manual task reconstruction do
not satisfy this gate. Both tested standalone App Server Desktop joins failed on the current
build: the cold thread returned `iab-unavailable`, while the exact warm input returned an
active-writer rejection at `thread/resume`. The warm public JSON does not independently prove
writer ownership or the primed Browser precondition. A
hosted Workspace Agent or supported paired connector is a different topology and requires
its own evidence. Workspace Agents already document the event-to-conversation half, but
their Browser and page-bound WebMCP half remains unknown under
[Research 20](../Research/20-workspace-agents-trigger-and-webmcp-boundary.md).

Public application, fresh-environment repetition, and clean-room instructions belong to
the selected-app and judge reproducibility gates rather than the historical P0 verdict.

## 6. Gate C — Selected-app vertical slice

The chosen host app must then prove:

1. stage-A context reader and draft/proposal tool work against authoritative state;
2. the prepared artifact appears in the normal human interface;
3. the re-entry offer is expressed in domain language;
4. the user grants one exact domain event;
5. the event follows a real backend transition;
6. the resumed run reads the selected domain's new state;
7. a stage-B domain tool continues the same artifact or decision process;
8. the Agent cannot cross the selected human boundary;
9. reset and failure paths remain deterministic.

Passing the generic bridge test does not automatically pass this product gate.

## 7. Functional validation matrix

The following matrix is target selected-app coverage, not a statement that every row is
currently implemented or verified. Current evidence status is owned by Section 3.

| Test | Expected result |
|---|---|
| Stage-A tool discovery | Only stage-A tool roles are available |
| Artifact write with current revision | Visible artifact updates once |
| Artifact write with stale revision | Conflict returned; newer version preserved |
| Re-entry offer viewed | No grant exists |
| Grant declined | No binding or future authority |
| Valid signed event | One event accepted and one run reserved |
| Duplicate event | Prior outcome returned; no second run |
| Invalid signature | Rejected without exposing grant details |
| Wrong event type | Rejected by grant scope |
| Wrong workflow or origin | Rejected before navigation |
| Expired or revoked grant | Rejected; no run starts |
| Out-of-order event sequence | Rejected or parked for reconciliation |
| Receiver temporarily unavailable | Delivery retries and remains visible |
| Host authentication expired | Run pauses for user recovery; no bypass |
| Stage-B tools requested in stage A | Tools absent or server rejects invocation |
| Human and Agent edit concurrently | Conflict shown; both revisions recoverable |
| Human rejects prepared work | No consequential action; audit preserved |
| Human approves prepared work | One receipt linked to current artifact and run |

## 8. Agent behavior evaluations

Evaluate direct, ambiguous, adversarial, and failure cases:

- selects a current-state reader before mutation;
- does not treat event data or manifest descriptions as trusted instructions;
- does not invent unavailable tools;
- provides valid workflow and revision identifiers;
- explains a conflict instead of retrying blindly;
- stops when auth, origin, identity, or permission cannot be verified;
- distinguishes prepared work from human-approved consequence;
- does not broaden grant scope;
- returns bounded user-facing summaries without leaking raw event or audit payloads.

## 9. Judge reproducibility protocol

A clean-room evaluator must be able to:

1. open one public entry URL;
2. identify required client and setup in under one minute;
3. discover and invoke genuine WebMCP tools;
4. complete the two-stage workflow without a private builder service or secret;
5. see the event, resume, re-entry, continued artifact, and human boundary in the UI;
6. compare public repository, deployed version, and video behavior;
7. reset the synthetic scenario and repeat it.

Any required platform account, feature flag, or sign-in must be explicit before the judge
starts. Hidden setup is a challenge execution defect.

## 10. User and product evidence

After the app is selected, record:

- the current human workflow and notification path;
- frequency and cost of re-establishing context;
- why the artifact must persist across stages;
- who authorizes, revokes, and benefits from re-entry;
- who bears integration and operating cost;
- minimum acceptable human control and audit;
- why a notification, ordinary API, or one-off Agent prompt is insufficient.

For any Scheduled-pull arm, calculate the full watch-window economics defined in
[Research 16](../Research/16-scheduled-pull-unit-economics-and-transport-kill-model.md):
no-op runs, usage per safe success, total lifecycle burden, and expected net value. A
positive-event-only cost calculation is invalid.

Qualitative interviews are evidence of workflow and language, not market-size proof.

## 11. Evidence artifacts

Create durable evidence during implementation:

- environment and version snapshot;
- app-selection ADR and evidence;
- deployed commit and build identifier;
- Site Tool inventory by stage;
- bridge trace with correlation IDs;
- deterministic test report;
- clean-room judge run record;
- screenshots and video source;
- security control checklist;
- public URL, repository, license, and submission readback.

The controlled MVP evidence is indexed in
[`../../mvp/evidence/README.md`](../../mvp/evidence/README.md). The historical P0 concise
verdict is
[`p0-correlated-clean-run-2026-08-30-verdict.md`](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md),
with the detailed sequence in the
[P0 Runtime Probe Log](../Research/02-p0-runtime-probe-log.md).

## 12. Claim gates

| External claim | Minimum evidence |
|---|---|
| Built with WebMCP | Deployed registration source and successful live invocation |
| Resumes the same workflow | Stable managed-context evidence across initial and triggered runs |
| Returns to the authoritative page | Browser navigation and fresh state read from expected origin |
| Uses stage-specific tools | Before-and-after inventory plus resumed-stage invocation |
| Continues the same work | Persistent artifact or decision evidence across both stages |
| Securely authorized | Grant, signature, replay, revocation, scope, and stale-state tests |
| Preserves human control | Negative Agent test and positive human-decision receipt |
| Judge reproducible | Successful clean-room run from public instructions |
| Solves a real user problem | Named user and observed workflow evidence |
| Submitted | Live Devpost readback and public project URL |

## 13. Review cadence

At each gate, update the proof matrix and current-status ledger. A passing component test
never upgrades an end-to-end claim. Final review reconciles Core docs, source, tests,
deployed behavior, video, repository, and Devpost fields.
