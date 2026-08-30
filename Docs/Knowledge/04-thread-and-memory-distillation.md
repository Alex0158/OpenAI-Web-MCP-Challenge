# Codex Thread and Memory Distillation

**Role:** SUPPORTING historical synthesis; non-authoritative  
**Status:** Active, redacted, and bounded  
**Observed:** 2026-08-30

## Handling rule

Codex threads and Memory are valuable because they preserve rationale, failed approaches,
candidate ideas, and questions that may not yet have been written into repository files.
They are not a substitute for current code, evidence, accepted decisions, or governing
rules. This document extracts only durable, non-secret knowledge and points it to the
current repository owner.

No raw transcript, private Memory path, task identifier, context identifier, bearer
capability, machine path, credential, or mutable runtime trace is copied here.

## Coverage and limits

The pass covered the visible recent project-related threads that materially shaped this
repository:

- the initial WebMCP technical research thread;
- the Challenge research-package thread;
- the WebMCP Challenge ideation and prior-art workshop;
- the Signal Rescue competition-pitch thread;
- the project-understanding and runtime-validation thread; and
- the current MVP-validation thread, including the Receiver clarification and the
  current request for knowledge governance.

Relevant Codex Memory summaries covering the same work were read as historical routing
evidence. Archived or unavailable conversations outside the visible project set were not
pretended to be exhaustively reviewed. This is therefore a high-value extraction of the
known in-scope sources, not a claim that every private conversation in the account has been
searched.

## Distilled knowledge map

| Conversation/source family | Durable extraction | Current classification and owner | Reconciliation note |
|---|---|---|---|
| **WebMCP technical research** | WebMCP is a page-local structured capability contract. The page can expose typed tools; the Agent, Browser, user, session, and live page can share context. It complements backend MCP and does not replace server authorization. | Level 2 external/platform fact; [product definition](../Core/01-product-definition.md), [system design](../Core/03-system-design.md), [WebMCP dossier](../../References/WebMCP_Analysis/00-Executive-Summary.md) | Keep the draft/implementation snapshot dated. Do not call it a finished W3C standard or durable workflow engine. |
| **Technical research follow-up** | Human UI and Agent tools may have different interaction sequences, but they must use one authoritative domain/policy layer. A WebMCP wrapper alone is an Agent-friendly remote control, not automatically new business logic. | Level 1 mechanism rule; [product definition](../Core/01-product-definition.md), [trust and reliability](../Core/04-trust-security-reliability.md) | This directly answers the recurring concern that “hidden tools” could become a second, drifting business system. |
| **Challenge research package** | Official Rules control eligibility, deadline, submission, judging, and legal terms. The hard gates include a working live URL, public repository/license/source, genuine WebMCP registration, English materials, and a short public demo; volatile details must be refreshed. | Level 1 governing snapshot; [official rules snapshot](../01-official-rules.md), [submission strategy](../02-submission-evaluation-strategy.md) | Older supporter and community dates remain conflict evidence, not extra deadline buffer. |
| **Challenge ideation and prior-art workshop** | A generic WebMCP app, tool wrapper, governance dashboard, or “human plus Agent” diagram is strategically weak because the broad pattern already has public prior art. A credible entry needs a domain-specific workflow, state/capability model, meaningful human decision, authoritative revalidation, and measurable WebMCP advantage. | Level 3 strategy hypothesis bounded by Level 2 prior-art research; [prior-art audit](../../References/WebMCP_Analysis/12-Prior-Art-and-Originality-Audit.md), [MVP and demo](../Core/06-mvp-and-demo.md) | Candidate quality is not project selection. The final app remains TBD. |
| **Signal Rescue pitch** | Signal Rescue was defined as a browser-native WebRTC call room: user describes symptom and priority, Agent reads privacy-minimized live telemetry, proposes a bounded reversible recovery, user approves, and the app verifies before/after with undo. | Level 3 candidate; [register K31](02-high-value-register.md) | The repository contains no Signal Rescue implementation or formal selection ADR. Do not present this as the current Receiver transport or a completed product. |
| **Project-understanding/runtime-validation thread** | The current proof flow is a WebMCP page offer → Receiver consent/Grant → opaque binding → signed typed event → Agent continuation → canonical page → fresh authority and tools → bounded work → human boundary. The thread also recorded a long-context relay failure and its compact-identity repair. | Level 1 mechanism plus Level 2 evidence; [current status](../Core/00-current-status.md), [P0/H1/H2 verdicts](../../mvp/evidence/README.md) | Current repository status and named verdicts supersede conversational summaries and older counts. |
| **MVP-validation thread** | The user’s understanding was essentially correct but needed three qualifications: the third-party backend is a local fixture contract, direct same-task wake used a private bridge, and the H1 event authorizes a scheduled continuation rather than directly waking Codex. | Level 1 claim boundary; [ADR-0004](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md), [register K22](02-high-value-register.md) | Keep “event accepted,” “Agent resumed,” and “Site Tool invoked” as separate evidence facts. |
| **Current user question about innovation** | The strongest current contribution is not the Receiver component alone or a new standard claim. It is the composition of consent-gated event handling, page-authoritative re-entry, state-derived tools, and a human consequence boundary, subject to domain-specific validation. | Level 1 claim boundary plus Level 3 originality hypothesis; [current status](../Core/00-current-status.md), [prior-art audit](../../References/WebMCP_Analysis/12-Prior-Art-and-Originality-Audit.md) | This preserves ambition while avoiding an unsupported “historical first” statement. |
| **Memory: source-of-truth and documentation-first preference** | Decisions and evidence should be written into owning documents, facts/assumptions/unknowns must stay distinct, and current repo/runtime evidence outranks historical chat summaries. | Level 1 governance practice; [Knowledge README](README.md), [priority model](01-priority-and-classification.md) | Applied here through owner links, levels, evidence state, freshness, and non-destructive dispositions. |
| **Memory: failure guidance** | Do not call a generic wrapper innovative, do not treat a shortlist as implementation, do not infer uniqueness from public search, and do not describe Signal Rescue as built or production-ready without runtime proof. | Level 2/3 guardrails; [register K19, K21, K30, K31](02-high-value-register.md) | These are durable negative lessons and should remain visible to future collaborators. |

