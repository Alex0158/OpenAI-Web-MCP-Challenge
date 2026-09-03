# Re-entry Core — Product Definition

**Role:** CANONICAL concept and product boundary  
**Status:** Re-entry Core accepted; Sleepless Kingdom selected as the first Host application;
concrete Agent continuation adapter unselected  
**Last updated:** 2026-09-03

This document defines the target concept and product boundary. Current implementation and
evidence status are owned by [Core/00](00-current-status.md) and
[Core/05](05-validation-and-evidence.md). Stable lifecycle and authority contracts are owned by
the [Mechanism index](../Mechanisms/README.md).

## Selected-product continuity contract

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) fixes the selected product as repeated notification of an explicitly bound
existing Agent task. The user's strategy conversation and the website's current state are distinct
inputs; a fresh session is not an equivalent demonstration. The Receiver delivers event context,
not mandatory business commands, and does not supervise completion. Agent no-action or interruption
must not trigger redelivery. This is accepted intent, not current runtime proof; retained
v0.1/v0.2 effect-backed profiles remain compatibility evidence.

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
- visible human governance across runs;
- Re-entry Core as the authoritative application-neutral implementation baseline;
- one normative Receiver authority model, with every retained executable implementation gated by
  pinned black-box conformance;
- an outbound Local Connector behind a replaceable Agent Continuation Adapter boundary;
- Sleepless Kingdom as the first Host application and challenge-demo carrier;
- a strategy-game player, persistent shelter/gatherer mission, and authoritative world worker;
- `CargoLostToMonster` as the only initial standing signal type, with v0.1 retained only as a
  one-run compatibility profile;
- fresh shelter, client, mission, and history reads plus conditional `force_recall_soldier`;
- migration, siege, destructive upgrades, and irreversible recovery as human-confirmed boundaries; and
- additive protocol-v0.2 standing authorization with a locally verified application-neutral
  SDK/HTTP/Core/Connector/Adapter reference and active-Receiver working-tree kernel, with one active
  bounded activation at a time; public controls, pinned release, Game, normal-facade, and
  product-Connector adoption remain open.

### Still not selected

- a production Agent continuation adapter and Browser/session return path;
- commercial buyer, payer, validated demand, monetization, or long-term distribution;
- production identity, hosting, storage, operations, and effect authority;
- post-G2 signal taxonomy, standing-mode product integration, multiplayer Agent policy, or broader
  tool authority; and
- final visual brand treatment beyond the Sleepless Kingdom working product identity.

ADR-0042 owns the selection; ADR-0043 through ADR-0045 own standing authorization, independent-
Receiver conformance, and transport, while RECORE-007 proves only the application-neutral local
reference without changing the current Game or external v0.1 evidence boundary. The detailed Game behavior and evidence live under
[`WebApp/Web-Game/`](../../WebApp/Web-Game/); TenderRelay, RightSpot, and the other scenario records
remain reference or alternative material.

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
| **Host application** | The real web product whose workflow demonstrates the mechanism | Sleepless Kingdom selected by ADR-0042 |
| **Reference scenario** | A concrete example used to reason about the mechanism | Tender workflow available |
| **Platform implementation** | Cloud Receiver, outbound Local Connector, Agent runtime, Browser, and Host integration | Target process shape selected; concrete Agent adapter and runtime proof remain TBD |
| **Final product identity** | App name, brand, market, and commercial boundary | Sleepless Kingdom working identity selected; final brand and market validation open |

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
opaque Host bindings, and authenticated pending deliveries. The Receiver-issued private
`grant_id` anchors the authority relationship to one managed context, while the selected adapter
authority retains any raw platform locator outside the Host and Cloud Receiver. The Receiver
validates limits and offers bounded delivery to an eligible paired Connector without inheriting
Host business authority.

### Deployment boundary

ADR-0006 selects a hosted Cloud Receiver plus outbound Local Connector as the target reference
topology. The current `runtime/cloud-receiver/` implementation and hosted preview were retired by
ADR-0032. ADR-0033 selects `saas-boilerplate/` as the active v2 replacement base, and ADR-0035
through ADR-0041 authorize its bounded current increments. ADR-0044 preserves one normative Receiver
authority model while allowing active v2 to implement the model independently from `reentry-core`,
provided it passes the pinned black-box conformance and exact-source release gates. The standing
kernel and additive PostgreSQL migration are locally verified in the active Receiver working tree
under CLOUD-023. TASK-028 remains verification-pending for the pinned suite, committed-source
migration verification, and release enforcement. A local
service shell may run through the reference Core for development and deterministic tests, but it is
not a second production authority or an automatic fallback. The Local Connector owns device-side
delivery and Agent-adapter dispatch, not Grants or event truth.

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

Sleepless Kingdom specializes these jobs as “return to my shelter after a cargo-loss event, inspect
the live mission and causal history, and take only the bounded action currently allowed.” Its scoped
documents own the domain language and implementation detail.

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

Concrete comparative mappings live in [Scenarios](../Scenarios/README.md). ADR-0042 selects
Sleepless Kingdom; the outer [Sleepless Kingdom scenario](../Scenarios/03-sleepless-kingdom.md)
remains historical selection input, while the scoped Game documents own current product truth.
TenderRelay and the remaining scenarios stay reference or alternative material.

## 12. Open decisions

- Which Agent platform and browser path can satisfy the adapter contract?
- Can the Game integrate advanced-SDK Manifest/Consent enrollment and a supported authenticated
  Browser/WebMCP return without moving credentials into prompts or URLs?
- Can trusted same-task notification, genuine dynamic WebMCP decisions, and separately verified
  Game effects form one causal external trace without making effects a delivery prerequisite?
- Does player-authored doctrine create Agent value beyond a transparent deterministic rule builder?
- What latency, offline, operating-cost, identity, and recovery profile is acceptable?
- Who pays, operates, supports, and revokes continuation authority beyond the challenge prototype?
