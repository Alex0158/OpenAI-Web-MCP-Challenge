# SK-TASK-019: CP-19 to CP-26 Post-G2 Expansion Preflight Registry

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `none`
- Owner: Game owner
- Current increment: The CP-19 through CP-26 preflight registry, dependency gates, open decisions, and activation policy are recorded; no expansion runtime work has started.
- Next gate: After the CP-16 local slice is verified, activate only the first post-G2 checkpoint whose authority, settlement, human-consequence, scenario, and rollback gates are closed; the RightSpot comparison remains a CP-26 gate.

## Identity

- Task ID: SK-TASK-019
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The registry covers future PvP, siege, migration, upgrades, leaderboard, population, operations, and product-decision boundaries that can change identity, settlement, fairness, human consequences, external claims, or the contract. It records preparation without granting implementation authority.

## Objective

Keep CP-19 through CP-26 implementation-ready at the level that is safe before G2 evidence, while preserving every unresolved design choice as an explicit gate.

## Success and non-goals

- Success: The linked preflight reviews CP-19 through CP-26 one by one, names the predecessor, safe preparation, cross-functional risks, open gates, falsifier, activation policy, and claim boundary.
- Non-goals: Selecting PvP formulas, overflow or reward shares, siege aggregation, migration timing, upgrade prices, leaderboard ranking, population targets, abuse budgets, host policy, submission claims, runtime code, content population, deployment, or changes to the G2 contract.

## Scope and authority

- In scope: [CP-19 to CP-26 post-G2 preflight](../Validation/11-cp19-cp26-post-g2-preflight.md), its links to the roadmap, G2 audit, contract sheet, RightSpot comparison, and future scenario/evidence records.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot implementation, game runtime, schemas, external Receiver/Connector, deployment, public claims, and any destructive or irreversible action.
- Allowed actions: Read and write this registry and the linked planning documents; run documentation validators; do not activate an individual expansion implementation task until its entry conditions are proven.
- Revalidate when: G2 evidence, the contract version, a predecessor closure label, a cross-module authority boundary, an external handoff, or the RightSpot comparison basis changes.

## Owning authority

- Owning module document: [CP-19 to CP-26 post-G2 preflight](../Validation/11-cp19-cp26-post-g2-preflight.md)
- Owning contract section: [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md), with no expansion rule promoted by this task.
- Controlling decision: [G2 geometry, state, and vocabulary closure](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md) and the next accepted ADR for any expansion boundary.
- Constraining chain or scenario: [CP-10 to CP-18 cross-functional audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and the future checkpoint-specific scenario required by the activation policy.

## Evidence status

- Verified: CP-19 through CP-26 are post-G2 roadmap scope; their current G2 predecessor relationships and cross-functional risks are recorded; a future task must not be activated without an authority, settlement, scenario, rollback, and evidence gate.
- Inferred: One registry with explicit open gates is safer than eight premature implementation records because measured G2 play, fairness, performance, and external capability evidence can change the future choices.
- Unknown: PvP and siege formulas, overflow and reward policy, migration timing and concealment budget, upgrade prices/caps, leaderboard metric and anti-farming thresholds, population targets, host/operations budgets, participant rubric, and the exact contract versions that would accept those choices.

## Smallest reversible action

Keep the preflight registry and cross-check it against the roadmap whenever G2 evidence changes. When one checkpoint becomes actionable, create one bounded task and one scenario for that checkpoint, attach a Challenge/ADR if its choice is durable, and stop if the predecessor or authority seam is absent. Do not use this registry as permission to write expansion code.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now: link validation, English-only scan, task-control validation, and cross-check of all CP-19 through CP-26 predecessor/open-gate entries against the roadmap.
- Closure target: `specified` for this registry; each future checkpoint must earn its own runtime, slice, hosted, or judge closure label from actual evidence.
- Rollback or remediation: Preserve the registry, reopen the affected future entry, and return to the last verified G2 boundary; do not delete a superseded choice or silently adapt a settlement rule.
- Reopen trigger: Any new G2 runtime evidence, fairness/performance measurement, external capability result, contract change, or RightSpot comparison result that changes an expansion prerequisite or claim boundary.