## Conversation claims that are now superseded

The following statements appeared in earlier thread summaries and must not be reused as
current truth:

1. **“80/80 tests passing.”** This was an intermediate count. The current full suite is
   88/88 after H2; P0, H1, and H2 counts must still be named by scope.
2. **“The workspace is not a Git repository.”** That described the pre-initialization parent
   workspace. The shareable Git boundary is now `WebMCP_Challenge/`.
3. **“WebRTC Receiver.”** That belongs to the Signal Rescue candidate. The current MVP uses
   WebMCP, local HTTP, HMAC-signed events, and adapters; a code scan found no WebRTC path.
4. **“The backend directly wakes Codex.”** The current evidence separates a private local
   Desktop bridge from the H1 scheduled-pull route. No public direct-wake contract is
   established.
5. **“The tender product was selected.”** ADR-0002 explicitly demoted TenderRelay to a
   reference scenario and left the app, user, customer, and name open.
6. **“A clean thread summary is enough to prove portability.”** C1 and M1 are bounded,
   same-environment evidence with app-held source traces, not public clean-room or model
   parity packages.

## What should be promoted later

Promote a thread or Memory insight only when it has an owning repository artifact:

- a durable product or authority choice becomes an ADR;
- a current behavior becomes a Core contract and a test/evidence link;
- an experiment becomes a frozen protocol plus a redacted verdict;
- a candidate becomes a selected app only through an app-selection ADR; and
- a volatile external fact becomes a dated source snapshot with a refresh path.

Until then, keep it in Level 3 or Level 4 and do not let repetition in chat inflate its
authority.

