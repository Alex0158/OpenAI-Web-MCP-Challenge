# CP-05 to CP-19 Tiered Audit

**Role:** Validation record produced by a tiered independent review  
**Status:** CLOSED WITH DISPOSITIONS; CP-05 runtime findings resolved and CP-06 inputs accepted  
**Date:** 2026-09-02  
**Scope:** CP-05 local closure, CP-06 and CP-07 next, and a structural pass over CP-08 to CP-19  
**Audience:** Reviewer asked to answer, refine, and optimize the findings below

## 1. Purpose and tiering

The owner asked whether the CP-05-onward preparation meets an engineering-grade standard. The review
was deliberately tiered rather than applied uniformly, because uniform depth would have optimized
documents that later runtime facts will rewrite.

| Tier | Scope | Depth | Reason |
|---|---|---|---|
| 1 | CP-05, CP-06, CP-07 | Deep, including the running code and tests | CP-05 closure and its handoff are verified; CP-06 owns the world clock that every later checkpoint inherits; CP-07 owns the fixture the demo trace depends on |
| 2 | CP-08 to CP-19 | Structural only | Cross-checkpoint contract binding, vocabulary consistency, and places where planning precision runs ahead of proven capability |
| 3 | CP-13 to CP-18 logic and precision | Deferred | These depend on the capability recorded as unavailable in [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md) and on facts CP-09 through CP-12 have not yet produced |

This document is a finding record. It is not an authority and cannot change a rule.

## 2. Method and what was executed

Documents read in full: the current contract sheet, `SK-TASK-005`, `SK-TASK-006`, `SK-TASK-007`,
`SK-TASK-010`, `SK-ISSUE-001`, `SK-ISSUE-004`, `Scenarios/06`, `Scenarios/07`, and the mechanism
detail files for the clock, navigation, and monster.

Code and tests read: `src/server/entrypoint.ts`, `src/server/world-worker.ts`, and
`tests/cp05-persistence.test.ts`.

Commands executed in the original review session:

```sh
npm run test:cp04     # 5 passed, 0 failed
npm run test:cp05     # Red at the time: ERR_MODULE_NOT_FOUND for src/server/persistence/store
```

