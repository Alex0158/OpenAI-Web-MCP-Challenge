# CP-10 Return Navigation and Home-Crossing Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-032`
- Promoted decision: [`ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation under the delegated implementation scope
- Date: 2026-09-02

## Decision question

How should an automatically returning G2 gatherer travel from a resource node to its shelter and cross
the authoritative home boundary without adding a second route authority, a durable waypoint cursor, a
teleport path, or premature deposit settlement?

## Objective and binding constraints

- Real objective: turn a committed `RETURNING` CP-10 attempt into one durable `DEPOSITING` handoff when
  its server-derived return position reaches the persisted `home_anchor`.
- The worker owns world time, route position, mission phase, soldier lifecycle, cargo ownership,
  revisions, event order, and idempotency. The browser, WebMCP surface, and Agent cannot submit a
  return coordinate or claim home arrival.
- The outbound route is immutable, starts at the shelter anchor, ends at the resource target, and is
  already persisted with a walkability version and estimated travel time. The same route may be
  traversed in reverse for this bounded fixture.
- CP-10 already clears the extraction due markers and records `last_transition_world_time` when it
  hands an attempt to `RETURNING`. The return due time must therefore be reproducible from durable
  state and must not depend on a browser timer or an unrecorded process counter.
- The accepted clock order remains movement, deposit, contact, extraction, combat, settlement, and
  timers. Home crossing occurs in movement; deposit remains a later deposit-phase transaction.

## Evidence and falsifiers

- Verified predecessor: CP-09 stores an immutable route and `home_anchor`, derives outbound transit
  from world time, and commits one atomic arrival. CP-10 stores `RETURNING`, clears extraction due
  markers, and persists the last transition time while preserving route and cargo.
- Verified runtime boundary: the soldier remains `FIELD` during `RETURNING`; `DEPOSITING` is a mission
  phase and is not a second soldier lifecycle state. No default all-phase scheduler is currently
  wired, so this task must consume the existing injected movement-phase seam only.
- A design falsifier is any G2 route whose source is not the recorded home anchor, a requirement to
  move the shelter during this attempt, a need for per-waypoint durable progress, or a consumer that
  requires deposit and coin credit in the movement transaction. Each would reopen the decision before
  implementation.

## Cross-functional surfaces

| Surface | In this task | Explicitly deferred |
|---|---|---|
| Navigation | Reverse the committed route, derive position from return start time and world time, and detect exact arrival at `home_anchor` | Replanning, terrain-cost tuning, migrating shelter anchor, recall from a non-node position |
| Mission/phase | Atomic `RETURNING → DEPOSITING` handoff with one home-arrival event | Deposit completion, repeat/reissue policy, siege phases |
| Soldier identity | Preserve the same `soldier_id` and `FIELD` lifecycle until the deposit boundary | Death, respawn, breach conversion, role changes |
| Cargo/economy | Preserve exposed cargo unchanged through the crossing | Cargo removal, Wood/Rock coin conversion, PvP or monster transfer |
| Persistence | Typed transaction validates identity, phase, revisions, due derivation, event payload, and idempotency | Schema migration, new cursor columns, ledger schema |
| Clock/order | Consume the existing `movement` phase before `deposit`, with bounded delayed recovery | Default scheduler composition and hosted clock |
| Events | Add one additive `MissionHomeReached` Domain Event under `SK-MVP-0.2`; do not make it Re-entry eligible | Deposit, combat, Re-entry delivery |
| UI/API | No public command or client coordinate; future projections can show `DEPOSITING` | Browser Canvas, WebMCP, Agent action, hosted wire |

## Options

| Option | Decision | Trade-off |
|---|---|---|
| Derive a reverse of the immutable outbound route and calculate due from `last_transition_world_time + estimatedTravelWorldSeconds` | Select | No schema or second route authority; restart reproduces the same position and due boundary. The fixture assumes the shelter anchor stays fixed during the attempt. |
| Add a persisted return route or waypoint cursor | Reject | More durable state and migration surface without a G2 consumer; it would make a process-local cursor a hidden requirement. |
| Teleport to the shelter when `RETURNING` is set | Reject | Removes travel time and cargo risk, breaks the player-visible economy, and makes the movement phase unable to order home crossing. |
| Let the browser report the final coordinate | Reject | Moves collision and home authority into an untrusted projection. |
| Bundle home crossing, cargo removal, and coin credit | Reject | Mixes movement with settlement, makes deposit-before-contact ordering untestable, and expands the task beyond one failure boundary. |
| Reuse `MissionAutoReturned` or `MissionRecalled` as the arrival event | Reject | Those events describe why a return began; reusing them would make event history ambiguous and break later consumers. |

## Selected design

1. **Return route.** The service validates the persisted outbound route and requires its source to
   equal the persisted `home_anchor`. It constructs a projection-only reversed route by reversing the
   waypoints and swapping source/target. The walkability version, adjacent-step invariant, and
   estimated travel duration remain unchanged. No reversed route is written to the database.
2. **Return start and due.** The attempt's durable `last_transition_world_time` at the `RETURNING`
   handoff is the return start. The service derives `returnDueWorldTime = start + route.estimatedTravelWorldSeconds`.
   A returning attempt is eligible when this value is at or before the current authoritative boundary;
   there is no new `next_due_world_time` column or process-local cursor.
3. **Position and crossing.** Before committing, the service derives the reversed-route position from
   the return start and current world time at the accepted 3.0 tiles-per-world-second speed. Arrival
   is exact route-target equality at the persisted home anchor; a browser coordinate or a shelter
   radius cannot create an early crossing. A delayed but valid boundary may complete the already due
   route once.
4. **Atomic handoff.** A specialized store transaction re-reads the world, mission, attempt, soldier,
   route, and home anchor. It validates the active attempt, `RETURNING` phases, `FIELD` soldier,
   paired null extraction markers, revisions, worker binding, deterministic work/event identities,
   and server-derived payload. It changes mission and attempt to `DEPOSITING`, updates the attempt's
   last transition time, preserves cargo and soldier identity, appends `MissionHomeReached`, and stores
   the original result under one idempotency key.
5. **Phase isolation.** The transaction does not remove cargo, credit coins, resolve contact, alter
   role/tool, or mark the soldier `AT_SHELTER`. The next `deposit` phase owns settlement. If no deposit
   handler is installed, the durable `DEPOSITING` state remains visible and does not silently succeed.
6. **Event policy.** `MissionHomeReached` is routine history under the existing event envelope. It is
   not an eligible Re-entry wake in G2, and it carries no prompt, credential, hidden map state, or
   private Agent context.

## Failure and race matrix

| Case | Required result |
|---|---|
| Return before due | No transition, no event, and the derived intermediate position remains a projection only |
| Due or delayed boundary | One `RETURNING → DEPOSITING` transition at the current world time with exact home position |
| Duplicate movement pass | Original result and event id; no second transition or cursor |
| Stale mission, attempt, or soldier revision | Typed recovery failure; mission, cargo, and event history unchanged |
| Wrong worker binding or forged event payload | Visible ownership/input failure; no mutation |
| Missing route, bad waypoint, source/home mismatch, or impossible due | Typed recovery failure; no fallback or teleport |
| Restart before crossing | Re-derive the same reverse route and cross once when the durable due boundary is reached |
| Cargo present at crossing | Cargo remains exposed and untouched in `DEPOSITING`; no coins exist yet |
| Contact due on the same world boundary | Movement/home crossing precedes the later contact phase; combat is outside this task |
| Store failure after state or event write | Transaction rollback leaves `RETURNING`, revisions, event cursor, and idempotency retryable |

## Verification and recovery

- Red tests must fail before a return service and typed home-arrival transaction exist.
- Green tests must cover an intermediate return position, exact due arrival, delayed recovery, reverse
  route validation, duplicate/stale/ownership/malformed payloads, cargo preservation, event order,
  rollback, restart, and the movement-before-deposit boundary.
- The focused return suite is the inner-loop check. At closure, rerun the CP-09 route and CP-10
  extraction/contest transitive aggregate, Node 24 typecheck/build, dependency dry-run, documentation
  self-tests/validator, and scoped diff check.
- Recovery preserves the last committed `RETURNING` state. No failed crossing may clear cargo, credit
  coins, change the soldier lifecycle, or invent a route.

## Reopen triggers

Reopen this challenge before implementation if recall, shelter migration, moving home anchors, route
replanning, contact/combat at the boundary, a default all-phase scheduler, a new schema or contract
version, a new Agent/WebMCP action, or deposit/coin settlement enters the same increment.
