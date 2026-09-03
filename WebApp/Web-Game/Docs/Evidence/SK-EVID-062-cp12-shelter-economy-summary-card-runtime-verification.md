# SK-EVID-062: CP-12 Shelter Economy Summary Card Runtime Verification

## Identity

- Evidence ID: `SK-EVID-062`
- Related task, decisions, and validation: [`SK-TASK-075`](../Tasks/SK-TASK-075-cp12-shelter-economy-summary-cards.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/88`](../Validation/88-cp12-shelter-economy-summary-card-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `2` for the deterministic presentation mapping and focused tests; the browser observation is local presentation readback and does not raise the claim level
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game `main` at `HEAD 92bab5b07f95c79c9592adf2c8c10e9f3abf013e` plus the task-owned working-tree changes in `src/client/shelter-summary-presentation.ts`, `src/client/game-projection.tsx`, `src/client/game-projection.module.css`, `tests/cp12-shelter-summary-presentation.test.ts`, `package.json`, and the task/evidence/validation/status records
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; the Playwright CLI browser version was not exposed by the adapter
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=0`, accepted `sleepless-mvp-01` fixture, fresh file-backed disposable database
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3149`, `SHUTDOWN_TIMEOUT_MS=2000`; entrypoint `src/server/entrypoint.ts`

## Objective and claim boundary

- Behavior under test: Render the existing projected shelter coins and ready-gated visible Wood/Rock nodes as compact, readable, read-only economy summary cards.
- Claim this evidence may support: deterministic Coins/Wood/Rock card mapping from the existing client projection, available/depleted text for projected nodes, explicit fail-closed waiting values when resource projection is unavailable, wide/narrow local layout readback without horizontal overflow, and clean local browser/process lifecycle.
- Claims this evidence cannot support: resource generation, quantity or coin conversion, income balance, prices, upgrades, sensing-radius behavior, new snapshot or command contracts, WebMCP, Re-entry, Agent delivery, Receiver/Connector delivery, independent browser contexts, hosted continuity, final art/VFX, or population-scale performance.

## Preconditions and fixture

- Starting state: A fresh local fixture page reached `READY` at world time `0` with `shelter-a`, five resident soldiers, and one projected Wood plus one projected Rock node.
- Projection authority: `buildShelterSummaryCards` consumed only the typed `view.shelter` and the ready-gated `view.resourceNodes` projection. Coins remain the projected shelter field; Wood/Rock values count visible projected nodes and report only `AVAILABLE`/`DEPLETED` states.
- Real boundaries: Entrypoint, worker/store lifecycle, server snapshot, React projection, CSS module, and browser DOM were real local surfaces. The database, server process, and browser context were disposable.
- Synthetic or absent boundaries: No state-changing command, server/shared change, persistence schema change, WebMCP action, Re-entry delivery, second identity, hosted runtime, or external Receiver/Connector was used.

## Focused verification

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npx tsx --test tests/cp12-shelter-summary-presentation.test.ts` | Ready counts, availability detail, null resource projection, missing shelter, and empty ready resources remain deterministic | **Passed, 3/3** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-visual` | Existing CP-12 visual contracts plus shelter summary presentation remain green | **Passed, 20/20** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` | Existing projection authority and semantic row behavior remain unchanged | **Passed, 5/5** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | The client mapper and card integration compile without a contract change | **Passed** |
| Run `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` | The optimized Next.js page builds | **Passed**; Next.js `16.3.4` completed successfully |

No fresh Red-to-Green transition was captured during this closure session: the mapping assertions and implementation were already present in the task-owned working tree when the session began. The result above is the executed Green and regression evidence; it does not invent a Red transcript.

## Browser readback

| Replayable procedure | Actual result |
|---|---|
| Start the local entrypoint with `NODE_ENV=test LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=0 HOST=127.0.0.1 PORT=3149 SHUTDOWN_TIMEOUT_MS=2000 GAME_DB_PATH=<fresh mktemp file> /opt/homebrew/opt/node@24/bin/node node_modules/tsx/dist/cli.mjs src/server/entrypoint.ts` and open `http://127.0.0.1:3149/` through the Playwright CLI | **Passed**; the page reached `READY`, and the existing fixture dashboard rendered the shelter section |
| Read the shelter economy region at the default/wide viewport | **Passed**; three cards were present with visible values `Coins 0`, `Wood 1`, and `Rock 1`, plus the expected banked/availability detail text |
| Set a temporary `1280 x 1000` viewport and inspect layout metrics | **Passed**; `innerWidth=1280`, `scrollWidth=1280`, `clientWidth=1280`, three cards, grid columns `126px 126px 126.016px`, and card values `[0,1,1]` |
| Set a temporary `390 x 844` viewport and inspect layout metrics | **Passed**; `innerWidth=390`, `scrollWidth=390`, `clientWidth=390`, three cards in one `308px` column, and card values `[0,1,1]` |
| Read browser console output, close the browser context, then stop the entrypoint with `SIGINT` | **Passed**; error and warning counts were `0`, the browser closed before signal delivery, and the process emitted `runtime_draining_SIGINT` followed by `runtime_stopped` without a shutdown timeout |

## Assertions and limitations

- The mapper always returns the stable order Coins, Wood, Rock. Coins retain the exact projected shelter coin value; Wood/Rock values are counts of projected nodes, not private quantities or income.
- A null resource projection maps both resource cards to `—` with `Waiting for an authoritative snapshot`; it cannot retain a prior count. A missing shelter maps Coins to the same explicit waiting value while ready empty resources remain `0` with `0 available · 0 depleted · in sensing range`.
- The React section is memoized from the current projection and contains no command, timer, poll, subscription, WebMCP call, Signal emission, outbox acknowledgement, or gameplay mutation. Existing server-snapshot meaning remains visible below the cards.
- The browser trace used the seeded local fixture's one Wood and one Rock node. Resource generation, settlement, conversion, and live economy balance remain unverified by design.

**Exact conclusion:** The CP-12 shelter dashboard now presents the existing authoritative Coins and visible Wood/Rock projection as readable responsive summary cards with explicit availability and fail-closed unavailable-state text. Focused tests, projection tests, typecheck, build, wide/narrow local readback, console inspection, and clean lifecycle passed; the result remains a local presentation-only claim.

