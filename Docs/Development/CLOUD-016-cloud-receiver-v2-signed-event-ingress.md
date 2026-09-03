# CLOUD-016 — Cloud Receiver v2 Signed Event Ingress

**Task:** [TASK-017](../Tasks/TASK-017-build-cloud-receiver-v2-signed-event-ingress.md)
**Decision:** [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md)
**Source contract:** [Feature 03 — Signed Host Event Ingress](../Cloud-Receiver-Handoff/v2-build/03-signed-event-ingress.md)
**Status:** `locally_verified` — Feature 3 closed and tested commit pushed; SDK verification remains pending
**Repository:** `saas-boilerplate/`

## Objective

Implement and verify the smallest Cloud Receiver v2 signed Event ingress boundary: authenticate
one canonical Host Event against its private Grant, atomically create one Event and one pending
delivery for the Grant's fixed target, and consume the Grant's one run without contacting the
Connector.

## Authorized boundary

- Red/green cases: `EVENT-001`–`EVENT-004`.
- Required environment: real Express app, disposable PostgreSQL, and a stopped Connector fixture.
- Required regressions: all Pairing and Consent/Targeting/Internal Revocation suites.
- Deferred: Delivery Claim, Connector lease/retry, Acknowledgement, Agent/effect handling, public
  Grant routes, deployment, and production identity.

## Contract basis

The implementation follows ADR-0007/ADR-0008 and the accepted Feature 3 decision in ADR-0036. The
exact Event body fields, canonical JSON, detached Ed25519 signature bytes, trusted Grant origin,
one-run reservation, duplicate semantics, and private pending-delivery projection are not redefined
here.

## Implemented surface

### Route

`POST /v0.1/events` is the only Feature 3 route added. It accepts JSON with exactly:

```json
{
  "body": "<canonical JSON event body>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "<host key id>",
    "WebMCP-Reentry-Timestamp": "<canonical epoch seconds>",
    "WebMCP-Reentry-Signature": "<unpadded base64url Ed25519 signature>"
  }
}
```

The canonical body has exactly `type`, `protocol_version`, `event_id`, `correlation_id`,
`binding_id`, `issuer_origin`, `workflow_id`, `event_type`, `event_sequence`, `state_version`,
`occurred_at`, and `canonical_url`. Version `0.1` requires type
`webmcp.continuation_event`, `event_sequence: 1`, a non-negative safe-integer `state_version`,
canonical HTTP(S) origin/URL values, and canonical JSON encoding.

The signature covers the exact UTF-8 bytes of
`<WebMCP-Reentry-Timestamp>.<body>`. The service resolves the private Grant by opaque binding,
uses its stored issuer origin and organization to resolve the active Host key, verifies the
signature and scope, and does not consult or call the Connector.

Successful responses are exactly:

```json
{
  "type": "webmcp.continuation_acceptance",
  "protocol_version": "0.1",
  "event_id": "event_123",
  "correlation_id": "correlation_123",
  "accepted": true,
  "duplicate": false,
  "status": "accepted"
}
```

The first acceptance returns `202`; exact authenticated replay returns the same response with
`duplicate: true`. Conflicting reuse returns `409 event_identity_conflict`. Stable negative
cases verified in this increment are:

| Case | Status | Error code |
|---|---:|---|
| Invalid signature | 401 | `event_signature_invalid` |
| Stale delivery timestamp | 401 | `event_delivery_timestamp_outside_window` |
| Future Event occurrence | 422 | `event_occurred_in_future` |
| Wrong origin | 422 | `event_origin_mismatch` |
| Unknown or revoked Host key | 401 | `event_key_unavailable` |
| Unknown binding or scope mismatch | 422 | `event_scope_invalid` |
| Invalid sequence | 422 | `event_sequence_invalid` |
| Invalid state version | 422 | `protocol_integer_invalid` |
| Invalid JSON Event body | 400 | `event_body_invalid` |
| Expired Grant | 410 | `grant_expired` |
| Exhausted Grant | 409 | `grant_exhausted` |
| Revoked Grant | 422 | `grant_revoked` |

### Durable boundary

The migration `20260902030000_signed_event_ingress` adds only `cr2_events` and `cr2_deliveries`.
The Event record stores redacted protocol metadata and canonical body bytes; it has no signature,
Connector credential, API key, or private control field. Unique constraints enforce one Event per
Event ID and one Event per Grant, one Delivery per Event, and one Delivery per Grant. The
transaction updates `runs_remaining` from `1` to `0`, inserts the Event, and inserts one
`pending` Delivery for the Grant's fixed `delivery_target_id` before returning `202`.

