# ENG-001: Project Engineering Governance Baseline

**Status:** `locally_verified` with exact-source CI success  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under user authorization  
**Closure target:** `locally_verified` project-governance and mechanical-quality baseline

## Objective

Establish one lightweight project-wide engineering control plane before selected-application
development, while preserving the completed Re-entry Core Program, the pending application decision,
and unrelated candidate-app work.

## Baseline

- repository: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`;
- branch: `codex/re-entry-core-foundation`;
- starting commit: `271cff0391d322801868881077988b07e16b9d96`;
- local and remote task branches matched at the start;
- owner-held changes already existed in `Docs/README.md`, `Docs/Scenarios/README.md`, Research 23,
  and Scenarios 02 through 04;
- Re-entry Core passed 79 tests, the focused protocol lane passed 11 tests, direct conformance
  returned `passed`, syntax checks passed, and the package dry run contained 16 files with zero
  runtime dependencies on local Node `26.5.0`;
- no tracked GitHub Actions workflow, project repository validator, secret scanner, or project-wide
  Engineering authority existed; and
- the existing Re-entry Core runbook explicitly excluded selected-application, production,
  deployment, pairing, and concrete Agent-runtime procedure.

## Accepted design

ADR-0017 selects a four-document `Docs/Engineering/` authority, a concise routing role for
`AGENTS.md`, standard-library validators, one native Re-entry Core verification command, Node 24 as
the closure baseline, and one always-run CI workflow. The design deliberately omits speculative
application gates, complex CI classification, universal numeric quality quotas, and new runtime
dependencies.

## Bounded changes

1. Register TASK-002 and ADR-0017.
2. Add the Engineering authority and project-wide implementation runbook.
3. Reconcile repository, Docs, Tasks, Decisions, and Development routing.
4. Refactor repository `AGENTS.md` into task-aware routing plus concise engineering and delivery
   non-negotiables.
5. Add tested repository and sensitive-pattern validators.
6. Add a native Core syntax verifier, aggregate verification command, Node baseline, and CI workflow.
7. Verify the complete baseline without modifying application candidates, frozen MVP1, runtime
   semantics, Research, Scenarios, Experiments, or References.

## Verification plan

1. validator and sensitive-scanner unit tests pass;
2. full repository validation passes with explicit legacy-language exceptions only;
3. every active Markdown relative link resolves;
4. every task, ADR, Development record, and Engineering authority is indexed by its owner;
5. project-authored active files remain English and secret-free;
6. Re-entry Core syntax, 79-test aggregate, direct conformance, and package dry run pass on Node 24;
7. the same aggregate remains compatible with the current local runtime when executed;
8. CI invokes the same durable commands and has read-only permissions;
9. staged scope excludes all owner-held candidate-app work; and
10. final local commit and remote branch identities match.

## Reopen conditions

Reopen when documented commands and CI diverge, a validator produces recurring false positives,
selected-app development needs a new cross-project quality owner, or a defect class demonstrates
that the initial native enforcement is insufficient.

## Closure record

The intended implementation source is locally verified and staged with exact ownership:

- validator unit suite: 6 of 6 passed on Python 3.14.6;
- sensitive-pattern scanner suite: 3 of 3 passed on Python 3.14.6;
- repository validation: passed, including active English, Markdown, relative-link, task lifecycle,
  index membership, structure, and staged/unstaged diff checks;
- sensitive-pattern scan: passed without rendering matched values;
- Node `24.20.0`: syntax passed for 41 modules, 79 of 79 tests passed, direct conformance returned
  `passed`, zero runtime dependencies were found, and the dry-run package contained 16 files with
  180,965 unpacked bytes;
- local Node `26.5.0`: the same syntax, 79-test, direct-conformance, dependency, and 16-file package
  aggregate passed; and
- staged scope excludes TASK-003, Research 23, Scenarios 02 through 04, and their owner-held index
  changes.

The implementation commit is
`a73a410fe72e99ae6f1025cb214b6230d9cd7fbc`. It was pushed to
`origin/codex/re-entry-core-foundation`, and local and remote identities matched. GitHub Actions
Quality run
[`33410338478`](https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/actions/runs/33410338478)
completed successfully for that exact SHA; every validator, scan, and Re-entry Core step passed.

The highest Development label remains `locally_verified`; CI success independently verifies the
repository-safe and local-process commands on the exact implementation source but does not raise the
runtime, deployment, judge-reproduction, or submission claim. TASK-002 is closed. Future
selected-application and runtime work applies this baseline through its own bounded Task and adds
only the controls required by a real surface.
