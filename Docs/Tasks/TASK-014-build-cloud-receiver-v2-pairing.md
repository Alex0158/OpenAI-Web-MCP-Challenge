# TASK-014: Build Cloud Receiver v2 Pairing

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-02

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Cloud Receiver v2 development team.
- Current increment: Pairing implementation and durable process-restart/replay verification are complete in the active v2 repository.
- Next gate: None for TASK-014 / Pairing Feature 1. Consent remains paused. ADR-0013 and proposed
  ADR-0034 are separate prerequisites for later Grant-revocation work and do not block this closure.
- Dependencies: [ADR-0033](../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md), [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md), [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md), and the [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## 1. Objective

Establish and verify the replacement Cloud Receiver v2 pairing boundary in the existing
`saas-boilerplate/` base. The first observable gate was a durable, HTTP-level red test contract for
account-issued Connector pairing and Connector-token identity; this increment now includes its
smallest green Prisma/HTTP implementation.

This task records the accepted pairing slice of the PM answers in
[ADR-0033](../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md). The PM answer file
remains the reviewed input, not an independent authority.

## 2. Accepted scope for this increment

- Keep the existing separate email/password `UserAccount` and `DeveloperAccount` authentication
  surfaces in the clone.
- Use Prisma with a fresh local PostgreSQL database; do not migrate or reuse the retired Receiver
  database.
- Test the account-owned pairing create route and unauthenticated-by-cookie claim route.
- Implement the account-owned pairing create route and unauthenticated-by-cookie claim route.
- Test one-time raw Connector-token delivery, tokenless duplicate replay, digest-only persistence,
  one Connector/one immutable target, and invalid Connector-token rejection.
- Test tokenless replay and single-Connector durability after a Cloud Receiver process restart.
- Keep `reentry-core/` and ADR-0007/ADR-0010 as the protocol authority where the later delivery
  surface begins.

## 4. Non-goals

- No Consent or targeting, Host-key registration, Organization API-key control plane, signed Event
  ingress, delivery claim implementation, acknowledgement, transport, deployment, or production
  effect authority.
- No changes to `runtime/cloud-receiver/`, frozen `mvp/`, immutable References, `reentry-core/`, or
  the Local Connector in this pairing increment.

## 4. Authority review and constraints

- The PM answers are accepted only for the scoped pairing decisions listed in ADR-0033.
- The proposed Organization API-key authority to inspect or revoke Grants is outside this pairing
  task. It conflicts with ADR-0013, which requires Grant control to be authenticated as the same
  Grant subject. ADR-0013 and proposed ADR-0034 do not block Pairing Feature 1; they must be
  resolved before later Grant-revocation work. TASK-014 makes no Grant-route decision.
- Tokenless duplicate replay is accepted as the pairing response contract. The separately owned
  Local Connector compatibility change is recorded by its clean commit SHA in CLOUD-014; this task
  does not edit that Connector commit.
- `PAIR-004` may use a disposable-database fixture to create an inconsistent stored identity. It
  must not add an identity field to the public claim body.

## 5. Verification and closure

The current implementation increment is complete only when:

1. `saas-boilerplate/backend/src/modules/connectors/test/pairing.test.ts` contains all five named
   cases;
2. the tests compile and execute against the real app handler and disposable PostgreSQL setup;
3. all five cases pass, including the tokenless duplicate response and digest-only persistence;
4. the restart evidence proves that replay remains tokenless, no second Connector is created,
   stored digests and the immutable target survive restart, and the raw Connector token is absent
   from the database and captured server logs; and
5. the test output, Cloud Receiver commit, Connector compatibility SHA, and exact scope are recorded in
   [CLOUD-014](../Development/CLOUD-014-cloud-receiver-v2-pairing.md).

The task is now closed at the pairing boundary. `PAIR-001`–`PAIR-005` and the restart/replay
verification pass against real HTTP and disposable PostgreSQL. Consent and every later v2 feature
remain paused; no Consent code or route was started.

### Closure evidence — 2026-09-02

- **Commands:** From `saas-boilerplate/`, `npm run db:generate -w backend`,
  `npm run db:migrate -w backend`, `npm run type-check -w backend`, `npm run build -w backend`,
  `npx tsc -p backend/tsconfig.test.json --noEmit`, the targeted
  `npm test -w backend -- --runInBand src/modules/connectors/test/pairing.test.ts src/modules/connectors/test/pairing-restart.test.ts`,
  and the aggregate `npm test -w backend -- --runInBand`. Test-only database URL and JWT values
  were injected in the shell and are intentionally not persisted here.
- **Commits:** Final tested Cloud Receiver tip
  `02ecb9df0452abc2c7d2bc3a16e495e03d04c139`, including pairing commit
  `44f0ff66898ca6eb925dd062d1bfd1f18b9ead96`; Local Connector compatibility commit
  `7fab264d237b3e172acb091888643c831cadcb85`.
- **Runtime/database:** Node `v26.8.1`; disposable PostgreSQL 16 Alpine database
  `cloud_receiver_2_pairing_restart` at `127.0.0.1:55434`, with both Prisma migrations applied.
- **Evidence:** targeted pairing/restart run passed `2` suites and `6/6` tests; aggregate backend run
  passed `4` suites and `10/10` tests. After a real server stop/start, replay omitted the raw
  `connector_token`, the pairing retained one Connector and one immutable target, both stored
  digests and consumption survived, and neither the database row contents nor captured server logs
  contained the raw token.

## 6. Reopen conditions

Reopen or stop if the green design requires a different pairing wire shape, delegated Grant
authority, a second public identity field, reuse of the retired runtime/database, or a Local
Connector change that is not separately owned and reviewed.
