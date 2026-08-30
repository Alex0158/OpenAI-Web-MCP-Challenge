# WebMCP Sol and Terra Model-Variation Smoke

**Date:** 2026-08-30  
**Verdict:** `M1_VERIFIED_ONCE_PER_DOCUMENTED_ELIGIBLE_MODEL_SAME_ENVIRONMENT`  
**Models:** GPT-5.6 Sol and GPT-5.6 Terra  
**Reasoning effort:** low  
**Mutation budget:** zero

## Frozen comparison

The controller supplied the same bounded experimental prompt and Browser objective to both
model arms. Each ran in a fresh internal Agent context with no inherited conversation turns,
no project-file reads, and no explicit memory lookup. Ordinary ambient instructions were
still present, and the full surfaces were not byte-identical: the Terra arm additionally
received one repository-collaboration rule added after the Sol run. This rule is unrelated to
WebMCP behavior but means the smoke is not a causal model-only comparison.

Each model used the Codex in-app Browser to probe, in order:

1. `https://learn.chatgpt.com/docs/webmcp`; and
2. `http://127.0.0.1:4317/workflows/WF-001`.

For each page, the arm opened a fresh tab, fetched the current page-bound WebMCP manifest,
listed `readOnlyHint`, and invoked exactly one allowlisted current-context tool for which the
manifest set `readOnlyHint: true`. Chrome, REST, generic MCP, DOM automation, Computer Use, and all mutating or
workflow-progressing tools were forbidden.

## Result matrix

| Observation | Sol | Terra |
|---|---|---|
| Official manifest discovered | VERIFIED ONCE | VERIFIED ONCE |
| Official inventory | Five identical tools and `readOnlyHint` values | Five identical tools and `readOnlyHint` values |
| Official call | `lookup_context`; `/docs/webmcp`; `ok: true` | `lookup_context`; `/docs/webmcp`; `ok: true` |
| Local manifest discovered | VERIFIED ONCE | VERIFIED ONCE |
| Local inventory | `get_workflow_context` with `readOnlyHint: true`; `continue_artifact` with `false` | Same |
| Local call | `READY`; state version `2`; artifact revision `2`; uncommitted | Same |
| Capability-documentation preflight | failed | failed; protocol resumed after the failed combined cell |
| Site Tool invocation retry | none | none |
| Mutating Site Tool invocation | none | none |

Capability-specific documentation failed in both arms, but the packaged Browser contract,
live manifest fetch, and genuine calls succeeded after that failure. Each actual Site Tool
invocation succeeded once without invocation retry. No raw runtime identity, opaque
binding, bearer material, unrelated artifact content, or task history is preserved.

## Boundary

This verifies one bounded discovery-and-read run per documented eligible model in one
installed environment, not parity or a controlled model effect. App-held source traces preserve each Browser and Site
Tool call sequence; the experiment controller and local app metadata preserve model
assignment. The repo intentionally excludes raw task/runtime identifiers and is not a
self-contained public audit package. `readOnlyHint` is untrusted metadata; the narrower
fact is that no mutating Site Tool was invoked. The result does not
test Scheduled Task behavior, event-gated continuation, model quality, usage, latency,
another account or workspace, another machine, or a public judge flow.
