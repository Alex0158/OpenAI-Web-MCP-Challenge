# RIGHTSPOT-002: Build the MVP Application Shell

**Type:** implementation  
**Lifecycle:** `in_progress`  
**Priority:** P0 for RightSpot  
**Owner:** Main RightSpot thread  
**Depends on:** [ADR-RS-0001](../Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md), [ADR-RS-0002](../Decisions/ADR-RS-0002-logical-backbone-boundary.md), [ADR-RS-0003](../Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md), [ADR-RS-0006](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md)

The implementation must follow the accepted business rules in
[Requirements](../02-requirements.md) and the
[Domain and Data Model](../04-domain-and-data-model.md).

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Main RightSpot thread
- Current increment: Independently verify the integrated tenant and agent role pages as one cross-role
  ordinary Happy Path against the frozen main source.
- Next gate: Complete `RS-WO-002-14` read-only cross-role verification, then adjudicate any bounded
  findings before browser walkthrough or parent closure claims. Both role-page candidates are integrated;
  exact route, component, test, and shared-boundary ownership remain recorded below.
- Dependencies: ADR-RS-0001, ADR-RS-0002, ADR-RS-0003, ADR-RS-0008, and the accepted Requirements
  and Domain and Data Model documents.
- Process authority: ADR-RS-0004, ADR-RS-0005, ADR-RS-0006, ADR-RS-0008, and the RightSpot Thread Orchestration Pilot Runbook govern any
  supporting-task dispatch under this parent.
- Parent execution posture: `PROGRESSING` — `RS-WO-002-13` and repaired `RS-WO-002-12` passed
  independent verification and are integrated at product commits `3765747` and `9348aa5`. The parent
  remains open and can proceed through the combined cross-role verification gate.
- Blocker reporting: the main thread reports the checkpoint-local blocker to the human owner and
  records its evidence, impact, owner, safe continuation, and resume condition here; this does not
  change the parent lifecycle to `blocked`.

## Parent-task boundary and active Work Orders

This record is the single registered parent Task and the one Task File for the complete first
ordinary application slice. Its objective and closure evidence describe the parent outcome. The
current executable increment is narrower: implement and independently verify only the currently
approved interface slices against stable contracts and disjoint ownership. The persistence,
workflow-core, and discovery boundaries are independently verified; the ordinary workflow
HTTP/DTO contract is accepted in ADR-RS-0008, and its implementation is now integrated; UI consumers
remain separate checkpoints. Later implementation, verification, repair, and integration remain sequential
checkpoints inside each bounded Work Order, not a second set of registered Tasks or a speculative
backlog. If a checkpoint is blocked, the main thread may record and activate another Work Order in
this same file only when it passes the pilot's independent-parallelization gate and does not depend
on or mutate the blocked boundary.

The runnable foundation increment is complete: the Builder stopped after returning
`READY_FOR_VERIFICATION`, the first Verifier attempt was procedurally `BLOCKED` because its assertion
wrote to an OS temp path outside the declared RightSpot output boundary, and the corrected rerun
returned `VERIFIED` against the unchanged source/runtime identity. `RS-WO-002-03` was implemented,
one bounded projection-isolation repair was completed, and T2 source review produced candidate commit
`186e98a`. The independent Verifier found a listing-version guard defect; the bounded Repairer fixed
it in post-repair commit `6e70c9f`, limited to the domain workflow and focused domain test paths. Fresh
independent verification returned `VERIFIED` against that frozen source. `RS-WO-002-04` was the current
bounded persistence/application integration checkpoint and is now independently verified against
frozen source `28105e4d`.

Do not send this parent Task's full objective to one Builder. Do not treat a worker result as
verification, integration, or parent-Task closure.

### Current Work Order controls

- **Dispatch state:** `RS-WO-002-05` is independently verified against clean snapshot `bc3bc42`.
  `RS-WO-002-06` returned `READY_FOR_REVIEW`; the main thread accepted its useful decomposition with
  revisions, recorded the local HTTP/DTO contract in ADR-RS-0008, and dispatched `RS-WO-002-07`,
  `RS-WO-002-08`, and `RS-WO-002-09` from baseline `c758634`. `RS-WO-002-07` and `RS-WO-002-08`
  passed dedicated independent verification and are integrated at product commits `f700ba9` and
  `006d2fd`; `RS-WO-002-09` returned `READY_FOR_REVIEW` and its bounded checklist is integrated as
  later UI guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW`; the main thread accepted its
  decomposition and opened the minimal serial shared-role-frame slice `RS-WO-002-11`. Its Builder
  candidate `f1f83c7` passed dedicated independent verification and is integrated at product commit
  `6a0b4b8`. The next two Work Orders are the disjoint tenant and agent page slices recorded below.
  Builder, Verifier, Repairer, Integrator, Advisor, and reviewer
  roles remain checkpoints under this Task, not pre-registered child Tasks.
- **Baseline:** The actual repository root is `WebMCP_Challenge`; the latest integrated product code
  is `6a0b4b8` (workflow transport, shared shell, and shared role-page frame); the accepted
  workflow/interface documentation baseline was frozen in `c758634` before dispatch. Each new Work
  Order records its own exact source identity. The
  user-authorized Side Chat learning file and process-only Pilot Runbook writeback are classified
  separately from product source. Source identity is checkpoint-scoped and path-owned; it is not a
  permanent full-document hash lock.
- **Read before action:** Repository `AGENTS.md` and Engineering controls, RightSpot `RUNBOOK.md`,
  `Docs/00-current-status.md`, the relevant product/domain/API/validation documents, ADR-RS-0001
  through ADR-RS-0008, and the Thread Orchestration Pilot Runbook.
- **Worker restrictions:** The foundation, domain-core, persistence/application, and discovery
  writers have stopped. The currently assigned slices have separate ownership: `RS-WO-002-07` owns
  workflow HTTP/DTO paths, `RS-WO-002-08` owns the shared human shell paths, `RS-WO-002-09` is
  read-only, `RS-WO-002-11` owns the shared role-page frame paths, `RS-WO-002-12` owns tenant page
  paths, and `RS-WO-002-13` owns agent page paths. Every checkpoint must classify
  the declared read, worker-write, main-thread-writeback,
  forbidden, and generated sets path-by-path; no worker may modify canonical authority, the Git
  index, or generated state outside explicitly ignored runtime paths. No worker may commit, push,
  deploy, publish, perform external actions, expand product scope, or change canonical authority.
- **Worker writeback:** The Builder returns its completion report in the supporting thread. It does
  not edit this canonical Task File; the main thread inspects the source and writes authoritative
  status and evidence back here.

**Return gate:** Each checkpoint reports `READY_FOR_VERIFICATION`, `VERIFIED`, `NEEDS_REPAIR`, or
`BLOCKED` with exact source and command evidence. The main thread classifies the result, reports any
checkpoint-local blocker, and opens only the next necessary checkpoint or explicitly independent
parallel slice; no worker result closes this Task.

### Main-thread preflight (not a Work Order)

Before dispatch, the main thread records the following foundation dispatch profile in this Task File
or in the dispatch message, then reconciles any material decision into the owning ADR:

- **Toolchain:** use `npm` and `package-lock.json`; pin exact package versions; use Node's built-in
  `node:test` with an explicitly pinned dev-only `tsx` runner for TypeScript tests and scripts. The
  approved dependency shape is runtime `next`, `react`, and `react-dom`, plus dev-only `typescript`,
  `tsx`, `@types/node`, `@types/react`, and `@types/react-dom`; do not add a second frontend
  framework or an unapproved test stack. If the lockfile is absent at scaffold start, one bounded
  `npm install --no-audit --no-fund` may create it from that exact manifest; all subsequent
  verification uses `npm ci --no-audit --no-fund`. The required scripts are `dev: next dev`,
  `build: next build`, `start: next start`, `typecheck: tsc --noEmit`,
  `test: tsx --test tests/foundation.test.ts`, and `db:reset: tsx scripts/reset-db.ts`; none may
  start an external service.
- **Runtime:** target the repository `.node-version` (`24.20.0`) and record the exact runtime used.
  Node 24 compatibility evidence from an installed alternate patch version is not closure evidence
  for the repository baseline.
- **Persistence:** use Node's built-in `node:sqlite` behind a server-only RightSpot persistence
  module, with the file-backed default `var/rightspot.sqlite` and one internal
  `foundation_metadata` table containing one singleton row and an integer `generation` (the row is
  keyed by `id = 1` and `generation >= 1`); do not import `reentry-core`, add an ORM, or fall back
  to an in-memory store when the file store fails.
- **Foundation reset:** create only the minimum metadata needed to prove schema initialization and
  fixture-generation handling. On a fresh database path, initialization creates generation `1` and
  the first reset returns generation `1`; each later successful reset advances it by exactly one in
  one SQLite transaction. Opening an existing store or serving health must not advance the
  generation, a failed reset must not partially advance it, and reset must not delete and recreate
  the database file. Do not create business tables or claim the final `resetSyntheticFixture`
  behavior in this checkpoint.
- **Health surface:** use one neutral `GET /api/health` Node-runtime route returning HTTP `200` with
  `application/json` body `{"ok":true,"service":"rightspot"}` after the local application
  composition and persistence boundary are ready. A readiness failure returns HTTP `503` with
  `{"ok":false,"service":"rightspot"}` and no diagnostic details. It must not expose file paths,
  stack traces, credentials, or business data. The route must explicitly export the Node.js runtime
  and dynamic request-time behavior (the pinned Next.js equivalent of `runtime = "nodejs"` and
  `dynamic = "force-dynamic"`) and send `Cache-Control: no-store`.
- **Build mode:** preserve a server-capable Next.js build for `next start`; do not use static export,
  an Edge runtime, or a configuration that removes the Node route handler.
- **Foundation UI:** `app/layout.tsx` and `app/page.tsx` may provide only a static, non-interactive
  shell that proves the Next.js route renders. They must not contain login, listing, request, role,
  client-state, or domain-action behavior; no UI kit or custom component system is needed here.
- **Source mode:** use the current shared working tree with one writer at a time, because the
  RightSpot documentation baseline is currently untracked and is not assumed to transfer to a new
  worktree. Record branch, `HEAD`, complete dirty state, and exact content scope immediately before
  dispatch; for the untracked child documents, include a path/content manifest or equivalent
  hashes in the dispatch record because `HEAD` alone cannot identify this source.
- **Verification:** freeze the exact scripts for install/bootstrap, typecheck, tests, build, reset,
  and built-server health smoke before sending the prompt. The Builder may self-check only; a later
  Verifier remains required for the checkpoint claim.

This is a decision and readiness check, not a delegated Work Order, and it does not create a
separate lifecycle or Task File.

### RS-WO-002-01 — Establish the runnable local foundation

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder  
**Owner:** Main RightSpot thread; supporting Codex task/thread executes the checkpoint  
**Pre-dispatch status:** `GATED` — gate completed at dispatch  
**Execution state:** `READY_FOR_VERIFICATION`  
**Dispatch state:** Completed at the recorded source identity; returned `READY_FOR_VERIFICATION`  
**Risk profile:** `Assured` — persistence, package/runtime, server route, and cross-layer boundary  
**Next gate:** Independent Verifier checkpoint `RS-WO-002-02` returned `VERIFIED`; no repair was
opened.  
**Objective:** Create the smallest runnable RightSpot application foundation that proves the
accepted Next.js App Router, React, TypeScript, Node.js 24, and SQLite baseline can start, build,
test, and reset a local development composition.

**Main-thread prerequisites:** Before dispatch, the main thread must complete the preflight profile
above, verify the exact runtime situation, choose the serialized shared-tree source mode, freeze the
package manager and exact dependency versions, and record the concrete SQLite access/reset approach,
health route contract, test commands, folder layout, and exact mutable paths. These choices must
remain within the accepted modular-monolith boundary and must not add Cloud Receiver, WebMCP,
Redis, WebRTC, an external runtime service, or a dependency on `reentry-core`.

**Approved dependency set:** The dispatch pins are exact and limited to the following packages:

- Runtime: `next` `16.3.4`, `react` `19.2.8`, `react-dom` `19.2.8`.
- Development: `typescript` `7.0.2`, `tsx` `4.23.13`, `@types/node` `24.13.3`, `@types/react`
  `19.2.18`, and `@types/react-dom` `19.2.5`.

No UI kit, ORM, authentication provider, browser test framework, migration framework, or other
runtime package is approved in this checkpoint.

**Source baseline:**

- Git root: `WebMCP_Challenge`; re-run `git rev-parse --show-toplevel` at dispatch.
- Branch, `HEAD`, upstream, and full tracked/untracked/ignored state: record immediately before
  dispatch; the review baseline is branch `main`, `HEAD` `29af456b9789d701af890158d33554560824d1fd`,
  with the entire RightSpot folder untracked.
- Because the required RightSpot source is untracked, the dispatch record must also identify the
  exact child-document paths and a content manifest or equivalent hashes; a branch or `HEAD` alone
  is not a sufficient source identity.
- Source mode: serialized current working tree; no overlapping writer may edit while the Builder is
  active. A new worktree must not be used unless its inclusion of all required RightSpot documents is
  explicitly verified.
- Runtime target: repository-root `.node-version` is `24.20.0`. The main thread prepared and
  verified an exact arm64 Node `v24.20.0` runtime outside the repository at
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`. The current default shell
  remains Node `v26.5.0`; the Builder must invoke the prepared exact runtime explicitly or use an
  explicit PATH prefix, without replacing the global Node installation.

**Read before action:** Repository `AGENTS.md` and Engineering controls; RightSpot `RUNBOOK.md`;
`Docs/00-current-status.md`; `Docs/01-product-definition.md`; `Docs/02-requirements.md`;
`Docs/03-system-design.md`; `Docs/04-domain-and-data-model.md`;
`Docs/05-api-and-integration-contracts.md`; `Docs/06-validation-and-evidence.md`;
ADR-RS-0001 through ADR-RS-0004; and the RightSpot Thread Orchestration Pilot Runbook.

**Allowed mutable paths (to be frozen and made exact in the dispatch prompt):**

- `WebApp/Web-Right_Spot/package.json`;
- `WebApp/Web-Right_Spot/package-lock.json`;
- `WebApp/Web-Right_Spot/.gitignore`;
- `WebApp/Web-Right_Spot/next.config.ts`;
- `WebApp/Web-Right_Spot/tsconfig.json`;
- `WebApp/Web-Right_Spot/next-env.d.ts` (Next-generated type reference);
- `WebApp/Web-Right_Spot/app/layout.tsx`;
- `WebApp/Web-Right_Spot/app/page.tsx`;
- `WebApp/Web-Right_Spot/app/api/health/route.ts`;
- `WebApp/Web-Right_Spot/src/server/application/health.ts`;
- `WebApp/Web-Right_Spot/src/server/persistence/sqlite.ts`;
- `WebApp/Web-Right_Spot/src/server/persistence/reset.ts`;
- `WebApp/Web-Right_Spot/scripts/reset-db.ts`; and
- `WebApp/Web-Right_Spot/tests/foundation.test.ts`.

Generated or local-only state may be created only as ignored runtime output: `node_modules/`,
`.next/`, `*.tsbuildinfo`, `var/rightspot.sqlite*`, and temporary foundation-test database files
under `var/test/`. Test database files must be isolated, must not be reused across unrelated test
runs, and must not be included in the completion claim; cleanup is optional and may touch only an
exact file created by that test. Generated state must not be hand-edited or staged. If a different
path is necessary, stop and return to the main thread before editing it.

**Forbidden paths and actions:** all paths outside `WebApp/Web-Right_Spot/`; all canonical RightSpot
product, domain, ADR, Task, Roadmap, status, and Runbook documents; the outer `reentry-core/`; sibling
applications; Git index operations; commit, push, deployment, publication, credentials, external
messages, external runtime services, real-person/property data, business tables, domain state
transitions, authentication, tenant/agent product surfaces, hidden fallback, and speculative
dependency or abstraction.

**Affected surfaces and claim boundary:** This checkpoint affects only the package/build shell, one
server-side health adapter, the local SQLite foundation, reset metadata, and focused foundation
tests. It has no tenant or agent role behavior, no business state, no session authority, and no
Viewing Request data. A successful Builder report supports only a local foundation readiness claim;
it does not support product-flow, domain, role/privacy, browser, deployment, WebMCP, Cloud Receiver,
Redis, WebRTC, or parent-Task closure claims.

**Dependencies and assumptions:** the approved package set is available through `npm`; the target
Node runtime can execute the accepted stack; no other writer changes the shared tree; and the health
route can use the application-service/persistence boundary without importing server code into a
client component. A falsifier is any required unapproved dependency, runtime mismatch, bundler
failure for server-only SQLite, direct route-to-database bypass, non-deterministic reset, or source
scope outside the list above.

**Acceptance criteria:**

- the application starts and builds under Node.js 24 with reproducible package scripts;
- `npm ci` or the one explicitly approved bootstrap install completes from the exact manifest and
  lockfile;
- `npm run typecheck`, the registered foundation test command, and `npm run build` pass under the
  named runtime;
