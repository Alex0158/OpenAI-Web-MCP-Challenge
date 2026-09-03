# Cloud Receiver v2 Features 4–6 Closure Report

**Date:** 2026-09-02  
**Owner:** Cloud Receiver team  
**Scope:** Cloud Receiver v2 Features 4–6 plus the bounded release-gate increment in `saas-boilerplate/`

**Cross-team integration record:** [TASK-022](../../Tasks/TASK-022-prepare-sdk-v2-full-chain-integration.md)
and [SDK-005](../../Development/SDK-005-cloud-receiver-v2-full-chain-contract.md)

The Cloud Receiver component is locally verified through Features 4–6 and the deployment-only
Vercel handler increment is committed locally at `29cdfa4ab4af329d39af361fa3a0a1dc33eab919`.
The pinned local combined flow is now green, but the complete cross-team release is not yet
accepted: the exact SHA is not pushed or deployed, separately spawned browser/Connector evidence
is unavailable, live Supabase hardening was deliberately not applied, and npm publication remains
blocked in the SDK release gate.

## What was built

- **Feature 4 — Delivery Claim and Lease:** target-scoped claims, 60-second leases, replay,
  expiry, wrong-target isolation, three-attempt exhaustion, concurrency protection, restart
  recovery, and transactional PostgreSQL state.
- **Feature 5 — Delivery Acknowledgement:**
  `POST /v0.1/delivery-acknowledgements`, exact four-field request validation, injected
  Host-effect authority verification, atomic acknowledgement, replay fencing, effect-identity
  uniqueness, lease/Grant/revocation time checks, and digest-only secret persistence.
- **Feature 6 — Transport and Operations:** bounded JSON transport, exact methods and content
  types, stable redacted errors, no-store response headers, PostgreSQL readiness, `GET /healthz`,
  and `GET /readyz`.
- **Release-gate increment:** the authenticated user dashboard now exposes a minimum `Pair this
  Mac` action. It calls the existing `POST /v0.1/account/pairing-sessions` route with the browser
  session and displays the short-lived code only after a successful response. No new protocol or
  compatibility route was added.
- **Database hardening preparation:** a local-only Supabase SQL migration enables RLS on existing
  public tables, removes client-role privileges, preserves backend `service_role` access, and
  hardens default privileges. Its target, local proof, ordering, and rollback boundary are recorded
  in `saas-boilerplate/supabase/README.md`.
- **Deployment-only Vercel handler:** `saas-boilerplate/backend/api/index.ts` exports the existing
  `createApp()` Express application as a Vercel-compatible Node.js function and does not call
  `listen()`. `saas-boilerplate/backend/README.md` records the project root
  (`saas-boilerplate/backend`), required runtime variables, the deprecated root `vercel.json`
  boundary, and the separate Prisma migration step.
- **Deployment contract:** the Receiver README now records the exact separate local and staging
  frontend/backend environment contract, including the old Supabase variable names and the
  frontend build-time boundary.

No Core, Local Connector, SDK, retired v1, fallback route, deployed environment, or public Grant
inspection/revocation route was changed. Public Grant control remains paused pending its accepted
ADR gate.

## Tests passed and failed

The following commands were run against real Express handlers and disposable PostgreSQL.

Red-baseline source identities:

- The last committed source before Feature 5/6 implementation was
  `b9f40617827467057b6c34dbe9e82a9893e5bee4` (`docs: document delivery claim lease`). Its backend
  tree is unchanged from the Feature 4 implementation commit
  `d840439efe628a24c89fec6b74f37f04a701cb58`.
- The ACK red run used that pre-Feature-5 committed Receiver source.
- The HTTP red run used the pre-Feature-6 working tree based on
  `b9f40617827467057b6c34dbe9e82a9893e5bee4` after the uncommitted Feature 5 changes and before
  the combined Feature 5/6 commit. No separate committed Feature 5 midpoint existed; this is
  recorded as a dirty intermediate baseline, not as a second commit claim.

