# CP-09 Route Milestone Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-028`
- Promoted decision: [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation
- Date: 2026-09-02

## Decision question

How should one dispatched GATHERER travel through the committed route and enter `WORKING` at the
authoritative arrival boundary without inventing a second scheduler, persisting client-owned
coordinates, or adding a new G2 Domain Event?

## Objective and binding constraints

- Real objective: make the CP-09 dispatch handoff consume world time and reach the resource target at a
  deterministic server-owned milestone.
- Non-negotiables: the server owns route, position derivation, phase, event order, identity, and
  restart behavior; one transaction writes each authoritative transition and its event; the browser
  remains a projection; `SK-MVP-0.2` event vocabulary and contract version stay unchanged.
- Affected contract version: `SK-MVP-0.2`.

## Evidence and challenge

- Verified: `SK-TASK-027` persists a stable soldier, mission, mission attempt, route, home anchor,
  start world time, and `TRAVELLING` phase in schema 3. The route has deterministic inclusive
  waypoints and an estimated travel duration. `WorldClock` processes the movement phase at each
  integer world-second boundary and already bounds recovery to 300 seconds.
- Assumptions: the bounded fixture route is immutable while this task runs; the target does not move;
  terrain and equipment do not alter the accepted 3.0 tiles-per-world-second rate; extraction and
  encounters are not processed by this increment.
- Unknowns: production path invalidation, target movement, terrain modifiers, intermediate encounter
  presentation, and default hosted scheduler composition.
- Contradiction resolved: the former M08 wording said dispatch schedules a milestone in its own
  transaction, while `ADR-GAME-0018` deliberately forbids a timer in the dispatch task and the G2
  vocabulary has no per-waypoint event. M08 now states that dispatch records a plan and a later worker
  milestone advances it. This challenge selects the later arrival boundary.
- Falsifiers: a required consumer needs durable per-waypoint state, an intermediate movement event,
  route mutation during transit, a different movement rate, or concurrent scheduler ownership in this
  increment. Any of these reopens the task before implementation.

## Failure modes examined

| Failure | Impact | Detection | Prevention or remediation |
|---|---|---|---|
| Duplicate arrival after retry | Duplicate `MissionWorking`, revision, or extraction eligibility | Existing phase, revision, stable work key, and event count | One transaction; only `TRAVELLING` attempts due at the boundary are eligible |
| Lost or reordered event | Dashboard/recovery cannot explain arrival | Event cursor and affected revisions | Commit mission, attempt, event, and due marker together; movement phase runs before extraction |
| Stale revision accepted | A later mission is changed by an old worker result | Expected mission and attempt revisions | Conditional mutations inside the transaction; stale outcome has no partial state |
| Race at a shelter or route boundary | Two workers both claim the same arrival | Concurrent transaction and revision proof | One worker gateway/clock owner plus transaction predicate; a second claimant gets a typed stale result |
| Authority leaking into the client | Client claims arrival or changes route | Ignore client coordinates; compare persisted route and world time | Derive transit on the server from the committed route and start time |
| Unbounded catch-up after downtime | Long offline gap loops or skips causal work | WorldClock recovery cap and per-boundary invocation | Reuse the 300-second cap; process each due boundary deterministically |
| Hidden fallback masking a capability failure | UI reports working when no server transition exists | Typed phase/result and event readback | No client-only arrival and no silent route fallback |

## Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Minimal: derive transit and commit one arrival milestone | Real travel time and readable phase change with the existing event vocabulary | Intermediate path state is derived rather than individually logged | Small | High; route cursor can be added later if proved necessary | Arrival, restart, duplicate, stale, and midpoint derivation tests |
| Conservative: persist a waypoint cursor on every movement boundary | Exact durable position after every step | Requires schema migration, new event granularity, and more recovery surface | Medium-high | Lower once consumers depend on it | Cursor/event ordering, migration, race, and projection tests |
| Expanded: add a general durable scheduler and encounter-aware route simulation | Full production foundation | Expands into extraction, encounters, leases, target mutation, and hosted operations | High | Low | Full CP-09 through CP-11 slice and hosted proof |

## Decision

- Selected option: Minimal derived transit with one server-owned arrival milestone.
- Reason and trade-off: `world_time`, the immutable route, and `start_world_time` already form a
  deterministic function for the current fixture. Persisting only the due marker and the phase
  transition keeps the G2 event vocabulary intact, makes restart recomputation exact, and leaves room
  for later per-cell encounters without committing a premature schema. The trade-off is that an
  intermediate coordinate is a derived projection until a later task proves that durable cursor state
  is necessary.
- Rejected alternatives: A waypoint cursor would add schema and event semantics before any consumer
  needs them. A general scheduler would mix extraction, encounter, and hosted concerns into one
  unreviewable increment.
- Non-goals: extraction, cargo, node quantity, return, recall, encounter, combat, HUNTER dispatch,
  browser snapshot fields, WebMCP, Re-entry, default-world bootstrap, and hosted scheduling.
- Required contract changes: none. Add no new event type and keep `MissionWorking` as the arrival
  transition event. Update M08/M09 wording and the task/evidence records only.

## Verification and recovery

- Minimum meaningful verification: contract-first Red/Green tests for due scheduling, deterministic
  midpoint position, arrival phase/event atomicity, duplicate and stale retry, concurrent claimant,
  recovery at and past the due boundary, and unchanged CP-08 behavior; then the CP-09 aggregate,
  typecheck, build, and documentation validators at closure.
- Recovery path: if an arrival transaction fails, leave the attempt `TRAVELLING` and the due work
  retryable; if the route or phase cannot be validated, return a typed recovery result and do not
  invent arrival or resource yield.
- Reopen or supersession trigger: a route or target mutation, a need for intermediate durable
  encounter positions, a changed movement rate, a new event type, concurrent scheduler ownership, or
  any extraction/cargo effect entering this increment.
