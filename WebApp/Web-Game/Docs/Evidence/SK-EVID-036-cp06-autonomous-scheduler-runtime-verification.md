# SK-EVID-036: CP-06 Autonomous Scheduler Runtime Verification

## Identity

- Evidence ID: `SK-EVID-036`
- Related task and decisions: [`SK-TASK-047`](../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md); [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md); [`ADR-GAME-0033`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — file-backed SQLite worker progression, bounded restart recovery, partial-boundary replay, fault/drain contracts, and no-browser autonomous execution in the Node 24 test runtime
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 8b1cc8a` (uncommitted game changes; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Persistence schema: version `8`; migration `cp06-004`; nullable `world.server_time_anchor_ms`
- Runtime versions: Node.js `v24.13.1`; npm `11.8.0`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Runtime databases: task-local temporary file-backed SQLite databases created by the focused tests; no repository database was used

## Objective and claim boundary

- Behavior under test: one explicitly enabled worker owns a monotonic one-shot scheduler, recovers at most 300 integer world seconds from one persisted server-time anchor after boundary replay, advances the existing phase coordinator, and drains before persistence close.
- Claim this evidence may support: local schema-v8 anchor persistence, startup ordering, bounded autonomous progression for one selected G2 fixture world, one-shot overlap/fault/drain semantics, and no-browser worker continuity in the named Node runtime.
- Claims this evidence cannot support: hosted supervisor or durable hosted storage, multiple-world scheduling or fairness, resource/monster timer reducers, periodic realtime publication, WebMCP, Re-entry, production identity, or a public always-on deployment.

## Preconditions and fixture

- Starting state: a fresh file-backed database containing the accepted deterministic `sleepless-mvp-01` G2 fixture at `world_time = 0`.
- Synthetic world: `cp06-autonomous-runtime-world` for live progression and `cp06-autonomous-world` for deterministic restart/recovery assertions.
- Trusted sources: tests inject a server wall observation and a process-monotonic source; no browser or Agent time is read.
- Autonomous enablement: `WorldWorkerModule({ autonomous: true })`; config tests prove `AUTONOMOUS_WORLD_MODE` defaults false and rejects malformed values.

## Executed verification

| Replayable command or procedure | Result | Claim this supports |
|---|---|---|
| `npm run test:cp06-autonomous` under the Node 24 baseline | **Passed 8/8** | Schema-v8 migration, trusted target flooring/rollback/limit, atomic anchor completion, scheduler overlap/stale callback/fault behavior, explicit opt-in, worker startup recovery, and over-limit admission closure |
| `npm run test:cp06-autonomous-runtime` under the Node 24 baseline | **Passed 3/3** | A real file-backed autonomous worker advanced without a browser, wrote a non-null anchor at boundary completion, replayed a persisted partial boundary before scheduler admission, preserved the pre-replay anchor while recovering elapsed time, and drained/closed cleanly |
| `NODE_ENV=test PORT=43125 HOST=127.0.0.1 LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=1 GAME_DB_PATH=<temporary-file> npx tsx src/server/entrypoint.ts`, health poll, then process-group `SIGTERM` | **Passed** | The actual entrypoint reached `ready`, autonomously advanced the fixture world (`world_time = 1` after the smoke interval), persisted a non-null `server_time_anchor_ms`, and emitted `runtime_stopped` without a shutdown timeout |
| `npm run test:cp04` | **Passed** | Process lifecycle, health, entrypoint, and shutdown regressions after the explicit autonomous config wiring |
| `npm run test:cp05` | **Passed 26/26** | Persistence, migration, rollback, event, idempotency, Signal, outbox, and worker-store lifecycle regressions |
| `npm run test:cp06` | **Passed 21/21** | Integer clock, boundary coordinator, replay, target-depletion liveness, and autonomous contract aggregation |
| `npm run test:cp07` | **Passed 5/5** | Deterministic fixture, two-player placement, identity, persistence, reset, and restart regressions |
| `npm run test:cp08` | **Passed 4/4** | Movement, exploration, snapshot, and schema migration regressions |
| `npm run test:cp09` | **Passed 20/20** | Mission dispatch, role lock, route milestone, and worker boundary regressions |
| `npm run test:cp10` | **Passed 49/49** | Extraction, cargo, cadence, contested node, return, deposit, and schema migration regressions |
| `npm run test:cp11` | **Passed 7/7** | Gatherer loss, cargo loss, combat, Hunter victory, and restart regressions |
| `npm run typecheck` | **Passed** | TypeScript contract consistency for the current tree |

No full application aggregate, browser journey, external Receiver/Codex service, hosted runtime, or
deployment command was run. Those remain later evidence gates.

## Assertions

- **World authority:** Live callbacks read process-monotonic elapsed milliseconds and call the existing `WorldWorkerModule.advance()` path; timer delay is never interpreted as one world second.
- **Startup order:** Store migration and service-graph construction precede `WorldClock.start()` replay; the completed time and anchor from before an interrupted marker are retained for recovery; server-anchor recovery completes before the worker marks ready or starts the scheduler.
- **Anchor:** A fresh null anchor initializes once without downtime; an interrupted-boundary replay does not refresh the pre-replay anchor; live and bounded-recovery completion can update the anchor in the same transaction; a backward update leaves the marker, world time, and anchor unchanged.
- **Bounded recovery:** Exact 300-second forward downtime is accepted after flooring fractional milliseconds; 301 seconds or malformed/backward observations return typed recovery failures and do not start the scheduler. A partial-boundary restart counts the replayed marker once and catches up only the remaining target.
- **Serialization:** One one-shot wakeup is scheduled at a time; a slow advance blocks the next wakeup, stale callbacks are ignored by generation, and stop drains the in-flight operation before store close.
- **Fault visibility:** A callback/advance failure moves the scheduler to `failed`, clears future wakeups, and emits one `WORKER_FAULT` signal to the existing runtime health boundary.
- **Entrypoint composition:** The real `src/server/entrypoint.ts` path wires the explicit autonomous mode, serves health while the worker is ready, advances the file-backed fixture without a browser, and completes the existing coordinated shutdown path on `SIGTERM`.
- **Downstream isolation:** The autonomous driver does not call phase services directly, create a second queue or clock, publish realtime frames, invoke WebMCP/Re-entry, or activate the still-inert `settlement`/`timers` reducers.

## Analysis and closure

- Failure classification: no failures remained after the Red/Green/refactor loop; the initial missing-module Red was replaced by the accepted implementation and the focused suites were rerun.
- Residual risk and owner: host wall-clock quality, process supervision, durable hosted storage, event-loop load, multi-world selection, timer reducers, and external Agent delivery remain later checkpoint risks owned by CP-13 through CP-18.
- Invalidation triggers: changes to `SK-MVP-0.2`, schema/world-row shape, boundary phase order, scheduler cadence/authority, anchor semantics, or runtime version invalidate this record.
- Exact conclusion: **`SK-TASK-047` is runtime-verified for one local explicitly enabled, file-backed G2 world. The implementation preserves the single worker/world-clock authority, counts downtime exactly once around partial-boundary replay, and closes before claiming hosted continuity or downstream Agent behavior.**
