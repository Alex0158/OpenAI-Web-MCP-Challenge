# Cloud Receiver v2 Build Plan

**Purpose:** implementation companion for the Local Connector handoff

**Status:** ready for feature-by-feature development

**Compatibility authority:** the Local Connector handoff files in the parent directory, the
reusable `reentry-core/` contracts, and accepted project decisions. This plan explains how to build
the service; it does not replace or rename the Connector contract.

## 1. End goal

Build a new Cloud Receiver v2 that the existing Local Connector can use without a client rewrite.
The reliable path is:

```text
user pairs a Mac
-> Host requests consent
-> user approves one fixed Connector target
-> Host sends one signed Event
-> Receiver queues one delivery
-> Connector claims one short lease
-> local adapter runs
-> trusted Host effect is verified
-> delivery is acknowledged
```

Cloud Receiver v1 under `runtime/cloud-receiver/` is retired historical evidence. Do not extend it,
reuse its entry point as the v2 service, or treat its passing tests as v2 evidence.

## 2. Simple system boundary

```text
Re-entry account browser
  -> pairing and consent control routes

Host backend
  -> organization-authenticated key, consent, Event, and Grant-control routes

Local Connector
  -> outbound JSON claim and acknowledgement routes using its Connector token

Effect authority
  -> trusted Host-effect verification supplied to the Receiver

Durable database
  -> accounts, pairing, keys, consent, Grants, Events, deliveries, leases, and attestations
```

The Receiver owns authorization, Grant state, delivery state, and audit history. The Host owns
business effects and issues the opaque effect token. The Connector owns local execution but cannot
claim that its own process success is Host-effect evidence.

## 3. Feature order and gates

Implement the feature blocks in this order. The transport shell and test harness may be built as
shared setup so the first feature can run over HTTP; transport hardening remains its own final gate.

| Order | Feature file | Required cases | Exit gate |
|---:|---|---|---|
| 1 | [01-pairing-and-credentials.md](01-pairing-and-credentials.md) | `PAIR-001`–`PAIR-005` | Pairing tests pass against HTTP and durable state. |
| 2 | [02-consent-targeting-and-revocation.md](02-consent-targeting-and-revocation.md) | `CONSENT-001`–`003`, `TARGET-001`–`002`, `REVOKE-001` | Decision, target, effective Grant status, and revocation tests pass. |
| 3 | [03-signed-event-ingress.md](03-signed-event-ingress.md) | `EVENT-001`–`EVENT-004` | Valid Events enqueue exactly one delivery and invalid Events do not mutate state. |
| 4 | [04-delivery-claim-and-lease.md](04-delivery-claim-and-lease.md) | `CLAIM-001`–`CLAIM-005` | Lease, replay, expiry, target isolation, and attempt bounds pass. |
| 5 | [05-delivery-acknowledgement.md](05-delivery-acknowledgement.md) | `ACK-001`–`ACK-005` | Only a verified Host effect closes the current Connector lease. |
| 6 | [06-transport-and-operations.md](06-transport-and-operations.md) | `HTTP-001`–`HTTP-005` | All boundaries, errors, health, logs, and limits pass. |

Do not start the next feature's green implementation until the previous feature's complete test
matrix is green. Refactoring is allowed only while the existing matrix remains green.

## 4. Red–green–refactor method

For each feature:

1. **Red:** run the documented cases against the new v2 handler before the behavior exists. A
   visible unsupported response is a useful red result; the retired v1 `410 receiver_deprecated`
   response is not a v2 pass.
2. **Green:** implement the smallest behavior, persistence, and authority checks needed for the
   cases. Do not add push delivery, speculative abstractions, or compatibility aliases.
3. **Refactor:** improve module boundaries, schema details, indexes, and deployment wiring without
   changing the HTTP contract or test meaning. Re-run the feature matrix and all earlier matrices.
4. **Record:** store the test IDs, runner, commit, runtime, database mode, authority fixtures, and
   pass/fail result. Never store raw secrets in evidence.