### Receiver acknowledgement

Red baseline:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/acknowledgements/test/acknowledgement.test.ts
```

Result: `1` suite failed. `ACK-001` retained its existing lease assertion; `ACK-002`–`ACK-005`
received `404` because the route did not exist.

Green:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/acknowledgements/test/acknowledgement.test.ts
```

Result: `ACK-001`–`ACK-005`, `5/5` tests and `1/1` suite passed.

### Receiver transport and operations

Red baseline, run against the pre-Feature-6 shell:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/system-health/test/http.test.ts
```

Result: all `HTTP-001`–`HTTP-005` cases failed because parser/error mapping, health routes, log
redaction, and response headers were not yet implemented.

Green used the same command and returned `HTTP-001`–`HTTP-005`, `5/5` tests and `1/1` suite
passed.

### Receiver aggregate and received counterpart commands

Receiver aggregate:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand
```

Result: `10/10` suites and `41/41` tests passed, including all Pairing, Consent/Targeting, Event,
Claim/Lease, Acknowledgement, and HTTP regressions.

The received SDK and Local Connector commands were run against the exact Receiver root and
disposable database as follows:

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs
```

Result: SDK Event `SDK-V2-EVENT-001`–`007`, `7/7` passed.

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/host-sdk/test/cloud-receiver-v2.contract.mjs
```

Result: SDK Host/Consent `SDK-V2-001`–`004`, `4/4` passed.

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/local-connector/test/cloud-receiver-v2-claim.test.mjs
```

Result: Local Connector Claim `CONNECTOR-V2-CLAIM-001`–`005`, `5/5` passed.

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/local-connector/test/cloud-receiver-v2-ack.test.mjs
```

Result reported by the Local Connector team: `CONNECTOR-V2-ACK-001`–`005`, `5/5`, passed against
the final Cloud commit `29cdfa4ab4af329d39af361fa3a0a1dc33eab919` after the adopted ACK-003 mapping.

### Receiver red-to-green tests

| Suite | Red result | Green result |
|---|---|---|
| `ACK-001`–`ACK-005` | One suite failed: the pre-Feature-5 Receiver had no acknowledgement route; `ACK-001` retained its existing lease assertion and `ACK-002`–`ACK-005` received `404` | `5/5` passed |
| `HTTP-001`–`HTTP-005` | All `5/5` failed against the pre-Feature-6 shell: parser errors, encoded input, health routes, log redaction, and response headers were missing or incorrect | `5/5` passed |

### Receiver regressions

- Claim and lease suites: `CLAIM-001`–`CLAIM-005` passed; the two Feature 4 suites passed `10/10`.
- Feature 4–6 implementation aggregate before the deployment-only handler increment: `10/10`
  suites and `41/41` tests passed; the final committed deployment increment passed `11/11` suites
  and `42/42` tests.
- The aggregate includes Pairing, Consent/Targeting, Event, Claim/Lease, Acknowledgement,
  legacy health regression, and HTTP/operations coverage.
- Prisma generation, backend type-check, backend build, sensitive-pattern scans, and the current
  repository-wide validator passed. The validator command was
  `python3 scripts/validate_repository.py --root .`; no code or deployment state changed for this
  documentation correction.

### Release-gate and deployment-only increment

The exact committed Receiver state passed these focused checks:

```sh
npm run type-check -w backend
npm run build -w backend
npm run type-check -w frontend
npm run lint -w frontend
npx next build --webpack              # from saas-boilerplate/frontend
```

Results: all five commands passed. The default `npm run build -w frontend` was also attempted;
Next/Turbopack failed before compilation with the host error `Operation not permitted` while
creating its CSS helper process and binding a temporary port. The documented webpack build passed
compilation, TypeScript, static generation, and route output.

