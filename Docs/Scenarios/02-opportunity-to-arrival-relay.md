# Candidate Scenario B — Opportunity-to-Arrival Relay

**Role:** CURRENT REASSESSMENT LEAD — NOT SELECTED  
**Selected as the challenge demo app:** No  
**Implementation status:** Concept only; not implemented or validated  
**Primary pattern:** Project-aware application continuation plus a bounded cross-site arrival relay  
**Last updated:** 2026-08-31

**Comparative research disposition:** Reassessed from reserve to the current scenario-level lead
after clarifying that later rounds may contain reviewer-authored custom questions and that travel
is a causally connected interoperability proof, not an unrelated feature. This is not an accepted
app-selection decision. The earlier ranking in the
[three-candidate app-selection review](../Research/23-three-candidate-competition-app-selection-review.md)
and scenario index now preserve both the original baseline and the current provisional ranking;
an accepted ADR is still required to select the application.

## Comparative Research Update

The application-side problem is real. The earlier comparative review also relied on two
assumptions that the clarified concept does not require: that later-round questions are fixed
forms, and that the flight workflow is an unrelated second product. Correcting those assumptions
materially changes the candidate's competitive position.

- **VERIFIED:** NIH estimates approximately 22 hours for the paperwork in a regular research
  project grant application, excluding the scientific plan. In a bounded review of four federal
  programs that help fund nondiesel school buses, GAO documented duplicative application
  information across three EPA programs and reported that past applications could not simply be
  resubmitted when program requirements or applicant facts had changed.
- **VERIFIED substitute:** established platforms such as Good Grants and Submittable already
  support multiple rounds, stage-dependent forms, reviewer tasks, notifications, and advancement
  decisions. Stage orchestration remains prior art rather than the innovation.
- **USER-SUPPLIED DESIGN CLARIFICATION:** a reviewer may create a targeted question only after
  reviewing this specific submission, for example asking what is technically distinctive or how
  one mechanism is implemented. The exact question is therefore neither fixed at enrollment nor
  safely answerable from a stored form template.
- **INFERENCE:** the strongest Agent task is reconciliation across three changing authorities:
  prior submitted claims, current project truth, and the current reviewer-authored question on the
  live page. This makes the original project context more directly valuable than in either of the
  other candidates.
- **USER-SUPPLIED DESIGN CLARIFICATION:** acceptance creates a real adjacent goal—attending the
  selected opportunity. The flight surface is intended to prove that the resumed Agent can carry
  an outcome into another independent WebMCP site, not that flight booking itself is novel.
- **VERIFIED novelty pressure:** Chrome's official WebMCP workflow guide already uses flight
  booking as a worked example. The challenge claim must therefore be the causal, authority-safe
  relay from application outcome to an independent site, never merely “the Agent books a flight.”
- **RECOMMENDATION:** make one custom review question the mandatory judged core. Retain a compact
  acceptance-to-flight epilogue only when it uses an independent Site Tool surface, transfers
  minimal signed trip facts, preserves site-specific authority, and does not endanger the complete
  application proof.

This produces a **two-act concept with one mechanism**, not two equal products:

1. **Act I — longitudinal continuation:** a later custom review request resumes the project-aware
   Agent, which re-enters the authoritative portal and stages a current, evidence-backed answer.
2. **Act II — horizontal interoperability:** acceptance creates a minimal travel handoff; the
   already resumed Agent visits an independent flight surface, discovers that site's current
   tools, and prepares or holds an itinerary inside a separate authority boundary.

The broader concept may remain **Opportunity-to-Arrival Relay**. The application-only fallback may
still be called **Application Continuation Relay** if the cross-site epilogue fails its clarity or
reproducibility gate.

### Protocol and claim boundary

WebMCP does not currently define this project's wake handshake, Re-entry Manifest, Continuation
Grant, Receiver, Local Connector, or Agent activation semantics. WebMCP lets each live page expose
its current first-party actions and state through Site Tools. This project layers page-authored
future re-entry semantics, bounded consent, typed events, continuation transport, and mandatory
canonical re-entry on top. The submission must say that the sites expose offers and actions
*through* WebMCP, not that WebMCP itself wakes a dormant Agent.

The same separation applies across sites. Application acceptance may carry signed trip facts, but
it cannot transfer application authority into the flight site. The flight site owns its tools,
current inventory, user confirmation policy, and any separate grant required for a consequential
action.

## 1. Executive Summary

Opportunity-to-Arrival Relay is a two-application scenario that demonstrates a persistent
Agent continuing work across time, application stages, and independent websites. The first
web application is a competition application platform. The second is a flight booking
platform. The participant begins an application while working with Codex inside the software
project that contains the relevant source code, decisions, evidence, conversations, and
delivery history. The application website declares its future stage requirements through a
machine-readable re-entry manifest. The participant and Agent agree in advance on the
materials, limits, approval rules, and continuation policy for those future stages.

When the competition advances the application, its Host backend commits the new state and emits a
typed business event to the Cloud Receiver rather than only notifying a human. Receiver Core
validates the event and reserves one bounded delivery. The Local Connector and selected
Continuation Adapter activate the bound Agent context. The Agent recovers the project context,
re-enters the live application page,
reads the current stage and currently available Site Tools, reconciles the new requirements
against the current project, and prepares the next submission package. The page remains the
authority for application state. The Agent's workspace memory helps it reason, but does not
authorize actions or replace fresh page state.

If the application is ultimately accepted, the acceptance event can initiate a second,
independent workflow on the flight booking website. That site exposes its own manifest,
grant, event semantics, current-state tools, and human boundaries. The Agent can prepare or,
where explicitly authorized and safe, execute a bounded travel workflow without the
competition platform knowing how the flight platform works.

The scenario's central proposition is:

> Notify the Agent to continue the work, not merely the human that more work exists.

The stronger and safer formulation is:

> Let acceptance of a typed business event authorize one bounded continuation delivery, require
> the Agent to re-enter the live page, and allow it to complete only the work that remains inside
> the user's explicit authority envelope.

This candidate is especially strong as a demonstration of interoperability and longitudinal
continuity. Its principal weakness is scope: two applications, several stages, media and code
artifacts, identity assertions, and a purchase boundary are difficult to explain and verify in
a short hackathon demo. A challenge implementation would therefore need a deliberately narrow
slice.

## 2. Product Thesis

Most workflow products notify a person when an application changes state. The person must
notice the message, recover context, reopen the correct website, discover what changed,
locate the original project materials, brief an AI again, and manually coordinate the next
submission. That sequence is expensive even when each individual task is simple.

Opportunity-to-Arrival Relay treats the stage transition itself as a continuation event. The
website describes what a future Agent may be asked to do; the Receiver records the user's precise
accepted subset and private managed-context binding; the Host stores only an opaque binding; and
the later accepted delivery reaches the selected Continuation Adapter. The Agent is useful because
it can reconcile requirements
against a large, evolving project context. WebMCP is useful because the live site defines the
current tools and state-specific action surface.

