# SK-TASK-010: CP-10 Wood/Rock Economy Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: Cross-functional CP-10 preparation is complete; no runtime code has started.
- Next gate: After CP-09 mission and CP-05/06 due-work runtime closure, implement one extraction and one deposit before adding capacity, depletion, or concurrency cases.

## Identity

- Task ID: SK-TASK-010
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the authoritative Wood/Rock extraction, five-slot cargo, automatic return, shelter deposit, and coin settlement boundary. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the authoritative Wood/Rock extraction, five-slot cargo, automatic return, shelter deposit, and coin settlement boundary.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: SQL schema, worker code, movement, missions, combat, PvP loot, upgrades, gold, crafting, weighted cargo, production balance, WebMCP, Re-entry delivery, or hosted deployment.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-10 scenario fixture](../Scenarios/10-cp10-economy-fixtures.md), and the owning documents named below.
- Out of scope: SQL schema, worker code, movement, missions, combat, PvP loot, upgrades, gold, crafting, weighted cargo, production balance, WebMCP, Re-entry delivery, or hosted deployment.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: detail-11-resource-extraction-cargo-and-deposit.md, detail-14-loot-reward-and-atomic-transfer.md, Chains/02-dispatch-to-deposit.md, and contract sections 5 and 7.
- Roadmap dependency: CP-09 and CP-05.
- Cross-functional handoff: CP-09 commits role/tool/target/attempt; CP-08 commits arrival; CP-11 may destroy or transfer exposed cargo; CP-12 renders risk; CP-22 may later extend tool yield.
- Preparation audit: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md).

## Evidence status

- Verified: Five equal-weight slots, one unit every two world seconds, 20 units per node, 30-second respawn, Wood at one coin, Rock at three coins, no coin before deposit, and atomic node/cargo/deposit ownership.
- Inferred: One ledger boundary with cargo revision and deposit idempotency is the lowest-risk G2 implementation; reservation and weighted capacity should wait for evidence.
- Unknown: Exact cargo row shape, partial final extraction representation, concurrent node contest policy, tool yield progression, and overflow behavior.

## Smallest reversible action

After CP-09 mission and CP-05/06 due-work runtime closure, implement one extraction and one deposit before adding capacity, depletion, or concurrency cases. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-10 scenario fixture](../Scenarios/10-cp10-economy-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-09 and CP-05, the owning contract, or the cross-functional handoff.

