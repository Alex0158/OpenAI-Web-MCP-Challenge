# SK-TASK-073: CP-12 Mission Status Card Hierarchy

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The existing authoritative mission rows are now rendered as compact, structured status cards without changing the snapshot, command, or rendering contracts.
- Next gate: No further gate remains for this named local presentation; final art, combat/breach visuals, independent sessions, WebMCP, Re-entry, hosted continuity, and scale remain separate.

## Identity

- Task ID: `SK-TASK-073`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible, presentation-only change over an already validated
  `ClientSnapshotMission` projection. It improves the human demo surface while preserving the
  server-owned snapshot, accessible text, and existing command boundaries.

## Objective

Make the mission dashboard scannable during a live game trace. Each soldier's card should show the
stable soldier identity, current phase, role/tool, target, cargo quantity and exposure, and next
action in a predictable hierarchy. Terminal cause or review context must remain visible when the
projection supplies it. The card is a second presentation of the existing mission projection, not a
new state model.

## Success and non-goals

- Success: The card model is a pure deterministic mapping from the existing `ProjectionViewModel`
  missions and preserves the canonical enum values and identifiers without inventing state.
- Success: The dashboard renders one semantic list item per mission with visible phase, role/tool,
  target, cargo, risk, and next-action text. Important values remain readable if Canvas is absent.
- Success: Existing `buildAccessibleMissionRows` text, mission ordering, dispatch controls, route,
  snapshot status, and stale/invalid empty state remain unchanged in meaning.
- Success: Focused presentation tests, CP-12 projection/visual suites, typecheck, build, documentation
  validation, and wide/narrow local browser readback pass without console errors or layout overflow.
- Non-goals: New snapshot fields, server/shared changes, mission state transitions, WebMCP, Re-entry,
  Agent delivery, external services, protected-start/migration state, combat balance, final art,
  animation/VFX, atlas loading, population-scale performance, or changes to command eligibility.

## Scope and authority

- In scope: `src/client/projection-model.ts` or a client presentation helper, the mission section of
  `src/client/game-projection.tsx`, its CSS module, focused CP-12 visual/projection tests, and this
  task's evidence, validation, status, roadmap, and index records.
- Out of scope: `src/server/`, `src/shared/`, persistence, worker/realtime/session behavior,
  `reentry-core/`, `mvp/`, RightSpot, Eddy-owned source, and all external or hosted paths.
- Allowed actions: Edit only the named Game presentation/test/docs paths; run Node 24 focused checks,
  an isolated local browser readback, and the documentation validators; commit only Game-owned files
  after closure. Do not push, merge, rebase, cherry-pick, deploy, or contact external parties.
- Revalidate when: the `ClientSnapshotMission` shape or enum vocabulary changes, cards begin driving
  a command, a new data source is introduced, or a card becomes the only meaning of a critical state.

## Owning authority

- Product contract: [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
- Visual boundary: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Rendering boundary: [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
- Projection boundary: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Visual vocabulary: [`Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md)
  and [`Design/Visual/01-visual-direction.md`](../Design/Visual/01-visual-direction.md)
- Predecessors: [`SK-TASK-065`](SK-TASK-065-cp12-canvas-actor-world-visual-surface.md),
  [`SK-TASK-066`](SK-TASK-066-cp12-canvas-mission-state-readback.md), and
  [`SK-TASK-067`](SK-TASK-067-cp12-canvas-selection-feedback.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Cross-functional contract

- The server snapshot remains the only source of mission truth. The presentation mapping reads only
  validated `view.missions`; it does not inspect raw persistence or derive a new phase.
- Every card keeps the existing accessible row as its semantic fallback and uses text alongside any
  icon or visual tone. Color, icon shape, and CSS state cannot be the sole carrier of phase or risk.
- A stale, invalid, connecting, or empty projection produces the existing empty/status message and
  no fabricated card. A later snapshot replaces the presentation through the normal React projection
  path; no timer, polling loop, worker, WebSocket, or event listener is added.
- Mission order remains the projection order. Card-only formatting must not reorder soldiers or alter
  `resolveGathererDispatchSelection`, expected revisions, route data, cargo, or command payloads.
- The narrow layout must wrap long identifiers and labels without horizontal overflow. Reduced motion
  remains the default because this increment adds no animation.

## Smallest reversible action and TDD loop

1. Add Red tests for a working GATHERER card, a returning/loaded card, a terminal/review context, and
   null role/tool/target plus empty projection handling.
2. Implement the smallest pure presentation mapper using existing mission fields and stable icon IDs;
   then render the mapper through semantic list/card markup while retaining the canonical row text.
3. Add only the CSS needed for hierarchy, wrapping, and explicit text states. Refactor behavior-preserving
   duplication after focused tests pass.
4. Run focused tests, projection/visual transitive checks, typecheck/build, documentation validators,
   and a disposable 1280 x 900 plus 390 x 844 browser readback. Record exact claim limits.

## Verification and closure target

- Minimum verification: Red → Green → Refactor presentation tests; `npm run test:cp12-visual`;
  `npm run test:cp12-projection`; `npm run typecheck`; `npm run build`; documentation self-tests and
  validator; `git diff --check`; and local wide/narrow browser readback with clean shutdown.
- Closure target: `integrated` for the named local mission dashboard presentation only.
- Rollback or remediation: Revert only this task's client/test/docs files if the mapper invents state,
  the canonical row disappears, a card overflows, or the command/snapshot boundary changes.
- Reopen trigger: A card changes gameplay, exposes non-projected state, loses text equivalence, adds a
  transport/runtime dependency, or conflicts with a new contract or Eddy integration.

## Claim boundary

This task can establish clearer local presentation of the existing mission projection. It cannot
establish new gameplay behavior, combat or breach visuals, protected-start state, independent browser
delivery, WebMCP, Re-entry, hosted continuity, final art quality, or population-scale performance.

## Execution result

- Red tests initially failed because the new presentation mapper did not exist. Green implementation
  added `buildMissionStatusCards`, semantic mission card markup, explicit text labels, and only the
  CSS needed for hierarchy and narrow-screen wrapping.
- The mapper preserves canonical phase/role/tool/target/action values, follows the existing cargo-risk
  rule, omits misleading icons for unsupported tools, and exposes terminal/review context only when
  supplied by the projection.
- The card list retains one existing `buildAccessibleMissionRows` text equivalent per mission. No
  server/shared contract, command path, timer, transport, event listener, or external integration was
  added.
- A fresh local fixture browser readback reached READY with five cards, five canonical row references,
  no document overflow at the temporary `390 x 844` viewport, no browser errors or warnings, and clean
  process shutdown. Detailed result and limits are in [`SK-EVID-060`](../Evidence/SK-EVID-060-cp12-mission-status-card-runtime-verification.md)
  and [`Validation/86`](../Validation/86-cp12-mission-status-card-runtime-cross-functional-audit.md).

## Verification and closure

- `npm run test:cp12-visual`: **14/14 passed**.
- `npm run test:cp12-projection`: **5/5 passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed** with Next.js `16.3.4` and Node.js `24.20.0`.
- Local browser readback: **passed** at the default viewport and temporary `390 x 844` viewport;
  five cards, explicit labels, canonical row references, equal document/client width, and empty
  error/warning logs were observed. The tab and entrypoint closed cleanly.
- Documentation validators and Game-scope `git diff --check` pass after closure records are synchronized.

**Closure:** `verified` with `integrated` for the named local mission status card presentation only.
