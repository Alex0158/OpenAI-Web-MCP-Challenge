# SK-EVID-052: CP-12 Canvas Actor and World Visual Surface Runtime Verification

## Identity

- Evidence ID: `SK-EVID-052`
- Related task, decisions, and validation: [`SK-TASK-065`](../Tasks/SK-TASK-065-cp12-canvas-actor-world-visual-surface.md), [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md), [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `2` for the deterministic visual contract and focused tests; the browser readback is a local presentation observation and does not raise the claim level
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Git branch `main`, base `HEAD 609ef564af808276de81bb49c330a7b79ebc8790`; task-owned working-tree changes were limited to the listed Game visual, test, task, evidence, validation, and status-doc paths before the coherent commit
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, Next.js `16.3.4`, React `19.2.8`; browser was the Codex Playwright-controlled local Chrome session
- Fixture world and seed: `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=1`, fresh task-local SQLite database at `tmp/runtime/sk-task-065-canvas.sqlite`; the seeded page projected `shelter-a`, five resident soldiers, and one Wood plus one Rock node
- Environment and configuration: `NODE_ENV=test`, `HOST=127.0.0.1`, `PORT=3193`; one entrypoint-owned process; no external assets, credentials, WebMCP call, Re-entry transport, or hosted service

## Objective and claim boundary

- Behavior under test: The client maps the existing server-owned `client_snapshot` projection and
  `CanvasDrawCommand` list to a readable, deterministic Canvas surface for G2 terrain, fog, Wood,
  Rock, Shelter, player, GATHERER, HUNTER, Monster, cargo, and defeated cues. The accepted React
  mission and status text remains the semantic equivalent.
- Claim this evidence may support: The named local Canvas primitive baseline is integrated; its pure
  mapping contract and current browser presentation were observed in the exact source/runtime above.
- Claims this evidence cannot support: Final art or atlas export, every visual state in the inventory,
  animation/VFX quality, population-scale FPS, two independent browser contexts, WebMCP, Re-entry,
  hosted continuity, public deployment, or judge reproduction.

## Preconditions and fixture

- Starting state: The existing projection model and command ordering were present; no snapshot field,
  server rule, worker cadence, transport, or persistence schema was changed.
- Synthetic identities and seeded actors: The local fixture exposed the existing `shelter-a`,
  `soldier-a-01` through `soldier-a-05`, player position `(16, 64)`, Wood node, and Rock node.
- Real, fake, and stubbed boundaries: The process and page were real local runtime surfaces for this
  task; the world fixture and Playwright browser were local test infrastructure; no external capability
  or transport was substituted and reported as live.

## Execution

| Replayable procedure | Expected result | Actual result |
|---|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-visual` | Pure visual mapping and existing icon tests pass | **Passed, 8/8** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` | Existing server-derived projection remains deterministic | **Passed, 5/5** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | No TypeScript errors | **Passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` | Production Next.js build succeeds | **Passed** |
| Start `src/server/entrypoint.ts` with the task-local fixture and read the page at 1280 x 900 | READY page, Canvas, mission/dashboard, and no horizontal overflow | **Passed**; Canvas `682 x 426.25`, document width `1280`, client width `1280` |
| Resize the same page to 390 x 844 and read the page | Existing controls and text remain present and no horizontal overflow appears | **Passed**; Canvas `308 x 192.5`, document width `390`, client width `390` |
| Clear then read browser console errors after reload | No task-generated console error or favicon 404 | **Passed**; zero errors and zero warnings in the readback |

Local screenshots were written for the readback but remain disposable Playwright artifacts and are not
runtime assets: `output/playwright/sk-task-065-wide-v2.png` and
`output/playwright/sk-task-065-narrow.png`.

## Assertions

- Player-visible state: Fog is visibly distinct from explored ground and blocked cells; Wood and Rock
  silhouettes remain distinct; Shelter, player, role tools, Monster, cargo, and defeated markers are
  readable at the tested wide and narrow sizes. The existing mission rows and text equivalents remain
  present in the accessibility-facing React layer.
- Command and failure contract: No command, input, WebMCP call, or page action was changed by this
  increment. The Canvas consumes the existing draw-command list and does not decide state.
- Persistence, event, and outbox state: No server, shared, persistence, worker, event, or outbox path
  changed; projection tests and the clean local process readback showed the existing scope and values.
- Exactly-once settlement after duplicate delivery and replay: Not applicable to this presentation-only
  increment; no delivery, settlement, or event mutation was exercised.
- Ownership denial, stale revision, restart, and reconnect: Not applicable to the visual mapping itself;
  existing projection/realtime contracts remain outside the changed surface and were not weakened.

## Analysis and closure

- Failure classification: `unknown` for untested final-art, atlas, animation, and population-scale
  performance surfaces; no failure was observed in the named local visual scope.
- Limitations and residual risk: The current implementation intentionally uses Canvas primitives.
  Source SVG sheets, selected/path/protected-ring states, animation/VFX, mobile quality beyond the two
  readback sizes, and performance under a large actor population remain open and require a later bounded
  visual task if they become necessary.
- Invalidation triggers: A change to `SK-MVP-0.2`, the projection or draw-command shape, Canvas
  ownership, snapshot privacy, browser/runtime version, fixture seed, or the visual state vocabulary
  invalidates this record.
- Exact conclusion: **The CP-12 Canvas actor/world primitive baseline is integrated and verified at
  ladder level 2 for the named local mapping and presentation scope. No server, gameplay, WebMCP,
  Re-entry, hosted, or final-art claim follows.**