- a built local server executes `GET /api/health` on the Node.js runtime with dynamic request-time
  behavior, `Cache-Control: no-store`, HTTP `200`, `application/json`, and the exact body
  `{"ok":true,"service":"rightspot"}`; a readiness failure returns only HTTP `503` with
  `{"ok":false,"service":"rightspot"}` and no sensitive diagnostics;
- the SQLite foundation opens through the server-only approved access boundary at the default
  file-backed path, and a fresh reset plus a repeated reset prove generation `1` then `2` without
  business tables or an in-memory fallback; opening the existing store and reading health do not
  advance the generation;
- focused foundation tests prove the ready and readiness-failure health responses, visible
  file-backed-open failure, generation reset behavior, and absence of business tables without
  leaking paths, stack traces, or other diagnostics;
- generated state is ignored and no database, environment file, secret, or outer-project change is
  part of the result; and
- the exact changed paths remain inside the frozen foundation scope.

**Verification commands:** The dispatch prompt must use this command sequence with the exact runtime
and package-manager versions recorded:

If `package-lock.json` is absent at the start, run this one-time bootstrap first:

```sh
cd WebApp/Web-Right_Spot
npm install --no-audit --no-fund
```

```sh
cd WebApp/Web-Right_Spot
node --version
npm --version
npm ci --no-audit --no-fund
npm run typecheck
npm test
npm run db:reset
NEXT_TELEMETRY_DISABLED=1 npm run build
```

In a second terminal, from the same source baseline, start the built server:

```sh
cd WebApp/Web-Right_Spot
NEXT_TELEMETRY_DISABLED=1 npm run start -- --hostname 127.0.0.1 --port 3100
```

Once the server is ready, use another terminal for the health smoke:

```sh
test "$(curl --fail --silent --show-error http://127.0.0.1:3100/api/health)" = '{"ok":true,"service":"rightspot"}'
```

Before starting the server, confirm that port `3100` is free. If another process owns it, stop and
report the environment condition; do not kill or reuse an unknown process. Run the server in a
bounded process for the curl check and then stop only its exact PID.
The reset test must use an isolated temporary database; `npm run db:reset` may exercise the default
development path but must not print an absolute path or mutate any database outside the RightSpot
folder. The isolated test database must remain under `var/test/`; an OS-level temporary directory,
an in-memory substitute, or an HTTP-controlled arbitrary database path is not permitted. Do not
delete any pre-existing file during test setup; if cleanup is used, it must target only the exact
test-created file. Browser automation, the full business-flow suite, and outer repository closure
checks are not Builder acceptance checks.

**Non-goals:** demo login or session policy, Listing or Viewing Request business tables,
state-machine operations, tenant or agent product surfaces, full fixtures, independent browser
verification, documentation reconciliation, Git closure, deployment, and all deferred
Cloud Receiver/WebMCP/Redis/WebRTC behavior.

**Stop conditions:** Stop and return to the main thread if the implementation needs a new product,
architecture, persistence, security, or dependency decision; cannot run under the named runtime;
requires an unapproved package, ORM, migration framework, or external service; needs business
tables or state transitions; imports SQLite into client code; bypasses the application boundary;
touches a forbidden path; encounters another writer; needs an in-memory or silent fallback; or
cannot produce deterministic reset and exact source evidence.

**Completion report:** Return the report in the supporting thread, not by editing the canonical Task
File. Include the exact source baseline and dirty-state limitation; runtime and package-manager
versions; dependency changes; exact files created/changed and generated paths; behavior and
boundary checks; commands and results; passed, failed, skipped, and not-run checks; deviations;
residual risks; evidence claim limit; and next gate. Stop at `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`,
or `BLOCKED`. Do not claim independent verification, integration, or parent-Task closure.

**Builder handoff record:** The Builder returned `READY_FOR_VERIFICATION` after creating only the
14 foundation implementation paths listed in the next checkpoint's execution manifest. Its report
provided Node.js `v24.20.0`, npm `11.19.0`, typecheck, 6/6 foundation tests, reset, build, built-server
health, dependency, scope, generated-state, sensitive-pattern, CJK, and forbidden-reference evidence.
These are Builder-level claims only and remain subject to independent reproduction. The main thread
also identified that the dispatch-time manifest included process documents later amended by the main
thread; the amendments are recorded as governance revisions and do not change this Work Order's
product scope, acceptance criteria, or implementation paths.

**First Verifier attempt record:** The independent Verifier reproduced the frozen source/runtime
identity, package contract, typecheck, 6/6 tests, reset, isolated file-backed SQLite semantics,
build, built-server health, root response, generated-state, scope, dependency, and sensitive-content
checks. It returned `BLOCKED` rather than `VERIFIED` because one health assertion created
`/tmp/rightspot-health-body`, an OS temp artifact outside the permitted RightSpot directory. No
authored source, test, canonical document, Task record, or Git index was changed, and no code repair
was opened. The artifact remains subject to the main thread's deletion safety gate; the rerun must
not create or delete any external path.

**Corrected Verifier rerun record:** The existing Verifier task re-ran the complete foundation
contract with the amended output-boundary procedure and returned `VERIFIED`. It confirmed the exact
Node.js/npm/process path, approved dependency and lockfile contract, 6/6 tests, reset and isolated
SQLite semantics, build and route behavior, port-free and built-server health/root smoke, dependency
and generated-state boundary, forbidden/sensitive/CJK scans, and identical before/after execution
manifest. No authored path, canonical document, Task record, or Git index changed; no repair or next
phase was started. The result is limited to the runnable local foundation and does not claim product
flow, browser, deployment, WebMCP, Cloud Receiver, Redis, WebRTC, or parent closure.

### RS-WO-002-02 — Independently verify the runnable local foundation

**Parent task:** `RIGHTSPOT-002`  
**Role:** Verifier  
**Pre-dispatch state:** `GATED` — the first independent attempt returned `BLOCKED` on a procedure
boundary; the corrected rerun gate was completed after the procedure amendment  
**Execution state:** `VERIFIED`  
**Owner:** Main RightSpot thread; the assigned supporting Codex task/thread performs read-only verification  
**Governance revision:** ADR-RS-0004 SHA-256 `6b02fc3327b270444ae509423521db0f791950ba0d3d70c50aa5030a2fa53ba2`; Pilot Runbook SHA-256 `097ea9b005957d2b06c2fed5a3a40bd65c117d22328a4e5c00bbfc6b5c4b2873`  
**Objective:** Independently reproduce the foundation acceptance checks against the frozen Builder
output. Confirm the exact runtime, package contract, allowed implementation scope, server-capable
Next.js build, file-backed SQLite behavior, deterministic reset semantics, neutral health route,
generated-state isolation, and forbidden-surface boundary. This checkpoint does not add product
behavior or modify the foundation.

**Source baseline:** The main thread froze the actual repository root, branch, `HEAD`, complete
tracked/untracked/ignored state, exact implementation paths, and content hashes immediately before
dispatch. The verification manifest covers the 14 `RS-WO-002-01` implementation paths and the
repository-root `.node-version`; canonical documents and the orchestration policy are read-only
context, not product implementation inputs. The main thread records any process-document revision
separately and does not treat it as a product-scope change.

**Frozen execution manifest:** Repository root `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`, branch
`main`, `HEAD` `29af456b9789d701af890158d33554560824d1fd`, target Node.js `v24.20.0`, captured
2026-09-01 Europe/London. The exact SHA-256 entries are:

```text
5b9d0e73029969ae9000117cb877f17bb9841c1279bfe8024e294acfcf017800  .node-version
c1d6272a56d4a8281da1846f8e37b9c29eec7593f8dd88438263c0842881af52  WebApp/Web-Right_Spot/package.json
f74ff14d5234e2e811e9ea8677c0593c8b704bdc9cf1bf302f5805375790b50b  WebApp/Web-Right_Spot/package-lock.json
d3e615e61bc8397d6c7c84f9eaad1ec4ee44f2228f2c8dee008e68af5cb7781c  WebApp/Web-Right_Spot/.gitignore
ab4c61f6ee100ae43610a18512f1ebcec842bb2405431e1009266173f21cf772  WebApp/Web-Right_Spot/next.config.ts
3666e5cd5a6a59e88db1fda8674179d6168254b24a501863248739f80959e13c  WebApp/Web-Right_Spot/tsconfig.json
1862ac4bbbc5192d4bf562161df66ea547ed3e67173100656ab606ae9797db2b  WebApp/Web-Right_Spot/next-env.d.ts
0d7759e077da5aadff6fe6ebf85d035d8dc1fbcb3d563f3fb232a4f48b67d4f2  WebApp/Web-Right_Spot/app/layout.tsx
bcec1ec9a3be99251a4a3f76118f68b4cd00d494c9c1643140a89ff17bb8248c  WebApp/Web-Right_Spot/app/page.tsx
622be9fb6ecd9193c07eae6a25dcc4cb663741c3ab48f15df3c7b8cfc94f0de1  WebApp/Web-Right_Spot/app/api/health/route.ts
ce46c83bf9e6954db5df40d9fbe3a114465d51e19451a47740b83b2dc0663a9c  WebApp/Web-Right_Spot/src/server/application/health.ts
3005bff9891325e4795c10721f0364f209c0cc80eb540b0b384b4443a7fa0311  WebApp/Web-Right_Spot/src/server/persistence/sqlite.ts
09a98decbdd10f459f4246b2fb75996e479225b4e4631bb14056a8e80cd0e92d  WebApp/Web-Right_Spot/src/server/persistence/reset.ts
25ba263dd0134b94f69206ca7785cb1677cff156359a10e395ad047c0eec1cac  WebApp/Web-Right_Spot/scripts/reset-db.ts
5af9ac8fddb293af0051fdfb4b2831008eb405b762834f0823035c87d002a7e7  WebApp/Web-Right_Spot/tests/foundation.test.ts
```

**Read before action:** Repository `AGENTS.md` and Engineering controls; RightSpot `RUNBOOK.md`;
`Docs/00-current-status.md`; `Docs/01-product-definition.md`; `Docs/02-requirements.md`;
`Docs/03-system-design.md`; `Docs/04-domain-and-data-model.md`;
`Docs/05-api-and-integration-contracts.md`; `Docs/06-validation-and-evidence.md`;
ADR-RS-0001 through ADR-RS-0004; the RightSpot Thread Orchestration Pilot Runbook; and the
`RS-WO-002-01` and `RS-WO-002-02` sections of this Task File.

**Mutable paths:** None. The Verifier may create or update only ignored runtime output required by
the checks: `node_modules/`, `.next/`, `*.tsbuildinfo`, `var/rightspot.sqlite*`, and isolated test
databases under `var/test/`. Short response-body assertions must use shell variables or an exact
file under `var/test/`; `/tmp` and other external paths are outside the permitted boundary. It must
not edit authored files, delete pre-existing files, stage, commit, push, deploy, publish, or send
external messages. It must not repair a failure.

**Verification contract:** Under the prepared exact Node.js `v24.20.0` runtime and the frozen source:

- verify `node --version`, `npm --version`, and `process.execPath`;
- verify the exact direct dependency and lockfile versions;
- run `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm test`, and `npm run db:reset`;
- run `NEXT_TELEMETRY_DISABLED=1 npm run build`;
- start the built server on `127.0.0.1:3100` only after proving the port is free, then verify the
  exact `/api/health` body, status, content type, and `Cache-Control: no-store` header;
- verify the reset, health, server-only SQLite, no-business-table, no-fallback, and neutral-error
  behavior from the source and focused tests; and
- inspect exact authored paths for forbidden imports, sensitive patterns, unintended CJK text,
  generated files, and scope changes.

**Acceptance criteria:** All required checks pass against the same frozen source identity; no
authored path changes during verification; no check relies on Cloud Receiver, WebMCP, Redis, WebRTC,
an external service, or the outer `reentry-core`; and the report separates passed, failed, skipped,
not-run, and unsupported claims. A green Builder report alone is insufficient.

**Stop conditions:** Stop and report `BLOCKED` if the source changes during verification, the
manifest cannot be reproduced, another writer appears, the target runtime is unavailable, a check
requires an unapproved dependency or external service, a forbidden path is changed, or the result
requires a product, architecture, security, or persistence decision. Also stop and report `BLOCKED`
if any command creates output outside the declared RightSpot boundary. Do not silently repair, delete
an external artifact, or rerun against a different source.

**Completion report:** Return `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED` in the supporting thread with
the exact source identity, runtime, commands, results, changed/generated paths, deviations, skipped
checks, residual risks, and claim boundary. Do not edit this Task File or start Repairer, Integrator,
or any product phase.

## Next dispatch decision

The main thread recorded a `BLOCKED` result before changing the procedure, preserved the unchanged
implementation source/runtime baseline, and re-gated this same `RS-WO-002-02` checkpoint. It changed
the checkpoint from `GATED` to `ASSIGNED` only after the corrected rerun prompt was successfully sent
and persisted by the existing Verifier task. The corrected rerun returned `VERIFIED`, so no repair or
integration checkpoint is opened for the foundation. This was a sequential rerun of the same Work
Order, not a new registered Task or Task File.

### RS-WO-002-03 — Implement the authoritative workflow domain core

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Repairer → Verifier (sequential checkpoints)  
**Pre-dispatch state:** `GATED` — the runnable foundation is independently verified and committed as `b06bd85`  
**Execution state:** `VERIFIED` — bounded repair and fresh independent verification complete  
**Owner:** Main RightSpot thread; one assigned supporting Codex task performs each sequential bounded checkpoint  
**Dispatch state:** Builder dispatched at `df4cbd6`; T2 candidate source committed as `186e98a`; bounded listing-version repair committed as `6e70c9f`  
**Objective:** Implement a transport- and persistence-agnostic TypeScript workflow kernel that
enforces the accepted RightSpot Viewing Request state machine, availability lifecycle, role
authorization, revision/generation guards, bounded inputs, idempotent completed commands, audit
facts, and tenant/agent projections. The kernel must be directly testable without Next.js, React,
SQLite, a browser, a session provider, or an external service.
**Next gate:** Define the next bounded persistence/application integration checkpoint. No wider API/UI
surface opens as one unbounded assignment.

#### Scope and implementation contract

The Builder may create only these authored paths:

- `WebApp/Web-Right_Spot/src/server/domain/types.ts`;
- `WebApp/Web-Right_Spot/src/server/domain/errors.ts`;
- `WebApp/Web-Right_Spot/src/server/domain/workflow.ts`;
- `WebApp/Web-Right_Spot/src/server/domain/projections.ts`; and
- `WebApp/Web-Right_Spot/tests/domain/workflow.test.ts`.

The Builder must not modify the foundation files, package manifests, lockfile, configuration,
existing foundation test, canonical documents, or Git index. Generated output may occur only in the
existing ignored RightSpot paths. No new dependency is authorized.

The kernel should expose a small serializable state and command boundary, with an injected `now`
value and explicit actor identity/role. Exact function names may be chosen by the Builder, but the
implementation must make these facts observable in tests:

- `TENANT_DRAFT` → `REQUEST_SUBMITTED` requires the assigned tenant, a published listing, the
  expected listing/request version and fixture generation, one to three ordered preferred times,
  and a bounded tenant note;
- the assigned agent may move `REQUEST_SUBMITTED` → `AGENT_REVIEWING`;
- agent preparation may create or replace a bounded slot proposal or decline response while staying
  in `AGENT_REVIEWING`; preparation does not hold a slot or expose a consequence;
- sending a prepared available slot moves to `SLOT_PROPOSED`, holds that exact slot, and sets a
  deterministic 24-hour expiry from the injected clock;
- sending a prepared decline moves to terminal `AGENT_DECLINED` with an optional bounded
  tenant-facing reason;
- the owning tenant may confirm an unexpired proposal (`VIEWING_CONFIRMED`) or decline it
  (`TENANT_DECLINED`), with the exact held slot confirmed or released;
- an expired proposal moves to `EXPIRED` and releases its held slot on the relevant domain read/write
  evaluation; no scheduler is introduced;
- no terminal state transitions, arbitrary state values, unavailable-slot substitution, or
  preparation-as-consequence are allowed;
- every successful state-changing command increments the request version once and emits one
  non-sensitive audit fact; repeated completion of the same command identifier is idempotent and
  does not add a second audit fact, while a conflicting command fails without mutation;
- stale request versions and stale fixture generations fail visibly without overwriting newer state;
- actor role, tenant ownership, agent assignment, current state, input bounds, and slot/listing
  ownership are checked by the kernel rather than delegated to a future UI; and
- the tenant projection excludes agent-only review notes and internal fields, while the agent
  projection excludes credentials, raw private context, and unrelated requests.

The domain error surface must distinguish at least `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`,
`STALE_VERSION`, `FIXTURE_GENERATION_CONFLICT`, `INVALID_TRANSITION`, `SLOT_UNAVAILABLE`, and
`EXPIRED`. Errors must be serializable and must not contain stack traces, credentials, or hidden
integration context.

#### Required focused verification

The Builder must run the exact target Node.js `v24.20.0` and report:

- `npm run typecheck`;
- existing foundation `npm test` with its result kept separate; and
- `./node_modules/.bin/tsx --test tests/domain/workflow.test.ts`.

