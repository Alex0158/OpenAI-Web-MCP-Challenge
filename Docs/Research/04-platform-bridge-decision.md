# P0 Platform Bridge Evidence and Boundary

**Role:** SUPPORTING platform research  
**Status:** Preserved bounded P0 bridge decision and evidence snapshot; public production
bridge unresolved  
**Last updated:** 2026-08-30  
**Controls:** [P0 Technical Validation MVP](../Core/07-p0-technical-validation-mvp.md)

> **Current routing:** This document controls the historical P0 bridge claim only. Use the
> [current project status](../Core/00-current-status.md) for the current platform-research
> sequence, and use the
> [Receiver Queue and Wake-Adapter Architecture Review](18-receiver-queue-and-wake-adapter-architecture-review.md)
> for its Receiver-ledger, replaceable-adapter, and production claim boundaries. That review's
> prospective App Server step is superseded by the two later failures recorded below.

## 1. Bounded P0 decision

The current ChatGPT Desktop task-control surface was accepted as a **bounded P0 feasibility
bridge** for testing the missing join from an authenticated Receiver event to the exact
local task, built-in Browser, and page-bound Stage-B Site Tools. One clean correlated run
has now passed through that route.

This route is explicitly:

- **private and unsupported** as an external integration contract;
- **current-build-specific** to ChatGPT Desktop `26.825.41651` (build `7345`);
- **same-user and local-only**, because the task and native IPC host belong to the running
  desktop application on this machine; and
- acceptable only as a controlled P0 experiment, not as evidence of a production-ready
  Receiver architecture.

The passing run establishes that the concept is technically composable in the current
desktop runtime. It does not establish API stability, cross-user delivery, hosted service
operation, supportability, or a deployable production trust boundary.

## 1.1 Two contracts, two different questions

The public-bridge gap must not be confused with the Website Backend-to-Receiver event
contract.

### Website Backend -> Receiver

This is a project-owned application protocol. The Receiver defines the versioned event
envelope and validates issuer authentication, Grant scope, workflow and state identity,
and idempotency. Different Website Backends can integrate by conforming to that contract;
they do not need different Receiver control logic. A minimal fixture may intentionally pin
one issuer, workflow, event type, and development key, but those pins are scope limits for
the fixture rather than a different conceptual protocol.

### Receiver -> Agent runtime

This is a platform-specific Agent Continuation Adapter contract. It covers managed-context
capture, validated receipt persistence, exact context resumption, browser access,
canonical-page re-entry, and genuine Site Tool invocation. The transport depends on where
the Agent runtime is hosted and who controls the local browser.

The absence of a documented public Codex remote-control path matters only for the hosted
topology in which an independent cloud Receiver must reach a user's local Desktop without a
local connector. A local or Agent-side Receiver can use an explicitly installed or
task-launched connector instead; that topology does not require a public cross-machine
Codex API. Therefore the public-bridge question is a deployment and portability question,
not a rejection of the Receiver event model or of custom backend integration.

## 2. Why the public routes do not currently close the join

### Codex App Server

