# Sol and Terra WebMCP Model-Variation Smoke

**Role:** SUPPORTING platform compatibility evidence  
**Status:** M1 verified for one discovery-and-read run per documented eligible model in the
same installed environment; no model parity claim is supported  
**Observed:** 2026-08-30  
**Scope:** Whether basic genuine Site Tool discovery in the current environment is specific
to one eligible GPT-5.6 model

## Executive judgment

Paired fresh-context probes using GPT-5.6 Sol and GPT-5.6 Terra each completed the bounded
Site Tool calls. Each model separately opened the official Site Tools documentation and the local
P0 canonical workflow page in fresh Codex in-app Browser tabs, fetched the current page-bound
WebMCP manifests, and invoked exactly one context tool with `readOnlyHint: true` on each page.

The two model arms returned the same tool inventories and authoritative summaries. Both arms
encountered a failed capability-documentation preflight before their successful Site Tool
sequence; the Terra arm explicitly resumed after the combined preflight cell failed. Each
actual Site Tool invocation succeeded once without invocation retry. Neither arm invoked a
mutating Site Tool, read project files, inherited prior conversation turns, or used a
substitute browser or integration.

The bounded evidence grade is:

> **M1 VERIFIED ONCE PER MODEL — one bounded discovery-and-read run completed on each
> documented eligible model in the same environment; this does not establish model parity.**

App-held source task traces preserve the per-arm Browser and Site Tool call sequence, and the
experiment controller plus local app metadata preserve the Sol/Terra assignments. The repo
package intentionally excludes raw task and runtime identifiers and is not a self-contained
public audit record. This is sufficient for the bounded M1 claim, not for public portability
or parity. It does not establish model parity for Scheduled Tasks, receipt recovery, event reasoning,
mutation quality, full Stage-B continuation, latency, usage, or product outcomes.

## 1. Official capability boundary

The current [official Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
states that Site Tools are available through the built-in Desktop Browser with GPT-5.6 Sol
or GPT-5.6 Terra. GPT-5.6 Luna currently has WebMCP disabled, and Site Tools are unavailable
in Enterprise or Edu workspaces. Availability also depends on rollout and the current page.

The experiment therefore tested the complete currently eligible model pair. Luna was not a
failed or omitted arm; it is outside the documented Site Tool capability set.

## 2. Intended control and instruction-surface confound

The model name was the intended treatment. The controller supplied the same bounded
experimental prompt and Browser objective to both arms, but the full ambient instruction
surfaces were not byte-identical. The Terra arm also received a newly added repository-
collaboration rule that was absent from the earlier Sol arm. That rule is unrelated to Browser
or WebMCP behavior, but it prevents a causal claim that model was literally the only changed
input.

Both arms used:

- one fresh internal Agent context with no inherited conversation turns;
- low reasoning effort;
- the same bounded experimental prompt and objective;
- no project-file reads or explicit memory lookup, while ordinary ambient system, developer,
  repository, and Memory Summary instructions remained present;
- the Codex in-app Browser only;
- fresh tabs in the same page order;
- dynamic `webmcp` discovery and live manifest fetching;
- exactly one allowlisted context call with `readOnlyHint: true` per page;
- zero mutation budget; and
- the same redaction and forbidden-substitute rules.

The pages were:

1. `https://learn.chatgpt.com/docs/webmcp`; and
2. `http://127.0.0.1:4317/workflows/WF-001`.

The protocol prohibited Chrome, REST, generic MCP, DOM automation, Computer Use,
navigation, guide generation, registration, continuation, acknowledgement, and commit-like
actions.

## 3. Results

| Surface | Sol | Terra | Paired result |
|---|---|---|---|
| Official tool inventory | VERIFIED ONCE | VERIFIED ONCE | `readOnlyHint: true` for `search_openai_docs`, `lookup_page`, and `lookup_context`; `false` for `navigate_to_page` and `generate_custom_guide` |
| Official invocation | `lookup_context` | `lookup_context` | `ok: true`; current path `/docs/webmcp`; no selected text |
| Local P0 inventory | VERIFIED ONCE | VERIFIED ONCE | `readOnlyHint: true` for `get_workflow_context`; `false` for `continue_artifact` |
| Local P0 invocation | `get_workflow_context` | `get_workflow_context` | `READY`; state version `2`; artifact revision `2`; human-only commit remained uncommitted |
| Capability-documentation preflight | failed | failed | Terra resumed after the combined preflight cell failed; Site Tool discovery remained available |
| Site Tool invocation retry | none | none | Each actual invocation succeeded once |
| Mutating Site Tool invocation | none | none | No mutation-capable tool was called; `readOnlyHint` alone is not a safety guarantee |

Both arms encountered the same non-blocking developer-experience limitation: the optional
capability-specific documentation endpoint was unavailable, while the governed Browser
documentation, live manifest fetch, and genuine tool calls all succeeded.

## 4. Interpretation

This result narrows one compatibility concern: the bounded WebMCP discovery-and-read sequence
was not observed only on Sol. It does not isolate a causal model effect or confirm general
model compatibility or parity because the full instruction surfaces differed. Both arms
invoked only the reviewed current-state tools that the manifest annotated as read-only; the
annotation is untrusted metadata and does not itself prove tool safety.

It does not answer whether Sol and Terra are equivalent for:

- recovering a sealed receipt from an exact scheduled task;
- distinguishing a no-event gate from an authorized event;
- selecting and executing a stage-specific mutation;
- handling stale state, conflicting revisions, or adversarial tool content;
- preserving the human consequence boundary in a full run;
- event-to-result latency or usage consumption; or
- selected-app quality and business value.

The next substantive model comparison should be embedded in the selected-app evaluation, not
expanded into another generic infrastructure project. Runtime tool traces, fresh authority,
SafeSuccess, latency, and usage must be measured for both arms, with a capture-time public
evidence package if the result will support a submission claim.

## 5. Nonclaims

This observation does not prove unattended model compatibility, another-account
availability, workspace portability, model interchangeability, equivalent reasoning
quality, or a stable public platform SLA. It does not make Luna, Enterprise, or Edu eligible
for Site Tools, and the repo record is not a self-contained public audit artifact.

The redacted run record is preserved in the
[experiment package](../../Experiments/webmcp-model-variation-smoke/README.md).
