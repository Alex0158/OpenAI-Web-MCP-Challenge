# SK-TASK-051: CP-12 Autonomous Realtime Snapshot Publication

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Implement and verify one entrypoint-owned automatic full-snapshot publication path for successful worker progress in the explicitly enabled local autonomous fixture
- Next gate: SK-TASK-052 is contract-verified for its named CP-14 persistence scope; CP-13 page reads and the canonical four-read capability are verified under SK-TASK-061 and SK-EVID-049, while dynamic recall and live CP-14 delivery remain separately gated by Agent grant semantics and Eddy's external Receiver/Connector handoff.

## Identity

- Task ID: `SK-TASK-051`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The increment crosses the worker lifecycle, autonomous scheduler, FIFO read
  gateway, WebSocket sink, snapshot sequence, browser projection, and shutdown boundaries. It is
  reversible and local-only, but a publication race could create stale UI, an unbounded queue, a
  second projection authority, or a false continuous-world claim.

## Objective

When one explicitly enabled local worker completes authoritative progress, every eligible realtime
connection can receive the newest server-owned full snapshot without a client resync request. The
world remains the only mutation authority, the WebSocket remains a projection-only ingress, and a
slow connection has at most one in-flight publication plus one coalesced latest request.

## Success and non-goals

- Success: A successful `WorldWorker.advance()` notifies an entrypoint-owned observer after the
  authoritative clock/phase work returns; a failed advance produces no automatic frame.
- Success: The real `RealtimeWireAdapter` exposes one optional process-local publication seam and the
  entrypoint wires it only when an adapter exists. No worker, scheduler, or browser dependency is
  created by the hub.
- Success: `RealtimeSnapshotHub` sends full `client_snapshot` replacements with strictly increasing
  per-connection sequence numbers, skips an unchanged automatic snapshot, and coalesces progress
  while a sink or gateway read is in flight without an unbounded queue.
- Success: Explicit connect and resync still produce their requested full frame even when its content
  is unchanged; automatic publication never crosses connection or player scope.
- Success: A real local wire/worker proof observes a newer frame after an explicit worker advance
  without sending `resync_request`; clean drain prevents new publications and cursor/state
  resurrection, while accepted sink operations are joined before shutdown completes.
- Success: The default non-autonomous fixture and current discrete movement/dispatch paths retain
  their behavior; no client timer advances world time.
- Non-goals: Held-key input or stop/lease semantics, mobile/touch controls, interpolation redesign,
  new snapshot fields or schema, new wire command messages, WebMCP, Re-entry, Agent Signals,
  Receiver/Connector delivery, independent browser identities, hosted deployment, public-load
  admission, scheduler policy changes, or gameplay balance.

## Scope and authority

- In scope: `src/server/world-worker.ts`, `src/server/realtime-snapshot.ts`,
  `src/server/realtime-wire.ts`, `src/server/entrypoint.ts`, focused realtime/worker tests, and
  this task's English decision, challenge, evidence, validation, index, and current-status links.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, persistence schema and event vocabulary, the
  client command envelope, `PlayerMovementCadenceService` policy, external services, and unrelated
  dirty files.
- Allowed actions: Read and edit the named game files, add focused tests and records, run Node 24
  and documentation verification, and use temporary file-backed fixtures. Do not stage, commit,
  push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: `client_snapshot` or sequence semantics, worker advance/lifecycle, gateway FIFO,
  WebSocket admission, scheduler cadence, or the CP-12/CP-06 contract changes.

## Owning authority

