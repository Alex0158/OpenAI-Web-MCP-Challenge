# DOCS-004: Business-Flow and Implementation Reconciliation

**Status:** `locally_verified`  
**Opened:** 2026-09-02  
**Owner:** Primary Codex session under project-team authorization  
**Closure target:** `locally_verified` documentation and governance increment

## Objective

Operationalize the accepted canonical-writeback rule for the current Re-entry business flows and
reconcile the first known drift between target routes, preview code, tests, user-facing guides, and
evidence. This record covers the documentation/governance increment; it does not silently change
runtime behavior.

## Authority and boundaries

- [TASK-012](../Tasks/TASK-012-reconcile-business-flow-and-implementation.md) owns the lifecycle and
  next gate.
- [ADR-0018](../Decisions/ADR-0018-adopt-collaborative-source-of-truth-and-change-gates.md) owns
  the accepted canonical-writeback decision.
- The [Primary Development Runbook](../Engineering/03-primary-development-runbook.md) now owns the
  repeatable cross-layer reconciliation checklist.
- [Core/09](../Core/09-business-flows-and-ux.md) owns the current sequence map and initial audit.

## Bounded implementation

1. Add a disposition-based reconciliation gate to the Primary Development Runbook.
2. Register TASK-012 as the bounded owner for the current flow drift.
3. Index TASK-012 and this Development record without creating a duplicate authority register.
4. Rebuild the active-v2 actor, route, state, credential, and end-to-end flow map from current
   source, tests, schema, migration, configuration, runtime evidence, Git history, and revalidated
   Memory leads.
5. Record every material deviation in Core/09 and register a bounded owner for each P0/P1 issue.
6. Update only documentation and governance records; preserve production code, deployments,
   publication state, historical evidence, and collaborator-owned work.

## Current audit baseline

The initial Core/09 audit recorded seven findings:

- duplicate pairing ownership between developer and user dashboards;
- developer account/workspace language that does not match organization creation;
- historical and current Connector pairing descriptions presented together;
- stale `reentry connect` guidance on the no-device consent path;
- visually separate portals without explicit role semantics in the preview store;
- unused legacy renderer functions beside active renderers; and
- hosted account/pairing writeback without external verification.

The 2026-09-02 Cloud Receiver cleanup resolved the account/workspace copy and no-device consent
guidance findings through CLOUD-012. ADR-0032 subsequently retired that Receiver implementation.
The 2026-09-03 second baseline preserves those rows as historical and audits the active
`saas-boilerplate/` replacement instead.

The active-v2 audit adds a complete coverage matrix and twelve findings in Core/09. Four material
findings have bounded owners: TASK-026 pairing claim abuse control, TASK-027 Consent/Grant expiry,
TASK-028 Receiver-Core architecture, and TASK-029 default Connector effect acknowledgement.
TASK-030 owns the P2 logout-origin defect. TASK-022 through TASK-024 retain release/deployment
verification, and TASK-024 also owns the known public-guide session CTA. Documentation-only drift is
corrected in this increment. TASK-031 owns the exact-source package release needed because the
active portal advertises a checkout-only SDK facade. TASK-032 owns the separate Connector release
defect: registry version `0.2.20` is not reproducible from its reported commit and rejects the
active instruction-bearing lease. None of the open code, release, or decision findings is presented
as fixed.

## Development reconstruction

The history supports four distinct implementation eras rather than one continuously deployed
Receiver:

| Era | Current evidence | Disposition |
|---|---|---|
| Core contract kernel | Root commits `77436c0`, `422b9be`, `2cf1367`, `200ffd3`, `9c7ef1a`, `41fa3ef`, and related tests | Current application-neutral authority and local evidence |
| Retired v1 product shell | Root history through `f71c78d`, followed by ADR-0032 retirement | Deprecated implementation; reusable SDK/Connector seams and dated evidence retained |
| Active Cloud Receiver v2 | Nested history from `44f0ff6` through Consent `d77c34a`/`f67e741`, Event `b851c32`, Claim `d840439`, ACK/operations `300bce0`, release increment `6f4b35f`, and Vercel entry `29cdfa4` | Active bounded preview; exact architecture and release gaps remain open |
| SDK/Connector composition | Root commits `7fab264`, `d1e0e55`, `315c2a3`, `1f308cf`, and `733d77f`, plus the current uncommitted simple-flow work | Component and separate-process evidence; not a production or supported Agent/Browser claim |

At the final read-only Git refresh, the root was
`733d77f97cca34429e2784dcf39663256dd3544b` on
`codex/eyad-reentry-core-foundation`, 49 commits ahead and zero behind its upstream. The active-v2
nested repository was `e0d6b72f724aad7462b6a62c0591a081eac8cb66` on `main`, eight commits ahead
and zero behind `origin/main`. Both worktrees contained pre-existing collaborator changes. These
SHAs identify the audit inputs; they do not contain or attest the complete current working trees.

## Review rounds and convergence

