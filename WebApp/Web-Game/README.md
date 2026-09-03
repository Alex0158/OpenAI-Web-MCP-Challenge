# Sleepless Kingdom

**Working title:** Sleepless Kingdom (provisional)  
**Role:** Persistent-world game candidate inside the WebMCP Challenge repository  
**Stage:** CP-12 local fixture session, initial realtime frame, one-browser-context hydration/Canvas readback, explicit same-scope manual reconnect/stale fallback, one discrete keyboard/button movement path, and one ordinary-UI GATHERER dispatch path are verified at named local scopes; CP-13's supported-model Site Tools probe is runtime-verified for one local disposable page under [SK-EVID-045](Docs/Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md), while canonical game-page WebMCP tools, independent two-browser behavior, Re-entry, and hosted continuity remain open
**Outer selection:** The Re-entry Core host-application decision remains pending

**Current delivery posture:** The named CP-15 local aggregate and the bounded CP-16 pre-Agent causal
slice are runtime-verified under [`Docs/Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md`](Docs/Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md),
[`Docs/Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md`](Docs/Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md),
and [`Docs/Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md`](Docs/Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md).
The game-side terminal loss-to-signal boundary is atomic under an explicit server-owned grant and
silent without one; full CP-16/G2 still requires canonical game-page WebMCP tools, external Receiver/Connector,
fresh page reread/recall, and two independent browser contexts.

## Product thesis

Sleepless Kingdom is a persistent magical frontier in which a player's shelter dispatches
role-locked soldiers into an always-advancing world. Soldiers travel, gather, hunt, detect other
actors, fight, carry unbanked resources, and return without requiring the player to micromanage every
moment. Backend Domain Events preserve the causal history of what happened; a coalesced Agent Signal
can invite a bounded Agent back into the canonical game page without turning the Codex Thread into a
high-frequency event consumer. The Agent reads the current world, discovers the page's current WebMCP
tools, continues one safe piece of work, and stops at the human consequence boundary.

The game is valuable to the challenge when the world would continue without the player and the
Agent's re-entry is useful because a meaningful event changed the player's situation. The game is
not a wrapper around a notification or a simulated task queue.

## Initial world loop

```text
shelter
-> assign a role, tool, target, route, and return policy
-> server-authoritative travel and work
-> resource discovery or actor encounter
-> deterministic battle or collection result
-> cargo remains at risk until shelter deposit
-> return, deposit, and convert resources to coins
-> event history updates the dashboard
-> human or Agent chooses the next bounded action
```

The current concept includes a fog-of-war player avatar, movable shelters, shelter detection,
role-locked missions, automatic encounters, monsters with their own state machine, siege parties,
resource/tool tiers, shelter breach, and the conversion of exposed soldiers into roaming monsters.

## Documentation map

- [`Docs/README.md`](Docs/README.md) — authority map and reading order;
- [`Docs/00-current-status.md`](Docs/00-current-status.md) — current state and claim boundary;
- [`Docs/00-Workflow/`](Docs/00-Workflow/) — operating loop, risk profiles, verification ladder,
  closure labels, and the session runbook;
- [`Docs/Blueprint/`](Docs/Blueprint/) — game blueprint, competition thesis, and raw source reference;
- [`Docs/World/`](Docs/World/) — magical setting and continuous-world rules;
- [`Docs/Mechanics/`](Docs/Mechanics/) — 19 atomic mechanisms, family overviews, and 11 cross-mechanism
  logic chains;
- [`Docs/Characters/`](Docs/Characters/) — player, shelter, soldier, monster, and role definitions;
- [`Docs/Design/`](Docs/Design/) — player experience, 8 capability contracts, map, dashboard, and
  presentation direction;
- [`Docs/Engineering/`](Docs/Engineering/) — target stack, server architecture, persistence,
  simulation efficiency, WebMCP, hosting, and the delivery roadmap;
