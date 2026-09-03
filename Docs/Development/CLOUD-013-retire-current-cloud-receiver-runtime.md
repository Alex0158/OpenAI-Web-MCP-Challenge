# CLOUD-013: Retire the Current Cloud Receiver Runtime

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified`  
**Opened:** 2026-09-02  
**Task:** [TASK-013](../Tasks/TASK-013-retire-current-cloud-receiver-runtime.md)  
**Decision:** [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md)

## Objective

Make the current `runtime/cloud-receiver/` implementation visibly deprecated and unavailable as a
production Vercel service, while preserving its source and historical evidence for comparison.

## Owned surface

- package and Vercel entry points under `runtime/cloud-receiver/`;
- current Cloud Receiver README and cross-runtime setup guidance;
- Cloud Receiver-specific status, index, task, decision, and handoff records; and
- retirement tests and repository validation.

Explicitly unaffected: `reentry-core/`, the stable Mechanism contracts, frozen `mvp/`, immutable
References, and the future replacement service.

## Falsifiers

- the default hosted entry still initializes or serves the retired Receiver;
- an active guide still presents the retired package as the normal integration path;
- the deprecation response leaks configuration or persistence details; or
- the retirement changes the reusable Core protocol behavior.

## Closure boundary

Local source retirement can be verified in this record. The existing hosted alias is not claimed
archived until an explicitly authorized Vercel operation and external readback occur. Historical
tests may opt into the retired factory only to preserve prior evidence.

## Verification

- Cloud Receiver: `npm run verify` passed 38 syntax-checked modules and 37/37 tests on Node
  26.8.1, including the default Vercel retirement response;
- Local Connector: 31/31 tests passed on Node 26.8.1, including the explicit Receiver-origin
  requirement for new connections; and
- repository validators, sensitive scans, repository validation, and `git diff --check` passed.

The former Vercel alias and its project/database were not archived or mutated; that external action
is intentionally outside this source-retirement increment.
