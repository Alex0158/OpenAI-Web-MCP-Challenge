# SK-ISSUE-005: Next Internal Server Handle Survives Entrypoint Shutdown

## Issue Control

- Issue ID: `SK-ISSUE-005`
- State: `resolved`
- Priority: `P1`
- Type: `runtime-lifecycle`
- Owner: Game owner
- Next gate: None; the close hook and direct process smoke are verified. Reopen only if a supported
  runtime again retains a process handle after the coordinated shutdown result.

## Problem

The real `src/server/entrypoint.ts` path reached `runtime_stopped` and closed the game HTTP listener,
worker, and realtime adapter, but did not close the internal Next application. Under the Node 24
`NODE_ENV=test`/Next dev runtime, the process retained a framework watcher handle after `SIGTERM` and
did not exit within the configured shutdown budget. This weakened the process lifecycle claim and
could prevent a supervisor from observing a clean stop or restart.

## Evidence

- Verified: A direct Node 24 smoke with `LOCAL_FIXTURE_MODE=1` and `AUTONOMOUS_WORLD_MODE=1` reached
  health `ready`, advanced the file-backed fixture to `world_time = 1`, persisted a non-null anchor,
  and logged `runtime_stopped`; the process still required a process-group `SIGKILL` after 15 seconds
  (`timed_out = true`).
- Verified: Next 16.3 exposes an application-level `close()` that releases its internal server and
  development cleanup listeners. The adapter now exposes that optional lifecycle method and the
  entrypoint invokes it after listener closure within the existing shutdown barrier.
- Unknown: Whether a selected hosted supervisor or production build would expose a different lingering
  handle. Hosted behavior remains a separate gate.

## Impact and boundary

- The game world state and worker shutdown are not lost, but process termination is not deterministic.
- No gameplay, persistence schema, event, identity, WebMCP, Re-entry, or external service contract
  changes are required.
- The fix must preserve listener-first draining, bounded shutdown timeout, idempotent shutdown, and
  fake `NextApplication` compatibility in existing tests.

## Implemented minimal fix

Extend the local `NextApplication` adapter with optional `close(): Promise<void> | void` and invoke it
after the HTTP listener has begun closing, as part of the existing shutdown barrier. A close failure is
typed as `NEXT_CLOSE_FAILED`; a close that exceeds the existing budget remains `SHUTDOWN_TIMEOUT`.
After the coordinated result is logged, the signal handler exits with status `0` or `1` so framework
handles cannot keep a stopped process alive. No hidden retry conceals a close failure.

## Verification and falsifier

- Added a CP-04 test proving the adapter close is called once and does not change worker/realtime order.
- Rerun the direct Node 24 entrypoint smoke and require `ready`, `world_time > 0`, non-null anchor,
  `runtime_stopped`, `timed_out = false`, exit status `0`, and no lingering task-local process.

## Resolution

- Red: the new CP-04 close regression failed 1/6 before the implementation.
- Green: `npm run test:cp04` passed 6/6 and `npm run typecheck` passed under Node.js `v24.13.1`.
- Runtime: the direct Node 24 smoke reached health `ready`, advanced the fixture to
  `world_time = 1`, persisted a non-null anchor, logged `runtime_stopped`, returned exit status `0`,
  and completed with `timed_out = false`.
- The close hook remains part of the existing entrypoint lifecycle; no gameplay, schema, event,
  identity, WebMCP, Re-entry, or external contract changed.
