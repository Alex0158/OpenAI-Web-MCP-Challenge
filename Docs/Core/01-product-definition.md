# Re-entry Core — Product Definition

**Role:** CANONICAL concept and product boundary  
**Status:** Re-entry Core accepted; application and concrete Agent continuation adapter unselected  
**Last updated:** 2026-08-31

This document defines the target concept and product boundary. Current implementation and
evidence status are owned by [Core/00](00-current-status.md) and
[Core/05](05-validation-and-evidence.md).

## 1. Concept in one sentence

Re-entry Core is a consented mechanism for resuming Agent-assisted work after
the original page session or Agent turn has ended: a later business event may authorize
bounded pending work, and an available continuation adapter may later return the bound Agent
to the authoritative page, where current state and current Site Tools govern what can happen
next.

## 2. What has and has not been selected

### Selected

- the asynchronous, cross-session workflow problem;
- website-authored future re-entry semantics;
- user-approved, workflow-scoped continuation authority;
- typed events instead of arbitrary prompts;
- binding to the intended Agent context;
- canonical page re-entry and fresh-state verification;
- stage-derived Site Tools;
- visible human governance across runs.
- Re-entry Core as the authoritative application-neutral implementation baseline;
- one Receiver authority model with Cloud Receiver and local development service shells; and
- an outbound Local Connector behind a replaceable Agent Continuation Adapter boundary.

### Not selected

- the final web application;
- industry or domain;
- primary persona or customer;
- business event;
- domain artifact and state machine;
- Site Tool names and schemas;
- final product name;
- monetization or long-term distribution model.

TenderRelay and its tender flow are reference material for the selected mechanism. They do
not fill these open application-layer decisions automatically.

## 3. The problem class

WebMCP gives an Agent structured capabilities on a live page. Real workflows often outlive
that page session:

- work enters a waiting or review state;
- another person or system changes authoritative business state later;
- the original Agent turn ends;
- the page may close or navigate away;
- the user must recover the case, artifact, rationale, and next action;
- the valid tool surface may be different when the workflow returns.

Conventional notifications tell a person that something happened. Generic Agent triggers
can start work. Neither alone defines a user-consented return to the same authoritative page,
the same governed workflow, and the tools valid for the new state.

## 4. Concept hierarchy

| Layer | Purpose | Example status |
|---|---|---|
| **Problem class** | Multi-stage asynchronous web work loses Agent continuity across time | Selected |
| **Core mechanism** | Re-entry Core: Grant, accepted delivery, adapter activation, re-entry, fresh-state tools, human boundary | Selected |
| **Host application** | The real web product whose workflow demonstrates the mechanism | TBD |
| **Reference scenario** | A concrete example used to reason about the mechanism | Tender workflow available |
| **Platform implementation** | Cloud Receiver, outbound Local Connector, Agent runtime, Browser, and Host integration | Target process shape selected; concrete Agent adapter and runtime proof remain TBD |
| **Final product identity** | App name, brand, market, and commercial boundary | TBD |

## 5. Abstract actors

### Workflow participant

The person responsible for work that spans multiple application states. The selected app
will define the actual role, responsibilities, and consequences.

### External state-changing actor

A person or system that creates the later authoritative business transition. This actor
may be a reviewer, collaborator, approver, service, scheduled process, or another role.

### Host web application

The web product that owns the workflow state, human interface, business rules, artifacts,
and stage-specific WebMCP tools.

### External Agent

The user's reasoning and action environment. It works through the live page rather than
becoming the host application's second embedded AI.

### Cloud Receiver and Receiver Core

The Cloud Receiver hosts the single Receiver Core authority that stores continuation Grants,
private bindings, and authenticated pending deliveries. It validates limits and offers bounded
delivery to an eligible paired Connector without inheriting Host business authority.

### Deployment boundary

ADR-0006 selects a hosted Cloud Receiver plus outbound Local Connector as the active reference
topology. The same Receiver Core may run through a local service shell for development and
deterministic tests, but that shell is not a second production authority or an automatic
fallback. The Local Connector owns device-side delivery and Agent-adapter dispatch, not Grants
or event truth.

This distinction creates two separate interoperability questions:

- **Backend interoperability:** Can another Website Backend conform to the Receiver's
  versioned typed-event contract, including authentication, Grant scope, state version, and
  idempotency?
