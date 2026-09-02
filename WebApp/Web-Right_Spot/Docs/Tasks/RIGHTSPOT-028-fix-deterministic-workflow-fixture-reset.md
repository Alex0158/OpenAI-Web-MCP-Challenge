# RIGHTSPOT-028: Restore deterministic workflow fixture reset

**Type:** `defect`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for local demo reproducibility and stateful test safety  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-15`; `RSP-REL-01`; the existing `WorkflowApplication.reset` contract; pinned
Node.js `v24.20.0`

## Task control

- **Type:** `defect`
- **Lifecycle:** `in_progress`
- **Priority:** `P1` within the local development/test boundary; no production impact is claimed
- **Owner:** Main RightSpot thread
- **Current increment:** Make the documented `npm run db:reset` command perform the authoritative
  deterministic workflow-fixture reset and leave a valid, reopenable database.
- **Execution posture:** `MAIN_BUILDER_READY_FOR_VERIFICATION`
- **Evidence status:** `VERIFIED_DEFECT` from an isolated stateful reproduction against the current
  Main source
- **Next gate:** Freeze the exact candidate and use a persistent independent Verifier. Builder and
  Verifier results are not closure by themselves.
- **Reopen condition:** Reopen or replace this Task if the repair requires changing workflow state
  semantics, generation authority, arbitrary-database recovery, or any path outside the declared
  bounded scope.

## Verified problem

The canonical business-flow catalogue and `RSP-REL-01` define `npm run db:reset` as the local
operator entry for restoring a deterministic workflow fixture. The current script does not invoke
that workflow reset. It imports the foundation-only helper from `src/server/persistence/reset.ts`,
which updates `foundation_metadata.generation` and `PRAGMA user_version` but does not clear or write
the authoritative workflow snapshot.

The current source contains the correct full reset authority already: `WorkflowApplication.reset`
delegates to `WorkflowStore.reset`, which atomically creates the initial listings, slots, actors,
empty request/Favourites/audit/processed-command state, and a matching fixture generation. The
defect is that the documented CLI bypasses this authority.

### Isolated reproduction

The defect was reproduced in a disposable database outside the product source tree. The probe first
created a real `TENANT_DRAFT` request and one Favourite, then ran the current reset command twice:

1. A fresh application starts at generation `1` with a valid workflow snapshot.
2. The first `resetFoundationDatabase` call reports generation `1`, but the request remains
   `TENANT_DRAFT` and the Favourite remains present.
3. The second call reports generation `2`, while the workflow snapshot remains at generation `1`
   with the request and Favourite still present.
4. Reopening `WorkflowApplication` then fails with `WorkflowPersistenceError` because the metadata
   and snapshot identities no longer agree.

Observed isolated output:

```text
initial: generation 1, request TENANT_DRAFT, favourites 1
firstResetResult: 1
afterFirst: generation 1, request TENANT_DRAFT, favourites 1
secondResetResult: 2
afterSecond: error WorkflowPersistenceError
metadata: generation 2
snapshot: fixture_generation 1, request TENANT_DRAFT, favourites 1
```

This is a verified reproducibility and persistence-integrity defect, not a preference about reset
wording. It can leave a local demo or test database in a state that the application cannot reopen.

## Intended contract

`RS-FLOW-15` remains the product/documentation authority. In an intentionally disposable local
development or test environment, `npm run db:reset` must:

1. execute the same authoritative full workflow reset used by the application layer;
2. preserve the database file boundary while replacing its disposable workflow state;
3. produce three synthetic published listings and their primary available slots, the demo tenant and
   agent, no Viewing Request, no Favourites, no audit records, and no processed commands;
4. write a matching metadata and workflow-snapshot fixture generation;
5. keep the result valid and reopenable after the first reset and after repeated resets;
6. preserve stale-generation protection for pages or commands carrying the previous generation; and
7. report the resulting generation without exposing an absolute local path or treating the command as
   a production data-management operation.

The initial fresh database remains generation `1`; a later valid reset advances to the next
generation. Reset must be atomic at the existing persistence boundary: a failed reset must not
leave only metadata or only snapshot state updated, and the CLI must close its application/database
handle even when reset or reporting fails.

## Bounded objective

Repair the local CLI composition so that `npm run db:reset` constructs a `WorkflowApplication`, calls
its existing full `reset` operation, closes it in a `finally` path, and reports the returned workflow
fixture generation. Add a focused child-process regression that executes the actual reset script in
an isolated test-owned working directory and proves the stateful and repeated-reset contract.

This is a narrow command-composition and regression-test repair. It must not redesign the workflow
state machine, persistence schema, fixture contents, or public application behavior.

## Work Order

### RS-WO-028-01 — Repair the local deterministic workflow reset command

**Role:** Main-thread Builder → frozen-source independent Verifier → Main documentation/closure  
**Status:** `READY_FOR_VERIFICATION`  
**Execution state:** `READY_FOR_VERIFICATION`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_RESET_COMMAND` — reset authority, CLI behavior, and its focused regression
share one persistence boundary; no other worker may alter the reset script or run a competing reset
against the same database during the lane.  
**Execution profile:** `Standard` — one small runtime composition change plus one isolated regression  
**Supporting task policy:** Use a persistent task/thread for any formal Builder or independent
Verifier. A transient SubAgent may assist only with disposable read-only analysis and cannot own
source, verification, repair, or closure.  
**Next gate:** Freeze the exact candidate and dispatch one persistent independent read-only Verifier.