That was the expected Red state when this audit was written. CP-05 was subsequently implemented and
closed with the focused and transitive results in [`../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).

Arithmetic was recomputed independently for the seeded demo route, the combat table, and the
protected-start interaction. Results are in section 6.

## 3. Verdict

The preparation was materially better than the previous audit. The two blocking value gaps found
earlier are closed, the event vocabulary is closed with explicit retirement markers, and the Domain
Event versus Agent Signal separation resolves the earlier Re-entry timing tension. The five Tier 1
findings below have now been dispositioned: four are closed by CP-05 implementation/evidence and the
remaining clock/recovery ambiguity is closed by ADR-GAME-0012 as the CP-06 input contract. Tier 2
documentation hygiene findings remain ordinary follow-up work for their owning packs.

## 4. Tier 1 findings

The evidence bullets under the resolved findings preserve what was observed when this audit first ran.
They are historical inputs to the disposition, not current claims that the implementation is still
missing. Current runtime truth is bounded by the CP-05 task and `SK-EVID-008`.

### T1-01 — RESOLVED: `world_time` precision is now explicit

**Evidence.**

- The contract's movement and boundary table gives rates in tiles per world second, and section 3
  states that movement and visibility reconcile at 100 ms while milestones settle on integer
  world-second boundaries. Neither section states the type or precision of `world_time` itself.
- `Scenarios/06-cp06-clock-recovery-fixtures.md`, vector C06-01, advances "through 100 ms
  reconciliation steps up to `1000.9`" and asserts that `world_time` never moves backwards. This is
  the only fractional `world_time` value anywhere in the tree, and it reads as though `world_time`
  takes the value `1000.9`.
- `tests/cp05-persistence.test.ts` uses integer values only: `worldTime: 0` and `worldTime: 1`.
- `SK-TASK-005` requires persistence to reject a world-time regression against the persisted world
  row, without stating the compared type.

**Why it mattered then.** CP-05 was choosing the column type, the regression comparison, and the
cooldown comparison. An integer column makes C06-01 unimplementable as written. A real column changes
regression semantics to a float comparison and changes how the 60-world-second cooldown boundary is
compared.

**Most likely intended resolution, which is not written down anywhere.** `world_time` is authoritative
integer world seconds; sub-second reconciliation is a process-local interpolation for projection only
and is never persisted or placed in an event envelope. If that is the intent, C06-01's wording is a
specification defect that would mislead a CP-06 implementer.

**Disposition.** [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
and the contract now define non-negative integer world seconds. C06-01 uses `1000.9` only as a
projection position; fractional time is never persisted or emitted in an event envelope.

### T1-02 — RESOLVED: combat initiative vocabulary is explicit

**Evidence.** The contract's movement table closes with "Combat `initiative_speed` remains separate
from every movement-rate field." The combat section it governs still reads "Higher `speed` acts
first. Equal speed uses ascending `entity_id`", and its actor table still uses a column headed
`Speed` with values 3, 5, and 4.

**Why it mattered then.** The earlier audit's finding was that `speed` was overloaded between combat
initiative and movement rate, with overlapping values. The naming rule now exists, but the table it
applies to was not renamed, so the ambiguity survives in exactly the place an implementer reads it.
The gatherer's combat `Speed` of 3 and the soldier movement rate of 3.0 remain numerically identical.

**Disposition.** The contract table and prose now use `initiative_speed`; movement speed remains a
separate field.

### T1-03 — RESOLVED: shutdown close failure and listener order

**Evidence.** `SK-ISSUE-004`'s ordering claim is confirmed against `src/server/entrypoint.ts`: the
shutdown path calls `worker.stop()` and awaits its race before it reaches `closeServer()`.

Three consequences the issue does not name:

1. The shutdown body is an `async` IIFE with **no `try`/`catch`**. If `worker.stop()` rejects and its
   rejection wins the race, the awaited `Promise.race` throws, so `closeServer()`,
   `registry.markStopped()`, and the `runtime_stopped` log are all skipped and `shutdownPromise`
   itself rejects. The process is left with an open listener **and** a registry that never reaches
   `stopped`.
2. If the timeout branch wins the race and `worker.stop()` rejects afterwards, the derived promise
   `workerStop.then(() => false)` carries no rejection handler, producing an unhandled rejection.
3. `WorldWorkerOptions` in `src/server/world-worker.ts` exposes `failStart`, `startDelayMs`, and
   `stopDelayMs`, but **no `failStop`**. There is currently no way to write the rejecting-close test
   that `SK-TASK-005` requires, which states the worker must close the store before its stop promise
   resolves and that a store-close failure must become a typed shutdown result.

**Why it mattered then.** `SK-TASK-005` wires the persistence store close into exactly this path and
requires proof of the rejecting-close case. The test hook needed to produce that case does not exist.

**Disposition.** CP-05 added the listener-first shutdown and typed close result, and the rejecting
close path is verified in `SK-EVID-008`. [`SK-ISSUE-004`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md)
is resolved; later lifecycle work must preserve the single entrypoint owner.

### T1-04 — RESOLVED: CP-05 verification coverage is recorded

**Evidence.** `tests/cp05-persistence.test.ts` contains five tests: bootstrap with WAL, foreign keys
and versions; refusal of a newer schema; one-transaction atomicity with idempotency and cursor
ordering; rollback leaving no partial rows; and world-time regression plus a snapshot cursor gap.

`SK-TASK-005`'s "Minimum verification" names roughly thirty required checks, including Signal
aggregation, active-slot uniqueness, cooldown and deferred-cursor merge, slot versus delivery
authority, lease, retry and terminal transitions, duplicate delivery, retry after acknowledgement,
wall-time lease reclaim, active work and next-due persistence, generation metadata, migration
rollback, empty-world and missing-snapshot handling, no-grant history-only handling, cross-world and
visibility isolation, store-open readiness, and clean close and reopen.

**Assessment at review time.** This was correct for the first increment, which the task explicitly scopes to
"schema/bootstrap". It becomes a risk only if closure is claimed against the current suite.

**Disposition.** The task records the original coverage gap and closure target. The final CP-05 suite
contains 26 focused tests, plus five CP-04 transitive tests, typecheck/build, and a production-like
health/shutdown smoke; exact claim limits remain in `SK-EVID-008`.

### T1-05 — RESOLVED: CP-06 recovery budget is accepted

**Evidence.** Vector C06-10 states that "The exact numeric production cap is intentionally not
invented by this fixture" and requires the worker to follow "the explicit typed limit/recovery
outcome selected by CP-06". `detail-01-world-clock-and-continuity.md` lists the "production catch-up
cap" under its open decisions, which frames it as production work rather than a G2 requirement.

**Why it mattered then.** A judge or reviewer run can leave the worker down for an arbitrary interval. Without a
selected G2 behavior, restart after a long absence has no defined outcome, and CP-06 has no value to
implement against while its own fixture declines to supply one.

**Disposition.** [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
assigns CP-06 `MAX_RECOVERY_WORLD_SECONDS = 300`. A 301-second gap returns
`RECOVERY_LIMIT_EXCEEDED`, preserves durable truth, closes the world mutation gate, and remains
observable without claiming a recovered world.

## 5. Tier 2 structural findings

### T2-01 — the later packs bind to the contract in prose rather than by resolvable link

**Evidence.** `SK-TASK-005`, `SK-TASK-006`, and `SK-TASK-007` link the contract with section anchors.
`SK-TASK-008` through `SK-TASK-019` name neither `SK-MVP-0.2` nor, in most cases, a link to the
contract sheet. `SK-TASK-010` is representative: its owning authority reads "contract sections 5 and
7" as plain text.

**Why it matters.** The documentation validator can check a link and cannot check prose. A contract
section renumber would silently invalidate twelve packs, and the packs would still pass every gate.

**Recommendation.** Convert the prose references to anchored links, and name the contract version the
pack was prepared against.

### T2-02 — the two packs that carry the competition thesis do not cite the issue that blocks them

**Evidence.** `SK-TASK-013` and `SK-TASK-014` contain zero references to `SK-ISSUE-001`, which is
`pending` and records that the current adapter cannot enumerate or invoke a registered page tool.
Both packs are otherwise fully specified.

**Why it matters.** A reader of either pack cannot see that its central capability is unproven. This
is the specific case where planning precision runs ahead of proven capability.

**Recommendation.** Add the dependency to both packs, and keep the Tier 3 deep review deferred until
the issue closes.

### T2-03 — the CP-07 fixture does not pin the contract version it encodes

**Evidence.** `Scenarios/07-cp07-deterministic-world-fixture.md` links the contract sheet but is the
only one of the thirteen new scenarios that does not name `SK-MVP-0.2`.

**Assessment.** The geometry it encodes is correct for the current contract; see section 6. The
finding is that nothing pins it, so a future geometry revision could leave the fixture stale without
any gate detecting it.

## 6. Independently verified as sound

The following were recomputed or re-executed in this session and are confirmed. They should be
preserved through any change answering the findings above.

### The two earlier blocking value gaps are fully closed

The contract's movement and boundary table now supplies every value the earlier audit found missing:
player and soldier movement rates, monster patrol and chase rates, engagement radius, soldier sensor
radius, monster detection radius, shelter sensing radius, player fog reveal radius, and the
protected-start radius, with an explicit inclusive comparison rule.

### The event vocabulary is closed, not merely renamed

The retired names `SoldierEncountered` and `BattleResolved` now appear only in statements that mark
them retired, and `CargoLooted` is explicitly reserved for post-G2 PvP. A scan of every new scenario
found no event name outside the contract's G2 list.

### The seeded demo route works, and this appears to be the first time the arithmetic was checked

`Scenarios/07` states the route "should bring the monster into detection/contact after at least one
extraction milestone" and "must be validated". No document in the tree contains that validation. It
was computed here from the contract values.

Gatherer, from Shelter A at `(16,64)` to Rock A at `(34,64)`, a distance of 18 tiles at 3.0 tiles per
world second, arrives at world time 6.0. Extraction at one unit per two world seconds gives
milestones at 8.0, 10.0, 12.0, and 14.0.

Monster, from `(48,64)` along `(48,72)`, `(40,72)`, `(40,64)`, `(34,64)` at the patrol rate of 2.0
tiles per world second, covers segments of 8, 8, 8, and 6 tiles, reaching each corner at world times
4.0, 8.0, 12.0, and 15.0.

On the `(40,72)` to `(40,64)` segment the monster's closest approach to the stationary gatherer is
6.0 tiles, which exceeds the 5.0 detection radius, so no detection occurs there. On the `(40,64)` to
`(34,64)` segment the separation is `6 - 2(t - 12)`, so detection at 5.0 tiles occurs at world time
12.5. Chase then applies at 4.0 tiles per world second against a stationary target, closing the
remaining 4.0 tiles to the 1.0 engagement radius in 1.0 world second.

**Contact locks at approximately world time 13.5, after three completed extraction milestones, with
three Rock units exposed.** The contract's requirement holds with margin, and the cargo is lost before
the pack fills at world time 16.0.

The protected start does not interfere: the gatherer is 18 tiles from its shelter, outside the
inclusive 12.0-tile radius, and the contract states the shield does not protect a field soldier
outside the radius.

### The combat table is internally consistent

Applying `damage = max(1, attack + weapon_power + matchup_bonus - defense)` to the contract's actor
table reproduces every stated result. The hunter deals `max(1, 12 + 4 + 4 - 2) = 18` and defeats the
80 HP monster in five rounds. The monster deals `max(1, 12 - 3) = 9` to the hunter, which with hunter
initiative 5 against monster 4 leaves the hunter at 64 HP. The gatherer deals `max(1, 8 - 2) = 6` and
receives `max(1, 12 - 2) = 10`, dying in ten rounds while the monster survives at 26 HP. The intended
role contrast holds exactly as documented.

### The process and persistence foundations are real

The original review observed CP-04's 5-test pass and CP-05's correct Red state before implementation.
The subsequent closure record reports 26 CP-05 tests, five CP-04 transitive tests, typecheck/build,
and a production-like file-backed start/health/SIGTERM smoke on Node.js `v24.18.0`; see
[`../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).
Those results prove the local persistence seam and lifecycle path within their stated claim boundary,
not the world clock, gameplay, hosted continuity, WebMCP discovery, or external Agent delivery.

