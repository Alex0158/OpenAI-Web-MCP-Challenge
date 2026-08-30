# WebMCP Clean-Context Discovery Smoke

**Date:** 2026-08-30  
**Verdict:** `C1_VERIFIED_ONCE_SAME_ENVIRONMENT`  
**Client:** ChatGPT Desktop `26.825.41651` (build `7345`)  
**Mutation budget:** zero

## Purpose

Test whether genuine page-bound Site Tool discovery and one safe authoritative read require
project conversation history, project-file access, a retained tab, or an old tool handle.

This is a clean **Agent-context** smoke, not a clean account, workspace, machine, Browser
profile, public deployment, or judge run.

## Frozen controls

- Each probe used a fresh internal Agent context with no inherited conversation turns.
- Each probe was forbidden from reading project files or prior task history.
- Only the Codex in-app Browser was allowed.
- REST, generic MCP, DOM automation, Chrome, Computer Use, and substitute browser mechanisms
  were forbidden.
- Each target opened in a fresh tab and its current page-bound manifest was fetched.
- At most one allowlisted current-context tool with `readOnlyHint: true` could be invoked.
- Mutation, continuation, registration, acknowledgement, and commit-like tools were
  forbidden.
- Raw task, Browser, session, opaque binding, and bearer-like identifiers were excluded.

## Probe results

### P1 — official control

- Page origin: `https://learn.chatgpt.com`
- Page path: `/docs/webmcp`
- Discovered tools:
  - `search_openai_docs` — `readOnlyHint: true`
  - `lookup_page` — `readOnlyHint: true`
  - `lookup_context` — `readOnlyHint: true`
  - `navigate_to_page` — `readOnlyHint: false`
  - `generate_custom_guide` — `readOnlyHint: false`
- Invoked exactly once: `lookup_context`
- Result: `ok: true`, current path `/docs/webmcp`, no selected text
- Mutations: none

### P2 — local P0 Host

- Page origin: `http://127.0.0.1:4317`
- Page path: `/workflows/WF-001`
- Discovered tools:
  - `get_workflow_context` — `readOnlyHint: true`
  - `continue_artifact` — `readOnlyHint: false`
- Invoked exactly once: `get_workflow_context`
- Result: state `READY`, state version `2`, artifact revision `2`, not committed
- Mutations: none

## Interpretation

Both separate app-held source traces show success. Prior project turns, project source, a
retained tab, and an old Site Tool handle were not used for the two discovery-and-read runs.
Only the reviewed current-state readers were invoked; `readOnlyHint` is an untrusted manifest
annotation and is not independent proof of safety.

The app retains the source task call sequences, including Browser setup, fresh-tab navigation,
the failed capability-documentation preflight, manifest fetch, one exact Site Tool invocation,
and completion status. This repo package intentionally excludes raw task and runtime IDs and
does not preserve a capture-time prompt hash or machine-checkable trace. It supports the
bounded same-environment C1 verdict but is not a self-contained public audit package.

The result remains same-environment evidence. Both contexts shared the installed client,
machine, environmental feature eligibility, and in-app Browser surface. The local probe was
also given a loopback URL. A fresh user-visible task, another account/workspace, another
machine, public deployment, and the full re-entry loop remain untested.

Capability-specific WebMCP documentation failed during both probes. The packaged Browser
documentation still supplied the required `fetchTools()` and `call()` contract, and both
manifests and calls succeeded after that preflight failure. No runtime identifier or bearer
material is recorded here.