The product is not an email parser, a background macro, or an Agent that is permanently
logged into every website. It is a protocol-shaped workflow in which:

1. the page authors the future re-entry semantics;
2. the user grants a bounded authority envelope;
3. the external business event is typed and minimally scoped;
4. Receiver Core authenticates the event and decides whether the matching Grant is eligible;
5. the Agent returns to the canonical page;
6. the page exposes tools derived from current state;
7. consequential actions remain visible and governed;
8. every transition produces a receipt.

## 3. The User Problem

### 3.1 Fragmented longitudinal work

A serious application may take weeks and span several review rounds. The information needed
for later rounds already exists, but it is distributed across code, documentation, design
files, recorded decisions, test output, conversations, and the user's memory. Conventional
application portals store form answers, not the reasoning and evidence needed to regenerate
the next package.

### 3.2 Repeated human reactivation

Every advancement email creates a manual restart cost:

- recognize which application changed;
- determine the exact stage and deadline;
- recover the original submission rationale;
- map new questions to the latest project truth;
- identify the correct source revision and evidence;
- draft or assemble new artifacts;
- return to the portal and submit them;
- repeat the process if another stage opens.

The work is not only form filling. It is context recovery, evidence selection, consistency
checking, and deadline-sensitive coordination.

### 3.3 Cross-domain follow-through

Winning or being accepted often creates a new workflow elsewhere: travel, accommodation,
identity verification, event registration, or team coordination. Existing automation is
usually application-specific. It does not demonstrate that one Agent continuation can move
from one independent site's contract to another site's contract without a private integration
between the two services.

### 3.4 The trust problem

An Agent with broad permission to submit applications and buy travel would be dangerous. A
useful solution must distinguish:

- context from authority;
- preparation from commitment;
- a known future requirement from an arbitrary future instruction;
- an eligible event from an untrusted message;
- a reversible hold from a financial purchase;
- a project fact from an Agent inference.

## 4. Intended Users and Stakeholders

### 4.1 Primary user

An individual founder, builder, researcher, filmmaker, or team lead who uses an Agent-enabled
project workspace as the durable context for creating and submitting work.

The reference persona is Alex, who develops a software project with Codex. The Codex project
contains current product documents, source code, development evidence, conversation history,
and decisions relevant to the application.

### 4.2 Secondary users

- team members who contribute artifacts or approvals;
- competition operators who define stages and requirements;
- reviewers who need consistent and auditable submissions;
- travel providers that expose a governed Agent workflow;
- finance or operations owners who control purchase policy;
- security and compliance owners who need revocation and receipts.

### 4.3 Buyer and operator hypotheses

Possible buyers include application-platform operators, accelerators, grant programs,
conference organizers, universities, enterprises running internal innovation programs, and
travel platforms seeking Agent-native conversion. These are hypotheses, not validated demand.

The competition operator would operate the application-side event source. The travel platform
would operate its own workflow. The Receiver operator would own Grant and delivery authority; the
Agent platform, Local Connector, and Continuation Adapter would own their bounded activation
surfaces. No single operator should silently inherit authority from another.

## 5. Two Independent Web Applications

## 5.1 Application Platform

The application platform manages a staged selection process. A representative stage graph is:

```text
DRAFT
  -> STAGE_1_OPEN
  -> STAGE_1_SUBMITTED
  -> STAGE_1_UNDER_REVIEW
  -> STAGE_2_OPEN | REJECTED
  -> STAGE_2_SUBMITTED
  -> STAGE_2_UNDER_REVIEW
  -> STAGE_3_OPEN | REJECTED
  -> STAGE_3_SUBMITTED
  -> FINAL_REVIEW
  -> ACCEPTED | REJECTED | WAITLISTED
```

Representative requirements are:

- **Stage 1 — Initial application:** applicant identity, team summary, problem, idea,
  concept, target user, and preliminary differentiation.
- **Stage 2 — Founder and project narrative:** founder video, project-description video,
  refined narrative, milestones, and responses to reviewer questions.
- **Stage 3 — Technical review:** exact repository and commit, license, architecture,
  implementation explanation, verification evidence, security boundaries, and a detailed
  written application.
- **Final stage:** acceptance or rejection, event logistics, participation conditions, and
  any required human attestation.

The stage model is configurable. The demonstration must use a stable, small subset rather
than pretend to support every real competition format.

## 5.2 Flight Booking Platform

The flight platform begins only after the trip has a legitimate reason and the Agent has an
eligible continuation or a newly granted workflow. A representative booking state graph is:

```text
TRIP_NOT_STARTED
  -> REQUIREMENTS_READY
  -> OPTIONS_SEARCHED
  -> OPTION_SELECTED
  -> ITINERARY_HELD
  -> HUMAN_PAYMENT_REQUIRED
  -> BOOKED | HOLD_EXPIRED | ABANDONED
```

The flight app owns fare availability, passenger requirements, policy constraints, hold
expiration, and booking status. The competition platform should provide only the accepted
event and minimal event metadata. It must not manufacture flight inventory or purchase
authority.

## 6. Core End-to-End Scenario

### Phase 1 — Create the initial application

1. Alex opens the competition application page from the Codex project used to build the
   submission.
2. The page exposes current Stage 1 Site Tools and an offer describing possible future
   advancement events.
3. Codex reads the live application state and the relevant project files.
4. Codex prepares a Stage 1 draft grounded in current project truth.
5. Alex reviews identity statements, claims, and the application content.
6. The application is submitted through the appropriate human or explicitly bounded action.

### Phase 2 — Establish future continuation

1. The page presents a human-readable and machine-readable stage manifest.
2. It identifies possible future events, required materials, deadlines, maximum runs, and
   actions that will always remain human-only.
3. Alex and Codex prepare known reusable artifacts in advance where practical.
4. Alex grants only the desired future event classes for this exact application.
5. Receiver Core binds the Grant to the application, private managed context, expiry, and
   authority limits; the Host stores only the resulting opaque binding.
6. Alex closes the site and can stop the current session.

### Phase 3 — Advance to founder review

1. Reviewers advance the application.
2. The application platform emits `APPLICATION_STAGE_ADVANCED` with the application ID,
   previous stage, new stage, stage revision, deadline, and event ID.
3. Receiver Core verifies origin, Grant, scope, expiry, replay status, and run budget, then
   records one bounded delivery.
4. The Local Connector and selected Continuation Adapter activate Codex in the bound project.
5. Codex re-enters the canonical application page.
6. The page now exposes Stage 2 tools and hides obsolete Stage 1 actions.
7. Codex reads the exact founder-video and project-video requirements.
8. Codex assembles the already recorded material or prepares scripts, shot lists, captions,
   metadata, and a staged package.
