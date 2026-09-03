# CP-14 Causal Event-to-Local-Stub Trace Runtime Cross-Functional Audit

**Status:** LOCAL CAUSAL COMPOSITION VERIFIED; EXTERNAL RE-ENTRY BOUNDARY OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-068`](../Tasks/SK-TASK-068-cp14-causal-event-to-local-stub-trace.md)  
**Evidence:** [`SK-EVID-055`](../Evidence/SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md)  
**Policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Causal chain:** [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)

## Audit question

Does the real local `CargoLostToMonster` path compose with the verified game-side
`ReentryDeliveryPort` so that a durable, scoped, coalesced Agent Signal can be acknowledged once
without repeating gameplay, while preserving the explicit boundary before Eddy's external handoff?

## Evidence boundary

- A fresh file-backed `sleepless-mvp-01` fixture was started with the existing `WorldWorkerModule`,
  server grant provider, combat coordinator, persistence store, and no autonomous scheduler.
- The existing GATHERER command and deterministic worker advance produced one terminal
  `CargoLostToMonster` at world time `24`, with `WAITING_REVIEW` mission state, terminal attempt,
  same-identity shelter respawn, and zero exposed cargo.
- The existing port was then invoked with an explicit wall-time lease and an injected transport that
  returned one accepted outcome. The captured envelope was compared to the durable slot and event.
- The local causal suite passed `1/1`; the existing port suite passed `5/5`; signal policy passed
  `11/11`; CP-16 local causal regression passed `3/3`; typecheck and documentation validation passed.
- This is ladder level `3` local composition evidence. No process restart, browser, WebMCP, Receiver,
  Connector, Codex Thread, Agent, hosted, or judge claim follows.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Combat trigger | The real worker/combat path, rather than a manually fabricated event, produced exactly one `CargoLostToMonster`. | Pass. |
| Event and cursor | The loss remained a durable Domain Event at world time `24`; its event identity and cursor metadata were carried into the signal envelope. | Pass. |
| Eligibility and scope | The server grant provider created one pending slot only for `shelter-a`/`binding-a`; Player B received no signal. | Pass. |
| Outbox and lease | The port claimed one pending candidate with the explicit lease `cp14-causal-lease-1` and independent wall time `1000`; no gameplay clock was used for delivery timing. | Pass. |
| Envelope fidelity | Contract version, world/shelter, opaque binding, signal id, grant/action, cursor window, event summary, severity, and latest event/time matched durable state; no prompt or credential was present. | Pass. |
| Acknowledgement | Accepted transport created one `ContinuationDelivered` event and settled the same signal/outbox identity. | Pass. |
| Gameplay settlement | Shelter, soldier, mission, terminal attempt, cargo, coins, and world time remained unchanged; no page command or optimistic mutation occurred. | Pass. |
| Duplicate safety | A second pump was `idle`; no second envelope or delivery event was created. | Pass. |
| Backpressure | The port still owns no timer, queue, worker, Thread, or per-event wake policy; active-Thread behavior remains an external gate. | Pass locally; external behavior open. |
| Page and WebMCP | No page, Agent, WebMCP read, fresh reread, or recall action was invoked by this test. | Open by design. |
| External handoff | Cloud Receiver/Local Connector version, transport, acknowledgement, binding, retry, and handoff environment remain Eddy-owned and unverified here. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Combat event bypasses signal policy | The real worker uses the existing server grant provider and persistence transaction; the test asserts one eligible slot and one event. **Controlled.** |
| Signal identity is reconstructed | Envelope values are read from the durable slot and compared against the loss event; the test never supplies a signal id. **Controlled.** |
| Delivery acknowledgement repeats gameplay | Before/after mission, soldier, attempt, cargo, shelter, and world-time records are compared; only the documented delivery event is added. **Controlled.** |
| Wall-time lease advances world time | The port receives `nowWallTimeMs` separately and world time remains `24`. **Controlled.** |
| Duplicate pump sends a second wake | Durable acknowledgement state makes the next pump `idle` and event count remains one. **Controlled.** |
| Cross-shelter disclosure | Only the granted A binding has a slot; B remains null and no client-selected scope exists. **Controlled.** |
| Local stub overclaim | Evidence and task records explicitly exclude Receiver, Connector, Thread, Agent, page, hosted, and judge claims. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-068` as `runtime_verified` for the named local real-event-to-labelled-stub
   composition.
2. Keep `ReentryDeliveryPort` transport-neutral and keep all gameplay authority in the existing
   worker/store/combat path.
3. Treat `ContinuationDelivered` as delivery acknowledgement only; it is not Agent action success,
   page reread, recall success, or a gameplay settlement event.
4. Preserve the CP-14 external handoff gate. Do not adapt, merge, or claim Eddy's Receiver/Connector
   until its exact versioned transport and acknowledgement contract is delivered and reviewed.
5. Reopen if the trace produces duplicate effects, mutates world time, loses cursor/binding identity,
   crosses shelter scope, or requires production queue/worker/page changes.

**Exact conclusion:** The real local combat loss composes with the game-side delivery port and a
labelled stub with one scoped acknowledgement and no gameplay mutation. The result advances the local
CP-14 causal chain but does not close the external Receiver/Connector or Agent-to-page Re-entry gates.
