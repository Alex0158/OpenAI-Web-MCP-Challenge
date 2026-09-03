# SK-TASK-061: CP-13 Page-Bound Read Tools and Recall Action Implementation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The owner-accepted four page-bound reads and the continuation-gated recall action are implemented through the existing entrypoint and FIFO gateway. Focused local contract/process tests are green at 9/9, including per-generation registration locking, semantic schema readback, fail-closed registration errors, and stale in-flight response rejection after reconnect. A fresh canonical-page run on a Codex In-app Browser through a new `gpt-5.6-sol` task with `medium` reasoning discovered all four read tools and successfully invoked `inspect_client_snapshot` read-only; the result is recorded in [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).
- Next gate: None for this task's named ladder-level 6 local canonical-page read capability. Agent grant delivery, `force_recall_soldier` invocation, Re-entry continuation, external Receiver/Connector delivery, independent browser contexts, hosted continuity, production identity, and judge reproduction remain separate gates.
- Dependencies: [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md), [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md), CP-12 page/session and realtime projection seams, and the CP-02 adapter capability prerequisite.

## Identity

- Task ID: `SK-TASK-061`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This increment crosses the canonical page lifecycle, WebMCP registration,
  session identity, server command/read authority, revisions, idempotency, browser capability, and
  the later Agent/Re-entry handoff. A false positive could expose another shelter, create a second
  state authority, or claim a browser capability from page-side registration alone.

## Objective

Implement the smallest genuine CP-13 page surface for the G2 demonstration:
`inspect_shelter_state`, `inspect_client_snapshot`, `inspect_missions`, and
`inspect_mission_history`, plus one bounded `force_recall_soldier` page action backed by the verified
server transition. The page must derive identity and scope from the entrypoint-owned session, return
bounded typed results, and let the existing full realtime snapshot settle visible state.

## Success and non-goals

- Success: The canonical game page registers exactly the accepted four reads and, after the page grant
  and transport checks, the bounded recall action in the supported page API. Registration/readback uses
  the same page context; a page-side object without adapter discovery is not evidence.
- Success: Read tools derive world, player, shelter, binding, visibility, and current revisions from the
  server session. The history cursor is opaque, scope-bound, and bounded; `agent_snapshot_v1` stays a
  fixed-size summary and never exposes raw exploration arrays or hidden foreign rows.
- Success: Recall carries command/idempotency identity, stable soldier/mission/attempt identity, and
  expected revisions to the existing gateway. Valid current GATHERER/HUNTER calls use the verified
  `RETURNING` transition; stale, foreign, duplicate, recovery, malformed, and `IN_COMBAT` outcomes are
  typed and side-effect safe.
- Success: A committed recall result is metadata only. The page requests or accepts the existing full
  `client_snapshot` replacement and does not render an optimistic route, phase, cargo, or coin state.
- Success: Missing capability, registration failure, reconnect, and stale page callbacks leave the
  ordinary human game usable and visibly explain the unsupported or stale state. No polyfill or hidden
  fallback is introduced.
- Success: A supported GPT-5.6 Sol adapter discovers and read-only invokes the canonical game-page
  read surface, with evidence separated from the disposable CP-02 capability receipt.
- Non-goals: `assign_soldier_mission` page implementation, target selectors or target discovery,
  HUNTER dispatch, siege or migration tools, destructive upgrades, automatic Agent dispatch, Signal,
  Receiver/Connector delivery, Re-entry thread continuation, new scheduler/queue, schema migration,
  new event vocabulary, production identity, hosted continuity, independent-browser claims, or judge
  reproduction.

## Scope and authority

- In scope: the canonical page registration/adapter seam, entrypoint-owned page transport, exact
  schemas for the accepted reads and recall action, session/grant mapping, typed page failures, bounded
  history and Agent snapshot projection, page reconciliation/unsupported UX, focused page/contract tests,
  and task-owned evidence and audit records.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, external Receiver/Connector services, credentials,
  deployment, hosted configuration, and unrelated dirty files.
- Allowed actions: edit the named game page/entrypoint/adapter/test/docs surfaces, install only existing
  project dependencies if required, run Node 24 focused verification, and use disposable local fixtures.
  Do not stage, commit, push, deploy, spend, or contact external parties.
- Revalidate when: WebMCP registration/readback behavior, page/session binding, grant scope, history
  visibility, snapshot contract, `SK-MVP-0.2`, or the adapter/client capability changes.

## Owning authority

- Page contract and sequencing: [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md),
  [`Validation/64`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md), and
  [`Scenarios/13`](../Scenarios/13-cp13-webmcp-fixtures.md)
- Server recall authority: [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md),
  [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md), and
  [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md)
- Page/session and projection predecessors: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md),
  [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md),
  [`SK-TASK-051`](SK-TASK-051-cp12-autonomous-realtime-snapshot-publication.md), and
  [`SK-TASK-045`](SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md)