9. Any required human performance, likeness approval, or attestation remains with Alex.
10. The page records a receipt for the prepared or submitted package.

### Phase 4 — Advance to technical review

1. A second eligible advancement event resumes the same bound continuation.
2. Codex re-enters the live page and sees the Stage 3 tool surface.
3. Codex checks the current repository state rather than relying on the Stage 1 snapshot.
4. It binds the technical package to an exact repository URL, branch or tag, commit SHA,
   license, test evidence, architecture description, and known limitations.
5. It detects contradictions between earlier application claims and current implementation.
6. It stages a corrected package and explicitly identifies unresolved evidence gaps.
7. Human-only declarations and any final consequential submission remain governed by the
   selected authority mode.

### Phase 5 — Acceptance and cross-site handoff

1. The platform emits `APPLICATION_ACCEPTED` for the exact application.
2. Codex resumes and re-enters the application page to confirm the current decision and trip
   metadata.
3. The acceptance page exposes an interoperable handoff record, not a command to purchase.
4. Codex opens the independent flight platform.
5. The flight platform presents its own manifest and current tools.
6. If a valid pre-existing travel grant exists, Codex continues within it. Otherwise it asks
   Alex to establish one.
7. Codex searches and compares options using the current inventory and policy.
8. Codex may place a reversible hold if explicitly allowed.
9. Payment, passenger attestation, or other consequential actions remain human-only unless a
   later accepted decision defines a narrower safe exception.

## 7. Why the Scenario Needs the Agent's Project Context

The project workspace is not merely convenient storage. It is the reasoning substrate for
later stages. It can contain:

- canonical product and architecture documents;
- current source code and exact revision history;
- test output and deployment evidence;
- decision records and rejected alternatives;
- user research and market assumptions;
- brand assets and approved media;
- previous application answers;
- the conversation that explains why choices were made;
- known gaps, disclaimers, and non-goals.

The Agent can use this context to generate a coherent next-stage package and to catch drift.
However, the workspace is not authoritative for live application status, deadlines, rights,
or available actions. Those facts must be read from the re-entered page.

The governing rule is:

```text
Workspace context explains the project.
The live page defines the current workflow state.
The Grant defines authority.
Receiver Core decides delivery eligibility.
The Continuation Adapter owns bounded Agent activation.
```

## 8. Persistent Domain Objects

### 8.1 Application record

```text
Application
- application_id
- competition_id
- applicant_id
- project_binding_id
- current_stage
- stage_revision
- status
- submitted_at
- next_deadline
- required_artifact_ids[]
- grant_id?
- continuation_binding_id?
- created_at
- updated_at
```

### 8.2 Stage requirement

```text
StageRequirement
- stage_id
- requirement_version
- title
- field_schema
- accepted_artifact_types[]
- maximum_sizes
- deadline
- human_attestations[]
- allowed_agent_actions[]
- prohibited_agent_actions[]
```

### 8.3 Submission artifact

```text
SubmissionArtifact
- artifact_id
- application_id
- stage_id
- kind
- source_uri?
- source_revision?
- content_hash
- provenance
- prepared_by
- reviewed_by?
- status
- created_at
```

### 8.4 Re-entry grant

```text
ReentryGrant
- grant_id
- user_id
- site_origin
- application_id
- allowed_event_types[]
- allowed_stage_transitions[]
- allowed_actions[]
- human_only_actions[]
- maximum_runs
- used_runs
- expires_at
- revoked_at?
- continuation_binding_id
- created_at
```

### 8.5 Travel handoff

```text
TravelHandoff
- handoff_id
- source_application_id
- event_id
- destination_city
- arrival_window
- departure_window
- traveler_count
- organizer_policy_reference?
- source_signature
- created_at
```

The handoff deliberately excludes payment credentials, passport data, broad natural-language
instructions, and hidden authority.

## 9. Re-entry Manifest

The application site's manifest should declare future semantics before the user leaves. A
representative conceptual shape is:

```json
{
  "offer_id": "offer_app_123_v4",
  "subject": {
    "type": "application",
    "id": "app_123",
    "revision": 4
  },
  "event_types": [
    "APPLICATION_STAGE_ADVANCED",
    "APPLICATION_STAGE_DEADLINE_CHANGED",
    "APPLICATION_ACCEPTED"
  ],
  "allowed_transitions": [
    "STAGE_1_UNDER_REVIEW->STAGE_2_OPEN",
    "STAGE_2_UNDER_REVIEW->STAGE_3_OPEN",
    "FINAL_REVIEW->ACCEPTED"
  ],
  "maximum_runs": 3,
  "expires_at": "2026-10-01T00:00:00Z",
  "human_only_actions": [
    "ATTEST_IDENTITY",
    "RECORD_NEW_FOUNDER_LIKENESS",
    "AUTHORIZE_PAYMENT"
  ],
  "canonical_reentry_url": "https://example.test/applications/app_123",
  "continuation_purpose": "Prepare the next eligible stage package"
}
```

The manifest is an offer, not a Grant. Receiver Core must persist the user's accepted subset and
must not infer acceptance from page presence, browser history, or prior Agent activity. The Host
receives only an opaque binding acknowledgement.

## 10. Event Contracts

### 10.1 Stage advancement event

```json
{
  "event_id": "evt_01J...",
  "event_type": "APPLICATION_STAGE_ADVANCED",
  "occurred_at": "2026-09-04T14:00:00Z",
  "site_origin": "https://competition.example",
  "subject": {
    "application_id": "app_123",
    "stage_revision": 7
  },
  "transition": {
    "from": "STAGE_1_UNDER_REVIEW",
    "to": "STAGE_2_OPEN"
  },
  "deadline": "2026-09-08T17:00:00Z"
}
```

### 10.2 Targeted review request event

The strongest challenge fixture uses a reviewer-authored question created after Stage 1 rather
than a fixed next-round form. The event carries only routing and version facts:

```json
{
  "event_id": "evt_01JQ...",
  "event_type": "APPLICATION_REVIEW_QUESTION_POSTED",
  "occurred_at": "2026-09-05T10:15:00Z",
  "site_origin": "https://competition.example",
  "subject": {
    "application_id": "app_123",
    "review_request_id": "review_req_17",
    "review_revision": 2
  },
  "deadline": "2026-09-08T17:00:00Z"
}
```

The event must not contain an executable instruction, a full reviewer prompt, or permission to
submit. After re-entry, the page returns the current question, the prior submitted answer, the
current stage revision, and the allowed response actions. Reviewer prose is untrusted content: it
may request an explanation, but it cannot expand the Grant, disclose unrelated project material,
or turn a human-only submission into an Agent action.

### 10.3 Acceptance event

