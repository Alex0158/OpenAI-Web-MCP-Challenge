# RIGHTSPOT-047 — Implement Agent Operations WebMCP listing-pipeline capability

**Type:** `implementation`  
**Lifecycle:** `verification_pending`  
**Priority:** `P1` for the next selective WebMCP milestone; it does not block the ordinary local MVP,
the verified Tenant Search capability, or the manual Operations surface  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** accepted [ADR-RS-0017](../Decisions/ADR-RS-0017-agent-operations-webmcp-listing-pipeline-contract.md),
closed [`RIGHTSPOT-044`](RIGHTSPOT-044-implement-agent-operations-manual-read-surface.md),
closed [`RIGHTSPOT-045`](RIGHTSPOT-045-prevent-stale-operations-read-results.md), the existing
Operations authority/projection, and the verified Tenant adapter pattern in `RIGHTSPOT-043`

## Task Control

- Type: `implementation`
- Lifecycle: `verification_pending`
- Execution posture: `MAIN_THREAD_SINGLE_SOURCE_WEBMCP_IMPLEMENTATION`
- Priority: `P1` — implement only the accepted Agent Operations `read_listing_pipeline` capability.
- Owner: Main RightSpot thread
- Current increment: The bounded `F-26` Agent registration-observability repair was completed by
  Builder Jason and integrated into the canonical Main source at product commit `ac67285`. The
  overlapping session-lifecycle source repair remains integrated at `218935c`; Main accepted its
  deterministic/browser split as `DETERMINISTIC_ACCEPTED / BROWSER_LIMITATION_RETAINED` while keeping
  the independent browser gate open. The original five-path source snapshot and all earlier verifier
  attempts remain historical evidence only. The accepted Agent tool contract is unchanged.
- Next gate: freeze the post-repair `ac67285` source identity and dispatch only the read-only
  `RS-WO-047-02` independent verification against that exact candidate. Do not run an old verifier
  target, mutate the fixture, or infer closure from deterministic checks or partial browser evidence.
  Main owns the final integration and documentation closure decision after independent evidence is
  complete.
- Dependencies: ADR-RS-0017 remains the tool contract authority. `RIGHTSPOT-048` owns the already
  integrated shared lifecycle source boundary; its browser evidence remains a limitation, not a reason
  to block the disjoint Agent registration-observability repair. The existing manual `/agent/operations`
  page, `GET /api/agent/operations`, Operations projection, Agent role/assignment checks, and Tenant
  `search_listings` adapter remain read-only inputs.
  `RIGHTSPOT-012` may continue as a non-blocking, read-only audit provided it does not modify either
  repair's source write set during a freeze.
- Dispatch state: `READY_FOR_INDEPENDENT_VERIFICATION` — `RS-WO-047-03` completed its exact four-path
  repair under supporting agent `01a06769-085c-7c51-899b-3f41425cd58e` using `gpt-5.6-sol + medium`.
  Main reviewed the handoff, integrated it at `ac67285`, and reproduced the deterministic gates. The
  only next dispatch is the read-only `RS-WO-047-02` verifier against the frozen post-repair source.
  No fixture mutation or Worktree is authorized.
- Evidence status: `DETERMINISTIC_REPAIR_INTEGRATED_INDEPENDENT_BROWSER_PENDING` — the contract,
  repair behavior, focused/full deterministic suite, typecheck, build, repository/static checks,
  sensitive scan, and exact diff checks passed. The independent browser lifecycle, final
  console/page-error, and final persistent-state readback remain open for this post-repair candidate.

## Bounded objective

Implement exactly one page-bound WebMCP tool:

> On the server-resolved Agent `/agent/operations` page, `read_listing_pipeline` accepts the four
> structured fields frozen in ADR-RS-0017, reads through the existing Operations authority, returns an
> exact Agent-safe listing-pipeline result, and leaves the ordinary page showing that same result.

This Task is the source-bearing follow-up to `RIGHTSPOT-046`. It does not redesign Operations, add a
new report, or convert the application into a generic agent interface.

## Required contract

The implementation must follow ADR-RS-0017 exactly:

- tool name `read_listing_pipeline`, title `Read listing pipeline`, and the accepted bounded
  description;