- [`Docs/Scenarios/`](Docs/Scenarios/) — concrete world and re-entry walkthroughs;
- [`Docs/Research/`](Docs/Research/) — Starve.io and documentation-pattern references;
- [`Docs/Decisions/`](Docs/Decisions/) — durable game and documentation choices;
- [`Docs/Tasks/`](Docs/Tasks/) — bounded work as `SK-TASK-*`;
- [`Docs/Issues/`](Docs/Issues/) — verified problems as `SK-ISSUE-*`;
- [`Docs/Evidence/`](Docs/Evidence/) — executed results and claim limits as `SK-EVID-*`;
- [`Docs/Templates/`](Docs/Templates/) — reusable record envelopes; and
- [`Docs/Validation/`](Docs/Validation/) — concept coherence and future proof obligations.

The CP-02 result is recorded in
[`Docs/Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`](Docs/Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md).
The coherent G2 contract closure is recorded in
[`Docs/Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](Docs/Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
and [`Docs/Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](Docs/Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md).
The CP-03 implementation route is [`Docs/Tasks/SK-TASK-003-g1-g2-critical-path-implementation-lock.md`](Docs/Tasks/SK-TASK-003-g1-g2-critical-path-implementation-lock.md),
with static verification in [`Docs/Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md`](Docs/Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md).
The locally verified CP-04 child task is [`Docs/Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md`](Docs/Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md).
The CP-05 persistence child task is verified in [`Docs/Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](Docs/Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md).
The topology conflict is resolved for planning in [`Docs/Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md`](Docs/Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md).
The owner-accepted one-process boundary and its cross-functional review are in
[`Docs/Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](Docs/Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
and [`Docs/Validation/06-cp04-topology-and-cross-functional-audit.md`](Docs/Validation/06-cp04-topology-and-cross-functional-audit.md).
Static acceptance is recorded in [`Docs/Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md`](Docs/Evidence/SK-EVID-006-cp04-topology-acceptance-and-release.md);
local process-runtime verification is recorded in [`Docs/Evidence/SK-EVID-007-cp04-process-runtime-verification.md`](Docs/Evidence/SK-EVID-007-cp04-process-runtime-verification.md). Hosted/world behavior remains open.
The CP-12 projection, visual icon, and local fixture session increments are recorded in
[`Docs/Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md`](Docs/Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md),
[`Docs/Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md`](Docs/Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md),
[`Docs/Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md`](Docs/Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md),
and [`Docs/Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](Docs/Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md), reviewed in [`Docs/Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md`](Docs/Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md). The local manual reconnect path is recorded in [`Docs/Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md`](Docs/Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md) and [`Docs/Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md`](Docs/Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md); discrete keyboard/button movement is recorded in [`Docs/Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md`](Docs/Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md) and [`Docs/Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md`](Docs/Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md). The CP-13 Luna adapter probe is preserved as an unavailable result in [`Docs/Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md`](Docs/Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md). The ordinary-UI GATHERER dispatch path is recorded in [`Docs/Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md`](Docs/Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md) and [`Docs/Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md`](Docs/Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md). The boundary-safe gameplay coordinator is recorded in [`Docs/Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md`](Docs/Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md) and [`Docs/Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md`](Docs/Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md); The B autonomous driver, schema-v8 anchor, and startup recovery are recorded in [`Docs/Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md`](Docs/Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md) and [`Docs/Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md`](Docs/Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md), under [`Docs/Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md`](Docs/Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md) and [`Docs/Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md`](Docs/Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md).

## Verify the documentation

```sh
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
```

These are mechanical checks over structure, links, language, and record shape. Passing them is not
runtime, capability, or gameplay evidence.

## Non-claims

The local game server, Canvas projection, and file-backed database are implemented only within the
named local evidence boundaries. Production WebMCP, Agent delivery, public deployment, balance, and
Hackathon proof remain unverified. The proposed stack and rules must stay bounded by their owning
implementation and evidence records.
