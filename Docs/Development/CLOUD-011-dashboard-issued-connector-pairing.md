# CLOUD-011: Dashboard-Issued Connector Pairing

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified`  
**Opened:** 2026-09-01  
**Task:** [TASK-011](../Tasks/TASK-011-dashboard-issued-connector-pairing.md)  
**Decision:** [ADR-0030](../Decisions/ADR-0030-adopt-dashboard-issued-connector-pairing-code.md)

> **Current disposition:** `DEPRECATED` for the Cloud Receiver implementation — this record is
> historical evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md);
> the Local Connector pairing seam remains preserved as preview evidence.

## Implemented slice

- `ProductFlowStore` now has a v2 migration and a durable account pairing request table.
- `Account Connector Control` exposes authenticated dashboard creation and unauthenticated CLI code
  redemption at `/v0.1/account/pairing-sessions` and `/v0.1/account/pairing-sessions/claim`.
- The dashboard overview shows **Pair this Mac**, displays the short-lived code, and provides a
  copy action.
- The CLI opens the dedicated user account page immediately, asks for the dashboard code, and claims
  the resulting delivery-only credential.
- User account pages are separate from developer registration and organization credential screens:
  the CLI opens `/user-register?next=/user-dashboard`, and both user auth paths land on
  `/user-dashboard`; `/user-register`, `/user-login`, and `/user-dashboard` are the only browser
  entry points used by the normal CLI pairing flow.

## Remaining deployment check

Cloud Receiver 27/27 tests, Local Connector 30/30 tests, Re-entry Core 80/80 tests plus conformance
and package verification, repository validators, sensitive scans, and diff checks pass locally on
Node 26.8.1. Public Vercel/Supabase behavior remains a separate deployment claim until the hosted
migration and endpoint are exercised against the deployed service.
