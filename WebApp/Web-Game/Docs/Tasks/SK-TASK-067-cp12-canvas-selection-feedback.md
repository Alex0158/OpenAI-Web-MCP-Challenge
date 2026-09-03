# SK-TASK-067: CP-12 Canvas Selection Feedback

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The deterministic selection resolver and Canvas overlay are integrated and verified under [`SK-EVID-054`](../Evidence/SK-EVID-054-cp12-canvas-selection-feedback-runtime-verification.md) and [`Validation/80`](../Validation/80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md).
- Next gate: No further gate remains for this named local selection presentation; HUNTER dispatch, protected/migration state, final art, independent sessions, WebMCP, Re-entry, hosted continuity, and scale remain separate tasks.

## Identity

- Task ID: `SK-TASK-067`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible presentation-only improvement using existing local form
  state and the accepted projection. It must not turn browser selection into gameplay authority or
  obscure the route, actor, resource, or accessible text.

## Objective

Make the human dispatch workflow legible at a glance by showing which resident soldier and sensed
Wood/Rock node are currently selected in the Canvas. The overlay must be derived from the existing
authoritative projection plus the local form selection, remain stable across redraws, and disappear
when the selection becomes stale or the session scope changes.

## Success and non-goals

- Success: Selecting a valid resident soldier resolves one visible soldier position and selecting a
  valid available Wood/Rock target resolves one visible resource position from the current projection.
- Success: Canvas draws a small amber ring for each resolved selection without adding DOM actor nodes,
  timers, animation, network calls, or new snapshot fields.
- Success: Invalid, stale, hidden, or empty selections produce no overlay and do not affect dispatch
  eligibility, route, mission, cargo, world time, or server state.
- Success: The existing form labels, mission rows, route, text status, and wide/narrow layout remain
  usable; focused tests, typecheck, build, and local browser readback pass.
- Non-goals: New gameplay commands, HUNTER dispatch, target discovery, protected-start or migration
  state, asset/atlas work, VFX timing, WebMCP, Re-entry, session identity, server/shared changes,
  combat, balance, or hosted behavior.

## Scope and authority

- In scope: `src/client/canvas-visuals.ts`, `src/client/game-projection.tsx`, focused client visual
  tests, and this task's evidence, validation, status, roadmap, and index records.
- Out of scope: `src/server/`, `src/shared/`, persistence, worker/realtime/session behavior,
  `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, and unrelated dirty files.
- Allowed actions: Edit the named Game presentation/test/docs paths, run focused Node 24 checks and a
  disposable local browser fixture, and commit only the Game scope after closure. Do not push, merge,
  deploy, or contact external parties.
- Revalidate when: selection state moves into a shared command contract, the projection shape changes,
  Canvas draw ordering changes, or an overlay becomes the only meaning of a critical state.

## Owning authority

- Visual decision: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Rendering boundary: [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
- Projection boundary: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Visual baseline and mission readback: [`SK-TASK-065`](SK-TASK-065-cp12-canvas-actor-world-visual-surface.md), [`SK-TASK-066`](SK-TASK-066-cp12-canvas-mission-state-readback.md), [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md), and [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md)
- Visual vocabulary: [`Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md) and [`Design/Visual/02-art-bible.md`](../Design/Visual/02-art-bible.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: The Canvas primitive surface draws the current projection and the mission
  readback confirms route, role/tool, and cargo agreement for one local GATHERER mission.
- Verified predecessor: The page already keeps soldier/target selection in React form state and
  clears it when the server-derived scope changes.
- Verified: The selection resolves only current `AT_SHELTER`/`AVAILABLE` projected entities, clips
  off-viewport rings, and remains readable at 1280 x 900 and 390 x 844.
- Claim boundary: A positive result supports only local presentation feedback. It does not add or prove
  gameplay state, independent sessions, combat, WebMCP, Re-entry, hosted continuity, or final art.

## Smallest reversible action

1. Add a pure resolver that maps the two selected IDs to current projected positions and returns null
   for empty, stale, non-owned, unavailable, or non-visible selections.
2. Add one deterministic overlay pass after existing actors/resources, clipped by the current viewport,
   using an amber ring and a non-color-only text equivalent already present in the form.
3. Add focused Red tests for valid, stale, duplicate/foreign, and empty selections, then implement
   Green and refactor without changing draw-command order or command eligibility.
4. Verify the browser at wide and narrow sizes and record explicit claim limits.

## Cross-functional assertions

- The server remains authoritative for the accepted snapshot; local selection affects presentation
  only and never changes command arguments or expected revisions.
- Selection lookup is scope-safe because it searches only the already validated `view.actors` and
  `view.resourceNodes`; it cannot reveal hidden entities or foreign shelter data.
- The overlay is supplemental. Mission text, form labels, route, and resource labels remain the
  accessible and semantic meaning if Canvas is absent or stale.
- Redraws are driven by React projection/selection changes; no timer, worker, WebSocket, or asset
  loader is introduced.

## Verification and closure target

- Minimum verification: focused selection tests, `npm run test:cp12-visual`, `npm run test:cp12-projection`,
  `npm run typecheck`, `npm run build`, documentation validators, `git diff --check`, and one local
  browser readback at 1280 x 900 and 390 x 844.
- Closure target: `integrated` for the named local selection presentation only.
- Rollback or remediation: revert only the task-owned client/test/docs changes if a selection cue is
  stale, off-viewport, inaccessible, or coupled to server state.
- Reopen trigger: the overlay changes dispatch behavior, exposes a non-projected entity, adds a new
  snapshot field, creates a second renderer, clips critical state, or causes responsive overflow.

## Execution result

- Red tests initially failed because `resolveSelectionVisual` did not exist. Green implementation
  added the pure resolver and a post-command Canvas overlay without changing server/shared code.
- The resolver accepted `soldier-a-01` at `AT_SHELTER` and available `node-wood-a`, while focused
  tests cleared empty, field, defeated, missing, and depleted choices.
- Fresh local readback used `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=0`, port `3197`, and
  `tmp/runtime/sk-task-067-canvas-selection.sqlite`. The page reached READY, showed a solid soldier
  ring and dashed Wood target ring after the two labelled selections, and submitted no command.
- Wide capture: `output/playwright/sk-task-067-selection-wide.png`. Narrow capture:
  `output/playwright/sk-task-067-selection-narrow.png`. At `390 x 844`, document/client widths were
  `390/390` and Canvas measured `308 x 192.5`; selected IDs remained in the form controls.

## Verification and closure

- `npm run test:cp12-visual`: **10/10 passed**.
- `npm run test:cp12-projection`: **5/5 passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed** with Next.js `16.3.4` and Node.js `24.20.0`.
- Browser console readback: **0 errors, 0 warnings**; browser close and SIGINT shutdown both completed
  cleanly with `runtime_draining_SIGINT` and `runtime_stopped`.
- Documentation validators and `git diff --check -- WebApp/Web-Game` pass after the closure records
  are synchronized. Exact cross-functional review is [`Validation/80`](../Validation/80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md).
- Closure: `verified` with `integrated` for the named local presentation scope only.
