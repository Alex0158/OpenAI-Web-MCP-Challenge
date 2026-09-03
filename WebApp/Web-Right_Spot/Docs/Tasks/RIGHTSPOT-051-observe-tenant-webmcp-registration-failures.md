# RIGHTSPOT-051 — Observe Tenant Search WebMCP registration failures

**Type:** `defect`  
**Lifecycle:** `pending`  
**Priority:** `P2` for WebMCP capability truthfulness and diagnosability  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Finding:** `F-26` — Tenant Search registration failure can become a silent no-op  
**Depends on:** closed [`RIGHTSPOT-043`](RIGHTSPOT-043-implement-tenant-search-and-webmcp-adapter.md),
accepted [ADR-RS-0015](../Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md), the reviewed
`RIGHTSPOT-048` lifecycle candidate, and the ordinary Tenant Search page

## Task control

- **Objective:** Make a synchronous or asynchronous Tenant Search WebMCP registration failure
  observable through a bounded page-owned capability signal while preserving the complete manual
  Search surface.
- **Execution posture:** `WEBMCP_SERIAL_IMPLEMENTATION` — page-bound adapter and its one Tenant
  consumer are one source/test boundary; no source writer may overlap it during implementation.
- **Blocking status:** Non-blocking to the ordinary local MVP and to the Agent Operations 047/048
  evidence gates. It is related to the Agent-side `F-26` repair, which remains a checkpoint under
  `RIGHTSPOT-047` rather than a second Task here.
- **Current increment:** The exact three-path Builder checkpoint has been dispatched under the WebMCP
  model gate. Main is continuing non-overlapping source-identity, documentation, and integration
  preparation while the worker runs.
- **Next gate:** Review the Builder's exact diff and Red → Green → Refactor handoff; then freeze the
  candidate for independent verification before any Main integration or closure claim.
- **Source baseline at registration:** Main `7650db00cc60d23b262b6c506c81e8913ad4d3ca`; RightSpot
  source/test paths were clean. Existing validation-ledger and protected untracked paths are outside
  the worker write set.
- **Dispatch baseline:** Main `14cd82c7a66e352d9ba0810b14ceaf9bfb5138e0`; the tracked RightSpot
  source/test projection is clean at dispatch preparation. The repository's unrelated remote branch
  movement is not a reason to merge or rebase this bounded local checkpoint; no push is implied.
- **Main authority:** Main owns task admission, exact source identity, contract interpretation,
  integration, browser evidence, canonical documentation, and Git closure.

## Verified problem

`registerTenantSearchTool` catches synchronous and rejected `registerTool()` failures and invokes an
optional `onRegistrationError` callback. The production `TenantWebMcp` component does not provide that
callback, and the adapter does not deactivate the registration lifecycle on registration failure.
When a supported `modelContext` exists but registration fails, the page therefore has no bounded
capability signal and cannot distinguish a registered tool from a failed registration. Manual Search
still works, and no server authorization, workflow mutation, or private-data leak was reproduced.

This violates the no-silent-no-op requirement already accepted by ADR-RS-0015. It is a WebMCP
capability truthfulness defect, not a reason to add a required WebMCP dependency or to replace manual
Search with another transport.

## Bounded objective and required behavior

1. For a supported `modelContext` whose registration throws or rejects, the adapter must deactivate
   its registration/execution lifecycle and emit one bounded neutral signal to the page owner.
2. The Tenant page may render a stable message such as “Search assistance is unavailable in this
   session. Use the manual filters below.” It must not render the raw exception, claim registration
   success, or expose an internal diagnostic.
3. Manual filter input, Apply, Clear, result rendering, loading, empty, error, and Retry behavior must
   remain fully usable; the signal is progressive enhancement status, not a manual-search blocker.
4. Unsupported capability (`modelContext === null`) remains the existing ordinary manual fallback and
   is not treated as a registration failure. No fake registration or alternate transport is added.
5. Synchronous and asynchronous registration failures must be handled once per page lifecycle; late
   failure after teardown must not update a dead page or re-enable a stale tool.
6. The existing server/session, Search predicate, response contract, page parity, privacy, and 048
   session lifecycle remain unchanged.

## Implementation boundary

### Required read set

- repository `AGENTS.md`, RightSpot `README.md`, `RUNBOOK.md`, and the pilot orchestration Runbook;
- `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/07-business-flows-and-scenarios.md`, and the WebMCP roadmap;
- ADR-RS-0015, `RIGHTSPOT-043`, `RIGHTSPOT-048`, and the current Tenant Search tests;
- `src/ui/tenant/tenant-webmcp.ts` and `src/ui/tenant/tenant-discovery-page.tsx`; and
- the exact supported-browser capability and pinned Node/npm runtime at dispatch/reverification.

### Worker write set

The future Builder may modify only:

- `src/ui/tenant/tenant-webmcp.ts` — registration-failure lifecycle and callback contract;
- `src/ui/tenant/tenant-discovery-page.tsx` — page-owned bounded capability status only;
- `tests/ui/tenant-webmcp.test.ts` — synchronous/rejected registration, production wiring, and teardown
  tests.

Main alone owns updates to this Task, current status, validation evidence, flow catalogue, roadmap,
and Git records. The Builder must not edit canonical documents.

### Forbidden set

