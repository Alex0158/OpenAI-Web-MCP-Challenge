# Exact-Task versus Capsule Method-Calibration Verdict

**Observed:** 2026-08-30  
**Protocol:** `continuity-calibration-v1-20260830`, revision 1.2  
**Verdict:** **REVISE_PROTOCOL — no continuity-value inference permitted**

## Primary frozen result

All eight planned scored runs completed once with no retry and valid Structured Output. The
frozen scorer produced one `SafeSuccess` and seven failures. Every failed run failed exactly
one gate: `used_tool_names`.

The fixture defined that field as the complete current-page tool inventory. Seven outputs
instead listed only the preparation tool, or the preparation tool plus one directly relevant
read tool. Because the scorer was frozen before execution, these failures remain failures.
They cannot be removed or reclassified after observing the outputs.

This makes revision 1.2 unsuitable for a causal `HISTORY_PLUS_CAPSULE` versus `CAPSULE_ONLY`
comparison. The field measured a prompt interpretation about self-reported tool inventory,
not actual tool use or continuity quality.

## Descriptive observations that do not override the primary result

Across all eight outputs:

- the selected action, artifact revision, capsule rules, current facts, stale-assumption
  rejections, human boundary, privacy flag, and forbidden-content gates passed;
- the stale-history cases rejected both superseded assumptions in both conditions;
- the noisy-history case disclosed no synthetic privacy canary in either condition; and
- no output selected or claimed to perform the human-only consequence.

The paired outputs contain no observed critical-content advantage for the history condition.
This is only a descriptive observation: four synthetic cases, one run per condition, an
invalid primary instrument, and no human grading cannot establish equivalence or superiority.

## Runtime confound

Fresh CLI sessions repeatedly emitted state-database fallback and skill-description budget
diagnostics. Resumed continuation turns did not emit those diagnostics in the scored turn,
although their Stage-A setup turns had received the skill-budget item. This condition-
correlated runtime surface violates a clean common-environment assumption.

The history condition also consumed a mean of 39,762 input tokens per continuation versus
18,119 for capsule-only, about 2.2 times as many. That is a measured treatment characteristic
of these CLI sessions, not a general cost estimate and not evidence that a real Desktop task
has the same ratio.

## Durable lessons

1. Score actual runtime tool-call traces. Do not ask the model to self-report the complete
   available tool inventory.
2. Separate `available_tools`, `required_tools`, and `observed_tool_calls`; they are different
   variables.
3. A valid comparator needs identical system instructions, tool catalog, startup diagnostics,
   and failure surfaces, or it must explicitly treat those differences as part of the total
   platform treatment.
4. Retain the fixture-sufficiency audit, explicit current-authority fields, stale-history
   traps, privacy canaries, strict boundary, frozen hashes, and no-retry rule.
5. Do not spend further pre-app runs on this CLI harness. Specialize the revised comparison
   to the selected application and execute it through the actual runtime and observed Site
   Tool traces.

## Claim boundary

This calibration does not prove exact-task value, capsule equivalence, product value,
WebMCP materiality, market demand, real Browser re-entry, or production transport. Its useful
result is the falsification of an inadequate evaluation instrument before that instrument
could produce a misleading product claim.

Machine-readable inputs and results:

- [`protocol-manifest.json`](protocol-manifest.json)
- [`scored-results.json`](scored-results.json)
- [`frozen-scorer-results.json`](frozen-scorer-results.json)
