# Primary Development Runbook

**Role:** OPERATIONAL project-wide implementation and closure procedure  
**Status:** Active  
**Last updated:** 2026-08-31

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

When contributor guidance changes, apply the
[instruction-placement contract](README.md#3-contributor-instruction-placement): keep only
repository-wide routing and non-negotiables in `AGENTS.md`, put repeatable procedure in this
runbook, keep product and mechanism truth with their owners, and use scripts or CI for stable
mechanical enforcement. Confirm that a clean clone receives every collaborator-required rule
without relying on a parent workspace file.

## 8. Git and remote closure

Follow the repository `AGENTS.md` collaboration gate. The primary session alone owns final staging,
commit, push, and remote claims.

1. establish the current branch, remote movement, and dirty ownership;
2. stage exact task-owned paths or exact hunks only;
3. review the complete staged diff and confirm no secret, mutable state, generated noise, frozen
   reference, or owner-held file entered it;
4. commit one coherent locally verified outcome;
5. fetch again and integrate remote movement deliberately without blind pull or force push;
6. rerun invalidated checks after integration;
7. push only the intended branch; and
8. prove local `HEAD` equals the remote branch SHA.

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
