# SK-TASK-075: CP-12 Shelter Economy Summary Cards

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The existing projected shelter coins and ready-gated Wood/Rock readout are rendered as compact economy cards; focused mapping, visual/projection regression, typecheck, build, responsive readback, and clean lifecycle verification are recorded under [`SK-EVID-062`](../Evidence/SK-EVID-062-cp12-shelter-economy-summary-card-runtime-verification.md) and [`Validation/88`](../Validation/88-cp12-shelter-economy-summary-card-runtime-cross-functional-audit.md).
- Next gate: No further gate remains for this named local shelter economy presentation; economy production/balance, genuine WebMCP dynamic action, Re-entry, external Receiver/Connector delivery, independent browsers, hosted continuity, and final art/scale remain separate.

## Identity

- Task ID: `SK-TASK-075`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible React/CSS presentation change over already validated
  `ClientSnapshot` fields. It improves the resource-loop explanation for the demo without changing
  resource quantity, settlement, commands, or server authority.

## Objective

Make the shelter economy legible at a glance. The dashboard should distinguish banked Coins from
sensed Wood and Rock, and show resource availability without implying exact node quantity or hidden
resource values. The cards are a read-only presentation of the latest accepted projection.

## Success and non-goals

- Success: A pure deterministic mapper returns stable Coins, Wood, and Rock cards from the existing
  shelter and resource-node projection.
- Success: Ready snapshots show node counts plus available/depleted status text; missing, stale, or
  invalid projections show an explicit waiting value rather than stale resource counts.
- Success: The existing shelter identity, coins, Wood/Rock meaning, no-snapshot behavior, and dashboard
  ordering remain understandable on wide and narrow layouts.
- Success: Focused mapping tests, CP-12 visual/projection suites, typecheck, build, documentation
  validation, and a disposable browser readback pass without horizontal overflow or console errors.
- Non-goals: Resource quantity, coin conversion, prices, upgrades, sensing radius, shelter level,
  server/shared changes, persistence, worker/realtime/session behavior, WebMCP, Re-entry, Agent
  delivery, combat, final art, animation/VFX, or population-scale performance.

## Scope and authority

- In scope: a client shelter-summary presentation helper, the shelter section of
  `src/client/game-projection.tsx`, its CSS module, focused CP-12 visual tests, and this task's
  evidence, validation, status, roadmap, and index records.
- Out of scope: `src/server/`, `src/shared/`, persistence, worker/realtime/session behavior,
  `reentry-core/`, `mvp/`, RightSpot, Eddy-owned source, and all external or hosted paths.
- Allowed actions: Read only the validated `view.shelter` and ready-gated `view.resourceNodes`; run
  a fresh disposable local fixture for browser readback; run Node 24 focused checks and documentation
  validators; commit only Game-owned files after closure. Do not push, merge, rebase, cherry-pick,
  deploy, or contact external parties.
- Revalidate when: the snapshot adds resource quantity or sensing fields, stale projection semantics
  change, cards start driving a command, or the economy contract changes.

## Owning authority

