# ADR-GAME-0006: MVP Contract and Re-entry Boundary

**Status:** ACCEPTED HISTORICAL `SK-MVP-0.1` BASELINE; Re-entry delivery portion superseded by ADR-GAME-0009 and G2 geometry/state/vocabulary superseded by ADR-GAME-0010; gameplay runtime implementation remains unverified  
**Date:** 2026-09-01  
**Decision owner:** Game owner with engineering recommendation

## Context

The accepted concept and roadmap identified twenty MVP decisions that must be explicit before code.
The owner has now accepted the recommended defaults, including the two product choices that affect
the hackathon story most directly: what an Agent may do after Re-entry and how a new shelter is
protected. The detailed, versioned field and event contract lives in
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md).

This ADR promotes the first-slice defaults to a durable MVP decision. It does not claim that the
runtime, browser capability, persistence, or hosted worker already exists.

The Re-entry delivery and notification policy in this ADR is superseded by
[`ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
and contract revision `SK-MVP-0.2`. The G2 movement rates, sensing boundaries, mission-state model,
anti-loop rule, protected-start boundary, event vocabulary, and snapshot vocabulary in this historical
baseline are superseded by
[`ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md).
The accepted `force_recall_soldier` action, user grant, and human consequence boundary remain
unchanged.

## Decision

Adopted contract version `SK-MVP-0.1` for the local two-player vertical slice. This section is
retained as the historical gameplay baseline; the current coherent G2 contract is `SK-MVP-0.2` in
`Engineering/09-mvp-contract-sheet.md` and `ADR-GAME-0010`.

- one seeded 128 × 128 logical-tile world, seed `sleepless-mvp-01`;
- two symmetric shelters at `(16,64)` and `(112,64)`, Euclidean separation 96 tiles, five starter
  soldiers per shelter, one Wood node and one Rock node per start zone, and one seeded monster;
- a 12-tile protected-start radius that ends at the owner's first field dispatch or 120 world
  seconds, whichever comes first;
- one world second per real second, 100 ms movement/visibility reconciliation, and integer-second
  extraction and combat milestones with a documented phase order;
- role-locked gatherer and hunter missions, five equal-weight cargo slots, Wood at one coin, Rock at
  three coins, one unit every two seconds, 20-unit nodes, and 30-second node respawn;
- a hunter victory against the seeded monster clears that threat and emits `MonsterDefeated` without
  creating a third resource or direct coin reward;
- one deterministic combat round per world second using
  `damage = max(1, attack + weapon_power + matchup_bonus - defense)`, speed initiative, and ascending
  entity-id tie-breaks, with no random or hidden party modifier in G2;
- ordinary monster death destroys only unbanked field cargo, keeps the same `soldier_id`, creates a
  new `mission_attempt_id`, respawns at the shelter, and reissues the repeatable mission;
- `CargoLostToMonster` as the only G2 continuation event, one pending continuation per shelter, a
  60-world-second continuation cooldown, and event-id deduplication;
- after Re-entry, the Agent must reread the canonical page and current revisions, then may execute the
  bounded `force_recall_soldier` command under the existing user grant. The command queues normal
  travel, preserves role and cargo, and cannot mint coins. Migration, siege, destructive upgrades,
  and irreversible recovery remain human-confirmed;
- the human dashboard remains complete when WebMCP is unavailable, with a visible capability result;
  and
- active PvP attack commands, Gold, tier multipliers, siege, migration, breach recovery, seasons, and
  leaderboard balance remain outside G2.

## Alternatives considered

### Prepare-only Re-entry

The Agent could stop after preparing a recall for a human to approve. This has a smaller action
surface, but it weakens the proof that an event can cause useful bounded work. The accepted choice is
to allow one low-consequence recall execution while keeping high-consequence actions human-confirmed.

### No protected start

Immediate monster pressure would shorten the code path but creates an unexplained onboarding death and
would make the first dashboard state difficult to read. The accepted shield protects the initial
decision window without protecting dispatched soldiers indefinitely.

### Random combat and economy tuning in G2

Random rolls and early tier variety could create more content, but they make restart replay and the
judge story harder to explain. Deterministic values are accepted for the first trace; tuning and
bounded randomness can be evaluated after telemetry exists.

## Consequences

The MVP has one authoritative, replayable chain from world time through mission, cargo, combat,
respawn, event delivery, page reread, and bounded action. A player can see why a choice was made and
what the next valid command is. The two-player map still feels larger than one camera and leaves a
visible landmark for the other player without requiring PvP balance.

The contract is intentionally unbalanced and fixture-oriented. Production population, authentication,
anti-farming, breach recovery, migration timing, leaderboard policy, and the final hosted topology
remain separate decisions. The contract's values are configuration, but its identity, event, cargo,
authority, and human-boundary rules are normative for G2.

## Reopen triggers

Reopen this ADR only when evidence shows that:

- the bounded recall action is not safe or useful under the actual Re-entry grant;
- the protected-start window prevents the intended first risk or still permits an unavoidable spawn
  kill;
- deterministic replay, cargo settlement, or event delivery cannot meet the G2 acceptance cases;
- the selected page capability cannot expose the accepted WebMCP boundary; or
- the owner explicitly changes the two-player MVP or the hackathon thesis.
