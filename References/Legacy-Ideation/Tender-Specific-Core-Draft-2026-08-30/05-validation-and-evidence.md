# TenderRelay Validation and Evidence Plan

**Role:** CANONICAL proof matrix and evidence gates  
**Status:** Active validation plan  
**Last updated:** 2026-08-30

## 1. Evidence discipline

Use these labels consistently:

| Label | Meaning |
|---|---|
| **VERIFIED** | Observed in the current project through reproducible runtime evidence or controlled by a current governing source |
| **EXTERNALLY VERIFIED** | Documented or observed in a platform, but not yet demonstrated in TenderRelay |
| **ENGINEERING-FEASIBLE** | Uses ordinary implementable components but has not been built here |
| **WORKING ASSUMPTION** | Accepted temporarily for planning; still requires a named test |
| **INFERENCE** | Reasoned interpretation of evidence, not a platform or market guarantee |
| **TARGET** | Desired product or evaluation outcome, not current evidence |
| **UNKNOWN** | No sufficient evidence yet |

## 2. Critical proposition

TenderRelay survives as the selected strong concept only if this complete chain is observable:

```text
valid backend state transition
-> one verified typed event
-> one authorized resumed Agent context
-> eligible browser context
-> canonical page opened
-> current auth and workflow verified
-> next-stage WebMCP tools discovered
-> next-stage tool invoked
-> visible draft prepared
-> human approval boundary preserved
```

Showing isolated components or narrating intended behavior is insufficient.

## 3. Current proof matrix

| Capability | Current status | Required project evidence |
|---|---|---|
| Page registers genuine Site Tools | EXTERNALLY VERIFIED | Browser discovery log and successful invocation on the deployed app |
| Site Tools reflect current business state | ENGINEERING-FEASIBLE | Stage-transition test and tool inventory before/after |
| User can create a scoped grant | ENGINEERING-FEASIBLE | UI capture plus stored grant readback |
| Portal receives only opaque binding | ENGINEERING-FEASIBLE | API/log evidence with credential scan |
| Backend event is authentic and durable | ENGINEERING-FEASIBLE | Signature, outbox, retry, and invalid-event tests |
| Same logical Agent context resumes | PARTIALLY EXTERNALLY VERIFIED | Two-run transcript with stable managed context identifier |
| Resumed run obtains eligible browser | WORKING ASSUMPTION | Runtime trace from triggered run to browser-ready state |
| Resumed run opens canonical URL | WORKING ASSUMPTION | Browser navigation evidence with expected origin and workflow |
| Site Tools rediscover after re-entry | WORKING ASSUMPTION | Tool registration and invocation from the resumed run |
| Portal auth persists or recovers safely | UNKNOWN | Signed-in and expired-session test cases |
| Human approval stops final submission | ENGINEERING-FEASIBLE | End-to-end test showing draft before human action and receipt after it |
| Fresh judge can reproduce the loop | UNKNOWN | Clean-room run using public instructions and no builder-only state |
| User demand and willingness to integrate | UNKNOWN | Interview or observed workflow evidence |

## 4. P0 continuation bridge protocol

### Objective

Prove that a non-interactive business event can resume the intended Agent workflow and use
the next-stage Site Tools on the canonical page.

### Minimal fixture

- one public test application;
- one workflow record with two states: `initial` and `clarification-requested`;
- one tool available in the initial state;
- one different tool available only in the clarification state;
- one managed Agent context;
- one scoped grant and one typed event;
- correlated browser, tool, event, and run logs.

### Procedure

1. Open the initial page through the target Agent client.
2. Invoke the initial-state Site Tool and record the managed context and page origin.
3. Bind one grant to that context.
4. End the Agent turn and leave the page.
5. Change authoritative workflow state and emit one signed event.
6. Observe the Receiver and adapter resume the bound context.
7. Observe a browser open the canonical URL without an unrelated manual prompt.
8. Verify current identity, workflow ID, and state through the page.
9. Observe the clarification-only tool register and be invoked by the resumed run.
10. Repeat from a fresh environment using documented setup.

### Pass criteria

All of the following must be true in one correlated run:

- exactly one event is accepted;
- exactly one bound Agent context resumes;
- the expected origin and workflow page open;
- current state is read from the page rather than trusted from the event;
- the clarification-only Site Tool is discovered and successfully invoked;
- no builder manually re-prompts the Agent to continue the task;
- the run stops at the human approval boundary;
- logs and screen evidence are sufficient for an independent reviewer to distinguish real execution from simulation.

