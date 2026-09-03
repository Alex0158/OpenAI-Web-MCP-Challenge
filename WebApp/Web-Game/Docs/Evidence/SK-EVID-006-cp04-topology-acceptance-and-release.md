# SK-EVID-006: CP-04 Topology Acceptance and Task Release

## Identity

- Evidence ID: `SK-EVID-006`
- Related task, issue, or decision: `SK-TASK-004`, `SK-ISSUE-003`, `ADR-GAME-0011`
- Evidence class: `contract`
- Ladder level: `2`
- Executor and date: `Codex primary session; owner acceptance recorded 2026-09-02`

## Exact identity under test

- Source state: working tree on `main` at `bd3d92aec10da38392845832694b4365f81387a5`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Python `3.14.6` for documentation checks; no CP-04 process runtime executed
- Fixture world and seed: not applicable; no world or runtime fixture was created
- Environment and configuration: local Sleepless Kingdom documentation root; no secrets or runtime configuration

## Objective and claim boundary

- Behavior under test: owner acceptance of the CP-04 one-process local topology, lifecycle/health contract,
  shutdown and reproducibility boundary, and release of the bounded child task
- Claim this evidence may support: the topology decision is accepted for planning; the issue is resolved
  for the planning contradiction; the CP-04 task is released for implementation; the affected records are
  reconciled and documentation gates pass
- Claims this evidence cannot support: a running server, worker startup, process health, shutdown behavior,
  persistence, world-clock continuity, WebSocket behavior, WebMCP discovery, Agent delivery, hosting, or
  gameplay correctness

## Preconditions and fixture

- Starting state: CP-03 parent implementation route verified; CP-04 child task held for owner inspection
- Synthetic identities and seeded actors: none
- Real, fake, and stubbed boundaries: documentation-only owner decision; no runtime boundary invoked

## Execution

- Replayable commands or procedure:
  - Record the owner's acceptance of the five CP-04 inspection items in `ADR-GAME-0011`.
  - Reconcile the ADR, issue, task, roadmap, current status, indexes, and cross-functional audit.
  - Run `python3 scripts/test_validate_game_docs.py`.
  - Run `python3 scripts/validate_game_docs.py --root . --report`.
  - Run `git diff --check -- WebApp/Web-Game`.
- Expected result: accepted records resolve the planning hold, the task is released, links and record
  shapes pass, and no runtime claim is introduced.
- Actual result: owner acceptance was recorded; `SK-ISSUE-003` moved to resolved for planning,
  `SK-TASK-004` moved to `in_progress`, and the documentation checks passed.
- Status: `pass`
- Output location: command output captured in the local session; no raw sensitive output retained

## Assertions

- Player-visible state: not applicable; CP-04 runtime has not started.
- Command and failure contract: the accepted entrypoint, health, degraded, draining, and recovery boundary
  is recorded in `ADR-GAME-0011`; runtime assertions remain in `SK-TASK-004`.
- Persistence, event, and outbox state: not run; intentionally owned by CP-05 and later.
- Exactly-once settlement after duplicate delivery and replay: not run; intentionally owned by CP-05,
  CP-06, CP-14, and CP-15.
- Ownership denial, stale revision, restart, and reconnect: not run; process restart and reconnect checks
  remain CP-04 through CP-16 evidence obligations.

## Analysis and closure

- Failure classification: none; static acceptance and documentation verification passed.
- Limitations and residual risk: implementation may still expose a Next.js custom-server incompatibility,
  event-loop pressure, or hosted topology requirement. Those conditions reopen the accepted ADR and audit.
- Invalidation triggers: a change to the local process relationship, lifecycle/health semantics, shutdown
  contract, Node.js or Next.js baseline, package runner, hosted authority boundary, or a runtime result that
  contradicts the accepted entrypoint.
- Exact conclusion: `ADR-GAME-0011` is accepted for CP-04 implementation, `SK-ISSUE-003` is resolved for
  the planning contradiction, and `SK-TASK-004` is released as the active CP-04 implementation task;
  CP-04 runtime evidence remains unverified.
