# CP-14 Re-entry Adapter Fixtures

**Status:** Game-side local-stub port verified; external delivery runtime remains open  
**Checkpoint:** CP-14  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Task:** [SK-TASK-014](../Tasks/SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md)  
**Purpose:** Prepare the game-side outbox and Agent Signal adapter for one coalesced CargoLostToMonster continuation without modifying the external Receiver, Local Connector, or Codex Thread.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-05, CP-11, and CP-13.
- Owning authority: Mechanics/Chains/08-event-to-reentry-action.md, Mechanics/detail-19-reentry-event-hook.md, Engineering/05-api-and-webmcp.md, ADR-GAME-0009, and the CP-14 roadmap boundary.
- Cross-functional handoff: CP-05 owns event/outbox identity; CP-11 emits the eligible event; CP-13 exposes recall; CP-12 shows the result; CP-16 needs one exact causal trace; CP-17/18 must distinguish local adapter from hosted external proof.
- Scope: Eligibility selection, coalescing slot, deferred cursor, signal identity, at-least-once acknowledgement, typed failure, fresh page reread, and game-side external adapter contract.
- Non-goals: Changing Cloud Receiver or Local Connector, implementing private Agent context, sending prompts/credentials, per-event Thread messages, game authority in Re-entry, or claiming live integration from a stub.

## Evidence classification

- Verified inputs: CargoLostToMonster is the only G2 eligible event; one signal is pending or in flight per shelter/binding; 60-world-second cooldown gates new wakes; Domain Events remain durable; the world never waits.
- Preparation inference: A local stub is the reversible proof boundary until Eddy delivers exact external endpoint, version, binding, acknowledgement, retry, and handoff evidence.
- Open fields: Receiver/Connector version and endpoint, signal payload and cursor window, ack/retry/terminal rejection, binding and idempotency mapping, Thread active-turn behavior.

## Vectors

### R14-01 — Eligible signal

**Given:** CargoLostToMonster commits with a grant and no active signal slot.  
**When:** The selector evaluates the event.  
**Then:** One coalesced signal is written with opaque binding, cursor range, severity, revisions, and bounded hint.

### R14-02 — Routine event suppression

**Given:** Movement, world tick, or ordinary combat round events commit.  
**When:** The signal policy evaluates them.  
**Then:** Events remain in history and create no wake.

### R14-03 — Burst coalescing

**Given:** Several eligible events arrive before the first signal is acknowledged.  
**When:** The slot merges later events.  
**Then:** One signal identity remains pending/in flight with updated count, cursor range, severity, latest event, and world time.

### R14-04 — Cooldown without data loss

**Given:** An eligible event arrives inside the 60-world-second cooldown with no active slot.  
**When:** The policy evaluates it.  
**Then:** The Domain Event remains readable but no new wake is created. It does not enter an active or
deferred Signal window and is not folded into a later Signal after cooldown expiry; the Agent rereads
canonical page history when it needs the complete sequence.

### R14-05 — Retry same identity

**Given:** Receiver acknowledgement is lost after handoff.  
**When:** The adapter retries.  
**Then:** The same signal identity is reused and game state is not repeated.

### R14-06 — Active Thread backpressure

**Given:** The bound Codex Thread is already running.  
**When:** The Connector boundary reports active turn.  
**Then:** Merged context waits for the safe boundary and no per-event message is sent.

### R14-07 — Fresh page reread

**Given:** The Agent returns after world time and mission revision advance.  
**When:** The page exposes current reads and the Agent attempts recall.  
**Then:** The command is validated against live state and returns committed or typed-stale outcome.

### R14-08 — WebMCP unavailable

**Given:** The continuation arrives but the canonical page cannot expose the required tool.  
**When:** The Agent or adapter observes the capability result.  
**Then:** The event and delivery remain auditable; no hidden mutation or false success occurs.

### R14-09 — External contract mismatch

**Given:** The delivered Receiver/Connector version differs from the agreed handoff.  
**When:** The adapter validates the version.  
**Then:** Integration stops for an explicit cross-boundary decision; no silent payload rewrite occurs.

### R14-10 — Human boundary

**Given:** A continuation hint would lead to migration, siege, or destructive action.  
**When:** The page/tool boundary evaluates it.  
**Then:** The Agent receives a reviewable human boundary and cannot bypass it.

## Implementation replay procedure

The following order is the smallest replayable CP-14 contract run. It is valid for a local stub only
until the external Receiver and Local Connector handoff is versioned.

| Step | Stimulus | Required readback | Claim limit |
|---|---|---|---|
| 1. Commit | Commit one `CargoLostToMonster` transition in a fresh file-backed fixture | Domain Event, monotonic cursor, shelter binding, mission attempt, and one signal slot | Local persistence and eligibility only |
| 2. Inspect | Read `signalSlot` and `outboxDelivery` | Same `signal_id`, opaque binding, bounded action, cursor range, eligible count, severity, latest event, and current status | No external delivery claim |
| 3. Claim | Run the delivery seam with an explicit wall-time lease | `in_flight` status, lease identity, unchanged `world_time`, and no gameplay mutation | Lease/selector contract only |
| 4. Retry | Return a retryable transport outcome and retry | Same signal identity, incremented transport attempt, no second Domain Event or wake | At-least-once local stub behavior |
| 5. Merge | Commit another eligible event while the first delivery is in flight | Deferred cursor/count/types update in the same slot; no second signal | Coalescing/backpressure only |
| 6. Acknowledge | Return an accepted delivery outcome | One `ContinuationDelivered` event and settled delivery status; acknowledgement is not command success | Delivery acceptance only |
| 7. Re-read | Load the canonical page and inspect current state/history | Fresh revisions and the latest causal digest are read before recall | Page read contract only |
| 8. Act or reject | Attempt the bounded recall with the live revisions | One committed `MissionRecalled` result or a typed stale/unsupported result | No hidden mutation or Agent authority |

The replay must record the source state, contract version, fixture seed, world time, wall-time lease
values, signal identity, event cursors, and every intentionally unrun external boundary. It must never
turn a stub response into a live Re-entry claim.

## Handoff field classification

The game side owns the following semantic fields because they already exist in the persistence and
contract records: `signal_id`, opaque binding, shelter, grant, bounded action, causal cursor range,
eligible event count/types/severity, latest world time, relevant entity revisions, and delivery status.
The external transport owns serialization, endpoint, acknowledgement framing, and active-Thread
scheduling. Until that transport is versioned, its wire names remain intentionally unspecified.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- Receiver/Connector version and endpoint;
- signal payload and cursor window;
- ack/retry/terminal rejection;
- binding and idempotency mapping;
- Thread active-turn behavior;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
