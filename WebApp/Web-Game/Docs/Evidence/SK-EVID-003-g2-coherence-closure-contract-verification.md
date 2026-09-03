# SK-EVID-003: G2 Coherence Closure Contract Verification

## Identity

- Evidence ID: `SK-EVID-003`
- Related task, issue, or decision: `SK-TASK-002`, `SK-ISSUE-002`, `ADR-GAME-0010`
- Evidence class: `contract`
- Ladder level: Level 2 for static contract and cross-reference verification
- Executor and date: Primary Codex session, 2026-09-02, Europe/London

## Exact identity under test

- Source state: repository branch `main`, `HEAD f49e1ca6051f9922cf37008df6ebe7ed264860da`, plus the
  uncommitted Sleepless Kingdom documentation and disposable probe files in the working tree.
- Contract version: `SK-MVP-0.2`; `SK-MVP-0.1` is retained only as the historical gameplay baseline.
- Runtime versions: Python `3.14.6` for the documentation checks; no game worker, browser, database,
  hosted service, or Agent adapter was executed.
- Fixture world and seed: None; no authoritative game state was created or mutated.
- Environment and configuration: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game/` on
  macOS, with the repository's documentation validator and its existing local configuration.

## Objective and claim boundary

- Behavior under test: static closure of B1-B4, D2, C1, and C2 in
  `Validation/05-pre-implementation-coherence-audit.md`, with the already accepted D1 delivery
  policy carried forward from `ADR-GAME-0009`.
- Claim this evidence may support: the normative contract, ADR-GAME-0010, affected mechanisms,
  chains, scenarios, engineering/design records, task, issue, and current status agree on the G2
  movement, sensing, state, anti-loop, protected-start, event, and snapshot rules; CP-03 is ready to
  lock its implementation scope.
- Claims this evidence cannot support: durable game implementation, seeded timing, combat correctness,
  restart or reconnect behavior, event-burst backpressure, WebMCP invocation, hosted continuity,
  production balance, or gameplay correctness.

## Preconditions and fixture

- Starting state: CP-02 disposable capability/runtime probe was verified; the historical `SK-MVP-0.1`
  gameplay baseline and the accepted `SK-MVP-0.2` Re-entry delivery decision were present; no durable
  game implementation exists.
- Synthetic identities and seeded actors: None; the fixture coordinates are contract examples only.
- Real, fake, and stubbed boundaries: Markdown files, relative links, language checks, task/issue
  lifecycle records, and targeted text assertions only. No world worker, event bus, outbox, Receiver,
  Connector, Thread, or page tool was exercised.

## Execution

- Documentation self-test:

  ```sh
  python3 scripts/test_validate_game_docs.py
  ```

  Actual result: `21/21` validator self-tests passed.

- Documentation validation:

  ```sh
  python3 scripts/validate_game_docs.py --root . --report
  ```

  Actual result: `PASS`; `Non-terminal tasks: 0 of 2`.

- Diff hygiene:

  ```sh
  git diff --check -- WebApp/Web-Game
  ```

  Actual result: `PASS`.

- Targeted static cross-reference procedure: search the complete `Docs/` tree for the canonical
  movement fields and values, inclusive Euclidean radii, the separate
  `soldier.lifecycle`/`mission.phase`/`encounter.status` model, `monster_reissue_budget` and its two
  typed review reasons, the fixed `start_world_time + 120` boundary and 14–20-tile fixture band,
  canonical event names and granularity, and the qualified `world_snapshot`/`client_snapshot`
  artifacts. Historical audit passages and explicit retired-name explanations were checked as the
  only permitted locations for the superseded aliases; no current G2 handler or phase uses them.
  Actual result: `PASS`; the owning documents point to the same `SK-MVP-0.2` definitions.

- Status: `pass` for static contract closure; `not-run` for runtime, hosted, capability, and gameplay
  behavior.

## Assertions

- Player-visible state: the contract defines the player-scoped `client_snapshot`, visibility/fog and
  sensing radii, mission and encounter status, protection expiry, dashboard history, and typed action
  results without exposing hidden world state.
- Command and failure contract: typed commands carry expected revisions and idempotency keys;
  `force_recall_soldier` returns `STALE_REENTRY_CONTEXT`, `ALREADY_AT_SHELTER`, or another explicit
  result when the live state has advanced.
- Persistence, event, and outbox state: `world_snapshot` is the durable restart row; Domain Events
  retain causal history and `world_event_cursor`; eligible Agent Signals are derived and coalesced
  under the one pending/in-flight per-shelter/Thread policy.
- Exactly-once settlement after duplicate delivery and replay: the documents require event, signal,
  command, and entity-revision identity to make effects idempotent; this static record does not execute
  a duplicate or replay case.
- Ownership denial, stale revision, restart, and reconnect: server authority, typed stale results,
  durable restart state, and full client resync are specified; no runtime path was exercised.

## Analysis and closure

- Failure classification: none in the static checks.
- Limitations and residual risk: the seeded route must still prove movement and encounter timing; the
  implementation must test boundary equality, danger-cell avoidance, duplicate settlement, restart,
  reconnect, signal coalescing, active-Thread backpressure, and late commands at CP-04 through CP-16.
  The external Agent-adapter limitation remains the separate `SK-ISSUE-001` gate for CP-13/CP-14.
- Invalidation triggers: any change to `SK-MVP-0.2`, ADR-GAME-0010, the affected state/event/snapshot
  authority, persistence schema, due-work order, validator, or fixture assumptions.
- Exact conclusion: the G2 contract coherence closure is statically verified; B1-B4, D2, C1, and C2
  are closed and CP-03 may lock the durable implementation task. This record makes no runtime or
  hosted implementation claim.
