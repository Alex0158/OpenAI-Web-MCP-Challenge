# CLOUD-012: Native Relational Cloud Receiver Schema

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `verification_pending`
**Opened:** 2026-09-01  
**Task:** [TASK-003](../Tasks/TASK-003-productionize-and-deploy-cloud-receiver.md)  
**Decision:** [ADR-0031](../Decisions/ADR-0031-adopt-native-relational-cloud-schema.md)

> **Current disposition:** `DEPRECATED` — this hosted schema implementation record is historical
> evidence only. The runtime and hosted preview it describes were retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

## Objective

Replace the opaque hosted SQLite snapshot as the durable source of truth with a simple relational
Supabase/Prisma schema for identity, devices, consent, Receiver state, events, and delivery while
preserving the existing Core behavior during this preview.

## Owned implementation surface

- `runtime/cloud-receiver/prisma/schema.prisma` and its additive migration;
- hosted Prisma persistence and one-time snapshot backfill;
- hosted API error and readiness behavior;
- repository-root Vercel packaging and secret exclusion;
- cloud-receiver tests and README; and
- this record plus the linked ADR and task reconciliation.

Explicitly unaffected: `mvp/`, immutable References, the Receiver Core contract, Host SDK, Local
Connector, and the selected-application gate.

## Falsifiers

- relational tables cannot represent every record required by the former account-first happy path;
- a snapshot can be imported and written back without preserving IDs, status, or secret digests;
- a failed request can commit a partial relational update;
- the cloud-receiver aggregate suite regresses; or
- Prisma migration/build cannot generate and load the new client.

## Implementation boundary

The current synchronous stores remain a temporary execution compatibility layer. The relational
tables are durable authority. Snapshot rows are read only for one-time backfill and are cleared
only after a successful relational write in the same transaction.

## Verification and closure

Required before deployment claim:

- Prisma client generation and migration SQL inspection;
- cloud-receiver syntax and aggregate tests;
- repository validators and sensitive scan;
- exact staged-diff and secret review; and
- deployed migration, health/readiness, and account-first smoke readback.

Current closure: local Cloud Receiver and Re-entry Core verification pass, and the additive native
schema migration plus production variables are configured on the Vercel project `re-entry-cloud`.
The retained deployment alias is
[https://re-entry-weld.vercel.app](https://re-entry-weld.vercel.app); the shorter
`re-entry-cloud.vercel.app` hostname is already owned by another Vercel account. External health
and readiness return `200`, and the canonical developer auth routes plus the existing-session user
dashboard render successfully. Hosted account-auth and pairing writeback remain open because this
increment did not create a new hosted account or pairing record.

The 2026-09-02 cloud-service cleanup adds typed duplicate-account mapping, safe console route and
page failure handling, bounded service and readiness failures, and actionable browser error
messages. Local closure is now verified: `npm run verify` passes the 38-module syntax check and
all 36 Cloud Receiver tests; the repository validators and sensitive-data scans also pass. The
read-only Supabase check confirmed both recorded migrations and the native relational tables for
accounts, organizations, API keys, connectors, consent, events, and deliveries without reading
application rows. The
remaining closure gate is hosted account-auth and pairing writeback, not local service behavior.

To close this record, verify the hosted account-auth and pairing write path, then verify these
production variables in the linked Vercel project without
placing values in the repository or chat: `CLOUD_RECEIVER_RUNTIME_DATABASE_URL` (session-mode
Postgres URL), `DATABASE_URL` (transaction-mode fallback), `CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET`,
and `CLOUD_RECEIVER_VERIFICATION_ORIGIN` (the deployed HTTPS origin). Then redeploy from the
repository root and verify `/healthz`, `/readyz`, `/`, account registration, pairing, consent, and
one delivery claim.
