# CLOUD-014: Cloud Receiver v2 Pairing — Feature 1

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified` — Pairing Feature 1 closed; `PAIR-001`–`PAIR-005` and restart/replay pass  
**Opened:** 2026-09-02  
**Task:** [TASK-014](../Tasks/TASK-014-build-cloud-receiver-v2-pairing.md)  
**Decision:** [ADR-0033](../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md)

## Objective

Implement and verify the first Cloud Receiver v2 pairing slice in `saas-boilerplate/`: Prisma
pairing/Connector persistence, account-authenticated pairing creation, cookie-free claim, one-time
Connector-token delivery, tokenless duplicate replay, and the Connector identity guard used by the
delivery boundary.

## Owned surface

- `saas-boilerplate/backend/prisma/schema.prisma` and the pairing migration;
- `saas-boilerplate/backend/src/modules/connectors/` pairing routes, service, schemas, and tests;
- `saas-boilerplate/backend/src/modules/connectors/test/pairing-restart.test.ts`, which owns the
  real stop/start evidence; and
- the same clone’s v0.1 route registration and pairing-specific middleware; and
- disposable PostgreSQL test setup used to execute the existing backend handler; and
- the exact pairing contract recorded in ADR-0033.

Explicitly unaffected: Consent and later v2 features, frontend pages, `reentry-core/`,
`runtime/cloud-receiver/`, frozen `mvp/`, and the Local Connector source. The Local Connector
compatibility dependency is consumed as a separate clean commit, not modified here.

## Falsifiers

- A test fails before reaching the requested HTTP behavior because the test harness, auth setup, or
  database is undefined.
- A test passes without a real durable database or without proving the cookie-free CLI boundary.
- Any Consent route, later feature, or retired runtime is changed as part of this increment.

## Required verification

Executed from `saas-boilerplate/` with disposable PostgreSQL 16 Alpine database
`cloud_receiver_2_pairing_restart` on `127.0.0.1:55434`, container
`cloud-receiver-2-pairing-restart-postgres`:

- runtime: Node `v26.8.1`;
- tested Cloud Receiver commits: `44f0ff66898ca6eb925dd062d1bfd1f18b9ead96` (auth and pairing)
  plus `02ecb9df0452abc2c7d2bc3a16e495e03d04c139` (workspace TypeScript type-root fix); and
- database migration and verification commands (the disposable URL and JWT secret were injected
  only in the shell and are redacted here):

```sh
npm run db:generate -w backend
DATABASE_URL="<disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test JWT_SECRET="<test-only secret>" FRONTEND_URL="http://localhost:3000" npm run db:migrate -w backend
npm run type-check -w backend
npm run build -w backend
npx tsc -p backend/tsconfig.test.json --noEmit
DATABASE_URL="<disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test JWT_SECRET="<test-only secret>" FRONTEND_URL="http://localhost:3000" npm test -w backend -- --runInBand src/modules/connectors/test/pairing.test.ts src/modules/connectors/test/pairing-restart.test.ts
DATABASE_URL="<disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test JWT_SECRET="<test-only secret>" FRONTEND_URL="http://localhost:3000" npm test -w backend -- --runInBand
```

Results: Prisma generation, migration, backend type-check, backend build, restart-test type-check,
the targeted pairing/restart run (`2` suites, `6/6` tests), and the aggregate backend run (`4`
suites, `10/10` tests) passed. The restart test started the compiled Cloud Receiver, registered a
User over HTTP, created and claimed a pairing, stopped the process with `SIGTERM`, started the same
commit again, and replayed the pairing over HTTP. PostgreSQL assertions proved the pairing digest,
Connector token digest, consumed timestamp, Connector ID, and immutable delivery target survived;
the pairing had exactly one Connector; the replay response omitted `connector_token`; and a row-wide
database search plus the captured stdout/stderr contained no raw Connector token. The test never
prints the raw token.

The implementation uses `cr2_pairing_sessions` and `cr2_connectors`, SHA-256 digests for the code
and Connector token, an atomic compare-and-set consumption update, and a one-to-one immutable
delivery target. The delivery route currently provides only the pairing-owned invalid-identity
guard; delivery leases remain a later increment.

## Local Connector compatibility evidence

The completed tokenless replay support was verified before the server run:

- clean commit: `7fab264d237b3e172acb091888643c831cadcb85`;
- commit: `feat: complete local connector account pairing`;
- runtime: Node `v26.8.1`;
- verification: `npm run verify` in `runtime/local-connector/`, `34/34` tests passed and syntax check passed for 24 modules; and
- `git status --short -- runtime/local-connector` was clean after the commit.

The server now returns `connector_token` only for `duplicate: false`; a duplicate replay omits the
field entirely. It never returns an empty, fake, or digest token.

## Current closure boundary

The pairing gate is locally verified and Pairing Feature 1 is closed. ADR-0013 and proposed
[ADR-0034](../Decisions/ADR-0034-propose-organization-grant-control-amendment.md) are separate from
Pairing and do not block TASK-014/CLOUD-014 closure; they must be handled before later
Grant-revocation work. Consent and later v2 work remain paused. No Grant route was implemented or
given a final status by this increment.

## Residual risks and reopen conditions

- `PAIR-004` requires a disposable persistence fixture and must remain an internal test arrangement,
  not a new public identity field.
- Reopen if the implementation proposes delegated Grant control, raw-token persistence, target reuse,
  retired-database migration, or any scope expansion beyond pairing.
