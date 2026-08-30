# ADR-0003: Freeze the P0 Technical Validation MVP

**Status:** Accepted  
**Decision date:** 2026-08-30  
**Decision owners:** Alex and project team  
**Scope:** First implementation target, technical proof boundary, sequencing, and evidence

## Context

ADR-0002 selected the domain-neutral WebMCP re-entry workflow mechanism while leaving the
final host application open. The central platform bridge remains a working assumption: a
later event must resume the intended managed Agent context, regain a WebMCP-capable browser,
return to the authoritative page, discover the new-stage Site Tools, and continue the same
work.

Further domain design cannot resolve this uncertainty. The project needs a disposable
technical fixture that can prove or falsify the mechanism before a polished application is
built.

## Decision

1. Build one domain-neutral P0 Technical Validation MVP before full host-application
   implementation.
2. Treat the MVP as a technical proof harness, not as the final product, demo domain, or
   production architecture.
3. Require the harness to answer five feasibility questions:
   - genuine page-to-Agent Re-entry Manifest delivery through a WebMCP Site Tool;
   - Receiver-owned consent and secure Grant-to-managed-context binding;
   - authenticated resumption of the intended Agent context with one event identity and
     one run reservation, where exact replay starts no second run;
   - resumed browser re-entry, fresh page state, and new-stage Site Tool invocation;
   - continuation of the same artifact up to a visible human decision boundary.
4. Organize implementation into three gates: Enrollment, Continuation and Re-entry, and
   Closed-loop Workflow.
5. Require all five questions to pass in one correlated run. Isolated component success is
   useful diagnostic evidence but does not prove the concept.
6. Optimize for one happy path. Implement only the negative controls required to prevent a
   false success claim: declined consent creates no Grant; an invalid or duplicate event
   creates no extra run; and commit is absent from the Site Tool surface while the tested
   Agent stops at the visible human commitment boundary.
7. Do not use REST, remote MCP, generic dynamic tools, or DOM automation as a substitute for
   the required resumed WebMCP Site Tool invocation.
8. Permit adapter changes and external technical research without changing the frozen proof
   target. Record each credible adapter route and its evidence.
9. Keep the original TenderRelay dossier and architecture image immutable and use them only
   as concept references.

Terminology clarification: this frozen P0 requirement is a deduplication and effect gate,
not a platform-level exactly-once delivery guarantee. Transport may be at least once; a
production design must make repeated wake safe through durable event identity, run
reservation, mutation idempotency, and atomic state checks.

The implementation contract is
[P0 Technical Validation MVP](../Core/07-p0-technical-validation-mvp.md).

## Consequences

### Positive

- The highest-risk platform assumption is tested before domain polish or broad product work.
- Adapter research is judged against stable evidence rather than architecture preference.
- A failed route can be replaced without redefining the concept or the acceptance test.
- The project can distinguish genuine WebMCP re-entry from generic Agent triggering.

### Costs and risks

- The fixture has little direct market value and cannot validate the final user or domain.
- A passing App Server thread test does not by itself prove Browser or Site Tool continuity.
- Browser, account, rollout, and client coupling may require more than one adapter spike.
- The final app-selection ADR remains required before product-specific implementation.

## Sequencing

The P0 technical fixture and demo-app selection may proceed in parallel. Full application
implementation begins only after:

1. the P0 fixture passes or a later ADR explicitly narrows the re-entry claim; and
2. a separate ADR selects the host application and specializes the domain layer.

## Non-claims

This decision does not claim that the bridge works, that an adapter has been selected, that
the final application is selected, or that the project is deployed or judge-reproducible.
