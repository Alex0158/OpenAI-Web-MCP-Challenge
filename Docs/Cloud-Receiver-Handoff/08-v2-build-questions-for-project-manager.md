# Cloud Receiver v2 — Project Manager Decision Questions

**Status:** Decision request; non-authoritative until accepted by the project team

**Prepared:** 2026-09-02

**Audience:** Project manager, Cloud Receiver team, Local Connector maintainers

**Scope:** The eight documents in [`v2-build/`](v2-build/), their parent handoff pack, and the
governing Core, Mechanism, ADR, Task, and current Cloud Receiver 2 clone records.

## 1. Purpose

This document consolidates the questions that must be answered before the full Cloud Receiver v2
service is implemented. It is a decision handoff, not an implementation specification and not an
authority override.

The v2 build plan says feature-by-feature development can begin, while the decision-gate document
still leaves several public contracts open. The questions below make that boundary explicit. Please
answer each question or explicitly accept the recommended default. Accepted answers should be
recorded in a new or updated ADR and bounded implementation Task before protocol code is changed.

## 2. Current starting point

- The v1 implementation under `runtime/cloud-receiver/` is retired historical evidence.
- The current Cloud Receiver 2 clone is [`saas-boilerplate/`](https://github.com/4xeoz/saas-boilerplate/tree/498bd18a92b488b440ccd2e3b00f55362cb4d443/). It currently
  provides Prisma/PostgreSQL persistence, separate email/password User and Developer accounts, and
  separate login pages.
- The clone does not yet provide the v2 `/v0.1` pairing, consent, Host-key, event, delivery, lease,
  revocation, or acknowledgement routes.
- The reusable Core and Mechanism contracts, especially ADR-0007 through ADR-0013, remain the
  compatibility authority where the handoff uses shorthand or omits a detail.
- The project has not yet registered a replacement-specific Task, ADR, implementation record, or
  deployment profile. The former productionization Task explicitly requires those records for a
  replacement.

## 3. Decision summary

| ID | Decision area | Priority | Recommended default |
|---|---|---:|---|
| Q1 | Build scope and source of truth | P0 | Use the clone as the new console/service base; use Core and accepted ADRs as the protocol authority. |
| Q2 | User, Developer, Organization, and Host roles | P0 | User accounts own Connector approval; Developer accounts administer an Organization and Host credentials. |
| Q3 | Pairing replay and Connector-token custody | P0 | Return the Connector token once; a replay returns duplicate metadata without a raw token and requires a new pairing if the first response is lost. |
| Q4 | Pairing target and Connector lifecycle | P1 | Generate one server-owned target per Connector and define explicit rename, expiry, and revocation behavior. |
| Q5 | Consent and Grant-control public API | P0 | Decide exact routes, bodies, authentication, response shapes, and status/error mappings before feature closure. |
| Q6 | Host-effect authority | P0 | Inject a narrow verifier port; use a configured fake authority for local tests and defer the production adapter until its owner is named. |
| Q7 | Canonical protocol and field naming | P0 | Treat ADR-0007 and ADR-0010 as authoritative; update handoff shorthand to their exact field names and vectors. |
| Q8 | Time, retry, state, and error policy | P1 | Select explicit deployment values and one exact status/code matrix rather than retaining alternatives. |
| Q9 | Persistence, Supabase, and migration boundary | P0 | Use Prisma/PostgreSQL with a fresh Supabase database or explicitly approved baseline; do not migrate the old database blindly. |
| Q10 | Implementation ownership and rollout profile | P0 | Register a new Task/ADR/Development record and build local-first with a generic Host fixture before deployment. |

## 4. Questions requiring project-manager decisions

### Q1 — What exactly is the first Cloud Receiver v2 increment?

1. Does this handoff authorize implementation of the complete v2 service, or only the already
   requested account/authentication and console foundation?
2. Is [`saas-boilerplate/`](https://github.com/4xeoz/saas-boilerplate/tree/498bd18a92b488b440ccd2e3b00f55362cb4d443/) the actual replacement repository/base, or is it
   only a temporary console shell while the Receiver remains elsewhere?
3. Should the earlier requirement for two simple email/password account flows remain unchanged?
4. When the handoff and Core/ADR documents differ, should the exact Core/ADR contract always win?
5. Does “ready to build” mean that internal red tests may begin, or that all public routes and
   production authority decisions are already accepted?

**Recommended default:** Treat `saas-boilerplate/` as the new bounded base, preserve its separate
User/Developer email/password sessions, use the Core/ADR contracts as normative, and define the
first increment as a local generic Host/Receiver/Connector flow. Do not claim production readiness
until all public gates close.

### Q2 — How do User, Developer, Organization, and Host identities map?

The current clone has two independent account tables and session cookies, while the v2 handoff
requires both a Re-entry account session and an Organization API key. Decide:

1. Is a `UserAccount` the human who owns devices and approves consent?
2. Is a `DeveloperAccount` the console operator who owns or administers one or more Organizations?
3. Does one Developer account create an Organization, or are Organizations separate records with
   multiple Developers and explicit membership?
4. Which account type may create pairing sessions, select Connectors, inspect Grants, and revoke
   Grants?
5. Which actions require an Organization API key rather than a browser session?
6. Who creates, rotates, expires, and revokes Organization API keys?
7. Who registers and rotates Host signing keys, and how are duplicate or conflicting `key_id`
   values handled?
8. What are the exact session cookie names, expiry rules, logout behavior, CSRF boundary, and
   cross-origin policy for the two browser account types?
9. Are Developer accounts a product-facing role, or merely a temporary implementation identity?

**Recommended default:** Keep User and Developer sessions separate. Let Users manage their own
Connector consent and pairing. Let Developers administer Organizations and server-side Host
credentials. Never use a browser session as proof of an Organization API call, Host signature,
Connector identity, or Grant decision.

### Q3 — How should pairing replay work without storing a raw Connector token?

The pairing document requires both of the following:

- persist only a SHA-256 digest of the Connector token; and
- replay a consumed pairing code to return the same credentials, including the raw token.

A digest cannot reproduce the raw token after a process restart. The claim request also contains only
`pairing_code` and `device_name`, so it provides no independent Connector or account identity for
the `PAIR-004` “different context” case.

Decide:

1. Should the first claim return the raw Connector token once, while a replay returns only
   `duplicate`, `pairing_id`, `connector_id`, and expiry with no token?
2. If the first response is lost, should the user create a new pairing, or is encrypted secret
   storage with a separately managed decryption key acceptable?
3. If encrypted storage is allowed, who owns the encryption key, rotation, backup, and recovery?
4. If replay still returns the raw token, what proves that the replaying caller is the original
   claimant and not anyone who obtains the consumed pairing code?
5. What exactly is the alternate identity in `PAIR-004`, and what request field or fixture proves
   it without changing the v0.1 wire contract?
6. What are the exact pairing-code format, entropy, lifetime, character set, and attempt limits?

**Recommended default:** Make the Connector token a one-time response. A replay may confirm the
existing Connector with `duplicate: true` but must not return a raw token. Update `PAIR-003` to test
safe replay without token recovery and require a new pairing after response loss. This preserves the
digest-only rule and avoids making a short pairing code a permanent bearer-recovery credential.

### Q4 — What is the Connector and delivery-target lifecycle?

The handoff requires a Connector and a fixed `delivery_target_id`, but the pairing request does not
include a target. Decide:

1. Is one Connector always exactly one delivery target?
2. Is `delivery_target_id` generated by the Receiver during claim, or supplied by a trusted
   authority?
3. Can one User have multiple Connectors or devices?
4. How are Connector eligibility, expiry, revocation, and replacement represented?
5. Are Connector rename, disconnect, and credential rotation public account operations?
6. What happens to pending or leased deliveries when a Connector is revoked or expires?
7. Is a target ever reused after a Connector is decommissioned?
8. What establishes that a target is online or eligible without adding a heartbeat or inbound device
   connection?

**Recommended default:** Generate one immutable target for each Connector at first claim. Keep target
selection account-owned, use outbound polling only, and make disconnect/rotation explicit operations
that never silently move a Host subject to another target.

### Q5 — What are the exact consent, Grant, status, revocation, and rebind routes?

The handoff specifies some route names but intentionally leaves other public surfaces open. Decide
the exact contract for each route, including method, path, authentication, exact request fields,
response fields, status codes, error codes, expiry behavior, and visibility boundary:

1. Host-key registration and update: duplicate key, rotation, revocation, and origin normalization.
2. Consent-session creation: Manifest validation, `host_subject_ref` handling, token lifetime, and
   returned URL/session fields.
3. Consent URL/page retrieval: exact path, token placement, account-session requirement, and
   anti-CSRF boundary.
4. Account consent decision: approve/decline fields, same decision replay, conflicting decisions,
   Connector ownership, and pending/expired sessions.
5. Consent or Grant status read: who may read it, whether it exposes `status` and
   `effective_status`, and the exact response shape.
6. Grant inspection: whether the public surface maps the Core `inspectGrant` summary and how the
   caller is authorized.
7. Grant revocation: exact public route, request body, authorization, idempotent response, and
   `revoked_at` visibility.
8. Host-subject rebind/decommission: exact route, authorization, whether old Grants remain valid,
   and how pending, leased, or acknowledged deliveries are handled.
9. Does an approval replay for the same subject and target create a new one-run Grant, reuse an
   existing Grant, or return an existing decision only?
10. Does a declined or expired consent session remain queryable, and for how long?

**Recommended default:** Do not invent or implement the public revocation, rebind, or status routes
until they are accepted. Keep the internal Core authority available for tests, but treat the public
contracts as release blockers for the corresponding feature.

### Q6 — Who owns and invokes the Host-effect authority?

Acknowledgement requires an opaque `effect_token` issued only after the Host effect is committed,
but the production adapter and invocation path are not named. Decide:

1. Is the verifier part of the Cloud Receiver, the Host backend, or a separate trusted service?
2. Who issues the effect token, and how does the acknowledgement caller receive it?
3. Does the Local Connector submit the token, or does a trusted Host/local integration submit the
   acknowledgement separately?
4. What exact internal interface and timeout does the Receiver use to call the verifier?
5. Is verifier success idempotent, and how is the “authority succeeded but database commit failed”
   case recovered?
6. What status/code is returned when no verifier is configured, the verifier times out, or the
   attestation is mismatched?
7. Is a fake authority sufficient for the first local build, with production effect verification
   explicitly deferred?

**Recommended default:** Use an injected, narrow verifier port. Run the full local matrix with a
   configured fake authority, record that as test evidence only, and defer production effect
   integration until its owner and selected Host are accepted. Never acknowledge from adapter,
   Agent, process, or browser success alone.

### Q7 — Which exact protocol contract wins?

Some v2 handoff text uses shorthand that does not match the exact Core/ADR vocabulary. For example,
the event description mentions `workflow`, `sequence`, and `timestamp`, while the frozen v0.1 event
uses `workflow_id`, `event_sequence`, and `occurred_at`.

Confirm the following:

1. Are ADR-0007 and ADR-0010 the exact authority for event, claim, acknowledgement, field names,
   unknown-field rejection, status meanings, and token placement?
2. Should the v2 handoff be corrected to use the exact ADR names before red tests are written?
3. Is canonical JSON lexicographically sorted by object key, encoded as UTF-8, and signed as
   `<epoch-seconds>.<canonical-event-body>` with Ed25519 and unpadded base64url?
4. What exact timestamp skew window applies to signed events and effect attestations?
5. How are issuer origins, canonical URLs, key IDs, and header names normalized and compared?
6. Is `event_sequence == 1` mandatory for protocol `0.1`?
7. Is `state_version` only a page revalidation value, not independent proof of Host truth?
8. What is the exact behavior for conflicting reuse of an `event_id` with different canonical
   bytes?
9. Where do `human_boundary`, `continuation_mode`, and the receipt fields originate: Manifest,
   Grant, Event, or a separate trusted record?
10. Does the Host request use `workflow_id` consistently across Event, continuation, receipt,
    acknowledgement, and effect attestation?

**Recommended default:** Use the exact ADR/Core contract without aliases. Treat the handoff's shorter
names as editorial shorthand and correct them before implementation.

### Q8 — What are the exact time, retry, state, and error policies?

The documents define ranges and alternatives but do not select all deployment values or one exact
status/code matrix. Decide:

1. Pairing-code lifetime and maximum claim attempts.
2. Consent-session lifetime and account-decision window.
3. Maximum Grant lifetime and exact one-run/exhaustion behavior.
4. Connector-token lifetime, expiry, revocation, and rotation behavior.
5. Signed-event timestamp skew and future-timestamp policy.
6. Lease duration, maximum attempts, poll interval, and response timeout.
7. Effect-attestation time window and allowable future clock skew.
8. Whether a revoked or expired Grant cancels pending deliveries immediately or only on the next
   claim/acknowledgement transaction.
9. Whether an already leased delivery may converge after revocation when the Host effect was
   confirmed before revocation.
10. Exact status/code mapping for malformed input, invalid identity, unknown binding, expired or
    revoked Grant, stale lease, conflicting identity, authority failure, persistence contention,
    and unexpected failure.
11. Which errors are `400`, `401`, `403`, `409`, `410`, `503`, or `500`; the current text sometimes
    gives alternatives while requiring exact test assertions.
12. Exact `/healthz` and `/readyz` response bodies, status codes, and readiness behavior when the
    database is unavailable.
13. Exact `204` no-work headers, including the interaction between an empty body, absent
    `Content-Type`, and `Cache-Control: no-store`.

**Recommended default:** Make every value an explicit deployment configuration with bounded
validation, snapshot the maximum attempts relevant to each delivery, and publish one status/code
matrix before HTTP-002 is written.

### Q9 — What is the persistence and Supabase boundary?

The current clone uses Prisma/PostgreSQL, while the handoff permits an ORM/database choice and the
earlier environment work accepted old Cloud Receiver/Supabase variable names. Decide:

1. Will console identity and Receiver authority tables share one PostgreSQL database or use separate
   databases?
2. Is the target Supabase project/database new, or is the retired Receiver database being reused?
3. If the old database is reused, who approves and documents the Prisma migration baseline and
   rollback/recovery procedure?
4. Are all v2 tables prefixed or placed in a dedicated schema to avoid collisions?
5. Which values are digests only, which are encrypted, and which may be returned publicly?
6. Which transitions require one database transaction or compare-and-set: pairing, approval,
   binding, Grant creation, event plus delivery, lease, revocation, and acknowledgement?
7. How are database contention, unavailable persistence, migration failure, backup, restore, and
   retention handled?
8. Is local PostgreSQL the first development/test database, with Supabase integration later?

**Recommended default:** Use one Prisma/PostgreSQL database with explicit module/table ownership and
`cr2_` names, run local-first against disposable PostgreSQL, and use a fresh Supabase project for
the hosted profile. Never point migrations at the old Receiver database without an approved baseline.

### Q10 — What are the implementation ownership and rollout gates?

The retired productionization Task states that a replacement needs its own bounded Task, ADR,
implementation record, and verification evidence. Decide:

1. Who owns the replacement Task and ADR?
2. Is the implementation path exactly `saas-boilerplate/`?
3. What is the first falsifiable outcome and non-goal?
4. What test runner and command are authoritative for each `PAIR`, `CONSENT`, `TARGET`, `REVOKE`,
   `EVENT`, `CLAIM`, `ACK`, and `HTTP` case?
5. May the first red/green increment use a fake Host signer, fake Connector authority, fake consent
   authority, fake effect authority, and generic Host fixture?
6. Is the first rollout local-only, or should the first increment target Vercel/Supabase?
7. Which exact Local Connector source/commit and client policy must be used for compatibility tests?
8. What evidence is required before the project calls the service locally verified, committed,
   deployed, or externally verified?
9. Does the selected application need to be chosen before generic Receiver implementation, or may
   the generic protocol flow proceed independently?

**Recommended default:** Register a local-first replacement Task and ADR, use a generic Host and
configured test authorities, run the real HTTP handler against durable Prisma/PostgreSQL state, and
defer deployment and selected-app claims until the protocol matrix is green.

## 5. Ready-to-build condition

The full build should start only when:

- Q1–Q3 and Q5–Q7 have accepted answers, because they affect authority or wire compatibility;
- the pairing replay contradiction is resolved;
- the exact public route/status decisions needed by the current feature are recorded;
- the replacement Task, ADR, implementation record, owner, test command, and rollout profile exist;
- a durable database and effect-authority test boundary are selected; and
- the first red test can fail because the behavior is absent, not because the contract or harness is
  undefined.

Before those conditions, documentation reconciliation and a bounded test-harness spike are safe;
full protocol implementation would risk encoding an unaccepted authority or compatibility decision.

## 6. References

- [`v2-build/00-v2-build-plan.md`](v2-build/00-v2-build-plan.md)
- [`v2-build/01-pairing-and-credentials.md`](v2-build/01-pairing-and-credentials.md)
- [`v2-build/02-consent-targeting-and-revocation.md`](v2-build/02-consent-targeting-and-revocation.md)
- [`v2-build/03-signed-event-ingress.md`](v2-build/03-signed-event-ingress.md)
- [`v2-build/04-delivery-claim-and-lease.md`](v2-build/04-delivery-claim-and-lease.md)
- [`v2-build/05-delivery-acknowledgement.md`](v2-build/05-delivery-acknowledgement.md)
- [`v2-build/06-transport-and-operations.md`](v2-build/06-transport-and-operations.md)
- [`v2-build/07-decision-gates-and-evidence.md`](v2-build/07-decision-gates-and-evidence.md)
- [`07-open-questions-for-cloud-receiver-team.md`](07-open-questions-for-cloud-receiver-team.md)
- [`../../Docs/Mechanisms/`](../Mechanisms/README.md)
- [`../../Docs/Core/00-current-status.md`](../Core/00-current-status.md)
- [`../../Docs/Tasks/TASK-003-productionize-and-deploy-cloud-receiver.md`](../Tasks/TASK-003-productionize-and-deploy-cloud-receiver.md)
- [`../../saas-boilerplate/README.md`](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/README.md)