- Owning module documents: [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md),
  [`Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md),
  and [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Controlling decisions: [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md),
  [`ADR-GAME-0016`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md),
  [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md),
  [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), and the
  accepted [`ADR-GAME-0034`](../Decisions/ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md)
- Constraining chain/scenario: [`Scenarios/16-cp16-local-vertical-slice-fixtures.md`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md),
  [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md),
  [`Validation/59`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md), and
  [`Validation/62`](../Validation/62-cp12-autonomous-realtime-snapshot-publication-preimplementation-challenge.md)

## Evidence status

- Verified: One worker owns the clock, phase coordinator, movement cadence, mission services, combat,
  and gateway. `AutonomousWorldScheduler` calls the same `WorldWorker.advance()` seam, while the
  hub currently publishes only on connect or explicit resync.
- Verified: `RealtimeProjectionClient` accepts newer full replacements and the browser socket
  already parses every `client_snapshot` frame; no delta or second renderable response is required.
- Inferred: A process-local post-advance observer plus a bounded hub publisher is smaller and safer
  than a browser poller, a socket command protocol, or a worker-to-wire dependency. Automatic frames
  can use the deterministic `clientSnapshotId` to avoid repeating an unchanged replacement.
- Unknown: hosted/public-load fan-out, independent browser identities, positive WebMCP, Re-entry
  delivery, and whether a later fluid movement increment needs additional transport or lease policy.

## Smallest reversible action

Write the hub/worker Red tests first: no automatic frame exists after a successful advance, and a
second publication can be lost when the first read is in flight. Then add only the observer, adapter
seam, and bounded latest-publication loop needed to turn those Reds green. Stop if the implementation
needs a new clock, browser timer, durable queue, snapshot schema, command message, or a public-load
admission policy.

## Verification and closure target

- Minimum verification: a dedicated publication contract test, affected CP-06 autonomous and CP-08
  realtime/wire suites, `npm run typecheck`, one file-backed entrypoint/worker wire proof with a
  fresh fixture, clean drain, and both documentation validators. Record a focused verification
  budget before any aggregate rerun.
- Closure target: `runtime_verified` for one local explicitly enabled worker and one or more local
  authenticated realtime connections. It cannot support hosted, continuous-default, public-load,
  WebMCP, Re-entry, or independent-two-browser claims.
- Rollback or remediation: Remove only the observer/publisher seam and task-owned tests/records if a
  contract challenge rejects it. Preserve the existing connect/resync projection and autonomous
  scheduler predecessor.
- Reopen trigger: an automatic frame mutates state, advances time, leaks another scope, sends after
  drain, creates more than one queued request per connection, regresses sequence/reconciliation,
  blocks the scheduler on a sink, or requires held-input/auth/schema/wire changes.

## Execution notes

- Red proof: The new publication suite failed against the pre-change implementation because the hub
  had no `publishCurrentSnapshots()` method and the worker had no `onAdvance()` observer; this
  preserves the original connect/resync-only gap as the implementation baseline.
- Green result: `WorldWorker.advance()` now emits a process-local success observer, the entrypoint
  composes it with the optional realtime adapter publication seam, and the hub sends changed full
  snapshots with one in-flight operation plus one trailing latest request per ready connection.
- Trace boundary: No Agent, Thread, WebMCP tool, Receiver, Connector, browser automation, or external
  message is invoked by this task.

## Closure result

- Implementation is complete for the bounded local publication seam: successful worker advances
  notify the entrypoint, the real adapter delegates to the hub, and the hub reads each immutable
  connection scope through the existing gateway. Automatic unchanged content is skipped, explicit
  resync remains forced, and sequence numbers advance only after a delivered frame.
- The focused publication suite passed its 19 contract cases and 5 file-backed/wire cases covering
  changed/equal content, latest coalescing, slow/fast connection isolation, settled-drain and
  connect-time progress races, explicit-during-automatic and explicit-during-resync races,
  sink-failure recovery/visibility, scope isolation, close-before-send, accepted-send shutdown,
  concurrent close/drain joining, worker-failure, custom-adapter no-claim/rejection boundedness,
  and clean file-backed wire publication. Affected CP-06/CP-08 suites and `npm run typecheck` also
  pass under Node.js `v24.13.1`.
- Final evidence and cross-functional disposition are recorded in
  [`SK-EVID-040`](../Evidence/SK-EVID-040-cp12-autonomous-realtime-snapshot-publication-runtime-verification.md)
  and [`Validation/63`](../Validation/63-cp12-autonomous-realtime-snapshot-publication-runtime-cross-functional-audit.md).
- Closure is limited to one explicitly enabled local worker and authenticated local connections.
  It does not prove default or hosted continuity, public-load fan-out, independent browser
  identities, WebMCP, Re-entry, or judge reproduction.