```json
{
  "event_id": "evt_01K...",
  "event_type": "APPLICATION_ACCEPTED",
  "occurred_at": "2026-09-20T09:30:00Z",
  "site_origin": "https://competition.example",
  "subject": {
    "application_id": "app_123",
    "decision_revision": 3
  },
  "trip": {
    "destination_city": "San Francisco",
    "arrival_not_before": "2026-10-15T12:00:00-07:00",
    "arrival_not_after": "2026-10-16T17:00:00-07:00",
    "departure_not_before": "2026-10-19T18:00:00-07:00"
  }
}
```

Every event is a wake-up fact, not an embedded prompt. Every mutable requirement must be read
again from the canonical page. Free-form reviewer feedback is untrusted content inside the page,
never new authority.

## 11. Application-Side Site Tools

The full concept may expose different tools by state. The challenge implementation should
keep the visible inventory small.

### 11.1 Stage 1 tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_application_context` | Read competition, applicant, current stage, deadlines, and existing draft | Read-only |
| `stage_initial_application` | Save a reversible Stage 1 draft | Reversible write |
| `get_advancement_reentry_offer` | Return the site's future-event offer | Read-only |

### 11.2 Founder-review tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_stage_requirements` | Return the current versioned Stage 2 requirements | Read-only |
| `stage_founder_package` | Attach approved existing media, scripts, captions, and metadata to a draft package | Reversible write |
| `submit_founder_package` | Submit only when the authority mode explicitly permits it | Consequential write |

### 11.3 Targeted-review tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_review_question_context` | Read the current custom question, review revision, deadline, prior answer, and response constraints | Read-only |
| `stage_review_response` | Stage a revision-bound answer with cited current project evidence and explicit unresolved gaps | Reversible write |
| `validate_response_consistency` | Compare the draft with prior claims, current project facts, and the question actually asked | Read-only |

The challenge fixture should make the question genuinely project-specific. A suitable example asks
how the re-entry mechanism avoids stale tool authority after a stage transition, while the project
contains a post-submission architecture change and new test evidence. A fixed profile or copied
form answer should fail the fixture.

### 11.4 Technical-review tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_technical_review_requirements` | Read exact fields, evidence rules, and current deadline | Read-only |
| `stage_technical_package` | Save repository, commit, license, architecture, limitations, and evidence | Reversible write |
| `validate_submission_consistency` | Compare the staged package with prior answers and current constraints | Read-only |
| `submit_technical_package` | Submit only under a valid bounded authority mode | Consequential write |

### 11.5 Acceptance tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_acceptance_package` | Read decision, attendance requirements, venue, and deadlines | Read-only |
| `create_travel_handoff` | Produce a signed, minimal handoff record | Reversible write |

Obsolete tools must disappear when the stage changes. A stale Agent must not be able to call a
Stage 1 draft tool after Stage 3 is active.

## 12. Flight-Side Site Tools

| Tool | Purpose | Consequence |
|---|---|---|
| `get_trip_requirements` | Read traveler policy, arrival window, baggage, accessibility, and current grant | Read-only |
| `search_current_flights` | Query current eligible inventory | Read-only |
| `compare_policy_compliant_options` | Return a structured comparison grounded in current fares and policy | Read-only |
| `hold_selected_itinerary` | Create a short-lived reversible hold if supported and authorized | Reversible write |
| `prepare_booking` | Stage passenger and itinerary details without charging | Reversible write |

`purchase_itinerary` is intentionally absent from the challenge tool surface. A future product
could evaluate a tightly bounded payment authority, but that is outside the current mechanism
and would require a separate accepted security and product decision.

## 13. Authority Modes

The scenario contains a real tension between the user's desired autonomous continuation and
the current project's visible human-consequence boundary. The candidate should preserve both
possibilities without pretending that they are already resolved.

### 13.1 Conservative challenge mode

- Agent autonomously resumes, reads, reconciles, and stages.
- Human approves final application submission.
- Agent may search, compare, and hold travel.
- Human authorizes payment and confirms passenger declarations.
- This mode is safer, easier to explain, and aligned with current Core requirements.

### 13.2 Pre-authorized continuation mode

The Agent may submit a later-stage package without a synchronous human click only if all of
the following are true:

1. the exact application and stage transition were included in the grant;
2. the allowed action was named explicitly;
3. the inputs are derived from pre-approved artifacts or bounded transformations;
4. the requirement version and stage revision match;
5. no new identity, legal, financial, or publication attestation is introduced;
6. all policy checks pass;
7. the run remains inside expiry and run limits;
8. a complete receipt is generated;
9. the user can revoke before execution;
10. Receiver Core, the Host backend, and the page each accept only their bounded part of the
    action.

This mode is the more ambitious expression of the idea, but it is not current project truth.
Selecting it would require an accepted decision record that narrows what counts as a safe
pre-authorized submission.

## 14. Human-Only Boundaries

The following actions should remain human-owned in the candidate unless explicitly changed by
a later decision:

- identity and eligibility attestation;
- acceptance of legal terms that changed after the grant;
- recording a new founder likeness or voice performance;
- claims about facts the Agent cannot verify;
- submission of confidential or private source code;
- disclosure of protected personal or team data;
- payment authorization;
- passport and immigration declarations;
- acceptance of a materially changed itinerary;
- escalation after conflicting reviewer instructions;
- extension or broadening of the Agent's grant.

The Agent should be able to prepare these decisions, show the evidence, and reduce the work
required from Alex. It should not silently convert contextual knowledge into authority.

## 15. Why WebMCP Is Essential

Without WebMCP, a generic Agent could still read email, scrape forms, or call private APIs.
That would miss the scenario's central value.

WebMCP contributes four indispensable properties:

1. **Page-authored semantics.** Each site describes its own current actions and future
   continuation offer.
2. **State-derived tools.** The tool surface changes when the application advances or the
   itinerary changes.
3. **Canonical re-entry.** The Agent returns to the live page instead of acting solely from
   stale memory or event payloads.
4. **Cross-site standardization.** The competition and flight sites can participate without a
   bespoke private integration with the Agent's project workspace.

Removing WebMCP would reduce the idea to portal-specific automation or brittle browser
scripting. Removing canonical re-entry would make the event payload or Agent memory an unsafe
shadow authority.

## 16. Why Agent Judgment Is Essential

The Host application and page should handle deterministic business policy. Receiver Core handles
continuation authority. The Agent is valuable where the new
stage creates an open-ended reconciliation problem:

- identify which current project facts answer new reviewer questions;
- explain how the project changed since Stage 1;
- choose the strongest evidence without overstating it;
- detect contradictions and propose corrections;
- assemble a coherent narrative across code, tests, design, and prior answers;
- adapt an approved message to a new format or time limit;
- compare travel options across preferences that are not reducible to a single price sort;
- explain trade-offs to the human at the consequence boundary.

