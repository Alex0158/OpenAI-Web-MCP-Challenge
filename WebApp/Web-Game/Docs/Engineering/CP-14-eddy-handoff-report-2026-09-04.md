# CP-14 Eyad Handoff Report: Standing v0.2 and Bound-Task Re-entry

**Date:** 2026-09-04  
**Purpose:** Copy/paste release handoff for the Re-entry Core, Host SDK, Local Connector, and Cloud Receiver release owner  
**Scope:** Sleepless Kingdom Game integration for the hackathon prototype  
**Status:** Local implementation candidate is ready for source-pinned conformance; Eyad publication, deployment, and hosted readback remain open.

## Message to Eddy

Hi Eddy,

We need an exact compatibility readback for the Sleepless Kingdom Game CP-14 integration. The Game-side signal publication and local delivery-port slice are already implemented and locally verified. The remaining cross-runtime work is to connect that Game signal to the standing v0.2 Re-entry path and demonstrate the approved continuity behavior in a controlled, reproducible way.

Please review the target and the questions below against the current Re-entry Core, Host SDK, Local Connector, and Cloud Receiver source. We are asking for concrete versions, commits, routes, schemas, and conformance evidence. Please do not infer compatibility from package names or matching terminology.

## 1. Selected product target

The selected hackathon story is **bound-task notification continuation**:

1. A user and an Agent agree on a strategy in one existing Agent task.
2. One informed standing Consent and Grant establish a trusted, restart-safe association with that exact existing task.
3. The continuously running Game later emits an eligible `CargoLostToMonster` signal.
4. The Receiver and Connector deliver a bounded notification to the same enrolled task without a new manual user message and without creating a fresh task.
5. The Agent returns to the authenticated canonical Game page, reads current state and genuine WebMCP capabilities, and decides whether to act, do nothing, or ask for a human decision.
6. A later eligible signal reuses the same Consent, Grant, and task.

This target is accepted in outer `ADR-0046-restore-bound-task-notification-continuation.md` and scoped to the Game in `ADR-GAME-0039-cp14-bound-task-notification-adoption.md`.

The Game remains real-time and server-authoritative. Its world clock, mission state, combat, cargo, cooldown, coalescing, persistence, and `ReentryDeliveryPort` behavior do not change for this integration. A notification is a bounded trigger context, not a new system prompt or an instruction to execute a Game command.

## 2. Boundaries that must remain separate

Please preserve these separate observations in the implementation and evidence:

- Game state mutation and durable signal publication.
- Receiver queue acceptance.
- Trusted notification handoff to the enrolled task.
- Actual Agent wake or turn start.
- Authenticated page read and WebMCP capability discovery.
- Optional Game command and its server-side result.
- Any resulting business effect.

Receiver delivery must settle at the agreed trusted notification-handoff boundary. It must not wait for an Agent turn, a Browser read, a WebMCP call, or a Game effect. A `202`, a generic `accepted`, process exit, or Agent narration is not proof of those later observations. Deliberate no-action, interruption, and response-loss recovery must remain representable outcomes.

## 3. Facts currently verified on our side

These are the facts we have read from the current repository and candidate Receiver source:

### Game

- The Game owns authoritative world time, worker missions, position, cargo, combat, settlement, visibility, event history, and the local publication outbox.
- `src/server/reentry-delivery-port.ts` is transport-neutral. It selects and publishes one durable eligible Game signal; it does not claim or ACK a Cloud Receiver delivery.
- `CargoLostToMonster` remains the first selected signal. Existing cooldown and burst coalescing remain in force.
- The Game-side local-stub port and its evidence are complete for their named local scope. They do not prove external notification, same-task wake, genuine WebMCP action, independent browser contexts, or hosted continuity.
- The selected Game integration is explicitly same-task continuation. Fresh-task fallback, task search, raw task locators, Game-side Cloud leases, a second queue, and per-event Thread messages are forbidden.

### Re-entry Core and Receiver candidate

