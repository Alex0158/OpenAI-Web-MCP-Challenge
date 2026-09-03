# Re-entry Core — Product Requirements

**Role:** CANONICAL mechanism-level user behavior  
**Status:** Target application-neutral requirements baseline with Sleepless Kingdom specialization
selected; application and external continuation evidence remain bounded and incomplete  
**Last updated:** 2026-09-03

## 1. Requirements objective

Define the observable behavior every acceptable demo application must implement to prove
the selected re-entry workflow. ADR-0042 selects Sleepless Kingdom; its scoped documents add the
domain-specific Game contract without moving Game rules into this application-neutral baseline.

These requirements define target behavior. They do not imply that every requirement is
implemented or verified; current evidence status is owned by [Core/00](00-current-status.md)
and [Core/05](05-validation-and-evidence.md). Detailed protocol, authority, delivery, activation,
and re-entry contracts are routed through the [Mechanism index](../Mechanisms/README.md).

ADR-0043 through ADR-0045 accept additive standing authorization, independent-Receiver conformance,
and explicit v0.2 transport. RECORE-007 locally verifies the application-neutral low-level Host
SDK/HTTP/Core/Connector/Adapter chain; CLOUD-023 separately records the active Receiver's locally
verified working-tree kernel and additive migration. Public standing controls and pinned release
remain open under TASK-028/TASK-033. The selected Game, normal Host facade, product Connector, and
external chain remain bounded by their v0.1 or unintegrated behavior; neither local result proves
those consumers.

## Selected-product requirements amendment

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) requires trusted enrollment of the user's selected existing task, persistent
private binding, and later notifications to that same task without another Consent per signal.
Event context cannot replace the user's strategy or mandate a Game command. Notification delivery
settles independently of Game effects; the Agent may take no action, and interrupted work need not
be recovered by the Receiver. Missing binding fails visibly, never by creating a fresh task.
The journey and acceptance below use this target; frozen effect-backed protocol requirements
remain compatibility contracts until TASK-029's explicit transition is accepted and implemented.

## 2. Abstract end-to-end journey

1. A workflow participant opens a record in the host web application.
2. The Agent reads the same current state through page-provided WebMCP tools.
3. The Agent helps create or update a visible artifact.
4. The user reviews a plain-language future re-entry offer and grants one bounded event.
5. The user may leave the page and the Agent turn may end.
6. Another actor or system creates the authoritative state transition later.
7. The Receiver authenticates the event and records one bounded pending delivery.
8. An available continuation adapter activates the intended Agent workflow.
9. The Agent returns to the canonical record page and reads current state.
10. The page exposes tools appropriate to the new stage.
11. The Agent continues the same artifact or decision process.
12. The Agent stops at the defined human boundary.
13. The user reviews the outcome and the system records a receipt.

### Sleepless Kingdom specialization

For the first selected slice, the workflow participant is a shelter owner, the persistent decision
is a gatherer mission, the external state change is server-owned monster combat, and the one eligible
event is `CargoLostToMonster`. The canonical page must expose the four current-state reads and may
register `force_recall_soldier` only when live continuation and mission state permit it. The ordinary
human UI remains complete, and migration, siege, destructive upgrades, irreversible recovery, and
actions outside the accepted G2 recall envelope remain human-confirmed.

Current implementation and proof remain owned by the scoped
[`WebApp/Web-Game/Docs/00-current-status.md`](../../WebApp/Web-Game/Docs/00-current-status.md), not by
this target requirements document.

## 3. Experience principles

- Use the selected domain's language, not internal protocol terminology, in the user interface.
- Explain the trigger, scope, expiry, v0.1 run budget or v0.2 one-active limit, and consequence before permission.
- Show the current record, stage, re-entry reason, Agent activity, and human boundary.
- Never present a prepared artifact as approved, committed, published, or submitted.
- Keep the host application's normal human workflow usable without the Agent.
- Make failure visible and recoverable; do not substitute hidden automation.

## 4. Mechanism requirements and acceptance criteria

### WR-01 — Share authoritative current context

**Story:** As a workflow participant, I want the Agent to understand the same current record
and stage that I see so its help is grounded in the application.

**Acceptance criteria:**

- The page visibly identifies the current record, workflow stage, artifact status, and relevant constraint.
- A read-only Site Tool returns the same authoritative state in bounded structured form.
- Missing, inaccessible, or stale records return clear non-destructive errors.
- The human path remains usable when no Agent is connected.

### WR-02 — Create visible, revisable work

**Story:** As a workflow participant, I want Agent work to appear inside the host application
so I can inspect and change it before commitment.

**Acceptance criteria:**

