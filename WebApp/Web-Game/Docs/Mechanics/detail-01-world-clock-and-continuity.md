# World Clock and Continuity

**Mechanism:** M01
**Status:** MVP clock and event order accepted; CP-06 local precision/recovery boundary plus the B startup-only trusted-anchor extension and explicitly enabled autonomous driver are runtime-verified for one local world; CP-08 cadence and command/read serialization plus the implemented G2 due-work composition are runtime-verified at named local scopes; CP-12 automatic realtime publication and server-owned continuous-intent lifecycle are runtime-verified for the named local worker-to-page scope; hosted continuity remains open
**Runtime evidence:** [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md) and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md)
**Authority:** This file owns gameplay time and continuity. Engineering owns storage and worker
implementation.

## Purpose

The world must keep advancing while a player is offline, while the browser is closed, and across a
recoverable worker restart. Every time-dependent mechanic reads the same authoritative world clock.

## Clocks

| Clock | Use | Authority |
|---|---|---|
| `world_time` | Travel, extraction, combat rounds, respawn, migration, cooldown, spawn, leaderboard projection | Backend simulation |
| `wall_time` | Logs, health checks, leases, operations, deployment evidence, and the accepted startup-only recovery observation | Host and database |
| `client_time` | Animation interpolation and display only | Browser; never gameplay authority |

`world_time` is monotonic for a world. A wall-clock jump, browser pause, or client reconnect cannot
rewrite an already committed gameplay result. Under the accepted B extension, one persisted
`server_time_anchor_ms` may derive a bounded integer recovery target during explicitly enabled worker
startup after boundary replay; it cannot advance healthy live gameplay or become a second clock.

For the accepted MVP, `world_time` is a non-negative integer world-second counter and one world second
equals one real second while the worker is healthy. Movement and visibility may be reconciled on a
100 ms simulation step for smooth `client_snapshot` projections; fractional positions are
process-local and never become persisted time. Combat, extraction, respawn, node timers, and cooldown
boundaries still commit on integer world-second boundaries. CP-06 maps trusted server-time observations
to an integer recovery target.

The CP-08 cadence seam routes complete 100 ms healthy-worker steps from `WorldClock` to the
worker-owned player movement service. A healthy step may commit an integer tile crossing using the
current persisted world-second value; at a completed tenth step, the integer boundary phases run
before the next second's movement steps. CP-12's accepted server-owned intent stores an opaque
realtime connection owner, clears on close/drain/fault/stop or competing mutation, and keeps its
fractional progress process-local. A process replacement clears active movement intent and fractional
progress; a reconnect must issue a fresh intent.

The local `WorkerCommandGateway` serializes movement intent commands, full snapshot reads, and
explicit worker clock advances in invocation order before any browser or wire adapter is attached.
It is process-local admission and ordering, not a hosted scheduler or durable command queue.

## Scheduled milestones

The worker stores the next due milestone for work that does not need frame-by-frame simulation:

- travel waypoint or arrival;
- extraction cycle;
- full-pack return;
- nearby encounter check;
- combat round or terminal resolution;
- migration completion;
- resource respawn; and
- monster state timeout.

A reconciliation tick claims due milestones, validates entity versions, applies the domain transition,
and writes its event in one transaction. The client interpolates between `client_snapshot` projections and never awards
progress locally.

## Offline and restart behavior

When a player is absent, due milestones continue to advance. When the worker restarts, it:

1. loads the latest `world_snapshot` and last committed `world_time`;
2. under the accepted B policy, compares the current server observation with the persisted anchor and
   advances to the bounded accepted integer recovery target;
3. applies due milestones in deterministic order;
4. reclaims expired worker leases; and
5. replays unacknowledged Domain Event and Agent Signal delivery records without repeating a domain transition.

The MVP catch-up policy, bounded routine batch, and extreme-downtime behavior are fixed by
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md) and
[`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md).
A gap up to `MAX_RECOVERY_WORLD_SECONDS = 300` is recovered deterministically; a larger gap returns
`RECOVERY_LIMIT_EXCEEDED`, preserves durable truth, closes the world mutation gate, and remains
observable without pretending the world is recovered. Hosted policy may be versioned later with new
evidence, but it cannot silently change the local G2 meaning.

## Event order

Events touching the same entity are serialized by entity version. A stable tie-break order is needed
for milestones with the same due time; the target order is:

1. move actors and apply home-boundary crossings;
2. commit valid shelter deposits before a soldier can be treated as field cargo;
3. detect and lock new contacts using post-movement positions and entity revisions;
4. apply extraction only to soldiers still working and not locked in contact;
5. resolve one combat round for each locked encounter in deterministic initiative order;
6. settle death, cargo loss or transfer, respawn, and repeatable mission reissue; and
7. apply resource and monster timers, projections, `world_snapshot` persistence, `client_snapshot`
   delivery, and continuation delivery.

This order is accepted for `SK-MVP-0.2` and is mirrored in the normative
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md). Full-game
migration, siege, and breach boundaries must add their ordering explicitly in a later contract. A
later command cannot retroactively change an already committed event.

## Invariants

- One authoritative clock drives all gameplay timers.
- Every committed transition has an event id and entity version.
- Replaying a milestone is idempotent.
- Downtime cannot duplicate cargo, coins, soldiers, or rewards.
- A `client_snapshot` can be stale and must be reread before a consequential command; it never
  replaces the durable `world_snapshot`.

## Open decisions

- production world-time scaling and active-region approximation beyond the accepted MVP rate and
  300-second recovery budget; and
- long-offline presentation after the accepted causal recovery summary.

## Related documents

- [`01-world-simulation.md`](01-world-simulation.md) — family overview;
- [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md);
- [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md); and
- [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md).
