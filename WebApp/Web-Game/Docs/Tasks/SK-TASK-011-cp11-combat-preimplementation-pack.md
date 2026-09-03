# SK-TASK-011: CP-11 Monster Combat, Cargo Loss, and Respawn Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-11`
- Owner: Game owner
- Current increment: CP-11 preparation is complete; [`SK-TASK-034`](SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md) now owns the first bounded gatherer-loss implementation.
- Next gate: Prove the gatherer-loss task, then register Hunter victory and automatic reissue as separate bounded increments before adding their restart and race cases.

## Identity

- Task ID: SK-TASK-011
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the deterministic seeded-monster encounter, combat, cargo-loss, same-identity respawn, and bounded reissue boundary. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the deterministic seeded-monster encounter, combat, cargo-loss, same-identity respawn, and bounded reissue boundary.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: PvP, siege, party aggregation, random combat, new species, production balance, migration, breach conversion, shelter defense, WebMCP, Re-entry delivery, or hosted deployment.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-11 scenario fixture](../Scenarios/11-cp11-combat-fixtures.md), and the owning documents named below.
- Out of scope: PvP, siege, party aggregation, random combat, new species, production balance, migration, breach conversion, shelter defense, WebMCP, Re-entry delivery, or hosted deployment.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: detail-12-monster-state-and-targeting.md, detail-13-encounter-and-combat-resolution.md, detail-06-soldier-identity-and-lifecycle.md, and contract sections 3, 4, 5, and 6.
- Roadmap dependency: CP-10 and CP-08.
- Cross-functional handoff: CP-08 supplies positions/sensors/routes; CP-09 supplies role/tool/attempt; CP-10 supplies cargo; CP-12 explains formula and cause; CP-14 uses CargoLostToMonster; CP-19 may reuse the encounter ledger.
- Preparation audit: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md).

## Evidence status

- Verified: Inclusive contact radius, one resolving encounter per participant, one round per integer world second, initiative and entity-id tie-breaks, accepted formula and G2 values, normal monster continuation, cargo destruction without killer reward, and same-identity respawn/reissue.
- Inferred: Separate encounter, settlement, death, and reissue transitions give the clearest replay and prevent duplicate soldiers or cargo.
- Unknown: Exact encounter payload, seeded route timing, HP reset timing, monster post-kill transition, reissue milestone scheduling, and future randomness.

## Smallest reversible action

After CP-10 economy and CP-08 route/sensor runtime closure, prove the gatherer-loss and hunter-win traces separately before adding restart and reissue races. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-11 scenario fixture](../Scenarios/11-cp11-combat-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-10 and CP-08, the owning contract, or the cross-functional handoff.
