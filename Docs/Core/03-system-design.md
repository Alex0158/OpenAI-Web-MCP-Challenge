# WebMCP Re-entry Workflow — System Design

**Role:** CANONICAL domain-neutral architecture and contracts  
**Status:** Canonical target architecture bounded by ADR-0004; the production wake and continuation adapter remains unselected. Current as-built truth is owned by Core/00 and Core/05.  
**Last updated:** 2026-08-31

## 1. System objective

Carry one narrowly authorized business transition across time and back into the same
governed human–Agent web workflow without treating the event as application truth, a prompt,
or unlimited Agent authority.

The architecture defines a reusable mechanism. The selected host application must supply
the real user, workflow states, artifact, event semantics, Site Tools, permissions, and human
decision boundary.

## 2. Architectural invariants

1. The host application backend owns authoritative workflow state.
2. A continuation event is authenticated work intent and bounded authorization, not an Agent instruction or proof that an Agent was awakened.
3. The user grants authority to an Agent-side or Agent-host-controlled component.
4. The host application stores only an opaque workflow-scoped binding.
5. Every resumed run returns to an allowlisted canonical origin and workflow URL.
6. The page revalidates current identity, authorization, state, and artifact revision.
7. Current page state determines which Site Tools exist and which actions are valid.
8. Tool mutations validate state and revision at execution time.
9. The Agent stops at a domain-defined human decision boundary.
10. Delivery, run, tool, artifact, and human-decision records share correlation identifiers.
11. Duplicate delivery cannot create duplicate runs or duplicate effects.
12. The mechanism remains observable and usable through the host application's human interface.

## 3. Separation of responsibilities

| Layer | Owns | Must be supplied by |
|---|---|---|
| **Host application domain** | User roles, workflow states, artifact, business rules, permissions | Selected demo app |
| **Page execution** | Human UI, current state, stage-derived Site Tools, mutation validation | Selected demo app |
| **Receiver control** | Re-entry offer, Grant binding, event validation, and durable delivery ledger | Core mechanism |
| **Wake and continuation transport** | Activation opportunity, exact-context resume, Browser access, canonical-page re-entry | Selected Agent adapter |
| **Agent runtime** | Managed context, browser access, navigation, Site Tool invocation | Selected Agent adapter |
| **Governance** | Consent, scope, expiry, revocation, human boundary, audit visibility | User, organization, Receiver, host app |

## 4. Component model

~~~mermaid
flowchart LR
    U["Workflow participant"] --> P["Host web page"]
    A["External Agent"] <--> P
    P --> B["Host application backend"]
    B --> O["Transactional outbox"]
    O --> G["Continuation Gateway"]
    G --> R["Receiver ingress and Grant control"]
    R --> D["Durable delivery ledger"]
    D --> W["Wake Adapter"]
    W --> C["Agent Continuation Adapter"]
    C --> A
    C --> P
    U --> R
    U --> P
~~~

### Host web page

- renders current workflow state and artifact for the user;
- registers Site Tools derived from the current stage;
- presents the future re-entry offer in domain language;
- shows the re-entry reason, Agent-prepared work, human boundary, and receipt.

### Host application backend

- owns workflow and artifact transitions;
- enforces domain authorization and optimistic concurrency;
- commits business changes and event intents atomically through an outbox;
- emits bounded event data rather than prompts or full artifacts.

### Continuation Gateway

- resolves an opaque Agent binding;
- verifies issuer, origin, workflow, event type, signature, time window, sequence, and replay state;
- durably records accepted and rejected delivery;
- forwards accepted events to the Agent-side Receiver.

### Agent-side Receiver

- owns Continuation Grant records;
- stores the mapping from opaque binding to managed Agent context;
- derives a trusted typed Continuation Receipt only after Manifest validation and
  Receiver-owned consent, then persists it through a trusted adapter surface;
- enforces expiry, revocation, run, cost-like, and concurrency limits;
- authenticates and records one bounded pending delivery before acknowledging acceptance;
- delegates activation to a replaceable Wake Adapter;
- records run status without exposing platform credentials to the host app.

### Durable delivery ledger

- separates accepted event truth from activation attempts;
- keeps pending work durable across a Receiver restart;
- records claim, retry, acknowledgement, expiry, and terminal outcome when the selected
  topology requires them;
- never treats a scheduler row or prompt as the authoritative business event.

The current H1 implementation proves a durable pending event and effect-backed acknowledgement,
but not a general claim lease or visibility timeout. H2 separately proves a leased enrollment
outbox to a synthetic destination; it is not a production event broker.

### Wake Adapter

