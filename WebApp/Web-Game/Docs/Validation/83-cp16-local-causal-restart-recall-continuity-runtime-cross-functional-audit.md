# CP-16 Local Causal Restart and Recall Continuity Runtime Cross-Functional Audit

**Status:** LOCAL RESTART CONTINUITY VERIFIED; EXTERNAL RE-ENTRY AND BROWSER GATES OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-070`](../Tasks/SK-TASK-070-cp16-local-causal-restart-recall-continuity.md)  
**Evidence:** [`SK-EVID-057`](../Evidence/SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md)  
**Policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Causal chain:** [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)

## Audit question

Does the same durable real `CargoLostToMonster` and automatic reissue state survive an entrypoint and
worker restart, then compose with local delivery, canonical page reread, and one provenance-bound recall
without duplicating gameplay, delivery, or scope?

## Evidence boundary

- Process A used the existing entrypoint-owned worker, server grant provider, combat/reissue path,
  persistence store, and a fresh file-backed G2 fixture. It produced one loss, one successful reissue,
  and one pending signal/outbox pair at world time `24`.
- Process A shut down through the entrypoint lifecycle. Process B opened the same database and used the
  existing alpha cookie; durable world/event/signal/mission identity was compared before delivery.
- The existing `ReentryDeliveryPort` acknowledged one recovered envelope through a labelled accepted
  transport. The canonical page HTTP endpoint then returned current continuation, mission revisions, and
  causal history; recall used those values and the durable signal/event provenance.
- The local restart suite passed `1/1`; CP-06 autonomous recovery passed `3/3`; CP-13 page/recall passed
  `9/9` each; CP-14 causal/port/signal passed `1/1`, `5/5`, and `11/11`; CP-16 local regression passed
  `3/3`; typecheck and documentation validation passed.
- This is ladder level `4` local process/page evidence. No browser, WebMCP adapter, Receiver, Connector,
  Codex Thread, Agent, hosted, crash-recovery, or judge claim follows.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Process and worker lifecycle | Process A stopped cleanly through the existing entrypoint; process B started a new worker against the same file-backed store and became ready. | Pass for clean local restart. |
| World and event recovery | World time, `world_event_cursor`, event count/order, loss count, and reissue count were unchanged across the boundary. | Pass. |
| Mission identity | The same mission and active reissued attempt remained `TRAVELLING`; no second mission, soldier, or synthetic event was created. | Pass. |
| Signal and outbox | The pending signal/outbox pair retained one signal identity, binding, causal loss, and pending status until the recovered port claimed it. | Pass. |
| Delivery and clock separation | The port used wall-time lease `cp16-restart-recall-lease-1`; accepted delivery appended one `ContinuationDelivered` and left world time at `24`. | Pass. |
| Envelope fidelity | The recovered envelope matched the persisted signal and loss event; no prompt, credential, or client-selected scope crossed the transport. | Pass. |
| Fresh page read | Alpha page HTTP reads after restart and acknowledgement returned server-owned scope, acknowledged continuation, current mission/attempt revisions, and loss/reissue history. | Pass for local page HTTP; browser/WebMCP remains open. |
| Recall authority | The action carried fresh ids/revisions plus signal and causal-event provenance; the server committed the existing reverse-route `RETURNING` transition. | Pass. |
| Duplicate safety | Identical recall replay returned the stored committed result with `duplicate = true`; exactly one loss, reissue, delivery acknowledgement, and recall event exists. | Pass. |
| Scope privacy | Beta remained scoped to its shelter, with no alpha continuation or loss history. | Pass for local fixture HTTP scope; independent browser remains open. |
| Downtime semantics | The test advances the authoritative world only before shutdown and does not infer world progression while the process is stopped. | Pass; autonomous downtime catch-up remains unclaimed. |
| External Re-entry | The labelled transport cannot prove Receiver/Connector serialization, Thread safe-turn delivery, Agent wake, dynamic tool registration, or hosted continuity. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Restart loses a committed signal | Process B reads the same file-backed store and compares signal id/status, event cursor, event count, and mission attempt before delivery. **Controlled.** |
| Startup replays gameplay effects | Loss/reissue counts and ordered event count remain unchanged across clean shutdown/startup; no second combat or reissue event appears. **Controlled.** |
| Delivery acknowledgement repeats gameplay | World time, mission, attempt, shelter, cargo, and event counts are checked before/after the port; only one delivery acknowledgement is added. **Controlled.** |
| Wall-time lease changes the game clock | The port receives an independent wall timestamp and the recovered world remains at `24`. **Controlled.** |
| Page acts on stale or foreign state | Page reads follow restart and acknowledgement; recall uses current server revisions, binding scope, signal id, and causal event id. **Controlled locally.** |
| Duplicate recall creates a second effect | The identical command/idempotency body is replayed and the durable result is returned without another `MissionRecalled`. **Controlled.** |
| Beta reads private alpha state | The fixture resolver derives beta scope and history visibility; continuation is null and alpha loss history is absent. **Controlled locally.** |
| Local result is overclaimed as hosted/external | Task and evidence records name clean local process/page boundaries and leave crash recovery, external delivery, Agent, WebMCP, browser, hosted, and judge gates open. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-070` as `runtime_verified` for the named local clean-restart → recovered delivery → page reread → bounded recall composition.
2. Keep the existing entrypoint/store/worker authoritative for recovery, world time, event order, mission, cargo, signal identity, and command effects. Do not add a second recovery queue or page-side state authority.
3. Treat `ContinuationDelivered` as delivery acknowledgement only. It does not prove Agent wake, WebMCP invocation, hosted recovery, or gameplay settlement.
4. Preserve Eddy's versioned external Receiver/Local Connector handoff as the next live CP-14 gate; do not adapt or claim it until the exact transport, acknowledgement, retry, lease, idempotency, and active-Thread contract is delivered and reviewed.
5. Reopen if restart duplicates an event/effect, loses identity, advances world time during downtime, accepts stale revisions, crosses shelter scope, or requires production recovery changes.

**Exact conclusion:** The local process boundary now proves continuity of one durable real loss/reissue
signal through clean restart, once-only local delivery, fresh page read, provenance-bound recall, and
duplicate/privacy checks. The result strengthens CP-16 local resilience evidence while external
Re-entry, genuine WebMCP dynamic action, independent browser, hosted, and judge gates remain open.
