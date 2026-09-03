# ADR-0031: Adopt a Native Relational Cloud Receiver Schema

**Status:** Accepted for the hosted MVP preview  
**Date:** 2026-09-01  
**Decision owner:** Project team  
**Controls:** TASK-003  
**Supersedes:** ADR-0029's binary-snapshot persistence mechanism only

> **Current disposition:** The hosted schema implementation described here is superseded by
> [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). Preserve this record for schema
> history; it is not a current production persistence instruction.

## Context

ADR-0029 introduced Supabase PostgreSQL and Prisma around the existing synchronous SQLite stores.
That bridge made the hosted preview deployable, but Postgres exposes only one opaque binary snapshot
table. Operators cannot inspect accounts, organizations, connectors, consent, or deliveries as
normal records, and the previous global snapshot transaction serialized every request.

The product now needs a simple schema that follows the actual business flow: account and
organization ownership, connected devices, consent, Grants, events, and delivery.

## Decision

Use one Supabase PostgreSQL database with clear relational tables grouped by responsibility:

```text
identity:     accounts, organizations, api_keys, sessions
devices:      connectors, host_keys, host_subject_links, device_authorizations,
              pairing_requests
continuation: consent_sessions, challenges, grants, events, deliveries,
              delivery_states, delivery_attempts
```

The existing SQLite store implementations remain the synchronous execution compatibility layer for
this MVP. They are created in temporary request storage, hydrated from the relational tables,
execute the unchanged Receiver Core and control-plane logic, and are written back to the relational
tables before the Postgres transaction commits. They are no longer the durable source of truth.

Keep `reentry_runtime_store_snapshots` only as a one-time migration source for the already deployed
preview. The first successful relational request imports its four snapshots and clears those rows
inside the same transaction. New writes use the relational tables.

Keep one transaction-scoped advisory lock for mutating requests during this compatibility phase.
Read-only `GET` requests skip the lock because they do not write back state. Lock acquisition is
fail-fast and returns `503 receiver_busy`; it prevents two synchronous SQLite compositions from
overwriting each other's relational state.

## Consequences

- Accounts, organizations, keys, devices, consent, events, and delivery can be inspected with
  ordinary SQL and Prisma.
- Existing Core authority and local control-plane behavior remain unchanged.
- The first deployment needs a migration and a controlled snapshot backfill.
- The compatibility layer still permits only one active request at a time and is not a
  multi-instance production-scale repository.
- A later performance increment may replace the temporary SQLite execution layer with native
  asynchronous Core repositories; that is outside this decision.
- Raw passwords, bearer tokens, and session values remain digest-only; public Host keys remain
  public key material.

## Migration and recovery

1. Apply the additive Prisma migration that creates the relational tables and retains the old
   snapshot table.
2. Deploy the relational adapter.
3. On the first request, import the old snapshot files if snapshot rows exist.
4. Validate the relational records and persist the request result atomically.
5. Remove the snapshot rows only after the relational write succeeds.
6. Keep the old table empty until a later cleanup migration removes it after deployment readback.

If migration or backfill fails, the Postgres transaction rolls back and the snapshot rows remain
available for remediation. No in-memory or silent empty-state fallback is permitted.

## Rejected alternatives

- Keep the binary snapshot table as the application schema: rejected because it hides business
  records and caused the current lock-sensitive operational failure.
- Rewrite the entire synchronous Receiver Core before this preview: rejected because it expands the
  change beyond the immediate schema and deployment gate.
- Create separate microservices or databases for every table group: rejected because the MVP needs
  one simple service and one transaction boundary.
