# ENG-002: Collaborator Agent Guidance Reconciliation

**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under user authorization  
**Closure target:** `locally_verified` contributor-governance reconciliation

## Objective

Make the tracked repository `AGENTS.md` complete for collaborators while keeping it a compact
routing and non-negotiable surface rather than a duplicate Core, Engineering standard, or runbook.

## Baseline and problem

- `main` and `origin/main` matched at merge commit
  `edd42854942cec39de935af79d22e6404be70f89` before this increment;
- the tracked guide had 180 lines and explicitly depended on broader defaults from an untracked
  parent workspace file;
- the parent file contained repository-relevant evidence, immutable-reference, and change-safety
  rules that a clone could not see;
- the tracked guide repeated the complete validated-goal Git sequence and command list already
  governed by the Primary Development Runbook; and
- ADR-0017 and TASK-002 already require a concise `AGENTS.md`, reject placing every rule there, and
  provide a reopen gate when a session cannot find the correct authority.

The Emorapy repository was inspected only as a read-only structural reference. Its compact tracked
guide routes detailed implementation and CI procedure to scoped documentation, supporting the same
placement principle without importing Emorapy-specific controls or directory depth.

## Accepted placement

1. Root `AGENTS.md` owns clone-visible routing, protected scopes, mandatory engineering and evidence
   boundaries, exact aggregate entry commands, Git safety, and completion-claim discipline.
2. `Docs/Engineering/` owns reusable quality, verification, instruction-placement, and procedural
   detail.
3. Core and Mechanisms own mutable product status, requirements, architecture, trust, and mechanism
   behavior.
4. Tasks, ADRs, Development records, code, tests, runtime evidence, and release readback retain their
   existing lifecycle, decision, implementation, and claim ownership.
5. The parent workspace `AGENTS.md` becomes a local router and is not required by a clone.

## Non-goals

- change product, mechanism, application, runtime, deployment, or submission behavior;
- copy all workspace or global preferences into the repository;
- add a new governance directory, template family, validator, or CI lane;
- rewrite ADR-0017 or historical ENG-001 closure; or
- modify Emorapy or use its current working tree as project evidence.

## Verification and closure gate

Close only when:

1. the repository guide is self-contained and every removed procedure has an existing canonical
   owner;
2. instruction placement is explicit in Engineering and the Git readback remains executable;
3. the parent workspace file contains only local routing and no collaborator-only requirement;
4. repository validators, links, English-only checks, and sensitive-pattern checks pass;
5. the complete owned diff is reviewed with no Core, Mechanism, runtime, or unrelated change; and
6. the coherent result is committed and pushed to `main` with local and remote identities equal.

## Reopen condition

Reopen if a clone misses a mandatory collaborator rule, the repository guide again accumulates
mutable product truth or full procedure, a removed instruction lacks a canonical owner, or the local
workspace router becomes a hidden dependency.

## Closure evidence

- the tracked repository guide is self-contained and reduced from 180 to 126 lines;
- the untracked local workspace guide is reduced from 44 to 23 lines and contains only workspace
  boundary, language, and tracked-guide routing;
- removed Git readback procedure is preserved in the Primary Development Runbook;
- the Engineering index now controls contributor-instruction placement;
- no Core, Mechanism, application, runtime, Reference, Research, Scenario, or source file changed;
- validator tests passed 6 of 6 and sensitive-scanner tests passed 3 of 3;
- complete repository validation, Markdown links, English-only checks, task and Development indexes,
  staged-diff checks, and high-confidence sensitive-pattern scanning passed; and
- direct changed-file CJK scanning returned no matches.

This evidence supports `locally_verified` repository-governance closure only. It changes no product,
runtime, deployment, judge-reproduction, or submission claim.
