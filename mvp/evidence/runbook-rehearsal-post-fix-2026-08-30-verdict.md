# Post-fix Independent Runbook Rehearsal — 2026-08-30

**Verdict:** PASS for one independent runbook rehearsal of the five frozen P0 questions in
the controlled, same-user local ChatGPT Desktop runtime.

**Scope:** Rehearsal evidence only. This package does not replace or modify the frozen
`p0-correlated-clean-run-2026-08-30-*` acceptance package.

## Acceptance matrix

| Question | Result | Rehearsal observation |
|---|---|---|
| Q1 — genuine Manifest delivery | **PASS** | The reset `INITIAL` page exposed exactly the four Stage-A Site Tools. Genuine page-bound WebMCP read state, prepared the independent marker at revision 1, and returned the signed bounded Manifest used for enrollment. |
| Q2 — consent, Grant, and private binding | **PASS** | The supplied genuine Manifest entered the authenticated Receiver client; Receiver-owned user-authorized consent created one private exact-task Grant, delivered the enrollment receipt to the same task, and registered only the opaque binding through genuine Stage-A WebMCP. |
| Q3 — authenticated intended-task continuation | **PASS, bounded** | One signed `WORKFLOW_READY` event resolved the bound context and dispatched one continuation. Exact replay returned the original run and produced no second event, run, task dispatch record, or artifact write. This is not a crash-recovery or production exactly-once claim. |
| Q4 — canonical re-entry and fresh Site Tools | **PASS** | The event-opened canonical Browser tab read fresh `READY` state and exposed exactly `get_workflow_context` and `continue_artifact`; the latter was genuinely invoked without REST, DOM automation, generic MCP, or a substitute browser. |
| Q5 — same artifact and human boundary | **PASS** | The same `continuation_note` advanced from revision 1 to 2, retained the Stage-A marker, remained uncommitted, exposed no Agent-callable commit tool, and stopped at the visible human Commit control. |

## Post-fix bridge verification

The first independent rehearsal is preserved separately as a diagnostic failure: its event
reservation reached the old relay path, which attempted to forward a task response larger
than 64 KiB before dispatch. The corrected trusted relay now validates the single observed
`thread.id` identity contract, returns a compact redacted result, forwards no task content,
and fails closed for missing, mismatched, alias-only, conflicting, or multiple identities.

Focused relay tests passed 9 of 9 and the current full suite passed 31 of 31. The relay-client
64 KiB response cap was not raised.

## Final safe state

- one workflow, Manifest, consumed context capture, approved challenge, active one-run Grant,
  host binding, completed event, and completed run;
- `READY`, state version 2, artifact revision 2, and `committed=false`;
- exact private context continuity across capture, challenge, Grant, adapter context, and run;
- one `resume_exact_desktop_task`, one `continue_artifact`, and one `duplicate_event` trace
  record; and
- no rejected or failed record in the 13-entry single-correlation trace.

## Package

- `runbook-rehearsal-post-fix-2026-08-30-environment.json`
- `runbook-rehearsal-post-fix-2026-08-30-stage-a.json`
- `runbook-rehearsal-post-fix-2026-08-30-consent-and-binding.json`
- `runbook-rehearsal-post-fix-2026-08-30-stage-b.json`
- `runbook-rehearsal-post-fix-2026-08-30-trace.jsonl`
- `runbook-rehearsal-post-fix-2026-08-30-database-verdict.json`
- `runbook-rehearsal-post-fix-2026-08-30-tests.json`
- `runbook-rehearsal-stage-b-human-boundary-2026-08-30.jpg`

The Stage-B JSON is the separate downstream Browser verifier. It intentionally distinguishes
the Receiver adapter's conservative dispatch-time flags from the later Browser-observed
attachment, fresh Site Tool discovery, and genuine page-bound calls.

The trace SHA-256 is
`966fc59b71e728be96b2eeddb2efa2c13b5b8328a0120aea30113497dda0e26b`.
The correctly encoded JPEG screenshot SHA-256 is
`0a7e68f479f26e731ad841a9fa9a540812be08e76767a62d40be8a3de0a7dafb`.
The screenshot shows `READY`, revision 2, the exact two Stage-B tools, the continued artifact,
a masked opaque binding, `Not committed`, and the visible human Commit control.

The package contains no raw Desktop task ID, full opaque binding, Receiver or relay bearer,
native pipe path, or task content. The raw private SQLite database remains local and is not
part of this package.

## Claim boundary

This rehearsal independently re-executed the documented procedure inside the same current
machine and same-user Desktop trust boundary after the relay fix. It does not prove a
supported public bridge, another user's or machine's setup, production durability, hosted
operation, public deployment, clean-room judge reproducibility, a selected application, or
submission readiness.