- Eddy's Game-facing Core, Host SDK, and Local Connector source is already present in the outer `main` history; this handoff is a compatibility/release-contract request, not a request to merge a pending Eddy branch.
- The Cloud Receiver backend remains a separate `saas-boilerplate` deployment boundary. The Game tree intentionally contains no Receiver runtime, and the Game team will not duplicate or silently replace that service.
- The candidate Receiver is the nested `saas-boilerplate` repository on branch `Re-Entry`, currently observed at commit `0195a9846024c4f65c62d3922069970ad1b96b92`.
- Its fixed Core source pin is commit `1446d73aa3e66533547471728ad8fa5344d51f9e`, with source hash `6210d7724417e0533c77d5989e8ffdd3c404af4063ac9d70d70db9b622f73d45`.
- The source-pin test passes `16/16` and proves source identity and drift fencing only. It does not prove release conformance, production deployment, or the Game trace.
- The candidate Receiver exposes the additive v0.2 routes for `/v0.2/events`, `/v0.2/delivery-claims`,
  `/v0.2/delivery-acknowledgements`, and `/v0.2/delivery-notification-handoffs`, plus the reviewed
  account-first Consent/Grant control routes.
- Receiver app composition now has an explicit server-side
  `createApp({ standingRuntimeAdmissionAuthority })` seam. The default app remains fail-closed when
  no real runtime authority is supplied; this seam is not itself runtime admission evidence.
- The Receiver's own readback currently reports release conformance as false. The candidate must therefore be treated as a source-pinned integration candidate, not as an already accepted production contract.

### Published packages

- Public Host SDK package: `@4xeoz/re-entry-sdk`, latest observed NPM version `0.3.2`.
- The local `runtime/host-sdk` package is version `0.3.1` and the reviewed public server source exposes the simple v0.1 surface (`createHostSdk`, `createReentry`, and v0.1 control routes). No public standing/v0.2 export was verified.
- Public Local Connector package: `@4xeoz/re-entry`, latest observed NPM version `0.2.20`.
- The private `reentry-core` package is `@webmcp-challenge/reentry-core@0.1.0`; it contains standing helpers and a reference signer, but it is not a substitute for a reviewed public Host SDK/Connector release.
- The Game currently has no SDK dependency. We will not install NPM `latest` or import the private Core signer directly as a compatibility shortcut.

## 4. Problems and compatibility gaps to resolve

### A. No verified public standing Host SDK contract

We cannot identify a released public package that exposes the complete standing Consent, Grant, event, binding, notification, and receipt behavior required by the selected target. The current public Host SDK surface is v0.1-oriented, while the candidate Receiver uses v0.2 route names.

We need an exact standing-capable package version (or an explicit reviewed source artifact), its public exports, integrity, Node/runtime floor, and a compatibility test command.

### B. Consent enrollment does not yet prove existing-task binding

The selected target requires enrollment to bind one approved Grant to one existing Agent task. Receiver authority may select the eligible account/device, but it must not invent or expose a task locator. The Connector/Adapter must privately capture, verify, persist, and recover the binding.

We need to know where enrollment starts, what object is returned, how owner and scope are checked, how the binding survives Connector restart, how revocation fences future delivery, and how intentional rebinding differs from a fallback.

### C. Receiver, Connector, and Core terminology may not mean the same thing

The source contains v0.2-looking routes and standing helpers, but matching names do not prove identical signed fields, state transitions, lease ownership, or receipt semantics. We need one authoritative contract version and exact source references for every artifact used in the trace.

### D. Notification receipt and delivery completion are not closed

The selected product settles delivery at trusted notification handoff. Existing effect-backed ACK or `effect_token` behavior must not be reused or silently reinterpreted as that receipt. We need explicit rules for accepted, duplicate, out-of-order, revoked, expired, wrong-scope, busy, interrupted, response-lost, and unknown outcomes.

### E. Busy-task and high-frequency event behavior is unresolved

Game events can be frequent. The Receiver/Connector must not send one Thread message per attack or loss, and must not starve the existing task with repeated wake attempts. We need the exact one-active/backpressure/coalescing policy, ordering rule, retry budget, and what remains pending after a task is busy or interrupted.

### F. Actual same-task wake and Browser/WebMCP proof is separate from queue proof

A queue response or process exit does not prove that the existing task woke, returned to the right authenticated page, discovered real WebMCP tools, or chose an action. We need a reproducible way to observe each boundary independently, including a deliberate no-command branch.

### G. Source identity is fenced, but release and hosted conformance are not

The pinned source test protects against drift in the inspected candidate. It does not establish that the deployed Receiver, published packages, and Core source are the same build or that the release conformance matrix passes. We need a release manifest and hosted readback before calling the path compatible.

### H. Cross-scope and secret-custody failure modes must be explicit

The Game must never select a task, player, shelter, or binding from an untrusted Event field. Raw task locators, Clerk credentials, API keys, and signing secrets must stay out of Game payloads, Agent prompts, browser URLs, logs, and tracked evidence. Wrong owner, wrong player, wrong shelter, stale revision, revoked grant, and unavailable task must fail visibly and fail closed.

