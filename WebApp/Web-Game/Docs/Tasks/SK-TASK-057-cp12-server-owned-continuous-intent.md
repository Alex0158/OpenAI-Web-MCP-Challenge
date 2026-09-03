# SK-TASK-057: CP-12 Server-Owned Continuous Movement Intent

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: The owner-accepted server-owned movement intent boundary is implemented through the existing worker cadence, command FIFO, realtime session, and canonical page. The shared frame parser, connection owner/revocation seam, gateway safety stop, realtime command path, client controller, lifecycle wiring, and focused regressions are green.
- Next gate: Synchronize the runtime evidence and cross-functional audit, then select the next independently gated CP-13/WebMCP task; do not promote this local result to hosted or browser-capability proof.

## Identity

- Task ID: `SK-TASK-057`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This increment crosses the worker cadence, command FIFO, realtime wire lifecycle,
  page input, revision/idempotency, reconnect, and cross-session ownership. It is bounded by an
  accepted ADR but a false green result could leave movement running after authority loss.

## Objective

Expose the existing server-owned 100 ms movement intent cadence to the canonical CP-12 page with one
start/replacement and one stop WebSocket command boundary. The server-issued realtime connection owns
the intent lifetime; the worker remains the only movement driver and full snapshots remain the only
renderable position source.

## Success and non-goals

- Success: A strict shared envelope accepts only server-bound `movement_intent_command` start,
  replacement, and stop frames with command identity, idempotency, expected player revision, and typed
  direction; client scope fields are rejected.
- Success: The cadence stores an opaque connection owner, allows newer-session supersession, prevents
  old stop/close from clearing a newer intent, and fail-stops the same owner's old direction on stale
  replacement.
- Success: Explicit stop resolves the current server revision; connection close, adapter drain/close,
  worker fault/stop, and competing move/dispatch revoke active intent without a post-close crossing or
  second timing authority.
- Success: The page's pointer, keyboard, blur/hidden, reconnect, and accessibility paths send one-shot
  start/stop frames, show typed pending/stopped/recovery states, and never render command-response
  positions or fall back silently to a browser timer.
- Success: Duplicate, stale, blocked, unknown, two-session, dispatch-overlap, worker-drain, and
  reconnect cases are covered by focused tests and a local realtime runtime trace.
- Non-goals: WebMCP/Re-entry, mission/combat/economy changes, hosted/default scheduler claims,
  server leases/heartbeats, prediction/interpolation, new persistence schema/events, production auth,
  independent-browser proof, mobile redesign, or final visual polish.

## Scope and authority

- In scope: `src/shared/movement-intent-command.ts`, `src/server/player-movement-cadence.ts`,
  `src/server/worker-command-gateway.ts`, `src/server/realtime-wire.ts`, `src/server/world-worker.ts`,
  `src/server/entrypoint.ts`, `src/client/server-movement-intent.ts`,
  `src/client/live-game-projection.tsx`, the smallest UI copy/style adjustments, focused tests, and
  task-owned English decision/evidence records.
- Out of scope: persistence schema, world clock cadence rate, event vocabulary, `reentry-core/`,
  `mvp/`, RightSpot, WebMCP, external services, deployment, credentials, and unrelated dirty files.
- Allowed actions: edit the named source/tests/docs, install no new dependency unless required by the
  existing package, run Node 24 focused verification, and use fresh file-backed local fixtures. Do not
  stage, commit, push, deploy, spend, or contact external parties.
- Revalidate when: `ADR-GAME-0036`, the CP-08 movement/gateway/realtime contracts, the CP-12 page gate,
  or the `SK-MVP-0.2` snapshot/identity rules change.

## Owning authority

- Decision and challenge: [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md)
  and [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md)
- Worker/cadence: [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
  and [`ADR-GAME-0015`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Realtime/session: [`ADR-GAME-0016`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md),
  [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md), and
  [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Page/projection: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md),
  [`ADR-GAME-0034`](../Decisions/ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md),
  and [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)
- Execution: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: worker-owned 100 ms intent cadence, strict command/read FIFO, authenticated
  local WebSocket projection, automatic full snapshot publication, and local snapshot-gated held input.
- Verified decision: Option B is owner-accepted with one-shot WebSocket frames, connection owner
  supersession, synchronous close revocation, stale replacement fail-stop, no MVP lease/heartbeat, and
  full-snapshot-only rendering.
- Runtime-verified result: exact frame/result schema, owner-token data path, close/drain/fault ordering,
  per-message runtime-admission rejection, client controller composition with the existing page gate, stale/blocked safety, and the local worker
  cadence/close trace are recorded in [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
  and reviewed in [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).

## Smallest reversible action

Add the shared frame/result parser and focused Red tests first. Then implement the smallest server
owner/revocation seam, wire adapter command handling, client controller, and page lifecycle wiring in
that order. Stop if a test requires a browser clock, periodic control stream, new position ingress,
client-selected scope, durable fractional state, or an unbounded retry.

## Verification and closure target

- Minimum verification: focused server cadence/gateway/wire and client controller/UI tests, affected
  CP-08/CP-12 regressions, `npm run typecheck`, `npm run build` when page/source composition changes,
  documentation validators, and a fresh file-backed local wire trace with clean drain. The executed
  result is bound to [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
  and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
- Closure target: `runtime_verified` for the named local server-owned continuous-intent presentation
  scope. This does not close hosted continuity, independent browser identity, WebMCP, Re-entry, or
  production claims.
- Rollback or remediation: revert only Task057-owned source/tests/records if the accepted boundary is
  falsified; preserve Task054's verified client hold and all existing server movement behavior.
- Reopen trigger: post-close or post-drain crossing, old-owner interference with a newer session,
  stale replacement leaving old direction active, overlapping/periodic commands, second renderable
  position authority, dispatch/move overlap, silent fallback, or accessibility/lifecycle regression.

## Required Red cases

1. Exact start/replacement/stop frame parsing and rejection of scope/query/unknown fields.
2. One active owner, newer-session supersession, old-owner stop no-op, duplicate replay, and changed
   payload conflict.
3. Stale replacement fail-stop, stale explicit stop safety release, blocked crossing, and no retry loop.
4. Close revocation before a queued crossing, worker drain/fault/stop cleanup, reconnect fresh start,
   and no post-close movement.
5. Direct move and mission dispatch safety-stop an active intent in the shared gateway order.
6. Wire command/result ordering, invalid frame handling, connection mismatch, worker errors, and
   per-connection scope privacy.
7. Client start/replacement/stop single-flight behavior, snapshot-only position reconciliation,
   pointer/keyboard/lifecycle stop, unknown recovery, reconnect reset, and assistive discrete click.
