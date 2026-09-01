# RightSpot Tasks

**Role:** Canonical bounded task routing for the RightSpot child application  
**Status:** Active for post-MVP decision proposals; `RIGHTSPOT-002` remains closed for the accepted local MVP

RightSpot tasks own local product and implementation work. They do not authorize changes to the
outer Core, public deployment, credentials, or Hackathon submission. Keep the queue small and
register a later task only when its prerequisite decision and boundary are known.

The outer repository [`Docs/Tasks/README.md`](../../../../Docs/Tasks/README.md) remains the higher
authority for task admission, control fields, lifecycle, and routing. This local index narrows that
authority to RightSpot; it does not create a second task system.

## Current tasks

- [`RIGHTSPOT-002 — Build the MVP application shell`](RIGHTSPOT-002-build-mvp-application-shell.md)
- [`RIGHTSPOT-003 — Define the rental marketplace UI/UX visual system`](RIGHTSPOT-003-define-ui-ux-visual-system.md)
- [`RIGHTSPOT-004 — Define the external authentication boundary`](RIGHTSPOT-004-define-external-authentication-boundary.md)
- [`RIGHTSPOT-005 — Route signed-in users to the role workspace`](RIGHTSPOT-005-fix-post-login-workspace-navigation.md)
- [`RIGHTSPOT-006 — Integrate the provider-backed authentication boundary`](RIGHTSPOT-006-integrate-provider-backed-authentication-boundary.md)
- [`RIGHTSPOT-007 — Implement the accepted Field Desk visual foundation`](RIGHTSPOT-007-implement-field-desk-visual-foundation.md)

`RIGHTSPOT-002` is terminal and remains unchanged. `RIGHTSPOT-003` and `RIGHTSPOT-004` are bounded
 read-only decision tasks opened for proposal work only; they are now closed after the main thread
 accepted ADR-RS-0009 and ADR-RS-0010. They did not reopen or widen the accepted MVP implementation.
`RIGHTSPOT-005` is a verified navigation defect whose Builder candidate and corrected independent
verification are complete; main-thread integration/Git closure is pending after the preserved tracked
metadata incident from attempt 01;
`RIGHTSPOT-006` is pending behind the explicit external credential gate and does not authorize
provider setup or authentication source changes; `RIGHTSPOT-007` has an accepted read-only Advisor
decomposition and a gated single-file shared CSS Work Order, but no visual Builder is dispatched.

Work Orders are recorded inside the [`RIGHTSPOT-002` Task File](RIGHTSPOT-002-build-mvp-application-shell.md);
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
and is integrated at `6a0b4b8`; `RS-WO-002-13` passed independent verification and is integrated at
product commit `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent
verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` passed the read-only direct
combined cross-role verification checkpoint and `RS-WO-002-15` passed the isolated browser walkthrough.
Its predecessor verifier runs were checkpoint-locally
blocked by a tracked `.gitignore` mutation adding `.gstack/` outside the declared candidate scope; the
original evidence remains preserved for separate ownership/recoverability handling. No separate
registered Task or Task File is created for that repair or recovery.
The user-authorized Side Chat learning
artifact and Pilot Runbook writeback are process-only changes, not product source drift.
One registered Task has one Task File. A Work Order is a dispatch brief under that Task; normally
there is one active Work Order per dependency chain, while explicitly independent slices may run in
parallel under the same file. Builder, Verifier, Repairer, and Integrator are checkpoints, not
additional registered Tasks. Do not turn this file into a speculative backlog or a second active-work
register. The parent remained `in_progress` when a checkpoint was locally blocked but safe parent-goal
work remained; it is now `closed` for the accepted local MVP. The Side Chat process lane is separately
declared and user-authorized.

**Current gate:** None for the accepted local MVP. `RS-WO-002-14` direct evidence and `RS-WO-002-15`
browser evidence are reconciled in the
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](../Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md), and
`RIGHTSPOT-002` is closed.

**Current post-MVP gates:** `RS-WO-005-01` is verified and awaiting main-thread integration/Git
closure; `RS-WO-007-01` is ready for review and `RS-WO-007-02` is gated behind the 005 integration
checkpoint.

The completed [`RIGHTSPOT-001`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
record remains discoverable by filename and is not deleted or moved.

## Task lifecycle

Use `pending -> in_progress -> verification_pending -> closed`, with a named dependency when the
next increment cannot proceed. A task record must state its bounded outcome, owner, current
evidence, non-goals, verification, next gate, and reopen condition.
