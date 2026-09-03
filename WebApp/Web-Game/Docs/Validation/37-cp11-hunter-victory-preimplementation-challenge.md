# CP-11 Hunter Victory and Return Pre-Implementation Challenge

**Status:** PRE-IMPLEMENTATION CHALLENGE; implementation result recorded in Validation 38 and
Evidence 024  
**Checkpoint:** CP-11  
**Task:** [`SK-TASK-035`](../Tasks/SK-TASK-035-cp11-hunter-victory-and-return.md)  
**Predecessor:** [`SK-TASK-034`](../Tasks/SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md)  
**Governing contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)  
**Proposed decision:** [`../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md)

## Purpose

Close the second side of the first CP-11 contrast: a HUNTER can be dispatched to the seeded monster,
arrive through the same server-owned route boundary, win the deterministic encounter, deactivate the
monster exactly once, and return to its shelter without a teleport, reward leak, or orphaned mission.
The gatherer-loss transaction remains the predecessor and must keep its event and cargo behavior.

## Current gap and authority

The `SK-MVP-0.2` contract already accepts the HUNTER/SWORD loadout and the five-round victory values,
but the implemented CP-11 path currently accepts only GATHERER rows. The route-arrival, return, and
deposit handlers also validate GATHERER explicitly. Without a bounded HUNTER extension, a victory
would either leave a field soldier without a valid mission lifecycle or require an unsafe teleport.

The server/worker remains authoritative for target identity, route, position, HP, damage, monster
state, mission phase, revisions, events, and idempotency. The browser, projection, WebMCP, Agent
Signal, and Re-entry surfaces are consumers and are not part of this task.

## Recommended boundary

1. **Target and dispatch.** A HUNTER command may target only the active seeded monster identity. The
   server reads the monster's fixture position and plans the route; the client cannot submit target
   coordinates. The local slice does not add an intelligence table or a discovery gate to this
   command. Future visibility may decide which legal target ids a page can present.
2. **Role and return policy.** HUNTER requires `SWORD`, equipment tier `1`, and stores
   `return_policy = ON_RECALL` because it has no extraction cargo. A missing policy defaults to
   `ON_RECALL`; another policy is rejected rather than silently rewritten.
3. **Contact and combat.** Contact uses the existing inclusive Euclidean radius and one active
   encounter per participant. The existing GATHERER result shape remains stable; a typed HUNTER
   result records the HUNTER actor names and damage while retaining the same formula and event
   envelope. The accepted values make the HUNTER act first, deal `18` damage, receive `9`, and defeat
   the monster on round five.
4. **Victory transaction.** The terminal combat transaction changes the encounter to `RESOLVED` with
   `MONSTER_DEFEATED`, changes the monster row to inactive `DEAD` while retaining its identity for
   history, clears the mission encounter link, and moves the mission and attempt to `RETURNING`.
   The HUNTER stays `FIELD` with the same role/tool and immutable outbound route. It emits
   `BattleRoundResolved`, `EncounterResolved`, and `MonsterDefeated` in that order. No cargo loss,
   coin, third resource, soldier death, or respawn event is created.
5. **Return and completion.** The existing reverse-route and exact home-crossing handlers are
   generalized to HUNTER. At home, a zero-cargo settlement reuses `MissionHomeReached` and
   `CargoDeposited` with an explicit `settlementReason = HUNTER_VICTORY`, then releases the same
   soldier and terminalizes the mission attempt. No `CoinsCredited` event is emitted for an empty
   cargo list. This preserves elapsed travel time and avoids a new completion event in G2.
6. **Reissue and external delivery.** Automatic danger-cell reissue, repeated-death review, monster
   drops, Agent Signals, Re-entry, browser presentation, the default all-phase scheduler, and hosted
   behavior remain separate gates.

## Cross-functional challenge

| Surface | Invariant to preserve | Failure if missed | Required proof |
|---|---|---|---|
| Dispatch and identity | One resident soldier, one fresh attempt, seeded monster id, server-derived route | HUNTER cannot start or can target hidden/arbitrary coordinates | positive dispatch, wrong role/tool/tier/policy, stale/owner/duplicate cases |
| Route and clock | Arrival uses the same fixed-step boundary; HUNTER does not arm extraction | Hunter is treated as a gatherer or combat starts before arrival | arrival at due marker, no extraction due marker, restart before arrival |
| Contact and uniqueness | Monster and soldier can be claimed by only one active encounter; the seeded monster has at most one active HUNTER reservation | Two hunters create two victories or a gatherer is double-claimed | same-monster race, duplicate contact, and reservation release after completion |
| Formula and event history | HUNTER values are server-derived and round five is terminal | Client-selected damage or misleading actor names | pure formula vector, four non-terminal rounds, lethal first strike |
| Victory settlement | Encounter, monster state, mission link, and events commit atomically | Monster resurrects, reward appears, or mission is orphaned | exact event order, revisions, rollback after state/events |
| Return and deposit | No teleport; reverse route and exact home crossing remain authoritative | Soldier is marked home while still in the field | return position, home arrival, zero-cargo terminal settlement |
| Persistence/restart | Resolved monster and active return survive process replacement | Duplicate victory or lost return | restart before/after victory and duplicate terminal keys |
| Economy/signals | No coins, cargo, or per-round wake is fabricated | Hunter victory changes income or overloads Re-entry | wallet/cargo unchanged, no `CoinsCredited`/`CargoLostToMonster`, no delivery call |
| UI/capability | History has role, tool, formula, cause, and next phase for future projection | Dashboard cannot explain the contrast | payload/read-model fixture; no browser claim in this task |

## Required vectors

- `H01` HUNTER dispatch to the seeded monster uses the server fixture position, SWORD tier 1, and
  `ON_RECALL`; a resource target, hidden coordinate, wrong tool, wrong tier, and other return policy
  fail without partial state.
- `H02` arrival changes the mission to `WORKING` with no extraction due marker and preserves role/tool.
- `H03` contact locks once, and the first round resolves at the same integer boundary with
  `firstActor = HUNTER` and the accepted `18/9` damage.
- `H04` rounds 1–4 are non-terminal; round 5 resolves the monster, leaves HUNTER HP at `64` because
  the lethal first strike suppresses the monster's second strike, and
  records the three victory events exactly once.
- `H05` the terminal transaction leaves the monster inactive, mission/attempt in `RETURNING`, the
  same soldier in `FIELD`, no cargo mutation, no coins, and no respawn.
- `H06` reverse navigation reaches the exact home anchor, then zero-cargo home settlement releases
  the soldier and terminalizes the attempt with no coin event.
- `H07` changed-request, stale-revision, cross-owner, concurrent, rollback, and restart retries do
  not duplicate the monster death, event cursor, or mission completion; a second active HUNTER cannot
  reserve the same seeded monster and the reservation is released only after completion.
- `H08` a prior GATHERER loss trace remains green and still emits the five-event loss sequence.

## Stop and reopen conditions

Stop before implementation if HUNTER victory requires a new contract version, an actor-wide health
schema, a new settlement ledger, a second worker authority, or a browser/external dependency. Reopen
if target discovery, monster state, return semantics, event vocabulary, or zero-cargo settlement is
changed by a later accepted decision.

This challenge remains the historical planning and contradiction check. The local implementation result
is recorded in [`38-cp11-hunter-victory-runtime-cross-functional-audit.md`](38-cp11-hunter-victory-runtime-cross-functional-audit.md)
and [`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md).
Those records prove only the named local boundary; they do not prove browser capability, Re-entry
delivery, hosted continuity, or final game balance.
