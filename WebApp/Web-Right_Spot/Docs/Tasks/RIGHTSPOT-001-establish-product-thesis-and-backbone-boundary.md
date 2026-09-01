# RIGHTSPOT-001: Establish Product Thesis and Backbone Boundary

**Type:** decision  
**Lifecycle:** `closed`  
**Priority:** P0 for RightSpot  
**Owner:** Main RightSpot thread  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Main RightSpot thread
- Current increment: Establish the RightSpot product thesis, primary workflow, and logical
  Backbone boundary.
- Next gate: `RIGHTSPOT-002` becomes the next pending RightSpot implementation task.
- Dependencies: Rental Marketplace Relay candidate material and the outer repository guidance.

## Current increment

Converted the existing Rental Marketplace Relay candidate material and brainstorm into a coherent
RightSpot product thesis, human-facing Happy Path, domain boundary, and ordinary-app Backbone
boundary. The current working scope is a stable rental demonstration host rather than a complete
commercial marketplace.

## Evidence and authority

- RightSpot is the working name assigned to the rental candidate by the main-thread owner.
- The initial source material is [`Rental Marketplace Relay`](../../../../Docs/Scenarios/05-rental-marketplace-relay.md).
- The current brainstorm prioritizes tenant login/discovery/detail/request management and agent
  queue/review/proposal/decision over marketplace breadth.
- Outer repository governance remains in [`AGENTS.md`](../../../../AGENTS.md).
- Current RightSpot working truth is [`Docs/00-current-status.md`](../00-current-status.md).

## Non-goals

- writing runtime code;
- building buying, payment, lease, live-chat, or full marketplace administration flows;
- selecting a final framework, database, or hosting provider without a decision;
- adapting to Cloud Receiver;
- implementing WebMCP or Agent continuation;
- modifying the outer Re-entry Core or canonical outer documents; and
- claiming product validation or Hackathon readiness.

## Completed gate

Accepted [ADR-RS-0001](../Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md) and
[ADR-RS-0002](../Decisions/ADR-RS-0002-logical-backbone-boundary.md), and reconciled the affected
RightSpot documents. The next active work is [RIGHTSPOT-002](RIGHTSPOT-002-build-mvp-application-shell.md).

## Closure evidence

- accepted RightSpot decision record;
- updated current status and core docs;
- explicit open decisions and rejected alternatives;
- no changes outside the RightSpot folder; and
- exact Git diff reviewed.

## Reopen condition

Reopen if user/problem evidence, the primary workflow, role/privacy boundary, or the decision to
defer Cloud Receiver/WebMCP integration materially changes.
