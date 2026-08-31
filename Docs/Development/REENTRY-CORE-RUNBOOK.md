# Re-entry Core Development Runbook

**Role:** OPERATIONAL local-development, verification, and closure procedure  
**Status:** Active  
**Last updated:** 2026-08-31

## 1. Scope

Use this runbook to resume and close one bounded Re-entry Core increment. It owns execution
discipline only. Product intent belongs in `Docs/Core/01-product-definition.md` and
`02-product-requirements.md`; architecture and trust contracts belong in Core/03 and Core/04;
claim limits belong in Core/00 and Core/05; durable choices belong in `Docs/Decisions/`; and the
current increment belongs in its `Docs/Development/RECORE-*.md` record.

This is not a production operations, deployment, pairing, credential-provisioning, incident, or
Agent-runtime runbook. Do not use it to claim a Cloud Receiver service, supported Codex wake path,
Browser/WebMCP join, selected application, or judge-reproducible flow.

## 2. Resume gate

Before changing a file:

1. Read `Docs/Core/00-current-status.md`, the
   [program contract](REENTRY-CORE-PROGRAM.md), the active RECORE record, and every ADR governing
   the intended boundary.
2. Establish the repository and remote baseline:

   ```sh
   git rev-parse --show-toplevel
   git branch --show-current
   git status --short --branch
   git log -1 --oneline --decorate
   git fetch origin --prune
   git rev-list --left-right --count HEAD...origin/main
   ```

3. Identify pre-existing modified and untracked files. Treat them as collaborator-owned unless
   current evidence proves otherwise; do not stage, overwrite, restore, or delete them.
4. State one falsifiable outcome, its target closure label, owned paths, non-goals, and the
   smallest verification that could disprove it.
5. Confirm that the work belongs in `reentry-core/`. Do not implement new behavior in `mvp/`, a
   scenario, a research note, or a final-app layer.

If the requested change alters product behavior, authority, security, data lifecycle, process
topology, or a cross-layer contract, accept or update an ADR before or alongside implementation.

## 3. Increment loop

Run one closed loop:

```text
current files and evidence
-> owning authority and boundary
-> falsifiers and failure modes
-> smallest coherent change
-> focused verification
-> aggregate verification when affected
-> current-truth and evidence writeback
-> exact Git closure
```

Implementation rules:

- Prefer one narrow export and one real consumer over a generic framework.
- Keep final-app concepts, prompts, tools, events, and artifacts outside Re-entry Core.
- Use strict bounded data, explicit authority, redacted failures, and no secret-bearing logs.
- Do not add a dependency, daemon, lockfile, credential store, retry, fallback, or compatibility
  layer without a current requirement and evidence that the smaller design fails.
- Do not hide unsupported capability. Preserve a typed visible failure and continue unrelated
  safe work.
- Do not change code merely to raise coverage or a benchmark. A missing behavior test matters;
  an arbitrary percentage does not define completion.

## 4. Verification ladder

Run from `reentry-core/`. Start with the narrowest affected suite, then expand in proportion to
the changed boundary.

| Change | Minimum meaningful verification |
|---|---|
| One module or failure branch | `node --test test/<affected-suite>.test.mjs` |
| Protocol or frozen vector | Focused suite plus `npm run test:conformance` |
| Shared contract, export, persistence, or transport | Focused suite plus `npm test` |
| Claimed process isolation or recovery | `node --test test/separate-process.test.mjs` plus `npm test` |
| Node compatibility | Aggregate suite on the required Node 24 baseline and the current local runtime |
| Dependency or package-surface change | `npm ls --omit=dev --all --json` and `npm pack --dry-run --json` |
| Material hot path or startup claim | The relevant benchmark with an explicit local-only claim boundary |

Current commands are:

```sh
node --version
npm test
npm run test:conformance
npx --yes node@24.20.0 --test test/*.test.mjs
npm run benchmark:protocol
npm run benchmark:agent-adapter
npm ls --omit=dev --all --json
npm pack --dry-run --json
```

Run benchmarks only when the affected path or a recorded budget makes them relevant. Treat their
output as a local regression sample, not Agent, Browser, network, service, end-to-end, or SLA
evidence. Inspect the package file list, not only its byte count. When exports change, also prove
the intended subpath is importable and that unrelated root imports do not load the new boundary.

Before closure, also run `git diff --check`, verify English-only project-authored content, inspect
relative links in changed documentation, scan owned files for accidental credentials or private
runtime identifiers, and confirm that no `mvp/`, reference snapshot, mutable database, trace,
build output, or unrelated file entered the diff.

## 5. Failure triage

When verification fails:

1. Preserve the smallest reproducer and the exact failing boundary.
2. Separate implementation defect, stale expectation, environment constraint, and unsupported
   capability; do not turn one into another through wording.
3. Fix the narrow cause and rerun the focused check before the aggregate suite.
4. If the same path fails repeatedly without new evidence, stop that path and re-check its
   assumption, authority, runtime, and design.
5. Record an unresolved item with impact, affected surfaces, current evidence, and a concrete
   reopen condition. Continue independent safe work.

Never resolve a failure by weakening validation, discarding durable state, retrying an unknown
outcome automatically, inventing success evidence, modifying frozen reference code, or adding a
hidden fallback.

## 6. Evidence and documentation closure

Update only the owning surfaces:

- active RECORE record: increment scope, exact checks, closure label, residual risks, and next
  entry condition;
- Core/00: current phase and verified/unverified status;
- Core/03 or Core/04: only changed durable architecture, authority, trust, or failure truth;
- Core/05: proof matrix and claim ceiling;
- package README: current public package surface and explicit non-claims;
- ADR: only a durable decision, not implementation chronology.

Use the highest supported label only:

```text
decided < specified < implemented < locally_verified < separate_process_verified
< runtime_verified < deployed < judge_reproducible < submitted
```

Do not copy command logs into Core documents. Record concise results that change status or future
decisions, and keep every stronger runtime, deployment, and submission claim open until its own
evidence exists.

## 7. Git closure

Follow the repository `AGENTS.md` gate. In particular:

1. inspect `git status`, `git diff --stat`, `git diff --check`, and the complete owned diff;
2. stage exact owned paths only;
3. inspect `git diff --cached --stat`, `--check`, `--name-only`, and the complete staged diff;
4. commit one coherent validated outcome;
5. fetch again and inspect divergence without using a blind pull;
6. push only the current intended branch; and
7. prove `git rev-parse HEAD` equals the intended remote branch SHA from `git ls-remote`.

The closure report must distinguish local verification, local commit, remote delivery, remaining
dirty work, and every stronger unverified claim.

## 8. Handoff and reopen

Before leaving an increment, the active record must make the next session able to answer:

- What exact behavior is now authoritative?
- Which evidence supports it, at what closure level?
- What remains explicitly unproved?
- Which files are collaborator-owned and intentionally untouched?
- What is the next highest-leverage bounded increment and its entry condition?

Reopen a closed increment only when current code contradicts its recorded behavior, a required
check regresses, a governing ADR changes, or new runtime evidence invalidates its claim boundary.
New application, deployment, or Agent-platform work normally belongs in a new bounded task rather
than silently widening a closed foundation record.
