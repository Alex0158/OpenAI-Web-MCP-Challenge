# RIGHTSPOT-050 — Withhold stale Tenant mutation actions after failed conflict recovery

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant action safety and state truthfulness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Finding:** `F-25` — a failed conflict recovery leaves stale Tenant mutation controls usable  
**Depends on:** closed [`RIGHTSPOT-030`](RIGHTSPOT-030-fix-tenant-request-read-concurrency.md),
closed [`RIGHTSPOT-031`](RIGHTSPOT-031-preserve-tenant-conflict-recovery-feedback.md), ADR-RS-0008,
and the Tenant request rules in [`07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md)

## Task control

- **Objective:** When a Tenant request mutation receives a stale-write `409` and the recovery read
  also fails, prevent the still-rendered old request from being edited or submitted as if it were
  current in both Tenant request surfaces.
- **Execution posture:** `CLOSED_VERIFIED` — bounded UI-consumer repair completed serially in the
  canonical Main Worktree; no external dispatch or implementation Worktree was required.
- **Blocking status:** Non-blocking to `RIGHTSPOT-047` and `RIGHTSPOT-048`; it does not change the
  Agent Operations WebMCP candidate or the shared role-page lifecycle gate.
- **Current increment:** Complete. The focused contract failed against the pre-repair implementation,
  then passed after the smallest editor-owned failed-recovery gate was added; the full bounded
  verification ladder and the supported normal conflict-recovery browser branch also passed.
- **Next gate:** No open 050 implementation or verification gate remains. Main must commit this
  coherent source/test/documentation checkpoint and return to the separate Tenant WebMCP
  registration-observability gate in `RIGHTSPOT-051`.
- **Source baseline at registration:** Main `7650db00cc60d23b262b6c506c81e8913ad4d3ca`; the
  RightSpot source/test paths were clean, while the existing validation-ledger edit and protected
  untracked artifacts were excluded from this Task's product write set.
- **Main authority:** Main owns admission, source identity, exact-path review, implementation,
  verification acceptance, canonical documentation, Git closure, and any later dispatch decision.

## Verified problem

`TenantRequestEditor` handles a stale mutation by attempting `readTenantRequest()` after the server
returns `409`. If that recovery read rejects, the editor reports the truthful existing message that
the latest tenant view could not be refreshed, but it keeps the previous request data mounted. Its
`finally` block then clears the pending flag. The old editor therefore becomes editable again and its
Save/Submit controls can issue another mutation from a state that is explicitly known not to be fresh.

The same editor boundary is consumed by the request dashboard and listing detail. This is a real
consumer defect, not a server-integrity failure: the server version guard still rejects stale writes,
and no private data exposure was reproduced. The defect is that the UI does not withhold a consequential
action after it has admitted that its authoritative recovery failed.

The existing `RIGHTSPOT-031` repair remains valid for successful recovery feedback and truthful
failure copy. This Task is not a reopening of that outcome: it adds the missing action-safety gate
after the failed-refetch branch.

## Bounded objective and required behavior

The repair must apply to both:

- `/tenant/requests`; and
- `/tenant/listings/[listingId]`.

After a stale mutation conflict followed by a failed recovery read:

1. The page must retain the bounded truthful recovery-failure message; it must not claim that fresh
   state was shown or that the mutation succeeded.
2. The stale request editor must not accept further field edits or issue Save/Submit while the
   recovery-failed gate is active. A disabled fieldset or an equivalent explicit action gate is
   acceptable if keyboard and screen-reader state remain truthful.
3. No mutation may be sent while the gate is active. No local workflow patch, replay, automatic retry,
   or guessed merge is allowed.
4. The gate may clear only after a fresh authoritative request has been accepted by the existing
   read boundary or after a full page/component remount that establishes a new request read. The
   repair must not silently clear it merely because the pending flag ended.
5. Unrelated listing facts, navigation, Favourite behavior, server authority, request versions,
   successful conflict recovery, ordinary draft save, and explicit submit behavior must remain
   unchanged.
6. The user-facing copy remains bounded and server-safe; raw recovery exceptions must not be rendered.

The implementation may choose the smallest state/callback shape that satisfies these rules. It must
not add a new API, domain state, persistence behavior, generic error framework, or refresh subsystem.

## Implementation boundary

### Required read set

- repository `AGENTS.md`, the RightSpot `README.md`, and `RUNBOOK.md`;
- `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/07-business-flows-and-scenarios.md`, and the applicable development roadmap;
- `RIGHTSPOT-030`, `RIGHTSPOT-031`, ADR-RS-0008, and the tenant request state rules;
- `src/ui/tenant/tenant-request-page.tsx` and `src/ui/tenant/tenant-listing-page.tsx`;
- the existing Tenant request editor, read-concurrency, feedback, and state-truthfulness tests; and
- the pinned Node/npm runtime and current package scripts.

### Main write set

This serial Main-thread repair may modify only:

- `src/ui/tenant/tenant-request-page.tsx` — failed-recovery action gate and existing editor feedback
  wiring only;
- `src/ui/tenant/tenant-listing-page.tsx` — the corresponding parent/editor gate wiring only;
- `tests/ui/tenant-conflict-recovery.test.ts` — focused regression contract; and
- the canonical Task, status, flow, validation, and roadmap records required for closure.

No separate Development record is required unless the implementation produces evidence that cannot be
kept in this Task File and the existing validation ledger.

### Forbidden set

- all server, route handler, application command, domain, DTO, persistence, fixture, reset, auth,
  shared-shell, global CSS, package, dependency, or generated paths;
- `TenantWebMcp`, Agent Operations, WebMCP, Cloud Receiver, external authentication, WebRTC, Redis,
  deployment, notification, contact, Information Request, or commercial-marketplace behavior;
- automatic retry, local state reconciliation, optimistic workflow patching, stale-data replay,
  changing server conflict semantics, or weakening existing tests;
- modification of the separate listing-detail dynamic-route `F-08` read-order concern; and
- Worktree creation, Git index changes, commit, push, deletion, or unrelated-file cleanup as part of
  the implementation checkpoint.

### Generated/evidence set

Existing disposable `.playwright-cli/` output and local runtime artifacts remain outside the source
write set. They must not be staged or treated as product evidence without a recorded source, fixture,
runtime, and session identity.

## Red → Green → Refactor plan

### Red

Extend the focused conflict-recovery contract so it fails against the current implementation when:

- the recovery read rejects after a stale mutation;
- the truthful failure message is present; and
- the stale editor still exposes enabled editing, Save, or Submit behavior.

The contract must cover both parent surfaces and assert that the gate is distinct from ordinary
pending-state disabling.

### Green

Add the smallest explicit recovery-failed state owned by the existing editor/parent boundary. Set it
only when the authoritative recovery read fails, use it to withhold editor mutation controls, and
clear it only on accepted fresh request data or remount. Preserve the existing successful recovery
path and bounded failure copy.

### Refactor

Remove duplication only within the two existing tenant components. Keep the state transition readable,
retain the current server-authoritative flow, and avoid introducing a shared abstraction for a single
bounded failure gate.

## Acceptance criteria

Close this Task only when all are true:

1. The failed `409` recovery path is explicitly represented in focused Red → Green → Refactor tests.
2. Both `/tenant/requests` and listing detail withhold stale editor edits and Save/Submit after the
   recovery read fails.
3. No Save/Submit request is sent while the recovery-failed gate is active.
4. A fresh authoritative read or page remount is the only way to clear the gate; successful conflict
   recovery remains usable and truthful.
5. Existing ordinary draft save, explicit submit, successful conflict recovery, privacy, role, and
   version boundaries remain intact.
6. Focused tests, full `npm test`, `npm run test:foundation`, non-incremental typecheck, production
   build, repository validators, RightSpot-sensitive scan, and `git diff --check` pass under Node
   `24.20.0`.
7. Any browser claim uses a fresh isolated session and records actual mutation/network evidence; a
   harness limitation must remain a limitation, not be converted into a product pass.
8. Main reviews exact paths, updates the relevant core records, commits the coherent checkpoint, and
   confirms the single canonical Main Worktree.

## Work Order

### RS-WO-050-01 — Withhold stale Tenant actions after failed recovery

**Status:** `CLOSED_VERIFIED`  
**Role:** Main-thread Tenant UI Builder and verifier  
**Parallelization:** `SERIAL_TENANT_CONFLICT_RECOVERY_GATE` — the request editor and both parent
surfaces form one small consumer boundary; no parallel writer is admitted  
**Dispatch:** Not dispatched; Main completed the serial repair directly in the canonical Main Worktree  
**Execution mode:** Canonical Main Worktree; no extra Worktree planned  
**Worker write set:** the three source/test paths in the Main write set above  
**Main writeback set:** this Task File, current status, business-flow catalogue, validation ledger,
roadmap, and exact Git closure records  
**Stop condition:** If the gate needs a server/API/domain decision, a new user-visible workflow state,
  the dynamic-route `F-08` read sequencing, or a new dependency, stop and return to Main's decision gate.

## Closure evidence — 2026-09-03

Main reproduced the focused Red state before implementation: the failed `409` recovery-read branch
retained the truthful failure notice but had no independent action-safety gate. The focused contract
then passed Green after `TenantRequestEditor` added `isRecoveryBlocked`, explicit guards for field and
mutation handlers, and disabled-state exposure for the existing fieldset, Save, and Submit controls.
The successful conflict branch clears the gate only after `readTenantRequest()` returns an accepted
authoritative response; a remount also starts with a fresh editor state. No server/API/domain/workflow,
listing, fixture, dependency, shared-shell, or `tenant-listing-page.tsx` behavior changed.

The exact product/test paths were `src/ui/tenant/tenant-request-page.tsx` and
`tests/ui/tenant-conflict-recovery.test.ts`. The focused test passed `1/1`; the complete package suite
passed `226/226` across `47` authored test files; `test:foundation` passed `6/6`; non-incremental
typecheck, production build, repository validation, validator tests, RightSpot-scoped sensitive scan,
and `git diff --check` passed under Node `v24.20.0` / npm `11.19.0`. The build retained only the known
Operations dynamic-filesystem tracing warning at `src/server/persistence/operations-store.ts:104`.

In a fresh supported local browser session, a competing Tenant surface first advanced the disposable
request from version 1 to version 2. The stale `/tenant/requests` editor then attempted a write and
received the real `409` response; its recovery read returned version 2, the UI rendered the bounded
conflict notice, and the editor rehydrated with the server's `2026-10-10T10:00` value. Post-recovery
Option, Save, and Submit controls were enabled again. The disposable fixture was reset to generation
`89` after the replay. This proves the successful recovery branch only; the in-app browser URL policy
blocked a temporary proxy needed to inject a failed recovery read, so no browser claim is made for
that injected failure branch. The failed branch remains covered by the focused source contract and its
bounded state/action assertions.

Main reviewed the exact diff and preserved all unrelated Web-Game and RightSpot boundary artifacts.
No Git index, commit, push, Worktree, cleanup, or generated-artifact change was made by the Builder
checkpoint; the Main closure commit is the next and final Git action for this Task.

## Stop and reopen conditions

Stop and report `BLOCKED` if the repair cannot withhold mutation without changing server authority,
requires a new API/domain contract, or exposes a need to merge stale data automatically. Do not widen
the Task to fix un-reproduced listing-route races or to add a generic recovery framework.

Reopen if a failed recovery leaves an enabled mutation path, if a blocked editor can send a request,
if the UI claims fresh state without an accepted fresh response, or if the repair changes workflow,
privacy, or role semantics.

## Current disposition

`F-25` was a verified P2 Tenant consumer defect registered from the 2026-09-03 cross-layer audit.
The existing server conflict/version guard remains authoritative and the current truthful error copy
is retained. The serial Main repair now withholds stale edits and Save/Submit after a failed recovery
read in both consumers of the shared editor, while successful recovery remains reviewable and usable.
`RIGHTSPOT-050` is closed within this bounded Tenant consumer action-safety claim; it does not claim
browser evidence for an injected failed-refetch branch, change server authority, or reopen `F-08`.
