# CP-19 to CP-26 Post-G2 Expansion Preflight

**Role:** Future-scope readiness review for full-game expansion after the G2 vertical slice  
**Status:** PRE-FLIGHT ONLY; no expansion contract is accepted and no runtime implementation is authorized by this record  
**Date:** 2026-09-02  
**Scope:** CP-19 through CP-26 from the development roadmap  
**Current contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Critical-path preparation:** [CP-10/18 audit](10-cp10-cp18-preimplementation-audit.md)
**Task registry:** [SK-TASK-019](../Tasks/SK-TASK-019-post-g2-expansion-preflight-registry.md)

## 1. Purpose and decision posture

This record reviews every post-G2 checkpoint one by one so that useful research, evidence requests,
and dependency checks can start without turning the original full-game concept into premature runtime
scope.

CP-19 through CP-26 are deliberately different from CP-10 through CP-18:

- they depend on a verified G2 slice and real play data;
- several of their values affect settlement, human consequences, fairness, or production scale;
- the current G2 contract explicitly excludes them; and
- their preparation must keep open choices visible instead of inventing prices, caps, population,
  reward shares, or balance.

The correct present action is a preflight registry, not implementation. The individual checkpoint
tasks should be created or activated only after the named predecessor and decision gates pass.

The detailed Phase 7 dependency table in the roadmap controls activation. The roadmap flowchart shows
broad delivery order; it does not add CP-17 or CP-18 as blockers for CP-19 when the detailed table names
CP-11 and CP-16. Hosted and reviewer evidence remains required for the claims that depend on it.

## 2. Shared expansion gates

Every expansion checkpoint must satisfy these gates before code:

1. Name the owning mechanism, chain, capability, contract section, and event/identity impact.
2. Reuse the G2 authority, revision, idempotency, world-time, and ledger boundaries unless a new ADR
   and contract version are accepted.
3. Provide a concrete scenario with positive, negative, boundary, race, replay, and recovery cases.
4. Define the human consequence boundary for destructive, irreversible, or high-value actions.
5. Demonstrate no duplicate cargo, coins, rewards, soldiers, events, or leaderboard value.
6. State the evidence level required: local, slice, hosted, or judge reproduction.
7. Leave a reversible rollback or feature-gate path and an executable reopen trigger.
8. Do not add content or population until measured performance and fairness budgets exist.

## 3. CP-19 PvP field encounters and cargo transfer

**Roadmap scope:** PvP field encounters, initiative/retreat, cargo transfer, and overflow.  
**Required predecessor:** CP-11 and CP-16.

### Preparation that is safe now

- Reuse the existing encounter state machine, participant claim, deterministic initiative, event cursor,
  mission attempt, and field-cargo ledger.
- Map the exact boundary between a PvP winner receiving exposed cargo and shelter-held value remaining
  protected.
- Enumerate overflow choices as alternatives: bounded capacity, partial transfer, spill, or typed
  loss. Do not choose one without a player-value and fairness review.
- Prepare a two-player race matrix for simultaneous contact, retreat, death, deposit, and duplicate
  settlement.

### Cross-functional risks

CP-08 owns positions and visibility; CP-09 owns role lock and mission state; CP-10 owns cargo records;
CP-11 owns encounter/combat; CP-12 shows the result; CP-14 must not wake on every combat round.
An overflow choice can change economy, leaderboard, Re-entry eligibility, and anti-farming.

### Open gates

Initiative/retreat timing, PvP formula modifiers, cargo overflow, winner capacity, equal-time
serialization, repeat-attack protection, and whether PvP creates an Agent Signal remain OPEN.

### Entry and falsifier

Do not activate CP-19 until CP-11 and CP-16 have replayable PvE and local evidence. Reopen the
preflight if a PvP settlement would need a second cargo owner, a new combat authority, or a different
G2 event order.

## 4. CP-20 shelter defense, siege, and breach

**Roadmap scope:** Shelter defense, turrets, siege party, breach transaction, and attacker reward.  
**Required predecessor:** CP-19.

### Preparation that is safe now

- Preserve the separate shelter-held, field-cargo, and siege-reward ledgers.
- Draw the atomic breach order for resident soldiers, field soldiers, turret state, shelter penalty,
  attacker reward, mission termination, and corruption conversion.
