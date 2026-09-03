# SK-TASK-066: CP-12 Canvas Mission-State Readback

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The fresh local GATHERER readback is verified under [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md) and [`Validation/79`](../Validation/79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md).
- Next gate: No further gate remains for this named one-mission local readback; independent sessions, combat presentation, external delivery, hosted continuity, final art, and scale remain separate tasks.

## Identity

- Task ID: `SK-TASK-066`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible temporary-fixture readback that exercises an existing
  state-changing UI command and the Canvas projection together. It must not be mistaken for a new
  gameplay implementation, a two-player result, or an external WebMCP/Re-entry trace.

## Objective

Prove that the CP-12 Canvas primitive baseline remains legible when an actual server-authoritative
GATHERER mission leaves the Shelter. The readback must connect the ordinary dispatch control, the
authoritative full snapshot, the mission row, route rendering, role/tool cue, and any visible cargo or
depletion state without adding a new projection field, browser-owned state, or fixture-only product
behavior.

## Success and non-goals

- Success: A fresh `LOCAL_FIXTURE_MODE=1` page reaches READY, the existing resident soldier and sensed
  Wood/Rock target are selected, and the ordinary `Dispatch gatherer` control receives a committed
  server result.
- Success: The next authoritative snapshot exposes the same soldier as `GATHERER` with its existing
  tool/route/phase fields; the mission row and Canvas remain consistent while the soldier is in flight
  or working. Cargo/depletion is recorded when the short local window reaches it.
- Success: The map, dashboard, human controls, and text equivalents remain usable at the existing
  wide and narrow viewport checks; no task-generated console error appears.
- Success: The process and browser close cleanly and the exact fixture, command result, screenshot
  paths, and claim limits are recorded in this task's evidence and validation records.
- Non-goals: Source or server changes, new snapshot fields, new gameplay rules, combat balancing,
  second-player isolation, WebMCP, Re-entry, Receiver/Connector, hosted continuity, final art, or
  population-scale performance.

## Scope and authority

- In scope: One fresh local fixture process, the existing canonical page and ordinary GATHERER dispatch
  UI, read-only browser/runtime observation, disposable screenshots, this task's evidence and
  cross-functional validation records, and current status/task-index links.
