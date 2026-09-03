# SK-TASK-004: CP-04 Process Skeleton and Health

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-04`
- Owner: Game owner
- Current increment: CP-04 process skeleton, health, lifecycle, configuration, redacted logging, and the clean/timeout shutdown paths are verified in `SK-EVID-007`; the persistence-aware close rejection and listener-first ordering remediation are verified in CP-05 evidence and resolved issue [`SK-ISSUE-004`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md).
- Next gate: The CP-04 boundary is consumed by verified CP-05; the next implementation gate is the registered CP-06 clock/recovery task, with persistence and world-clock behavior kept as separate authorities.

## Identity

- Task ID: `SK-TASK-004`
- Date: `2026-09-02`
- Risk profile: `Assured`
- Reason for profile: Although the code is local and reversible, the process boundary, readiness
  semantics, shutdown behavior, and future WebSocket ownership affect CP-05, CP-06, CP-08, CP-12,
  CP-14, and CP-17 and therefore require an explicit cross-functional decision and runtime evidence.

## Objective

Create the first durable runtime boundary for Sleepless Kingdom so the page application and designated world-worker boundary can start exactly once, report an explicit process health state, reject invalid configuration, stop cleanly, and emit redacted structured lifecycle logs after the local topology is resolved.

## Success and non-goals

- Success: The resolved page/worker topology has one explicit startup and shutdown contract; repeated
  start requests cannot create a second worker or listener, and a stopped runtime cannot be reopened;
  the worker boundary exposes a versioned
  dynamic health/readiness result with a unique operational instance identifier; missing or malformed
  required configuration is rejected; `live` is distinct from `ready`, and `starting`, `degraded`, and
  `draining` are distinguishable; lifecycle logs contain no secrets or mutable repository traces; the
  focused CP-04 checks pass on Node.js 24.
- Success: The implementation remains compatible with the accepted `SK-MVP-0.2` authority boundary and leaves a clear process seam for CP-05 persistence without inventing gameplay behavior.
- Non-goals: world time, database schema, `world_snapshot`, Domain Events, outbox delivery, map generation, movement, pathfinding, missions, resources, combat, Canvas gameplay, WebMCP tools, Re-entry delivery, hosting, deployment, or visual polish.
- Non-goals: changes to `reentry-core/`, `mvp/`, RightSpot, shared dependencies, credentials, or the disposable CP-02 probe harness.

## Scope and authority

- In scope: the initial runtime files `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `src/server/config.ts`, `src/server/health.ts`, `src/server/logging.ts`, `src/server/runtime.ts`, `src/server/world-worker.ts`, `src/server/entrypoint.ts`, and `tests/cp04-process-skeleton.test.ts` under `WebApp/Web-Game/`. The process-level health handler is mounted by the entrypoint before the Next.js request handler; it is an adapter over the entrypoint-owned runtime registry and never owns lifecycle startup. `app/page.tsx` is an operational placeholder and remains replaceable by CP-12.
- In scope: the resolved local page/worker topology, typed environment/configuration validation with required and defaulted fields, a versioned health/readiness response, signal-safe shutdown with a bounded drain deadline, unique operational process/worker instance reporting that is separate from game identities, and redacted lifecycle logging to the process output stream.
- Out of scope: any file under [`../../../../reentry-core/`](../../../../reentry-core/), [`../../../../mvp/`](../../../../mvp/), RightSpot, or the disposable [`../../probe/cp02/`](../../probe/cp02/) harness.
- Allowed actions: read, edit, write, and run within `WebApp/Web-Game/`; this released task grants no
  stage, commit, push, deploy, credential, spend, or destructive authority.
- Revalidate when: the accepted `SK-MVP-0.2` contract, target stack, page/worker topology, health/config/shutdown contract, Node baseline, package lock, or parent task route changes.

## Owning authority