- Capability prerequisite: [`SK-TASK-059`](SK-TASK-059-cp13-site-tools-capability-experiment.md) and
  [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified: The server owns world time, identity, mission/role state, route, cargo/settlement,
  revisions, idempotency, and the only state-changing gateway. The recall transition and intermediate
  route-prefix return are runtime-verified for the named local scope under SK-EVID-046.
- Verified: CP-12 supplies the server-derived fixture/session boundary, full `client_snapshot`
  reconciliation, realtime lifecycle, and ordinary human fallback. The supported adapter discovered and
  invoked a read-only tool on the disposable CP-02 page under SK-EVID-045.
- Verified: The accepted package is the four bounded reads plus a page-gated recall seam. The SideChat
  `assign_soldier_mission` suggestion remains deferred because target discovery, Agent grant semantics,
  exact schema, and W13 coverage are not closed.
- Resolved for the local implementation: the exact page endpoint, bounded request/result schemas,
  server-derived session scope, opaque history cursor, dynamic continuation grant gate, semantic
  schema readback, AbortController generation cleanup, typed recall failures, fail-closed capability
  error handling, and full-snapshot
  reconciliation are recorded in [`Validation/74`](../Validation/74-cp13-page-tools-implementation-preimplementation-challenge.md).
- Verified: The named supported `gpt-5.6-sol` task with `medium` reasoning used the Codex In-app
  Browser's native page adapter to read back the canonical page's four registered reads and invoke
  `inspect_client_snapshot` once, as recorded in [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).

## Smallest reversible action

The implementation challenge has been reconciled with Validation/64 and Scenario/13. Red tests now
cover exact schemas, server scope, bounded history, dynamic grant gating, semantic readback,
unsupported behavior, recall provenance, duplicate replay, and full-snapshot reconciliation. The
smallest Green implementation adds only the shared page contract, entrypoint transport, gateway read
methods, client registrar, and visible status wiring. Stop if canonical evidence requires a page-created
worker/store/queue, client-selected authority, a second renderable projection, a polyfill, a new
contract version, or an unowned external handoff.

## Verification and closure target

- Minimum verification: `npm run test:cp13-page-tools`, `npm run test:cp13-recall`, CP-06/08/09/10/11
  mission suites under Node 24, `npm run typecheck`, the documentation validators, and one fresh
  canonical browser/adapter run. All named checks and the ladder-level 6 canonical run are recorded
  in [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md) and
  [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).
- Evidence gate: satisfied for exact canonical-page registration/readback and one supported
  `gpt-5.6-sol` read-only invocation. The disposable CP-02 result remains a capability prerequisite,
  not game-page evidence.
- Closure target: `runtime_verified` for the named local canonical-page and adapter scope only. This
  cannot close Agent grants, Re-entry delivery, external Receiver/Connector, hosted continuity,
  independent browsers, production identity, public load, or judge reproduction.
- Rollback or remediation: revert only this task's page/adapter/test/evidence changes if a named
  invariant is falsified; preserve the verified server recall seam and accepted four-read contract.
- Reopen trigger: a page-selected identity, scope leak, unbounded result, optimistic render, duplicate
  recall, combat bypass, stale callback mutation, registration mismatch, polyfill, or need for a new
  schema/contract/authority.

## Implementation result

- The four reads execute through `POST /api/local-fixture/page-tools/execute` with the server-derived
  fixture cookie scope and the existing `WorkerCommandGateway` FIFO. No page bundle constructs mutable
  runtime state.
- `inspect_shelter_state` exposes only bounded shelter/resource summaries and a server-owned
  continuation summary. `inspect_client_snapshot` uses the fixed `agent_snapshot_v1` summary;
  `inspect_missions` caps the fixture roster at five rows; `inspect_mission_history` caps pages at 50
  rows and signs cursors to world/player/shelter scope.
- `force_recall_soldier` is registered only after a durable `force_recall_soldier` continuation is
  returned by the shelter read. The server validates the signal slot and optional causal
  `CargoLostToMonster` event before delegating to the existing recall transition. The client accepts
  metadata only and requests the existing full realtime resync.
- The canonical page displays WebMCP `unsupported`, `registering`, `registered`, `stale`, or `error`
  status while leaving human movement and dispatch available. Reconnect, stale projection, socket
  failure, and unmount abort the registration generation; concurrent continuation reads share one
  recall-registration promise per generation, and the recall tool is marked ready only after semantic
  schema readback succeeds. An in-flight response from a stopped generation is rejected before any
  continuation registration or reconciliation callback can run.

## Local verification result

- `npm run typecheck` — passed with no TypeScript errors.
- `npm run test:cp13-page-tools` — 9/9 passed, including parser/schema, FIFO gateway reads and
  scope-bound cursors, cookie-scoped HTTP reads and continuation-bound recall/duplicate replay,
  strict query/media/body transport gates, semantic schema readback with reordered host keys,
  unsupported browser behavior, abort cleanup, fail-closed registration/readback errors, and
  concurrent continuation-registration and readback-readiness race protection plus stale-response
  rejection after reconnect.
- The CP-06 clock/coordinator/scheduler, CP-08 movement/snapshot/cadence/gateway, CP-09 dispatch/route,
  CP-10 extraction/cadence, CP-11 combat/hunter, and CP-12 projection/fixture/reconnect/dispatch,
  publication, and continuous-intent suites passed in the same source window; CP-12 reconnect (3/3)
  and projection (5/5) were rerun after the stale-generation guard.
- Canonical GPT-5.6 Sol discovery/invocation passed in a fresh Codex task configured with
  `gpt-5.6-sol` and `medium`: the genuine Codex In-app Browser adapter returned the four canonical
  read tools and a read-only `inspect_client_snapshot` call returned the scoped `agent_snapshot_v1`
  result. The exact capability evidence and claim limits are recorded in [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); this does not claim Re-entry or hosted delivery.
