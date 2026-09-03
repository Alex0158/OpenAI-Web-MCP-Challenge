# SK-EVID-061: CP-12 Causal History Card Runtime Verification

## Identity

- Evidence ID: `SK-EVID-061`
- Related task, decisions, and validation: [`SK-TASK-074`](../Tasks/SK-TASK-074-cp12-causal-history-card-hierarchy.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/87`](../Validation/87-cp12-causal-history-card-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `2` for the deterministic presentation mapper and focused suites; the browser observation is local presentation readback and does not raise the claim level
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game `main` at `HEAD e115c8c` plus the task-owned working-tree changes in the event mapper, projection, CSS, focused test, package script, and task/evidence/validation records
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; Codex In-app Browser was used for local page readback and its browser version was not exposed by the adapter
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=0`, accepted `sleepless-mvp-01` fixture, disposable database `tmp/runtime/sk-task-074-causal-history-readback.sqlite`
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3199`; entrypoint command was `src/server/entrypoint.ts`

## Objective and claim boundary

- Behavior under test: Render the existing validated, player-scoped causal event projection as one semantic timeline card per event, with visible event type, world time, monotonic cursor, and aggregate identity.
- Claim this evidence may support: deterministic preservation of the projected event fields and order, one local `MissionDispatched` card produced after an ordinary UI dispatch, wide/narrow layout readback without document overflow, and clean local browser/process lifecycle.
- Claims this evidence cannot support: new event production semantics, event retention or coalescing, Signal delivery, WebMCP dynamic action, Re-entry, Agent wake, external Receiver/Connector delivery, independent browser contexts, hosted continuity, final art/VFX, or population-scale performance.

## Preconditions and fixture

- Starting state: A fresh local fixture page reached `READY` at world time `0` with `shelter-a`, five resident soldiers, and one sensed Wood plus one sensed Rock node.
- Projection authority: `buildCausalEventCards` consumed only the validated `view.recentEvents` collection. It does not read persistence, browser time, or hidden entities.
- Readback setup: One ordinary UI GATHERER dispatch from `soldier-a-01` to `node-wood-a` was used only to create a visible local `MissionDispatched` event in the disposable fixture. It is not a new implementation path or an external action.
- Real boundaries: Entrypoint, worker/store lifecycle, server snapshot, React projection, CSS module, and browser DOM were real local surfaces. The database and browser tab were disposable.

## Red, Green, and focused verification

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| Add ordered-event, empty-input, and long-identity assertions before the mapper exists | The new import fails clearly | **Red:** `src/client/event-presentation.ts` was absent |
| Implement the pure mapper and run the focused event suite | Every projected field remains intact and order is unchanged | **Green:** `3/3` passed |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-visual` | Existing visual suites and causal presentation tests pass | **Passed, 17/17** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` | Existing projection authority remains unchanged | **Passed, 5/5** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | Client and helper compile without a contract change | **Passed** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` | The optimized Next.js page builds | **Passed**; Next.js `16.3.4` completed successfully |

## Browser readback

| Replayable procedure | Actual result |
|---|---|
| Start the fixture entrypoint at port `3199` and open `http://127.0.0.1:3199/` | **Passed**; page reached `READY` with realtime supported and the causal section initially showed the existing no-event message |
| Select `soldier-a-01` and `node-wood-a`, then click `Dispatch gatherer` | **Passed**; authoritative reconciliation showed one `MissionDispatched` card with `World time 0`, `Cursor #1`, and the complete `mission:mission-0a0b0bea408f5fb1657e094e` aggregate label |
| Read the card at the normal browser viewport | **Passed**; `innerWidth=1422`, `clientWidth=1422`, `scrollWidth=1422`, and the card right edge `1283.99` stayed within the document |
| Set a temporary `390 x 844` viewport, reload, and read the same event | **Passed**; adapter CSS viewport `433`, `clientWidth=433`, `scrollWidth=433`, card right edge `390.92`, and all identity text remained present and wrapped safely |
| Inspect browser logs, close the tab, reset the viewport override, and stop the entrypoint with `SIGINT` | **Passed**; error/warning log set was empty, the tab closed, and the process emitted `runtime_draining_SIGINT` followed by `runtime_stopped` with exit code `0` |

## Assertions and limitations

- The mapper is a pure field formatter. It preserves event ID, canonical event type, cursor, world
  time, aggregate type, aggregate ID, and server-provided order; it adds only a readable aggregate label.
- The React section retains the existing empty branch and count, and does not sort, deduplicate,
  paginate, poll, subscribe, acknowledge, mutate, or make any event actionable.
- Critical identity fields are visible DOM text. CSS is supplemental, long IDs wrap, and no icon or
  color is required to understand the event.
- The browser trace used one local `MissionDispatched` event. Other event types and long-ID wrapping
  are covered by pure tests; this evidence does not establish their production frequency or delivery.

**Exact conclusion:** The CP-12 dashboard now presents the already scoped causal event history as
ordered, readable cards with explicit event type, world time, cursor, and aggregate identity. Focused
tests, projection tests, typecheck, build, wide/narrow readback, and clean lifecycle passed; the result
remains a local presentation-only claim.
