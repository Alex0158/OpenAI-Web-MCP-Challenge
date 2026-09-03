# Sleepless Kingdom Evidence

**Role:** Active evidence and claim-binding authority
**Status:** Active
**Last updated:** 2026-09-03

## 1. Responsibility

This directory stores fresh verification results, their exact source identity, and their claim
limits. It supports claims made elsewhere; it never defines game behavior, and evidence context does
not automatically become product policy.

[`../Validation/`](../Validation/README.md) owns concept coherence audits and the plan for future
proof. This directory owns executed results.

The CP-12 dashboard icon increment is recorded in [`SK-EVID-027`](SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md).
The CP-12 local fixture session and first-frame process runtime is recorded in [`SK-EVID-028`](SK-EVID-028-cp12-local-fixture-session-runtime-verification.md).
The CP-12 one-browser-context hydration and Canvas readback is recorded in [`SK-EVID-029`](SK-EVID-029-cp12-browser-hydration-runtime-verification.md).
The CP-13 negative WebMCP capability probe is recorded in [`SK-EVID-030`](SK-EVID-030-cp13-webmcp-capability-probe.md).
The CP-12 two-tab browser isolation limitation is recorded in [`SK-EVID-031`](SK-EVID-031-cp12-two-session-browser-isolation-probe.md).
The CP-12 local browser reconnect and stale-fallback runtime is recorded in [`SK-EVID-032`](SK-EVID-032-cp12-browser-reconnect-runtime-verification.md).
The CP-12 discrete keyboard/button movement and authoritative reconciliation runtime is recorded in [`SK-EVID-033`](SK-EVID-033-cp12-keyboard-movement-runtime-verification.md).
The CP-12 ordinary-UI GATHERER dispatch and authoritative reconciliation runtime is recorded in [`SK-EVID-034`](SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md).
The CP-06 boundary-safe gameplay phase coordinator runtime is recorded in [`SK-EVID-035`](SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md).
The CP-06 explicitly enabled autonomous scheduler runtime is recorded in [`SK-EVID-036`](SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md).
The CP-15 deterministic trace support contract verification is recorded in [`SK-EVID-037`](SK-EVID-037-cp15-deterministic-trace-support-runtime-verification.md).
The CP-15 contract/race/failure matrix aggregate is recorded in [`SK-EVID-038`](SK-EVID-038-cp15-contract-race-failure-matrix-runtime-verification.md).
The CP-16 pre-Agent local causal slice is recorded in [`SK-EVID-039`](SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md).
The CP-12 automatic realtime snapshot publication runtime is recorded in [`SK-EVID-040`](SK-EVID-040-cp12-autonomous-realtime-snapshot-publication-runtime-verification.md).
The CP-14 Agent Signal policy conformance result is recorded in [`SK-EVID-041`](SK-EVID-041-cp14-signal-policy-conformance-contract-verification.md) as a level-2 local contract result; `SK-ISSUE-007` is resolved as a specification clarification.
The CP-12 snapshot-gated held movement and touch-input runtime is recorded in [`SK-EVID-042`](SK-EVID-042-cp12-held-movement-runtime-verification.md) for its named local client presentation scope; the server-owned continuous-intent runtime is recorded in [`SK-EVID-043`](SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md) for its named local worker-to-page scope, while hosted/default-world continuous movement remains open.
The CP-12 server-owned continuous-intent runtime and close/fault/drain cross-functional review are recorded in [`SK-EVID-043`](SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md) and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
The CP-13 site tools eligibility research is recorded in [`SK-EVID-044`](SK-EVID-044-cp13-site-tools-eligibility-research.md), and the positive page-bound discovery and read-only invocation on one local disposable page is recorded in [`SK-EVID-045`](SK-EVID-045-cp13-site-tools-capability-experiment.md); `SK-ISSUE-001` is resolved. The local game-page implementation is recorded in [`SK-EVID-047`](SK-EVID-047-cp13-page-tools-local-runtime-verification.md), the earlier gated canonical-page attempt is preserved in [`SK-EVID-048`](SK-EVID-048-cp13-canonical-page-browser-attempt.md), and the later positive canonical-page read capability is recorded in [`SK-EVID-049`](SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md). Genuine Agent grant delivery, Re-entry delivery, and hosted continuity remain unproven.
The CP-13 page-tools local implementation and cross-functional runtime result is recorded in [`SK-EVID-047`](SK-EVID-047-cp13-page-tools-local-runtime-verification.md) and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md); `SK-EVID-049` adds ladder-level 6 evidence for the four canonical read tools and one supported read-only invocation, while dynamic recall, Agent grants, Re-entry, and hosted delivery remain open.
The CP-14 game-side `ReentryDeliveryPort` and labelled local transport-stub result is recorded in [`SK-EVID-050`](SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md) and [`Validation/76`](../Validation/76-cp14-game-side-local-stub-delivery-port-runtime-cross-functional-audit.md); live Receiver/Connector, Agent, hosted, and judge delivery remain open.
The CP-14 real worker/combat event-to-local-stub composition is recorded in [`SK-EVID-055`](SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md) and [`Validation/81`](../Validation/81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md); it proves one local acknowledgement without gameplay mutation and does not close external delivery.
The CP-16 real worker loss/reissue-to-local-port-to-page-reread/recall composition is recorded in [`SK-EVID-056`](SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md) and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md); it proves one local/page causal action with duplicate and scope checks and does not close external delivery, WebMCP, browser, hosted, or judge gates.
The CP-16 local clean-restart continuity composition is recorded in [`SK-EVID-057`](SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md) and [`Validation/83`](../Validation/83-cp16-local-causal-restart-recall-continuity-runtime-cross-functional-audit.md); it proves durable loss/reissue, signal, page reread, and bounded recall continuity across two sequential local entrypoints and does not close downtime catch-up, external delivery, WebMCP, browser, hosted, or judge gates.
The CP-16 real worker event-burst/page-context composition is recorded in [`SK-EVID-058`](SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md) and [`Validation/84`](../Validation/84-cp16-real-event-burst-page-context-runtime-cross-functional-audit.md); it proves two real loss/reissue outcomes coalesce into one local signal while both causal records remain page-readable and does not close external backpressure, WebMCP, browser, hosted, or judge gates.
The CP-14 upstream main and Game scope drift source audit is recorded in [`SK-EVID-059`](SK-EVID-059-cp14-upstream-main-game-scope-drift-source-audit.md) and [`Validation/85`](../Validation/85-cp14-upstream-main-game-scope-cross-functional-audit.md); it proves only the fetched ref ancestry, remote Game-tree preservation risk, and owner-controlled integration gate, and does not prove Game integration or external delivery.
The CP-16 In-app Browser two-tab limitation and close-one lifecycle result is recorded in [`SK-EVID-051`](SK-EVID-051-cp16-independent-browser-context-capability-probe.md) and [`Validation/77`](../Validation/77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md); independent browser contexts and the level-5 two-player claim remain open.
The CP-12 Canvas actor/world primitive baseline result is recorded in [`SK-EVID-052`](SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md) and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md); final art, atlas states, population-scale performance, and browser/hosted gates remain open.
The CP-12 one-mission Canvas mission-state readback is recorded in [`SK-EVID-053`](SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md) and [`Validation/79`](../Validation/79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md); the local GATHERER travel/extraction/return presentation is verified, while independent sessions, combat visuals, WebMCP, Re-entry, hosted continuity, final art, and scale remain open.
The CP-12 Canvas selection feedback result is recorded in [`SK-EVID-054`](SK-EVID-054-cp12-canvas-selection-feedback-runtime-verification.md) and [`Validation/80`](../Validation/80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md); the local soldier/resource selection cue is verified without changing gameplay or external boundaries.
The CP-12 mission status card presentation result is recorded in [`SK-EVID-060`](SK-EVID-060-cp12-mission-status-card-runtime-verification.md) and [`Validation/86`](../Validation/86-cp12-mission-status-card-runtime-cross-functional-audit.md); the existing projected mission rows are structured for readability without changing authority or external boundaries.
The CP-12 causal history card presentation result is recorded in [`SK-EVID-061`](SK-EVID-061-cp12-causal-history-card-runtime-verification.md) and [`Validation/87`](../Validation/87-cp12-causal-history-card-runtime-cross-functional-audit.md); the existing projected event history is structured for causal readability without changing event authority, order, delivery, or external boundaries.
The CP-12 shelter economy summary card presentation result is recorded in [`SK-EVID-062`](SK-EVID-062-cp12-shelter-economy-summary-card-runtime-verification.md) and [`Validation/88`](../Validation/88-cp12-shelter-economy-summary-card-runtime-cross-functional-audit.md); the existing projected Coins and visible Wood/Rock nodes are structured for readable, responsive, fail-closed presentation without changing economy, snapshot, command, or external boundaries.
The CP-17 Railway resource provisioning preflight is recorded in [`SK-EVID-063`](SK-EVID-063-cp17-railway-resource-provisioning-preflight.md); the project, service, Volume, domain, and non-secret configuration are read back, while deployment, Clerk admission, persistence, restart, backup, and hosted continuity remain gated.
The CP-17 Clerk client admission gate is recorded in [`SK-EVID-064`](SK-EVID-064-cp17-clerk-client-admission-contract.md); the invite-only page branches are contract-verified, while real Clerk session issuance and hosted browser admission remain gated.
The CP-17 hosted deployment and Clerk domain runtime readback is recorded in [`SK-EVID-065`](SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md); Railway deployment/health, custom Game HTTPS, Clerk DNS/SSL/JWKS, the signed-out invite-only modal, secret rotation, and old-key revocation pass at a bounded hosted level-4 scope, while authenticated two-session gameplay, restart/backup/rollback, and `hosted_verified` closure remain open.
The CP-17 Player A hosted session, server-authoritative GATHERER command, extraction/deposit settlement, and realtime progression are recorded in [`SK-EVID-066`](SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md); one real identity passes the bounded hosted slice, while Player B isolation, direct WebSocket parity, browser-free continuity, restart, recovery, and `hosted_verified` closure remain open.
The CP-17 Player B hosted session, server-authoritative GATHERER command, extraction/deposit settlement, and realtime progression are recorded in [`SK-EVID-067`](SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md); both provisioned identities now pass sequential bounded hosted slices, while independent isolation, direct WebSocket parity, browser-free continuity, restart, recovery, and `hosted_verified` closure remain open.
The CP-17 independent Chrome/Codex Browser contexts and concurrent scoped runtime are recorded in [`SK-EVID-068`](SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md); two identities now pass the hosted ladder-level 5 slice, while deliberate denial, wire failure, browser-free continuity, restart, recovery, and `hosted_verified` closure remain open.
The CP-17 hosted backup, in-place Railway restart, authenticated reconnect, same-world persistence, browser-absent continuity, and post-restart unauthenticated WebSocket rejection are recorded in [`SK-EVID-069`](SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md); the restart/reconnect slice passes at ladder level 6, while authenticated wrong-scope denial, rollback/read-restore, and `hosted_verified` closure remain open.
The CP-17 local production-like authenticated cross-scope denial rehearsal is recorded in [`SK-EVID-070`](SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md); the Clerk-mode HTTP slice passes at ladder level 4 for bidirectional `NOT_OWNER`, no-mutation, stable retry, and strict client-authority rejection, while real-provider hosted denial and rollback/read-restore remain open.
The CP-17 local production-like WebMCP page-tool admission slice is recorded in [`SK-EVID-071`](SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md); the Clerk-mode HTTP read uses the server-derived scope, preserves cache isolation, rejects client-selected identity, and keeps the fixture route unavailable, while hosted page-tool execution, genuine WebMCP registration, and dynamic Agent action remain open.
The CP-17 local production-like WebMCP two-identity scope slice is recorded in [`SK-EVID-072`](SK-EVID-072-cp17-production-webmcp-two-identity-scope-runtime-verification.md); both fixed Clerk subjects receive private reads for their own shelter through one route, while hosted page-tool execution, genuine WebMCP registration, and dynamic Agent action remain open.