### Authority and design decision

- `WorkflowApplication.reset` / `WorkflowStore.reset` is the authoritative full workflow reset.
- `resetFoundationDatabase` remains a foundation-only helper and must not be silently broadened;
  existing foundation tests and its direct semantics remain unchanged.
- The CLI must not implement a second reset algorithm, manually duplicate fixture SQL, or add a
  fallback that guesses how to repair a mismatched database.
- The focused regression must spawn the real script rather than importing it in the test process;
  a direct import would execute a CLI side effect against the default database.
- The test must use an exact fresh child working directory under the RightSpot package's
  test-owned `var/test` boundary. It must never use the default product database and must not delete
  pre-existing files as cleanup.
- An already-invalid or corrupt database is a visible recovery boundary, not an authorization to
  add automatic salvage. The repair guarantees future valid reset invocations; arbitrary existing
  corruption remains outside this Task and must fail visibly without diagnostic leakage.

## Main design review — 2026-09-02

**Decision:** `ACCEPTED_FOR_TDD` by the Main RightSpot thread. The Work Order is sufficiently
bounded to enter the Builder checkpoint without a new product or architecture decision.

The review checked the following boundaries:

- **Authority:** `WorkflowApplication.reset` already delegates to `WorkflowStore.reset`, which
  atomically reads the current valid snapshot, chooses the documented initial/repeated generation,
  writes foundation metadata and the complete deterministic workflow snapshot, and returns the
  resulting state. The CLI must compose this authority, not duplicate it.
- **Generation:** a fresh database remains generation `1`; each later valid reset advances the
  generation and writes the same value into metadata and snapshot. The focused test will cover
  both the first reset and repeated resets.
- **Atomicity and close:** the existing store transaction is the persistence boundary. The script's
  `finally` close is the process boundary. No second transaction, retry, or recovery layer is
  needed.
- **Test isolation:** the regression invokes the real script in a unique child `cwd` below
  `var/test`, then opens that exact child database through `WorkflowApplication`. It will not import
  the script in-process, touch the running app's default database, or delete existing artifacts.
- **Compatibility:** `resetFoundationDatabase` remains covered by its existing foundation tests
  and keeps its foundation-only semantics. No API, UI, domain transition, snapshot schema, package
  dependency, or external integration changes are required.
- **Failure boundary:** an already-corrupt or generation-mismatched database remains a visible
  persistence failure. This Task fixes the documented valid reset path and does not invent salvage
  behavior or hide an invalid source state.
- **Concurrency/scope:** reset is a shared persistence boundary, so the Work Order is serial. The
  only product source paths are the script and focused test; Main owns all docs and final integration.

**Review outcome:** proceed with Red→Green. If any item above proves false during implementation,
stop and return the Work Order to `NEEDS_REVIEW` rather than broadening the scope.

### Required read set

- `scripts/reset-db.ts`
- `package.json`
- `src/server/application/workflow.ts`
- `src/server/persistence/workflow-store.ts`
- `src/server/persistence/reset.ts`
- `src/server/persistence/sqlite.ts`
- `src/server/domain/workflow.ts`
- `src/server/domain/types.ts`
- `tests/foundation.test.ts`
- `tests/application/workflow.test.ts`
- `tests/application/favourites.test.ts`
- `Docs/02-requirements.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Tasks/README.md`
- `RUNBOOK.md`

