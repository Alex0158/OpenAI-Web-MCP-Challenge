# CP-16 Real Event Burst and Page Context Runtime Cross-Functional Audit

**Status:** LOCAL REAL BURST AND PAGE CONTEXT VERIFIED; EXTERNAL RE-ENTRY AND BROWSER GATES OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-071`](../Tasks/SK-TASK-071-cp16-real-event-burst-page-context.md)  
**Evidence:** [`SK-EVID-058`](../Evidence/SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md)  
**Policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Causal chain:** [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)

## Audit question

When two actionable loss events happen before delivery, does the real worker preserve both domain
records while producing one coalesced signal, and can the canonical page read the current context and
recall the latest reissued mission exactly once?

## Evidence boundary

- A fresh file-backed `sleepless-mvp-01` fixture used the existing entrypoint, worker, combat/reissue
  services, persistence store, and server-owned alpha signal grant. Two gatherers reached the seeded
  monster path, producing two real `CargoLostToMonster` events and two successful `MissionReissued`
  outcomes before the signal was delivered.
- The durable signal slot retained one identity and one pending outbox row with two eligible events,
  a page cursor range spanning both losses, one event type, and the second loss as latest metadata.
- One labelled local transport acknowledged one envelope. Canonical page HTTP reads used the server
  continuation summary, bounded history pagination, and current mission revisions; a recall of the
  latest reissued soldier committed `RETURNING` and replay was idempotent.
- The burst suite passed `1/1`; CP-16 restart continuity passed `1/1`; CP-06 recovery passed `3/3`;
  CP-13 page/recall passed `9/9` each; CP-14 causal/port/signal passed `1/1`, `5/5`, and `11/11`;
  CP-16 local regression passed `3/3`; typecheck and documentation validation passed.
- This is ladder level `4` local process/page evidence. No browser, WebMCP adapter, Receiver,
  Connector, Codex Thread, Agent, hosted, or judge claim follows.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Combat and reissue | Two real gatherer encounters produced two terminal loss events and two successful automatic reissues for two soldier identities before acknowledgement. | Pass. |
| Signal aggregation | One pending signal/outbox identity remained; `eligible_event_count = 2`, one eligible event type, and latest metadata pointed to the second loss. | Pass. |
| Cursor and history semantics | The signal cursor is a page-read window that contains routine battle/reissue cursors; both loss cursors were enclosed and history pagination followed the server `next_cursor`. | Pass. |
| Delivery and clock separation | One labelled port pump acknowledged one envelope with an independent wall-time lease; world time remained `46`. | Pass. |
| Envelope fidelity | Signal id, count, cursor window, event type, and latest loss id matched durable state; no prompt, credential, or client-selected scope crossed the port. | Pass. |
| Gameplay authority | Acknowledgement appended only `ContinuationDelivered`; no combat, cargo, reissue, or world-time effect repeated. | Pass. |
| Page read context | Alpha shelter, continuation, current mission revisions, and complete loss/reissue history were returned through canonical HTTP reads, including bounded pagination. | Pass for local page HTTP; browser/WebMCP remains open. |
| Recall authority | The latest active reissued mission was selected from fresh page state; current revisions and the latest loss provenance committed the existing reverse-route `RETURNING` transition. | Pass. |
| Duplicate safety | Identical recall replay returned `duplicate = true`; exactly one loss, reissue per encounter, delivery acknowledgement, and recall event exists. | Pass. |
| Scope privacy | Beta had no continuation and no alpha loss history. | Pass for local fixture HTTP scope; independent browser remains open. |
| High-frequency external behavior | The test proves game-side aggregation only; it cannot prove Connector safe-turn buffering or absence of per-event Thread messages. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Burst creates multiple wakes | Durable slot identity and outbox count remain one while eligible count reaches two; one port pump sends one envelope. **Controlled locally.** |
| Cursor range loses the first event | The range is asserted to enclose both loss cursors; page history follows `next_cursor` until the server ends the bounded read. **Controlled.** |
| Routine events are mislabelled as eligible | `event_types` contains only `CargoLostToMonster`, while routine battle events remain visible in history. **Controlled.** |
| Latest signal points to a non-actionable mission | Page mission read selects the second active reissued attempt and recall checks the second loss's soldier provenance and current revisions. **Controlled.** |
| Delivery acknowledgement repeats gameplay | World time and event counts are checked; only one `ContinuationDelivered` is appended. **Controlled.** |
| Duplicate action repeats the effect | The identical command/idempotency body replays the stored result without a second `MissionRecalled`. **Controlled.** |
| Beta sees private alpha context | Server-resolved beta scope returns null continuation and no alpha loss history. **Controlled locally.** |
| Local burst is overclaimed as external backpressure | Task/evidence/audit explicitly leave Connector, Thread, Agent, WebMCP, browser, hosted, and judge claims open. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-071` as `runtime_verified` for the named local real-worker burst → coalesced signal → page history/revision read → latest reissue recall composition.
2. Keep Domain Events authoritative and treat the signal cursor as a page-read window; do not filter routine events out of durable history or add a second notification queue.
3. Treat one local envelope and one `ContinuationDelivered` as game-side delivery evidence only. It does not prove one Connector wake, active-Thread safe-turn behavior, or Agent action success.
4. Preserve Eddy's versioned external Receiver/Local Connector handoff as the next live CP-14 gate; do not adapt or claim it until the exact transport, acknowledgement, retry, lease, idempotency, and active-Thread contract is delivered and reviewed.
5. Reopen if a burst produces multiple pending signals, drops either causal event, misstates the cursor window, selects stale/foreign mission state, duplicates recall, or crosses the scope boundary.

**Exact conclusion:** The real worker can produce two actionable loss/reissue outcomes before delivery,
coalesce them into one durable signal without losing either Domain Event, expose the complete context
through a paginated canonical page read, and recall the latest reissued mission once. This closes the
named CP-16 local burst composition only; external Re-entry, genuine WebMCP dynamic action, independent
browser, hosted, and judge gates remain open.
