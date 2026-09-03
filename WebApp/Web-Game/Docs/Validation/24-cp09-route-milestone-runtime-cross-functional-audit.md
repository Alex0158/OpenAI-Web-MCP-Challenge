# CP-09 Route Milestone Runtime Cross-Functional Audit

## Review control

- Status: `COMPLETE; BOUNDED LOCAL ROUTE-TO-ARRIVAL RUNTIME VERIFIED`
- Date: 2026-09-02
- Scope: [`SK-TASK-028`](../Tasks/SK-TASK-028-cp09-route-milestone-and-derived-transit.md), route projection, due-work ordering, arrival transaction, schema migration, restart recovery, and CP-08 handoff
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decision: [`../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md)
- Challenge: [`23-cp09-route-milestone-preimplementation-challenge.md`](23-cp09-route-milestone-preimplementation-challenge.md)
- Task: [`../Tasks/SK-TASK-028-cp09-route-milestone-and-derived-transit.md`](../Tasks/SK-TASK-028-cp09-route-milestone-and-derived-transit.md)
- Evidence: [`../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md)
- Predecessor audit: [`22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md`](22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md)

## Verdict

The registered route increment is coherent and passes its bounded local process-runtime proof. A
CP-09 dispatch arms one deterministic arrival due marker. The worker movement phase derives a stable
intermediate position from the committed route, start time, and server movement rate; at the due
boundary it atomically changes the mission and attempt from `TRAVELLING` to `WORKING`, clears both due
markers, advances revisions, and appends one `MissionWorking` event. Duplicate, restart, migration,
and clock-boundary proofs pass, and no resource or wallet effect is created.

This is a ladder-level-4 local proof. The route phase handler is explicitly injected into the existing
worker clock seam for the test runtime. It does not prove a default-world scheduler composition,
browser projection, extraction, cargo, return, recall, combat, WebMCP, Re-entry, hosted continuity,
or judge reproduction.

## 1. End-to-end business chain

```text
assign_soldier_mission
-> WorkerCommandGateway FIFO and CP-09 owner/role/tool checks
-> atomic MissionDispatched with route, start time, and arrival due marker
-> WorldClock integer movement boundary
-> list due TRAVELLING attempts
-> persisted route, identity, role, target, and due-marker parity checks
-> derived route position at the boundary
-> atomic mission + mission_attempt TRAVELLING -> WORKING transition
-> one MissionWorking Domain Event and idempotency record
-> durable world time and mission state available after restart
```

The movement phase runs before deposit, contact, extraction, combat, settlement, and timers. Arrival
does not schedule extraction in this task; CP-10 must own the first extraction milestone after the
arrival boundary.

## 2. Cross-functional boundary review

| Surface | Verified disposition | Residual handoff |
|---|---|---|
| Persistence and migration | Schema 3 stores nullable `next_due_world_time` on mission and mission attempt. The emulated schema-2 migration now adds both columns inside the existing transaction and leaves historical rows `NULL`; malformed or negative due metadata fails visibly. | Preserve the migration chain and historical null semantics in later economy and combat schema work. |
| Mission and soldier identity | The attempt remains attached to the same stable `soldier_id`; active-attempt, role, tool, target, soldier state, and due-marker parity are rechecked before arrival. | Return, death, reissue, and HUNTER work must consume these revisions without creating a second soldier or attempt. |
| Route and navigation | The server validates adjacent waypoints, source/target identity, and `PLANNED` status. Intermediate coordinates are a pure projection of the committed route and authoritative world time; no client position is accepted. | Terrain changes, moving targets, route invalidation, encounter cells, and durable waypoint cursors remain later decisions. |
| Clock and ordering | The route service runs only at the movement phase and rejects a call that skips more than one unprocessed world boundary. CP-06's integer progression and 300-second recovery cap remain in force. | A default worker/host scheduler still needs explicit composition and multi-attempt batch policy. |
| State/event atomicity | One `commitTransition` writes the mission phase, attempt phase/last transition, due-marker consumption, revisions, world boundary, causal event, and idempotency record. A failure rolls back the transaction. | CP-10/11 must use the same transaction boundary for node, cargo, combat, and death settlement. |
| Event and delivery | `MissionWorking` is reused as the arrival event with stable mission/attempt/soldier identities and route payload. No new event or eligible Agent Signal is introduced. | CP-12 may project the event; CP-14 may later decide whether an owning event class is eligible for Re-entry. |
| Worker and gateway | Existing FIFO command and clock seams remain intact. The focused runtime wires one `MissionTravelService` as the movement handler and does not start a second clock, listener, or timer. | The normal application entrypoint has no default gameplay scheduler yet; this is a later integration gate. |
| Economy handoff | Arrival leaves the Wood node quantity unchanged, creates no cargo, and credits no coins. The mission is merely eligible for a later extraction phase. | CP-10 owns extraction cadence, capacity, node depletion, return, deposit, and coin conversion. |
| Snapshot and UI | No mission or route field is added to `client_snapshot`; the server result and event remain durable for a later read-model projection. | CP-12 owns mission rows, route/cargo risk, reconnect state, and accessible status text. |
| WebMCP and Re-entry | No page tool, Agent Signal, Receiver, Connector, prompt, or Thread message is emitted. The route transition cannot be requested from a client coordinate. | CP-13/14 must use the same server-bound read/action and coalesced wake contracts. |
| Operations and hosting | File-backed restart recovery is exercised locally under Node 24. No public listener, identity issuer, host sleep guarantee, or deployment was changed. | CP-16/17 own the local slice and hosted always-on proof. |