- Out of scope: `src/`, `src/server/`, `src/shared/`, persistence schema, worker logic, visual
  renderer behavior, WebMCP, `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services,
  credentials, deployment, and unrelated dirty work.
- Allowed actions: Start and stop a task-local fixture, use the supported Playwright browser control,
  issue only the existing ordinary UI GATHERER command against the disposable database, collect
  scoped readback, add English evidence, and run the documentation validators. Do not stage, commit,
  push, merge, deploy, or contact external parties as part of the readback.
- Revalidate when: The dispatch control labels, `client_snapshot` shape, route/mission projection,
  fixture seed, browser/runtime, or visual state vocabulary changes.

## Owning authority

- Visual decision: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Rendering boundary: [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
- Projection boundary: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Visual implementation predecessor: [`SK-TASK-065`](SK-TASK-065-cp12-canvas-actor-world-visual-surface.md)
- Scenario: [`CP-12 Canvas and dashboard fixtures`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
- Mission/readback contracts: [`detail-07-role-and-loadout-lock.md`](../Mechanics/detail-07-role-and-loadout-lock.md), [`detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md), and [`detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)

## Evidence status

- Verified predecessor: The Canvas primitive baseline is integrated for its named initial-state
  presentation under [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md)
  and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md).
- Verified predecessor: The ordinary GATHERER dispatch and authoritative reconciliation path is
  runtime-verified under [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)
  and [`Validation/55`](../Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md).
- Verified: The fresh local readback kept the role/tool/route/cargo cues legible through travel,
  extraction, and full-cargo return at the tested wide and narrow viewport sizes; see [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md).
- Claim boundary: A positive result supports only this local one-mission presentation trace. It cannot
  support a two-player slice, combat outcome, WebMCP, Re-entry, hosted, or judge claim.

## Readback plan

1. Record the branch, source base, `SK-MVP-0.2`, Node.js 24, browser identity, fixture port, and fresh
   file-backed database path.
2. Start one entrypoint-owned process with the accepted `sleepless-mvp-01` fixture and
   `AUTONOMOUS_WORLD_MODE=1`; verify `runtime_ready` before opening the page.
3. Read the initial page at 1280 x 900, then select an existing resident soldier and one available
   Wood/Rock target through the labelled comboboxes and click `Dispatch gatherer`.
4. Read the committed status, mission row, authoritative snapshot progression, Canvas bounds, and
   route/role/cargo presentation. Capture the in-flight state and the first observed progression;
   if autonomous timing reaches an untested state, stop the claim at the recorded state rather than
   interpreting it as a new combat or multi-worker result.
5. Repeat the no-horizontal-overflow and console-error checks at 390 x 844, close the browser, stop
   the fixture with SIGINT, and classify any unobserved progression as an explicit limitation.

## Cross-functional assertions

- The page sends only the existing typed human dispatch command; the server/worker remains the sole
  authority for mission identity, role/tool lock, route, position, cargo, and revision.
- The Canvas reads the same accepted `client_snapshot` that produces the accessible mission row; no
  browser-derived route, cargo, role, hidden cell, or time is accepted as evidence.
- The ordinary UI remains usable without WebMCP, and no WebMCP, Agent Signal, Re-entry delivery, or
  external transport is invoked.
- The temporary mission mutation is isolated to the fresh database and is discarded with the fixture;
  no persistent repository or hosted state is changed.
- A missing target, stale snapshot, rejected command, or silent progression is recorded as a typed
  limitation rather than converted into a visual success claim.

## Verification and closure target

- Minimum verification: exact source/runtime/fixture identity, initial and post-dispatch semantic
  readback, Canvas bounds, one narrow viewport check, console readback, clean process shutdown, and
  evidence/validation records with explicit claim limits.
- Closure target: `runtime_verified` for the named one-mission local presentation observation only.
- Rollback or remediation: Stop the disposable process and preserve the prior code; no source rollback
  or database cleanup outside the fresh temporary fixture is authorized.
- Reopen trigger: The mission row and Canvas disagree, a visual cue requires a new snapshot field, a
  browser control becomes client-authoritative, the page overflows or blocks input, or the fixture
  cannot prove a committed authoritative progression.

## Execution result

- Source/runtime identity: branch `main`, base `HEAD 9994f4e`, Node.js `v24.20.0`, npm `11.19.0`,
  Next.js `16.3.4`, React `19.2.8`, `SK-MVP-0.2`, and one local Playwright Chrome context.
- Fresh fixture: `LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=1`, port `3196`, disposable database
  `tmp/runtime/sk-task-066-canvas-mission-fresh.sqlite`, process
  `6ea1d0a1-4c05-4328-b250-1f22cf0ca2b5`, worker
  `c8b2a94f-2375-4498-a469-fd1a8837cd6e`.
- Initial readback reached READY at world time `7` with `shelter-a`, Wood/Rock `1/1`, and five
  resident soldiers. Selecting `soldier-a-01` and `node-rock-a` then using the existing
  `Dispatch gatherer` control returned `Dispatch accepted` and `MissionDispatched` at world time `18`.
- The matching authoritative snapshot at world time `20` showed `TRAVELLING`, role `GATHERER`, tool
  `PICKAXE`, target `node-rock-a`, and cargo `0/5`. The Canvas route and actor/tool cue matched the
  accessible mission row; the in-flight capture is `output/playwright/sk-task-066-fresh-travelling.png`.
- The same autonomous fixture later showed `RETURNING`, `GATHERER`, `PICKAXE`, and cargo `5/5` at
  world time `39`, with the expected `MissionWorking`, `CargoExtracted`, and `MissionAutoReturned`
  history. The narrow `390 x 844` readback measured document/client widths of `390/390` and Canvas
  `308 x 192.5`; capture: `output/playwright/sk-task-066-fresh-narrow.png`. The later natural
  home/deposit/coin history is corroborating only; no second command or combat claim was made.

## Verification and closure

- Browser console readback returned zero errors and zero warnings. The browser closed through the
  Playwright control, and SIGINT produced `runtime_draining_SIGINT` followed by `runtime_stopped`.
- No `src/`, server, shared, schema, worker, renderer, WebMCP, Re-entry, or external files changed;
  only this task's documentation/evidence/index updates are part of the closure.
- The exact evidence and cross-functional audit are [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md)
  and [`Validation/79`](../Validation/79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md).
- Closure: `verified` with `runtime_verified` for the named one-mission local presentation scope.
