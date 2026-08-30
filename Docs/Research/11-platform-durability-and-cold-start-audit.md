# Platform Durability and Cold-Start Audit

**Role:** SUPPORTING platform research and experiment protocol  
**Status:** Active; H2a passed; first D4 no-event attempt was inconclusive due to a repaired
harness control bug; valid D4 and stronger availability tiers remain unverified  
**Observed:** 2026-08-30  
**Scope:** Scheduled same-task context, Browser and Site Tool reacquisition, process and
device availability, and the exact claim boundary after H0b, H1, H2a, and the first D4 attempt

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

The first formal D4 no-event attempt did cross a normal full-app quit, but it did not complete a
valid restart arm. An unrelated long-lived P0 relay survived as a detached workload; the harness
incorrectly treated every old operating-system descendant as Desktop lifecycle state, so its
external helper never requested relaunch. The operator's later manual reopen was recovery only.
The event arm did not run, and no Site Tool or workflow effect occurred. The corrected classifier,
run-wide contamination latch, and fail-closed automation-history scanner are locally
regression-tested, but full Desktop continuity remains unverified until a fresh arm proves the
automatic helper relaunch and scheduled re-entry.

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
| D3 | Parent tool-host process restarted | **UNTESTED; DIAGNOSTIC AFTER A VALID D4 FAILURE** | Would localize whether task-host replacement is the failing layer without crossing a full app restart |
| D4 | Desktop app quit and relaunched while an independent Receiver remains available | **INCONCLUSIVE ATTEMPT; VALID ARM NOT COMPLETED** | Normal quit was observed, but an over-broad lifecycle control blocked helper relaunch; the repaired harness still must prove task, schedule, receipt, Browser, permissions, and Site Tool reacquisition; Receiver restart is out of scope |
| D5 | Machine sleep or network offline across a due time | **UNTESTED** | Would test missed-run/catch-up behavior and expiry interaction |
| D6 | Desktop client update between enrollment and event | **UNTESTED** | Would test compatibility and feature-rollout drift |
| D7 | Clean machine or another eligible account/workspace | **UNTESTED** | Required for a portability or judge-reproducibility claim |

Evidence for D2 is preserved in the
[H2a verdict](../../mvp/evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md).
The orthogonal D2b context-isolation result is preserved in
[Research 14](14-clean-context-webmcp-portability-smoke.md). It verifies C1 only in the same
installed environment and is not evidence for app, account, workspace, or machine restart
durability.
The first D4 attempt and its zero-effect boundary are preserved in the
[redacted inconclusive verdict](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md).

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
3. Persist one authenticated event under the availability condition owned by the tier. For
   D4, keep the Receiver available and accept the event while Desktop is closed; do not mix
   the app-restart test with Receiver unavailability. A separately repeated Receiver restart
   must occur only after acceptance, without resetting its database, and is auxiliary H1
   evidence rather than a D4 pass requirement.
4. Run one event case. It must read the genuine Inbox event, open the allowlisted canonical
   page, read fresh authoritative state, rediscover current Host Site Tools, produce one
   idempotent effect, stop before the human consequence, and genuinely acknowledge the
   delivery.
5. Replay the event and run one final no-event check. Counts and artifact revision must
   remain unchanged.
6. Pause the schedule immediately after the bounded run and scan the evidence package for
   secrets and managed-context identifiers.

### D4 — Desktop restart with an independent Receiver

This is a Desktop-lifecycle test with an independent Receiver, not a Receiver-restart test. The
Receiver must remain available, outside the ChatGPT process tree, and responsible for retaining
the bounded receipt and any accepted event while Desktop is closed. H1/H2 cover Receiver restart
and crash-recoverable enrollment separately.

Before quitting the app, ensure all project changes and redacted evidence are persisted,
all unrelated automations remain paused, no unrelated P0 relay is running, and no other Agent
task is running. Quit and
relaunch the Desktop app through the normal application lifecycle. Pass only if the same
test task and one-run schedule survive, the receipt remains available from managed context,
and fresh Browser/WebMCP is reacquired without a prompt containing the receipt, URL, or tool
name.

