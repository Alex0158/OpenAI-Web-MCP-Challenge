# CLOUD-028: Desktop Admission Route Review

**Role:** DEVELOPMENT feasibility review, host-mediated control, and unsent platform-question draft  
**Status:** Host-mediated response verified; receiving-side idle compatibility source-reviewed; C1 unused; client admission unresolved  
**Date:** 2026-09-04, Europe/London  
**Task:** [TASK-035](../Tasks/TASK-035-bind-existing-agent-task-during-enrollment.md)  
**Authority:** ADR-0046; ADR-0047 permits only its bounded diagnostic and host-mediated clarification

## Approved order and scope

The owner confirmed this order: first establish legitimate admission and actual same-task wake;
then implement durable private binding and notification-handoff settlement; finally integrate the
hosted Receiver and Game SDK and prove two Events under the same Consent and task.

This review does not authorize a new runtime topology. The original review owned only this evidence
record, the Development index, and TASK-035's next gate; the correction scope is recorded below.
No App restart, environment/configuration change,
daemon start, native call, test message, task migration, SDK installation, Receiver claim, deployment,
signing change, credential retrieval, or external message was performed in the original static-review
increment. The separately recorded host-mediated control below includes one authorized inert send.

## Current C1 execution gate

The owner approved ADR-0047's temporary local relay and one new inert notification. C1 remains
**unused**: no listener, App-service process, native connection or notification has been started.
This approval resolves the experiment's listener/send scope, not the missing host invocation.
The preceding recommendation overstated readiness by presenting a new test allowance as the
remaining practical prerequisite. It must not be read as an established executable integration.

The finite current-source review identifies the exact required consumer and remaining input:

- Reuse `runtime/local-connector/src/local-connector.mjs:25-62`: its constructor accepts an
  `adapter.activate` consumer and `runOnce` performs validated dispatch without automatic ACK.
  Pairing, stored credentials, Receiver policy and the product CLI need no change for this probe.
  An isolated local delivery fixture can drive the real Connector class, but is not a live Cloud
  claim or trusted enrollment. A relay wrapper without a real host consumer cannot prove wake.
- Installed App Tools `desktop-mcp.json` selects its packaged launcher/server and declares a
  message-approval policy. `server.mjs:24849-24891` requires caller context from its host interaction
  or executor request metadata; it rejects calls without that metadata. The wrapper transports
  the request but does not itself recreate the executor's approval decision. Running it from a
  Connector and filling `_meta` with a known task ID does not establish delegated invocation.
- The exposed App task tools are callable in the current Agent executor. The available tool
  catalog does not expose a background-Connector pairing or invocation-delegation operation.
  Waiting inside that executor for a local request and then calling the task tool remains active-
  executor mediation, not proof that the Connector can operate after that executor is gone.
