# CP-13 Recall Transition Runtime Cross-Functional Audit

**Status:** RUNTIME-VERIFIED FOR THE NAMED LOCAL SERVER AND RETURN NAVIGATION SCOPE; page WebMCP, Agent, Re-entry, hosted, independent-browser, and judge gates remain open  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md)  
**Challenge:** [`Validation/72`](72-cp13-recall-transition-preimplementation-challenge.md)  
**Evidence:** [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Audit question

Does the implemented recall transition preserve the existing world, mission, combat, persistence,
gateway, projection, and settlement authorities while adding one bounded server command for G2?

## Evidence boundary

- The focused CP-13 and CP-10 return suite covers travel/work/HUNTER recall, resident refusal,
  route-prefix projection, cargo settlement, combat refusal, stale and foreign requests, idempotent
  replay, injected rollback, and a file-backed restart.
- CP-06, CP-08 gateway/projection, CP-09, CP-10, and CP-11 affected suites remain green under Node
  `v24.20.0`; TypeScript typecheck passes.
- No page route, WebMCP registration, Agent grant, Signal, Receiver, Connector, external service,
  browser profile, hosted process, or judge environment is included in this proof.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Command authority | `forceRecallSoldier` enters through the existing worker FIFO and stops any active player movement intent before the mutation. | Accepted; no second queue or direct store route. |
| Server scope | Player binding, shelter ownership, soldier/mission/attempt linkage, current world time, route, home anchor, and encounter state are read from the server. | Accepted; caller supplies identity and expected revisions only. |
| Mission state | Only active GATHERER/HUNTER attempts in `TRAVELLING` or `WORKING` are accepted. Mission and attempt move atomically to `RETURNING`; due markers are cleared and the existing transition timestamp is updated. | Pass; revisions advance once. |
| Route and movement | The outbound `MissionRoutePlan` stays immutable. The current outbound position and reverse prefix are derived from `start_world_time` plus the recall transition time, so an intermediate recall has a shorter due boundary without a persisted waypoint cursor. | Pass; normal target-origin return and projection remain green. |
| Cargo and economy | Recall does not clear or credit cargo. Exposed work cargo remains at risk until the existing home/deposit phases; Wood settlement still credits one coin in the focused proof. | Pass. |
| Combat | `LOCKED`, `RESOLVING`, and the future `CONTACT` guard are represented as a typed `IN_COMBAT` refusal. The transition creates no deferred intent. | Pass for current `LOCKED`/`RESOLVING`; future `CONTACT` remains a vocabulary compatibility gate. |
| Resident and terminal states | Resident calls return `ALREADY_AT_SHELTER`; already-returning/settling and review/terminal/non-field states remain bounded existing failures. | Pass; no new mission phase. |
| Persistence | State, event, cursor, and idempotency result commit in one transaction. Injected failure leaves no partial recall and the same request retries successfully. | Pass. |
| Revisions and races | Soldier, mission, and attempt revisions are all checked. Stale and foreign requests are rejected before mutation; old attempt identity cannot control a later one. | Pass for the named local races. |
| Idempotency | Exact request/binding fingerprints replay one result and one event; changed identity or payload conflicts. Rejected outcomes are durable where the command is definitive. | Pass. |
| Event contract | `MissionRecalled` is bounded to mission/soldier/attempt identity, phase transition, derived recall position, home anchor, return duration, policy, and world time. It does not wake an Agent Signal. | Accepted; page-level event mapping remains later work. |
| Reconciliation | The command result is metadata only. Existing full `client_snapshot` remains the sole renderable ingress; no optimistic route or phase is introduced. | Accepted. |
| Restart and scheduler | A fresh file-backed worker re-derives the return prefix and crosses home once. The existing world clock and phase coordinator continue to own due work. | Pass for local restart; hosted continuity remains open. |
| Scope sequencing | The SideChat `assign_soldier_mission` page-command suggestion remains deferred because target discovery, grant semantics, and page schema are not closed. | Accepted; CP-13 page implementation remains gated after this task. |

## Race and failure review

| Risk | Observed control | Result |
|---|---|---|
| Teleport on recall | Position is derived from the immutable route and transition time; only phase/transition metadata is persisted. | Pass |
| Full outbound due reuse | Both return navigation and home-arrival persistence derive the reverse-prefix duration. | Pass |
| Combat escape | Encounter lock is checked before any state mutation and records a typed no-op. | Pass |
| Cargo loss or coin fabrication | Recall patches no cargo, shelter, or soldier economic fields; settlement remains a separate worker phase. | Pass |
| Duplicate event | Idempotency fingerprint and committed result replay are inside the same persistence boundary. | Pass |
| Partial transaction | Failure injection after events rolls back state, cursor, world time, and idempotency. | Pass |
| Stale dashboard action | Three entity revisions plus stable attempt identity are required. | Pass |
| Cross-scope mutation | Binding is checked against the shelter that owns the soldier; foreign input cannot select a shelter or route. | Pass |
| Projection drift | `world-projection` consumes the same reverse-route helper and existing full snapshot path. | Pass |
| Scope creep | No page/WebMCP, Agent, external delivery, scheduler, schema, or contract-version work entered this task. | Pass |

## Audit decision

1. `SK-TASK-060` is runtime-verified for the local server-authoritative recall and return-navigation
   scope under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md).
2. The implementation keeps the existing world clock, phase order, persistence transaction, snapshot,
   and page/Agent boundaries intact. It closes the server seam needed before page-bound `force_recall_soldier`.
3. The SideChat Soldier dispatch amendment remains a deferred candidate under [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md); it is not silently promoted by this runtime task.
4. Reopen this audit if recall requires a client position, persisted waypoint cursor, deferred combat
   intent, new encounter phase, page registration, Agent grant, schema migration, or contract version.

## Exact conclusion

**The G2 server now accepts a bounded owner-authorized recall for active GATHERER/HUNTER missions,
preserves role, route, cargo, and identity, refuses active combat, commits one causal event with
idempotent replay, and re-derives a correct return after restart. This closes the local recall seam;
WebMCP page tools, Agent/Re-entry delivery, hosted continuity, independent-browser identity, and judge
claims remain separate gates.**
