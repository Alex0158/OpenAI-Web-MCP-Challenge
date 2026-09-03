# Reference and Candidate Scenarios

**Role:** SUPPORTING examples of the core mechanism  
**Current selected demo app:** Sleepless Kingdom  
**Controlling decisions:** [ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md)
and [ADR-0042](../Decisions/ADR-0042-select-sleepless-kingdom-host-application.md)

Scenarios make the domain-neutral re-entry workflow concrete. A scenario may define users, events,
artifacts, states, Site Tools, and human boundaries for comparison and validation; ADR-0042, not
folder placement, selects Sleepless Kingdom.

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
| [Opportunity-to-Arrival Relay](02-opportunity-to-arrival-relay.md) | ELIMINATED — PRESERVED REFERENCE | Historical custom-question application continuation and optional arrival relay |
| [Sleepless Kingdom](03-sleepless-kingdom.md) | SELECTED BY ADR-0042; OUTER FILE RETAINED AS SELECTION HISTORY | Current product truth lives under `WebApp/Web-Game/` |
| [Greenlight Relay](04-greenlight-relay.md) | ELIMINATED — PRESERVED REFERENCE | Historical conditional creative-release continuation |
| [Rental Marketplace Relay](05-rental-marketplace-relay.md) | UNSELECTED ALTERNATIVE — PRESERVED | Role-scoped bilateral rental workflow |

ADR-0042 closes the current shortlist by selecting Sleepless Kingdom. Rental Marketplace Relay is
the preserved unselected alternative. Opportunity and Greenlight remain eliminated historical
references; their earlier comparative recommendations are no longer current. The historical
comparative review, official-criteria
analysis, external evidence, calibrated scorecards, sensitivity analysis, and implementation
kill-test order are recorded in
[Research 23 — Historical Three-Candidate Competition App Selection Review](../Research/23-three-candidate-competition-app-selection-review.md).
Research 23 is not itself a decision record; ADR-0042 controls the current application selection.

Additional candidates should be added only when they are concrete enough to score against
the full workflow, not as unstructured idea lists. The detailed supporting candidates above
preserve complete product theses and design hypotheses for comparison; their status labels
express comparative research disposition only. A future application change requires a new ADR that
supersedes ADR-0042.
