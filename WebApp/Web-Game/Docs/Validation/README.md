# Validation

This module records concept coherence checks now and implementation proof obligations later. It does
not claim that the game is built or balanced.

- [`01-discussion-coverage-audit.md`](01-discussion-coverage-audit.md) — source-to-canonical coverage,
  owner overrides, promoted working decisions, and remaining gates.
- [`02-mechanism-boundary-and-chain-audit.md`](02-mechanism-boundary-and-chain-audit.md) — atomic
  mechanism, player capability, logic-chain coverage, cross-boundary findings, and decision gates.
- [`03-roadmap-gap-audit.md`](03-roadmap-gap-audit.md) — roadmap-driven MVP decisions, edge cases,
  full-game gates, and the next design order.
- [`04-mvp-decision-proposals.md`](04-mvp-decision-proposals.md) — owner-accepted defaults, chain
  contracts, UX acceptance, and contract revision checklist.
- [`05-pre-implementation-coherence-audit.md`](05-pre-implementation-coherence-audit.md) — cross-document
  logic and chain review with the accepted `SK-MVP-0.2` dispositions that close the CP-03 planning gate;
  CP-03 task-lock evidence is recorded separately in `../Evidence/`.
- [`06-cp04-topology-and-cross-functional-audit.md`](06-cp04-topology-and-cross-functional-audit.md) —
  CP-04 process topology, liveness/readiness, lifecycle, WebSocket ownership, and cross-checkpoint
  review; owner acceptance is recorded and local runtime verification is linked from the audit.
- [`07-cp05-persistence-cross-functional-audit.md`](07-cp05-persistence-cross-functional-audit.md) —
  CP-05 persistence, event cursor, snapshot recovery, idempotency, outbox backpressure, lifecycle,
  and cross-checkpoint task-coherence review; runtime verification remains pending.
- [`08-cp06-cp07-preimplementation-audit.md`](08-cp06-cp07-preimplementation-audit.md) — CP-06 clock/recovery
  and CP-07 deterministic-world preparation, dependency gates, fixture targets, and cross-module
  invariants; runtime implementation remains pending.
- [09-cp08-cp09-preimplementation-audit.md](09-cp08-cp09-preimplementation-audit.md) — CP-08 movement,
  visibility, route, snapshot, reconnect, mission, role-lock, return, and cross-checkpoint preparation;
  runtime implementation remains pending.
- [10-cp10-cp18-preimplementation-audit.md](10-cp10-cp18-preimplementation-audit.md) — CP-10 through CP-18 economy, combat, presentation, page capability, Re-entry adapter, aggregate verification, local slice, hosted continuity, and judge preparation; runtime implementation remains pending.
- [11-cp19-cp26-post-g2-preflight.md](11-cp19-cp26-post-g2-preflight.md) — CP-19 through CP-26 post-G2 expansion preflight, dependency gates, cross-functional risks, and open decisions; no expansion contract or implementation is authorized.
- [`12-cp05-cp19-tiered-audit.md`](12-cp05-cp19-tiered-audit.md) — tiered independent review:
  deep audit of CP-05/CP-06/CP-07 including running code and tests, a structural pass over
  CP-08 to CP-19, and the deferred Tier 3 scope.
