# SK-TASK-002: Pre-Implementation Coherence Closure

## Task Control

- Lifecycle state: `verified`
- Closure type: `contract_verified`
- Checkpoint: `CP-03`
- Owner: Game owner
- Current increment: Closed B1-B4, D2, C1, and C2 in the coherent `SK-MVP-0.2` contract; the owner-approved Re-entry delivery policy remains recorded in `SK-MVP-0.2` and `ADR-GAME-0009`.
- Next gate: CP-04 is locally runtime-verified; the registered CP-05 persistence task is the next implementation gate, while gameplay runtime, external Agent invocation, and hosted proof remain later gates.

## Identity

- Task ID: `SK-TASK-002`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The findings change or constrain movement, sensing, mission state, restart
  policy, Re-entry action authority, protected-start semantics, event vocabulary, and
  `world_snapshot`/`client_snapshot` shape.

## Objective

Make the accepted first-slice contract implementable without an engineer inventing a load-bearing
number, state, event name, or Re-entry timing rule in durable code.

## Scope and non-goals

In scope: B1-B4, D1, D2, C1, and C2 from
[`Validation/05-pre-implementation-coherence-audit.md`](../Validation/05-pre-implementation-coherence-audit.md);
the affected contract sections, owning mechanism and chain documents, ADR-GAME-0006 where required,
and the current-status/roadmap reconciliation.

Non-goals: CP-04 durable code, production balance, full-game PvP, siege, migration, breach,
leaderboard, final assets, hosted deployment, and external Agent adapter implementation.

## Authority and evidence

- Governing workflow: [`../00-Workflow/README.md`](../00-Workflow/README.md)
- Current status: [`../00-current-status.md`](../00-current-status.md)
- Normative contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Controlling Re-entry decision: [`../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
- Finding record: [`../Validation/05-pre-implementation-coherence-audit.md`](../Validation/05-pre-implementation-coherence-audit.md)
- Resolved Assured decision issue: [`../Issues/resolved/SK-ISSUE-002-preimplementation-coherence-and-reentry-window.md`](../Issues/resolved/SK-ISSUE-002-preimplementation-coherence-and-reentry-window.md)
- G2 closure ADR: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
- Closure evidence: [`../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md)

## Required outcome

1. Confirm or reject each audit finding against its cited documents.
2. Complete the Challenge gate for D1 before selecting a Re-entry timing rule. **Completed:** the
   owner selected real-time coalesced Agent Signal delivery; no gameplay Re-entry Window is used.
3. Record one coherent contract revision, with an ADR update when the accepted Re-entry boundary
   changes.
4. Reconcile all affected mechanisms, chains, scenarios, roadmap statements, and current status.
5. Run the documentation validator and a static cross-reference pass; record evidence before closing.

## Stop conditions

Stop at the decision boundary if a proposed resolution changes authority, identity, settlement,
event ordering, persistence, WebMCP/Re-entry authority, or the accepted human consequence boundary
without an owner decision. Do not start CP-04 while a B finding or D1 remains unresolved.

## Verification and closure

- Minimum verification: documentation validator plus static cross-reference at ladder level 1, and
  contract examples/negative cases at ladder level 2 where state or event rules changed.
- Closure result: `contract-verified`. The contract, resolved issue, task, current status, and affected
  owning documents agree; static closure evidence is `SK-EVID-003`.
- Reopen trigger: any new runtime result, contract version change, or contradiction in the affected
  state, event, settlement, `world_snapshot`/`client_snapshot`, or Re-entry path.

## Recorded D1 decision

On 2026-09-02 the owner accepted the real-time coalesced delivery policy. The world continues through
death, respawn, mission reissue, and all other milestones without waiting for an Agent. Domain Events
remain durable and authoritative. A derived Agent Signal is classified and coalesced, with at most one
outgoing signal pending or in flight for the bound shelter and Codex Thread; a running Thread receives
no per-event message. The Agent rereads current page state before acting, and a late command returns a
typed live-state result rather than a silent no-op. The decision is owned by
[`ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md).

D1 is therefore resolved as a design choice. This task remained open until B1-B4, D2, C1, and C2
were resolved by `ADR-GAME-0010`; it is now verified for planning coherence. CP-03 is separately
locked by `SK-TASK-003`; CP-04 and later checkpoints must still provide implementation and runtime
evidence.

## Recorded closure

On 2026-09-02 the owner accepted the G2 geometry, state, anti-loop, protected-start, event-vocabulary,
and snapshot-vocabulary decisions in `ADR-GAME-0010`. Static validator, link, language, diff, and
targeted cross-reference checks are recorded in `SK-EVID-003`. No durable runtime implementation was
claimed, and `SK-ISSUE-001` remains the separate external Agent-adapter capability blocker for CP-13
and CP-14.
