# D4 — Desktop Restart with an Independent Receiver (H2b)

**Role:** Preserved optional compatibility experiment runbook  
**Status:** Frozen after the first formal no-event arm was `INCONCLUSIVE`; not the current
architecture gate  
**Activation rule:** Rerun only if an accepted local connector or relaunch topology makes
same-machine Desktop restart recovery material

> This protocol and its repaired harness remain valuable evidence assets. The current
> build failed both standalone App Server Browser/WebMCP join variants: the cold thread had no
> Desktop in-app Browser session, and exact warm resume returned an active-writer rejection for
> the supplied task. The warm public JSON does not independently prove writer ownership or priming.
> App selection is the current gate. A published Workspace Agent is only a conditional hosted
> topology probe when entitlement and selected-app requirements justify it. Scheduled Heartbeat
> remains a bounded fallback experiment, not the core mechanism or a production transport.
> Preserve this runbook without treating its uncompleted arms as required current work.

## Purpose

This runbook tests one narrow, app-neutral claim: while an independently supervised Receiver
remains available and, for the event arm, retains one bounded event, a normal Codex Desktop quit
and relaunch can resume the same bound task, reacquire a fresh Browser/WebMCP surface, and stop
at the human boundary. The Receiver is intentionally not restarted during D4.

D4 restarts the Codex Desktop application and its semantic lifecycle processes only. These are the
main process, Electron framework helpers, and Codex app-server/control processes, not every
operating-system descendant ever launched by a task. It does not
test Receiver restart or crash recovery, execution while Desktop is closed, missed-run catch-up,
machine restart, sleep/offline behavior, another account or workspace, public platform support,
or production availability. Receiver durability is covered by H1/H2; missed-run behavior is a
separate D5 question.

The paired experiment uses one fresh disposable task, one fresh receipt, one isolated Receiver
database, and two normal app restart cycles. The no-event arm must stop at the Receiver Inbox
without opening the Host. The event arm must accept exactly one authenticated event while the
Receiver remains available and Desktop is closed, then create one Host effect, acknowledge it,
and stop before `COMMIT_ARTIFACT`.

## Topology and lifecycle contract

- The Receiver, observer, and relaunch helper are independently supervised by `launchd` and run
  outside the ChatGPT process tree.
- Observer and helper share one semantic lifecycle classifier. A surviving old app-server,
  Electron helper, or control host blocks closure; detached Node, shell, relay, and tool workloads
  do not become Desktop lifecycle processes merely because they were once descendants.
- Only explicitly reviewed bundled workload signatures are excluded from lifecycle ownership.
  Unknown ChatGPT-bundle executables fail closed. Observer and helper continuously check and
  sticky-latch the known P0 relay as experiment contamination.
- Baseline and replacement readiness each require exactly one Desktop main process and exactly
  one core app-server. Any duplicate main or core app-server is sticky-latched and invalidates
  the arm even if the extra process later disappears.
- The Receiver remains running and owns the isolated durable state throughout both arms.
- Only the Codex Desktop application is quit and relaunched; the target task is not manually
  opened after relaunch.
- A D4 pass therefore means current-build, same-machine Desktop-lifecycle compatibility with an
  independent Receiver. It does not establish a public Receiver-to-Codex API or a production
  deployment contract.

## Current-build scheduling rule

The observed Desktop build accepts an RFC 5545 one-shot heartbeat in this form:

```text
DTSTART:YYYYMMDDTHHMMSSZ
RRULE:FREQ=MINUTELY;INTERVAL=1;COUNT=1
```

Choose a UTC `DTSTART` at least five minutes after activation. Activate only through the Codex
automation API, then verify the persisted scheduler row has the exact `next_run_at`. Desktop must
be relaunched and observer-proven ready at least two minutes before that instant. If the due time
passes while Desktop is closed, classify the arm as `INCONCLUSIVE`; a relaunch catch-up would mix
D4 with D5.

`COUNT=1` bounds a successful dispatch, but it can be retried by the current build when the target
is busy or renderer-ineligible. Any retry makes that arm `INCONCLUSIVE`; do not combine retry
opportunities into a pass. Keep the target idle, pause immediately after completion, verify
`status = PAUSED` plus `next_run_at = NULL`, correct the precondition, and use a newly armed
one-shot for a fresh attempt.

On this build, `last_run_at` changes immediately before a heartbeat dispatch attempt, while a
renderer/thread block only moves `next_run_at`. The external observer records both transitions.
Because that write precedes task resume and `startTurn`, the observer also reads the private target
rollout and counts only new strict heartbeat `response_item` envelopes whose automation ID, prompt,
and turn context match. Every closed arm must report exactly one dispatch attempt, zero retry
reschedules, a dispatch at or after the one-shot due time, exactly one accepted heartbeat turn, and
a cleared `next_run_at`. It must also report zero observer errors or polling gaps, zero automation
contract or frozen target-rollout source violations, and uninterrupted ownership by the original
Receiver process. The first
observed `ACTIVE` snapshot must occur within the observer polling threshold of the scheduler
update; any initially invalid or later-restored state remains latched and makes the arm
`INCONCLUSIVE`. This composite proof is an empirical current-build control, not a public scheduler
contract or cryptographic provenance.