- creates an activation opportunity through a selected supported platform route;
- carries only bounded correlation and no application authority;
- may be direct push, a bounded scheduled pull, an approved paired connector, or a hosted
  Agent trigger depending on the selected deployment topology;
- cannot turn event acceptance into proof that an Agent ran.

### Agent Continuation Adapter

An abstraction over the selected Agent platform. Under the current planning premise it must:

1. bind a user-approved grant to managed Agent context;
2. resume that context after a validated pending delivery is selected for activation;
3. obtain an eligible WebMCP-capable browser context;
4. open the allowlisted canonical workflow URL;
5. wait for current Site Tools to register;
6. enable the Agent to invoke those tools;
7. emit correlated run, browser, tool, and failure evidence.

The concrete adapter requires a separate ADR after runtime validation.

### Integration contract boundaries and deployment topologies

The mechanism has two distinct integration contracts. They must be versioned, tested, and
documented separately.

| Contract | Owner and consumer | Required responsibilities | Main portability question |
|---|---|---|---|
| **Website Backend -> Receiver** | This project defines the Receiver contract; each host backend is an event issuer | Typed event schema, issuer authentication, Grant scope, state-version checks, and idempotency | Can another backend conform without bespoke Receiver control logic? |
| **Receiver -> Agent runtime** | The selected Agent Continuation Adapter implements the platform boundary | Context capture, receipt persistence, exact resume, browser access, canonical-page re-entry, and Site Tool invocation | Can the chosen runtime provide these capabilities in the intended deployment topology? |

The Receiver's event algorithm is domain-neutral even when a deterministic fixture pins one
workflow, event type, issuer, or development key. Generalizing the protocol means adding
configuration, issuer onboarding, key management, and lifecycle controls; it does not mean
creating a different Receiver algorithm for every backend.

The mechanism does not require one particular deployment topology:

- **Local or Agent-side Receiver:** a user-controlled Receiver or connector runs alongside
  the Agent runtime. A hosted Website Backend can send authenticated events to it. This
  topology does not require a public remote-control API for the local Desktop runtime.
- **Hosted Receiver plus local connector:** the Receiver becomes an independent service,
  while a paired local connector owns the device-specific Agent and Browser interaction.
  The connector needs an explicit pairing, identity, lifecycle, and failure contract.
- **Hosted Receiver plus hosted Agent runtime:** the Agent and browser are hosted as part of
  the service, removing the local Desktop dependency. This is a different adapter and may
  change the product's platform claim.

Portability of the Website Backend-to-Receiver event protocol is separate from portability
of the Receiver-to-Agent transport. A public Codex API is one possible solution to the
second problem for a hosted topology; it is not a prerequisite for the core mechanism or
for a conforming backend to send a Receiver event.

### Current as-built boundary

- The private P0 Desktop adapter completed one controlled same-task join but is not a
  documented platform contract.
- H1 Scheduled pull completed one bounded event-gated continuation and remains a
  current-build compatibility adapter, not the core event truth or a production default.
- H2 proves durable enrollment dispatch only to a synthetic idempotent destination.
- The standalone App Server Desktop route failed both tested current-build joins: the cold
  thread's Browser selector returned `iab-unavailable` before page access, without identifying
  the absent precondition, and the exact task supplied by the controlled warm priming step
  returned an active-writer rejection. The warm public JSON does not independently prove writer
  ownership or priming.
- Workspace Agents document supported external triggers, durable queueing, idempotent retry,
  and stable conversation keys, but do not document a Browser or genuine page-bound WebMCP
  surface for API-triggered runs. This remains an unverified hosted topology.
- Production wake and continuation transport remains unselected. A hosted Agent topology is
  distinct from continuation of an arbitrary local Desktop task.

## 5. Host Application Adapter contract

The host application is not a replaceable visual shell. It must implement the following
domain responsibilities:

- identify one durable workflow record;
- expose current state and artifact revision;
- define one legitimate later event;
- render the same artifact for human and Agent work;
- derive different Site Tool surfaces before and after the event;
- enforce the human decision boundary;
- expose a canonical workflow URL;
- emit an event intent atomically with the business transition;
- provide deterministic synthetic data and reset behavior for the challenge.

The application may use any suitable domain. Tender is one reference mapping, not the
default contract.

## 6. Trust boundaries

~~~text
Host page and authoritative backend
    | signed re-entry offer and typed event
    v
Continuation Gateway
    | verified event and opaque binding
    v
User-controlled Receiver, grant store, and durable delivery ledger
    | bounded activation request
    v
Wake and continuation adapter
    | managed context binding
    v
Agent platform and browser
    | authenticated canonical page
    v
