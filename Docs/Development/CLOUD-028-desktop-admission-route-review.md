# CLOUD-028: Desktop Admission Route Review

**Role:** DEVELOPMENT feasibility review and unsent platform-question draft  
**Status:** Admission review corrected; MVP launcher equivalence and runtime proof remain open  
**Date:** 2026-09-04, Europe/London  
**Task:** [TASK-035](../Tasks/TASK-035-bind-existing-agent-task-during-enrollment.md)  
**Authority:** ADR-0046; ADR-0047 permits only its separately bounded native probe

## Approved order and scope

The owner confirmed this order: first establish legitimate admission and actual same-task wake;
then implement durable private binding and notification-handoff settlement; finally integrate the
hosted Receiver and Game SDK and prove two Events under the same Consent and task.

This review does not authorize a new runtime topology. The original review owned only this evidence
record, the Development index, and TASK-035's next gate; the correction scope is recorded below.
No App restart, environment/configuration change,
daemon start, native call, test message, task migration, SDK installation, Receiver claim, deployment,
signing change, credential retrieval, or external message was performed in this increment.

## Correction: the failed client was not the complete MVP launcher

The initial review prematurely made a platform response the next required gate. CLOUD-027's three
real attempts used ordinary PATH Node `26.5.0`. MVP 1's
[`launch-codex-app-tools-relay`](../../mvp/scripts/launch-codex-app-tools-relay) instead requires the
App-provided `CODEX_MCP_NODE_PATH`. Reusing the frozen native client under ordinary Node compares
wire code, not executable identity, caller provenance, or the successful launcher as a whole.
The observed rejection specifically concerns code-signing identity, so that difference is material.

The corrected finding is: **ordinary-Node admission failed; the complete successful MVP launcher
has not been revalidated on this build**. This neither disproves the prior success nor proves that
running a signed binary now would be authorized, admitted, or sufficient. The flag-only daemon
finding below remains valid for its inspected path, but it does not close this omitted comparison.

After the owner authorized continued reconciliation, a bounded metadata-only check found that the
current executor supplies an App-bundled runtime path. It resolves to an executable regular file
inside the installed App. `codesign -dv --verbose=2` returned zero and reported signing and team
identifiers, without an ad-hoc signature marker. The checker ran on Node `24.20.0`; it did not
execute that bundled runtime, connect to the native pipe, change signing, or print private paths.
These are current metadata facts, not proof of the App's peer-acceptance or permitted client policy.

The finite comparison is:

| Boundary | Frozen MVP 1 | New experiment / remaining gate |
|---|---|---|
| Launcher identity | App-provided bundled runtime | Ordinary Node was tested; legitimate use of the bundled route remains to be established |
| Topology | Restricted relay listener between Receiver and native pipe | Direct one-shot client; ADR-0047 does not authorize starting the old listener |
| Caller and target | Originating task supplied from `CODEX_SESSION_ID` is also native caller | Actual executor caller and a distinct approved test target; never impersonate the destination |
| Task binding | Verified capture plus MVP database records | Current Connector still lacks enrollment-time durable binding |
| Enrollment effects | Open Browser, send enrollment receipt, then persist receipt | Not a pure persistence helper; external-success/local-write interruption must be addressed |
| Event effects | Read task, open canonical Browser, send follow-up | Notification, actual wake, Browser and Game proof remain distinct |
| Product selection | Frozen evidence only | Existing `runtime/local-connector/` is the integration surface; the new harness is not wired into it |

Source provenance also explains the design mismatch: `f71c78d` first tracked the Connector with
fresh exec already selected; `275fdbd` restored the product target in documentation without changing
that executable choice; `f237fea` added only an isolated experimental harness and its records.
Freezing MVP source permits reviewed selective adaptation, not discarding its successful conditions
or building a second product Connector. Git authorship and later decision records do not by
themselves establish the original human approval for a preview simplification.

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
| Ordinary-Node private app-tools client | CLOUD-027 logs report `missing-code-signing-identity` before catalog readback | This tested route was rejected; it is not a complete MVP-launcher reproduction |
| MVP App-bundled launcher | Original successful route; current supplied runtime metadata exists | Caller, topology and permitted-use equivalence remain open; no automatic rerun or signing-policy bypass |
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

