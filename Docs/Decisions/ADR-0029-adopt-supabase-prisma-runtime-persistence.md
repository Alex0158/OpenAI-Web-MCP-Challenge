# ADR-0029: Adopt Supabase PostgreSQL and Prisma for the Hosted Runtime Preview

**Status:** Accepted for the hosted MVP preview  
**Date:** 2026-09-01  
**Decision owner:** Project team  
**Controls:** TASK-003

## Context

The local Cloud Receiver uses several file-backed SQLite stores. A Vercel Function cannot treat
its local filesystem as durable application storage; the hosted preview therefore needs an
external database while preserving the existing Re-entry Core and product-preview behavior.

## Decision

Use Supabase PostgreSQL as the hosted persistence boundary and Prisma as the database client and
migration tool.

For this MVP preview, the existing synchronous SQLite store implementations remain the protocol
execution engine. Each Vercel request acquires a Postgres advisory transaction lock, hydrates the
four SQLite stores from Prisma-managed binary snapshots, executes the unchanged composition, and
persists the resulting snapshots before releasing the lock.

Use the Supabase transaction-mode pooler for runtime traffic through `DATABASE_URL` and the direct
or session-mode URL through `DIRECT_URL` for Prisma migrations. Both values are deployment secrets
and must never be committed or printed.

## Consequences

- Existing Receiver Core authority and local verification remain unchanged.
- Account, consent, pairing, and delivery state can survive a Vercel function cold start in the
  single-preview flow.
- Request throughput is intentionally bounded by one serialized runtime snapshot transaction; this
  is not a production-scale data model.
- A later production increment should replace binary snapshots with native asynchronous Prisma
  repositories if multi-instance throughput or independent query access becomes a requirement.
- Vercel deployment still requires production authentication, rate limiting, CSRF protection,
  secret rotation, and operational controls before it can be called a general public service.

## Rejected alternatives

- Keep SQLite under `/tmp`: rejected because it is temporary function storage, not durable service
  state.
- Add an in-memory or silent fallback: rejected because it would make state loss invisible.
- Rewrite Receiver Core semantics in the Cloud layer: rejected because Core remains the single
  authority.
