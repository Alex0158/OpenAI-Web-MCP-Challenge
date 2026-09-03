# SK-TASK-074: CP-12 Causal History Card Hierarchy

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The existing player-scoped causal event projection is rendered as compact timeline cards with explicit event type, world time, cursor, and aggregate identity; focused tests, build, responsive readback, and clean lifecycle verification are recorded under [`SK-EVID-061`](../Evidence/SK-EVID-061-cp12-causal-history-card-runtime-verification.md) and [`Validation/87`](../Validation/87-cp12-causal-history-card-runtime-cross-functional-audit.md).
- Next gate: No further gate remains for this named local causal-history presentation; event production/delivery, genuine WebMCP dynamic action, Re-entry, independent browser contexts, hosted continuity, and final visual/scale work remain separate gates.

## Identity

- Task ID: `SK-TASK-074`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible React/CSS presentation change over an already validated
  `ClientSnapshotEvent` collection. It improves the causal Re-entry story while preserving the
  server-owned event projection, visibility filter, and append-only history.

## Objective

Make causal history useful at a glance during the demo. Each visible event should show its canonical
event type, world time, monotonic event cursor, and aggregate identity in a stable order. The card is a
read-only presentation of the existing scoped event list; it does not summarize away events or create a
new event model.

## Success and non-goals

- Success: A pure deterministic mapper preserves every existing event field and returns an empty list
  for an empty projection without inventing events or changing order.
- Success: The dashboard renders one semantic list item per visible event with explicit event type,
  world time, cursor, and aggregate text. The causal identity remains readable without Canvas.
- Success: The append-only event order, player visibility filtering, snapshot status, mission controls,
  WebMCP page reads, Agent Signal behavior, and existing no-event message remain unchanged in meaning.
- Success: Focused presentation tests, CP-12 projection/visual suites, typecheck, build, documentation
  validation, and a disposable local event readback at wide and narrow sizes pass without overflow or
  browser console errors.
- Non-goals: New Domain Events, event retention, signal coalescing, outbox/Receiver/Connector changes,
  server/shared changes, WebMCP, Re-entry, Agent delivery, combat/migration behavior, final art,
  animation/VFX, or population-scale performance.

## Scope and authority

- In scope: a client event presentation helper, the causal history section of
  `src/client/game-projection.tsx`, its CSS module, focused CP-12 visual/projection tests, and this
  task's evidence, validation, status, roadmap, and index records.
- Out of scope: `src/server/`, `src/shared/`, persistence, worker/realtime/session behavior,
  `reentry-core/`, `mvp/`, RightSpot, Eddy-owned source, and all external or hosted paths.
- Allowed actions: Edit only the named Game presentation/test/docs paths; use a fresh disposable local
  fixture and one ordinary local GATHERER dispatch to produce a visible event for readback; run Node 24
  focused checks and documentation validators; commit only Game-owned files after closure. Do not push,
  merge, rebase, cherry-pick, deploy, or contact external parties.
- Revalidate when: event projection fields or visibility rules change, event history becomes paginated
  in the page, cards start driving an action, or a new event type needs a product decision.

## Owning authority

- Product contract: [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
- Projection boundary: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Dashboard behavior: [`Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md)
- Agent/event boundary: [`Design/Capabilities/07-event-driven-agent-continuation.md`](../Design/Capabilities/07-event-driven-agent-continuation.md)
- Visual boundary: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Predecessor: [`SK-TASK-073`](SK-TASK-073-cp12-mission-status-card-hierarchy.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Cross-functional contract

- `ClientSnapshotEvent` remains the authority. The mapper reads only the already validated,
  player-scoped `view.recentEvents` array and does not read raw persistence or infer causality.
- Event order remains the server-provided order (oldest to newest in the current snapshot slice).
  The card list must not sort by a browser timestamp or deduplicate by aggregate.
- Event type, world time, cursor, aggregate type, and aggregate ID are all visible text. Styling and
  layout are supplemental and cannot hide a critical identity behind color or an icon.
- Empty, stale, connecting, or invalid projection states retain the existing status/no-event behavior;
  no card is fabricated while a snapshot is unavailable.
- The presentation does not call WebMCP, emit a Signal, acknowledge an outbox item, mutate gameplay,
  or make an event actionable. A state-changing dispatch used for the disposable readback is test setup
  only and is not part of the implementation.
- Long aggregate IDs and event types wrap on narrow screens. No animation, polling, event listener,
  extra DOM actor, or asset loader is introduced.

## Smallest reversible action and TDD loop

1. Add Red tests for two ordered events, cursor/time/aggregate fidelity, long IDs, and empty input.
2. Implement the pure event mapper and render semantic list/card markup from it while preserving the
   existing no-event branch.
3. Add only the CSS needed for hierarchy, explicit labels, wrapping, and narrow layout. Refactor
   behavior-preserving duplication after focused tests pass.
4. Run focused/transitive checks, build, documentation validation, and a disposable browser trace that
   creates one local `MissionDispatched` event, reads its card, checks wide/narrow overflow, and closes
   cleanly. Record exact claim limits.

## Verification and closure target

- Minimum verification: Red → Green → Refactor presentation tests; `npm run test:cp12-visual`;
  `npm run test:cp12-projection`; `npm run typecheck`; `npm run build`; documentation self-tests and
  validator; `git diff --check`; and local wide/narrow event-card readback with clean shutdown.
- Closure target: `integrated` for the named local causal-history presentation only.
- Rollback or remediation: Revert only this task's client/test/docs files if event order, visibility,
  identity text, no-event behavior, or responsive layout changes unexpectedly.
- Reopen trigger: Cards sort/deduplicate or hide events, expose a foreign event, add a new event/signal
  contract, trigger an action, overflow a supported viewport, or conflict with the Eddy handoff.

## Claim boundary

This task can establish clearer local presentation of already projected player-scoped event history. It
cannot establish new event production, delivery, coalescing, Agent wake, WebMCP dynamic action,
Re-entry, hosted continuity, independent browser delivery, final art, or scale.
