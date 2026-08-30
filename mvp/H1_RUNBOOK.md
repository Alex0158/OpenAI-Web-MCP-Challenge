# H1 Event-Gated Scheduled Re-entry Experiment Runbook

**Role:** Additive disposable experiment runbook  
**Status:** Implemented, component-tested, and passed one bounded scheduled Desktop acceptance  
**Scope:** Same-task scheduled wake, durable authenticated Receiver event gate, fresh genuine
WebMCP continuation, Host-side idempotent effect, and Receiver acknowledgement

H1 extends the frozen P0 fixture without changing its evidence or claim. It is not a
production deployment guide and does not select the final product, application, transport,
or security architecture.

## 1. Objective

H1 must prove or falsify this bounded proposition in one existing idle Desktop task:

> A scheduled turn can poll a durable Receiver-owned event gate through a genuine
> page-bound Site Tool. With no accepted event it stops before visiting the Host page. With
> one accepted signed event it can survive a Receiver restart, obtain a bounded delivery
> ticket, open the canonical page, invoke one idempotent Host continuation through genuine
> WebMCP, and acknowledge the resulting effect. Repeated delivery reads or acknowledgement
> loss must not create a second Host effect.

The schedule is the wake source. The accepted event is the authorization gate. The Host
page remains the authority for workflow state and the artifact.

## 2. Current implementation status

The following H1 surfaces are implemented and covered by the current deterministic test
suite:

- isolated H1 runtime configuration, database schema, trace, and private runtime secrets;
- authenticated event acceptance that creates one durable `PENDING` heartbeat delivery;
- a Receiver Inbox page with genuine `get_pending_reentry_event` and
  `acknowledge_reentry_effect` Site Tools;
- compact signed delivery tickets and signed Host effect receipts with strict typed fields;
- Host-side checks against the exact accepted event, run, delivery, Grant, binding,
  correlation, workflow state, and artifact revision;
- one atomic Host artifact mutation plus effect-ledger insert;
- semantic retry that returns the original effect receipt without another artifact revision;
- Receiver acknowledgement that requires the exact committed Host effect; and
- exact signed-event replay deduplication and Receiver-process restart persistence.

Deterministic tests are necessary but do not prove the scheduled Desktop Browser path. The
2026-08-30 acceptance run completed the phases below and is preserved in the
[H1 verdict](evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md). A future
environment, client, or implementation change requires a new dated run; it must not inherit
this pass by assumption.

## 3. Exact claim boundary

### Claim allowed only after every acceptance gate passes

> On the tested Desktop build, a scheduled turn in the same existing Agent context polled a
> durable accepted-event gate and conditionally produced one idempotent continuation through
> freshly discovered genuine WebMCP Site Tools. Receiver restart, exact event replay, and one
> deliberately omitted acknowledgement did not create a second Host effect.

### Claims H1 does not make

- The business event directly wakes the Agent.
- Scheduled Browser or Site Tool availability is a stable public OpenAI contract.
- Agent wake, event delivery, or tool invocation is exactly once.
- The experiment is a production topology, production security design, or scalable queue.
- The Host business-state transition and Receiver event submission are one atomic outbox
  transaction. `npm run trigger:h1` performs those two operations sequentially.
- Polling is economical, low-latency, battery-efficient, or suitable for unattended 24/7
  operation.
- The result survives app restart, device sleep, client updates, another account, another
  workspace, or another model unless separately tested.
- H1 proves production enrollment, consent capture, receipt recovery, or end-to-end enrollment
  crash safety.
- Exact-thread history creates more product value than a notification, deep link, or bounded
  continuation capsule.

## 4. Isolated runtime and implemented commands

H1 is opt-in and uses a fixed isolated runtime selected by `scripts/h1-command.mjs`.

