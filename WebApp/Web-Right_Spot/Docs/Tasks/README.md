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
`RS-WO-002-01` returned `READY_FOR_VERIFICATION`, and the first `RS-WO-002-02` Verifier attempt
returned `BLOCKED` because its procedure created an output outside the declared RightSpot boundary.
The same checkpoint's corrected read-only rerun returned `VERIFIED`. The bounded Work Order
`RS-WO-002-03` Builder and one projection-isolation repair returned `READY_FOR_VERIFICATION`; its T2
source was frozen at `a60001e`, and its independent Verifier returned `NEEDS_REPAIR` for stale listing
revision writes. The bounded Repairer completed in post-repair commit `6e70c9f`, and fresh independent
verification returned `VERIFIED`. The current checkpoint is the bounded persistence/application
integration Work Order `RS-WO-002-04`. Its prompt was appended to the persisted `RS-WO-002-01`
supporting thread, so the original handoff was held for a dispatch-identity correction. The main
thread reconstructed and adopted the exact three-path candidate at T2 commit `68bbc69`; the first
dedicated read-only Verifier attempt stopped before source checks because the prompt described the
Worktree root incorrectly, and one corrected follow-up to the same identity-matching Verifier
returned `VERIFIED` against frozen source `28105e4d`. The next bounded Work Order,
`RS-WO-002-05`, returned `READY_FOR_VERIFICATION`; its exact 14-path candidate is frozen at T2 code
commit `de169ce`, and its dedicated independent Verifier is assigned from canonical snapshot
`bc3bc42`. The parallel planning Work Order `RS-WO-002-06` is assigned as a read-only Architecture
Advisor against the same stable candidate; the main thread must review both outputs before any UI
Builder dispatch. The user-authorized Side Chat learning artifact and Pilot Runbook writeback are
process-only changes, not product source drift.
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