### Worker write set

- `scripts/reset-db.ts`
- `tests/application/reset-script.test.ts` (new focused regression)

### Main documentation writeback set

- This Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- `README.md` only if its current status claim includes the now-open finding
- `RUNBOOK.md` only if the command procedure or reset boundary needs durable clarification

Supporting workers must not modify canonical documents, the Task ledger, or the Runbook. Main owns
all status, evidence, and contract writeback.

### Forbidden set

- `src/server/persistence/reset.ts` unless Main's design review proves that the existing full reset
  authority cannot satisfy the contract
- `src/server/persistence/workflow-store.ts`, `src/server/application/workflow.ts`, domain state
  transitions, snapshot schema, fixture contents, generation rules, or migration code
- API routes, UI, session/authentication, Favourite semantics, listing behavior, or role/privacy
  projections
- package dependency/version/lockfile changes
- default `var/rightspot.sqlite` and any user-owned database
- `.next/`, browser state, logs, or other generated output as product source
- outer `WebApp/Web-Game` files, shared repository policy, Git metadata, branches, commits, pushes,
  deployment, credentials, or external services
- WebMCP, Cloud Receiver, WebRTC, Redis, external authentication, payment, notification, or
  production data-management behavior

### Generated/test-owned set

- `var/test/reset-script-*` and its child `var/rightspot.sqlite` databases created by the focused
  test
- `.next/`, compiler output, server logs, and browser artifacts produced during verification

Generated artifacts may be created for evidence but must not be staged as product source. Do not
perform broad cleanup merely to make the tree look clean.

## TDD contract

### Red

Add and run the focused regression against the current script. It must demonstrate both defects:

1. after creating a request and Favourite, the actual reset command does not clear them; and
2. after a repeated reset, metadata and the workflow snapshot diverge and the application cannot
   reopen normally.

The test must invoke the actual script in a child process with an isolated `cwd`, assert its exit
status/output, then open the same explicit database through `WorkflowApplication` to inspect the
authoritative state. The Red result must be recorded; a broad source assertion or a mocked helper is
not sufficient.

### Green

Change only the script's composition to:

1. construct `WorkflowApplication` using its default database path relative to the CLI `cwd`;
2. call `application.reset(new Date().toISOString())` (or an equivalent current timestamp passed to
   the existing reset contract);
3. report the returned workflow generation with bounded, non-sensitive output; and
4. close the application in `finally`.

The focused regression must then pass for a fresh reset, a reset after real request/Favourite state,
and a repeated reset. The foundation-only helper and its tests must remain unchanged.

### Refactor

Only behavior-preserving local cleanup is allowed after Green. Do not create a generic reset service,
change the database abstraction, or add recovery paths. Re-run the focused regression after every
refactor.

## Acceptance criteria

1. `npm run db:reset` delegates to the existing full workflow reset authority and exits successfully
   in an isolated disposable local working directory.
2. The command output identifies the workflow fixture generation and does not print an absolute
   database path or claim a production reset.
3. A reset after a real `TENANT_DRAFT` and Favourite leaves no request, Favourite, audit record, or
   processed command, while preserving the deterministic three-listing/three-primary-slot fixture.
4. The first reset on a fresh database yields a valid generation `1`; repeated valid resets yield
   matching incremented generations and remain reopenable.
5. Metadata and workflow snapshot identity are updated through the existing atomic persistence
   transaction; no partial metadata-only reset remains possible through the documented CLI.
6. Existing stale-generation and persistence-failure behavior remains visible and unchanged; no
   automatic salvage or broad fallback is introduced.
7. `resetFoundationDatabase` remains foundation-only and its existing focused tests pass.
8. The focused regression is explicit Red→Green; no test is weakened, skipped, mocked around, or
   made dependent on the default product database.
9. Pinned Node.js `v24.20.0` / npm `11.19.0` checks pass: focused test, full direct suite,
   `npm run typecheck`, `npm run build`, and `git diff --check`.
10. Exact changed paths remain within the worker write set plus Main's declared documentation
    writeback set. No outer Web-Game file or unrelated collaborator change is staged or modified.
11. Independent verification uses a frozen post-Builder source identity and independently confirms
    command exit status, reset state, repeated generation/reopen behavior, path scope, and the
    non-goals. The Verifier performs no repair, source integration, commit, or documentation writeback.
12. Main updates the flow disposition, current status, roadmap, task index, and any affected Runbook
    wording only after the repair and evidence are actually complete.