- **Connector delivery:** Can a paired outbound Connector safely lease, dispatch, and
  acknowledge one accepted delivery across offline and process-failure boundaries?
- **Agent-runtime integration:** Can the selected continuation adapter activate the intended
  bounded Agent context, then re-enter it with an eligible Browser and current Site Tools?

The first two are project-owned application protocols. The final question is a platform
constraint. A public remote-control API may enable a future adapter, but it is not part of the
concept definition and has not been proven for the current local Codex and Browser path.

## 6. User jobs at the mechanism level

### Continuity job

> When a workflow changes after I leave, return me and my Agent to the exact work context
> without forcing me to reconstruct the task from the beginning.

### Control job

> Let me decide in advance which event may authorize a later continuation opportunity, for
> how long, how often, and where the Agent must stop for me.

### Trust job

> Show why the workflow returned, which authority allowed it, what current state was read,
> what the Agent prepared or changed, and what still requires my decision.

The selected app must rewrite these abstract jobs in domain language before implementation.

## 7. Core mechanism

1. **Re-entry offer:** the host page declares legitimate future return points for the current workflow.
2. **Continuation grant:** the user approves a narrow subset with expiry, run, and approval limits.
3. **Opaque binding:** the Receiver binds the grant to managed Agent context while the app stores only a safe handle.
4. **Waiting state:** the page and Agent turn may end without ending the business workflow.
5. **Typed event:** the authoritative backend emits a signed, allowlisted business transition.
6. **Durable acceptance:** the Receiver validates the event and Grant, then records one bounded pending delivery.
7. **Agent activation:** an available continuation adapter resumes the intended Agent context without carrying application authority.
8. **Canonical re-entry:** the Agent opens the allowlisted application page.
9. **Fresh verification:** the page verifies identity, workflow, state, and current permissions.
10. **Dynamic tool discovery:** the Agent receives only Site Tools valid for the current stage.
11. **Governed continuation:** the Agent continues preparation or bounded action and stops at the defined human boundary.

## 8. Why WebMCP is material

WebMCP anchors enrollment and continuation in the same visible application:

- the initial offer is grounded in current page, workflow, and user session;
- the host app exposes domain actions without DOM or screenshot guessing;
- re-entry must return to authoritative state rather than act only from event data;
- the tool surface can change when business state changes;
- Agent work and human review remain visible in the host interface.

If the resumed workflow can complete entirely through a backend API without returning to
the page, the project becomes generic Agent orchestration with an incidental WebMCP demo.
That does not satisfy the selected concept.

## 9. Suitable host-application properties

The final application should have:

- a real multi-stage workflow with a meaningful waiting period or external transition;
- one persistent case, artifact, or decision that matters across stages;
- an authoritative page whose live state changes the correct next action;
- a reason for the Site Tool surface to change by stage;
- a clear human judgment or consent boundary;
- a complete synthetic scenario that is safe and publicly reproducible;
- visible value within a three-minute demonstration;
- low dependence on private APIs, hardware, proprietary data, or complex accounts;
- a strong explanation of why notification plus ordinary automation is insufficient.

## 10. Claim boundary

The project does not claim to invent event-driven workflows, notifications, grants, queues,
Agent continuation, state machines, dynamic tools, or human approval.

Its residual contribution is the composed, user-governed handoff:

> page-authored future re-entry semantics + scoped grant + typed event + bounded accepted
> delivery + platform-adapter activation of managed context + mandatory canonical page
> re-entry + current state-derived tools + human boundary.

This is a project mechanism and innovation hypothesis, not yet a standard, market category,
or proven production pattern.

## 11. Reference scenarios

Concrete domain mappings live in [Scenarios](../Scenarios/README.md) and do not select the
host application. The TenderRelay dossier supplies the first complete example; its current
interpretation is [Reference Scenario A](../Scenarios/01-tender-reference-scenario.md).

## 12. Open decisions

- Which host app yields the clearest real user pain and shortest complete proof?
- Which event creates an unmistakable reason for bounded pending continuation?
- Which artifact preserves meaningful continuity across stages?
- Which tools disappear and appear after the state change?
- Which final action must remain human-controlled?
- Which Agent platform and browser path can satisfy the adapter contract?
- Is fully background re-entry essential, or can the product support a user-mediated mode?
- Who owns, funds, and revokes continuation authority in the selected domain?
- What final name describes the app without conflating it with the reference scenario?
