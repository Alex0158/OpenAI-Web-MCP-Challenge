# DOCS-002: Modular Authority and Core Denoising

**Status:** `in_progress`  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under user authorization  
**Closure target:** `locally_verified` documentation-only delivery

## Objective

Prepare the repository for selected-application and Web App implementation by giving each stable
Re-entry mechanism one clear documentation owner, reducing canonical duplication, and removing
active-documentation noise that has no independent value.

## Baseline

- repository: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`;
- branch: `codex/re-entry-core-foundation`;
- starting commit: `aedfb280e3db566bfdf0bc38884f922541b72282`;
- local and remote task branches matched at the start;
- 75 Markdown files under `Docs/`, approximately 21,452 lines including untracked candidate work;
- preserved owner work: the Research 23 addition to `Docs/README.md`, the candidate additions to
  `Docs/Scenarios/README.md`, and untracked Research 23 and Scenarios 02 through 04.

## Problems

1. Core/00 includes more than 200 lines of evidence chronology already owned by Research,
   Development, Experiments, and frozen verdicts.
2. Core/03 owns system topology, every component, detailed accepted-contract narrative, logical
   payloads, state models, persistence, and current evidence in one file.
3. Core/04 mixes cross-cutting security policy with module-specific implementation chronology and
   repeated test-process evidence.
4. Core/05 repeats detailed historical P0 procedures and platform verdicts instead of remaining a
   current proof matrix and future-gate owner.
5. The Knowledge package repeats Core, ADR, Research, rules, and private-context summaries without
   owning a distinct product or evidence surface.
6. Current English challenge routing depends on that duplicate Knowledge package while earlier
   non-English research snapshots remain visible at the Docs root.
7. There is no single module contract that maps one Re-entry boundary to its code, tests,
   evidence limit, and future application obligations.

## Accepted design

ADR-0015 establishes the final pre-application documentation shape:

```text
Docs/Core/          system-wide flagship truth
Docs/Mechanisms/    five stable lifecycle and authority modules
Docs/Decisions/     durable decisions
Docs/Development/   execution and closure records
Docs/Challenge/     current English challenge routing
Docs/Research/      supporting evidence and unresolved analysis
Docs/Scenarios/     unselected application mappings
References/         immutable and historical material
```

The selected application will receive a separate domain layer only after an accepted
app-selection ADR.

## Bounded changes

1. Add the five Mechanism contracts and their authority index.
2. Rewrite Core/00, Core/03, Core/04, and Core/05 around their system-wide responsibilities.
3. Add concise routing from Core/01, Core/02, Core/06, and Core/08 where a mechanism owner is now
   more precise.
4. Replace the Knowledge challenge digest with `Docs/Challenge/README.md`.
5. Remove the remaining tracked Knowledge files because they duplicate current authorities and
   retain no unique operational contract.
6. Update repository, Docs, Decision, and Development indexes.
7. Preserve Core/07, MVP1, MVP2, Research history, immutable references, and candidate-app work.

## Deletion gate

Exact removal candidates:

- `Docs/Knowledge/README.md`;
- `Docs/Knowledge/01-priority-and-classification.md`;
- `Docs/Knowledge/02-high-value-register.md`;
- `Docs/Knowledge/03-source-reconciliation.md`;
- `Docs/Knowledge/04-thread-and-memory-distillation.md`;
- `Docs/Knowledge/05-challenge-governance-snapshot.md`.

They are tracked, unchanged at baseline, directly related to this reconciliation, and recoverable
from starting commit `aedfb280`. Demotion was considered, but would preserve a second routing and
status layer whose statements are already owned by Core, ADRs, Research, evidence, AGENTS, and the
new Challenge entry point. The challenge snapshot's current operational purpose is retained in
`Docs/Challenge/README.md` without copying its dated narrative; the superseded source file is then
removed with the rest of the package.

## Verification plan

1. all changed project-authored files are English;
2. all active local Markdown links resolve, including preserved uncommitted candidate files;
3. each Mechanism document has one responsibility, explicit exclusions, code/test mapping, and
   evidence limits;
4. Core/00 contains current status rather than evidence chronology;
5. Core/03 is an architecture overview rather than the owner of all module details;
6. Core/04 owns cross-cutting trust policy rather than dated implementation history;
7. Core/05 owns the current proof matrix and future evidence gates;
8. no active document links to the removed Knowledge package;
9. no runtime source, frozen MVP source, candidate-app document, immutable reference, or unrelated
   working-tree file enters the change;
10. Re-entry Core and frozen MVP1 tests pass unchanged;
11. working-tree and staged diff checks pass; and
12. the documentation-only delivery is committed, pushed, and remote-matched.

## Reopen conditions

Reopen only if a current surface has no owner, a module duplicates normative text from another
module, a default reading path again requires historical chronology, or selected-app work reveals
a genuinely missing domain or cross-cutting authority layer.

## Closure record

### Implementation and local verification

- Added one Mechanism index and five independent lifecycle/authority contracts.
- Rewrote Core/00, Core/03, Core/04, and Core/05 from 1,836 to 712 lines while preserving their
  current system-wide owners and routing detail into Mechanisms, Development, Research, and frozen
  evidence.
- Replaced the six-file, 678-line duplicate Knowledge package with one 70-line Challenge router
  and the owning Core and Mechanism links.
- The staged documentation delta is 27 files, 1,591 insertions, and 2,498 deletions. No runtime,
  frozen MVP, candidate-app, immutable reference, or unrelated working-tree file is staged.
- Changed project-authored files contain no Han-script prose.
- All 133 active Markdown files, including the uncommitted candidate research and scenarios, pass
  local-link validation. Two explicitly byte-preserved Legacy-Ideation snapshots retain 14 broken
  relative links caused by their historical relocation; editing them would violate their snapshot
  fidelity, so they remain excluded from the active link gate.
- Re-entry Core passes 79 of 79 tests on Node 26.5.0, and direct conformance returns `passed` with
  distinct roles and Receiver-only SQLite ownership.
- The frozen MVP1 suite passes 118 of 118 tests unchanged.
- `npm pack --dry-run --json` still reports 16 Re-entry Core package files; no runtime source or
  dependency file changed.

Commit, remote delivery, and final status remain pending.
