# ADR-0018: Adopt Collaborative Source-of-Truth and Change-Gate Controls

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex, Eddie, and project team  
**Scope:** Multi-contributor task intake, authority reconciliation, canonical writeback, and Git delivery

## Context

Alex and Eddie develop the project on separate computers while the repository is moving into
application-layer work. The repository already has Core, Mechanism, ADR, Task, Development, code,
test, and runtime owners, plus a Git closure gate. It did not yet state clearly how a collaborator
should handle a human suggestion that conflicts with accepted architecture, or how quickly a
verified increment should be synchronized before another contributor continues.

Without an explicit rule, an agent could treat a requested adjustment as permission to rewrite an
accepted mechanism, leave canonical documents stale after code changes, or let a completed local
increment remain uncommitted while the other computer advances the shared branch. A reminder in
`AGENTS.md` alone would be too easy to duplicate or too vague to review; a full procedure there
would make the repository instruction surface unnecessarily large.

## Decision

### 1. Accepted authority precedes implementation intent

A human request, suggestion, or next-step target is intent to evaluate, not an authority override.
Before implementation, the contributor compares it with the current Core or Mechanism contract,
governing ADR, active Task, and applicable Engineering controls.

The request is classified as one of:

1. **No authority conflict:** an implementation detail within accepted contracts; proceed under the
   existing decision.
2. **Non-authoritative proposal:** an additive idea or alternative that does not yet change accepted
   truth; keep it in Task or Research and do not rewrite Core, Mechanisms, or an accepted ADR.
3. **Material conflict or change:** a change to accepted architecture, mechanism, authority, security,
   data lifecycle, process topology, compatibility, deployment, or another cross-layer contract.

For the third category, implementation stops at the decision boundary. The agent must explain the
current rule, proposed difference, affected surfaces, impact and failure modes, viable alternatives,
and evidence needed to choose, then obtain an explicit human decision. If accepted, the ADR and
owning Core or Mechanism and Task are reconciled before or alongside implementation. Confirmation is
repeated only when material scope or impact changes; unchanged approved work does not require
repeated prompts.

### 2. Canonical truth is written back before closure

At increment start and before commit, the contributor checks whether product or mechanism intent,
authority, contract, status, or claims changed. If so, the owning Core or Mechanism and governing ADR
are updated, and the Development or evidence record captures the closure. If not, the record states
why no canonical update was needed. No code-bearing increment closes against stale authoritative
documents.

### 3. Git synchronization follows bounded coherent increments

Each contributor owns an explicit bounded increment and its files. At session start or resume, and
again before push, the contributor fetches the intended remote and inspects branch, ownership,
status, and divergence. A verified coherent increment is committed and pushed promptly after it
closes and before handoff or going idle. Remote work is integrated deliberately on a clean tree
after review; a pull is not a blind substitute for fetch and review. Remote-ahead or diverged state
is an integration decision, not permission to overwrite another contributor.

The primary session owns final staging and remote claims for its own delivery, while each human
contributor remains responsible for the correctness and handoff of their scoped increment. No
force-push, shared-history rewrite, destructive checkout, or discard of collaborator work is
allowed to manufacture a clean result.

## Consequences

### Positive

- Accepted mechanism and architecture cannot be silently changed by an underspecified request.
- Core and Mechanism documents remain current when their contracts actually change.
- Local-only windows become bounded and visible between two development computers.
- Handoffs expose exact ownership, branch, commit, and remote state.

### Costs and risks

- Contributors must spend a short comparison and writeback checkpoint on every coherent increment.
- Explicit conflict reports can delay implementation until a real decision is made.
- Prompt synchronization can produce more focused commits, although it does not require a commit for
  every save or transient edit.

## Rejected alternatives

- **Let every human request rewrite Core directly:** rejected because conversational intent is not an
  accepted architecture or mechanism decision.
- **Code first and reconcile documents later:** rejected because it creates an avoidable stale-truth
  window and makes review authority ambiguous.
- **Commit every file save:** rejected because it produces noise rather than coherent history.
- **Use blind pull before push:** rejected because it can hide ownership, overlap, and divergence.
- **Put the complete workflow in `AGENTS.md`:** rejected because the root guide should route and state
  non-negotiables while the Primary Development Runbook owns repeatable procedure.

## Reopen triggers

Reopen if the gate repeatedly blocks non-conflicting implementation, collaborators cannot determine
ownership or remote truth from the procedure, canonical documents still drift from accepted behavior,
the shared-branch model changes, or application/runtime work requires a distinct integration owner.
