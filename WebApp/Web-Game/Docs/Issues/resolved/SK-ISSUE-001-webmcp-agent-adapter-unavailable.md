# SK-ISSUE-001: Current WebMCP Agent Adapter Cannot Enumerate Page Tools

## Issue Control

- Issue ID: `SK-ISSUE-001`
- State: `resolved`
- Priority: `P1`
- Type: capability uncertainty
- Owner: Game owner
- Next gate: None for this issue. CP-13 now depends on owner acceptance of the page-tool contract
  package in [`../../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md`](../../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md),
  not on adapter capability.

## Problem

The CP-02 page successfully called `document.modelContext.registerTool` and displayed a registration
readback, but the Codex browser capability handle could not execute `webmcp_list_tools` for the
`gpt-5.6-luna` model in use. External Agent discovery and invocation were therefore unproven from
CP-02 until this issue closed.

## Impact

While this issue was open, the page-bound tool path required by CP-13 and the event-to-Agent action
path required by CP-14 could not claim runtime support. The local worker, Canvas, realtime channel,
SQLite WAL, and visible degraded state were unaffected and carried the foundation work through CP-12.

## Evidence and falsifier

- Verified: [`SK-EVID-001`](../../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md) records
  the page registration readback and the exact adapter error.
- Verified: [`SK-EVID-030`](../../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md) reproduced the
  negative outcome on the canonical page with the verbatim error
  `gpt-5.6-luna does not support command "webmcp_list_tools"`.
- Verified: [`SK-EVID-044`](../../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md)
  established from vendor documentation that site tools are the WebMCP implementation, that they
  require GPT-5.6 Sol or Terra, and that GPT-5.6 Luna has WebMCP disabled — the exact model both
  negative probes had used.
- Falsifier, as originally stated: a supported adapter lists `cp02_inspect_probe` and successfully
  invokes its read-only callback on the same page.

## Resolution

The falsifier was met. Under [`SK-TASK-059`](../../Tasks/SK-TASK-059-cp13-site-tools-capability-experiment.md)
and the procedure in [`Validation/70`](../../Validation/70-cp13-site-tools-capability-experiment.md),
an eligible GPT-5.6 Sol session with site tools enabled discovered `cp02_inspect_probe` through the
adapter's own tool-listing path with its exact declared schema and read-only annotation, and invoked
it read-only. The result is recorded in
[`SK-EVID-045`](../../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md) at ladder level
6.

The cause was model eligibility, not the page registration implementation and not an absent
capability. No polyfill, shim, substitute browser, or simulated tool path was introduced at any point.

Two boundaries survive this closure:

1. The canonical game page still registers no tool, so a supported adapter correctly reports no tools
   there. That is the CP-13 implementation gate, which remains subject to owner acceptance.
2. A page-context `typeof document.modelContext` readback proved unreliable on the browser-control
   evaluation surface: it read `undefined` in the same session in which the adapter discovered and
   invoked the tool. Future probes may record that readback but must not use it to overrule an actual
   adapter result.

## Resolution boundary

Do not add a silent simulated tool path. Reopen this issue, or open a successor issue, if a supported
adapter later fails to enumerate a page-registered tool on an eligible model; a change of model,
client version, site-tools setting, account type, or origin is the trigger to revalidate rather than
to assume this result still holds.
