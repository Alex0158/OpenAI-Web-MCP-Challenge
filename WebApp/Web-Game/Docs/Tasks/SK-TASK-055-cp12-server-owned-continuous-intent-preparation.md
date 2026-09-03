# SK-TASK-055: CP-12 Server-Owned Continuous Movement Intent Preparation

## Task Control

- Lifecycle state: `verified`
- Closure type: `decided`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Record the owner-accepted Option B lifecycle and one-shot WebSocket transport boundary for exposing the existing server-owned movement intent cadence to the canonical page.
- Next gate: [`SK-TASK-057`](SK-TASK-057-cp12-server-owned-continuous-intent.md) implements the accepted boundary through Red → Green → Refactor verification; no runtime claim follows from this decision task.

## Identity

- Task ID: `SK-TASK-055`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: The increment crosses the worker cadence, page command admission, realtime connection lifecycle, session binding, revision/idempotency semantics, and disconnect recovery. A poorly scoped intent endpoint could keep a player moving after the page loses authority or create a second timing authority.

## Objective

Prepare a precise decision boundary for a server-owned continuous movement intent path. The proposal
must reuse the existing `set_movement_intent` and `stop_movement_intent` service/gateway contracts,
make the page a start/stop command surface, and let the worker's 100 ms cadence plus authoritative
snapshots own all movement effects. It must resolve the lifetime of an intent when a browser, realtime
connection, scope, worker, or page mutation disappears before any runtime code is admitted.

## Success and non-goals

- Success: The linked Challenge maps the current code and accepted ADRs to exact start/stop inputs,
  server-derived identity, revision/idempotency behavior, connection/page lifecycle, direction
  replacement, snapshot publication, and typed failure outcomes.
- Success: The Challenge compares a minimal client-only hold, a server-owned intent path, and a
  WebSocket control stream, then identifies the one recommended path and its falsifiers.
- Success: The package explicitly prevents orphaned intent, hidden retries, overlapping movement and
  dispatch, client-selected scope, and a second clock or renderable position ledger.
- Success: The package states the owner decision and positive runtime gates required before code,
  schema, or transport changes.
- Non-goals: Runtime code, new HTTP or WebSocket routes, shared-schema migration, default/hosted
  scheduler enablement, production identity, independent browser proof, WebMCP, Re-entry, combat,
  mission, economy, interpolation, or mobile redesign.

## Scope and authority

- In scope: this task, [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md), and the minimum roadmap/current-status/scenario navigation updates needed to expose the decision boundary.
- Out of scope: `src/`, `tests/`, `package.json`, persistence schema, `reentry-core/`, `mvp/`, RightSpot, external Receiver/Connector work, browser adapter configuration, and deployment.
- Allowed actions: Read the current worker, gateway, realtime, page, and movement contracts; write the English proposal and navigation links; run documentation validators. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: `ADR-GAME-0014`, `ADR-GAME-0035`, the movement command contract, realtime connection lifecycle, page mutation gate, snapshot cadence, or CP-12 contract changes.

## Owning authority

- Worker intent and cadence: [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0015`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), and [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)
- Page movement and reconciliation: [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md), [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md), and [`SK-TASK-054`](SK-TASK-054-cp12-held-movement-and-touch-input.md)
- Realtime/session boundary: [`ADR-GAME-0016`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md), [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md), and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Scenario and contract: [`CP-08 fixtures`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md), [`CP-12 fixtures`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md), and [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
- Execution discipline: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified: `PlayerMovementCadenceService` already owns one process-local intent per `(world_id,
  player_id)`, accumulates the accepted 4.0 tiles/second rate at 100 ms worker steps, derives
  idempotent integer crossings, and clears an intent on blocked or stale crossing.
- Verified: `WorkerCommandGateway` exposes `setMovementIntent` and `stopMovementIntent` through the
  existing process FIFO, while `WorldWorker.advance()` and the automatic publication hook remain the
  worker and snapshot authorities.
- Verified: CP-12 currently exposes a local fixture-only discrete command and a snapshot-gated client
  hold. Task054 deliberately leaves server-owned continuous intent open.
- Inferred: A page start/stop command can feel smoother than RTT-gated discrete repeats, but only if
  an intent cannot survive loss of the page's server authority. A connection-bound lease or explicit
  connection-close stop is therefore a contract prerequisite, not an implementation detail.
- Verified by cross-module review: the current intent map is keyed only by `(world_id, player_id)`;
  the accepted session path therefore adds an opaque connection owner, makes a newer connection
  supersede an older one, and makes an old close unable to stop the newer intent. A stale replacement
  must fail-stop the same owner's current intent rather than leave its old direction running.
- Verified by cross-module review: one-shot WebSocket control messages preserve the existing
  connection lifecycle and do not create a browser timing authority or a periodic control stream.
  Connection close, drain, worker fault, and worker stop revoke the owner synchronously; blur/hidden
  remains a best-effort stop signal because the browser connection may remain open.

## Smallest reversible action

The owner accepted the linked Challenge's Option B on 2026-09-03. Keep this record as the decision
boundary, register the separate Task057 implementation scope, and require its Red tests to prove
session ownership, stale replacement fail-stop, close revocation, dispatch/move safety stop, and
one-shot WebSocket ordering before source changes are treated as Green.

## Verification and closure target

- Minimum verification: Documentation structure/link/language validation and a manual cross-check of
  the worker, gateway, realtime close, page gate, snapshot publication, reconnect, and dispatch
  boundaries named by the Challenge.
- Closure target: `decided` for the owner-accepted preparation package. This task does not establish
  continuous browser movement, hosted continuity, or a runtime command.
- Rollback or remediation: Remove no existing records. If implementation falsifies the accepted
  boundary, reopen this decision, preserve Task054's verified discrete/snapshot-gated path, and record
  the narrower replacement rather than weakening the close or ownership invariant.
- Reopen trigger: Any change to intent lifetime, transport, worker cadence, revision/idempotency,
  session binding, page mutation admission, snapshot publication, or the `SK-MVP-0.2` contract.

## Decision result

- **Accepted path:** Option B, server-owned movement intent with one connection-bound owner per
  realtime page session. The latest session may supersede an older session for the same player; an
  older close can revoke only its own owner token.
- **Transport:** one-shot WebSocket `movement_intent_command` frames for `start`/direction replacement
  and `stop`. A browser interval, animation loop, periodic control stream, or hidden retry is not
  admitted.
- **Safety:** server cadence remains the only movement driver. A connection close, worker drain,
  worker fault, worker stop, or competing state-changing move/dispatch revokes the active intent.
  Explicit stop resolves the current server revision so a crossing race cannot leave movement active;
  a stale replacement fail-stops the same owner's old direction. Blur/hidden sends one best-effort stop
  while connection close remains the hard boundary.
- **Projection:** worker crossings continue to publish the existing full `client_snapshot`; no command
  response or fractional position becomes a second renderable ingress.

The accepted runtime implementation is [`SK-TASK-057`](SK-TASK-057-cp12-server-owned-continuous-intent.md),
with the canonical decision in [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md)
and the accepted Challenge in [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md).