| Artifact | H1 location or behavior |
|---|---|
| Server origin | `http://127.0.0.1:4321` |
| Database | `var/h1.sqlite` |
| Mutable trace | `evidence/h1-latest-trace.jsonl` |
| Private runtime secrets | `var/h1-runtime-secrets.json`, created with mode `0600` |
| Delivery mode | `WEBMCP_MVP_DELIVERY=heartbeat` |

The wrapper injects the exact H1 port, database, trace, Receiver client token, delivery-ticket
secret, and effect-receipt secret. The server refuses heartbeat mode if the database or trace
path differs from the exact H1 paths. `reset:h1` resets only the H1 database and mutable H1
trace; it deliberately preserves the private secret file so restart and retry can verify
previously issued receipts.

The only implemented H1 commands are:

| Command | Implemented action |
|---|---|
| `npm run reset:h1` | Reset the isolated H1 database and mutable trace |
| `npm run start:h1` | Start the H1 fixture on the isolated runtime |
| `npm run setup:h1` | Simulate fixture enrollment, bind the Host, prepare Stage A, and print one bounded receipt |
| `npm run trigger:h1` | Transition the fixture to `READY` and submit one signed event to the Receiver |
| `npm run replay:h1` | Replay the last event body with a fresh valid transport timestamp and signature |
| `npm test` | Run the complete P0 and H1 deterministic test suite |

There is no implemented `h1:enroll`, `h1:inspect`, `h1:test`, lease-expiry helper,
attempt-counter helper, or acknowledgement-fault helper. Do not invent or substitute those
commands during acceptance.

## 5. Implemented interfaces and delivery semantics

### Pages and machine event route

| Surface | Responsibility |
|---|---|
| `GET /receiver/inboxes/:opaque_handle` | Receiver-owned page exposing only the two H1 Inbox Site Tools |
| `POST /api/receiver/events` | Authenticated machine-to-Receiver event acceptance; never an Agent state-read substitute |
| `GET /workflows/WF-001` | Canonical Host page and authoritative workflow state |

The Receiver Inbox URL is a bearer capability. It must come from the stored bounded receipt,
must not appear in the scheduled trigger, trace, screenshots, or public evidence, and must not
be reconstructed from a database digest. The pages send `Referrer-Policy: no-referrer`.

### Repeatable `PENDING` read model

`get_pending_reentry_event` does not acquire a lease and does not increment an attempt
counter. It performs a read of the oldest matching `PENDING` delivery:

- with no delivery it returns `pending: false`, the inbox workflow ID, and `checked_at`;
- with a delivery it returns `pending: true`, bounded typed event and delivery metadata, and
  a newly signed short-lived delivery ticket;
- repeated reads before acknowledgement return the same logical event, run, and delivery,
  with a refreshed ticket expiry; and
- the delivery remains `PENDING` until a valid Host effect receipt is acknowledged.

The opaque compact delivery ticket contains exactly `event_id`, `run_id`, `delivery_id`,
`grant_id`, `workflow_id`, `event_type`, `canonical_url`, `state_version`, and `expires_at`.
There is no `ticket_id`, `issued_at`, `attempt`, or `key_id` claim.

### Host effect and acknowledgement

In H1, `continue_artifact` requires `content`, `delivery_ticket`,
`expected_state_version`, and `expected_revision`. Before mutation the Host verifies the
ticket signature and expiry, its exact accepted `PENDING` event/run/delivery rows, its Grant
and Host binding, correlation, canonical URL, event type, workflow state, state version,
artifact revision, and uncommitted human boundary.

The Host writes the new artifact revision and its `workflow_effects` ledger row in one
transaction. The event ID is the effect idempotency identity. A retry with the same semantic
request hash returns the prior signed effect receipt with `idempotent_replay: true`; a retry
with different content conflicts.

`acknowledge_reentry_effect` accepts only the opaque Host effect receipt. The Receiver
verifies its signature, delivery scope, and exact committed `workflow_effects` row before it
atomically marks the delivery, event, and run completed. An exact acknowledgement retry
returns the prior completion with `duplicate: true`.

## 6. Enrollment setup and known limitation

The current acceptance setup is:

```sh
npm run reset:h1
npm run start:h1
```

With the server still running, use another terminal:

```sh
npm run setup:h1
```

`setup:h1` is synthetic test-operator setup. It simulates context capture and approval,
registers the opaque Host binding, prepares the Stage-A artifact, and prints the bounded H1
receipt. An operator must then inject that receipt into the chosen existing idle Desktop task.
The injection is setup, not user-consent evidence.

The Receiver stores only a digest of the opaque Inbox handle. Inbox creation occurs after the
base Grant approval is persisted, and the raw Inbox URL is returned only in the approval/setup
response. If the process or operator loses that response before the receipt is stored in the
task, the current fixture cannot recover the raw URL. Therefore this path explicitly does not
prove enrollment crash recovery or end-to-end receipt-delivery durability.

The stored receipt must contain the Receiver Inbox URL, allowed event type, workflow ID,
canonical Host URL, expiry, and a bounded continuation policy. The scheduled prompt must be a
trigger-only instruction. It must not repeat the workflow ID, Inbox URL, Host URL, Site Tool
names, event ID, expected state, artifact content, or expected result.

## 7. Acceptance preflight

1. Use an existing idle Desktop task containing the current unexpired H1 receipt.
2. Use a current unified ChatGPT Desktop client and a model eligible for Site Tools.
3. Enable Site Tools when the Desktop setting is available.
4. Pause the H1 automation before changing fixture state.
5. Close all old H1 Receiver Inbox and canonical workflow tabs.
6. Run `npm test` and record the exact result.
7. Start from `reset:h1`, `start:h1`, and `setup:h1`; never run the P0 reset.
8. Confirm the initial workflow is Stage A, with no accepted event, delivery, run, or Host
   effect.

Stop if genuine `webmcp` is unavailable. Do not replace it with REST, DOM automation,
Computer Use, generic MCP, App Server dynamic tools, the private P0 relay, or a headless
browser state path.

## 8. Phase A - no-event negative control

1. Confirm there is no H1 event, run, delivery, or Host effect.
2. Close all old H1 Inbox and Host tabs.
3. Enable the one-minute same-task automation with only the stored trigger instruction. Keep
   the total polling window at 10-15 minutes or less.
4. Let one scheduled turn run without manually opening either page.
5. Require the turn to recover the prior receipt, open a fresh built-in Browser document for
   the Receiver Inbox, rediscover its current `webmcp` inventory, and genuinely invoke only
   `get_pending_reentry_event`.
6. Require `pending: false`.
7. Require no canonical Host-page visit, no acknowledgement call, and no change to workflow,
   artifact, event, run, delivery, or effect state.
8. Pause the automation and capture the scheduled time, Site Tool provenance, fresh-tab
   sequence, typed result, and unchanged before/after state.

Phase A fails if the scheduled prompt supplies receipt fields, a stale page supplies tools,
the Host page is visited, any mutation occurs, or a substitute state path is used.

## 9. Phase B - event, restart, manual acknowledgement loss, and retry

Run Phase B under the same enrollment and correlation as Phase A.

1. With automation paused, run `npm run trigger:h1`. This sequentially transitions the Host
   to `READY`, signs and submits one event, and requires a `PENDING_HEARTBEAT` acceptance.
2. Record one `PENDING_HEARTBEAT` event, one `PENDING_HEARTBEAT` run, one `PENDING`
   delivery, zero Host effects, and the unchanged Stage-A artifact revision.
3. Stop and restart `npm run start:h1` without reset. Require the same event, run, and
   delivery identities to remain pending.
4. For the next positive scheduled turn only, store an explicit bounded test instruction in
   the same task: after receiving the Host effect receipt, stop without invoking
   `acknowledge_reentry_effect`. This manual omission is the acknowledgement-loss control;
   there is no server fault switch.
5. Close all old H1 Inbox and Host tabs, resume the trigger-only automation for one turn, and
   require a fresh Receiver Inbox document and genuine `get_pending_reentry_event` call.