### The preparation packs use the closure vocabulary honestly

Every CP-06-onward pack carries lifecycle `verified` with closure type `specified`; CP-06 now also
names the accepted integer-time and 300-second recovery inputs while stating that runtime code has
not started. That is the correct use of the two-field model and does not overclaim.

## 7. Deferred scope

Tier 3, the logic and precision review of CP-13 through CP-18, is deliberately not performed. Those
packs depend on the capability recorded as unavailable in `SK-ISSUE-001` and on seam facts that
CP-09 through CP-12 have not yet produced. Reviewing them at engineering-grade precision now would
optimize documents that later evidence is likely to rewrite.

The recommended trigger for Tier 3 is the closure of `SK-ISSUE-001` plus verified CP-12.

## 8. Disposition and remaining follow-up

| Finding | Current disposition |
|---|---|
| T1-01 | Closed by the integer `world_time` contract, projection-only interpolation, and corrected C06-01 in ADR-GAME-0012 and the linked core docs. |
| T1-02 | Closed by the `initiative_speed` vocabulary update in the contract. |
| T1-03 | Closed by the listener-first, typed-close implementation and `SK-ISSUE-004` resolution, with local runtime proof in `SK-EVID-008`. |
| T1-04 | Closed by the recorded 26-test CP-05 suite, transitive checks, and explicit claim boundary in the task/evidence record. |
| T1-05 | Closed by the accepted 300-second CP-06 budget and typed `RECOVERY_LIMIT_EXCEEDED` outcome in ADR-GAME-0012. |
| T2-01 | Documentation follow-up: convert later task prose contract references to anchored links with a named version. |
| T2-02 | Documentation follow-up: link `SK-TASK-013` and `SK-TASK-014` to the pending WebMCP capability issue before their implementation gates. |
| T2-03 | Documentation follow-up: pin `SK-MVP-0.2` in `Scenarios/07`. |

The Tier 2 items do not block CP-06 implementation, but their owning task records must be reconciled
before those later checkpoints enter implementation. The CP-07 route arithmetic remains a fixture
verification target and must be promoted into its own runtime evidence when CP-07 starts.

## 10. Reopen and closure

This audit is closed for the current CP-05 handoff: every Tier 1 finding has a recorded disposition,
and Tier 2 items have named documentation follow-up. Reopen it when the contract version changes,
when CP-05 or CP-06 runtime evidence contradicts an assumption above, or when `SK-ISSUE-001` closes
and Tier 3 becomes due.

Current application status remains as recorded in [`../00-current-status.md`](../00-current-status.md).
This audit is a document and source review plus the original two test commands; later runtime claims are
referenced only through `SK-EVID-008`. It is not gameplay, capability, or hosted evidence.