The tests must cross the real HTTP handler and durable database. Authority behavior must cross the
configured test authority or adapter port. A unit test that bypasses those boundaries is supporting
evidence only, not an exit gate.

## 5. Minimal relational model

The implementation may choose its ORM and database, but it must preserve these facts. Keep the
model relational and small; do not introduce a general event bus or a separate workflow engine.

| Record | Minimum durable facts | Important constraint |
|---|---|---|
| Account | `account_id`, identity reference, account status | Account identity is separate from Connector identity. |
| Pairing session | `pairing_id`, account, code digest, expiry, consumed time, Connector id, device name | Code digest is unique; consumption is atomic. |
| Connector | `connector_id`, account, target id, token digest, expiry, revocation/status | Token digest is stored; token is scoped to one target. |
| Host key | organization, Host id, issuer origin, key id, public key, status | Resolve by issuer origin and key id. |
| Host binding | organization, Host subject reference/digest, Connector id, target id | One v0.1 Host subject maps to one target. |
| Consent session | session id, token digest, organization, Host subject, decision status, expiry, Grant id | `status` means decision fact: `pending`, `approved`, or `declined`. |
| Grant | Grant id, binding, target, expiry, one-run/exhaustion facts, `revoked_at` | Effective state is derived at read/claim time. |
| Event | event id, correlation, binding, issuer, workflow, type, sequence, state version, timestamps, canonical URL | Event id is deduplicated; accepted Event and first delivery commit together. |
| Delivery | delivery id, Grant, Event, target, state, attempt count, current lease, acknowledgement | State transitions are atomic and target-scoped. |
| Effect attestation | effect id, delivery/event context, outcome, confirmed time, verification metadata | Effect id is unique; retain history; never mint an effect token. |

Use database uniqueness and transactions for identity and replay guarantees. Do not rely on process
memory for pairing consumption, event deduplication, leases, Grant revocation, or acknowledgement.

## 6. Shared state rules

- Pairing claim: unused pairing session -> one Connector and consumed pairing session.
- Consent: pending -> approved or declined; approval creates one Grant for the fixed target.
- Grant: effective state is `active`, `expired`, `exhausted`, or `revoked`; no expiry rewrite job is
  required.
- Event: one accepted Event id -> one delivery for the Grant target.
- Delivery: `PENDING -> LEASED -> ACKNOWLEDGED`; expired leases may be reclaimed only within a
  bounded attempt limit.
- Revocation: set irreversible `revoked_at`; preserve Event, delivery, and audit history.
- Acknowledgement: current Connector lease plus independently verified Host effect must match the
  same delivery. A pre-revocation effect may converge only when its confirmation time is before
  revocation.

## 7. Required test harness setup

Before `PAIR-001`:

- create the v2 test package and record its exact path and test command;
- start the real v2 HTTP handler with an isolated test database per case or suite;
- provide a fake account session, organization API key, Host signer, Connector client, and test
  effect authority without logging their raw values;
- expose durable-state inspection helpers that read the database, not process internals;
- provide clock and id generators as test dependencies so expiry and replay cases are deterministic;
- make the v1 runtime unavailable to the v2 tests.

## 8. Evidence and handoff

For every test ID, record:

```text
feature:
test_id:
runner:
commit:
runtime:
database:
authority_fixtures:
result:
durable_state_assertion:
```

The final handoff requires all feature IDs plus the complete end-to-end path in the parent
`README.md`. Evidence must distinguish locally tested, committed, deployed, and externally verified
claims.

## 9. Explicit non-goals

- WebSockets, push delivery, inbound Mac connections, or Receiver-to-Receiver replication;
- exposing account identity, private bindings, Host credentials, or Connector tokens across the
  wrong boundary;
- production identity recovery, rate limiting, abuse controls, multi-region coordination, or a
  general-purpose job system;
- changing Local Connector route names, field names, token placement, or protocol `0.1`.

