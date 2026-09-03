# SK-TASK-062: CP-14 Game-Side Local-Stub Delivery Port

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-14`
- Owner: Game owner
- Current increment: The read-only candidate selector and transport-neutral local `ReentryDeliveryPort` are runtime-verified at ladder level 2 under [`SK-EVID-050`](../Evidence/SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md) and [`Validation/76`](../Validation/76-cp14-game-side-local-stub-delivery-port-runtime-cross-functional-audit.md); five focused tests cover envelope mapping, one-shot acknowledgement, retry and expired-lease reclaim, deferred-cursor folding, terminal/exception outcomes, and malformed-response fail-closed behavior; the affected CP-14 signal and CP-16 causal suites and typecheck are green.
- Next gate: No further gate for this named local-stub scope. Live Receiver/Connector, Agent grant, dynamic recall, independent browser, hosted, and judge evidence remain separate gates.

## Identity

- Task ID: `SK-TASK-062`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: The port crosses durable signal/outbox state, wall-time leases, opaque binding,
  acknowledgement identity, and the later external Re-entry handoff. A false green could duplicate a
  wake, settle a stale lease, expose the wrong shelter, or imply live delivery from a stub.

## Objective

Implement the smallest game-side `ReentryDeliveryPort` with a host- or test-invoked `pumpOnce` seam.
It selects at most one pending or expired delivery from the existing durable outbox, claims it with an
explicit wall-time lease, maps the existing `SignalSlotRecord` to a bounded transport envelope, and
records an accepted, retryable, or terminally rejected transport outcome through the existing store
transitions.

The implementation is deliberately local and transport-neutral. It prepares the game-side boundary
while Eddy's Cloud Receiver and Local Connector remain external and unversioned.

## Success and non-goals

- Success: One `pumpOnce` call selects at most one candidate for a named world and returns `idle` when
  there is no pending or expired delivery.
- Success: The envelope preserves `SK-MVP-0.2`, world/shelter scope, opaque binding, signal identity,
  grant, bounded action, cursor window, eligible count/types/severity, and latest-event metadata.
- Success: Claim, acknowledgement, retry, and terminal rejection use the existing `PersistenceStore`
  lease and slot transitions. A retry reuses the same `signal_id`; acknowledgement creates at most one
  `ContinuationDelivered` event.
- Success: Transport acceptance never mutates a mission, soldier, cargo, coins, world time, or page
  state; it only settles the durable delivery record.
- Success: Transport exceptions become an explicit retryable outcome, while malformed transport
  outcomes fail closed without a hidden success.
- Non-goals: Implementing or modifying the Cloud Receiver, Local Connector, Codex Thread, WebMCP
  registration, Agent grant issuance, dynamic recall, hosted scheduling, a second queue/timer/worker,
  a new persistence schema, a new identity resolver, or any gameplay rule.

## Scope and authority

- In scope: `src/server/persistence/store.ts` for one read-only candidate selector,
  `src/server/reentry-delivery-port.ts`, `tests/cp14-reentry-delivery-port.test.ts`, this task record,
  its evidence and cross-functional validation records, and the narrow roadmap/task-index wording that
  distinguishes local-stub work from live external integration.
- Out of scope: `src/client/`, `src/server/entrypoint.ts`, `src/server/world-worker.ts`, the WebMCP page
  adapter, external Re-entry Core files, deployment, credentials, and unrelated dirty files.
- Allowed actions: Edit only the named game-side source/test/docs paths; run focused Node 24 tests,
  typecheck, and the required documentation validators. Do not stage, commit, push, deploy, or contact
  external parties.
- Revalidate when: `ADR-GAME-0009`, `SK-MVP-0.2` section 7, the `agent_signal_slot` or
  `outbox_delivery` schema, the CP-14 handoff fields, or Eddy's delivered external contract changes.

## Owning authority

- Delivery policy: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Contract: [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
- Game-side preparation: [`SK-TASK-014`](SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md)
- Fixtures and vectors: [`CP-14 fixtures`](../Scenarios/14-cp14-reentry-adapter-fixtures.md)
- Cross-boundary route: [`CP-13–CP-18 seam map`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
- External handoff owner: Eddy; the Receiver/Connector contract is not owned by this task or this tree.

## Current evidence and open gate

- Verified predecessor: the durable signal slot, outbox delivery, lease claim, retry,
  acknowledgement, terminal rejection, coalescing, cooldown, and CP-11 `CargoLostToMonster` eligibility
  paths are covered by [`SK-EVID-041`](../Evidence/SK-EVID-041-cp14-signal-policy-conformance-contract-verification.md)
  and [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md).
- Verified predecessor: the canonical page has four WebMCP reads and one supported read-only
  invocation in one local Sol plus medium session under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).
- Open: Agent grant delivery, dynamic recall invocation, Receiver/Connector transport, active-Thread
  scheduling, independent browser contexts, hosted continuity, and judge reproduction.
- Claim limit: this task may produce only game-side local contract/runtime evidence. A local transport
  stub cannot support a live Receiver, Connector, Agent, hosted, or Re-entry claim.

## Affected surfaces

- World authority and ownership checks: The server-bound `world_id`, shelter, and opaque binding remain
  authoritative; `pumpOnce` cannot accept client-selected scope or alter gameplay.
- Identity and revisions: `signal_id`, delivery lease identity, and attempt count remain durable; no
  new identity map or revision is introduced. Page revisions remain outside the transport envelope.
- Cargo, coin, and settlement: No mission, soldier, cargo, coin, or settlement state changes on any
  transport outcome.
- World clock, due-work order, and replay: `world_time` is never advanced; wall time is used only for
  lease claim/settlement and is supplied explicitly by the caller.
- Persistence, snapshot, and outbox: Add one read-only candidate query and wrap the existing atomic
  claim/ack/retry/reject transitions; no schema or snapshot change.
- Page, command, WebMCP, and Re-entry boundary: The envelope carries a bounded notification summary;
  the Agent must later reread the canonical page and issue the existing revision-checked command.
- Explicitly unaffected: client rendering, worker cadence, mission/combat/economy rules, external
  Receiver/Connector behavior, and hosted operations.

## Plan

1. Add a deterministic read-only `nextDeliveryCandidate(worldId, nowWallTimeMs)` store method that
   returns one pending or expired in-flight delivery in stable order.
2. Add `ReentryDeliveryPort` and a typed transport outcome union. `pumpOnce` claims one candidate,
   maps the current slot to a bounded envelope, calls the injected local transport, and settles the
   existing store record with the same signal and lease identity.
3. Keep transport exceptions explicitly retryable and reject malformed outcomes; return typed `idle`,
   `accepted`, `retryable`, `terminally_rejected`, `already_settled`, or `lease_conflict` results.
4. Run the focused port suite, affected CP-14/CP-16 persistence regressions, typecheck, and docs
   validation; record exact evidence and claim limits.

## Test-driven loop

- Red: Add focused tests for empty selection, envelope field preservation, one-candidate limit,
  accepted acknowledgement, retry identity, expired-lease reclaim, terminal rejection, exception to
  retryable mapping, malformed outcome fail-closed behavior, and no gameplay mutation.
- Green: Implement only the candidate selector and port needed to satisfy those tests through the
  existing store transitions.
- Refactor: Simplify transport/result typing or query helpers only after the focused suite is green;
  rerun the port suite and affected persistence/signal suites.
- Exception and limitation: The transport is an injected local stub by design. No real Receiver,
  Connector, Thread, or browser call is manufactured for a Red proof.

## Stop and recovery

- Stop if: implementation requires a second queue, timer, worker, world clock, identity resolver,
  schema version, client authority, private Agent context, or a change to the accepted signal policy.
- Stop if: Eddy's handoff changes the envelope, acknowledgement, idempotency, lease, or binding
  semantics; record the cross-boundary decision before adapting.
- Rollback or forward remediation: Revert only Task062-owned source/tests/records if its boundary is
  falsified; preserve the durable event/outbox records and all predecessor evidence. A transport or
  store failure remains typed and observable; it is never converted into success.

## Verification and closure target

- Minimum verification: the focused port suite and affected `tests/cp14-signal-policy.test.ts` plus
  `tests/cp16-local-causal-slice.test.ts`; typecheck; documentation self-tests and validator.
- Closure target: `runtime_verified` for the named local game-side port and labelled transport stub.
- Higher gates not closed: live Receiver/Connector delivery, Agent wake, dynamic page reread/recall,
  independent browsers, hosted continuity, and judge reproduction.
- Reopen trigger: a duplicate wake/effect, stale lease settlement, scope leak, world-time mutation,
  deferred-cursor loss, malformed outcome treated as success, or any external contract change.

## Record and closure

- Updated truth: this task, the task index, CP-14 roadmap gate wording, current status, seam map, and
  affected evidence/audit records.
- Evidence: a fresh `SK-EVID-*` record must bind the exact source, Node version, fixture, wall-time
  values, signal identity, envelope readback, transport outcome, and claim limit.
- Residual risk and owner: Eddy owns the unversioned Receiver/Connector handoff; Game owner owns the
  local port and must not promote stub evidence to live delivery.
- Reopen trigger: same as above, plus any mismatch between this record and `ADR-GAME-0009` or
  `SK-MVP-0.2` section 7.
