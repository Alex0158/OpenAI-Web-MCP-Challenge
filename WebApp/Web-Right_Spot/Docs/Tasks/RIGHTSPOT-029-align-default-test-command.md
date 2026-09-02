# RIGHTSPOT-029: Align the default RightSpot test command with the complete suite

**Type:** `verification`
**Lifecycle:** `closed`
**Priority:** `P1` for trustworthy local closure evidence
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** Current RightSpot package test surface and the audit record
[`RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`](../Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md)

## Task Control

- Type: `verification`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Make the default `npm test` command execute the complete RightSpot test suite
  while preserving an explicit fast foundation command.
- Execution posture: `CLOSED`
- Evidence status: `CLOSED_VERIFIED` — `npm test` now runs the complete authored suite (`133/133`),
  and `npm run test:foundation` preserves the explicit `6/6` foundation check.
- Next gate: Return to the Main-thread cross-layer audit. Reopen only if a newly authored test is
  silently excluded or the command contract regresses.
- Dependencies: None. This Task is independent of the product runtime and does not reopen closed
  product Tasks.

## Verified problem

The current package manifest defines:

```json
"test": "tsx --test tests/foundation.test.ts"
```

That command is the original foundation check. It is still green, but the RightSpot package now
contains 28 test files covering the domain, persistence, application, API, UI contracts, reset
composition, and foundation. The pinned complete command:

```sh
tsx --test 'tests/**/*.test.ts'
```

passes 133 tests. Because the default command does not run those additional files, a normal
`npm test` green result can be mistaken for complete application verification.

This is a verified verification-contract defect, not a claim that the omitted tests currently fail.
The complete suite is green at the registered baseline.

## Bounded objective

1. Change `npm test` to run every authored `tests/**/*.test.ts` file through the existing pinned
   `tsx`/Node test path.
2. Add `npm run test:foundation` as the explicit six-test fast foundation check so historical and
   focused foundation verification remains available without mislabelling it as the full suite.
3. Keep the command portable within the existing supported local development environment and avoid
   shell assumptions that would silently omit nested test files.
4. Reconcile the current RightSpot Runbook, validation/evidence guidance, Task index, and status
   wording so `npm test` means the complete suite and `test:foundation` means the narrow check.
5. Preserve the exact test files and their behavior; no framework migration or test weakening is
   allowed.

## Non-goals and boundaries

- No product runtime, domain state, API, UI, persistence, authentication, or data changes.
- No new dependency, package version, lockfile, build, or framework change.
- No rewrite of existing tests merely to change the count.
- No deletion, renaming, or relocation of test files.
- No changes to the outer `WebApp/Web-Game`, repository Git metadata, Worktrees, deployment,
  credentials, WebMCP, Cloud Receiver, WebRTC, Redis, or external services.
- Historical Task Files may continue to report the foundation command exactly as it was used for
  their historical checkpoint; current instructions must link to the clarified command names rather
  than rewriting historical evidence.

## Source identity and scope

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch: `main`
- Pre-Green baseline: `e71977a95c61383906d78527e4d3e392f24581d5`
- Green integration commit: `552a458425cf68be2491ee7e988470a8b322afc3`
- Physical Worktrees: canonical Main only
- Green source change: `WebApp/Web-Right_Spot/package.json` only; no lockfile or dependency change
- Current-document reconciliation: this Task, the RightSpot status, validation, roadmap, Runbook,
  Development index, and audit record only
- Unrelated outer `Web-Game` changes, existing local-only RightSpot artifacts, and the mistaken
  nested reset-test artifact were preserved and excluded from staging

## Work Order

### RS-WO-029-01 — Repair the package test-command contract

**Role:** Main-thread Builder → current-document reconciliation → frozen-source verification
**Status:** `INTEGRATED`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread
**Parallelization:** `SERIAL_PACKAGE_CONTRACT` — package scripts and their current verification
documentation form one small shared command contract; no other worker should edit these paths during
the Work Order.
**Execution profile:** `Standard` — one package-script correction plus bounded documentation
reconciliation; no application behavior change.
**Next gate:** Complete. The package script and current verification guidance are integrated in the
canonical Main Worktree and passed the required checks.

### Red evidence — 2026-09-02

