# WebMCP Re-entry Workflow — Demo App Selection and Challenge MVP

**Role:** CANONICAL app-selection framework and challenge execution target  
**Status:** Application-neutral Re-entry Core Program complete at `locally_verified`; demo app and supported continuation adapter remain unselected  
**Last updated:** 2026-08-31

This document owns app selection and challenge-MVP shape. Stable application-neutral lifecycle
contracts remain owned by the [Mechanism index](../Mechanisms/README.md).

## 1. Current decision boundary

The challenge entry is centered on the re-entry workflow mechanism. The website that
demonstrates it is a separate product decision.

### Fixed

- one user-scoped future event;
- one ended page session or Agent turn;
- one accepted bounded delivery;
- one selected continuation adapter resume of managed Agent context;
- one canonical page re-entry;
- one fresh state read;
- one changed WebMCP tool surface;
- continuation of the same artifact or decision process;
- one visible human decision boundary.

### Variable until app selection

- application domain and name;
- primary user and external actor;
- workflow record and artifact;
- event semantics;
- initial and resumed states;
- Site Tool names and schemas;
- consequence and human boundary;
- business model and long-term product scope.

## 2. Selection objective

Choose the smallest web application that makes the mechanism feel necessary, useful,
credible, safe, and visually obvious within a public three-minute demonstration.

Do not select a domain because its story sounds sophisticated. Select it because its
workflow creates the strongest observable proof with the lowest execution risk.

## 3. Hard selection gates

A candidate app is rejected if any answer is no:

1. Is there observed evidence of a current user problem, workaround, abandonment, or
   reconstruction cost without mentioning WebMCP?
2. Is there a real later business event after the initial page session, with a credible
   frequency and waiting window?
3. Does the same artifact, case, decision, or prior rationale matter before and after that
   event?
4. Must the Agent return to the live page to act correctly?
5. Does current state change which Site Tools should exist?
6. Is there a clear human boundary with a visible consequence?
7. Can the full loop use synthetic, public, non-sensitive data?
8. Is the product layer explicit: a Host feature, an integration platform, or an installed
   Agent-side companion?
9. Can a judge understand the value and observe the re-entry in under three minutes?
10. Can the team build it without private dependencies or a large external integration?
11. Would removing WebMCP materially weaken the experience rather than merely add clicks?

### Post-shortlist hypotheses and kill tests

The following questions must be recorded in the selection ADR and validated on the selected
workflow. An unresolved answer does not automatically reject a candidate before the
shortlist:

- Does the post-event work require judgment or synthesis that a deterministic Host rule or
  ordinary workflow engine cannot perform equivalently?
- Are the beneficiary, buyer, integration owner, operator, and revocation owner plausible for
  the selected product layer?
- Is the saved work plausibly greater than enrollment, consent, monitoring, and recovery
  friction per useful continuation?

## 4. Weighted scorecard

Score each surviving candidate from 0 to 3.

This scorecard is a non-binding prioritization heuristic. The accepted app-selection ADR,
not the weighted total, controls selection.

| Criterion | Weight | 0 | 3 |
|---|---:|---|---|
| Real user pain | 15 | Invented inconvenience | Specific recurring workflow cost or failure |
| Asynchronous event necessity | 15 | Could finish in one session | Later external transition is intrinsic |
| WebMCP materiality | 15 | Ordinary API is equivalent | Live page, session, and dynamic tools are central |
| Continuity value | 10 | No persistent artifact or rationale | Same work materially continues across stages |
| Tool-surface change | 10 | Same generic tools | New state produces visibly different domain tools |
| Human–Agent complementarity | 10 | Agent can safely do everything | Agent prepares; human judgment is essential |
| Three-minute clarity | 10 | Requires architecture explanation | Value is visible in the product within seconds |
| Build feasibility | 10 | Many integrations and failure surfaces | One self-contained vertical slice |
| Judge reproducibility | 5 | Builder-only setup | Public deterministic reset and clean instructions |

A high total does not override a failed hard gate.

## 5. Required app-selection record

The selection ADR must answer in one page:

- **App thesis:** What is the web application in one sentence?
- **Product layer:** Is this a Host feature, an integration platform, or an Agent-side
  companion?
- **Primary user:** Who owns the multi-stage work?
- **Buyer and operator:** Who pays, integrates, operates, supports, and revokes it?
- **External actor:** Who or what creates the later event?
- **Demand evidence:** What current workflow, workaround, event frequency, reconstruction
  cost, or abandonment evidence supports the candidate?
