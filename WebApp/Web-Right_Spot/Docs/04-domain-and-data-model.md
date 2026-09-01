# RightSpot — Domain and Data Model

**Role:** Domain vocabulary, business rules, state machine, and privacy boundary  
**Status:** MVP business-rules baseline accepted; durable workflow persistence and the synthetic listing discovery boundary are accepted local implementation decisions

## 1. Core entities

| Entity | Purpose | Initial boundary |
|---|---|---|
| `User` | Synthetic participant identity and role | one tenant and one property agent |
| `Listing` | Published rental opportunity | a small seeded catalogue; one primary demo listing |
| `ViewingRequest` | Shared artifact connecting tenant intent and agent response | at most one request per reset fixture |
| `AvailabilitySlot` | Synthetic slot that an agent may propose | explicit slots owned by the application |
| `AgentReviewNote` | Agent-only preparation context | never exposed to tenant projection |
| `AuditEntry` | Bounded explanation of state-changing operations | no secrets or private runtime context |

The first fixture may contain three to five published listings so discovery feels credible. The
judged walkthrough uses one primary listing and one request. All listing and availability data is
synthetic.

### 1.1 Listing discovery record

The local discovery boundary uses the minimum synthetic fields needed for listing cards, bounded
filters, and a detail view:

- stable identifier, revision, publication status, and assigned agent identifier;
- title, synthetic address, and area;
- monthly rent in GBP, bedroom count, and size in square metres;
- ISO available-from date;
- bounded description; and
- a stable local `imageKey` rather than an external image URL.

The tenant-facing listing shape omits the internal assigned agent identifier. The agent-authorized
shape may retain it for assignment checks. The catalogue remains deterministic, contains three
published entries in fixture order, and does not imply live property ingestion or production media
storage.

## 2. MVP business rules

### 2.1 Participants and assignment

- The fixture contains one seeded tenant and one seeded property agent.
- Every seeded listing is assigned to the seeded property agent for the first slice.
- A tenant can read only its own request. The agent can read only requests assigned to that agent.
- Demo login selects one seeded role. There is no registration, password recovery, or organization
  administration.
- Switching roles requires signing out and starting a new demo session.

### 2.2 Request creation and scope

- A tenant may browse all seeded published listings, but only one Viewing Request may exist in a
  fixture at a time.
- A draft is editable by its tenant until submission. Submission requires at least one preferred
  viewing time and may include up to three ordered alternatives plus one bounded tenant note.
- Submission is an explicit tenant action. Browsing, saving a favourite, or preparing a form never
  submits a request.
- After `REQUEST_SUBMITTED`, tenant preferences are read-only in the MVP. Cancel, reschedule,
  reopen, and a second request are outside the first slice; reset is the replay mechanism.

### 2.3 Agent preparation and decision

- Opening or reading a request does not change its state. The agent explicitly starts review.
- Proposal or decline preparation is revisable while the request is `AGENT_REVIEWING`.
- Preparation is not a business decision and does not notify, confirm, or reserve a viewing.
- The agent must explicitly send either one slot proposal or one decline response.
- Once sent, the agent response cannot be edited or withdrawn in the MVP.
- A decline is terminal and is visible to the tenant with a bounded tenant-facing reason when one is
  provided. Internal review notes never cross the role boundary.

### 2.4 Tenant response

- A tenant may confirm or decline only the current, unexpired proposal belonging to that tenant.
- Confirmation records a viewing confirmation only. It does not create payment, lease, calendar, or
  move-in consequences.
- Tenant decline and expiry are terminal. The tenant may browse listings again, but cannot create a
  second request until the fixture is reset.

## 3. MVP request state machine

```text
TENANT_DRAFT
  -> REQUEST_SUBMITTED
  -> AGENT_REVIEWING
  -> SLOT_PROPOSED -> VIEWING_CONFIRMED | TENANT_DECLINED | EXPIRED
  -> AGENT_DECLINED
```

Tenant submission is a visible action from `TENANT_DRAFT` to `REQUEST_SUBMITTED`; a separate
persisted `TENANT_CONFIRMED_SUBMISSION` state is unnecessary. Preparation stays in
`AGENT_REVIEWING`; only the agent's send action moves the request to `SLOT_PROPOSED` or
`AGENT_DECLINED`. The final states are terminal for the first slice.

### 3.1 Transition matrix