## 5. Minimum contract we need from the external stack

Please provide the following exact information, preferably in one versioned contract note and one reproducible conformance package.

### 5.1 Host SDK / enrollment

- Package name, immutable version, Git commit, tarball integrity, exports, and Node 24 compatibility.
- Standing Consent and Grant creation, status, expiry/lifetime, revoke, and renewal operations.
- How the user selects an already existing Agent task during enrollment.
- How the task binding is captured and verified without exposing a raw platform locator.
- What private store owns the binding and how restart/recovery works.
- How an Adapter proves it is the same authorized owner/device/task.

### 5.2 Receiver event ingress

- Exact v0.2 route, method, authentication, signature, and required headers.
- Exact request and response schema for a Game Event.
- Required identity fields: `event_id`, `event_sequence`, `event_type`, `occurred_at`, `state_version`, workflow/correlation identity, target scope, and bounded canonical return location.
- Duplicate, replay, gap, out-of-order, wrong-scope, revoked, expired, malformed, and unsupported-version behavior.
- Whether queue acceptance is synchronous or asynchronous and the precise meaning of `202`.
- Retention, retry, backpressure, one-active slot, and coalescing semantics.

### 5.3 Delivery claim and notification handoff

- Exact claim/lease/attempt/expiry state machine and owner of each lease.
- The trusted notification-handoff receipt: fields, signature, correlation, deduplication key, and recovery after response loss.
- Whether the receipt means only “handed to the Connector/task scheduler” and never “Agent completed work”.
- Busy, interrupted, unavailable, and unknown-outcome behavior.
- Explicit revocation and subsequent-delivery fencing.

### 5.4 Local Connector / Agent Adapter

- Exact package/source version used by the Receiver candidate.
- How it resolves the private bound existing task, wakes it, and prevents accidental fresh-task creation.
- How it enforces one active notification per task and handles a burst.
- How it records notification handoff separately from Agent wake, page read, tool call, no-action, human decision, and effect result.
- How Connector restart, process loss, and duplicate delivery preserve binding and avoid uncontrolled duplicates.

### 5.5 Game adapter join

- The exact Game Event mapping from `ReentryDeliveryPort` to the Receiver request.
- Which values are assigned by the Game server versus the Receiver/Connector.
- The canonical hosted Game URL/path and authenticated session expectations.
- How the Agent obtains current page state and genuine WebMCP tools after wake.
- Which field carries only an opaque binding/correlation value and never a raw task locator.
- The exact response/receipt the Game adapter may persist, and which outcomes remain external evidence only.

### 5.6 Conformance and hosted evidence

Please provide commands and redacted evidence for at least:

1. One Consent, one Grant, one existing task, and two ordered Game signals.
2. Same-task continuation without a fresh task.
3. Deliberate no-action and optional action branches.
4. Duplicate, replay, out-of-order, wrong-owner, wrong-player, wrong-scope, revoked, and expired cases.
5. Connector restart with binding preservation.
6. Busy-task burst/coalescing and bounded retry behavior.
7. Response loss/unknown outcome without blind resend.
8. Actual authenticated page read and genuine WebMCP discovery, recorded separately from queue/handoff.
9. Release artifact/source identity matching the deployed Receiver.

For each row, include expected outcome, observed outcome, event/sequence/correlation IDs, source/runtime identity, and the exact claim limit. Do not use raw credentials or platform task locators in the evidence.

### 5.7 Ownership recommendation (superseded by the owner decision below)

- Source code exists in the current `main` history and in the Receiver candidate, but the standing
  v0.2 path is not yet a verified public release. Do not treat source presence as release or
  compatibility evidence.
- For this hackathon increment, the project team owns implementation of the reviewed Core, Host SDK,
  Local Connector, Receiver, and Game adaptation paths under `ADR-0049` and `TASK-036`.
- Eyad remains the release owner: after the local freeze and exact conformance gates, Eyad publishes
  uniquely versioned packages, deploys the exact Receiver commit and migrations, supplies the real
  runtime admission authority through the server-side app-composition seam, and returns hosted
  readback. This does not transfer namespace, signing, deployment, or permanent maintenance
  authority.
- We will not fork an unrelated package, import a private Core signer into the Game, use `latest`,
  create a fresh-task fallback, or silently change the Receiver contract. An immutable reviewed Git
  ref or tarball remains acceptable only when its identity matches the deployed Receiver and the
  source-pinned conformance evidence.

## 6. What the project team has implemented and will do next