The first version of the focused handler test used a static import and caused the existing backend
`rootDir: src` type-check to reject `backend/api/index.ts`. The test was narrowed to load the exact
entrypoint at runtime; the committed source type-check then passed. This was an intermediate check
failure, not a failure of the committed deployment increment.

Focused deployment-handler smoke test on the final committed state:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
DIRECT_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
FRONTEND_URL=http://localhost:3000 RECEIVER_PUBLIC_URL=http://localhost:4000 NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/system-health/test/vercel-handler.test.ts
```

Result: `1/1` suite and `1/1` test passed; the handler served `/healthz` with `200` and did not
start a listener.

Final backend aggregate on the final committed state:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
DIRECT_URL=postgresql://mac@127.0.0.1:5432/cloud_receiver_release_20260902 \
FRONTEND_URL=http://localhost:3000 RECEIVER_PUBLIC_URL=http://localhost:4000 NODE_ENV=test \
npm test -w backend -- --runInBand
```

Result: `11/11` suites and `42/42` tests passed. A synthetic test-only JWT secret was supplied in
the process environment and is intentionally omitted from this report.

The final Vercel entrypoint type-check was:

```sh
npx tsc --noEmit --target ES2020 --module CommonJS --moduleResolution Node \
  --esModuleInterop --strict --skipLibCheck --types node,express \
  api/index.ts src/types/express/index.d.ts
```

Result: passed. The normal `npm run type-check -w backend` and `npm run build -w backend` also
passed on the same commit.

The live local smoke checks used the built Express backend on `127.0.0.1:4016` with the frontend
origin configured as `http://localhost:3016`:

```sh
curl -sS http://127.0.0.1:4016/healthz
curl -sS http://127.0.0.1:4016/readyz
```

Results: `{"status":"ok"}` and `{"status":"ready"}`. A synthetic email/password account
registration returned `201`; its authenticated pairing-session request returned `201` with the
canonical raw v0.1 envelope. The displayed one-time code was redacted from evidence. PostgreSQL
reported one pairing row with a 64-character digest and zero raw pairing-code columns. No request
log contained the code or session value.

The local Supabase hardening proof ran the prepared migration against a disposable empty fixture
database containing the active project's 22 public table names and the `anon`, `authenticated`,
`service_role`, and migration roles. Results: migration committed; `22/22` existing tables had
RLS enabled; explicit `anon`/`authenticated` table grants were `0`; their schema usage was false;
`service_role` retained access to `22` tables and `BYPASSRLS`; an anonymous select failed with
`permission denied for schema public`; and a post-migration table inherited no client privilege.
The fixture intentionally has no client policies because these are backend-only tables.

The migration command was:

```sh
psql -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5432 -U mac \
  -d cloud_receiver_rls_fixture_20260902 \
  -f supabase/migrations/20260902190000_harden_backend_internal_tables.sql
```

The interactive browser check is not claimed: both the in-app browser and connected Chrome could
not reach the local listener from their isolated browser context, and the existing unrelated
frontend process on port `3001` was not killed or reconfigured. Source-level red/green checks,
frontend type-check/lint, and the production webpack build passed.

### Received counterpart tests

- SDK Event contract: `7/7` passed.
- SDK Host/Consent contract: `4/4` passed.
- Local Connector Claim contract: `5/5` passed.
- Local Connector Acknowledgement contract: `5/5` passed against Cloud `29cdfa4…` after the
  accepted ACK-003 mapping.
- SDK full-chain contract `SDK-V2-E2E-001`: `1/1` passed against Cloud `29cdfa4…` and Local
  Connector `4b821515…`; an independent project-manager rerun also passed `1/1`.

The local combined flow—`Host SDK → Cloud Receiver → Local Connector → Host effect →
acknowledgement`—passed with durable acknowledgement and exact replay. This is local contract
evidence; it is not deployed staging evidence and does not include a separately spawned Connector
process or external browser.

The exact local full-chain command was:

```sh
CLOUD_RECEIVER_V2_FULL_CHAIN=1 CLOUD_RECEIVER_V2_ACK_MAPPING_APPROVED=1 \
CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
CLOUD_RECEIVER_V2_CLOUD_SHA=29cdfa4ab4af329d39af361fa3a0a1dc33eab919 \
CLOUD_RECEIVER_V2_LOCAL_CONNECTOR_SHA=4b8215156d814551f8da06dad16319deaff549d7 \
DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_e2e_20260902 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
node --test /private/tmp/sdk-v2-release.DkDWZl/runtime/host-sdk/test/cloud-receiver-v2.full-chain.contract.mjs
```

Result: `SDK-V2-E2E-001`, `1/1` passed. An independent project-manager rerun also passed `1/1`
against `sdk_receiver_pm_full_chain_20260902_1`.

## Exact commit SHA

- Final tested Cloud Receiver commit:
  `29cdfa4ab4af329d39af361fa3a0a1dc33eab919`
- Feature 4–6 implementation and release-gate parent commit:
  `6f4b35fc6cfb0d9a6a134a69264e5ebb4277a50a`
- Receiver repository: clean local `main` worktree after the deployment-only Vercel handler
  commit.
- The local tracking ref `origin/main` remains
  `b851c320fae0505e3cf098f979d149e04ab44310`; the final commit is local-only and five commits
  ahead.
- A fresh `git ls-remote` readback was attempted but could not resolve `github.com` in the current
  environment, so no pushed or remote-match claim is made.
- Verification commands:

  ```sh
  git status --short
  git rev-parse HEAD
  git ls-remote origin refs/heads/main
  git rev-list --left-right --count origin/main...HEAD
  ```

  These returned an empty Receiver status, local `HEAD` `29cdfa4…`, and `0 5` divergence against
  the last known local `origin/main` tracking ref. The report deliberately does not claim a push.

## Runtime and database evidence

- Node: `v26.8.1`
- npm: `11.19.0`
- Prisma: `7.10.0`
- PostgreSQL: `14.18` (Homebrew, local `127.0.0.1:5432`)
- Final exact-SHA database: isolated `cloud_receiver_release_20260902`; all six Prisma migrations
  were applied, including Delivery Claim and Acknowledgement.
- A fresh cluster initialization under the OS temp directory was blocked by local shared-memory
  permissions, so the final rerun used a separately named database on the existing local PostgreSQL
  service. This is real PostgreSQL persistence, but not a fresh disposable cluster claim.
- The live smoke runtime used the built backend at `127.0.0.1:4016`; it returned healthy and ready,
  then was stopped cleanly. The pre-existing frontend process on `127.0.0.1:3001` was left alone.
- Supabase read-only evidence: project `re-entry` (`vycutuvanimbndxykiih`) is `ACTIVE_HEALTHY` on
  PostgreSQL `17.6.1.166`; its security advisor reported all `22` public tables with RLS disabled.
  The prepared migration was not applied live. No deployment, production database, or rollback
  execution is claimed.
- Receiver logs, responses, fixtures, and database assertions contained no raw Connector, claim,
  lease, effect, consent, session, API-key, cookie, SQL, or private-binding values. The local
  hardening fixture used empty tables and synthetic roles only.

## Required changes from the other teams