- [`13-cp06-clock-runtime-cross-functional-audit.md`](13-cp06-clock-runtime-cross-functional-audit.md) — CP-06 implementation review across the clock, persistence, worker lifecycle, recovery boundary, and later scheduler handoffs; local clock/recovery closure is bounded and gameplay integration remains open.
- [`14-cp07-world-fixture-runtime-cross-functional-audit.md`](14-cp07-world-fixture-runtime-cross-functional-audit.md) — CP-07 implementation review across deterministic generation, geometry, identity, reset/restart persistence, the resolved route overlap wording, and later movement/gameplay handoffs; local fixture closure is bounded.
- [`15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](15-cp08-movement-snapshot-runtime-cross-functional-audit.md) — CP-08 first increment review across player authority, schema migration, movement retries, scoped snapshots, visibility, and handoffs; continuous cadence and realtime transport remain open.
- [`16-cp08-worker-cadence-runtime-cross-functional-audit.md`](16-cp08-worker-cadence-runtime-cross-functional-audit.md) — CP-08 worker cadence review across fixed-step ordering, intent identity, process-local accumulation, persistence/restart, typed failures, and remaining transport/visibility handoffs.
- [`17-cp08-worker-gateway-runtime-cross-functional-audit.md`](17-cp08-worker-gateway-runtime-cross-functional-audit.md) — CP-08 worker gateway review across FIFO command/read/clock ordering, input capture, lifecycle closure, domain delegation, and transport handoffs.
- [`18-cp08-realtime-snapshot-runtime-cross-functional-audit.md`](18-cp08-realtime-snapshot-runtime-cross-functional-audit.md) — CP-08 realtime snapshot review across server-bound scope, full replacement/resync, sequence validation, browser projection, lifecycle failure, and the remaining HTTP/wire handoff.
- [`19-cp08-entrypoint-wire-preimplementation-challenge.md`](19-cp08-entrypoint-wire-preimplementation-challenge.md) — CP-08 capability probe, identity boundary, wire alternatives, and the accepted entrypoint adapter path.
- [`20-cp08-realtime-wire-runtime-cross-functional-audit.md`](20-cp08-realtime-wire-runtime-cross-functional-audit.md) — CP-08 local wire runtime review across upgrade ownership, server-resolved identity, protocol/payload rejection, gateway ordering, lifecycle races, and residual browser/production/hosted gates.
- [`21-cp09-gatherer-dispatch-preimplementation-challenge.md`](21-cp09-gatherer-dispatch-preimplementation-challenge.md) — CP-09 dispatch preparation across schema migration, mission identity, role/loadout lock, route authority, transaction ordering, and the extraction/return handoff.
- [`22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md`](22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md) — CP-09 bounded dispatch runtime review across migration, identity, ownership, route planning, role lock, atomic state/event/idempotency ordering, and later mission handoffs.
- [`23-cp09-route-milestone-preimplementation-challenge.md`](23-cp09-route-milestone-preimplementation-challenge.md) — CP-09 route transit and arrival challenge across derived position, due-work ordering, restart, event granularity, and extraction handoff.
- [`24-cp09-route-milestone-runtime-cross-functional-audit.md`](24-cp09-route-milestone-runtime-cross-functional-audit.md) — CP-09 route-arrival runtime review across due-marker migration, clock ordering, derived transit, atomic event state, restart recovery, and CP-10 handoff.
- [`25-cp10-first-extraction-preimplementation-challenge.md`](25-cp10-first-extraction-preimplementation-challenge.md) — CP-10 first extraction challenge across cargo provenance, due-work ordering, node/cargo atomicity, revisions, idempotency, and the return/deposit handoff.
- [`26-cp10-first-extraction-runtime-cross-functional-audit.md`](26-cp10-first-extraction-runtime-cross-functional-audit.md) — CP-10 first extraction runtime review across identity, role/tool authority, due-work ordering, migration, atomic cargo, event/idempotency, rollback, restart, and deferred scheduler/UI/WebMCP boundaries.
- [`27-cp10-extraction-cadence-and-return-preimplementation-challenge.md`](27-cp10-extraction-cadence-and-return-preimplementation-challenge.md) — CP-10 recurring cadence challenge across cargo-stack aggregation, due-marker progression, capacity/depletion stop conditions, node timers, and the return/deposit handoff.
- [`28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](28-cp10-extraction-cadence-runtime-cross-functional-audit.md) — CP-10 recurring cadence runtime review across stack aggregation, due order, capacity/depletion handoff, event exactness, rollback/restart, contest limits, and deferred return/settlement boundaries.
- [`29-cp10-contested-node-preimplementation-challenge.md`](29-cp10-contested-node-preimplementation-challenge.md) — CP-10 same-node contest challenge across deterministic due order, loser return, node/cargo ownership, event/idempotency, clock continuation, and the deferred multi-worker boundary.
- [`30-cp10-contested-node-runtime-cross-functional-audit.md`](30-cp10-contested-node-runtime-cross-functional-audit.md) — CP-10 same-worker contest runtime review across winner/loser ordering, pre-empty target recovery, cargo preservation, event exactness, restart, clock continuation, and deferred return/hosting boundaries.
- [`31-cp10-return-navigation-preimplementation-challenge.md`](31-cp10-return-navigation-preimplementation-challenge.md) — CP-10 return-navigation challenge across immutable route reversal, derived due work, exact home crossing, phase isolation, and settlement handoff.
- [`32-cp10-return-navigation-runtime-cross-functional-audit.md`](32-cp10-return-navigation-runtime-cross-functional-audit.md) — CP-10 return-navigation runtime review across reverse-route authority, exact home crossing, phase/cargo isolation, event idempotency, rollback, restart recovery, and the deferred deposit handoff.
- [`33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md) — CP-10 settlement challenge across cargo provenance, wallet credit, resident release, exactly-once events, restart, and post-deposit dispatch reuse.
- [`34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](34-cp10-deposit-settlement-runtime-cross-functional-audit.md) — CP-10 settlement runtime review across cargo provenance, wallet credit, resident release, event order/idempotency, rollback, restart, dispatch compatibility, and deferred scheduler/UI/WebMCP/Re-entry boundaries.
- [`35-cp11-gatherer-combat-preimplementation-challenge.md`](35-cp11-gatherer-combat-preimplementation-challenge.md) — CP-11 first combat increment challenge across seeded contact, structured encounter persistence, deterministic rounds, extraction blocking, cargo loss, and same-identity respawn.
- [`36-cp11-gatherer-combat-runtime-cross-functional-audit.md`](36-cp11-gatherer-combat-runtime-cross-functional-audit.md) — CP-11 local runtime review across contact ordering, structured encounter persistence, deterministic combat, extraction blocking, cargo loss, same-identity respawn, rollback, restart, economy, and deferred UI/WebMCP/Re-entry boundaries.
- [`37-cp11-hunter-victory-preimplementation-challenge.md`](37-cp11-hunter-victory-preimplementation-challenge.md) — CP-11 HUNTER dispatch, typed victory, monster deactivation, route-preserving return, zero-cargo settlement, and cross-functional implementation challenge.
- [`38-cp11-hunter-victory-runtime-cross-functional-audit.md`](38-cp11-hunter-victory-runtime-cross-functional-audit.md) — CP-11 local runtime review across HUNTER dispatch, target reservation, deterministic victory, monster deactivation, return navigation, zero-cargo settlement, restart, and deferred UI/WebMCP/Re-entry boundaries.
- [`39-cp11-danger-cell-reissue-preimplementation-challenge.md`](39-cp11-danger-cell-reissue-preimplementation-challenge.md) — CP-11 automatic reissue challenge across schema migration, same-transaction death/reissue, deterministic danger-cell routing, fixed-fixture no-route behavior, review stops, reset semantics, and cross-functional handoffs.
- [`40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md`](40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md) — CP-11 local runtime review across migration, same-transaction death/reissue, deterministic danger-cell routing, fixed-fixture no-route behavior, repeated-death review, reset semantics, and cross-functional handoffs.
- [`41-cp12-client-projection-preimplementation-challenge.md`](41-cp12-client-projection-preimplementation-challenge.md) — CP-12 client projection, visibility/privacy, route-derived position, deterministic Canvas, accessible mission row, and explicit degraded-state implementation challenge.
- [`42-cp12-client-projection-runtime-cross-functional-audit.md`](42-cp12-client-projection-runtime-cross-functional-audit.md) — CP-12 local projection/renderer runtime audit across snapshot authority, privacy, lifecycle, geometry, accessibility, and remaining live-page gates.
- [`43-cp12-local-fixture-session-preimplementation-challenge.md`](43-cp12-local-fixture-session-preimplementation-challenge.md) — CP-12 local fixture session/bootstrap options, identity and process boundaries, first-frame lifecycle, production gating, and owner decision.
- [`44-cp12-original-svg-ui-icon-runtime-cross-functional-audit.md`](44-cp12-original-svg-ui-icon-runtime-cross-functional-audit.md) — CP-12 inline SVG UI icon registry and dashboard consumer review across visual vocabulary, projection authority, accessibility, degraded states, fallback, performance, and untouched session/agent boundaries.
- [`45-cp12-local-fixture-session-runtime-cross-functional-audit.md`](45-cp12-local-fixture-session-runtime-cross-functional-audit.md) — CP-12 local fixture bootstrap, shared store/worker/gateway, server-derived session scope, first-frame binding, page composition, readiness/failure states, and explicit local-only claim limits.
- [`46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md`](46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md) — CP-12 canonical page hydration, scoped first-frame browser readback, human fallback, and two-session isolation challenge.
- [`47-cp12-browser-hydration-runtime-cross-functional-audit.md`](47-cp12-browser-hydration-runtime-cross-functional-audit.md) — CP-12 one-browser-context hydration, server scope, semantic/Canvas readback, Node 24 runtime identity, and explicit two-session evidence limit.
- [`48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md`](48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md) — CP-12 two-tab lifecycle observation, shared-surface limitation, and explicit level-5 claim boundary.
- [`49-cp14-cp16-preparation-cross-functional-audit.md`](49-cp14-cp16-preparation-cross-functional-audit.md) — CP-14 delivery handoff, CP-15 contract/race matrix, and CP-16 local vertical-slice runbook preparation; runtime and external integration remain gated.
- [`50-cp12-browser-reconnect-runtime-cross-functional-audit.md`](50-cp12-browser-reconnect-runtime-cross-functional-audit.md) — CP-12 explicit manual reconnect, attempt ownership, scope-safe stale retention, prompt failure/retry, process restart, and residual no-settle deadline boundary.
- [`51-cp17-cp18-preparation-cross-functional-audit.md`](51-cp17-cp18-preparation-cross-functional-audit.md) — CP-17 host-neutral continuity and CP-18 clean-identity reviewer preparation, artifact claims, and hosted/judge gates.
- [`52-cp12-keyboard-movement-preimplementation-challenge.md`](52-cp12-keyboard-movement-preimplementation-challenge.md) — CP-12 discrete keyboard movement challenge across strict fixture command identity, typed HTTP admission, gateway ordering, focus/repeat policy, and WebSocket authoritative reconciliation.
- [`53-cp12-keyboard-movement-runtime-cross-functional-audit.md`](53-cp12-keyboard-movement-runtime-cross-functional-audit.md) — CP-12 local discrete keyboard/button movement runtime review across focus/accessibility, strict session, command identity, stale-before-collision, worker ordering, full-snapshot reconciliation, persistence, restart, and shutdown.
- [`54-cp12-human-gatherer-dispatch-preimplementation-challenge.md`](54-cp12-human-gatherer-dispatch-preimplementation-challenge.md) — CP-12 ordinary-UI GATHERER dispatch challenge across mission authority, distinct command/idempotency identity, strict local HTTP admission, gateway ordering, and authoritative full-snapshot reconciliation.
- [`55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md`](55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md) — CP-12 local ordinary-UI GATHERER dispatch runtime review across strict session/privacy, command identity, durable rejection, shared admission, gateway ordering, authoritative reconciliation, accessibility, restart, and forbidden downstream effects.
- [`56-cp06-gameplay-phase-coordinator-preimplementation-challenge.md`](56-cp06-gameplay-phase-coordinator-preimplementation-challenge.md) — CP-06 boundary-journal and gameplay-coordinator challenge across partial-boundary replay, phase ownership/order, service identity, target exhaustion, and deferred autonomous time.
- [`57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md`](57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md) — CP-06 local runtime review across schema migration, whole-boundary replay, fixed phase order, shared worker graph, pre-empty target liveness, and explicit scheduler limits.
- [`58-cp06-trusted-elapsed-time-and-autonomous-scheduler-preimplementation-challenge.md`](58-cp06-trusted-elapsed-time-and-autonomous-scheduler-preimplementation-challenge.md) — CP-06 trusted elapsed-time and one-shot autonomous scheduler challenge across restart anchoring, bounded catch-up, overlap, drain, and deferred timer reducers.
- [`59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md`](59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md) — CP-06 runtime review across schema-v8 anchoring, startup recovery, monotonic scheduling, worker health, drain/fault handling, and downstream isolation.
- [`60-cp15-contract-race-failure-matrix-runtime-cross-functional-audit.md`](60-cp15-contract-race-failure-matrix-runtime-cross-functional-audit.md) — CP-15 local aggregate review across predecessor contracts, races, explicit capability/external gates, evidence integrity, and entrypoint termination.
- [`61-cp16-local-causal-slice-runtime-cross-functional-audit.md`](61-cp16-local-causal-slice-runtime-cross-functional-audit.md) — CP-16 pre-Agent local causal slice review across combat loss, atomic signal eligibility, rollback, replay, no-grant silence, and scoped privacy; full G2 remains gated.
- [`62-cp12-autonomous-realtime-snapshot-publication-preimplementation-challenge.md`](62-cp12-autonomous-realtime-snapshot-publication-preimplementation-challenge.md) — CP-12 pre-implementation challenge for worker-progress publication, full-frame coalescing, sequence/scope safety, and lifecycle/backpressure boundaries.
- [`63-cp12-autonomous-realtime-snapshot-publication-runtime-cross-functional-audit.md`](63-cp12-autonomous-realtime-snapshot-publication-runtime-cross-functional-audit.md) — CP-12 runtime review for automatic full-snapshot publication, connect/resync races, single-pump backpressure, wire failure visibility, scope privacy, and clean drain.
- [`64-cp13-page-tool-contract-preimplementation-challenge.md`](64-cp13-page-tool-contract-preimplementation-challenge.md) — accepted CP-13 minimum page-tool and schema package covering server-derived scope, bounded history, the runtime-verified recall authority, typed failures, registration/readback, and the owner/adapter gates; page runtime remains open.
- [`65-cp12-held-movement-preimplementation-challenge.md`](65-cp12-held-movement-preimplementation-challenge.md) — accepted CP-12 snapshot-gated held-input proposal covering timing, authoritative settle, keyboard/pointer lifecycle, accessibility, and explicit non-goals.
- [`66-cp12-held-movement-runtime-cross-functional-audit.md`](66-cp12-held-movement-runtime-cross-functional-audit.md) — CP-12 runtime review across client timing, movement/page gates, unknown recovery, keyboard focus, pointer/touch capture, generated-click handling, lifecycle cleanup, and residual server/hosted/WebMCP/Re-entry boundaries.
- [`67-cp12-server-owned-continuous-intent-preimplementation-challenge.md`](67-cp12-server-owned-continuous-intent-preimplementation-challenge.md) — accepted CP-12 server-owned continuous movement intent boundary across worker cadence, one-shot WebSocket transport, connection ownership, close/drain safety, revisions, reconnect, and cross-functional races; implementation is tracked separately under SK-TASK-057.