The candidate fails its Agent-necessity test if later-stage work can be implemented reliably as
a fixed template and field-copying job. The demo must therefore include at least one material
change in project state or stage requirements that requires reasoned reconciliation.

## 17. Manifest-First Preparation

A distinctive feature is that later-stage work begins before the later stage exists. At Stage
1, the manifest can disclose likely future material classes without promising the exact future
questions. Alex and Codex can then prepare:

- an approved short founder biography;
- a long and short project description;
- a founder-video recording or approved source clips;
- a project-demo recording;
- architecture and security summaries;
- repository and license metadata;
- an evidence index;
- acceptable travel preferences and budget boundaries;
- explicit exclusions and human-only decisions.

This reduces latency while preserving freshness. The Agent does not blindly submit the old
material. It re-enters, reads the current requirements, checks the current project, and selects
or transforms only compatible material.

## 18. User Experience

### 18.1 Application page

The application page should show:

- current stage and stage revision;
- progress timeline;
- requirements and deadline;
- existing staged artifacts;
- current Site Tools or an understandable summary of available Agent capabilities;
- future re-entry offer;
- grant scope, run count, expiry, and revocation control;
- most recent continuation receipt;
- explicit human-only actions.

### 18.2 Host or workspace surface

The Host should show:

- bound project and continuation;
- originating site and application;
- accepted event types;
- last event and delivery status;
- reason for any rejected event;
- materials the Agent used;
- pending human decision;
- a direct route back to the canonical page.

### 18.3 Flight page

The flight page should show:

- source trip purpose and signed handoff summary;
- current inventory timestamp;
- traveler constraints and policy;
- ranked options with trade-offs;
- hold expiration;
- what the Agent may do;
- what still requires Alex;
- booking receipt only after a real human-authorized purchase.

## 19. Three-Minute Challenge Demo

The full product map is too broad for a reliable short demo, but concept breadth does not require
implementation breadth. The judged path should spend most of its time on one complete custom-review
continuation and use travel only as a compact second act.

### 0:00–0:15 — Show the result first

- Open on the resumed Agent staging an answer to a reviewer-specific technical question.
- Show that the answer cites a project change made after the original submission.
- Preview the later acceptance-to-travel relay in one visual beat without explaining it yet.

### 0:15–0:40 — Establish context and grant

- Show Alex's project with a current architecture note and one known limitation.
- Open the application at Stage 1.
- Have the Agent draft the initial answer from the project.
- Show the future review offer and grant one exact `APPLICATION_REVIEW_QUESTION_POSTED` event.

### 0:40–0:55 — End the session

- Close or leave the page.
- Make clear that the Agent is no longer sitting in a continuous browser loop.

### 0:55–1:15 — Create the later custom question

- Use a judge-visible reviewer control to ask a question that did not exist at enrollment.
- Make the question depend on a specific mechanism or implementation claim.
- Show accepted delivery and the bound continuation resuming.

### 1:15–2:05 — Mandatory re-entry and project reconciliation

- The Agent returns to the canonical page.
- Stage 1 tools are gone; targeted-review tools are present.
- The exact question is read from the live page rather than from the event payload.
- A source change made after Stage 1 creates a meaningful inconsistency.
- The Agent reads the exact current commit, current evidence, prior answer, and review revision,
  then stages a corrected response with limitations.

### 2:05–2:25 — Human boundary and receipt

- The page shows the staged answer, evidence, limitations, and a human-only final submit.
- Alex approves or deliberately leaves it staged.
- Show one correlated receipt linking the Grant, event, project revision, question revision, tool
  delta, and staged response.

### 2:25–2:50 — Acceptance-to-arrival epilogue

- Trigger `APPLICATION_ACCEPTED` for the same application.
- The resumed Agent re-enters the acceptance page and obtains only a signed minimal trip handoff.
- It visits an independent flight page, discovers that page's Site Tools, searches current
  inventory, and places at most one reversible hold.
- Payment and passenger attestation remain human-only.

### 2:50–3:00 — Thesis and reset

- State the two proofs: the Agent continued the same project across time, then carried the outcome
  into another independent WebMCP service without transferring authority.
- Reset both synthetic surfaces deterministically.

If the core application continuation cannot be shown completely and calmly before 2:25, remove the
flight epilogue from the submitted video rather than compressing or hiding evidence. The concept may
retain the interoperability thesis, but Execution cannot be sacrificed to make every extension
visible.

## 20. Why It Should Win

### 20.1 It demonstrates the complete mechanism, not only tool registration

The scenario can visibly prove offer, grant, session end, typed event, bounded delivery,
continuation resumption, canonical page re-entry, current-state tools, a useful Agent action,
and a human boundary. This is materially broader than a single-session page assistant.

### 20.2 It makes persistence understandable

The stages create a natural time gap. Judges do not need to imagine why a later event exists.
The application has genuinely changed state, and the next task uses the original project's
reasoning and evidence.

### 20.3 It demonstrates vertical and horizontal extensibility

- **Vertical continuity:** the same application progresses through several stages.
- **Horizontal interoperability:** acceptance initiates a workflow on another site.

Together they make the core concept feel like a reusable web standard rather than a feature
hard-coded into one application.

### 20.4 It shows why Agent memory matters without making memory authoritative

The Agent's project context is visibly valuable because later questions require code,
decisions, evidence, and narrative continuity. The re-entered page still defines current
state and tools. That separation is both technically credible and easy to explain.

### 20.5 It has a clear human story

The user does real creative and technical work once, defines the future operating envelope,
and is not repeatedly interrupted for context recovery. Humans remain responsible for new
claims, identity, legal terms, and payments.

### 20.6 It creates a protocol-level narrative

Neither site needs direct access to the user's complete Codex workspace. Neither site needs a
private integration with the other. The project connects page-authored semantics to a bound Agent
continuation through Receiver Core and a replaceable Continuation Adapter.

### 20.7 It can expose trust visibly

Stage revisions, exact commit hashes, grant limits, current tools, receipt history, and human
boundaries can all be shown on screen. Safety becomes part of the product experience instead
of an invisible claim.

## 21. Distinctive Capabilities

- stage-aware Agent continuation across days or weeks;
- up-front discovery of future material classes;
- exact application-to-project binding;
- reconciliation against current repository state;
- state-derived Site Tools;
- typed advancement and acceptance events;
- bounded multi-run grants;
- revocation and expiry;
- stale-stage rejection;
- evidence and artifact provenance;
- exact source revision binding;
- controlled use of existing media;
- cross-site workflow handoff;
- independent destination-site authority;
- reversible travel holds;
- visible human decision checkpoints;
- end-to-end receipts.

## 22. Value Proposition

### 22.1 Value to applicants

- less context-recovery work;
- faster response to stage deadlines;
- fewer contradictions across application rounds;
- better reuse of already approved project materials;
- clearer visibility into what the Agent can and cannot do;
- less risk of missing a stage because a notification was overlooked;
- easier transition from acceptance to logistics.

