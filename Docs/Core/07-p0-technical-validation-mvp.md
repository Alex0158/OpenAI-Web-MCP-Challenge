# WebMCP Re-entry Workflow — P0 Technical Validation MVP

**Role:** CANONICAL first implementation contract  
**Status:** Frozen contract; one clean correlated Q1–Q5 controlled P0 run passed  
**Last updated:** 2026-08-30  
**Controlling decision:** [ADR-0003](../Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md)

**Authority boundary:** Sections 1–15 preserve the frozen P0 contract, and Sections 16–20
preserve its dated outcome. Event-to-resume wording describes the private controlled P0 join
only. [ADR-0004](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md) and
[Core/00](00-current-status.md) control ongoing event/transport separation; this file does not
define the current production topology.

## 1. Purpose

Build the smallest domain-neutral runtime fixture that can prove or falsify the WebMCP
re-entry workflow mechanism. This is a disposable technical harness, not the final host
application, product architecture, brand, market, or submission demo.

The harness succeeds only when one correlated run proves the full chain. Documentation,
pseudocode, mocked screenshots, isolated thread resume, and isolated WebMCP tool calls are
not sufficient.

## 2. Frozen proposition

> A live WebMCP page can offer a user-approved future re-entry; a trusted Receiver can bind
> that Grant to the current managed Agent context; a later authenticated event can resume
> that exact context once; the resumed run can return through an eligible browser to the
> canonical page, read fresh state, discover and invoke a new-stage Site Tool, continue the
> same artifact, and stop before a visible human commitment control that is not exposed as
> a Site Tool.

## 3. One MVP, five questions, three gates

| ID | Feasibility question | Minimum passing evidence | Failure meaning |
|---|---|---|---|
| **Q1** | Can the page deliver a Re-entry Manifest to the Agent through genuine WebMCP? | The supported client discovers and invokes the Stage-A `get_reentry_offer` Site Tool and the Agent receives the bounded structured manifest | The enrollment path is not grounded in WebMCP |
| **Q2** | Can the Receiver create a user-approved Grant bound to the exact managed context without exposing that context to the host? | Receiver-owned consent creates one Grant; the Receiver stores the real context binding; the host stores only an opaque binding | The authority or context-isolation model is not implementable as designed |
| **Q3** | Can a later authenticated event resume the intended managed context with deduplicated run identity? | One valid signed event resolves one active Grant, reserves one run, resumes the recorded context, and preserves Stage-A conversation evidence; a duplicate starts no second run | The mechanism is only a notification or unrelated Agent trigger |
| **Q4** | Can the resumed run regain the authoritative WebMCP page and its new tool surface? | The run obtains an eligible browser, opens the canonical URL, reads current page state, discovers the Stage-B-only Site Tool, and invokes it without a builder reconstructing the task | The mechanism degrades to generic Agent orchestration rather than WebMCP re-entry |
| **Q5** | Can the Agent continue the same work while preserving the configured human boundary? | The Stage-B call updates the same persistent artifact and stops before the visible human commit control, which is absent from the Site Tool surface | The result is a wake-up demo, not a resumable governed workflow |

### Gate 1 — Enrollment

Proves Q1 and Q2.

### Gate 2 — Continuation and Re-entry

Proves Q3 and Q4. A manually seeded binding may be used first to isolate this gate, but it
cannot satisfy the final integrated acceptance run.

### Gate 3 — Closed-loop Workflow

Proves Q5 and repeats Q1–Q4 in one unbroken correlated run.

## 4. Minimal synthetic fixture

