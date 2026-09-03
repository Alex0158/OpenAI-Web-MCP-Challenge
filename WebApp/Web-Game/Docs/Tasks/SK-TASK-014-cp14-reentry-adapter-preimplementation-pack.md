# SK-TASK-014: CP-14 Re-entry Adapter Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-14`
- Owner: Game owner
- Current increment: Cross-functional CP-14 preparation is complete; no runtime code has started.
- Next gate: After CP-05, CP-11, and CP-13 are verified, prove the game-side selector/coalescer against a local contract stub; wait for the versioned external handoff before live integration.

## Identity

- Task ID: SK-TASK-014
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the game-side outbox and Agent Signal adapter for one coalesced CargoLostToMonster continuation without modifying the external Receiver, Local Connector, or Codex Thread. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the game-side outbox and Agent Signal adapter for one coalesced CargoLostToMonster continuation without modifying the external Receiver, Local Connector, or Codex Thread.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Changing Cloud Receiver or Local Connector, implementing private Agent context, sending prompts/credentials, per-event Thread messages, game authority in Re-entry, or claiming live integration from a stub.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-14 scenario fixture](../Scenarios/14-cp14-reentry-adapter-fixtures.md), and the owning documents named below.
- Out of scope: Changing Cloud Receiver or Local Connector, implementing private Agent context, sending prompts/credentials, per-event Thread messages, game authority in Re-entry, or claiming live integration from a stub.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Mechanics/Chains/08-event-to-reentry-action.md, Mechanics/detail-19-reentry-event-hook.md, Engineering/05-api-and-webmcp.md, ADR-GAME-0009, and the CP-14 roadmap boundary.
- Roadmap dependency: CP-05, CP-11, and CP-13.
- Cross-functional handoff: CP-05 owns event/outbox identity; CP-11 emits the eligible event; CP-13 exposes recall; CP-12 shows the result; CP-16 needs one exact causal trace; CP-17/18 must distinguish local adapter from hosted external proof.
- Preparation audits: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and [CP-14–CP-16 preparation audit](../Validation/49-cp14-cp16-preparation-cross-functional-audit.md).

## Evidence status

- Verified: CargoLostToMonster is the only G2 eligible event; one signal is pending or in flight per shelter/binding; 60-world-second cooldown gates new wakes; Domain Events remain durable; acknowledged-cooldown events are history-only when no delivery slot is active; the world never waits.
- Inferred: A local stub is the reversible proof boundary until Eddy delivers exact external endpoint, version, binding, acknowledgement, retry, and handoff evidence.
- Unknown: External transport/version, acknowledgement semantics, binding identity, exact signal payload, active-Thread scheduling, and hosted delivery behavior.

## Current CP-12 and CP-13 handoff readback

- CP-12 now supplies a server-resolved fixture scope and a canonical page lifecycle. CP-14 must consume that scope through the CP-13 page action result and must not introduce a second identity resolver or page-side state authority.
- `PersistenceStore` already owns the durable signal slot and outbox lifecycle through `signalSlot`, `claimDelivery`, `acknowledgeDelivery`, `retryDelivery`, and `terminalRejectDelivery`. The adapter should wrap these existing transitions rather than reproduce coalescing or delivery state in memory.
- The proposed game-side seam is a narrow `ReentryDeliveryPort` with a test or host-invoked `pumpOnce` operation. A default timer, browser loop, second worker, or second queue is outside CP-14; a later host may schedule the same operation after its liveness contract is verified.
- The `force_recall_soldier` result remains a normal page command. Signal context may carry `signal_id`, causal event identity, mission attempt identity, and expected revisions, but the adapter never mutates a mission or treats delivery acknowledgement as command success.
- The Receiver and Local Connector version, endpoint, acknowledgement, retry, binding, and active-Thread contract remain open. A local fake can verify the game-side mapping, but it cannot be reported as live external delivery.

## Preparation handoff packet

This preparation is revalidated against the current `SK-MVP-0.2` contract and the live CP-05
delivery records. It is implementation-ready at documentation level, but it does not release runtime
work while CP-13 has no positive WebMCP capability result or while Eddy's external handoff is
unversioned.

### Game-side responsibility matrix

