# SK-EVID-059: CP-14 Upstream Main and Game Scope Drift Source Audit

## Identity

- Evidence ID: `SK-EVID-059`
- Related task, decisions, and validation: [`SK-TASK-072`](../Tasks/SK-TASK-072-cp14-upstream-main-game-scope-drift-audit.md), [`SK-TASK-064`](../Tasks/SK-TASK-064-cp14-eddy-branch-handoff-readiness-audit.md), [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), and [`Validation/85`](../Validation/85-cp14-upstream-main-game-scope-cross-functional-audit.md)
- Evidence class: `static`
- Ladder level: `1` for exact Git ref, ancestry, and remote-tree source topology; no runtime, browser, WebMCP, external delivery, hosted, or judge claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under review

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Game root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Local branch and commit: `main` at `b81952b` (`docs(game): sync task routing status`)
- Fetched upstream main: `origin/main` at `877aed7`
- Fetched Re-entry candidate: `origin/codex/reentry-main-candidate-preview` at `aa31159`
- Eddy refs: local `codex/eyad-reentry-core-foundation` at `0ce22ad`; fetched `origin/codex/eyad-reentry-core-foundation` at `77c9cbc`
- Actual worktrees: one worktree at `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`, on local `main`
- Pre-existing unrelated dirty state: RightSpot and research paths remained present and were not staged or changed

## Objective and claim boundary

This record answers whether the newly fetched upstream refs can be treated as a safe Game CP-14
integration base while Eddy prepares his branch. It supports only source-topology, ancestry,
preservation, and routing claims. It does not prove that the external Re-entry code is compatible with
the Game contract, that Eddy has handed off a versioned transport, or that any Receiver, Connector,
Codex Thread, Agent, WebMCP, hosted, or judge behavior is live.

## Read-only procedure and results

| Command or readback | Result |
|---|---|
| `git fetch origin --prune` | **Passed**; remote refs updated without changing the local branch or index |
| `git rev-parse --abbrev-ref HEAD` and `git rev-parse HEAD` | **Passed**; local branch `main`, commit `b81952b` |
| `git rev-list --parents -n 1 origin/main` | **Passed**; merge `877aed7` has first parent `cdcc0a8` and second parent `aa31159` |
| `git merge-base HEAD origin/main` | **Passed**; common ancestor `075a868` |
| `git merge-base HEAD origin/codex/reentry-main-candidate-preview` | **Passed**; common ancestor `075a868` |
| `git merge-base --is-ancestor origin/codex/reentry-main-candidate-preview origin/main` | **Passed**; candidate `aa31159` is an ancestor of `origin/main` |
| `git rev-list --left-right --count origin/main...HEAD` and branch status | **Passed**; the revision count was `68 34`, while porcelain status reports local `main` `ahead 33, behind 68` relative to `origin/main` (the one-commit right-side difference is the local merge-count presentation) |
| `git worktree list --porcelain` | **Passed**; only the one actual Game-containing worktree is registered |
| `git ls-files WebApp/Web-Game` | **Passed**; local Game has `505` tracked paths |
| `git ls-tree -r --name-only origin/main -- WebApp/Web-Game` | **Passed**; upstream main has `107` tracked Game paths |
| `git diff --diff-filter=D --name-only HEAD..origin/main -- WebApp/Web-Game` | **Passed**; `398` local Game paths would be deleted relative to the fetched upstream tree |
| `git diff --diff-filter=M --name-only HEAD..origin/main -- WebApp/Web-Game` | **Passed**; `61` Game paths differ as modifications and no added local implementation paths were observed |
| Remote file presence reads for current `src/`, tests, package files, runbooks, task/evidence records | **Passed**; the fetched upstream tree does not contain the current implementation baseline, `package.json`, current tests, or recent Game evidence as the same tree |
| `git show origin/main` merge/status reads | **Passed**; the external merge describes a Re-entry candidate integration while external production/publication gates remain open |
| `git show origin/main:Docs/Development/CLOUD-022...` and SDK/full-chain status reads | **Passed**; external records remain `verification_pending` or otherwise open and do not supply an accepted Game handoff |

## Assertions

1. The local Game `main` and its current commits remain intact at `b81952b`; the fetch/read phase did
   not mutate the working tree, index, branch pointer, or unrelated dirty files.
2. `origin/main` is not a drop-in Game base. Its Game tree has `107` paths versus `505` locally and
   would remove `398` current local paths while changing `61` others, including the current source,
   tests, package, runbooks, and recent evidence surface.
3. The Re-entry candidate is a parent of the fetched upstream merge, but that ancestry does not make
   it an accepted Game CP-14 handoff. Eddy's remote ref is still `77c9cbc`, and no owner handoff
   declares its transport, binding, idempotency, acknowledgement, lease/retry, or active-Thread
   behavior ready for Game integration.
4. The external merge status is a separate project signal. Its open production/publication gates
   cannot be promoted into Game runtime or hosted evidence.

## Analysis and closure

- Decision: Preserve local Game `main`; do not merge, rebase, cherry-pick, fast-forward, or pull the
  fetched upstream refs while the owner has not selected an integration base and Eddy has not declared
  an exact handoff tip ready.
- Safe next gate: Re-run a clean pre-merge review against the exact owner-selected tip, first checking
  that the current Game implementation, task/evidence indexes, package, tests, and runbooks are
  deliberately preserved. Then review the versioned external CP-14 transport contract before any
  adapter change.
- Residual unknowns: Owner intent for the integration base, the final Eddy tip, external transport
  compatibility, active-Thread delivery semantics, and hosted identity remain unresolved.
- Freshness: Revalidate when `origin/main`, either Eddy ref, the candidate ref, the CP-14 contract, or
  the owner's integration decision changes.

## Exact conclusion

The fetched upstream merge is an external Re-entry integration baseline, not a safe drop-in base for
the current Game. The local Game scope is preserved and the actionable work remains an owner-controlled
pre-merge review after Eddy's exact handoff. This static source-topology result does not close CP-14 or
support external delivery, WebMCP, hosted, or judge claims.
