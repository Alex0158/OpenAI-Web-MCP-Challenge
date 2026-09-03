# ADR-GAME-0031: CP-12 Human Gatherer Dispatch Command and Reconciliation

**Status:** ACCEPTED AND RUNTIME-VERIFIED FOR THE NAMED LOCAL `SK-TASK-045` SCOPE  
**Date:** 2026-09-02  
**Decision owner:** Game owner under the standing authorized checkpoint delivery cycle  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`Validation/54`](../Validation/54-cp12-human-gatherer-dispatch-preimplementation-challenge.md)

## Context

At decision time, the authoritative GATHERER mission transaction, route, attempt, worker gateway,
and page projection already existed, but the ordinary UI could only observe that chain. CP-16 and
the build gate required a human path that works without WebMCP, while the actual WebMCP adapter
remained unavailable.

Mission dispatch was implemented before the public command-identity rule. Its event used the
idempotency key as causation, so a page adapter could not safely expose that input unchanged. CP-12
movement provided the accepted strict-session and acknowledgement-to-full-resync pattern without
adding a second authority.

## Decision

1. Add a distinct `commandId` to mission assignment, its exact request fingerprint, and
   `MissionDispatched.causationId`; retain `idempotencyKey` as retry identity.
2. Add one non-production strict-session `assign-soldier-mission` HTTP adapter with an exact 2 KiB
   GATHERER-only envelope. Movement and dispatch share one page-wide mutation gate and the same
   server per-player admission instance.
3. The parser accepts only fixed GATHERER/tier-1/`WHEN_FULL` values and AXE/PICKAXE enums. MissionService
   remains responsible for tool-target matching, ownership, sensing, availability, route, active
   attempt, and revision validation. Query parameters are rejected.
4. Replay an existing key first, then validate the server-owned soldier revision before role/target/
   tool policy. A definitive rejection must be durably replayable; rejection-write failure becomes a
   recovery/store failure.
5. Return a whitelisted success with effect/mission/attempt/event identity and
   `committed_entity_revisions` without route or renderable mission projection. These revisions are
   commit minima. A same-attempt frame settles at or above all minima; a later current attempt settles
   an accepted acknowledgement only when the stable mission id matches, mission revision is strictly
   newer than the committed minimum, and soldier revision reaches its minimum. Reuse the existing
   WebSocket projection client as the only UI replacement path.
6. Add an accessible resident-soldier and sensed-node dispatch control with no optimistic mission.
   Unknown transport outcomes read back once and never auto-retry; late callbacks remain scope-bound.
7. Return durable owned-soldier conflicts as exact `409` results with a live soldier revision;
   missing/foreign soldiers become revision-free `403 NOT_OWNER`, and unavailable/foreign targets
   collapse to `TARGET_UNAVAILABLE`. Parser, session, admission, gateway/store, and recovery errors
   remain bounded transport failures. Failure-code durability is mandatory; rejection-write failure
   becomes unknown/recovery rather than a definitive result.
8. Do not add HUNTER UI, recall, scheduler/time advance, travel, WebMCP, Re-entry, production identity,
   two-session, or hosted behavior in this increment.

## Consequences and limits

This path creates the first ordinary-UI initiator for the already-verified dispatch-to-deposit chain
without waiting for Agent capability. It also repairs mission event causation to conform to the
accepted command contract. It adds one local HTTP round trip plus full resync and remains intentionally
discrete and local.

The existing idempotency store still does not globally reserve one command id across a different
idempotency key. Before multiple human/Agent callers share the command, add a ledger or explicitly
decide that reuse rule. Public-load queue/connection admission, command acceptance deadlines, and the
default all-phase scheduler remain separate decisions.

The form joins mission eligibility to the top-level soldier revision by `soldierId`; a completed
mission row's `revision` is not a soldier revision. It uses native labelled selects and fixed cargo
risk copy, never a client-derived route risk or ETA. The current projection lacks a general node-owner
or `dispatchEligible` field, so this decision is bounded to the accepted fixed fixture and leaves
final eligibility to MissionService. A broader migration/sensing UI must reopen that projection
question.

Movement and dispatch cannot overlap through the human page. One synchronous page mutation gate and
one server per-player admission instance cover both routes. Same-scope reconnect preserves the
attempt token; changed scope clears the token, selections, and command status. Reconciliation matches
soldier/mission/attempt identity and all committed minima, while permitting a later legal phase for
the same attempt and the explicit accepted-and-advanced stable-mission settlement above.

## Verification and reopen triggers

The accepted challenge confirms exact result/failure/privacy shapes, movement versus dispatch UI
admission, public overlap rejection versus direct gateway FIFO, snapshot match criteria, resource
availability projection, and same/changed-scope lifecycle behavior. Reopen for any route/client authority, direct
HTTP rendering, optimistic mission, new realtime frame, scheduler/time advance, HUNTER/recall scope,
production identity, global queue policy, command timeout/automatic retry, or shared WebMCP caller.

## Runtime disposition

[`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)
records the focused `31/31`, affected gameplay `42/42`, and CP-12 regression `28/28` results,
Node 24 typecheck/build, one optimized browser Rock dispatch, full-frame reconciliation, SQLite
reload/restart, exact causal/retry identity, forbidden-effect checks, and clean shutdown.
[`Validation/55`](../Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md)
accepts the named local path while retaining the global command ledger, settlement deadline, public
admission, general target projection, scheduler, independent-session, WebMCP, Re-entry, and hosted
boundaries.