- `readOnlyHint: true` and `untrustedContentHint: true`;
- object input with no required properties and `additionalProperties: false`;
- optional `area`, `publicationState`, `lifecycleState`, and `minPublishedAgeDays` only;
- exact, case-sensitive Operations Area equality with 1–80 characters and no surrounding whitespace;
- existing enum vocabulary and inclusive non-negative safe age threshold `0..9007199254740991`;
- omitted fields meaning no filter and all supplied fields using AND semantics;
- no natural-language parsing, aliases, fuzzy matching, prefix matching, silent filter removal,
  caller-selected query family, limit, pagination, sort, listing ID, or date range;
- existing `listingPipeline` Operations authority/projection and result cap/order/freshness;
- exact runtime allowlisting and reconstruction of envelope, filters, counts, and listing rows;
- one page-owned executor/coordinator shared by manual and tool reads;
- valid empty success, bounded validation/service/authority/malformed/stale outcomes, and no raw
  exception or server diagnostic text; and
- Agent page/session lifecycle cleanup with a complete manual fallback when WebMCP is unavailable; and
- registration failure must be deactivated and surfaced through a bounded page-owned signal rather
  than silently discarded, while the manual Operations page remains usable.

Duplicate JSON object keys are not a tool-input acceptance claim because parsed JavaScript objects do
not preserve them. Existing HTTP duplicate-parameter validation remains outside this adapter's input
test. Every tool invocation must still recheck server session, role, and assignment through the normal
HTTP/application boundary; an unassigned Agent receives bounded `FORBIDDEN` and no projection.

## Implementation boundary

### Required read set

- repository `AGENTS.md` and the applicable tracked contributor/runbook authority;
- RightSpot `Docs/README.md` if present, `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/07-business-flows-and-scenarios.md`, `Docs/Development/README.md`,
  `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`, and
  `Docs/Development/RIGHTSPOT-WEBMCP-ROADMAP.md`;
- `RIGHTSPOT-046`, ADR-RS-0017, `RIGHTSPOT-044`, `RIGHTSPOT-045`, ADR-RS-0012, and ADR-RS-0016;
- `src/server/application/operations-insights-http.ts` and `src/server/application/operations-insights.ts`;
- `src/server/domain/operations-profile-projection.ts`, `src/server/domain/operations-profile-types.ts`,
  and the Operations persistence boundary as read-only authority;
- `src/shared/contracts/operations-api.ts`;
- `src/ui/agent/operations/operations-api.ts` and `src/ui/agent/operations/operations-page.tsx`;
- `src/ui/tenant/tenant-webmcp.ts` and its focused tests as the existing lifecycle reference;
- current Operations API/page tests and the package scripts; and
- the actual supported browser/feature-flag capability at baseline recapture.

### Allowed write set

The Builder may modify only these exact paths:

- `src/ui/agent/operations/operations-webmcp.ts` — new page-bound adapter and logical tool contract;
- `src/ui/agent/operations/operations-api.ts` — strict shared response validation/reconstruction and
  bounded client error mapping, only as required by ADR-RS-0017;
- `src/ui/agent/operations/operations-page.tsx` — one shared page-owned executor/coordinator and
  lifecycle wiring, without changing ordinary report authority or visual scope;
- `tests/ui/operations-webmcp.test.ts` — new unit/contract/lifecycle tests; and
- `tests/ui/operations-page.test.ts` — focused coordinator/page regression tests only.

The Builder must not touch any other path. If the accepted contract cannot be implemented within this
write set, stop and return to Main for a new bounded decision; do not widen the set opportunistically.

### Forbidden set

- all `src/server/**`, `src/shared/contracts/**`, `src/server/persistence/**`, `app/**`, `public/**`,
  database, fixture, reset, or generated files;
- package manifests, lockfiles, environment/credential files, or external dependencies;
- Tenant Search adapter/source/tests, ordinary Agent Operations domain/projection/API semantics, relay
  workflow, Favourite/Viewing Request/Information Request behavior, or shared shell/navigation;
- direct SQLite access, a second query/predicate/count engine, a second reporting DTO, natural-language
  parsing, generic chat, hidden fallback, arbitrary retry, cross-origin bridge, or client role/identity;
- mutation, notification, contact, confirmation, Cloud Receiver, Re-entry, WebRTC, Redis, external
  authentication, deployment, production hardening, or universal browser support;
