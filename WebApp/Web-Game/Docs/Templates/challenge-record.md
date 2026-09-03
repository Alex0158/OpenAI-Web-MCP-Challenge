# Challenge Record Template

## Identity

- Challenge for: `<SK-TASK-* or SK-ISSUE-*>`
- Promoted decision: `<ADR-GAME-* or none>`
- Status: `<proposed | accepted | rejected | superseded>`
- Owner and approver: `<roles>`
- Date: `<date>`

## Decision question

`<The exact choice to make.>`

## Objective and binding constraints

- Real objective: `<outcome>`
- Non-negotiables: `<server authority, exactly-once settlement, replayability, human consequence boundary, contract version, schedule>`
- Affected contract version: `<SK-MVP-*>`

## Evidence and challenge

- Verified facts: `<facts>`
- Assumptions: `<assumptions>`
- Unknowns: `<unknowns>`
- Contradictions: `<conflicts and their owning documents>`
- Falsifiers: `<what would change the decision>`

## Failure modes examined

| Failure | Impact | Detection | Prevention or remediation |
|---|---|---|---|
| Duplicate effect on redelivery | `<...>` | `<...>` | `<...>` |
| Lost or reordered event | `<...>` | `<...>` | `<...>` |
| Stale revision accepted | `<...>` | `<...>` | `<...>` |
| Race at a shelter or home boundary | `<...>` | `<...>` | `<...>` |
| Authority leaking into the client | `<...>` | `<...>` | `<...>` |
| Unbounded catch-up after downtime | `<...>` | `<...>` | `<...>` |
| Hidden fallback masking a capability failure | `<...>` | `<...>` | `<...>` |

## Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Minimal | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Conservative | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Expanded | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

## Decision

- Selected option: `<option>`
- Reason and trade-off: `<reason>`
- Rejected alternatives: `<why>`
- Non-goals: `<scope limit>`
- Required contract changes: `<documents, contract version, code, tests>`

## Verification and recovery

- Minimum meaningful verification: `<ladder level and checks>`
- Recovery path: `<rollback or forward remediation>`
- Reopen or supersession trigger: `<executable condition>`