Current state-derived WebMCP Site Tools
~~~

No boundary inherits the previous boundary's authority:

- the Gateway verifies event authenticity;
- the Receiver verifies continuation authority;
- the Agent adapter proves the intended context and browser path;
- the host page verifies current identity, permissions, workflow, and state;
- the domain layer verifies each requested effect.

## 7. End-to-end lifecycle

### Phase A — Enrollment in a live page

1. The participant opens a workflow record in a WebMCP-capable browser.
2. The page registers tools for the current stage.
3. The Agent reads current state and prepares or updates a visible artifact.
4. The page returns a website-authored Re-entry Manifest for one later event.
5. The Receiver verifies origin, workflow, manifest integrity, and requested limits.
6. A Receiver-owned permission surface shows the offer in domain language.
7. The user approves, narrows, or declines event, expiry, run, and human-boundary scope.
8. On approval, the Receiver creates a Continuation Grant, binds managed Agent context, and
   persists a Receiver-generated Trusted Continuation Receipt into that context through a
   trusted adapter surface.
9. The host app receives only an opaque agent_binding value.

### Phase B — Waiting

10. The page may close or navigate away and the Agent turn may end.
11. The grant remains inspectable and revocable.
12. No run or mutation occurs before an accepted event.

### Phase C — Authoritative transition

13. Another actor or system creates the selected business transition.
14. The backend commits new workflow state and an outbox event in one transaction.
15. An outbox relay sends a signed typed Continuation Event.
16. Receiver ingress authenticates and durably deduplicates the event.
17. The Receiver resolves the Grant and commits one bounded pending delivery before
    acknowledging acceptance.

### Phase D — Re-entry and continuation

18. An available Wake Adapter creates one bounded activation opportunity.
19. The Agent Continuation Adapter resumes the bound Agent context.
20. An eligible browser opens the canonical workflow URL.
21. The host application authenticates the current user and renders current state.
22. The Agent verifies origin, workflow ID, stage, state version, and artifact revision through a Site Tool.
23. The page exposes the tools valid for the resumed stage.
24. The Agent continues the same artifact or decision process.
25. The Agent stops at the domain-defined human boundary.
26. The user edits, rejects, or approves and the host app records a receipt.

## 8. Logical contracts

These are non-binding domain-neutral target examples. Exact fields, names, serialization,
signing algorithms, and transport require accepted implementation decisions; these examples
must not be read as the current wire contract.

### 8.1 Re-entry Manifest

~~~json
{
  "manifest_version": "1",
  "manifest_id": "rm_...",
  "issuer_origin": "https://app.example",
  "workflow": {
    "type": "selected-domain-type",
    "id": "W-102",
    "state": "stage-one",
    "state_version": 12,
    "artifact_revision": 4,
    "canonical_url": "https://app.example/workflows/W-102"
  },
  "reentry_points": [
    {
      "event_type": "workflow.follow_up_requested",
      "purpose": "Return to continue this workflow",
      "required_human_boundary": "approve-consequential-action"
    }
  ],
  "requested_limits": {
    "expires_at": "...",
    "max_runs": 1,
    "max_concurrent_runs": 1
  },
  "issued_at": "...",
  "key_id": "...",
  "signature": "..."
}
~~~

Descriptions and predicted tool roles are informative. They cannot grant backend authority
or guarantee which tools will exist after re-entry.

### 8.2 Continuation Grant

~~~json
{
  "grant_id": "cg_...",
  "agent_binding": "ab_opaque_...",
  "subject": "user-or-organization-subject",
  "issuer_origin": "https://app.example",
  "workflow_type": "selected-domain-type",
  "workflow_id": "W-102",
  "canonical_url": "https://app.example/workflows/W-102",
  "allowed_events": ["workflow.follow_up_requested"],
  "approval_boundary": "approve-consequential-action",
  "expires_at": "...",
  "max_runs": 1,
  "runs_reserved": 0,
  "status": "active"
}
~~~

The Receiver stores the platform-specific context binding separately from the portal-facing
grant handle.

### 8.3 Trusted Continuation Receipt

~~~json
{
  "receipt_version": "1",
  "receipt_type": "WEBMCP_REENTRY_GRANT",
  "grant_id": "cg_...",
  "issuer_origin": "https://app.example",
  "workflow_type": "selected-domain-type",
  "workflow_id": "W-102",
  "canonical_url": "https://app.example/workflows/W-102",
  "authorized_event_type": "workflow.follow_up_requested",
  "continuation_intent": {
    "mode": "OPEN_CANONICAL_PAGE",
    "first_action": "READ_CURRENT_STATE",
    "required_tool_role": "CONTINUE_ARTIFACT",
    "stop_before": "approve-consequential-action"
  },
  "expires_at": "..."
}
~~~