The focused tests must cover the primary proposal path, agent-decline branch, tenant-decline branch,
expiry/release, unavailable-slot failure, stale version/generation failure, invalid role/state,
preparation versus send, bounded input validation, role-private projection exclusion, audit/version
continuity, and repeated completed-command idempotency. No browser, SQLite schema, route, login,
deployment, Cloud Receiver, WebMCP, Redis, or WebRTC claim is part of this Work Order.

#### T2 handoff record

The Builder returned `READY_FOR_VERIFICATION`. Main-thread review found one projection isolation
defect: the tenant-visible response aliased the `ProjectionOutcome.state`. A bounded repair changed
only `src/server/domain/projections.ts` and this focused test file, then returned
`READY_FOR_VERIFICATION`. The post-repair T2 source review found exactly these five authored paths:

- `src/server/domain/types.ts`;
- `src/server/domain/errors.ts`;
- `src/server/domain/workflow.ts`;
- `src/server/domain/projections.ts`; and
- `tests/domain/workflow.test.ts`.

The implementation paths were first committed as `186e98a`; the reviewed process/governance and
status writeback was then committed as `a60001e`. Under the accepted path-scoped source-identity
model, `a60001e` is the frozen verification source; any later status/evidence writeback is process-only
and does not change the active product contract. No other writer is active.

T2 checks passed under the exact Node.js `v24.20.0` runtime and npm `11.19.0`:

- `npm ci --no-audit --no-fund`;
- `npm run typecheck`;
- `npm test` — foundation 6/6;
- `./node_modules/.bin/tsx --test tests/domain/workflow.test.ts` — domain 12/12; and
- `git diff --check`.

#### T3 independent verification result

The independent Verifier was dispatched against frozen source commit `a60001e` using the accepted
path-scoped identity model. It returned `NEEDS_REPAIR`, not `VERIFIED`: after creating a draft against
listing version `1`, it changed the published listing to version `2`, then confirmed that both
`UPDATE_REQUEST_DRAFT` and `SUBMIT_REQUEST` still succeeded with `expectedListingVersion: 1`. This
violates the current-listing revision guard and the stale-write failure contract. The main thread
reproduced the same result independently against the exact frozen source.

The Verifier also confirmed the exact Node.js/npm identity, clean-install contract, typecheck,
foundation 6/6 tests, domain 12/12 tests, projection detachment and idempotency probes, forbidden-path
and sensitive-content scans, and absence of authored source changes during verification. The reported
Pilot Runbook hash drift is intentional main-thread process-only writeback after dispatch and is not a
product-code failure. No verification claim is closed at this checkpoint.

The next checkpoint is a bounded Repairer limited to `src/server/domain/workflow.ts` and
`tests/domain/workflow.test.ts`: enforce the current published-listing version guard for both draft
update and submit, and add regression coverage that stale revision `1` fails after the listing reaches
revision `2` with state unchanged. Fresh independent verification remains required afterward.

The independent Verifier was dispatched against the frozen source and returned `NEEDS_REPAIR`. The Builder and Repairer did not run a build/server smoke,
API, persistence, UI, browser, deployment, WebMCP, Cloud Receiver, Redis, or WebRTC check because
those are outside this Work Order.

#### Bounded repair record

The existing Builder task performed the bounded Repairer checkpoint without changing the declared
authority or scope. It added current published-listing version checks to both `UPDATE_REQUEST_DRAFT`
and `SUBMIT_REQUEST`, while retaining the request-stored listing-version guard, and added deterministic
regression coverage proving that listing version `1` → `2` causes both stale commands to return
`STALE_VERSION` with state unchanged. Only `src/server/domain/workflow.ts` and
`tests/domain/workflow.test.ts` changed. The repair was committed as `6e70c9f` on top of the T2
source; the exact post-repair source is now frozen and assigned for fresh independent verification.

The Repairer reported exact Node.js `v24.20.0`, npm `11.19.0`, typecheck pass, foundation 6/6,
domain 13/13, `git diff --check` pass, no forbidden integration references or secret material, and
no external artifacts. This is Repairer self-check evidence only; it is not independent verification.

#### Fresh T3 verification record

The existing independent Verifier re-ran this checkpoint against frozen post-repair commit
`6e70c9fe20ad169e4b4082875c8e625bef0f6040` and returned `VERIFIED`. It confirmed the exact Node.js
`v24.20.0`/npm `11.19.0` identity and `process.execPath`, approved package and lockfile versions,
`npm ci --no-audit --no-fund`, typecheck, foundation 6/6, domain 13/13, `git diff --check`, and the
forbidden-integration, sensitive-production, and CJK scans.

Its acceptance probe changed the current published listing from version `1` to `2` and confirmed that
both `UPDATE_REQUEST_DRAFT` and `SUBMIT_REQUEST` with expected version `1` return `STALE_VERSION` with
full state unchanged. Fresh matching versions still succeed; existing transitions, slot lifecycle,
expiry, role/assignment/state guards, projections, idempotency, audit continuity, and serializable
errors remain covered. No authored path changed during verification. Generated output stayed within
ignored RightSpot paths. This verifies only the bounded domain-core checkpoint, not persistence/API/UI,
browser, deployment, external integration, or parent-Task closure.

### RS-WO-002-04 — Establish the durable workflow and application boundary

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch state:** `GATED` — `RS-WO-002-03` domain core is independently verified at `6e70c9f`; local persistence/application design is accepted in ADR-RS-0006  
**Execution state:** `VERIFIED` — the dedicated Verifier completed the corrected read-only verification against frozen source `28105e4d`
**Owner:** Main RightSpot thread; the dedicated supporting task performs the read-only verification checkpoint
**Objective:** Persist the complete serializable `WorkflowState` in a deterministic local SQLite
snapshot and expose one narrow application service above the verified domain core. Prove durable
refresh-visible workflow continuity and atomic command/reset behavior without exposing HTTP, UI,
authentication, or external integration yet. This Work Order is governed by
[ADR-RS-0006](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md).
**Dispatch state:** The original Builder prompt was sent to supporting thread `01a05a6e-5758-7961-b774-53c332e685ef`,
whose persisted identity/title was `RS-WO-002-01 — Foundation…`, while the prompt identified
`RS-WO-002-04`; that handoff remains procedurally invalid. The main thread reviewed and adopted the
exact three-path candidate at T2 commit `68bbc69`. The first dedicated Verifier dispatch was acknowledged
against frozen source `28105e4d`, but its prompt incorrectly expected a nested `WebMCP_Challenge` directory
inside the Git Worktree and stopped before reading candidate source. One corrected follow-up to the same
identity-matching Verifier then returned `VERIFIED` against frozen source `28105e4d`. The user-authorized
Side Chat learning file and process-only Pilot Runbook writeback are not product source drift.  
**Corrective execution mode:** Dedicated isolated Worktree from frozen repository commit `28105e4d`,
which contains the adopted T2 implementation commit `68bbc69`; no product writer is active.  
**Next gate:** `RS-WO-002-05` is the next bounded tenant entry and listing discovery API slice. Do not
open the full API/UI surface as one assignment. A fresh Builder is required only if a later
checkpoint identifies a source gap requiring a new bounded implementation.

#### Dispatch identity incident

The persisted supporting task was originally activated for `RS-WO-002-01` and retains that title and
history. A later `send_message_to_thread` delivered a prompt whose content was `RS-WO-002-04`; the
content scope was bounded correctly, but the supporting-task identity did not match the Work Order.
This is a process/provenance defect, not evidence that the implementation behavior is wrong. The
three intended implementation paths were preserved, reviewed, and committed as the unverified T2
candidate `68bbc69`; they were not treated as independently verified until the corrected dedicated
Verifier completed.

During the same period, the user-authorized Side Chat created the non-canonical learning record and
made a process-only Pilot Runbook writeback. Those paths are recorded as an auxiliary process lane;
they do not invalidate the product execution baseline, provided they do not change the Work Order's
contract, semantic read set, or implementation paths.

#### Resolved blocker report

- **Status:** resolved checkpoint blocker; `PROGRESSING` parent execution posture
- **Affected owner:** `RS-WO-002-04` Builder handoff, adjudicated by the Main RightSpot thread
- **Evidence:** the persisted destination retains the `RS-WO-002-01` title/history while the delivered
  prompt identifies `RS-WO-002-04`; main-thread review found the exact three intended implementation
  paths and committed them at T2 `68bbc69`
- **First failing boundary:** supporting-task identity/provenance, before T2 source handoff
- **Failure class:** process/ownership defect
- **Blocked claim/dependency:** the original clean `RS-WO-002-04` Builder handoff was invalid; the
  corrected dedicated verification has now completed
- **Impact on parent goal:** the original phase-4 checkpoint was held until candidate adoption; the
  provenance blocker is resolved, while the overall MVP goal remains in progress
- **Safe continuation:** main-thread architecture, UI/UX, code-quality, verification-matrix, and
  process analysis, or another explicitly bounded slice with a disjoint stable boundary
- **Forbidden continuation:** downstream code that depends on this persistence/application output,
  verification against the misidentified source, or any contract/acceptance change used to bypass it
- **Recommended recovery:** completed by preserving and reviewing the candidate, establishing T2
  source `68bbc69`, and preparing a dedicated matching verification task and isolated Worktree
- **Resume condition:** satisfied by the corrected dedicated Verifier returning `VERIFIED` against
  frozen source `28105e4d`; downstream work still requires its own bounded design and verification

#### Candidate-adoption record

- **Adoption basis:** the original writer had stopped; the exact Work Order write set contained all
  authored changes; the candidate matched the declared inputs and acceptance criteria; and the main
  thread reproduced the focused checks.
- **Adopted paths:** `src/server/persistence/workflow-store.ts`,
  `src/server/application/workflow.ts`, and `tests/application/workflow.test.ts` only.
- **Evidence:** Node.js `v24.20.0`, npm `11.19.0`, typecheck, foundation tests `6/6`, application tests
  `8/8`, repository validators, sensitive scan, and staged `git diff --check` passed.
- **Source identity:** local Git commit `68bbc69`; no external push or deployment was performed.
- **Claim limit:** after the T3 result below, this is an independently verified local
  persistence/application boundary. It does not claim API/UI integration, browser behavior,
  deployment, or parent-task closure.

#### Verification dispatch path blocker

- **Status:** resolved `BLOCKED` checkpoint; `PROGRESSING` parent execution posture
- **Affected owner:** the dedicated `RS-WO-002-04` Verifier handoff, adjudicated by the Main RightSpot thread
- **Evidence:** the detached Worktree existed at the expected commit and was clean, but the prompt
  incorrectly required a second `WebMCP_Challenge` directory inside that Worktree; the Verifier
  reported that expected nested root was missing and ran no source checks
- **First failing boundary:** checkout path resolution before candidate diff or test execution
- **Failure class:** `PROCESS_DEFECT`
- **Blocked claim/dependency:** independent verification of the adopted persistence/application candidate
- **Impact on parent goal:** only the `RS-WO-002-04` verification claim was held; the parent goal and
  independent main-thread analysis remained viable
- **Safe continuation:** correct the prompt path, preserve the frozen Worktree, and continue bounded
  main-thread architecture, review, research, or process work
- **Forbidden continuation:** use the main checkout as a substitute, alter the frozen Worktree, or
  classify the unexecuted verification as a code failure
- **Recommended recovery:** completed by sending one concise path clarification to the same correctly
  identified Verifier; no duplicate Work Order was created and the full assignment was not resent
- **Resume condition:** satisfied when the Verifier confirmed the Worktree itself was the Git root and
  executed the unchanged RS-WO-002-04 verification contract

#### T3 independent verification result

The corrected follow-up to the same identity-matching dedicated Verifier returned `VERIFIED` against
frozen source commit `28105e4d81b5432e8e2bbf53b783732356bd9380`. The Worktree itself was confirmed as
the Git root, with detached HEAD and clean authored state. The candidate diff from `68bbc69^` to
`68bbc69` contained exactly the three declared paths:

- `src/server/application/workflow.ts`;
- `src/server/persistence/workflow-store.ts`; and
- `tests/application/workflow.test.ts`.

The exact Node.js `v24.20.0` and npm `11.19.0` runtime identity was confirmed. `npm ci --no-audit
--no-fund`, `npm run typecheck`, `npm test` (foundation `6/6`),
`node ./node_modules/tsx/dist/cli.mjs --test tests/application/workflow.test.ts` (`8/8`), and
`git diff --check` all passed. Candidate static inspection passed for durable singleton file-backed
`node:sqlite` persistence, close/reopen continuity, command idempotency, stale request/listing guards
without mutation, role projections and persisted expiry, atomic command/reset rollback and generation
semantics, neutral corrupt-snapshot failure, and exclusion of HTTP/UI/auth/external service,
Cloud Receiver, WebMCP, Redis, WebRTC, ORM, migration framework, and in-memory fallback.

No authored paths changed during verification. Generated output stayed within the Worktree's ignored
RightSpot paths: `node_modules/` and `var/test/*.sqlite`; no `.next/`, `*.tsbuildinfo`, `/tmp`, or
other external output was observed. One supplementary static-scan command initially failed due to
Verifier shell quoting and executed no check or write; the Verifier completed the contract readback
with a simplified read-only command. This procedural deviation does not weaken the recorded passing
checks, but the claim remains limited to this local persistence/application boundary. It does not
verify API/UI integration, browser behavior, deployment, production multi-process behavior, Cloud
Receiver/WebMCP compatibility, or parent-task closure.

#### Scope and ownership

**Read set:** RightSpot `RUNBOOK.md`, `Docs/00-current-status.md`, `Docs/03-system-design.md`,
`Docs/04-domain-and-data-model.md`, `Docs/05-api-and-integration-contracts.md`,
`Docs/06-validation-and-evidence.md`, ADR-RS-0001 through ADR-RS-0006, the existing foundation
modules, and all verified domain/projection modules.

**Worker write set — exact authored paths:**

- `WebApp/Web-Right_Spot/src/server/persistence/workflow-store.ts`;
- `WebApp/Web-Right_Spot/src/server/application/workflow.ts`; and
- `WebApp/Web-Right_Spot/tests/application/workflow.test.ts`.

**Main-thread orchestration writeback set:** current status, roadmap, task index, this Task File,
and Runbook process/evidence sections only. The main thread may record lifecycle and evidence but
must not change this Work Order's objective, acceptance criteria, runtime, dependencies, authority,
or path sets while the Builder is active.

**Auxiliary process-only set:** user-authorized Side Chat may update the non-canonical learning
record `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-LEARNINGS.md` and the process-only
sections of `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`. These paths are
outside the product execution source; they must not change product code, contract, authority,
acceptance criteria, runtime, dependencies, or the worker's semantic read set. The main thread
classifies and promotes any resulting rule.

**Forbidden set:** all existing domain files under `src/server/domain/`; foundation files under
`src/server/persistence/sqlite.ts`, `src/server/persistence/reset.ts`, and
`src/server/application/health.ts`; app pages/routes; package manifests and lockfile; config; ADRs
and product/domain contracts; `scripts/reset-db.ts`; Git index; any path outside RightSpot; and
any commit, push, deploy, publish, external message, or follow-on dispatch. No `reentry-core`, Cloud
Receiver, WebMCP, Redis, WebRTC, ORM, migration framework, external SQLite package, auth provider,
or in-memory fallback.

**Generated set:** only existing ignored RightSpot output (`node_modules/`, `.next/`,
`*.tsbuildinfo`, `var/rightspot.sqlite*`, and isolated `var/test/` files). No external `/tmp`, home,
or broad temporary output; do not delete pre-existing artifacts.

#### Implementation contract

- Reuse the existing server-only `node:sqlite` foundation and default database path. The workflow
  store owns one singleton, versioned snapshot table for serialized `WorkflowState`; it must not
  create a second database or normalized business-table family in this checkpoint.
- On first open, seed a missing snapshot from the verified domain fixture at the current foundation
  generation. A present corrupt, incompatible, or unparseable snapshot must fail visibly with a
  neutral persistence error; never silently replace it or fall back to memory.
- Provide durable read, command-apply, projection-read, and development-reset behavior. Domain
  transitions and role authorization remain delegated to `executeCommand`, `evaluateExpiry`,
  `readTenantProjection`, and `readAgentProjection`; the store owns serialization and transaction
  boundaries only.
- A command application and any resulting expiry write must be atomic. A rejected command must not
  persist a mutation unless the domain evaluation itself produced a permitted expiry transition.
  Transaction failure must roll back and must not leak SQL, paths, stack traces, credentials, or
  private role context.
- Reset must preserve the established first-reset generation semantics, write a fresh deterministic
  seeded snapshot, update the foundation generation and snapshot atomically, and never delete or
  recreate the database file.
- The application service must accept explicit actors, commands, and injected time; expose tenant
  and assigned-agent projections through the verified projection layer; and avoid duplicating any
  workflow rule. It must not choose arbitrary state, trust client-provided state, or implement a
  session/authentication provider.
- Keep returned states and projections detached from the stored snapshot. Do not persist role-
  specific projections as separate competing records.

#### Acceptance criteria

