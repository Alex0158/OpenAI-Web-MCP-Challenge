# Sleepless Kingdom Templates

**Role:** Active record-envelope authority
**Status:** Active
**Last updated:** 2026-09-02

## 1. Purpose

These templates are reusable evidence and decision envelopes. Copy the smallest applicable template
into its owning task, issue, decision, or evidence location. Do not fill this directory with
completed records.

Placeholders are prompts, not permission to invent facts. Remove an inapplicable section only when
the record states why it is inapplicable and the omission does not weaken a required gate.

## 2. Templates

| Template | Use |
|---|---|
| [Task Brief](task-brief.md) | Minimum envelope for any non-trivial work; the body of a `SK-TASK-*` |
| [Implementation](implementation.md) | Ordinary code or contract change, from failing evidence to closure |
| [Challenge Record](challenge-record.md) | Pre-implementation challenge for `Assured` work; promoted to an `ADR-GAME-*` when the choice is durable |
| [Verification Report](verification-report.md) | Evidence-bounded completion report with residual risk |
| [Evidence Record](evidence-record.md) | The body of a `SK-EVID-*` result |
| [Issue Record](issue-record.md) | The body of a `SK-ISSUE-*` verified problem |
| [Checkpoint Closure](checkpoint-closure.md) | The roadmap closure packet for a `CP-NN` checkpoint |

## 3. Recommended combinations

- `Fast`: Task Brief, then a one-paragraph result.
- `Standard`: Task Brief, Implementation, Verification Report.
- `Assured`: Task Brief, Challenge Record, Implementation, Verification Report, Evidence Record, and
  an `ADR-GAME-*` when the choice is durable.
- Checkpoint closure: the `Standard` or `Assured` set plus Checkpoint Closure.

## 4. Rules

1. Use stable IDs from the owning authority: `SK-TASK-*`, `SK-ISSUE-*`, `SK-EVID-*`, `ADR-GAME-*`.
2. Replace or remove every placeholder before a record becomes evidence.
3. Separate `Verified`, `Inferred`, and `Unknown`.
4. Link evidence rather than pasting raw output, credentials, or private identifiers.
5. Name unexecuted checks and their consequences.
6. Use only the exact achieved closure label.
7. Keep every record English-only.
