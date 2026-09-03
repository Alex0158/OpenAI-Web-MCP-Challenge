# Game Decisions

This index owns durable choices made for the game child application. A decision here must state its
scope, alternatives, consequences, and reopen triggers. Exploratory ideas remain in Blueprint,
Research, or a Scenario until accepted.

- [`ADR-GAME-0001-documentation-authority-and-initial-baseline.md`](ADR-GAME-0001-documentation-authority-and-initial-baseline.md)
  — modular documentation structure and source/reference separation;
- [`ADR-GAME-0002-continuous-world-and-mission-authority.md`](ADR-GAME-0002-continuous-world-and-mission-authority.md)
  — persistent world, server authority, role-locked missions, cargo, death, migration, and breach;
- [`ADR-GAME-0003-combat-formula-co-design-boundary.md`](ADR-GAME-0003-combat-formula-co-design-boundary.md)
  — keeps combat variables explicit while leaving final numbers open;
- [`ADR-GAME-0004-mechanism-capability-and-chain-decomposition.md`](ADR-GAME-0004-mechanism-capability-and-chain-decomposition.md)
  — separates atomic mechanisms, player capabilities, and cross-mechanism logic chains.
- [`ADR-GAME-0005-mvp-world-and-rendering-profile.md`](ADR-GAME-0005-mvp-world-and-rendering-profile.md)
  — fixes the two-player MVP map/resource profile and a smooth minimal 2D presentation target;
- [`ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
  — accepts the versioned G2 contract, protected start, deterministic combat, and bounded Re-entry action;
- [`ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
  — accepts a readable MVP visual bar, stable asset vocabulary, placeholders, and parallel art delivery;
- [`ADR-GAME-0008-development-governance-and-implementation-authority.md`](ADR-GAME-0008-development-governance-and-implementation-authority.md)
  — accepts scoped self-governance, the workflow and evidence layers, the mechanical gate, and the CP-02-gated implementation authority.
- [`ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
  — separates authoritative Domain Events from coalesced Agent Signals and prevents high-frequency events from flooding a Codex Thread without pausing the world;
- [`ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
  — closes the G2 movement, sensing, mission-state, anti-loop, protected-start, event-vocabulary, and snapshot-vocabulary contract.
- [`ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
  — accepts the one-process local page/worker entrypoint, liveness/readiness contract, shutdown
  boundary, WebSocket ownership seam, and reproducible CP-04 verification; runtime implementation
  is locally verified while hosted/world behavior remains unverified.
- [`ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
  — fixes integer authoritative `world_time`, projection-only sub-second interpolation, and the
  bounded five-minute CP-06 recovery outcome.
- [`ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)
  — keeps player position and exploration in the existing aggregate, adds the transactional schema
  v1-to-v2 migration, and bounds the first movement proof to adjacent logical tiles.
- [`ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
- [`ADR-GAME-0015-cp08-worker-command-read-gateway.md`](ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- [`ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)
- [`ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)
  — binds the CP-04 upgrade owner to one `ws` no-server adapter, a server-owned session resolver, and
  explicit unsupported/degraded lifecycle behavior;
- [`ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md)
  — binds the first durable GATHERER assignment to one schema-v3 transaction, deterministic fixture
  route plan, stable mission attempt, and typed field role lock;
- [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md)
  — binds route transit to durable world time and one atomic `MissionWorking` arrival without a new
  schema or event vocabulary.
- [`ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](ADR-GAME-0020-cp10-first-extraction-and-cargo.md)
  — binds the first post-arrival Wood/Rock extraction to schema-v4 cargo provenance and one atomic
  node/cargo/event boundary without premature return or coin settlement.
- [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md)
  — binds recurring two-second extraction to the existing cargo stack and the atomic capacity/node
  depletion handoff to `RETURNING`, while deferring return movement and settlement.
- [`ADR-GAME-0022-cp10-contested-node-outcome.md`](ADR-GAME-0022-cp10-contested-node-outcome.md)
  — binds same-worker same-node due work to deterministic attempt ordering and an atomic
  `TARGET_DEPLETED` loser return without introducing a reservation schema.
- [`ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)
  — binds automatic return to the immutable route, exact home-anchor arrival, and a separate
  `DEPOSITING` handoff without teleport or premature settlement.
- [`ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)
  — binds validated Wood/Rock cargo to one atomic shelter settlement, resident release, ordered
  exactly-once events, and inactive mission-row reuse without a schema change.
- [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md)
  — binds the first seeded-monster GATHERER encounter to structured durable rounds, cargo loss, and
  same-identity respawn while deferring Hunter and automatic reissue.
- [`ADR-GAME-0026-cp11-hunter-victory-and-return.md`](ADR-GAME-0026-cp11-hunter-victory-and-return.md)
  — binds seeded HUNTER dispatch, typed five-round victory, monster deactivation, and route-preserving
  zero-cargo return without changing the contract or schema version.
- [`ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md`](ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md)
  — binds the schema-v6, same-transaction automatic reissue, deterministic danger-cell route policy,
  and typed anti-loop review outcomes while preserving the G2 contract version.
- [`ADR-GAME-0028-cp12-client-projection-read-model.md`](ADR-GAME-0028-cp12-client-projection-read-model.md)
  — binds the additive server-owned `client_snapshot` read model and the projection-only Canvas/
  accessible dashboard boundary for CP-12.
- [`ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
  — accepts the explicit non-production fixture session boundary for the first page-bound realtime
  frame and its server-derived scope.
- [`ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md`](ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
  — binds one non-repeat keyboard action to a strict-session typed HTTP move and the existing
  WebSocket full-resync projection without a browser clock or default scheduler.
- [`ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md`](ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md)
  — binds one strict-session ordinary-UI GATHERER command, distinct command/idempotency identity,
  durable privacy-preserving results, and full-snapshot-only mission reconciliation; the named local
  runtime path is verified without a scheduler or WebMCP fallback.
- [`ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md`](ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)
  — binds the schema-v7 boundary-journal predecessor carried into schema v8, whole-boundary replay,
  one shared G2 gameplay coordinator, and explicit no-op settlement/timer phases for the named local
  explicit-advance scope.
- [`ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md`](ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)
  — accepted and runtime-verified boundary for one monotonic live driver, one persisted restart anchor,
  bounded catch-up, explicit host opt-in, and serialized drain at the named local scope.
- [`ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md`](ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md)
  — accepts one entrypoint-owned, bounded full-snapshot publisher after explicit local worker progress;
  it preserves the existing FIFO, sequence, scope, projection, and lifecycle boundaries.
- [`ADR-GAME-0035-cp12-snapshot-gated-held-movement.md`](ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)
  — accepts a client-only snapshot-gated held keyboard/pointer presentation layer over the existing
  discrete movement command, with a 180 ms floor, one in-flight request, and explicit lifecycle stops.
- [`ADR-GAME-0036-cp12-server-owned-continuous-intent.md`](ADR-GAME-0036-cp12-server-owned-continuous-intent.md)
  — accepts one-shot WebSocket start/stop commands for the existing worker cadence, opaque
  connection-bound ownership, newer-session supersession, synchronous close safety, and full-snapshot-only
  rendering; the named local implementation is runtime-verified under SK-TASK-057, SK-EVID-043, and
  Validation/71.
- [`ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md`](ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
  — accepts one Railway service, one replica, one persistent Volume-backed SQLite writer, and Clerk
  fixed-player admission for the first hosted MVP; the resource provisioning preflight is recorded,
  while source deployment, Clerk admission, and hosted proof remain open.