- Fresh isolated database open creates the workflow snapshot at the current foundation generation
  with the deterministic seeded listings/slots, no request, empty audit, and no processed commands.
- A successful `CREATE_REQUEST_DRAFT` and `SUBMIT_REQUEST` through the application boundary survive
  store close/reopen with the same request state, version, listing revision, audit facts, and command
  idempotency record.
- A stale request or listing revision, invalid actor, invalid transition, unavailable slot, and
  bounded-input failure return the verified domain error and leave durable business state unchanged.
- Repeating the same completed command after reopen is idempotent and does not add a second audit
  fact or consequence; conflicting reuse fails without mutation.
- A sent proposal that expires on a relevant persisted read transitions to `EXPIRED`, releases the
  exact held slot, increments the request version once, and survives reopen with the expiry fact.
- The development reset returns generation `1` on a fresh store and increments exactly once on each
  later successful reset, leaves no request, and remains visible after reopen. Failed reset rolls
  back without a partial generation or snapshot update.
- Tenant and agent projection reads preserve role authorization and private-note exclusion. Corrupt
  snapshot input fails visibly without a fallback or diagnostic leakage.
- The focused tests run against isolated file-backed SQLite paths and prove no authored files outside
  the three-path worker write set changed. No route, browser, API wire format, UI, login, deployment,
  Cloud Receiver, WebMCP, Redis, or WebRTC behavior is claimed.

#### Required verification and return

Use exact Node.js `v24.20.0`, npm `11.19.0`, and
`/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node`. Run `npm run typecheck`,
`npm test` with foundation count separate, `./node_modules/.bin/tsx --test tests/application/workflow.test.ts`,
and `git diff --check`. Inspect status and diff by ownership class. The Builder must not run or
start the independent Verifier and must not edit canonical documents. Return exactly one of
`READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or `BLOCKED` with source identity, changed/generated
paths, runtime, commands/results, transaction/reset evidence, skipped claims, residual risks, and
the narrow claim boundary. A Builder report never means independent verification or parent closure.

#### Stop conditions and report

Stop and return `BLOCKED` if the accepted business rules or domain authority need to change, an exact
path cannot be kept isolated, a new dependency or persistence/API decision is required, or another
writer appears. Do not add fixtures to the SQLite foundation, wire the kernel into a route, implement
authentication, or start the tenant/agent UI. Return a supporting-thread report beginning with
`READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or `BLOCKED`, listing exact changed/generated paths,
commands/results, skipped claims, residual risks, and the boundary of the claim. Do not edit canonical
documents, commit, push, deploy, or start the Verifier.

### RS-WO-002-05 — Establish the local tenant entry and listing discovery API

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — `RS-WO-002-04` is independently verified against frozen source `28105e4d`; the synthetic listing discovery decision is accepted in ADR-RS-0007  
**Execution state:** `READY_FOR_VERIFICATION` — dedicated Builder returned the required handoff state and the candidate is frozen for independent verification  
**Owner:** Main RightSpot thread; one dedicated supporting task performs each bounded checkpoint  
**Risk profile:** `Assured` — cross-layer read authority, demo session boundary, and Next.js route adapters  
**Objective:** Make the first tenant-facing entry and discovery capability runnable through a bounded
local demo session and tenant-authorized JSON API. The slice must expose the deterministic synthetic
listing catalogue and detail facts from one application read boundary, without implementing request
commands, agent operations, UI pages, or external authentication. This Work Order is governed by
[ADR-RS-0007](../Decisions/ADR-RS-0007-synthetic-listing-discovery-boundary.md).
**Dispatch state:** Dispatched from clean detached source baseline `9ff14dead8f5dda77fa53e250029cdee2c45f925`;
the dedicated Worktree is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-05-builder`, whose root is
the Git root and whose initial state is detached and clean. The supporting-task identity is dedicated
to this Work Order and is not an existing-task follow-up. The Builder candidate was committed in that
Worktree at `eb659f4` and integrated by the main thread at T2 code commit `de169ce`; no independent
verification or parent closure claim is made.  
**Next gate:** Dispatch a dedicated independent Verifier against the frozen candidate, then classify
the result before integration. The read-only `RS-WO-002-06` Architecture Advisor may run in parallel
against the same stable candidate; no tenant/agent UI Builder opens from this brief alone.

#### Builder handoff and T2 source freeze

The dedicated Builder returned `READY_FOR_VERIFICATION`. The main thread inspected the actual
Worktree and confirmed exactly the 14 declared worker paths changed, with no package, persistence,
canonical-document, UI, external-service, or forbidden-path change. The Builder candidate is now
frozen as local code source `de169ce` on `main` (originating from worker commit `eb659f4`); the
canonical lifecycle writeback is owned by the main thread.

Builder evidence recorded for the handoff:

- Node.js `v24.20.0` and npm `11.19.0` using the approved absolute runtime path;
- `npm ci --no-audit --no-fund` passed with 33 packages installed;
- `npm run typecheck` passed;
- the existing foundation aggregate passed `6/6`;
- focused domain/application/API coverage passed `35/35` after one over-specific test-message
  assertion was narrowed to the public status/code contract;
- `npm run build` passed and recognized all three dynamic routes;
- built-server smoke passed for tenant session `200`, filtered collection `200`, detail `200`,
  agent access `403`, and no assignment exposure; and
- `git diff --check` and corrected sensitive/CJK scope scans passed.

The initial sensitive-scan attempt used a zsh-special variable and executed no scan or write; the
corrected read-only scan passed. This is a Builder handoff deviation, not independent evidence.
The claim remains limited to the local discovery/session API candidate; it does not claim independent
verification, browser/UI behavior, request or agent operations, deployment, WebMCP, Cloud Receiver,
Redis, WebRTC, or parent-task closure.

#### Independent Verifier checkpoint

**Execution state:** `VERIFIED` — the dedicated independent Verifier reproduced the checkpoint and
returned `VERIFIED` against the frozen source snapshot  
**Parallelization:** `READ_ONLY_PARALLEL` with `RS-WO-002-06`; the Verifier reads the frozen candidate
while the Advisor reads the same stable source in a separate Worktree  
**Source snapshot:** canonical checkout commit `bc3bc42`, containing the frozen T2 code candidate
`de169ce` plus the main-thread documentation writeback; no code or test source follows `de169ce`  
**Verifier Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-05-verifier` (detached at
`bc3bc42`, clean at preparation)  
**Supporting-task identity:** `01a05b41-736c-78c0-87e0-5a8e0ae80c53` (`local`), dedicated to this
Verifier checkpoint and not reused from an earlier Work Order  
**Worker write set:** none; the Verifier must not repair, edit tests, regenerate fixtures, or modify
canonical documents  
**Next gate:** Main-thread canonical writeback may close this discovery checkpoint. The next
implementation boundary remains gated on review of `RS-WO-002-06`; this verification does not by
itself authorize a UI Builder.

The Verifier must independently inspect the exact source snapshot and reproduce the declared runtime,
typecheck, foundation and focused checks, production build, route/API smoke, scope/path, and
no-mutation evidence. It must distinguish source or procedure defects from environment failures,
must not accept Builder prose as proof, and must not claim browser/UI, request, agent, deployment,
WebMCP, Cloud Receiver, Redis, WebRTC, or parent closure. Any failure must include the first failing
command or observation, exact source identity, affected claim, classification, and the bounded repair
or decision condition.

#### Independent verification result

The Verifier returned `VERIFIED` from the detached Worktree at
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-05-verifier`, HEAD
`bc3bc42834004d71f5b08080b5aed29f2ecb482e`, with a clean tree before and after checks. It confirmed
the frozen code commit `de169ce8ff01586f8e7071c159433eb0d01cf6b6` changed exactly the declared 14
paths, while the documentation-only commits after it changed no code, tests, or package files.

Independent evidence: Node.js `v24.20.0`, npm `11.19.0`, `npm ci --no-audit --no-fund`, typecheck,
foundation tests `6/6`, focused discovery files `27/27`, affected five-file suite `35/35`, production
build, and built-server smoke all passed. Smoke covered tenant session/listing reads, filters,
published and unknown/unpublished detail, agent `403`, missing/forged session `401`, invalid input
`400`, logout, persistence failure `503`, no-mutation, and tenant response privacy. No additional
dependency or forbidden scope was found; only documented ignored generated output was present.

The claim is limited to the local tenant entry, demo-session, and listing discovery/detail API
checkpoint. Browser/UI, request-command transport, agent queue/response, deployment, WebMCP, Cloud
Receiver, Redis, WebRTC, production authentication, and parent closure remain unverified. The
supporting task did not edit source, tests, documents, or Git state.

#### Scope and ownership

**Read set:** Repository `AGENTS.md` and Engineering controls, RightSpot `RUNBOOK.md`,
`Docs/00-current-status.md`, `Docs/02-requirements.md`, `Docs/03-system-design.md`,
`Docs/04-domain-and-data-model.md`, `Docs/05-api-and-integration-contracts.md`,
`Docs/06-validation-and-evidence.md`, ADR-RS-0001 through ADR-RS-0007, the verified domain,
persistence, and application modules, and the parent Task File.

**Worker write set — exact authored paths:**

- `src/server/domain/types.ts`;
- `src/server/domain/workflow.ts`;
- `src/server/domain/projections.ts`;
- `src/server/application/workflow.ts`;
- `src/server/application/listings.ts`;
- `src/server/application/demo-session.ts`;
- `src/server/application/http.ts`;
- `app/api/session/route.ts`;
- `app/api/listings/route.ts`;
- `app/api/listings/[listingId]/route.ts`;
- `tests/domain/workflow.test.ts`;
- `tests/application/listings.test.ts`;
- `tests/application/demo-session.test.ts`; and
- `tests/api/listings.test.ts`.

New paths are permitted only where listed above. The Builder may choose exact exported function names
inside those paths, but must preserve the stated route and DTO contracts.

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
and `RUNBOOK.md`. The main thread owns lifecycle, evidence, source-freeze, integration, and Git
closure writeback; the Builder must not edit them.

**Forbidden set:** all package manifests and lockfiles; `app/page.tsx` and `app/layout.tsx`; health,
reset, and SQLite foundation modules; workflow persistence modules; request command behavior beyond
the existing verified domain; agent queue or response operations; canonical documents and ADRs;
scripts; Git index; any path outside RightSpot; and Cloud Receiver, WebMCP, Redis, WebRTC, ORM,
migration framework, external auth provider, external property/media service, or in-memory business
state.

**Generated set:** only existing ignored RightSpot output (`node_modules/`, `.next/`,
`*.tsbuildinfo`, `var/rightspot.sqlite*`, and isolated `var/test/` files). No `/tmp`, home-directory,
or external output is permitted.

#### Product and API contract

- Extend the persisted synthetic `Listing` record with only the ADR-RS-0007 fields: title, synthetic
  address, area, monthly rent in GBP, bedroom count, size in square metres, available-from date,
  bounded description, and local `imageKey`. Keep exactly three published deterministic fixture
  listings and preserve listing version and agent assignment semantics.
- Add a tenant-safe application read boundary for listing collection and detail. It must accept only
  the seeded tenant actor, return published listings in fixture order, support bounded `area`,
  `maxRent`, `minSizeSqM`, and `availableFrom` filters, return `NOT_FOUND` for unknown/unpublished
  detail, and omit `assignedAgentId` from tenant DTOs. Reads must not alter request, audit, version,
  expiry, or fixture state.
- Add a deliberately bounded demo session resolver with an allowlist for the seeded tenant and agent
  identities. The session is a local demonstration mechanism, not production authentication: no
  passwords, registration, signing keys, external provider, or client-trusted arbitrary role token.
- Expose `POST /api/session` with body `{"role":"tenant"|"agent"}`, `GET /api/session`, and
  `DELETE /api/session`. Use one HttpOnly, SameSite=Lax, Path=/ cookie with a bounded local lifetime;
  accept only server-issued allowlisted demo values, return `401` when absent/invalid, and return
  bounded JSON without credentials or diagnostics.
- Expose `GET /api/listings` and `GET /api/listings/:listingId`. Both require a valid tenant demo
  session; an agent session returns `403`. Use a thin route adapter over the application read
  boundary. Return deterministic JSON containing the fixture generation and tenant-safe listing data;
  do not expose agent assignment or internal workflow state.
- Map malformed filters/body, unauthenticated access, forbidden role, missing listing, and persistence
  failure to visible bounded responses (`400`, `401`, `403`, `404`, and `503` respectively) with no
  stack traces, SQL, filesystem paths, cookies, or private role context. Do not add a generic fallback
  response that masks an unsupported or failed operation.

#### Acceptance criteria

- A fresh application read returns exactly three deterministic published listing records with stable
  titles, areas, rental facts, available dates, descriptions, and local image keys; no external URL
  or live property data is required.
- Tenant listing collection supports the four bounded filters, preserves fixture order, excludes
  unpublished entries, rejects invalid filter values visibly, and never mutates the workflow state.
- Tenant detail returns the same authoritative revision and discovery facts for a published listing;
  unknown or unpublished detail returns `NOT_FOUND` without mutation.
- Tenant-facing listing DTOs omit `assignedAgentId`; the existing tenant request projection remains
  role-safe and the agent projection retains only its authorized assignment context.
- Valid demo session selection resolves exactly one seeded actor; invalid or forged cookie values do
  not grant a role, switching requires a new session action, and logout clears the cookie.
- The two listing routes consume the application boundary, enforce the session role, return the
  declared status/error shape, and do not create a request or write an audit entry.
- Existing foundation and workflow behavior remains green, including exact listing revision checks,
  reset generation, role authorization, and durable workflow persistence.
- Focused tests cover metadata validation, filters, detail/role isolation, session lifecycle, route
  error mapping, and no-mutation behavior. No request-command, agent-queue, UI, browser, deployment,
  Cloud Receiver, WebMCP, Redis, WebRTC, or production-auth claim is made.

#### Required verification and return

Use exact Node.js `v24.20.0`, npm `11.19.0`, and
`/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node`. Run `npm ci --no-audit
--no-fund` only when dependencies are absent, `npm run typecheck`, `npm test` with the foundation
count separate, the focused domain/application/API tests, `npm run build`, and `git diff --check`.
Inspect the exact path set, source identity, generated output, route contracts, and sensitive/CJK
scope before returning. The Builder returns exactly `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or
`BLOCKED` with commands/results, runtime, source identity, changed/generated paths, claim boundary,
and residual risks. The Builder must not edit canonical documents, commit, push, deploy, start the
Verifier, or expand into request/agent/UI behavior.

#### Stop conditions

Stop and return `BLOCKED` if the accepted domain or ADR needs to change, session semantics require
real authentication, route behavior needs a new external dependency, the listing source cannot stay
authoritative and tenant-safe, a declared path is already owned by another writer, or the exact
runtime/output boundary cannot be maintained. Do not weaken role checks, expose the full workflow
snapshot, silently substitute a listing, or add a compatibility fallback.

### RS-WO-002-06 — Design the parallel tenant/agent interface execution set

**Parent task:** `RIGHTSPOT-002`  
**Role:** Architecture Advisor  
**Pre-dispatch status:** `GATED` — the `RS-WO-002-05` candidate is frozen at T2 code commit `de169ce`; the proposal must be reviewed by the main thread before any UI Builder dispatch  
**Execution state:** `INTEGRATED` — the dedicated read-only Architecture Advisor returned
  `READY_FOR_REVIEW`; the main thread accepted the proposal with recorded revisions and incorporated
  its useful boundaries into ADR-RS-0008 and the current Work Orders  
**Parallelization:** `READ_ONLY_PARALLEL` with the `RS-WO-002-05` Verifier; no authored source write  
**Owner:** Main RightSpot thread; one dedicated supporting task produces the bounded proposal  
**Risk profile:** `Standard` — cross-surface decomposition and ownership planning without code mutation  
**Objective:** Produce an evidence-backed decomposition of the ordinary RightSpot Happy Path into
bounded tenant-interface, agent-interface, shared-shell, API, and integration Work Orders. Classify
each dependency as hard, contract, integration, evidence, or shared-write; identify exact route,
page, component, test, and application ownership; and recommend the first safe parallel execution
set for main-thread review.
**Next gate:** The proposal review is complete. `RS-WO-002-07`, `RS-WO-002-08`, and `RS-WO-002-09`
  are the only currently approved follow-on slices; tenant and agent role-page Builders remain gated
  until the transport and shared-shell outputs are frozen and reviewed.

#### Scope and ownership

**Read set:** repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; `Docs/00-current-status.md`; the parent Task File; Requirements; System Design; Domain and
Data Model; API and Integration Contracts; Validation and Evidence; ADR-RS-0001 through ADR-RS-0007;
current source/tests at T2 code commit `de169ce`; and the accepted MVP Happy Path.

**Worker write set:** none. The Advisor returns a proposal in its supporting-task report and must
not edit code, tests, package files, canonical documents, ADRs, the Task File, the Runbook, the Git
index, or any external path.

**Main-thread writeback set:** this Work Order's status/evidence section and, only after review,
the appropriate Task File, Runbook, ADR, roadmap, or non-authoritative design record sections.

