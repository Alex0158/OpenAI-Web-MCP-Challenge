# OpenAI Web MCP Challenge Agent Guide

## Repository and instruction boundary

This tracked file is the self-contained contributor instruction surface for this repository. A
clone must not depend on an untracked parent-workspace or machine-global `AGENTS.md`.

The repository is the directory returned by `git rev-parse --show-toplevel`; do not infer it from
the current directory, open editor, or last task.
Preserve unrelated tracked, untracked, and ignored work. Stage exact task-owned paths or hunks only.

This file owns mandatory routing and non-negotiable boundaries. Detailed procedures belong in
[`Docs/Engineering/`](Docs/Engineering/README.md); product and mechanism truth never belongs here.

## Language

- Conversation with the project owner may use Traditional Chinese or the user's language.
- Every project artifact is English: documentation, code, comments, identifiers, tests, fixtures,
  prompts, configuration, diagrams, evidence, commit messages, release material, and submission copy.
- Existing non-English historical files remain read-only legacy references. Do not extend or promote
  them without an English canonical replacement.
- Preserve source quotations only when fidelity requires it and keep all surrounding
  project-authored text in English.
- Before closure, scan changed project-authored files for unintended CJK text.

## Start and route work

For every non-trivial task:

1. read [`Docs/README.md`](Docs/README.md) for the authority map;
2. read [`Docs/Core/00-current-status.md`](Docs/Core/00-current-status.md) for current project truth;
3. read the active [`Task`](Docs/Tasks/README.md), owning Core or Mechanism document, governing ADR,
   and only the evidence required by the affected surface; and
4. use [`Docs/Engineering/`](Docs/Engineering/README.md) plus the narrowest applicable runbook for
   development, testing, and closure.

Re-entry Core work also follows its scoped
[`REENTRY-CORE-RUNBOOK`](Docs/Development/REENTRY-CORE-RUNBOOK.md).

Use the minimum sufficient current authority and evidence. Do not copy mutable product status,
active-task detail, or step-by-step procedure into this file.

Classify work as `Fast`, `Standard`, or `Assured` through the
[Primary Development Runbook](Docs/Engineering/03-primary-development-runbook.md#3-classification-and-registration);
the profile changes the required control depth, not the product authority.

## Registration and decision gate

- Register actionable non-terminal work in `Docs/Tasks/` when required by the Primary Development
  Runbook. Keep one bounded outcome and next gate per Task.
- Before a durable product, mechanism, authority, security, data-lifecycle, process, compatibility,
  deployment, or cross-layer contract change, create or update the owning ADR.
- Tasks own lifecycle, ADRs own durable decisions, Development records own implementation and
  closure, and Core or Mechanisms own intended behavior.

## Protected and frozen surfaces

- Treat `References/TenderRelay/` and its companion assets as immutable reference snapshots.
- Do not implement new behavior in frozen `mvp/`, immutable References, Research, Scenarios,
  Experiments, generated output, or evidence fixtures.
- Preserve earlier and deprioritized directions for traceability. Promote one only through its
  owning accepted decision and current-truth reconciliation.

## Engineering non-negotiables

- Follow the [Development Standard](Docs/Engineering/01-development-standard.md) and
  [Testing and Verification](Docs/Engineering/02-testing-and-verification.md).
- Implement the smallest coherent outcome with one real consumer. Do not add speculative
  abstractions, fallbacks, compatibility layers, configuration, or dependencies.
- Keep authority, trust, data, permission, external-effect, and human-consequence boundaries
  explicit. Use exact bounded inputs, typed visible failures, secret-free logs, and no blind retry.
- Split by independent responsibility, authority, consumer, failure boundary, test surface, or
  update cadence, not a numeric quota.
- Unsupported capability fails visibly; do not hide it behind another transport, tool, context,
  automation path, manual reconstruction, or silent fallback.

## Verification

- Separate verified facts, working assumptions, inferences, targets, and unknowns. Planning under an
  assumption does not make it implemented or verified.
- Reconcile behavior changes across owning documents, code, tests, runtime evidence, and release
  material. Never claim deployment, judge reproduction, or submission without current evidence.
- Start with the narrowest stable affected check, then expand according to changed contracts and the
  intended claim.
- Node 24 is the reproducible closure baseline. Name every other runtime actually executed.
- Re-entry Core closure uses `cd reentry-core && npm run verify`.
- Repository governance closure uses:

  ```sh
  python3 scripts/test_validators.py
  python3 scripts/test_sensitive_scan.py
  python3 scripts/validate_repository.py --root .
  python3 scripts/scan_sensitive_patterns.py --root .
  ```

- Detailed test selection, aggregate reopen rules, and evidence recording belong in Engineering.

## Git and collaboration

- Continue on the current working branch, normally shared `main`, for bounded low-conflict
  research, documentation, experiments, tests, and local fixes. Do not create a new branch
  merely because a goal is distinct.
- Create a task branch and pull request for a major architecture change, a substantial
  cross-layer behavior change, a high-conflict or high-risk change, or when a collaborator
  explicitly requests isolated review. State why the change crosses that threshold.
- Direct pushes to shared `main` still require the full validated-goal, fetch, divergence,
  explicit-staging, and remote-SHA verification gates in the Primary Development Runbook.
- Follow the [Primary Development Runbook Git gate](Docs/Engineering/03-primary-development-runbook.md#8-git-and-remote-closure)
  for exact inspection, staging, verification, commit, integration, push, and readback procedure.
- Fetch before push and review remote movement deliberately. Never use blind pull, force push,
  shared-history rewriting, destructive checkout, `git clean`, or `git reset --hard` to manufacture
  a clean result.
- Before editing a collaborator-owned file, announce scope and baseline. After delivery, prove local
  and remote identities and report intentionally uncommitted work.

## Evidence, secrets, and generated state

Keep credentials and machine state local. Do not track private runtime databases, signing keys,
bearer values, raw task/context identifiers, mutable traces, or generated state; use the project's
redaction rules for shareable evidence.

## Completion claims

Distinguish validated locally, committed locally, pushed, CI-verified, runtime-verified, deployed,
judge-reproducible, and submitted states. A plan, attempt, partial pass, or local-only commit is not
remote delivery evidence.
