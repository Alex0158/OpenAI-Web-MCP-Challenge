# CP-09 Mission, Role, Return, and Recall Fixtures

**Status:** Dispatch, first route-arrival, and CP-10 first extraction handoff runtime-verified; repeated extraction, return, recall, and terminal phases remain open  
**Checkpoint:** CP-09  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-08/09 preparation audit](../Validation/09-cp08-cp09-preimplementation-audit.md)  
**Purpose:** Turn the accepted role-lock, mission-phase, route, return, recall, stale-revision, and identity rules into deterministic vectors for implementation after CP-08 exposes an authoritative route and snapshot seam.

These scenarios exercise assignment and the first extraction handoff. They do not settle repeated extraction, coins, combat damage,
or external Agent delivery; those outcomes remain owned by CP-10, CP-11, CP-13, and CP-14.

## Fixture envelope

| Field | Preparation value |
|---|---|
| Contract version | SK-MVP-0.2 |
| Fixture | sleepless-mvp-01 |
| Players and shelters | player-a/shelter-a, player-b/shelter-b |
| Stable soldiers | soldier-a-01 through soldier-a-05; equivalent B roster |
| Active G2 roles | GATHERER, HUNTER |
| Mission phases | AT_SHELTER, TRAVELLING, WORKING, RETURNING, DEPOSITING, WAITING_REVIEW, TERMINAL |
| Soldier lifecycle | AT_SHELTER, FIELD, DEAD, CORRUPTED_MONSTER |
| Encounter status | NONE, OBSERVED, CONTACT, LOCKED, RESOLVING, RESOLVED |
| Return policies | WHEN_FULL, ON_TARGET_DEPLETED, ON_RECALL |
| Mission identity | New mission_attempt_id for each dispatch or reissue; stable soldier_id throughout |

The target node, route, walkability version, and home anchor come from the persisted CP-07 fixture and
the CP-08 route service. The fixture must not invent a second soldier or use a client-provided route.

## Mission record target

Every attempt exposes enough data for a human or Agent to understand current work:

~~~text
mission_attempt_id
soldier_id
role
equipment_tier
target_reference
route_reference and walkability_version
home_anchor_reference
return_policy
start_world_time and last_transition_world_time
phase and entity_revision
cargo summary
encounter status when attached
death/failure cause and next valid action
~~~

The exact wire shape remains an implementation concern. The identity and phase separation are not.

## Vectors

### M09-01 — Valid gatherer dispatch locks the sortie

**Given:** soldier-a-01 is resident, idle, owned by shelter-a, and a sensed Wood or Rock target is
legally available.  
**When:** Player A submits a valid assign_soldier_mission command with current revisions and a new
idempotency key.  
**Then:** One transaction creates a new mission_attempt_id, records the role/tool/target/route/
return policy, moves the soldier to FIELD, sets the phase to TRAVELLING, records a planned route
handoff, and emits one causal result. No cargo or coin exists yet.

### M09-02 — Valid hunter dispatch uses a new attempt

**Given:** The same stable soldier is back at the shelter after a prior terminal attempt.  
**When:** The player assigns the HUNTER role with the valid sword loadout.  
**Then:** The new command creates a new mission_attempt_id linked to the same soldier_id, locks
the new role/loadout for the field attempt, and does not rewrite the prior attempt's history.

### M09-03 — Invalid dispatch has no partial effect

**Given:** A command has a wrong owner, stale soldier revision, unavailable target, invalid tool tier,
or non-resident soldier.  
**When:** The command reaches the worker.  
**Then:** It returns the relevant typed failure, creates no route, cargo, coin, or mission attempt,
and leaves the existing entity revision and history unchanged.

### M09-04 — Duplicate dispatch is idempotent

**Given:** A valid dispatch command is delivered twice with the same idempotency key.  
**When:** The worker handles the retry after the first transaction commits.  
**Then:** The second result is the original result, with no second mission attempt, event, route, or
field soldier.

### M09-05 — In-field role and tool changes are rejected

**Given:** soldier-a-01 is FIELD with a committed gatherer/pickaxe attempt.  
**When:** The page submits a request to change it to hunter/sword without returning home.  
**Then:** The server returns a role-lock failure such as ROLE_LOCKED, retains the original role/tool/
target/route, and records no new attempt. The UI explains that a new role requires a resident soldier
or a new dispatch after the current attempt ends.

### M09-16 — Route transit derives the same arrival after restart

**Given:** A dispatched GATHERER has a committed route, `start_world_time`, and a deterministic
`estimatedTravelWorldSeconds`.  
**When:** The worker derives an intermediate position before the due boundary, then restarts and
processes the movement boundary at or after the due time.  
**Then:** The derived position is identical for the same world time; at the due boundary one atomic
transition moves the mission and attempt from `TRAVELLING` to `WORKING` and emits one `MissionWorking`
event. A retry or later boundary creates no second event and no cargo or coin.

### M09-06 — Recall during travel queues normal return

**Given:** A soldier is TRAVELLING with or without exposed cargo and has a current home anchor.  
**When:** The owner submits force_recall_soldier with the current attempt and revisions.  
**Then:** The server commits the recall transition to RETURNING, preserves the role, route history,
and cargo, and computes ordinary travel to the current home anchor. It does not teleport, clear cargo,
credit coins, or create a replacement soldier.

