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

The current Work Order is recorded inside the [`RIGHTSPOT-002` Task File](RIGHTSPOT-002-build-mvp-application-shell.md);
`RS-WO-002-01` returned `READY_FOR_VERIFICATION`, and the first `RS-WO-002-02` Verifier attempt
returned `BLOCKED` because its procedure created an output outside the declared RightSpot boundary.
The same checkpoint's corrected read-only rerun returned `VERIFIED`. The bounded Work Order
`RS-WO-002-03` Builder and one projection-isolation repair returned `READY_FOR_VERIFICATION`; its T2
source was frozen at `a60001e`, and its independent Verifier returned `NEEDS_REPAIR` for stale listing
revision writes. The bounded Repairer completed in post-repair commit `6e70c9f`, and fresh independent
verification returned `VERIFIED`. The current checkpoint is the bounded persistence/application
integration Work Order `RS-WO-002-04`, whose Builder completed checks but is `BLOCKED` by an
unexpected shared-tree learning artifact and Pilot Runbook change from another active task.
One registered Task has one Task File. A Work Order is only the current dispatch brief under that Task; Builder, Verifier, Repairer,
and Integrator are sequential checkpoints, not additional registered Tasks. Do not turn this file
into a backlog of future Work Orders or a second active-work register. The parent remains
`in_progress`; no product writer or repairer is active.

The completed [`RIGHTSPOT-001`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
record remains discoverable by filename and is not deleted or moved.

## Task lifecycle

Use `pending -> in_progress -> verification_pending -> closed`, with a named dependency when the
next increment cannot proceed. A task record must state its bounded outcome, owner, current
evidence, non-goals, verification, next gate, and reopen condition.
