# Priority and Classification Model

**Role:** SUPPORTING governance rule for the knowledge register  
**Status:** Active  
**Observed:** 2026-08-30

## Why four levels are necessary

The repository contains decisions, implementation facts, experiment results, hypotheses,
and historical research. They have different jobs. A single label such as “important” or
“research” would hide the difference between:

- a rule that controls what the team may ship;
- a test result that limits what the team may claim;
- an unresolved question that may kill the current route; and
- a preserved snapshot that explains how the team arrived here.

The four levels below are an **attention and authority ladder**. They are not a truth score,
a quality score, or a claim that Level 4 material is worthless.

## The four attention levels

### Level 1 — Binding project truth

**Highest attention.** A Level 1 item controls current behavior, permissions, evidence
claims, legal compliance, or a durable project decision.

Typical sources:

- accepted ADRs;
- `Docs/Core/00-current-status.md` and named Core contracts;
- the current governing interpretation of Official Rules; and
- tracked collaboration or publication rules that protect the project boundary.

Required handling:

- do not contradict it from a lower-level note;
- change it only through its owning document and, when applicable, a new ADR;
- reconcile implementation, tests, evidence, and submission material after a change; and
- review immediately when new evidence could invalidate it.

Examples in this project include the decision to keep the WebMCP re-entry mechanism
domain-neutral, the separation between the Website Backend-to-Receiver protocol and the
Agent transport, the frozen P0 proof boundary, and the human-only consequence boundary.

### Level 2 — Verified evidence and decision-grade findings

**High attention.** A Level 2 item is supported by a reproducible runtime observation,
test result, primary-source snapshot, or a clearly bounded failure. It supports or limits a
Level 1 claim but does not become a product rule merely by existing.

Typical sources:

- frozen P0, H0b, H1, H2a, H2, C1, and M1 evidence;
- deterministic test suites and redacted verdicts;
- official WebMCP or challenge snapshots with a capture date; and
- a measured failure that changes the risk register.

Required handling:

- preserve the exact scope, environment, and limitations;
- never widen a bounded result into a production or portability claim;
- link the result to the Core or ADR statement it supports or falsifies; and
- rerun or refresh it when the client, model, account, deployment, or protocol changes.

### Level 3 — Active working knowledge

**Decision-relevant but unproven.** A Level 3 item is a hypothesis, open question, option,
target, experiment protocol, economic model, or candidate product direction. It deserves
attention because it can change the next decision, but it must not be described as
implemented, verified, supported, or selected.

Typical sources:

- post-H1 unknowns and validation roadmaps;
- product-value kill tests and revised comparison protocols;
- transport and watch-window models with app-specific inputs still missing;
- unresolved production identity, connector, durability, or deployment questions; and
- candidate ideas such as Signal Rescue before an app-selection ADR.

Required handling:

- state the falsifier or decision gate;
- record assumptions and missing measurements;
- promote only after an explicit evidence review; and
- demote or close it when a test rejects it, preserving the reason.

### Level 4 — Historical and reference context

**Lowest immediate attention; high traceability value.** A Level 4 item is retained to
preserve provenance, prior art, rejected options, immutable source snapshots, or earlier
reasoning. It does not control current implementation or claims.

Typical sources:

- superseded ADRs and the tender-specific Core draft;
- immutable TenderRelay materials;
- the broad WebMCP analysis dossier and deprioritized TwinSurface framing;
- old challenge research snapshots and legacy ideation; and
- thread or Memory material after its useful statements have been reconciled into the
  register.

Required handling:

- preserve it and label its historical status;
- link forward to the current owner or successor;
- do not silently reuse its stale dates, test counts, product identity, or novelty claims;
- never overwrite an immutable snapshot; and
- do not spend current implementation effort on it without a new decision.

## Independent metadata dimensions

Every high-value register item should carry all of the following dimensions. The dimensions
are deliberately independent: a volatile governing fact can be Level 1 but still need
rechecking, while a Level 4 historical failure can be highly reliable as history.

| Dimension | Allowed values | Meaning |
|---|---|---|
| **Type** | Decision, current status, mechanism, security, evidence, experiment, research, product, operations, reference, history | What kind of knowledge it is |
| **Authority** | Binding, supporting, informative | Whether it controls behavior, supports a decision, or supplies context |
| **Evidence state** | `DECIDED`, `VERIFIED`, `WORKING ASSUMPTION`, `INFERENCE`, `TARGET`, `UNKNOWN`, `SUPERSEDED` | What the project is allowed to claim |
| **Freshness** | Current, volatile, dated snapshot, stale, superseded | Whether it must be refreshed before reuse |
| **Decision impact** | Critical, high, medium, low | The consequence if the item changes or is false |
| **Owner** | Core, ADR, governing rules, evidence, research, experiment, reference | The file family that must be updated first |
| **Disposition** | Retain, reconcile, verify, promote, demote, supersede, quarantine | The next safe action; none implies deletion |

## Attention rules

Use these rules when deciding what to read or verify first:

1. **Critical:** inspect before implementation, release, public claim, or external
   coordination. Examples are legal eligibility, security boundaries, source-of-truth
   conflicts, and a result that can falsify the selected mechanism.
2. **High:** inspect before choosing an app, transport, identity model, or evaluation
   method. Examples are product value, distributed delivery, cold-start durability, and
   prior-art boundaries.
3. **Medium:** inspect when designing the selected workflow or demo. Examples are tool
   portfolio guidance, provider options, and measured UX details.
4. **Low:** preserve for context and traceability. Examples are rejected concepts, old
   marketing copy, and broad background that no longer changes the next decision.

Level and decision impact may differ. A Level 4 prior-art snapshot can still have Critical
impact if someone is about to repeat a claim it already disproves. The register must show
both fields rather than flattening them.

## Promotion and demotion gates

### Promote to Level 1

Require a named decision owner, an accepted ADR or canonical-doc update, supporting evidence,
and reconciliation of code, tests, runtime, and submission material. A plan or a positive
smoke alone is insufficient.

### Promote to Level 2

Require a reproducible artifact, exact environment and scope, a bounded verdict, and a
redaction review. A transcript summary or self-reported model result without runtime proof
is not enough.

### Keep at Level 3

Keep an item here when the evidence is incomplete, the app or user is unselected, a
threshold is not measured, or multiple plausible routes remain open.

### Demote to Level 4

Demote when a direction is rejected, superseded, no longer selected, or only useful as
historical context. Keep the reason and successor link; do not erase the source.