**Forbidden set:** implementation, route/page/component creation, API contract mutation, domain or
schema mutation, fixture duplication, UI mock data becoming business authority, dispatching another
task, Git commit/push, deployment, external communication, and Cloud Receiver, WebMCP, Redis,
WebRTC, production-auth, or unrelated commercial scope.

**Generated set:** none; no authored or generated output is needed beyond the supporting-task report.

**Dispatch state:** Dispatched from clean detached source snapshot `bc3bc42`; the dedicated Worktree is
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-06-advisor`; supporting-task identity is
`01a05b41-6b73-7751-86bd-c59d270d43a3` (`local`). No source or document write is authorized.  

#### Proposal contract

The Advisor must return:

- verified current-state facts and their source identity;
- tenant and agent user-journey decomposition, including page and route ownership;
- shared-shell and shared-component ownership with a single writer for each shared path;
- API/application/domain consumers and stable contracts each surface may consume;
- a dependency matrix using hard, contract, integration, evidence, and shared-write categories;
- exact proposed Work Order boundaries, read sets, write sets, forbidden sets, generated sets, and
  integration owner/order;
- the recommended first parallel set and why each member passes the parallelization gate;
- the conditions that would force serialization, re-baselining, repair, or rework;
- acceptance criteria and non-goals for each proposed Builder slice;
- challenge of any current rule or decomposition that is unnecessarily strict; and
- one recommendation, alternatives considered, residual risks, and the next main-thread decision.

The proposal must preserve one authoritative domain/application source, must not claim that a
contract-based UI slice is integrated or verified, and must keep the accepted rental-only MVP and
ordinary human Happy Path as the scope boundary.

#### Verification and return

The Advisor must confirm the actual checkout/root and T2 source identity, use read-only inspection,
and distinguish verified facts, inferences, recommendations, and unresolved decisions. It returns
`READY_FOR_REVIEW` when the bounded proposal is complete or `BLOCKED` when the authority, source, or
scope cannot be established. `READY_FOR_REVIEW` is not code verification and does not authorize a
Builder or integration by itself.

#### Main-thread adjudication

The main thread reviewed the completed proposal against the live repository, the independently
verified discovery API, and the accepted MVP boundary. The following conclusions are accepted:

- role-specific UI is genuinely parallelizable once it consumes a stable HTTP/DTO contract and owns
  disjoint route/page/component paths; zero logical relationship is not required for parallel work;
- the ordinary local workflow transport must be frozen before tenant and agent pages are opened;
- the shared shell is a separate bounded consumer of the already verified demo-session endpoints;
- public DTOs must be explicit role-safe views rather than raw `WorkflowState`, `TenantProjection`,
  or `AgentProjection`; and
- normal empty tenant-request and agent-queue states are successful empty results, not errors.

The main thread revised or rejected the following parts of the proposal:

- use the Runbook's canonical parallelization classes only: `SERIAL`, `CONTRACT_PARALLEL`,
  `READ_ONLY_PARALLEL`, and `INTEGRATION_SERIAL`;
- do not pre-register a speculative queue of future Work Orders; only the three current slices below
  are admitted;
- do not dispatch complete tenant and agent page Builders yet; their implementation starts only
  after the workflow transport and shared shell reach T2 and pass main-thread review;
- allow the workflow transport Builder to make a minimal, actor-checked nullable read/queue adapter
  in `src/server/application/workflow.ts` if the existing non-null projection methods cannot express
  the accepted empty-state contract, without changing domain or persistence authority; and
- do not add a UI kit, browser-test dependency, external service, or UI-owned business-state mock.

The accepted contract is [ADR-RS-0008](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md).
The three interface Work Orders below were dispatched from the same clean baseline. Their exact
source identities and supporting-task identities are recorded below. The two implementation slices
are now independently verified and integrated; the read-only review is integrated as guidance.

### RS-WO-002-07 — Implement the ordinary workflow HTTP and DTO boundary

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — ADR-RS-0008 is accepted; the discovery API and its independent
verification are complete  
**Execution state:** `INTEGRATED` — candidate `d71fe3e` passed dedicated independent verification
and was cherry-picked into the main branch at `f700ba9`  
**Parallelization:** `CONTRACT_PARALLEL` with `RS-WO-002-08`; `READ_ONLY_PARALLEL` with
`RS-WO-002-09`  
**Owner:** Main RightSpot thread; one dedicated Builder followed by one dedicated independent
Verifier  
**Risk profile:** `Assured` — cross-layer transport, role authorization, privacy, and durable
workflow command/read composition  
**Objective:** Implement only the frozen ordinary local workflow HTTP routes and role-safe DTOs over
the existing domain, application, session, and persistence authority. The result must make the
tenant request and agent response operations callable by a human UI without adding UI, a second
business state, or an external integration.  
**Next gate:** Canonical writeback is complete for this Work Order. Its routes, DTOs, and application
boundary are now stable inputs for the bounded tenant and agent role-page Work Orders; no further
writer is open under this Work Order.  
**Dispatch state:** Dispatched from clean detached source `c758634aa5d046e089e051ee74e463756b73a202`;
execution Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-07-workflow-http`; supporting-task
identity `01a05b57-e509-7392-90dd-09b056b463d7` (`local`). The initial task activation and the full
Work Order prompt were persisted to this dedicated task; no source write was authorized before the
main-thread acknowledgement. The application/package root is the Worktree-relative
`WebApp/Web-Right_Spot`; a follow-up correction was sent after the Builder identified an initial
checkout-root/npm-root confusion, which only created external npm diagnostics and did not change the
repository. The Builder then returned `READY_FOR_VERIFICATION`; main-thread T2 review committed the
exact 15 authored paths at `d71fe3e`. The independent Verifier was dispatched in Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-07-verifier` with supporting-task identity
`01a05b70-3a9a-7d50-af83-e71c5cfa0da7` (`local`) and returned `VERIFIED`; the main thread
cherry-picked the frozen candidate into main at `f700ba9`. The verifier reported exact Node
`v24.20.0`/npm `11.19.0`, typecheck, foundation `6/6`, focused workflow `9/9`, full direct suite
`50/50`, build, built-server HTTP smoke, role/error/privacy/conflict/no-mutation checks, and a clean
exact-path audit. The package-root `.node-version` was absent because the runtime pin is at the
execution Git root; the verifier used the prepared absolute runtime explicitly. No source write was
authorized during verification.  
**Parent execution posture if blocked:** `PROGRESSING` — this Work Order is integrated; role-page
design and bounded dispatch may proceed against its frozen contract.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; `Docs/00-current-status.md`; the parent Task File; Requirements; System Design; Domain and
Data Model; API and Integration Contracts; Validation and Evidence; ADR-RS-0001 through ADR-RS-0008;
and the verified session, listing, workflow, projection, and persistence modules and tests.

**Worker write set — exact authored paths:**

- `src/shared/contracts/workflow-api.ts`;
- `src/server/application/workflow-views.ts`;
- `src/server/application/workflow-http.ts`;
- `src/server/application/workflow.ts` — only a minimal actor-checked nullable tenant-request or
  agent-queue read method if the existing non-null projection methods cannot express ADR-RS-0008;
- `app/api/tenant/request/route.ts`;
- `app/api/tenant/request/submit/route.ts`;
- `app/api/tenant/request/confirm/route.ts`;
- `app/api/tenant/request/decline/route.ts`;
- `app/api/agent/requests/route.ts`;
- `app/api/agent/requests/[requestId]/route.ts`;
- `app/api/agent/requests/[requestId]/review/route.ts`;
- `app/api/agent/requests/[requestId]/preparation/route.ts`;
- `app/api/agent/requests/[requestId]/send/route.ts`;
- `tests/application/workflow-views.test.ts`; and
- `tests/api/workflow.test.ts`.

No other authored path may be added. The Builder owns implementation tests directly necessary for
this boundary, but not a new aggregate test script or a new testing dependency.

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
`Docs/05-api-and-integration-contracts.md`, ADR-RS-0008, and `RUNBOOK.md`. The Builder must not edit
these files.

**Auxiliary process-only set:** none.

**Forbidden set:** `src/server/domain/**`; `src/server/persistence/**`; existing session, listing,
and health route or application source; `app/layout.tsx`; `app/page.tsx`; UI components and styles;
package manifests, lockfiles, fixtures, scripts, Git index, canonical documents; external services;
Cloud Receiver, WebMCP, Redis, WebRTC media, ORM, migration framework, production auth, and any
commercial scope. No commit, push, deploy, publication, or dispatch of another task is allowed.

**Generated set:** existing ignored RightSpot output (`node_modules/`, `.next/`, `*.tsbuildinfo`,
`var/rightspot.sqlite*`) and uniquely named workflow test databases under
`var/test/`. No `/tmp`, home-directory, or external output is allowed.

#### Dependencies and assumptions

- ADR-RS-0008 is the frozen local route, body, DTO, empty-state, error, freshness, and UI-consumer
  contract.
- `WorkflowApplication.applyCommand`, the verified projections, the bounded demo session, and the
  durable workflow store remain the only business authorities.
- If a safe nullable read cannot be added without changing domain or persistence behavior, stop and
  return `BLOCKED` with the smallest required main-thread decision; do not expose raw state or invent
  a UI fallback.
- If the contract, actor policy, fixture identity, or domain transition must change, stop for
  re-baselining rather than silently widening this Work Order.

#### Acceptance criteria

- The exact tenant and agent routes in ADR-RS-0008 exist as thin Node-compatible adapters over one
  application boundary; route handlers do not inspect or mutate SQLite directly.
- The server derives actor, role, request identity, listing identity, assignment, state transitions,
  and send kind; client input cannot select a role, actor, arbitrary request identity, assignment, or
  terminal state.
- State-changing bodies are strict allowlists with bounded `commandId`, `fixtureGeneration`, and
  applicable expected request/listing versions. The send route derives the prepared proposal or
  decline command from authoritative state.
- Tenant and agent DTOs are explicit and role-safe. They do not expose raw workflow state, actor IDs,
  processed commands, assignment policy, internal persistence details, or agent-only data to tenants.
- Initial tenant request reads return `200` with `request: null`, `listing: null`, and an empty
  timeline; an empty agent queue returns `200`; an unknown agent detail is `404`.
- Known malformed, unauthenticated, wrong-role/unassigned, missing, conflict/transition/expiry, and
  persistence failures map to the declared `400`, `401`, `403`, `404`, `409`, and `503` contract
  without stack traces, SQL, paths, cookies, credentials, or false success.
- Reads do not mutate request, audit, version, slot, expiry, command, or fixture state. Repeated
  commands preserve the domain idempotency result, while conflicting command reuse remains visible.
- Focused tests cover DTO privacy, empty states, route authorization/error mapping, state-changing
  command forwarding, stale/generation/idempotency behavior, persistence failure, and no-mutation
  reads. Existing foundation, domain, listing, and session checks remain green.
- No UI, WebMCP, Cloud Receiver, Redis, WebRTC media, deployment, production-auth, or parent-closure
  claim is made.

#### Verification and return

Use exact Node.js `v24.20.0`, npm `11.19.0`, and
`/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node`. Run `npm run typecheck`,
the existing foundation `npm test`, direct focused application/API tests with the pinned `tsx`
runner, `npm run build`, and `git diff --check`. Exercise every declared route with session, role,
empty-state, success, conflict, privacy, persistence-failure, and no-mutation checks against an
isolated `var/test/` database. Inspect source identity, exact path ownership, generated output,
sensitive scope, and forbidden imports. Return exactly `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or
`BLOCKED` with source identity, runtime, commands/results, changed/generated paths, skipped checks,
claim boundary, residual risks, and next gate. Do not edit canonical documents, commit, push,
deploy, or start the Verifier.

#### Stop conditions

Stop at `BLOCKED` if the contract requires a domain, persistence, fixture, auth, dependency, or
security decision; if an exact path is already owned; if source drift affects a semantic input; if
the runtime/output boundary cannot be maintained; or if a failure can be hidden only by fallback
state or a second authority. Do not broaden this into tenant/agent UI or future integration.

#### Completed verification and integration record

The dedicated Verifier returned `VERIFIED` against frozen HEAD
`d71fe3e7145ff8d6db1853caa69ae44b1ca47ba3` from the isolated Worktree. It confirmed a clean tree,
exactly the 15 declared authored paths, no forbidden or dependency changes, and no residual
`next-env.d.ts` or external artifact. It independently passed the pinned runtime/package checks,
typecheck, foundation `6/6`, focused workflow `9/9`, full direct suite `50/50`, production build,
and built-server smoke. The HTTP matrix covered authentication and role boundaries, malformed and
unknown bodies, missing requests, stale request/listing and fixture conflicts, invalid transitions,
the tenant-to-agent ordinary flow through tenant confirmation, DTO privacy, persisted preparation
derivation, idempotency, persistence-failure mapping, and no-mutation reads. The initial apparent
missing-detail `503` was traced to verifier setup contamination from repeatedly applying the
foundation-only reset to a database containing a workflow snapshot; clean application reset state
passed the declared `404` contract. The main thread integrated the exact candidate at `f700ba9` and
re-ran main-checkout typecheck, foundation tests `6/6`, and production build successfully. The
remaining claim is limited to the workflow transport/DTO boundary; role-page browser UX and parent
closure remain open.

### RS-WO-002-08 — Build the shared human application shell

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — the verified demo-session endpoints and ADR-RS-0008 shell boundary
are available  
**Execution state:** `INTEGRATED` — the frozen candidate passed dedicated independent verification
and was cherry-picked into the main branch at `006d2fd`  
**Parallelization:** `CONTRACT_PARALLEL` with `RS-WO-002-07`; `READ_ONLY_PARALLEL` with
`RS-WO-002-09`  
**Owner:** Main RightSpot thread; one dedicated Builder followed by one dedicated independent
Verifier  
**Risk profile:** `Standard` — shared presentation ownership and bounded demo-session UX  
**Objective:** Replace the static placeholder with a minimal, accessible, responsive human shell
that can establish and end a bounded tenant or agent demo session. It must provide shared navigation
and status feedback without implementing either role's business pages or owning workflow state.  
**Next gate:** The shared shell is integrated; later tenant/agent role-page Work Orders may consume
its session boundary, but the ordinary workflow remains open and parent closure is not claimed.  
**Dispatch state:** Dispatched from clean detached source `c758634aa5d046e089e051ee74e463756b73a202`;
execution Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-08-shared-shell`; supporting-task
identity `01a05b58-a280-7ca0-8b19-df4bc78da099` (`local`). The Builder returned
`READY_FOR_VERIFICATION`; main-thread T2 review committed the exact eight authored paths at
`52a8f101b4de9f039261dd5c50e3094c8c948ae3`. The independent Verifier is dispatched in Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-08-verifier` with supporting-task identity
`01a05b6a-4f17-7b33-a30c-1d761f1f4192` (`local`). Its first activation stopped before source
checks because the prompt conflated the main checkout root with the execution Worktree root; the
main thread sent a path-identity correction to the same task identity. The Verifier returned
`VERIFIED`; the main thread cherry-picked the frozen product candidate into main at `006d2fd`. No
source write was authorized during verification.  
**Parent execution posture if blocked:** `CONSTRAINED` — workflow transport and UI/UX review may
continue; role-page Builders remain gated.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; parent Task File; Requirements; System Design; API and Integration Contracts;
Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; and the existing session routes and
verified session tests.

**Worker write set — exact authored paths:**

- `app/layout.tsx`;
- `app/page.tsx`;
- `app/globals.css`;
- `src/ui/shared/app-shell.tsx`;
- `src/ui/shared/demo-session-panel.tsx`;
- `src/ui/shared/session-nav.tsx`;
- `src/ui/shared/status-banner.tsx`; and
- `src/ui/shared/session-api.ts`.

No tenant or agent route/page, workflow API, server application, domain, persistence, fixture,
package, or test path is owned by this Builder.

**Main-thread orchestration writeback set:** this Task File, current status, Development records,
the roadmap, API/decision documents, and `RUNBOOK.md`. The Builder must not edit them.

**Auxiliary process-only set:** none.

**Forbidden set:** `app/api/**`; `src/server/**`; `src/shared/contracts/**`;
`app/tenant/**`; `app/agent/**`; tenant/agent business components; package manifests and lockfiles;
external fonts/services/media; fixture or mock business state; canonical documents; Git index;
commit/push/deploy/publication; and Cloud Receiver, WebMCP, Redis, WebRTC media, or production auth.

**Generated set:** existing ignored `.next/`, `node_modules/`, `*.tsbuildinfo`, and uniquely named
`var/test/*.sqlite` files created by the existing test suite. If `next dev` creates the exact
untracked helper files `WebApp/Web-Right_Spot/AGENTS.md` and
`WebApp/Web-Right_Spot/CLAUDE.md`, they are permitted as ephemeral tool output after provenance
inspection; preserve them but do not edit, delete, restore, commit, or promote them into T2 source.
The tracked `next-env.d.ts` is tool-maintained metadata: a transient Next mutation may be observed,
but the Builder must not manually edit, restore, or commit it; a final diff is a stop condition for
main-thread adjudication. No other authored test dependency or external/generated asset is permitted.

**Execution note:** Before this generated-set clarification, the Builder's safety hook blocked an
attempted cleanup of the two Next-generated helper files and the Builder restored the tracked
`next-env.d.ts` without leaving a diff. The existing tests also created ignored `var/test/*.sqlite`
outputs that were not previously listed. The main thread verified the exact generated content and
provenance, preserved the artifacts in the isolated Worktree, and amended this Work Order/runbook
before resuming the same task. This is a process-boundary incident, not a product-code claim; the
Builder resumed with the clarified boundary and should use the already-built app with `next start`.

#### Dependencies and assumptions

- The existing `/api/session` contract is the sole session authority; the shell calls it and does
  not infer role from URL, local storage, query parameters, or client-owned state.
- The shell may offer the two bounded demo roles and logout, but it must not simulate a request,
  listing, queue, approval, or response.
- The root page is a neutral landing/session surface. It may show a bounded signed-in status and
  navigation placeholder, but must not pretend that a role workflow is implemented.

#### Acceptance criteria

- The application renders through the shared shell with a clear title, semantic landmarks, a
  keyboard-reachable and labelled demo-session control, visible focus, and text status/error feedback.
- Sign-in uses only the existing server session endpoint, handles `401`/`400` visibly, shows the
  server-resolved actor/role, and logout clears the session through the server endpoint.
- The shell is responsive at narrow and wide viewport widths without requiring a UI kit, custom
  design system, external font, external media, or browser-test dependency.
- No UI component is a business authority: it does not invent listings, requests, queue counts,
  approval state, dates, or terminal outcomes, and it does not duplicate domain clock/version logic.
- `npm run typecheck`, `npm run build`, and the existing foundation/session tests pass under the
  exact target runtime; no forbidden path changes occur.
- The claim is limited to shared shell and bounded demo-session UX. Tenant/agent workflow pages,
  browser acceptance, integration, deployment, WebMCP, Cloud Receiver, Redis, WebRTC, and parent
  closure remain open.

#### Verification and return

Use exact Node.js `v24.20.0` and the approved runtime path. Run `npm run typecheck`, `npm test`,
`npm run build`, `git diff --check`, and a bounded local smoke of `/`, `/api/session` sign-in for
both roles, session read, logout, invalid input, and unauthenticated state. Inspect semantic
landmarks, keyboard/focus behavior, narrow/wide layout, exact path ownership, generated output, and
privacy boundaries. Return `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or `BLOCKED`; do not edit
canonical documents, add a UI dependency, commit, push, deploy, or dispatch another task.

#### Stop conditions

Stop at `BLOCKED` if session behavior requires real authentication, a workflow contract, a new
dependency, shared business state, or a role-page decision; if another writer owns a declared path;
or if a design request would expand beyond the minimum shell and session surface.

#### Completed verification and integration record

- Dedicated Verifier `01a05b6a-4f17-7b33-a30c-1d761f1f4192` returned `VERIFIED` against frozen HEAD
  `52a8f101b4de9f039261dd5c50e3094c8c948ae3`.
- Exact Node `v24.20.0` / npm `11.19.0`, `npm ci`, typecheck, foundation tests `6/6`, build,
  production `next start` smoke, session status/error matrix, browser interaction, responsive
  375/1280 viewport, focus, reduced-motion, no-overflow, privacy, dependency, and forbidden-path
  checks passed. The two initial verifier assertions were corrected and the actual contract passed.
- The exact eight-path product candidate was integrated into the main branch as `006d2fd`.
  Generated output was not adopted as source. The remaining claim is limited to the shared shell and
  bounded demo-session UX; role pages, full workflow integration, deployment, WebMCP, Cloud Receiver,
  Redis, WebRTC, production authentication, and parent closure remain open.

### RS-WO-002-09 — Review the human interface baseline and future page boundaries

**Parent task:** `RIGHTSPOT-002`  
**Role:** UI/UX reviewer  
**Pre-dispatch status:** `GATED` — the ordinary contract is accepted; implementation review is
read-only and does not wait for role pages  
**Execution state:** `INTEGRATED` — the dedicated read-only reviewer returned `READY_FOR_REVIEW`; the
main thread accepted the bounded checklist as guidance for the current shell and later role pages  
**Parallelization:** `READ_ONLY_PARALLEL` with `RS-WO-002-07` and `RS-WO-002-08`  
**Owner:** Main RightSpot thread; one dedicated read-only supporting task  
**Risk profile:** `Standard` — human-flow clarity, accessibility, responsive baseline, and ownership
review without source mutation  
**Objective:** Produce a bounded, evidence-backed UI/UX acceptance checklist for the shared shell
and the later tenant and agent Happy Path pages, including information hierarchy, accessibility,
responsive behavior, demo narrative, and exact ownership boundaries.  
**Next gate:** No further implementation is opened from this Work Order. The accepted checklist is
applied when reviewing `RS-WO-002-08` and designing later role-page Work Orders; it cannot authorize
scope expansion or silently change ADR-RS-0008.  
**Dispatch state:** Dispatched from clean detached source `c758634aa5d046e089e051ee74e463756b73a202`;
execution Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-09-ui-review`; supporting-task
identity `01a05b58-9ba4-7321-9c66-84477c44d359` (`local`). The reviewer has no authored write set.  
**Parent execution posture if blocked:** `PROGRESSING` unless the review reveals a material product,
privacy, or accessibility decision requiring the human owner's input.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; parent Task File; Requirements; Product Definition; System Design; API and
Integration Contracts; Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; current source and
tests; and the accepted tenant-to-agent Happy Path.

**Worker write set:** none. The reviewer returns the checklist and findings in its supporting-task
report only. It must not edit code, tests, package files, canonical documents, ADRs, the Task File,
the Runbook, the Git index, or any external path.

**Main-thread orchestration writeback set:** none during review. The main thread may later promote
accepted findings into a new bounded Work Order or canonical decision.

**Auxiliary process-only set:** none.

**Forbidden set:** implementation, mock business state, contract mutation, dispatching another task,
Git operations, deployment, external communication, and Cloud Receiver, WebMCP, Redis, WebRTC media,
production auth, or unrelated commercial scope.

**Generated set:** none.

#### Review contract

The reviewer must return:

- the minimum shell and session acceptance checklist;
- tenant discovery/detail/request-dashboard and agent queue/review/response information hierarchy;
- role and shared-path ownership that preserves disjoint future Builder scopes;
- keyboard, focus, labels, status/error, responsive, and reduced-motion considerations proportionate
  to the demo;
- the minimum judge-facing walkthrough narrative without inventing unimplemented behavior;
- usability, privacy, or scope risks ranked by decision impact;
- any current rule that is unnecessarily strict, with evidence and a bounded alternative; and
- one recommendation, non-goals, residual risks, and the next main-thread decision.

The report must distinguish verified current UI facts, design recommendations, unresolved product
choices, and checks that require a later running browser. It returns `READY_FOR_REVIEW` or `BLOCKED`;
it does not claim implementation, browser verification, integration, or parent closure.

#### Main-thread review result

The reviewer returned `READY_FOR_REVIEW` from detached source
`c758634aa5d046e089e051ee74e463756b73a202`, with a clean tree, no generated output, and no authored
mutation. The main thread accepts the following as bounded guidance: keep the shell and role pages
semantic, labelled, keyboard-reachable, visibly focused, responsive, and explicit about pending/error
states; show the server-resolved role; keep tenant and agent information hierarchies separate; make
agent `Prepare` and `Send` visibly distinct; refetch authoritative state on conflicts; and keep the
human decision boundary visible. The checklist also confirms the future page ownership split of
shared shell, workflow transport, tenant UI, and agent UI.

The reviewer’s suggestion to add a browser-test dependency is not adopted as a current scope change.
Manual or existing browser tooling may provide the later UI evidence; a new dependency requires its
own decision if a demonstrated verification gap remains. The report is review guidance, not browser
verification or product-flow evidence.

### RS-WO-002-10 — Review the tenant and agent role-page decomposition

**Parent task:** `RIGHTSPOT-002`  
**Role:** Architecture Advisor  
**Pre-dispatch status:** `GATED` — the workflow HTTP/DTO transport and shared shell are integrated,
and the accepted UI/UX guidance is available  
**Execution state:** `INTEGRATED` — the read-only Architecture Advisor returned `READY_FOR_REVIEW`
and the main thread accepted the decomposition with the shared-role-frame revision below  
**Parallelization:** `SERIAL` as a planning gate before the next role-page Builder dispatches  
**Owner:** Main RightSpot thread; one read-only Architecture Advisor  
**Risk profile:** `Standard` — route/component ownership, shared-shell coupling, role isolation, and
human-flow completeness  
**Objective:** Produce one evidence-backed decomposition for the next tenant and property-agent UI
implementation slices. Determine whether both role pages can be built in parallel from the integrated
transport and shell, identify the smallest shared seam if they cannot, and return exact disjoint
Work Order boundaries for main-thread approval.  
**Next gate:** `RS-WO-002-11` is integrated and its shared seam is verified; the accepted disjoint
tenant and agent role-page Work Orders `RS-WO-002-12` and `RS-WO-002-13` may now be dispatched in parallel.  
**Dispatch state:** Dispatched from clean source `a654658d2d50de24fd601f4fb863ec66e19bdff9`; execution
Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-10-advisor`; package root
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-10-advisor/WebApp/Web-Right_Spot`; runtime-pin path
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-10-advisor/.node-version`; supporting-task identity
`01a05b82-b89c-7210-9e23-9e4d56f53b46` (`local`). The dispatch returned a usable thread identity and
the full prompt was persisted; no source write is authorized.  
**Parent execution posture if blocked:** `PROGRESSING` unless the proposal exposes a material
contract, role-policy, or shared-shell decision that requires the human owner.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; `Docs/00-current-status.md`; this parent Task File; Requirements; Product Definition;
System Design; Domain and Data Model; API and Integration Contracts; Validation and Evidence;
ADR-RS-0001 through ADR-RS-0008; current source and tests; the integrated workflow transport at
`f700ba9`; the integrated shared shell at `006d2fd`; and the accepted `RS-WO-002-09` UI/UX review.

**Worker write set:** none. The Advisor returns a proposal in the supporting task only and must not
edit source, tests, package files, canonical documents, ADRs, the Task File, the Runbook, the Git
index, or any external path.

**Main-thread orchestration writeback set:** this Task File, current status, the Development README,
the Development Roadmap, and a new ADR only if the proposal reveals a material accepted contract or
architecture decision. The Advisor cannot write these files.

**Auxiliary process-only set:** none.

**Forbidden set:** product or test implementation; changes to shared shell, workflow transport,
domain, persistence, session, listing, package, fixture, script, or configuration paths; new
dependencies; browser-test installation; mock business state; WebMCP, Cloud Receiver, Redis,
WebRTC media, deployment, external communication, Git operations, or dispatching another task.

**Generated set:** none. The Advisor should use a clean read-only source snapshot and must not start
the application or create runtime output unless the main thread explicitly re-gates this Work Order.

#### Dependencies and assumptions

- The existing workflow route and DTO contract in ADR-RS-0008 is stable and remains the only UI
  business boundary.
- `f700ba9` and `006d2fd` are integrated source inputs; the Advisor must inspect actual current
  files rather than relying on summaries or historical proposals.
- Tenant and agent pages may be parallel only when their authored route/component/helper/test paths
  are disjoint, shared UI ownership is explicit, and neither page invents the other's state.
- If a shared shell or session seam must change, the Advisor must name the smallest separate Work
  Order and explain why role-page Builders cannot safely proceed without it.

#### Acceptance criteria

- Map the accepted tenant and agent Happy Path steps to the current HTTP routes, DTOs, session
  behavior, shared components, and missing UI surfaces.
- Recommend the smallest page/workspace shape for tenant discovery, listing detail, request draft
  and submission, request status, agent queue, request review, preparation, send, and tenant
  response.
- Name exact proposed authored paths for each role-page Builder, including page, UI component,
  client API/helper, and directly necessary test paths; identify every shared path that must remain
  single-owner or be handled by a separate integration Work Order.
- Decide whether tenant and agent Builders can run in parallel against the current baseline; if yes,
  state the stable contract, disjoint write sets, integration order, and end-to-end claim limit; if
  no, state the hard dependency and smallest serial prerequisite.
- Define the minimum role/session guard, loading/error/conflict handling, responsive/accessibility,
  and no-UI-authority checks without adding a new browser stack or duplicating backend rules.
- Identify material risks, unnecessary strictness, unresolved decisions, non-goals, and a concrete
  next main-thread dispatch recommendation.

#### Verification and return

Confirm the actual execution Worktree root, source identity, clean state, and no authored mutation.
Return `READY_FOR_REVIEW` with verified facts, recommendations, exact proposed ownership, dependency
classification, and claim boundaries, or return `BLOCKED` with the first failing boundary and resume
condition. Do not implement, dispatch, commit, or claim browser/product-flow verification.

#### Main-thread review result

The Advisor returned `READY_FOR_REVIEW` from clean detached source
`a654658d2d50de24fd601f4fb863ec66e19bdff9`, with the declared execution Worktree confirmed as the
actual Git root and no source, runtime, or external mutation. The main thread accepts the central
finding: tenant and agent UI have no hard dependency once ADR-RS-0008, listing discovery, session,
role/privacy, version, fixture-generation, and `409` refetch contracts are stable. They can later be
implemented as separate contract-parallel Builders with disjoint route, component, client-helper,
and test paths.

The main thread also accepts the Advisor's minimal serial prerequisite, with the following bounded
scope: generalize the shared authenticated role-page frame, provide the signed-in role workspace
entry link, and make `SessionNav`'s current-route semantics correct outside `/`. This is an
implementation seam, not a product-scope expansion; it must not read or mutate workflow state. The
Advisor's proposed tenant and agent path sets were refined into the exact `RS-WO-002-12` and
`RS-WO-002-13` Work Orders after `RS-WO-002-11` was independently verified and integrated. The
suggestion to add a browser-test dependency is not adopted.

### RS-WO-002-11 — Generalize the authenticated role-page frame

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — `RS-WO-002-10` decomposition is accepted; role-page Builders are
gated on this shared seam  
**Execution state:** `INTEGRATED` — candidate `f1f83c75cdfab4c782e0481e4c5b335c0d7c1ea0` passed
dedicated independent verification and was cherry-picked into main at product commit `6a0b4b8`  
**Parallelization:** `SERIAL` prerequisite for the tenant and agent role-page Builders  
**Owner:** Main RightSpot thread; one dedicated Builder followed by one independent Verifier  
**Risk profile:** `Standard` — shared session presentation, route semantics, and accessibility  
**Objective:** Add the smallest reusable authenticated role-page frame and correct shared navigation
semantics so tenant and agent pages can consume one session boundary without duplicating auth UX or
editing shared files in parallel. Keep this seam presentation-only; it must not read, own, or mutate
workflow, listing, queue, or decision state.  
**Next gate:** This Work Order is integrated. The disjoint tenant and agent page Builders are assigned
in parallel against the verified shared seam; independently verify each before cross-role integration.  
**Dispatch state:** Dispatched from clean source `7e8506f78c58927008672c1185115d7ecb90671a`; execution
Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-11-shared-role-frame`; package root
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-11-shared-role-frame/WebApp/Web-Right_Spot`; runtime-pin
path `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-11-shared-role-frame/.node-version`; supporting-task
identity `01a05b8a-f781-7440-a503-5a6a59d29b67` (`local`). The dispatch returned a usable thread identity
and the full prompt was persisted; the Builder returned `READY_FOR_VERIFICATION` after exact T2 review,
and the candidate was committed in that execution Worktree as `f1f83c7` without changing main. The
independent Verifier was then dispatched with supporting-task identity `01a05b92-fc73-7042-bbcc-2f51be4a5767`
(`local`) in Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-11-verifier`, detached at the
candidate commit, and returned `VERIFIED`; the main thread integrated it at product commit `6a0b4b8`.
No source write was authorized during verification.  
**Parent execution posture if blocked:** `PROGRESSING` — this shared seam is verified and the two
disjoint role-page Work Orders may proceed.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; this Task File; Requirements; System Design; API and Integration Contracts;
Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; `RS-WO-002-09` guidance; and the current
integrated shared shell, session endpoint, workflow transport, and listing API.

**Worker write set — exact authored paths:**

- `src/ui/shared/app-shell.tsx`;
- `src/ui/shared/demo-session-panel.tsx`;
- `src/ui/shared/session-nav.tsx`; and
- `src/ui/shared/role-page-frame.tsx` (new).

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
and `RUNBOOK.md`. The Builder must not edit these files.

**Auxiliary process-only set:** none.

**Forbidden set:** `app/layout.tsx`; `app/page.tsx` except through the existing `AppShell` import
surface (the Builder must not change the route file); `app/globals.css`; `src/ui/shared/session-api.ts`;
`src/ui/shared/status-banner.tsx`; all tenant/agent page paths; all API, application, domain,
persistence, fixture, script, package, contract, ADR, canonical-document, Git, deployment, and
external paths; new dependencies; browser-test installation; WebMCP, Cloud Receiver, Redis, WebRTC,
production auth, and commercial scope. No commit, push, deploy, or follow-on dispatch is allowed.

**Generated set:** existing ignored `.next/`, `node_modules/`, `*.tsbuildinfo`, and `var/test/**`
outputs only; preserve them and do not create external artifacts.

#### Dependencies and assumptions

- `SessionNav`, `StatusBanner`, and `session-api` remain read-only reusable inputs except for the
  declared current-route correction in `session-nav.tsx`.
- The frame must use the existing server session endpoint and `readSession`/`deleteSession`; it must
  not accept a client-selected actor or role as authority.
- The frame may accept a required role, current path, title/landmark metadata, and children; it must
  render role content only after the server-resolved actor matches the required role.
- Unauthenticated and wrong-role states must be visible and must not load or mutate role business
  state. Logout remains an ordinary session endpoint action.

#### Acceptance criteria

- Signed-in root users receive a clear role-specific workspace entry link based on the server-resolved
  actor, without a client role selector becoming authority.
- `SessionNav` marks the home link current only on `/` and supports a role page without incorrect
  `aria-current`; existing root shell behavior remains valid.
- `RolePageFrame` provides loading, unauthenticated, wrong-role, active-session, logout, semantic
  landmark, visible status/error, keyboard/focus, and responsive presentation states using existing
  shared primitives and no new dependency.
- Role content is not rendered as authorized before the server session resolves and matches the
  required role; the frame does not infer or override role from URL or local state.
- The frame owns no listing/request/queue/availability/expiry/version/transition state and contains
  no workflow fallback or mock business data.
- The stale root copy in the shared session surfaces is corrected without promising features that are
  not yet implemented.
- Existing typecheck, foundation/session tests, build, and a bounded browser/manual smoke for `/`,
  unauthenticated role access, wrong-role access, both roles, logout, keyboard focus, and narrow/wide
  layout pass under Node `v24.20.0`.

#### Verification and return

Use the exact runtime and a frozen T2 candidate. The Builder returns `READY_FOR_VERIFICATION`,
`NEEDS_REPAIR`, or `BLOCKED` with exact source identity, paths, commands, results, generated state,
and claim boundary. The independent Verifier must run against the frozen candidate, inspect the exact
four-path scope, and verify the session/route/accessibility behavior without changing source. Neither
checkpoint may claim tenant/agent workflow implementation, browser Happy Path completion, deployment,
WebMCP/Cloud Receiver readiness, or parent closure.

#### Stop conditions

Stop at `BLOCKED` if the frame requires API, domain, persistence, role-policy, package, CSS-global,
or product-contract changes; if a shared path has another owner; if an external artifact is created;
or if a behavior can pass only through mock business state, hidden fallback, or client-authoritative
role logic. Do not widen this Work Order into role pages.

#### Main-thread verification and integration record

The independent Verifier returned `VERIFIED` against candidate
`f1f83c75cdfab4c782e0481e4c5b335c0d7c1ea0` from the detached Worktree. It confirmed the exact four
authored paths, a clean source, no forbidden/package/canonical/generated-source mutation, pinned Node
`24.20.0` and npm `11.19.0`, `npm ci`, typecheck, foundation `6/6`, focused session/listing `7/7`,
full existing suite `50/50`, production build, built-server health/session/logout smoke, role-link and
`aria-current` behavior, keyboard focus, narrow/wide no-overflow behavior, and no page/console errors.
The role paths remained intentionally `404` because they are outside this Work Order. The main thread
cherry-picked the exact candidate into main at product commit `6a0b4b8` and re-ran main-checkout
typecheck, foundation `6/6`, and production build successfully. The shared frame is now a stable
read-only input for `RS-WO-002-12` and `RS-WO-002-13`; tenant/agent end-to-end and parent closure remain
unclaimed.

### RS-WO-002-12 — Build the tenant discovery and request interface

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — the shared role-page frame, listing discovery API, workflow
transport, and tenant DTO contract are integrated and independently verified  
**Execution state:** `VERIFIED` — the final same-identity independent Verifier verified repaired
candidate `52cba87c00c3461793b22aa26974da5276d01b48` from its clean exact-scope Worktree; the main
thread integrated the tenant Builder and repair commits at product commits `821de46` and `9348aa5`.  
**Prior checkpoint result:** `BLOCKED` — the source, runtime, test, build, HTTP, and partial UI checks
completed, but final scope readback found `.gstack/` added outside the exact nine-path candidate.  
**Parallelization:** `CONTRACT_PARALLEL` with `RS-WO-002-13`; route, component, helper, test, and CSS
ownership are disjoint, while both consume the same frozen read-only contracts  
**Owner:** Main RightSpot thread; one dedicated Builder followed by one dedicated independent Verifier  
**Risk profile:** `Standard` — tenant presentation, request freshness, and user-facing mutation feedback  
**Objective:** Implement the smallest usable tenant surface for the ordinary Happy Path: browse the
seeded published listings, inspect one listing, create and submit the one bounded Viewing Request, and
later read and respond to the agent's proposal or decline. Keep server workflow state authoritative;
the UI may hold transient form input but must not invent transitions, identity, versions, or fallback data.  
**Next gate:** Complete the read-only combined cross-role verification in `RS-WO-002-14`. The original
verifier Worktrees and `.gitignore` diffs remain preserved for separate ownership/recoverability
handling; they are not product source.  
**Dispatch state:** Dispatched from clean baseline `8b33399ce5769bdb58cd08025ac2c1917675daf3`; execution
Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui`; package root
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui/WebApp/Web-Right_Spot`; runtime-pin path
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui/.node-version`; supporting-task identity
`01a05ba2-34d4-7613-892d-c0776203073c` (`local`). The full Builder prompt was persisted after the usable
thread identity returned; the Builder returned `READY_FOR_VERIFICATION` and the exact nine-path
candidate was committed at `eb1d62e1b33a045e683f64ba3d28930e9444cd25`. The dedicated independent
Verifier is `01a05bb1-c38b-7a91-95aa-49475a057e43` (`local`) in Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier`, detached at the candidate; its package root
is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier/WebApp/Web-Right_Spot` and its runtime-pin
path is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier/.node-version`. The full Verifier
prompt was persisted after the usable thread identity returned; its first attempt stopped procedurally
because the shell resolved Node `26.5.0` instead of the required pinned runtime; the main thread verified
the prepared absolute Node `24.20.0`/npm `11.19.0` binaries and sent a correction to the same Verifier
identity. The corrected run passed Node `24.20.0`/npm `11.19.0`, typecheck, foundation `6/6`, focused
tenant tests `4/4`, full direct suite `54/54`, build, bounded HTTP, and partial UI checks, but its final
readback found the verifier Worktree's tracked `.gitignore` changed outside the nine-path candidate,
adding `.gstack/`. The Verifier correctly stopped as `BLOCKED`; it also recorded possible filter and
draft-save UI observations that require a clean rerun. The main thread preserved that Worktree and
created `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier-rerun` at the same candidate SHA,
then sent the recovery prompt to the same Verifier identity `01a05bb1-c38b-7a91-95aa-49475a057e43`.
That rerun reached the same procedural `.gitignore` blocker and was preserved without cleanup. It also
produced a reproducible `Southwark` filter/render divergence, which the main thread classified as a
bounded product repair. Repairer task `01a05bca-aba1-70c1-8be3-782030f7673f` was stopped after no
timely handoff; its one-file patch was reviewed and committed by the main thread as T2 candidate
`52cba87c00c3461793b22aa26974da5276d01b48` in Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-repair`.
A clean final verifier Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier-final` was
created at that candidate, and the same Verifier identity was dispatched for final independent
verification. The final run returned `VERIFIED` against candidate `52cba87c`: exact nine-path scope and
clean status; Node `24.20.0`/npm `11.19.0`; `npm ci`; typecheck; foundation `6/6`; tenant focused `4/4`;
full direct suite `54/54`; production build; health, auth, role, listing/filter/detail, empty-request,
draft, one-request, submit, stale-conflict, and tenant-privacy HTTP checks. The repair's stale-response
guard was statically confirmed. Browser E2E was not run because the available browser tooling can mutate
tracked `.gitignore`; no browser claim is made. This result authorizes only main-thread T2 integration,
not combined-flow verification or parent closure. The main thread then cherry-picked the Builder
candidate as `821de46` and the repair as `9348aa5`, ran pinned Node `24.20.0`/npm `11.19.0` typecheck,
foundation `6/6`, tenant and agent focused tests `7/7`, isolated full direct suite `57/57`, and
production build successfully.  
**Parent execution posture if blocked:** `CONSTRAINED` only for the tenant interface; the agent interface,
read-only analysis, and process work may continue if they do not consume a blocked tenant write set.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; this Task File; Requirements; System Design; API and Integration Contracts;
Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; `RS-WO-002-09` UI/UX guidance; the integrated
`RolePageFrame`, shared session primitives, listing routes, workflow routes, workflow DTO contract, and
the existing domain/application tests.

**Worker write set — exact authored paths:**

- `app/tenant/page.tsx`;
- `app/tenant/listings/[listingId]/page.tsx`;
- `app/tenant/requests/page.tsx`;
- `src/ui/tenant/tenant-discovery-page.tsx`;
- `src/ui/tenant/tenant-listing-page.tsx`;
- `src/ui/tenant/tenant-request-page.tsx`;
- `src/ui/tenant/tenant-api.ts`;
- `src/ui/tenant/tenant.module.css`; and
- `tests/ui/tenant-api.test.ts`.

No other authored path may be added. The Builder owns only tenant UI and its focused helper tests;
it must not add a second test script or testing dependency.

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
and `RUNBOOK.md`. The Builder must not edit these files.

**Auxiliary process-only set:** none.

**Forbidden set:** all `src/ui/shared/**` paths, including `role-page-frame.tsx`, `session-api.ts`,
`session-nav.tsx`, and `status-banner.tsx`; all `src/ui/agent/**` and `app/agent/**` paths; `app/layout.tsx`;
`app/page.tsx`; `app/globals.css`; all API route, application, domain, persistence, fixture, script,
contract, ADR, canonical-document, Git, deployment, and external paths; package manifests and lockfiles;
new dependencies; browser-test installation; WebMCP, Cloud Receiver, Redis, WebRTC, production auth,
and commercial scope. No commit, push, deploy, publication, or follow-on dispatch is allowed.

**Generated set:** existing ignored `.next/`, `node_modules/`, `*.tsbuildinfo`, and `var/test/**` outputs
only; preserve them and do not create screenshots, reports, `/tmp`, home-directory, or external artifacts.

#### Dependencies and assumptions

- `RolePageFrame` is the shared session and role boundary. Tenant pages must pass
  `requiredRole="tenant"` and must not duplicate session resolution or accept a client-selected actor.
- Listing reads use the existing `GET /api/listings` and `GET /api/listings/:listingId` contracts. Filter
  query names and bounded values remain server-defined; the UI must encode query values and display the
  authoritative returned `fixtureGeneration` and listing DTOs.
- Request reads and mutations use only the existing tenant workflow routes: `GET /api/tenant/request`,
  `POST /api/tenant/request`, `PATCH /api/tenant/request`, `POST /api/tenant/request/submit`,
  `POST /api/tenant/request/confirm`, and `POST /api/tenant/request/decline`. A contract gap is a
  `BLOCKED` result, not permission to edit the transport.
- The fixture allows one request. If a current request already targets another listing, the UI must
  explain that the existing request is the active one and link to the request surface; it must not invent
  a second request or silently switch the listing.
- Draft input contains one to three ordered timestamp values and an optional bounded tenant note. A
  form may use deterministic, user-editable `datetime-local` controls and convert them to ordered ISO
  timestamps; it must not silently discard invalid or duplicate values.
- Each mutation sends a fresh bounded `commandId` and the latest authoritative fixture/request/listing
  versions. After a successful response, replace the displayed workflow snapshot from the response;
  do not increment versions or state locally.
- A `409` refetches the relevant authoritative tenant view and presents a bounded stale/conflict message;
  it must not blindly replay the command, choose another listing/slot, or claim success. `401`, `403`,
  `404`, `400`, and `503` remain visible neutral error states.
- The listing `imageKey` is an opaque seeded key. No external image host, map, video, media asset, or
  fabricated property data is required; a deterministic local visual placeholder may be used without
  turning it into a second listing authority. Favourites are deferred and are not part of this Work Order.

#### Acceptance criteria

- `/tenant` renders a role-protected listing catalogue with loading, error/retry, empty, filter, and
  result states. Each card shows the returned title, area/address, rent, bedrooms, size, availability,
  and a link to the detail route without hard-coded listing records.
- `/tenant/listings/[listingId]` reads the authoritative listing, presents its bounded facts and a
  deterministic media placeholder if useful, and provides a clear draft editor with save-draft and
  explicit submit actions. It does not submit until the input satisfies the one-to-three ordered-time
  rule and does not hide server validation errors.
- `/tenant/requests` reads the tenant DTO and timeline, supports the normal empty state, shows the
  current listing/request status and tenant-safe response, and offers confirm/decline only for a current
  `SLOT_PROPOSED` response. Terminal states are visibly read-only; agent preparation and internal notes
  never appear.
- The ordinary UI can traverse browse → listing detail → create draft → submit → request dashboard,
  and, when the agent response exists, dashboard → confirm or decline using the existing HTTP contract.
  This is a consumer implementation claim only until integrated browser verification proves the full loop.
- Components render children through the integrated `RolePageFrame`; they do not create a client state
  machine, infer role from URL, read client storage, use mock business state, or mutate workflow state
  through any path other than the declared tenant routes.
- All controls have labels, semantic headings/landmarks, visible keyboard focus, usable pending/error
  states, and narrow/wide layout behavior without global CSS edits or horizontal overflow.
- `tenant-api.ts` has focused tests for success parsing, neutral API errors, query encoding, strict mutation
  payload construction, and the declared response/error boundary. Existing typecheck, foundation tests,
  build, and a bounded browser/manual smoke pass under Node `v24.20.0`.
- No agent UI, server/contract change, external integration, deployment, WebMCP/Cloud Receiver readiness,
  or parent-Task closure claim is made.

#### Verification and return

Use the exact runtime and a frozen T2 candidate. The Builder returns `READY_FOR_VERIFICATION`,
`NEEDS_REPAIR`, or `BLOCKED` with exact source identity, paths, commands, results, generated state,
claim boundary, and residual risks. The independent Verifier must inspect the exact nine-path scope and
run the pinned install/typecheck, foundation and focused helper checks, build, bounded built-server
session/API smoke, and the tenant UI route/accessibility/error/conflict checks. The Verifier must use
fresh isolated workflow state when testing mutation flows and must not confuse an empty request with an
error. Neither checkpoint may edit source, docs, commit, push, deploy, dispatch another task, or claim
the complete cross-role Happy Path before integration.

#### Stop conditions

Stop at `BLOCKED` if the tenant surface requires an API/DTO/domain/persistence/fixture/role-policy,
shared-shell, global-CSS, dependency, or product-contract change; if another worker owns an exact path;
if the one-request fixture cannot express the intended flow; if the runtime/output boundary cannot be
maintained; or if a behavior can pass only through mock data, hidden fallback, client-authoritative role,
or local state/version invention. Do not broaden this Work Order into favourites, chat, payments, maps,
media, agent management, or future integration.

### RS-WO-002-13 — Build the property-agent queue and decision interface

**Parent task:** `RIGHTSPOT-002`  
**Role:** Builder → Verifier (sequential checkpoints)  
**Pre-dispatch status:** `GATED` — the shared role-page frame, workflow transport, agent DTO contract,
and UI/UX guidance are integrated and independently verified  
**Execution state:** `VERIFIED` — the dedicated independent Verifier verified the frozen exact-path
candidate `169cb95d60d4d91c8cd89ef4b722f6fc379db97f`; the claim is limited to local source, runtime,
tests, build, HTTP, and static UI evidence, with browser interaction unavailable in that session  
**Parallelization:** `CONTRACT_PARALLEL` with `RS-WO-002-12`; route, component, helper, test, and CSS
ownership are disjoint, while both consume the same frozen read-only contracts  
**Owner:** Main RightSpot thread; one dedicated Builder followed by one dedicated independent Verifier  
**Risk profile:** `Standard` — agent queue visibility, human response decisions, and private-field safety  
**Objective:** Implement the smallest usable property-agent surface for the ordinary Happy Path: read
the assigned request queue, inspect the authorized request and availability, start review, prepare a
slot proposal or decline, and explicitly send the prepared human decision. Keep the server/application
workflow authoritative and preserve the separation between preparation and consequence.  
**Next gate:** Complete the read-only combined cross-role verification in `RS-WO-002-14`. The independent
result and main integration do not claim browser E2E, the complete tenant-to-agent loop, deployment, or
parent closure.  
**Dispatch state:** Dispatched from clean baseline `8b33399ce5769bdb58cd08025ac2c1917675daf3`; execution
Worktree `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui`; package root
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui/WebApp/Web-Right_Spot`; runtime-pin path
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui/.node-version`; supporting-task identity
`01a05ba2-3d53-7bd3-934c-6238237576fd` (`local`). The full Builder prompt was persisted after the usable
thread identity returned; the Builder returned `READY_FOR_VERIFICATION` and the exact seven-path
candidate was committed at `169cb95d60d4d91c8cd89ef4b722f6fc379db97f`. The dedicated independent
Verifier is `01a05bae-de91-7252-b5ce-4a6a729441dd` (`local`) in Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier`, detached at the candidate; its package root
is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier/WebApp/Web-Right_Spot` and its runtime-pin
path is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier/.node-version`. The full Verifier
prompt was persisted after the usable thread identity returned; its first attempt stopped procedurally
because the projectless output directory was used as the Git root, and the main thread sent a correction
to the same Verifier identity. The corrected run verified exact seven-path scope and clean state with
Node `24.20.0`/npm `11.19.0`, foundation `6/6`, focused agent tests `3/3`, full direct suite `53/53`,
build, HTTP role/error/conflict/privacy evidence, and static UI checks. Browser interaction was unavailable
and is explicitly outside the claim; no verifier mutation occurred. The main thread cherry-picked the
verified candidate at product commit `3765747` and re-ran the integrated main-checkout checks; the
combined cross-role verification in `RS-WO-002-14` is now the next gate.  
**Parent execution posture if blocked:** `CONSTRAINED` only for the agent interface; the tenant interface,
read-only analysis, and process work may continue if they do not consume a blocked agent write set.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; this Task File; Requirements; System Design; API and Integration Contracts;
Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; `RS-WO-002-09` UI/UX guidance; the integrated
`RolePageFrame`, shared session primitives, workflow routes, workflow DTO contract, and existing
domain/application tests.

**Worker write set — exact authored paths:**

- `app/agent/page.tsx`;
- `app/agent/requests/[requestId]/page.tsx`;
- `src/ui/agent/agent-dashboard-page.tsx`;
- `src/ui/agent/agent-request-page.tsx`;
- `src/ui/agent/agent-api.ts`;
- `src/ui/agent/agent.module.css`; and
- `tests/ui/agent-api.test.ts`.

No other authored path may be added. The Builder owns only agent UI and its focused helper tests;
it must not add a second test script or testing dependency.

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
and `RUNBOOK.md`. The Builder must not edit these files.

**Auxiliary process-only set:** none.

**Forbidden set:** all `src/ui/shared/**` paths, including `role-page-frame.tsx`, `session-api.ts`,
`session-nav.tsx`, and `status-banner.tsx`; all `src/ui/tenant/**` and `app/tenant/**` paths; `app/layout.tsx`;
`app/page.tsx`; `app/globals.css`; all API route, application, domain, persistence, fixture, script,
contract, ADR, canonical-document, Git, deployment, and external paths; package manifests and lockfiles;
new dependencies; browser-test installation; WebMCP, Cloud Receiver, Redis, WebRTC, production auth,
and commercial scope. No commit, push, deploy, publication, or follow-on dispatch is allowed.

**Generated set:** existing ignored `.next/`, `node_modules/`, `*.tsbuildinfo`, and `var/test/**` outputs
only; preserve them and do not create screenshots, reports, `/tmp`, home-directory, or external artifacts.

#### Dependencies and assumptions

- `RolePageFrame` is the shared session and role boundary. Agent pages must pass
  `requiredRole="agent"` and must not duplicate session resolution or accept a client-selected actor.
- Queue and detail reads use only `GET /api/agent/requests` and `GET /api/agent/requests/:requestId`.
  Queue empty is a normal result; missing detail is a visible `404` state. GET operations must not mutate
  workflow state.
- Agent commands use only `POST /api/agent/requests/:requestId/review`,
  `PUT /api/agent/requests/:requestId/preparation`, and
  `POST /api/agent/requests/:requestId/send`. A contract gap is a `BLOCKED` result, not permission to
  edit the transport, DTO, domain, or persistence boundary.
- The server derives actor, assignment, request identity, state transition, and final send kind. The UI
  may choose a bounded available slot or an agent decline preparation, but it must not submit a terminal
  state or arbitrary request/actor identity.
- Preparation and send are visibly separate actions. Preparing a response remains `AGENT_REVIEWING`;
  only the explicit send action may produce `SLOT_PROPOSED` or `AGENT_DECLINED`. A proposal can select
  only a returned slot whose current status is `AVAILABLE`; if it becomes unavailable, surface `409` and
  refetch rather than silently choosing another slot.
- Each mutation sends a fresh bounded `commandId`, current authoritative `fixtureGeneration`, and the
  latest request version. After a successful response, replace the displayed snapshot from the response;
  do not increment versions or state locally. A `409` refetches and presents a bounded conflict message.
- Agent-only `preparedResponse` and `internalReviewNote` may be displayed only within the agent surface;
  the UI must not copy them into a tenant response or expose credentials, actor IDs, raw persistence state,
  processed commands, or assignment internals.

#### Acceptance criteria

- `/agent` renders a role-protected queue with loading, error/retry, empty, refresh, bounded state counts,
  and request links based only on the returned `AgentQueueResponse`; it does not manufacture a queue item.
- `/agent/requests/[requestId]` reads and displays the assigned request, agent-safe listing/status,
  preferred times, tenant note, bounded availability, and current workflow state. It provides a clear
  start-review action for `REQUEST_SUBMITTED`, without exposing tenant identity beyond the accepted DTO.
- During `AGENT_REVIEWING`, the page provides a bounded preparation form for an available slot proposal
  or agent decline, optional tenant-facing note, and optional internal review note. It renders the saved
  preparation and keeps `Prepare response` separate from `Send response`.
- Send is enabled only when the authoritative DTO contains a prepared response; the UI does not accept a
  client-selected terminal state and does not auto-send after preparation. After send, the response and
  state are read from the server result and the terminal/proposed surface becomes appropriately read-only.
- The ordinary UI can traverse queue → request detail → start review → prepare → explicit send, while
  preserving the consequential agent decision as a visible human action. This is a consumer claim only
  until integrated browser verification proves the full cross-role loop.
- Components render through the integrated `RolePageFrame`; they do not create a client state machine,
  infer role from URL, read client storage, use mock business state, or mutate workflow state outside the
  declared agent routes.
- All controls have labels, semantic headings/landmarks, visible keyboard focus, usable pending/error/
  conflict states, and narrow/wide layout behavior without global CSS edits or horizontal overflow.
- `agent-api.ts` has focused tests for success parsing, neutral API errors, strict command payloads, queue
  empty/detail behavior, and the declared response/error boundary. Existing typecheck, foundation tests,
  build, and a bounded browser/manual smoke pass under Node `v24.20.0`.
- No tenant UI, server/contract change, external integration, deployment, WebMCP/Cloud Receiver readiness,
  or parent-Task closure claim is made.

#### Verification and return

Use the exact runtime and a frozen T2 candidate. The Builder returns `READY_FOR_VERIFICATION`,
`NEEDS_REPAIR`, or `BLOCKED` with exact source identity, paths, commands, results, generated state,
claim boundary, and residual risks. The independent Verifier must inspect the exact seven-path scope and
run the pinned install/typecheck, foundation and focused helper checks, build, bounded built-server
session/API smoke, and the agent UI route/accessibility/error/conflict checks. The Verifier must use
fresh isolated workflow state when testing mutation flows and must verify that preparation and send remain
separate. Neither checkpoint may edit source, docs, commit, push, deploy, dispatch another task, or claim
the complete cross-role Happy Path before integration.

#### Stop conditions

Stop at `BLOCKED` if the agent surface requires an API/DTO/domain/persistence/fixture/role-policy,
shared-shell, global-CSS, dependency, or product-contract change; if another worker owns an exact path;
if preparation/send cannot preserve the human decision boundary; if the runtime/output boundary cannot
be maintained; or if a behavior can pass only through mock data, hidden fallback, client-authoritative
role, automatic send, or local state/version invention. Do not broaden this Work Order into listing CRUD,
tenant administration, chat, calendar, payments, media, or future integration.

### RS-WO-002-14 — Verify the integrated cross-role Happy Path

**Parent task:** `RIGHTSPOT-002`  
**Role:** Verifier (read-only)  
**Pre-dispatch status:** `GATED` — `RS-WO-002-12` and `RS-WO-002-13` passed dedicated independent
verification and their outputs are integrated into the main source at product commits `9348aa5` and
`3765747`  
**Execution state:** `GATED` — dispatch only after a clean detached verification Worktree is created
from the frozen main commit `9348aa50b63e3f4f46e77238ad370670383d9d6d`  
**Parallelization:** `INTEGRATION_SERIAL` — this checkpoint consumes both integrated role-page outputs;
no tenant or agent source writer may modify the frozen source while it runs  
**Owner:** Main RightSpot thread; one dedicated read-only Verifier  
**Risk profile:** `High` — cross-role session continuity, workflow mutation ordering, and evidence claim
boundary  
**Objective:** Independently verify that the integrated local application carries the ordinary human
Happy Path from tenant discovery through agent decision and back to tenant confirmation or decline,
while preserving the existing HTTP/DTO, role-privacy, server-authority, one-request, stale-version, and
preparation-versus-send boundaries. This is a verification checkpoint, not a repair or feature-expansion
assignment.  
**Next gate:** Reconcile the Verifier result; if `VERIFIED`, open only the smallest browser walkthrough
or closure-evidence checkpoint still required. If `NEEDS_REPAIR`, diagnose and open a bounded Repairer;
if `BLOCKED`, report the procedure blocker without changing the parent to globally blocked.  
**Dispatch state:** Not dispatched. The main thread must record the exact detached Worktree, package
root, runtime-pin path, task identity, and prompt persistence before execution.

#### Scope and ownership

**Read set:** Repository instructions and Engineering controls; RightSpot `RUNBOOK.md`; the Pilot
Runbook; current status; this Task File; Requirements; System Design; API and Integration Contracts;
Validation and Evidence; ADR-RS-0001 through ADR-RS-0008; all integrated tenant/agent/shared UI,
application, domain, persistence, route, contract, fixture, and test files.

**Worker write set:** None. This is a read-only verification checkpoint.

**Main-thread orchestration writeback set:** this Task File, `Docs/00-current-status.md`,
`Docs/Tasks/README.md`, `Docs/Development/README.md`, `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`,
and `RUNBOOK.md`.

**Forbidden set:** every authored source, test, package, lockfile, canonical document, Git index,
branch, deployment, external, or sibling-project path; no repair, formatting, dependency installation
into source, commit, push, deploy, or follow-on dispatch. If browser tooling changes a tracked path such
as `.gitignore`, stop as `BLOCKED`, preserve the evidence, and do not restore or delete it.

**Generated set:** only ignored `node_modules/`, `.next/`, `*.tsbuildinfo`, `var/rightspot.sqlite*`,
and `var/test/**` inside the declared execution Worktree/package root. Do not create `/tmp`, home,
repository-root, screenshot, report, or other external artifacts.

#### Dependencies and assumptions

- The source under test is the exact integrated main commit
  `9348aa50b63e3f4f46e77238ad370670383d9d6d`; do not silently substitute a different branch, checkout,
  package root, or runtime.
- Use the prepared absolute Node `24.20.0` and npm `11.19.0` binaries, or an explicitly validated PATH
  resolving to those exact versions. The nested package root is
  `WebApp/Web-Right_Spot`; the detached Worktree root is the Git root.
- Start from a fresh isolated application database in the Worktree. Do not foundation-reset a database
  after business workflow state has been created and then interpret a generation mismatch as a product
  defect. Preserve the normal state lifecycle while exercising the flow.
- The verifier must inspect the accepted route/DTO contracts and existing test fixtures before composing
  requests. It must use fresh command IDs and authoritative versions returned by the server; never
  invent state, actor identity, versions, or a fallback response.
- Direct HTTP/static evidence and browser evidence are separate claims. Browser interaction may run only
  if the tooling is proven not to mutate tracked files within the declared boundary; otherwise omit it
  and report it as unavailable.

#### Acceptance criteria

- Pinned install, typecheck, foundation tests, the full direct suite, and production build pass from the
  frozen source. The full direct suite must run from a fresh isolated cwd/database so fixture generation
  starts at the expected baseline.
- A fresh built server returns health/readiness success and exposes the integrated tenant, agent, and
  workflow routes without external services. Unauthenticated and wrong-role requests return the bounded
  `401`/`403` outcomes, and unknown resources return bounded `404` outcomes.
- One tenant session can browse the seeded listings, apply a bounded filter, inspect a listing, create a
  draft request, explicitly submit it, and read the resulting tenant-safe request status.
- One agent session can read the assigned queue, inspect the request, start review, prepare a proposal,
  and explicitly send it. Preparation must not itself cause the terminal workflow consequence.
- The same tenant session can read the agent response and confirm it (or a separately reset run can
  exercise decline), with authoritative status, versions, and timeline visible after each mutation.
- The cross-role flow preserves one-request enforcement, role privacy, stale/conflict handling, neutral
  error mapping, and no hidden client-authoritative transition or automatic send.
- If browser interaction is safely available, record the actual role/session/navigation/control states;
  otherwise explicitly mark browser E2E as not run. Never call HTTP or static evidence browser E2E.

#### Verification and return

Use the exact frozen source and runtime. Capture the actual Git root, package root, commit, clean status,
runtime versions, commands, results, generated paths, server lifecycle, flow identifiers, skipped checks,
and claim boundary. Return exactly one of `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED`. Do not edit source,
tests, canonical documents, or Git state; do not repair a finding or start another task.

#### Stop conditions

Stop at `BLOCKED` if source drift, a second writer, wrong root/runtime, unapproved dependency or external
service, output outside the generated set, browser tooling mutation, unclear reset semantics, or a
required product/contract/security/persistence decision appears. Return `NEEDS_REPAIR` only for a
reproducible product defect within an existing integrated ownership boundary. Do not broaden this Work
Order into UI redesign, favourites, chat, payments, deployment, WebMCP, Cloud Receiver, Redis, WebRTC,
or parent closure.

## Parent objective — not the current Builder scope

The following is the complete parent-Task outcome. It must not be sent to one Builder or Verifier as a
single assignment; only bounded Work Orders that pass the pilot's dependency and ownership gates are
dispatchable, with dependent checkpoints remaining sequential.

Implement the smallest stable RightSpot application that completes the accepted ordinary human
Happy Path: tenant discovery and request submission, agent review and response, then tenant
confirmation or decline.

## In scope

- the accepted Next.js, React, TypeScript, Node.js 24, and SQLite stack with one local runnable
  composition;
- bounded demo login for tenant and property agent;
- seeded listings, identities, availability, and reset;
- tenant marketplace and request dashboard;
- agent management dashboard, queue, request review, and proposal/decline flow;
- one shared Viewing Request with role projections and state/version checks;
- visible human decisions and basic audit/status history; and
- focused domain, role, reset, and primary-flow tests.

## Non-goals

- Cloud Receiver or Local Connector integration;
- WebMCP registration or Agent continuation;
- buying, payment, lease, legal, live-chat, calendar, CRM, or real property integrations;
- production identity, multi-tenant administration, or commercial marketplace completeness; and
- live Remote Viewing, WebRTC media/signaling, Redis, and other distributed realtime infrastructure;
- exhaustive edge-case or distributed-failure coverage beyond demo safety and role isolation.

## Next gate

The runnable foundation, `RS-WO-002-03` domain core, `RS-WO-002-04` durable workflow/application
boundary, and `RS-WO-002-05` tenant entry/listing discovery API are independently verified. The
`RS-WO-002-06` Architecture Advisor proposal returned `READY_FOR_REVIEW`; the main thread accepted
it with revisions and froze the ordinary local workflow HTTP/DTO boundary in ADR-RS-0008. The
`RS-WO-002-07` workflow transport is independently verified and integrated at `f700ba9`; the
`RS-WO-002-08` shared shell is independently verified and integrated at `006d2fd`; and
`RS-WO-002-09` is integrated as read-only UI/UX guidance, and `RS-WO-002-11` is integrated at product
commit `6a0b4b8` after dedicated independent verification. `RS-WO-002-13` has now passed its dedicated
independent verification against candidate `169cb95d60d4d91c8cd89ef4b722f6fc379db97f` and is ready for
main-thread integration. `RS-WO-002-12` is checkpoint-locally `BLOCKED` because its verifier Worktree
contains an out-of-scope tracked `.gitignore` mutation adding `.gstack/`; the mutation must be handled
under the ownership/recoverability gate before the clean tenant candidate can be re-verified. The parent
Task
must remain `in_progress` until the staged implementation, independent verification, integration,
browser walkthrough, and canonical writeback gates for the complete ordinary application slice are
complete without adding deferred WebRTC/Redis infrastructure.

## Closure evidence

- runnable local app;
- deterministic reset;
- primary flow walkthrough;
- role/privacy and stale-state guardrails;
- business-rule coverage for transitions, slot lifecycle, expiry, and repeated actions;
- exact test commands and results;
- updated development record and current status; and
- no changes outside the RightSpot folder.

## Reopen condition

Reopen if the primary user flow, authority boundary, scope decision, or future integration seam
changes materially.
