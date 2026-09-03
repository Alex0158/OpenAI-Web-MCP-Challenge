# SK-EVID-002: Re-entry Delivery Policy Contract Verification

## Identity

- Evidence ID: `SK-EVID-002`
- Related task, issue, or decision: `SK-TASK-002`, `SK-ISSUE-002`, `ADR-GAME-0009`
- Evidence class: `contract`
- Ladder level: Level 2 for the documented contract and cross-reference surface
- Executor and date: Primary Codex session, 2026-09-02, Europe/London

## Exact identity under test

- Source state: branch `main`, `HEAD adfd37e`, plus the uncommitted game documentation changes in the
  working tree.
- Contract version: `SK-MVP-0.2` Re-entry delivery revision; `SK-MVP-0.1` remains the historical
  gameplay baseline.
- Runtime versions: No game runtime or hosted service executed for this evidence.
- Fixture world and seed: None; no authoritative game state was created or mutated.
- Environment and configuration: Sleepless Kingdom documentation tree under `WebApp/Web-Game/`.

## Objective and claim boundary

- Behavior under test: the owner-accepted real-time Re-entry delivery policy, Domain Event versus
  Agent Signal distinction, event aggregation, Cloud Receiver and Local Connector backpressure, active
  Codex Thread handling, and typed late-action outcomes.
- Claim this evidence may support: the affected documentation, ADR, contract revision, task/issue
  disposition, mechanism, chain, scenario, engineering, design, and status records agree on the
  intended policy and its non-goals.
- Claims this evidence cannot support: implementation, event-burst runtime behavior, actual Receiver
  delivery, Codex Thread scheduling, WebMCP invocation, hosted continuity, or gameplay correctness.

## Preconditions and fixture

- Starting state: the accepted `SK-MVP-0.1` gameplay baseline and the D1 timing finding were present;
  no durable game implementation exists.
- Synthetic identities and seeded actors: none.
- Real, fake, and stubbed boundaries: static documentation and repository validator only; no event
  bus, Receiver, Connector, Thread, or game worker was exercised.

## Execution

- Documentation self-test:

  ```sh
  python3 scripts/test_validate_game_docs.py
  ```

  Actual result: `21/21` tests passed.

- Documentation validation:

  ```sh
  python3 scripts/validate_game_docs.py --root . --report
  ```

  Actual result: `PASS`. One non-terminal task remains (`SK-TASK-002`), as expected while B1-B4, D2,
  C1, and C2 remain open.

- Diff hygiene:

  ```sh
  git diff --check -- WebApp/Web-Game
  ```

  Actual result: `PASS`.

- Status: `pass` for static contract and documentation checks; `not-run` for runtime delivery.

## Assertions

- Player-visible state: the dashboard and Agent panel requirements describe event counts, cursor
  range, severity, delivery state, coalescing, and typed late-action results.
- Command and failure contract: the current contract names `STALE_REENTRY_CONTEXT` and
  `ALREADY_AT_SHELTER` and requires current revisions for Agent-originated recall.
- Persistence, event, and outbox state: Domain Events remain durable and carry an ordered
  `world_event_cursor`; Agent Signals are derived delivery envelopes; the policy records cursor/count
  context and one outgoing signal per bound shelter/Thread.
- Exactly-once settlement after duplicate delivery and replay: the policy requires signal identity
  reuse and preserves the existing event/idempotency guarantees; no runtime settlement was exercised.
- Ownership denial, stale revision, restart, and reconnect: the contract retains server authority and
  typed stale results; no runtime path was exercised by this evidence.

## Analysis and closure

- Failure classification: none in the static checks.
- Limitations and residual risk: burst aggregation, active-Thread backpressure, deferred-cursor
  handling, and late command results remain implementation verification obligations at CP-05, CP-14,
  and CP-15. The current external Agent adapter limitation remains tracked separately in `SK-ISSUE-001`.
- Invalidation triggers: changes to `ADR-GAME-0009`, `SK-MVP-0.2`, the affected mechanism/chain,
  task/issue disposition, or the documentation validators.
- Exact conclusion: the real-time coalesced Re-entry delivery policy is contract-recorded and
  documentation-verified. It introduces no gameplay wait and does not yet prove runtime delivery or
  Thread backpressure.
