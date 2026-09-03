# SK-TASK-029: CP-10 First Extraction and Cargo

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: Verified one local, restart-safe GATHERER first-extraction boundary with schema-v4 cargo provenance.
- Next gate: Register and challenge the next bounded CP-10 cadence/capacity/return task; do not claim repeat extraction, deposit, coins, or hosted scheduling from this task.

## Identity

- Task ID: `SK-TASK-029`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses schema migration, mission due-work, resource quantity,
  exposed cargo ownership, revisions, event ordering, idempotency, restart recovery, and the later
  combat/deposit handoffs.

## Objective

Advance one verified CP-09 GATHERER from `WORKING` to one authoritative Wood/Rock extraction
milestone. Persist the cargo provenance needed by later return, combat loss, and shelter deposit while
keeping coins and return travel outside this task.

## Success and non-goals

- Success: Arrival at `T` arms extraction at `T + 2`; one due extraction atomically decrements one
  node unit, creates one field cargo row, consumes the paired due marker, emits `CargoExtracted`, and
  returns a stable result on retry.
- Success: Schema-3 databases migrate to the v4 cargo shape transactionally and restart reads the
  same mission/node/cargo/event state.
- Non-goals: repeated cadence, fifth-slot return, partial depletion, node contest/reservation,
  automatic return, recall, deposit, coins, combat, cargo loss, HUNTER, browser/UI, WebMCP, Re-entry,
  hosted scheduling, or a new event/contract version.

## Scope and authority

- In scope: `src/server/mission-travel-service.ts`'s first-extraction due handoff, new
  `src/server/mission-extraction-service.ts`, cargo persistence types/schema/migration/store methods,
  focused CP-10 tests, and linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public surfaces, deployment, credentials, spend,
  staging, commit, push, and unrelated work.
- Allowed actions: edit scoped game files, install no dependency unless a safe missing runtime requires
  it, add tests/evidence, and run the minimum affected verification.
- Revalidate when: cargo identity/ownership, extraction cadence, due-work order, tool yield, capacity,
  node reservation, event vocabulary, schema compatibility, or the return/deposit handoff changes.

## Owning authority

- Economy: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Mission/phase: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Clock/order: [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md) and [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement)
- Decision/challenge: [`../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md) and [`../Validation/25-cp10-first-extraction-preimplementation-challenge.md`](../Validation/25-cp10-first-extraction-preimplementation-challenge.md)
- Scenario/preparation: [`../Scenarios/10-cp10-economy-fixtures.md`](../Scenarios/10-cp10-economy-fixtures.md) and [`SK-TASK-010-cp10-economy-preimplementation-pack.md`](SK-TASK-010-cp10-economy-preimplementation-pack.md)

## Evidence status

- Verified: CP-09 dispatch and route arrival provide the stable GATHERER role/tool/target/attempt,
  server route, integer clock seam, paired due markers, and `WORKING` phase.
- Selected design: schema v4 cargo provenance, one unit per due milestone, `T + 2` first extraction,
  one atomic node/cargo/event/idempotency transaction, and no wallet settlement.
- Verified: One post-arrival extraction transaction and schema-v3-to-v4 migration pass the focused
  and affected runtime suites, including duplicate, stale, full, empty, rollback, skipped-boundary,
  and restart paths. The exact claim is bound to [`../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md).
- Unknown: repeated extraction, capacity/return, final partial unit, concurrent contest, reservation,
  tool-tier yield, deposit ordering, combat transfer, and production scheduler composition.

## Implementation and verification notes

- Schema version 4 (`cp10-001`) adds cargo provenance (`mission_attempt_id`, `source_node_id`,
  `acquired_world_time`, and `capacity_used`) with transactional migration from schema 3.
- `MissionTravelService` arms the first extraction marker two world seconds after arrival. The new
  `MissionExtractionService` validates the persisted GATHERER loadout and commits exactly one node
  decrement, exposed cargo row, due-marker consumption, event, revisions, and idempotency record in
  one store transaction. No wallet, return, deposit, combat, client, or Agent authority was added.
- Contract-first Red/Green coverage is recorded in
  [`../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md).
  The focused suite passes 12/12 and the affected CP-04 through CP-10 aggregate passes 95/95.
  Node 24 typecheck, production build, dependency dry-run, documentation self-tests/validator, and
  scoped diff checks pass. The cross-functional disposition is
  [`../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md`](../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md).

## Smallest reversible action

Add the v3→v4 cargo migration and typed read/write boundary, capture a failing first-extraction test,
then implement the single extraction transaction and wire it only into the existing extraction phase
handler. Stop if it requires a new mission phase, event type, contract version, client authority, or
return/deposit effect.

## Verification and closure result

- Minimum verification completed: Red/Green focused tests for migration, arrival-to-`T + 2` ordering, valid
  Wood/Rock extraction, no coin, provenance/revisions/event, duplicate/stale/capacity/node failures,
  rollback, skipped boundary, and restart; then the affected CP-04 through CP-10 aggregate, typecheck,
  build, npm dry-run, documentation self-tests/validator, and scoped diff check.
- Closure result: `runtime_verified` for one local extraction boundary only. It does not prove return,
  deposit, coins, combat, browser, Agent, Re-entry, hosted continuity, or production balance.
- Rollback/remediation: A failed transaction leaves the mission `WORKING`, due marker, node, cargo,
  revisions, and event cursor unchanged. A malformed legacy row enters typed recovery rather than
  being silently rewritten.
- Reopen trigger: Any second extraction, capacity/return, node reservation, combat/deposit effect,
  schema/event/contract change, or scheduler ownership change entering this task.