- List the human review points for a destructive siege command and a breach recovery action.
- Prepare party-member identity and contribution records without selecting an aggregation formula.

### Cross-functional risks

A breach crosses defense, combat, loot, identity, migration, mission, monster conversion, dashboard,
and possibly Re-entry. The order of a home crossing, death, breach, and migration can create duplicate
respawn or corruption if not serialized.

### Open gates

Turret targeting and shutdown, siege party aggregation, assault commitment, defender penalty,
attacker share/cap, resident-versus-field boundary, breach recovery, corrupted-monster stats,
human approval, and Signal eligibility remain OPEN.

### Entry and falsifier

Do not activate CP-20 until CP-19 has exactly-once PvP settlement evidence. Reopen if a breach cannot
commit all ledger and identity changes in one authoritative transaction or if a destructive action
would bypass the human boundary.

## 5. CP-21 migration, veil, and moving home anchor

**Roadmap scope:** Migration, veil, moving home anchor, stale intelligence, and assault ordering.  
**Required predecessor:** CP-20.

### Preparation that is safe now

- Keep migration as a paid, committed, uncancellable shelter state with a single stable shelter id.
- Preserve the existing distinction between migration veil and protected start.
- Model returning soldiers against one moving home anchor rather than a duplicate shelter.
- Prepare last-known intelligence, freshness, route invalidation, turret shutdown, and field-soldier
  behavior as race cases.

### Cross-functional risks

Migration touches world geometry, visibility, pathfinding, mission return, sensor payload, shelter
defense, siege, dashboard, and Re-entry. A veil can accidentally hide the wrong entity or make an
old target silently current.

### Open gates

Migration duration and movement rate, destination rules, veil charge/cooldown, fresh observation
policy, stale-target search or failure, field-soldier return, turret and resident defense, combat at
the start/end boundary, and human cancellation policy remain OPEN.

### Entry and falsifier

Do not activate CP-21 until CP-20 breach ordering is verified. Reopen if migration needs a second
shelter identity, cancels a committed command, or allows stale intelligence to bypass visibility.

## 6. CP-22 shelter upgrades, tools, attributes, and recovery

**Roadmap scope:** Shelter upgrades, tools, boots, soldier quantity/attributes, repair, and recovery.  
**Required predecessor:** CP-10, CP-20, and CP-21.

### Preparation that is safe now

- Build a capability graph linking each upgrade to sensing, defense, roster, tool yield, movement,
  combat, or recovery behavior.
- Require one wallet transaction, one upgrade identity, one current revision, and one resulting
  read-model projection.
- Separate tunable prices and caps from stable identity, authority, and event semantics.
- Prepare downgrade/breach/recovery behavior without choosing random loss or exact penalty values.

### Cross-functional risks

An upgrade can change route time, extraction yield, combat outcome, snapshot size, leaderboard value,
breach consequences, and fairness. A tool upgrade must not grant a role the soldier did not carry.

### Open gates

Prices, prerequisites, caps, stacking, tool durability/repair, boots and movement modifiers,
soldier quantity, attribute semantics, breach downgrade, refund policy, and upgrade human review remain
OPEN.

### Entry and falsifier

Do not activate CP-22 until economy and breach ledgers are verified. Reopen if an upgrade changes a
historical event interpretation, silently rewrites a mission, or creates value without a ledger event.

## 7. CP-23 leaderboard, seasons, and anti-farming

**Roadmap scope:** Global leaderboard, season/reset policy, reward projection, and anti-farming.  
**Required predecessor:** CP-19 through CP-22.

### Preparation that is safe now

- Keep ranking as a recomputable projection from durable events and settlement ledgers.
- Separate spendable coins, lifetime deposited value, shelter power, combat result, and strategic
  score in the design options.
- Prepare duplicate-event, reset isolation, replay, and repeated-attack fixtures.
- Define a review table for what a leaderboard reveals about hidden shelters or private state.

### Cross-functional risks

A ranking metric can reward cheap death cycling, weak-shelter farming, migration abuse, or duplicate
delivery. Reset and season rules can invalidate world identity, history, and judge evidence.

### Open gates

Primary metric, tie-breaks, delayed projection, season length, reset scope, rewards, anti-farming
limits, privacy, rollback, and whether leaderboard events are continuation-eligible remain OPEN.

### Entry and falsifier