- [`71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md`](71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md)
  — CP-12 runtime review across worker authority, one-shot movement frames, connection ownership,
  stale/blocked/competing-mutation safety, client lifecycle, snapshot projection, privacy, and local
  close/fault/drain boundaries; hosted, independent-browser, WebMCP, Re-entry, and public-load claims
  remain open.

- [`68-cp13-webmcp-capability-differential-diagnostic.md`](68-cp13-webmcp-capability-differential-diagnostic.md)
  — differential analysis of the three recorded WebMCP capability observations and six decidable
  checks for the one open blocking issue.

- [`69-cp13-page-tool-proposal-independent-review.md`](69-cp13-page-tool-proposal-independent-review.md)
  — independent review of the CP-13 page-tool proposal: five findings, three amendments, and the
  accepted four-read/deferred-dispatch disposition.

- [`70-cp13-site-tools-capability-experiment.md`](70-cp13-site-tools-capability-experiment.md)
  — executable procedure for the one runtime check that gated CP-13 and CP-14, with
  preconditions, an outcome decision table, and the recording requirement. Executed on 2026-09-03
  with a PASS result; the adapter discovered and read-only invoked the page-registered probe tool,
  reconciled as [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md).

- [`72-cp13-recall-transition-preimplementation-challenge.md`](72-cp13-recall-transition-preimplementation-challenge.md)
  — accepted server-authoritative recall challenge covering route-prefix derivation, role/cargo
  preservation, combat refusal, revisions, idempotency, rollback, gateway ordering, and restart.

