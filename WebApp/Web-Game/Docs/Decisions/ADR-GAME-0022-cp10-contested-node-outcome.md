# ADR-GAME-0022: CP-10 Contested Node Outcome

**Status:** ACCEPTED LOCAL CP-10 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-031`, same-node GATHERER competition at one extraction boundary  
**Related challenge:** [`../Validation/29-cp10-contested-node-preimplementation-challenge.md`](../Validation/29-cp10-contested-node-preimplementation-challenge.md)  
**Predecessor:** [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md)

## Context

CP-10 now repeats one extraction unit every two world seconds and hands a full or depleted attempt to
`RETURNING`. The due-attempt list is deterministic, but two attempts can target one node at the same
boundary. The first transaction can consume the final unit; the later attempt then observes a stale
node revision and currently causes the worker-owned clock to enter `recovery_blocked`. That is a
normal game outcome being reported as an infrastructure recovery failure. A node that was already
empty before the boundary, with no exposed cargo to bring home, remains a typed target failure so a
stale target is not silently converted into a successful return.

The accepted MVP has one authoritative worker per world, no reservation schema, one equal-weight
cargo stack per attempt/resource, and the existing `MissionAutoReturned` event. The smallest coherent
fix is a durable outcome for the loser, while preserving the store's stale and malformed guards.

## Decisions

### 1. Use the existing serialized due order

The extraction phase processes candidates in `(next_due_world_time, mission_attempt_id)` ascending
order. The lower attempt id wins a tie for the first available node unit. This is a property of the
authoritative worker's deterministic order, not a client-selectable priority or a fairness guarantee
for a future multi-worker topology.

### 2. Reload before deciding loss

The service reloads the mission, attempt, soldier, node, and cargo before each candidate. A still-due,
role-locked attempt with current node quantity greater than zero uses the existing extraction
transaction. A current zero-quantity target uses the new contest-loss transaction when an earlier
ordered attempt depleted that node in this boundary or the soldier already carries exposed field
cargo. A zero target with no cargo that was already empty before this boundary remains the typed
`TARGET_UNAVAILABLE` recovery condition. A stale read that reloads to a positive node is never
silently converted to a loss.

### 3. Make target depletion a first-class return transaction

`commitMissionTargetDepletedReturn` validates world time, worker idempotency binding, mission/attempt/
soldier identity and revisions, `WORKING` phase, GATHERER role, target identity, and a current zero
node quantity. It then atomically:

1. clears mission and attempt due markers;
2. changes both phases to `RETURNING` and updates the transition time;
3. leaves node quantity, node timer, and all cargo rows unchanged; and
4. appends one deterministic `MissionAutoReturned` event and the committed result to idempotency.

The event is shelter-visible, has no `CargoExtracted` or `ResourceDepleted` companion, and reports the
server-read cargo aggregate. Existing field cargo remains exposed for the later return/deposit chain.

### 4. Preserve exactly-once and event order

The loss work key is `mission-extraction-contest-loss:<mission_attempt_id>:<due>`. Its event id is
`mission-auto-returned:<mission_attempt_id>:<due>:target-depleted`. Duplicate delivery replays the
stored result and event id. The winner's extraction transaction remains the only transaction that can
decrement the node or emit `ResourceDepleted`; the serialized worker then records the loser return.

### 5. Keep this boundary deliberately small

No reservation lease, second scheduler, schema/contract/event-version change, public command, combat,
return navigation, home crossing, deposit, coin settlement, browser projection, WebMCP, or Re-entry
wake is introduced. A multi-worker or fairness requirement reopens this ADR.

## Alternatives rejected

- **Leave the typed failure:** safe storage but blocks a valid world boundary and strands the losing
  mission.
- **Reserve nodes before extraction:** stronger distributed fairness but adds schema, leases, expiry,
  restart, and reservation recovery before the MVP needs them.
- **Treat every stale revision as a contest loss:** hides positive-quantity races and malformed state;
  only a fresh zero-quantity read qualifies for the loss transaction.

## Consequences

- A same-worker contest always finishes the boundary; the winner is reproducible from durable ids and
  the loser retains any cargo already collected. A pre-existing empty target with no cargo remains
  visible as `TARGET_UNAVAILABLE` rather than being treated as a contest.
- The tie-break is deterministic but not a player ranking mechanic. Hosted or multi-worker deployment
  must add an explicit ownership/lease policy before relying on this order across processes.
- `MissionAutoReturned(TARGET_DEPLETED)` can now occur without a `CargoExtracted` event for that due
  marker. Consumers must use the event type and payload rather than assume every return has a new unit.

## Verification and reopen

The minimum proof is the CP-10 focused contest suite plus the affected CP-04 through CP-10 aggregate,
Node 24 typecheck/build, dependency dry-run, documentation gates, and a post-implementation
cross-functional audit. Reopen on a new reservation/fairness rule, multi-worker authority, schema or
contract version, combat interaction, return/deposit settlement, or any consumer that requires a
different per-unit contest history.
