# Continuity Calibration Structured-Output Preflight Rejection

**Status:** Preserved protocol diagnostic; no scored model output  
**Observed:** 2026-08-30  
**Affected protocol revision:** 1.0

## Observation

The first continuation requests failed before model generation. The current Codex
Structured Output endpoint rejected `uniqueItems` inside the array properties of the output
JSON Schema. Every attempted request returned the same `invalid_json_schema` classification,
and no structured decision output was produced.

## Disposition

The pilot was not interpreted and none of the affected persistent history sessions will be
reused. Protocol revision 1.1 removes the unsupported keyword from the transport schema and
adds explicit duplicate checks to the deterministic scorer. All four Stage-A sessions must
be recreated before the first scored continuation.

This is an execution-contract finding, not evidence for either continuity condition and not
product evidence.
