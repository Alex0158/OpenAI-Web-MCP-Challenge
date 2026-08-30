# Continuity Calibration Instrumentation-Ambiguity Preflight

**Status:** Preserved protocol diagnostic; unscored dry run only  
**Observed:** 2026-08-30  
**Affected protocol revision:** 1.1

## Observation

After the transport schema was accepted, one unscored fresh-session dry run produced valid
structured output but revealed that the gold instrumentation conflated current-page facts
with capsule constraints. It also required pseudo-source identifiers that were not explicit
input values. A failure on those fields would therefore measure naming inference rather than
continuity or safety.

## Disposition

Protocol revision 1.2 separates capsule decision and constraint identifiers into
`applied_rule_ids`, current-page evidence into `used_fact_ids`, and removes the ambiguous
pseudo-source field. No scored output had been produced. All scored sessions will begin only
after the revised fixture, schema, renderer, and scorer are frozen and hashed.

This diagnostic is not evidence for either continuity condition and is not product evidence.