## Main Builder result — 2026-09-02

The Main-thread Builder completed the bounded Red→Green repair without opening a supporting
implementation Worktree. The focused test invokes the real `scripts/reset-db.ts` in an isolated
child `cwd` and inspects the resulting database through `WorkflowApplication`.

- **Red:** The baseline failed `1/1`. The old script reported `foundation generation`; after
  stateful reset, metadata advanced while the snapshot stayed at generation `1`, the
  `TENANT_DRAFT`, one Favourite, one audit record, and two processed commands remained, and the
  application could not reopen.
- **Green:** `tests/application/reset-script.test.ts` passed `1/1` after the script was changed to
  call the existing `WorkflowApplication.reset` and close it in `finally`.
- **Refactor:** None; no generic reset layer, fallback, or persistence/domain change was added.
- **Aggregate checks:** The full direct suite passed `133/133`; pinned `npm run typecheck` passed;
  pinned `npm run build` passed on Next.js `16.3.4`; and `git diff --check` passed for the
  RightSpot increment.
- **Changed product paths:** `scripts/reset-db.ts` and
  `tests/application/reset-script.test.ts`. The documentation/status paths are Main-owned
  writeback and are not part of the Builder's product source write set.
- **Boundary confirmation:** The foundation-only helper, workflow state machine, snapshot schema,
  default database, UI/API/auth code, package dependencies, outer Web-Game, generated output, and
  deferred integrations were not changed by this increment. The test leaves only its own ignored
  `var/test` evidence and never touches the running app database.
- **Handoff:** The exact candidate paths and hashes must be recaptured immediately before dispatch;
  the independent Verifier must use that frozen source and remain read-only.

## Suggested focused test boundary

The test may use the established `var/test` convention and should:

1. create a unique exact child directory without deleting any existing directory;
2. run the actual `scripts/reset-db.ts` through the pinned Node/tsx entrypoint with that directory
   as `cwd`;
3. instantiate `WorkflowApplication` against the child database, create one real draft and Favourite,
   close it, and run the script again;
4. reopen the explicit database and assert the full deterministic reset state and generation `2`;
5. run the script once more and assert generation `3` remains valid and reopenable; and
6. close every application handle in `finally` so the test itself does not create a locking artifact.

The test is allowed to leave its own ignored `var/test` evidence. It must not reset, inspect, or
mutate the default database used by the running local app.

## Stop conditions

Stop and report to Main before changing code if:

- `WorkflowApplication.reset` cannot be used without changing an unresolved domain or persistence
  contract;
- the reset script's intended database path cannot be isolated by child `cwd` without modifying
  production configuration;
- repeated reset semantics differ from the documented initial-generation rule;
- making the test pass requires changing `resetFoundationDatabase`, snapshot schema, or corruption
  recovery;
- a test or command would touch the default database, delete a pre-existing file, or cross the
  RightSpot boundary; or
- another task changes the reset read set or either declared write path during this lane.

## Builder return gate

Return `READY_FOR_VERIFICATION` only with:

- the exact source identity, repository root, branch/HEAD, physical Worktree list, pinned runtime,
  and isolated database path;
- the focused Red failure and Green pass, including the real child-process command boundary;
- full direct suite, typecheck, build, whitespace, and path-scope results;
- exact changed paths and diff summary;
- confirmation that the foundation-only helper, workflow semantics, schema, default database, outer
  Web-Game, and all forbidden integrations were untouched;
- explicit residuals, especially the no-automatic-recovery boundary; and
- a frozen source identity suitable for a read-only independent Verifier.

## Closure gate

Close only when the accepted reset contract is implemented with focused Red→Green evidence, the
full pinned checks pass, a persistent independent Verifier confirms the frozen candidate, Main
reconciles the flow/status/roadmap/task documentation, and the exact candidate is integrated in the
canonical Main Worktree. A local test pass alone is not closure.

## Non-goals

- No public reset route, admin CRUD, production migration, retention/deletion policy, or recovery
  service.
- No change to `WorkflowStore.reset` semantics, generation rules, fixture data, stale-command rules,
  or foundation helper semantics.
- No automatic repair of an already-corrupt or generation-mismatched arbitrary database.
- No UI, API, authentication, notification, chat, Information Request, WebMCP, Cloud Receiver,
  WebRTC, Redis, payment, deployment, or commercial-readiness work.
