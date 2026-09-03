# CLOUD-015 — Cloud Receiver v2 Consent, Targeting, and Internal Revocation

**Task:** [TASK-015](../Tasks/TASK-015-build-cloud-receiver-v2-consent-targeting.md)
**Decision:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md)
**Status:** `locally_verified` — Feature 2 closed; Event work paused
**Repository:** `saas-boilerplate/`

## Objective

Implement and verify Cloud Receiver v2 Feature 2 in the replacement `saas-boilerplate/` clone:
Host-key and signed-Manifest consent sessions, account approval/decline, one-subject/one-target
binding, derived Grant status, the configured-authority internal revocation fence, and the
success-only consent-popup completion handoff.

## Verification record

The following evidence was executed on 2026-09-02 from `saas-boilerplate/`. Secrets and complete
connection strings are intentionally redacted; they were supplied only through the shell.

```sh
npm run db:generate -w backend
npm run type-check
npm run build -w backend
npx tsc -p backend/tsconfig.test.json --noEmit
npx prisma validate --schema backend/prisma/schema.prisma
DATABASE_URL="<fresh disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test npm run db:migrate -w backend
DATABASE_URL="<fresh disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test npm test -w backend -- --runInBand src/modules/consent/test/consent.test.ts --testNamePattern='CONSENT-004'
DATABASE_URL="<fresh disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test npm test -w backend -- --runInBand src/modules/consent/test/consent.test.ts
DATABASE_URL="<fresh disposable PostgreSQL URL>" CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" DIRECT_URL="" NODE_ENV=test npm test -w backend -- --runInBand
npx next build --webpack
git diff --check
```

Results:

- `CONSENT-001`–`CONSENT-004`, `TARGET-001`–`TARGET-002`, and `REVOKE-001`: `1` suite,
  `7/7` tests passed. The focused `CONSENT-004` run passed with the other six tests skipped.
- Final backend aggregate: `5` suites, `17/17` tests passed, including the Pairing regression.
- Prisma generation/validation/migration, backend type-check/build, test type-check, frontend
  webpack build, and whitespace validation passed.
- The default Turbopack `next build` was also attempted but could not start its worker because
  the local environment returned `Operation not permitted`; the webpack build passed and no
  frontend source was changed for Feature 2.

## Runtime and database

- Runtime: Node `v26.8.1` (executed). Node 24, the repository closure baseline, was not installed
  on this machine and is therefore not claimed as validated.
- Database: PostgreSQL `14.18`, disposable local Homebrew cluster on `127.0.0.1:55435`, fresh
  database `cloud_receiver_2_popup_handoff`.
- Migrations applied: `20260902000000_init_cloud_receiver_2_auth`,
  `20260902010000_pairing`, and `20260902020000_consent_targeting`.

## Commit and scope

- Tested implementation commits:
  `d77c34a356e0380b687b7aefbd2ccb3ed8aa946f` (`feat: build cloud receiver 2 consent targeting`)
  and `f67e741dd0392dd04f14d7d02764b7c0a7179dc5` (`fix: complete consent popup handoff`).
- Clone branch: `main`, now matches `origin/main` at
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`; the exact tested commit was pushed to
  `origin/main` and the remote SHA was read back directly. It is not deployed.
- The prior Local Connector tokenless-replay compatibility commit remains
  `7fab264d237b3e172acb091888643c831cadcb85`; it was not modified by Feature 2.

## Evidence

The green tests and direct PostgreSQL assertions prove that:

- Host key registration and signed Manifest validation gate consent-session creation.
- Account approval/decline and pending/expired status are durable; approval creates one private
  Grant and decline creates none.
- A Host subject is durably bound to one target. Repeated approval uses that target; a different
  Connector returns `409 host_subject_binding_conflict` and creates no Grant.
- Host-facing responses omit account ids, Connector ids/tokens, delivery-target ids, and private
  Grant/binding fields.
- The raw consent token is emitted only as the consent URL credential; Connector credentials,
  organization API keys, and the internal control token are never persisted or logged. Stored
  consent, pairing, and Connector values are digests, and captured logs contain no raw token.
- Internal configured-authority revocation sets durable `revoked_at`; replay is idempotent and the
  admission fence rejects later work as `grant_revoked`.
- The authenticated consent popup posts exactly `{ type, consent_session_id, status }` to
  `window.location.origin` after a successful approve or decline response. Failed decisions post
  nothing; the message contains no consent token, Connector id, binding, API key, or other private
  value.

## SDK browser integration verification

The unchanged SDK contract and local browser evidence are recorded in
[`SDK-003`](SDK-003-cloud-receiver-v2-contract-tests.md) and
[`SDK v2 Verification Report`](SDK-V2-Verification-Report.md). They were run against the exact
tested Receiver commit `f67e741dd0392dd04f14d7d02764b7c0a7179dc5` before its remote push.

- `SDK-V2-001`–`SDK-V2-004`: `4/4` passed against the real Receiver app and disposable PostgreSQL.
- Normal SDK syntax and unit/adapter suite: `18/18` passed.
- Backend regression: `5/5` suites and `17/17` tests passed, including `CONSENT-004`.
- Real Chrome headless/Playwright approve and decline flows both opened the actual consent popup,
  received HTTP `200`, delivered the exact completion message from the matching popup source and
  origin, and completed through the unchanged SDK. Approve produced `approved`/`active`; decline
  produced `declined` with no binding.
- SDK verification runtime/database: Node `v26.8.1`; PostgreSQL `14.18` on `127.0.0.1:55436`,
  database `sdk_v2_contract_final`. The local browser run used same-origin configuration at
  `http://127.0.0.1:4010`; no split-origin or deployed integration claim is made.

The remote delivery evidence is:

```sh
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Both resolve to `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`.

## Boundary and closure

Public Grant inspection/revocation routes remain absent and return `http_route_not_found`; ADR-0013
and proposed ADR-0034 remain the separate decision gate. The Event route and Event implementation
are absent. No Event work began under this increment.

Feature 2 is locally verified and closed. Event work remains paused until a separate task is
authorized after this green Feature 2 boundary.