- any Git commit, push, merge, Worktree creation, deletion, or canonical documentation write by the
  Builder; and
- any change outside the exact source/test write set to make a verification harness pass.

### Generated/evidence set

Disposable browser/API output may remain only under the existing RightSpot generated boundary such as
`.playwright-cli/`; it is not source, must not be staged, and must not be used as a substitute for
canonical evidence. Browser screenshots or logs are evidence only after the supported-browser,
fixture, and source identity are recorded.

## Red → Green → Refactor plan

The Builder must first add failing tests, then the smallest implementation, then refactor without
changing the accepted contract.

### Red contract and privacy cases

- exact static tool name/title/description/annotations/schema and one registration only;
- unknown fields, `null`, empty values, empty/whitespace/oversized Area, wrong-case or surrounding-
  whitespace Area according to the frozen exact semantics, unsupported enums, negative/decimal/
  unsafe/non-finite age, and malformed structured input;
- unknown top-level/filter/count/item response keys, including injected `tenantId`, contact, notes,
  `databasePath`, diagnostics, or arbitrary listing fields;
- signed-out, Tenant, wrong-role, and unassigned-Agent outcomes;
- registration unavailable, synchronous/asynchronous registration failure, rerender duplication,
  route departure, unmount, session/role change, and capability teardown; and
- valid empty, authority failure, persistence/service failure, malformed response, stale/aborted, and
  retry outcomes without raw text or stale success.

### Green behavior

- valid structured input reaches only the existing Agent Operations listing-pipeline HTTP/application
  path and returns an exact allowlisted response;
- manual and tool execution share one page-owned coordinator and the page reflects the accepted
  filters, loading state, counts, freshness, rows, or truthful empty state;
- a current successful invocation returns exactly what the page adopts, including empty success;
- an invalid tool call does not replace the last accepted page result;
- overlapping manual/tool reads preserve the newest logical read across late success, error, `finally`,
  clear, abort, unmount, route, and session settlement; stale callers receive `STALE_RESULT`; and
- unsupported WebMCP leaves the ordinary manual page complete and usable.

### Refactor guard

The final diff must retain one authority, one result allowlist, one page read identity, bounded inputs,
bounded errors, and no state mutation. Tests must prove no Favourite, Viewing Request, Information
Request, notification, persistence, relay, or fixture change occurs.

## Acceptance criteria

Close this Task only after all of the following are true:

1. The exact contract in ADR-RS-0017 is represented in source and focused tests without source or
   schema drift.
2. The adapter is registered only on the server-resolved Agent `/agent/operations` page/session and
   never on root, Tenant, wrong-role, signed-out, or unrelated routes.
3. Every invocation uses the existing server role/assignment authority and existing listing-pipeline
   projection; no direct database or duplicate business logic exists.
4. Runtime output is exact allowlisted Agent-safe data; injected extra fields fail closed or cannot
   cross the tool boundary.
5. Manual and tool reads have one latest-read identity, exact page parity, truthful empty/error/stale
   states, and no false success or hidden fallback.
6. WebMCP registration failure is deactivated and surfaced through a bounded page-owned signal, while
   unsupported capability leaves the full manual Operations page usable.
7. Focused Red → Green → Refactor tests pass, then the complete RightSpot suite, non-incremental
   typecheck, production build, repository validators, sensitive scan, and `git diff --check` pass.
8. Independent `RS-WO-047-02` verifies the frozen source in the declared supported browser: discovery,
   exact metadata/schema, valid/invalid invocation, page parity, privacy, role/assignment, teardown,
   no mutation, responsive/accessibility behavior, and clean console/page-error evidence.
9. Main reviews exact paths/source identity, integrates only the accepted candidate, updates this Task,
   current status, evidence ledger, business-flow/WebMCP roadmap as needed, commits, pushes, and
   confirms one canonical Main Worktree.

## Work Orders

### RS-WO-047-01 — Implement the page-bound Agent Operations WebMCP adapter

