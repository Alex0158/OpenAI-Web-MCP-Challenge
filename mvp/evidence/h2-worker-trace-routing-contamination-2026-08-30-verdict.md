# H2 Worker Trace-Routing Contamination Diagnostic

**Status:** Preserved diagnostic; not acceptance evidence  
**Observed:** 2026-08-30  
**Scope:** Mutable P0 development trace only

## Finding

An early H2 one-shot worker process inherited the default P0 trace path and appended fourteen
synthetic H2 delivery records to `latest-trace.jsonl`. The records were not part of the P0
runtime flow and must not be interpreted as P0 evidence.

The exact appended records are preserved in
`h2-worker-trace-routing-contamination-2026-08-30.jsonl`. They were then removed only from the
mutable P0 trace, leaving its original thirteen records unchanged.

## Correction and verification

The worker now receives an explicit H2 trace path. A process-level regression test verifies
that the temporary H2 trace grows while the P0 trace remains byte-for-byte unchanged. The
focused H2 process suite and the full project suite passed after this correction.

This diagnostic does not expand the H2 acceptance claim and contains only synthetic test
identifiers.
