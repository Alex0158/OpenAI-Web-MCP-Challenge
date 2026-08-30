# OpenAI Web MCP Challenge Collaboration Rules

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

## The small validated-goal commit gate

Each completed, validated goal should become one coherent commit promptly. Use this sequence
for every goal, even when the change is small:

1. **Establish the baseline.** Record the branch, working-tree state, current commit, and
   remote state before editing:

   ```sh
   git rev-parse --show-toplevel
   git branch --show-current
   git status --short --branch
   git log -1 --oneline --decorate
   git fetch origin --prune
   git rev-list --left-right --count HEAD...origin/main
   ```

   The two counts are `local-only remote-only`. Fetching is read-only; it does not integrate
   remote changes.

2. **Declare a bounded goal.** Name the behavior, documentation, evidence, or test result
   being completed and keep unrelated files out of the change. If the working tree already
   contains another collaborator's work, preserve it and do not stage it accidentally.

3. **Validate before committing.** Run the smallest meaningful project checks, then inspect:

   ```sh
   git status --short --branch
   git diff --stat
   git diff --check
   git diff
   ```

   A plan or a partially passing run is not validation. Record exact test and evidence
   results, including anything not verified.

4. **Stage only the goal.** Prefer explicit paths, not an unreviewed `git add -A` or
   `git add .`. If a file contains mixed or uncertain ownership, do not stage the whole file;
   coordinate or stage only the intended patch. Then review the index:

   ```sh
   git add -- <exact paths>
   git diff --cached --stat
   git diff --cached --check
   git diff --cached --name-only
   git diff --cached
   ```

   Confirm that no `.env` file, secret, private runtime database, `mvp/var/` content,
   mutable trace, raw runtime identifier, build output, or unrelated collaborator file is
   staged. `.gitignore` is a safeguard, not a substitute for reviewing `git status`.

5. **Commit the validated goal.** Use one descriptive commit for one bounded outcome. Do not
   amend, squash, or rewrite a commit that another collaborator may already have fetched.

6. **Synchronize immediately before pushing.** Fetch again because another collaborator may
   have pushed while the goal was being validated:

   ```sh
   git fetch origin --prune
   git rev-list --left-right --count HEAD...origin/main
   ```

   Apply the remote-ahead rules below before pushing. If integration changes files, rerun the
   relevant checks and inspect the staged diff again.

7. **Push and prove the result.** Push only the intended branch, then verify the remote commit:

   ```sh
   git push origin HEAD:<branch>
   git status --short --branch
   git rev-parse HEAD
   git ls-remote origin refs/heads/<branch>
   ```

   Do not report a goal as pushed until the local commit and remote branch resolve to the same
   commit and the remaining dirty files are understood and reported.

## Remote-ahead and integration rules

`git fetch` updates remote-tracking references; it does not merge anything. Never use a blind
`git pull` to hide a dirty tree or a divergence. Interpret
`git rev-list --left-right --count HEAD...origin/main` as follows:

| State | Meaning | Required action |
| --- | --- | --- |
| `0 0` | Local and remote are aligned | Commit the validated goal, then push. |
| `0 N` | Remote is ahead; no local-only commits | If the tree is clean, use `git pull --ff-only origin main`. If it is dirty, finish or preserve the local work first; never pull over it. |
| `N 0` | Local has unpushed commits only | Recheck the commit and tests, then push the intended branch. |
| `N M` | Histories diverged | Do not use a blind pull. Commit or safely isolate unfinished work, inspect both logs, integrate deliberately, rerun checks, and never force-push. |

When the validated local goal is ready and the remote moved during validation, the normal
sequence is **commit locally, fetch, integrate, revalidate, push**. A pull is not a substitute
for committing the goal.

Use these integration preferences:

- On shared `main`, prefer a normal merge after reviewing both sides; do not rewrite commits
  that may already be shared.
- On a private, unpushed task branch, rebasing onto the current `origin/main` is acceptable if
  it does not rewrite a commit another collaborator has fetched. Rerun all relevant checks
  after the rebase.
- If local work is unfinished and remote is ahead, do not create a WIP commit on shared `main`
  merely to make pulling possible. Use a separate task branch/worktree or coordinate with the
  owner of the overlapping work.
- If the remote change overlaps the same files, changes the authority boundary, or is not
  understandable from the commit message and diff, stop and review with the team before
  resolving conflicts.
- If `git push` is rejected because the remote advanced, fetch and repeat the decision process.
  Never solve a non-fast-forward rejection with `git push --force`.

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
