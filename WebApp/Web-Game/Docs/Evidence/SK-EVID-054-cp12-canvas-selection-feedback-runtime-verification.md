# SK-EVID-054: CP-12 Canvas Selection Feedback Runtime Verification

## Identity

- Evidence ID: `SK-EVID-054`
- Related task, decisions, and validation: [`SK-TASK-067`](../Tasks/SK-TASK-067-cp12-canvas-selection-feedback.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/80`](../Validation/80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `2` for the deterministic selection contract and focused tests; browser screenshots are supplementary local presentation readback and do not raise the claim level
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Git branch `main`, base `HEAD 0f42f1c` (`docs(game): verify canvas mission state readback`); Task 067 implementation was in the Game working tree during readback and no server/shared behavior changed
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; Playwright CLI controlled the local Chrome browser
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=0`, accepted `sleepless-mvp-01` fixture, fresh database `tmp/runtime/sk-task-067-canvas-selection.sqlite`
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3197`; entrypoint command was `src/server/entrypoint.ts`

## Objective and claim boundary

- Behavior under test: The local GATHERER command form selection resolves the currently projected resident soldier and available Wood/Rock node, and the Canvas draws supplemental selection rings without changing the command or snapshot.
- Claim this evidence may support: One local presentation readback showing valid soldier/resource selection feedback at wide and narrow viewports, stale/empty/depleted selection clearing in the pure contract, and clean browser/process lifecycle.
- Claims this evidence cannot support: New gameplay state, command authority, HUNTER dispatch, protected-start or migration state, combat, two independent browser contexts, WebMCP, Re-entry, hosted continuity, final art, or population-scale performance.

## Preconditions and fixture

- Starting state: A fresh task-local database reached READY with `shelter-a`, Player A at `(16,64)`, five resident soldiers, and one sensed Wood plus one sensed Rock node.
- Selection authority: The existing labelled React comboboxes supplied `soldier-a-01` and `node-wood-a`; the resolver searched only the validated `view.actors` and `view.resourceNodes` collections.
- Real boundaries: The entrypoint, server snapshot, React form, Canvas draw effect, and responsive layout were real local surfaces. The database and screenshots were disposable test artifacts.
- Synthetic or absent boundaries: No state-changing dispatch was submitted, no external service, WebMCP, Agent Signal, Re-entry transport, second browser identity, or hosted runtime was used.

## Red, Green, and focused verification

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| Add valid/stale/empty/depleted/field/defeated selection assertions before the resolver existed | New contract fails clearly | **Red:** module import failed because `resolveSelectionVisual` was not exported |
| Implement `resolveSelectionVisual` and run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-visual` | Existing visual/icon tests plus selection mapping pass | **Passed, 10/10** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` | Existing projection contract remains unchanged | **Passed, 5/5** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` and `npm run build` | Client compiles and optimized Next page builds | **Passed**; Next.js `16.3.4` build completed |

## Browser readback

| Replayable procedure | Actual result |
|---|---|
| Start the named entrypoint and open `http://127.0.0.1:3197/` at 1280 x 900 | **Passed**; READY, realtime supported, server world time `0`, five resident rows, and the existing GATHERER form appeared |
| Select `soldier-a-01` and `node-wood-a` through the ordinary labelled comboboxes | **Passed**; the Canvas showed a solid amber ring at the resident soldier/Shelter position and a dashed amber ring around the visible Wood target; no request or server state mutation occurred |
| Capture the wide page | **Passed**; [`sk-task-067-selection-wide.png`](../../output/playwright/sk-task-067-selection-wide.png) records the selected actor/target cues and the unchanged readable dashboard |
| Resize to 390 x 844 and reread | **Passed**; `document.scrollWidth=390`, `document.clientWidth=390`, Canvas `308 x 192.5`, and both selected IDs remained in the labelled controls; [`sk-task-067-selection-narrow.png`](../../output/playwright/sk-task-067-selection-narrow.png) records the narrow surface |
| Read browser console, close browser, and stop the process with SIGINT | **Passed**; zero errors and zero warnings, followed by `runtime_draining_SIGINT` and `runtime_stopped` |

Screenshots are ignored Playwright readback artifacts and are not runtime assets. The temporary
SQLite database was not promoted to repository or hosted state.

## Assertions and limitations

- The resolver accepts only an `AT_SHELTER` soldier and an `AVAILABLE` projected resource node; empty,
  field, defeated, stale, unavailable, or depleted selections resolve to no overlay. It clones positions
  and cannot mutate the snapshot.
- The Canvas overlay runs after the existing clear/tile/resource/route/actor commands, clips positions
  outside the current viewport, and uses a solid soldier ring plus dashed target ring. Mission text,
  form labels, and status remain the semantic meaning if Canvas is absent or stale.
- The local selection is presentation state only. It does not alter dispatch eligibility, command
  arguments, expected revisions, route, world time, or server persistence.
- The browser readback proves only the named local presentation at the stated viewport sizes. It does
  not prove final asset quality, animation, protected/migration overlays, or scale.

**Exact conclusion:** CP-12 now gives the existing human GATHERER form clear local Canvas feedback for
the selected resident soldier and available Wood/Rock target, with stale/invalid selections cleared by
contract and no cross-module authority changes. The result is ladder-level 2 local presentation evidence.