- Governing workflow: [`../00-Workflow/README.md`](../00-Workflow/README.md) and [`../00-Workflow/01-session-runbook.md`](../00-Workflow/01-session-runbook.md)
- Parent implementation route: [`SK-TASK-003`](SK-TASK-003-g1-g2-critical-path-implementation-lock.md)
- Roadmap and checkpoint authority: [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Runtime and MVP boundary: [`../Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md) and [`../Engineering/01-tech-stack.md`](../Engineering/01-tech-stack.md)
- System process boundary: [`../Engineering/02-system-architecture.md`](../Engineering/02-system-architecture.md)
- Normative contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Accepted process decision: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Cross-functional audit: [`../Validation/06-cp04-topology-and-cross-functional-audit.md`](../Validation/06-cp04-topology-and-cross-functional-audit.md)
- Governance and implementation authority: [`../Decisions/ADR-GAME-0008-development-governance-and-implementation-authority.md`](../Decisions/ADR-GAME-0008-development-governance-and-implementation-authority.md)
- Resolved cross-functional review: [`../Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md`](../Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md)

## Evidence status

### Verified

- CP-03 is verified as the parent G1/G2 implementation route and authorizes this child task.
- The target stack identifies Next.js App Router, React, TypeScript, Node.js 24, a long-running worker, health checks, and structured redacted logging as the intended foundation.
- The disposable CP-02 probe ran with Node.js `v24.13.1`; it is evidence only and is not the durable implementation target.
- The owner accepted the cross-functional CP-04 review's one local process with an explicit entrypoint,
  separate liveness/readiness semantics, and entrypoint-owned future upgrade dispatch on 2026-09-02.
- CP-04 process-runtime verification passed in [`SK-EVID-007`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md).

### Inferred for routing

- The page application and world-worker boundary use one explicit local lifecycle: one Node.js process
  with clear modules. A supervised two-process topology remains a future alternative only if CP-17 or
  measured runtime evidence reopens the decision.
- The file list and one-process boundary are the released implementation surface. The entrypoint,
  health coupling, required config, shutdown deadline, package lock, and test command remain runtime
  obligations of this task.

### Unknown

- Durable process startup, health/readiness behavior, malformed-config rejection, signal-safe shutdown,
  redacted logging, and the production-like build/start path are verified locally in `SK-EVID-007`.
- The selected local dependency tree is verified for this environment; the eventual hosted process
  manager may require a contract-preserving adjustment under CP-17.
- Next.js custom-server trade-offs and the pinned `tsx` runner are verified for the selected local path;
  hosted deployment compatibility remains open.

## Owner release

The owner accepted `ADR-GAME-0011` and the five CP-04 review items on 2026-09-02. The task was released
for the bounded implementation below. This release granted no commit, push, deploy, credential, or
destructive authority; runtime evidence was required and is recorded in `SK-EVID-007`.

## Accepted cross-functional boundary

The accepted boundary states the local process relationship and entrypoint, prevents route-request
worker duplication, defines health status and HTTP semantics for live/ready/degraded/draining states
(with `live` distinct from `ready`), lists required versus defaulted config, sets a shutdown drain
deadline, identifies WebSocket upgrade ownership for CP-08, and locks the package manager, lockfile,
test command, generated-file policy, and redacted output schema. The process-level health adapter
stays outside the Next.js bundle. CP-04 readiness describes process readiness only; it must not imply
a persisted world, an advancing `world_time`, or a valid `world_snapshot` before CP-05/CP-06.

## Smallest reversible action

Only the listed CP-04 runtime files and focused test were created. Process-runtime checks passed, and
the increment stopped before persistence or gameplay. If the process boundary needs a new authority
rule or an additional service, preserve the failure and reopen this task or its owning decision before
expanding scope.

## Verification and closure target

- Minimum verification: CP-04 process-runtime checks on Node.js 24 covering the selected build/start mode (not `next dev` only), startup exactly once including a repeated-start call, observable `live`/`ready`/`degraded`/`draining` health readback and HTTP status codes, dynamic no-store JSON behavior and method rejection, malformed or missing configuration, unique operational instance reporting across restart, bounded signal-safe shutdown, redacted output-stream assertions, package-lock reproducibility, and Node/Next.js syntax or type checks for the selected source.
- Evidence: [`SK-EVID-007`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md) records the fresh local process-runtime result.
- Closure target: `runtime_verified` only after fresh local runtime evidence and current-status synchronization; task registration alone is not closure evidence.
- Rollback or remediation: preserve the accepted docs and stop at the task boundary if checks fail;
  any later code rollback must use the exact authorized child change and must not clean unrelated work.
- Reopen trigger: a health or shutdown failure, a missing-config path that cannot be made visible, a need to move authority into the page, a dependency on unproven hosted sleep behavior, a required service split, or any change to the `SK-MVP-0.2` contract or parent route.

## Closure statement

CP-04 is `runtime_verified` for the local process skeleton, configuration, health, lifecycle,
operational IDs, redacted logging, and the exercised clean/timeout shutdown paths on Node.js
`v24.18.0`. The accepted one-process boundary remains the source of truth for CP-05 through CP-12;
persistence-aware close rejection and listener-first ordering are explicitly unverified and tracked in
`SK-ISSUE-004`. Persistence, world-clock continuity, realtime protocol, Agent delivery, hosted
supervision, and gameplay remain later gates.
