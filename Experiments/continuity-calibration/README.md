# Continuity Calibration Evidence Map

This directory preserves the bounded, domain-neutral method calibration for comparing a
resumed task with prior history against a fresh Agent with the same strong continuation
capsule.

The controlling result is [`verdict.md`](verdict.md): **REVISE_PROTOCOL**. The experiment
does not establish exact-task value, capsule equivalence, or product value.

## Frozen protocol

- [`protocol-manifest.json`](protocol-manifest.json) records revision 1.2 hashes, runtime
  controls, common-input hashes, and execution order.
- [`scenarios.json`](scenarios.json) contains four synthetic cases and gold contracts.
- [`output.schema.json`](output.schema.json) is the Structured Output transport contract.
- [`render-prompt.mjs`](render-prompt.mjs) emits Stage-A and common continuation prompts.
- [`audit-fixtures.mjs`](audit-fixtures.mjs) verifies capsule sufficiency and common-input
  privacy before execution.
- [`score-results.mjs`](score-results.mjs) applies non-compensatory hard gates.
- [`test-scorer.mjs`](test-scorer.mjs) verifies passing output, one-fault gate failures,
  privacy-canary detection, and duplicate detection.

## Results and diagnostics

- [`scored-results.json`](scored-results.json) preserves the eight no-retry structured
  outputs, bounded runtime warnings, timings, and token observations without session
  identifiers or chain-of-thought.
- [`frozen-scorer-results.json`](frozen-scorer-results.json) records the exact frozen gate
  vectors and primary result.
- [`preflight-schema-rejection-2026-08-30.md`](preflight-schema-rejection-2026-08-30.md)
  preserves the unsupported `uniqueItems` transport-schema finding before any scored output.
- [`preflight-instrumentation-ambiguity-2026-08-30.md`](preflight-instrumentation-ambiguity-2026-08-30.md)
  preserves the unscored rule-versus-fact instrumentation correction.

Do not rerun or reinterpret revision 1.2 after changing its frozen files. A future app-
specific experiment requires a new protocol version and must score actual runtime tool
traces rather than self-reported tool inventory.
