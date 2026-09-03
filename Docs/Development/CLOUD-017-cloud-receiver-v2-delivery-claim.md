# CLOUD-017 — Cloud Receiver v2 Delivery Claim and Lease

**Status:** `locally_verified`
**Date:** 2026-09-02
**Owner:** Cloud Receiver v2 delivery-claim implementation team
**Scope:** `saas-boilerplate/` only; no Core or Local Connector production change
**Task:** [TASK-019](../Tasks/TASK-019-build-cloud-receiver-v2-delivery-claim.md)
**Decision:** [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md)
**Contract:** [Feature 04 — Delivery Claim and Lease](../Cloud-Receiver-Handoff/v2-build/04-delivery-claim-and-lease.md)

## Outcome

Feature 4 is implemented and locally verified against the accepted v2 contract. The real
Express route `POST /v0.1/delivery-claims` now supports one target-scoped durable lease at a
time, tokenless replay of a live lease, expiry/reclaim, bounded exhaustion, wrong-target
isolation, cross-Connector scope rejection, process restart recovery, and secret redaction.

No Acknowledgement route, public Grant route, Connector protocol change, deployment, or public
runtime claim is included.

## Local Connector compatibility follow-up

The opt-in compatibility suite uses the actual Local Connector client against the real v2 Express
claim handler and disposable PostgreSQL state. `CONNECTOR-V2-CLAIM-001`–`005` passed, covering
exact JSON token placement, `200` leases, identical empty `204` no-work/exhaustion handling,
duplicate replay, expiry/reclaim, fresh-token wrong targets, same-token cross-Connector scope,
initial claim contention, child-process restart, durable attempt state, and log/state redaction.

One wording mismatch remains open and is intentionally not guessed through: the broader request to
keep “raw tokens” out of all persisted files conflicts with the accepted Pairing behavior, which
stores the Connector credential in the Local Connector's restrictive credential file so it can
authenticate later. Feature 4's accepted redaction boundary is raw claim tokens and Receiver
durable state/logs. No Pairing or credential-custody change was made; broadening the rule to the
Connector credential requires a separate custody decision (for example, an OS keychain).

## Contract implemented

- The request body contains exactly `connector_token` and `claim_token`; the Connector token
  remains in the JSON body and is not moved to an Authorization header.
- Valid work returns the canonical `200` `{ duplicate, lease }` envelope.
- No work and an exhausted delivery both return the exact empty `204` response with no
  `Content-Type`.
- A live replay by the owning Connector and the same claim token returns the same lease with
  `duplicate: true`. A fresh claim token is required after expiry.
- A fresh-token claim from another delivery target returns the same empty `204`. Reusing an
  existing claim token from another Connector returns `403 delivery_lease_scope_invalid`.
- The accepted profile is maximum three attempts, a 60-second lease, five-second polling, and
  a five-second request timeout. The Receiver implements the three-attempt/60-second lease
  boundary; existing Connector polling and request-timeout behavior remains unchanged.
- Lease expiry is bounded by the lease duration, Grant expiry, and Connector identity expiry.

## Implementation and integration answers

1. Claims use a PostgreSQL transaction with `pg_advisory_xact_lock(hashtextextended(delivery_target_id, 0))`, then select the oldest eligible row with `FOR UPDATE OF d SKIP LOCKED`. The update also uses compare-and-set fields, and unique digest columns protect attempt identity.
2. Eligible deliveries are ordered by `created_at ASC, delivery_id ASC`.
3. `retry_exhausted`, `current_attempt`, lease timestamps, and digest-only attempt rows are
   inspected directly through the disposable test database. No production durable-state
   inspection endpoint was added.
4. Connector identity is resolved by the stored Connector-token digest and checked for
   revocation/expiry. Invalid identity returns `403 connector_identity_invalid`; target
   mismatch with a fresh claim is indistinguishable from no work; a previously used token
   presented by another Connector returns `403 delivery_lease_scope_invalid`.
5. Delivery and attempt state is durable in PostgreSQL. The supplementary delivery test starts
   the built Receiver as a child process, replays the same live lease across process restarts,
   and verifies that only one attempt exists.
6. Contention is exercised through concurrent real HTTP requests. Expiry is injected in tests by
   setting the durable lease expiry into the past with direct SQL; no production clock or public
   test-control route was added.

## Red phase

The focused suite was first run against the existing placeholder route. The valid red run was:

```text
1 suite failed
5 tests failed
```