### M09-07 — Recall during work preserves cargo risk

**Given:** A gatherer is WORKING with partial cargo and a valid route home.  
**When:** The owner recalls it before capacity or target depletion.  
**Then:** The phase becomes RETURNING; the cargo remains exposed until the authoritative home
boundary and deposit. A monster or encounter may still resolve according to CP-11; recall does not
grant invulnerability.

### M09-08 — Recall during an encounter keeps the combat boundary

**Given:** A field soldier is attached to an encounter in CONTACT, LOCKED, or RESOLVING.  
**When:** The owner submits a recall.  
**Then:** The implementation must preserve the invariant that recall cannot bypass combat. The
recommended minimal outcome is a typed IN_COMBAT rejection with no phase change; a deferred return
intent is an alternative that requires an explicit contract decision and additional race fields.

### M09-09 — Full pack and target depletion hand off to CP-10

**Given:** A gatherer reaches five cargo slots, or the target node reaches zero with partial cargo.  
**When:** The authoritative extraction milestone settles.  
**Then:** CP-10 owns the extraction and quantity transaction; CP-09 receives the resulting transition
to RETURNING with the existing attempt, route, home anchor, and cargo. No client-side capacity check
or coin credit is authoritative.

### M09-10 — Home crossing and deposit remain ordered

**Given:** A returning soldier reaches the current home anchor while a contact check is also due.  
**When:** The worker applies the accepted same-second order.  
**Then:** The soldier enters DEPOSITING; CP-10 may settle valid cargo before field danger is applied.
The mission record preserves the attempt and history, and the authoritative home/deposit transition
returns it to the resident state. This vector must be run with CP-06's boundary fixture.

### M09-11 — Death terminates the attempt without cloning

**Given:** A field soldier dies under the CP-11 combat result before deposit.  
**When:** The death transaction settles.  
**Then:** The current attempt becomes TERMINAL, exposed cargo follows the combat rule, the same
soldier_id respawns at the shelter, and the bounded reissue policy may create one fresh attempt. No
second roster entity, duplicate cargo, or duplicate mission is created.

### M09-12 — Stale recall cannot affect a later attempt

**Given:** Attempt A ends and the same soldier receives attempt B before an old recall for A arrives.  
**When:** The stale recall carries attempt A and old entity revisions.  
**Then:** The server returns STALE_REENTRY_CONTEXT or the appropriate stale typed result and leaves
attempt B unchanged. A human or Agent cannot control a later mission with an old context.

### M09-13 — Blocked route reaches review without a retry loop

**Given:** The route service reports no valid path after the bounded replan.  
**When:** The next route milestone is processed.  
**Then:** The mission enters WAITING_REVIEW with a typed reason and a visible next action. No route
retries indefinitely, no elapsed travel time is erased, and no cargo or coin is invented.

### M09-14 — Reconnect preserves mission identity and next action

**Given:** The browser closes during TRAVELLING, WORKING, or RETURNING.  
**When:** The owner reconnects and receives a full current client_snapshot.  
**Then:** The snapshot shows the same stable soldier, current mission_attempt_id, role/tool, phase,
route status, cargo summary, revisions, encounter status, and next valid action. Reconnection does not
reset the role, pause the world, or implicitly recall the soldier.

### M09-15 — Reset isolates old commands and history

**Given:** A fixture reset creates a new world_id while an old mission command remains delayed.  
**When:** The delayed command is delivered under the new world binding.  
**Then:** It is rejected visibly; the old world history and mission identities remain append-only and
the new world begins with its own revisions and roster.

## Shared assertions

- Role, tool, target, route, home anchor, return policy, and mission attempt are server-committed at
  dispatch and remain immutable for the field attempt.
- soldier_id is stable across death and respawn; mission_attempt_id is unique per dispatch/reissue.
- mission.phase, soldier.lifecycle, and encounter.status never replace one another.
- Recall is ordinary travel, never teleportation, role switching, cargo deletion, coin creation, or a
  bypass of an active encounter.
- A field soldier cannot be reassigned by editing a dashboard value; it must return, respawn, or reach
  a terminal state before a new role is accepted.
- CP-09 does not own extraction, combat, coins, or Agent delivery; it hands those boundaries to the
  owning checkpoint and records their causal result.
- Every state-changing command carries the expected revisions and idempotency key; retries and stale
  context cannot affect a later attempt.
- A scenario run twice with the same fixture, event order, and command versions produces the same
  mission identities, phase transitions, and event order.

## Open implementation fields

- exact assign_soldier_mission and force_recall_soldier typed argument schemas;
- role-to-tool tier table beyond the accepted G2 gatherer/hunter distinction;
- legal target visibility versus committed player intelligence;
- rejection versus deferred intent when recall arrives during contact/lock;
- mission-history retention and dashboard pagination;
- target-depletion and deposit handoff details owned by CP-10; and
- death/reissue timing and danger-cell handoff owned by CP-11.

## Non-goals

This fixture does not implement movement, extraction, coins, combat, PvP, siege, migration, breach,
upgrades, WebMCP tools, Re-entry delivery, or a new role system. It does not create a new event type,
mission phase, soldier identity, or client authority.