### 22.2 Value to competition operators

- more complete and timely submissions;
- structured stage requirements;
- better provenance for technical evidence;
- fewer support questions about what a stage requires;
- auditable Agent participation;
- an Agent-native application experience without owning the user's project context.

### 22.3 Value to travel platforms

- qualified, intent-rich travel workflows;
- explicit policy and authority rather than opaque automation;
- a path from preparation to conversion with a visible payment boundary;
- reusable participation in many event and application ecosystems.

### 22.4 Value to Agent and Host platforms

- a compelling reason for durable project-bound continuations;
- a repeatable contract for external business events;
- a visible trust and governance model;
- proof that the Agent can coordinate independent websites without bespoke orchestration code
  for each pair.

## 23. Business and Ecosystem Model

Potential models include:

- application-platform subscription for Agent-native staged workflows;
- per-active-application or per-successful-stage pricing;
- Receiver and Continuation Adapter infrastructure sold to participating websites;
- travel affiliate or conversion revenue, subject to disclosure and conflict controls;
- enterprise licensing for internal approvals, grants, procurement, or compliance workflows;
- certification or conformance tooling for sites implementing the re-entry standard.

The business model must not create hidden incentives for the Agent to submit low-quality
applications or choose higher-commission flights. Ranking explanations and commercial
relationships must be disclosed.

## 24. Adoption Incentives

### For application sites

- the site continues to own state and requirements;
- no need to ingest the user's full private project;
- Agent actions can be restricted to explicit stage tools;
- failed or stale calls can be rejected deterministically;
- the site gains higher-quality, more consistent applications.

### For flight sites

- the platform receives a structured trip intent;
- the user remains in the platform's normal governed flow;
- current inventory and fare rules remain authoritative;
- the platform can expose reversible steps before payment.

### For users

- one up-front authority decision can cover known future work;
- every grant is inspectable and revocable;
- the Agent returns to the actual site rather than acting invisibly;
- high-consequence actions remain visible.

## 25. Technical Architecture

```text
Competition Page and Host Backend
  |  WebMCP Site Tools + Re-entry Offer + signed state event
  v
Cloud Receiver / Receiver Core ---- opaque Host binding
  |
  | bounded delivery lease
  v
Local Connector -> Continuation Adapter -> Codex Project
                                             |
                                             v
                              Canonical Competition Page Re-entry
  |
  | signed minimal handoff after acceptance
  v
Flight Page -> its own WebMCP tools, grant, policy, and human boundary
```

### 25.1 Competition application

- authoritative application database;
- versioned stage requirements;
- event outbox;
- WebMCP registration derived from authenticated current state;
- idempotent draft and submission commands;
- reviewer simulator for the challenge demo;
- deterministic reset fixture.

### 25.2 Receiver and continuation layer

- Receiver Core owns Grants, private managed-context bindings, event authentication,
  deduplication, eligibility, scope, delivery leases, run budgets, expiry, and delivery receipts;
- the Host stores only an opaque binding and remains authoritative for application state;
- the Local Connector claims bounded deliveries through its paired identity; and
- the selected Continuation Adapter owns managed-context activation and typed runtime outcomes.

### 25.3 Agent workspace

- project-bound context;
- retrieval of current source and canonical documents;
- reasoned reconciliation;
- explicit uncertainty and provenance reporting;
- no authority to change its own grant.

### 25.4 Flight application

- current inventory service or deterministic challenge fixture;
- policy and traveler-preference state;
- short-lived hold state;
- separate grant and audit log;
- no dependence on the competition site's internal implementation.

## 26. Security, Privacy, and Trust Model

### 26.1 Event authenticity

Events require authenticated origin, integrity protection, timestamp checks, replay
protection, and exact subject matching. A copied acceptance email is not sufficient.

### 26.2 Least authority

Grants are bound to one user, origin, application, continuation, event set, action set, run
budget, and expiry. Cross-site continuation does not transfer the competition grant to the
flight site.

### 26.3 Context isolation

The application site should receive only outputs submitted through its tools. It should not
receive the Agent's entire project memory or private conversations. The flight site should
receive only the minimal trip handoff and user-approved traveler data.

### 26.4 Untrusted content

Reviewer comments, application text, project files, and fare descriptions are data. They
cannot expand permissions, modify the continuation binding, or instruct the Receiver, Host
application, Connector, or Adapter to ignore policy.

### 26.5 Version and freshness checks

Every consequential call should include expected stage or itinerary revision. Mismatches fail
closed and require a fresh read.

### 26.6 Artifact integrity

Media, repository snapshots, and written submissions should be content-addressed or versioned.
The receipt records exactly what was staged or submitted.

### 26.7 Data minimization

Typed events contain only routing and state-transition facts. Passport, payment, private code,
and sensitive identity data are never placed in the event payload.

## 27. Reliability and Failure Handling

| Failure | Required behavior |
|---|---|
| Duplicate event | Deduplicate by event ID and preserve one accepted run |
| Expired grant | Reject before resuming the Agent |
| Revoked grant | Reject and record revocation as the reason |
| Wrong application | Reject subject mismatch |
| Unexpected stage transition | Reject outside the allowed transition set |
| Stale stage revision | Re-enter and refresh; never force the old action |
| Changed requirements | Surface the difference and require policy-compatible adaptation |
| Missing project file | Mark evidence unavailable; do not invent it |
| Missing media | Prepare a plan or request human input; do not fabricate a founder recording |
| Tool unavailable | Stop safely and show current page state |
| Continuation adapter unavailable | Preserve the event and bounded retry state; do not claim completion |
| Flight inventory changed | Re-search and invalidate stale comparisons or holds |
| Hold expired | Return to search; never treat it as booked |
| Payment required | Stop at the human boundary |
| Conflicting instructions | Ask the human or follow the stricter policy |

## 28. Idempotency and Concurrency

Every event and write command must be idempotent. The application platform should reject a
second submission for the same stage revision unless it is an explicit revision workflow.
Draft writes should carry an expected revision. The flight hold should use an idempotency key
and expose its expiration.

If Alex or a teammate changes the application while the Agent is running, the Agent must not
overwrite the new state. A compare-and-set failure should cause a fresh read and a visible
reconciliation step.

## 29. Receipts and Observability

Each continuation should produce a receipt containing:

- event ID and authenticated source;
- grant ID and grant version;
- continuation binding;
- application or trip subject;
- state and revision observed at re-entry;
- Site Tools registered at that moment;
- project sources and revisions consulted;
- tool calls and outcomes;
- artifacts staged or submitted and their hashes;
- human decisions requested or completed;
- final run status;
- failure or rejection reason;
- timestamps and retry count.

