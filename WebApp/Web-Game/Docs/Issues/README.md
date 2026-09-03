# Sleepless Kingdom Issues and Governance

**Role:** Active issue-governance authority
**Status:** Active
**Last updated:** 2026-09-03

## 1. Responsibility

This directory decides whether a verified problem remains active, is resolved, or is intentionally
not planned. It is the sole issue entry point for this application.

Durable choices are not stored here. They are recorded as `ADR-GAME-*` in
[`../Decisions/`](../Decisions/README.md). An issue may carry its Challenge inline when one issue owns
the whole decision; create an `ADR-GAME-*` when the choice affects multiple issues, modules,
checkpoints, or the `SK-MVP-*` contract.

The operating loop and Challenge trigger remain owned by
[`../00-Workflow/README.md`](../00-Workflow/README.md). Game rules remain owned by their modules.

## 2. State layout

```text
Issues/
  README.md
  pending/       # created with the first pending record
  resolved/      # created with the first resolved record
  not-planned/   # created with the first authorized non-action record
```

Only records under `pending/` represent current active state. Resolved and not-planned records are
decision history and never override a current specification. Do not create an empty state directory
in advance.

## 3. Identity

Issue IDs use `SK-ISSUE-NNN`, beginning at `001` and increasing monotonically. Never renumber or
reuse an ID. Files are named `SK-ISSUE-NNN-short-kebab-title.md`. A reopened issue keeps its original
ID unless the new evidence establishes a materially different problem, in which case the old record
links to the new ID.

## 4. Registration gate

Registration is normally required when work changes or exposes uncertainty in:

- game behavior or a canonical state transition;
- identity, ownership, or command authorization;
- cargo settlement, coin credit, loot transfer, or an exactly-once effect;
- world-clock units, due-work order, catch-up, replay, or event ordering;
- persistence schema, `world_snapshot`/`client_snapshot` shape, entity revision, or outbox delivery;
- the WebMCP tool surface, Re-entry action authority, or the human consequence boundary;
- a conflict among specifications, code, tests, fixtures, configuration, and runtime.

Typographical, formatting, link, and behavior-preserving test-only changes usually do not require an
issue. A non-trivial skip records the reason, assumptions, risk boundary, and minimum verification in
the owning task.

## 5. Evidence threshold

An issue is not a speculation bucket. Registration requires a concrete problem statement, its player
or engineering impact, current evidence classified as `Verified` / `Inferred` / `Unknown`, the owning
document or an explicit authority gap, and a falsifier or next evidence gate.

An unknown may justify an issue when the uncertainty itself blocks a P0 or P1 decision. Label it
accurately rather than presenting it as a defect.

## 6. State model

| State | Meaning |
|---|---|
| `proposed` | Evidence is sufficient to triage but ownership or scope is not final |
| `triaged` | Priority, type, authority, and next gate are accepted |
| `ready` | Intended behavior and verification are clear enough to act |
| `in_progress` | Authorized work is active |
| `blocked` | A named decision, authority, or state prevents meaningful progress |
| `verification_pending` | A change exists but the final gate is not closed |
| `resolved` | Current truth, implementation, evidence, and the final gate satisfy the objective |
| `not_planned` | Deliberate non-action is accepted with residual risk and a reopen trigger |

Do not use `resolved` for a code-only, focused-test-only, or unverified state when the issue's final
gate requires more.

## 7. Prioritization

Use highest credible impact, likelihood, exposure, reversibility, detection difficulty, and
dependency order. A defect that can duplicate or destroy cargo, coins, soldiers, events, or
continuations remains `P0` even at low observed frequency, because one occurrence invalidates the
determinism claim.

## 8. Resolution order

```text
final gate satisfied
-> owning documents reconciled
-> tests updated
-> fresh evidence recorded at the required level
-> residual risk and reopen trigger accepted
-> record moved to resolved or not-planned
```

Moving the file is the last state change, not the proof of completion.

`not_planned` is a decision, not neglect. It requires a verified problem, the reason for non-action,
the alternatives considered, the accepted residual risk and its authority, and explicit reopen
triggers. Short-term deferral or a missing owner is not `not_planned`; it stays `pending` or
`blocked`.

## 9. Reopening

Reopen the original issue when new evidence shows the same problem or final gate is no longer true:
a regression on a supported path, a contract or configuration change that invalidates the evidence, a
runtime result that contradicts a source claim, a new state that exposes the same authority gap, or a
changed assumption behind a not-planned decision.

## 10. Maintenance rules

1. Keep this README bounded. Never add a per-issue progress table or status narration.
2. Do not register ordinary planned work here; that belongs in [`../Tasks/`](../Tasks/README.md).
3. Do not use an issue to hide an unresolved decision or to present a plan as verified behavior.
4. Preserve records; history is not deleted because it is no longer convenient.
5. Keep every record English-only.

Start from [`../Templates/issue-record.md`](../Templates/issue-record.md).
