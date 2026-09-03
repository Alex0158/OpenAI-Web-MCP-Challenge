# SK-TASK-060: CP-13 Server-Authoritative Recall Transition

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The server-authoritative recall transition, route-prefix return projection, combat guard, idempotency, rollback, cargo settlement, and file-backed restart proof are runtime-verified in [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md) and [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md).
- Next gate: The bounded CP-13 page-read implementation and canonical four-read capability are verified under [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md). Dynamic recall grant delivery, Re-entry, and the deferred Soldier dispatch candidate remain outside this closed local server scope.

## Identity

- Task ID: `SK-TASK-060`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: Recall crosses mission phase, route derivation, combat locking, cargo risk,
  entity revisions, durable events, idempotency, gateway ordering, restart recovery, and the later
  page-tool/Re-entry handoff. The change is bounded and reversible, but a false green could create a
  teleport, bypass combat, or lose cargo.

## Objective

Implement one server-authoritative `force_recall_soldier` transition for the existing G2 GATHERER and
HUNTER mission paths. A valid current mission queues ordinary travel to its persisted home anchor;
the soldier remains in the field, keeps its role, tool, route history, and exposed cargo, and the
worker later performs the existing return/home/deposit phases.

## Success and non-goals

- Success: A strict internal command contract carries command identity, idempotency identity, soldier,
  mission, mission-attempt, and expected entity revisions. Scope comes from the server binding; the
  caller cannot select a world, player, shelter, route, home anchor, or current position.
- Success: `TRAVELLING` and `WORKING` GATHERER/HUNTER attempts transition atomically to `RETURNING`,
  clear the outbound due marker, update the transition time, and emit one `MissionRecalled` event.
- Success: Return navigation derives the current outbound position and a reverse route from the
  immutable committed route plus authoritative world time. It remains restart-safe without a new
  waypoint cursor or a second scheduler.
- Success: `CONTACT`, `LOCKED`, or `RESOLVING` encounter state returns typed `IN_COMBAT` with no phase,
  cargo, revision, event, or route change. The current contract does not add deferred return intent.
- Success: The transition preserves role/tool, attempt identity, home anchor, route history, and cargo;
  it never teleports, credits coins, clears cargo, changes role, or creates a replacement soldier.
- Success: Duplicate idempotency replays one committed result, changed payload under the same key is
  rejected, stale or foreign revisions have no side effect, and restart/retry cannot duplicate events.
- Success: The existing worker FIFO is the only command path, and the full snapshot remains the only
  renderable reconciliation ingress.
- Non-goals: WebMCP registration, page tools, Agent grant or Signal delivery, Receiver/Connector,
  target discovery, `assign_soldier_mission` page dispatch, HUNTER selectors, siege/migration,
  deferred return intent, new schema version, new scheduler, or hosted/judge claims.

## Scope and authority

- In scope: `src/server/mission-service.ts`, `src/server/worker-command-gateway.ts`,
  `src/server/persistence/store.ts`, `src/server/persistence/types.ts`, `src/server/persistence/errors.ts`,
  `src/server/mission-return-service.ts`, the smallest shared command types needed by the server,
  focused CP-13 tests, and task-owned evidence/audit records.
- Out of scope: page bundles, Next routes, `reentry-core/`, `mvp/`, RightSpot, external services,
  credentials, deployment, and unrelated dirty files.
- Allowed actions: edit the named runtime/tests/docs, install only existing-project dependencies if
  required, run Node 24 focused verification, and use fresh file-backed local fixtures. Do not stage,
  commit, push, deploy, spend, or contact external parties.
- Revalidate when: `SK-MVP-0.2`, the mission phase/event vocabulary, encounter contract, route authority,
  gateway ordering, or CP-13 grant boundary changes.

## Owning authority

- Page contract and sequencing: [`Validation/64`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md),
  [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md), and [`ADR-GAME-0006`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
- Mission phases and recall behavior: [`detail-08 mission dispatch, return, and recall`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md),
  [`M09-06`–`M09-08`](../Scenarios/09-cp09-mission-role-return-fixtures.md), and [`Engineering/09`](../Engineering/09-mvp-contract-sheet.md)
- Dispatch/role lock and route: [`ADR-GAME-0018`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md),
  [`ADR-GAME-0019`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), and [`ADR-GAME-0023`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)
- Combat boundary: [`ADR-GAME-0025`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md) and the shared encounter state machine
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified: Existing dispatch, travel, extraction, return navigation, home crossing, deposit, combat,
  gateway FIFO, persistence idempotency, and full-snapshot boundaries are runtime-verified at their
  named local scopes. `MissionReturnService` currently handles a return that starts at the committed
  target; no explicit recall command exists.
- Verified: `SK-MVP-0.2` already names `force_recall_soldier`, `MissionRecalled`, `ALREADY_AT_SHELTER`,
  `IN_COMBAT`, revisions, idempotency, and normal return semantics; this task fills the missing server
  transition without changing the contract version.
- Inferred: The smallest safe implementation keeps the outbound route immutable and derives a reverse
  prefix from the current authoritative route position, avoiding a migration or persisted cursor.
- Unknown: Whether all current callers need an HTTP adapter after the server transition; that belongs
  to the later CP-13 page-tool task and is deliberately not decided here.

## Smallest reversible action

Add the typed recall input/result and persistence transition behind the existing gateway. Start with
Red tests for valid travel/work recalls, combat refusal, ownership/revision/idempotency races, and
restart-safe return navigation. Stop if the implementation requires a client coordinate, a second
clock/queue, a new schema version, a new encounter phase, or a page/Agent authority shortcut.

## Verification and closure target

- Minimum verification: focused CP-13 recall tests, affected CP-09/10/11 mission/return/combat tests,
  `npm run typecheck`, `git diff --check`, the documentation validator, and one fresh file-backed
  restart trace. Run only the smallest affected suites required by the change.
- Closure target: `runtime_verified` for the named local server transition and return-navigation scope;
  this does not close WebMCP, Re-entry, hosted continuity, independent-browser, or judge claims.
- Rollback or remediation: revert only Task060-owned runtime/tests/evidence if a named invariant is
  falsified; preserve the accepted four-read preparation and all predecessor evidence.
- Reopen trigger: a phase or encounter bypass, teleport, cargo/coin mutation during recall, duplicate
  event, stale/foreign mutation, route mismatch after restart, worker ordering regression, or any need
  for a page registration, grant, new schema, or new contract version.
