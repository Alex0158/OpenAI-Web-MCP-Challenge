# Reference Scenarios

**Role:** SUPPORTING examples of the core mechanism  
**Current selected demo app:** None  
**Controlling decision:** [ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md)

Scenarios make the domain-neutral re-entry workflow concrete without selecting the final
application. A scenario may define users, events, artifacts, states, Site Tools, and human
boundaries for comparison and validation.

## Rules

1. A scenario is not current product truth unless an accepted ADR selects it.
2. Core mechanism requirements control every scenario.
3. Each scenario must pass the hard gates and scorecard in
   [Demo App Selection and Challenge MVP](../Core/06-mvp-and-demo.md).
4. Selecting a scenario requires specializing product requirements, security, validation,
   tool inventory, and demo evidence.
5. Keep scenario claims honest: an illustrative flow is not implementation or user evidence.

## Current scenarios

| Scenario | Status | Source |
|---|---|---|
| [Tender workflow](01-tender-reference-scenario.md) | REFERENCE CANDIDATE | TenderRelay dossier version 1.1 |

Additional candidates should be added only when they are concrete enough to score against
the full workflow, not as unstructured idea lists.
