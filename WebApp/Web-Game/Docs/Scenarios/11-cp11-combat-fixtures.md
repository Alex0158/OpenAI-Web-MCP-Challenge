# CP-11 Monster Combat, Cargo Loss, and Respawn Fixtures

**Status:** Local level-4 runtime fixture verified; browser, WebMCP, Re-entry, scheduler, and hosted gates remain separate  
**Checkpoint:** CP-11  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-11 danger-cell reissue runtime audit](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md)  
**Task:** [SK-TASK-036](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md)  
**Purpose:** Prepare the deterministic seeded-monster encounter, combat, cargo-loss, same-identity respawn, and bounded reissue boundary.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-10 and CP-08.
- Owning authority: detail-12-monster-state-and-targeting.md, detail-13-encounter-and-combat-resolution.md, detail-06-soldier-identity-and-lifecycle.md, and contract sections 3, 4, 5, and 6.
- Cross-functional handoff: CP-08 supplies positions/sensors/routes; CP-09 supplies role/tool/attempt; CP-10 supplies cargo; CP-12 explains formula and cause; CP-14 uses CargoLostToMonster; CP-19 may reuse the encounter ledger.
- Scope: Contact locking, deterministic rounds, monster state, cargo destruction, same-identity respawn, one-budget danger-cell reissue, event explanation, and CP-12/14/19 handoffs.
- Non-goals: PvP, siege, party aggregation, random combat, new species, production balance, migration, breach conversion, shelter defense, WebMCP, Re-entry delivery, or hosted deployment.

## Evidence classification

- Verified inputs: Inclusive contact radius, one resolving encounter per participant, one round per integer world second, initiative and entity-id tie-breaks, accepted formula and G2 values, normal monster continuation, cargo destruction without killer reward, same-identity respawn, and the one-budget reissue/review boundary.
- Runtime fixture result: The fixed Rock route records `NO_SAFE_REISSUE_ROUTE` because its target is inside the forbidden danger neighbourhood; a separate reachable-target fixture proves deterministic detour and the second-death `REPEATED_MONSTER_DEATH` stop.
- Open fields: encounter lock receipt fields, post-kill monster state beyond the seeded patrol, future random or critical-hit policy, PvP and party modifiers.

## Vectors

### C11-01 — Gatherer loses

**Given:** A gatherer reaches the seeded monster after at least one extraction milestone.  
**When:** The contact locks and deterministic rounds resolve.  
**Then:** The gatherer loses under the accepted formula, exposed cargo is destroyed once, the same soldier respawns, and the one reissue budget is consumed by either a safe reissue or a typed review stop.

### C11-02 — Hunter wins

**Given:** A hunter follows the same seeded route with the accepted sword loadout.  
**When:** Five deterministic rounds or the documented terminal condition resolve.  
**Then:** The monster is defeated, the hunter survives, no third resource or direct coin reward is created, and the monster identity is settled once.

### C11-03 — Contact blocks extraction

**Given:** A gatherer has extraction due at the same integer boundary that post-movement contact reaches one tile.  
**When:** The worker applies the accepted phase order.  
**Then:** Contact locks before extraction; combat then resolves in its own phase.

### C11-04 — One participant, one encounter

**Given:** Two detection paths attempt to lock the same soldier and monster.  
**When:** Both lock requests race.  
**Then:** Only one encounter claims the participants; the other receives a typed conflict without a second combat.

### C11-05 — Duplicate round or terminal delivery

**Given:** A round or terminal settlement is delivered twice.  
**When:** The worker handles the duplicate event or retry.  
**Then:** Formula inputs, HP, cargo, death, reward, and event cursor advance once.

### C11-06 — Danger-cell reissue

**Given:** The gatherer dies and has one repeatable mission budget remaining.  
**When:** Respawn and reissue settle.  
**Then:** A new attempt keeps role and target, records the danger cell, and uses one bounded route replan when a safe route exists; otherwise the mission enters typed review.

### C11-07 — Repeated death stops

**Given:** The reissued attempt dies again before successful deposit, or no safe route exists.  
**When:** The bounded policy is exhausted.  
**Then:** The soldier remains home in WAITING_REVIEW with a typed reason and no further automatic loop.

### C11-08 — Death versus deposit

**Given:** A returning soldier has not crossed home when a combat round is due.  
**When:** The accepted same-second order resolves.  
**Then:** No deposit occurs before the authoritative crossing; death and cargo outcome remain causal.

### C11-09 — Monster remains normal

**Given:** The monster kills a soldier without a breach.  
**When:** Cargo loss and respawn settle.  
**Then:** The monster remains under its normal state machine and is not removed or rewarded by the cargo-loss event.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- encounter lock receipt fields;
- post-kill monster state;
- reissue scheduling and safe-route result;
- future random or critical-hit policy;
- PvP and party modifiers;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture now records a local worker runtime result for the CP-11 reissue boundary. It does not
prove browser, slice, WebMCP, Re-entry, hosted, or judge reproduction and does not authorize code
outside its checkpoint.
