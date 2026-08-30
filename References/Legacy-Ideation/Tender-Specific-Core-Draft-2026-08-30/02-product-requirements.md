# TenderRelay Product Requirements

**Role:** CANONICAL user-visible behavior  
**Status:** MVP requirements baseline  
**Last updated:** 2026-08-30

## 1. Product goal

Demonstrate that a bidder can begin Agent-assisted work on a tender page, authorize one
future event, leave, and later continue the same governed workflow on the authoritative page
without reconstructing the task from scratch.

## 2. MVP journey

1. The bidder opens a tender and sees its current stage, requirements, and response draft.
2. The Agent inspects the same tender through page-provided WebMCP tools and prepares a visible draft.
3. The bidder reviews a plain-language future re-entry request and grants only `clarification.requested` for that tender.
4. The bidder leaves the page and the active Agent turn ends.
5. The reviewer requests a clarification in the authoritative portal.
6. A typed continuation event resumes the bound workflow.
7. The Agent returns to the tender, verifies current state, discovers clarification-stage tools, and prepares a response.
8. The bidder sees why the Agent returned, reviews the draft, and makes the final approval decision.

## 3. Experience principles

- Use user language such as “return when a clarification is requested,” not protocol-first language such as “create a continuation grant.”
- Show scope and consequence before asking for permission.
- Make the current tender stage and re-entry reason visible at all times.
- Never imply that a draft has been submitted.
- Prefer one clear next action over a generic Agent dashboard.
- Keep a normal human UI fallback for every critical workflow step.

## 4. User stories and acceptance criteria

### PR-01 — Enter and understand the tender

**Story:** As a bidder, I want to see the tender's current stage and outstanding work so I
know what the Agent is helping with.

**Acceptance criteria:**

- The page visibly identifies the tender, current stage, response status, and relevant deadline.
- The same authoritative state is available to the Agent through a read-only Site Tool.
- If the tender is missing or unavailable, the page and tool return a clear, non-destructive error.
- The user can continue through the human UI even if no Agent is connected.

### PR-02 — Prepare an initial response visibly

**Story:** As a bidder, I want the Agent to prepare a response draft inside the portal so I
can inspect and change it before any submission.

**Acceptance criteria:**

- The Agent can inspect tender requirements through a narrow Site Tool.
- The Agent can create or update a draft, but the result remains visibly marked as a draft.
- The human UI updates to show the same content and revision state.
- Invalid or stale writes fail without overwriting the newer draft.
- No tool can silently perform the final commercial submission.

### PR-03 — Understand and grant future re-entry

**Story:** As a bidder, I want to authorize only the future event I care about so the portal
cannot resume unrelated work.

**Acceptance criteria:**

- The permission screen names the tender, triggering event, return destination, expiry, maximum runs, and approval boundary.
- The default scope is the minimum required for the demonstration.
- The user can approve, edit, or decline before any grant is created.
- Approval produces a visible active-grant summary and an opaque binding for the portal.
- Declining leaves the current tender workflow usable and creates no continuation authority.

### PR-04 — Leave without losing the governed workflow

**Story:** As a bidder, I want the workflow to wait safely after I leave so that only an
authorized event can resume it.

**Acceptance criteria:**

- The user can close or leave the page after grant creation.
- The active Agent turn may end without marking the tender workflow complete.
- The grant remains inspectable and revocable from the user's control surface.
- Waiting does not create repeated runs or background mutations.

### PR-05 — Emit one authoritative typed event

**Story:** As the tender system, I want to report a clarification request without sending
arbitrary Agent instructions.

**Acceptance criteria:**

- The MVP emits only the allowlisted `clarification.requested` event.
- The event identifies the origin, tender workflow, event ID, business state version, and canonical return URL.
- The event does not contain free-form instructions for the Agent to follow.
- Duplicate, expired, mismatched, or invalid events do not create an additional Agent run.
- The event and its validation result appear in the audit trail.

### PR-06 — Resume the intended workflow safely

**Story:** As a bidder, I want the correct Agent context to resume for the correct tender so
I do not have to explain the task again.

**Acceptance criteria:**

- A valid event resumes only the workflow bound by the approved grant.
- The resumed experience identifies the tender and why the workflow returned.
- The system does not expose the Agent's platform credential or raw thread identifier to the portal.
- Run limits and concurrency limits are enforced.
- Failure to resume produces a visible, retry-safe status rather than a substitute action.

