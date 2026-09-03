# Primary Development Runbook

**Role:** OPERATIONAL project-wide implementation and closure procedure  
**Status:** Active  
**Last updated:** 2026-09-02

## 1. Scope and authority

Use this runbook for one bounded implementation, defect, verification, or engineering-governance
increment in the primary Codex session. It operationalizes the [Development Standard](01-development-standard.md)
and [Testing and Verification](02-testing-and-verification.md) without replacing product,
mechanism, task, decision, implementation-record, runtime, or release authority.

Use the [Re-entry Core Runbook](../Development/REENTRY-CORE-RUNBOOK.md) in addition to this file for
Core work. A future application or runtime runbook may refine this procedure only for a distinct real
surface.

## 2. Resume gate

Before editing:

1. confirm the actual repository root, branch, upstream, `HEAD`, remote, and complete relevant
   tracked, untracked, and ignored state;
2. read applicable global, workspace, and repository `AGENTS.md` files;
3. read the active Task, owning current truth, governing ADR, and implementation record;
4. identify owner-held work and exact files that must remain untouched;
5. state one falsifiable outcome, target closure label, affected surfaces, non-goals, and minimum
   meaningful verification; and
6. confirm current edit, commit, push, deployment, publication, credential, external-action, and
   destructive authority separately.

Repository state and current evidence override stale summaries. Do not infer that an untracked file
is disposable or that a prior test remains applicable after its source or environment changed.

## 3. Classification and registration

Classify the increment:

| Profile | Use when | Minimum control |
|---|---|---|
| `Fast` | Read-only work or a reversible mechanical correction with no behavior change | Boundary, current evidence, readback, exact claim |
| `Standard` | Ordinary implementation, test, documentation, or contained refactor | Active Task or explicit bounded outcome, affected surfaces, focused verification, current-truth writeback |
| `Assured` | Authority, security, privacy, consent, data lifecycle, persistence, concurrency, external effects, deployment, or cross-layer contract | Written Challenge, registration and decision review, failure and recovery analysis, multi-layer verification |

Update an existing Task when it owns the outcome. Create a new Task only for a distinct actionable
outcome with a known owner, affected surface, evidence, and next gate. Create or update an ADR when a
durable behavior, authority, architecture, compatibility, deployment, or scope decision changes.

Small typo, formatting, and mechanical link repairs normally need no new Task when their behavior
and authority impact is absent and explicitly checked.

## 4. Challenge and readiness

For Standard or Assured work, record only decision-changing analysis:

- evidence that can falsify the proposed path;
- affected and explicitly unaffected roles, modules, processes, state, data, tools, runtime, and
  claims;
- likely abuse, leakage, replay, stale, crash, migration, and recovery failures;
- minimal, conservative, and expanded alternatives;
- selected path, non-goals, minimum verification, and reopen triggers.

Begin implementation when no unresolved contradiction changes the target or authority, no
unmitigated P0/P1 defect exists inside the increment, and verification and remediation are feasible.
Do not repeat an unchanged Challenge merely to produce another record.

### 4.1 Human-request and architecture-change gate

Treat every human request, suggestion, or next-step target as intent to evaluate, not as permission
to override accepted authority. Before editing, compare it with the current Core or Mechanism
contract, governing ADR, active Task, and applicable Engineering controls. Classify the request as:

1. **No authority conflict:** an implementation detail that stays within the accepted contracts. Proceed
   under the existing decision and record the affected surface.
2. **Non-authoritative proposal:** an additive idea or alternative that does not yet change accepted
   truth. Keep it in the Task or Research layer; do not rewrite Core, Mechanisms, or an accepted ADR.
3. **Material conflict or change:** anything that changes accepted architecture, mechanism, authority,
   security, data lifecycle, process topology, compatibility, deployment, or a cross-layer contract.

For the third category, stop implementation at the decision boundary and show the human decision-maker
the current rule, proposed difference, affected surfaces, impact and failure modes, viable alternatives,
and the evidence required to choose. Obtain an explicit decision before changing authority or code. If
accepted, update or create the ADR and reconcile the owning Core or Mechanism and Task before or
alongside implementation. Reconfirm only when the material scope or impact changes; do not repeatedly
ask for unchanged approved work. An unaccepted proposal remains non-authoritative.

## 5. Coherent implementation loop

```text
current state
-> authority and falsifier
-> smallest coherent change
-> focused and transitive verification
-> stable closure candidate
-> complete applicable baseline
-> current-truth and evidence writeback
-> exact Git closure
```

A coherent increment is independently useful, reviewable, verifiable, and committable without a
known invalid authority, state, migration, failure, or user path. Internal files, helper functions,
schema steps, or Case IDs are not automatically separate increments.

Follow the Development Standard. Avoid speculative abstractions, parallel workarounds, hidden
fallbacks, scope-external cleanup, and broad generated or dependency changes. Design a real consumer
and tests before or alongside a contract-bearing abstraction.

## 6. Failure triage

When a check or operation fails:

1. preserve the exact failure, source, environment, and smallest known reproducer;
2. classify implementation defect, expectation drift, environment constraint, unsupported
   capability, external failure, partial outcome, or outcome unknown;
3. return to the narrowest check that can disprove the correction;
4. reassess assumptions and design after repeated failure produces no new evidence; and
5. register any independent unresolved risk with impact, owner, and executable reopen condition.

Do not weaken a check, discard durable state, add a hidden fallback, blindly retry an unknown remote
outcome, or restart the complete aggregate after every diagnostic edit.

## 7. Verification and writeback