The Receiver generates this receipt only after Manifest validation and Receiver-owned human
consent. It carries the approved reason, destination, first-action role, required continuation
role, and stopping boundary into the bound managed context. The website, event payload, and
Agent cannot author or widen it.

The receipt is enrollment output. It is not the future business event, application state, a
bearer authorization, or proof that the resumed runtime has Browser or WebMCP capability.
Activation still requires a separately authenticated accepted event, a live matching Grant,
an available capable adapter, and fresh authoritative page state.

### 8.4 Continuation Event

~~~json
{
  "event_version": "1",
  "event_id": "ce_...",
  "event_type": "workflow.follow_up_requested",
  "issuer_origin": "https://app.example",
  "agent_binding": "ab_opaque_...",
  "workflow_type": "selected-domain-type",
  "workflow_id": "W-102",
  "state_version": 13,
  "event_sequence": 1,
  "occurred_at": "...",
  "canonical_url": "https://app.example/workflows/W-102",
  "data": {
    "follow_up_id": "F-1"
  }
}
~~~

The signature is detached from the JSON body. Event data contains bounded identifiers and
state metadata, not arbitrary Agent instructions or the full domain artifact.

### 8.5 Re-entry Run

~~~json
{
  "run_id": "rr_...",
  "grant_id": "cg_...",
  "event_id": "ce_...",
  "correlation_id": "re_...",
  "status": "queued",
  "expected_origin": "https://app.example",
  "expected_workflow_id": "W-102",
  "observed_state_version": null,
  "observed_artifact_revision": null,
  "started_at": null,
  "completed_at": null,
  "failure_code": null
}
~~~

## 9. Abstract state models

### Host workflow

~~~text
stage-one-draft
-> waiting-for-external-transition
-> stage-two-action-required
-> stage-two-draft
-> awaiting-human-decision
-> completed
~~~

The selected app must replace these placeholders with real domain states and transition
rules.

### Grant

~~~text
pending -> active -> expired
                  -> revoked
                  -> exhausted
~~~

### Target event, delivery, wake, and effect separation

~~~text
Event:        ACCEPTED | REJECTED | EXPIRED
Delivery:     PENDING -> LEASED -> ACKNOWLEDGED
                 |          |
                 +-> RETRYABLE -> DEAD_LETTER
Wake attempt: QUEUED -> DISPATCHED | FAILED | COALESCED
Host effect:  NOT_APPLIED -> APPLIED
~~~

This is a target model, not the current H1 schema. H1 proves one durable `PENDING` delivery
and idempotent Host completion without a delivery claim lease or visibility timeout.

### Re-entry run

~~~text
queued -> resuming -> opening-page -> verifying-state -> continuing-work
      -> awaiting-human -> completed
      -> failed-retryable
      -> failed-terminal
      -> cancelled
~~~

## 10. Site Tool roles

The mechanism requires roles, not final tool names:

| Workflow stage | Tool role | Required behavior |
|---|---|---|
| Initial | Context reader | Return current record, stage, artifact, and versions |
| Initial | Draft or proposal writer | Create visible revisable work with optimistic concurrency |
| Initial | Re-entry offer reader | Return the current future-event offer without granting authority |
| Resumed | Follow-up context reader | Return the new event-related state and current artifact |
| Resumed | Continuation writer | Continue the same artifact or decision process |

The selected app must give these roles domain-specific names, descriptions, schemas, and
outputs. Final human approval remains outside the Agent tool surface unless a later ADR
defines a different bounded consequence.

## 11. Persistence and atomicity

The target host state transition and event intent commit in one database transaction. An
outbox relay may deliver at least once. The Gateway and Receiver make repeat delivery safe through:

- unique event IDs;
- workflow event sequence;
- atomic grant/run reservation;
- idempotency keys;
- expected state version;
- expected artifact revision;
- recorded prior outcome for duplicates.

Do not represent an external queue write inside a database transaction as atomic. The MVP
should prefer a database-backed outbox or queue unless the selected runtime requires more.

## 12. Decisions still required

- host application domain, user, artifact, event, states, and human boundary;
- final app and mechanism name;
- concrete Agent Continuation Adapter and supported client;
- application framework, datastore, and hosting provider;
- manifest signing and key distribution;
- identity and grant-subject model;
- browser authentication recovery behavior;
- event delivery transport;
- data retention for grants, events, run traces, and artifacts.

Each decision must preserve the invariants in this document and be recorded before it
creates a cross-layer implementation contract.
