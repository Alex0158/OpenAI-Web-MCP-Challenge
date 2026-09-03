# CP-04 Topology and Cross-Functional Audit

**Role:** Cross-functional design review of the process foundation
**Status:** OWNER-ACCEPTED STATIC REVIEW; CP-04 runtime verification is recorded separately
**Date:** 2026-09-02
**Scope:** Sleepless Kingdom CP-04 and its interfaces with CP-05, CP-06, CP-08, CP-12, CP-14, and CP-17
**Decision record:** [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
**Resolved issue:** [`../Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md`](../Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md)

## 1. Purpose

This review tests whether the CP-04 process skeleton can be implemented without inventing a process
owner, readiness meaning, shutdown path, or cross-checkpoint contract in code. It examines the page,
worker, health endpoint, future WebSocket upgrade, persistence startup, world-clock recovery, Re-entry
delivery, and hosted restart boundary together.

This is a finding record, not a new game rule. The accepted durable choice belongs to
`ADR-GAME-0011`; the runtime task now proceeds under that boundary without claiming runtime proof.

## 2. Verdict

The smallest coherent local topology is one Node.js 24 process with two logical application modules:
the Next.js page application and the designated world-worker module. One explicit entrypoint owns
startup, HTTP binding, runtime state, future WebSocket upgrades, and shutdown. A local two-process
supervisor would be technically possible but adds ports, handshakes, orphan cleanup, and failure
cases before persistence exists.

The proposal was accepted by the owner on 2026-09-02, and CP-04 local runtime verification is recorded
in `SK-EVID-007`. The G2 gameplay contract is unchanged. The external Agent adapter issue and the visual
asset lane remain separate and are unaffected.

## 3. Evidence and assumptions

### Verified

- G-MVP-17 is recorded as one modular Node process locally in both MVP validation packs.
- The accepted target stack separately names a Next.js page and a long-running Node.js world worker.
- The pending CP-04 task previously lacked a process entrypoint, precise health payload, liveness
  semantics, shutdown deadline, and a reproducible package/test command.
- A Next.js request handler is request-scoped; using it to create a singleton worker would make
  development reload and repeated requests a duplicate-start risk.
- CP-02 is disposable evidence. Its worker, page, persistence, and capability results do not define
  the durable CP-04 topology.

### Inferred for the proposal

- One local process preserves the accepted minimal topology while allowing one HTTP server to host the
  page, process-level health adapter, future command gateway, and `/realtime` upgrade seam.
- A worker fault can remain observable as `degraded` while the host performs a process restart; CP-04
  does not need an in-process worker supervisor.
- Process readiness can be defined without claiming a persisted world. CP-05 and CP-06 can extend
  the worker startup seam so that a later `ready` state includes compatible persistence and clock
  recovery.

### Unknown until implementation

- Whether the selected Next.js version and final dependency tree run cleanly through the explicit
  entrypoint in production-like mode.
- Whether the eventual host requires a split page/worker deployment or can keep one application
  worker with a durable database.
- Measured simulation load and whether one process needs a worker thread or a hosted service split.

## 4. Cross-functional findings and disposition

| ID | Severity | Cross-functional risk | Disposition |
|---|---|---|---|
| A1 | P1 | Page and worker had no single lifecycle owner. Different checkpoints could start different processes and produce misleading restart evidence. | Addressed by the accepted one-process entrypoint in ADR-GAME-0011; local startup evidence is recorded in CP-04. |
| A2 | P1 | `starting`, `ready`, `degraded`, and `draining` were named without a distinct liveness signal. A page or host could treat a live but unusable process as ready. | Addressed by `live` and `ready` fields plus status-specific HTTP codes; CP-04 exercised all states in `SK-EVID-007`. |
| A3 | P1 | Binding the listener only after worker startup would hide `starting` from an external health check, while binding too early could accept commands before readiness. | Addressed by binding after page preparation and before worker startup; the runtime gate returns `503` until `ready` and rejects state-changing work. |
| A4 | P1 | A route handler or page module could construct a worker more than once under requests or reloads, or observe a stale copy of a bundled singleton. | Addressed by an entrypoint-owned runtime registry, a process-level health adapter outside the Next.js bundle, and a future explicit command gateway. |
| A5 | P1 | CP-08 had no stable owner for the HTTP upgrade. A later WebSocket implementation could add a second server or bypass runtime drain. | Addressed by reserving upgrade dispatch at the entrypoint; CP-08 owns realtime behavior but not a second local server. |
| A6 | P1 | Worker failure, shutdown, and CP-06 restart could disagree about whether the world clock is alive. | Addressed by keeping the clock out of CP-04, making `degraded` reject commands, and reserving authoritative recovery for the worker/persistence seam. |
| A7 | P1 | Re-entry delivery could call a degraded process and report a silent no-op, or a page could infer world readiness from process health. | Addressed by the existing typed `RECOVERY_REQUIRED` boundary and the rule that Agent actions reread live state; no Agent or world wait is added. |
| A8 | P2 | `next dev` and HMR can hide duplicate singleton starts and do not prove signal-safe production behavior. | Addressed by a production-like `next build` plus explicit entrypoint check; development HMR is not CP-04 evidence. |
| A9 | P2 | A custom server changes Next.js deployment assumptions and must not be combined with standalone output without a deliberate decision. | Addressed as an explicit CP-04 trade-off; the lockfile and selected start command passed local production-like verification. |
| A10 | P2 | Missing configuration, unlocked dependencies, or an undefined runner would make a green check non-reproducible. | Addressed by typed environment loading, npm lockfile, pinned `tsx` runner, and named build/start/typecheck/test scripts. |
| A11 | P2 | Framework logs could be mistaken for the application redaction guarantee. | Scoped by the accepted contract: CP-04 guarantees redacted lifecycle records and forbids request, prompt, credential, path, stack, and mutable-game fields; framework access logging is not evidence of lifecycle events. |
| A12 | P2 | One process can let a CPU-heavy future simulation starve HTTP, health, or WebSocket work. | Deferred to CP-06/CP-08 performance budgets. A measured event-loop or snapshot budget is a reopen trigger, not a reason to add a second service now. |
| A13 | P2 | Hosted page/worker splitting could create two apparent authorities or make page health lie about worker health. | Deferred to CP-17. A split must retain worker-owned time/state, explicit command/snapshot contracts, and health that reflects the authoritative worker. |

## 5. Accepted boundary

The owner-accepted `ADR-GAME-0011` defines these interfaces for CP-04 implementation:

1. **Entrypoint:** `src/server/entrypoint.ts` is the only CP-04 startup owner. It creates one HTTP
   server, starts one worker instance, rejects or idempotently returns repeated start requests, does
   not reopen a stopped runtime, and installs one idempotent signal path.
2. **Runtime registry:** `src/server/runtime.ts` exposes an entrypoint-owned lifecycle snapshot to
   `src/server/health.ts`. The process-level handler never starts or restarts a worker, and it is
   mounted before the Next.js request handler so a bundled route cannot hold a stale singleton.
3. **Health:** dynamic `GET /api/health` uses `Cache-Control: no-store`, reports `live` separately
   from `ready`, returns `200` only for `ready`, and returns `503` for `starting`, `degraded`, or
   `draining`. It reports operational instance IDs, never game identities or private context.
4. **Startup:** invalid config, page preparation, or HTTP bind failure prevents a listener. After the
   listener exists, worker-start failure is observable as `degraded` and state-changing work is
   rejected.
5. **Shutdown:** `SIGTERM` and `SIGINT` are idempotent; the first signal enters `draining`, closes
   admission and future upgrades, calls the worker stop hook, closes the HTTP server, and obeys the
   bounded deadline. A timeout produces one typed failure receipt, and a late worker fault cannot
   reopen admission or change the draining state.
6. **Realtime seam:** the entrypoint owns future `/realtime` upgrade dispatch. CP-04 does not add a
   WebSocket protocol or a second local server.
7. **Reproducibility:** npm, committed `package-lock.json`, Node.js 24, a pinned `tsx` runner, and
   production-like build/start verification are part of the task contract.

The same bundle boundary applies to later state-changing HTTP adapters: they must call the
entrypoint-owned command gateway or an explicit worker message interface rather than importing a
mutable worker instance from a Next.js route.

## 6. Cross-checkpoint contract

| Later checkpoint | CP-04 promise it may rely on | CP-04 must not decide |
|---|---|---|
| CP-05 | Worker startup has a deterministic initialization seam; `degraded` rejects state changes. | Database schema, transaction shape, event log, outbox, or snapshot contents. |
| CP-06 | The worker can own the authoritative clock after persistence is ready; process restart is visible. | World-time catch-up, due-work ordering, or replay policy. |
| CP-08 | One HTTP server and one upgrade owner exist; drain rejects new upgrades. | WebSocket message schema, snapshot cadence, reconnect protocol, or pathfinding. |
| CP-12 | The page can display runtime status and remain a projection. | Gameplay controls, Canvas state, or authoritative decisions. |
| CP-14 | A degraded or recovering process yields a typed recovery result; delivery remains durable elsewhere. | Thread scheduling, Agent context, or a gameplay wait. |
| CP-17 | Hosted checks can distinguish process liveness from world readiness. | Hosted provider, service split, credentials, or deployment claim. |

## 7. Owner acceptance record

The owner accepted these five items on 2026-09-02 before CP-04 release:

1. one local Node.js process with page and worker logical modules under one explicit entrypoint;
2. `live` versus `ready`, the four externally visible status values, and `200`/`503` semantics;
3. listener-before-worker readiness and `degraded` on worker-start/fault, with host restart rather
   than CP-04 in-process recovery;
4. custom-server production-like verification with no standalone-output combination; and
5. the 2,000 ms default shutdown deadline, typed config errors, npm lockfile, and `tsx` runner.

Selecting the supervised two-process alternative later would reopen the issue and require a new
topology, ports, health handshake, shutdown, and verification contract before that change starts.

## 8. Closure and reopen conditions

This review remains a static design audit. It does not prove a running server, a world clock,
persistence, WebSocket behavior, WebMCP discovery, Agent delivery, hosting, or gameplay.

The owner acceptance, reconciled records, and CP-04 release are recorded in
[`../Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md`](../Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md).
The CP-04 runtime evidence proves the ordinary clean-drain path. The rejecting worker/store close and
listener-first ordering path was subsequently verified through the CP-05 runtime seam and is resolved
in [`../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md),
with the broader persistence evidence in [`../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).
Reopen this audit if implementation shows that the entrypoint cannot host the page and worker safely,
health cannot distinguish process from world readiness, a second unmeasured service is required, or
event-loop pressure invalidates the one-process assumption.
