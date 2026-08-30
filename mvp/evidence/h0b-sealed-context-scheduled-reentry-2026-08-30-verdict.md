# H0b Sealed-Context Scheduled Re-entry Verdict

**Observed:** 2026-08-30  
**Environment:** ChatGPT Desktop `26.825.41651` build `7345`  
**Verdict:** **PASS**  
**Scope:** Bounded prior receipt to scheduled same-task continuation, fresh built-in Browser,
and genuine read-only Site Tool invocation

## False-positive control

An existing idle test task first stored one bounded receipt containing a random sealed
canary, workflow ID, canonical URL, trigger phrase, and read-only continuation policy. The
task acknowledged storage without echoing those fields.

The later heartbeat prompt contained only the trigger and an instruction to use the prior
receipt. It did not contain the canary, workflow ID, URL, or Site Tool name.

## Result

| Criterion | Result | Evidence |
|---|---|---|
| Prior bounded receipt remains available | **PASS** | The scheduled turn returned the exact sealed canary; its SHA-256 matched the pre-recorded hash |
| Canonical URL comes from prior context | **PASS** | The scheduled prompt contained no URL, while the turn opened the receipt's exact canonical URL |
| Action comes from prior context | **PASS** | The prompt named no Site Tool; the turn rediscovered the page and selected the read-only workflow-context tool by the stored role |
| New built-in Browser document is used | **PASS** | The scheduled turn created a fresh `iab` tab before navigation |
| Genuine page-bound WebMCP is used | **PASS** | Fresh `fetchTools()` returned `get_workflow_context` and `continue_artifact`; `get_workflow_context` was genuinely invoked |
| No substitute state path is used | **PASS** | The scheduled trace contains no REST request, DOM state extraction, Computer Use, generic MCP substitute, or private Desktop relay |
| No workflow mutation occurs | **PASS** | Only the read-only Site Tool was called; authoritative workflow state and `updated_at` remained unchanged |
| Probe stops recurring | **PASS** | The heartbeat was paused immediately after the result |

## Bounded claim

> In the tested current Desktop build, an existing idle task retained a bounded re-entry
> receipt across turns. A later scheduled trigger containing none of the receipt fields
> recovered that receipt, opened its canonical URL in a fresh built-in Browser tab,
> rediscovered genuine page-bound Site Tools, and invoked the receipt's read-only action
> role.

This is stronger than H0a because the scheduled prompt did not leak the expected canary,
URL, workflow ID, or tool name. It proves bounded receipt continuity, not perfect recall of
an arbitrary long conversation.

It does not prove direct custom-event wake, event-gated mutation, duplicate-effect safety,
Desktop restart recovery, a documented public Browser-attachment contract, production
durability, or product value.

The structured record is
[`h0b-sealed-context-scheduled-reentry-2026-08-30.json`](h0b-sealed-context-scheduled-reentry-2026-08-30.json).
