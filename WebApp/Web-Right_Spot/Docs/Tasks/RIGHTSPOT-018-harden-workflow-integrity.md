# RIGHTSPOT-018: Harden relay workflow integrity

**Type:** `defect`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for trustworthy Viewing Request state and future Operations consumers  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** closed `RIGHTSPOT-002` relay MVP; `RIGHTSPOT-011` relay-only Operations seam; read-only findings from `RIGHTSPOT-012`

## Task Control

- Objective: correct two independently reproduced relay-domain integrity defects without redesigning
  the state machine, persistence model, or Operations profile.
- Current increment: `RS-WO-018-01` is the single bounded Builder checkpoint for expiry-aware command
  replay and relational availability-slot validation. It owns the shared workflow source, so the two
  fixes are intentionally serialized inside one candidate rather than assigned to concurrent workers.
- Next gate: independent verification of the exact candidate, then main-thread integration and a
  post-integration regression run.
- Execution posture: `READY_FOR_BUILDER_DISPATCH`.
- This task is independent of the Operations authority candidate, media primitive overlay, and tenant
  timezone task. No worker may modify another task's write set.

## Verified defects

### Expiry can be bypassed by idempotent replay

`executeCommand` currently resolves `processedCommands` before calling `evaluateExpiry`. A repeated
`SEND_SLOT_PROPOSAL` command after its 24-hour proposal window therefore returns an idempotent success
whose result still says `SLOT_PROPOSED`; the held slot remains held and the workflow is not expired.
The main thread reproduced this against the current source with the injected clock:

- before replay: request `SLOT_PROPOSED`, slot `HELD_FOR_PROPOSAL`;
- replay at `2026-09-02T10:00:00.000Z`: `ok: true`, `idempotent: true`;
- after replay: request still `SLOT_PROPOSED`, slot still `HELD_FOR_PROPOSAL`.

The documented contract is expiry on relevant reads/writes, with the slot released and an
`EXPIRE_PROPOSAL` audit entry. A stale replay must not claim the old proposal state as a successful
current result.

### Slot records accept impossible relationships

`validateWorkflowState` currently validates timestamp syntax and status vocabulary but accepts:

- a slot whose `listingId` does not exist;
- an `endsAt` instant earlier than `startsAt`; and
- a `CONFIRMED` slot carrying `heldByRequestId` for a missing/unrelated request.

The main thread reproduced acceptance of a custom slot with `listing-missing`, reversed timestamps,
and `CONFIRMED` plus `heldByRequestId`. This is a domain-boundary defect, not an invitation to turn
the relay projection into an Operations profile.

## RS-WO-018-01 — Repair expiry replay and slot relationships

