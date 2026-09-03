# SK-EVID-046: CP-13 Recall Transition Runtime Verification

**Status:** RUNTIME-VERIFIED FOR THE NAMED LOCAL SERVER AND RETURN NAVIGATION SCOPE; page WebMCP, Agent, Re-entry, hosted, independent-browser, and judge gates remain open  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md)  
**Challenge:** [`Validation/72`](../Validation/72-cp13-recall-transition-preimplementation-challenge.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Fixture:** [`Scenario/13`](../Scenarios/13-cp13-webmcp-fixtures.md) and the persisted G2 two-player fixture

## Question

Does the bounded server-authoritative `force_recall_soldier` transition move a valid G2 GATHERER or
HUNTER mission into ordinary return while preserving route, role, cargo, ownership, revisions,
idempotency, combat boundaries, gateway ordering, and restart behavior?

## Environment and commands

- Runtime: Node `v24.20.0` selected through `/opt/homebrew/opt/node@24/bin`; project dependencies were already installed.
- Focused transition and return proof:

  ```text
  PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp13-recall-transition.test.ts tests/cp10-return-navigation.test.ts
  ```

  Result: **18/18 tests passed**.

- Affected mission and combat regressions:

  ```text
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp09
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp10
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp10-deposit
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp11
  PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp11-hunter.test.ts tests/cp11-reissue.test.ts
  ```

  Results: **20/20**, **49/49**, **16/16**, **7/7**, and **14/14** tests passed respectively.

- Cross-boundary projection, gateway, and clock regressions:

  ```text
  PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp12-projection.test.ts tests/cp08-worker-gateway.test.ts
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp06
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
  ```

  Results: **12/12**, **21/21**, and TypeScript completed with no errors.

## Observed proof

| Boundary | Result | Evidence in the focused suite |
|---|---|---|
| Travel recall | Pass | A current GATHERER moves from `TRAVELLING` to `RETURNING`; its position at world time 2 is `{x: 22, y: 64}` and the reverse prefix takes two world seconds. |
| Work recall | Pass | A WORKING GATHERER keeps its role, AXE loadout, and exposed cargo; the existing home/deposit path later credits one Wood coin and clears cargo. |
| HUNTER recall | Pass | A HUNTER uses the same transition, keeps `ON_RECALL`, and never arms extraction or creates cargo. |
| Combat guard | Pass | A resolving encounter returns typed `IN_COMBAT` with no phase, revision, event, cargo, or route mutation. |
| Identity and ownership | Pass | Stale soldier revisions and a foreign binding are rejected with no recall event; the rejected outcome is durable. |
| Idempotency | Pass | An identical retry replays the original result with `duplicate=true`; only one `MissionRecalled` event exists. |
| Atomicity | Pass | Injected failure after event persistence rolls back state, event cursor, world time, and idempotency; the same request succeeds on retry. |
| Restart | Pass | A file-backed restart re-derives the immutable outbound route prefix and reaches the home boundary once. |
| Resident guard | Pass | A post-arrival recall returns typed `ALREADY_AT_SHELTER`, persists the rejected outcome, and writes no second event. |
| Existing regressions | Pass | CP-06, CP-08 gateway/projection, CP-09, CP-10, and CP-11 affected suites remain green. |

## Implementation boundary proved

- `WorkerCommandGateway.forceRecallSoldier` is the only command ingress and shares the existing FIFO
  plus movement-intent mutation stop.
- `MissionService.forceRecallSoldier` derives owner, current world time, route position, return policy,
  and encounter state from the server; no client coordinate or route is accepted.
- `PersistenceStore.commitMissionRecall` atomically updates mission and attempt phase/transition fields,
  persists one `MissionRecalled`, and stores the exact committed result for idempotent replay.
- `MissionReturnService.reverseMissionRoute` projects an intermediate recall position from the immutable
  outbound route and derives a reverse prefix. The normal target-origin return remains unchanged.
- `ALREADY_AT_SHELTER` and `IN_COMBAT` are typed local persistence outcomes; no page-level mapping is
  introduced in this increment.

## Claim boundary

This evidence proves one local file-backed worker and its server-side mission/return composition. It
does not prove page-bound WebMCP discovery or invocation, Agent grants, Cloud Receiver/Local Connector
delivery, Re-entry thread continuation, independent browser identity, hosted continuity, public load,
or judge reproduction. The accepted four-read CP-13 page package and deferred Soldier dispatch candidate
remain governed by [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md).