Do not activate CP-23 until PvP, siege, migration, and upgrade ledgers are recomputable. Reopen if
the ranking cannot be rebuilt from events or requires hidden client values.

## 8. CP-24 additional content and population

**Roadmap scope:** Additional resources, monster species, spawn pressure, terrain, and content generation.  
**Required predecessor:** CP-23.

### Preparation that is safe now

- Preserve seed and generation version as durable inputs and require replayable map fingerprints.
- Define population and spawn budgets before adding species or terrain complexity.
- Prepare no-unavoidable-kill, protected-start, reachability, and fairness checks.
- Keep content data separate from authority and balance code so a content revision is explicit.

### Cross-functional risks

New species alter pathfinding, combat, cargo loss, Re-entry frequency, performance, and fairness.
Spawn pressure can turn a strategic risk into an unavoidable death loop.

### Open gates

Species schema, target priority, spawn density, respawn pressure, terrain cost, procedural algorithm,
seed migration, content versioning, protected-start interaction, and population cap remain OPEN.

### Entry and falsifier

Do not activate CP-24 until leaderboard and economy telemetry exist. Reopen if the same seed cannot
replay, a new spawn is unavoidable, or population cost exceeds the measured worker/snapshot budget.

## 9. CP-25 performance, security, abuse controls, and operations

**Roadmap scope:** Performance, security, abuse controls, retention, observability, and migration testing.  
**Required predecessor:** CP-24.

### Preparation that is safe now

- Define measurements for due-event lag, event-loop delay, path recalculation, spatial queries,
  snapshot size, outbox age, wake rate, command conflicts, and database latency.
- Map threat surfaces: ownership spoofing, stale replay, duplicate settlement, hidden-state leakage,
  rate abuse, WebMCP misuse, signal flooding, and log secrets.
- Prepare retention and migration rehearsals with reversible backups and redacted evidence.
- Keep abuse controls explicit and observable; never hide an authorization failure as a throttle.

### Cross-functional risks

Performance changes can move authority into a cache, add a second worker, drop causal events, or
weaken snapshot privacy. Security controls can change UX and Re-entry availability.

### Open gates

Measured budgets, rate limits, authentication/session binding, CSRF/origin policy, WebSocket abuse,
retention, backups, schema migration, log redaction, alert thresholds, and incident recovery remain
OPEN.

### Entry and falsifier

Do not activate CP-25 until CP-24 has a measured population fixture. Reopen if a scale remedy adds
an unowned authority, drops an event needed for replay, or makes a required failure invisible.

## 10. CP-26 full playtest and product decision

**Roadmap scope:** Full release playtest and product decision between Sleepless Kingdom and RightSpot.  
**Required predecessor:** CP-25 and the RightSpot MVP.

### Preparation that is safe now

- Prepare a comparative rubric covering core thesis, judge comprehension, human UX, Agent/Re-entry
  demonstration, reliability, implementation effort, hosted proof, and residual risk.
- Keep the decision evidence-based: same level of completion, same clean-identity standard, and clear
  separation of concept appeal from runtime proof.
- Prepare playtest consent, feedback capture, issue triage, and go/no-go decision records.
- Preserve both products' source and evidence; do not let a temporary demo preference rewrite either
  product's canonical contract.

### Cross-functional risks

A polished but shallow demo can beat a more reliable concept in informal feedback. Conversely, a
technically complete path can fail if the core player loop is not understandable. The decision also
depends on external WebMCP and hosted evidence, not screenshots alone.

### Open gates

Scoring weights, participant profile, sample size, test environment, product comparison horizon,
submission constraints, unresolved external handoff, and final go/no-go authority remain OPEN.

### Entry and falsifier

Do not activate CP-26 until both products have comparable evidence packets. Reopen if a conclusion
depends on private developer context, unequal runtime claims, or a feature that is documented but not
reproducible.

## 11. Activation policy

The individual CP-19 through CP-26 task should be created or moved to active work only when:

- its predecessor has the required closure label and evidence level;
- the open gates that affect authority, settlement, human consequences, or contract version are
  explicitly decided;
- its scenario and rollback path exist; and
- the owner has a concrete implementation objective rather than a broad idea.

Until then, this registry is a planning and challenge record. It does not authorize code, deployment,
content population, public claims, or a new contract version.
