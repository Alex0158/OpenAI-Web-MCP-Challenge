# SK-TASK-036: CP-11 Danger-Cell Reissue and Anti-Loop

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-11`
- Owner: Game owner
- Current increment: Runtime-verify the one-budget automatic monster-loss reissue and typed anti-loop stop across migration, route, rollback, restart, and reset boundaries.
- Next gate: Continue with the next registered task after the evidence and cross-functional audit remain synchronized.

## Identity

- Task ID: `SK-TASK-036`
- Date: `2026-09-02`
- Risk profile: `Assured`
- Reason for profile: This increment crosses combat death settlement, mission identity, schema migration, route authority, event ordering, idempotency, restart recovery, and the player-visible review state.

## Objective

Implement the accepted CP-11 automatic reissue boundary. After a monster-caused GATHERER death, the
same soldier must either receive one fresh role-preserving attempt along a deterministic route that
avoids the recorded danger cell and its one-tile neighbourhood, or remain at its shelter in typed
`WAITING_REVIEW`. A second monster death before deposit must stop without another automatic attempt.

## Success and non-goals

- Success: Schema-v6 migration persists a one-bit reissue budget, integer danger cell, typed review
  reason, and terminal attempt cause without changing the contract version.
- Success: Death, validated cargo loss, same-identity respawn, budget consumption, fresh attempt or
  review stop, `MissionReissued`, event cursor, revisions, and idempotency commit atomically.
- Success: A positive deterministic safe-detour route and the fixed seeded Rock no-route branch are
  both explicit; no target-cell exemption, old-route fallback, teleport, or unbounded retry exists.
- Success: A repeated death enters `WAITING_REVIEW / REPEATED_MONSTER_DEATH`; successful deposit and
  new manual dispatch reset the next chain's budget and clear review metadata.
- Success: Existing GATHERER-loss, HUNTER-victory, CP-10 deposit, duplicate, stale, ownership,
  rollback, and restart behavior remains green.
- Non-goals: HUNTER defeat balancing or a fabricated loss fixture, PvP, siege, breach conversion,
  monster drops, party aggregation, discovery/intelligence, browser/UI, WebMCP, Agent Signal/Re-entry,
  default scheduler composition, hosted continuity, deployment, credentials, spend, staging, commit,
  push, or unrelated work.

## Scope and authority

- In scope: `src/server/persistence/schema.ts`, `types.ts`, `store.ts`, `mission-service.ts`,
  `monster-combat-service.ts`, the existing manual dispatch/deposit reset paths, focused CP-11 tests,
  and the linked game documentation/evidence records.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public transport, external Receiver/Connector,
  and any new authority for world time, identity, cargo, coins, combat formula, or settlement.
- Allowed actions: Read and edit scoped game files, install a safe dependency only if required, run
  the minimum affected checks, and write evidence/documentation. Do not stage, commit, push, deploy,
  use credentials, spend, or contact external parties.
- Revalidate when: The accepted anti-loop rule, route geometry, danger-cell rounding, mission phase,
  event vocabulary, schema/contract version, combat terminal transaction, scheduler owner, or a
  requirement for HUNTER loss changes.

## Owning authority

- Contract and anti-loop rule: [`../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions`](../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions)
- Governing decision: [`../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md)
- Pre-implementation challenge: [`../Validation/39-cp11-danger-cell-reissue-preimplementation-challenge.md`](../Validation/39-cp11-danger-cell-reissue-preimplementation-challenge.md)
- Geometry/state closure: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
- Death and identity: [`../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../Mechanics/Chains/07-death-to-respawn-or-corruption.md) and [`../Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md)
- Mission/route authority: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md) and [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md)
- Combat predecessor: [`SK-TASK-034`](SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md), [`SK-TASK-035`](SK-TASK-035-cp11-hunter-victory-and-return.md), and their linked evidence/audits.

## Evidence status

- Verified: GATHERER terminal loss, exposed-cargo deletion, same-identity respawn, HUNTER victory and
  return, mission/attempt revisions, file-backed schema-v5 restart, the fixed Rock target geometry,
  and the schema-v6 reissue/review runtime boundary.
- Accepted: One budget, integer danger cell, one bounded route replan, typed no-route/repeated-death
  review, reset after deposit/manual dispatch, and `MissionReissued` payload boundary.
- Inferred: Keeping the policy on the mission aggregate and committing death plus reissue in one
  transaction is the smallest restart-safe authority boundary.
- Unknown: HUNTER loss remains outside the seeded fixture; browser/UI, WebMCP, Re-entry, default
  scheduler, hosted, and production behavior remain separate gates.

## Smallest reversible action

The Red tests and schema/route contract fixtures from Validation39 identified the narrowest missing
boundary. The smallest implementation now keeps death, cargo loss, respawn, budget consumption, and
reissue/review in the existing combat transaction. Reopen the ADR if the fixed target conflict
requires a contract change, a target exemption, or a second transaction owner.

## Verification and closure target

- Minimum verification: Focused CP-11 reissue tests for migration, positive detour, fixed no-route,
  repeated death, reset, event order, duplicate/stale/ownership/race/rollback, restart, and CP-10/
  CP-11 regressions; then typecheck, build, and documentation validators.
- Closure target: `runtime_verified` for the local worker-owned reissue/review boundary, with a new
  evidence record and cross-functional runtime audit. This does not prove browser, WebMCP, Re-entry,
  hosted, or judge behavior.
- Rollback or remediation: Any failure leaves mission, attempts, soldier, cargo, route, budget,
  review fields, events, cursor, revisions, and idempotency unchanged and retryable with the same key.
- Reopen trigger: A schema/contract/event change, any duplicate active attempt, a route that enters
  the forbidden set, a second automatic retry, a partial death/reissue commit, or a newly required
  HUNTER loss/external/scheduler boundary.
