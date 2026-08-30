# ADR-0001: Select TenderRelay as the Working Project Direction

**Status:** Superseded by [ADR-0002](ADR-0002-separate-mechanism-from-demo-app.md)  
**Decision date:** 2026-08-30  
**Decision owners:** Alex and project team  
**Scope:** Product direction, document authority, and planning premise

## Context

> **Historical note:** This record overinterpreted the tender example as the selected
> product. ADR-0002 corrects the decision boundary: the re-entry workflow mechanism is
> selected, while the host application, domain, user, tools, and final name remain TBD.

The workspace began as a broad WebMCP Challenge research and ideation package. It contains
general WebMCP research, several workflow families, the `TwinSurface` framing, and earlier
candidate directions. The TenderRelay concept dossier subsequently established a more
specific problem, mechanism, architecture, risk model, and challenge demonstration.

The dossier is intentionally broad and exploratory. It mixes source material, hypotheses,
candidate contracts, alternatives, risks, and possible implementation routes. Editing it
in place would erase the original decision context and make later claims difficult to audit.

## Decision

1. Select **TenderRelay** as the active working project direction.
2. Treat the product as a **WebMCP-initiated re-entry contract for resumable human–agent web workflows**, demonstrated through a tender/RFP portal.
3. Build the current product and system truth in `Docs/Core/`.
4. Preserve the complete TenderRelay dossier and companion architecture image as immutable references.
5. Demote all other project ideas and generic option maps to `DEPRIORITIZED REFERENCE` status without deleting them.
6. For product and architecture planning, temporarily assume that the Agent continuation bridge can resume the intended context, re-enter the canonical page, and rediscover the next-stage WebMCP tools.

## Evidence boundary

The planning premise in item 6 is not implementation evidence. Until the bridge test passes,
documents and external claims must say **WORKING ASSUMPTION**, not **VERIFIED** or
**IMPLEMENTED**. This distinction remains binding even while design proceeds as if the
capability will be available.

## Consequences

### Positive

- The team has one product direction and one canonical documentation layer.
- Product requirements can be separated from exploratory architecture and prior art.
- The original dossier remains available for audit and recovery.
- Engineering can work against explicit user behavior, contracts, trust rules, and evidence gates.

### Costs and risks

- Some dossier content will be normalized or narrowed in Core docs rather than copied verbatim.
- The selected concept still carries a platform-integration dependency.
- Earlier research remains useful but must not silently override current decisions.
- A successful technical bridge does not by itself validate user demand or portal adoption incentives.

## Reconsideration triggers

A new ADR is required if any of the following occurs:

- the re-entry bridge cannot be demonstrated in a judge-reproducible environment;
- the challenge rules or platform contract make the intended experience ineligible;
- the remaining time makes the defined MVP infeasible;
- a materially safer or simpler re-entry mode is selected;
- the team changes the primary domain, customer, or product mechanism.

## Supersedes

This decision supersedes the workspace's previous open-ended project-selection posture. It
does not supersede official challenge rules or general WebMCP technical evidence.