| Field | Frozen MVP value |
|---|---|
| Workflow ID | `WF-001` |
| Initial state | `INITIAL` |
| Resumed state | `READY` |
| Authorized event | `WORKFLOW_READY` |
| Persistent artifact | `continuation_note` with integer revision |
| Initial user job | Read current context, prepare the first artifact revision, and authorize one future event |
| Later transition | A deterministic external control changes `INITIAL` to `READY` and writes one signed event intent |
| Resumed job | Read current state and continue `continuation_note` through a Stage-B-only Site Tool |
| Human boundary | `Commit artifact`, represented as a visible human UI control and omitted from the Site Tool surface |
| Grant limit | One workflow, one event type, one run, one canonical origin, short fixed expiry |
| Reset | Deterministically restore `WF-001`, artifact revision, Grant, event, run, and trace state |

The labels are deliberately domain-neutral. They must not be promoted into final product
language.

## 5. Site Tool inventory

| Tool | Stage | Purpose |
|---|---|---|
| `get_workflow_context` | Initial and resumed | Return authoritative workflow state, artifact content, state version, artifact revision, and human-boundary status |
| `prepare_artifact` | Initial only | Write the first visible artifact revision with an expected revision |
| `get_reentry_offer` | Initial only | Return the signed, bounded Re-entry Manifest; viewing it grants no authority |
| `register_reentry_binding` | Initial only | Store the opaque binding and non-sensitive Grant summary returned by the Receiver |
| `continue_artifact` | Resumed only | Continue the same artifact with expected state and artifact revisions |

There is no Agent-callable `commit_artifact` tool. The human UI owns the only consequential
commit control.

## 6. Re-entry Manifest contract

The Stage-A page obtains a backend-signed manifest and exposes it through
`get_reentry_offer`:

~~~json
{
  "manifest_id": "rm_...",
  "correlation_id": "corr_...",
  "issuer_origin": "http://127.0.0.1:PORT",
  "workflow_id": "WF-001",
  "canonical_url": "http://127.0.0.1:PORT/workflows/WF-001",
  "allowed_event_type": "WORKFLOW_READY",
  "expires_at": "...",
  "max_runs": 1,
  "human_boundary": "COMMIT_ARTIFACT",
  "continuation_intent": {
    "mode": "OPEN_CANONICAL_PAGE",
    "first_action": "READ_CURRENT_STATE",
    "required_tool_role": "CONTINUE_ARTIFACT",
    "stop_before": "COMMIT_ARTIFACT"
  },
  "key_id": "mvp-local-1",
  "signature": "..."
}
~~~

The manifest is a website-authored offer, not a Grant and not an Agent prompt. The Receiver
validates the pinned origin, signature, workflow, URL, event type, expiry, run limit, and
human boundary before showing consent. `continuation_intent` uses Receiver-understood enum
values rather than free-form instructions. It may describe how a future authorized run
should re-enter, but it cannot grant tools or override Receiver and Agent policy.

## 7. Continuation Grant and binding contract

Before enrollment, an authenticated Receiver client asks the selected adapter to capture a
managed context without supplying a context identifier. The Receiver stores the adapter
result privately and returns a short-lived one-time `capture_handle`. Only a SHA-256 digest
of that bearer is stored. Enrollment strictly accepts `{ manifest, capture_handle }`, checks
that both belong to the same signed workflow correlation, and atomically consumes the handle.
Caller-supplied `managed_context_id` and `managed_context_kind` fields are rejected.

The Receiver-owned consent surface shows the exact event, workflow, origin, expiry, one-run
limit, and human boundary. Approval creates:

~~~json
{
  "grant_id": "gr_...",
  "agent_binding": "ab_opaque_...",
  "workflow_id": "WF-001",
  "issuer_origin": "http://127.0.0.1:PORT",
  "event_type": "WORKFLOW_READY",
  "canonical_url": "http://127.0.0.1:PORT/workflows/WF-001",
  "max_runs": 1,
  "runs_used": 0,
  "status": "ACTIVE",
  "expires_at": "...",
  "continuation_intent": {
    "mode": "OPEN_CANONICAL_PAGE",
    "first_action": "READ_CURRENT_STATE",
    "required_tool_role": "CONTINUE_ARTIFACT",
    "stop_before": "COMMIT_ARTIFACT"
  },
  "managed_context_kind": "adapter-specific",
  "managed_context_id": "receiver-private"
}
~~~

