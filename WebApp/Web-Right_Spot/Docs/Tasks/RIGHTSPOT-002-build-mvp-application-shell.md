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
- Current increment: Implement and independently verify the bounded `RS-WO-002-04` persistence/application
  boundary after the independently verified workflow domain core.
- Next gate: Independently verify the adopted `RS-WO-002-04` candidate from T2 commit `68bbc69` in a
  dedicated Worktree; do not open the full API/UI surface as one assignment.
- Dependencies: ADR-RS-0001, ADR-RS-0002, ADR-RS-0003, and the accepted Requirements and Domain and
  Data Model documents.
- Process authority: ADR-RS-0004, ADR-RS-0005, ADR-RS-0006, and the RightSpot Thread Orchestration Pilot Runbook govern any
  supporting-task dispatch under this parent.
- Parent execution posture: `PROGRESSING` — the supporting-task identity correction is resolved by
  main-thread candidate adoption at T2 commit `68bbc69`; the dedicated independent verification gate
  remains open, and any additional work must pass the Pilot Runbook's ownership gates.
- Blocker reporting: the main thread reports the checkpoint-local blocker to the human owner and
  records its evidence, impact, owner, safe continuation, and resume condition here; this does not
  change the parent lifecycle to `blocked`.

## Parent-task boundary and active Work Orders

This record is the single registered parent Task and the one Task File for the complete first
ordinary application slice. Its objective and closure evidence describe the parent outcome. The
current executable increment is narrower: implement and independently verify the bounded
`RS-WO-002-04` persistence/application boundary before opening the wider API or UI surface. Later
implementation, verification, repair, and integration remain sequential
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
independent verification returned `VERIFIED` against that frozen source. `RS-WO-002-04` is the current
bounded persistence/application integration checkpoint.

Do not send this parent Task's full objective to one Builder. Do not treat a worker result as
verification, integration, or parent-Task closure.

### Current Work Order controls

- **Dispatch state:** `RS-WO-002-01` returned `READY_FOR_VERIFICATION`; the first `RS-WO-002-02`
  attempt returned `BLOCKED` on a verification-procedure boundary, and the corrected rerun returned
  `VERIFIED` at the unchanged execution baseline. `RS-WO-002-03` Builder and bounded Repairer both
  returned `READY_FOR_VERIFICATION`; its T2 source was frozen at `a60001e`, and the independent Verifier
  returned `NEEDS_REPAIR` for stale listing revision writes. The bounded Repairer completed in
  post-repair commit `6e70c9f`; fresh independent verification returned `VERIFIED`. Builder,
  Verifier, Repairer, and Integrator are sequential checkpoints of this Task, not pre-registered child
  Tasks.
- **Baseline:** The actual repository root is `WebMCP_Challenge`; the frozen implementation source
  for the next gate is post-repair commit `6e70c9f`, whose parent T2 source was `a60001e`. The
  six modified canonical documents are main-thread process-only writeback and are not part of the
  post-repair implementation commit. The original `RS-WO-002-04` dispatch baseline was reviewed commit
  `178d8873dc9c4a28a11da313e8425a3a25316b71`; after reviewing the three-path implementation checks,
  the main thread adopted the exact candidate at T2 implementation commit `68bbc69`. The dedicated
  verification checkout will be frozen at the post-writeback repository commit recorded when the
  Verifier is dispatched. The candidate remains pending dedicated independent verification. The
  user-authorized Side Chat learning file and process-only Pilot Runbook writeback are classified
  separately from product source. Source identity is checkpoint-scoped and path-owned; it is not a
  permanent full-document hash lock.
- **Read before action:** Repository `AGENTS.md` and Engineering controls, RightSpot `RUNBOOK.md`,
  `Docs/00-current-status.md`, the relevant product/domain/API/validation documents, ADR-RS-0001
  through ADR-RS-0006, and the Thread Orchestration Pilot Runbook.
