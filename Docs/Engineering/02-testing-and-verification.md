# Testing and Verification

**Role:** CANONICAL project-wide testing, verification, and claim standard  
**Status:** Active  
**Last updated:** 2026-08-31

## 1. Objective

Select the least expensive evidence that can falsify the current change, then expand only to the
level required by the affected contracts and intended claim. Test volume, coverage percentage, or a
green command does not substitute for boundary, failure, runtime, or user evidence.

## 2. Evidence ladder

| Level | Evidence | Maximum supported claim |
|---|---|---|
| 1 | Static readback, syntax, schema, links, package manifest, diff | The named structure or change exists |
| 2 | Focused unit or contract tests | The named behavior passes in the tested boundary |
| 3 | Affected integration and transitive tests | The named collaborating surfaces pass together |
| 4 | Complete applicable local aggregate | The executed local suite passed on the named source and environment |
| 5 | Separate-process or crash/recovery verification | The named process and persistence failure claim passed |
| 6 | Runtime or browser smoke | The named path worked in the exact runtime, identity, and configuration |
| 7 | True-chain and artifact freshness | The real role, state, tool, artifact, and runtime binding formed the claimed chain |
| 8 | External or judge closure | Delivery, adoption, reproduction, and residual-risk ownership are proven |

No later level retroactively proves an omitted earlier authority or correctness gate. Mock,
deterministic, and fictional evidence must name the stronger real-world claims they do not support.

## 3. Required test behavior

For a changed contract, select proportionate cases from:

- positive and expected use;
- malformed, unauthorized, or wrong-scope input;
- exact limits and one step outside each material boundary;
- duplicate, replay, stale, expiry, revocation, and out-of-order behavior;
- crash, timeout, response loss, partial write, rollback, and restart behavior;
- cross-owner, cross-target, privacy, redaction, and capability non-disclosure; and
- compatibility, migration, and unsupported-capability behavior when applicable.

Tests should assert observable contracts and effects rather than private implementation details.
Every regression fix preserves a Red test or the strongest equivalent reproducer when automation is
not possible.

## 4. Verification selection

Use this cadence:

1. run the narrowest stable affected test during the inner loop;
2. run affected transitive, trust, persistence, process, or package checks before closure;
3. run the complete applicable local aggregate once when the coherent increment is stable;
4. preserve an aggregate failure and reduce it to the smallest reproducer before rerunning; and
5. rerun the aggregate only after an executable change can invalidate the failed or reused evidence.

Documentation, naming, elapsed time, extra commentary, or a new commit alone is not an aggregate
reopen trigger. A shared contract, schema, authority, lifecycle, dependency graph, test harness,
package surface, or aggregate-discovered defect change may be.

## 5. Current Re-entry Core baseline

Run from `reentry-core/`:

```sh
npm run verify
```

This command performs native syntax checks, the complete Node test aggregate, direct source-profile
conformance, and an actual package dry run. Use the narrower commands in the
[Re-entry Core Runbook](../Development/REENTRY-CORE-RUNBOOK.md) during implementation.

Node 24 is required for closure. A run on another version is reported as additional compatibility
evidence, not a substitute. Package verification must inspect the file list and preserve exclusion
of tests, conformance scaffolding, benchmarks, private state, and generated evidence.

## 6. Future application extension

After TASK-001 selects the application, its Program must name the first real consumer and add only
the applicable layers:

- unit and contract tests for domain state and Site Tools;
- Host backend and persistence integration tests;
- Browser/WebMCP state-derived tool tests;
- accessibility and responsive checks for user-facing UI;
- Cloud Receiver, Local Connector, and Agent-adapter process tests;
- deterministic reset and fictional demo fixtures; and
- deployment, artifact, runtime, or judge reproduction gates.

Do not create empty browser, database, deployment, or release lanes before their first real surface.

## 7. CI contract

The initial CI baseline is intentionally simple because the current aggregate is fast:

1. check out the exact source with read-only repository permissions;
2. set up the declared Python and Node 24 baselines;
3. run validator and sensitive-scanner unit tests;
4. run repository validation and sensitive-pattern scanning; and
5. run `npm run verify` in `reentry-core/`.

CI success supports only exact-source repository and local-process claims represented by those
commands. It does not prove a Cloud service, supported Agent activation, Browser/WebMCP acquisition,
deployment, or submission. Add change classification only when measured CI cost makes always-run
verification materially wasteful.

Repository content and sensitive-pattern validators inspect the Git index. Stage exact owned paths
or hunks before the final local run so new task-owned files are included; unrelated untracked work
remains outside that claim. Index inspection and CI against the resulting commit remain mandatory.

## 8. Benchmarks and coverage

- Run a benchmark only when a changed hot path, resource budget, or regression makes it relevant.
- Record runtime version, hardware or environment class, fixture size, repetitions, and claim limit.
- Treat local benchmarks as regression samples, not service-level promises.
- Use coverage to find untested risk, not as a universal completion quota.
- Add a coverage threshold only after a stable baseline and a demonstrated defect class justify the
  maintenance and false-confidence cost.

## 9. Verification record

Every closure report states:

- exact source identity and dirty-state limitation;
- commands, runtime, environment, and fixtures;
- passed, failed, skipped, or not-run results;
- strongest supported closure label;
- reused evidence and its invalidation review;
- unsupported claims; and
- residual risks, owner, and reopen condition.