The Receiver stores `managed_context_id` in its own trust boundary. The host page, host
backend, capture response, approval response, and public event response do not receive it.
The Agent model and website are not authorities for context identity. The P0 HTTP surface has
no raw-context injection route and exposes no public raw trace endpoint.

Declining consent creates no Grant and no binding. This is the only enrollment negative
control required for P0.

### 7.1 Context-carried continuation receipt

After approval, the Receiver converts the untrusted website offer into a validated receipt
and persists that receipt into the same managed Agent context through a trusted adapter
surface:

~~~json
{
  "receipt_type": "WEBMCP_REENTRY_GRANT",
  "grant_id": "gr_...",
  "workflow_id": "WF-001",
  "canonical_url": "http://127.0.0.1:PORT/workflows/WF-001",
  "authorized_event_type": "WORKFLOW_READY",
  "continuation_intent": {
    "mode": "OPEN_CANONICAL_PAGE",
    "first_action": "READ_CURRENT_STATE",
    "required_tool_role": "CONTINUE_ARTIFACT",
    "stop_before": "COMMIT_ARTIFACT"
  },
  "expires_at": "..."
}
~~~

This receipt tests the context-carried re-entry-plan hypothesis: when the same context is
resumed later, it already contains the user-approved reason, destination, first action,
required tool role, and stopping boundary. The website cannot write the trusted receipt
directly. The Receiver derives it only after validation and consent.

For the App Server candidate, documented persisted history primitives such as
`thread/inject_items` are candidates to test for receipt storage. No persistence mechanism
is accepted until the resumed context demonstrates the receipt in runtime evidence.

## 8. Typed event contract

The deterministic transition commits the state change and event intent before delivery.
The Receiver accepts a strict payload with no prompt or free-form instruction field:

~~~json
{
  "event_id": "evt_...",
  "event_type": "WORKFLOW_READY",
  "workflow_id": "WF-001",
  "agent_binding": "ab_opaque_...",
  "event_sequence": 1,
  "state_version": 2,
  "canonical_url": "http://127.0.0.1:PORT/workflows/WF-001",
  "occurred_at": "..."
}
~~~

For the local MVP, HMAC-SHA-256 over `timestamp + "." + exact_raw_body` with one pinned
development secret is sufficient. The Receiver verifies the signature, active Grant,
event scope, event ID, and unused run budget, then atomically records the event and reserves
the run.

One duplicate delivery must return the recorded result and start no second run. One invalid
signature must start no run. Broader replay, ordering, key rotation, and recovery behavior
are deferred.

## 9. Context-carried plan and Receiver-generated wake input

The website and event cannot provide arbitrary Agent instructions. After validation, the
Receiver constructs a fixed adapter input equivalent to:

> The authorized WORKFLOW_READY event has been accepted for the bound Grant. Continue
> according to the validated re-entry receipt already stored in this managed context. Open
> the bound canonical URL, read authoritative state from the page, and stop at the recorded
> human boundary.

The exact wording may be tuned and may restate the canonical URL from the Receiver-owned
Grant for deterministic routing. It cannot add a new action, broaden the Grant, or carry
business state. All domain state must be re-read from the page.

The context-carried receipt solves an instruction-continuity problem: it lets the resumed
Agent know why it returned and what approved plan to follow. It does not solve a
capability-continuity problem. If the resumed runtime does not expose or attach an eligible
Browser and genuine Site Tools, no amount of prior conversation context can make Q4 pass.

## 10. Runtime components

### Fixture web application

- serves the human workflow page and Receiver-owned consent page on separate logical paths;
- owns workflow state, artifact revisions, deterministic transition, and human commit;
- registers only the Site Tools valid for the rendered state;
- exposes the opaque binding to the host backend without storing Agent context identifiers.

