# ADR-GAME-0024: CP-10 Deposit and Coin Settlement

**Status:** ACCEPTED LOCAL CP-10 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-033`, settlement of an active G2 gatherer after exact home crossing  
**Related challenge:** [`../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](ADR-GAME-0020-cp10-first-extraction-and-cargo.md), [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md), [`ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)

## Context

CP-10 now carries authoritative Wood/Rock cargo through a deterministic return and commits an exact
`RETURNING -> DEPOSITING` home crossing. The next boundary must convert that exposed cargo into shelter
coins without allowing a browser, Agent, combat handler, or duplicate worker retry to create or lose
value. The existing schema already stores the shelter wallet, cargo provenance, revisions, Domain
Events, and idempotency records. The G2 contract fixes Wood at one coin per unit, Rock at three coins
per unit, and no coin before a valid deposit.

The current dispatch path also rejects an existing `mission_id`. If settlement only credits coins and
leaves the resident mission row unusable, a normal player cannot assign that soldier again after it
returns. The boundary therefore includes a small resident-row reuse rule while keeping automatic
target selection and repeatable reissue out of scope.

## Decisions

### 1. Use a worker-owned deposit phase handler

The `deposit` phase runs after movement/home crossing at the current authoritative world time. It
lists active `DEPOSITING` attempts, orders them by `(last_transition_world_time, mission_attempt_id)`,
and re-reads the linked mission, attempt, soldier, shelter, and cargo inside the persistence
transaction. There is no new public command, browser timer, WebMCP action, or Re-entry wake.

### 2. Derive settlement identity from the durable home crossing

The logical work key is
`mission-deposit:<mission_attempt_id>:<home_crossing_world_time>`. The request fingerprint contains
the attempt and crossing identity, but not the current execution world time, so a delayed retry after
restart can use the same key and replay the original result. `CargoDeposited` and `CoinsCredited`
event ids are deterministic children of that key. A different binding or logical request is a typed
duplicate conflict.

### 3. Validate and settle the complete active-attempt cargo aggregate

The transaction accepts only an active G2 GATHERER whose mission and attempt are both `DEPOSITING`,
whose soldier is `FIELD`, and whose active attempt linkage and due markers are coherent. It derives
the shelter from `soldier.shelter_id`; it never trusts a submitted shelter, position, quantity, or
coin amount. Every cargo row for the active attempt must belong to the same soldier, use Wood or Rock,
have positive quantity equal to `capacity_used`, and retain valid source-node provenance. An orphan or
cross-attempt cargo row is a typed recovery fault rather than an implicit discard.

The server computes `coinDelta = Wood quantity * 1 + Rock quantity * 3` with safe-integer checks.
It deletes the validated cargo rows, increments the owning shelter wallet with its expected revision,
marks the soldier `AT_SHELTER` with null role/tool/work, changes the mission to `state = COMPLETED`,
`phase = AT_SHELTER` with no active attempt or due work, and marks the attempt
`state = COMPLETED`, `phase = TERMINAL` while retaining its immutable history. All these mutations
are one transaction.

### 4. Preserve causal event order and exactly-once effects

The transaction appends `CargoDeposited` first with the complete pre-delete cargo list, totals,
shelter id, previous phase/state, and the derived coin delta. If `coinDelta > 0`, it appends
`CoinsCredited` second with the previous and resulting shelter balance and the cargo event id. A
zero-cargo contest loser still completes the resident handoff and emits `CargoDeposited` with zero
totals; it emits no misleading positive coin event. The idempotency record stores the complete result
and ordered event ids. A duplicate returns that stored result without a second deletion, credit,
revision, cursor, or event.

### 5. Reuse an inactive mission row for the next manual dispatch

Settlement clears the current mission's active attempt and assignment fields while preserving the
completed attempt row as history. The existing server dispatch path may reuse a mission row only when
it is completed, `AT_SHELTER`, and has no active attempt; it increments that mission revision,
restores the new server-validated assignment, and creates a fresh `mission_attempt_id`. An active or
incoherent row remains `MISSION_ACTIVE` or `RECOVERY_REQUIRED`. This compatibility rule does not
choose a new target, reissue automatically, or change the first-dispatch contract.

### 6. Keep the existing contract and checkpoint order

No schema, event-version, or `SK-MVP-0.2` contract change is introduced. The phase remains
`movement -> deposit -> contact -> extraction -> combat -> settlement -> timers`; settlement is
separate from return movement, combat/death, node respawn, and Agent delivery. Shelter revision
conflicts, malformed state, and transaction failures remain visible and retryable rather than hidden
behind a fallback.

## Alternatives rejected

- **Credit coins without releasing the resident state:** rejected because it leaves a known post-return
  dispatch dead end and makes the player loop appear complete while the soldier remains locked.
- **Create a new ledger or cargo table:** rejected because the existing cargo provenance, shelter
  revision, Domain Event, and idempotency rows already provide the required G2 atomic boundary.
- **Emit `CoinsCredited` with zero for an empty deposit:** rejected because a positive reward event must
  not claim value was created; the zero `CargoDeposited` event explains the resident handoff.
- **Let the browser submit cargo or coin totals:** rejected because it moves authoritative settlement
  into a replaceable projection and permits value creation.
- **Automatically select a fresh target after deposit:** rejected because target observation, sensing,
  route planning, and reissue cadence are separate decisions and would enlarge CP-10.
- **Split cargo deletion and wallet credit into separate transactions:** rejected because a crash could
  lose cargo or mint coins, violating exactly-once settlement.

## Consequences and reopen triggers

The normal G2 economy loop becomes auditable: exposed cargo reaches home, one transaction removes it,
credits the correct shelter wallet, returns the same soldier identity to the shelter, and leaves a
causal history that can be rendered later. A zero-cargo return is harmless and visible. A subsequent
manual dispatch can reuse the completed mission row without a schema migration, while all previous
attempts remain queryable.

This is still a local worker-handler boundary. It does not prove default scheduler composition,
browser/UI projections, combat or loot at home, automatic reissue, multi-worker fairness, ledger
pagination, hosted continuity, WebMCP, or Re-entry delivery. Reopen if any of those surfaces needs to
own the transaction, if a moving shelter changes the home identity, if weighted or non-Wood/Rock
cargo is introduced, or if a new schema/event/contract version is required.

## Verification and reopen

The minimum proof is the focused CP-10 deposit suite covering Wood, Rock, mixed and zero cargo,
positive and negative paths, event order, duplicate and changed-request retries, stale revisions,
wrong shelter visibility, malformed provenance, overflow, injected rollback, delayed settlement,
restart recovery, and dispatch after the resident handoff. Closure also requires the affected CP-04
through CP-10 aggregate, Node 24 typecheck/build, dependency dry-run, documentation gates, and a
post-implementation cross-functional audit. The exact result must use `runtime_verified` only for the
tested local settlement boundary.
