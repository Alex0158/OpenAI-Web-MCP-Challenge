# SK-TASK-056: CP-13 Capability Differential Diagnostic

## Task Control

- Lifecycle state: `verified`
- Closure type: `answered`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The differential analysis is complete and D1 and D2 are answered by [`SK-EVID-044`](../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md): site tools are ChatGPT's WebMCP implementation, and both probes ran on `gpt-5.6-luna`, which the vendor documents as having WebMCP disabled.
- Next gate: D6 is answered by SK-TASK-059 and SK-EVID-045; no further probe is required unless the
  model, client, settings, account, origin, or page contract changes.

## Identity

- Task ID: `SK-TASK-056`
- Date: 2026-09-03
- Risk profile: `Standard`
- Reason for profile: Read-only document and evidence analysis. It changes no runtime behavior, no
  contract, and no capability claim, but it feeds the decision that gates CP-13 and CP-14.

## Objective

Convert `SK-ISSUE-001` from an open-ended search for "a supported WebMCP Agent adapter" into a small
ordered set of decidable checks, by comparing the only successful page-bound tool run in this
repository against the two failed game probes.

## Success and non-goals

- Success: The three observations are compared on the dimensions that could explain the difference,
  and each difference is traced to a named source line rather than inferred.
- Success: The analysis identifies the cheapest check that can end the investigation and orders the
  rest behind it.
- Success: A correction is proposed where an earlier evidence record over-claimed the reusability of
  the frozen P0 configuration.
- Non-goals: Running a capability probe, changing `SK-ISSUE-001`, implementing CP-13, adding a page
  polyfill, selecting an adapter, or claiming any capability outcome.

## Scope and authority

- In scope: [`../Validation/68-cp13-webmcp-capability-differential-diagnostic.md`](../Validation/68-cp13-webmcp-capability-differential-diagnostic.md)
  and this record.
- Out of scope: `src/`, `tests/`, `package.json`, `probe/`, `reentry-core/`, `mvp/`, RightSpot, browser
  or client settings, and every runtime file. The frozen `mvp/` tree was read only.
- Allowed actions: read, write the two task-owned documents, run the documentation validator.
- Revalidate when: a fresh capability probe runs, the selected browser or model changes, or the
  official Site Tools eligibility surface changes.

## Owning authority

- Blocking issue: [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- Prior probes: [`SK-EVID-001`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md) and
  [`SK-EVID-030`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md)
- Prior review needing correction: [`SK-EVID-004`](../Evidence/SK-EVID-004-cp02-independent-reproduction-and-claim-review.md)
- CP-13 contract preparation in flight: [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md)
- External reference, read only: `mvp/RUNBOOK.md` and `mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md`

## Evidence status

- Verified: `document.modelContext` was present in the CP-02 session and `undefined` in the CP-13
  session, in the same browser product on the same day. The CP-02 probe page contains no polyfill.
  The canonical game page contains no registration code.
- Verified: the frozen P0 run proved "Site Tools" in ChatGPT Desktop and does not record
  `document.modelContext`.
- Inferred: the host injection difference is an environment or session condition rather than a page
  property, because a page cannot create a host-injected object.
- Verified: SK-EVID-044 answers D1/D2, and SK-EVID-045 answers D6 with a positive Sol discovery and
  read-only invocation on the disposable page.
- Unknown: the canonical game page's future registration/readback behavior and whether the same result
  holds after a model, client, settings, account, origin, or contract change.

## Verification and closure target

- Minimum verification: ladder level 1, static cross-reference against the three named evidence
  records and `mvp/RUNBOOK.md`.
- Closure target: answered. The task closes when the analysis is reviewed; the capability question is
  now closed for the bounded disposable-page result under SK-TASK-059 and SK-EVID-045.
- Reopen trigger: a new probe result, a change to the selected adapter, or a documented answer to D1
  that contradicts the framing above.

## Explicit non-claim

This task produces an analysis, not a capability result. It does not prove that a supported adapter
exists, that CP-13 can proceed, or that `SK-ISSUE-001` is closeable. It cannot be cited as capability
evidence.