- **Persistent object:** What record, artifact, or decision continues?
- **Initial stage:** What is the user and Agent doing before they leave?
- **Event:** What exact state transition justifies re-entry?
- **Resumed stage:** What must happen after return?
- **Tool delta:** Which tool role disappears and which new role appears?
- **Human boundary:** What consequence remains human-controlled?
- **WebMCP necessity:** Why must the Agent return to the page?
- **Agent necessity:** Why is a deterministic Host job or workflow engine insufficient?
- **Demo proof:** What will the judge see in the first 30 seconds and at the re-entry moment?
- **Execution risks:** What could block a public clean-room run?

### Continuation transport requirements profile

The app-selection ADR must provide measured or bounded values for:

- event frequency, expected events per Grant, and waiting-window duration;
- maximum useful event-to-first-Agent-action latency;
- whether the user's device, Browser, or Desktop runtime may sleep, close, or be offline,
  including required catch-up and expiry behavior;
- required local, hosted, or hybrid execution and any cross-device assumptions;
- identity, privacy, data-residency, administration, pairing, and revocation constraints;
- expected concurrent Grants, events, and devices; and
- maximum no-op runs, Agent usage, operating cost, and operator burden per useful
  continuation or complete watch window.

Use `UNKNOWN` with a named validation step where evidence does not exist. These requirements
constrain adapter and topology selection after app selection; they do not select a topology
by themselves.

Do not begin the selected-app vertical slice before this record is accepted. Application-neutral
Re-entry Core protocol, authority, durability, Cloud Receiver, Local Connector, conformance,
and evidence work may proceed under ADR-0006 and RECORE-001 without inventing domain behavior.

## 6. Reference candidates

Reference scenarios are inputs to selection, not defaults. The TenderRelay dossier supplies
the first complete candidate, documented as
[Reference Scenario A](../Scenarios/01-tender-reference-scenario.md). It must pass the same
hard gates and scorecard as every other candidate.

## 7. Domain-neutral MVP shape

The selected app should contain:

- one public web application;
- one primary workflow page;
- one minimal control that creates the later state transition;
- one persistent workflow record and artifact;
- one authoritative state machine;
- one durable application database;
- one transactional outbox or database-backed queue;
- one Cloud Receiver, Receiver Core, and outbound Local Connector path;
- one selected Agent Continuation Adapter;
- one event type;
- one active grant per synthetic scenario;
- one correlated audit timeline;
- one deterministic reset.

Avoid microservices, multiple Agent platforms, broad event taxonomies, or production
multi-tenancy unless the selected runtime makes one unavoidable.

## 8. Required Site Tool roles

Use approximately five unique tools:

| Stage | Role | Required visible effect |
|---|---|---|
| Initial | Context reader | Show the Agent current workflow, artifact, stage, and versions |
| Initial | Draft or proposal writer | Create visible revisable work |
| Initial | Re-entry offer reader | Explain the future event without creating authority |
| Resumed | Follow-up context reader | Read the new event-related state and existing artifact |
| Resumed | Continuation writer | Continue the same artifact or decision process |

The selected app must replace these role labels with domain-specific names and schemas.
The final consequential action remains in the human UI.

## 9. Synthetic scenario template

The implementation document created after app selection must define:

| Field | Required value |
|---|---|
| Scenario name | Short, memorable, non-branded |
| Workflow ID | Stable synthetic identifier |
| Primary actor | Named domain role |
| External actor | Named person or system |
| Initial state | Concrete domain state |
| Initial artifact | Visible persistent object |
| Authorized event | One exact typed transition |
| Resumed state | Concrete domain state |
| Tool delta | At least one initial-only and one resumed-only tool |
| Human boundary | One visible consequential decision |
| Reset | One deterministic action returning to initial state |

## 10. Build sequence

### Gate 0A — Preserve the completed domain-neutral P0 mechanism proof

P0 is complete for controlled technical composability. Preserve its frozen
[evidence and contract](07-p0-technical-validation-mvp.md), and do not expand it into the
selected product or shipping adapter.

### Gate 0B — Preserve the completed Re-entry Core

This gate is complete at the application-neutral `locally_verified` boundary under ADR-0006
through ADR-0014 and RECORE-001 through RECORE-006. Preserve MVP1 and MVP2 as references, keep Host
and Agent adapters replaceable, and retain the verified contract, durability, process-boundary,
and resource claim limits without importing domain states, tools, or product claims.

Do not reopen this gate merely to begin app work. A stated Core falsifier or reopen condition is
required. Selected-app work proceeds through Gate 0C and its own bounded implementation record; it
does not authorize a generic platform, multiple Host implementations, or an unsupported Agent wake
fallback.

### Gate 0C — Select the app

Apply the hard gates and scorecard. Record the decision in a new ADR and specialize Core
requirements, security, validation, and tool inventory. This is the current product gate.

Full selected-app implementation requires the completed P0 proof, the relevant Re-entry Core
contract baseline, and an accepted app-selection ADR.