An app restart is operationally disruptive and can interrupt the observing task. Execute it
only with an external durable observer that proves it is outside the ChatGPT process tree and
records the old app process ending, a new app process starting, Receiver state, schedule
times, and Host effect counts. A separate fail-closed evidence scanner must compare the candidate
public derivative with private receipt, task, runtime identifier, delivery ticket, effect receipt,
secret, and path values while reporting only counts and booleans. It must also validate every
retained automation observation and a still-present current automation row against the frozen
contract. Keep that paused row present until the scan completes.

Run one paired H2b experiment on the same fresh receipt and disposable task:

1. **No-event arm:** quit normally, prove the old semantic Desktop lifecycle processes ended,
   relaunch without manually opening the task, and place the one-shot due opportunity after
   relaunch. In exactly one successful dispatch, the same task must reconstruct Browser
   and WebMCP, invoke the genuine Inbox reader, receive `pending: false`, and stop without
   opening the Host or changing any count or revision.
2. **Event arm:** quit normally again, persist exactly one authenticated event while Desktop
   is closed, relaunch without manually opening the task, and again place one one-shot due
   opportunity after relaunch. The same task must read the event through the genuine Inbox
   Site Tool, open the allowlisted canonical Host, read fresh authority, rediscover the
   current stage tools, produce exactly one idempotent effect, acknowledge it, and stop
   before human commit. Exact replay and one final no-event turn must add no effect.

Use an explicit future one-shot heartbeat for every D4 turn:

```text
DTSTART:YYYYMMDDTHHMMSSZ
RRULE:FREQ=MINUTELY;INTERVAL=1;COUNT=1
```

On observed Desktop `26.825.41651` build `7345`, this produces a persisted exact
`next_run_at`, avoids interval-boundary ambiguity, and exhausts after one successful dispatch.
Place `DTSTART` at least five minutes after activation and require observer-proven replacement-app
startup at least two minutes before it. If the due time occurs while Desktop is closed, classify
the arm as `INCONCLUSIVE` because the current build can dispatch overdue work after relaunch. This
is empirical current-build behavior, not a public scheduler contract. The executable operator
procedure is the [D4/H2b runbook](../../mvp/D4_H2B_RUNBOOK.md).

If the current build retries a `COUNT=1` heartbeat because the task is busy or renderer-ineligible,
that arm is `INCONCLUSIVE`. Do not aggregate retry opportunities into a pass. Pause, correct the
precondition, and re-arm a new one-shot. Also reject a no-event arm whose due time leaves less than
18 minutes of Grant lifetime or an event arm that leaves less than 8 minutes; expiry must not be
allowed to masquerade as restart failure.

The first formal no-event attempt on 2026-08-30 is `INCONCLUSIVE`, not a D4 failure. The observer
recorded zero Desktop main and current-tree processes after normal quit, but a detached P0 relay
retained its baseline PID and start time. Both observer and helper had modelled that unrelated
workload as Desktop lifecycle state, so the helper timed out and issued no relaunch. The observer
also latched a temporary prompt-contract violation, although the eventual heartbeat envelope
matched the original pinned prompt. Three controller pause updates reported success while the
persisted one-shot remained active. After the Receiver was stopped, the delayed target turn failed
closed on an unavailable Inbox, invoked no Site Tool, changed no workflow state, and explicitly
deleted its automation without prompt instruction. The repaired protocol therefore uses one shared
semantic process classifier, continuously latches the unrelated P0 relay as contamination,
verifies persisted scheduler state rather than API success, tells the target not to create,
update, pause, or delete automations, and preserves the paused row through evidence scanning. The
hardened scanner correctly refuses to certify this historical attempt because its retained
observations contain contract drift and its current row is absent. A fresh disposable target
and one-shot are required; this attempt cannot be retried into a pass.