The demo should show this receipt in a human-readable timeline. A log hidden in developer tools
is insufficient to communicate trust.

## 30. Competitive Positioning

This candidate differs from common WebMCP application patterns in several ways:

- It is not a one-session dashboard assistant; the valuable action occurs after the session.
- It does not assume that registration of many tools equals workflow value.
- It uses Agent project context for longitudinal coherence.
- It demonstrates a real stage transition and a changing tool surface.
- It separates cross-site interoperability from direct application-to-flight integration.
- It makes revocation, stage revision, provenance, and consequence boundaries first-class.

Its closest conceptual alternatives are email-triggered automation, applicant tracking
workflows, browser macros, and private API integrations. The differentiator is not that forms
can be filled automatically; it is that a site-authored, user-governed continuation returns a
bound Agent to live web state after an intrinsic business event.

## 31. Potential Impact

The pattern can generalize beyond competitions:

- grant and funding applications;
- university admissions;
- visa and licensing processes;
- procurement qualification;
- insurance claims;
- recruitment stages;
- conference speaking applications;
- creative commissions;
- vendor onboarding;
- compliance and certification renewals.

The travel handoff is one visible proof that the standard can connect adjacent workflows. It
should not be mistaken for the only expansion path.

## 32. Challenge MVP

### 32.1 Recommended narrow slice if this candidate is selected

The mandatory judged core should implement:

- one application;
- two visible stages: initial submission and targeted review;
- one reviewer-authored custom question created after the initial session;
- one `APPLICATION_REVIEW_QUESTION_POSTED` event carrying identifiers rather than instructions;
- one grant;
- one bound continuation;
- approximately five visible Site Tools;
- one project-state change that must be reconciled;
- one response that cites current evidence and rejects a stale prior claim;
- one human final-submission boundary;
- one correlated receipt; and
- one deterministic reset.

Only after that core passes should the build add a bounded epilogue:

- one acceptance event;
- one signed minimal travel handoff;
- one independently registered flight Site Tool surface;
- one current-inventory search and comparison;
- at most one reversible hold; and
- no payment or passenger attestation tool.

### 32.2 Explicit non-goals

- a production competition platform;
- real judge or Devpost integration;
- automatic legal or identity attestation;
- generated founder likeness or voice;
- private-repository submission;
- production payment processing;
- comprehensive flight inventory;
- autonomous ticket purchase;
- guaranteed production background execution;
- claims of public Agent-host portability without evidence.

## 33. Verification and Evidence Plan

### 33.1 Mechanism tests

- offer serialization and human-readable equivalence;
- grant creation, narrowing, expiry, and revocation;
- subject and transition matching;
- duplicate-event deduplication;
- continuation binding resolution;
- mandatory canonical re-entry;
- state-derived tool registration;
- stale-revision rejection;
- exact run-budget consumption;
- human-only action absence from the tool surface.

### 33.2 Application tests

- Stage 1 tools disappear after advancement;
- technical requirements are versioned;
- exact repository and commit are persisted;
- missing evidence is surfaced rather than invented;
- artifact hashes match the staged package;
- repeated submission is idempotent;
- reviewer reset recreates the golden path.

### 33.3 Flight tests

- signed handoff verification;
- minimal data transfer;
- independent travel grant requirement;
- current inventory refresh;
- policy constraint enforcement;
- hold expiration;
- payment tool absence;
- stale option rejection.

### 33.4 Judge-visible proof

- session visibly ends before the event;
- reviewer action visibly changes server state;
- event delivery has a receipt;
- Agent visibly resumes the bound project;
- Agent returns to the live page;
- tool inventory visibly changes;
- the Agent corrects a real project inconsistency;
- the human decision boundary is visible;
- reset works without hidden manual repair.

## 34. Success Metrics

Concept-level success metrics could include:

- time from stage opening to compliant staged package;
- percentage of eligible stage work completed without repeated human briefing;
- contradiction rate across stages;
- missing-evidence detection rate;
- percentage of events rejected correctly when invalid;
- duplicate side-effect rate;
- human intervention rate, separated into expected boundary decisions and failures;
- grant revocation effectiveness;
- percentage of tool calls made against fresh state;
- travel options that satisfy all declared constraints;
- user-reported confidence in knowing what the Agent did.

No metric is currently validated.

## 35. Principal Risks and Trade-offs

### 35.1 Scope overload

Two applications and multiple stages can obscure the core mechanism. A judge may remember the
forms and flight search but miss the re-entry standard.

### 35.2 Meta-hackathon framing

A competition application platform is immediately understandable in a hackathon, but it may
feel self-referential rather than like a broad independent market need.

### 35.3 Media authenticity

Founder video cannot be treated as ordinary generated text. New likeness, voice, factual
claims, and disclosure obligations create necessary human boundaries.

### 35.4 Submission authority

The most dramatic promise is autonomous later-stage submission. The current mechanism keeps
final consequential actions visible to the human. Overreaching would weaken trust and
contradict current product truth.

### 35.5 Travel-domain distraction

Travel is causally connected to acceptance and can demonstrate horizontal interoperability. It
still becomes a distraction if it is treated as a second full product. Fare volatility, passenger
data, payment, refunds, and supplier constraints must remain outside the synthetic challenge
surface. Its only justified judged role is to prove an independent WebMCP contract and authority
boundary after the application proof is already complete.

### 35.6 Continuation transport uncertainty

The production mechanism that reliably resumes an Agent across time is not yet selected or
proven. A hackathon demo can use a bounded adapter, but must label it honestly.

### 35.7 Deterministic substitute

If every later-stage requirement is known and every response is prewritten, a conventional
workflow engine could complete the job more reliably. The mandatory fixture therefore uses a
reviewer-authored custom question, a post-submission project change, a stale prior claim, and a
requirement to cite current evidence. The candidate fails if a fixed profile plus field-copying
template produces an equivalent answer.

### 35.8 Sensitive data

Applications and travel can involve personal data, private code, and payment information. The
challenge loop should use synthetic, public, and non-sensitive fixtures.

## 36. Kill Conditions

Reject or substantially redesign this candidate if any of the following remains true after a
prototype:

1. the full value can be reproduced by a deterministic form workflow with no meaningful
   Agent judgment;
2. the event does not occur naturally after the original session;
3. judges cannot understand the grant, re-entry, tool change, and human boundary within three
   minutes;
4. the flight epilogue requires a bespoke integration that undermines the open-standard claim;
5. the demo depends on private user data, payment, or an unverifiable external service;
6. the Agent does not need the original project context;
7. stale or duplicate events can produce repeated submissions;
8. the product cannot identify a plausible beneficiary, operator, buyer, and revocation owner;
9. enrollment and monitoring friction exceed the human work saved;
10. the continuation adapter cannot produce honest, repeatable judge-visible evidence.

## 37. Calibrated Candidate Scorecard