6. Require `pending: true` and one signed ticket for the persisted event. Record only a safe
   digest of the ticket.
7. Open the ticket's exact canonical URL in a fresh built-in Browser document, rediscover the
   current Host Site Tools, and require `get_workflow_context` plus H1
   `continue_artifact`, with no Agent-callable commit tool.
8. Read fresh authoritative state, then invoke `continue_artifact` once with the ticket,
   current versions, and one recognizable H1 continuation. Require one Host effect, one new
   artifact revision, a signed effect receipt, and `idempotent_replay: false`.
9. Obey the one-run test instruction: do not acknowledge. Stop the turn, pause the
   automation, and require the delivery, event, and run to remain pending while the one Host
   effect persists.
10. Remove the one-run omission instruction. No lease expiry or state repair is required.
11. Resume the same trigger-only automation for one turn. Require another fresh Receiver
    Inbox read to return the same logical event, run, and delivery with a refreshed valid
    ticket.
12. Open a fresh canonical page, read current state, and call `continue_artifact` with the
    same semantic continuation content. Require the prior effect receipt,
    `idempotent_replay: true`, and no additional artifact revision.
13. Reopen the Receiver Inbox in a fresh document and invoke
    `acknowledge_reentry_effect` with that receipt. Require one transition to `COMPLETED`.
14. Pause the automation immediately and verify no later scheduled turn runs.
15. Require the final Host page to show the continued artifact, `committed=false`, and the
    visible `COMMIT_ARTIFACT` human control. Do not activate it.

## 10. Phase C - exact event replay

1. With delivery completed and automation paused, run `npm run replay:h1`.
2. Require a duplicate response identifying the existing event, run, and logical delivery.
3. Require no new event, run, delivery, Host effect, artifact revision, or scheduled turn.
4. Run `npm test` again and capture a final redacted state snapshot.

The replay helper reuses the exact stored event body with a fresh valid transport timestamp
and signature. Changing the event body or event ID is not an exact replay.

## 11. Genuine WebMCP-only controls

Only the built-in Browser's current page-bound `webmcp` capability counts for Agent actions
in Phases A and B.

- Fetch tools again after every navigation or fresh document creation.
- Require `get_pending_reentry_event` and `acknowledge_reentry_effect` only on the Receiver
  Inbox page.
- Require `get_workflow_context` and `continue_artifact` only on the canonical Host page.
- Treat stale tool handles as invalid even if a client still retains them.
- Treat server-side ticket, accepted-record, Grant, binding, correlation, version, effect,
  and idempotency checks as authority; UI inventory alone is not authority.
- Do not count REST calls, direct SQLite reads, DOM text extraction, browser scripting,
  Computer Use, generic MCP, App Server dynamic tools, the private P0 relay, fixture-adapter
  output, or manual database mutation as Agent proof.
- Operator helpers may perform setup, external event creation, exact replay, and redacted
  inspection. They may not perform the Inbox poll, Host state read, Host continuation, or
  effect acknowledgement for the Agent.
- No tool or event may provide free-form instructions that broaden the stored receipt.

## 12. Evidence and redaction

`evidence/h1-latest-trace.jsonl` is mutable development evidence, not a passing verdict by
itself. A dated acceptance package should contain:

- environment and effective Site Tool capability;
- enrollment mode and only a digest of the bounded receipt;
- schedule activation, observed turn times, pause, and stray-run check;
- Phase A fresh-tab sequence, genuine Inbox Site Tool inventory, `pending: false`, and
  unchanged state;
- signed-event acceptance plus pre-restart and post-restart identities and status;
- first pending read, ticket digest, fresh Host state read, first Host effect, and deliberate
  acknowledgement omission;
- second pending read, repeated Host result, successful acknowledgement, and final completed
  status;
- exact replay result;
- event, run, delivery, Host effect, state-version, artifact-revision, and acknowledgement
  counts before and after each phase;