Each `CLAIM-001`–`CLAIM-005` case received the placeholder `204` where the work cases required
`200`. An earlier attempt against the handoff's unavailable PostgreSQL port `55432` failed with
an environment `EPERM` connection error and is not counted as the red result.

## Green phase and regressions

- Focused `CLAIM-001`–`CLAIM-005`: `1` suite passed, `5` tests passed.
- Supplementary process/restart delivery matrix: `1` suite passed, `5` tests passed.
- Complete backend aggregate: `8` suites passed, `31` tests passed.
- Prisma schema validation: passed.
- Backend type-check: passed.
- Backend build: passed.
- Complete Local Connector verification with the opt-in v2 matrix: syntax `26` modules passed;
  tests `39/39` passed.
- Unchanged Re-entry Core verification: syntax `41` modules passed; Node tests `80/80` passed;
  conformance passed; package verification passed with `runtime_dependencies: 0`.

## Current re-verification

On 2026-09-02, the committed implementation was rerun from a fresh disposable PostgreSQL
cluster, with no source changes, using the following commands:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
DIRECT_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
npm run db:migrate -w backend

DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/delivery/test/delivery.test.ts \
  src/modules/deliveries/test/delivery-claim.test.ts

DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/connectors/test/pairing.test.ts \
  src/modules/connectors/test/pairing-restart.test.ts \
  src/modules/authentication/test/authentication.test.ts \
  src/modules/consent/test/consent.test.ts \
  src/modules/events/test/event.test.ts \
  src/modules/system-health/test/system-health.test.ts

DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand
```

All five migrations applied successfully. The focused Claim suites passed `2/2` suites and
`10/10` tests. The Pairing, Consent, Event, authentication, and health regression command passed
`6/6` suites and `21/21` tests. The complete backend aggregate passed `8/8` suites and `31/31`
tests. The focused tests exercised leases, same-token replay, process restart, expiry and bounded
three-attempt exhaustion, fresh-token wrong-target isolation, cross-Connector scope rejection,
concurrency, durable state, and raw-secret redaction.

The same run also passed `npm run db:generate -w backend`, Prisma schema validation, backend
type-check, backend build, and `git diff --check`. The disposable PostgreSQL instance was stopped
after verification.

The local Receiver worktree remained clean. Local `HEAD` is
`b9f40617827467057b6c34dbe9e82a9893e5bee4`; Feature 4 implementation is in
`d840439efe628a24c89fec6b74f37f04a701cb58`, with the later `b9f4061` commit documentation-only.
`git ls-remote origin refs/heads/main` returned
`b851c320fae0505e3cf098f979d149e04ab44310`; Feature 4 remains unpushed.

The Feature 4 tests are:

- [`delivery-claim.test.ts`](../../saas-boilerplate/backend/src/modules/deliveries/test/delivery-claim.test.ts)
- [`delivery.test.ts`](../../saas-boilerplate/backend/src/modules/delivery/test/delivery.test.ts)
- [`cloud-receiver-v2-claim.contract.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs)
- [`cloud-receiver-v2-claim.test.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-claim.test.mjs)

## Runtime and database evidence

- Runtime: Node `v26.8.1`, npm `11.19.0`, Prisma `7.10.0`.
- Reproducibility baseline remains Node 24; Node 26.8.1 is the runtime actually executed here.
- Current re-verification database: local PostgreSQL `14.18` on `127.0.0.1:55433`, database
  `cloud_receiver_feature4_rerun`; the cluster was disposable and stopped after the run.
- Database: local PostgreSQL `14.18` on `127.0.0.1:5432`, database
  `cloud_receiver_feature4_green`.
- Applied migrations: init/auth, pairing, consent/targeting, signed event ingress, and
  `20260902040000_delivery_claim_lease`.
- Final cleanup counts: `user_accounts=0`, `developer_accounts=0`, `deliveries=0`,
  `attempts=0`.

## Git closure

- Implementation commit: `d840439efe628a24c89fec6b74f37f04a701cb58`
  (`feat: add delivery claim leases`).
- Documentation commit: `b9f4061` (`docs: document delivery claim lease`).
- Both commits are local on `main`; they were not pushed or deployed.
- No parent implementation files were changed by this closure. The parent repository contains
  unrelated existing dirty work; this evidence record is left in that working tree alongside the
  existing handoff/task documents. The Feature 4 implementation is confined to the nested
  `saas-boilerplate/` repository.

## Reopen conditions

Reopen this increment if the contract requires a different exhaustion status, retry/lease
profile, claim-token replay rule, Connector request shape, or any Acknowledgement behavior.