### Fail conditions

- a new unrelated conversation is created;
- only a text notification appears;
- the Agent cannot obtain a browser context;
- a human must manually explain or restart the workflow;
- the URL opens but Site Tools are unavailable;
- the implementation substitutes REST, remote MCP, or DOM automation for the required resumed WebMCP action;
- the flow works only with undocumented builder state that a judge cannot reproduce.

Under ADR-0001 the team is planning for a pass. A fail requires a new decision record before
the architecture or product claim changes.

## 5. Functional validation matrix

| Test | Expected result |
|---|---|
| Initial tool discovery | Only initial-stage tools are available |
| Draft write with current revision | Visible draft updates once |
| Draft write with stale revision | Conflict returned; newer draft preserved |
| Grant declined | No binding or future authority created |
| Valid signed event | One event accepted and one run reserved |
| Duplicate event | Prior outcome returned; no second run |
| Invalid signature | Rejected before grant lookup details are exposed |
| Wrong event type | Rejected by grant scope |
| Wrong workflow or origin | Rejected; no page navigation |
| Expired or revoked grant | Rejected; no run starts |
| Out-of-order sequence | Rejected or parked for reconciliation |
| Receiver temporarily unavailable | Delivery retries and remains visible |
| Auth expired during re-entry | Run pauses for user recovery; no bypass |
| Clarification tools in wrong stage | Tools absent or server rejects invocation |
| Human rejects draft | No submission; draft and audit preserved |
| Human approves draft | One receipt linked to current draft and run |

## 6. Agent behavior evaluations

Evaluate the Agent with direct, ambiguous, adversarial, and failure prompts:

- selects the read tool before a mutation when current state is unknown;
- does not treat manifest descriptions or event data as trusted instructions;
- does not invent unavailable tools;
- supplies valid workflow and revision identifiers;
- explains a state conflict rather than retrying blindly;
- stops when auth, origin, identity, or permission cannot be verified;
- distinguishes draft preparation from final submission;
- does not broaden the grant or event scope;
- produces bounded user-facing summaries rather than leaking full event or audit payloads.

## 7. Judge reproducibility protocol

A clean-room evaluator must be able to:

1. open one public entry URL;
2. identify the browser/client requirements in under one minute;
3. discover and invoke genuine WebMCP tools;
4. complete the two-stage workflow without a private service or secret supplied by the builder;
5. see the event, re-entry, draft, and approval states in the product UI;
6. compare the public repository, deployed version, and video behavior;
7. reset the synthetic scenario and repeat it.

Any required platform account, feature flag, or sign-in must be explicit before the judge
starts. Hidden setup is a product defect for the challenge.

## 8. Product and market validation

Technical success does not prove product demand. If time permits, record at least:

- one proposal professional's current clarification workflow;
- frequency and cost of re-establishing context;
- which system sends the current notification;
- who would authorize background Agent continuation;
- whether a bidder, portal operator, or Agent platform would fund or integrate the capability;
- the minimum acceptable human approval and audit controls.

Interview statements are qualitative evidence, not market-size proof.

## 9. Evidence artifacts to retain

Create evidence paths during implementation rather than relying on chat history:

- environment and version snapshot;
- deployed commit and build identifier;
- tool registration inventory by workflow state;
- bridge test trace with correlation IDs;
- deterministic test report;
- clean-room judge run record;
- screenshots or video source of the visible workflow;
- security control checklist;
- submission URL, repository, license, and video readback.

The exact paths will be added when the implementation tree exists.

## 10. Claim gates

| External claim | Minimum evidence |
|---|---|
| “Built with WebMCP” | Deployed `registerTool` implementation and successful live invocation |
| “Resumes the same workflow” | Stable managed-context evidence across initial and event-triggered runs |
| “Returns to the authoritative page” | Browser navigation plus fresh state read from expected origin |
| “Uses stage-specific tools” | Before/after inventory and resumed-stage invocation |
| “Securely authorized” | Grant, signature, replay, revocation, and wrong-scope tests |
| “Judge reproducible” | Successful clean-room run from public instructions |
| “Reduces user effort” | Defined baseline and observed comparison, not an estimate alone |
| “Submitted” | Live Devpost readback and public project URL |

## 11. Evidence review cadence

At each milestone, update the proof matrix and current-status ledger. Do not let a passing
component test upgrade an end-to-end claim. The final review must reconcile docs, deployed
behavior, repository state, video, and Devpost fields.