### Receiver and Grant store

- verifies manifests and events;
- owns consent, Grants, private context bindings, event deduplication, and run reservation;
- constructs the fixed continuation input;
- invokes the selected Agent Continuation Adapter.

### Agent Continuation Adapter

- captures the current managed context through a trusted client surface;
- resumes that exact context;
- starts one continuation turn;
- obtains or attaches an eligible browser;
- opens the canonical URL and makes genuine Site Tools available;
- emits adapter, browser, page, and tool evidence.

The controlled P0 selects the Desktop task adapter plus an experimental local relay only as
the evidence route for this run. The production adapter remains unselected until a
documented external contract can satisfy the same responsibilities.

### Evidence recorder

- writes bounded JSON Lines trace entries;
- correlates manifest, consent, Grant, event, run, browser, Site Tool, artifact, and human
  boundary records;
- redacts secrets and raw platform credentials.

## 11. Initial implementation stack

This is the freeze-time planned stack. The successful run used Node.js `v26.5.0`, as recorded
in Section 16.

Use the smallest locally available stack unless adapter evidence requires a change:

- Node.js 24, ECMAScript modules, and built-in `node:http`, `node:crypto`, and `node:sqlite`;
- browser-native HTML, CSS, and JavaScript;
- `node:test` for deterministic component tests;
- one SQLite database with logical host and Receiver ownership boundaries;
- one process for the fixture and Receiver where practical;
- one adapter module that may launch or call the selected Agent runtime.

Add a dependency only when a current runtime contract cannot be implemented reliably with
the platform libraries.

## 12. Planned implementation tree

This is the freeze-time planned source layout, not the current repository inventory. Later
H1, H2, and D4 work added further source and test files.

~~~text
mvp/
  package.json
  README.md
  src/
    server.mjs
    config.mjs
    database.mjs
    domain.mjs
    trace.mjs
    webmcp-manifest.mjs
    receiver/
      grants.mjs
      events.mjs
      consent.mjs
    adapters/
      adapter-contract.mjs
      selected-adapter.mjs
  public/
    index.html
    app.js
    styles.css
  scripts/
    reset.mjs
    trigger-event.mjs
  test/
    manifest-and-grant.test.mjs
    event-and-deduplication.test.mjs
    workflow-state.test.mjs
  evidence/
    README.md
~~~

Adapter-specific files may be added without changing the frozen questions.

## 13. Correlated acceptance run

One final run must show, in order:

1. reset `WF-001` to `INITIAL`;
2. open the canonical page through the target Agent client;
3. discover and invoke `get_workflow_context` and `prepare_artifact`;
4. discover and invoke `get_reentry_offer`;
5. approve the offer through the Receiver-owned consent surface;
6. bind the exact managed context and persist the validated continuation receipt into it;
7. register only the opaque binding with the host;
8. end the Agent turn and leave or close the page;
9. transition the authoritative workflow to `READY` and emit one signed event;
10. accept one event, reserve one run, and resume the exact managed context;
11. prove the resumed context contains the prior validated continuation receipt;
12. obtain an eligible browser and open the bound canonical URL;
13. invoke `get_workflow_context` and prove current state is `READY`;
14. prove initial-only tools are absent and `continue_artifact` is present;
15. invoke `continue_artifact` against the prior artifact revision;
16. show the continued artifact in the human UI;
17. stop before the visible `Commit artifact` control, which is absent from the Site Tool
    surface;
18. deliver the same event again and prove no second run or artifact write occurs;
19. show one correlated trace covering the complete chain.

No builder may manually restate the workflow, inject the Stage-B action, or substitute a
non-WebMCP mutation during steps 9–17.

## 14. Evidence schema

Every trace entry contains:

~~~json
{
  "time": "...",
  "correlation_id": "corr_...",
  "component": "host|receiver|adapter|browser|site_tool|human_ui",
  "action": "...",
  "workflow_id": "WF-001",
  "grant_id": "optional",
  "event_id": "optional",
  "run_id": "optional",
  "outcome": "accepted|completed|rejected|paused|failed",
  "details": {}
}
~~~

Required evidence artifacts are the environment snapshot, Site Tool inventory by stage,
raw redacted trace, component-test report, screen recording or screenshots, and a concise
five-question verdict.

## 15. Minimum tests

### Component tests

- manifest signature verifies and tampering fails;
- consent approval creates one private context binding and one opaque host binding;
- the validated continuation receipt is persisted into the bound managed context;
- consent decline creates neither;
- valid event reserves one run;
- invalid signature reserves no run;
- duplicate event returns the prior result and creates no second run;
- state-derived Site Tool inventory differs between `INITIAL` and `READY`;
- continuation requires current state and artifact revision;
- no Agent-callable commitment tool exists.

### Runtime tests

- same managed context resumes with visible Stage-A conversation evidence;
- resumed context contains the validated continuation receipt from the initial session;
- canonical page opens in an eligible browser;
- current state is read from the page;
- the Stage-B-only Site Tool is discovered and invoked;
- the same artifact continues and the Agent stops at the human boundary.

Component tests cannot substitute for runtime tests.

## 16. Dated P0 platform evidence and adapter gate

At the 2026-08-30 P0 evidence boundary, official OpenAI documentation established separate
primitives:

- [Codex App Server](https://learn.chatgpt.com/docs/app-server) documents
  `thread/resume` and `turn/start` for stored conversation continuation.
- [Workspace Agent triggers](https://learn.chatgpt.com/workspace-agents/trigger-runs)
  document durable triggering, stable `conversation_key`, idempotency, and run status.
- [Site Tools](https://learn.chatgpt.com/docs/webmcp) document page-provided WebMCP
  tools in the shared signed-in browser session and state that closing or navigating away
  can make those tools unavailable. They require a supported model, current desktop app,
  eligible workspace and rollout, plus the user-controlled
  `Settings > Browser > Permissions > Enable site tools` permission.
- [Browser](https://learn.chatgpt.com/docs/browser) documents a separate built-in
  browser profile and does not make Browser available in Codex CLI or the IDE extension.

Local evidence on 2026-08-30:

- `codex-cli 0.144.1`, Node.js `v26.5.0`, and the current unified Desktop client
  `/Applications/ChatGPT.app` `26.825.41651` (build `7345`) are active for the positive
  control; the older `/Applications/Codex.app` `26.803.41515` result remains a negative
  environment control;
- the experimental App Server schema contains `thread/resume`, `turn/start`, and
  `dynamicTools`;
- that schema exposes no Browser navigation, Browser attachment, Site Tool, or WebMCP method.
- the newer Desktop Browser exposes `webmcp` on the official control page and the local
  Stage-A page;
- genuine Stage-A calls returned authoritative state and a signed bounded Re-entry Manifest
  whose ID matches the Receiver trace;
- one clean correlated run used Receiver-owned consent, a private exact-task Grant, one
  authenticated event, the event-opened canonical Browser tab, genuine resumed Stage-B
  discovery and invocation, and the same artifact through the human boundary;
- exact replay after Stage B returned the prior run and created no second event, run, or
  artifact write;
- the post-fix independent runbook rehearsal repeated the same Q1–Q5 chain after the relay
  compacted a greater-than-64-KiB native task response into a small verified identity
  proof; and
- the frozen P0 component and contract scope passed 37 tests. The current complete suite count
  is owned by [Core/00](00-current-status.md); the frozen clean-run package retains its
  accurate historical 23-test snapshot.

`dynamicTools` are not evidence of WebMCP Site Tools. App Server independently isolates Q3,
but its current adapter cannot pass Q4 because it exposes no supported Browser or Site Tool
continuation. The private current-build Desktop bridge closed the join for P0 technical
feasibility only. The remaining platform question is a documented, deployable join between
an external Receiver and a Browser-eligible Agent context, not basic Site Tools availability
or conceptual composability.

## 17. Happy-path limits and deferred work

The P0 MVP deliberately defers:

- final domain, persona, customer, brand, and market validation;
- public deployment and judge onboarding;
- multiple workflows, event types, users, devices, tenants, and concurrent runs;
- production authentication, MFA recovery, and cross-device browser migration;
- asymmetric key infrastructure, rotation, issuer onboarding, and compromise recovery;
- generalized policy engines, queue infrastructure, disaster recovery, and observability;
- extensive retries, dead-letter workflows, conflict UI, and performance optimization;
- production privacy, retention, compliance, and billing controls;
- visual polish beyond a readable proof surface.

Deferred work must not be implemented as speculative fallback code.

## 18. Go, adapt, and no-go rules

### Go

All five questions pass in one correlated run with genuine WebMCP evidence and no manual
workflow reconstruction.

**Satisfied for controlled P0 on 2026-08-30.** This Go decision advances the project to
demo-app selection and production-bridge work; it does not approve the private relay as the
shipping architecture.

### Adapt

An adapter route fails, but another credible route can still satisfy the same five frozen
questions. Record the failure, change only the adapter boundary, and rerun the same tests.

### No-go for the strongest claim

After credible platform routes are tested, the resumed context cannot obtain a supported
browser and invoke a new-stage Site Tool without replacing WebMCP with another mechanism.
A no-go result requires a new ADR before any user-mediated or generic-orchestration fallback
is presented as the selected concept.

## 19. Definition of done

This P0 MVP is complete only when:

- source and tests implement the frozen fixture and contracts;
- one full correlated run passes Q1–Q5;
- evidence distinguishes real Site Tool use from mocks, dynamic tools, REST, and DOM automation;
- the duplicate event produces no second run or write;
- commit remains absent from the Site Tool surface and the tested Agent stops before it;
- the environment and setup are documented for another project team member;
- the five-question verdict and canonical status are updated from runtime evidence.

The reproduction runbook establishes a documented path; it is not evidence that a second
team member or independent judge completed the run.

The controlled P0 meets these requirements through the
[clean-run evidence package](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md),
the [post-fix runbook rehearsal](../../mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md),
and the [reproduction runbook](../../mvp/RUNBOOK.md). An independent public clean-room judge
run on another machine remains a later product and submission gate, not evidence supplied by
this local P0.

## 20. Runtime verdict — 2026-08-30

The frozen target did not change. One reset clean run produced the following result:

| Question | Result | Evidence boundary |
|---|---|---|
| Q1 | **Pass** | The clean `INITIAL` page exposed the exact Stage-A inventory and genuinely returned the trace-matched signed manifest |
| Q2 | **Pass** | Explicit user-authorized Receiver approval created one bounded Grant, kept exact task identity private, delivered the receipt to the same task, and registered only an opaque binding through WebMCP |
| Q3 | **Pass, bounded** | One signed event reached the same bound Desktop task; exact replay returned the same run and created no second run. This is not a crash-recovery or general production exactly-once claim |
| Q4 | **Pass** | The event-opened canonical page read fresh `READY` state, rediscovered the exact Stage-B inventory, and genuinely invoked `continue_artifact` |
| Q5 | **Pass** | The same artifact advanced from revision 1 to 2 and remained uncommitted at the visible, non-Agent-callable human boundary |

The final database has one approved challenge, one active Grant with its one run consumed,
one host binding, one event, one run, artifact revision 2, and `committed=false`. The
redacted 13-record trace contains the complete correlation and no raw task ID, opaque
binding, or bearer. See the [P0 Runtime Probe Log](../Research/02-p0-runtime-probe-log.md),
the [`mvp/evidence` index](../../mvp/evidence/README.md), and the
[clean-run verdict](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md).
