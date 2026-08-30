# ADR-0002: Separate the Re-entry Workflow Mechanism from the Demo Application

**Status:** Accepted  
**Decision date:** 2026-08-30  
**Decision owners:** Alex and project team  
**Scope:** Concept identity, application boundary, documentation authority, and next selection gate

## Context

ADR-0001 and the first Core draft treated TenderRelay as a selected tender/RFP product.
That interpretation overcommitted the project to the domain used in the concept dossier.

The team's actual decision is narrower and more important: the submission should prove a
resumable WebMCP workflow in which a user authorizes a later event to resume managed Agent
context, re-enter the authoritative page, discover the tools valid for the new state, and
continue under a human decision boundary.

The tender portal was used to make the mechanism concrete. It was not a decision that the
final web application, customer, persona, market, tool surface, or product name must be
tender-specific.

## Decision

1. Select the **WebMCP re-entry workflow mechanism** as the active project concept.
2. Keep the final host web application, domain, user, customer, event, artifact, state
   machine, Site Tools, and product name open until a separate app-selection decision.
3. Treat the TenderRelay dossier as an immutable concept reference and the tender flow as
   Reference Scenario A.
4. Keep Core documents domain-neutral. Domain-specific behavior belongs in Scenarios until
   one scenario is selected through an accepted ADR.
5. Require the selected demo app to prove the complete sequence:
   enrollment, grant, waiting, typed event, managed-context resume, canonical page re-entry,
   fresh state read, changed Site Tools, continued work, and human boundary.
6. Continue planning under the working assumption that the Agent continuation bridge can
   perform browser re-entry and resumed Site Tool invocation, while preserving the evidence
   gate.
7. Preserve the original tender-specific Core draft as historical evidence rather than
   silently erasing the misunderstanding.

## What is now canonical

- **Concept:** WebMCP re-entry workflow.
- **Mechanism:** Re-entry offer, Continuation Grant, typed event, Receiver, Agent adapter,
  canonical page re-entry, state-derived tools, human boundary.
- **Demo application:** TBD.
- **Final name:** TBD.
- **TenderRelay:** Reference-package codename, not the committed app identity.
- **Tender workflow:** Reference Scenario A, not the default implementation.

## Consequences

### Positive

- The novel mechanism is no longer conflated with one illustrative domain.
- App selection can optimize user pain, WebMCP materiality, demo clarity, and execution risk.
- Core contracts remain stable while domain-specific states and tools can be selected later.
- The tender dossier retains its value without controlling product identity.

### Costs and risks

- Product requirements remain abstract until a host application is selected.
- The team must resist designing a generic platform instead of one focused demonstration.
- A separate app-selection step consumes time and must be completed quickly.
- The selected domain still needs its own trust, data, and human-boundary review.

## Required next decision

Before full implementation, create an ADR that names:

- app thesis and final working name;
- primary user and external actor;
- persistent workflow record and artifact;
- initial state, later event, and resumed state;
- initial and resumed Site Tools;
- human decision boundary;
- WebMCP necessity;
- synthetic fixture and reset;
- judge path and main execution risks.

Use [Demo App Selection and Challenge MVP](../Core/06-mvp-and-demo.md).

## Supersedes

This ADR supersedes ADR-0001's implication that TenderRelay or a tender/RFP portal is the
selected product. ADR-0001 remains historical evidence of the first formalization pass.
Its preservation, English-only, and evidence-discipline consequences are retained where
they do not conflict with this decision.