The owner has authorized the project team to implement the exact named source paths under
`TASK-036` and `ADR-0049`. The current local increment is complete for its named contract scope;
the remaining work is to freeze provenance, obtain a legitimate same-task runtime adapter, and
prepare the hosted handoff. The team has:

- Reconcile `SK-TASK-076`, Validation/89, current status wording, the seam map, and any stale fresh-session/effect-ACK language with `ADR-0046` and `ADR-GAME-0039`.
- Add a server-only, typed mapping behind the existing `ReentryDeliveryPort`.
- Add the one process-owned Game delivery runner and the explicit Receiver runtime-authority
  composition seam; keep both fail-closed until a real production authority is supplied.
- Preserve Game-owned event identity, sequence, scope, idempotency, and publication lease.
- Write focused Red tests for accepted, duplicate, unknown, wrong-scope, revoked, expired, out-of-order, and one-active outcomes using the exact external contract.
- Keep Game publication, Cloud queue, notification handoff, Agent wake, page read, optional action, and effect evidence separate.
- Run only the smallest affected verification first, then the cross-functional matrix required by CP-14. We will not add a second queue, hidden retry loop, credential transport, fresh-task fallback, or Game-side Cloud lease.
- Update the owning Game ADR, task, evidence, and validation records before closing the increment.

The exact file-level implementation and release/readback sequence is recorded in
[`CP-14 release packet`](CP-14-eyad-release-packet-2026-09-04.md). The packet is the handoff
artifact for Eyad; it does not claim that publication or hosted continuity has already happened.

## 7. Specific questions for Eddy

Please answer these directly:

1. Which exact Receiver commit/ref is the integration target, and which deployment is built from it?
2. Which exact Core, Host SDK, and Local Connector artifacts are compatible with that Receiver ref?
3. Is there a released public standing Host SDK/Connector package? If yes, provide immutable versions, exports, integrity, and install/test commands. If no, identify the reviewed source artifact and owner of the release gap.
4. What is the public enrollment route that binds an informed Consent/Grant to an existing task, and what is the private binding lifecycle?
5. What exact receipt proves trusted notification handoff, and which later observations are intentionally outside that receipt?
6. What is the one-active/busy/coalescing policy for repeated Game signals to the same task?
7. How do restart, duplicate delivery, response loss, revocation, expiry, wrong owner, and unavailable task converge?
8. How is the authenticated canonical Game page and genuine WebMCP capability acquired after wake, without putting secrets or raw task locators into the Event or prompt?
9. Which conformance command and redacted trace prove the deployed artifacts match the pinned source?
10. What is the smallest supported vertical trace you recommend we implement first for the hackathon, and what must remain explicitly out of scope?

## 8. Stop conditions

We will pause the Game adapter at the contract boundary if any proposed path requires guessed routes, an unpinned `latest` package, direct private-Core imports, fresh-task fallback, raw task locators in transport, per-event Thread flooding, a hidden retry, effect-backed reinterpretation of notification receipt, client-selected identity, or a Receiver-side monitor of Game business effects.

The objective is a small, honest, judge-reproducible Re-entry demonstration. We need the narrowest complete standing path with clear evidence, not a larger set of partially compatible surfaces.

Thanks. Please use this report to identify the exact missing artifacts and the smallest compatible implementation path.

## 9. Owner decision update — 2026-09-04

The project owner has now selected a bounded ownership change for the current hackathon increment.
The prior recommendation in Section 5.7 that Eddy implement the external Core, Host SDK, Local
Connector, and Receiver surfaces is superseded for this increment only. The current project team is
authorized to implement the exact named source paths in the outer repository and the nested
`saas-boilerplate/backend` repository under [ADR-0049](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md)
and [TASK-036](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md).

Eyad remains the release owner. After the implementation passes its focused conformance, security,
source-identity, and hosted-readiness gates, Eyad will publish the reviewed package versions and
deploy the exact Receiver commit. We will provide an immutable release packet containing source
SHAs, package/tarball integrity, migration identity, runtime commands, redacted traces, and
readback steps. We will not claim a public package, deployed Receiver, or hosted continuity from
local source presence or an attempted deployment.

This decision does not change the selected product target, finite v0.2 compatibility profile,
same-task requirement, one-active/backpressure policy, Game authority, or the prohibition on fresh
task fallback. It also does not authorize secrets, raw task locators, `npm latest`, effect-token
reuse, or direct edits to the Game's read-only `reentry-core/` and `mvp/` dependency boundary.
The external implementation and release plan are now actionable; runtime and hosted claims remain
open until their named evidence exists.
