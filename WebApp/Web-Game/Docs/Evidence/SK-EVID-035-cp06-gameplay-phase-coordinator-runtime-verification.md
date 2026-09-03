# SK-EVID-035: CP-06 Boundary-Safe Gameplay Phase Coordinator Runtime Verification

## Identity

- Evidence ID: `SK-EVID-035`
- Related task and decision: [`SK-TASK-046`](../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md); [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)
- Evidence class: `process-runtime`
- Ladder level: `3` — file-backed SQLite boundary journal, worker-owned phase graph, explicit clock advance, and restart-equivalent replay in the Node 24 test runtime
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Persistence schema: version `7`; migration `cp06-003`
- Runtime versions: Node.js `v24.13.1`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Runtime database: task-local temporary file-backed SQLite databases created by the focused tests; no repository database was used

## Objective and claim boundary

- Behavior under test: reserve one integer boundary with a durable `in_progress_world_time`, run the accepted G2 phases through one worker-owned coordinator, complete the boundary only after all phases return, and replay the whole interrupted boundary before a restarted worker becomes ready.
- Claim this evidence may support: local schema-v7 migration, marker invariants, whole-boundary replay, one shared default worker gameplay graph, stable phase order, and nonfatal pre-empty GATHERER target depletion.
- Claims this evidence cannot support: an autonomous wall-time scheduler, trusted hosted elapsed-time anchoring, resource/monster respawn execution, periodic realtime publication, WebMCP, Re-entry, production identity, multi-world scheduling, continuous browser input, or hosted continuity.

## Red, Green, and focused verification

| Replayable command or procedure | Result |
|---|---|
| `npm run test:cp06` under the Node 24 baseline | **Passed 13/13** across integer clock behavior, recovery budget, lifecycle, marker invariants, schema-v6 migration, late-phase failure, whole-T replay, default worker composition, target-depletion liveness, and explicit no-op phases. |
| `npm run test:cp04` | **Passed 5/5** process lifecycle and health regressions. |
| `npm run test:cp05` | **Passed 26/26** persistence, WAL, rollback, event, idempotency, Signal, and worker lifecycle regressions. |
| `npm run test:cp07` | **Passed 5/5** deterministic fixture and restart regressions. |
| CP-08 focused suites (`test:cp08`, `test:cp08-cadence`, `test:cp08-gateway`, `test:cp08-realtime`, `test:cp08-wire`) | **Passed 30/30** movement, cadence, FIFO, projection, and realtime wire regressions. |
| CP-09/CP-10/CP-11 focused suites (`test:cp10`, `test:cp10-deposit`, `test:cp11`, `test:cp11-hunter`) | **Passed 78/78** mission, route, extraction, return, deposit, contact, combat, Hunter, and reissue-adjacent gameplay regressions. |
| `npm run typecheck` | **Passed** under Node 24. |

No broad aggregate suite, hosted runtime, external service, browser timer, or deployment command was
run. The selected checks cover the changed schema, persistence, clock, worker, coordinator, target
exhaustion, and transitive gameplay seams.

## Boundary and restart execution

| Procedure | Observed result |
|---|---|
| Open a new file-backed store and create world time `0` | Schema bootstrapped at version `7` with a nullable `in_progress_world_time` column and completed world time `0`. |
| Call `beginWorldBoundary(1)` twice, then attempt boundary `2` and completion `2` | The first call reserved `1`; exact replay returned the same marker; conflicting begin and completion failed with typed `RECOVERY_REQUIRED`. |
| Drop the marker column from a schema-v6 test database and reopen | The transactional migration restored `in_progress_world_time`, advanced metadata to schema `7` / `cp06-003`, and returned a null marker. |
| Inject a failure in the late `combat` phase after earlier phase callbacks | Completed world time stayed `0`; the durable marker stayed `1`; the clock became `recovery_blocked`; no later boundary ran. |
| Close the first store, open a second store on the same database, and start a new clock with replay handlers | Startup detected marker `1`, replayed every phase for `1` in the accepted order, atomically cleared the marker, and exposed completed world time `1` before the clock entered `running`. |
| Start the default `WorldWorkerModule` over one seeded G2 world | The worker created one movement cadence, mission service set, combat service, coordinator, and clock over the same store. Explicit `advance(9000)` moved a Rock GATHERER through travel and treated a target emptied before extraction as durable `MissionAutoReturned(reason = TARGET_DEPLETED)` with zero cargo; the clock remained `running`. |
| Inspect settlement and timer phases | Both phases were visited as explicit no-ops; no second settlement, timer, Signal, outbox, WebMCP, or Re-entry effect was created. |
| Stop the worker and temporary stores | Stores closed cleanly; temporary databases were removed by the test harness only. |

The restart check is a file-backed store/worker restart-equivalent in the Node test process. It proves
durable replay and readiness ordering at the application boundary; it does not claim an OS supervisor,
host restart policy, or production process continuity.

## Accepted phase contract exercised

1. The 100 ms movement reconciliation seam runs before each integer boundary.
2. `beginWorldBoundary(T)` reserves exactly the next boundary while `world_time` remains `T - 1`.
3. `movement` runs outbound arrival, then return/home crossing.
4. `deposit` settles newly due home crossings.
5. `contact` locks deterministic encounters before extraction.
6. `extraction` processes due GATHERER work; contact suppresses it, and an already-empty target takes the durable zero-cargo return path.
7. `combat` owns deterministic rounds and existing terminal effects.
8. `settlement` and `timers` remain explicit no-ops in this increment.
9. `completeWorldBoundary(T)` advances completed time and clears the exact marker only after all phases succeed.

## Assertions and residual risk

- **Authority:** Completed world time changes only through the boundary journal; phase transactions no longer publish `world_time = T` while a boundary marker is active.
- **Replay:** Durable due markers, stable work identities, event identities, and terminal phases make whole-T replay skip or replay each existing effect without a second domain result.
- **Ordering:** Coordinator phase order is fixed; each existing reducer retains its stable due-time/entity ordering.
- **Liveness:** A pre-empty resource node is a normal competition race and becomes a durable mission return, so one expected gameplay condition cannot block the world.
- **Admission:** Default worker store open, clock startup/replay, and ready state remain ordered; the gateway is not usable while the worker is starting or replaying.
- **Downstream isolation:** No autonomous timer, realtime broadcast, Agent Signal, outbox delivery, WebMCP call, or Re-entry action is attached to this coordinator.
- **Residual:** Respawn timer reducers, trusted elapsed-time anchoring, autonomous scheduling, multi-world ownership, public load/backpressure, independent browser sessions, and hosted continuity remain open gates.

## Exact conclusion

**`SK-TASK-046` is runtime-verified for one local, explicitly advanced, boundary-safe G2 gameplay
coordinator with schema-v7 whole-boundary replay. This evidence does not close the autonomous
scheduler, hosted continuity, WebMCP, Re-entry, or complete vertical-slice gates.**
