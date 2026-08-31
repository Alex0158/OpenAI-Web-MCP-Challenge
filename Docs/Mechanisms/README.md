# Re-entry Mechanism Contracts

**Role:** CANONICAL module-contract index  
**Status:** Current application-neutral baseline  
**Authority:** ADR-0006 through ADR-0015 and ADR-0019

## Purpose

This directory owns stable Re-entry mechanism contracts below the system-wide Core and above
source-file implementation details. Each document follows one independent lifecycle and authority
boundary. A selected application or Agent adapter specializes these contracts; it does not replace
or silently weaken them.

## Module map

| Module | Owns | Current implementation |
|---|---|---|
| [Host integration, Manifest, and enrollment](01-host-integration-manifest-and-enrollment.md) | Host-issued offer, origin anchoring, consent-challenge creation, public binding, private receipt | Protocol, Host SDK, Receiver enrollment locally verified |
| [Receiver Grant and event authority](02-receiver-grant-and-event-authority.md) | Grant lifecycle, signed event acceptance, replay, one-run reservation, revocation, pending delivery | Receiver Core and SQLite reference store locally verified |
| [Delivery lease and Local Connector](03-delivery-lease-and-local-connector.md) | target identity, delivery lease, stale-worker fencing, outbound transport, effect-backed acknowledgement | Core, Stage 1 Cloud Receiver shell, outbound client, and bounded process evidence locally verified |
| [Managed context and Agent activation](04-managed-context-and-agent-activation.md) | credential-free activation, private binding resolution, typed outcomes, no-fallback boundary | Deterministic adapter and binding-resolution seams locally verified; real runtime open |
| [Host re-entry, WebMCP, and human boundary](05-host-reentry-webmcp-and-human-boundary.md) | canonical-page return, fresh state, stage-derived Site Tools, continued artifact, human-only consequence | Frozen MVP1 evidence only; selected application not implemented |

## Reading rule

For a change to one mechanism:

1. read Core/00 for current project state;
2. read the owning non-terminal Task when the work is registered;
3. read the owning module contract;
4. read its controlling ADRs;
5. inspect current code and focused tests;
6. read Development or Research only for the exact evidence or unresolved question involved.

Do not read every historical record by default.

## Shared contract shape

Every module document records:

- responsibility and exclusions;
- actors and authority;
- inputs, outputs, and state transitions;
- invariants and failure semantics;
- code and focused-test mapping;
- current evidence and non-claims; and
- future integration obligations and reopen conditions.

The module document does not repeat full wire schemas owned by an ADR and frozen vectors, full
test results owned by a Development record, or historical rationale owned by Research.

## Split and merge rule

Create another module only when at least three conditions hold: independent authority, explicit
contract, independent failure lifecycle, separate implementation or deployment, focused evidence,
or a distinct application/adapter conformance obligation. Merge modules when they cannot change or
verify independently and one owner would reduce ambiguity.

## Update sequence

When a mechanism changes:

1. update the owning Task lifecycle and next gate when applicable;
2. record or supersede the durable decision;
3. update this index and the owning module;
4. update system-wide Core only if its contract or status changes;
5. update code and focused tests;
6. record evidence in Development, Research, Experiments, or the owning evidence directory; and
7. reconcile README, app, deployment, and submission claims only at their proven level.