- The Agent can prepare or update one domain artifact through a narrow Site Tool.
- The result appears in the normal human interface.
- The artifact remains visibly marked as draft or proposed until the human boundary is crossed.
- Writes validate expected workflow state and artifact revision.
- A stale write preserves the newer version and returns a visible conflict.

### WR-03 — Offer future re-entry without granting it

**Story:** As a workflow participant, I want to understand when the application may ask the
Agent to return before I authorize anything.

**Acceptance criteria:**

- The application describes one legitimate future event in domain language.
- The offer identifies the record, purpose, canonical return location, separate offer and
  requested Grant expiries, v0.1 maximum runs or v0.2 standing/one-active scope, and human boundary.
- Merely viewing or invoking the offer creates no continuation authority.
- The offer is bound to the current origin and workflow record.

### WR-04 — Grant minimum future authority

**Story:** As a workflow participant, I want to approve only the future event I need.

**Acceptance criteria:**

- Permission is confirmed through a user-controlled Receiver or Agent-host surface.
- The user can approve, narrow, or decline the requested scope.
- Approval creates a visible grant summary and an opaque binding for the host app.
- Declining leaves the current workflow usable and creates no binding.
- The user can later inspect and revoke the grant.

### WR-05 — Wait safely after the session ends

**Story:** As a workflow participant, I want the business workflow to remain resumable after
I leave without causing background work before the authorized event.

**Acceptance criteria:**

- The page can close or navigate away and the Agent turn can end.
- Waiting creates no workflow mutation or event-authorized continuation. If a bounded pull
  adapter is used, empty checks are explicitly time-bounded, separately recorded, and never
  reported as event delivery; perpetual polling is not required by the mechanism.
- The Grant retains scope, expiry, and revocation; v0.1 retains its remaining run budget,
  while v0.2 retains accepted sequence and active-slot state without consuming the Grant.
- Ending the page session does not falsely mark the business workflow complete.

### WR-06 — Emit one bounded authoritative event

**Story:** As the host application, I want to report the selected state transition without
injecting instructions into the Agent.

**Acceptance criteria:**

- The MVP emits exactly one allowlisted event type.
- The event contains only its opaque Host binding, issuer, workflow, event ID, correlation,
  event sequence, business state version, timestamp, event type, and canonical URL.
- Version `0.1` has no event-specific payload; the canonical page supplies current business
  state after re-entry.
- The event has no arbitrary Agent instruction or prompt field.
- Invalid, duplicate, expired, mismatched, or out-of-order events do not create another
  accepted delivery or run.
- Every acceptance or rejection appears in the audit timeline.

### WR-07 — Deliver only to the intended Agent workflow

**Story:** As a workflow participant, I want an accepted event to become pending only for the
context I authorized, and I want any later activation to resume that context rather than
unrelated Agent work.

**Acceptance criteria:**

- Receiver acceptance resolves one active Grant and records one pending delivery carrying its
  private receipt. At activation, the selected adapter authority resolves that receipt's
  `grant_id` to one live adapter-private context binding.
- The host app receives only an opaque workflow binding and never receives a Receiver Grant ID,
  Connector or Agent credentials, or a raw platform thread identifier.
- The event, delivery target, Local Connector caller, and activation cannot select or carry the
  raw context locator.
- v0.1 run budget and delivery reservation are atomic; v0.2 atomically reserves the next
  sequence and one active slot without consuming standing authorization.
- An activation or resume failure produces a visible retry-safe status without broadening
  application authority.
- The resumed experience identifies the record and reason for return.

### WR-08 — Re-enter and revalidate the canonical page

**Story:** As a workflow participant, I want the Agent to check the current application state
before continuing so it cannot act from a stale notification.

**Acceptance criteria:**

- The resumed run opens an allowlisted canonical origin and workflow URL.
- The page verifies current identity and workflow authorization.
- The Agent reads current stage and state version through a Site Tool.
- Event data alone cannot authorize a mutation.
- Origin, identity, workflow, state, or auth mismatch stops before mutation.

### WR-09 — Discover a changed tool surface

**Story:** As a workflow participant, I want the Agent to see only actions valid for the new
stage so the continuation is bounded and understandable.

**Acceptance criteria:**

- At least one Site Tool is available only before the asynchronous transition.
- At least one different Site Tool is available only after re-entry.
- Tools invalid for the current stage are absent or reject invocation.
- Tool names, descriptions, schemas, and outputs are narrow and domain-specific.
- A read-before-write path exists for the resumed stage.

For Sleepless Kingdom, the target initial-only role is the Game-specific cargo-loss Re-entry consent
action and the resumed-only mutation is `force_recall_soldier`. The current Game has verified the
four shared reads and implemented conditional recall locally; initial enrollment and genuine dynamic
recall after external Re-entry remain open.

### WR-10 — Continue the same work and stop for the human

