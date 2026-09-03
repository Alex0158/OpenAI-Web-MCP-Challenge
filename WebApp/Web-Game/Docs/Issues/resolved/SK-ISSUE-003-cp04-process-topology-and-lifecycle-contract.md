# SK-ISSUE-003: CP-04 Local Process Topology and Lifecycle Contract Conflict

## Issue Control

- Issue ID: `SK-ISSUE-003`
- State: `resolved`
- Priority: `P1`
- Type: architecture contradiction
- Owner: Game owner
- Next gate: Continue with CP-05 persistence under the roadmap. CP-04 runtime behavior was verified
  under [`SK-TASK-004`](../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md) and is recorded in
  [`SK-EVID-007`](../../Evidence/SK-EVID-007-cp04-process-runtime-verification.md).

## Problem

The CP-04 implementation boundary is not internally closed. The accepted historical G-MVP-17 baseline
in [`../../Validation/03-roadmap-gap-audit.md`](../../Validation/03-roadmap-gap-audit.md) and
[`../../Validation/04-mvp-decision-proposals.md`](../../Validation/04-mvp-decision-proposals.md) says to use
one modular Node process locally. The target stack and CP-04 wording in
[`../../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
and [`../../Engineering/08-development-roadmap-and-checkpoints.md`](../../Engineering/08-development-roadmap-and-checkpoints.md)
describe a Next.js page process and a Node.js world worker process without saying whether they are two
OS processes or two logical modules in one local process.

The pending [`../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md`](../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md)
then named a page process, a worker, and a Next.js health route, but did not name the single lifecycle
entrypoint or supervisor that starts them exactly once. A Next.js App Router route handler is
request-scoped and cannot safely own a singleton worker, especially under development reloads. The
task also lacks a normative health/readiness payload and status policy, required configuration fields,
the shutdown deadline, the package-manager lockfile, and a test-runner contract.

Even after choosing one OS process, a Next.js route bundle and the entrypoint can have different module
instances. A health adapter that imports a mutable runtime singleton from the page bundle could report
stale state, and a future command route could bypass the worker authority. The process-level health
adapter and future command gateway therefore need an explicit entrypoint boundary.

The owner accepted the ADR and the CP-04 cross-functional audit on 2026-09-02. The topology choice was
resolved for planning, CP-04 implementation proceeded under its released task, and its local runtime
evidence is recorded separately at task level.

The same choice must reserve the CP-08 WebSocket upgrade owner. A route handler alone cannot own a
long-lived upgrade; a one-process topology needs an explicit Node entrypoint that hands upgrades to
the realtime layer before the Next.js request handler, while a two-process topology needs an explicit
worker endpoint and page-to-worker health/reconnect contract. The CP-04 task currently names neither.

The verification mode is also material. `next dev` and hot-module reload can re-evaluate modules and
create duplicate timers or signal listeners, so a development-server green check cannot establish the
production-like singleton guarantee. CP-04 needs a build/start mode that exercises the selected
entrypoint and a separate test that calls startup twice.

## Impact

- CP-04 can produce a false healthy page while the worker is absent, start duplicate workers during
  reloads, or leave an orphan worker after shutdown.
- CP-05 persistence and CP-06 world-clock restart tests could exercise a different topology from the
  one used by CP-04, making `world_snapshot` recovery and downtime catch-up evidence misleading.
- CP-08 reconnect/degraded UI and CP-17 hosted health checks would have no shared definition of live,
  ready, degraded, or draining.
- CP-08 could later require a second unrecorded server or a transport workaround if CP-04 does not
  reserve WebSocket ownership at the process boundary.
- A bundled Next.js route could report stale health or mutate a private worker copy if the process
  boundary is represented only by a shared import rather than an explicit HTTP/gateway seam.
- A `next dev`-only check could pass while the release process leaks duplicate worker instances or
  never drains on `SIGTERM`.
- A missing required configuration rule makes the roadmap's malformed/missing-config acceptance
  untestable, while an unlocked dependency tree makes the Node 24/Next.js runtime result
  irreproducible.

## Evidence and falsifier

- Verified: G-MVP-17 is recorded as one modular Node process locally in both validation packs; the
  accepted target profile separately names a Next.js page and a Node.js worker; the earlier CP-04
  wording did not define their process relationship or entrypoint.
- Verified: the disposable CP-02 harness uses one Node process that serves the page and worker
  boundary, while the Next.js check was a separate availability smoke; neither proves the durable
  game's topology.
- Inferred: the contradiction is resolvable without changing game authority or the `SK-MVP-0.2`
  gameplay contract, but it must be decided before runtime code is written.
- Falsifier: an accepted ADR and reconciled CP-04 task can show one explicit local lifecycle, distinct
  liveness/readiness health semantics, configuration schema, shutdown path, and reproducible
  package/test command.

## Ownership and dependencies

- Owning decision and implementation boundary: [`../../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md),
  [`../../Engineering/08-development-roadmap-and-checkpoints.md`](../../Engineering/08-development-roadmap-and-checkpoints.md),
  and [`../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md`](../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md).