| Boundary | Authoritative source | Adapter responsibility | Required outcome | Forbidden shortcut |
|---|---|---|---|---|
| Eligible event and slot | `PersistenceStore.commitTransition`, `agent_signal_slot` | Consume the already committed `CargoLostToMonster` eligibility result | One signal slot is created or merged atomically with the gameplay transaction | Reclassifying events in a browser loop or dropping the Domain Event |
| Selection and claim | `signalSlot`, `outboxDelivery`, `claimDelivery` | Select a pending signal or reclaim an expired delivery lease using wall time | The same `signal_id` is preserved; each claim has an explicit lease identity and `world_time` does not advance | A second in-memory queue, timer, worker, or identity resolver |
| Signal envelope | `SignalSlotRecord` plus permitted event metadata | Map the coalesced slot to the external port without adding private context | Opaque binding, signal identity, cursor range, eligible count/types/severity, latest time, revisions, and bounded hint remain intact | Prompts, credentials, raw Agent context, hidden map data, or client-selected scope |
| External delivery | Versioned `ReentryDeliveryPort` handoff | Send one coalesced envelope and classify the returned outcome | Accepted, retryable, or terminally rejected outcomes are explicit and auditable | Treating transport acceptance as a successful game command |
| Acknowledgement and deferred context | `acknowledgeDelivery`, `retryDelivery`, `terminalRejectDelivery` | Record the transport outcome and preserve deferred cursor state | `ContinuationDelivered` is appended once on acknowledgement; deferred context folds only after acknowledgement or terminal rejection | Clearing deferred events, creating a second signal, or emitting one Thread message per event |
| Page action | CP-13 page tools and `WorkerCommandGateway` | Leave the Agent to reread current state and issue the bounded recall | The server returns a committed or typed live-state result using current revisions | Mutating a mission from the delivery adapter or treating an Agent Signal as authority |

### External handoff checklist

The following must be supplied and versioned before live integration. These are handoff requirements,
not invented game rules:

| Item | Minimum handoff detail | Stop condition |
|---|---|---|
| Contract identity | Interface version and compatible `SK-MVP-0.2` envelope mapping | Version is missing or fields are silently renamed |
| Transport | Endpoint, method, timeout, and response framing | Delivery cannot be replayed against a named environment |
| Binding | Opaque binding and shelter/Thread routing semantics | The receiver asks the game to trust a client-selected identity |
| Idempotency | Signal identity and retry key mapping | A retry can create a second wake or a second game effect |
| Acknowledgement | Accepted, retryable, and terminal outcomes with correlation | The adapter cannot distinguish delivery acceptance from command success |
| Lease and retry | Lease duration, expiry, backoff, and terminal policy | A stale lease can acknowledge or duplicate a delivery |
| Active Thread | Safe turn-boundary behavior and one-pending/in-flight limit | A burst can enqueue unbounded Thread messages |
| Evidence and redaction | Correlation fields, status readback, and secret/private-data exclusion | The trace contains credentials, prompts, or hidden state |

### Local stub sequence

After a positive CP-13 gate, a local contract stub may prove the game-side mapping in this order:

1. Start a fresh file-backed fixture and commit one eligible cargo-loss event.
2. Read the signal slot and delivery record; assert one signal identity, the opaque binding, cursor
   range, eligible count, and bounded action.
3. Call the task-owned `pumpOnce` seam with an explicit wall-time lease; assert that no gameplay
   clock, mission, cargo, coin, or browser state changes.
4. Return a retryable outcome and call `pumpOnce` again; assert the same signal identity and a new
   transport attempt, then return acknowledgement and assert exactly one `ContinuationDelivered`.
5. Commit an eligible event while the delivery is in flight; assert deferred cursor aggregation and
   no second signal.
6. Present the recorded result to the CP-13 page read path; only a fresh, revision-checked recall may
   produce a game command result.

The stub result is contract evidence only. It cannot be promoted to live Receiver, Connector, Agent,
hosted, or judge evidence.

### Preparation closure

- The game-side boundary is ready for a later implementation task without adding a new authority,
  queue, clock, or identity map.
- CP-14 remains `specified`; runtime closure requires CP-13 positive capability evidence and the
  versioned external handoff.
- If either dependency is unavailable, preserve the typed failure and keep the world and durable
  event history progressing independently.

## Smallest reversible action

After CP-05, CP-11, and CP-13 are verified, define the narrow delivery port and prove the game-side selector/coalescer against a local contract stub; wait for the versioned external handoff before live integration. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-14 scenario fixture](../Scenarios/14-cp14-reentry-adapter-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-05, CP-11, and CP-13, the owning contract, or the cross-functional handoff.