Use the [verification selection policy](02-testing-and-verification.md#4-verification-selection).
Before closure:

- run the complete applicable local baseline once against the intended source;
- inspect changed and staged diffs, links, English-only content, package surface, secrets, private
  identifiers, generated state, and unrelated files;
- update the active Task lifecycle and exact next gate;
- update the owning current truth only when its behavior, intent, status, or claim changed;
- update the Development record with exact commands, evidence, closure label, and residual risk; and
- keep command logs and chronology out of Core, Engineering, and flagship documents.

At both increment start and pre-commit review, ask whether the work changed product or mechanism
intent, authority, contract, status, or claims. When it did, update every affected owning Core or
Mechanism document and the governing ADR before closure; when it did not, state why no canonical
update was needed in the Development or evidence record. A code change is not closed while its
authoritative documentation is stale.

When contributor guidance changes, apply the
[instruction-placement contract](README.md#3-contributor-instruction-placement): keep only
repository-wide routing and non-negotiables in `AGENTS.md`, put repeatable procedure in this
runbook, keep product and mechanism truth with their owners, and use scripts or CI for stable
mechanical enforcement. Confirm that a clean clone receives every collaborator-required rule
without relying on a parent workspace file.

### 7.1 Cross-layer reconciliation gate

For any increment that changes or claims behavior across more than one surface, make a short
reconciliation pass before closure. Compare the implementation and tests with the current owners;
do not assume that a passing test or a newly written development note makes an older path current.

At minimum, inspect the affected:

- user journey, route, redirect, and user-facing instruction;
- API request, response, error, and authentication handoff;
- state transition, data ownership, credential boundary, and external effect;
- code, focused tests, package README, and runtime entry point; and
- Core or Mechanism intent, ADR status, Development evidence, current status, and local index.

For every changed or contradictory surface, record one disposition in the active Task or
Development record:

| Disposition | Required action |
|---|---|
| `aligned` | State why the existing owner remains current. |
| `updated` | Update the owning Core, Mechanism, ADR, status, or index in the same increment. |
| `historical` | Mark the old path as compatibility or evidence-only and remove it from the normal guide. |
| `open` | Keep the proposal or unresolved choice out of accepted truth and link its next decision gate. |
| `unverified` | Lower the claim and record the exact evidence still required. |
| `implementation_gap` | Register or update one bounded implementation/defect task with an owner and next gate. |

If accepted documentation contradicts the code, do not silently rewrite the documentation to match
the code. Classify the code as an implementation gap, or stop at the decision gate if the intended
behavior itself is changing. A code-bearing increment cannot close while a changed authoritative
surface has no disposition.

## 8. Git and remote closure

Follow the repository `AGENTS.md` collaboration gate. The primary session alone owns final staging,
commit, push, and remote claims.

1. At session start or resume, fetch the intended remote with pruning and inspect branch, upstream,
   dirty ownership, and divergence before editing. If the remote is ahead on a clean tree, integrate
   it deliberately before editing; if the tree is dirty or diverged, preserve the work and resolve
   ownership before proceeding.
2. Stage exact task-owned paths or exact hunks only.
3. Review the complete staged diff and confirm no secret, mutable state, generated noise, frozen
   reference, or owner-held file entered it;
4. Commit one coherent locally verified outcome promptly after the increment closes, and before
   handoff or going idle. Do not create a commit for every save; the unit is a bounded coherent
   increment.
5. Fetch again before push and inspect any remote movement. On a clean tree, integrate deliberately
   with an explicit fast-forward or reviewed merge/rebase; `git pull` is acceptable only when its
   mode and result are intentional, never as a blind refresh.
6. Rerun invalidated checks after integration.
7. Push only the intended branch.
8. Prove local `HEAD` equals the remote branch SHA and report any intentionally uncommitted work.

If the remote is ahead or diverged, pause delivery, inspect the competing commits and affected paths,
and resolve ownership before integration. Never force-push, rewrite shared history, or discard a
collaborator's work to make the branch appear clean.

For the shared branch, the minimum start and pre-push readback is:

```sh
git fetch origin --prune
git status --short --branch
git branch -vv
git rev-list --left-right --count HEAD...@{upstream}
```

When the readback shows only a remote-ahead fast-forward and the tree is clean, an explicit
`git pull --ff-only <remote> <branch>` is acceptable. Otherwise inspect the competing commits and
use a reviewed merge or rebase; never use pull to conceal an unknown result.

Use the following readback before commit and again where remote integration can invalidate it:

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

Report `locally_verified`, `committed`, `pushed`, `CI_verified`, `runtime_verified`, `deployed`,
`judge_reproducible`, and `submitted` as distinct states.

## 9. Supporting-agent boundary

When explicitly authorized, supporting agents may inspect independent evidence surfaces, run bounded
tests, or provide adversarial review. Every assignment names its scope and mutable paths. Supporting
agents do not change product or architecture decisions, touch the Git index, commit, push, deploy,
publish, or claim closure. The primary session reconciles contradictions, inspects the shared
worktree, reruns decisive checks, and owns the final claim.

## 10. Stop and reopen conditions

Stop for user direction when continuation requires new authority, destructive or external action,
credentials or spend, a material scope expansion, acceptance of an unresolved P0/P1 contradiction,
or weakening an upstream authority, security, privacy, state, or evidence contract.

Continue independent safe work when an unknown limits only one claim or surface. Record it rather
than hiding it or blocking unrelated progress.

Reopen a closed increment only when code contradicts recorded behavior, a required check regresses,
an owning decision changes, runtime evidence invalidates the claim, or a new consumer exposes an
unhandled boundary. A new application or runtime outcome normally receives a new Task rather than
silently widening prior closure.

## 11. Completion report

The final report states:

- outcome and closure level;
- exact files and behavior changed;
- exact verification run, passed, failed, skipped, or not run;
- commit, branch, remote, and CI state;
- owner-held work intentionally untouched; and
- residual risks and the next registered gate.
