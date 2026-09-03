# RightSpot Decisions

**Role:** Durable decisions for the RightSpot child application  
**Status:** MVP and post-MVP UI/auth boundary decisions accepted; implementation and product validation remain open

## Decision rules

- Brainstorm ideas remain provisional until a decision or current-state document promotes them.
- A decision record is required before a material choice changes product scope, authority, data
  ownership, security, integration, persistence, deployment, or irreversible implementation shape.
- A RightSpot decision cannot redefine the outer Re-entry Core, Hackathon rules, or shared repository
  governance.
- Rejected alternatives and reopen triggers should be retained rather than silently erased.
- After acceptance, update `Docs/00-current-status.md`, the affected core document, tasks, and
  implementation record before treating the choice as active.

## Accepted working decisions

The current working decisions are:

- [`ADR-RS-0001 — MVP scope and primary flow`](ADR-RS-0001-mvp-scope-and-primary-flow.md); and
- [`ADR-RS-0002 — Logical Backbone boundary`](ADR-RS-0002-logical-backbone-boundary.md); and
- [`ADR-RS-0003 — Implementation stack and realtime boundary`](ADR-RS-0003-implementation-stack-and-realtime-boundary.md); and
- [`ADR-RS-0004 — Thread orchestration pilot`](ADR-RS-0004-thread-orchestration-pilot.md); and
- [`ADR-RS-0005 — Checkpoint source identity and path ownership`](ADR-RS-0005-checkpoint-source-identity-and-path-ownership.md); and
- [`ADR-RS-0006 — Durable workflow snapshot and application boundary`](ADR-RS-0006-durable-workflow-and-application-boundary.md); and
- [`ADR-RS-0007 — Synthetic listing discovery boundary`](ADR-RS-0007-synthetic-listing-discovery-boundary.md); and
- [`ADR-RS-0008 — Ordinary workflow HTTP and interface contract`](ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md).
- [`ADR-RS-0009 — RightSpot Field Desk UI/UX and navigation baseline`](ADR-RS-0009-ui-ux-visual-system-and-navigation.md); and
- [`ADR-RS-0010 — External authentication boundary`](ADR-RS-0010-external-authentication-boundary.md).
- [`ADR-RS-0011 — Bounded Agent Operations read-model seam`](ADR-RS-0011-bounded-agent-operations-read-model-seam.md).
- [`ADR-RS-0012 — Operations Profile Authority and Manual Query Boundary`](ADR-RS-0012-operations-profile-authority-and-manual-query-boundary.md); and
- [`ADR-RS-0013 — Tenant Favourites and Agent Listing-Interest Boundary`](ADR-RS-0013-favourites-and-listing-interest-boundary.md); and
- [`ADR-RS-0014 — Canonical Area search semantics`](ADR-RS-0014-area-search-semantics.md); and
- [`ADR-RS-0015 — Tenant Discovery Search contract and read-only WebMCP boundary`](ADR-RS-0015-tenant-search-and-webmcp-contract.md); and
- [`ADR-RS-0016 — Agent Operations manual read-surface boundary`](ADR-RS-0016-agent-operations-manual-read-surface-boundary.md).

They define a RightSpot internal MVP baseline. They do not replace the outer project's formal
application-selection ADR or authorize changes to the outer Re-entry Core.

## Record template

```markdown
# ADR-RS-XXXX: <decision title>

**Status:** Proposed | Accepted | Superseded
**Decision date:** <date>
**Owners:** <owners>

## Context
## Decision
## Alternatives considered
## Consequences
## Validation and reopen triggers
```