Current-build inspection establishes a usable attempt control: the scheduler persists
`last_run_at` immediately before dispatch, while renderer/thread blocking only reschedules
`next_run_at`. The external observer must count distinct post-arm `last_run_at` transitions and
reschedules with unchanged `last_run_at`. Because the attempt marker precedes task resume and
`startTurn`, it must also read the private target rollout and count only new strict heartbeat
`response_item` envelopes whose automation ID, prompt, and turn context match. A valid closed arm
has exactly one dispatch attempt, zero retry reschedules, exactly one accepted heartbeat turn, and
`next_run_at = NULL`. The attempt must occur at or after the one-shot due time. The observer must
also latch any error, polling gap, initial or temporary automation-contract violation, other active
automation, frozen target-rollout mapping violation, Receiver outage, Receiver process replacement,
or Receiver ownership change and make the arm `INCONCLUSIVE`. Its first `ACTIVE` observation must be prompt relative to the scheduler
update so a monitoring gap cannot erase a dirty activation. Treat this composite as build-specific
empirical evidence, not a published contract or cryptographic provenance; the rollout does not
persist a `scheduled` versus `run_now` discriminator, so the controlled protocol must prohibit
manual Run Now and preserve an operator attestation for that procedural control.

The hardened scanner validates every retained observer snapshot, the explicitly supplied expected
count of fully closed pass-candidate arms, and a still-present current automation row. The final
D4 package expects three arms: no-event restart, event restart, and the final no-event control. The
observer JSONL is not signed or hash-chained, and polling cannot rule out a
mutation that is both introduced and restored entirely between successful polls. This is adequate
only as a bounded current-build experiment control, not an immutable scheduler mutation ledger.

The same build's Computer Use safety boundary refuses the host app bundle `com.openai.codex`.
Therefore the test operator must perform the two normal `Cmd-Q` actions. The external launchd-owned
helper remains responsible for relaunching through LaunchServices without a task or URL argument.
AppleScript, signals, force quit, or lower-level termination are not acceptable substitutes. This
helper must require `launchd` as its direct parent and fail closed unless the automation TOML and
read-only SQLite schedule state match at startup and immediately before relaunch. The manual quit
is an experiment-control limitation, not evidence for or against the re-entry mechanism.

Process closure is defined semantically, not by recursive operating-system ancestry. The observer
and helper must track the Desktop main process, Electron framework helpers, and the core Codex
app-server/control processes by PID plus start time. Only explicitly reviewed bundled workload
signatures are excluded; unknown ChatGPT-bundle processes fail closed. Any surviving old core
app-server, Electron helper, or late control host still fails closed. Observer and helper reject
the known P0 Desktop relay at preflight and sticky-latch any later appearance so unrelated prior
infrastructure cannot contaminate a formal arm. Baseline and replacement readiness also require
exactly one Desktop main process and one core app-server; any duplicate is sticky-latched, and the
helper independently rechecks the replacement identity and both counts before accepting readiness.

Both arms fail if the prompt restates the receipt, Inbox URL, or tool name; a stale handle,
private relay, REST, DOM automation, or generic MCP substitutes for genuine page-bound Site
Tools; the target task is manually opened; a confirmation requires unattended human repair;
or the redacted evidence cannot prove a new Desktop process. A pass is current-build,
same-machine compatibility evidence only.

If the independently supervised Receiver exits, loses its isolated state, or is unavailable
during an arm, classify the arm as `INCONCLUSIVE` or a setup/topology violation and rerun it with
the Receiver boundary restored. Do not treat that mixed failure as evidence about Desktop restart
continuity.

Do not keep Desktop closed across a due opportunity in this D4 experiment. That would mix
restart recovery with the distinct D5 missed-run and catch-up question. If D4 passes, a
separate D3 primary run adds little because the stronger restart already crossed task-host
replacement. If a valid D4 arm fails and the layer is ambiguous, use D3 only as a diagnostic split.

### D3 — parent tool-host restart diagnostic

After a valid D4 arm fails, terminate only the exact test-owned parent tool-host process after
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
