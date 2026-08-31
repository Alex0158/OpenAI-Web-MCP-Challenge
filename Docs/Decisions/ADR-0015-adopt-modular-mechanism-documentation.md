# ADR-0015: Adopt Modular Mechanism Documentation

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Pre-application documentation authority, mechanism-module ownership, and canonical
content-density rules

## Context

The application-neutral Re-entry Core is implemented and locally verified, but its canonical
documentation accumulated three different responsibilities in the same files:

- system-wide product and architecture truth;
- module-level contracts, failure semantics, and code mappings; and
- dated implementation, experiment, and evidence history.

`Core/03-system-design.md` and `Core/04-trust-security-reliability.md` became the main owners of
nearly every component and contract. `Core/00-current-status.md` also retained a long evidence
chronology already owned by Research, Development records, and frozen evidence. The separate
Knowledge package then summarized those same authorities again. This increased context cost and
created several plausible places to update one fact.

Emorapy demonstrates useful federated ownership through flagship, domain, shared-mechanism, and
specialized-mechanism documents. Its document count and product-specific layers are not a target
for this challenge project. The applicable principle is modular ownership, not document volume.

## Decision

### 1. Authority layers

The active pre-application documentation model is:

| Layer | Owns |
|---|---|
| `Docs/Core/` | System-wide product, requirements, architecture, trust, evidence gates, app selection, and competition truth |
| `Docs/Mechanisms/` | One stable Re-entry mechanism module per independent authority and lifecycle boundary |
| `Docs/Decisions/` | Accepted durable choices and supersession |
| `Docs/Development/` | Bounded implementation work, verification, runbooks, and closure history |
| `Docs/Challenge/` | Current English routing for competition constraints and refresh gates |
| `Docs/Research/` | Supporting research, experiments, unresolved analysis, and named snapshots |
| `Docs/Scenarios/` | Candidate application mappings that do not select the product |
| `References/` and frozen evidence | Immutable, historical, external, or event-time source material |

Current code and tests own implemented behavior. Runtime and external readback own deployment,
portability, release, and submission claims.

### 2. Mechanism modules

The Re-entry mechanism is documented through five lifecycle and authority modules:

1. Host integration, Manifest, and enrollment;
2. Receiver Grant and event authority;
3. delivery lease and Local Connector;
4. managed-context resolution and Agent activation; and
5. Host re-entry, WebMCP continuation, and the human boundary.

These modules follow stable contracts, not source-file count. A helper, schema constant, or
private function does not receive a separate document merely because it exists in code.

### 3. Split threshold

A new mechanism document is justified only when the surface has at least three of these
properties:

- independent authority or security boundary;
- explicit input/output or state-transition contract;
- independent failure lifecycle;
- separate implementation, deployment, or replacement path;
- focused tests or evidence;
- a selected application or adapter must conform to it.

Otherwise the content stays in its existing owner.

### 4. Content placement

Every mechanism document owns responsibility, boundaries, contracts, invariants, failure
semantics, code/test mapping, evidence limits, and reopen conditions. It does not contain
round-by-round implementation history, full ADR rationale, raw test output, or speculative app
features.

Core documents summarize system-wide truth and link to the module owner. ADRs preserve why a
durable choice was made. Development and Research preserve execution and evidence history.
Content is moved or rewritten rather than copied across these layers.

### 5. Noise and deletion rule

Content may be removed from the active tree when it has no independent authority, evidence,
historical rationale, or routing value and is recoverable from Git. Useful historical material is
demoted or retained outside the default reading path. Removal is not justified by age, length, or
non-selection alone.

The duplicate Knowledge package is removed after its only current operational value, the English
challenge-governance routing surface, is replaced by `Docs/Challenge/README.md`. Its classification
model, register, source reconciliation, and thread/Memory digest repeat current Core, ADR,
Research, and repository guidance and own no independent project decision.

### 6. Frozen and collaborator-owned material

The frozen P0 contract remains at `Docs/Core/07-p0-technical-validation-mvp.md` because MVP1 is a
preserved reference and changing its established link surface would create churn without changing
current routing. It is excluded from the normal implementation reading path.

Uncommitted candidate-app research and scenarios remain owner-controlled and outside this
decision's delivery scope.

## Consequences

### Positive

- A contributor can read one system overview and then one module contract for the surface being
  changed.
- Core files no longer need to repeat every accepted ADR, experiment, and dated test count.
- Module ownership maps directly to code and focused tests without turning documentation into a
  source-file mirror.
- Application-layer work can specialize stable contracts without changing Receiver authority.
- Removing the Knowledge mirror reduces stale summaries and update fan-out.

### Costs and risks

- Moving detail out of Core requires careful link and authority reconciliation.
- Module documents can themselves become duplicate specifications if their boundaries are not
  enforced.
- The selected app will need its own later product/domain documents; creating them before app
  selection would be speculative.
- Historical links still expose older verbose material when a reader deliberately follows it.

## Rejected alternatives

- **Copy the complete Emorapy document tree:** rejected because product scale, release maturity,
  and risk surfaces differ.
- **Keep one comprehensive system-design document:** rejected because module contracts already
  change and verify independently.
- **Create one document per source file:** rejected because it mirrors implementation and creates
  high drift.
- **Delete all historical and partially superseded material:** rejected because decisions and
  bounded failures retain provenance value.
- **Create selected-app feature documents now:** rejected until an accepted app-selection ADR
  establishes the actual domain and user journey.

## Reopen triggers

Reopen this decision if a mechanism cannot be assigned to one owner, two modules repeatedly need
the same normative text, a selected application introduces a real new authority boundary, or the
module layer increases update fan-out without improving routing or verification.
