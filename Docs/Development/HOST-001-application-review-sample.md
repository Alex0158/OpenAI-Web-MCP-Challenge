# HOST-001: Application review sample Host

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — Host state, consent, cross-process delivery, effect, and human boundary  
**Status:** `locally_verified`  
**Opened:** 2026-09-01  
**Branch:** `codex/eyad-reentry-core-foundation`

## Objective

Build the bounded local sample accepted by ADR-0023 and close only when one application crosses:

```text
applicant consent and submission
-> reviewer approval
-> signed application.approved event
-> Receiver delivery
-> Local Connector claim
-> deterministic evidence-only continuation
-> visible next-stage plan
-> independent Host-effect acknowledgement
-> human-only final acceptance boundary
```

## Affected surfaces

- `runtime/application-demo/` for the sample Host, local composition, tests, and operator guide;
- Task, Decision, Development, and current-status records required by the verified claim.

The Re-entry Core, frozen MVP, reference snapshots, production deployment, and real Agent adapter
are unaffected.

## Falsifiers and stop conditions

- Reviewer approval sends an event before Host business truth is durable.
- Retry changes event identity or sends a different occurrence timestamp.
- Re-entry stores the applicant's form payload.
- A stale mutation succeeds or duplicate activation changes the next-stage plan twice.
- Delivery acknowledgement succeeds without exact independent Host-effect proof.
- Final applicant acceptance appears in the Site Tool inventory.
- The deterministic adapter is presented as supported Codex behavior.

## Verification plan

Run focused syntax and Node tests for normal flow, negative controls, retry identity, persistence,
and browser source boundaries. Then run the affected Host SDK, Receiver, Connector, Core aggregate,
repository validation, sensitive scan, English-only scan, and diff checks on Node 24.

## Claim boundary

The maximum claim is a locally verified application-shaped integration using an evidence-only
Agent Adapter. The current browser invocation is manual runtime evidence; genuine Connector-
triggered Codex acquisition and automatic page-bound WebMCP execution remain unverified.

## Verification result

The increment is locally verified on Node `v24.20.0`:

1. `runtime/application-demo` syntax passed and 2/2 tests crossed the full local flow plus
   premature review, blind human controls, stale revision, private form-data separation, durable
   Host state, and stable event identity after an uncertain send;
2. the Host SDK passed 11/11 tests, Cloud Receiver 19/19, Local Connector 2/2, and the generic
   reference system 2/2;
3. Re-entry Core syntax, 79/79 tests, process-isolated conformance, and package verification passed;
4. an in-app browser rendered the real SDK consent dialog, submitted the applicant form, approved
   it from the reviewer page, observed `NEXT_STAGE_READY` and `ACKNOWLEDGED`, discovered the fresh
   resumed-stage Site Tool inventory, and invoked `revise_next_stage_plan` from revision 2 to 3
   while `human_boundary.accepted` remained false;
5. the applicant and reviewer pages emitted no browser warnings or errors in that run; and
6. repository validator tests, repository validation, and sensitive scans passed.

The browser run proves the page UI and a genuine page-bound Site Tool invocation in the current
local in-app browser. It does not prove that the Local Connector can acquire that Browser or route a
real Codex context into it; the deterministic adapter still performs the automatic continuation.

The work is uncommitted and unpushed in the existing dirty worktree. No Git index, remote,
deployment, external account, or credential state was changed.

## Reopen condition

Reopen if the sample violates the ADR-0023 boundary, the SDK or Receiver contracts change, the
same local flow no longer converges exactly once, or a supported real Agent bridge requires a
different Host integration contract.