- server/API/application/domain/DTO/persistence/fixture/reset/auth changes;
- changes to Search criteria, Area semantics, response parsing, page executor, ordinary manual Search,
  Agent Operations, `RIGHTSPOT-047` source outside its own checkpoint, or shared role-frame behavior;
- raw exception display, console-as-only observability, hidden retry, alternate transport, fake tool
  registration, generic telemetry, new dependencies, Cloud Receiver, external authentication, Redis,
  WebRTC, deployment, or universal browser support; and
- Git commit/push, Worktree creation/deletion, fixture mutation, or generated-output promotion by the
  Builder.

### Generated/evidence set

Supported-browser logs, screenshots, and temporary `.playwright-cli/` output remain disposable
evidence. They must not be staged and cannot substitute for a bounded production-wiring test.

## Red → Green → Refactor plan

### Red

Add focused tests that fail against the current wiring when `registerTool()` throws or rejects:

- the registration error reaches the production page owner exactly once;
- the registration lifecycle is deactivated and no later invocation can claim a current tool; and
- the manual Tenant Search page still contains its existing filter and Retry contract.

### Green

Pass a stable page callback into the existing adapter, map the failure to a neutral page-owned signal,
and deactivate on failure. Keep unsupported capability as the existing no-registration path.

### Refactor

Keep the adapter thin and page-bound. Do not introduce a cross-role WebMCP error framework or merge
the Tenant repair with the Agent Operations implementation; the two adapters have separate ownership
and verification gates.

## Acceptance criteria

Close this Task only when all are true:

1. Sync and rejected registration failures are tested and produce one bounded page-owned signal.
2. A failed registration cannot leave a callable stale Tenant Search tool or report false success.
3. The signal contains no raw exception or server-controlled private diagnostic.
4. Unsupported WebMCP remains a complete manual fallback without fake registration.
5. Existing manual Search behavior, filters, page state, result truthfulness, privacy, session, and
   no-mutation boundaries remain unchanged.
6. Focused Red → Green → Refactor tests, full `npm test`, typecheck, production build, repository
   validators, RightSpot-sensitive scan, and `git diff --check` pass under Node `24.20.0`.
7. Any browser/WebMCP claim is made only from the declared supported runtime against a frozen source;
   a harness failure remains an evidence limitation.
8. Main reviews exact paths, updates core records, commits the coherent checkpoint, and confirms one
   canonical Main Worktree.

## Work Order

### RS-WO-051-01 — Surface Tenant Search registration failure

**Status:** `DISPATCHED_BUILDER`  
**Role:** WebMCP/API/UI implementation Builder  
**Parallelization:** `SERIAL_TENANT_WEBMCP_ADAPTER` — no other writer may touch the three-path worker
write set during the checkpoint  
**Model gate:** When dispatched, WebMCP-specific implementation must use `gpt-5.6-sol` with `medium`
reasoning. If that capability is unavailable, keep this Work Order gated; do not substitute another
model for the WebMCP implementation.  
**Dispatch:** Supporting Builder Socrates (`01a0672d-ebb1-7831-a8e9-ca23f248fc42`) dispatched by Main
with `gpt-5.6-sol` and `medium` reasoning from the reviewed source projection  
**Execution mode:** Prefer the canonical Main Worktree if Main elects a serial implementation; an
isolated Worktree requires an explicit source-freeze and integration record  
**Worker write set:** the exact three paths listed above  
**Main writeback set:** this Task File, current status, flow catalogue, validation ledger, WebMCP
roadmap, and Git closure records  
**Stop condition:** If a user-visible status requires a new ADR, shared lifecycle contract, telemetry
system, or manual Search behavior change, stop and return to Main's decision gate.

**Dispatch record (2026-09-03):** Main sent one self-contained Builder prompt requiring the global,
repository, RightSpot, Next.js, Task, ADR, and WebMCP contract surfaces to be read before action. The
prompt fixes the actual repository root, the source baseline `14cd82c7a66e352d9ba0810b14ceaf9bfb5138e0`,
the exact three-path worker write set, the Node `24.20.0` runtime, TDD Red → Green → Refactor, and the
full/static verification ladder. It explicitly forbids documentation, Git/index, Worktree, fixture,
server/API/domain/DTO, ordinary manual Search, shared role-frame, Agent/047, and unrelated Web-Game
changes. The worker must stop at `READY_FOR_VERIFICATION`; Main owns all documentation, integration,
independent-verification, and closure decisions.

## Stop and reopen conditions

Stop and report `BLOCKED` if the installed browser registration API differs from the accepted adapter
contract, if deactivation cannot be guaranteed without changing the shared lifecycle, or if the repair
requires raw diagnostics or a new transport. Do not blindly retry the known 048 browser harness.

Reopen if a registration failure is silent, a failed registration remains callable, the manual page is
blocked, unsupported capability is misreported as a failure, or the page claims WebMCP success without
runtime registration evidence.

## Current disposition

`F-26` is a verified P2 capability-truthfulness defect from the 2026-09-03 multi-angle audit. The
Tenant portion is registered here because `RIGHTSPOT-043` is already closed and its adapter has a
separate ownership boundary. The Agent Operations portion is recorded as `RS-WO-047-03` inside the
open 047 Task. Neither repair authorizes a new WebMCP capability, a server change, or a deployment
claim.
