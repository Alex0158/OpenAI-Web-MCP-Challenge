# CLOUD-028: Desktop Admission Route Review

**Role:** DEVELOPMENT feasibility review and unsent platform-question draft  
**Status:** Read-only review complete; existing-task admission remains blocked  
**Date:** 2026-09-04, Europe/London  
**Task:** [TASK-035](../Tasks/TASK-035-bind-existing-agent-task-during-enrollment.md)  
**Authority:** ADR-0046; ADR-0047 permits only its separately bounded native probe

## Approved order and scope

The owner confirmed this order: first establish legitimate admission and actual same-task wake;
then implement durable private binding and notification-handoff settlement; finally integrate the
hosted Receiver and Game SDK and prove two Events under the same Consent and task.

This review does not authorize a new runtime topology. It owns only this evidence record, the
Development index, and TASK-035's next gate. No App restart, environment/configuration change,
daemon start, native call, test message, task migration, SDK installation, Receiver claim, deployment,
signing change, credential retrieval, or external message was performed in this increment.

## Official contract versus the required join

The current [App Server documentation](https://learn.chatgpt.com/docs/app-server) exposes
`thread/resume`, `turn/start`, and `turn/start.toolOutput`. Tool output remains a
`functionCallOutput`; it is not a new user instruction. These are useful protocol primitives after
the client has reached the correct runtime, not proof of access to an existing Desktop owner or
its Browser. WebSocket transport is explicitly labelled experimental and unsupported. A Unix
listener is not the private app-tools pipe; its transport uses a WebSocket upgrade.

The current [Remote connections documentation](https://learn.chatgpt.com/docs/remote-connections)
describes authorized ChatGPT-device access and SSH-host workflows, including existing chats and
host tools. It does not establish third-party Local Connector enrollment or a generic external
Desktop-task notification API. Do not reinterpret account-device pairing as our Grant-to-task
binding or extract its private credentials for another client.

Local CLI help confirms that `app-server proxy` addresses an existing control socket, while
`daemon start` starts a daemon. Starting a daemon is not attaching an external client to the current
stdio owner. The earlier same-date read-only check found three Desktop-descended app-server
processes explicitly using stdio, and `daemon version` reported a missing default control socket.
No new listener or replacement runtime was started for this review.

## Route disposition

| Route | Evidence | Disposition |
|---|---|---|
| Public CLI queue | CLOUD-026 persisted one Q1 input without a new observed turn | Retain partial evidence; do not resend it |
| Private app-tools client | CLOUD-027 logs report `missing-code-signing-identity` before catalog readback | Blocked; signing-policy bypass is not an integration plan |
| Separate App Server | Historical Research/19 found cold exact resume without `iab`, and a warm supplied task rejected by an active writer | Do not repeat without a materially different reviewed ownership/Browser contract |
| Local-daemon launcher branch | Present in the installed bundle, but the normal local launcher supplies nonempty overrides and cannot satisfy its no-overrides condition | A flag plus restart is not a viable recommendation for this normal path |
| Explicit WebSocket endpoint | Selects a different server at Desktop connection creation | Not a listener on the current owner; no demonstrated App-tool/Browser continuity |
| Remote Control | Publicly documented for authorized ChatGPT devices; corresponding packaged settings exist | Potential platform inquiry, not an established third-party client API |

The historical [App Server/Desktop join verdict](../Research/19-app-server-desktop-browser-join-verdict.md)
is dated August 30 and used an older bundled CLI. Its failures are not new runtime tests or universal
impossibility claims. Its historical authority and alternatives do not supersede ADR-0046.

## Installed launcher evidence

Inspected read-only: ChatGPT Desktop `26.901.20858`, build `7658`, bundled Codex
`0.153.0-alpha.5`. Evidence is static packaged source, not a supported public API contract.

In `app.asar`, entry `.vite/build/src-BXVxNf6C.js`, `uU.connect` near character offset 891146:

- the local-daemon branch requires a local, non-Windows host, no configuration overrides,
  `CODEX_APP_SERVER_USE_LOCAL_DAEMON=1`, no forced/custom CLI, no bundled Git override, and a
  compatible already-running daemon;
- otherwise the normal path creates a stdio transport;
- the bundled Git location was absent on this installation, but that alone does not satisfy the
  other guards. No file or flag was changed.

In `.vite/build/main-b_QrpbvH.js`, normal local `P5` wiring near offset 2621053 supplies
`getConfigOverrides:()=>ek(e)`. The `ek`/`tk` functions near offsets 1148582 and 1149776 return a
nonempty `mcp_servers.codex_app` override for local hosts on both successful and handled-unavailable
paths. Therefore the normal path cannot satisfy `uU`'s empty-overrides test. Removing those
overrides would alter App-tool integration, not legitimately enable the unchanged configuration.

The earlier `P5`/`F5` branch and shared-bundle `gH` resolver near offset 855950 can choose a supplied
WebSocket endpoint. That changes the server selected at connection creation and bypasses the normal
local App-tool configuration path. It does not attach an extra client to the current stdio process.
No evidence here warrants changing that endpoint, detaching a writer, or restarting the App.

## Next gate and minimum answer required

The remaining dependency is a platform-confirmed way for an external, user-authorized Connector to
reach the runtime that owns the existing Desktop task, with its App tools and Browser intact.
Source inspection has not established that route. This is not a reason to switch silently to new
Agents, inject fabricated history, depend on scheduled polling, or weaken the Game/WebMCP claim.

The next useful external coordination is to ask the platform owner for the admission contract.
Preparing the draft below is authorized local documentation; sending it is not authorized by this
record. A platform response or published contract can reopen the smallest inert same-task probe.
Any proposed different runtime/host, writer transfer, App restart, new endpoint, or permission change
requires a separately reviewed owner decision before action. Binding and receipt design can progress
independently, but their implementation cannot prove or remove this admission blocker.

## Draft for platform review — not sent

We are building a WebMCP re-entry integration with a domain-neutral Cloud Receiver and an outbound
Local Connector. After one informed, persistent user consent, signed website business events should
notify a privately bound existing Codex Desktop task. The task retains the user's strategy, reads
fresh website state through genuine WebMCP, and independently decides whether to act. The Receiver
settles notification handoff, not completion of the Agent's business work.

On ChatGPT Desktop 26.901.20858 (build 7658), bundled CLI 0.153.0-alpha.5:

- A public queue input persisted but did not wake our disposable unloaded test task in the bounded
  observation window.
- The private app-tools pipe rejected our read-only client for missing code-signing identity. We
  have not bypassed peer authorization or altered the App.
- The local Desktop launcher uses stdio. Its conditional shared-daemon branch is excluded by the
  App-tool configuration supplied on the normal local path.

Could you confirm:

1. Is there a supported third-party enrollment and notification entry point for an existing
   Desktop-owned task, rather than creating a new task or independently resuming its stored history?
2. What client authentication, signing, user pairing, task ownership, and revocation contract must
   an external local Connector implement? Are any documented Remote Control extension points
   intended for this use?
3. Can input be delivered as typed event/tool data, without impersonating a new user strategy,
   while preserving the task's Desktop Browser, genuine Site Tools, and approval routing?
4. What proves durable notification admission, and what are the supported idempotency,
   response-loss recovery, busy-task, unloaded-task, and restart semantics?
5. If this is not supported in the current build, is there a supported build or documented
   integration topology that preserves this existing-task and genuine-WebMCP requirement?

We can provide a minimal redacted reproducer. We are not requesting access-control bypasses,
private signing material, arbitrary history injection, or automatic business-completion monitoring.

## Verification and reconciliation

Only documentation changes. Official pages and installed launcher source were checked independently;
no Adapter execution test, model turn, live API mutation, or new same-task wake claim results from
this review. Closure checks:

- Validator unit tests: 6 passed; sensitive-scanner unit tests: 3 passed.
- Repository validation: passed with the new record included in the Git index.
- Exact three owned files: no sensitive-pattern, CJK, or raw UUID-shaped locator matches; diff
  whitespace check passed.
- Whole-repository sensitive scan: failed with 21 existing findings in seven unchanged Game
  documents, all outside this increment. Those files had no diff against HEAD; no suppression or
  unrelated edits were made. This is not a clean whole-repository sensitive-scan claim.
- Independent read-only review found no correction to the launcher conclusions or authorization
  boundaries. No Receiver, SDK, Game, or experimental Adapter suite was rerun for this docs-only
  increment.

Core/00, Mechanism 04, and ADR-0046 remain aligned: supported admission, durable binding, and the
true Game chain are still open.
Their accepted behavior is unchanged; the evidence and next platform-coordination gate belong here
and in TASK-035, not in a new accepted architecture decision.
