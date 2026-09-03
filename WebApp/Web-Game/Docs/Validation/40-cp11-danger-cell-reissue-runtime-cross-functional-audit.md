# CP-11 Danger-Cell Reissue and Anti-Loop Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-036`](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md)
- Evidence: [`SK-EVID-025`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md)
- Governing decision: [`ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md)
- Challenge: [`39-cp11-danger-cell-reissue-preimplementation-challenge.md`](39-cp11-danger-cell-reissue-preimplementation-challenge.md)
- Contract: `SK-MVP-0.2`; schema `6`; migration `cp11-002`
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL LEVEL-4 WORKER SCOPE**

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Combat and human consequence | A terminal GATHERER loss remains the single death authority. The transaction deletes only exposed field cargo, terminalizes the losing attempt, respawns the same soldier, and records the reissue or review outcome. | Accepted; fixed Rock loss and reachable-target reissue traces pass. |
| Mission identity and role lock | A safe continuation creates a fresh `mission_attempt_id` while preserving `soldier_id`, `GATHERER`, `PICKAXE`, target, home anchor, and return policy. No role-switch or duplicate roster row is introduced. | Accepted; positive reissue and repeated-death tests pass. |
| Persistence and migration | Schema-v5 file-backed rows migrate atomically to schema 6 / `cp11-002`. Budget, danger cell, review reason, and terminal cause are typed and validated at the store boundary. | Accepted; migration and restart assertions pass. |
| Route authority and geometry | The service derives the integer danger cell from the server encounter position and plans one BFS route from the durable home anchor to the original target. The Chebyshev-one forbidden set includes the target; fixed neighbour order is deterministic. | Accepted; every positive waypoint is adjacent and safe, and the fixed Rock conflict returns `NO_SAFE_REISSUE_ROUTE`. |
| Fixed-fixture honesty | The seeded Rock target intentionally overlaps the danger exclusion. The runtime keeps this as an explicit review stop rather than adding a target exemption, teleport, old-route fallback, or hidden retry. | Accepted; fixture geometry and event payload agree. |
| Clock and due-work order | Contact and combat remain in the worker's documented integer-second sequence. Reissue schedules the new attempt from the committed route estimate without advancing world time in a second transaction. | Accepted for the worker-driven fixture; the default all-phase scheduler remains a later gate. |
| Event ordering and idempotency | The terminal event tail remains causal and ordered, with one typed `MissionReissued` after respawn. Duplicate keys replay the complete result; changed requests and stale revisions fail before mutation. | Accepted; exact event, duplicate, stale, ownership, and changed-request vectors pass. |
| Atomic rollback and restart | An injected post-state failure rolls back world time, encounter, cargo, mission, attempt, soldier, budget, events, cursor, and idempotency. Reopening the same SQLite file preserves the migration and review/reissue state. | Accepted; rollback and file-backed restart vectors pass. |
| Economy and cargo | A monster death destroys unbanked cargo and creates no coins or killer reward. Successful deposit remains the only settlement boundary; deposit clears reissue metadata and resets the next chain's budget. | Accepted; CP-10 deposit regression and controlled positive-deposit reset pass. |
| Manual recovery | A player can dispatch the shelter resident from `WAITING_REVIEW`. Manual dispatch clears the typed reason and danger cell, creates a fresh attempt, and restores budget `1`; no automatic loop resumes silently. | Accepted; manual reset vector passes. |
| HUNTER and monster lifecycle | The existing HUNTER victory/return path and normal monster patrol remain unchanged. HUNTER loss, monster drops, pursuit/retreat, and multi-target arbitration are outside this increment. | Accepted as a preserved predecessor; future loss fixtures require a separate task. |
| Dashboard and Agent handoff | Durable mission fields and `MissionReissued` carry cause, role, tool, target, danger cell, budget, route, outcome, and next valid action for a future projection. No Agent Signal, prompt, credential, or external delivery is created here. | Accepted for data readiness; CP-12 through CP-14 remain open. |
| Browser, WebMCP, and Re-entry | The implementation does not claim a page projection, WebMCP registration, Agent action, coalesced Signal, or Re-entry wake. Immediate world progress and review state remain independent of browser presence. | Deferred to their registered gates. |
| Performance and boundedness | The planner is bounded by validated fixture dimensions (maximum 512 × 512 and area 262,144) and one BFS per terminal loss. The policy allows at most one automatic continuation and cannot spin on repeated danger. | Accepted for the fixture boundary; population-scale scheduler and load budgets remain open. |

## Invariants rechecked

- The server and worker remain the only state-changing authority for combat, mission, cargo, route,
  world time, events, revisions, and idempotency.
- A `soldier_id` is stable across respawn; every reissue gets a new attempt identity and no soldier
  can hold two active attempts.
- The danger cell is persisted before the reissue result is observable, and the forbidden set is
  applied consistently to source, target, and every waypoint.
- The fixed Rock target conflict is visible as `NO_SAFE_REISSUE_ROUTE`; a second monster death is
  visible as `REPEATED_MONSTER_DEATH`; neither outcome creates another automatic attempt.
- Cargo loss, death, respawn, reissue/review, events, revisions, and idempotency either commit as one
  transaction or remain unchanged and retryable.
- Manual dispatch and successful deposit are explicit reset boundaries; review metadata cannot leak
  into the next chain.
- Existing CP-09, CP-10, CP-11 GATHERER, and CP-11 HUNTER behavior remains green under the recorded
  focused and aggregate checks.

## Residual risks and reopen triggers

The local result does not cover HUNTER loss, PvP or siege, breach conversion, multi-worker fairness,
the default all-phase scheduler, browser/Canvas UX, genuine WebMCP capability, Agent Signal or
Re-entry delivery, production identity, hosted continuity, deployment, population-scale performance,
or judge reproduction. Reopen this audit if the schema or contract changes, route geometry or danger
rounding changes, the event or idempotency owner moves, a target exemption is proposed, a second
automatic attempt becomes possible, or a later scheduler/external adapter owns the transition.
