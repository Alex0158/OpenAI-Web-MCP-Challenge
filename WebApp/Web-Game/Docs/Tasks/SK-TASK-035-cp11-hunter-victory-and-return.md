# SK-TASK-035: CP-11 Hunter Victory and Return

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-11`
- Owner: Game owner
- Current increment: The seeded HUNTER dispatch, deterministic five-round monster victory, and route-preserving zero-cargo return boundary are runtime-verified locally.
- Next gate: Continue with the registered [`SK-TASK-036`](SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md) challenge and preserve this verified Hunter boundary.

## Identity

- Task ID: `SK-TASK-035`
- Date: `2026-09-02`
- Risk profile: `Assured`
- Reason for profile: This increment crosses mission role validation, route arrival, encounter ownership, combat formula, monster lifecycle, return navigation, zero-cargo settlement, event order, and restart/idempotency.

## Objective

Enable the accepted HUNTER side of the CP-11 seeded contrast. A resident soldier must be dispatchable
with the server-derived seeded-monster route and SWORD loadout, arrive without extraction work, lock
one encounter, defeat the monster in five deterministic rounds, and return to the shelter through the
existing reverse-route and exact home-crossing boundaries. The same soldier identity and all causal
events must survive retries and process replacement.

## Success and non-goals

- Success: HUNTER target validation, tier-one SWORD role lock, idempotent dispatch, deterministic
  route arrival, contact uniqueness, and no extraction marker.
- Success: HUNTER round history uses the accepted `18`/`9` values, initiative order, HP, round five
  terminal condition, and a single `MonsterDefeated` result.
- Success: Victory atomically deactivates the monster as `DEAD`, clears encounter linkage, starts
  `RETURNING`, preserves the field soldier and route, emits no cargo/coin/death events, and rolls back
  as one unit on failure.
- Success: Reverse navigation and zero-cargo home settlement release the same soldier, complete the
  mission, retain terminal history, and emit no `CoinsCredited` event.
- Success: Gatherer-loss CP-11 behavior and CP-09/CP-10 predecessor behavior remain green.
- Non-goals: Automatic danger-cell reissue, repeated-death review, monster drops, pursuit/retreat,
  PvP, siege, party aggregation, new species, intelligence schema/discovery gate, browser/UI,
  WebMCP, Re-entry delivery, default scheduler composition, hosted runtime, external services,
  deployment, credentials, spend, staging, commit, push, or unrelated work.

## Scope and authority

- In scope: HUNTER dispatch/arrival validation, role-aware seeded contact, typed HUNTER combat rounds,
  terminal monster state, role-aware return/home crossing, empty-cargo settlement, focused tests, and
  linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public transport changes, and any new authority
  for world time, identity, route, cargo, coins, or external delivery.
- Allowed actions: edit scoped game code/tests/docs, install a safe missing dependency if required, and
  run minimum affected verification. Do not stage, commit, push, deploy, or contact external parties.
- Revalidate when: HUNTER stats/loadout, target visibility, contact radius, formula, event vocabulary,
  monster lifecycle, return/deposit owner, schema/contract version, scheduler ownership, or external
  handoff changes.

## Owning authority

- Contract: [`../Engineering/09-mvp-contract-sheet.md#6-combat-contract`](../Engineering/09-mvp-contract-sheet.md#6-combat-contract)
- Mission and role lock: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Monster and state: [`../Mechanics/detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md)
- Encounter and formula: [`../Mechanics/detail-13-encounter-and-combat-resolution.md`](../Mechanics/detail-13-encounter-and-combat-resolution.md)
- Return and settlement: [`../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md), [`../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)
- Governing decision/challenge: [`../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md), [`../Validation/37-cp11-hunter-victory-preimplementation-challenge.md`](../Validation/37-cp11-hunter-victory-preimplementation-challenge.md)
- Predecessor: [`SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md`](SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md), [`../Evidence/SK-EVID-023-cp11-gatherer-combat-runtime-verification.md`](../Evidence/SK-EVID-023-cp11-gatherer-combat-runtime-verification.md), and [`../Validation/36-cp11-gatherer-combat-runtime-cross-functional-audit.md`](../Validation/36-cp11-gatherer-combat-runtime-cross-functional-audit.md)

## Evidence status

- Verified predecessor: GATHERER contact, deterministic combat, cargo destruction, same-identity
  respawn, schema-v5 encounter persistence, rollback, duplicate replay, and file-backed restart.
- Accepted contract: HUNTER/SWORD tier-one stats, five-round victory, no direct reward, and normal
  return/deposit semantics.
- Verified: HUNTER dispatch, role-aware combat persistence, monster deactivation, no-teleport victory
  return, zero-cargo settlement, target reservation, rollback, and file-backed restart are covered by
  [`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
  and [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md).
- Unknown: automatic danger-cell reissue, browser projection, Agent Signal/Re-entry delivery, default
  scheduler, hosted continuity, and production balance.

## Verification and closure target

- Minimum verification: Red/Green focused HUNTER tests for dispatch and role lock, route arrival without
  extraction, contact and initiative, rounds 1–5, terminal event order, monster `DEAD` state, no cargo/
  coin/death effects, return navigation/home crossing, zero-cargo completion, duplicate/stale/owner/
  race/rollback/restart, and the CP-11 GATHERER regression; then CP-09, CP-10, typecheck, build, and
  documentation gates. This minimum is complete for the named local scope.
- Closure target: `runtime_verified` for the local worker-owned HUNTER victory and return boundary,
  recorded in a new evidence record and cross-functional audit.
- Rollback or remediation: Any failed transition leaves encounter, monster, mission, attempt, soldier,
  cargo, wallet, events, and idempotency unchanged and retryable with the same logical key.
- Reopen trigger: Any contract/schema/event change, a new reward ledger, a discovery authority, a
  teleport or alternate worker owner, or a requirement for automatic reissue/PvP/siege/Re-entry/
  hosted scheduling to enter this transaction.
