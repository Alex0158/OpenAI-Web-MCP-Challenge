# H0a Scheduled Browser and Site Tool Probe Verdict

**Observed:** 2026-08-30  
**Environment:** ChatGPT Desktop `26.825.41651` build `7345`  
**Verdict:** **QUALIFIED PASS — Browser join only**  
**Scope:** Same-context Scheduled Task heartbeat to fresh built-in Browser and genuine
page-bound read-only Site Tool invocation

## Result

| Criterion | Result | Evidence |
|---|---|---|
| Scheduled turn runs in the targeted existing idle task | **PASS** | The heartbeat turn was recorded in the pre-existing controlled task, with no new task created |
| Prior dialogue is independently recalled | **NOT PROVEN** | The heartbeat prompt repeated `STAGE_A_CONTEXT_MARKER_WF_001`, so the marker was not a valid sealed canary |
| Prior manifest supplies the URL and next action | **NOT TESTED** | The heartbeat prompt directly supplied the canonical URL and `get_workflow_context` name |
| No previously attached canonical document is required | **PASS** | Test-owned canonical tabs were closed before scheduling; the scheduled turn created a new built-in Browser tab and opened the canonical URL |
| Fresh page exposes genuine WebMCP | **PASS** | The new page exposed the Browser's `webmcp` capability |
| Current Site Tools are freshly discovered | **PASS** | Discovery returned `get_workflow_context` and `continue_artifact` for authoritative `READY` state |
| Genuine read-only Site Tool is invoked | **PASS** | `get_workflow_context` returned workflow `WF-001`, state version 2, artifact revision 2, and the uncommitted boundary |
| No substitute mechanism is counted | **PASS** | The scheduled trace used the built-in Browser capability path; it used no REST, DOM automation, Computer Use, generic MCP substitute, or private Desktop relay |
| Probe makes no workflow mutation | **PASS** | State, versions, commit status, and `updated_at` were identical before and after the scheduled turn |
| Probe stops recurring | **PASS** | The heartbeat was paused immediately after the result |

One optional WebMCP capability-documentation call failed during setup. Fresh `fetchTools()`
and the genuine `get_workflow_context` invocation then succeeded without a fallback surface,
so this did not weaken the H0 result.

## Claim boundary

The supported bounded claim is:

> In the tested current Desktop build, one scheduled turn in an existing idle controlled
> task opened a fresh built-in Browser tab, discovered genuine page-bound Site Tools, and
> invoked a read-only Site Tool without user foregrounding or a substitute state-reading
> path.

H0a does not independently prove that prior dialogue or a stored manifest supplied the URL
and action. It also does not prove that a custom business event directly wakes an Agent,
event-gated continuation, duplicate-effect safety, restart recovery, production durability,
or product value. A sealed-context H0b is required before the context-driven re-entry claim.

The structured evidence is
[`h0-scheduled-browser-site-tool-probe-2026-08-30.json`](h0-scheduled-browser-site-tool-probe-2026-08-30.json).