These scheduling details are empirical behavior of Desktop `26.825.41651` build `7345`, not a
published platform guarantee.

## Preconditions

- Start from a committed, synchronized project baseline and a clean bounded test change.
- Run `npm test`.
- Use a new 8-48 character lowercase run ID and an unused non-reserved loopback port.
- Use a new disposable Desktop task. Store the private receipt there once; never put it in the
  heartbeat prompt, repository, public evidence, or operator chat output.
- Keep every unrelated automation paused and every unrelated Agent task idle.
- Stop the unrelated P0 `codex-app-tools-relay` before observer or helper startup. Both preflights
  reject it explicitly, and both components continue checking and latching it throughout the run,
  so prior experiment infrastructure cannot contaminate D4.
- Do not use the automation's manual **Run now** control before or during an arm. The current
  rollout record has no persisted discriminator between scheduled and manual dispatch, so any
  manual run invalidates the experiment even when its timestamp is after the one-shot due time.
  Record an operator attestation after every scheduled D4 turn, including the final no-event
  control, that **Run now** was not used.
- Close prior Inbox and Host Browser documents. Keep a non-target task foregrounded before quit.
- Keep the Receiver, observer, and relaunch helpers owned directly by `launchd`, outside the
  ChatGPT process tree.
- Keep all `mvp/var/d4-h2b/` artifacts private and preserved after the run.
- Require the no-event due time to leave at least 18 minutes of Grant lifetime and the event-arm
  due time to leave at least 8 minutes. Rebuild the fixture instead of testing near expiry.
- On the observed build, Computer Use refuses the host bundle `com.openai.codex` as a safety-denied
  target. The operator must therefore press normal `Cmd-Q` for each arm. Do not substitute
  AppleScript, a signal, force quit, or process termination. Do not manually relaunch the app;
  the external helper owns the no-target LaunchServices relaunch.

## Prepare the paused heartbeat

Create one heartbeat through the Codex automation API and target only the fresh disposable D4
task. Keep it `PAUSED` until an arm is explicitly ready. Do not edit its TOML or SQLite row
directly. Keep the automation ID, target task identity, fixed prompt, TOML path, and database path
private. Fixture preparation freezes the original raw prompt, target task, and target rollout in a
mode-`0600` ignored private contract file. The observer pins its digests, and the derivative scanner
uses the frozen raw values plus every retained automation observation and the live current row.
Keep the paused automation row present and unchanged until the evidence scan completes.

The fixed prompt must be trigger-only: it may tell the target to process the D4 heartbeat from the
validated bounded receipt already stored in that task, but it must not contain an absolute URL,
workflow ID, event or Grant ID, Inbox bearer, routing or authority receipt field name or value,
opaque binding, or Site Tool name. The restricted receipt fields are `receiver_inbox_url`,
`canonical_url`, `workflow_id`, and `authorized_event_type`, plus their exact values. The observer
binds each accepted scheduler envelope to the exact private automation ID, fixed prompt, target
rollout, and turn context. Changing the prompt or target after the observer starts invalidates the
experiment. The prompt must also state that the target must not create, update, pause, or delete
automations; automation lifecycle remains owned by the external controller.

## Prepare the isolated fixture

From `mvp/`, set the required environment using a new run ID, an unused port, and the paused
automation TOML path:

```sh
export WEBMCP_D4_RUN_ID='replace-with-new-lowercase-run-id'
export WEBMCP_D4_PORT='replace-with-unused-port'
export WEBMCP_D4_AUTOMATION_FILE='replace-with-private-paused-automation-toml'
```

Then run:

```sh
npm run prepare:d4:launchd
launchctl bootstrap gui/$(id -u) 'replace-with-private-receiver-plist'
# Wait until launchd reports the Receiver running and it exclusively owns the configured port.
npm run setup:d4
npm run inspect:d4
launchctl bootstrap gui/$(id -u) 'replace-with-private-observer-plist'
```

The setup must show Stage A, artifact revision 1, `committed: false`, one active Grant and Inbox,
and zero events, runs, deliveries, and effects. The observer must prove:

- its parent is `launchd`, with no ChatGPT ancestor;
- the exact Receiver service exclusively owns the configured port and has no ChatGPT ancestor;
- the automation is paused, is a heartbeat, has no other active automation, and has zero forbidden
  prompt fields;
- its prompt and target are represented only by digests; and
- the current app version, main process identity set, Receiver state, and scheduler state are
  recorded in append-only private JSONL.

## No-event restart arm

