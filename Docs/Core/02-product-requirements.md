# WebMCP Re-entry Workflow — Product Requirements

**Role:** CANONICAL mechanism-level user behavior  
**Status:** Application-neutral requirements baseline  
**Last updated:** 2026-08-30

## 1. Requirements objective

Define the observable behavior every acceptable demo application must implement to prove
the selected re-entry workflow. Domain-specific requirements must be added only after the
host application is selected.

## 2. Abstract end-to-end journey

1. A workflow participant opens a record in the host web application.
2. The Agent reads the same current state through page-provided WebMCP tools.
3. The Agent helps create or update a visible artifact.
4. The user reviews a plain-language future re-entry offer and grants one bounded event.
5. The user may leave the page and the Agent turn may end.
6. Another actor or system creates the authoritative state transition later.
7. One typed event resumes the bound Agent workflow.
8. The Agent returns to the canonical record page and reads current state.
9. The page exposes tools appropriate to the new stage.
10. The Agent continues the same artifact or decision process.
11. The Agent stops at the defined human boundary.
12. The user reviews the outcome and the system records a receipt.

## 3. Experience principles

- Use the selected domain's language, not internal protocol terminology, in the user interface.
- Explain the future trigger, scope, expiry, run count, and consequence before permission.
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
- The offer identifies the record, purpose, canonical return location, requested expiry,
  maximum runs, and human boundary.
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
- Waiting does not create runs, mutations, or repeated polling actions.
- The grant retains its scope, expiry, remaining run count, and revocation state.
- Ending the page session does not falsely mark the business workflow complete.

### WR-06 — Emit one bounded authoritative event

**Story:** As the host application, I want to report the selected state transition without
injecting instructions into the Agent.

**Acceptance criteria:**

- The MVP emits exactly one allowlisted event type.
- The event contains issuer, workflow, event ID, event sequence, business state version,
  timestamp, canonical URL, and minimal event-specific identifiers.
- The event has no arbitrary Agent instruction or prompt field.
- Invalid, duplicate, expired, mismatched, or out-of-order events do not create another run.
- Every acceptance or rejection appears in the audit timeline.

### WR-07 — Resume only the intended Agent workflow

**Story:** As a workflow participant, I want the event to resume the context I previously
authorized rather than start unrelated Agent work.

**Acceptance criteria:**

- A valid event resolves one active grant and one managed Agent-context binding.
- The host app never receives Agent credentials or a raw platform thread identifier.
- Run count and concurrency limits are reserved atomically.
- A resume failure produces a visible retry-safe status.
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
- Revocation prevents later events from starting new runs.
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

- **Traceability:** Grant, event, run, tool mutation, artifact revision, and human decision share a correlation path.
- **Idempotency:** Retried delivery cannot produce duplicate runs or duplicate effects.
- **Least privilege:** Authority is limited by origin, workflow, event, time, run count, and human boundary.
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

## 8. Domain specialization gate

Before implementation, the selected application must add:

- named user and external actor;
- concrete workflow record and persistent artifact;
- initial and resumed business states;
- one exact event type;
- initial and resumed Site Tool inventory;
- human decision boundary;
- user-visible terminology and error states;
- synthetic fixture and reset behavior;
- domain-specific safety and data rules.

These additions require a new accepted ADR and an update to 06-mvp-and-demo.md.

## 9. Mechanism acceptance

The mechanism slice is accepted only when one clean run demonstrates:

1. genuine initial Site Tool discovery and invocation;
2. visible Agent-prepared work in the host app;
3. one plain-language, user-approved future event;
4. an ended page session or Agent turn;
5. one authoritative state transition and one accepted event;
6. resume of the intended Agent workflow;
7. canonical page re-entry and fresh state read;
8. discovery and invocation of a different resumed-stage Site Tool;
9. continuation of the same artifact or decision process;
10. preservation of the human decision boundary;
11. safe duplicate and invalid-event behavior;
12. a correlated, judge-reproducible evidence trace.
