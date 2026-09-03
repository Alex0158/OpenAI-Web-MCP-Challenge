# CP-12 Causal History Card Runtime Cross-Functional Audit

**Status:** LOCAL CAUSAL HISTORY CARD PRESENTATION INTEGRATED; AUTHORITATIVE AND EXTERNAL BOUNDARIES UNCHANGED  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-074`](../Tasks/SK-TASK-074-cp12-causal-history-card-hierarchy.md)  
**Evidence:** [`SK-EVID-061`](../Evidence/SK-EVID-061-cp12-causal-history-card-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)

## Audit question

Does the causal history dashboard make the existing player-scoped event projection readable and
useful for the Re-entry demonstration without creating a second authority, changing delivery, or
turning a history item into an unverified action?

## Evidence boundary

- The task-owned diff adds only a pure client mapper, semantic card markup, CSS, a focused test, the
  package test entry, and Game task/evidence/validation/status records. No server, shared, persistence,
  worker, realtime, WebMCP, Re-entry, RightSpot, or Eddy-owned source changed.
- The causal presentation suite passed `3/3`; the CP-12 visual aggregate passed `17/17`, projection
  passed `5/5`, Node 24 typecheck passed, and the optimized Next.js build passed.
- A fresh local fixture reached `READY`. One ordinary UI GATHERER dispatch produced a real local
  `MissionDispatched` projection. The card showed all required identity fields at the normal viewport
  and at a temporary `390 x 844` viewport; document width equalled client width in both readbacks.
- Browser error/warning logs were empty and the local entrypoint shut down with the expected drain and
  stop records. This is ladder-level `2` presentation evidence and does not promote any delivery claim.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Source of truth | `buildCausalEventCards` reads only the validated `view.recentEvents` projection. | Pass. |
| Field fidelity | Event ID, canonical event type, world time, cursor, aggregate type, and aggregate ID remain intact; the aggregate label is a deterministic display string. | Pass. |
| Event order | Cards use the server-provided event order and do not sort by browser time or regroup by aggregate. | Pass. |
| Visibility | The existing player-scoped projection and invalid/stale snapshot handling remain upstream; the card mapper cannot fabricate an event from an empty view. | Pass by source boundary and focused tests. |
| Empty state | The existing `No visible causal events yet.` branch remains unchanged in meaning and appears before any event exists. | Pass. |
| Identity text | Event type, world time, cursor, and aggregate identity are visible DOM text, independent of color or icon. | Pass. |
| Responsive layout | `min-width: 0`, `overflow-wrap: anywhere`, and the single-column narrow metadata rule keep long values readable; tested document width had no overflow. | Pass for tested sizes. |
| Accessibility | History remains a semantic unordered list with one list item per projected event and explicit text labels. No new interactive control or hidden identity was introduced. | Pass for named local presentation. |
| Command authority | Cards are read-only and are not passed to dispatch or recall handlers. Existing commands, revisions, and snapshot reconciliation are unchanged. | Pass. |
| Lifecycle/performance | Rendering follows the existing memoized projection path. No timer, polling loop, subscription, event listener, asset loader, or per-event server work was introduced. | Pass for named local scope. |
| External boundary | No Signal, outbox acknowledgement, WebMCP call, Agent wake, Receiver/Connector, Re-entry, hosted, or independent-browser path was invoked. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| A replaced snapshot leaves stale cards | The mapper recomputes from the same `view.recentEvents` used by the count; invalid or empty views produce no cards. **Controlled.** |
| Presentation invents or hides causality | The mapper copies canonical fields, adds no inferred time or cause, and renders every projected event in order. **Controlled.** |
| A long identifier breaks the dashboard | Flexible grid children and `overflow-wrap: anywhere` were verified at the narrow viewport with equal document/client widths. **Controlled for tested sizes.** |
| A visual card becomes an accidental action | Cards have no controls, handlers, WebMCP calls, or signal acknowledgement. **Controlled.** |
| Local setup is mistaken for production delivery | Evidence names the disposable fixture, local port, exact browser session, and explicit non-claims. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-074` as integrated for the named local causal-history presentation.
2. Keep the validated server projection, player visibility filter, and event order as the only
   authority; cards remain a read-only client presentation.
3. Preserve open gates for event production/delivery, coalescing, Agent wake, genuine WebMCP dynamic
   action, Re-entry, external handoff, independent browsers, hosted continuity, final art/VFX, and
   population scale.
4. Reopen if cards sort/deduplicate, expose foreign events, hide identity text, add an action, change
   the event contract, overflow a supported viewport, or conflict with Eddy's handoff.

**Exact conclusion:** The causal history surface is integrated for the tested local presentation. It
improves the human-readable Re-entry context while preserving projection authority, player scope,
append-only order, empty-state behavior, command boundaries, and external integration gates.
