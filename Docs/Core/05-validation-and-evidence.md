# WebMCP Re-entry Workflow — Validation and Evidence Plan

**Role:** CANONICAL proof matrix and evidence gates  
**Status:** P0 technical gate passed; demo app, production bridge, and judge gate open  
**Last updated:** 2026-08-30

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

## 2. Critical proposition

The selected concept is proven only if one complete chain is observable:

~~~text
valid host-application state transition
-> one verified typed event
-> one authorized managed Agent context resumes
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

## 3. Current proof matrix

| Capability | Current status | Required project evidence |
|---|---|---|
| Core re-entry mechanism selected | VERIFIED AS DECISION | ADR-0002 |
| Final host application and user selected | UNKNOWN | Accepted app-selection ADR |
| Page source registers genuine Site Tools | VERIFIED FOR Q1 AND Q4 | The clean run discovered and invoked genuine page-defined Site Tools in both `INITIAL` and event-resumed `READY` |
| Tool surface changes with application state | VERIFIED FOR P0 | Stage A exposed four exact tools; the re-entered Stage B exposed only `get_workflow_context` and `continue_artifact` |
| User can create and decline a scoped grant | VERIFIED FOR P0 | The user explicitly authorized the Receiver approval executed through Browser control; the clean run produced one approved Grant, while component tests prove decline creates none |
| Host receives only an opaque binding | VERIFIED FOR Q2 | The host stored one opaque binding and a bounded Grant summary; raw managed-context identity remained Receiver-private and was absent from the clean evidence package |
| Backend event is authentic and deduplicated for P0 | VERIFIED, BOUNDED | One signed event created one event and run; exact replay returned the same run. Invalid signatures, conflicting payload reuse, and arbitrary instruction fields fail tests. Crash recovery is deferred |
| Same managed Agent context resumes | VERIFIED FOR Q3 | App Server independently proves persisted exact-thread resume; the clean Desktop run delivered the correlated event into the same bound task with its prior enrollment receipt and Stage-A history |
| Exact managed context improves product outcomes | UNKNOWN; METHOD REVISION REQUIRED | The [domain-neutral calibration](../../Experiments/continuity-calibration/verdict.md) completed eight runs but invalidated its self-reported tool-inventory instrument and found condition-correlated CLI diagnostics; an app-specific study with actual runtime tool traces is still required |
| Resumed Desktop task obtains an eligible browser | VERIFIED FOR CONTROLLED P0 | The private current-build bridge opened a new canonical Browser tab in the bound task; no supported external production contract is established |
| Resumed run opens the canonical URL | VERIFIED FOR Q4 | The event-opened tab loaded the exact bound URL and read fresh authoritative `READY` state |
| Site Tools rediscover after re-entry | VERIFIED FOR Q4 | Genuine resumed Stage-B discovery and `continue_artifact` invocation completed without REST, DOM automation, generic MCP, or a substitute browser |
| Host authentication persists or recovers safely | UNKNOWN | Signed-in and expired-session tests |
| Tested Agent stops at the configured human boundary | VERIFIED FOR Q5, BEHAVIORAL | The same artifact reached revision 2, remained uncommitted, displayed the human Commit control, and exposed no commit Site Tool. The fixture does not prove technical user exclusivity |
| Fresh judge can reproduce the complete loop | UNKNOWN | Clean-room run using public instructions |
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

## 5. Gate B — P0 continuation bridge protocol

### Objective

Prove that a non-interactive business event can resume the intended Agent workflow and invoke
a new-stage Site Tool on the canonical page.

This bridge protocol is the Continuation and Re-entry portion of ADR-0003. The 2026-08-30
clean correlated run passed it together with the enrollment and closed-loop gates. The
procedure remains active as the repeatability contract for future environments.

### Minimal fixture

- one public two-stage web application;
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
6. Observe the Receiver and adapter resume the bound context.
7. Observe an eligible browser open the canonical URL.
8. Verify current identity, workflow ID, state version, and artifact revision through the page.
9. Observe the stage-B-only Site Tool register and be invoked by the resumed run.
10. Repeat from a fresh environment with documented setup.

### Pass criteria

All conditions must occur in one correlated run:

- exactly one event is accepted;
- exactly one intended managed context resumes;
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

The controlled P0 package is indexed in
[`../../mvp/evidence/README.md`](../../mvp/evidence/README.md). Its concise verdict is
[`p0-correlated-clean-run-2026-08-30-verdict.md`](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md).

Current P0 evidence is indexed in
[`../../mvp/evidence/README.md`](../../mvp/evidence/README.md), with the detailed sequence in
the [P0 Runtime Probe Log](../Research/02-p0-runtime-probe-log.md).

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