- **Worker restrictions:** The foundation and domain-core writers have stopped. The current
  `RS-WO-002-04` Builder may modify only its three declared persistence/application/test paths; the
  corrected execution must use a dedicated supporting task and isolated Worktree. After it stops, the
  independent Verifier will have no authored mutable paths. Every checkpoint must
  classify the declared read, worker-write, main-thread-writeback, forbidden, and generated sets
  path-by-path; no worker may modify canonical authority, the Git index, or generated state outside
  explicitly ignored runtime paths. Short response-body assertions must use shell variables or an
  exact file under `var/test/`; `/tmp` and other external paths are not permitted. No worker may
  commit, push, deploy, publish, perform external actions, expand product scope, or change canonical
  authority.
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
**Execution state:** `READY_FOR_VERIFICATION` — main-thread candidate adoption completed at T2 commit `68bbc69`; dedicated independent verification is pending
**Owner:** Main RightSpot thread; one dedicated supporting task performs the read-only verification checkpoint
**Objective:** Persist the complete serializable `WorkflowState` in a deterministic local SQLite
snapshot and expose one narrow application service above the verified domain core. Prove durable
refresh-visible workflow continuity and atomic command/reset behavior without exposing HTTP, UI,
authentication, or external integration yet. This Work Order is governed by
[ADR-RS-0006](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md).
**Dispatch state:** The original Builder prompt was sent to supporting thread `01a05a6e-5758-7961-b774-53c332e685ef`,
whose persisted identity/title was `RS-WO-002-01 — Foundation…`, while the prompt identified
`RS-WO-002-04`; that handoff remains procedurally invalid. The main thread reviewed and adopted the
exact three-path candidate at T2 commit `68bbc69`. The user-authorized Side Chat learning file and
process-only Pilot Runbook writeback are not product source drift.  
**Corrective execution mode:** Dedicated isolated Worktree from T2 commit `68bbc69`; no product
writer is active and a dedicated read-only Verifier is the next supporting task.  
**Next gate:** Dispatch and complete independent verification against `68bbc69`. A fresh Builder is
required only if the candidate's ownership, inputs, changed paths, or behavior cannot be reconstructed
confidently, or if verification identifies a source gap requiring a new bounded implementation.

#### Dispatch identity incident

The persisted supporting task was originally activated for `RS-WO-002-01` and retains that title and
history. A later `send_message_to_thread` delivered a prompt whose content was `RS-WO-002-04`; the
content scope was bounded correctly, but the supporting-task identity did not match the Work Order.
This is a process/provenance defect, not evidence that the implementation behavior is wrong. The
three intended implementation paths were preserved, reviewed, and committed as the unverified T2
candidate `68bbc69`; they must not be treated as independently verified until the dedicated Verifier
completes.

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
- **Blocked claim/dependency:** the original clean `RS-WO-002-04` Builder handoff was invalid; dedicated
  independent verification remains pending
- **Impact on parent goal:** the original phase-4 checkpoint was held until candidate adoption; the
  provenance blocker is resolved, while the overall MVP goal remains in progress
- **Safe continuation:** main-thread architecture, UI/UX, code-quality, verification-matrix, and
  process analysis, or another explicitly bounded slice with a disjoint stable boundary
- **Forbidden continuation:** downstream code that depends on this persistence/application output,
  verification against the misidentified source, or any contract/acceptance change used to bypass it
- **Recommended recovery:** completed by preserving and reviewing the candidate, establishing T2
  source `68bbc69`, and preparing a dedicated matching verification task and isolated Worktree
- **Resume condition:** the dedicated Verifier must reproduce the required result against `68bbc69`
  before the persistence/application checkpoint is accepted or downstream work opens

#### Candidate-adoption record

- **Adoption basis:** the original writer had stopped; the exact Work Order write set contained all
  authored changes; the candidate matched the declared inputs and acceptance criteria; and the main
  thread reproduced the focused checks.
- **Adopted paths:** `src/server/persistence/workflow-store.ts`,
  `src/server/application/workflow.ts`, and `tests/application/workflow.test.ts` only.
- **Evidence:** Node.js `v24.20.0`, npm `11.19.0`, typecheck, foundation tests `6/6`, application tests
  `8/8`, repository validators, sensitive scan, and staged `git diff --check` passed.
- **Source identity:** local Git commit `68bbc69`; no external push or deployment was performed.
- **Claim limit:** this is an adopted, unverified candidate. It does not claim independent
  verification, API/UI integration, browser behavior, deployment, or parent-task closure.

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

The runnable foundation and `RS-WO-002-03` domain core are independently verified; the bounded repair
for the listing-version guard defect is committed as `6e70c9f`. The next gate is to define one bounded
persistence/application integration checkpoint before opening the wider API/UI surface. The
parent Task must remain `in_progress` until the staged implementation, independent verification,
integration, and canonical writeback gates for the complete ordinary application slice are complete
without adding deferred WebRTC/Redis infrastructure.

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
