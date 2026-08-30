# H1 Event-Gated Scheduled Re-entry Verdict

**Observed:** 2026-08-30  
**Environment:** ChatGPT Desktop `26.825.41651` build `7345`  
**Verdict:** **PASS**  
**Scope:** Same-task scheduled pull, durable authenticated event gate, fresh genuine WebMCP
continuation, Host effect idempotency, and Receiver acknowledgement

## Result

H1 passed the bounded local runtime proposition. A trigger-only Scheduled Task recovered a
previously stored Receiver Inbox receipt from the same existing task. With no accepted event,
it opened only a fresh Receiver Inbox document, invoked the genuine page-bound
`get_pending_reentry_event` Site Tool, received `pending: false`, and stopped without opening
the Host page or changing any state.

One authenticated business event was then accepted into a durable pending delivery. The
Receiver process was stopped and restarted without resetting its database. The same single
event, run, and delivery remained pending. A later scheduled turn opened a fresh Inbox page,
received the pending event and a bounded ticket through the genuine Site Tool, opened the
ticket's canonical Host page in a fresh Browser document, freshly discovered
`get_workflow_context` and `continue_artifact`, and created one Host effect. The artifact
advanced from revision 1 to revision 2 and remained uncommitted before `COMMIT_ARTIFACT`.

The first positive turn deliberately omitted Receiver acknowledgement. The event, run, and
delivery therefore remained pending while the Host effect persisted. A second scheduled turn
received the same logical delivery with a fresh ticket and replayed exactly the same semantic
Host request. The Host returned the existing effect without applying it again; the artifact
remained at revision 2. The turn then invoked the genuine Inbox
`acknowledge_reentry_effect` Site Tool, completing the event, run, and delivery.

Exact authenticated event replay returned the existing completed delivery and created no
second event, run, delivery, Host effect, or artifact revision. One final scheduled turn again
received `pending: false` and did not open the Host page. The automation was paused and no
later stray turn was observed.

The task remained idle and the automation remained paused through `14:15:26Z`, more than five
one-minute intervals after the final scheduled turn. The isolated H1 service was then stopped
without resetting its retained database or trace.

## Acceptance matrix

| Gate | Result | Runtime evidence |
|---|---|---|
| Trigger-only prior-context recovery | **PASS** | Scheduled prompts supplied none of the stored receipt fields |
| No-event gate | **PASS** | Fresh Inbox Site Tool returned `pending: false`; Host was not opened; all effect counts stayed zero |
| Durable accepted event | **PASS** | One pending event, run, and delivery survived Receiver process restart |
| Genuine WebMCP continuation | **PASS** | Fresh Inbox and Host documents exposed and invoked only their current page-bound Site Tools |
| Human boundary | **PASS** | Artifact reached revision 2; `committed=false`; `COMMIT_ARTIFACT` was not invoked |
| Acknowledgement-loss recovery | **PASS** | One unacknowledged Host effect persisted; exact retry did not create a second revision |
| Receiver acknowledgement | **PASS** | Genuine Inbox acknowledgement completed the event, run, and delivery |
| Exact event replay | **PASS** | Final counts remained one event, one run, one delivery, and one Host effect |
| No substitute Agent path | **PASS** | Scheduled turns used no REST state path, DOM state extraction, Computer Use, generic MCP substitute, private relay, or fixture adapter |
| Cleanup | **PASS** | Automation ended `PAUSED`; the bounded evidence record contains no receipt bearer, task identity, ticket, effect receipt, binding, or secret |

## Bounded claim

> On the tested current Desktop build, a scheduled turn in the same existing Agent context
> polled a durable accepted-event gate and conditionally produced one idempotent continuation
> through freshly discovered genuine WebMCP Site Tools. Receiver restart, exact event replay,
> and one deliberately omitted acknowledgement did not create a second Host effect.

The schedule was the wake source; the accepted event was the authorization gate. H1 does not
prove direct business-event wake, a documented public Browser contract, production topology,
crash-safe enrollment, app/device/offline durability, cross-user security, polling economics,
or product value. Its setup used a synthetic operator-injected receipt after enrollment; the
approval-to-Inbox receipt handoff remains a known availability and recovery gap.

The structured redacted record is
[`h1-event-gated-scheduled-reentry-2026-08-30.json`](h1-event-gated-scheduled-reentry-2026-08-30.json).