**Status:** `READY_FOR_INDEPENDENT_VERIFICATION`  
**Role:** WebMCP/API/UI implementation Builder  
**Parallelization:** `SERIAL_SINGLE_WRITER` — no other source writer may touch the five-path write set  
**Model gate:** WebMCP implementation must use a capable supporting worker with `gpt-5.6-sol` and
`medium` reasoning when dispatched; if the capability is unavailable, report the blocker and do not
substitute an unsupported model for WebMCP runtime work  
**Supporting agent:** `01a065ce-ba53-7b71-bb97-7de24e92a60f`  
**Source baseline:** T0 recaptured immediately before Builder dispatch: Main and `origin/main` at
`075a868086e962112b550583cb1705478bbdf16b`, divergence `0`; reviewed product source remains the
`3582ba4` checkpoint. The reviewed candidate is frozen at Main commit
`09d0628e10b9ddb9a59c59eebd1be1ee074a5318` (source-only delta from `075a8686`; no source/test files
changed after the candidate commit). Node `24.20.0`, localhost health `200`, `agent-browser 0.25.3`,
Chrome `152.0.7977.65`, and the `WebMCPTesting` flag were available.  
**Write set:** exactly the five paths listed above  
**Frozen candidate hashes:** `operations-webmcp.ts`
`8f84e89df2d27680873c49ee8ceba9c388e3b23d3b68fd18bbf2639493f6dfc5`; `operations-api.ts`
`9c22386309e2cb4fe43510a060aba264bcc57e05aae8ef2f8773e9b6ff4f06a3`; `operations-page.tsx`
`8b7fd1df584e9789187052db96e09c635008739993b4baff95ea9c845b152a3e`; `operations-webmcp.test.ts`
`8d4a5a22e967a481ec3d46026f3c588093173795977301f7c3fb2949019643bf`; `operations-page.test.ts`
`4701c237272b370e3790bf39d84fc0d78028eb03fd2371542346688655b0482a`.  
**Handoff:** Builder returned exactly the five paths, Red/Green/Refactor evidence, focused `23/23`,
full `201/201`, typecheck/build/validator/sensitive-scan/diff-check results, and no unresolved
implementation blocker. Main independently reproduced those checks. The candidate must now be frozen
by Main; Builder did not commit, push, alter canonical docs, or create a Worktree.

### RS-WO-047-02 — Independently verify the integrated capability

**Status:** `READY_FOR_DISPATCH`  
**Role:** Independent WebMCP/browser Verifier  
**Parallelization:** `AFTER_BUILDER_SOURCE_FREEZE` — Builder source and Main Git ref are frozen during
the check; no Main docs/status writeback or other worker may move the verified source  
**Source:** The current frozen post-repair candidate is product source commit `ac67285`, preserved
unchanged in repository merge snapshot `b2e5f93c538bbf75196d4a128950e15b28e73e52`; the original
candidate commit `09d0628e10b9ddb9a59c59eebd1be1ee074a5318` is historical evidence only. The exact
post-repair path hashes are recorded under `RS-WO-047-03`. Main must not modify the four source/test
paths, the fixture, or this Work Order's evidence baseline during verification.  
**Scope:** Verify the integrated candidate against the exact frozen source and fixture without editing
source/tests/docs or mutating the durable fixture; use `gpt-5.6-sol` with `medium` reasoning for
WebMCP-specific evaluation  
**Required evidence:** supported-browser runtime discovery/invocation, exact schema/metadata, valid
and invalid argument boundaries, page parity, allowlisted output/privacy, session/role/assignment
lifecycle, unsupported fallback, stale/abort/teardown behavior, no mutation, responsive/accessibility
behavior, console/page errors, focused/full/static checks, and exact source identity  
**Stop condition:** Any source drift, ownership conflict, unsupported browser/API assumption, privacy
leak, page/tool disagreement, false success, hidden fallback, or fixture mutation stops verification
and returns a bounded report to Main.

#### Verification attempts recorded by Main

- Attempt 1 (`01a065eb-d249-74d0-b4d7-61e60e44608d`, `2026-09-03`): `BLOCKED_HARNESS` before page
  navigation because the worker invoked unavailable shell command `timeout`. Source identity and the
  frozen five-path hashes matched; no product or persistent-state mutation was observed. This is not
  product verification.
