# OpenAI Web MCP Challenge Agent Guide

## Scope and source of truth

This file is tracked at the Git repository root and applies to every collaborator working
in this repository. The parent workspace `AGENTS.md` supplies broader defaults; this file is
the shareable repository-specific workflow.

The repository is the directory returned by:

```sh
git rev-parse --show-toplevel
```

Do not assume that the current directory, the open editor, or the last task is the repository
boundary. Preserve existing work that is outside the current bounded goal.

## Language

- Conversation with the project owner may use Traditional Chinese or the user's language.
- Every project artifact is English: documentation, code, comments, identifiers, tests, fixtures,
  prompts, configuration, diagrams, evidence, commit messages, release material, and submission copy.
- Existing non-English historical files remain read-only legacy references. Do not extend or promote
  them without an English canonical replacement.
- Before closure, scan changed project-authored files for unintended CJK text.

## Start and route work

For every non-trivial task:

1. read [`Docs/README.md`](Docs/README.md) for the authority map;
2. read [`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md) for current project truth;
3. read the active record in [`Docs/Tasks/`](Docs/Tasks/README.md);
4. read only the owning Core, Mechanism, Application, Decision, Development, or runtime evidence
   required by the affected surface; and
5. use [`Docs/Engineering/`](Docs/Engineering/README.md) for project-wide development, testing, and
   execution controls.

Re-entry Core work also follows its scoped
[`REENTRY-CORE-RUNBOOK`](Docs/Development/REENTRY-CORE-RUNBOOK.md). Application selection follows
`TASK-001`; selected-application source remains uncreated until an accepted ADR defines its real
owner and boundary. Deployment, judge reproduction, and submission require current external
evidence and separate authority.

Do not read every project document by default. Use the minimum sufficient current authority and
evidence for the question.

Classify work as `Fast`, `Standard`, or `Assured` through the
[Primary Development Runbook](Docs/Engineering/03-primary-development-runbook.md#3-classification-and-registration);
the profile changes the required control depth, not the product authority.

## Registration and decision gate

- Register actionable non-terminal implementation, defect, investigation, risk, decision,
  documentation, verification, or operations work in `Docs/Tasks/`.
- Keep one bounded outcome, one owner, one current increment, and one observable next gate per Task.
- Do not create a new Task for a typo, formatting, mechanical link repair, or test-only change with
  no behavior impact.
- Before a durable product, mechanism, authority, security, data-lifecycle, process-topology,
  compatibility, deployment, or cross-layer contract change, create or update an ADR before or
  alongside implementation.
- A Task controls lifecycle; an ADR controls a durable decision; a Development record controls
  implementation and closure. None replaces owning product truth, code, tests, runtime, or release
  evidence.

## Engineering non-negotiables

- Follow the [Development Standard](Docs/Engineering/01-development-standard.md) and
  [Testing and Verification](Docs/Engineering/02-testing-and-verification.md).
- Implement the smallest coherent outcome with one real consumer. Do not add speculative
  abstractions, fallbacks, compatibility layers, configuration, or dependencies.
- Keep Host, Receiver, Connector, Agent, Browser, data, permission, and human-consequence authority
  explicit and separate.
- Use exact bounded inputs, typed visible failures, secret-free logs, and no blind retry of an
  unknown outcome.
- File length is a review signal only. Split by independent responsibility, authority, consumer,
  failure boundary, test surface, or update cadence, not a numeric quota.
- Do not implement new behavior in frozen `mvp/`, immutable References, Research, Scenarios,
  Experiments, generated output, or evidence fixtures.
- Do not hide an unsupported capability with polling, DOM automation, generic MCP, direct REST,
  manual reconstruction, a new Agent context, or another silent fallback.

## Verification

- Start with the narrowest stable affected check, then expand according to changed contracts, risk,
  and the intended claim.
- Preserve positive, negative, boundary, replay, stale, expiry, revocation, crash, rollback, privacy,
  and unsupported-capability behavior where applicable.
- After aggregate failure, preserve the result and use a minimum reproducer. Rerun the aggregate
  only after an executable change can invalidate the evidence.
- Node 24 is the reproducible closure baseline. Name every other runtime actually executed.
- Re-entry Core closure uses `cd reentry-core && npm run verify`.
- Repository governance closure uses:

  ```sh
  python3 scripts/test_validators.py
  python3 scripts/test_sensitive_scan.py
  python3 scripts/validate_repository.py --root .
  python3 scripts/scan_sensitive_patterns.py --root .
  ```

- Exact test commands, environments, results, and unverified claims belong in the active Development
  record and completion report.

## Validated-goal Git gate

Each coherent validated outcome receives one reviewed commit. Use the
[Primary Development Runbook](Docs/Engineering/03-primary-development-runbook.md#8-git-and-remote-closure)
for the complete procedure.

The non-negotiable sequence is:

1. establish root, branch, `HEAD`, upstream, remote movement, and dirty ownership;
2. declare one bounded goal and exact owned paths;
3. run the applicable local baseline and inspect the complete owned diff;
4. stage exact paths or hunks and inspect the complete staged diff;
5. commit one coherent result without rewriting shared history;
6. fetch immediately before push and review any remote movement deliberately;
7. rerun checks invalidated by integration; and
8. push the intended branch and prove local `HEAD` equals the remote branch SHA.

`git fetch` is read-only and does not integrate. Never use a blind pull to hide a dirty tree or
divergence. A remote-ahead or divergent branch requires explicit log and overlap review; a rejected
push is never solved with force push. On shared branches, do not rewrite commits another
collaborator may have fetched.

Before commit and push, review:

```sh
git status --short --branch
git diff --stat
git diff --check
git diff
git diff --cached --stat
git diff --cached --check
git diff --cached --name-only
git diff --cached
```

A plan, partial pass, local-only commit, or attempted push is not delivery evidence.

## Branch and coordination policy

- Continue on the current working branch, normally shared `main`, for bounded low-conflict
  research, documentation, experiments, tests, and local fixes. Do not create a new branch
  merely because a goal is distinct.
- Create a task branch and pull request for a major architecture change, a substantial
  cross-layer behavior change, a high-conflict or high-risk change, or when a collaborator
  explicitly requests isolated review. State why the change crosses that threshold.
- Direct pushes to shared `main` still require the full validated-goal, fetch, divergence,
  explicit-staging, and remote-SHA verification gates in this document.
- Before starting work on a file another collaborator may be editing, announce the intended
  scope and current baseline commit.
- After pushing, report the commit SHA, branch, checks run, and any intentionally uncommitted
  work left in the tree.
- Do not use `git reset --hard`, `git clean`, destructive checkout/restore, or broad deletion to
  make status look clean. A dirty tree is information about ownership and must be explained,
  not erased.
- Do not treat an ahead remote as permission to discard local changes, and do not treat local
  changes as permission to overwrite a collaborator's remote work.

## Evidence, secrets, and generated state

Keep source, tests, runbooks, and redacted evidence shareable. Keep credentials and machine
state local. Before each commit, recheck the project ignore rules and confirm that private
runtime databases, signing keys, bearer values, raw task/context identifiers, mutable traces,
and other generated state are not staged. If a proof requires an identifier, use the project's
redaction rules and preserve the unredacted source only in an explicitly local, ignored path.

## Completion report

A completion update must distinguish:

- validated locally;
- committed locally;
- pushed to the remote branch; and
- still uncommitted or not yet verified.

Never describe an attempted commit, a local-only commit, or a planned merge as a completed
remote delivery.