## 3. Failure, duplicate, stale, race, and recovery matrix

| Case | Expected invariant | Runtime disposition |
|---|---|---|
| Before due boundary | A route remains `TRAVELLING`; no arrival event or extraction effect exists. | Passed at world time `4` for a due marker of `5`. |
| Deterministic projection | Same durable route and world time produce the same midpoint; client coordinates cannot alter it. | Passed at midpoint `(28,64)` and repeated projection. |
| Due arrival | Mission and attempt advance together, due markers clear, revisions advance, and one event is appended. | Passed at world time `5`. |
| Duplicate boundary pass | A consumed due marker and phase prevent a second state or event effect. | Passed with a repeated service call. |
| Concurrent claimant | Two route workers cannot create two arrival events or advance revisions twice. | Passed with two service instances and the same SQLite store. |
| Stale or mismatched attempt | Missing active mission, role/tool/target parity, soldier field state, route, or due marker fails visibly without an invented arrival. | Guards are covered by the service and transaction revision predicates; malformed recovery is typed `RECOVERY_REQUIRED`. |
| Skipped world boundary | A route handler cannot advance durable time from `0` directly to `5`; the clock remains the only progression authority. | Passed with a regression proof; `RECOVERY_REQUIRED` leaves state unchanged. |
| Restart before arrival | Persisted route and due marker remain retryable; recovery reaches the same boundary once. | Passed by stopping at world time `3`, reopening, and recovering to `5`. |
| Legacy schema | Schema-2 mission rows gain nullable due metadata without an invented work item. | Passed with a disposable schema-2 emulation and metadata readback. |
| Transaction failure | Mission, attempt, due marker, event, cursor, idempotency, and world boundary cannot partially commit. | Uses the existing `commitTransition` rollback contract; no new partial path is introduced. |
| Multiple due attempts with one failure | Already committed attempts remain causal; an uncommitted attempt stays due and the clock becomes visibly recovery-blocked. | Accepted as the current per-attempt recovery behavior; a future batch scheduler task must define retry/lease policy before production scale. |

## 4. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P2 | The route handler is not composed into the default entrypoint because the default worker still exposes only the existing process and clock seams. | Deliberately outside this task's default-world/bootstrap and hosted non-goals. Keep the explicit test wiring and register a separate composition task before claiming continuous gameplay. |
| P2 | Intermediate route positions are derived rather than durably cursored, so an encounter cannot yet claim a per-cell contact from this boundary. | Correct for the selected minimal route milestone. Add a new Challenge before introducing a cursor, waypoint event, or encounter-aware scheduler. |
| P2 | A same-boundary loop can commit one due attempt before a later due attempt fails and blocks the clock. | Safe for the one-attempt proof because each transaction is atomic and the remaining due work is visible. Define multi-attempt lease/batch semantics before production concurrency or hosted load. |
| P3 | Mission and route data are not yet visible in the browser projection. | Correctly deferred to CP-12; no UI claim follows from this evidence. |

No finding blocks closure of `SK-TASK-028`. Each residual is a named handoff or reopen trigger and
does not weaken server authority, identity, event ordering, restart determinism, or the no-settlement
boundary proved here.

## 5. Closure disposition

`SK-TASK-028` closes as `runtime_verified` for one local CP-09 GATHERER route-to-arrival boundary,
including due-marker persistence, derived transit, atomic phase/event state, schema migration, clock
ordering, duplicate protection, and restart recovery. The next coherent implementation boundary is
the CP-10 extraction/cargo handoff; it must receive its own task control and Challenge before code.
