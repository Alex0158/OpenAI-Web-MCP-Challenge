# TASK-001: Select the Host Application

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31  
**Decision accepted:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `verification_pending`
- Priority: `P0`
- Owner: Alex and project team
- Current increment: Selection and related standing contracts are committed locally under
  CLOUD-023; retain the verified scope and await separately authorized remote delivery.
- Next gate: After local scope and identity readback, obtain separate push authority and verify the
  remote branch contains ADR-0042 and reconciled authorities without unrelated owner-held work.
- Dependencies: Local documentation verification must pass; commit and push authority remain
  separate from application-decision acceptance.

## 1. Problem

Before ADR-0042, Re-entry Core was selected and locally verified at its application-neutral boundary,
but the Host application, user, domain, event, artifact, state model, Site Tools, human consequence,
supported continuation route, and final product identity remained unselected.

ADR-0042 now selects Sleepless Kingdom as the first Host application and challenge-demo carrier. The
remaining task scope is exact reconciliation and Git/remote closure; selection does not close the
external continuation, hosted, product-demand, judge, or submission gates.

## 2. Authority and evidence

- [ADR-0042](../Decisions/ADR-0042-select-sleepless-kingdom-host-application.md) owns the accepted
  application decision.
- [Core/00](../Core/00-current-status.md) owns current selected-app status and next project gate.
- [Core/06](../Core/06-mvp-and-demo.md) owns the hard selection gates, scorecard, and Challenge MVP
  boundary.
- [Core/08](../Core/08-competition-thesis-and-positioning.md) owns the competition thesis and claim
  hierarchy.
- [Core/05](../Core/05-validation-and-evidence.md) owns the application-selection evidence gate.
- Candidate research and scenarios are supporting inputs. They cannot select the application.

## 2.1 Accepted outcome

- Host application and challenge-demo carrier: **Sleepless Kingdom**.
- Product layer: [`WebApp/Web-Game/`](../../WebApp/Web-Game/), under its scoped authority.
- First continuation: one approved `CargoLostToMonster` Event followed by fresh canonical-page reads
  and a conditional `force_recall_soldier` action.
- Human boundary: migration, siege, destructive upgrades, irreversible recovery, and actions outside
  the G2 recall envelope.
- Adapter posture: the current fresh-session Local Connector path remains experimental; supported
  authenticated Browser/WebMCP return and effect-backed acknowledgement remain open.

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

This task moved to `verification_pending` when ADR-0042 was accepted and the exact authority
reconciliation became ready for complete review. Close only when:

- one application-selection ADR is accepted;
- Core/00, Core/01, Core/02, Core/03, Core/05, Core/06, and Core/08 are reconciled where affected;
- the selected domain layer and next bounded Program location are explicit;
- rejected candidates remain supporting history rather than ambiguous product truth; and
- local links, English-only content, Git scope, and remote delivery checks pass.

## 6. Reopen condition

Reopen if evidence invalidates a hard selection gate, the selected workflow no longer makes WebMCP
or cross-session continuity material, or the implementation requires an authority boundary the ADR
did not address.
