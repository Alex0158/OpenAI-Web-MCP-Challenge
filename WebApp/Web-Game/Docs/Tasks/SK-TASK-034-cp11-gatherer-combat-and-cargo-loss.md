# SK-TASK-034: CP-11 Gatherer Combat and Cargo Loss

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-11`
- Owner: Game owner
- Current increment: The first local CP-11 seeded-monster contact, deterministic GATHERER combat, cargo-loss, and same-identity respawn boundary is runtime-verified.
- Next gate: Register and prove the Hunter victory branch in a separate CP-11 task; preserve the encounter, cargo, death, and mission identities until that task is independently verified.

## Identity

- Task ID: `SK-TASK-034`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment changes persistence shape, encounter ownership, combat state, exposed cargo, mission lifecycle, soldier lifecycle, event order, and exactly-once recovery.

## Objective

Implement one worker-owned seeded-monster encounter for a G2 GATHERER. The server must derive contact,
resolve one deterministic combat round per integer world second, block extraction while combat is active,
destroy only unbanked cargo when the gatherer loses, and respawn the same soldier at its shelter without
duplicating the encounter or soldier.

## Success and non-goals

- Success: The seeded patrol can contact a `WORKING` gatherer at the inclusive one-tile boundary and
  create one durable locked encounter with participant, HP, round, and danger-cell identity.
- Success: One combat phase invocation resolves one round with the accepted formula, initiative order,
  remaining HP, event payload, revisions, and stable round idempotency.
- Success: A locked/resolving encounter prevents extraction at the same or later boundary until it is
  terminal.
- Success: Gatherer death atomically deletes validated active-attempt cargo, emits the ordered terminal
  events, terminalizes the attempt, returns the same soldier to `AT_SHELTER`, and leaves the monster in
  `PATROL` with no coins, reward, or third resource.
- Success: Duplicate, stale, malformed, cross-owner, concurrent, rollback, delayed, and file-backed
  restart cases remain typed, deterministic, and exactly once.
- Non-goals: Hunter dispatch/victory, automatic danger-cell reissue, repeated-death review, PvP, siege,
  party aggregation, random combat, new species, actor-wide health, breach conversion, shelter defense,
  deposit/coins, browser/UI, WebMCP, Re-entry delivery, default scheduler composition, hosted runtime,
  external services, or unrelated applications.

## Scope and authority

- In scope: schema-v5/cp11-001 encounter persistence, mission encounter linkage, contact and combat
  services, the minimum extraction guard, focused CP-11 tests, and linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public transport changes, deployment, credentials,
  spend, staging, commit, push, and unrelated dirty work.
- Allowed actions: edit scoped game files, add tests/evidence/docs, install a safe missing dependency if
  required, and run the minimum affected verification.
- Revalidate when: contact radius, formula, actor stats, phase order, cargo provenance, mission/soldier
  lifecycle, event vocabulary, schema/version, scheduler ownership, or an external handoff changes.

## Owning authority

- Encounter/combat: [`../Mechanics/detail-13-encounter-and-combat-resolution.md`](../Mechanics/detail-13-encounter-and-combat-resolution.md)
- Monster state and patrol: [`../Mechanics/detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md)
- Soldier lifecycle: [`../Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md)
- Mission and role lock: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Cargo and deposit boundary: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Ordering and chain: [`../Mechanics/Chains/02-dispatch-to-deposit.md`](../Mechanics/Chains/02-dispatch-to-deposit.md), [`../Mechanics/Chains/03-encounter-to-loot.md`](../Mechanics/Chains/03-encounter-to-loot.md), and [`../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../Mechanics/Chains/07-death-to-respawn-or-corruption.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#6-combat-contract`](../Engineering/09-mvp-contract-sheet.md#6-combat-contract)
- Decision/challenge: [`../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md) and [`../Validation/35-cp11-gatherer-combat-preimplementation-challenge.md`](../Validation/35-cp11-gatherer-combat-preimplementation-challenge.md)
- Preparation predecessor: [`SK-TASK-011-cp11-combat-preimplementation-pack.md`](SK-TASK-011-cp11-combat-preimplementation-pack.md) and [`../Scenarios/11-cp11-combat-fixtures.md`](../Scenarios/11-cp11-combat-fixtures.md)

## Evidence status

- Verified: CP-08/09 server-derived route positions, CP-10 exposed cargo/deposit boundary, inclusive
  contact radius, accepted formula/stat values, one round per integer world second, event vocabulary,
  and same-identity respawn policy as preparation inputs. This task also verifies schema-v5 encounter
  persistence, contact-before-extraction ordering, deterministic round cadence, terminal cargo loss,
  same-soldier respawn, rollback, duplicate replay, concurrent participant protection, and file-backed
  restart recovery in the local level-4 runtime path.
- Inferred: A structured encounter row is the smallest restart-safe authority for HP, participants,
  round cadence, and extraction blocking; actor-wide health is unnecessary for this first trace.
- Unknown: Hunter dispatch/victory, automatic reissue scheduling and safe-route outcome, encounter
  projection shape, default all-phase scheduler, and hosted/browser capability.

## Smallest reversible action

Add the accepted schema/encounter contract and focused Red proofs for contact and one terminal gatherer
loss. Implement the smallest contact and combat transaction that turns those proofs green. Stop before
adding Hunter, automatic reissue, PvP, UI, WebMCP, Re-entry, or hosted behavior.

## Verification and closure target

- Minimum verification: Red/Green focused CP-11 tests for migration, contact/phase order, formula,
  cadence, duplicate/stale/ownership/malformed/race/rollback/restart, cargo deletion, respawn identity,
  event order, monster retention, and no reward; then affected CP-09/CP-10 transitive tests, typecheck,
  build, dependency dry-run, documentation gates, scoped diff, and a post-implementation audit.
- Closure target: `runtime_verified` for the local worker-owned GATHERER monster-loss boundary only,
  recorded in [`../Evidence/SK-EVID-023-cp11-gatherer-combat-runtime-verification.md`](../Evidence/SK-EVID-023-cp11-gatherer-combat-runtime-verification.md)
  and reviewed in [`../Validation/36-cp11-gatherer-combat-runtime-cross-functional-audit.md`](../Validation/36-cp11-gatherer-combat-runtime-cross-functional-audit.md).
- Rollback or remediation: Any failed transaction leaves the encounter, mission, attempt, soldier, and
  cargo unchanged and retryable with the same logical identity. A malformed row returns a typed recovery
  error rather than discarding data.
- Reopen trigger: A new owner for HP/cargo, a contact or phase-order change, schema/event/contract
  version drift, a required Hunter/reissue/PvP/breach path, a public/WebMCP/Re-entry action, or hosted
  scheduler composition entering this transaction.
