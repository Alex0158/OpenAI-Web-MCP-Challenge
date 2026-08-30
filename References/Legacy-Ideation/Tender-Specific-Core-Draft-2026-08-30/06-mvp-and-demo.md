# TenderRelay Challenge MVP and Demo

**Role:** CANONICAL challenge scope and execution target  
**Status:** Build-ready scope pending continuation bridge evidence  
**Last updated:** 2026-08-30

## 1. MVP objective

Prove one memorable loop: an Agent-assisted tender response can safely leave the page, be
recalled by one user-authorized clarification event, return to the authoritative page, use
the tools for the new stage, and stop for human approval.

The MVP is a product proof, not a general protocol platform or complete procurement suite.

## 2. The judge-visible story

> A bidder and Agent prepare a tender response together. The bidder authorizes one future
> clarification event and leaves. A reviewer requests clarification. TenderRelay resumes the
> same workflow, reopens the tender, verifies the new stage, and lets the Agent prepare the
> clarification response. The bidder remains responsible for final approval.

The “wow moment” is not the notification. It is the visible transition from an ended Agent
turn to a resumed context that opens the changed page and gains a different WebMCP tool
surface without the user reconstructing the task.

## 3. Synthetic scenario

### Tender

- ID: `T-102`
- Title: `Community Facilities Energy Retrofit`
- Bidder: fictional `Northstar Works`
- Buyer: fictional `Riverton Council`
- Initial requirement: submit a concise delivery approach and evidence summary
- Clarification: explain how the proposed timeline handles a named site-access constraint

All names, documents, and data are synthetic. No real procurement, confidential bid, or
third-party trademark is required.

## 4. Human roles and pages

### Bidder workspace — primary page

- tender identity, stage, deadline, and requirements;
- response or clarification draft;
- Agent activity and current tool stage;
- re-entry permission summary;
- event and run status;
- human approve/reject controls and receipt.

### Reviewer control — minimal supporting page

- current tender state;
- one button to request clarification;
- clarification text fixture;
- event delivery status.

This is a demonstration control, not a full reviewer product.

### Reset and diagnostics

- one deterministic scenario reset;
- correlated event/run timeline;
- tool inventory by stage;
- visible failure reason for invalid or duplicate events.

Diagnostics should support verification without becoming a third product surface.

## 5. Site Tool inventory

Use five unique tools at most.

| Tool | Stage | Type | Human-visible result | Key guard |
|---|---|---|---|---|
| `get_tender_context` | Initial and clarification | Read | Current tender, stage, requirements, versions | Bounded output; current user authorization |
| `prepare_bid_draft` | Initial | Draft mutation | Initial response draft and revision | Expected workflow state and draft revision |
| `request_reentry_setup` | Initial | Permission preparation | Plain-language re-entry offer | Creates no grant without Receiver-owned user approval |
| `get_clarification_context` | Clarification | Read | Clarification request and relevant current draft | Available only in clarification state |
| `prepare_clarification_draft` | Clarification | Draft mutation | Visible clarification draft and revision | Expected clarification and artifact revision |

Final approval and submission are deliberately performed through the human UI.

## 6. Minimum system shape

- one public web application;
- one authoritative application database;
- one tender state machine;
- one transactional outbox or database-backed delivery queue;
- one Continuation Gateway/Receiver path;
- one selected Agent Continuation Adapter;
- one event type: `clarification.requested`;
- one active grant per scenario;
- one correlated audit timeline;
- one public repository and deployment pipeline.

Do not introduce Redis, a generic message bus, microservices, multiple Agent platforms, or
production multi-tenancy unless the selected runtime makes one unavoidable.

## 7. In scope

- human and Agent share one visible tender artifact;
- genuine imperative WebMCP tool registration;
- state-derived initial and clarification tool surfaces;
- plain-language grant configuration and revocation;
- signed typed event and durable deduplication;
- same-context Agent continuation;
- canonical page re-entry and fresh state validation;
- visible clarification draft and human approval boundary;
- audit timeline, safe duplicate handling, and deterministic reset;
- public deployment, instructions, tests, and narrated demo.

## 8. Out of scope

