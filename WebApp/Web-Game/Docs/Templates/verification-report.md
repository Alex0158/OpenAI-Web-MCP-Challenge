# Verification Report Template

## Conclusion

`<One sentence with the exact closure label.>`

## Baseline

- Source state, environment, runtime versions, and time: `<identity>`
- Fixture world and seed: `<seed>`
- Contract version: `<SK-MVP-*>`
- Contracts under test: `<sections and IDs>`

## Verification budget

- Affected and transitive surfaces: `<surfaces>`
- Suites selected: `<suites>`
- Aggregate due, and which reopen trigger applies: `<answer>`
- Reusable existing evidence: `<records>`
- Suites intentionally not rerun and why: `<answer>`

## Executed

| Check | Ladder level | Result | Claim this supports |
|---|---|---|---|
| `<command or readback>` | `<1-7>` | `<pass, fail, flaky, gated>` | `<exact claim limit>` |

## Not executed

| Check | Why not | Remaining unknown |
|---|---|---|
| `<check>` | `<gate or scope reason>` | `<unknown>` |

## Evidence status

- Verified: `<facts>`
- Inferred: `<inferences>`
- Unknown: `<gaps>`
- Invalidated or superseded: `<records>`

## Closure

- Closure label: `<answered | diagnosed | specified | decided | implemented | integrated | contract-verified | runtime-verified | slice-verified | hosted-verified | judge-reproducible>`
- Highest ladder level reached: `<1-7>`
- Residual risk and owner: `<risk>`
- Reopen trigger: `<executable condition>`