- [`73-cp13-recall-transition-runtime-cross-functional-audit.md`](73-cp13-recall-transition-runtime-cross-functional-audit.md)
  — runtime audit of the local recall transition across mission, route, cargo, combat, persistence,
  gateway, projection, reconciliation, and restart boundaries; page WebMCP and Re-entry remain open.
- [`74-cp13-page-tools-implementation-preimplementation-challenge.md`](74-cp13-page-tools-implementation-preimplementation-challenge.md)
  — accepted implementation boundary for the four page reads, semantic schema readback,
  continuation-gated recall, server-derived scope, bounded history, unsupported UX, and full-snapshot
  reconciliation.
- [`75-cp13-page-tools-runtime-cross-functional-audit.md`](75-cp13-page-tools-runtime-cross-functional-audit.md)
  — local implementation audit across page authority, session/privacy, read bounds, signal provenance,
  recall composition, realtime reconciliation, lifecycle cleanup, and the remaining canonical browser
  evidence gate.
- [`77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md`](77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md)
  — CP-16 In-app Browser two-tab limitation, close-one lifecycle, and independent-session gate.
- [`78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md`](78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md)
  — CP-12 Canvas primitive actor/world presentation, projection authority, responsive readback, and
  final-art boundary.
- [`79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md`](79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md)
  — CP-12 one-mission GATHERER dispatch readback across authoritative route/role/tool/cargo state,
  Canvas/React agreement, responsive layout, lifecycle, and explicit external/independent-session
  claim limits.
