# CP-10 First Extraction and Cargo Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-029`
- Promoted decision: [`ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation
- Date: 2026-09-02

## Decision question

How should the first Wood/Rock extraction milestone turn one arrived GATHERER's node unit into
exposed soldier cargo while preserving server authority, due-work ordering, restart safety, and the
later return/deposit boundary?

## Objective and binding constraints

- Real objective: prove one extraction effect after CP-09 arrival, with no coin creation before a
  shelter deposit.
- Non-negotiables: the worker owns world time, mission phase, node quantity, cargo, revisions, event
  identity, and idempotency; the browser supplies no cargo, node, role, tool, or time authority.
- The node decrement, cargo creation/update, mission milestone consumption, `CargoExtracted` event,
  and idempotency record must commit in one database transaction.
- The G2 contract remains `SK-MVP-0.2`; use the existing `CargoExtracted` event and no new contract
  version or mission phase.
- This task proves one due extraction only. Capacity-triggered return, repeated cadence, node
  depletion, automatic return, recall, deposit, coins, contest policy, and combat remain later
  boundaries.

## Evidence and challenge

- Verified predecessor: CP-09 persists a role- and tool-locked GATHERER, an immutable route, paired
  mission/attempt revisions, and a server-owned `TRAVELLING → WORKING` arrival boundary.
- Verified contract inputs: Wood and Rock are the visible resources; each unit uses one of five equal
  slots; the accepted extraction interval is two world seconds; each fixture node starts at 20 units;
  Wood deposits at one coin and Rock at three; field cargo is exposed until deposit.
- Required handoff: arrival at world time `T` arms the first extraction due marker at `T + 2`. The
  extraction phase must not settle it at `T`, and a retry after `T + 2` must return the committed
  result without another node decrement or cargo unit.
- Unknowns intentionally left open: partial final extraction, repeated cadence, capacity/return
  transition, simultaneous node contest, reservation, future tool yield, typed weights, and deposit
  history projection.
- Falsifiers: a consumer requires per-waypoint cargo timing, a client-provided quantity or position,
  a second scheduler, a new event/version, or a deposit/coin effect inside this increment. Any of
  these reopens the challenge before implementation.

## Options

| Option | Player value | Risk | Cost | Reversibility | Decision |
|---|---|---|---|---|---|
| Reuse the existing minimal cargo row and put provenance only in the event | Demonstrates a visible unit quickly | Later combat/deposit cannot prove cargo ownership from durable state; migration debt is hidden | Small | Low once consumers depend on incomplete rows | Reject |
| Add a versioned cargo shape and one atomic extraction transaction | Proves the smallest real economy effect with durable ownership and no coins in the field | Legacy rows need an explicit compatibility path; repeated cadence waits for a later task | Medium | High; later capacity/deposit can consume the same row | Select |
| Add recurring extraction, capacity, return, and deposit together | Shows a longer demo path in one change | Mixes multiple phase boundaries, route direction, wallet settlement, and recovery cases | High | Low | Defer |

## Selected design

1. **Versioned cargo provenance.** Advance the local persistence schema from version 3 to version 4
   with migration id `cp10-001`. Fresh rows carry `mission_attempt_id`, `source_node_id`,
   `acquired_world_time`, and `capacity_used` in addition to world/cargo/soldier/resource/quantity/
   revision. The provenance columns are nullable only for pre-v4 legacy rows that may already exist;
   every row created by this task must populate them. `capacity_used` equals quantity in the accepted
   equal-weight model.
2. **First extraction schedule.** When `MissionTravelService` commits arrival at `T`, it changes the
   paired due marker to `T + 2` while leaving the mission in `WORKING`. This is scheduler metadata,
   not a second clock or an extraction effect. At the extraction phase, only active `WORKING`
   GATHERER attempts whose paired due marker is at or before the boundary are eligible.
3. **One ledger boundary.** `MissionExtractionService` reads the committed attempt role/tool/target,
   soldier identity, resource node, current cargo usage, and revisions. It validates a Wood/Axe or
   Rock/Pickaxe pairing, one available node unit, and capacity below five. It then atomically
   decrements the node, inserts the deterministic first cargo row, advances the node/cargo/mission/
   attempt revisions, clears the consumed due marker, persists one `CargoExtracted` event, and stores
   the original result under a deterministic worker idempotency key.
4. **No settlement shortcut.** The shelter wallet is untouched. The cargo remains field-owned and
   exposed. Return and deposit will later consume this row and credit coins in their own transaction.

## Failure modes examined

| Failure | Required prevention |
|---|---|
| Duplicate extraction retry | Stable attempt/due work id, stored result replay, and one event identity |
| Two workers claim one unit | One immediate transaction plus node and mission expected revisions |
| Stale role or tool | Read the persisted mission attempt, never the request's mutable selection |
| Empty node | Typed `TARGET_UNAVAILABLE`; no negative quantity, cargo, or event |
| Full cargo | Typed `CARGO_FULL`; no node decrement or due-marker loss |
| Arrival extracts at the same second | Arrival arms `T + 2`; extraction phase sees the future due marker |
| Worker skips an unprocessed boundary | Same `world_time <= durable + 1` guard as CP-09 |
| Crash during node/cargo/event write | Transaction rollback leaves the due work retryable |
| Restart after commit | Durable idempotency and event identity return one result; no second unit |
| Legacy schema row | Migration is atomic; nullable legacy provenance is never treated as a new extraction |
| Browser or Agent submits quantity | Server ignores client quantity and derives exactly one unit |

## Verification and recovery

- Contract-first Red tests must fail before `MissionExtractionService` and the v4 migration exist.
- Green tests must cover first due extraction, Wood/Rock tool parity, no coin before deposit, node and
  cargo revisions, event payload/visibility, duplicate retry, stale revision, capacity boundary,
  empty node, skipped-boundary rejection, rollback, schema-3 restart migration, and extraction
  ordering after arrival.
- The route suite must continue to pass with the new post-arrival due marker; CP-04 through CP-09
  regressions, typecheck, build, and documentation validation remain the minimum transitive checks.
- Recovery on any failed extraction leaves the attempt `WORKING` with its due marker and node/cargo
  state unchanged. A malformed provenance row raises `RECOVERY_REQUIRED`; no hidden coercion is
  permitted.
- Reopen if a second extraction cadence, capacity return, node reservation, combat transfer, deposit,
  or a new event/schema/contract requirement enters this bounded task.