| Owner | Required change / exact contract | Dependency | Next gate |
|---|---|---|---|
| Local Connector team | Preserve the tested Claim/Acknowledgement implementation and provide separately spawned process evidence if required; current Claim and ACK matrices pass against Receiver `29cdfa4…` | Accepted ACK-003 mapping: far-future normalization is `host_effect_invalid`; normalized out-of-window effects are `host_effect_time_invalid` | Deployed Claim/ACK rerun and exact Connector SHA recorded |
| SDK team | Preserve the tested Host-side integration and provide separately spawned browser/process evidence if required; current SDK matrices and local full-chain pass against Receiver `29cdfa4…` | Local Connector exact SHA and independent Host-effect authority | Deployed full-chain smoke and release readback |
| Host-effect authority owner | Supply the accepted production `verifyEffect` boundary and configuration; current Receiver tests use only an injected deterministic fixture | ADR-0009/ADR-0038 authority contract | Independent effect proof is configured in the combined test |
| Supabase/release owner | Review the prepared backend-only RLS/privilege migration, capture preflight ACLs, apply it to the approved target after Prisma schema ordering, and rerun security advisors | Active `re-entry` project currently exposes 22 public tables with RLS disabled; no live migration was authorized here | Live RLS/privilege proof, policy review, migration readback, and rollback evidence |
| Release/platform owner | Configure the Vercel project root as `saas-boilerplate/backend`, set the documented runtime variables, and supply the approved staging target, deployment/database credentials through the secure environment, TLS termination, deployment identifier, and rollback target | `backend/api/index.ts` is the listener-free function entrypoint; Prisma migrations remain a separate release step; no deployment authority is currently available | Deploy pinned commit `29cdfa4…`, run the same PostgreSQL matrix, and record deployment/rollback evidence |
| Project manager | Confirm exact counterpart commit boundaries and keep public Grant inspection/revocation gated until ADR-0013 is accepted | TASK-022 / SDK-005 plus the governing Grant-control ADR gate | ACK-003 is now aligned; the exact-SHA combined-flow gate may run |

## Integration test document

The exact exchanged requests, response schemas, stable errors, replay behavior, timing values,
durable PostgreSQL assertions, secret boundaries, commands, counterpart results, and protocol
matrix are recorded in the canonical
[09-cloud-receiver-test-exchange.md](09-cloud-receiver-test-exchange.md). The final pinned local
full-chain command and result are recorded in the SDK-owned
[SDK-005](../../Development/SDK-005-cloud-receiver-v2-full-chain-contract.md).

The exchanged document owns `EVENT-001`–`EVENT-004`, `CLAIM-001`–`CLAIM-005`, `ACK-001`–`ACK-005`,
`HTTP-001`–`HTTP-005`, the received `SDK-V2-EVENT-001`–`007`, `SDK-V2-001`–`004`,
`CONNECTOR-V2-CLAIM-001`–`005`, and `CONNECTOR-V2-ACK-001`–`005` commands and results. SDK-005
owns `SDK-V2-E2E-001` and records its `1/1` local pass against Cloud `29cdfa4…` and Local
Connector `4b821515…`; no alternate full-chain record is created.

## Unresolved mismatch

The former ACK-003 mismatch is resolved by the adopted mapping: malformed or far-future
normalization returns `403 { "error": { "code": "host_effect_invalid" } }`; a structurally valid
effect outside the lease, Grant-expiry, or revocation window returns
`403 { "error": { "code": "host_effect_time_invalid" } }`. The Local Connector team reports
`5/5` acknowledgement cases against Cloud `29cdfa4…` under this mapping. No compatibility route,
fallback transport, or weakened assertion was added.

The remaining items are release blockers, not protocol substitutions:

- the local counterpart matrices and the combined `Host SDK → Cloud Receiver → Local Connector →
  Host effect → acknowledgement` contract now pass against Cloud
  `29cdfa4ab4af329d39af361fa3a0a1dc33eab919`, but separately spawned Connector-process and external
  browser evidence remains unavailable;
- the Cloud commit could not be pushed or remotely read back because GitHub DNS failed with
  `Could not resolve host: github.com`;
- the active Supabase project's 22-table RLS exposure has not been changed because live application
  was not authorized; and
- no authorized Vercel staging target, deployment readback, production effect authority, rollback
  run, or deployed health/full-chain result exists. SDK npm publication is also blocked by
  `npm whoami` returning `401 Unauthorized`.

Public Grant inspection/revocation remains intentionally paused until ADR-0013 is accepted. The
Cloud Receiver is therefore locally committed and tested, but neither the deployed system nor the
whole cross-team product is claimed complete.
