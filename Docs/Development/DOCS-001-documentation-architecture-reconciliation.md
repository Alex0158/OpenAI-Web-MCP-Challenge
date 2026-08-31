# DOCS-001: Documentation Architecture Reconciliation

**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under user authorization  
**Closure target:** `locally_verified` documentation-only delivery

## Objective

Make the repository entry points and documentation routing describe the completed
application-neutral Re-entry Core accurately, while keeping the selected application,
production runtime, deployment, and submission as separate future gates.

This is a governance and discoverability increment. It does not change Re-entry Core behavior,
select a candidate application, or promote MVP evidence into production evidence.

## Baseline

- Git repository: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Branch: `codex/re-entry-core-foundation`
- Starting commit: `669a531e93f5e5ca5a973410676613876d41ac2d`
- Starting remote state: local HEAD matches `origin/codex/re-entry-core-foundation`; the branch is
  33 commits ahead of `origin/main` and not behind it.
- Re-entry Core status: the application-neutral Program is complete at `locally_verified` under
  the terminal RECORE-003 audit.
- Preserved working-tree ownership: the candidate-app additions in `Docs/README.md`,
  `Docs/Scenarios/README.md`, `Docs/Research/23-three-candidate-competition-app-selection-review.md`,
  and `Docs/Scenarios/02-04` predate this increment. They remain outside its commit scope.

## Problems to correct

1. The repository `README.md` still presents the frozen `mvp/` fixture as the primary current
   implementation and does not route contributors to `reentry-core/`.
2. `Docs/README.md` stops its decision summary at ADR-0010 and still calls RECORE-001 active even
   though ADR-0011 through ADR-0014 and RECORE-001 through RECORE-006 are closed at their stated
   evidence levels.
3. Core/02, Core/06, and Core/08 retain status wording from before the application-neutral Program
   closed.
4. The root documentation map manually summarizes every decision and research record, creating a
   high-drift central index instead of delegating category detail to category owners.
5. Current and future code placement is correct in the decisions but is not visible enough at the
   repository entry point. This creates a risk that selected-app or production-shell code will be
   added to `reentry-core/` or the frozen `mvp/` fixture.
6. The next development program has no explicit handoff rule: app selection must create a new ADR
   and selected-app work record rather than reopen the closed RECORE records by default.

## Authority and boundaries

- `Docs/Core/00-current-status.md` continues to own current project and evidence truth.
- `Docs/Core/01-06` and `08` continue to own their named product, architecture, trust, validation,
  app-selection, and competition surfaces.
- `Docs/Decisions/` continues to own accepted durable choices.
- `Docs/Development/` continues to own bounded work, verification, and closure records.
- Current code and tests continue to own implemented behavior.
- Runtime and external evidence continue to own deployment, portability, and submission claims.

## Bounded changes

1. Reframe the repository README around the current Re-entry Core and clearly label `mvp/` as a
   frozen proof fixture.
2. Add local indexes for `Docs/Decisions/` and `Docs/Research/`, then reduce detailed routing work
   in the root documentation map.
3. Reconcile the stale Core status banners without changing their product or security semantics.
4. Document the minimum future source layout without creating empty packages or moving existing
   code:

   ```text
   reentry-core/             application-neutral library and contracts
   app/                      selected Host application and Host Adapter, after an accepted ADR
   runtime/cloud-receiver/   deployable Receiver shell, only when implemented
   runtime/local-connector/  device-side Connector and concrete adapter, only when implemented
   mvp/                      frozen MVP1 proof and evidence reference
   ```

5. Update the development index with this documentation increment and its closure state.

## Non-goals

- selecting Opportunity, Sleepless, Greenlight, TenderRelay, or another application;
- editing or adjudicating the pre-existing candidate-app documents;
- changing `reentry-core/`, `mvp/`, protocol, authority, security, or runtime behavior;
- moving or renaming existing source, evidence, experiment, or reference directories;
- creating a root workspace, deployment framework, service daemon, CI system, or release layer;
- reopening a closed RECORE increment without its recorded reopen condition;
- deleting or compressing historical evidence merely to reduce file count.

## Verification plan

The increment closes only when all applicable checks pass:

1. every changed Markdown file contains English project-authored prose only;
2. every local Markdown link in the changed files resolves;
3. the stale status phrases and outdated active-work label are absent from current entry points;
4. the repository README points to the current Core package and gives correct package commands;
5. `Docs/README.md` routes decision and research detail through their local indexes;
6. the pre-existing candidate-app diff remains preserved and outside the staged change;
7. `npm test` passes in `reentry-core/`;
8. `npm test` passes in the frozen `mvp/` fixture, confirming documentation work changed no
   reference behavior;
9. `git diff --check` and the staged equivalent pass;
10. the final commit contains documentation files only, is pushed to the task branch, and local
    and remote commit IDs match.

## Reopen conditions

Reopen this record only if an entry point again contradicts Core/00, a new documentation family
has no owning index, a selected-app implementation crosses the recorded source boundary, or the
verification commands become inaccurate. App selection and production implementation use new
records; they are not DOCS-001 reopen conditions by themselves.

## Closure record

**Local verification:** 2026-08-31

- all changed project-authored documentation is English;
- all local Markdown links in the changed files resolve;
- current entry points no longer present the frozen MVP1 fixture as the active implementation or
  present the closed RECORE increments as active work;
- the repository README routes contributors to `reentry-core/` and its current commands;
- the documentation map delegates decision and research detail to their owning local indexes;
- `npm test` in `reentry-core/`: 79 of 79 tests passed;
- `node conformance/run.mjs` in `reentry-core/`: passed with the expected redacted,
  process-isolated result;
- `npm test` in `mvp/`: 118 of 118 tests passed;
- working-tree and staged whitespace checks passed;
- the delivery contains documentation only and excludes the preserved candidate-app files.

**Delivery:** implementation commit and remote-match evidence pending.
