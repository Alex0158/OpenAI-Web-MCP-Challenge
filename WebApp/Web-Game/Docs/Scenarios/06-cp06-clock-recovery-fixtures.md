# CP-06 Clock and Recovery Fixture Scenarios

**Status:** Preparation fixture; runtime verification remains open  
**Checkpoint:** CP-06  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md)  
**Purpose:** Convert the accepted world-time and restart rules into deterministic vectors that can become focused tests after CP-05 exposes its worker-owned persistence seam.

These scenarios do not define SQL, HTTP, WebSocket, or client timer behavior. They describe the
authoritative inputs and observable outcomes only. A vector may be executed with a fake clock; a fake
clock must never become the production gameplay authority.

## Fixture envelope

| Field | Preparation value |
|---|---|
| `contract_version` | `SK-MVP-0.2` |
| `world_id` | `world-clock-fixture-01` for an isolated test world |
| Initial `world_time` | `1000` world seconds |
| Initial `last_world_event_cursor` | `0` |
| Clock rate | 1 world second per real second while running |
| Projection cadence | 100 ms reconciliation; about 10 Hz delivery target |
| Milestone cadence | Integer world-second boundary |
| Normal recovery gap | 5 world seconds in the fake-clock vectors |
| Recovery budget | `MAX_RECOVERY_WORLD_SECONDS = 300` world seconds |
| Extreme recovery input | `301` world seconds beyond the last durable boundary |

The fixture world is isolated by `world_id`; it must use a file-backed test store when the runtime
tests begin. `:memory:` is not evidence for restart behavior.

## Vectors

### C06-01 — Sub-second reconciliation does not settle a milestone

**Given:** The authoritative clock is at `1000`, a soldier has a movement position between two
waypoints, and the next extraction is due at `1001`.  
**When:** The worker advances through 100 ms reconciliation steps until the projection reaches
`1000.9`.  
**Then:** Fractional movement/projection state may change, but authoritative `world_time` remains the
integer `1000`; no integer extraction, combat, death, respawn, or node timer event commits. The
fractional projection value is not persisted or emitted in an event envelope, and `world_time` never
moves backwards.

### C06-02 — One integer boundary settles once

**Given:** The same soldier reaches a due extraction milestone at `1001`.  
**When:** The worker processes the boundary, retries the same scheduler input, and emits a projection.  
**Then:** The authoritative transition commits once, receives one causal event identity, advances the
affected revision once, and a retry returns the stored result without a second cargo or event effect.

### C06-03 — Same-time order protects a home crossing

**Given:** A returning soldier crosses its current shelter home anchor at `1002` while a contact check
and an extraction milestone are also due.  
**When:** The worker executes the accepted phase order.  
**Then:** The soldier enters `DEPOSITING`; a valid deposit settles before field-cargo danger; a newly
locked contact does not make the already-home cargo field cargo; extraction is skipped unless the
soldier remains eligible and unlocked; later projection reflects the committed result.

### C06-04 — Contact blocks extraction in the same boundary

**Given:** A gatherer is `WORKING` with a due extraction and a post-movement contact enters the
inclusive `engagement_radius_tiles = 1.0` at `1003`.  
**When:** Contact locking runs before extraction.  
**Then:** The encounter becomes `LOCKED`; no extraction commits for that boundary; combat receives the
post-movement revisions and resolves only in its later phase.

### C06-05 — Crash before the transaction commits

**Given:** A due milestone is claimed but the process stops before the state/event transaction.  
**When:** The worker restarts.  
**Then:** The lease is reclaimable using transport/wall-time metadata; no Domain Event, cursor,
revision, cargo, coin, or Signal row from the abandoned attempt exists; the milestone can be retried
with its original logical identity.

### C06-06 — Crash after state/event commit but before snapshot

**Given:** A state mutation, event cursor, event row, and eligible delivery state commit, but the
process stops before the next `world_snapshot`.  
**When:** The worker restarts from the previous valid snapshot.  
**Then:** Replay applies only the events after the snapshot cursor; the committed transition appears
exactly once; the event and Signal identities are preserved; a new snapshot can advance to the
recovered cursor without double settlement.

### C06-07 — Normal browser absence

**Given:** The page closes at `1000`, a gatherer has a due travel/extraction sequence, and the worker
remains healthy until `1005`.  
**When:** The player reconnects.  
**Then:** World time and due work advance without browser input; the next connection receives a full
current `client_snapshot`; no local browser timer creates a duplicate event or reward.

### C06-08 — Restart with a bounded normal gap

**Given:** The last durable world time is `1000`, the accepted server time is five world seconds
later, and several routine and consequential milestones are due.  
**When:** The worker recovers.  
**Then:** It advances deterministically to the accepted boundary, keeps consequential transitions
individually causal, processes routine work within the configured bounded loop, persists the recovered
world state, and exposes the same event order on a second identical run.

### C06-09 — Wall-clock moves backwards

**Given:** The persisted world time is `1005` and the next host timestamp would imply `1003`.  
**When:** Recovery or a running tick detects the anomaly.  
**Then:** The worker records a redacted typed recovery warning, never decrements `world_time`, never
reverses a mission or cargo transition, and does not report a silently corrected gameplay result.

### C06-10 — Forward gap exceeds the recovery budget

**Given:** The process is absent for a deliberately extreme gap larger than the configured bounded
recovery budget.  
**When:** Recovery begins.  
**Then:** The worker returns `RECOVERY_LIMIT_EXCEEDED`, remains observable for diagnosis and bounded
shutdown, preserves the last committed state, snapshot cursor, revisions, and event history, closes
the world mutation gate, and never loops until wall time is caught up. The process must not report the
world as recovered or accept gameplay commands from this state. A later supervised recovery may resume
with an explicit target no more than 300 world seconds ahead, so a 301-second gap requires two bounded
attempts rather than an implicit limit increase.

### C06-11 — Cooldown and lease use different clocks

**Given:** A Re-entry Signal slot has a 60-world-second product cooldown and a short transport lease.  
**When:** The transport lease expires while gameplay world time has advanced less than 60 seconds.  
**Then:** The lease may be reclaimed with the same Signal identity, but no new gameplay wake is created
because the product cooldown is evaluated using persisted `world_time`; lease expiry never pauses the
world or advances the cooldown.

### C06-12 — Shutdown during recovery

**Given:** The worker is `RECOVERING` or has a store-close failure while the process receives shutdown.  
**When:** CP-04 begins its bounded drain.  
**Then:** Listener admission closes before the worker/store close is awaited; late commands fail
visibly; the close failure is typed and redacted; the drain settles within the accepted deadline or
leaves a recorded failure without reopening a second authority.

## Assertions shared by every vector

- The server, never the browser, owns `world_time` and all state-changing effects.
- Every committed state transition has a stable event identity, causal order, and affected revision.
- A replay, retry, or duplicate delivery cannot create a second cargo, coin, soldier, event, or
  continuation effect.
- `world_snapshot` is the durable restart artifact; `client_snapshot` is a replaceable projection.
- Incompatible versions, cursor gaps, unreconcilable snapshot state, and missing active work enter a
  visible recovery outcome instead of inventing state.
- The vector can be run twice from the same fixture and produce the same authoritative event order.
