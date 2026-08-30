# Supported Re-entry Transport and Heartbeat Spike

**Role:** SUPPORTING platform-capability research  
**Status:** H0b and bounded H1 passed on the current Desktop build; no production bridge selected  
**Observed:** 2026-08-30  
**Scope:** Receiver-to-Agent transport, same-context continuation, Browser attachment, and
genuine page-bound Site Tool recovery

## Executive judgment

No current public OpenAI contract proves the complete path:

~~~text
custom Receiver event
-> an existing Codex Desktop task
-> built-in Browser re-entry
-> genuine page-bound Site Tools
~~~

Official Scheduled Tasks documentation supports returning to the same chat with existing
context, but it does not promise unattended Browser or Site Tool availability. H0a and H0b
have now supplied current-build empirical evidence for that missing join. H0b used a later
trigger-only scheduled prompt that contained no receipt fields; the existing idle task
recovered a sealed prior receipt, opened its stored canonical URL in a fresh built-in
Browser tab, rediscovered genuine page-bound Site Tools, and invoked the stored read-only
action role. H1 has now also passed once: an authenticated durable Receiver event gate
conditionally produced one idempotent Host effect despite Receiver restart, exact event
replay, and deliberately lost acknowledgement.

This means the three-process connector harness proposed by
[Research 05](05-distributed-topology-and-hard-coupling-risk-review.md) is a valid fallback
topology, but it should not be built before this smaller supported-path kill test.

## 1. Public capability boundary

| Candidate | Same context | Custom event path | Genuine Site Tools | Current judgment |
|---|---|---|---|---|
| Same-chat Scheduled heartbeat plus Receiver poll | Official same-chat context continuity | Indirect: heartbeat polls an accepted event record | **CURRENT-BUILD H0B + H1 PASS** | Bounded mechanism works; public compatibility and production viability remain undocumented |
| Workspace Agents API | Stable `conversation_key` for a published Agent | Authenticated API trigger with idempotency | No local Desktop Browser contract | Alternative runtime, not a Q4 proof |
| Codex App Server | Exact `thread/resume`, then `turn/start` | External client can start a turn | No documented built-in Browser or Site Tool attachment | Solves thread control only |
| Explicit local connector | Application can design pairing, queue, push, poll, or WebSocket | Yes | Only the private P0 bridge has passed | Deployment component, not supported platform API |
| Hosted Agent and browser | Application-managed context is possible | API or webhook | No current OpenAI hosted Site Tool contract found | Not presently a genuine WebMCP proof |
| Supported app-event triggers | ChatGPT-managed task context | Gmail, Slack, and GitHub only | Event triggers are unavailable on Desktop | Not a generic Receiver route |

Primary official sources:

