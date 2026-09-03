# SK-ISSUE-004: CP-04 Shutdown Order and Store-Close Failure Boundary

## Identity

- Issue ID: `SK-ISSUE-004`
- Title: CP-04 can await worker/store close before closing the HTTP listener
- State: `resolved`
- Priority: `P1`
- Owner and registered date: Game owner, 2026-09-02

## Problem and impact

- Observed behavior at registration: `src/server/entrypoint.ts` awaited `worker.stop()` before it
  called `closeServer()`. A rejected worker or persistence-store close could therefore skip listener
  closure; a slow close could consume the drain deadline before the HTTP side began to close.
- Lifecycle ownership note: `createRuntimeStartController().stop()` is a separate bounded helper used
  by the CP-04 unit seam, while the production entrypoint currently calls `worker.stop()` directly.
  CP-05 must keep the entrypoint as the sole production shutdown orchestrator; persistence close must
  not be wired into a competing helper path with different timeout or rejection behavior.
- Expected behavior: The accepted CP-04 shutdown contract enters `DRAINING`, closes admission and
  begins listener/active-connection closure, then settles worker and store close within one bounded
  deadline. A close failure is redacted and typed, and cannot leave the process half-drained.
- Affected players, actors, missions, and environments: Any browser, page command, WebSocket upgrade,
  CP-05 file-backed store, and local or hosted process receiving a shutdown signal.
- Settlement, identity, event-ordering, authority, or reviewer impact: A listener that remains open
  after persistence close failure can accept requests against a closed authority and invalidate the
  CP-04/CP-05 lifecycle and restart evidence.

## Evidence

- Verified: The current shutdown path calls `worker.stop()` at lines 231–238 and only then calls
  `closeServer()` at lines 240–243 in `src/server/entrypoint.ts`; ADR-GAME-0011 requires listener and
  active-connection closure as part of the first `DRAINING` path before the bounded exit.
- Inferred: CP-05 will make this visible because its store must close before the worker stop promise
  resolves, so a store-close rejection would exercise the same bypass unless the order and rejection
  handling are fixed.
- Unknown at registration: Whether the eventual store close is synchronous, asynchronous, or can
  reject after the worker has already reported a fault; CP-05 now exercises the relevant rejection and
  timeout boundary with a synchronous worker-owned store seam.
- First known source baseline: CP-04 local process verification in `SK-EVID-007` and the current
  `src/server/entrypoint.ts` implementation before CP-05 persistence integration.

## Ownership and dependencies

- Owning document and implementation: [`../../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`../../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](../../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md), and `src/server/entrypoint.ts` plus the CP-05 worker/store seam.
- Related mechanisms, chains, capabilities, tasks, decisions, and evidence: CP-04, CP-05, C10,
  `SK-MVP-0.2`, [`SK-EVID-007`](../../Evidence/SK-EVID-007-cp04-process-runtime-verification.md),
  and [`CP-05 cross-functional audit`](../../Validation/07-cp05-persistence-cross-functional-audit.md).
- Blocking authority or dependency: No new gameplay decision; follow ADR-GAME-0011. Reopen that ADR
  only if the one-deadline ordering cannot preserve both listener closure and worker/store close.

## Plan and gates

- Completed action: Added a fake worker/store close rejection and bounded timeout test, starts listener
  closure before awaiting worker/store close, preserves idempotent shutdown, keeps the entrypoint as
  the sole production orchestrator, and exposes one typed shutdown result.
- Challenge or decision required: No, unless measured ordering requires changing the accepted CP-04
  shutdown contract or its deadline.
- Stop or escalation condition: A close failure remains unhandled, a listener accepts work after
  `DRAINING`, or the one bounded deadline cannot cover both listener and store closure; stop CP-05 and
  reopen ADR-GAME-0011 before adding a second process or service.
- Verification completed: CP-04 and CP-05 focused lifecycle tests, close/reopen, rejected close,
  listener-first drain, late store access, redacted typed error, production-like build/start/health/
  shutdown smoke, and type checks passed in [`SK-EVID-008`](../../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).

## Resolution

- Change and remediation: CP-05 wires the file-backed store through the worker seam. The entrypoint
  begins listener closure at `DRAINING`, runs worker/store close within the same bounded deadline,
  catches and redacts typed close failures, and returns `errorCode` without opening a second close path.
- Evidence: [`SK-EVID-008`](../../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).
- Exact closure label: `runtime_verified`
- Residual risk and owner: Hosted process supervision and asynchronous provider-specific close behavior
  remain CP-17 concerns; the local one-process boundary is verified and remains owned by the Game owner.
- Reopen trigger: Any regression that leaves the listener open after worker/store failure, admits a
  command after draining, or exceeds the accepted deadline.
