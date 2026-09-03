# SK-EVID-001: CP-02 Capability and Runtime Probe

## Identity

- Evidence ID: `SK-EVID-001`
- Related task, issue, or decision: `SK-TASK-001`, `SK-ISSUE-001`, `ADR-GAME-0008`
- Evidence class: `capability` with process-runtime checks
- Ladder level: Level 4 for worker and persistence; Level 6 for page-side WebMCP registration
- Executor and date: Primary Codex session, 2026-09-02, Europe/London

## Exact identity under test

- Source state: branch `main`, `HEAD d6b242c`, plus the uncommitted `probe/cp02/` harness and the
  pre-existing game governance changes in the working tree.
- Contract version: `SK-MVP-0.1` in the typed probe command envelope; no gameplay state was
  implemented or mutated.
- Runtime versions: Node.js `v24.13.1` from
  `/Users/alex/.nvm/versions/node/v24.13.1/bin/node`; SQLite `3.51.2` through Node's `node:sqlite`
  API; Next.js `16.3.4` and React `19.2.8` runtime smoke from the existing local dependency tree.
- Browser and session: Codex In-app Browser, browser id `6`, tab id `2`, page
  `http://127.0.0.1:8787/`, title `Sleepless Kingdom CP-02 Probe`.
- Environment: macOS arm64, loopback-only local workers, temporary SQLite files under `/tmp`.

## Objective and claim boundary

- Behavior under test: CP-02 worker lifecycle, Canvas page rendering, realtime command/snapshot
  exchange, SQLite WAL persistence across restart, visible worker degradation, and page-bound
  `document.modelContext` registration.
- Claim this evidence may support: the disposable harness exercised the named local runtime and
  page boundaries successfully in the recorded environment; the page-side registration call
  returned successfully and displayed a readback.
- Claims this evidence cannot support: durable game implementation, gameplay correctness, hosted
  continuity, production performance, Re-entry delivery, actual Agent tool invocation, or
  Next.js integration with the game page.

## Preconditions and fixture

- Starting state: the game application had no durable implementation. The probe harness was created
  under `probe/cp02/` and uses no new package dependency.
- Synthetic identities and seeded actors: none; the harness stores only one synthetic probe event.
- Real, fake, and stubbed boundaries: real Node worker, HTTP server, browser Canvas, browser
  WebSocket, SQLite WAL, and page capability surface; no game worker, game schema, Re-entry Core,
  hosted service, or production adapter.

## Execution

- Process, realtime, idempotency, and restart command:

  ```sh
  /Users/alex/.nvm/versions/node/v24.13.1/bin/node --no-warnings probe/cp02/run.mjs
  ```

  Expected result: one clean worker start, one typed realtime command and snapshot, one duplicate
  command with no second event, WAL mode, clean shutdown, and the same event after restart.

  Actual result: `pass`. The worker reported Node `v24.13.1`; the realtime command returned
  `ok: true`, `duplicate: false`, and `probe-snapshot-1`; the duplicate returned `duplicate: true`;
  SQLite reported `journal_mode: wal`, `synchronous: 2`, and `event_count: 1` both before and after
  restart.

- Next.js runtime smoke: the existing local Next.js `16.3.4` development server started on
  loopback and returned HTTP `200` with `X-Powered-By: Next.js`. This was a runtime availability
  check against the existing dependency tree, not a game-page integration test.

- Browser procedure: open the local probe page, wait for the initial snapshot, and read the visible
  DOM state. The page reported `Canvas: rendered (pixel 52,211,153,255)`, `Realtime: connected`,
  `Snapshot: probe-snapshot-0`, and `WebMCP: supported (cp02_inspect_probe registered)`. Its details
  readback recorded one successful typed command and one snapshot with `probe_event_count: 1`.

- Failure procedure: stop the loopback worker while the page remains open. The page then reported
  `Realtime: unavailable (worker health check failed)` while retaining the Canvas and capability
  diagnostics.

- WebMCP adapter check: the browser capability handle's `fetchTools()` call returned
  `gpt-5.6-luna does not support command "webmcp_list_tools"`. This is recorded as an adapter/model
  capability limitation, not as a page registration success or failure.

- Status: `pass` for the process-runtime and page-side registration checks; `gated` for external
  Agent tool discovery and invocation.

## Assertions

- Player-visible state: Canvas rendered a non-transparent pixel and the page retained a readable
  status surface when the worker became unavailable.
- Command and failure contract: typed JSON commands returned a structured result; the duplicate
  idempotency key returned the original event instead of creating another event.
- Persistence, event, and outbox state: one probe event persisted in SQLite WAL mode and was present
  after a clean worker restart. The harness has no production outbox.
- Exactly-once settlement after duplicate delivery and replay: the probe event count remained one
  after a duplicate command and restart; no gameplay settlement was exercised.
- Ownership denial, stale revision, restart, and reconnect: restart was exercised; ownership,
  stale-revision, and reconnect resync are outside this disposable probe.

## Analysis and closure

- Failure classification: the external WebMCP listing result is an environment/capability gate for
  the current model adapter. The first browser close test also exposed that transport close alone
  was not reliably surfaced in this browser path; the page health watchdog now provides the visible
  degraded state.
- Limitations and residual risk: page-side registration returned successfully, but the current
  adapter could not enumerate or invoke the tool. Next.js was smoke-tested only through the existing
  local dependency tree. No hosted worker, game route, Re-entry continuation, or production database
  was tested.
- Invalidation triggers: changes to the probe source, Node or browser version, page capability
  surface, transport, persistence contract, `SK-MVP-*` version, or selected host.
- Exact conclusion: CP-02 is locally runtime-verified for the disposable worker, Canvas, realtime,
  WAL restart, visible degradation, and page-side registration. CP-03 may be prepared only after the
  pre-implementation coherence findings are reconciled. The external Agent adapter remains an
  explicit follow-up gate for CP-13/CP-14.
