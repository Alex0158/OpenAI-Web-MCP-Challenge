# ADR-0033: Adopt the Cloud Receiver v2 Replacement Base and Pairing Increment

**Status:** Accepted for the pairing increment only  
**Decision date:** 2026-09-02  
**Decision owners:** Project team; Cloud Receiver v2 development team  
**Controls:** [TASK-014](../Tasks/TASK-014-build-cloud-receiver-v2-pairing.md) and [CLOUD-014](../Development/CLOUD-014-cloud-receiver-v2-pairing.md)  
**Reviewed input:** [Project manager answers for v2 build](../Cloud-Receiver-Handoff/09-project-manager-answers-for-v2-build.md)  
**Does not supersede:** [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md) or the accepted Re-entry Core contracts

## Context

The PM answers select `saas-boilerplate/` as the replacement Cloud Receiver v2 base and make the
first falsifiable outcome the `PAIR-001`–`PAIR-005` pairing gate. The answers are not authoritative
until their durable choices are reviewed against the current Core, Mechanism, and ADR contracts.

The current clone already contains the intentionally small Prisma/PostgreSQL email/password
authentication slice with separate user and developer account tables and sessions. It does not yet
contain the Receiver control plane or pairing routes. The retired `runtime/cloud-receiver/` and its
database are historical evidence and are not a replacement implementation source.

One PM proposal is not compatible with current authority: allowing a Developer Organization API key
to inspect or revoke a User-owned Grant. ADR-0013 requires the Core control attestation subject to
equal the private Grant subject and explicitly leaves delegated administration outside v0.1. The
pairing increment does not need that decision, so it is kept outside accepted scope rather than
silently changing the Grant authority model.

## Decision disposition

| PM answer | Disposition | Recorded boundary |
|---|---|---|
| Q1 — replacement base, feature order, local generic first | **Accepted, scoped** | Use `saas-boilerplate/`; start with pairing red tests only. Existing auth remains the base. |
| Q2 — separate User/Developer ownership and browser/server boundary | **Partially accepted** | User-owned Connector pairing and separate email/password sessions are accepted. Organization-key Grant inspection/revocation is rejected pending an ADR-0013 amendment. |
| Q3 — one-time token and tokenless duplicate replay | **Accepted; companion verified** | Store only digests; return the raw Connector token once; replay omits it. The Local Connector compatibility change is recorded in CLOUD-014. |
| Q4 — one immutable delivery target per Connector | **Accepted for pairing** | Generate the target atomically with the first Connector claim; never silently reuse it. Rename, revoke, and token-rotation routes are later increments. |
| Q5 — concrete Consent/Grant/control routes | **Deferred** | No Consent or Grant-control route is authorized by this ADR. The proposed Organization-key Grant routes are not accepted. The Host-key revoke route also needs an origin-identity decision before implementation. |
| Q6 — effect verifier port | **Deferred** | Later delivery/acknowledgement work must use the Core verifier boundary; no effect authority is added now. |
| Q7 — Core and accepted ADRs win exactly | **Accepted** | No application aliases or alternate v0.1 wire semantics may be introduced. |
| Q8 — bounded local profile | **Partially accepted** | Pairing-specific limits (8 uppercase hex characters, 10-minute lifetime, five failed claims) are accepted. The later transport/error matrix remains subject to Core reconciliation. |
| Q9 — fresh Prisma/PostgreSQL database and `cr2_` tables | **Accepted** | Use a fresh local database first; no blind old-database migration; raw secrets are never persisted. |
| Q10 — v2-owned Task and local evidence gate | **Accepted, scoped** | TASK-014 owns the pairing increment. Green implementation and later feature gates require separate evidence. |

## Decision

### 1. Replacement boundary

1. `saas-boilerplate/` is the implementation base for the replacement service.
2. Its existing email/password `UserAccount` and `DeveloperAccount` surfaces remain separate; no
   Google OAuth, refresh-token system, shared account table, or general role hierarchy is added.
3. Prisma is the ORM and PostgreSQL is the durable store. The first database is fresh and local;
   existing `runtime/cloud-receiver/` state is not migrated.
4. `reentry-core/`, the Mechanism contracts, and accepted ADRs remain authoritative for the later
   Receiver protocol. This ADR does not alter the current project status or claim hosted support.

### 2. Pairing contract to test

The first red tests must target the real Express handler and durable PostgreSQL boundary.

#### Account creates a pairing session

```http
POST /v0.1/account/pairing-sessions
Cookie: user_session=<authenticated user session>
Content-Type: application/json

{}
```

The body is exactly `{}`. A successful response is `201` with exactly the pairing envelope:

```json
{
  "type": "webmcp.connector_account_pairing",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "pairing_code": "A1B2C3D4",
  "expires_at": "2026-09-02T12:00:00.000Z"
}
```

