# RightSpot Decisions

**Role:** Durable decisions for the RightSpot child application  
**Status:** Initial MVP decisions accepted; implementation and product validation remain open

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
- [`ADR-RS-0006 — Durable workflow snapshot and application boundary`](ADR-RS-0006-durable-workflow-and-application-boundary.md).

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