- real buyer or procurement-system integration;
- live tender submission, payments, or legal declarations;
- general cross-site continuation standard;
- portal marketplace or bidder content library;
- site-owned LLM or RAG system;
- production organization administration;
- multiple event types or parallel workflows;
- cross-device Receiver migration;
- background processing of full confidential tender documents;
- claims of production security certification or universal client support.

## 9. Build sequence

### Gate 0 — Continuation bridge

Build the two-stage technical fixture and pass the P0 protocol in
[`05-validation-and-evidence.md`](05-validation-and-evidence.md). Record the concrete adapter
choice in an ADR.

### Slice 1 — Authoritative workflow and human UI

- implement the tender, drafts, clarification transition, approval, and reset;
- make state versions and artifact revisions visible;
- use synthetic fixtures only.

### Slice 2 — WebMCP page surface

- register the five tools against the same domain and policy layer as the human UI;
- verify discovery, valid use, invalid input, stale revisions, and stage changes.

### Slice 3 — Grant and event path

- implement the re-entry offer, user-controlled grant, opaque binding, outbox, signature,
  replay control, event sequence, and run reservation.

### Slice 4 — End-to-end re-entry

- connect the selected Agent adapter;
- resume, open the canonical URL, read fresh state, discover clarification tools, and prepare the draft.

### Slice 5 — Trust and judge hardening

- implement revocation, expiry, one-run limit, duplicate handling, auth failure, audit timeline,
  clean reset, error copy, and clean-room instructions.

### Slice 6 — Submission freeze

- deploy the exact public build;
- verify repository, license, setup, tools, video, and description;
- capture evidence and stop feature work.

## 10. Demo storyboard — maximum three minutes

| Time | Screen and action | Evidence shown |
|---:|---|---|
| 0:00–0:15 | State the asynchronous-workflow problem | Why a normal one-page Agent session is insufficient |
| 0:15–0:40 | Open `T-102`; Agent reads context and prepares initial draft | Genuine page tools and shared visible state |
| 0:40–1:00 | User approves “return for one clarification” | Scope, expiry, one run, human boundary |
| 1:00–1:15 | Leave/end the turn; reviewer requests clarification | Real backend state transition and typed event |
| 1:15–1:45 | Receiver resumes the same workflow and opens the tender | Core continuation bridge and canonical re-entry |
| 1:45–2:10 | Agent reads clarification and prepares a response draft | Changed stage and changed Site Tool surface |
| 2:10–2:30 | User reviews and approves | Human control and visible receipt |
| 2:30–2:50 | Show correlated timeline and duplicate-event safety | Trust, reliability, and execution completeness |
| 2:50–3:00 | Restate the product contribution | WebMCP makes the page actionable; TenderRelay makes the workflow returnable |

Avoid slides that narrate unimplemented architecture. Prefer the live product, with one
brief diagram only if it clarifies the event-to-page handoff.

## 11. Definition of done

### Product

- one clean synthetic scenario completes from initial response through clarification approval;
- user-visible status never confuses draft, approved, and submitted states;
- reset returns the application to a deterministic initial condition.

### WebMCP

- deployed source contains real `document.modelContext.registerTool` calls;
- tools are discovered and invoked in the supported judge path;
- tool inventory changes with workflow stage;
- writes validate state and artifact revision;
- normal human UI remains functional.

### Continuation

- one valid event produces one resumed run;
- the intended managed context resumes;
- the canonical URL opens and current state is read;
- the clarification-only tool is invoked from the resumed run;
- duplicate, revoked, expired, wrong-scope, and stale-state paths stop safely.

### Trust and evidence

- grant, event, run, tool, draft, and approval share a visible correlation path;
- secrets and confidential content are absent from logs and the public repository;
- tests and a clean-room run support every external claim.

### Submission

- public live URL works;
- public repository contains source, assets, setup instructions, and visible open-source license;
- English Devpost description explains WebMCP leverage, UX, human–Agent complementarity, and implementation;
- public narrated YouTube video is under three minutes;
- all team members and required fields are verified live before submission;
- deployed build, repository, video, and submission describe the same version.

## 12. Scope-control rule

Any proposed feature must answer both questions:

1. Does it materially help prove event-to-same-context-to-canonical-page-to-next-stage-tool?
2. Is it required for judge reproducibility, trust, or a submission hard gate?

If both answers are no, defer it until after the challenge.