**Story:** As a workflow participant, I want the Agent to continue the same artifact or
decision process while I retain control over the consequential outcome.

**Acceptance criteria:**

- The resumed run loads the prior artifact and current revision.
- The Agent can prepare the next-stage draft or proposal through the current page.
- The human interface shows what changed and why the workflow returned.
- The Agent cannot cross the defined human boundary.
- Human approval, rejection, or editing produces a visible result and correlated receipt.

### WR-11 — Inspect and revoke continuation authority

**Story:** As a workflow participant, I want to know what I authorized and stop future runs.

**Acceptance criteria:**

- The control surface shows origin, workflow, event, expiry, remaining runs, last event, and last run.
- Revocation prevents later events from creating accepted deliveries or later activations.
- A race between revocation and delivery follows a documented atomic rule.
- Revocation does not delete the workflow record, artifact, or audit history.

## 5. Required empty and failure states

Every selected app must express these states in its own domain language:

- no Agent connected;
- no initial artifact yet;
- no active grant;
- grant declined, expired, revoked, or exhausted;
- duplicate, invalid, wrong-scope, or out-of-order event;
- continuation adapter unavailable;
- browser or canonical URL cannot open;
- application authentication expired;
- workflow changed again before action;
- expected Site Tools absent;
- human and Agent artifact revisions conflict;
- user rejects the Agent's prepared work.

## 6. Non-functional requirements

- **Traceability:** Grant, event, accepted delivery, activation, run, tool mutation, artifact revision, and human decision share a correlation path.
- **Idempotency:** Retried delivery cannot produce duplicate accepted work, runs, or effects.
- **Least privilege:** Authority is limited by origin, workflow, event, time, the selected run/active-slot profile, and human boundary.
- **State freshness:** Every mutation validates current business state and expected revision.
- **Judge reproducibility:** A fresh evaluator can complete the loop from one public entry point with documented setup.
- **Privacy:** Events and logs contain only the minimum identifiers and state metadata.
- **Accessibility:** Critical state and controls are available through a normal, understandable human interface.
- **Fail-safe behavior:** Uncertain authority or stale state stops before mutation.

## 7. Mechanism-level non-goals

The challenge MVP will not:

- become a general cross-site continuation standard;
- support multiple host applications or Agent platforms in the happy path;
- implement production multi-tenant administration;
- delegate an undefined consequential action to the Agent;
- require a site-owned second LLM merely to demonstrate the mechanism;
- add multiple event types before one complete loop works;
- claim universal browser, identity-provider, or authentication continuity;
- use the tender scenario as the default app without an explicit selection decision.

## 8. Selected domain specialization

ADR-0042 and the scoped Game authority define:

- named user and external actor: shelter owner and authoritative world worker/monster;
- concrete persistent object: shelter-scoped mission, attempt, causal history, signal, and recall
  decision;
- initial and resumed states: dispatched gatherer before absence, then current loss/reissue state;
- one exact event type: `CargoLostToMonster`;
- tool inventory: four shared reads, target initial consent action, and conditional resumed recall;
- human decision boundary: migration, siege, destructive upgrades, irreversible recovery, and
  actions outside the G2 recall envelope;
- user-visible terminology and typed stale/in-combat/ownership failures;
- deterministic `sleepless-mvp-01` fixture and fresh-world reset; and
- server-owned state, revisions, ownership, idempotency, causal provenance, and scope isolation.

The selection record is complete. Implementation, external integration, hosted continuity, and
judge evidence still have to pass the vertical-slice acceptance below.

## 9. Selected-app vertical-slice acceptance

The selected-app mechanism slice is accepted only when one clean run demonstrates:

1. genuine initial Site Tool discovery and invocation;
2. visible Agent-prepared work in the host app;
3. one plain-language, user-approved future event;
4. an ended page session or Agent turn;
5. one authoritative state transition;
6. one accepted event recorded as bounded pending delivery;
7. activation and resume of the intended Agent workflow through an available continuation adapter;
8. canonical page re-entry and fresh state read;
9. discovery and invocation of a different resumed-stage Site Tool;
10. continuation of the same artifact or decision process;
11. preservation of the human decision boundary;
12. safe duplicate and invalid-event behavior;
13. a correlated, judge-reproducible evidence trace.

One cycle is compatibility or component evidence, not selected standing-mode acceptance.
ADR-0046 and TASK-033 require two notifications under one Consent and the same trusted existing-task
binding, bounded busy-task handling, restart/replay safety, and revocation rejecting subsequent
delivery. Prove both a lawful action and a deliberate no-command branch after fresh page reads.
Interrupted work or absent Game effects must not cause redelivery. Notification confirmation,
actual Agent wake, and business effects remain separate evidence. The earlier effect-backed
two-cycle trace is retained compatibility evidence, not selected-product acceptance.