### PR-07 — Re-enter and revalidate the canonical page

**Story:** As a bidder, I want the Agent to check the current portal state before preparing a
response so it cannot act only from a stale notification.

**Acceptance criteria:**

- The resumed run opens the grant's allowlisted canonical origin and workflow URL.
- The Agent reads the current tender stage and state version through a Site Tool.
- The event payload alone is insufficient to authorize a draft change.
- A state, identity, origin, or workflow mismatch stops the run and explains the reason.
- Expired authentication asks for user recovery and does not bypass the portal session.

### PR-08 — Discover stage-specific clarification tools

**Story:** As a bidder, I want the Agent to see only actions relevant to the clarification
stage so its choices remain understandable and bounded.

**Acceptance criteria:**

- Clarification tools are available only when the tender is in the clarification stage.
- Initial-submission tools that are no longer valid are absent or reject execution.
- Tool names, descriptions, schemas, and results are concise enough for reliable selection.
- A read-before-write path is available for every draft mutation.

### PR-09 — Prepare, review, and approve the clarification response

**Story:** As a bidder, I want the Agent to prepare the next response while I retain the final
decision.

**Acceptance criteria:**

- The Agent can read the clarification and update a visible response draft.
- The page records the draft's source state version and revision.
- The user can edit, approve, or reject the draft through the human UI.
- The demo does not represent a draft as submitted before human action.
- Approval produces a visible receipt; rejection leaves a recoverable draft history.

### PR-10 — Inspect and revoke continuation authority

**Story:** As a bidder, I want to know what I authorized and stop future runs when needed.

**Acceptance criteria:**

- The user can see active scope, expiry, remaining runs, last event, and last run outcome.
- Revocation prevents later events from starting new runs.
- An event racing with revocation resolves according to a documented, visible rule.
- Revocation does not delete the tender, draft, or audit history.

## 5. Required empty and failure states

The MVP must handle these states explicitly:

- no Agent connected;
- no response draft yet;
- no active continuation grant;
- grant declined, expired, exhausted, or revoked;
- duplicate or out-of-order event;
- event for the wrong origin, workflow, or type;
- Agent continuation unavailable;
- browser or canonical URL cannot be opened;
- portal authentication expired;
- tender state changed again before the Agent acted;
- Site Tools absent or wrong for the current stage;
- draft conflict between human and Agent revisions;
- human rejects the prepared response.

## 6. Product-level non-functional requirements

- **Traceability:** Every grant, event decision, run, tool mutation, and human approval has a correlation path.
- **Idempotency:** Retried delivery cannot produce duplicate runs or duplicate draft mutations.
- **Least privilege:** Authority is scoped by origin, workflow, event, expiry, run count, and action boundary.
- **State freshness:** All writes validate current business state and expected revision.
- **Accessibility:** The core human path works without the Agent and exposes visible status text, not color alone.
- **Judge reproducibility:** A fresh evaluator can reach the complete flow from one public entry point using documented setup.
- **Privacy:** Event payloads contain identifiers and state metadata, not full confidential tender documents unless explicitly required.
- **Fail-safe behavior:** Uncertain authority or stale state stops before mutation.

## 7. MVP non-goals

The challenge MVP will not build:

- a general-purpose cross-site continuation protocol;
- production multi-tenant enterprise administration;
- real procurement integrations or live commercial bids;
- broad RFP content libraries, retrieval systems, or generative AI inside the portal;
- autonomous legal, pricing, or final bid submission;
- more than one continuation event type;
- multiple Agent platforms in the happy path;
- distributed infrastructure when one application and one durable datastore can prove the loop;
- a complete bidder and buyer product suite;
- a claim that browser/auth continuity works across every environment.

## 8. MVP product acceptance

The product slice is accepted only when a clean run demonstrates all of the following:

1. initial page tools are genuinely discovered and invoked;
2. the user grants one plain-language future event;
3. the page can be left and the original Agent turn can end;
4. one valid backend state transition creates one resumed run;
5. the Agent re-enters the canonical page and reads fresh state;
6. the page exposes clarification-stage tools and the Agent invokes them;
7. a visible response draft is prepared against the current revision;
8. a human performs the final approval action;
9. duplicate and invalid events fail safely;
10. the complete path is captured in an auditable, judge-reproducible trace.