Against the registered baseline, pinned npm `11.19.0` ran `npm test` successfully but reported only
`6/6`, because the script named `tests/foundation.test.ts`. The same pinned Node.js `v24.20.0`
runtime ran the complete authored glob and reported `133/133` across 28 test files, with no skip or
todo. This is the failing verification-contract condition: the default green command omitted known
authored tests.

### Green implementation and closure evidence — 2026-09-02

The smallest Green change updated only the package script contract: `npm test` now invokes
`tsx --test "tests/**/*.test.ts"`, and `npm run test:foundation` names the original foundation-only
command. The current verification guidance, status, roadmap, and audit index were reconciled without
rewriting historical checkpoint evidence.

Pinned Node.js `v24.20.0` / npm `11.19.0` evidence:

- `npm test`: `133/133`, no skipped or todo tests
- `npm run test:foundation`: `6/6`
- `npm run typecheck`: pass
- `npm run build`: pass on Next.js `16.3.4`
- `npm run db:reset`: generation `5`, followed by a browser reload showing the tenant empty-request
  state and `Browse rentals` entry
- `/api/health`: `{"ok":true,"service":"rightspot"}`
- exact scoped diff, whitespace, package-script contract, and project-language checks: pass

No product source, test body, dependency, lockfile, database authority, or external integration was
changed. The single canonical Main Worktree remains the source authority, and the temporary audit
browser tab was closed after the reset smoke; the user-owned tab was preserved.

### Accepted command contract

| Command | Meaning | Expected coverage |
|---|---|---|
| `npm test` | Default RightSpot application verification | All authored `tests/**/*.test.ts` files; current baseline 133 tests |
| `npm run test:foundation` | Fast foundation-only check | `tests/foundation.test.ts`; current baseline 6 tests |

The exact command may use an existing portable glob mechanism or a narrowly scoped repository script
if the current shell behavior requires it. Do not use a second test runner, a silent file allowlist,
or a fallback that returns success when test discovery fails.

### TDD gate

1. **Red:** Against the current manifest, capture that `npm test` reports `6/6` while the complete
   authored test glob reports `133/133`. The red condition is the verification contract: the default
   command omits known authored test files.
2. **Green:** Change only the package script contract and the minimum current documentation needed
   to make the two command meanings explicit. The existing complete suite must remain unchanged.
3. **Refactor:** If needed, simplify the command expression or documentation after Green without
   changing coverage or introducing a new abstraction.

### Required read set

- `package.json`
- `README.md`
- `RUNBOOK.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/00-current-status.md`
- `Docs/Tasks/README.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- all authored `tests/**/*.test.ts` paths needed to confirm discovery scope
- repository `Docs/Engineering/02-testing-and-verification.md`

### Main write set

- `package.json`
- this Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- `RUNBOOK.md` and `README.md` only where current command meaning is stated
- a bounded `Docs/Development/` closure record if needed

### Forbidden and generated sets

**Forbidden:** authored test content unless a command-discovery regression is required and explicitly
accepted; all `src/` product code; domain, persistence, API, UI, authentication, database fixtures;
package dependencies and lockfiles; outer application files; Git metadata; Worktrees; deployment,
credentials, or external integrations.

**Generated/local-only:** `.next/`, `var/test/`, browser state, server logs, and test output. These
must not become tracked source or be used to make a failed command appear successful.

## Verification and closure gate

Under Node.js `v24.20.0` / npm `11.19.0`:

1. Red evidence records the pre-change `npm test` `6/6` under-coverage and complete-suite baseline.
2. `npm test` runs all authored test files and passes with the current full count (`133/133`, or a
   changed count explained by the command-contract test itself).
3. `npm run test:foundation` passes `6/6`.
4. `npm run typecheck` passes.
5. `npm run build` passes.
6. The existing local health smoke and minimum tenant/agent browser smoke remain healthy, with no
   product state mutation attributed to this Task.
7. `git diff --check`, exact path review, and a scan of changed project-authored files for unintended
   CJK text pass.
8. The current Task, validation, status, roadmap, README/Runbook command guidance, and audit report
   agree. Historical evidence is not rewritten to claim that old checkpoints used the new command.

## Closure and reopen conditions

Close only when the default command demonstrably discovers and executes the complete authored suite,
the foundation command remains available and truthful, all checks above pass, and current docs are
reconciled. Reopen if a newly added authored test is silently excluded, test discovery returns
success without executing the target files, or the command requires a new unsupported environment
assumption. This Task does not close the separate F-08 stale-read evidence gap.
