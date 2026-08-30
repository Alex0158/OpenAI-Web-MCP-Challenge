# P0 Runtime Probe Log

**Role:** SUPPORTING runtime evidence log  
**Status:** Controlled clean Q1–Q5 P0 run passed; production bridge unresolved  
**Last updated:** 2026-08-30  
**Controls:** [P0 Technical Validation MVP](../Core/07-p0-technical-validation-mvp.md)

## 1. Environment

- Codex CLI and App Server: `0.144.1`.
- Current Desktop process under test: `/Applications/ChatGPT.app`, version `26.825.41651`
  (`CFBundleVersion` `7345`).
- Preserved older-client negative control: `/Applications/Codex.app`, version
  `26.803.41515` (`CFBundleVersion` `6321`), using the same `com.openai.codex` bundle ID.
- Node.js used by the runnable fixture: `v26.5.0`; the contract requires Node.js 24 or newer.
- Browser surface: ChatGPT Desktop built-in Browser with genuine `webmcp` observed. The
  exact account, workspace, permission, or rollout condition was not isolated.
- Controlled canonical page: `http://127.0.0.1:4317/workflows/WF-001`.

## 2. Component fixture

The domain-neutral fixture now implements:

- deterministic `INITIAL` and `READY` states;
- persistent `continuation_note` revisions;
- a signed bounded Re-entry Manifest;
- Receiver-owned consent challenges;
- private managed-context storage and opaque host bindings;
- strict HMAC-signed events with one-run reservation and duplicate suppression;
- state-derived Site Tool definitions;
- a visible human-only `Commit artifact` control;
- a synthetic adapter that is explicitly labelled `synthetic_only`.

Thirty-one component and contract tests pass. They validate relay targeting, compact
long-task identity verification, fail-closed identity parsing, private
context capture, Grant ordering, fresh-page binding, consent controls, strict signed events,
deduplication, state-derived tool inventories, artifact guards, and the human boundary. They
support but do not substitute for the real Browser observations below.

## 3. App Server fresh-process resume probe

### Accepted run

The probe created a real App Server thread, completed a Stage-A marker turn, injected the
Receiver-validated continuation receipt with `thread/inject_items`, closed the first App
Server process, opened a second process, resumed the exact thread, and started a later turn.

The later prompt did not disclose the marker or Grant ID. The resumed Agent returned both
values exactly from prior context. This independently verifies:

- exact stored-thread resume across App Server processes;
- persistence of the Stage-A conversation marker;
- model-visible persistence of the validated continuation receipt;
- instruction continuity from the user's context-carried receipt hypothesis.

Evidence: [`../../mvp/evidence/app-server-resume-probe.json`](../../mvp/evidence/app-server-resume-probe.json).

### Rejected first attempt

The first attempt resumed the exact thread, but its assertion was invalid: `thread/read`
does not surface injected raw items in the returned turn list, and the second prompt leaked
the expected marker and workflow value. That attempt was not accepted as receipt evidence.
The corrected probe requires the later Agent output to recall an unstated Stage-A marker and
unstated Grant ID.

## 4. Signed Receiver event to App Server

A second accepted run joined the real App Server adapter to the implemented Receiver:

1. one private Grant bound the exact App Server thread;
2. the Receiver injected the validated receipt;
3. the host stored only the opaque binding;
4. a valid signed `WORKFLOW_READY` event reserved one run;
5. the adapter opened a fresh App Server process and resumed the exact thread;
6. the Agent recalled the prior marker and exact Grant ID;
7. duplicate delivery returned the same run and the database still contained one run.

This is sufficient current evidence for Q3. It does not expose a Browser contract and cannot
pass Q4.

Evidence: [`../../mvp/evidence/receiver-app-server-event-probe.json`](../../mvp/evidence/receiver-app-server-event-probe.json).

## 5. Browser and WebMCP capability probes

### Older-client negative control

The built-in Browser opened the local page successfully. In both `INITIAL` and `READY`, the
page reported that `document.modelContext` was unavailable. The Browser capability inventory
contained only `pageAssets`; requesting `webmcp` returned:

~~~text
Capability is not available: webmcp
~~~

The same control against OpenAI's official Site Tools documentation page produced the same
error after load and retry. This makes a local registration bug an unlikely explanation.

### Resumed Desktop task control

Codex Desktop's supported task-control surface successfully woke the exact App Server-created
test task. Its first Browser bootstrap used an incorrect plugin-relative path and was rejected
as an environment wiring failure. After supplying the verified plugin-root runtime path, the
resumed task:

- connected to the built-in Browser;
- opened the bound canonical URL;
- observed the `READY` page;
- found only `pageAssets` in the capability inventory;
- found no `webmcp` capability or `continue_artifact` Site Tool;
- performed no artifact mutation.

Evidence: [`../../mvp/evidence/browser-webmcp-capability-probe.json`](../../mvp/evidence/browser-webmcp-capability-probe.json).

