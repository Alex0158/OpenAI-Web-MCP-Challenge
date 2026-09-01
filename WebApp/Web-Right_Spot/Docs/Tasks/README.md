# RightSpot Tasks

**Role:** Canonical bounded task routing for the RightSpot child application  
**Status:** Active

RightSpot tasks own local product and implementation work. They do not authorize changes to the
outer Core, public deployment, credentials, or Hackathon submission. Keep the queue small and
register a later task only when its prerequisite decision and boundary are known.

The outer repository [`Docs/Tasks/README.md`](../../../../Docs/Tasks/README.md) remains the higher
authority for task admission, control fields, lifecycle, and routing. This local index narrows that
authority to RightSpot; it does not create a second task system.

## Current task

- [`RIGHTSPOT-002 — Build the MVP application shell`](RIGHTSPOT-002-build-mvp-application-shell.md)

Active Work Orders are recorded inside the [`RIGHTSPOT-002` Task File](RIGHTSPOT-002-build-mvp-application-shell.md);
`RS-WO-002-01` returned `READY_FOR_VERIFICATION`, the corrected `RS-WO-002-02` rerun returned
`VERIFIED`, `RS-WO-002-03` returned `VERIFIED` after its bounded repair, and `RS-WO-002-04` returned
`VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` is independently verified against
canonical snapshot `bc3bc42`. The read-only Architecture Advisor `RS-WO-002-06` returned
`READY_FOR_REVIEW`; the main thread accepted its decomposition with revisions, froze the ordinary
workflow HTTP/DTO contract in ADR-RS-0008, and dispatched `RS-WO-002-07`, `RS-WO-002-08`, and
`RS-WO-002-09` from reviewed baseline `c758634`. `RS-WO-002-07` and `RS-WO-002-08` passed dedicated
independent verification and are integrated at product commits `f700ba9` and `006d2fd`; the reviewer
is integrated as bounded guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW`
and its decomposition is accepted; `RS-WO-002-11` candidate `f1f83c7` passed independent verification
and is integrated at `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are the accepted disjoint tenant and
agent role-page Builder slices assigned in parallel; the agent candidate is now frozen for independent verification.
The user-authorized Side Chat learning
artifact and Pilot Runbook writeback are process-only changes, not product source drift.
One registered Task has one Task File. A Work Order is a dispatch brief under that Task; normally
there is one active Work Order per dependency chain, while explicitly independent slices may run in
parallel under the same file. Builder, Verifier, Repairer, and Integrator are checkpoints, not
additional registered Tasks. Do not turn this file into a speculative backlog or a second active-work
register. The parent remains `in_progress` when a checkpoint is locally blocked but safe parent-goal
work remains; the Side Chat process lane is separately declared and user-authorized.

The completed [`RIGHTSPOT-001`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
record remains discoverable by filename and is not deleted or moved.

## Task lifecycle

Use `pending -> in_progress -> verification_pending -> closed`, with a named dependency when the
next increment cannot proceed. A task record must state its bounded outcome, owner, current
evidence, non-goals, verification, next gate, and reopen condition.
