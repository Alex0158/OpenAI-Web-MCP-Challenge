# CLOUD-014: Cloud Receiver v2 Pairing — Feature 1

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified` — baseline Pairing Feature 1 and Amendment A local enforcement plus minimum hosted Preview Gate B2 readback verified; Production promotion and managed migration remain open  
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

The baseline increment explicitly left Consent and later v2 features, frontend pages,
`reentry-core/`, `runtime/cloud-receiver/`, frozen `mvp/`, and the Local Connector source
untouched. TASK-026 Amendment A subsequently updates the project-controlled Dashboard and active
Local Connector pairing input; it does not rewrite delivery or Agent behavior.

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

## TASK-026 Amendment A evidence

The pairing abuse fence is implemented in the active `saas-boilerplate/` boundary under
[ADR-0033 Amendment A](../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md#21-amendment-a--pairing-claim-abuse-fence):

- the route requires exactly `pairing_id`, `pairing_code`, and `device_name` and rejects the old
  two-field body;
- wrong attempts are durably atomic (five generic failures, terminal sixth), exact consumed-code
  replay remains tokenless, and the Dashboard displays the public pairing ID beside the code;
- the direct Vercel provider adapter HMACs one valid `x-vercel-forwarded-for` value, while a
  PostgreSQL bucket enforces 30 requests per ten-minute source window and bounded `Retry-After`;
- missing, repeated, comma-separated, invalid, weak-secret, and limiter-store cases fail closed;
  the retired runtime remains unchanged; and
- local evidence passes 39 focused backend tests across pairing and downstream consumers plus 49
  Local Connector tests (12 opt-in hosted suites remain skipped).

This paragraph records the pre-hosted local implementation state. The subsequent hosted Preview
sections record the exact deployment and readback; the Production HMAC secret, managed migration,
and Production promotion remain outside this increment.

### Hosted Gate B2 readback attempt — 2026-09-04

The current Preview alias `https://cloud-receiver-delta.vercel.app` was checked without credentials
or a real pairing identifier. Health/readiness and the frontend-origin claim preflight were
successful. An empty JSON claim body returned `400 http_body_invalid`; 30 additional identical
requests, each handled by a distinct Vercel execution, also returned `400` with no `429` or
`Retry-After`. A syntactically valid disposable `{ pairing_id, pairing_code, device_name }` body
was rejected with the same error. The alias is therefore not evidence of the reviewed Amendment A
strict-schema/rate-fence build. No pairing or Connector effect was attempted; hosted Gate B2 stays
open pending deployment of the reviewed commit and migration followed by a fresh disposable
readback.

### Vercel deployment preflight — 2026-09-04

Vercel CLI `50.22.1` is authenticated as `ukalexwonguk-9663` in the
`ukalexwonguk-gmailcoms-projects` team. The team has no `cloud-receiver-delta` project, the
documented alias is not inspectable under that account, and the clean `saas-boilerplate/` checkout
has no `.vercel` project or repository linkage. This was a read-only preflight: no project, link,
environment value, deployment, or alias was created or changed. A reviewed Vercel ownership path
or an equivalent disposable host is still required before Gate B2 can be rerun.

### Owner-session hosted topology readback — 2026-09-04

The owner-authenticated Codex Browser session confirms the previously observed aliases are owned by
Eyad's Vercel team: project `cloud-receiver` (`prj_K44Eugi56I3Gr8xXNIIapAslwAGR`) serves
`cloud-receiver-delta.vercel.app`, while the paired frontend project serves
`re-entry-weld.vercel.app`. The Receiver project is manually deployed (no Git repository is
connected), uses `backend` as its root and `npm run build` as its build command, and exposes the
following visible Preview variable names: `RECEIVER_PUBLIC_URL`, `FRONTEND_URL`,
`CLOUD_RECEIVER_RUNTIME_DATABASE_URL`, and `JWT_SECRET`. The current source-HMAC variable is not
visible in that Preview set.