### Newer-client official control and local Stage A

After a clean client handoff, the running `/Applications/ChatGPT.app` process exposed
`pageAssets` and `webmcp` on OpenAI's official Site Tools page. The Browser fetched five
page-defined tools from that control page.

The same Browser then opened the clean local `INITIAL` page and fetched exactly four genuine
Stage-A tools: `get_workflow_context`, `prepare_artifact`, `get_reentry_offer`, and
`register_reentry_binding`. Genuine calls to `get_workflow_context` and
`get_reentry_offer` succeeded. The signed manifest ID `rm_TOdhGC8SpeqmvA` matched the
Receiver's `issue_reentry_manifest` trace entry under correlation ID
`corr_bR3M9dxlUCXXnQ`.

This is sufficient independent runtime evidence for Q1. It does not prove consent, the
event-resume join, resumed Stage B, or the complete correlated chain.

Evidence:
[`../../mvp/evidence/browser-webmcp-stage-a-probe-2026-08-30.json`](../../mvp/evidence/browser-webmcp-stage-a-probe-2026-08-30.json).

### Permission, account, and rollout triage

The current failure has more than one possible platform-side cause. OpenAI's
[Site Tools documentation](https://developers.openai.com/codex/webmcp) states that Site
Tools require GPT-5.6 Sol or GPT-5.6 Terra, the latest desktop app, a supported workspace,
and rollout availability. It also documents the user control at
`Settings > Browser > Permissions > Enable site tools`. The
[desktop Site Tools help article](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app)
separately states that account and selected-model support are required.

This run satisfies the documented model condition, but it was executed by the older installed
client. It does not establish whether the newer client's `Enable site tools` permission is
on or whether the current account and workspace are in the rollout. Codex settings could not
be read through the automation surface because the app prevents automation against its own
settings, and no setting was changed.

The clean handoff completed this diagnostic order:

1. The older client exited without deletion.
2. The newer `/Applications/ChatGPT.app` client started and preserved the task.
3. The official control exposed a genuine `webmcp` inventory.
4. The local Stage-A page exposed and invoked genuine Site Tools.

The effective prerequisite now passes. The specific account, workspace, permission, or
rollout condition responsible for availability was not independently isolated and is not
needed for the bounded Q1 verdict.

`Enable full CDP access` is a separate developer-mode browser-control feature. It is not a
WebMCP permission and must not be used as a substitute for genuine Site Tool evidence.

### Version-specific packaged-app observation

Read-only inspection of this installed desktop build shows that its page preload exposes
`document.modelContext` only when the main process returns an effective `webMcp` feature
state of true. The packaged default is false, and the production value is populated through
a rollout experiment before being sent to the main process. This is consistent with the
observed absence of the page API and the official documentation's rollout caveat.

The newer installed unified client contains the documented `Enable site tools` setting and
describes it as permission for ChatGPT to discover and call website Site Tools, including
WebMCP. Its rendered toggle falls back to on when no stored `webMcpEnabled` value exists.
The setting is still shown only when the rollout feature is available. Therefore, "off by
default" applies to the rollout gate in packaged code, not necessarily to the end-user
permission once the feature is available.

This is diagnostic evidence for this build, not a supported configuration contract. The MVP
must not depend on an internal experiment identifier, an undocumented environment override,
or patched application code. Only the documented permission and a naturally eligible
account, workspace, build, and rollout count as genuine evidence.

The bounded client and feature-gate evidence, including the safe clean-handoff procedure, is
maintained in [Site Tools Runtime Availability Audit](03-site-tools-runtime-availability-audit.md).

## 6. Clean correlated acceptance run

After the independent probes and one preserved kill-test run, the fixture was reset and one
clean correlation completed without a rejected enrollment, expired challenge, or manual
Stage-B reconstruction:

1. The clean `INITIAL` page exposed exactly `get_workflow_context`, `prepare_artifact`,
   `get_reentry_offer`, and `register_reentry_binding` through page-bound WebMCP.
2. Genuine calls read state, prepared `continuation_note` revision 1, and returned signed
   manifest `rm_ZGVXl-elc3QTTA` under one correlation.
3. The Receiver privately captured the exact current Desktop task. The user had explicitly
   authorized Browser control for required test actions; that authorization was exercised
   through the Receiver-owned approval UI. The Receiver created one bounded Grant, delivered
   its validated receipt to the same task, and returned no raw task identity to the host.
4. The page registered only the Receiver-issued opaque binding through the genuine Stage-A
   Site Tool. The trace records the registration boolean but not the binding value.
5. One signed `WORKFLOW_READY` event transitioned authoritative state to `READY`, reserved
   one run, and appeared as the event continuation turn in the bound Desktop task.
6. The private current-build bridge opened the exact canonical page in that task. The newly
   claimed tab exposed `webmcp`; fresh discovery returned exactly `get_workflow_context` and
   `continue_artifact`.
7. A genuine state read returned `READY`, state version 2, artifact revision 1, and the exact
   Stage-A content. A genuine `continue_artifact` call advanced the same artifact to revision
   2 and stopped before `COMMIT_ARTIFACT`.
8. The visible page remained uncommitted and showed the human Commit control; no commit Site
   Tool was available.
9. Exact event replay after Stage B returned the prior run and created no second event, run,
   or artifact write.

The final database contains one approved challenge, one active one-run Grant with its run
consumed, one host binding, one consumed context capture, one event, one run, artifact
revision 2, and `committed=false`. The frozen 13-record trace contains no raw task ID,
opaque binding value, or Receiver/relay bearer.

Evidence:
[`p0-correlated-clean-run-2026-08-30-verdict.md`](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md).
The Stage-B screenshot is acceptance-usable. The pre-approval consent screenshot was
visually cropped and is retained only as a diagnostic artifact; Q2 instead rests on the
explicit user authorization, Receiver decision record, database state, same-task receipt,
and genuine binding registration.

### Post-fix independent runbook rehearsal

The first independent rehearsal completed genuine Stage A, Receiver-owned consent, opaque
binding registration, and event reservation, but failed before task dispatch because the
old relay forwarded a `read_thread` response larger than the 64 KiB Receiver-side limit. Its
11-record trace is preserved as a separate diagnostic and is not part of acceptance evidence.

The relay was corrected inside the trusted task-launched boundary. It now requires the
single observed native `thread.id` identity contract, returns a compact redacted result,
forwards no task content, and rejects missing, mismatched, alias-only, conflicting, or
multiple identity payloads. The client cap remained 64 KiB.

A reset post-fix rehearsal then repeated the documented chain: genuine Stage-A Manifest,
Receiver consent and private binding, one authenticated event into the exact task, the
newest event-opened canonical tab, fresh Stage-B discovery and invocation, revision 2 at the
human-only boundary, and exact replay with no second event, run, task dispatch, or artifact
write. The 31-test suite current at the time of that rehearsal passed; the canonical current
suite count is maintained in Core/00.

Evidence:
[`runbook-rehearsal-post-fix-2026-08-30-verdict.md`](../../mvp/evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md).
The preserved failure is documented in
[`runbook-rehearsal-response-size-failure-2026-08-30.md`](../../mvp/evidence/runbook-rehearsal-response-size-failure-2026-08-30.md).

## 7. Current interpretation

| Question | Current result | Meaning |
|---|---|---|
| Q1 | **Pass** | The clean page delivered the trace-matched signed Manifest through genuine Stage-A WebMCP |
| Q2 | **Pass** | Receiver-owned user-authorized approval, private exact-task storage, same-task receipt delivery, and opaque-only host binding completed |
| Q3 | **Pass, bounded** | One authenticated event reached the bound Desktop task; exact replay produced no second run. General crash-recovery exactly-once semantics remain unproven |
| Q4 | **Pass** | The event-opened page read fresh `READY` state, rediscovered the Stage-B-only surface, and genuinely invoked `continue_artifact` |
| Q5 | **Pass** | The same artifact advanced to revision 2 and remained uncommitted at the human-only boundary |

The older environment failure is resolved by the current client and is no longer the active
blocker. The strongest P0 technical-feasibility claim now passes. The supported production
bridge, selected app, deployment, judge reproducibility, and user value remain open.

## 8. Supported-contract gap

Two supported paths currently solve different halves:

- App Server gives an external Receiver exact thread resume but no documented Browser or Site
  Tool surface.
- Codex Desktop task control can wake a task with Browser tooling, but it is an in-app Agent
  tool rather than a documented external Receiver API.

The newer installed App Server `0.151.0-alpha.7.1` does not close this gap. Its generated
version-specific schema has no Browser, Browser attachment, Site Tool, or WebMCP request.
Its `BrowserUseRequirements` and `InAppBrowserRequirements` fields are managed configuration
requirements, not runtime attachment methods. A managed daemon and proxy can expose a
separate App Server transport, but no documented contract attaches that host to an existing
Desktop task's built-in Browser.

The current-build private relay empirically closes this gap for a same-user local P0 run, but
does not convert it into a documented external contract. The final architecture still needs
a supported external join between the Receiver and a Browser-eligible Agent context, or a
Workspace Agent trigger that demonstrably supplies equivalent page-bound Site Tool
continuation.

## 9. Next gates

1. Repeat the documented procedure from a separate team member's clean-room machine and
   preserve setup deltas; the same-machine independent post-fix rehearsal now passes.
2. Test whether a documented external trigger can target a Browser-eligible context with the
   same page-bound Site Tool continuity.
3. Select the demo application through an accepted ADR.
4. Specialize the generic mechanism into one selected-app vertical slice.
5. Build the public, clean-room judge flow only after the bridge and application choices are
   explicit.
