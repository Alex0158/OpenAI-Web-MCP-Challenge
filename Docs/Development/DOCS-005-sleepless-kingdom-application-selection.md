# DOCS-005: Sleepless Kingdom Application-Selection Reconciliation

**Status:** `locally_verified`  
**Opened:** 2026-09-03  
**Owner:** Primary Codex session under explicit project-owner acceptance  
**Closure target:** `locally_verified` documentation and governance increment

## Objective

Record the accepted selection of Sleepless Kingdom as the first Host application and challenge-demo
carrier, then reconcile current Core, Mechanism, Task, scenario, and index claims without changing
Game code, Receiver/Connector runtime behavior, deployment, publication, or external state.

## Authority and boundaries

- [ADR-0042](../Decisions/ADR-0042-select-sleepless-kingdom-host-application.md) owns the application
  decision and its consequences.
- [ADR-0043](../Decisions/ADR-0043-adopt-standing-authorization-v0.2.md) owns the concurrently accepted
  repeated-signal target; RECORE-007 locally verifies its Core/SQLite reference, while product and
  external-runtime adoption remain open and do not raise current Game v0.1 evidence.
- [TASK-001](../Tasks/TASK-001-select-host-application.md) owns lifecycle and exact Git closure.
- [Core/00](../Core/00-current-status.md) and [Core/05](../Core/05-validation-and-evidence.md) own
  current evidence and non-claims.
- [`WebApp/Web-Game/`](../../WebApp/Web-Game/) remains an independently scoped product layer whose
  own `AGENTS.md`, Core-like status, Decisions, Tasks, Evidence, and Validation records own Game
  behavior and proof.
- Existing Game and RightSpot working-tree changes are owner-held and outside this increment.

## Challenge and selected path

The pre-change authority selected Re-entry Core but deliberately left the Host application open.
Meanwhile, the scoped Game layer became a substantial real implementation with a deterministic
world, browser-absent causal progression, canonical page reads, local Re-entry seams, and bounded
recall evidence. Leaving the outer Core at “unselected” now misroutes the challenge critical path.

The accepted path is to select Sleepless Kingdom for the competition prototype while keeping these
limitations explicit:

1. selection does not prove commercial demand or LLM necessity for the narrow G2 recall;
2. current local Game evidence does not prove the external Receiver/Connector/Agent/Browser chain;
3. Event queue acceptance, delivery claim, Agent activation, page action, Host effect, and ACK remain
   separate facts;
4. the Game needs the advanced Host SDK, not the generic facade defaults; and
5. the selected domain layer stays under `WebApp/Web-Game/` rather than being copied into Core.

The first visible scenario remains one G2 cargo-loss return. After ADR-0043 and RECORE-007, however,
the selected standing-mode competition proof requires two sequential effect-acknowledged signals
under one Consent. A v0.1 one-shot trace is compatibility evidence only and cannot close TASK-033.

## Bounded reconciliation

This increment:

1. adds ADR-0042 with the complete application, workflow, tool, human-boundary, transport, evidence,
   alternative, and reopen decision;
2. updates TASK-001 to verification pending rather than falsely claiming remote closure;
3. reconciles Core/00, Core/01, Core/02, Core/03, Core/05, Core/06, Core/08, and Core/09;
4. reconciles Mechanism 05 and the Mechanism index;
5. marks the outer Sleepless scenario as selected historical input and RightSpot as the preserved
   unselected alternative;
6. updates root, Docs, Decision, Task, Development, and Scenario indexes; and
7. preserves current Game/RightSpot source and documentation changes without staging or editing them.

## Verification plan

- repository documentation self-tests and validator;
- sensitive-pattern tests and scan;
- all-files link and English-only checks for the exact changed documentation set;
- `git diff --check` and complete task-owned diff review;
- stale-current-claim search for unresolved “Host app unselected” wording; and
- branch/upstream/dirty ownership readback.

## Verification performed

The documentation-only reconciliation passed these local checks on 2026-09-03:

| Check | Result |
|---|---|
| `python3 scripts/test_validators.py` | PASS — six validator regression tests |
| `python3 scripts/test_sensitive_scan.py` | PASS — three scanner regression tests |
| `python3 scripts/validate_repository.py --root .` | PASS — tracked repository validation |
| Exact 22-file `validate_docs` run, including untracked ADR-0042 and this record | PASS — links, English-only content, task controls, and index membership |
| Exact 22-file sensitive-pattern run using the repository scanner patterns | PASS — no high-confidence finding in this increment |
| `git diff --check` | PASS |
| Stale current-claim search | PASS — remaining “unselected” matches are this record's search description and the historical Program-closure statement |

The repository-wide `python3 scripts/scan_sensitive_patterns.py --root .` check remains red with 21
`OPENAI_KEY`-shaped findings across seven pre-existing, unchanged Game evidence/task/validation
records. The task-owned exact scan is green. This increment does not edit, suppress, or claim to
resolve those independently owned findings.

Runtime and deployment suites were not rerun because this increment changes documentation and
decision authority only. It makes no Game, SDK, Receiver, Connector, Core runtime, external service,
or deployed-state change.

## Closure and residual state

- ADR-0042 is accepted and the local authority reconciliation is complete.
- At the original verification, this increment was not staged, committed, pushed, or remotely
  verified. TASK-001 remains `verification_pending` for its separate remote delivery gate.
  The user subsequently authorized the local docs/standing-source closure recorded in CLOUD-023;
  that authorization does not include push, deployment, or application changes.
- The working tree contains concurrent collaborator-owned Game, RightSpot, Core, and protocol-v0.2
  work. This increment preserves it and does not treat its tests or changes as DOCS-005 evidence.
- The selected Host still lacks the external advanced-SDK/Receiver/Connector/Agent/Browser/WebMCP/
  effect-acknowledgement trace, hosted judge proof, validated demand, and demonstrated LLM advantage.
- ADR-0043 has a locally verified Core/SQLite reference; TASK-033, not this record, owns cross-layer
  adoption and the selected Game/external-runtime proof.
