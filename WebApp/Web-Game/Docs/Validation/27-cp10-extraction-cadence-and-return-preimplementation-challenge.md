# CP-10 Extraction Cadence and Return-Handoff Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-030`
- Promoted decision: [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation
- Date: 2026-09-02

## Decision question

How should the verified first extraction become a recurring two-second cadence and stop safely at
capacity or target depletion, without mixing return travel or shelter settlement into the same
transaction?

## Objective and binding constraints

- Real objective: let one arrived GATHERER extract successive Wood/Rock units on authoritative
  integer boundaries, then hand the attempt to `RETURNING` with an observable reason when its five
  equal slots or its target is exhausted.
- The worker owns world time, due work, role/tool, node quantity, cargo ownership, revisions, event
  order, and idempotency. The browser, WebMCP surface, and Agent cannot supply quantity, yield,
  capacity, position, or time.
- Keep contract version `SK-MVP-0.2`, the existing movement → deposit → contact → extraction → combat
  → settlement → timers order, and the existing `CargoExtracted`, `MissionAutoReturned`, and
  `ResourceDepleted` vocabulary.
- One extraction milestone remains one unit. Its node decrement, cargo change, due-marker change,
  mission phase handoff, event(s), and idempotency record commit in one database transaction.
- Return movement, recall, shelter deposit, coin credit, combat transfer, node respawn execution,
  browser projection, WebMCP, Re-entry, and hosted scheduler composition remain outside this task.

## Evidence and challenge

- Verified predecessor: `SK-TASK-029` proves schema-v4 cargo provenance, one post-arrival extraction,
  paired due markers, server-owned loadout validation, duplicate safety, rollback, and restart.
- Accepted economy inputs: one unit every two world seconds, five equal slots, Wood and Rock only,
  20-unit fixture nodes, no coin before deposit, and cargo exposed until a shelter boundary.
- Existing ADR-0020 explicitly directs the next task to extend the same provenance cargo row for
  capacity/depletion before adding return/deposit settlement.
- Falsifiers: a consumer requires one durable row per extraction unit, a new mission phase or event
  vocabulary is required, capacity is typed/weighted in the G2 slice, or a second scheduler can claim
  the same due marker. Any falsifier reopens this challenge before implementation.

## Cross-functional surfaces

| Surface | In this task | Explicitly deferred |
|---|---|---|
| Mission/phase | Repeated `WORKING` milestones; one atomic `WORKING → RETURNING` handoff | Return route, home crossing, `DEPOSITING`, recall |
| Economy | Increment the existing per-attempt/resource cargo stack; five-slot guard; final-unit node depletion marker | Deposit, wallet, coin ledger, weighted capacity, tool-tier yield |
| Persistence | No schema version change; update cargo/node/mission/attempt revisions transactionally | New cargo table shape, snapshot projection |
| Clock/order | Schedule next due as prior due + two seconds; stop before another due can fire | New scheduler, wall-time policy |
| Events | `CargoExtracted` per unit; `MissionAutoReturned` for a stop; `ResourceDepleted` on the final node unit | Agent eligibility, combat or settlement events |
| UI/API | No new public command; current state remains server projection | Cargo dashboard, WebMCP tools, Re-entry signal |
| Operations | Existing injected extraction phase seam and file-backed WAL | Default all-phase composition, hosted continuity |

## Options

| Option | Decision | Trade-off |
|---|---|---|
| Create a new cargo row for every unit | Reject | Preserves per-unit timestamps but contradicts ADR-0020's accepted stack boundary and complicates capacity, deposit, and later cargo loss without a demonstrated consumer. |
| Increment the deterministic cargo stack row | Select | Keeps one ownership/revision boundary per attempt and resource; the row's `acquired_world_time` remains the first unit time, while each `CargoExtracted` event records later milestone time. |
| Set the next due from the handler's current world time | Reject | A delayed handler would silently lengthen cadence and make restart catch-up depend on delay rather than the committed milestone. |
| Set the next due from the consumed due marker | Select | Preserves a deterministic two-second schedule across sequential recovery boundaries. |
| Leave a full or depleted attempt in `WORKING` | Reject | It leaves a consumed or repeatedly failing due marker and creates an unbounded worker loop. |
| Transition to `RETURNING` in the same extraction transaction | Select | The next phase has a durable, causal handoff while return movement remains independently testable. |
| Only set node quantity to zero and defer depletion metadata | Reject | A later timer cannot distinguish a newly depleted node from a legacy zero row and the demo loses the causal depletion boundary. |
| Set a 30-second respawn marker and emit `ResourceDepleted`, but defer timer execution | Select | Uses existing node due metadata and event vocabulary without adding respawn behavior or a second scheduler to this task. |

## Selected design

1. **Stable cargo stack.** The deterministic `(world, mission_attempt, resource_node)` cargo id is a
   single equal-weight stack. A successful milestone inserts it at quantity/capacity `1` or
   increments its quantity and `capacity_used` by exactly `1`. Its provenance owner and source never
   change; `acquired_world_time` is the first unit's time, and the event log carries each later due
   time.
2. **Cadence.** After a non-terminal extraction at due time `D`, both mission and attempt due markers
   become `D + 2`. The worker processes one due milestone per boundary and never credits multiple
   units from a delayed handler call.
3. **Stop transition.** If the resulting soldier cargo usage is `5`, or the node reaches `0`, the
   same transaction clears both due markers and changes mission and attempt to `RETURNING`. The
   reason is `CAPACITY_FULL` when capacity is full, otherwise `TARGET_DEPLETED`; if both occur, the
   result records both booleans and uses `CAPACITY_FULL` as the primary reason. The soldier stays
   `FIELD` and the existing route/home anchor remain available for the next task.
4. **Node depletion.** A final unit sets the node's `next_due_world_time` to `world_time + 30` and
   emits one `ResourceDepleted` event in the same transaction. Respawn execution is a later timers
   task; no extraction can use a zero node in this task.
5. **Causal events and replay.** Every milestone has a stable attempt/due idempotency key and
   `CargoExtracted` event id. A stop adds one deterministic `MissionAutoReturned` event; depletion
   adds one deterministic `ResourceDepleted` event. A retry returns the stored result and event ids,
   without another stack increment, node decrement, transition, or cursor allocation.

## Failure and race matrix

| Case | Required result |
|---|---|
| Normal second or later milestone | Stack quantity/capacity +1, node −1, next due = prior due +2, one `CargoExtracted` |
| Fifth slot | The fifth unit is committed, both phases become `RETURNING`, due markers clear, one auto-return event; no sixth unit |
| Final node unit | Node reaches zero, one 30-second respawn marker and `ResourceDepleted`; the attempt returns with partial cargo unless it also fills capacity |
| Stale mission/attempt/node/soldier revision | Typed recovery failure and no partial stack, node, phase, event, or cursor mutation |
| Duplicate due pass or idempotency key | Original result and event ids; no quantity, cursor, or revision double advance |
| Two attempts contest final unit | Node revision serializes the winner; loser gets a typed retryable failure and cannot make quantity negative; full contest policy remains a later task |
| Malformed existing cargo stack | `RECOVERY_REQUIRED`; never infer ownership, source, or capacity |
| Injected failure after state, cargo, or events | SQLite rollback leaves the prior due marker and all prior state retryable |
| Restart between milestones | Durable next due is replayed once at the same two-second cadence |
| Direct handler skips durable world boundary | `RECOVERY_REQUIRED`; no catch-up shortcut or hidden time advance |

## Verification and recovery

- Red tests must fail before the recurring stack update and return/depletion transaction exists.
- Green tests must cover two successive milestones, due-marker cadence, aggregated cargo provenance,
  fifth-slot transition, target-depleted transition, `ResourceDepleted` marker, duplicate/stale/
  malformed/race behavior, rollback, skipped boundary, and restart.
- Re-run the affected CP-04 through CP-10 aggregate, Node 24 typecheck/build, dependency dry-run,
  documentation self-tests/validator, and scoped diff check at closure.
- Recovery preserves the last committed milestone. A malformed stack, incompatible role/tool, or
  impossible phase enters a typed recovery path; no silent reset, teleport, coin credit, or row
  fabrication is allowed.
- Reopen if weighted capacity, per-unit cargo rows, node reservation, respawn execution, return
  navigation, deposit/coins, a new event/schema/contract version, or default scheduler composition
  enters this task.
