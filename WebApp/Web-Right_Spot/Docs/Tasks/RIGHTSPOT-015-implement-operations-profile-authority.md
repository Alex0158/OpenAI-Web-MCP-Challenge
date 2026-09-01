# RIGHTSPOT-015: Implement the Operations profile authority

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the next RightSpot Operations demonstration increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0012; closed `RIGHTSPOT-013`; closed `RIGHTSPOT-011` relay-only seam

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Implement and independently verify the smallest deterministic, multi-record Operations
  profile authority and reset boundary without changing the accepted relay application.
- Current increment: `RS-WO-015-01` is a bounded Builder checkpoint for Operations domain types,
  deterministic fixture generation, separate SQLite persistence, validation, and profile-local reset.
- Next gate: The Builder candidate must pass an independent Verifier before a projection consumer,
  transport, route, UI, navigation, or WebMCP Work Order is registered.
- Execution posture: `DISPATCHED_BUILDER`; this task is separate from the closed relay MVP, closed Field Desk lane,
  and unresolved Favourite/Information Request proposals.

## Accepted implementation boundary

ADR-RS-0012 establishes two application-owned profiles: the existing `relay` profile and a separate
`operations` profile backed by `var/rightspot-operations.sqlite` by default. This Task implements only
the Operations authority. It must not turn the existing relay `WorkflowState` into a reporting store or
make the client choose a profile.

The first Operations authority is a current-state synthetic dataset, not historical analytics. It
must contain records from which later query results can be derived:

- five listings assigned to `agent-demo`, covering fresh/open, stale/open, unavailable, let-agreed,
  and archived states;
- one listing assigned to another synthetic agent for object-scope negative checks;
- four requests across the visible portfolio, including confirmed upcoming, proposed upcoming, active
  review, and terminal states; and
- at least six slots covering selected upcoming, available, and past cases.

The authority must include explicit `firstPublishedAt` values for age calculations, but must not add
publication-period history, relist lineage, request transition history, occupancy, lease facts,
Favourite records, Information Request records, contact data, or real user identity.

## RS-WO-015-01 — Implement the Operations authority and profile-local reset

**Role:** Builder  
**Pre-dispatch status:** `GATED`  
**Parallelization:** `SERIAL_AUTHORITY_FOUNDATION` — may run beside read-only UI/asset analysis, but any later Operations projection or transport depends on this checkpoint  
**Risk profile:** `Assured` — new persistence authority, deterministic fixture/reset, validation, and isolation require independent verification  
**Supporting worker:** Multi-agent Operations authority Builder `01a05df7-a761-7423-9b85-e2a866f3a216` (`Herschel`)  
**Source baseline:** `8fe597689b4cfe9e118b9d0bd9a19dd83b94079e` on `main`, captured immediately before dispatch; collaborator-owned dirty and untracked paths remain outside this Work Order  
**Dispatch state:** `ASSIGNED` after the supporting worker identity was returned; the main thread has not yet received the Builder handoff.  
**Next gate:** Return `READY_FOR_VERIFICATION` with an exact candidate commit/source identity; do not start a Verifier or any consumer task  
**Ownership:** The Builder owns only the declared new Operations paths. The main thread owns source freeze, canonical writeback, integration, and closure.

### Required read set

- `/Users/alex/.codex/AGENTS.md`, `/Users/alex/OpenAI-WebMCP/AGENTS.md`, and
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`.
- RightSpot `RUNBOOK.md`, `Docs/00-current-status.md`, `Docs/01-product-definition.md`,
  `Docs/02-requirements.md`, `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, and `Docs/06-validation-and-evidence.md`.
- ADR-RS-0001 through ADR-RS-0012, especially ADR-RS-0005, ADR-RS-0006, ADR-RS-0011, and
  ADR-RS-0012.
- `RIGHTSPOT-013`, this Task File, the existing relay `WorkflowState`/workflow store/reset source,
  `src/server/persistence/sqlite.ts`, package scripts, pinned Node/npm guidance, and existing tests.
- The integrated relay-only `src/server/domain/operations-projection.ts` and its tests, to confirm
  that this checkpoint must use new Operations-specific types and must not expand that seam.

### Allowed write set

The Builder may add or modify only these paths:

- `src/server/domain/operations-profile-types.ts`
- `src/server/domain/operations-profile.ts`
- `src/server/persistence/operations-store.ts`
- `tests/domain/operations-profile.test.ts`
- `tests/persistence/operations-store.test.ts`

