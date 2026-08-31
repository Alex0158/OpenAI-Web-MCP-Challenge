# TASK-001: Select the Host Application

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P0`
- Owner: Alex and project team
- Current increment: Compare the qualified candidates and produce one application-selection ADR.
- Next gate: The ADR is accepted and the affected Core documents are reconciled to the selected
  application.
- Dependencies: Candidate evidence must be reviewed as supporting input rather than product truth.

## 1. Problem

Re-entry Core is selected and locally verified at its application-neutral boundary, but the Host
application, user, domain, event, artifact, state model, Site Tools, human consequence, supported
continuation route, and final product identity remain unselected.

Without this decision, application-layer source placement, product requirements, runtime scope,
judge journey, and production-shell requirements cannot be specialized without inventing product
truth.

## 2. Authority and evidence

- [Core/00](../Core/00-current-status.md) owns the current unselected status and next project gate.
- [Core/06](../Core/06-mvp-and-demo.md) owns the hard selection gates, scorecard, and Challenge MVP
  boundary.
- [Core/08](../Core/08-competition-thesis-and-positioning.md) owns the competition thesis and claim
  hierarchy.
- [Core/05](../Core/05-validation-and-evidence.md) owns the application-selection evidence gate.
- Candidate research and scenarios are supporting inputs. They cannot select the application.

## 3. Required decision output

The accepted ADR must name:

1. the primary user and concrete asynchronous workflow;
2. the later authoritative event;
3. the durable artifact or decision continued across stages;
4. initial and resumed application states;
5. materially different state-derived WebMCP Site Tool roles;
6. the human-only consequence boundary;
7. the safe deterministic fixture and reset path;
8. the product layer and code-placement boundary;
9. the supported or explicitly experimental continuation-adapter posture;
10. why notification, deep link, ordinary API, or one-shot Agent interaction is insufficient; and
11. the decisive evidence, residual risks, and rejected alternatives.

## 4. Non-goals

This task does not:

- implement the selected application;
- create speculative application directories;
- select a production hosting, identity, storage, or Connector stack;
- claim a supported Agent wake or Browser/WebMCP continuation path;
- promote candidate copy or scores into canonical truth without review; or
- reopen the completed application-neutral Core Program.

## 5. Verification and closure

Move to `verification_pending` only when one ADR candidate and its exact Core reconciliation are
ready for complete review. Close only when:

- one application-selection ADR is accepted;
- Core/00, Core/01, Core/02, Core/03, Core/05, Core/06, and Core/08 are reconciled where affected;
- the selected domain layer and next bounded Program location are explicit;
- rejected candidates remain supporting history rather than ambiguous product truth; and
- local links, English-only content, Git scope, and remote delivery checks pass.

## 6. Reopen condition

Reopen if evidence invalidates a hard selection gate, the selected workflow no longer makes WebMCP
or cross-session continuity material, or the implementation requires an authority boundary the ADR
did not address.