- Attempt 2, same Verifier context after a corrected direct browser command: `INCOMPLETE_EVIDENCE`.
  The worker independently observed root/session setup, exact tool discovery/schema, valid Southwark
  parity, case-sensitive empty result, malformed-input preservation, GET-only invocation, mobile
  labelled controls/no-overflow, and bounded manual failure. It was stopped before tenant/wrong-role
  lifecycle, sign-out/route teardown, final console/page-error collection, final mobile non-empty
  capture, and final SQLite/source/Git readback. No source/docs/fixture/Git/Worktree mutation was
  observed or commanded, but the missing post-state readback prevents a complete independent claim.
- Main separately reproduced the missing role/session teardown and completed the supported-browser
  smoke matrix in isolated session `rs-goal-diag-20260903`: Agent discovery/invocation, valid and
  invalid page parity, signed-out and Tenant zero-tool boundaries, sign-out route recovery, GET-only
  network traffic, mobile accessibility snapshot, and no page errors beyond normal React DevTools/HMR
  informational logs. Main evidence supplements but does not replace the independent gate.
- Attempt 3, a narrower follow-up Verifier (`01a065f6-f14c-7131-9c17-a472503bf5d8`, `2026-09-03`),
  completed source preflight and the Tenant/wrong-role zero-tool check, then was stopped at the
  bounded limit before Agent registration, teardown, mobile, error, and final-state readback. It
  reported no product mutation or source change, but its incomplete final readback is not independent
  no-mutation proof.

### RS-WO-047-03 — Surface Agent Operations registration failure without a silent no-op

**Status:** `READY_FOR_INDEPENDENT_VERIFICATION`  
**Role:** Completed WebMCP/API/UI repair Builder handoff; independent verification is the next gate  
**Parallelization:** `SERIAL_AGENT_WEBMCP_ADAPTER` — the Agent adapter, Operations page wiring, and
focused tests share the existing 047 source ownership; no parallel writer is admitted  
**Model gate:** When dispatched, WebMCP-specific implementation must use `gpt-5.6-sol` with `medium`
reasoning. If the capability is unavailable, keep this Work Order gated and do not substitute another
model.  
**Historical T0 product source baseline (2026-09-03):** Repository root
`/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`; branch `main`; product snapshot
`a68b76221db62e8a14207a2f94076a2aae661b31`; `origin/main...HEAD` is `70` behind / `47` ahead;
one physical Worktree at the canonical Main path. RightSpot tracked source/tests were clean;
collaborator-owned Web-Game changes and protected RightSpot untracked evidence/config paths remain
outside this Work Order. Pinned Node is `v24.20.0`, npm `11.19.0`, and `/api/health` returned
`{"ok":true,"service":"rightspot"}`. The exact worker-write baseline hashes are:
`operations-webmcp.ts` `b3b83f482bb699b8c99ffaf22291784c58b712aa68979e9c512a3b7697f476c5`,
`operations-page.tsx` `8b7fd1df584e9789187052db96e09c635008739993b4baff95ea9c845b152a3e`,
`operations-webmcp.test.ts` `84375e27f76ce47f34cc5a0817d3909a9c536cfc1cae6df021218c16e4f16b1c`,
and `operations-page.test.ts` `4701c237272b370e3790bf39d84fc0d78028eb03fd2371542346688655b0482a`.
This is retained as the pre-repair evidence record; it no longer identifies the current verifier
candidate.  
**T2 Builder handoff and Main integration (2026-09-03):** Supporting Builder Jason
(`01a06769-085c-7c51-899b-3f41425cd58e`) returned only the declared four paths. Main reviewed and
integrated the candidate at product commit
`ac672854a2c9a793cdf787d6564dd7b99a77035d`. The post-repair hashes are:
`operations-webmcp.ts` `fff1b7544f46d21ea65d1499bb0102eb7362dd276504c2c2c0903de0bc5dd710`,
`operations-page.tsx` `04c7aefa9c6e3e75e3548279cbc797e2c26ce50baf85105d283dbcdcd5238ba4`,
`operations-webmcp.test.ts` `e1c8d918d3eaf1349c2cb9b83238abef2c7c0684b7f6232151581bbf60d28e5e`, and
`operations-page.test.ts` `65ff5f90089db2419039779a045c3c0a513ccc18e03d1a80cccb686df1e26c18`.
Repository HEAD at this handoff is merge commit `b2e5f93c538bbf75196d4a128950e15b28e73e52`, with
`ac67285` as its first parent and `origin/main` at second parent `928debcbe6ed8fda9d165ac17318fd30a57f0361`;
the merge introduced no RightSpot source/test delta. Main is ahead of `origin/main` by `50` commits.
The RightSpot product-source identity therefore remains `ac67285` plus the four hashes above, while the
full repository snapshot for the verifier is `b2e5f93`. Focused tests passed `28/28`; the complete suite passed `231/231`; pinned Node `24.20.0` typecheck,
production build, repository/docs validators, sensitive scan, and `git diff --check` passed. The
build emitted only the known dynamic filesystem-tracing warning in `src/server/persistence/
operations-store.ts`. No browser evidence was claimed or produced by the Builder. The product source
is now frozen for the independent verifier; later Main documentation-only commits do not alter these
four source/test paths.  
**Worker write set:** `src/ui/agent/operations/operations-webmcp.ts`,
`src/ui/agent/operations/operations-page.tsx`, `tests/ui/operations-webmcp.test.ts`, and
`tests/ui/operations-page.test.ts` only  
**Main writeback set:** this Task File, current status, validation evidence, business-flow/WebMCP
roadmap, and Git closure records  
**Required behavior:** synchronous and rejected registration failures must deactivate the page-bound
registration/execution lifecycle and reach a stable neutral page-owned signal exactly once; no raw
exception, fake registration, hidden retry, or manual-page blockage is allowed. Unsupported WebMCP
continues to preserve the complete manual Operations page.  
**Stop condition:** If the repair requires a server/API/domain contract, a new capability, shared
role-frame change, generic telemetry, or a second authority, stop and return to Main's decision gate.

