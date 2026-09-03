# CP-10 Contested Node Outcome Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-031`
- Promoted decision: [`../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation
- Date: 2026-09-02

## Decision question

When two or more active GATHERER attempts reach the same Wood/Rock node at one due boundary, how
should the worker select the available unit and finish the attempts without a negative node, a
duplicate event, or a world-clock recovery block?

## Objective and binding constraints

- Real objective: make a same-node contest a deterministic, replayable gameplay outcome so one
  depleted node cannot stop unrelated world phases.
- The existing worker owns world time, due-work order, mission phase, node quantity, cargo, revisions,
  event identity, and idempotency. The browser supplies none of these values.
- The G2 contract remains `SK-MVP-0.2`; use `CargoExtracted`, `ResourceDepleted`, and
  `MissionAutoReturned` without a schema, event, or contract-version change.
- One due marker yields at most one unit. A transaction that wins the final unit owns depletion and
  its one `ResourceDepleted` event. A losing due attempt receives a durable `TARGET_DEPLETED`
  `MissionAutoReturned` outcome and does not emit a second depletion event. A target that was already
  empty before the boundary and has no exposed cargo remains a typed `TARGET_UNAVAILABLE` recovery
  outcome; it is not a contest.
- The single authoritative worker serializes a world's phase handler. Multi-worker ownership,
  reservation leases, combat, return navigation, deposit, coins, and UI remain separate boundaries.

## Evidence and challenge

- Verified predecessor: CP-10 recurring extraction atomically updates node, provenance cargo, paired
  due markers, phase, events, revisions, and idempotency. Its focused and CP-04 through CP-10
  aggregate suites are green.
- Verified gap: `MissionExtractionService` snapshots due attempts. When an earlier attempt consumes
  the last node unit, a later same-node attempt reaches the store with a stale node revision and the
  worker currently surfaces a typed target/revision failure. `WorldClock` then marks the boundary
  `recovery_blocked`.
- Existing deterministic order: due work is listed by `next_due_world_time`, then
  `mission_attempt_id` ascending. This gives a stable tie-break inside the one worker without a
  player-visible priority claim.
- Existing event/phase vocabulary: `MissionAutoReturned(reason = TARGET_DEPLETED)` is already the
  accepted partial-return handoff; field cargo remains exposed and is preserved.
- Assumptions: one worker is the authority for a world; a node with quantity zero is unavailable for
  this due marker; an available node unit is consumed by the first serialized transaction.
- Falsifiers: a requirement for fair reservation independent of worker order, multiple authoritative
  workers for one world, a new contest event or contract version, or a consumer that requires a
  per-unit reservation identity. Any of these reopens this decision.

## Failure modes examined

| Failure | Impact | Detection | Prevention or remediation |
|---|---|---|---|
| Duplicate extraction/loser redelivery | Extra cargo, a second return, or negative node | Stable extraction/contest idempotency and event ids | Replay the stored result; one transaction owns each due marker |
| Lost or reordered event | UI/Agent sees a return without the causal node outcome | Cursor and event-history assertions | Persist events in transaction order: winner extraction, optional depletion/return, then loser return |
| Stale revision accepted | Two units from one final node | Expected node/mission/attempt revisions | Reload authoritative state; auto-return only after a current zero-quantity check |
| Same-node race | World clock blocks after a valid winner | Two attempts, final-unit fixture, boundary state readback | Serialize by due/attempt order and commit a loser return transaction |
| Authority leaking into client | Client chooses winner, reason, or timing | Forged input tests | Store derives target quantity, reason, event identity, and world time |
| Unbounded catch-up after downtime | Multiple contest effects in one boundary | Clock recovery and one-marker assertions | Keep one unit per due marker; no catch-up batch or reservation queue |
| Hidden fallback masking failure | Invalid state or an empty stale target is silently converted into success | Malformed identity/cargo/revision and pre-empty no-cargo tests | Preserve typed `RECOVERY_REQUIRED`/`TARGET_UNAVAILABLE`; only a same-boundary depletion or exposed-cargo zero-node path auto-returns |

## Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Keep the current typed failure | Exposes contention | A normal contest blocks the world and strands the losing mission | Small | High | Existing failure test only |
| Add node reservation leases | Strong claim fairness under multiple workers | New schema, expiry, recovery, and reservation lifecycle before the MVP return chain | High | Low | Lease race, expiry, restart, and migration proof |
| Serialize and auto-return the loser | Deterministic outcome, no blocked boundary, preserves exposed cargo | Tie-break follows authoritative worker order; multi-worker fairness is deferred | Medium | High | Same-node race, duplicate, stale, rollback, restart, and event-order proof |

## Decision

- Selected option: **Serialize by due marker and `mission_attempt_id`, then atomically auto-return an
  attempt whose current target is depleted.**
- Before each candidate, the service reads the current mission, attempt, soldier, node, and cargo.
  The due list remains ordered by `(next_due_world_time, mission_attempt_id)`. A successful extraction
  keeps the CP-10 transaction. If the current node quantity is zero because an earlier ordered
  attempt depleted it in this boundary, or because this mission already has exposed cargo, the
  service calls a dedicated store transaction that changes `WORKING → RETURNING`, clears the paired
  due markers, preserves all soldier cargo, and emits one `MissionAutoReturned(reason =
  TARGET_DEPLETED)`. A pre-empty zero node with no cargo remains `TARGET_UNAVAILABLE`.
- The loser transaction mutates no node quantity and emits no `ResourceDepleted`; the winner that
  commits quantity zero owns the one depletion marker/event. A node with remaining quantity is still
  extracted normally, so two attempts may each receive a unit when two units exist.
- Contest return identity is deterministic: `mission-extraction-contest-loss:<attempt>:<due>` is the
  idempotency key, and `mission-auto-returned:<attempt>:<due>:target-depleted` is its event id. The
  event payload carries authoritative mission/attempt/soldier/target/world-time and the aggregate
  cargo quantity/capacity at handoff.
- A stale concurrent transaction is not blindly converted to a loss. The service reloads the node;
  zero quantity selects the loss transaction only for the explicit same-boundary or exposed-cargo
  cases; a pre-empty no-cargo target remains `TARGET_UNAVAILABLE`, and positive quantity is a typed
  recovery/retry boundary.
  This preserves invalid-state visibility while making the normal single-worker contest non-blocking.
- No reservation column, priority UI, client winner selection, schema migration, public gateway, or
  Re-entry signal is added.

## Verification and recovery

- Red tests must first demonstrate the current same-node final-unit behavior blocks the boundary or
  leaves the loser unresolved.
- Green tests must cover deterministic winner/loser order, two-unit non-terminal sharing, final-node
  depletion without duplicate `ResourceDepleted`, pre-depleted target with existing cargo, duplicate
  replay, stale/forged inputs, rollback, restart, event cursors, and world-clock continuation.
- The affected CP-04 through CP-10 aggregate, Node 24 typecheck/build, dependency dry-run, and docs
  validator are the closure gates. Browser, hosted, WebMCP, Re-entry, combat, and deposit checks are
  intentionally not part of this task.
- A failed loser transaction leaves the mission/attempt due marker, cargo, node, revisions, event
  cursor, and idempotency state unchanged. If the node is positive after a stale read, recovery stays
  visible instead of being treated as a contest loss.
- Reopen if a second authoritative worker, reservation/fairness requirement, new event/schema/
  contract version, combat interaction, return navigation, deposit, or UI authority enters this
  boundary.
