# Reference and Candidate Scenarios

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
| [Opportunity-to-Arrival Relay](02-opportunity-to-arrival-relay.md) | PROVISIONAL SCENARIO-LEVEL LEAD — NOT SELECTED | Custom-question application continuation; compact arrival epilogue remains conditional |
| [Sleepless Kingdom](03-sleepless-kingdom.md) | CREATIVE WILD CARD — NOT SELECTED | First-party bounded persistent game retained for future exploration |
| [Greenlight Relay](04-greenlight-relay.md) | EXECUTION-SAFE RESERVE — NOT SELECTED | Conditional creative-release continuation |

The current comparative recommendation, official-criteria review, external evidence,
calibrated scorecards, sensitivity analysis, and implementation kill-test order are recorded in
[Research 23 — Three-Candidate Competition App Selection Review](../Research/23-three-candidate-competition-app-selection-review.md).
It preserves the original Greenlight ranking and records the later Opportunity clarification and
provisional lead. It is not itself a decision record; TASK-001 and an accepted app-selection ADR
remain controlling.

Additional candidates should be added only when they are concrete enough to score against
the full workflow, not as unstructured idea lists. The three detailed supporting candidates
above preserve complete product theses and design hypotheses for comparison; their status
labels express comparative research disposition only. They do not select an application or
change Core product truth.
