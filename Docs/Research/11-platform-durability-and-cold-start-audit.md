# Platform Durability and Cold-Start Audit

**Role:** SUPPORTING platform research and experiment protocol  
**Status:** Active; H2a passed, stronger restart and availability tiers remain unverified  
**Observed:** 2026-08-30  
**Scope:** Scheduled same-task context, Browser and Site Tool reacquisition, process and
device availability, and the exact claim boundary after H0b, H1, and H2a

## Executive judgment

The tested Desktop build no longer appears to require one persistent task-scoped JavaScript
or Browser kernel. H2a terminated that kernel, and a later trigger-only Scheduled Task
started a new one, completed the Browser runtime's mandatory documentation preflight,
opened a fresh Receiver page, discovered current page-bound Site Tools, and genuinely read
the no-event gate.

That is a useful cold-start result, but it is not a full durability result. The Desktop app
and its parent tool service remained alive. The current evidence therefore supports
**task-tool-runtime reconstruction**, not Desktop restart, machine restart, sleep, offline
catch-up, client update, another account or workspace, or clean-room portability.

The correct next claim is narrow:

> On the tested current Desktop build, a later scheduled turn in the same task can recover
> bounded prior context and reconstruct a fresh Browser/WebMCP runtime after loss of the
> task-scoped Node kernel, provided the app and required local services remain available.

## 1. Official capability boundary

The official documentation establishes several useful facts, but does not publish the
durability contract this concept would need for production:

- A Scheduled Task created in a chat returns to that same chat with its existing context.
  A Desktop task that needs local files requires the computer to remain on and the app to
  remain running. See [Scheduled tasks](https://learn.chatgpt.com/docs/automations).
- Generic custom business-event triggers are not a Desktop capability. The documented
  event-triggered task surface is limited to supported Gmail, Slack, and GitHub events on
  web and mobile. The current H1 design therefore correctly treats the schedule as the wake
  and the Receiver Inbox event as the authorization gate, not as a native Desktop event
  trigger. See [Scheduled tasks](https://learn.chatgpt.com/docs/automations).
- The built-in Browser has a profile separate from the user's normal browser and does not
  automatically inherit ordinary tabs or login sessions. See
  [Browser](https://learn.chatgpt.com/docs/browser).
- Site Tools belong to the page that registers them. Closing or navigating away can make
  them unavailable, and normal website-access and confirmation policies still apply. Tool
  availability also depends on the current page, rollout, model, workspace, and client.
  See [Site tools](https://learn.chatgpt.com/docs/webmcp).

The documentation does **not** promise:

- an unattended Site Tool inventory after Desktop restart;
- catch-up timing after sleep, network loss, missed schedules, or a powered-off machine;
- a stable Browser session or login after restart or update;
- automatic replay of a turn interrupted by a client update;
- a public API for binding an independent Receiver to an arbitrary existing Desktop task;
- deterministic latency, cost, or confirmation-free execution; or
- portability across accounts, workspaces, models, clients, or machines.

Absence of a published promise is not evidence that the behavior fails. It means each tier
must remain an empirical compatibility result and must not be presented as a platform SLA.

## 2. Current empirical durability ladder

| Tier | Condition | Current result | Exact boundary |
|---|---|---|---|
| D0 | Fresh page inside a controlled active task | **P0 PASS** | Genuine Stage-A and Stage-B Site Tools in one local run |
| D1 | Later Scheduled turn; same Desktop process | **H0B/H1 PASS** | Stored receipt recovered; no-event gate and one event-gated continuation passed |
| D2 | Prior task-scoped Node/Browser kernel terminated | **H2A PASS WITH RECOVERY** | New kernel and Browser runtime completed the mandatory preflight and invoked a genuine no-event Inbox tool |
| D2b | Fresh internal Agent context; same installed environment | **C1 VERIFIED** | App-held traces show two separate contexts completing no-history official and local discovery plus one current-state invocation each; this is not account, workspace, machine, or restart durability |
| D3 | Parent tool-host process restarted | **UNTESTED; DIAGNOSTIC AFTER D4 FAILURE** | Would localize whether task-host replacement is the failing layer without crossing a full app restart |
| D4 | Desktop app quit and relaunched | **UNTESTED; NEXT APP-NEUTRAL KILL TEST** | Would test task, schedule, receipt, Browser, permissions, and Site Tool reacquisition after client restart |
| D5 | Machine sleep or network offline across a due time | **UNTESTED** | Would test missed-run/catch-up behavior and expiry interaction |
| D6 | Desktop client update between enrollment and event | **UNTESTED** | Would test compatibility and feature-rollout drift |
| D7 | Clean machine or another eligible account/workspace | **UNTESTED** | Required for a portability or judge-reproducibility claim |

Evidence for D2 is preserved in the
[H2a verdict](../../mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md).
The orthogonal D2b context-isolation result is preserved in
[Research 14](14-clean-context-webmcp-portability-smoke.md). It verifies C1 only in the same
installed environment and is not evidence for app, account, workspace, or machine restart
durability.

## 3. H2a interpretation

H2a ruled out four hidden prerequisites for the no-event path:

- reuse of the prior task-scoped Node kernel;
- reuse of an old Browser controller;
- reuse of an old tab; and
- reuse of prior JavaScript variables or Site Tool handles.

The probe also exposed a deterministic operational tax. A new Browser runtime must read its
mandatory confirmation and WebMCP documentation before its first governed action. Reading
those documents in one runtime does not initialize another new runtime. A robust scheduled
policy must therefore create one runtime, complete its preflight, and keep that same runtime
for navigation, discovery, and invocation.

This overhead belongs in latency and reliability measurements. It must not be hidden as an
implementation accident or treated as evidence that WebMCP itself was unavailable.

## 4. Local persistence observations

The local audit found durable metadata, but no stronger runtime guarantee:

- the Desktop main process remained continuous across H1 and H2a, confirming that neither
  test crossed a full application restart;
- the Scheduled Task definition, target reference, and timing metadata are persisted on
  disk, but disk persistence alone does not prove that the task, managed receipt context,
  Browser, or Site Tools will reload and run after restart;
- Browser origin-permission metadata is persisted, but this does not persist a tab,
  controller, signed-in page session, or WebMCP handle;
- the current automation prompt contains no bearer receipt, which must remain an invariant;
  raw local Inbox URLs can nevertheless appear in private task/tool history and must be
  treated as capabilities and excluded from public evidence; and
- the audited Mac currently prevents ordinary idle waiting from proving sleep behavior.
  A sleep test is valid only if system power logs confirm an actual sleep and wake interval.

These observations are implementation snapshots, not public platform contracts. Do not
edit local automation databases or configuration files to manufacture a pass.

## 5. Ordered remaining protocol

Each tier must use a separate disposable task, isolated Receiver database, fresh bounded
Grant, and a paused-by-default one-run schedule. Preserve the existing H1 and H2a evidence.
Do not reuse expired receipt capabilities.

### Shared controls

For every tier:

1. Capture a precondition record without raw task identity, Inbox bearer, opaque binding,
   or local socket path.
2. Run a no-event control first. It must open only the Receiver Inbox, invoke the genuine
   pending-event Site Tool, return `pending: false`, and create zero Host effect.
3. Persist one authenticated event while the Receiver is unavailable, then restore the
   Receiver without resetting its database.
4. Run one event case. It must read the genuine Inbox event, open the allowlisted canonical
   page, read fresh authoritative state, rediscover current Host Site Tools, produce one
   idempotent effect, stop before the human consequence, and genuinely acknowledge the
   delivery.
5. Replay the event and run one final no-event check. Counts and artifact revision must
   remain unchanged.
6. Pause the schedule immediately after the bounded run and scan the evidence package for
   secrets and managed-context identifiers.

### D4 — full Desktop restart

Before quitting the app, ensure all project changes and redacted evidence are persisted,
all unrelated automations remain paused, and no other Agent task is running. Quit and
relaunch the Desktop app through the normal application lifecycle. Pass only if the same
test task and one-run schedule survive, the receipt remains available from managed context,
and fresh Browser/WebMCP is reacquired without a prompt containing the receipt, URL, or tool
name.

An app restart is operationally disruptive and can interrupt the observing task. Execute it
only with an external durable observer that records the old app process ending, a new app
process starting, Receiver state, schedule times, Host effect counts, and a redacted secret
scan after relaunch.

Run one paired H2b experiment on the same fresh receipt and disposable task:

1. **No-event arm:** quit normally, prove the old Desktop and owned child processes ended,
   relaunch without manually opening the task, and place the first due opportunity after
   relaunch. Within at most three due opportunities, the same task must reconstruct Browser
   and WebMCP, invoke the genuine Inbox reader, receive `pending: false`, and stop without
   opening the Host or changing any count or revision.
2. **Event arm:** quit normally again, persist exactly one authenticated event while Desktop
   is closed, relaunch without manually opening the task, and again place the first due
   opportunity after relaunch. The same task must read the event through the genuine Inbox
   Site Tool, open the allowlisted canonical Host, read fresh authority, rediscover the
   current stage tools, produce exactly one idempotent effect, acknowledge it, and stop
   before human commit. Exact replay and one final no-event turn must add no effect.

Both arms fail if the prompt restates the receipt, Inbox URL, or tool name; a stale handle,
private relay, REST, DOM automation, or generic MCP substitutes for genuine page-bound Site
Tools; the target task is manually opened; a confirmation requires unattended human repair;
or the redacted evidence cannot prove a new Desktop process. A pass is current-build,
same-machine compatibility evidence only.

Do not keep Desktop closed across a due opportunity in this D4 experiment. That would mix
restart recovery with the distinct D5 missed-run and catch-up question. If D4 passes, a
separate D3 primary run adds little because the stronger restart already crossed task-host
replacement. If D4 fails and the layer is ambiguous, use D3 only as a diagnostic split.

### D3 — parent tool-host restart diagnostic

After a D4 failure, terminate only the exact test-owned parent tool-host process after
enrollment and before a scheduled no-event run. Do not terminate unrelated Desktop or
project processes. Pass only if a later scheduled turn creates a replacement tool runtime
and completes the shared controls without receipt restatement. A D3 pass localizes the D4
failure above the task-host layer; it does not repair or override the D4 result.

### D5 — sleep and offline catch-up

Run sleep and network-loss cases separately. Schedule one due time inside the unavailable
window. Record whether the run is skipped, delayed, coalesced, or replayed after recovery.
Any delayed event must still pass Grant, event, state-version, and expiry checks at execution
time. A run that resumes after its Grant or delivery ticket expires must stop without Host
mutation.

### D6 — client update

Use only a naturally available update; do not downgrade or modify the installed app bundle.
Record old and new client versions, model, workspace type, and current Site Tool availability.
Re-enrollment is an acceptable outcome only if it is explicit and safe. Silent loss of the
Grant or execution against stale tool assumptions is a failure.

### D7 — clean-room portability

Use the public source and documented setup on an independent eligible environment with no
copied local databases, Browser profile, task state, private relay, or hidden secrets. This
tier is required before describing the submission as judge-reproducible. It should follow
app selection and public deployment rather than the current generic fixture.

## 6. Pass, fail, and stop rules

### Tier pass

A tier passes only when both no-event and one-event controls complete with genuine
page-bound WebMCP, one correct effect, no second effect on replay, no secret leakage, and a
redacted durable trace of the exact availability condition.

### Tier fail

A tier fails if it requires receipt restatement, a stored tool name, REST or DOM substitution,
reuse of a stale page handle, a private Desktop relay, a second Host effect, or manual repair
that the test protocol did not authorize.

### Immediate stop

Stop the run and preserve evidence on wrong workflow or account, unauthorized mutation,
secret disclosure, expired authority, unrelated-task interaction, or ambiguous process
ownership. Do not widen process termination or reset state to make the run pass.

## 7. Product and architecture consequence

Scheduled same-task pull remains a valid current-build prototype transport and a useful
comparison baseline. It should not yet be selected as the production transport. The final
application must first define its maximum acceptable event-to-result latency, app/device
availability expectation, user-visible notification behavior, no-op polling cost, and
recovery tolerance.

If D3 or D4 fails, the Grant/event concept is not disproven. The selected deployment needs a
more explicit local connector, hosted Agent runtime, or bounded continuation capsule that
does not depend on opaque Desktop persistence. If D5 fails, schedule polling is unsuitable
for workflows that require reliable or prompt catch-up while the device is unavailable.

## 8. Nonclaims

This audit does not claim a supported OpenAI event webhook, unattended Browser SLA,
background execution while the Desktop app is closed, stable behavior across client updates,
or a production-ready Agent connector. It does not select the final application or transport.