| Current state | Actor and operation | Required checks | Result |
|---|---|---|---|
| `TENANT_DRAFT` | Tenant `submitViewingRequest` | own draft, published listing, at least one preference, current version | `REQUEST_SUBMITTED` |
| `REQUEST_SUBMITTED` | Assigned agent `startAgentReview` | assigned agent, current version | `AGENT_REVIEWING` |
| `AGENT_REVIEWING` | Assigned agent `prepareSlotProposal` or `prepareAgentDecline` | assigned agent, bounded input, slot belongs to listing and is available when selected | stays `AGENT_REVIEWING` with preparation |
| `AGENT_REVIEWING` | Assigned agent `editPreparedResponse` | assigned agent, prepared response exists, current version | stays `AGENT_REVIEWING` with new preparation |
| `AGENT_REVIEWING` | Assigned agent `sendSlotProposal` | prepared available slot, current version | `SLOT_PROPOSED` and slot held |
| `AGENT_REVIEWING` | Assigned agent `sendAgentDecline` | current version, bounded tenant-facing reason if used | `AGENT_DECLINED` |
| `SLOT_PROPOSED` | Tenant `confirmProposedViewing` | own request, unexpired proposal, held slot, current version | `VIEWING_CONFIRMED` and slot confirmed |
| `SLOT_PROPOSED` | Tenant `declineProposedViewing` | own request, current version | `TENANT_DECLINED` and slot released |
| `SLOT_PROPOSED` | Application expiry evaluation | injected clock is past `expiresAt` | `EXPIRED` and slot released |

No operation may transition out of `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, or
`AGENT_DECLINED`. Expiry is evaluated on relevant reads and writes; the MVP does not require a
background scheduler.

## 4. Viewing Request record

The logical record contains only the minimum fields needed for the first workflow:

- stable synthetic request identifier;
- listing identifier and the listing version used at submission;
- tenant identifier and assigned property-agent identifier;
- one to three ordered preferred viewing times and an optional bounded tenant note;
- current state and one monotonic request version;
- prepared response, if any, with kind (`SLOT_PROPOSAL` or `AGENT_DECLINE`);
- tenant-facing response note, when present;
- proposal slot identifier and `expiresAt`, when a proposal is sent;
- created, updated, submitted, and decided timestamps;
- fixture generation; and
- bounded audit references.

Role projections are derived authorized views, not a reason to duplicate the shared record. The
record must not contain payment credentials, identity documents, legal commitments, hidden prompts,
external Agent context locators, or copied private notes in shared fields.

## 5. Availability rules

- Each seeded listing has explicit synthetic slots with an identifier, start time, end time, timezone,
  and status. The primary demonstration listing has at least three future slots. The demo displays
  `Europe/London` explicitly and does not convert across timezones.
- A slot is initially `AVAILABLE`. Preparing a response does not reserve it.
- Sending a proposal atomically rechecks the slot and marks it `HELD_FOR_PROPOSAL`.
- Tenant confirmation changes the slot to `CONFIRMED`; tenant decline or expiry changes it back to
  `AVAILABLE`.
- A proposal has a fixed 24-hour response window from the send time. The injected application clock
  makes expiry deterministic in tests; no external calendar is consulted.
- If the selected slot is no longer available, the send or confirm operation fails visibly and does
  not silently choose another slot.

## 6. Role projections

### Tenant projection

The tenant may see the listing, its own request preferences, request state, the tenant-facing agent
response, permitted slot details, deadlines, and a tenant-safe status timeline.

The tenant must not see `AgentReviewNote`, unrelated requests, agent credentials, or internal
availability reasoning.

### Property-agent projection

The property agent may see assigned request facts, relevant listing facts, bounded synthetic
availability, prepared response state, agent-only notes, and actions permitted by the current state.

The agent must not see tenant credentials, raw private context, or data outside the assigned request
projection.

## 7. Candidate domain operations

These names are logical operations, not finalized transport names:

- `readListing`;
- `createViewingRequestDraft`;
- `updateViewingRequestDraft`;
- `submitViewingRequest`;
- `readAgentRequestQueue`;
- `readViewingRequestForAgent`;
- `startAgentReview`;
- `readAvailability`;
- `prepareSlotProposal`;
- `prepareAgentDecline`;
- `editPreparedResponse`;
- `sendSlotProposal`;
- `sendAgentDecline`;
- `confirmProposedViewing`;
- `declineProposedViewing`; and
- `resetSyntheticFixture`.

Every state-changing operation must validate actor role, assignment, current state, expected
version, bounded input, and the allowed transition before writing.

## 8. Domain invariants and write behavior

- A request belongs to one synthetic tenant and one authorized agent assignment.
- A fixture contains at most one Viewing Request; a second submit cannot create a duplicate.
- A listing version used for a request cannot be silently replaced during a write.
- A prepared response is not a sent proposal, and a sent proposal is not a confirmed viewing.
- Every successful state-changing operation increments the request version once and emits one audit
  entry.
- Repeating the same completed command is idempotent and returns the existing result without a second
  audit entry. A conflicting command fails with the current state.
- Stale versions fail visibly and never overwrite newer state.
- A tenant can never read agent-only notes, and an agent can never use the request record to
  impersonate the tenant.
- Reset restores seeded listings, slots, identities, empty request state, and empty audit history;
  it also increments the fixture generation so stale pages cannot write to the new fixture.
- The first fixture contains no real-person or real-property data.

## 9. Open model decisions

These are implementation choices, not unresolved MVP business rules:

- whether records use one table or separate persistence records;
- identifier representation;
- concrete session storage and authentication library;
- transport and serialization format;
- audit storage and development-only inspection surface; and
- how a future external event maps to a domain transition without becoming business authority.