| Round | Verified scope and new evidence | Finding/document result | Remaining highest-priority gate |
|---|---|---|---|
| 0 | Root and nested Git boundaries, branches, SHAs, worktrees, AGENTS, authority map, and task/ADR gate | No write before the boundary was established | Preserve both dirty worktrees and separate local/deployed claims |
| 1 | Core, active v2, retired v1, Host SDK, Local Connector, schemas, migrations, configs, tests, and document owners | Complete module/document inventory and active-v2 boundary | Reconstruct evolution before judging drift |
| 2 | Root/nested Git history, ADR-0032 through ADR-0041, Development records, and two Memory leads revalidated against current source | No Memory-only claim promoted; four implementation eras separated | Trace every critical flow through code and state |
| 3 | Developer setup, user pairing, consent/Grant, Event, claim/lease, activation, effect/ACK, restart/replay, and browser return | Active route/account map replaced retired mappings; coverage matrix created | Challenge contract conformance and failure paths |
| 4 | Pairing abuse fence, lifetime narrowing, Core composition, default ACK, SDK examples, and release evidence | AUDIT-V2-001 through AUDIT-V2-007 classified; P0/P1 owners registered | Security, session, UX, and operational challenge |
| 5 | Cookies/logout, same-origin guards, public Guide state, retry/exhaustion, credentials, logging, deployment and SLO evidence | AUDIT-V2-008 through AUDIT-V2-010 classified | Reconcile canonical and user-facing documents |
| 6 | Core/00–05 and 09, all Mechanisms, indexes, Tasks, Development records, root and runtime guides | Active, historical, conflicted, open, and unknown claims separated | Reverse-verify links, examples, lifecycle, and stale terms |
| 7 | Second source challenge, exact SDK method/result and npm provenance checks, tracked-file validator behavior, and all untracked authority records | Corrected the legacy consent example, separated published `0.3.1` from the checkout-only facade, registered TASK-031, repaired active Receiver guidance, task shapes, historical permalinks, and validator false-green documentation | Run exact baseline and aggregate governance checks |
| 8 | Node 24.20.0 Core/SDK/Connector suites, all-files docs, repository validators, sensitive scans, and initial diff review | Initial documentation/governance checks passed; no then-known P0/P1 was unowned | Challenge immutable package artifacts rather than equating checkout tests with releases |
| 9 | Connector registry metadata, immutable `0.2.20` tarball, reported `gitHead`, bundled Core parser, active-v2 lease builder, and a Node 24 package-level response probe | AUDIT-V2-012 verified; registry artifact rejects active `instruction`, reported source records version `0.2.14`, and TASK-032 now owns exact-source compatible release | Rerun all documentation, governance, source, and Node 24 gates after final reconciliation |
| 10 | Final reverse verification after AUDIT-V2-012 writeback: affected docs, task/index membership, English/sensitive scans, diff checks, and Node `v24.20.0` Core/SDK/Connector suites | **Locally verified documentation baseline**; all P0/P1 findings remain explicitly owned and release/product gates remain open | Owner review and exact-source Git closure; no publication, deployment, or production claim |

## Verification performed for this increment

The exact runtime suite command was:

```sh
npm exec --yes --package=node@24.20.0 -- sh -c \
  'node --version; cd reentry-core && npm run verify; cd ../runtime/host-sdk && npm run verify; cd ../local-connector && npm run verify'
```

The governance checks were:

- `python3 scripts/test_validators.py`
- `python3 scripts/test_sensitive_scan.py`
- `python3 scripts/validate_repository.py --root .`
- `python3 scripts/scan_sensitive_patterns.py --root .`
- an all-files import of `scripts.validate_docs.validate()` with `iter_active_files` replaced by a
  recursive active-path iterator, so untracked Core/Task/Development records were included

The final rerun passed on 2026-09-03. Exact Node 24 results were Core `81/81`, Host SDK `25/25`, and
Local Connector `47` passed with `12` database-gated v2 contract tests explicitly skipped in this
aggregate run. The separately recorded SDK-006/PM acceptance run remains the evidence for
`CONNECTOR-V2-E2E-001`, PostgreSQL acknowledgement, and restart replay; this documentation run did
not relabel the skipped aggregate cases as executed. The all-files documentation check returned
zero findings after link, task-shape, and index reconciliation.

The immutable package challenge found a distinct Connector release defect. Registry
`@4xeoz/re-entry@0.2.20` reports
`gitHead=733d77f97cca34429e2784dcf39663256dd3544b`, but that commit records package version `0.2.14`.
The `0.2.20` tarball bundles a Core client whose exact continuation fields omit `instruction`, while
active v2 returns that field and the current checkout requires it. A representative active-v2
Claim response executed through the tarball on Node `v24.20.0` failed with
`connector_response_invalid`. The earlier full-chain run used the current checkout, so it remains
valid local evidence but is not registry-package proof. AUDIT-V2-012 and TASK-032 own this release
and clean-consumer gate.

Direct `python3 scripts/validate_docs.py` is not a valid standalone check because the file exposes
library functions and has no CLI entrypoint. The supported repository gate imports it through
`validate_repository.py`; its Git-tracked scope was supplemented explicitly while the current
documentation remained untracked.

## Next gate and residual risk

This documentation baseline is locally verified, but the product is not converged. TASK-026 must
select an enforceable pairing abuse fence; TASK-027 must select and display effective Grant
lifetime; TASK-028 must resolve the duplicated Receiver authority model; and TASK-029 must select a
real product effect authority before default acknowledgement can exist. TASK-030 and TASK-024 retain
the logout and Guide UX defects. TASK-031 owns exact package/source reconciliation for the simple
facade. TASK-032 owns exact-source Connector compatibility with the active instruction-bearing
lease. Exact committed source, deployment provenance, full deployed popup/Event flow, SDK and
Connector publication for the simple increment, a selected Host application, and a
supported Agent-to-Browser/WebMCP adapter remain outside this documentation result.

No production code, schema, migration, configuration, deployment, package publication, commit,
push, file deletion, or Memory write occurred in DOCS-004.
