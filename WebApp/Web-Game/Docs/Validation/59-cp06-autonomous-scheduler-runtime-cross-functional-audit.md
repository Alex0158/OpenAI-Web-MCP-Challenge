# CP-06 Autonomous Scheduler Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL EXPLICIT-AUTONOMOUS SCOPE  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-047`](../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)  
**Evidence:** [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md)  
**Decision:** [`ADR-GAME-0033`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit challenges the B implementation across schema migration, trusted-time separation,
startup ordering, boundary replay, worker ownership, scheduler races, process health, existing due
work, and downstream page/Agent boundaries.

**Verdict:** accept `SK-TASK-047` as `runtime_verified` for one local file-backed G2 fixture world
when `autonomous: true` or `AUTONOMOUS_WORLD_MODE=1` is explicitly selected. The implementation
closes the local autonomous driver gate; it does not claim hosted continuity, multi-world fairness,
timer reducers, WebMCP, Re-entry, or production identity.

## Cross-functional review

| Surface | Final result | Disposition |
|---|---|---|
| Schema and migration | Schema `8` / `cp06-004` adds nullable `world.server_time_anchor_ms`. A schema-v7 file with the column removed restores it transactionally; malformed or missing required shapes fail closed. | Accepted. Contract version remains `SK-MVP-0.2`. |
| Anchor authority | A fresh null anchor initializes once. A non-null anchor is idempotent. Live and bounded-recovery boundary completion validates monotonicity and writes `world_time`, marker clearing, and the new anchor in one transaction. Interrupted-boundary replay deliberately preserves the pre-replay anchor so recovery can count the marker once; generic entity mutation cannot edit the anchor. | Accepted. Anchor is restart metadata, not a gameplay clock. |
| Startup ordering | The worker opens/migrates one store, captures the completed time/anchor before replay, builds one service graph, replays an active boundary through `WorldClock.start()` without refreshing that anchor, derives bounded recovery from the pre-replay observation, then marks ready and starts one scheduler. Over-limit, rollback, malformed, no-world, or ambiguous-world states do not admit commands or start the driver. | Accepted. |
| Live time source | Scheduler wakeups use one process-monotonic source and pass measured elapsed milliseconds to the existing `advance()` seam. Wall time is used only for startup recovery and boundary anchor observation; browser, Agent, page, and WebSocket clocks are absent. | Accepted. |
| Boundary and due-work chain | Autonomous advances enter the same `movement -> deposit -> contact -> extraction -> combat -> settlement -> timers` coordinator. Existing idempotency and due markers remain the reducers' ownership; settlement and timers stay explicit no-ops. | Accepted for implemented G2 reducers. |
| Scheduler lifecycle | One-shot scheduling prevents interval overlap. The generation guard ignores stale callbacks, an in-flight advance blocks rescheduling, stop drains before store close, and a callback/advance failure clears future wakeups and emits one `WORKER_FAULT`. | Accepted. |
| Worker graph and health | The entrypoint passes one store and an explicit autonomous flag to one `WorldWorkerModule`. A scheduler fault reaches the existing runtime registry as `degraded`; shutdown retains the listener-first close order. | Accepted at local process level. |
| Fixture and player scope | Runtime proof uses the accepted `sleepless-mvp-01` fixture and one selected world. No world is invented, no second world is scheduled, and no player/shelter identity or visibility contract changes. | Accepted for the named fixture. |
| Client and Agent isolation | No page timer, realtime publication, WebMCP call, Agent Signal, outbox delivery, Re-entry action, or client-supplied time entered the implementation. Client snapshots remain read projections. | Accepted with later capability gates preserved. |
| Verification | The contract suite, affected CP-04 through CP-11 regressions, typecheck, and three file-backed no-browser runtime cases pass under Node 24, including an anchored partial-boundary restart. | Accepted at ladder level 4. |

## Failure-mode disposition

| Failure mode | Observed protection | Result |
|---|---|---|
| Startup recovery counted twice | Monotonic scheduler baseline is captured only after boundary replay and anchor recovery. | Closed by implementation and runtime assertions. |
| Wall-clock rollback | Trusted target derivation and boundary anchor completion return `RECOVERY_REQUIRED`; no ready/scheduler admission follows startup failure. | Closed for the local source contract. Host clock quality remains an operational risk. |
| More than 300 seconds downtime | Derivation returns `RECOVERY_LIMIT_EXCEEDED` before scheduler creation; durable world state remains available for diagnosis. | Closed by focused test. |
| Partial boundary on restart | `WorldClock.start()` replays the exact marker without refreshing the pre-replay anchor; startup then catches up only the remaining target, and later boundary completion updates the anchor atomically. | Closed by the anchored file-backed runtime replay case. |
| Delayed or overlapping callback | Actual monotonic delta is passed to `advance`; one in-flight promise and one scheduled handle are permitted. | Closed by deterministic scheduler test. |
| Stale callback after stop | Stop increments the generation, clears the wakeup, drains in-flight work, and ignores later generation callbacks. | Closed by deterministic drain test. |
| Scheduler/clock fault hidden | Scheduler enters `failed`, stops future wakeups, and calls the existing worker fault listener once. | Closed by focused fault test and health wiring review. |
| Empty or ambiguous world | Autonomous startup requires a selected world or exactly one persisted world; zero and multiple candidates fail visibly. | Closed by startup policy; multi-world scheduling remains out of scope. |
| Inert timer phase interpreted as gameplay | Coordinator still invokes the explicit no-op `timers` handler; autonomous time does not add respawn reducers. | Closed by scope review. |

## Residual risks and reopen routing

1. **Host wall clock and supervision:** A bad host clock or outage longer than five minutes fails
   closed. CP-17/CP-18 must prove the selected host, durable storage, supervisor restart, health
   routing, and any versioned hosted recovery policy.
2. **Single-world limit:** This task intentionally rejects ambiguous multi-world startup. A fair
   world registry or scheduler requires a separate decision and load evidence.
3. **Reducer completeness:** Resource/monster respawn and other timer effects remain deferred. A
   reducer may join the coordinator only with its own durable identity, ordering, and replay tests.
4. **External capabilities:** WebMCP, Re-entry, Agent delivery, production identity, and two-session
   browser proof remain separate gates and were not inferred from this worker runtime.
5. **Operational cadence:** The local runtime demonstrates the default 100 ms one-shot wakeup under a
   short task-local run. Sustained load, event-loop pressure, and hosted process continuity remain
   measured later.

## Exact disposition

`SK-TASK-047` is accepted as `runtime_verified` at the named local explicit-autonomous scope captured
by `SK-EVID-036`. Reopen this audit if a second clock/queue appears, an anchor is written outside
boundary completion, startup admits commands before replay, elapsed time comes from a browser/Agent,
callbacks overlap or mutate after drain, the 300-second cap is bypassed, or autonomous scheduling is
enabled without an explicit host decision.