### Gate 1 — Validate and select the continuation adapter

Use the accepted app's continuation transport requirements profile to compare candidate
topologies before selecting an adapter. Do not promote the private P0 bridge as the shipping
adapter. Both tested standalone App
Server Desktop joins have failed in the current build. Workspace Agents document external
triggers, durable queueing, and stable conversation keys, but not Browser or genuine
page-bound WebMCP for API-triggered runs. Select and validate an adapter only after the app
defines its topology, latency, lifecycle, privacy, and cost constraints. A bounded Scheduled
pull may remain a challenge adapter when its watch window is economically acceptable; it is
not a core dependency or production default. Record an adapter ADR only after the chosen
route passes its genuine WebMCP join gate.

### Slice 1 — Host workflow and human UI

- implement the record, artifact, two domain states, human boundary, and reset;
- make state and artifact revisions visible;
- use synthetic fixtures only.

### Slice 2 — WebMCP surfaces

- register initial and resumed Site Tools against the same domain and policy layer as the UI;
- verify discovery, valid use, invalid input, stale revisions, and tool-surface changes.

### Slice 3 — Grant and event path

- implement offer, permission, opaque binding, outbox, signature, replay control,
  event sequence, revocation, and run reservation.

### Slice 4 — End-to-end re-entry

- consume one accepted pending delivery through the selected continuation adapter;
- resume the managed context;
- open the canonical URL;
- read fresh state;
- discover the resumed-stage tools;
- continue the same artifact;
- stop at the human boundary.

### Slice 5 — Judge hardening

- implement expiry, duplicate handling, auth failure, conflict handling, audit timeline,
  deterministic reset, error copy, and clean-room instructions.
- run a stranger-comprehension screen: after the demo, a viewer must identify the user
  problem, WebMCP's material step, the distinction between event and Agent wake, the changed
  tool surface, and the human-only boundary without first learning Receiver internals.

### Slice 6 — Submission freeze

- deploy the exact public build;
- verify repository, license, setup, tools, video, and description;
- capture evidence and stop feature work.

## 11. Three-minute demo framework

The domain content is TBD, but the proof rhythm is fixed:

| Time | Screen and action | Evidence |
|---:|---|---|
| 0:00–0:15 | State the selected asynchronous user problem | Why one live page session is insufficient |
| 0:15–0:40 | Open the workflow; Agent reads context and prepares visible work | Genuine WebMCP and shared state |
| 0:40–1:00 | User authorizes one future event | Scope, expiry, one run, human boundary |
| 1:00–1:15 | End the turn; external actor creates the state transition | Real backend event |
| 1:15–1:45 | Receiver shows one accepted pending delivery; the selected adapter resumes the intended workflow and opens the canonical page | Delivery/activation separation and continuation bridge |
| 1:45–2:10 | Agent reads new state and uses a new-stage Site Tool | Dynamic tool surface and continuity |
| 2:10–2:30 | User reviews and decides | Human control and receipt |
| 2:30–2:50 | Show correlated timeline and duplicate-event safety | Trust and completeness |
| 2:50–3:00 | Restate the mechanism contribution | Page actionability extended into safe re-entry |

Prefer the live product over slides. Use one brief architecture view only if it clarifies the
event-to-page handoff.

## 12. Definition of done

### App

- one selected synthetic scenario completes across two states;
- one persistent artifact or decision visibly continues;
- state, draft/proposal, human decision, and committed outcome are never confused;
- reset returns to a deterministic initial condition.

### WebMCP

- deployed source contains genuine imperative Site Tool registration;
- tools are discovered and invoked in the supported judge path;
- tool inventory changes with workflow state;
- writes validate current state and artifact revision;
- the human UI remains functional.

### Continuation

- one valid event creates one bounded accepted delivery;
- one selected continuation adapter later resumes the intended context;
- the intended managed context resumes;
- the canonical page opens and current state is read;
- a resumed-stage-only tool is invoked;
- duplicate, revoked, expired, wrong-scope, stale-state, and conflict paths fail safely.

### Trust and evidence

- grant, event, run, tool, artifact, and human decision share a visible correlation path;
- secrets and sensitive content are absent from logs and public source;
- tests and a clean-room run support every external claim.

### Submission

- public live URL works;
- public repository contains source, assets, setup, and visible open-source license;
- English submission explains WebMCP leverage, user experience, human–Agent complementarity, and implementation;
- public narrated video is under three minutes;
- deployed build, repository, video, and submission describe the same version;
- submission status is verified live.

## 13. Scope-control rule

Every proposed feature must answer:

1. Does it materially prove event-to-delivery-to-available-adapter-to-page-to-new-tools-to-human-boundary?
2. Is it required for user value, judge reproducibility, trust, or a submission hard gate?

If both answers are no, defer it.
