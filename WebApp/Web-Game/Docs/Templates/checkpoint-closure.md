# Checkpoint Closure Template

## Identity

- Checkpoint: `CP-NN`
- Release gate: `<G0 | G1 | G2 | G3>`
- Owning task: `<SK-TASK-*>`
- Status label: `<PLANNED | IN PROGRESS | BLOCKED | VERIFIED LOCAL | HOSTED VERIFIED>`
- Date: `<date>`

## 1. Task and source state

- Task and current increment: `<SK-TASK-* and increment>`
- Exact source state: `<branch, commit, and any intentionally uncommitted work>`
- Contract version: `<SK-MVP-*>`

## 2. Changed surface

- Code, schema, configuration, or fixture changed: `<paths>`
- Owning mechanisms, chains, and capabilities: `<IDs>`
- Explicitly unchanged surfaces: `<paths>`

## 3. Verification

- Focused checks: `<suites and results>`
- Minimum transitive aggregate: `<suite and result, or why not due>`
- Authority regression: `<duplicate, stale, replay, restart, race, exactly-once results>`
- Runtime, capability, browser, or hosted evidence: `<result, or explicitly not required by this checkpoint>`
- Highest ladder level reached: `<1-7>`

## 4. Acceptance against the roadmap

| Acceptance criterion from the roadmap | Result | Evidence |
|---|---|---|
| `<criterion>` | `<met or not met>` | `<SK-EVID-*>` |

## 5. Document reconciliation

- Updated current status: `<yes or no, and what changed>`
- Updated owning module, chain, capability, or contract: `<paths>`
- New or updated decision: `<ADR-GAME-*>`
- Recorded evidence: `<SK-EVID-*>`

## 6. Residual risk and reopen

- Residual risk and owner: `<risk>`
- Executable reopen trigger: `<condition>`
- Open decisions this checkpoint did not close: `<list>`

## 7. Commit

- One coherent commit: `<message summary>`
- Unrelated work excluded: `<confirmation>`
- Remote readback: `<result, or not pushed>`

## 8. Closure statement

- Closure label: `<exact label>`
- What this checkpoint does not prove: `<explicit non-claims>`
