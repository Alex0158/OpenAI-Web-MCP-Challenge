# SK-TASK-012: CP-12 Canvas and Dashboard Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Cross-functional CP-12 preparation is complete; no runtime code has started.
- Next gate: The registered runtime task [`SK-TASK-037`](SK-TASK-037-cp12-client-projection-and-mission-row.md) implements the first additive snapshot-to-Canvas frame and accessible mission/status row under the accepted CP-12 projection boundary.

## Identity

- Task ID: SK-TASK-012
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the minimal Canvas and React/HTML presentation that renders authoritative projections, explains causal state, and remains usable without WebMCP. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the minimal Canvas and React/HTML presentation that renders authoritative projections, explains causal state, and remains usable without WebMCP.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Authoritative state, persistence, movement logic, combat logic, WebMCP registration, external delivery, final illustration, elaborate animation, mobile optimization, or measured production FPS claims.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-12 scenario fixture](../Scenarios/12-cp12-canvas-dashboard-fixtures.md), and the owning documents named below.
- Out of scope: Authoritative state, persistence, movement logic, combat logic, WebMCP registration, external delivery, final illustration, elaborate animation, mobile optimization, or measured production FPS claims.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Design/06-visual-ui-and-asset-spec.md, Design/02-map-fog-and-exploration.md, Design/03-dashboard-and-operations.md, ADR-GAME-0007, and the client_snapshot contract.
- Roadmap dependency: CP-08 through CP-11.
- Cross-functional handoff: CP-08 defines snapshot scope and positions; CP-09/10/11 define mission/cargo/combat records; CP-13 requires the canonical page; CP-14 requires a readable return surface; CP-16 needs a human path.
- Preparation audit: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md).

## Evidence status

- Verified: Canvas/React split, projection-only rendering, 60 FPS interpolation ceiling, stable asset/state vocabulary, placeholder allowance, visible stale/reconnect status, and text equivalents.
- Inferred: A small atlas plus geometric placeholders and one readable dashboard will produce more judge value than a broad asset library before the causal trace works.
- Unknown: Final render schema, camera smoothing, atlas cell size, accessibility mapping, effect budget, and performance thresholds.

## Smallest reversible action

After CP-08 through CP-11 expose stable projections and causal read models, implement one snapshot-to-Canvas frame and one accessible mission/status row before optional effects. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-12 scenario fixture](../Scenarios/12-cp12-canvas-dashboard-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-08 through CP-11, the owning contract, or the cross-functional handoff.
