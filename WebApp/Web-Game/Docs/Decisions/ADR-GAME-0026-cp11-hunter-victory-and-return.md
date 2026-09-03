# ADR-GAME-0026: CP-11 Hunter Victory and Return

**Status:** ACCEPTED LOCAL CP-11 EXTENSION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-035`, seeded HUNTER dispatch, deterministic monster victory, and route-preserving return  
**Related challenge:** [`../Validation/37-cp11-hunter-victory-preimplementation-challenge.md`](../Validation/37-cp11-hunter-victory-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md), [`ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md), and [`ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)

## Context

The accepted G2 contract contains both sides of the seeded combat contrast. CP-11's first bounded
implementation proves only the GATHERER-loss side and deliberately rejects HUNTER rows in its
specialized handlers. Enabling HUNTER only at contact would leave a victorious soldier at a field
cell with no valid return or mission terminal state. The extension must reuse the existing identity,
clock, route, encounter, event, and settlement boundaries without reopening the gatherer-loss proof.

## Decisions

### 1. Dispatch the seeded monster through a server-derived route

The local HUNTER command accepts only the seeded monster id while its persisted row is active. The
server reads the fixture's current seeded position and creates the open-grid route from the owning
shelter. No client route or coordinate is accepted. This increment does not add a durable intelligence
record or discovery gate; visibility remains a later projection/capability concern and the command
cannot target arbitrary monsters or resources.

HUNTER requires the tier-one `SWORD` loadout and stores `ON_RECALL` as its no-cargo return policy.
An omitted policy defaults to `ON_RECALL`; an explicit incompatible policy is rejected. The role,
tool, target, and route remain locked after dispatch.

### 2. Reuse contact and add a typed HUNTER round

The contact phase includes active HUNTER attempts and retains the inclusive one-tile Euclidean test,
one active encounter per soldier/monster, and the existing contact idempotency key. A HUNTER contact
uses the same initial HP and structured encounter row as the GATHERER path. The combat rules add a
typed HUNTER resolution while preserving the existing GATHERER payload shape and event history.

The same seeded monster may have at most one active HUNTER reservation. MissionService rejects a
second active HUNTER attempt, and PersistenceStore repeats the ownership check in the dispatch
transaction so concurrent commands cannot both reserve the target. The reservation remains while the
HUNTER mission is active, including `RETURNING`, and is released only when that mission completes.
GATHERER passive contact keeps its existing participant uniqueness rule; broader cross-role target
arbitration remains outside this increment.

The accepted formula and values remain:

```text
damage = max(1, attack + weapon_power + matchup_bonus - defense)
```

The HUNTER deals `12 + 4 + 4 - 2 = 18` and the monster deals `12 + 0 + 0 - 3 = 9`. HUNTER initiative
`5` acts before monster initiative `4`; the seeded monster reaches zero on round five and the
HUNTER remains at `64` HP because the monster does not receive a second strike after the lethal
first strike. No random, party, client, or hidden modifier is introduced.

### 3. Settle victory and deactivate the monster in one transaction

The terminal HUNTER round commits these state changes atomically:

- encounter `RESOLVING -> RESOLVED`, terminal cause `MONSTER_DEFEATED`, and no next due marker;
- monster `PATROL -> DEAD`, retaining the row and stable id for historical reads while removing it
  from active targeting;
- mission and attempt encounter linkage cleared, phase `WORKING -> RETURNING`, state still active,
  next due marker null, and last transition time set to the victory world time; and
- the same soldier remains `FIELD` with HUNTER/SWORD and its existing work identity.

The event order is `BattleRoundResolved`, `EncounterResolved`, `MonsterDefeated`. No cargo row is
deleted or created, no coin or third-resource ledger is changed, and no `SoldierDied`,
`SoldierRespawned`, or `CargoLostToMonster` event is emitted. Duplicate victory keys replay the stored
result; a stale, malformed, cross-owner, or injected failure leaves every row and event unchanged.

### 4. Return by elapsed route and finish with zero-cargo settlement

Victory starts normal reverse-route travel from the engagement cell. It does not teleport, reset the
world clock, or bypass a possible future encounter. The existing return and exact home-crossing
transactions accept both GATHERER and HUNTER while preserving their role/tool/target linkage.

At `DEPOSITING`, the existing settlement transaction accepts an empty HUNTER cargo list and emits
`CargoDeposited` with `items = []`, `totalQuantity = 0`, `totalCapacityUsed = 0`, `coinDelta = 0`, and
`settlementReason = HUNTER_VICTORY`; it emits no `CoinsCredited`. The soldier returns to `AT_SHELTER`,
the mission is completed, and the attempt becomes terminal history. This reuses the G2 event vocabulary
and gives the future dashboard a clear completion reason without inventing a reward.

### 5. Keep later loops outside this extension

Automatic danger-cell reissue, repeated-death review, monster drops, pursuit/retreat, PvP, siege,
party aggregation, browser/Canvas projection, WebMCP, Re-entry delivery, the default all-phase
scheduler, hosted continuity, and balance tuning remain separate tasks. This ADR does not change
`SK-MVP-0.2` or the schema version.

## Alternatives rejected

- Marking the soldier `AT_SHELTER` immediately after victory was rejected because it teleports across
  the world and contradicts the accepted return/navigation boundary.
- Leaving the HUNTER in `WORKING` after the monster dies was rejected because it creates an orphaned
  target and blocks a valid next command.
- Creating a new reward or world-drop ledger was rejected because G2 explicitly clears the seeded
  threat without direct value.
- Reusing GATHERER-named round fields for HUNTER without a typed role variant was rejected because the
  causal history would mislabel actor order and damage.
- Adding a general scheduler or intelligence schema was rejected because it expands the checkpoint
  beyond the smallest coherent victory and return slice.

## Consequences and reopen triggers

The first local trace can demonstrate a meaningful role contrast: the pickaxe gatherer risks cargo
loss while the sword hunter clears the same threat, then spends real world time returning home. The
monster's stable dead row and ordered events are replayable, and the existing CP-10 return/deposit
identity can be reused without a teleport or a new currency path.

Reopen if the contract changes the HUNTER formula or loadout, requires an intelligence/discovery
authority, introduces a new completion event, needs actor-wide health, or changes the return or
settlement owner. This remains a local worker boundary and does not prove browser, Agent, Re-entry,
hosted, or judge behavior.

## Verification target

The implementation must use focused Red/Green tests for dispatch, arrival, contact, five-round
victory, no-cargo/no-coin settlement, duplicate/stale/ownership/race/rollback paths, restart between
victory and home, and the CP-11 GATHERER regression. Closure requires local level-4 process evidence,
the cross-functional audit, documentation validation, and exact claim limits.
