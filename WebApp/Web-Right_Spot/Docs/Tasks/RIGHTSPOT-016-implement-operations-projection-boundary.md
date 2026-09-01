# RIGHTSPOT-016: Implement the governed Operations projection

**Type:** `implementation`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the first manual Operations read surface  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0012; independently verified and integrated `RIGHTSPOT-015`; closed relay-only `RIGHTSPOT-011`

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Project the verified Operations authority into a deterministic, privacy-safe contract
  for the first manual read surface without adding HTTP, routes, UI, navigation, WebMCP, or relay
  behavior.
- Current increment: `RS-WO-016-01` passed fresh independent verification after its bounded repair and
  is integrated in Main product commit `edd7575`. The original failed T2 remains preserved as process
  evidence and was not integrated.
- Next gate: None for this bounded projection task. Any future application/transport consumer must be
  registered separately and consume this projection rather than reimplementing its query logic.
- Execution posture: `INTEGRATED` — the projection and focused tests are committed; no transport, route,
  UI, navigation, or WebMCP source is authorized by this task.

## Accepted projection boundary

ADR-RS-0012 accepts two first-release query families over the separate Operations profile:

1. upcoming viewings, filtered by explicit London-calendar date range and optionally status, area, or
   listing; and
2. listing pipeline, filtered by area, publication state, lifecycle state, or minimum published age.

The projection is a pure read model over `OperationsProfileState`. It must not open SQLite, resolve
cookies, call HTTP, mutate input, read the browser clock, or reproduce query logic in a future UI. It
must not use the relay `src/server/domain/operations-projection.ts` as its authority; the relay seam
remains a separate closed boundary.

## RS-WO-016-01 — Implement the governed Operations projection

**Formal checkpoint:** Persistent Builder → independent Verifier  
**Status:** `INTEGRATED` — repaired candidate passed fresh independent verification and is integrated at Main product commit `edd7575`  
**Parallelization:** `SERIAL_AFTER_AUTHORITY` — the authority is now verified/integrated; only the new projection write set is active  
**Risk profile:** `Standard` — pure projection and query validation, with privacy and time-boundary checks  
**Execution channel:** Persistent re-gate task/thread `01a05eca-df76-7161-945f-5116aaf588a3` (`local`) completed the original formal Builder handoff; independent Verifier task/thread `01a05ed6-3dd9-7523-ac1e-e3f360447db5` (`local`) returned `NEEDS_REPAIR`; Repairer task/thread `01a05edd-fa3b-79c1-95ce-aa724e012a5e` (`local`) completed the bounded repair handoff; fresh independent Verifier task/thread `01a05ee3-6e67-7920-ae03-8cb1c8513d69` (`local`) returned `VERIFIED`; Main integrated the repaired source at product commit `edd7575`; the original transient execution record `01a05e33-ff83-7a41-92f7-b820c47edeef` remains provenance-invalid evidence  
**Source baseline:** `5ae6573` on `main`, the reviewed current Main baseline for this re-gate; collaborator-owned dirty and untracked paths remain outside this Work Order  
**Candidate source:** Repaired exact two-path overlay in isolated Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-repair`, frozen as T2 and independently verified before Main integration; the original failed T2 in `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-regate` remains read-only evidence  
**Dispatch state:** `INTEGRATED` after fresh independent verification and exact two-path Main commit `edd7575`; the original candidate dispatch remains `FORMAL_HANDOFF_NOT_ESTABLISHED`  
**Next gate:** None for `RS-WO-016-01`; a future transport/consumer Work Order must be separately registered and must not alter this projection boundary  
**Ownership:** The Builder owns only the new projection module and focused tests. The main thread owns source freeze, canonical writeback, integration, and closure.

### Preserved candidate evidence — 2026-09-01

Transient execution record `James` reported `READY_FOR_VERIFICATION`, but this is not a valid formal
Builder handoff because the work ran without a persistent supporting task/thread and isolated Worktree.
The candidate remains an uncommitted overlay in the main checkout after that execution-channel defect.
This is process evidence recorded for the orchestration pilot; the main thread has not edited or staged
these paths. The exact candidate paths and hashes are:

| Candidate path | SHA-256 |
|---|---|
| `src/server/domain/operations-profile-projection.ts` | `081a5b03886a295ca950ac2a57687d4a2760934cb9d1ae9c0894f3340c2c4a19` |
| `tests/domain/operations-profile-projection.test.ts` | `7725efb63d2321c4072f013a785dbf25bb0ec3858c025798337310b28ec124d9` |

The candidate reports focused projection tests `6/6`, all direct tests `93/93`, foundation `6/6`,
typecheck, build, and diff check under pinned Node `24.20.0` / npm `11.19.0`. Those are Builder checks
only. An independent verifier must re-check hashes before and after testing and must not repair, commit,
integrate, or modify the overlay.

### Formal re-gate preparation — 2026-09-01

The main thread established a fresh isolated re-gate Worktree from reviewed Main commit `5ae6573` at
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-regate` and reproduced only the two preserved
candidate paths there. The candidate bytes match the hashes above. At the time of this preparation the
candidate lifecycle was still `GATED`; the later persistent assignment is recorded below. The candidate
remains unverified until it is accepted as a new frozen T2 source and an independent Verifier is dispatched
against that frozen source. No Main checkout candidate path was edited, staged, committed, or verified
during preparation.