If one directly necessary focused test path must differ, stop and return `NEEDS_REVIEW` instead of
expanding the write set. Do not modify `src/server/domain/types.ts`, `workflow.ts`,
`workflow-store.ts`, `reset.ts`, `sqlite.ts`, routes, pages, shared contracts, package files, or
existing Operations seam files.

### Required behavior

1. **Separate authority:** Define Operations-specific state/types for listings, requests, slots, and
   profile metadata. Keep relay types and persistence untouched. Use server-owned constants for the
   Operations database path; never accept a client path or profile selector.
2. **Deterministic fixture:** Generate actual records with stable IDs, deterministic values, explicit
   `firstPublishedAt`, `dataAsOf`, seed/version metadata, and the accepted lifecycle/publication
   vocabulary. Counts and later projections must be derivable from records, not stored dashboard
   totals.
3. **Relationship validation:** Validate unique IDs, listing assignment, legal publication/lifecycle
   combinations, valid ISO instants and date ordering, request/listing assignment, selected
   request/slot relationships, and supported request/slot statuses. Invalid or orphaned state must
   fail visibly; do not coerce it into an empty result.
4. **Agent scope:** Preserve the assigned-agent field in the authority so a later projection can
   enforce object scope. Do not include real or tenant-identifying contact data, private notes,
   message content, or unsupported Favourite/Information Request records.
5. **Separate persistence:** Use a separate Operations SQLite file and a singleton snapshot/table
   owned by this profile. Opening an empty file creates the deterministic fixture; opening an existing
   file validates schema, state, and generation. Corrupt/incompatible content raises the existing
   neutral persistence failure boundary or a clearly bounded Operations-specific persistence error.
6. **Profile-local reset:** Expose an explicit Operations reset operation that atomically replaces the
   Operations snapshot and increments only the Operations generation. It must not delete/recreate the
   database file, call relay reset, mutate relay generation, or use an in-memory fallback. Reset
   failure must roll back generation and records.
7. **Clean-room equivalence:** Reopening/resetting an isolated Operations database with the same
   deterministic inputs must reproduce the same fixture and metadata, and must not alter a separate
   relay database. Tests must use temporary explicit database paths and clean up only their own
   test-owned artifacts through the test harness.
8. **No consumer:** Do not expose a route, HTTP DTO, API handler, UI page, navigation entry, chart,
   manual query parser, WebMCP tool, natural-language resolver, or direct browser behavior in this
   checkpoint.

### Verification preparation

Run the pinned Node `24.20.0` / npm `11.19.0` checks available in the environment, including focused
Operations domain/persistence tests, `npm run typecheck`, `npm test`, `npm run build`, and
`git diff --check`. Report the exact runtime binaries, source identity, changed paths, test results,
reset/reopen/isolation evidence, and any skipped browser/HTTP/consumer evidence. A passing local
Builder self-check is not independent verification.

### Forbidden actions and stop conditions

- Do not modify relay source, shared types, existing Operations seam, routes, API contracts, pages,
  UI, package manifests, lockfiles, configuration, assets, generated output, canonical documents,
  database files outside test-owned temporary paths, or Git metadata outside the candidate commit.
- Do not add history/event sourcing, relisting, occupancy/lease/payment data, Favourite,
  Information Request, contact/notification behavior, external authentication, WebMCP, Cloud
  Receiver, WebRTC, Redis, deployment, or new dependencies.
- Do not use the relay singleton snapshot as the Operations authority or copy its one-request state
  into a fake count table.
- Do not let reset delete or recreate a database file, silently swallow invalid state, or alter relay
  generation.
- Stop and return `NEEDS_REVIEW` if a shared file, new dependency, public contract, unresolved
  lifecycle policy, or source boundary is required.

### Builder return gate

Return `READY_FOR_VERIFICATION` with the exact candidate source identity, changed-path list, fixture
record summary, validation rules, persistence/reset/reopen/isolation evidence, runtime commands and
results, known limitations, and explicit claims not made. Stop after handoff.

## Closure gate

Close this Task only after `RS-WO-015-01` is independently verified, the main thread integrates the
candidate, and the post-integration source/tests are reconciled. The next projection/transport/page
consumer must be registered as a separate Work Order or Task after the authority contract is frozen.

## Reopen condition

Reopen if the Operations profile must share relay state, requires history or real tenant/contact data,
changes lifecycle vocabulary, cannot reset/reopen deterministically, or needs the relay seam,
Favourite/Information Request semantics, or WebMCP before this authority is verified.