## Stop and reopen conditions

Stop the implementation and return to Main if:

- the browser exposes a different registration/cleanup contract than the accepted lifecycle;
- one page-owned executor cannot preserve the manual/tool latest-read identity;
- strict runtime allowlisting requires a new server/shared contract or second authority;
- assignment cannot be enforced by the existing server boundary;
- implementation needs to modify a forbidden/shared path, add a dependency, or create a Worktree;
- `upcomingViewings`, mutations, natural-language parsing, generic reporting, or any deferred
  integration becomes necessary for the selected goal; or
- source drift, collaborator ownership, or Git divergence prevents a reproducible freeze.

No fallback implementation, source weakening, test weakening, or documentation-only claim may be used
to bypass a stop condition. A failed WebMCP capability may be removed/disabled while preserving the
ordinary manual Operations page.

## Non-goals

- `upcomingViewings` WebMCP, history, charts, exports, pagination, saved/scheduled reports, or CRM;
- changes to Operations authority/projection/persistence, workflow state, role model, or route/API
  semantics;
- mutations, confirmation, contact, notifications, external authentication, Cloud Receiver, WebRTC,
  Redis, deployment, production hardening, or universal browser support; and
- claiming probabilistic Agent goal success from deterministic application tests or one browser run.

## Current disposition

This remains the source-bearing Task for the accepted ADR-RS-0017 tool contract. Its original five-path
implementation candidate passed deterministic checks and Main browser smoke, but independent browser
closure remains incomplete because its shared lifecycle evidence gate is harness-blocked. `RIGHTSPOT-048`
is the separate bounded repair owner for the overlapping shared frame and adapter lifecycle paths; its
reviewed deterministic/browser split permitted the disjoint `RS-WO-047-03` repair. The new four-path
Agent registration-observability repair is integrated at `ac67285` and has passed every deterministic
handoff gate, but it has no browser claim yet. The next action is a fresh, read-only
`RS-WO-047-02` verification against the frozen post-repair source. The old partial attempts remain
historical evidence and are not a closure or push authorization.
The 2026-09-03 audit confirmed `F-26` in the Agent production wiring. `RS-WO-047-03` owns that bounded
repair; the corresponding Tenant adapter boundary is separately registered as `RIGHTSPOT-051` because
the 047 write set must remain Agent-only.
The active `RIGHTSPOT-012` audit may continue on non-overlapping read-only surfaces, but it cannot
mutate this Task's four-path write set or move the frozen verifier baseline. `RS-WO-047-02` is now
admissible for serial independent verification under the recorded source identity and WebMCP model
gate.