### Formal persistent re-gate assignment — 2026-09-01

Persistent supporting task/thread `01a05eca-df76-7161-945f-5116aaf588a3` on host `local` was created
after the activation prompt was validated and returned a usable identity. It completed the formal
re-gate with `READY_FOR_VERIFICATION`. The task did not edit the Main checkout, modify the candidate,
update canonical documents, stage, commit, push, repair, or dispatch another worker. Its report is
Builder handoff evidence only; the Work Order remains unverified until the frozen T2 source passes a
separate independent Verifier.

### Frozen T2 source identity — 2026-09-01

The main thread reviewed the completed re-gate report and froze the exact isolated source for the next
checkpoint:

- Execution root: `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-regate`
- Package root: `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-regate/WebApp/Web-Right_Spot`
- Detached baseline: `5ae6573dce748e01c7a91e33b23dd05dfdeea896`
- Candidate paths: exactly the two declared paths below; no tracked or staged diff
- `src/server/domain/operations-profile-projection.ts` SHA-256:
  `081a5b03886a295ca950ac2a57687d4a2760934cb9d1ae9c0894f3340c2c4a19`
- `tests/domain/operations-profile-projection.test.ts` SHA-256:
  `7725efb63d2321c4072f013a785dbf25bb0ec3858c025798337310b28ec124d9`

The source is now frozen for independent verification. The verifier must re-check this identity before
and after testing and must not test a moving Main checkout, modify the candidate, repair, integrate,
update canonical documents, stage, commit, or push.

### Independent verification result — 2026-09-01

Independent Verifier task/thread `01a05ed6-3dd9-7523-ac1e-e3f360447db5` returned `NEEDS_REPAIR` for the
frozen T2 source. The source identity and exact two-path scope remained unchanged; no source or Main
checkout was modified. The reproducible findings are:

1. **P1 privacy:** validation errors rethrow detailed authority messages and can disclose an out-of-scope
   listing ID, for example `ops-listing-other-agent`, when that portfolio contains an invalid field.
2. **P2 time semantics:** `publishedAgeDays` and `stale` use fixed 24-hour durations rather than the
   accepted `Europe/London` calendar-day threshold. The March spring-DST and October autumn-DST
   90-day cases produce opposite boundary errors.
3. **P2 empty authority:** a complete valid empty Operations state returns `FORBIDDEN` for the known
   `agent-demo` actor instead of the required successful empty projection.

The Verifier passed the candidate tests, foundation tests, Operations authority tests, typecheck, build,
identity, and whitespace checks. Its independent boundary assertions passed 16/20 groups; the four
failures are the three findings above plus the related stale/age boundary assertion. Browser, HTTP,
transport, deployment, auth-provider, WebMCP, Cloud Receiver, and external-service checks were skipped
as outside this Work Order. This is a confirmed product-contract failure, not a tooling blocker.

### Repair scope preparation — 2026-09-01