This remains a research estimate, not a selection decision or validated product score. The table
preserves the earlier broad-versus-application-only calibration for traceability. The clarified
two-act version has not received a new numeric score because its clarity and feasibility depend on
a timed storyboard. Directionally, custom questions strengthen Agent necessity, while a bounded
flight epilogue improves WebMCP leverage and ambition but reintroduces execution risk.

| Criterion | Weight | Original two-app scope | Application-only scope | Calibration rationale |
|---|---:|---:|---:|---|
| Real user pain | 15% | 2.2/3 | 2.4/3 | Application burden is verified; demand for Agent re-entry and buyer willingness are not |
| Intrinsic asynchronous event | 15% | 3.0/3 | 3.0/3 | Stage advancement naturally occurs later |
| WebMCP materiality | 15% | 2.6/3 | 2.9/3 | Current portal state is central; the flight site adds scope more than materiality |
| Continuity and state reuse | 10% | 3.0/3 | 3.0/3 | The changing underlying project is directly reused |
| Tool-surface transformation | 10% | 3.0/3 | 3.0/3 | Review-stage tools can change visibly |
| Human-Agent complementarity | 10% | 2.3/3 | 2.7/3 | Preparation is strong; final submission remains human-controlled |
| Three-minute clarity | 10% | 2.1/3 | 2.8/3 | Removing flight creates one coherent user problem |
| Build feasibility | 10% | 1.4/3 | 2.5/3 | One portal, event, and artifact are feasible; two apps are not justified |
| Judge reproducibility | 5% | 1.6/3 | 2.5/3 | Narrow fixtures help, but the continuation adapter remains unresolved |
| **Weighted total** | **100%** | **2.43/3** | **2.77/3** | Historical calibration; the clarified two-act scope requires re-scoring |

The portfolio-level reason to reconsider this candidate as lead is not a speculative higher
internal total. It is the combination of the strongest project-context dependency, a genuine
post-session custom reasoning task, and a concise proof that independent WebMCP sites can compose
without sharing authority. That advantage survives only if the application core remains coherent
and judge-reproducible.

## 38. Evidence Required Before Selection

- interviews or credible workflow evidence showing stage-notification reactivation cost;
- proof that users would grant bounded continuation for later application work;
- a demonstration that Agent reconciliation materially outperforms a template engine;
- a clear operator and buyer for the application-side workflow;
- a minimal flight-platform participation contract only before any optional interoperability
  expansion; it is not required for challenge selection;
- a repeatable continuation adapter;
- a usability test showing that users understand grant scope and revocation;
- a three-minute timed storyboard test;
- security review of cross-site handoff and artifact provenance;
- an explicit decision on conservative versus pre-authorized submission mode.

## 39. Open Product Questions

1. Is the strongest story the application workflow alone, or does the flight epilogue add more
   interoperability value than narrative complexity?
2. Which exact later-stage task requires Agent judgment rather than a deterministic template?
3. Is final application submission always human-only, or can a narrowly bounded class be
   pre-authorized?
4. How should the Receiver and selected Continuation Adapter prove that activation targets the
   correct Codex project without exposing private context to the site?
5. What happens if the user changes the project direction after granting continuation?
6. How should a reviewer requirement change invalidate pre-prepared artifacts?
7. What media can be transformed without a new human likeness or factual attestation?
8. Does the flight workflow require a grant established before acceptance, or can acceptance
   create only a non-consequential preparation offer?
9. Which party operates event delivery and who owns incident recovery?
10. What economic model pays for dormant continuations and later Agent runs?
11. What is the minimum evidence needed to claim cross-site interoperability rather than a
    staged demo handoff?
12. Would a grant, procurement, admissions, or conference workflow communicate the same
    mechanism with stronger commercial relevance?

## 40. Naming and Narrative Options

### Primary working name

**Opportunity-to-Arrival Relay**

### Alternative names

- Application Continuity Relay
- StageRunner
- Accepted, Then Ready
- Project-to-Portal Relay
- Next Round
- Continuation Passport

### Possible taglines

- “When the next round opens, your Agent already knows the work.”
- “From application to arrival, without restarting the context.”
- “The website advances the stage. Your Agent continues the project.”
- “Notify the Agent to continue, not the human to start again.”

## 41. Research Sources

These sources support the problem and substitute analysis, not product validation:

- [The WebMCP Challenge — Official Rules](https://webmcp.devpost.com/rules)
- [OpenAI — Site tools](https://learn.chatgpt.com/docs/webmcp)
- [NIH — Paperwork Burden](https://www.grants.nih.gov/grants/paperwork-burden.htm)
- [GAO-25-106887 — Diesel School Bus Alternatives](https://www.gao.gov/assets/gao-25-106887.pdf)
- [GAO-16-573 — Federal Research Grants](https://www.gao.gov/products/gao-16-573)
- [Good Grants — Ultimate guide to rounds](https://help.goodgrants.com/hc/en-gb/articles/9233235247887-Ultimate-guide-to-rounds)
- [Good Grants — Understanding action flow](https://help.goodgrants.com/hc/en-gb/articles/360001955915-Understanding-action-flow)
- [Submittable Next — Intake Forms](https://next.support.submittable.com/hc/en-us/articles/30264162866583-Intake-Forms)
- [Chrome — Build agentic workflows with WebMCP tools](https://developer.chrome.com/docs/ai/webmcp/build-tools)

External sources were checked on 2026-08-31. Vendor documentation establishes existing
capabilities, not independent performance or demand evidence.

## 42. Final Assessment

The clarified Opportunity-to-Arrival Relay is the current scenario-level lead recommendation,
subject to portfolio reconciliation and an app-selection ADR. It uses the original project context
more directly than the other candidates: a reviewer can ask a new, submission-specific question,
and the Agent must reconcile the live request with prior claims, current source, tests, decisions,
and evidence. That is a defensible Agent task rather than fixed-form automation.

The flight workflow should no longer be rejected merely because it widens the concept. Acceptance
creates a real adjacent life task, and a compact independent flight surface can demonstrate
horizontal WebMCP interoperability in a way Greenlight cannot. Flight booking itself is established
prior art and even an official WebMCP teaching example; the innovation claim is the governed causal
relay, minimal data handoff, fresh site-owned tools, and non-transfer of authority.

Opportunity should lead only if five conditions hold:

1. the custom question is created after enrollment and read from the live page;
2. the answer visibly depends on current project evidence and corrects a stale claim;
3. the application proof remains complete before the flight epilogue begins;
4. the flight page independently owns its tools and consequence boundary; and
5. the continuation path is honest, repeatable, and visible to a clean evaluator.

If any of the first three conditions fail, Greenlight becomes the safer lead. If only the
cross-site epilogue fails, retain the application-only fallback rather than rejecting the entire
candidate. This document does not select, implement, deploy, or validate the app.