The official [App Server documentation](https://learn.chatgpt.com/docs/app-server)
documents `thread/resume` for an exact stored thread and `turn/start` for a later turn. This
is sufficient for the Receiver-side Q3 probe already completed.

Neither the published lifecycle nor the inspected current schemas expose Browser
navigation, Browser attachment, Site Tool discovery, or WebMCP invocation. App Server can
therefore prove exact-context continuation, but it cannot by itself prove Q4. Two current-build
runtime probes now close the standalone Desktop variant negatively:

1. A cold App-Server-owned thread resumed exactly, but Browser setup returned
   `iab-unavailable` before page access. That signal does not identify which Browser or
   session precondition was absent.
2. A standalone App Server then attempted exact warm resume of the task supplied by the
   controlled Desktop-priming step, but `thread/resume` returned an active-writer rejection.

Together these failures reject both tested standalone App Server Desktop joins and remove that
route from current selection unless a materially different supported contract or topology
appears. The warm public JSON proves the active-writer rejection, but not writer ownership or the
primed Browser state. The results do not prove that App Server lacks value as thread control
inside another topology.

### Same-chat scheduled tasks and heartbeats

The official [Scheduled tasks documentation](https://learn.chatgpt.com/docs/automations)
states that an in-chat task returns to the same chat on a schedule and uses that chat's
existing context. The official
[changelog](https://learn.chatgpt.com/docs/changelog) likewise describes thread
automations waking the same thread on a schedule.

That is a credible polling or follow-up mechanism, not the required custom business-event
trigger. Desktop event-triggered tasks are not available: the documented supported app
events are limited to Gmail, Slack, and GitHub on ChatGPT web and mobile. A scheduled poll
would change the causal trigger being tested and therefore cannot silently replace the
frozen event-resumption contract. Scheduled Heartbeat remains bounded fallback evidence, not
the core mechanism or a production transport.

### Workspace Agents API

The official [Workspace Agents API](https://learn.chatgpt.com/workspace-agents/trigger-runs)
does provide an authenticated external trigger, optional idempotency, and a stable
`conversation_key` for a published ChatGPT workspace agent.

The contract returns a ChatGPT conversation URL. It does not target an existing local Codex
Desktop task ID, attach that task's built-in Browser, or document continuity with a live
page's Site Tools. It is a valid alternative architecture to investigate, but not current
evidence for the frozen local Desktop re-entry chain.

## 3. Current local bridge evidence

Read-only inspection on 2026-08-30 established:

1. `/Applications/ChatGPT.app` `26.825.41651` (build `7345`) is the running desktop client.
2. Its bundled `codex-app-tools` MCP obtains a dynamic tool catalog from the desktop host
   and forwards tool calls over a native pipe supplied through
   `CODEX_APP_TOOLS_PIPE_PATH`.
3. The current task-visible catalog exposes `read_thread`, `send_message_to_thread`, and
   `open_in_codex`.
4. `read_thread` successfully read the exact active root task, including its active status
   and in-progress turn. The raw task identifier is intentionally omitted from project
   evidence. This is direct current-runtime evidence that exact task addressing works on
   the private surface.
5. `send_message_to_thread` accepts a target task ID, while `open_in_codex` can place a
   Browser URL or tab into a target task. These exposed contracts make the missing join
   testable without replacing the built-in Browser or page-provided Site Tools.

Subsequent implementation probes established an additional current-build boundary:

6. An ordinary Receiver-owned Node process cannot open the copied native pipe. Its MCP
   session closes during `tools/list`, including when the bundled server module is launched
   directly from the Receiver. Acceptance depended on the tested task-launched process
   context; the exact Desktop host validation mechanism is undocumented and was not proven.
7. The Desktop-bundled Node runtime, launched from this exact task context, can complete the
   App Tools handshake. The P0 therefore uses a narrow same-user Unix-socket relay running
   in that accepted context. The launcher verifies that the supplied bundled Node path is
   executable; it does not independently verify its code signature. The Receiver never
   receives a generic App Tools method.
8. The relay fixes the task ID from `CODEX_SESSION_ID` and the canonical URL at startup,
   exposes only exact-task read, canonical-page open, and two prefixed follow-up classes,
   and uses a `0600` socket plus an ephemeral bearer. The tested provisioning supplied a
   `0700` parent directory; the relay itself enforces the socket mode but does not create or
   chmod that directory. Follow-up prompts are prefix-constrained, not fully structured;
   prompt construction remains in the trusted Receiver process.
9. Live relay calls read the exact current task, delivered the enrollment receipt and later
   authenticated event to that task, and opened the canonical fixture page in its built-in
   Browser.
10. At this P0 checkpoint, thirty-one component and contract tests passed. They covered relay
    authentication and target fixation, private context capture, pre-dispatch Grant activation,
    fresh-tab opaque binding registration, strict signed-event identity, one-run deduplication,
    greater-than-64-KiB native task-response compaction, and fail-closed identity parsing. This
    is a historical scoped count, not the current full-suite total, and those tests do not
    substitute for the event-resumed Stage-B Browser observation.
11. The event-opened Browser page exposed genuine `webmcp`, read fresh `READY` state,
    discovered only the two Stage-B Site Tools, and invoked `continue_artifact`. Exact replay
    after Stage B returned the same run and produced no second write.
12. A first independent rehearsal exposed a response-size failure before event dispatch.
    The trusted relay now validates the single observed native `thread.id`, returns only a
    compact redacted identity proof, forwards no task content, and leaves the 64 KiB client
    cap unchanged. A reset post-fix rehearsal then repeated Q1–Q5 successfully.

The inspected bundle, Desktop-bundled-node relay, and successful task/page calls are diagnostic
evidence only. They are not public documentation, and the tool catalog, executable ancestry
check, or IPC may change without compatibility notice. No production component should
connect to the native pipe directly or rely on the relay or undocumented bundle behavior.

## 4. Rejected proof substitutions

The official [Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) distinguishes
page-provided WebMCP tools from generic MCP tools that can operate independently of an open
page. Q1 and Q4 require the former: the built-in Browser must load the canonical page,
discover that page's current stage-specific tools, and invoke one.

Accordingly, these routes are rejected as proof substitutes:

- a generic MCP server that exposes equivalent workflow methods;
- direct REST calls to the fixture;
- DOM automation or scripted button clicks presented as Site Tool invocation;
- synthetic App Server dynamic tools; and
- a custom headless browser that bypasses the ChatGPT Desktop WebMCP surface.

Generic MCP or HTTP may still carry Receiver control-plane data, but neither may be counted
as the genuine page-bound Stage-A or Stage-B tool evidence.

## 5. P0 acceptance and production boundary

The current-build bridge was accepted for exactly one purpose: run the correlated P0 kill
test and learn whether an authenticated event can resume the intended task, reopen the
canonical page, discover fresh Stage-B Site Tools, and continue the same artifact to the
visible human boundary. That run passed. Record two separate conclusions:

- **P0 technical feasibility:** passed in a controlled, same-user local Desktop runtime.
- **Production support:** unresolved until a documented public bridge provides equivalent
  exact-task wake, Browser attachment, and Site Tool continuity under an explicit security
  and lifecycle contract.

Future bridge work must preserve the same proof boundary. Do not weaken Q4 by substituting
generic tools or DOM control.

The two bounded standalone App Server arms have both failed on the tested current build: cold
Browser acquisition was `iab-unavailable`, and exact warm resume returned an active-writer
rejection for the supplied task. The public warm artifact does not identify the writer owner.
App selection is the current gate. A published Workspace Agent is a conditional
distinct hosted-runtime probe only when entitlement and selected-app requirements justify it, not
continuation of the local Desktop task. Its Browser/WebMCP join must be demonstrated directly in
that hosted topology. Scheduled Heartbeat remains a bounded fallback experiment, not the core
mechanism or a production transport. D4 remains frozen optional evidence unless a selected local
connector or relaunch topology makes Desktop restart recovery material.

## 6. Source and evidence map

- Official App Server lifecycle: <https://learn.chatgpt.com/docs/app-server>
- Cold App Server Browser-join failure:
  [`../../mvp/evidence/app-server-browser-join-probe-2026-08-30.json`](../../mvp/evidence/app-server-browser-join-probe-2026-08-30.json)
- Warm exact-task App Server join failure:
  [`../../mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json`](../../mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json)
- Official scheduled and event-triggered task boundaries:
  <https://learn.chatgpt.com/docs/automations>
- Official same-thread scheduled-wake statement:
  <https://learn.chatgpt.com/docs/changelog>
- Official Workspace Agents external trigger contract:
  <https://learn.chatgpt.com/workspace-agents/trigger-runs>
- Official Site Tools versus generic MCP boundary:
  <https://learn.chatgpt.com/docs/webmcp>
- Controlled clean-run verdict:
  [`../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md`](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md)
- Current delivery-ledger and wake-adapter analysis:
  [`18-receiver-queue-and-wake-adapter-architecture-review.md`](18-receiver-queue-and-wake-adapter-architecture-review.md)
- Local bundle manifest:
  `/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/codex-app-tools/desktop-mcp.json`
- Local bridge implementation inspected read-only:
  `/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/codex-app-tools/server.mjs`
