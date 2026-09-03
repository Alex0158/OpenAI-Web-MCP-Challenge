# SK-EVID-053: CP-12 Canvas Mission-State Readback Runtime Verification

## Identity

- Evidence ID: `SK-EVID-053`
- Related task, decisions, and validation: [`SK-TASK-066`](../Tasks/SK-TASK-066-cp12-canvas-mission-state-readback.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/79`](../Validation/79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — one real local entrypoint process, worker, file-backed fixture, and browser context over a committed ordinary UI command; this is not a two-session or external integration proof
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Git branch `main`, base `HEAD 9994f4e` (`feat(game): integrate readable canvas visual surface`); Task 066 documentation was uncommitted during the readback, and no source or server behavior changed
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; Playwright CLI controlled the local Chrome browser
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=1`, accepted `sleepless-mvp-01` fixture, fresh database `tmp/runtime/sk-task-066-canvas-mission-fresh.sqlite`
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3196`; entrypoint command was `src/server/entrypoint.ts`
- Runtime identities: `process_instance_id=6ea1d0a1-4c05-4328-b250-1f22cf0ca2b5`; `worker_instance_id=c8b2a94f-2375-4498-a469-fd1a8837cd6e`

## Objective and claim boundary

- Behavior under test: The ordinary page GATHERER dispatch is committed by the server, then the same authoritative snapshot drives the mission row and Canvas route/actor/tool/cargo presentation as the mission progresses.
- Claim this evidence may support: One local one-mission visual readback connecting the existing UI command, authoritative dispatch result, GATHERER role/tool lock, route phase, cargo progression, responsive Canvas presentation, and clean local lifecycle.
- Claims this evidence cannot support: Two independent browser contexts, combat outcomes, multi-player delivery, WebMCP discovery or invocation, Agent Signal/Re-entry delivery, hosted continuity, public deployment, final art/atlas quality, or population-scale performance.

## Preconditions and fixture

- Starting state: A fresh task-local database was admitted through the explicit fixture path. The initial page exposed `shelter-a`, Player A, Wood/Rock availability `1/1`, and five resident soldiers.
- Authoritative scope: The page received its normal server-derived fixture scope; the browser supplied only the existing labelled soldier and resource selections for the ordinary GATHERER command.
- Real boundaries: The local HTTP/Next entrypoint, shared worker, file-backed store, mission coordinator, WebSocket snapshot, projection, React dashboard, and Canvas were real local code.
- Synthetic or absent boundaries: No external service, WebMCP adapter, Agent Signal, Re-entry transport, second browser identity, production authentication, or hosted runtime was used.

## Execution

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| Start `NODE_ENV=test PORT=3196 HOST=127.0.0.1 LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=1 GAME_DB_PATH=tmp/runtime/sk-task-066-canvas-mission-fresh.sqlite /opt/homebrew/opt/node@24/bin/npx tsx src/server/entrypoint.ts` | Entrypoint owns the page, worker, store, and realtime path and reports readiness | **Passed**; `http_bound`, `runtime_ready`, and the process/worker identities above were logged |
| Open `http://127.0.0.1:3196/` at the wide viewport | READY page with the seeded shelter, Wood/Rock, and resident soldiers | **Passed**; initial authoritative snapshot at world time `7` showed `shelter-a`, Wood/Rock `1/1`, and five resident soldiers |
| Select `soldier-a-01`, select `node-rock-a`, and click the existing `Dispatch gatherer` control | A committed server command changes the selected resident soldier into a GATHERER mission | **Passed**; status read `Dispatch accepted. Mission reconciled from the authoritative snapshot.` and `MissionDispatched` was recorded at world time `18` |
| Read the next authoritative full snapshot before autonomous settlement | Mission row and Canvas use the same `TRAVELLING` role/tool/route state | **Passed** at world time `20`: `soldier-a-01` was `TRAVELLING`, role `GATHERER`, tool `PICKAXE`, target `node-rock-a`, cargo `0/5`; the Canvas showed the Shelter-to-Rock route and the orange GATHERER actor/tool cue |
| Capture the in-flight visual state | The readable Canvas and accessible row agree without adding client state | **Passed**; disposable screenshot [`sk-task-066-fresh-travelling.png`](../../output/playwright/sk-task-066-fresh-travelling.png) records the route, actor, GATHERER/PICKAXE row, and accepted status |
| Continue the same fixture through the existing autonomous cadence | Cargo and return phase remain represented by the authoritative snapshot | **Passed** at world time `39`: `RETURNING`, role `GATHERER`, tool `PICKAXE`, target `node-rock-a`, cargo `5/5` with the cargo-at-risk cue; history contained `MissionWorking`, repeated `CargoExtracted`, and `MissionAutoReturned` |
| Resize to `390 x 844` and read the page | Canvas and controls remain usable with no horizontal overflow | **Passed**; `document.scrollWidth=390`, `document.clientWidth=390`, Canvas `308 x 192.5`; the disposable narrow capture is [`sk-task-066-fresh-narrow.png`](../../output/playwright/sk-task-066-fresh-narrow.png). The same run then naturally showed home crossing, deposit, and coin credit in its history; no additional command was issued |
| Read browser console, close browser, and stop the process with `SIGINT` | No task-generated browser error and no orphaned runtime | **Passed**; zero console errors/warnings; shutdown logged `runtime_draining_SIGINT` and `runtime_stopped` |

Screenshots are ignored Playwright readback artifacts and are not product assets. The temporary
SQLite database was disposable and was not promoted to repository or hosted state.

## Assertions

- **Authority and identity:** The UI issued only the existing typed human dispatch command. Mission phase, role, tool, route, position, cargo, and revisions were read from the matching authoritative snapshot; no optimistic mission or browser-derived route was used as evidence.
- **Visual and semantic agreement:** The Canvas route and GATHERER/PICKAXE actor cue matched the accessible mission row for the same soldier. Cargo risk stayed available in the React text surface while the Canvas added only a presentation cue.
- **Progression:** The run observed `TRAVELLING` before extraction and `RETURNING` with a full cargo stack. Later natural home/deposit history is corroborating readback only; this record makes no combat or multi-worker claim.
- **Responsive UX:** The tested wide and 390-pixel pages retained the map/dashboard surface, readable mission state, and exact document/client widths with no overflow.
- **Lifecycle:** The browser and one local entrypoint process closed cleanly. No external delivery, deployment, or persistent repository state was changed.

## Limitations and closure

- This is a single local browser-context observation at ladder level 4. It does not close the independent two-browser gate or any hosted/production gate.
- Autonomous timing is fixture-driven. The readback proves the states observed above, not a guaranteed wall-clock cadence or a performance budget.
- Final art, atlas loading, animation/VFX, combat visuals, and larger population rendering remain separate visual gates.
- Reopen if the mission row and Canvas diverge, the dispatch requires a new snapshot field, the client derives gameplay state, the responsive surface overflows, or the fixture cannot reproduce a committed authoritative progression.

**Exact conclusion:** The existing CP-12 Canvas primitive surface was read back through one fresh local
server-authoritative GATHERER mission: dispatch, route, role/tool, cargo, return, responsive layout,
and clean shutdown all passed at the named local scope. No WebMCP, Re-entry, two-session, hosted,
combat, final-art, or performance claim follows.
