# CP-14 Upstream Main and Game Scope Cross-Functional Audit

**Status:** VERIFIED STATIC SOURCE-TOPOLOGY AUDIT; GAME INTEGRATION REMAINS GATED  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-072`](../Tasks/SK-TASK-072-cp14-upstream-main-game-scope-drift-audit.md)  
**Evidence:** [`SK-EVID-059`](../Evidence/SK-EVID-059-cp14-upstream-main-game-scope-drift-source-audit.md)  
**Predecessor:** [`SK-TASK-064`](../Tasks/SK-TASK-064-cp14-eddy-branch-handoff-readiness-audit.md)  
**Policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Seam:** [`S14-A/S14-B`](../Engineering/10-cp13-cp18-implementation-seam-map.md)

## Audit question

After the new remote fetch, can upstream `main`, the Re-entry candidate, or Eddy's current ref be
used as the Game CP-14 integration base without risking loss of the current Game implementation or
overclaiming external delivery readiness?

## Evidence boundary

This is a ladder-level `1` static audit of local and remote Git metadata and remote-tree contents. It
does not check out a remote ref, run the game, invoke a browser or WebMCP adapter, contact an external
Receiver or Connector, wake an Agent, or verify hosted or judge behavior.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Git source topology | Local Game `main` is `b81952b`; fetched `origin/main` is merge `877aed7` with parents `cdcc0a8` and `aa31159`; candidate `aa31159` is an ancestor of the merge. | Pass for readback; no integration implied. |
| Game implementation | Local Game has `505` tracked paths; `origin/main` has `107`, with `398` deletions and `61` modifications relative to local Game. | **P0/P1 preservation risk.** Upstream is unsafe as a drop-in Game base. |
| Game source and tooling | Current `src/`, tests, `package.json`, runbooks, and recent CP evidence are not preserved in the fetched upstream Game tree as the same implementation baseline. | **P1.** Deliberate preservation is required before integration. |
| Ownership and handoff | Eddy's local ref is `0ce22ad` and fetched remote ref is `77c9cbc`; the prior handoff audit remains historical and no current owner declaration marks this exact tip ready. | **P1.** Keep the external handoff gate open. |
| CP-14 delivery contract | Existing Game seam requires versioned transport, binding, idempotency, acknowledgement, lease/retry, and active-Thread behavior before adapter work. The fetched refs do not supply an accepted Game-specific contract. | Open by design; no adapter mutation. |
| External Re-entry status | Upstream merge/status records describe an external candidate and leave production/publication gates open, including a `verification_pending` record. | External status is isolated; no Game runtime claim. |
| Workspace safety | The fetch/read phase changed refs only; local Game files and pre-existing RightSpot/research changes remained untouched; one actual worktree is registered. | Pass. |

## Race and failure review

| Risk | Control and disposition |
|---|---|
| Blind pull or merge replaces current Game | Do not mutate branch/index; require an exact-tip pre-merge diff and explicit preservation review. **Controlled by this audit.** |
| Remote tree omission is mistaken for completed integration | Compare tracked path counts and exact deletion/modification inventory before selecting a base. **Controlled.** |
| External Re-entry evidence is promoted to Game evidence | Keep source-topology, external status, and Game runtime claims in separate records. **Controlled.** |
| Eddy ref changes after this audit | Revalidate exact refs and rerun the topology review before any integration. **Open trigger.** |
| Owner later selects a different base | Treat this record as stale for that tip and open a new bounded pre-merge review. **Open trigger.** |
| Unrelated dirty work is staged during cleanup | Stage only Game-owned audit records; preserve RightSpot/research paths. **Controlled.** |

## Decision

1. Preserve local Game `main` and its current commits as the working implementation baseline.
2. Do not merge, rebase, cherry-pick, fast-forward, or pull `origin/main`, the candidate, or Eddy's
   ref while the owner has not selected an integration base and Eddy has not declared an exact tip ready.
3. When that gate is satisfied, run a clean pre-merge review that checks source, tests, package,
   runbooks, task/evidence indexes, and claim boundaries before touching the branch.
4. Review CP-14's versioned external transport contract separately; ancestry or external test volume
   cannot substitute for binding, acknowledgement, lease/retry, idempotency, or active-Thread proof.

## Residual risks and reopen conditions

- The final Eddy handoff tip, owner-selected integration strategy, and compatibility with the Game
  contract are unknown.
- External production identity, hosted continuity, genuine WebMCP dynamic action, independent browser
  delivery, and judge reproduction remain open.
- Reopen when any relevant remote ref changes, the owner authorizes integration, the Game contract
  changes, or a new external handoff supplies versioned transport and lifecycle details.

## Exact conclusion

The fetched upstream merge is not a safe drop-in base for the current Game because it omits most of the
current Game implementation and would delete `398` local paths. The local Game remains intact, and the
next actionable step is a deliberate exact-tip pre-merge review after Eddy's owner-declared handoff.
This audit closes only the source-topology question; it leaves CP-14 external delivery and all hosted
or judge claims open.