The code is exactly eight uppercase hexadecimal characters (`^[A-F0-9]{8}$`), expires after ten
minutes, and is returned only to the authenticated account response. The persisted value is its
SHA-256 digest, never the raw code. No Connector token is created or returned at this stage.

#### Fresh CLI claims the pairing

```http
POST /v0.1/account/pairing-sessions/claim
Content-Type: application/json

{
  "pairing_code": "A1B2C3D4",
  "device_name": "Mac One"
}
```

The claim carries no browser cookie and no Organization API key. The first valid claim atomically
consumes the code, creates one Connector, creates one immutable server-owned delivery target, and
returns `200`:

```json
{
  "type": "webmcp.connector_credentials",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "connector_id": "connector_123",
  "connector_token": "opaque-secret",
  "connector_expires_at": "2026-10-02T12:00:00.000Z",
  "duplicate": false
}
```

The raw Connector token is returned once and the Receiver persists only its SHA-256 digest. A valid
replay of the consumed code returns the same pairing and Connector metadata with
`duplicate: true`, but omits `connector_token` entirely. A changed replay `device_name` is ignored.
If the first response is lost, the user creates a new pairing; the Receiver does not store an
encrypted bearer token to recover it.

The pairing code is consumed with at most five failed claims. The sixth failed claim returns
`410 pairing_expired`; a valid duplicate replay does not consume an attempt. An inconsistent stored
pairing/Connector/account identity returns `409 account_pairing_identity_conflict` and creates no
second Connector. Invalid, expired, revoked, or wrong-scope Connector credentials on a later
delivery route return the stable `connector_identity_invalid` error without mutating delivery state.

### 3. Red-test boundary

Only these five tests are authorized in the first code increment:

| ID | Required proof |
|---|---|
| `PAIR-001` | Authenticated user posts exactly `{}`; receives the short-lived pairing response; no Connector token is exposed; a code digest is durable. |
| `PAIR-002` | A fresh cookie-free CLI claims the code; receives one opaque token once; the Connector and consumed pairing are durable; `duplicate` is `false`. |
| `PAIR-003` | Replaying the consumed code with another display name returns the same pairing/Connector metadata, omits the raw token, reports `duplicate: true`, and leaves one Connector and one target with the original name. |
| `PAIR-004` | A disposable persistence fixture creates an inconsistent account/Connector identity; the claim returns `account_pairing_identity_conflict` and creates no second Connector or reassignment. |
| `PAIR-005` | Invalid, expired, revoked, or wrong-scope Connector tokens fail at the delivery boundary with `connector_identity_invalid` and do not mutate delivery state. |

The tests are red by design because the clone currently lacks these routes and persistence models.
They must fail at the requested behavior boundary, not because the test harness or database setup is
undefined. No green implementation is part of this ADR.

### 4. Explicitly rejected or deferred authority

1. **Rejected for now:** Organization API keys controlling User-owned Grants. The current Core
   authority requires a same-subject control attestation under ADR-0013. A Developer/Organization
   administrator is a different subject and cannot be introduced by application routes alone.
2. **Deferred:** Consent sessions, account consent decisions, Host-key registration, Event ingress,
   delivery claims, acknowledgement, and transport/operations. They require their own implementation
   increment and evidence after pairing passes.
3. **Deferred:** The proposed Host-key revoke URL does not carry the normalized issuer origin even
   though origin is part of Host-key identity. Resolve that route identity before Host-key work.
4. **Accepted companion dependency, not changed here:** the Local Connector parser accepts the
   tokenless duplicate response in clean commit `7fab264d237b3e172acb091888643c831cadcb85`. This
   ADR does not edit `runtime/local-connector/`.

## Consequences

- The replacement has a clear, low-complexity starting boundary using the existing auth and Prisma
  base.
- Pairing credentials remain delivery-only; browser and Host surfaces do not receive the Connector
  token.
- The first durable schema must support digest uniqueness, atomic consumption, account/Connector
  consistency, and one immutable target, but no later feature tables are authorized yet.
- The pairing feature cannot close until durable process-restart/replay evidence is resolved.
- The current Cloud Receiver remains retired and no production, hosted, cross-machine, or selected-
  application claim follows from this decision.

## Verification and reopen conditions

Before green implementation, verify that `PAIR-001`–`PAIR-005` run over the real v2 handler and a
disposable PostgreSQL database. Pairing closure additionally requires restart/replay evidence and
the Local Connector compatibility change; both are recorded in [CLOUD-014](../Development/CLOUD-014-cloud-receiver-v2-pairing.md).
Reopen this ADR if implementation requires a different public wire shape, delegated Grant authority,
raw secret persistence, target reuse, or migration of the retired Receiver state.