The owner-authenticated Supabase session confirms project `re-entry`
(`vycutuvanimbndxykiih`) in `iyad.socials@gmail.com's Org`. Its dashboard reports `Unhealthy`, no
backups, and a migration ledger ending at `20260902050000_delivery_acknowledgement`; the reviewed
`20260904000000_pairing_claim_rate_limit` migration is absent. No production migration, secret
change, deployment, or alias mutation was made. The owner project is now identified, but Gate B2
still requires a healthy reviewed database target, the source-HMAC configuration, and an exact
reviewed deployment before readback.

### Hosted Preview deployment and Gate B2 readback — 2026-09-04

The owner session later showed Supabase `re-entry` (`vycutuvanimbndxykiih`) Healthy. Two creation
attempts for `reentry-closure-preview` failed during a provider Partial System Outage, so the
existing project remained the target. The exact reviewed `cr2_pairing_claim_rate_buckets` table
and expiry index were applied manually in one SQL transaction and are visible in Table Editor; RLS
was left disabled to preserve the reviewed `cr2_*` posture. The migration ledger was not changed,
and the reviewed migration name remains absent there.

Vercel project `cloud-receiver` is now connected to `4xeoz/saas-boilerplate` and has an isolated
Ready Preview deployment `EpcQLku5oinjQ2matmtVwvgZsYeA` from `Re-Entry` commit
`0195a9846024c4f65c62d3922069970ad1b96b92`. Its unique hostname is
`cloud-receiver-fknoq31l9-eyads-projects-b54e035a.vercel.app`, with a branch alias at
`cloud-receiver-git-re-entry-eyads-projects-b54e035a.vercel.app`. The original
`cloud-receiver-delta.vercel.app` production alias and prior deployments were not changed. The
Preview-only `CLOUD_RECEIVER_PAIRING_SOURCE_HMAC_SECRET` variable was added without recording its
value; no Production variable or alias was touched.

Against the unique Preview hostname, `/healthz` and `/readyz` returned `200`, the frontend-origin
claim preflight returned `204`, and an empty claim body returned `400 http_body_invalid`. The
bounded same-source probe crossed the 30-request window across 31 distinct Vercel execution IDs;
Supabase showed one durable bucket row at `request_count=31`, and the over-budget response was
`429 pairing_rate_limited` with `Retry-After: 558`. No valid pairing or Connector credential was
used. The minimum disposable hosted Preview readback is verified when combined with the local
atomicity, concurrency, restart, header, and outage suites. Production promotion and managed
migration closure remain separate and open.

### Clean reset-window confirmation — 2026-09-04

After the fixed UTC source window advanced at `02:40 UTC`, a fresh sentinel claim request against the
same Preview returned `404 pairing_not_found`; requests two through thirty returned the same bounded
`404`, and request thirty-one returned `429 pairing_rate_limited` with `Retry-After: 494` seconds
until `02:50 UTC`. Separate Vercel execution IDs were observed for sampled requests including 2, 15,
30, and 31, all with cache misses. Supabase readback showed the durable bucket at
`request_count=31`. The identifiers were syntactically valid but nonexistent, so no real pairing,
token, Connector, or credential was used. This confirms the fixed-window reset and hosted
cross-execution source fence; Production promotion and managed migration remain open.

## Current closure boundary

The baseline pairing gate is locally verified and Pairing Feature 1 is closed. Amendment A is
locally verified and the minimum disposable hosted Preview Gate B2 readback is verified; production
promotion remains open. ADR-0013 and proposed
[ADR-0034](../Decisions/ADR-0034-propose-organization-grant-control-amendment.md) are separate from
Pairing and do not block TASK-014/CLOUD-014 closure; they must be handled before later
Grant-revocation work. Consent and later v2 work remain paused. No Grant route was implemented or
given a final status by this increment.

## Residual risks and reopen conditions

- `PAIR-004` requires a disposable persistence fixture and must remain an internal test arrangement,
  not a new public identity field.
- Reopen if the implementation proposes delegated Grant control, raw-token persistence, target reuse,
  retired-database migration, a weaker claim fallback, or any scope expansion beyond the accepted
  pairing amendment.
