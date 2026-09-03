# SK-TASK-013: CP-13 Page-Bound WebMCP Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: Cross-functional CP-13 preparation is complete; the owner accepted the amended four-read package, and the server-authoritative recall prerequisite is runtime-verified under [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md). The side-chat Soldier dispatch candidate remains deferred.
- Next gate: The bounded CP-13 page-read implementation and canonical four-read capability are verified under [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md). Dynamic recall grant delivery, Re-entry, and the deferred Soldier dispatch candidate remain separate gates.

## Identity

- Task ID: SK-TASK-013
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare a genuine page-bound WebMCP surface for current-state reads and one bounded recall action with visible unsupported behavior and human fallback. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare a genuine page-bound WebMCP surface for current-state reads and one bounded recall action with visible unsupported behavior and human fallback.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Backend authority, external Receiver/Connector, private Agent context, arbitrary prompts, migration/siege tools, destructive upgrades, authentication redesign, or a silent polyfill.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-13 scenario fixture](../Scenarios/13-cp13-webmcp-fixtures.md), and the owning documents named below.
- Out of scope: Backend authority, external Receiver/Connector, private Agent context, arbitrary prompts, migration/siege tools, destructive upgrades, authentication redesign, or a silent polyfill.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Engineering/05-api-and-webmcp.md, Design/Capabilities/07-event-driven-agent-continuation.md, ADR-GAME-0006, and the page command contract.
- Roadmap dependency: CP-12 and CP-02.
- Cross-functional handoff: CP-12 provides page lifecycle and fallback; CP-09 provides mission and role locks; CP-10/11 provide current outcomes; CP-14 consumes the tool result; CP-02 supplies capability evidence only.
- Preparation audit: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md).

## Evidence status

- Verified: The page and Agent use the same command/read gateway; ownership, revision, role lock, idempotency, current state, and unsupported capability are required checks.
- Inferred: Reads before mutation and one bounded recall provide the smallest meaningful demonstration while keeping high-consequence actions human-controlled. Soldier dispatch remains a later candidate because the Agent snapshot has no target IDs and the accepted continuation grant does not authorize dispatch.
- Unknown: Final JSON schemas, registration timing, target-browser discovery, error-to-UI mapping, grant scope, and event-range read shape.

## Current CP-12 handoff readback

- The accepted CP-12 local fixture boundary now exposes one server-derived `LocalFixtureSessionContext` for page bootstrap and strips only the transport-facing `ServerBoundRealtimeContext` for WebSocket admission. The existing `WorkerCommandGateway` and `ClientSnapshotService` remain the sole read and command authority; this is predecessor context, not CP-13 runtime evidence.
- The CP-13 page adapter should be reached through the entrypoint-owned request boundary before Next. A page registration may call same-origin endpoints, but neither a Next route nor a page bundle may construct a worker, store, resolver, or identity.
- The accepted G2 starting page-tool set is the four reads `inspect_shelter_state`,
  `inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history`. The bounded
  `force_recall_soldier` action is now backed by the separately verified server transition in
  [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md), but its page
  registration still requires the page/session grant, live reread, and full-snapshot reconciliation;
  the broader candidate list remains outside this increment.
- Reads should derive from one server-owned current snapshot and visibility path. The server recall transition is now implemented and verified under [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md); the page layer still requires the accepted grant, canonical transport, live reread, and full-snapshot reconciliation. A new browser command queue, mutable singleton, timer, or identity map is outside this preparation boundary.

## Smallest reversible action

After CP-12 exposes the canonical page and CP-02 capability is rechecked, reconcile the minimum tool
set against the contract and implement the page-bound reads plus the permission-checked force-recall
seam. Stop if the named predecessor fields or authority seam are missing, or if implementation would
require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-13 scenario fixture](../Scenarios/13-cp13-webmcp-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-12 and CP-02, the owning contract, or the cross-functional handoff.