- Proposed decision and review: [`../../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
  and [`../../Validation/06-cp04-topology-and-cross-functional-audit.md`](../../Validation/06-cp04-topology-and-cross-functional-audit.md).
- Related architecture and operations: [`../../Engineering/02-system-architecture.md`](../../Engineering/02-system-architecture.md),
  [`../../Engineering/06-operations-and-hosting.md`](../../Engineering/06-operations-and-hosting.md),
  and [`../../Engineering/01-tech-stack.md`](../../Engineering/01-tech-stack.md).
- Related checkpoints: CP-04, CP-05, CP-06, CP-08, CP-12, CP-16, and CP-17.
- Resolved authority: [`ADR-GAME-0011`](../../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
  reconciles the historical one-process baseline with the page/worker target. CP-04 runtime evidence
  is recorded under [`SK-TASK-004`](../../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md).

## Recommended path and alternatives

- Selected: preserve the accepted minimal local posture by running the page application and the
  designated world-worker module under one explicit Node.js process entrypoint and one lifecycle
  supervisor. The worker remains the only future gameplay authority; CP-04 exposes separate process
  liveness/readiness signals, not world readiness. CP-17 may split the page and always-on worker for
  hosting only if measured or operational evidence requires it.
- Alternative: run two local processes with an explicit supervisor, worker health handshake, separate
  ports, startup ordering, drain timeout, and orphan cleanup. This aligns more literally with the
  page/worker wording but adds failure and test surface before persistence exists.
- Both paths must define a versioned health result, required versus defaulted config, `SIGTERM`/`SIGINT`
  behavior, unique operational process/worker instance identifiers that are not game identities,
  stdout/stderr redaction, no route-owned worker startup, a lockfile, generated-file policy, a
  reproducible Node 24 test command, and the CP-08 WebSocket upgrade owner.

## Plan and gates

- Next smallest action at resolution: reconcile the accepted ADR, CP-04 task, roadmap, current status,
  and cross-functional audit, then begin the released CP-04 runtime increment. That increment is now
  complete; CP-05 is the next action.
- Challenge or decision required: complete; the owner accepted the cross-checkpoint process boundary
  as `ADR-GAME-0011` before implementation.
- Stop or escalation condition: stop CP-04 if implementation contradicts the accepted entrypoint,
  process relationship, health status semantics, required configuration, shutdown deadline, or test
  command; reopen this issue or ADR before expanding the topology.
- Verification required for issue closure: Level 2 static cross-reference and owner acceptance. CP-04
  process-runtime evidence covering startup once, health/readiness and degraded/draining states,
  malformed/missing config, clean shutdown, unique instance reporting, log redaction, and the locked
  Node 24/Next.js command remains a separate task closure obligation.

## Resolution

- Change and remediation: Owner accepted `ADR-GAME-0011`; the affected task, roadmap, current status,
  engineering indexes, and audit are reconciled, and CP-04 is released.
- Evidence: Static acceptance and documentation verification are recorded in
  [`../../Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md`](../../Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md).
- Subsequent runtime verification: [`SK-EVID-007`](../../Evidence/SK-EVID-007-cp04-process-runtime-verification.md)
  records the local process result under the released task.
- Exact closure label: `resolved` for the planning contradiction; this issue label does not substitute
  for the separate CP-04 task runtime closure.
- Residual risk and owner: Game owner; runtime implementation may still reveal a framework, host, or
  event-loop constraint that reopens the topology decision.
- Reopen trigger: any change to the selected local/hosted topology, health contract, config schema,
  process manager, Node/Next.js version, or a runtime test that shows page and worker lifecycle state
  can diverge without a visible result.