- [Scheduled Tasks](https://learn.chatgpt.com/docs/automations)
- [Browser](https://learn.chatgpt.com/docs/browser)
- [Site Tools](https://learn.chatgpt.com/docs/webmcp)
- [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [Workspace Agents trigger API](https://developers.openai.com/workspace-agents/trigger-runs)

## 2. What is verified

### Scheduled same-chat continuation

Official documentation states that a scheduled task inside a chat:

- returns to that chat with its existing context;
- can use minute-based intervals for an active follow-up loop;
- can check a connected source on a fixed cadence; and
- can use plugins and skills in eligible Desktop task modes.

Official event-triggered tasks currently cover supported Gmail, Slack, and GitHub events on
web/mobile, not custom business events in Desktop. The business event must therefore be a
gate read by the heartbeat rather than the direct platform wake source.

### Browser and Site Tools

The built-in Browser is available in Desktop and provides a shared live page. Site Tools
belong to the providing page; closing or navigating away can make them unavailable.
Official documentation does not state that an unattended heartbeat receives Browser
attachment or Site Tools.

### App Server

The App Server publicly exposes thread start/resume and turn start. Experimental dynamic
tools can persist as thread-level tools, but they are not page-provided WebMCP registrations
and cannot substitute for the canonical-page proof.

### Workspace Agents

The Workspace Agents API offers authenticated external triggers, durable acceptance,
`Idempotency-Key`, a stable `conversation_key`, run-status polling, and a conversation URL.
It does not document resuming an arbitrary local Codex Desktop task or attaching its Browser.

### Current-build corroboration

A read-only inspection of Desktop `26.825.41651` build `7345` found that a heartbeat targets
an existing thread and resumes it before starting an automation turn. This is diagnostic
corroboration only. It is not a public compatibility promise and must not be used as the
production API.

## 3. Review 05 adjudication

Research 05 is correct that a remote backend cannot directly POST to a user's loopback
Receiver and that the existing private Desktop relay is not a supported production bridge.
It is also correct that shared process and shared database boundaries hide distributed
failure modes.

Its proposed three-process harness is not yet the uniquely correct next step because the
deployment topology remains unresolved. A same-chat polling route, Workspace Agent route,
or hosted runtime changes which boundaries exist. Building the connector harness first
could harden a topology that is later discarded.

The minimum rational sequence is:

1. preserve H0a as a qualified Browser-join result because its prompt repeated the URL and
   action;
2. accept H0b as the sealed-receipt current-build pass for bounded prior-context recovery;
3. accept the bounded H1 pass for one durable Receiver event gate and Host-side effect idempotency; and
4. select a production topology only after latency, cost, restart, public-contract, and
   deployment evidence are available.

## 4. H0 — Heartbeat to Browser and genuine Site Tools

H0 is read-only and domain-neutral.

1. Use GPT-5.6 Sol or Terra in the original P0 task.
2. Create a one-minute same-chat heartbeat with a narrowly scoped probe prompt.
3. Close or navigate away from every canonical workflow tab so no old document registration
   can produce a false positive.
4. Let the task run in the background.
5. The heartbeat must open the canonical URL in the built-in Browser.
6. In the same scheduled turn it must discover and genuinely invoke
   `get_workflow_context`.
7. It must perform no workflow mutation and use no substitute tool surface.

H0 fails if any of the following occurs:

- a new task or chat is created;
- the user must foreground or reopen the page;
- the result works only while an old tab remains attached;
- Site Tools are not available after the page opens in the same turn; or
- DOM automation, REST, Computer Use, App Server dynamic tools, or generic MCP is counted as
  the WebMCP invocation.

### H0a and H0b results

H0a is a **qualified pass**. It proved background execution, fresh Browser creation, fresh
Site Tool discovery, genuine read-only invocation, and all substitute-path negative
controls. It did not prove context-driven navigation because its scheduled prompt repeated
the marker, canonical URL, and tool name.

H0b is a **pass on ChatGPT Desktop `26.825.41651` build `7345`**. Its enrollment turn stored
a bounded receipt containing a sealed canary, workflow identity, canonical URL, trigger, and
read-only continuation policy. The scheduled prompt later contained only the trigger. The
task returned the canary, recovered the URL and action role, opened a fresh tab, discovered
the current page tools, and genuinely invoked `get_workflow_context`. No REST state read,
DOM state extraction, Computer Use, generic MCP substitute, private relay, or mutation was
used. The workflow state and timestamp did not change, and the automation was paused.

Evidence:

- [H0a qualified verdict](../../mvp/evidence/h0-scheduled-browser-site-tool-probe-2026-08-30-verdict.md)
- [H0b sealed-context verdict](../../mvp/evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md)

## 5. H1 — Event-gated scheduled re-entry

H1 passed once on the current build under the bounded local acceptance run.

~~~text
Host transition and signed event submission
-> Receiver accepts and stores one authenticated event
-> same-chat heartbeat polls a narrow Receiver control-plane tool
-> valid pending event exists
-> open canonical page
-> genuine get_workflow_context
-> genuine continue_artifact
-> stop before the human boundary
~~~

The implemented Receiver Inbox page carries only the narrow control-plane gate through its
page-bound Site Tools. It does not carry Host business truth; that authority remains on the
canonical Host page.

Required controls:

- no event: no page re-entry and no artifact change;
- invalid, expired, revoked, or stale event: fail closed;
- valid event: one reviewable continuation;
- duplicate event: no second artifact effect;
- closed tab: fresh page and fresh Site Tool discovery;
- private relay disabled: no undocumented bridge assistance; and
- Browser or page unavailable: retain the event for retry, do not consume the effect.

### H1 result

Four trigger-only scheduled turns on Desktop `26.825.41651` build `7345` completed the
bounded acceptance:

- with no event, the genuine Inbox Site Tool returned `pending: false` and the Host page was
  never opened;
- one authenticated pending event survived Receiver process restart;
- fresh Inbox and Host documents exposed and invoked their genuine current Site Tools;
- one Host continuation advanced the artifact from revision 1 to revision 2 and stopped
  before the human commit boundary;
- a deliberately omitted acknowledgement left the delivery pending, and an exact semantic
  retry returned the prior effect without another artifact revision;
- genuine Inbox acknowledgement completed the event, run, and delivery;
- exact authenticated event replay created no second logical work; and
- the completed-event check returned `pending: false` and the automation ended paused.

See the [redacted H1 verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md).

## 6. Claim boundary

If H0 and H1 pass, the accurate claim is:

> Event-gated scheduled re-entry into the same Agent context.

The business event does not directly wake the Agent; the schedule wakes it and the accepted
event authorizes continuation. This is a pull-based event-delivery design. If direct event
wake is a non-negotiable product requirement, this route does not satisfy that narrower
claim even when it works.

H0b and H1 remove the bounded current-build capability and event-gating blockers. They do not make heartbeat
polling a production contract or a viable business transport. Do not silently weaken Q4,
count a substitute mechanism as genuine WebMCP, or describe the business event as the
platform wake source.

H2a further proved that the bounded no-event join can recover after the controlled task's
Node Browser kernel is terminated. The scheduled turn reconstructed a fresh Browser runtime,
completed its mandatory documentation preflight, and invoked the genuine Inbox Site Tool in
the same turn. The Desktop app and parent tool service remained running, so full app restart
and device durability remain open.

## 7. Remaining unknowns

- Does the same task retain the bounded receipt and Browser capability after app restart,
  device sleep, client update, or a busy foreground turn?
- Can cold-start Browser recovery become one clean preflight path rather than requiring
  multiple failed calls before documentation and runtime state are aligned?
- Will OpenAI publish or preserve unattended Browser and Site Tool availability as a
  compatibility contract rather than a current-build behavior?
- Can a heartbeat remain reliable across longer windows, scheduler jitter, missed runs, and
  concurrent or busy-task conditions?
- How should crash-safe Inbox provisioning and durable receipt dispatch recover after an
  approved Grant if the response carrying the one-time Inbox capability is lost?
- What latency, battery, network, and quota cost does minute polling create?
- If the application requires near-real-time response, is polling economically or
  experientially acceptable?
- If a local connector is selected, what supported Agent transport replaces the private
  Desktop relay?

No production bridge is selected until the business-viability tests, platform-durability
matrix, a clean-room test, and an accepted ADR exist.
