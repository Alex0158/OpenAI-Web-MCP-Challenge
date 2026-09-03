# CP-13 Recall Transition Pre-Implementation Challenge

**Status:** ACCEPTED EXECUTION BOUNDARY; RUNTIME OPEN  
**Checkpoint:** CP-13  
**Task:** [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Scenario:** [`CP-09 mission role and return fixtures`](../Scenarios/09-cp09-mission-role-return-fixtures.md)  
**Predecessor:** [`Validation/64`](64-cp13-page-tool-contract-preimplementation-challenge.md)  
**Date:** 2026-09-03

## Decision and boundary

The owner accepted the CP-13 sequencing: build and verify the server recall transition as a separate
increment before exposing `force_recall_soldier` through page-bound WebMCP. This challenge closes the
smallest implementation boundary for that transition. It does not register a page tool, create an
Agent grant, or change `SK-MVP-0.2`.

The command is server-bound and carries only command/idempotency identity, soldier/mission/attempt
identity, and expected current revisions. The server derives world time, ownership, route, home anchor,
position, and encounter state. The only accepted active phases are `TRAVELLING` and `WORKING` for
GATHERER or HUNTER. A valid call moves both mission and attempt to `RETURNING`, clears their due marker,
updates the transition time, and emits one `MissionRecalled` event. The soldier remains `FIELD` with the
same role/tool and the cargo remains exposed.

## Cross-functional checks

| Vector | Required invariant | Observable proof |
|---|---|---|
| Valid travel recall | Current revisions and owner are checked atomically; phase becomes `RETURNING` | One result, one event, mission/attempt revisions advance, no coin/cargo change |
| Valid work recall | Partial cargo and role/tool survive the transition | Cargo rows and role/tool are unchanged; return service accepts the attempt |
| Return route | Outbound route stays immutable; current position is derived from original start and authoritative recall time | Reverse route starts at the derived route point, ends at home, and reaches the same home boundary after restart |
| Combat race | Encounter `CONTACT` (if later represented), `LOCKED`, or `RESOLVING` cannot be escaped | Typed `IN_COMBAT`; no phase, revision, cargo, event, or route mutation |
| Resident/terminal phase | A resident recall is not a new mission; non-recallable active/terminal phases remain typed | `ALREADY_AT_SHELTER` for resident; existing bounded failure for returning/depositing/review/terminal cases |
| Ownership | Soldier, mission, attempt, shelter, and binding must form one server-derived chain | Foreign binding or cross-shelter identity returns ownership failure with no private state |
| Revisions | Soldier, mission, and attempt revisions are all live guards | Any stale field returns typed stale failure and leaves newer state unchanged |
| Idempotency | Same key and exact request replays; changed payload conflicts | One durable result/event; replay has `duplicate=true`; changed fingerprint is rejected |
| Event ordering | State and `MissionRecalled` are one transaction | Restart/retry shows the same event once with affected revisions and no signal wake |
| Gateway ordering | Recall shares the existing FIFO and mutation admission | Competing move/dispatch cannot cross the transition; no second queue/timer |
| Reconciliation | Mutation result is metadata only | A later full snapshot is the sole visible page update; no optimistic route/phase projection |

## Chosen implementation defaults

- Keep `MissionAttemptRecord.route` as the immutable outbound route. Derive a reverse prefix from the
  route position at the recall world time; persist only the existing phase and transition metadata.
- Use `MissionRecalled` as the causal transition event. Its bounded payload records the stable IDs,
  previous/new phase, recall position, home anchor, return travel duration, return policy, and world
  time; it does not become an Agent Signal.
- Treat `AT_SHELTER` as `ALREADY_AT_SHELTER`. Treat a currently active but already returning or settling
  attempt as the existing `MISSION_ACTIVE` failure, and a review/terminal/non-field attempt as the
  existing role/mission lock failure. Do not add a new error family for this increment.
- Map the persistence ownership failure to the future tool-level `NOT_OWNER` at the page boundary; no
  page mapping is implemented here.
- Preserve `IN_COMBAT` as a typed external failure with no deferred return intent. The current source
  encounter state vocabulary is `LOCKED`/`RESOLVING`; a future `CONTACT` representation must enter the
  same guard before this task can be considered complete.

## Non-goals and reopen gates

- No WebMCP registration, page transport, Agent grant, Signal/Receiver/Connector, target selector,
  Soldier dispatch tool, migration, siege, hosted runtime, or judge evidence.
- No new schema version, waypoint cursor, persisted return route, client coordinate, client clock,
  browser timer, or automatic retry queue.
- Reopen before implementation if the contract requires deferred return intent, a new event/version,
  a different current-position authority, a new mission phase, or an external grant lookup.

## Verification plan and claim boundary

1. Write Red tests for the valid GATHERER travel/work paths, HUNTER path, combat refusal, resident and
   non-recallable phases, ownership/revision failures, duplicate/conflicting idempotency, event shape,
   FIFO ordering, restart-safe reverse navigation, and failure atomicity.
2. Implement the smallest server/gateway/persistence seam until those tests are Green; refactor only
   after the state/event/revision contract is stable.
3. Run only the affected CP-09/10/11 suites, typecheck, documentation checks, and one fresh file-backed
   restart trace. Record evidence and a cross-functional audit before closing SK-TASK-060.

This record establishes an accepted implementation boundary and test plan. It is not runtime WebMCP,
Agent, Re-entry, hosted, or judge evidence, and it does not admit the CP-13 page-tool implementation.

