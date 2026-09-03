# SK-EVID-060: CP-12 Mission Status Card Runtime Verification

## Identity

- Evidence ID: `SK-EVID-060`
- Related task, decisions, and validation: [`SK-TASK-073`](../Tasks/SK-TASK-073-cp12-mission-status-card-hierarchy.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/86`](../Validation/86-cp12-mission-status-card-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `2` for the deterministic presentation mapping and focused tests; the browser observation is local presentation readback and does not raise the claim level
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game `main` at `HEAD f6d3ae7` with the task-owned working-tree changes in `src/client/mission-presentation.ts`, `src/client/game-projection.tsx`, `src/client/game-projection.module.css`, `tests/cp12-mission-presentation.test.ts`, `package.json`, and the task records
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; Codex In-app Browser was used for local page readback and its browser version was not exposed by the adapter
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=0`, accepted `sleepless-mvp-01` fixture, disposable database `tmp/runtime/sk-task-073-mission-cards.sqlite`
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3198`; entrypoint command was `src/server/entrypoint.ts`

## Objective and claim boundary

- Behavior under test: Render the existing projected mission collection as structured, scannable cards showing soldier, phase, role/tool, target, cargo, risk, and next action while retaining the canonical accessible mission row.
- Claim this evidence may support: One local CP-12 presentation mapping, deterministic card rendering from validated mission fields, the five-card fixture dashboard readback at default and narrow browser sizes, no-overflow behavior for the tested viewport, and clean local browser/process lifecycle.
- Claims this evidence cannot support: New mission or combat behavior, new snapshot or command contracts, protected-start/migration state, independent browser delivery, WebMCP, Re-entry, Agent delivery, hosted continuity, final art, animation/VFX, or population-scale performance.

## Preconditions and fixture

- Starting state: A fresh local fixture page reached `READY` at world time `0` with `shelter-a`, Player A at `(16,64)`, five resident soldiers, and one sensed Wood plus one sensed Rock node.
- Projection authority: `buildMissionStatusCards` consumed only the validated `view.missions` collection. The canonical row text came from the existing `buildAccessibleMissionRows` output and was retained in each card's text equivalent.
- Real boundaries: Entrypoint, worker/store lifecycle, server snapshot, React projection, CSS module, and browser DOM were real local surfaces. The database and browser tab were disposable.
- Synthetic or absent boundaries: No state-changing dispatch, new server/shared code, external service, WebMCP action, Re-entry delivery, second identity, or hosted runtime was used.

## Red, Green, and focused verification

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| Add card mapping assertions before the presentation helper exists | The new contract fails clearly | **Red:** the test import failed because `src/client/mission-presentation.ts` did not exist |
| Implement the pure mapper and run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-visual` | Existing visual tests plus GATHERER, loaded/returning, review/cause, null, and empty mapping cases pass | **Passed, 14/14** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` | Existing projection authority and semantic row behavior remain unchanged | **Passed, 5/5** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | The client and helper compile without a type contract change | **Passed** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` | The optimized Next.js page builds | **Passed**; Next.js `16.3.4` completed successfully |

## Browser readback

| Replayable procedure | Actual result |
|---|---|
| Start `NODE_ENV=test HOST=127.0.0.1 PORT=3198 LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=0 GAME_DB_PATH=tmp/runtime/sk-task-073-mission-cards.sqlite /opt/homebrew/opt/node@24/bin/npx tsx src/server/entrypoint.ts` and open `http://127.0.0.1:3198/` | **Passed**; page reached `READY`, realtime was supported, and the five-soldier fixture dashboard rendered |
| Read the mission region at the default browser viewport | **Passed**; five cards exposed `data-phase="AT_SHELTER"`, visible phase/role/tool/target/cargo/next/risk labels, and one canonical hidden row per card |
| Set a temporary `390 x 844` viewport, reload, and read layout metrics | **Passed**; the adapter reported CSS viewport `333 x 721`, document `scrollWidth=333` and `clientWidth=333`; all card right edges remained within the document and five canonical rows remained present |
| Inspect the narrow screenshot while scrolled to the dashboard | **Passed**; the card hierarchy remained readable, labels wrapped without clipping, and the existing dispatch controls stayed below the mission list |
| Read browser logs, close the tab, and stop the entrypoint with `SIGINT` | **Passed**; error/warning log set was empty, tab closed, and the process emitted `runtime_draining_SIGINT` followed by `runtime_stopped` with exit code `0` |

## Assertions and limitations

- The mapper preserves canonical enum values in `phase`, `role`, `tool`, `targetId`, `cargoRisk`, and
  `nextAction` while adding human-readable labels. Unknown or unsupported tools keep their text and
  receive no misleading icon.
- Cargo exposure follows the existing `capacityUsed > 0` rule; this increment does not reinterpret
  quantity, capacity, settlement, or risk. Terminal cause and review reason are shown only when the
  validated projection supplies them.
- Cards are supplemental React presentation. The existing mission rows remain the accessible semantic
  equivalent, and no timer, polling, event listener, worker, WebSocket, server, or command path was added.
- The browser observation used the fixture's five resident `AT_SHELTER` missions, so working,
  returning, terminal, and review cards are supported by pure mapping tests rather than a state-changing
  browser trace in this task.

**Exact conclusion:** The CP-12 mission dashboard now presents the existing authoritative mission
projection as readable status cards with explicit phase, role/tool, target, cargo, risk, next action,
and preserved canonical text. Focused tests, build, responsive readback, and clean lifecycle passed;
the result remains a local presentation-only claim.