- final human-boundary capture; and
- exact current test result and a concise H1 verdict.

Never record a raw Desktop task ID, managed-context ID, opaque Inbox handle or URL, full
opaque binding, signing key, secret file content, bearer, raw delivery ticket, ticket
signature, raw effect receipt, native pipe path, secret-bearing environment, or private
temporary path. Hash a ticket or receipt only after canonical encoding and never retain the
unhashed capability in public evidence.

## 13. Pass and fail gates

| Gate | Pass requirement |
|---|---|
| Isolation | H1 uses only its exact database, trace, and private secret file; frozen P0 artifacts remain unchanged |
| Stored plan | Trigger-only scheduled prompt recovers the bounded receipt without repeating routing or action fields |
| No-event control | One genuine Inbox Site Tool call returns `pending: false`; no Host-page visit or mutation occurs |
| Durable acceptance | One authenticated event, run, and delivery survive process restart |
| Event gate | The Host page opens only after a genuine Inbox Site Tool returns one pending ticket |
| Fresh authority | A fresh Host page and freshly discovered Site Tools provide current authoritative state |
| One Host effect | First continuation creates exactly one effect and one artifact revision |
| Ack-loss recovery | Deliberately skipped acknowledgement leaves the delivery pending; semantic retry returns the prior Host effect without another revision |
| Completion | One verified Host effect acknowledgement completes the delivery, event, and run idempotently |
| Exact replay | Exact event-body replay creates no new event, run, delivery, effect, or artifact revision |
| Human boundary | Artifact remains uncommitted and `COMMIT_ARTIFACT` is absent from the Site Tool surface |
| Cleanup | Automation is paused, no stray later turn occurs, and the evidence package is redacted |

Fail H1 if a required Site Tool is missing, the no-event run visits the Host, the accepted
event disappears across restart, an invalid or expired ticket reaches mutation, a retry
changes the artifact twice, acknowledgement succeeds without the exact committed Host effect,
a substitute mechanism is counted, the human commit occurs, the automation remains active,
or public evidence exposes a prohibited value.

Do not add a fallback path to force a pass. Record the failure, pause the automation, preserve
the H1 database and trace, and revise the hypothesis or implementation before a new isolated
run.

## 14. Cleanup and stop procedure

1. Pause the H1 automation first, whether the run passes or fails.
2. Observe at least one scheduled interval and confirm no stray later turn starts.
3. Capture final redacted Receiver and Host state while the H1 service is available.
4. Stop the H1 service without resetting it.
5. Preserve the H1 database, trace, private secret file, and dated evidence required for
   audit. Do not delete or overwrite P0 or H1 evidence.
6. Terminate only experiment-created processes. Do not print or copy runtime secrets.
7. Confirm the P0 database, P0 trace, and frozen evidence hashes remain unchanged.
8. Mark the runtime result `PASS`, `FAIL`, or `INCONCLUSIVE`. Component tests alone cannot
   promote scheduled Desktop behavior to `PASS`.

## 15. Recorded 2026-08-30 result

The bounded acceptance run passed on ChatGPT Desktop `26.825.41651` build `7345`:

- the first scheduled no-event read returned `pending: false` and never opened the Host;
- one authenticated event survived Receiver process restart as one pending delivery;
- the first positive scheduled turn used genuine Inbox and Host Site Tools, created one
  artifact effect, stopped before human commit, and deliberately omitted acknowledgement;
- the recovery turn replayed the exact semantic request, returned the prior effect without
  another revision, and completed acknowledgement through the genuine Inbox Site Tool;
- exact event replay created no second event, run, delivery, effect, or artifact revision;
- the final scheduled read returned `pending: false`; and
- the automation ended paused with one event, one run, one delivery, one Host effect,
  artifact revision 2, and `committed=false`.

See the [redacted verdict](evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md)
and [structured record](evidence/h1-event-gated-scheduled-reentry-2026-08-30.json). This pass
does not change any nonclaim in Section 3 or the enrollment limitation in Section 6.