1. Store the private bounded receipt in the disposable target task and require a receipt-only
   acknowledgement. Do not open Browser or invoke any Site Tool during setup.
2. Activate a future one-shot heartbeat and verify its persisted `next_run_at`.
3. Bootstrap the no-event relaunch helper. It must prove `launchd` is its direct parent, require
   the automation TOML and read-only SQLite schedule state to match, and fail unless the due time
   is at least four minutes away.
4. The operator presses normal `Cmd-Q`. Record this as a human-operated lifecycle action; do not
   claim it was performed by Computer Use.
5. The external observer must prove every tracked old semantic lifecycle identity is absent and no
   current lifecycle process remains. The helper then uses LaunchServices to relaunch ChatGPT
   without a task or URL argument.
   If no automatic relaunch occurs within 130 seconds of `Cmd-Q`, manually reopen the app only as
   recovery and classify the arm as `INCONCLUSIVE`; do not continue that arm.
6. The observer must prove exactly one replacement main process and exactly one core app-server
   at least two minutes before `next_run_at`; the helper independently rechecks both counts and
   the replacement main identity before accepting readiness.
7. Do not manually open the target task. Require one scheduled turn to rediscover the fresh Inbox
   Site Tool, return `pending: false`, avoid the Host, and make no state change.
8. Pause the heartbeat and verify `next_run_at = NULL`.

The helper proves only that LaunchServices received no task or URL argument. Record a separate
operator attestation that nobody manually opened or navigated to the target task during the arm;
do not describe this procedural control as machine-observed UI evidence.

## Event restart arm

1. Re-arm the same heartbeat with a new future one-shot `DTSTART`.
2. Bootstrap the event relaunch helper, then have the operator press normal `Cmd-Q` again.
3. Only after the observer proves every old semantic lifecycle identity absent, the external helper
   accepts exactly one authenticated event while the Receiver remains available. It must prove one
   pending event, run, and delivery, with zero effects and artifact revision 1.
4. The helper relaunches ChatGPT through LaunchServices with no target task or URL argument.
5. The scheduled target task must use genuine page-bound Inbox and Host Site Tools, read fresh
   authority, continue once, acknowledge once, and stop before `COMMIT_ARTIFACT`.
6. Require exactly one effect, artifact revision 2, a completed delivery, and no human commit.
7. Pause the heartbeat and verify `next_run_at = NULL`.

## Replay and final no-event control

- Replay the exact authenticated event while the heartbeat is paused. Suppress private output and
  require no new event, run, delivery, effect, or artifact revision.
- Arm one final future one-shot without another restart. Require `pending: false`, no Host open, and
  no state change. Pause it again.

## Evidence and cleanup

Preserve the private database, receipt, secrets, frozen automation contract, runtime trace,
observer log, relaunch-helper logs, and scheduler snapshots. Preserve a no-manual-**Run now**
attestation for every scheduled D4 turn, including the final no-event control. For each restart
arm, also preserve an attestation that nobody manually opened or navigated to the target task.
Keep the paused automation row present until the scanner completes. Publish only a redacted
derivative containing those attestations, process lifecycle times, digests, one-shot due/run times,
Site Tool provenance, state/count transitions, replay outcome, tests, and a `PASS`, `FAIL`, or
`INCONCLUSIVE` verdict. Label both attestations as operator-reported rather than machine-observed.

Scan the derivative against every private secret, raw task identity, full Inbox URL, standalone
Inbox bearer, opaque binding, Grant/event/run identifier, delivery ticket, effect receipt, and
private path. After capture, unload only the exact experiment-owned `launchd` labels. Do not delete
the private runtime evidence.

Run the fail-closed scanner with the private run, automation database, automation ID, and candidate
derivative supplied only through the command environment:

```sh
export WEBMCP_D4_RUN_ID='replace-with-the-same-private-run-id'
export WEBMCP_D4_AUTOMATION_DATABASE='replace-with-private-automation-sqlite'
export WEBMCP_D4_AUTOMATION_ID='replace-with-private-automation-id'
export WEBMCP_D4_EXPECTED_ARM_COUNT='3'
export WEBMCP_D4_DERIVATIVE='replace-with-repository-public-evidence-candidate'
npm run scan:d4:evidence
```

Require `safe: true`, zero exact forbidden matches, zero pattern hits, a present current automation
row, and a valid complete observation history containing exactly the supplied number of fully
closed pass-candidate arms. Use `3` for the final package: no-event restart, event restart, and the
final no-event control. The scanner reports only counts and booleans; it
never prints a matched private value. The isolated numeric loopback port is non-authority and may
appear in the derivative, but every complete private URL containing it must remain redacted. Any
recorded contract drift, observer error, polling gap, missing current row, or incomplete arm fails
closed. An explicit target-side deletion trace can explain why a row disappeared, but it cannot
restore scanner certification.
