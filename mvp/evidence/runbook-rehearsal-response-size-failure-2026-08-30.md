# Runbook Rehearsal Diagnostic — Relay Response Size

**Status:** Preserved failed rehearsal; not P0 acceptance evidence  
**Date:** 2026-08-30  
**Scope:** Independent controlled runbook rehearsal in the same-user local Desktop runtime

## Observed sequence

- Genuine Stage-A page-bound WebMCP discovered the exact four initial Site Tools, read the
  reset workflow, prepared the independent rehearsal artifact at revision 1, and returned the
  signed Re-entry Manifest.
- Receiver-owned consent approved one bounded Grant, delivered the enrollment receipt to the
  same bound task, and registered only the opaque host binding through the genuine Stage-A
  Site Tool.
- The signed event transitioned the workflow to `READY` and reserved one run.
- Before the event follow-up was dispatched, the Receiver-side relay client rejected the
  forwarded `read_thread` result because it exceeded the 64 KiB relay response limit.

## Safe final state

- workflow state `READY`, state version 2;
- artifact revision 1 and `committed=false`;
- one event and one run, both `ADAPTER_FAILED`;
- one active Grant with its one-run budget consumed; and
- no event continuation delivered to the bound task.

The 11-record redacted trace is preserved in
`runbook-rehearsal-response-size-failure-2026-08-30.jsonl` with SHA-256
`abce44bdb8c79fe7a14d03fc28e7e83330eaeeec1037ddb6074fc8f2f6cfcee8`.
It contains no raw Desktop task ID, opaque binding value, bearer, native pipe path, or task
content. The frozen correlated P0 evidence package was not modified.

## Resolution boundary

The relay was changed after this diagnostic capture to validate the native task identity
inside the trusted relay and return only a compact redacted identity proof. The failed run
remains preserved as diagnostic evidence and must not be merged into a later clean trace.
