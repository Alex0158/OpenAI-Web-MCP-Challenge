# Task Brief Template

## Task Control

- Lifecycle state: `<pending | in_progress | verification_pending | blocked | verified>`
- Closure type: `<answered | specified | decided | integrated | contract_verified | runtime_verified | slice_verified | hosted_verified | rejected | deferred | parent_router>`
- Checkpoint: `<CP-NN | none>`
- Owner: `<owner>`
- Current increment: `<one short increment>`
- Next gate: `<one verifiable gate>`

## Identity

- Task ID: `SK-TASK-NNN`
- Date: `<date>`
- Risk profile: `<Fast | Standard | Assured>`
- Reason for profile: `<blast radius, reversibility, uncertainty, intended claim>`

## Objective

`<One observable outcome.>`

## Success and non-goals

- Success: `<verifiable conditions>`
- Non-goals: `<explicit exclusions>`

## Scope and authority

- In scope: `<exact directories, modules, contracts, and fixtures>`
- Out of scope: `<protected surfaces, including reentry-core, mvp, and RightSpot>`
- Allowed actions: `<read, edit, write, run, commit>`
- Revalidate when: `<contract, capability, runtime, or scope changes>`

## Owning authority

- Owning module document: `<link>`
- Owning contract section: `<link and section>`
- Controlling decision: `<ADR-GAME-*>`
- Constraining chain or scenario: `<link>`

## Evidence status

- Verified: `<facts>`
- Inferred: `<reasoned conclusions>`
- Unknown: `<gaps and falsifiers>`

## Smallest reversible action

`<action and stop condition>`

## Verification and closure target

- Minimum verification: `<ladder level and checks>`
- Closure target: `<closure label>`
- Rollback or remediation: `<path>`
- Reopen trigger: `<executable condition>`
