# TenderRelay Product Definition

**Role:** CANONICAL product definition  
**Status:** Working product baseline  
**Last updated:** 2026-08-30

## 1. Product in one sentence

TenderRelay is a consented re-entry layer for multi-stage web workflows: it lets a user
authorize a website to request a future continuation of the same Agent-assisted task, while
requiring the Agent to return to the authoritative live page and stop at human decision
boundaries.

## 2. The problem

WebMCP helps an Agent act reliably on a page that is open now. Many consequential workflows
do not finish in one session:

- a bid is submitted and a clarification arrives days later;
- a reviewer requests new evidence;
- a document is approved or rejected asynchronously;
- a workflow changes stage while the user and Agent are absent;
- the original context, draft, rationale, and approval boundary must be reconstructed.

Today, the user usually receives a notification, reopens the portal, finds the relevant
record, explains the history to an Agent again, and manually reconnects the next action to
the previous work. Generic notifications report that something happened; they do not carry
a narrowly authorized path back into the same governed Agent workflow.

## 3. Primary user and actors

### Primary challenge user

**Bid manager or proposal lead** responsible for preparing and maintaining a tender response
across multiple portal stages. This person values continuity and drafting assistance but
must retain control over commercial and legal commitments.

### Supporting human actor

**Buyer or reviewer** who changes the authoritative workflow state, such as requesting a
clarification. In the MVP this role exists to create a realistic state transition, not as a
second full product persona.

### System and commercial stakeholders

- **Tender portal operator:** exposes WebMCP tools, publishes re-entry semantics, and emits typed events.
- **External Agent platform:** supplies reasoning, conversation context, and the browser/tool runtime.
- **Agent-side Receiver:** holds the user's continuation authority and binds it to an Agent context.
- **Bidder organization:** owns policy, identity, confidential material, and approval rights.

The paying customer and long-term integration buyer are **UNKNOWN**. A bidder receives much
of the value while a portal operator bears integration work; this incentive boundary must
be validated rather than assumed away.

## 4. Jobs to be done

### Functional job

> When a tender workflow changes after I leave the portal, help me return to the exact case,
> recover the relevant Agent context, understand what changed, and prepare the next response
> without starting from zero.

### Control job

> Let me decide in advance which future events may resume work, for how long, how often, and
> where the Agent must stop for my approval.

### Trust job

> Show me why the Agent returned, which authority allowed it, what current portal state it
> read, what it changed, and what still requires my decision.

## 5. Product promise

TenderRelay should reduce context reconstruction and missed workflow transitions without
turning a portal notification into unlimited Agent authority.

The intended before-and-after is:

| Before | With TenderRelay |
|---|---|
| Notification points the user back to a portal | Typed event resumes one authorized workflow |
| User reconstructs history and prompts again | Same Agent context and artifact history resume |
| Agent may act from stale chat context | Agent must re-read the canonical page and current state |
| Portal exposes one generic action surface | Page exposes tools appropriate to the current stage |
| Authority is implicit or recreated ad hoc | Grant scope, expiry, event types, and approvals are explicit |
| Audit is split across email, chat, and portal | Re-entry reason, tool use, draft, and approval form one trace |

## 6. Core mechanism

The product combines five bounded objects and behaviors:

1. **Re-entry Manifest:** website-authored declaration of legitimate future workflow events and return locations.
2. **Continuation Grant:** user-approved authority limited to a workflow, origin, event set, expiry, and run limits.
3. **Continuation Event:** signed, typed notification from the authoritative backend; never arbitrary prompt text.
4. **Re-entry Run:** resumed Agent execution bound to the original workflow context.
5. **Canonical WebMCP Re-entry:** mandatory return to the current page state and its stage-specific tools before action.

## 7. Why WebMCP is material

WebMCP is not used merely to replace clicks. It anchors both ends of the workflow in the
same visible application:

- enrollment happens while the user and Agent are on the live portal;
- the site can expose the current workflow ID, stage, actions, and limits without DOM guessing;
- the Agent must return to the authoritative page rather than act only from event payloads;
- the tool surface can change with business state;
- the user can inspect drafts and approvals in the same interface.

Without canonical page re-entry, TenderRelay becomes a generic webhook-to-Agent orchestrator
with a WebMCP front end. That weaker form is outside the selected product thesis.

## 8. Differentiation and claim boundary

TenderRelay does not claim to invent event notifications, RFP drafting, portal automation,
durable workflows, or Agent continuation. Its defensible contribution is the composed
handoff:

> website-authored future re-entry semantics + user-scoped grant + opaque Agent binding +
> typed business event + same-context resume + mandatory canonical page revalidation +
> stage-specific tools + visible human approval.

This is currently a **residual innovation hypothesis**, not a proven market category or
standards claim.

## 9. Product principles

1. **Current state over event text.** The page and backend determine truth.
2. **Consent before continuation.** No background authority is inferred from a normal visit.
3. **Least privilege across time.** Scope includes what, why, where, when, and how often.
4. **Visible continuity.** The user can see the case, reason for return, draft, and next boundary.
5. **Human judgment at consequence.** Preparation may be delegated; commitment is not.
6. **One domain truth, two interaction surfaces.** Human UI and Site Tools share the same policy layer.
7. **Failure should stop safely.** Expired auth, conflicting state, or invalid events do not trigger substitute actions.
8. **Judge-visible simplicity.** The MVP proves one complete loop before generalizing the protocol.

## 10. Outcome hypotheses

The following are targets to validate, not current evidence:

- reduce the steps required to resume a multi-stage tender task;
- reduce repeated context explanation after an asynchronous event;
- reduce the chance of acting on stale stage or document state;
- make delegated preparation and human approval easier to audit;
- help users respond to clarification requests sooner without removing commercial control.

## 11. Open product decisions

- Is the long-term customer the portal operator, bidder organization, or Agent platform?
- Is background autonomous re-entry required, or is a one-click user-mediated re-entry an acceptable product mode?
- Which organization role may create, edit, and revoke a grant?
- What minimum continuation history must persist across devices and team members?
- Which tender data may be processed by the Agent under confidentiality or residency constraints?
- Does the long-term product remain tender-specific or become a cross-domain re-entry contract?

These decisions must not expand the challenge MVP unless they change its ability to prove
the core mechanism.
