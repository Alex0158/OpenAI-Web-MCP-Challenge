# SK-TASK-049: CP-15 Contract, Race, and Failure Matrix Aggregate

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-15`
- Owner: Game owner
- Current increment: The fixed-order CP-15 aggregate runner and minimal Next internal-server shutdown fix are verified; V05–V12 and V15 pass from actual commands, V13/V14 remain gated, and V16 remains downstream not-run
- Next gate: CP-16 may consume this local matrix; the disposable-page adapter capability is recorded in SK-EVID-045, while canonical game-page WebMCP, external delivery, independent two-session, hosted, and judge claims remain separate gates

## Identity

- Task ID: `SK-TASK-049`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The task owns the first aggregate claim across persistence, world time, worker
  authority, identity, revisions, cargo, combat, projection, realtime, and process lifecycle. A
  false green row could upgrade a local fixture result into an unsupported WebMCP, Re-entry, hosted,
  or two-session claim.

## Objective

Own one deterministic CP-15 aggregate that maps the contract/race/failure matrix to executable local
checks and explicit gated outcomes. The aggregate must fail on a required local regression, preserve
the existing server/worker authority, and never count an unavailable capability, absent external
handoff, or downstream slice as a passing row.

## Success and non-goals

- Success: A named `test:cp15` command runs the selected CP-04 through CP-12 and isolated trace-support
  checks in a fixed order under Node 24, reporting the row or command that fails.
- Success: The result packet records V05–V12 as pass/fail from actual commands, V13's negative
  capability result separately from its unavailable positive invocation, V14's external handoff as
  gated, V15's matrix and evidence integrity, and V16 as downstream/not-run until CP-16 owns it.
- Success: The aggregate includes the relevant duplicate, stale, ownership, replay, restart, race,
  unsupported, and shutdown checks already owned by predecessor tasks; it does not invent a second
  clock, queue, state authority, or transport.
- Success: A redacted process smoke reads health, autonomous progression, anchor persistence, and
  coordinated `SIGTERM` shutdown from the actual entrypoint, including termination of the framework
  internal handle; a targeted sensitive-evidence scan has a recorded result.
- Non-goals: New gameplay behavior, balance changes, WebMCP implementation, Re-entry delivery,
  Receiver/Connector changes, two-session browser claims, hosted deployment, public identity,
  performance/load testing, or CP-16 slice closure.

## Scope and authority

- In scope: `scripts/run_cp15_matrix.mjs`, the `test:cp15` package script, the minimal
  `src/server/entrypoint.ts`/CP-04 lifecycle fix required by [`SK-ISSUE-005`](../Issues/resolved/SK-ISSUE-005-next-internal-server-shutdown.md), its focused regression, this task's evidence and cross-functional audit, and updates to the verification runbook, roadmap, current status, task and evidence indexes.
- Out of scope: gameplay behavior, `reentry-core/`, `mvp/`, RightSpot, external services, accepted
  ADR behavior, database schema, browser capability shims, and mutable runtime artifacts.
- Allowed actions: Add the aggregate runner and task-owned records, apply the issue's minimal
  entrypoint close lifecycle fix and focused regression, execute local Node/Python checks, use temporary
  file-backed databases, and update current English documentation. Do not stage, commit, push, deploy,
  use credentials, spend, or contact external parties.
- Revalidate when: Any predecessor contract, event/identity/settlement rule, phase order, WebMCP
  capability result, external handoff, test harness, runtime version, or evidence/redaction policy
  changes.

## Owning authority

- Checkpoint acceptance: [`CP-15 roadmap row`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Matrix and outcomes: [`CP-15 scenario fixtures`](../Scenarios/15-cp15-contract-race-verification-fixtures.md)
  and [`SK-TASK-015`](SK-TASK-015-cp15-contract-race-verification-preimplementation-pack.md)
- Execution discipline: [`Session Runbook`](../00-Workflow/01-session-runbook.md)
- Verification policy: [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)
- Cross-functional seams: [`CP-13 through CP-18 Seam Map`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
- Existing capability boundary: [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- Reusable support: [`SK-TASK-048`](SK-TASK-048-side-chat-cp15-cp16-deterministic-trace-support-toolkit.md)

## Evidence status before implementation

- Verified: CP-04 through CP-12 have named local focused evidence, including persistence, worker
  clock/phase order, fixture identity, movement/snapshot/realtime, mission/extraction/settlement,
  combat/reissue, browser projection/reconnect, and the explicit autonomous process path.
- Verified: The CP-13 probe records the unavailable adapter outcome. It does not prove positive
  page-bound WebMCP registration or invocation.
- Verified: Task048 provides a pure level-2 phase/event trace assertion helper and cannot mutate
  production state.
- Verified: The actual entrypoint reproduces a post-`runtime_stopped` framework handle; the issue is
  bounded to closing Next's own application lifecycle and does not require a new process authority.
- Open: CP-13 positive capability, CP-14 external delivery, genuine independent two-browser slice,
  hosted continuity, and judge reproduction. These must remain explicit gated/not-run outcomes.

## Smallest reversible action

Write the matrix runner's failing command/row contract first, implement only fixed-order command
orchestration and explicit status classification plus the issue's close hook, then run the narrow
local checks before the owned aggregate. Stop if a row needs a gameplay production change, a silent
skip, a hidden retry, a second authority, or an unaccepted cross-boundary contract.

## Verification and closure target

- Minimum verification: the new `test:cp15` aggregate under Node 24, `npm run typecheck`, both game
  documentation validators, the task-owned sensitive-evidence scan, and one actual entrypoint smoke
  with health/state/anchor/shutdown readback.
- Closure target: `runtime_verified` for the named local CP-15 aggregate and process boundary, with
  explicit gated/not-run rows for capability, external delivery, two-session, hosted, and CP-16
  claims. This task cannot close those later gates.
- Rollback or remediation: Remove only the task-owned runner/package-script and evidence references if
  the aggregate contract is rejected; preserve all predecessor runtime behavior and evidence.
- Reopen trigger: A required row is silently omitted or counted green without command evidence, a
  predecessor regression appears, a gated row becomes falsely passing, or the aggregate changes an
  accepted authority/identity/event/settlement boundary.

## Closure result

- The fixed-order runner is `npm run test:cp15`; it stops on a required local failure and supports
  `--only <row>` for narrow reproducer work. It records V05–V12 as executed local rows, V13/V14 as
  explicit gates, V15 as trace/type/docs/sensitive verification, and V16 as downstream not-run.
- The CP-04 lifecycle regression and [`SK-ISSUE-005`](../Issues/resolved/SK-ISSUE-005-next-internal-server-shutdown.md)
  are resolved. The direct entrypoint smoke exits with status `0` after health readiness, autonomous
  world progression, anchor persistence, and coordinated shutdown.
- Final local matrix evidence is [`SK-EVID-038`](../Evidence/SK-EVID-038-cp15-contract-race-failure-matrix-runtime-verification.md)
  with cross-functional disposition in [`Validation/60`](../Validation/60-cp15-contract-race-failure-matrix-runtime-cross-functional-audit.md).
