# SK-EVID-051: CP-16 Independent Browser-Context Capability Probe

## Identity

- Evidence ID: `SK-EVID-051`
- Related task and records: [`SK-TASK-063`](../Tasks/SK-TASK-063-cp16-independent-browser-context-capability-probe.md), [`SK-TASK-042`](../Tasks/SK-TASK-042-cp12-independent-two-session-browser-isolation.md), [`Validation/77`](../Validation/77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md), [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `process-runtime`
- Verification ladder: `4` for the local process, two-tab readback, and close-one lifecycle observation; level-5 independent two-session delivery was not proven
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, `HEAD e64a747` (`docs(rightspot): reconcile post-048 audit state`), with the pre-existing game working tree preserved; no stage, commit, push, or deploy was performed
- Contract: `SK-MVP-0.2`
- Runtime: Node.js `v24.20.0` selected through `/opt/homebrew/opt/node@24/bin`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Browser: Codex In-app Browser, browser id `2`
- Browser API capability readback: browser capabilities `visibility` and `viewport`; tab capabilities `pageAssets` and `webmcp`; the documented tab API exposes `get`, `list`, `new`, and `selected`, with no context-creation or context-isolation operation
- Fixture: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3194`, one entrypoint-owned worker/store/resolver/realtime path
- Temporary database: `/tmp/sleepless-kingdom-cp16-context-063-20260903-0930.sqlite`
- Tabs: canonical page `http://127.0.0.1:3194/`, title `Sleepless Kingdom`, tabs `6` and `7`

## Question and claim boundary

Can the supported browser surface create two genuinely independent contexts for the canonical local
fixture and expose distinct server-derived alpha/beta projections while preserving private-state
isolation and close-one lifecycle?

This evidence may support only the named local process, two-tab readback, and surviving-tab lifecycle
observation. It cannot support level-5 two-player privacy isolation, independent cookie/session
contexts, WebMCP or Agent delivery, Re-entry, hosted continuity, public identity, or judge reproduction.

## Preconditions and authority boundary

- The fresh task-local SQLite database was started only through explicit `LOCAL_FIXTURE_MODE=1` and
  was seeded by the existing entrypoint-owned fixture path.
- No player id, shelter id, binding, world, position, mission, clock, or hidden state was supplied by
  browser input. The page remained a projection consumer.
- No browser cookie, local storage, profile, password, or session store was inspected. No state-changing
  command, WebMCP call, Agent Signal, external delivery, or Re-entry action was issued.
- No second worker, persistence store, resolver, identity map, browser polyfill, or new dependency was
  introduced.

## Executed procedure and results

| Replayable procedure | Result |
|---|---|
| Start `NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3194 GAME_DB_PATH=/tmp/sleepless-kingdom-cp16-context-063-20260903-0930.sqlite PATH=/opt/homebrew/opt/node@24/bin:$PATH node node_modules/tsx/dist/cli.mjs src/server/entrypoint.ts` | **Passed**; entrypoint emitted `http_bound` and `runtime_ready` for process `6298ec62-cc87-4c7c-ad97-fe12edff1965` and worker `88831a27-ef95-486b-a88a-2c9262ed4d0e`. |
| Open tabs `6` and `7` at `http://127.0.0.1:3194/` | **Passed**; both pages loaded with title `Sleepless Kingdom`, `Connection: READY`, `Realtime capability: supported`, world time `0`, and `WebMCP: registered`. |
| Read semantic projection from both tabs | **Same scope in both**: `shelter-a`, Wood/Rock `1/1`, five `soldier-a-*` rows, player position `16, 64`, and causal history `0 events`. No beta projection appeared. |
| Inspect browser and tab capabilities | **No independent-context operation available**; the selected browser documented tabs but no context creation/isolation surface. |
| Close tab `6`, then read tab `7` | **Passed** close-one observation; tab `7` remained READY with `shelter-a`, world time `0`, and the same scoped projection. |
| Stop the fixture with `SIGINT` | **Passed**; entrypoint emitted `runtime_draining_SIGINT` followed by `runtime_stopped`; tab list was empty after cleanup. |

## Cross-functional assertions

- **Scope and privacy:** Equal alpha readback in both tabs is compatible with shared-profile state and
  with two contexts receiving the default alpha handle; it does not distinguish those cases. No beta
  data was observed.
- **Lifecycle:** Closing one tab did not stop the worker or make the surviving tab stale. This is a
  close-one/keep-one observation, not a reconnect or independent-session proof.
- **Authority and effects:** The read-only probe produced no gameplay event, outbox row, cargo change,
  coin change, mission mutation, or snapshot mutation.
- **Browser capability:** The supported IAB surface provides tab operations only for this session; no
  documented context isolation path exists. A different genuinely context-capable surface is required
  for a positive level-5 result.

## Analysis and closure

- Failure classification: `environment`/`evidence` limitation; the browser surface could not establish
  independent contexts, so the positive isolation claim is undecidable.
- Residual risk: The game still needs a genuine alpha/beta context proof before the CP-16 level-5
  two-player claim and judge rehearsal can close.
- Invalidation triggers: Changes to the browser API, fixture session policy, first-frame validator,
  projection visibility, runtime versions, canonical page, or fixture seed invalidate this record.
- Exact conclusion: **`SK-TASK-063` is runtime-verified for the named IAB two-tab limitation and
  close-one lifecycle observation only. The independent two-session gate remains open.**
