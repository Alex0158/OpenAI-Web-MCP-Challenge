# SK-TASK-037: CP-12 Client Projection and Accessible Mission Row

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Runtime-verify the additive server projection, deterministic Canvas command boundary, semantic mission/status surface, privacy, and explicit degraded states.
- Next gate: The local session/bootstrap successor `SK-TASK-038` is now terminal and synchronized; browser hydration, two-browser behavior, and later CP-13 capability work remain separate gates.

## Identity

- Task ID: `SK-TASK-037`
- Date: `2026-09-02`
- Risk profile: `Assured`
- Reason for profile: The increment changes the `client_snapshot` shape and crosses server read-model joins, visibility/privacy, route-derived positions, realtime validation, Canvas rendering, accessibility, and later WebMCP/Re-entry handoffs.

## Objective

Implement the first CP-12 presentation slice on the existing authority boundary. A server-generated
`client_snapshot` must expose the bound player's sensed nodes and owned mission dashboard records;
the page must render that accepted projection as one deterministic Canvas frame and one semantic
mission/status surface without inventing state or requiring live Agent capability.

## Success and non-goals

- Success: The additive projection includes player-scoped visible nodes, mission/attempt/route/cargo/
  encounter/reissue status, derived actor positions, map geometry needed by the frame, revisions, and
  causal events while preserving `SK-MVP-0.2` identities, privacy, and event semantics.
- Success: A resident row, active route row, combat/review row, stale/null state, unsupported
  capability state, and missing-asset placeholder remain explicit and readable without color or
  animation.
- Success: Canvas and React/HTML are projection consumers. No client coordinate, browser clock,
  optimistic mission, event, coin, cargo, or capability result becomes authoritative.
- Success: Existing CP-08 realtime replacement/wire and CP-09 through CP-11 behavior remains green.
- Non-goals: Live session/bootstrap, state-changing browser controls, default scheduler composition,
  new persistence schema, WebMCP, Agent Signal/Re-entry delivery, external services, hosted
  continuity, final art, elaborate animation, mobile optimization, or production FPS claims.

## Scope and authority

- In scope: `src/server/world-projection.ts`, `src/client/realtime-projection.ts`, new pure client
  projection/draw model and Canvas/React surface, the canonical page shell, focused CP-12 tests, and
  linked documentation/evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public session issuance, new server/worker/
  scheduler/transport, domain commands, persistence migrations, and unrelated dirty work.
- Allowed actions: Read/edit scoped game files, add focused tests and documentation, install safe
  dependencies only if a measured capability requires them, and run the minimum affected checks.
  Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: `client_snapshot` privacy or identity semantics, contract version, route/time
  derivation, realtime sequence/replacement behavior, visual asset vocabulary, or CP-13/14 handoff
  changes.

## Owning authority

- Projection contract: [`../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract)
- Governing decision: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Pre-implementation challenge: [`../Validation/41-cp12-client-projection-preimplementation-challenge.md`](../Validation/41-cp12-client-projection-preimplementation-challenge.md)
- Visual/UI contract: [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md) and [`../Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md)
- Realtime predecessor: [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md), [`../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md), and [`../Scenarios/08-cp08-projection-pathfinding-fixtures.md`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md)
- Mission/death predecessors: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md), [`../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../Mechanics/Chains/07-death-to-respawn-or-corruption.md), and [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)

## Evidence status

- Verified: CP-08 full replacement and server-bound scope; CP-09 through CP-11 mission, route, cargo,
  combat, death, reissue/review, revisions, and event history; the additive projection joins,
  privacy boundary, route-derived positions, deterministic draw commands, semantic rows, stale/null/
  unsupported handling, and local build/runtime checks under [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md).
- Accepted: The Canvas/React split, geometric placeholders, and server-only projection authority in
  [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), reviewed in
  [`Validation/42`](../Validation/42-cp12-client-projection-runtime-cross-functional-audit.md).
- Unknown: Live session/bootstrap, browser delivery and keyboard/interpolation behavior, genuine
  WebMCP/Re-entry, non-empty obstacle/fog fixture, final art, hosted continuity, and production
  performance remain separate gates.

## Smallest reversible action

The Red fixtures exposed the missing read-model fields and strict client boundary. The Green change
adds only the accepted server projection and pure presentation surface; the post-Green audit fixes
inconsistent lifecycle, hidden geometry, and foreign actor acceptance before closure.

## Verification and closure target

- Minimum verification: CP-12 focused projection/render-model tests covering positive, negative,
  boundary, privacy, stale/null, malformed, deterministic draw, accessible output, route-derived
  travelling/returning position, and predecessor regressions; then `npm run typecheck`, `npm run
  build`, and both game documentation validators. Results are bound in [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md)
  and [`Validation/42`](../Validation/42-cp12-client-projection-runtime-cross-functional-audit.md).
- Closure target: `runtime_verified` for the local projection and renderer boundary only.
- Rollback or remediation: Preserve the existing snapshot fields and realtime replacement contract;
  revert only task-scoped uncommitted files or disable the new renderer behind an explicit no-snapshot
  state if a linked read model cannot be validated. Do not add a browser fallback or mutate state.
- Reopen trigger: another player's data appears, the renderer accepts invalid scope/sequence, a
  position or mission field is client-derived, a state-changing control is required, or the additive
  shape changes the contract/authority boundary.
