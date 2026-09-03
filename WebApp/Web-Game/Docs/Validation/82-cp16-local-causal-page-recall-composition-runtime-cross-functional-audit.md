# CP-16 Local Causal Page-Recall Composition Runtime Cross-Functional Audit

**Status:** LOCAL WORKER-TO-PAGE COMPOSITION VERIFIED; EXTERNAL RE-ENTRY AND BROWSER GATES OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-069`](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md)  
**Evidence:** [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md)  
**Policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Causal chain:** [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)

## Audit question

Does one real successful monster-loss/reissue path compose through the durable game-side delivery
port, a canonical page fresh read, and a signal-provenance-bound recall without changing gameplay
authority, duplicating effects, or crossing Player B's scope?

## Evidence boundary

- A fresh entrypoint-owned `LOCAL_FIXTURE_MODE=1` process and file-backed G2 fixture were used. The
  worker created the real `CargoLostToMonster` and safe automatic `MissionReissued` path at world time
  `24`; the test-only engagement-cell setup only selects the already documented reachable branch.
- The existing `ReentryDeliveryPort` delivered one durable envelope to a labelled accepted transport
  and appended one `ContinuationDelivered` acknowledgement without changing world time or gameplay
  records.
- The canonical page HTTP endpoint then returned server-scoped shelter, mission, and history reads;
  the recall request used page-read revisions and durable signal/causal-event identity and committed
  one `MissionRecalled` transition. A duplicate body replayed the stored result.
- The beta page reads remained scoped to `shelter-b` and did not expose the alpha loss or continuation.
- The complete result is ladder level `4` local process/page evidence. No browser, WebMCP adapter,
  realtime stream, external Receiver/Connector, Codex Thread, Agent, hosted process, or judge claim
  follows.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Combat and reissue | Real worker advancement produced one terminal gatherer loss and one successful automatic reissue for the same soldier identity; the active reissued attempt remained `TRAVELLING`. | Pass. |
| Event and cursor | The loss, reissue, and delivery acknowledgement preserved ordered durable identities; no event was manufactured by the page or transport. | Pass. |
| Signal eligibility | The server-owned fixture grant created one pending slot/outbox only for alpha; bounded action and latest event matched the durable loss. | Pass. |
| Port and lease | `ReentryDeliveryPort` used an explicit wall-time lease and accepted labelled transport; the gameplay clock stayed at world time `24`. | Pass. |
| Envelope fidelity | World/shelter, opaque binding, signal id, grant/action, event summary, severity, and latest-event metadata were preserved; no prompt or credential field appeared. | Pass. |
| Acknowledgement | Accepted delivery settled the existing signal once and appended only `ContinuationDelivered`; the mission, soldier, attempt, shelter, cargo, and coins were unchanged. | Pass. |
| Fresh page read | Canonical page HTTP reads returned alpha scope, acknowledged continuation, current active reissue revisions, and visible loss/reissue history after delivery. | Pass for local page HTTP; browser/WebMCP remains open. |
| Recall authority | The page forwarded current ids/revisions plus durable signal and causal-event provenance; the server committed the existing reverse-route `RETURNING` transition. | Pass. |
| Duplicate safety | Repeating the identical recall body returned the durable result with `duplicate = true`; exactly one `MissionRecalled` event exists. | Pass. |
| Scope privacy | Beta's server-resolved page reads returned no continuation and no alpha `CargoLostToMonster` history. | Pass for local HTTP fixture scope; independent browser remains open. |
| Realtime/UI reconciliation | This test does not open a browser or assert Canvas/realtime rendering; those layers remain unchanged and separately evidenced. | Open by design. |
| External Re-entry | The labelled transport cannot prove Receiver/Connector serialization, Thread safe-turn delivery, Agent wake, dynamic tool registration, or hosted continuity. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Loss signal is detached from real combat | The worker's existing phase coordinator and combat/reissue services create the event and slot; the test asserts the exact event order and active reissued attempt. **Controlled.** |
| Delivery acknowledgement repeats gameplay | Before/after durable records and event counts show unchanged world time, cargo, mission, soldier, shelter, and exactly one acknowledgement. **Controlled.** |
| Page chooses a stale or foreign mission | Mission ids and revisions come from the fresh alpha page read; server binding, ownership, signal slot, cursor range, and causal soldier id are revalidated. **Controlled.** |
| Recall duplicates on retry | The same command/idempotency body is replayed and returns the stored committed result without a second event. **Controlled.** |
| Beta reads private alpha state | The beta cookie is resolved by the fixture resolver; the HTTP projection and history visibility predicate return no alpha continuation or loss. **Controlled locally.** |
| Test fixture setup becomes hidden gameplay authority | The only database statement changes the seeded encounter engagement cell before the worker reaches contact, matching the existing CP-11 test branch; no production endpoint or client-selected state is added. **Controlled.** |
| Local page or stub is overclaimed | Task, evidence, and audit label every boundary as local HTTP or labelled transport and explicitly leave browser, WebMCP, Agent, external, hosted, and judge claims open. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-069` as `runtime_verified` for the named local worker/combat/reissue → delivery
   port → canonical page HTTP reread → provenance-bound recall composition.
2. Keep the worker/store authoritative for combat, reissue, world time, mission, cargo, revisions,
   and event order. Keep the port transport-neutral and the page a permission-checked projection and
   command surface.
3. Treat `ContinuationDelivered` as delivery acknowledgement only. It is not proof of Agent wake,
   WebMCP invocation, or hosted Re-entry.
4. Preserve Eddy's external Receiver/Connector handoff as the next CP-14 live gate; do not adapt,
   merge, or claim it until its versioned transport and acknowledgement contract is delivered and
   reviewed.
5. Reopen if a page read can select identity, a stale revision is accepted, acknowledgement mutates
   gameplay, duplicate recall appends an event, beta sees alpha state, or a local stub is presented as
   external evidence.

**Exact conclusion:** The real successful loss/reissue path now reaches a fresh canonical page read and
one server-authoritative, signal-provenance-bound recall in a local process, with no duplicate effects or
scope crossover. This closes the named local composition only; external Re-entry, genuine WebMCP dynamic
action, independent browser, hosted, and judge gates remain open.