- Product contract: [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
- Projection boundary: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Dashboard behavior: [`Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md)
- Visual boundary: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Visual vocabulary: [`Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md)
- Predecessor: [`SK-TASK-074`](SK-TASK-074-cp12-causal-history-card-hierarchy.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Cross-functional contract

- `ClientSnapshot.shelter.coins` remains the only displayed currency authority. The card must not
  calculate conversion, income, price, or upgrade state.
- Resource cards read only the ready snapshot's visible Wood/Rock node collection. A node count is a
  count of projected nodes, not a private quantity; availability text is limited to `AVAILABLE` and
  `DEPLETED` values already in the projection.
- When the projection is starting, stale, reconnecting, or invalid, resource values are rendered as
  `—` with an explicit waiting detail. The mapper cannot retain a prior count or fabricate a node.
- Cards are read-only DOM. They do not call WebMCP, emit a Signal, acknowledge an outbox item, mutate
  gameplay, or feed dispatch/recall handlers.
- Critical labels and values remain visible text; icons and accent colors are supplemental. Long or
  translated detail text wraps on narrow screens without changing layout authority.

## Smallest reversible action and TDD loop

1. Add Red tests for ready Wood/Rock counts, available/depleted detail, null shelter, and unavailable
   resource projection.
2. Implement the pure mapper and replace only the existing shelter metric/chips with semantic cards.
3. Add only the CSS needed for hierarchy, explicit labels, wrapping, and the narrow one-column rule.
   Refactor after Green without changing the data contract.
4. Run focused/transitive checks, build, documentation validation, and a disposable browser trace at
   wide and narrow sizes. Confirm stale/empty text and clean lifecycle.

## Verification and closure target

- Minimum verification: Red → Green → Refactor presentation tests; `npm run test:cp12-visual`;
  `npm run test:cp12-projection`; `npm run typecheck`; `npm run build`; documentation self-tests and
  validator; `git diff --check`; and local wide/narrow shelter-card readback with clean shutdown.
- Closure target: `integrated` for the named local shelter economy presentation only.
- Rollback or remediation: Revert only this task's client/test/docs files if stale values, counts,
  labels, ordering, no-snapshot behavior, or responsive layout change unexpectedly.
- Reopen trigger: Cards expose private quantity, show stale resource counts, imply economy behavior,
  trigger an action, overflow a supported viewport, or conflict with the Eddy handoff.

## Claim boundary

This task can establish clearer local presentation of already projected shelter currency and visible
resource-node availability. It cannot establish resource generation, income balance, settlement,
production economy, hosted continuity, WebMCP, Re-entry, Agent delivery, independent browsers, final
art, or scale.

## Execution result

- The implementation adds `buildShelterSummaryCards`, semantic Coins/Wood/Rock card markup, and only
  the CSS needed for hierarchy, explicit availability detail, wrapping, and the narrow one-column
  rule. Coins remain the projected shelter field; Wood/Rock remain visible projected node counts.
- A resource projection outside `READY` is passed as `null` and fails closed to `—` with
  `Waiting for an authoritative snapshot`; the mapper cannot retain a prior count or fabricate a
  node. Cards remain read-only and do not call commands, WebMCP, Signals, outbox acknowledgement, or
  gameplay mutation.
- No fresh Red-to-Green transition was captured during this closure session because the focused
  assertions and implementation were already present in the task-owned working tree at session
  start. The executed Green and regression results are recorded without inventing a Red transcript.
- A fresh disposable fixture reached `READY`; the shelter readback showed `Coins 0`, `Wood 1`, and
  `Rock 1` at wide and narrow viewports. Document/client widths matched, console errors/warnings were
  empty, and the browser was closed before the entrypoint emitted clean drain/stop records. Detailed
  limits are in [`SK-EVID-062`](../Evidence/SK-EVID-062-cp12-shelter-economy-summary-card-runtime-verification.md)
  and [`Validation/88`](../Validation/88-cp12-shelter-economy-summary-card-runtime-cross-functional-audit.md).

## Verification and closure

- `npx tsx --test tests/cp12-shelter-summary-presentation.test.ts`: **3/3 passed**.
- `npm run test:cp12-visual`: **20/20 passed**.
- `npm run test:cp12-projection`: **5/5 passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed** with Next.js `16.3.4` and Node.js `24.20.0`.
- Local browser readback: **passed** at wide (`1280`) and narrow (`390`) viewport sizes with three
  cards, expected values/detail text, no horizontal overflow, empty console error/warning logs, and
  clean entrypoint shutdown.
- Documentation self-tests, documentation validator, and Game-scope `git diff --check` pass after
  closure records are synchronized.

**Closure:** `verified` with `integrated` for the named local shelter economy summary presentation only.
