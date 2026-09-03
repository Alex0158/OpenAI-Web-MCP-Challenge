# SK-TASK-033: CP-10 Deposit and Coin Settlement

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: The typed worker-owned deposit transaction, Wood/Rock settlement, resident handoff, and inactive mission-row reuse are runtime-verified locally at process-runtime level 4 in [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md), with the cross-functional chain and residuals reviewed in [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md).
- Next gate: [`SK-TASK-034`](SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md) is registered with accepted Challenge/ADR; preserve the settlement boundary and its claim limits until the CP-11 combat, scheduler composition, projection, WebMCP, Re-entry, and hosted gates are independently verified.

## Identity

- Task ID: `SK-TASK-033`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment removes durable cargo, credits shelter value, changes soldier and mission lifecycle, and emits exactly-once settlement events across the economy, persistence, clock, and future dispatch boundaries.

## Objective

When an active G2 GATHERER reaches `DEPOSITING`, atomically settle its validated Wood/Rock cargo into
the owning shelter's coin balance exactly once, return the same soldier to `AT_SHELTER`, close the
attempt as history, and leave the resident mission ready for a later manual dispatch.

## Success and non-goals

- Success: The worker derives shelter ownership and coin value from durable state, validates every
  active-attempt cargo row, removes the cargo once, credits Wood at one coin and Rock at three coins,
  appends ordered shelter-visible settlement events, and stores an idempotent result.
- Success: A zero-cargo `DEPOSITING` attempt completes as a resident with a zero-value
  `CargoDeposited` event and no positive `CoinsCredited` event.
- Success: A failed transaction, stale revision, changed duplicate request, malformed provenance,
  or wrong visibility leaves the last valid state intact and returns a typed result. Reopening the
  file-backed store can finish a delayed settlement once.
- Success: A completed resident mission row can be reused by the existing server dispatch path with
  an incremented mission revision and a fresh `mission_attempt_id`; prior attempts remain history.
- Non-goals: extraction, return movement, recall, combat, death/respawn, PvP loot, migration,
  upgrades, gold, weighted capacity, production balance, ledger pagination, automatic target
  selection or reissue, a new scheduler, browser/UI, WebMCP, Re-entry delivery, hosted execution,
  schema/event/contract version changes, or unrelated applications.

## Scope and authority

- In scope: `src/server/mission-deposit-service.ts`, `src/server/persistence/types.ts`,
  `src/server/persistence/store.ts`, the smallest required resident-row dispatch compatibility in
  `src/server/mission-service.ts`, focused `tests/cp10-deposit-settlement.test.ts`, and linked
  evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public transports, deployment, credentials,
  spend, staging, commit, push, and unrelated dirty work.
- Allowed actions: edit scoped game files, add tests/evidence/docs, install a safe missing dependency
  if required, and run the minimum affected verification. Do not alter schema or public contracts
  without reopening the Challenge and ADR.
- Revalidate when: cargo provenance/weights, conversion values, mission identity, shelter ownership,
  event order, wallet revision, default scheduler composition, combat-at-home behavior, or contract
  version changes.

## Owning authority

- Economy: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Mission and lifecycle: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md) and [`../Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md)
- Ordering: [`../Mechanics/Chains/02-dispatch-to-deposit.md`](../Mechanics/Chains/02-dispatch-to-deposit.md) and [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement`](../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement)
- Decision/challenge: [`../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md) and [`../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md)
- Predecessor/evidence: [`SK-TASK-032-cp10-return-navigation-and-home-crossing.md`](SK-TASK-032-cp10-return-navigation-and-home-crossing.md), [`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md), and [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md)

## Evidence status

- Verified: Schema-v4 cargo provenance, five equal-weight slots, Wood/Rock values, no coin before
  deposit, the exact `RETURNING -> DEPOSITING` home crossing, shelter revisions, Domain Events, and
  idempotency records.
- Inferred: One worker-owned settlement transaction over cargo, shelter, soldier, mission, attempt,
  events, and idempotency is the smallest safe G2 boundary; no new ledger table is needed.
- Known compatibility gap: The current dispatch write path rejects an existing mission id even when
  a soldier is resident. This task includes the smallest inactive mission-row reuse change so a
  successful deposit does not strand the player loop.
- Unknown: future weighted cargo, combat/loot at home, automatic fresh-target reissue, multi-worker
  settlement fairness, default all-phase scheduler composition, browser projection, and hosted state.

## Smallest reversible action

Add the focused failing deposit and resident-reuse proofs, then extend the existing persistence
boundary with one typed deposit result and one worker phase handler. Keep the current mission attempt
history, delete only validated active-attempt cargo, and stop if implementation requires schema,
contract/event-version, public-command, combat, or automatic-target changes.

## Verification and closure target

- Minimum verification: Red/Green focused tests for Wood, Rock, mixed cargo, zero cargo, exact event
  order, duplicate replay, changed-request rejection, stale mission/attempt/soldier/shelter/cargo
  revisions, cross-owner visibility, malformed provenance, integer overflow, rollback after state and
  event stages, delayed boundary, restart, and manual dispatch after settlement. Then the affected
  CP-04 through CP-10 aggregate, Node 24 typecheck/build, dependency dry-run, documentation
  self-tests/validator, scoped diff check, and a post-implementation cross-functional audit.
- Closure target: `runtime_verified` for the local worker-owned Wood/Rock deposit, coin credit,
  resident handoff, and tested mission-row reuse boundary only.
- Closure result: `runtime_verified` under [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md), reviewed in [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md).
- Rollback or remediation: Preserve `DEPOSITING` and all cargo on failure; retry the same derived
  work identity after resolving a typed recovery fault. Never drop orphan cargo, infer a coin value,
  or record a success that was not committed.
- Reopen trigger: Combat/loot at home, moving shelter, weighted or non-Wood/Rock cargo, automatic
  reissue or target selection, a ledger or schema change, multi-worker ownership, a new event or
  contract version, a public/WebMCP/Re-entry action, or default hosted scheduler composition.
