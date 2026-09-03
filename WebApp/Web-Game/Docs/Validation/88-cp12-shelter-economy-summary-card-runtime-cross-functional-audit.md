# CP-12 Shelter Economy Summary Card Runtime Cross-Functional Audit

**Status:** LOCAL SHELTER ECONOMY SUMMARY PRESENTATION INTEGRATED; AUTHORITATIVE AND EXTERNAL BOUNDARIES UNCHANGED  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-075`](../Tasks/SK-TASK-075-cp12-shelter-economy-summary-cards.md)  
**Evidence:** [`SK-EVID-062`](../Evidence/SK-EVID-062-cp12-shelter-economy-summary-card-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)

## Audit question

Does the shelter dashboard distinguish banked Coins from visible Wood/Rock nodes without creating a second economy authority, retaining stale resource counts, or implying an action that the cards cannot perform?

## Evidence boundary

- The task-owned diff adds one pure client mapper, shelter card markup, presentation CSS, one focused test, the CP-12 visual test entry, and synchronized Game task/evidence/validation/status records.
- No `src/server/`, `src/shared/`, persistence, worker, realtime, session, WebMCP, Re-entry, RightSpot, Eddy-owned, external, or hosted source changed.
- The focused mapper suite passed `3/3`; the CP-12 visual aggregate passed `20/20`; projection passed `5/5`; Node 24 typecheck and optimized Next.js build passed.
- A disposable local fixture reached `READY`. The browser readback observed three cards at wide and narrow sizes, exact document/client widths, zero console errors/warnings, and clean entrypoint drain/stop. This is ladder-level `2` presentation evidence.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Source of truth | `buildShelterSummaryCards` reads only the typed shelter and resource-node projection passed by the existing client view model. | Pass. |
| Currency authority | Coins are copied from `view.shelter.coins`; the mapper does not calculate income, conversion, prices, or upgrades. | Pass. |
| Resource meaning | Wood/Rock values count visible projected nodes, while detail text reports only projected `AVAILABLE` and `DEPLETED` states. | Pass. |
| Ready gate | `game-projection.tsx` supplies resource nodes only when `view.snapshotStatus === "READY"`; other states receive `null`. | Pass. |
| Stale/invalid behavior | Null resource projection renders `—` and `Waiting for an authoritative snapshot`; no previous count is retained or fabricated. | Pass by focused tests and source boundary. |
| Empty and missing state | Missing shelter leaves Coins waiting; a ready empty resource list explicitly renders zero counts and zero availability. | Pass. |
| Presentation order | Cards use stable Coins, Wood, Rock order and stable kind keys; no sort, grouping, or browser-time inference was introduced. | Pass. |
| Text/accessibility | Labels, values, and availability detail are visible DOM text; icons and accent colors are supplemental. The region has an explicit accessible label. | Pass for named local presentation. |
| Responsive layout | Three columns are used at the wide readback and one column at the narrow rule; flexible children and `overflow-wrap` keep values/details within the tested document width. | Pass for tested sizes. |
| Command authority | Cards are non-interactive presentation. They do not dispatch, recall, call WebMCP, emit a Signal, acknowledge an outbox item, or mutate gameplay. | Pass. |
| Lifecycle/performance | Mapping is memoized with the existing projection path. No timer, polling loop, subscription, listener, worker work, network request, or per-card server operation was added. | Pass for named local scope. |
| External boundary | No Receiver/Connector, Agent, Re-entry, hosted, independent-browser, or judge path was invoked. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| A stale or reconnecting snapshot leaves old Wood/Rock counts visible | The ready gate supplies `null` outside `READY`, and the pure mapper fails closed. **Controlled.** |
| A resource count is mistaken for private quantity or economy balance | The card contract calls the value a projected node count and limits detail to availability; no settlement or conversion is computed. **Controlled.** |
| Missing shelter creates an inconsistent dashboard | Coins use the same explicit waiting detail while ready empty resources remain explicit zeroes. **Controlled.** |
| Long translated or identifier detail overflows a narrow layout | Card labels/details use flexible grid children and `overflow-wrap: anywhere`; 390px readback had equal document/client widths. **Controlled for tested sizes.** |
| A visual card becomes an accidental state-changing control | Cards contain no button, handler, command payload, WebMCP invocation, or outbox acknowledgement. **Controlled.** |
| Local fixture is mistaken for production economy or delivery proof | Evidence names the disposable fixture, ladder level, exact local runtime, and non-claims. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-075` as `verified` with `integrated` closure for the named local shelter economy summary presentation.
2. Keep server snapshot fields and the existing projection boundary as the only authority; treat Wood/Rock as visible node counts and Coins as banked projected currency.
3. Preserve open gates for economy generation/balance, real multi-player behavior, genuine dynamic WebMCP action, Agent/Re-entry delivery, Eddy's external Receiver/Connector handoff, independent browsers, hosted continuity, final art/VFX, and population scale.
4. Reopen if cards calculate economy behavior, retain stale resource counts, expose a new quantity field, add an action, overflow a supported viewport, alter snapshot/command semantics, or conflict with the versioned Eddy handoff.

**Exact conclusion:** The shelter economy summary surface is integrated for the tested local presentation. It improves the human-readable economy readout while preserving projection authority, ready/stale semantics, read-only command boundaries, responsive layout, and every external integration gate.