- [`80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md`](80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md)
  — CP-12 Canvas selection feedback across local form state, projection-only lookup, invalid/stale
  clearing, draw order, semantic UX, responsive layout, and unchanged external boundaries.
- [`81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md`](81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md)
  — CP-14 real worker/combat `CargoLostToMonster` composition through the game-side delivery port,
  envelope fidelity, once-only acknowledgement, no gameplay mutation, and explicit external handoff
  limits.
- [`82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md`](82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md)
  — CP-16 real successful loss/reissue composition through local delivery, canonical page HTTP fresh
  reads, provenance-bound recall, duplicate safety, scope privacy, and explicit external/browser gates.

## Current concept checks

- The world clock continues independently of browser presence.
- Every soldier has one explicit role, tool, mission, route, and return policy.
- Cargo remains exposed until shelter deposit.
- Detection, contact, combat, loot, death, respawn, and mission termination have an ordered path.
- Migration has cost, commitment, visibility, turret, destination, and field-soldier behavior.
- Breach explains what happens to inside and outside soldiers.
- A successful siege records an attacker reward separately from the defender penalty and field cargo.
- Shelter, soldier, equipment, turret, and sensing upgrade directions are represented without
  pretending that prices or caps are final.
- A monster-caused soldier death preserves same-identity respawn while destroying exposed cargo.
- The global leaderboard has an explicit, reviewable ranking metric before balance claims are made.
- Events contain enough causal history for a human or Agent to understand the next decision.
- Domain Events remain durable while derived Agent Signals are coalesced and a running Codex Thread
  receives no per-event message.
- WebMCP remains a page action surface; backend authority and Re-entry Core remain separate.
- CP-04 keeps the local page and world worker under one explicit process owner, separates process
  liveness from readiness, and reserves the upgrade seam without adding a second authority.

## Future evidence gates

1. Documentation consistency and link validation.
2. Domain state-machine and combat example tests.
3. Persistent world-clock and restart recovery.
4. Multi-actor encounter and atomic cargo transfer.
5. Migration concealment, turret shutdown, and moving home anchor.
6. Breach conversion without duplicate soldier entities.
7. Normal human game loop without WebMCP.
8. Genuine page-bound WebMCP registration and current-state tool discovery.
9. Bounded Re-entry Core continuation with a visible human boundary.
10. Hosted health, deployment, and judge reproduction.

## Non-claims

A written rule, scenario, schema sketch, or local test plan does not prove runtime behavior,
production availability, security, fairness, or Hackathon readiness.