No Delivery Claim/lease, Acknowledgement, public Grant route, broker, deployment, or v1 behavior
was added. The pre-existing pairing-owned `/v0.1/delivery-claims` identity guard was not changed.

## Verification record

### Environment and fixture

- Receiver source: local `main` at commit `b851c320fae0505e3cf098f979d149e04ab44310`.
- Runtime: Node `v26.8.1`; npm `11.19.0`; Prisma `7.10.0`.
- Database: PostgreSQL `14.18`, disposable local database `cloud_receiver_feature3` at
  `127.0.0.1:55432`, with migrations through `20260902030000_signed_event_ingress`.
- HTTP: Supertest drove a real Express app returned by `createApp()`.
- Connector fixture: one Connector was paired and persisted through the public pairing flow, but
  no Connector process was started. `EVENT-001` accepted and queued with that process stopped.
- Secrets and raw mutable database rows are intentionally absent from this record.

### Commands and results

The disposable database was initialized with the existing migrations, then the Feature 3 migration
was applied:

```sh
DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm run db:migrate -w backend
```

Result: all four migrations applied successfully.

Red gate, after the test-only harness corrections, before the Event route/schema/implementation:

```sh
DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand src/modules/events/test/event.test.ts
```

Result: `1` suite failed, `4` tests failed because the route was absent and returned `404` instead
of the expected Event responses. No Event or Delivery tables existed at that point.

Focused green gate, including concurrent duplicate and reconnect replay checks:

```sh
DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand src/modules/events/test/event.test.ts
```

Result: `1` suite passed, `4` tests passed (`EVENT-001`–`EVENT-004`). The tests verified one
Event/Delivery and one consumed run for first acceptance, exact and concurrent replay, conflicting
Event-ID reuse, invalid signature/time/origin/key/binding/body/sequence/state cases, expired /
exhausted / revoked Grant rejection, stopped-Connector independence, SQL durability, and replay
after `prisma.$disconnect()` with a newly created Express app.

Pairing and Consent/Targeting regressions plus the complete backend aggregate:

```sh
DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand
```

Result: `6` suites passed, `21` tests passed. This includes Pairing, pairing restart, authentication,
Consent/Targeting/Internal Revocation, system health, and the four Event tests. The Consent test's
old "Event route absent" assertion was updated to the Feature 3 contract (`400 http_body_invalid`)
for an invalid Event envelope; public Grant inspection/revocation assertions remain `404`.

Static and schema checks:

```sh
DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm run db:generate -w backend

DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npx prisma validate --schema backend/prisma/schema.prisma

DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm run type-check -w backend

DATABASE_URL="postgresql://$(whoami)@127.0.0.1:55432/cloud_receiver_feature3" \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm run build -w backend
```

Result: Prisma Client generation, schema validation, TypeScript type-check, and backend build all
passed.

The direct PostgreSQL audit reported both intended tables, the migration ledger through Feature 3,
zero `signature`/`connector_token`/`api_key`/`token` columns on those tables, and zero residual test
rows after aggregate cleanup. During the Event tests themselves, SQL assertions observed exactly
one durable Event, one `pending` Delivery for the fixed target, `runs_remaining = 0`, no rows for
invalid/Grant-state failures, no second rows for duplicate/concurrent/reconnect replay, and no
signature column.

### Git and remote state

- Local commit: `b851c320fae0505e3cf098f979d149e04ab44310` (`feat: add signed event ingress`).
- Push command: `git push origin b851c320fae0505e3cf098f979d149e04ab44310:refs/heads/main`.
- Local Receiver repository: clean on `main`; local `HEAD` is
  `b851c320fae0505e3cf098f979d149e04ab44310`.
- Remote delivery: pushed successfully; `origin/main` reads
  `b851c320fae0505e3cf098f979d149e04ab44310`, matching local `HEAD` exactly.
- Parent documentation repository: remains intentionally dirty with pre-existing/unrelated tracked
  and untracked work; no parent reset, cleanup, or broad commit was performed.

## Closure and remaining blockers

Feature 3 is locally verified, closed, and pushed at the exact Receiver boundary above. SDK
verification remains pending and is not claimed by this record. ADR-0013 remains separate and
public Grant inspection/revocation remains paused. The next independent implementation gates are
Delivery Claim/Connector lease, Acknowledgement, and any deployment or production-runtime evidence;
none was started or inferred here. Reopen this increment if the frozen Event fields, signature input,
Grant authority lookup, one-run transaction, delivery state, or privacy boundary changes.

Commands, red and green results, runtime, database, fixture state, durable assertions, commit, and
remote status are recorded here. No raw credentials or mutable database state will be written to
this record.
