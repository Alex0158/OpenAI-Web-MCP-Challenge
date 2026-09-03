# CP-10 Return Navigation Runtime Cross-Functional Audit

**Status:** Complete for the bounded local G2 return-navigation and home-crossing outcome  
**Date:** 2026-09-02  
**Task:** [\`SK-TASK-032\`](../Tasks/SK-TASK-032-cp10-return-navigation-and-home-crossing.md)  
**Evidence:** [\`SK-EVID-021\`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md)  
**Decision:** [\`ADR-GAME-0023\`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)  
**Challenge:** [\`31-cp10-return-navigation-preimplementation-challenge.md\`](31-cp10-return-navigation-preimplementation-challenge.md)

## Verdict

The selected return policy closes the next normal CP-10 movement boundary without adding a second
route authority or mixing movement with settlement. A returning G2 GATHERER derives a projection-only
reverse of its immutable outbound route, uses the durable handoff time plus route duration for due
work, and commits one exact home-anchor crossing to \`DEPOSITING\`. Mission and attempt revisions,
soldier identity, field lifecycle, exposed cargo, event cursor, and world time remain coherent under
duplicate, stale, ownership, malformed-route, rollback, and restart paths. No cross-module
contradiction remains inside this bounded task.

## Business chain audit

\`\`\`text
CP-09 dispatch
  → route arrival at T
  → CP-10 extraction at T + 2
  → full/depleted extraction handoff to RETURNING at R
  → reverse immutable route from target to home anchor
  → exact home crossing in movement at H
  → MissionHomeReached
  → later deposit transaction
\`\`\`

| Boundary | Verified behavior | Disposition |
|---|---|---|
| Identity and ownership | World, mission, attempt, soldier, and shelter visibility are re-read; the specialized store requires the worker binding \`worker:<worldId>\` | Pass |
| Route authority | The persisted outbound route is validated, its source must equal \`home_anchor\`, and only an in-memory reversed projection is used | Pass |
| Position and due work | Return position is derived from \`last_transition_world_time\`, authoritative world time, and the fixed 3.0 tiles/second rate; no client coordinate or browser timer is accepted | Pass |
| Mission phase | Paired \`RETURNING\` records with null extraction due markers transition atomically to \`DEPOSITING\` | Pass |
| Soldier lifecycle | The same soldier remains \`FIELD\`; no respawn, role change, tool change, or resident-state claim is introduced | Pass |
| Cargo/economy | Existing field cargo remains unchanged and exposed; shelter coins remain zero until deposit | Pass |
| Event history | One additive \`MissionHomeReached\` event records exact anchor, due marker, arrival position, phase change, and world time | Pass |
| Clock ordering | Return crossing is handled in injected \`movement\` before the later \`deposit\`, \`contact\`, \`extraction\`, \`combat\`, and \`settlement\` phases | Pass |
| Duplicate/idempotency | Stable attempt/due work and event identities replay one stored result; a repeated movement pass is a no-op | Pass |
| Stale/race handling | Expected mission, attempt, and soldier revisions plus active-attempt linkage prevent a competing or stale commit | Pass |
| Failure/rollback | Failure after state or event work rolls back world time, revisions, cursor, phases, and idempotency | Pass |
| Restart/recovery | Reopening the file-backed store derives the same reverse route and crosses once at the durable due boundary | Pass |
| Deposit/settlement | Cargo removal, \`CargoDeposited\`, and \`CoinsCredited\` remain a later transaction | Deferred |
| Recall and migration | Arbitrary-position recall and moving shelter anchors are not silently mapped onto the node route | Deferred |
| Contact/combat/death | No encounter, battle, cargo loot, death, breach, or respawn effect runs at home crossing | Deferred |
| Projection/UI | The result/event can feed a later snapshot and dashboard history; no browser visual or input surface changed | Deferred to CP-12 |
| WebMCP/Re-entry | \`MissionHomeReached\` is routine history and is not eligible for an Agent wake in this increment | Deferred to CP-13/14 |
| Operations/hosting | WAL, worker-owned clock, and restart are exercised locally through an injected phase seam; default scheduler and hosting remain unproven | Deferred to CP-16/17 |

## Failure and race matrix

| Case | Required outcome | Runtime proof |
|---|---|---|
| Return before due | Reverse projection advances, but no phase or event mutation occurs | Focused intermediate-position test |
| Due or delayed boundary | Exact home anchor, one \`RETURNING → DEPOSITING\` transition, one event | Focused due and delayed clock tests |
| Duplicate movement pass | Empty result with no second event or revision | Exactly-once test |
| Forged anchor or arrival payload | \`INVALID_INPUT\`; return state, cursor, and history unchanged | Forged-payload test |
| Stale mission/attempt revision | \`RECOVERY_REQUIRED\`; world and return state unchanged | Stale-revision test |
| Wrong shelter visibility | \`OWNERSHIP_DENIED\`; no state or event mutation | Ownership test |
| Missing or mismatched route/home | \`RECOVERY_REQUIRED\`; no teleport or fallback | Malformed-route test |
| Failure after state/events | SQLite rollback; valid retry remains possible | Injected-failure test |
| Restart before crossing | Same reverse route and durable due boundary complete once after reopen | Restart test |
| Cargo present at crossing | Cargo quantity/provenance remains unchanged; no coin exists yet | Due-boundary assertions |
| Same-boundary contact | Movement/home crossing precedes later contact phase; combat is outside the transaction | Phase contract and injected harness |

## Findings and residual gates

- **P2 — default scheduler composition remains open:** The local tests inject movement, extraction,
  and return handlers into \`WorldClock\`. \`WorldWorkerModule\`'s default construction does not yet
  prove that all gameplay phases run continuously, so this result cannot support an always-on hosted
  world claim.
- **P2 — settlement remains separate:** A \`DEPOSITING\` mission has not removed cargo, credited
  Wood/Rock coins, or released the soldier to \`AT_SHELTER\`. The next CP-10 task must own that
  transaction and its restart/idempotency proof.
- **P2 — moving-home and recall semantics remain open:** The accepted route reversal assumes a fixed
  home anchor for this attempt. Shelter migration or recall from any field position must reopen
  ADR-GAME-0023 before changing the target or route authority.
- **P2 — event consumer integration remains open:** The additive event is persisted but not yet wired
  into a browser snapshot, WebMCP action, or Re-entry wake. A consumer must preserve its routine
  classification and shelter visibility.
- **P3 — fixed-speed fixture assumption:** The due boundary relies on the accepted 3.0 tiles/second
  G2 rate and route duration. Terrain costs, equipment modifiers, and path replanning require a new
  contract decision rather than a silent change.

Task-032 is closed as \`runtime_verified\` for local automatic G2 return navigation and exact
home-anchor crossing. Reopen before adding recall, migration, route replanning, combat at the
boundary, settlement, a default all-phase scheduler, a new schema/event/contract version, a browser
or WebMCP action, Re-entry delivery, or hosted execution.