- The official [App Server page](https://learn.chatgpt.com/docs/app-server) was fetched again.
  It documents thread/turn primitives, not a demonstrated attachment to this Desktop owner. The
  installed App is still `26.901.20858`, build `7658`. No configuration or runtime was changed.

No legitimate background invocation was established by these checks. This is a current integration
blocker, not a new App rejection or a claim that MVP1 never worked. Do not consume C1 through an
unreviewed substitute, run the held native client with another executable, or add an offline-only
relay abstraction while describing the real consumer as available.

The actionable unblock input is an App-approved invocation recipe for the existing target:
who starts the client and how it preserves legitimate caller identity and App approval policy.
Post-turn operation remains a runtime verification requirement, not an established active-turn
restriction or a requirement to invent a new delegation token. The receiving-side review below
corrects that distinction. A working implementation with those properties can be selectively
adapted. Otherwise the platform question below needs an answer for client admission and approval,
not a presumed missing ability to start an idle task. No new generic user test approval is required
while C1 remains unused; no message to a contributor or platform was sent by this increment.

## Receiving-side correction: idle caller is not the demonstrated blocker

The follow-on review traced the receiving App main process and renderer, rather than inferring
their behavior from the bundled MCP wrapper's metadata requirements. In the inspected native-to-
renderer MCP `send_message_to_thread` path, no check requires the caller turn to be active.
This narrows the earlier reasoning: missing executor metadata in one wrapper is not evidence that
the App requires an active source turn or a new background-invocation token. It does not establish
permission to supply another caller, bypass peer admission, or omit upstream approval handling.

Read-only source: installed Desktop `26.901.20858`, build `7658`, `app.asar`. Offsets below are
UTF-8 byte offsets inside the named archive member, not character offsets or public API contracts.

| Boundary | Member and offset | Verified source behavior |
|---|---|---|
| Native peer admission | `.vite/build/main-b_QrpbvH.js`, `Tf`, 261071 | Passes socket descriptor and packaged/dev mode to the native authorizer, not task or turn metadata. The native signing acceptance policy remains unresolved. |
| Parsed request and window selection | Same member, `gie`, 263835; `callDynamicAppTool`, 2626873 | Validates the request, handles cancellation, and selects a ready App window through renderer capability/dispatch calls. |
| Caller availability | `webview/assets/app-initial-7a6c8787453d.js`, `ESa`, 6997079 | For messaging, requires the caller conversation to exist or be readable; the special interactive-onboarding branch is not this tool. |
| MCP dispatch | Same renderer member, `DSa`, 6997319; `dSa`, 6982431 | Selects `transport: mcp`. The inspected client/turn/owner checks guarded by `transport: dynamic` do not apply. Namespace and cancellation checks still apply. |
| Additional reachable checks | Main member, `tryClaimExecution`, 1172006; renderer, `hZi`, 6033714 | The claim is a bounded 1024-key in-memory deduplicator, not validation of an active turn. `hZi` handles three voice/screen tools and returns no result for messaging. |
| Same-task follow-up | Renderer, `uXi`, 6017932; `eJi`, 5968725; `Qqi`, 5968054; `Gln`, 2940665 | Validates message arguments, resolves the destination host, resumes the target, and supplies start/steer operations to the turn coordinator. The inactive realtime-state check occurs after sending and only affects ancillary recording. |

The main member is 3,075,013 bytes with SHA-256
`b11f9b574b8cbc6ab809c8c89c48dff1b4eb179a6394ac6d4fca10e732897855`;
the renderer member is 10,285,987 bytes with SHA-256
`3d4825a32d3bfbcc5dc3ad55793c12bda52614d2bf3227f79cb074a3c970947a`.
These hashes identify the static inspection only. No App module or native addon was executed.

The inspected send path does not itself reproduce the bundled MCP executor's approval prompt.
The manifest's `approval_mode: prompt` remains an upstream policy declaration; its actual executor
evaluation was not traced here. Thus neither mandatory approval on every notification nor safe
omission of approval is proved. A standing Re-entry Grant cannot override App policy.

**Implication:** the original MVP relay's post-turn design is compatible with the inspected send
implementation; current independent execution is still unverified. The ordinary-Node rejection
was a peer-identity failure before these handlers, not an idle-task failure. The remaining gate is
the legitimate client entry point and preservation of upstream approval, not a demonstrated need
to build a new App, change the Game, or invent a new platform delegation mechanism. The existing
Connector's `adapter.activate` remains the product seam; ADR-0047's hold and C1 scope are unchanged.

This Assured evidence correction changes no product behavior or authority. Core/00, Mechanism 04,
TASK-035, the Development index, and the experimental README carry the narrowed finding. Static
inspection used Node `24.20.0`; independent reviews covered native identity and receiving-side
dispatch, and the primary agent checked the decisive source snippets. No listener, native call,
notification, new Agent turn, credential access, App configuration, Game/Receiver traffic, package
change or deployment occurred. C1 remains unused.

Receiving-side correction closure: validator unit tests passed 6/6; sensitive-scanner unit tests
passed 3/3; indexed repository validation passed with exactly these six owned documents; working
and staged whitespace checks passed. The six documents have no scanner findings, unintended CJK
or raw UUID-shaped locators. The whole-repository scanner still reports 21 existing findings in
seven Game documents, each unchanged against HEAD; no suppression or unrelated fix was made.
Independent final review found no actionable issue with the source claims, offsets, hashes or
ADR-0047 boundaries. No executable suite was reopened for this evidence-only change. The Git
baseline is shared `main` at `5f6227a`, equal to fetched `origin/main`; earlier ahead-only snapshots
below are historical, not the current delivery gate. Concurrent owner-held SDK, Connector, Game,
RightSpot and documentation work remains outside this six-file scope.

### Contributor branch readback

The earlier fetch advanced `origin/Eyad/Full-Integration` from `41aae5d` to `74325c2`. That commit
moves fourteen Connector source modules with Git similarity `100%`; its CLI still selects fresh
exec. Its root README explicitly limits the test app to consent/status and excludes later Events,
WebMCP and Agent launch. It also reduces the broader repository surface. This is not a same-task
driver implementation or a patch to merge wholesale into shared `main`. The branch was inspected
read-only; no checkout, merge, deletion or author-held edit was performed.

The receiving-side review's final fetch now resolves that branch to `75b1339`. Its delta from
`74325c2` adds Cloud frontend/backend code and groups it under `reentry-cloud-app/`; it does not
change `reentry-local-connector/`, the SDK, Core or test app. The Connector factory still selects
`createCodexExecAdapter`, and no same-task relay or invocation recipe was found in the added Cloud
source/docs. Cloud code is now present in that branch, but this is not new same-task integration
evidence. These commits were inspected without checkout, execution, merge or publication.

### C1 bounded-review closure

Seven owned documents record the new approval, current stop and concrete unblock input. This
increment is **source-reviewed / runtime not attempted**, not Connector integration. No product
code, experimental client, fixture, CLI hold, frozen MVP or App file was changed. Existing 110-test
observer evidence is unchanged historical evidence, not a new test run. No listener, credential,
socket, test notification, Browser, Receiver request, Agent turn or deployment was created.

Commands: `python3 scripts/test_validators.py` passed 6/6;
`python3 scripts/test_sensitive_scan.py` passed 3/3;
`python3 scripts/validate_repository.py --root .` passed with the seven owned files indexed;
`git diff --check` and staged whitespace checks passed. The owned files have no sensitive-pattern,
unintended CJK or raw UUID-shaped locator matches. The full
`python3 scripts/scan_sensitive_patterns.py --root .` still reports 21 findings in seven Game
documents, each unchanged against HEAD; it is not a clean full-repository scan. No suppression or
unrelated edit was made. Independent source review confirms the missing post-turn invocation
boundary and the unchanged fresh-exec consumer in the contributor branch.

Intake source was `128d608` on shared `main`, 57 commits ahead of fetched `origin/main`, none behind.
Local Git closure includes only these seven documents. No new branch, merge, push or publication is
included; unrelated dirty and untracked owner-held work is preserved. C1 is still unused and can be
resumed under its existing scope when a legitimate host invocation is supplied and reviewed.

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

## Current intended-client and caller contract

The follow-on source-only review narrows the missing integration contract. The installed App
supplies a runtime, but its intended bundled service is not an arbitrary script using that runtime:

- Packaged `main-b_QrpbvH.js`, `ek` near offset 1148582, loads the selected plugin's
  `desktop-mcp.json`, injects the App pipe and bundled runtime, and returns the App Tools MCP
  configuration. `src-BXVxNf6C.js`, `fU` near offset 892270, also puts the runtime path into the
  local executor environment. Environment availability is therefore not a private-client permit.
- The installed `openai-bundled/codex-app-tools/0.1.3/desktop-mcp.json` selects its own launcher
  and `server.mjs`. Hash comparison confirmed that all three inspected files match their packaged
  App copies. It declares `send_message_to_thread` with `approval_mode: prompt`. This is
  source-level default policy, not evidence that every actual call displays a prompt or that
  no authorized override exists. A custom client must not silently discard the host's approval
  boundary or treat a Re-entry Grant as an App-policy override.
- That launcher prefers the App-provided runtime and has additional fallback candidates. Those
  fallbacks belong to the installed service, not our probe. Its configured consumer is the
  bundled MCP server; no launcher or server was executed or modified during this review.
- `server.mjs:24849-24891` obtains caller identity from a host-supplied interaction argument or
  executor request metadata, including `x-codex-turn-metadata.thread_id`. It rejects calls with
  no caller metadata. It does not derive the caller from `CODEX_SESSION_ID` or `CODEX_THREAD_ID`.
  Synthetic call/turn labels are only fallback correlation, not proof of a delegated identity.
- `server.mjs:24902-24910` chooses catalog scope from its interaction context. The experimental
  client always asks for `default`. This is another non-equivalence, but it cannot explain a
  socket rejected before any catalog response.

The frozen identity test deliberately supplies different root-session and child-task identifiers,
then requires capture of the root session. Its relay uses that captured task as caller and target.
The hardened probe instead keeps the executor's caller separate from the approved test destination.
A values-redacted check found both environment identifiers present and equal in this root executor;
that observation does not make the variable names interchangeable in child or future executors.
Neither client's initial `tools/list` frame contains caller/target fields, so changing those fields
cannot repair the observed pre-catalog peer rejection.

The current runtime-to-service configuration is **VERIFIED static source**. Legitimate use of the
custom probe, and background Connector access when no Agent turn is active, remain **UNKNOWN**.
An available in-task App tool is not evidence of an independent Connector's admission. Conversely,
this missing contract is not proof that a supported or explicitly permitted route cannot exist.
The historical MVP success remains bounded evidence, not erased by the current policy question.

There are two distinct gates, in the approved order:

1. **Current-executor diagnostic:** establish a legitimate invocation for this bounded custom
   client, actual caller and fixed target while preserving App approval policy. The installed
   service's source alone does not establish that invocation. Do not require a complete background
   product lifecycle before this separately authorized diagnostic.
2. **Subsequent product integration:** establish an App-authorized invocation mechanism usable by
   the existing Connector when no Agent turn is active, without fabricating executor metadata.
   Specify exact-task scope, lifetime, renewal if needed, restart and revocation for that mechanism.
   No token, delegation protocol, or App-owned mediation design is selected here.

A durable private destination binding says where to deliver; it is not the authority to invoke
the runtime or act as that task. Persistent Re-entry authorization and App invocation authority are
separate. Ordinary disconnection must not be misreported as user revocation of the former.

The owner had already approved the bounded private diagnostic in ADR-0047. Its previously unused
B1 allowance has since been consumed by the explicitly labelled host-mediated control below; no
native B1 was sent. The remaining custom-client gate concerns intended caller and host approval,
not a claim that current same-task messaging is impossible. A later submission requires a new
explicit allowance. No native preflight or bundled-runtime substitution follows from this review.

## Route disposition

| Route | Evidence | Disposition |
|---|---|---|
| Public CLI queue | CLOUD-026 persisted one Q1 input without a new observed turn | Retain partial evidence; do not resend it |
| Ordinary-Node private app-tools client | CLOUD-027 logs report `missing-code-signing-identity` before catalog readback | This tested route was rejected; it is not a complete MVP-launcher reproduction |
| Exposed App task tool, one-shot control | Later B1 input and exact response in the existing task's new turn, after Q1 | Current host-mediated response verified; isolated wake and autonomous Connector admission unverified; allowance consumed |
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

Use the completed comparison and the executed host-mediated control below; do not repeat either
without a materially new question and the necessary scope. The control used the provided App task
tools and consumed B1 without changing process identity or App policy. It proves current same-task
input/response in a joined turn, not isolated wake, custom native admission or the real Connector
consumer. The native-only gate below applies to a subsequent custom-client test; it must not be
used to erase this control or MVP1's original Browser/WebMCP success.

CLOUD-027 now records enforcement of this hold in the operational experimental CLI. Default,
inspect and send modes stop before native IO; retained transport/observer subprocess tests use only
an isolated fixture runner. This removes an accidental retry path, not the unresolved admission gate.

The static launcher and caller comparison above is complete at its named source boundary. Resolve
the remaining host-authorized client/caller contract before another live probe, retaining actual
successful conditions where permitted. Static signature metadata is not permission to borrow
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

## Host-mediated control record, 2026-09-04

### Pre-dispatch reservation

Authority: ADR-0047's host-mediated diagnostic clarification and the owner's authorization to
continue after the MVP provenance review. The one remaining B1 allowance is reserved for this
control before any send. No second/native send is allowed automatically if the result fails or is
unknown. This is not autonomous delivery and does not rescue the earlier Q1 queue result.

The existing Stage-A disposable task was resolved through the App's task list and exact readback;
it is a local Codex task in the expected MVP workspace, with `notLoaded` status and only completed
baseline turns. No new task was created. The observer retains baseline turn identifiers privately;
no raw locator or task content is written here. Marker: `REENTRY_BRIDGE_HOST_CONTROL_20260904_B1`.
The fixed input asks only for that exact response and no tools, Browser, business work or settings
changes. Observe new-turn attribution, actual input role, exact response and unexpected tool use.

### Executed result

On the installed ChatGPT Desktop `26.901.20858`, build `7658`, exactly one exposed App
`send_message_to_thread` call used the fixed target and prompt with no model, permission, or caller
override. The one B1 allowance is now consumed across all diagnostic routes. The tool returned the
target identifier; that return alone was not treated as delivery evidence. A bounded wait and
exact-task readback observed a new completed turn at `2026-09-04 01:56:07` through `01:56:13` UTC.

The baseline was `notLoaded` with completed historical turns; the readback was `idle` with the same
target/workspace and this ordered new-turn content:

1. The older Q1 input appeared as `userMessage`.
2. The Agent returned Q1's marker.
3. The new B1 control appeared as `functionCallOutput`, named `send_message_to_thread` in namespace
   `codex_app`, with an untruncated `{ text, truncated: false }` output containing a delegation
   wrapper and the exact new prompt.
4. The Agent returned exactly `REENTRY_BRIDGE_HOST_CONTROL_20260904_B1`.

No tool invocation was observed in that turn. No new task, Browser, native client, listener,
runtime/configuration change, Receiver operation, or Game work was performed. Raw target/turn
identifiers and delegation metadata remain private.

**VERIFIED:** current host-mediated same-task input and exact response, classified as
`response_in_joined_turn_observed`. **UNVERIFIED:** B1 independently starting a new turn; Q1 was
processed first, so it confounds exclusive wake attribution. Its later consumption does not prove
that the earlier CLI queue independently woke the task. The observed input role is specific to
this control, not a universal promise about all task messages or a trusted delivery receipt.

Do not repeat this control or send a native B1 automatically. A later submission needs a new
explicit allowance. The remaining product gap is an invocation usable by the existing Connector
outside an active Agent turn, with legitimate host caller/approval handling, followed by private
binding and notification settlement. No platform alteration is proven necessary by this result.

### Observer correction

The previous observer read a `functionCallOutput` only when `output` was a string. The real control
returned an object, so the same shape was missed by that parser. A Red equivalent-shape fixture
returned `not_observed` instead of `response_in_joined_turn_observed`. The narrow correction now
recognizes the observed untruncated named/namespaced envelope, retains exact prompt and role
matching, rejects truncated/malformed/foreign envelopes, and preserves joined-turn attribution.
The fixtures use fake identities and the harness's fixed prompt, not copied private task content.
No extra live call, production Adapter or native-CLI enablement was added.

### Core reconciliation and integration boundary

Core/00, Core/05, Mechanism 04 and TASK-035 now distinguish original real MVP1 Browser/WebMCP proof,
Core/Cloud composition with deterministic Agent seams, current host-mediated joined-turn response,
and the unintegrated product Connector. Remove the already completed static review from the next
action list. The README no longer promotes the old probe's Node/caller environment assumptions to
a universal live-route contract. Node 24 remains the reproducible local test baseline.

This turn's fetch also discovered `origin/Eyad/Full-Integration` at `41aae5d`. A read-only diff and
its new test-app README show an isolated SDK consent/status consumer that explicitly stops before
later Events, WebMCP registration or Agent launch. No branch was created, switched or merged; this
is not contrary evidence of an already integrated product wake driver.

The next code-bearing product increment must specify the actual invocation available to the
existing Connector outside an Agent turn, including host-mediated caller/approval handling. The
MVP task-launched relay is the known working reference, but copying its pipe into a detached
Connector is not equivalent. Full relay reproduction would add listener/Browser authority beyond
ADR-0047 and therefore needs a concrete scoped decision. Do not solve this boundary by another
fake full-chain test, fresh Agent, caller impersonation, permission override or a new product
Connector. Private binding and notification settlement follow the selected invocation contract.

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
  launcher has not been reproduced on the current build. Receiving-side source inspection found
  no active-caller-turn gate in the MCP messaging path; this is not a runtime admission proof.
  We have not bypassed peer authorization or altered the App.
- The local Desktop launcher uses stdio. Its conditional shared-daemon branch is excluded by the
  App-tool configuration supplied on the normal local path.
- A later control through the exposed App task tools received an exact response in the same
  existing task. Its input was `functionCallOutput` after an older queued input in the new turn;
  isolated wake attribution and independent Connector invocation were not established.

Could you confirm:

1. Is there a supported third-party enrollment and notification entry point for an existing
   Desktop-owned task, rather than creating a new task or independently resuming its stored history?
2. What is the intended client entry point for an independently running Local Connector, and
   how should it preserve caller identity and upstream App approval? Is the original task-launched
   relay topology permitted, including after that source turn finishes? Please identify any actual
   signing, lifecycle or registration requirements; we are not assuming a new delegation token is
   needed. Are any documented Remote Control extension points intended for this use?
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

## Follow-on intended-client review closure

Scope: this record and TASK-035 only. This is an Assured admission review with no new product
behavior, authority, or product-runtime execution. Core/00 and Mechanism 04 already keep legitimate
admission and product adoption unverified, so their claim ceilings remain current. Concurrent
Core, pairing, SDK, Connector, Game and RightSpot edits remain owner-held and outside this scope.

The official App Server page was fetched again; its transport and thread primitives still do not
establish the required Desktop-owned join. Installed launcher/plugin sources were read without
loading their modules. No signing addon, bundled runtime, listener, native IPC, test message,
Receiver request, credential, App setting or deployment was used or changed. A bounded related-task
lookup produced no additional verifiable admission result; missing turn items are unavailable
evidence, not proof that another task has no implementation.

`/opt/homebrew/opt/node@24/bin/node --test mvp/test/desktop-task-adapter.test.mjs` passed 4/4
unchanged frozen tests using an in-memory database and an injected fake client. This verifies the
root-versus-child capture assertion and fixture behavior only, not actual caller legitimacy or
App wake. No product aggregate was reopened by these source/document-only changes.

Repository validator unit tests passed 6/6; scanner unit tests passed 3/3; indexed repository
validation passed. The two owned documents have no sensitive-pattern, CJK, or raw UUID-shaped
locator matches. The whole-repository scanner still reports 21 pre-existing findings in seven
Game documents, all unchanged against HEAD and outside this increment. That is not a green
whole-repository scan. Independent review kept the diagnostic gate separate from the background
product lifecycle and avoided preselecting an invocation-token model.

The intake branch was shared
`main`, 51 commits ahead of fetched `origin/main`, none behind, with an empty index. No new branch,
external coordination message or push is included.

## Host-mediated control and observer correction closure

This increment covers nine documents and the experimental observer source/test pair, eleven files
in total. It records the executed control above, corrects current Core/Mechanism/index/task claims,
and adds only the observed untruncated tool-output envelope to the local parser. ADR-0047 clarifies
the method within the same disposable target and one-send allowance; ADR-0046's selected product
behavior, durable authorization, and notification-only settlement are unchanged.

Verification on Node `24.20.0`:

```sh
/opt/homebrew/opt/node@24/bin/node --test --test-name-pattern='host-mediated output envelope' runtime/experimental-desktop-bridge/test/probe-bridge.test.mjs
/opt/homebrew/opt/node@24/bin/node --test runtime/experimental-desktop-bridge/test/probe-bridge.test.mjs
/opt/homebrew/opt/node@24/bin/node --test runtime/experimental-desktop-bridge/test/native-client.test.mjs runtime/experimental-desktop-bridge/test/probe-bridge.test.mjs runtime/experimental-desktop-bridge/test/probe-cli.test.mjs
/opt/homebrew/opt/node@24/bin/node --check runtime/experimental-desktop-bridge/src/probe-bridge.mjs
python3 scripts/test_validators.py
python3 scripts/test_sensitive_scan.py
python3 scripts/validate_repository.py --root .
python3 scripts/scan_sensitive_patterns.py --root .
```

- The first command was Red before the fix: the equivalent object envelope yielded `not_observed`
  instead of `response_in_joined_turn_observed`. The complete observer suite then passed 38/38;
  the experimental aggregate passed 110/110, including the native-client and fail-closed CLI suites.
  Syntax validation passed. These are injected-client/local-fake-socket regression tests, not
  additional App submissions, native admission or Receiver/SDK/Game verification.
- Repository validator unit tests passed 6/6 and sensitive-scanner unit tests passed 3/3.
  Repository validation passed with exactly the eleven owned files in the index. Whitespace checks
  passed, and the owned files have no sensitive-pattern, unintended CJK or raw UUID-shaped locator
  matches. No raw task/turn/caller identifiers or live task content were persisted.
- The whole-repository sensitive scanner still reports 21 existing findings in seven Game documents
  outside this increment. All seven are unchanged against HEAD. No suppression or unrelated edit
  was made; this is not a green whole-repository scan.
- Independent read-only review found no remaining blocking parser or claim-boundary issue after
  correcting allowance, execution-state and role wording. It preserves the earlier-Q1 confound and
  does not equate a recognized tool-output shape with authenticated notification settlement.

The runtime closure is **host-mediated same-task input/response verified, joined-turn attribution
only**. The observer correction is **locally verified**. Product Connector invocation, durable
binding, trustworthy notification settlement, isolated wake, and current Browser/WebMCP integration
remain open. The single allowance is consumed; no further control/native send is authorized by
these tests or by local Git closure.

Git delivery is local-only on shared `main`. Intake was `1e05485`; the concurrent owner topology
commit `79749cd` was preserved before reviewing and staging this increment. The branch was 56
commits ahead of fetched `origin/main`, none behind, before this commit. Publishing that unrelated
history is outside this increment. No branch creation, switching, merge, push, deployment or package
publication is included. Concurrent Receiver/SDK/Connector, TASK-033, Game, RightSpot and untracked
work remain outside the eleven-file staging scope. The new remote test-app branch was inspected
read-only; no adoption or integrated Agent claim follows from its existence.
