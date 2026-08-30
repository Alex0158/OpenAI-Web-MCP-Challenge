# P0 Correlated Clean-Run Verdict — 2026-08-30

**Verdict:** PASS for the five frozen technical-feasibility questions in one controlled,
same-user, local ChatGPT Desktop run.

**Correlation:** `corr_web_a4841d405b304c86a30026640a295f1c`  
**Workflow:** `WF-001`  
**Client:** ChatGPT Desktop `26.825.41651` (build `7345`)

## Acceptance matrix

| Question | Result | Correlated observation |
|---|---|---|
| Q1 — genuine manifest delivery | **PASS** | The canonical `INITIAL` page exposed exactly four page-bound Stage-A WebMCP Site Tools. Genuine calls read state, prepared revision 1, and returned the signed bounded Re-entry Manifest. |
| Q2 — consent, Grant, and private binding | **PASS** | The Receiver captured the current Desktop task privately, displayed its own consent UI, approved one bounded Grant under the user's explicit Browser-control authorization, persisted the receipt, returned only an opaque binding, and the page registered it through the genuine Stage-A Site Tool. |
| Q3 — authenticated intended-task resumption | **PASS, bounded** | One signed `WORKFLOW_READY` event resolved the exact private binding and delivered one correlated continuation message to this bound Desktop task. Exact replay returned the same run and created no second event or run. This proves one deduplicated happy-path delivery, not crash-recoverable production exactly-once semantics. |
| Q4 — canonical re-entry and fresh Site Tools | **PASS** | The event-opened canonical Browser page was claimed in the resumed task, fresh authoritative state was `READY`/version 2/revision 1, and its genuine page-bound inventory contained exactly `get_workflow_context` and `continue_artifact`. The latter was invoked without REST, DOM automation, generic MCP, or a substitute browser. |
| Q5 — same artifact to human boundary | **PASS** | The genuine Stage-B Site Tool continued `continuation_note` from revision 1 to revision 2. The page remained uncommitted, exposed a visible human Commit control, and exposed no Agent-callable commit tool. |

## Evidence package

- `p0-correlated-clean-run-2026-08-30-environment.json`
- `p0-correlated-clean-run-2026-08-30-stage-a.json`
- `p0-correlated-clean-run-2026-08-30-consent-and-binding.json`
- `p0-correlated-clean-run-2026-08-30-stage-b.json`
- `p0-correlated-clean-run-2026-08-30-database-verdict.json`
- `p0-correlated-clean-run-2026-08-30-tests.json`
- `p0-correlated-clean-run-2026-08-30-trace.jsonl`
- `p0-clean-run-stage-b-human-boundary-2026-08-30.jpg`

The correlated trace SHA-256 is
`f9e7b5b24c6e0ccb93e0a158b14939011f1e2fdbb7ab24e63ed876a039dd4273`.
It contains no raw Desktop task ID, opaque binding value, or Receiver/relay bearer. The
separate Stage-B record is the downstream Browser verifier; dispatch-time adapter fields in
the trace remain conservative because the Receiver cannot observe later Browser execution.

The final contract suite passed 23 of 23 tests.

## Claim boundary

This run closes the P0 technical-feasibility gate: the full mechanism is technically
composable in this current-build, same-user local Desktop environment.

It does **not** prove a documented public Receiver-to-Desktop bridge, production durability,
crash-recoverable exactly-once delivery, cross-user or hosted operation, deployment,
judge reproducibility, market demand, a selected demo domain, or submission readiness. The
experimental Desktop-bundled Node relay is a P0 bridge and is not the production architecture.

The Grant is persisted as `ACTIVATING` before enrollment receipt dispatch and becomes
`ACTIVE` after that dispatch returns. An exceptionally fast receipt turn could therefore
race binding registration. The clean run did not hit this window, but production enrollment
reliability remains unresolved.

The cropped pre-approval consent screenshot is retained as a diagnostic artifact only and
is not part of the acceptance proof. Q2 rests on the explicit user authorization, Receiver
decision record, final `APPROVED` database state, same-task enrollment receipt, and genuine
opaque-binding registration.