The original frozen T2 Worktree remains read-only. A fresh repair Worktree will be created from the same
detached baseline and exact candidate hashes. The Repairer may modify only
`src/server/domain/operations-profile-projection.ts` and
`tests/domain/operations-profile-projection.test.ts`; it must add focused regression coverage for all
three findings without changing the Operations authority schema, shared contracts, transport, routes,
UI, dependencies, or canonical documents. After handoff, Main must freeze the repaired identity and send
it to a separate independent Verifier.

### Bounded repair assignment — 2026-09-01

Persistent Repairer task/thread `01a05edd-fa3b-79c1-95ce-aa724e012a5e` on host `local` was dispatched
against fresh isolated Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-repair`. Its write
set is limited to the projection module and its focused test file. The original frozen T2 Worktree,
Main checkout, authority files, shared contracts, and canonical documents are read-only. The Repairer
must stop at `NEEDS_REVIEW` if the fix requires an authority/schema or third-path change, and must return
`READY_FOR_VERIFICATION`, `NEEDS_REVIEW`, or `BLOCKED` without committing or integrating.

### Repair handoff and frozen T2 — 2026-09-01

Repairer task/thread `01a05edd-fa3b-79c1-95ce-aa724e012a5e` returned `READY_FOR_VERIFICATION`. The
repaired source is frozen in `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-016-01-repair` at detached
baseline `5ae6573dce748e01c7a91e33b23dd05dfdeea896`. Only the two authorized paths changed from the
failed T2 candidate; the repair Worktree has no staged changes or additional authored/untracked source:

| Candidate path | Before SHA-256 | Repaired SHA-256 |
|---|---|---|
| `src/server/domain/operations-profile-projection.ts` | `081a5b03886a295ca950ac2a57687d4a2760934cb9d1ae9c0894f3340c2c4a19` | `a6459e34cb07b53007484142d40bc67064e859de2921ad1872e88009c123c1aa` |
| `tests/domain/operations-profile-projection.test.ts` | `7725efb63d2321c4072f013a785dbf25bb0ec3858c025798337310b28ec124d9` | `3de173e1a9a4f4ba0cc1ba4c582194f57e07d41977894ebd727ddd6f3d8b7b48` |

The Repairer added regression coverage and reported projection tests `13/13`, authority/store tests
`12/12`, foundation `6/6`, full direct tests `100/100`, typecheck, build, whitespace, and CJK checks
passed. It also reran the projection tests under `TZ=America/Los_Angeles`. The repaired source remains
unverified until a fresh independent Verifier passes; no integration or closure claim is made.

### Fresh independent verification assignment — 2026-09-01

Persistent fresh independent Verifier task/thread `01a05ee3-6e67-7920-ae03-8cb1c8513d69` on host `local`
was dispatched against the repaired frozen T2 Worktree above. It must re-check the repaired hashes and
exact two-path scope, reproduce all three regression cases, and remain read-only. It must not test moving
Main, modify source, repair, integrate, update canonical documents, stage, commit, or push.

### Independent verification assignment — 2026-09-01

Persistent independent Verifier task/thread `01a05ed6-3dd9-7523-ac1e-e3f360447db5` on host `local` was
created against the frozen T2 Worktree above. It is read-only and must return `VERIFIED`,
`NEEDS_REPAIR`, or `BLOCKED`. It does not authorize integration, document writeback, staging, commit,
push, or closure. The Main thread will review its report and re-check the frozen identity before any
integration decision.

### Re-gate dependency preflight — 2026-09-01

The first persistent re-gate preflight returned `BLOCKED` because the isolated package had no
`node_modules`. No candidate defect, source drift, or scope violation was established; both candidate
hashes and the detached `5ae6573` baseline remained unchanged, and no files were edited or staged. The
main thread authorized one locked `npm ci --ignore-scripts --no-audit --no-fund` from the isolated
application root using the pinned Node/npm toolchain. The continuation uses the same task identity and
Worktree, and remains a Builder re-gate only; it must not modify source, package files, the Git index,
canonical documents, or the Main checkout.

### Required read set

- `/Users/alex/.codex/AGENTS.md`, `/Users/alex/OpenAI-WebMCP/AGENTS.md`, and
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`.
- RightSpot `RUNBOOK.md`, all canonical product/domain/API/validation documents, and ADR-RS-0001
  through ADR-RS-0012.