## 2. Identity

Evidence IDs use `SK-EVID-NNN`, beginning at `001` and increasing monotonically. Never renumber or
reuse an ID. Files are named `SK-EVID-NNN-short-kebab-title.md`.

## 3. Required content

Every record binds a result to an exact identity and an exact claim limit. Start from
[`../Templates/evidence-record.md`](../Templates/evidence-record.md) and record:

- the evidence class: `static`, `contract`, `aggregate`, `process-runtime`, `slice-chain`,
  `capability`, or `hosted`;
- the exact source state, environment, runtime versions, fixture seed, and time;
- the behavior under test and the owning contract section;
- the claim this evidence may support, and the claims it cannot support;
- the executed commands and their pass, fail, skip, gated, or flaky outcome;
- what was not run and the resulting unknown; and
- the freshness and invalidation triggers.

## 4. Claim discipline

1. Map every result to a level on the
   [verification ladder](../00-Workflow/README.md#11-stage-8-verification-ladder) and never claim
   above it.
2. Skipped, gated, disabled, expected-fail, stub-only, and manual-only results are never counted as
   passing evidence.
3. A local pass does not prove a hosted configuration, and a hosted health pass does not prove a
   reviewer journey.
4. A capability result names the exact browser and session; a synthetic or fallback path may never be
   reported as genuine page-bound WebMCP.
5. A fixture world result is bounded by its seed. State the seed.

## 5. Invalidation

An evidence record is invalidated by a change to the source it names, the `SK-MVP-*` contract
version, the persistence schema or `world_snapshot`/`client_snapshot` shape, the world-clock or due-work order, the event or
idempotency contract, the runtime or browser version, or the fixture seed. Record the invalidation
rather than silently reusing the result.

## 6. Maintenance rules

1. Keep this README bounded. Never add a result table or a second status register.
2. Link large or sensitive output; do not paste raw traces, credentials, or private identifiers.
3. Preserve superseded records with their original scope; do not edit a past result to match a new
   claim.
4. Keep every record English-only.