## Corrected next gate

First complete the launcher/caller/custody comparison and legitimate-use review, retaining the
actual successful conditions where permitted. Static signature metadata is not permission to borrow
a trusted executable's identity. If the route requires a listener, different caller authority,
runtime/configuration change, or other authority outside ADR-0047, present that exact difference to
the owner before action. If no permitted route can be established, platform coordination remains a
useful conditional next step. It is not the only conclusion justified by the failed ordinary-Node
tests. The contingency draft below remains unsent and creates no sending authority.

Preserve the existing Connector's pairing, credentials, outbound delivery and Adapter interface.
Any later reviewed promotion belongs there; neither the frozen MVP nor the experimental harness is
a second product path. No new Agent, fabricated history, scheduled-poll substitute, writer transfer,
App restart or alternate endpoint follows from this correction. Binding and receipt specification
can progress independently, but cannot prove actual runtime admission or wake.

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
  used ordinary Node, not the complete App-bundled launcher from our earlier successful MVP. That
  launcher comparison remains open. We have not bypassed peer authorization or altered the App.
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

## Original review verification

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

The original independent review did not identify the launcher-equivalence omission. Its favorable
review result does not resolve that omission; the correction above narrows the conclusion.

## Correction and handoff-proposal reconciliation

This documentation-only increment corrects this record, CLOUD-027, Core/00, Mechanism 04,
the Development index, and TASK-035. TASK-035 is in progress for equivalence and specification,
not runtime-verified. TASK-029 and Research 27 now distinguish owning-runtime admission from a
Connector-local backlog, local private task resolution from Receiver authority, and historical
receipt recovery from permission for a new notification. Cross-Event coalescing is not exact replay.

The owner reaffirmed the product direction and authorized continued reconciliation. This does not
accept Research 27's concrete receipt, route, wire version, inbox or migration, and does not enlarge
ADR-0047. ADR-0046 remains unchanged; Core and Mechanism edits correct evidence, not product policy.
Research 25's until-revoked implementation details remain a separate unaccepted proposal. No new ADR,
runtime package, live submission, Receiver/SDK/Game change, deployment or external message is included.

Correction closure checks:

- Validator unit tests: 6 passed; sensitive-scanner unit tests: 3 passed.
- Repository validation passed with all eight owned documents in the Git index. Working-tree and
  staged whitespace checks passed; the eight owned files have no sensitive-pattern, CJK, or raw
  UUID-shaped locator matches.
- The whole-repository sensitive scan still reports 21 existing findings in seven Game documents
  outside this correction. Those seven files have no diff against HEAD. No suppression or
  unrelated change was made; the whole-repository scan is not green.
- Two independent read-only reviews found no actionable correction to the evidence boundaries or
  handoff proposal. They checked local binding ownership, admission versus backlog, uncertain
  delivery recovery, version non-acceptance, and the limits of runtime signing metadata.
- No product suite was rerun for this docs-only correction. No bundled-runtime execution, native
  IPC attempt, runtime admission, new Agent turn, Browser action or Game effect was performed.
- Concurrent owner-held Connector pairing changes appeared during review. Readback showed that
  its selected dispatch still uses fresh exec; this correction neither implements nor claims
  same-task dispatch. Those changes, other concurrent SDK/documentation changes, and all unrelated
  tracked or untracked work remain outside the eight-file staging scope.
- Shared `main` was already 50 commits ahead of the fetched `origin/main`, with none behind.
  This bounded correction does not authorize publishing that unrelated history; remote delivery
  remains separate from local documentation closure.