- `RIGHTSPOT-015`, the integrated Operations profile types/authority/store after its verification,
  and the closed relay-only `RIGHTSPOT-011` module for contrast.
- The current session/actor vocabulary and relevant existing tests, without modifying their source.

### Allowed write set

- `src/server/domain/operations-profile-projection.ts`
- `tests/domain/operations-profile-projection.test.ts`

Do not modify Operations authority/types/store, relay domain/types/workflow/store, shared contracts,
application services, routes, pages, UI, navigation, package metadata, configuration, fixtures,
assets, generated output, or canonical documents. If the actual authority requires a shared-file edit,
stop and return `NEEDS_REVIEW`.

### Required behavior

1. **Authorization:** accept an explicit agent actor and reject non-agent or unassigned-agent reads
   using the bounded domain error vocabulary. Scope all listing, request, and slot rows to the
   actor's assigned portfolio; natural-language input is not part of this pure module.
2. **Upcoming viewings:** derive `PROPOSED` only from a valid `SLOT_PROPOSED` request plus its valid
   selected slot, and `CONFIRMED` only from `VIEWING_CONFIRMED` plus its valid selected slot. Never
   treat preferred tenant times, drafts, expired/declined requests, or orphaned relationships as an
   appointment. Use `[from, to)` London-local calendar boundaries and deterministic ordering.
3. **Listing pipeline:** derive rows and counts from actual Operations listing records. Preserve
   publication/lifecycle vocabulary, use explicit `firstPublishedAt`, calculate stale age without
   database creation time, and return authority-unavailable failure when required fields are invalid
   or missing. Do not infer tenant interest or occupancy.
4. **Bounded result:** allow only the explicit structured filters from ADR-RS-0012, enforce a maximum
   of 25 returned rows, expose exact `totalCount` and `returnedCount`, and make truncation explicit.
   Do not add cursors, arbitrary query language, SQL, charts, or natural-language parsing in this
   checkpoint.
5. **Envelope:** return profile identity, fixture generation, `Europe/London`, evaluated `asOf`,
   fixture `dataAsOf`, `CURRENT` freshness for same-source reads, interpreted filters, exact counts,
   and bounded items. Keep output free of tenant identity/contact data, private notes, command
   metadata, persistence details, and assigned-agent IDs.
6. **Purity:** prove input non-mutation, deterministic ordering, explicit empty results for valid
   complete authority, and visible failure for invalid authority. Unsupported Favourite and
   Information Request signals must be absent or explicitly unavailable, never zero-filled.

### Verification preparation and return gate

Use the pinned Node `24.20.0` / npm `11.19.0` runtime where available. Run focused projection tests,
`npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`. Return
`READY_FOR_VERIFICATION` with exact source identity, changed paths, authorization/privacy/time/filter
evidence, empty/truncated/invalid-authority cases, runtime results, skipped consumer evidence, and
claim limits. Only a persistent Builder may make this formal return. Stop after handoff; independent
verification and all transport/UI/WebMCP work are separate gates.

## Forbidden scope and stop conditions

- No SQLite, persistence mutation, reset, HTTP, API DTO, route, page, navigation, WebMCP, Cloud
  Receiver, external service, authentication change, notification, contact, Favourite, Information
  Request, lease, occupancy, history, analytics warehouse, or new dependency.
- No modification of the existing relay Operations seam or relay workflow types.
- No hidden fallback, browser-clock query semantics, silent truncation, unbounded filters, tenant
  enumeration, cross-agent leakage, or fabricated metrics.
- Stop if `RIGHTSPOT-015` is not independently verified/integrated, if the authority contract is
  incomplete, or if a shared path is required.

## Closure gate

Close this task only after `RS-WO-016-01` is independently verified and integrated against the exact
Operations authority snapshot. A later application/transport task must consume this projection rather
than reimplementing its filters or counts.

## Reopen condition

Reopen if the Operations authority changes its lifecycle/time model, a query requires historical
events or 008/009 signals, privacy scope changes, pagination/cursors become necessary, or a consumer
cannot use the projection without changing relay or authority ownership.