**Role:** Builder → independent Verifier  
**Status:** `READY_FOR_VERIFICATION`  
**Parallelization:** `SERIAL_RELAY_DOMAIN_INTEGRITY` — owns the shared workflow source; do not run another worker against these paths  
**Risk profile:** `Assured` — domain invariants and time/idempotency semantics affect all relay commands  
**Source baseline:** `e92dc9c1102549e9197ebad114803eea1e96c06f` on `main`; current media candidate files and collaborator-owned documentation remain outside this Work Order  
**Supporting worker:** Multi-agent relay-domain Builder `01a05e22-c046-79c1-ab4e-e0434c722c03` (`Rawls`), closed after handoff  
**Candidate source:** `f6997c3f37493c40ac8e79c9824b5a8379ed3207`, parent `e92dc9c1102549e9197ebad114803eea1e96c06f`  
**Source Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-018-01-builder`  
**Dispatch state:** `HANDOFF_COMPLETE`  
**Next gate:** Independent verification of the frozen candidate; do not integrate or dispatch follow-on work  
**Allowed write set:** `src/server/domain/workflow.ts`, `tests/domain/workflow.test.ts`  
**Ownership:** The Builder owns only the two source/test paths. The main thread owns scope, source
freeze, canonical writeback, integration, and closure.

### Required read set

- Repository/global instructions, RightSpot `RUNBOOK.md`, current status, requirements, domain/data
  model, validation/evidence guidance, and this Task File.
- `Docs/Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md`, ADR-RS-0008, ADR-RS-0011, and the
  current `src/server/domain/types.ts`.
- `src/server/domain/operations-projection.ts`, its tests, `src/server/persistence/workflow-store.ts`,
  application workflow tests, and existing workflow tests to preserve the relay-only boundary and
  projection fixtures.

### Required behavior

1. Evaluate proposal expiry before a processed-command replay can return a stale success. A replay of
   `SEND_SLOT_PROPOSAL` after expiry must return a bounded `EXPIRED` failure, expose the expired state,
   release the held slot, and preserve the expiry audit/version semantics. It must not recreate a
   proposal, hold a different slot, or report `SLOT_PROPOSED` as current.
2. Preserve normal idempotency for the same command while it is still valid, and preserve command-ID
   conflict behavior. Do not redesign the processed-command store or add a scheduler.
3. Validate every slot's listing relationship and strict time ordering. Reject an unknown listing ID
   and any `endsAt <= startsAt` through the existing bounded domain validation failure.
4. Reject impossible ownership/status combinations, at minimum a holder on `AVAILABLE` or
   `CONFIRMED`, and a holder that does not identify the current request. Preserve the existing
   optional holder shape and projection-only fixtures where they represent a deliberately partial
   read-model setup; do not invent a new Operations lifecycle or require unrelated historical data.
5. Preserve all legal Happy Paths: draft, submit, review, prepare, send, confirm, decline, expiry,
   stale-version, role, assignment, fixture-generation, and privacy behavior.

### Tests and verification preparation

Add focused domain tests for post-expiry send replay, unknown listing, reversed/equal slot times, and
status/holder rejection. Keep existing tests unchanged in meaning and run the relevant projection,
application, API, foundation, typecheck, build, and diff checks available in the pinned Node
`24.20.0` / npm `11.19.0` environment. Use injected timestamps and test-owned state only.

### Forbidden actions and stop conditions

- Do not modify `types.ts`, Operations authority/projection source, persistence, routes, API contracts,
  UI, package/config, assets, canonical docs, Git metadata, or generated output.
- Do not add a scheduler, background expiry job, new request state, new error family, cross-listing
  substitution, automatic repair/coercion, or broad idempotency redesign.
- Do not weaken the existing validation boundary to preserve malformed fixtures. If an existing test
  requires a third path or a product-policy decision, stop and return `NEEDS_REVIEW`.
- Do not commit, integrate, dispatch follow-on work, or claim independent verification.

### Builder return gate

Return `READY_FOR_VERIFICATION` with the exact candidate commit/parent, clean status, two-path diff,
behavioral decisions, focused and full test results, runtime identity, and explicit skipped evidence.
Return `NEEDS_REVIEW` for any required scope expansion or unresolved expiry/idempotency policy.

### Builder handoff evidence — 2026-09-01

Builder `Rawls` returned `READY_FOR_VERIFICATION` at candidate
`f6997c3f37493c40ac8e79c9824b5a8379ed3207`, parent
`e92dc9c1102549e9197ebad114803eea1e96c06f`. Its isolated Worktree was clean and changed exactly:

- `src/server/domain/workflow.ts`
- `tests/domain/workflow.test.ts`

The Builder reports expiry-aware replay, listing/time/holder validation, caller-input immutability,
and preservation of normal idempotency, conflict, Happy Path, and partial projection fixtures.
Pinned self-checks passed: focused `35/35`, all direct tests `65/65`, typecheck, production build,
and `git diff --check`. No independent verification or integration claim is made.

## Acceptance criteria

1. A stale `SEND_SLOT_PROPOSAL` replay cannot keep a proposal operationally visible or claim a stale
   successful result after the proposal expiry instant.
2. Invalid slot listing references, non-positive slot durations, and proven status/holder conflicts
   fail visibly without mutating the caller's original state.
3. Legal relay Happy Paths and existing projection/read-model behavior remain green.
4. The candidate contains no Operations consumer, route/API/UI/auth/dependency/deployment change.
5. Independent verification reproduces the exact candidate and all relevant checks without source edits.

## Non-goals

- No Operations authority, dashboard, query parser, WebMCP, Cloud Receiver, external authentication,
  WebRTC, Redis, calendar, notifications, or deployment work.
- No historical expiry scheduler or general event-sourcing model.
- No new listing/slot management UI or commercial marketplace expansion.

## Closure gate

Close only after independent verification, main-thread integration, and post-integration domain/API/
projection regression evidence. Preserve any unrelated working-tree ownership and baseline failures
as separate evidence.

## Reopen condition

Reopen if expiry semantics need a scheduler, multiple concurrent requests, a changed slot lifecycle,
or persistence/schema changes. Those require a new decision rather than expanding this repair.
