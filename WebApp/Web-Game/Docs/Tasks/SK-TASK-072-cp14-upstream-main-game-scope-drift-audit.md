# SK-TASK-072: CP-14 Upstream Main and Game Scope Drift Audit

## Task Control

- Lifecycle state: `verified`
- Closure type: `answered`
- Checkpoint: `CP-14`
- Owner: Game owner
- Current increment: The fetched upstream `main` and Re-entry candidate refs were reconciled against the local Game `main` without branch mutation; the Game-preservation risk and owner-controlled integration gate are recorded under [`SK-EVID-059`](../Evidence/SK-EVID-059-cp14-upstream-main-game-scope-drift-source-audit.md) and [`Validation/85`](../Validation/85-cp14-upstream-main-game-scope-cross-functional-audit.md).
- Next gate: After the owner selects an integration base and declares Eddy's intended tip ready, perform a clean pre-merge review against that exact tip; until then do not merge, rebase, cherry-pick, fast-forward, or claim live delivery.

## Identity

- Task ID: `SK-TASK-072`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: The newly fetched upstream merge crosses branch ancestry, collaborator ownership, Game source preservation, external Re-entry handoff, and the claim boundary between a remote candidate and an accepted integration. A mistaken merge could remove the current Game implementation or turn external documentation into a false runtime claim.

## Objective

Establish the exact post-fetch relationship among local Game `main`, `origin/main`, the fetched Eddy
branch, and the Re-entry main candidate; identify whether the upstream merge preserves the current
Game scope; and record the owner-controlled condition for any later integration.

## Success and non-goals

- Success: Record the exact local and remote refs, ancestry, ahead/behind state, merge parents, and
  changed Game path counts after the new upstream fetch.
- Success: Prove whether the current Game implementation, task/evidence records, package, tests, and
  runbooks are present on `origin/main` and the candidate ref, without checking either ref out.
- Success: Separate the external Re-entry candidate's own status from Game CP-14 readiness, classify
  the topology as safe or unsafe for integration, and state one explicit owner-controlled next gate.
- Success: Preserve the local Game `main`, all unrelated RightSpot/research changes, and every fetched
  ref during the read-only audit; stage only the Game-owned closure records afterward.
- Non-goals: Merging, rebasing, cherry-picking, resetting, fast-forwarding, deleting, staging,
  committing external code, changing Game behavior, changing the CP-14 contract, deployment,
  credentials, external service calls, or claims of live Receiver/Connector, Agent, WebMCP, hosted,
  or judge behavior.

## Scope and authority

- In scope: Git ref and ancestry readback, remote tree/path comparison, the prior [`SK-TASK-064`](SK-TASK-064-cp14-eddy-branch-handoff-readiness-audit.md) handoff audit, the Game CP-14 delivery boundary, current status, and task/evidence/validation routing.
- Out of scope: `reentry-core/`, `runtime/`, outer Core documents, `mvp/`, RightSpot, Eddy-owned
  source edits, deployment, credentials, generated state, and any branch or index mutation.
- Allowed actions: Fetch the intended remote, read Git metadata and remote files, create this English
  task/evidence/validation record, update Game current-status/index routing, run documentation checks,
  and commit only the Game-owned audit records.
- Revalidate when: Eddy pushes or force-updates a ref, `origin/main` changes again, the owner selects
  an integration base, the Game CP-14 contract changes, or an exact external transport handoff is
  supplied.

## Owning authority

- Handoff predecessor: [`SK-TASK-064`](SK-TASK-064-cp14-eddy-branch-handoff-readiness-audit.md)
- Game delivery boundary: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
  and [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Game-side seam: [`S14-A/S14-B`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
- Current truth: [`00-current-status.md`](../00-current-status.md) and [`Tasks/README.md`](README.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and
  [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified: The local Game `main` is at `b81952b`; the fetched `origin/main` is at `877aed7`; and
  `origin/main` is a merge of `cdcc0a8` and `aa31159`.
- Verified: `origin/codex/reentry-main-candidate-preview` is `aa31159`, while the local
  `codex/eyad-reentry-core-foundation` is `0ce22ad` and its fetched remote is `77c9cbc`.
- Verified: Compared with local Game `main`, `origin/main` contains 107 tracked Game paths versus
  505 locally, with 398 deletions and 61 modifications; the current Game `src/`, tests, package,
  runbooks, and recent CP evidence are not preserved as the same implementation baseline.
- Inferred: The upstream merge is an external Re-entry integration baseline, not a safe drop-in Game
  base. Its merge message and external records do not establish an accepted Game-specific handoff.
- Unknown: Whether the owner intends to preserve the local Game history by a later deliberate merge,
  select a different candidate, or keep the external project and Game as separate workstreams.

## Smallest reversible action

Fetch the intended remote, read the exact refs and merge ancestry, compare only the Game tree and
external handoff status, record the preservation risk, and stop before any branch or index mutation.
If a future remote update changes the counts or exact candidate, preserve this observation and reopen
the audit against the new source state.

## Verification and closure target

- Minimum verification: exact ref/ancestry readback, Game tree counts and changed-path inventory,
  remote candidate status readback, local Game status preservation, documentation self-tests, the
  repository validator, and `git diff --check` on the audit records.
- Closure target: `answered` for the exact post-fetch source-topology and Game-preservation judgment;
  this does not close CP-14 or authorize an integration.
- Rollback or remediation: No rollback is needed. Keep local Game `main` untouched; if an owner later
  authorizes integration, create a separate clean review against the selected exact tip and preserve
  the current Game commits through an explicit merge plan.
- Reopen trigger: A new fetched main or Eddy ref, a changed external contract, owner approval to
  integrate, loss or restoration of the Game tree on the selected base, or any attempt to infer live
  delivery from the external candidate.

## Claim boundary

Remote availability, ancestry, a merge commit, or a large external test/evidence set does not prove
Game integration readiness. This audit is source-topology and preservation evidence only. It does not
prove external transport compatibility, Agent wake, WebMCP dynamic action, hosted continuity, or
judge reproduction.

## Execution result

- `git fetch origin --prune` completed successfully. Local Game `main` remains `b81952b`; the fetched
  `origin/main` moved to `877aed7`. The local worktree still contains only the pre-existing dirty
  RightSpot/research state; no Game file was changed by the fetch.
- The fetched `origin/main` merge has first parent `cdcc0a8` and second parent
  `aa31159` (`origin/codex/reentry-main-candidate-preview`). The candidate is an ancestor of
  `origin/main`; Eddy's remote branch remains `77c9cbc`, seven commits ahead of the local Eddy ref
  `0ce22ad`.
- Local `main` reports `ahead 33, behind 68` relative to `origin/main`. The Game tree comparison is
  505 local tracked paths versus 107 on `origin/main`, with 398 deleted, 61 modified, and no added
  paths from the local implementation perspective. The remote tree therefore cannot be used as a
  drop-in Game base without deliberately preserving the current implementation and evidence.
- The external merge commit describes a Re-entry candidate integration and leaves external production
  and publication gates open. That status is separate from the Game CP-14 port and does not supply a
  versioned Game transport, binding, acknowledgement, lease/retry, or active-Thread contract.

## Closure

This task is `verified` with `answered` closure for the exact post-fetch source-topology and
Game-preservation judgment. The fetch/read phase did not mutate the branch pointer, index, Game
behavior, or external source; only the Game-owned closure records were staged and committed. CP-14
integration remains gated on an owner-selected base and a declared Eddy handoff.
