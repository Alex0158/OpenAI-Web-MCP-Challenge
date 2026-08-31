# Engineering Governance

**Role:** CANONICAL project-wide engineering authority index  
**Status:** Active  
**Last updated:** 2026-08-31

## 1. Responsibility

This directory defines the durable engineering controls shared by Re-entry Core, the future selected
application, and later runtime shells. It owns development quality, verification policy, and the
repeatable implementation procedure. It does not define product behavior, task lifecycle,
implementation history, runtime evidence, deployment state, or release truth.

Use the smallest applicable authority:

| Question | Owner |
|---|---|
| Code, module, dependency, failure, security, performance, and documentation quality | [Development Standard](01-development-standard.md) |
| Test layers, verification selection, compatibility, CI, benchmarks, and claim limits | [Testing and Verification](02-testing-and-verification.md) |
| Current-state audit through exact local and Git closure | [Primary Development Runbook](03-primary-development-runbook.md) |
| Human-request conflict handling, canonical writeback, and collaborator Git cadence | [Primary Development Runbook](03-primary-development-runbook.md) |
| Re-entry Core-specific commands, seams, and non-claims | [Re-entry Core Runbook](../Development/REENTRY-CORE-RUNBOOK.md) |
| Registered task lifecycle and next gate | [`Docs/Tasks/`](../Tasks/README.md) |
| Program, implementation, evidence, and closure record | [`Docs/Development/`](../Development/README.md) |
| Product, mechanism, trust, and current status | [`Docs/Core/`](../Core/00-current-status.md) and [`Docs/Mechanisms/`](../Mechanisms/README.md) |
| Durable accepted choice | [`Docs/Decisions/`](../Decisions/README.md) |
| Implemented or runtime behavior | Current code, tests, runtime, and external readback |

## 2. Authority order for implementation

For non-trivial implementation:

1. read the repository `AGENTS.md` and confirm the actual repository boundary;
2. read the active Task, owning product or mechanism authority, and any governing ADR;
3. read the Development Standard and Testing and Verification policy;
4. follow the Primary Development Runbook and any narrower module runbook;
5. use current code and tests for implemented behavior; and
6. bind every closure claim to exact executed evidence.

Do not read every Core or Research file by default. Select the minimum sufficient context for the
question and affected surfaces.

## 3. Contributor-instruction placement

Use one owner for each kind of guidance:

| Content | Owner |
|---|---|
| Rules every repository contributor must see before acting | Root `AGENTS.md` |
| Repeatable intake, implementation, verification, Git, and closure procedure | Primary Development Runbook |
| Reusable code, test, dependency, security, failure, and performance standard | Development Standard or Testing and Verification |
| Current product status, requirement, trust boundary, or mechanism behavior | Owning Core or Mechanism document |
| Active work, accepted decision, implementation history, or evidence | Task, ADR, Development record, code, test, runtime, or release owner |
| Stable mechanical enforcement | Validator, test, script, or CI workflow backed by documented policy |

The root `AGENTS.md` must be self-contained for a repository clone, but it remains a compact router
and non-negotiable contract. Do not make it depend on a machine-local parent file, copy mutable
product status into it, or duplicate a complete runbook. Workspace and global instructions may add
local defaults but cannot supply a rule that collaborators need in order to work safely.

## 4. Layering rules

1. Engineering documents define reusable controls, not product semantics or task history.
2. `AGENTS.md` routes to these controls and states non-negotiables; it does not duplicate the full
   procedure.
3. A module or application runbook refines this baseline only for a real distinct operational
   surface.
4. Executable checks implement documented controls but do not silently create new policy.
5. CI reruns the repository-safe baseline against an exact source; it does not prove runtime,
   deployment, judge reproduction, or submission.
6. Templates, new directories, and new gates are added only after a real repeated consumer exists.

## 5. Maintenance rules

- Update the owning document when a durable engineering control changes.
- Keep task-specific scope and results in Tasks and Development records.
- Convert a stable mechanical rule into a tested script or CI gate instead of repeating prose.
- Record positive triggers, non-triggers, costs, and reopen or removal conditions for new controls.
- Review controls that repeatedly create false positives, duplicate another authority, or do not
  change decisions, defects, evidence, or recovery.
- Keep all project artifacts in English.
