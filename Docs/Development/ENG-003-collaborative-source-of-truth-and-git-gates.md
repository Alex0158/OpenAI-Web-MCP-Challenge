# ENG-003: Collaborative Source-of-Truth and Git Gates

**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under Alex and Eddie's project authorization  
**Closure target:** `locally_verified` repository collaboration-governance increment

## Objective

Implement the accepted collaboration control that protects Core and Mechanism authority from
underspecified requests, requires current-truth writeback, and bounds local-only work between two
contributors developing on separate computers.

## Baseline and problem

- `main` and `origin/main` matched at `a9a4e02445601077d15a14d84d45e2a5c7d1c848` before this
  increment, with a clean working tree.
- `AGENTS.md` already routed contributors to Core, Tasks, Engineering, and the applicable runbook,
  and it required fetch, divergence review, exact staging, and remote-SHA readback.
- The Primary Development Runbook already required current-truth writeback and Git closure, but it
  did not define the human-request authority check, non-authoritative proposal handling, or a timely
  synchronization cadence for Alex and Eddie's separate computers.
- The Emorapy repository was inspected only as a read-only structural reference. Its compact root
  guide supported routing detailed controls to scoped documents; no Emorapy-specific workflow or
  directory was imported.

## Accepted implementation

1. Root `AGENTS.md` now treats human requests as intent, requires a Core/Mechanism/ADR/Engineering
   comparison, and stops material architecture or mechanism conflicts for an explicit decision.
2. Root guidance now requires a product/mechanism/status/claim writeback checkpoint at increment
   start and before commit, while permitting a recorded no-change result when canonical truth is
   unaffected.
3. Root guidance now defines session-start and pre-push fetch/review, prompt commit and push after a
   bounded verified increment or before handoff, and deliberate integration without blind pull or
   history rewriting.
4. The Primary Development Runbook owns the detailed request classification, conflict report,
   re-confirmation, writeback, integration, and remote-readback procedure.
5. ADR-0018 and TASK-004 record the durable decision and bounded lifecycle; no Core, Mechanism,
   runtime, application, or submission behavior changes.
6. The parent workspace `AGENTS.md` carries only local routing and an instruction-boundary
   maintenance reminder; it is not required for a repository clone or collaborator delivery.

## Verification evidence and claim boundary

- `python3 scripts/test_validators.py` passed all 6 tests.
- `python3 scripts/test_sensitive_scan.py` passed all 3 tests.
- `python3 scripts/validate_repository.py --root .` passed repository, Markdown-link, index, and
  English-only validation.
- `python3 scripts/scan_sensitive_patterns.py --root .` found no high-confidence sensitive patterns.
- As a regression check, `cd reentry-core && npm run verify` passed syntax, all 79 tests, the
  domain-neutral conformance profile, and the package-surface check; no runtime claim was raised.
- `git diff --cached --check` passed, and the complete staged diff contains only governance
  documentation and index changes; no Core, Mechanism, application, runtime, or submission behavior
  changed.

This record supports only repository collaboration-governance closure. It does not prove application
behavior, separate runtime processes, Agent activation, deployment, judge reproduction, or
submission.

## Reopen condition

Reopen if the controls create repeated false conflicts, fail to preserve canonical truth, do not
bound local-only work or ownership, or no longer fit the project's shared-branch integration model.
