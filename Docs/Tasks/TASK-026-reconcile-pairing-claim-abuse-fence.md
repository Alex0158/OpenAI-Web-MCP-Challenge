# TASK-026: Reconcile Pairing Claim Abuse Fence

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Project team and Cloud Receiver v2 security owner.
- Current increment: Gate A and Gate B1 are verified, and Amendment A to ADR-0033 is accepted for the
  project-supported client set and direct Vercel platform path. The post-implementation Gate B2
  hosted adapter/readback remains open. The local provider adapter, durable limiter, strict claim
  shape, Dashboard display, Local Connector input, migration, and focused tests are implemented and
  locally verified; no hosted claim path has been enabled.
- Next gate: Run the minimum disposable hosted readback against the reviewed deployment, record
  deployment/migration evidence, and only then decide whether the anonymous claim path can be enabled.
- Dependencies: ADR-0033, AUDIT-V2-001 in Core/09, TASK-012, and the Primary Development Runbook.
- Coordination: TASK-032 must consume the accepted pairing contract before its compatible Connector
  release can be closed.

## 1. Problem and objective

ADR-0033 requires at most five failed pairing claims and a terminal sixth response. The active
request carries only an eight-hex-character code. The service can find a row only when that code is
already correct, never increments `failedAttempts`, and applies no limiter to the anonymous claim
route. The documented per-pairing failure budget therefore has no enforceable identity for wrong
guesses.

The objective is to decide a coherent abuse fence before wider preview or production use.

## 2. Authority and evidence

- ADR-0033 owns the accepted pairing contract.
- Core/04 owns the system security boundary; Mechanism 03 owns pairing-to-delivery integration.
- Current evidence is `pairing.service.ts`, `pairing.routes.ts`, the Prisma `PairingSession`, the
  authentication-only rate limiter, and PAIR-001 through PAIR-006.
- This task records the accepted Amendment A implementation boundary; it does not authorize
  production deployment or publication.

## 3. Scope

Record and carry forward one bounded design that covers the pairing claim identity, atomic attempt
accounting, source rate limits, exact error behavior, replay, race handling, restart persistence,
observability, compatibility, and secret-free tests. Reconcile ADR-0033 and the owning Core and
Mechanism documents through implementation and hosted verification.

## 4. Non-goals

- changing pairing code or schema outside the accepted Amendment A boundary;
- adding CAPTCHA, alternate pairing transports, hidden retry, or account credentials to the CLI;
- exposing raw pairing or Connector tokens in storage, logs, or tests; or
- claiming that an unspecified platform firewall closes the application contract.

## 5. Verification and closure

Close only after the accepted contract has focused tests for strict request shape, the attempt and
rate boundaries, concurrent claims, terminal response, exact duplicate replay, restart, limiter
failure, old-client rejection or versioning, and secret absence; the implementation and migration
decision are verified; the dashboard and Connector clients agree; and Core/04, Core/09, Mechanism 03,
and Development evidence agree. A production or wider-preview claim requires a separate hosted
readback; this task does not grant deployment or publication authority.

### Accepted decision direction (ADR-0033 Amendment A)

The owner approved the direction below on 2026-09-03, and [ADR-0033 Amendment A](../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md#21-amendment-a--pairing-claim-abuse-fence)
was accepted on 2026-09-04. The supporting
[Research 26 proposal](../Research/26-pairing-claim-abuse-fence-proposal.md) contains the detailed
alternatives, evidence, and test matrix. This task writeback records the selected direction and
implementation boundary; it does not by itself authorize deployment or publication.

1. Keep the existing ten-minute lifetime and eight-uppercase-hex secret code. Require the already
   public `pairing_id` alongside `pairing_code` and `device_name`, then resolve the pairing row by
   `pairing_id` before comparing the stored code digest. The raw code remains absent from storage,
   logs, and evidence.
2. Count wrong, well-formed codes for that pairing in a durable atomic counter. Attempts one through
   five return the stable generic not-found response; the sixth records the terminal state and
   returns `410 pairing_expired`. A valid claim after five wrong attempts still succeeds. Exact
   consumed-code replay remains tokenless, does not consume an attempt, and ignores a changed
   display name; a wrong code against a consumed row remains generic.
3. Apply a durable source budget to every anonymous claim request: thirty requests per ten-minute
   window using a protected fingerprint of the trusted ingress client identity. Return
   `429 pairing_rate_limited` with a bounded `Retry-After`. The budget must be atomic across
   replicas and restarts. If trusted source identity or the limiter store is unavailable, fail
   closed rather than trust arbitrary forwarding headers or bypass the fence. Platform edge limits
   remain supplementary.
4. Keep unknown identifiers, wrong codes, and wrong codes for consumed pairings deliberately
   indistinguishable. Do not expose pairing existence, counters, code, token, source identity, or
   database details in responses or logs.
5. Preserve one-time Connector-token issuance, immutable delivery-target binding, exact duplicate
   replay, disconnect, delivery-lease, Grant, and downstream authority semantics. The abuse fence
   changes only the anonymous pairing boundary.
6. Update the dashboard and Local Connector UX so the user can copy and submit the public pairing
   ID with the existing short code. After the consumer inventory, amend the current preview route
   in place only when all supported clients are controlled; otherwise introduce a versioned claim
   route and make the old body return an explicit upgrade error. Never retain a weaker fallback.

The request shape/version, 30-per-10-minute rate window, trusted-ingress configuration, terminal and
rate-limit errors, and consumer, migration, and rollback inventory are now normative through
ADR-0033 Amendment A. The local implementation uses the amended shape; the reviewed hosted preview
has not yet received this increment, so no hosted claim-path enablement or release claim follows
from the local green tests alone.

## 5.1 Required gates

The following gates are part of this task's decision boundary. Gate A and Gate B1 are
pre-implementation evidence gates. Gate B2 is a post-implementation hosted verification gate; keeping
it separate avoids making the capability decision depend on the code that it authorizes.

### Gate A: Controlled consumer and route policy

1. Inventory every supported Dashboard, Local Connector, test fixture, install guide, and published
   or externally supported client that can call the anonymous claim route.
2. If the inventory contains only repository-controlled clients, amend the existing preview route in
   place and require `pairing_id`, `pairing_code`, and `device_name`. The old body is rejected with a
   clear upgrade error; it is never silently accepted as a weaker fallback.
3. If a supported external client remains, introduce a separately versioned claim route, migrate the
   controlled clients, and keep the old route only with its explicit compatibility boundary. No route
   may make `pairing_id` optional after the abuse fence is enabled.
4. Record the inventory, selected route policy, client migration order, and rollback action in the
   ADR amendment and the TASK-032 release evidence.

The default hackathon path is the in-place strict update because the currently supported clients are
controlled. A versioned route is justified only by evidence of a supported external consumer.

### Gate B1: Hosted source-identity platform capability

1. Confirm that the intended hosting path is a direct Vercel deployment or has an explicitly
   configured trusted proxy. The application must not silently accept an unreviewed upstream proxy.
2. Use Vercel's documented request-header contract as the platform basis: the direct deployment
   provides a public client-IP value and overwrites forwarded values to prevent spoofing. Record the
   exact provider and deployment path in the ADR amendment.
3. Select the provider adapter before implementation. For the direct Vercel path it accepts exactly
   one valid `x-vercel-forwarded-for` value, rejects missing/multiple/invalid values, never relies on
   Express's default `req.ip` or arbitrary `X-Forwarded-For`, and HMACs the value before persistence.
4. Run only safe preflight requests at this stage (`GET /healthz`, `GET /readyz`, CORS `OPTIONS`, and
   deployment-header readback). These establish routing/readiness and multi-execution evidence; they
   do not prove application extraction or limiter behavior.
5. If the provider contract or direct path cannot be established, fail closed for anonymous claims.
   Do not fall back to an in-memory limiter, arbitrary headers, or an unlimited route.

### Gate B2: Application adapter and hosted readback

1. After the ADR amendment, schema/migration, provider adapter, and focused tests are implemented,
   verify locally that spoofed forwarded headers, missing/multiple/invalid values, HMAC rotation, and
   limiter/database failure all fail closed.
2. Run a disposable hosted readback against the exact reviewed deployment. It must show the adapter
   receives the provider value, preserves the same source bucket across separate executions, returns a
   bounded `Retry-After`, and keeps the durable PostgreSQL budget atomic across restart/replica
   boundaries.
3. Enable the anonymous claim path only after B2 passes. If B2 fails or becomes unavailable, keep the
   claim path disabled or fail closed; never enable a weaker fallback.
4. Record the local matrix, deployment identity, readback output, migration identity, and failure
   behavior in the ADR amendment and hosted verification evidence.

The selected 30-per-10-minute source budget can still affect legitimate clients sharing one network
address, and a holder of a public `pairing_id` can burn the per-pair budget. The ten-minute pairing
lifetime and easy regeneration bound these risks for the hackathon; they do not constitute a claim of
complete denial-of-service immunity.

### Gate order and rollback boundary

Complete Gate A and Gate B1 before schema or runtime changes. With Amendment A now accepted, proceed
in this order: add the focused red tests and migration, update the Dashboard and Connector clients,
implement the provider adapter and strict backend validation, complete Gate B2, and enable the
anonymous claim path only after its hosted readback passes. If rollout fails, pause or forward-fix the
claim path; never restore the old unbounded request body as a rollback.

## 5.2 Gate execution snapshot — 2026-09-04

### Gate A result: `VERIFIED_FOR_PROJECT_SUPPORTED_CLIENTS`

The read-only inventory covered the active account-pairing route in
`saas-boilerplate/backend/src/modules/connectors/`, its Jest and restart fixtures, the active
Dashboard API and `PairThisMac` component, `runtime/local-connector/` and its pairing tests, and the
repository handoff/install guidance. All identified supported callers are repository-controlled and
currently submit the old `{ pairing_code, device_name }` shape. The inventory also records:

- `runtime/cloud-receiver/` and its pairing surface are explicitly retired by ADR-0032 and TASK-013;
  they are historical evidence, not a supported consumer or rollback route.
- The public `@4xeoz/re-entry@0.2.20` artifact still exists on npm, but its published provenance and
  instruction-bearing lease compatibility are explicitly rejected by the current README, Core/09,
  and TASK-032. It is therefore a published historical artifact, not an accepted external consumer.
- No supported external consumer was identified in the project-owned source, guides, tests, or
  release records. This does not claim that an unknown third party has never installed the package.

The route decision for the supported project set is therefore the in-place strict update: require
`pairing_id`, `pairing_code`, and `device_name` on the existing preview route, update every controlled
caller and guide, and reject the old body with an explicit upgrade error. A separately versioned
route remains conditional on later evidence of a supported external consumer.

### Gate B1 result: `VERIFIED — DIRECT VERCEL PLATFORM BASIS`

The read-only preflight used the documented active Vercel preview
`https://cloud-receiver-delta.vercel.app` and the documented frontend origin
`https://re-entry-weld.vercel.app`:

- `GET /healthz` returned `200 {"status":"ok"}` with `Cache-Control: no-store`.
- `GET /readyz` returned `200 {"status":"ready"}` with `Cache-Control: no-store`, proving the
  current preview can reach its readiness dependency at this boundary.
- `OPTIONS /v0.1/account/pairing-sessions/claim` returned `204` with the expected frontend CORS
  origin and no redirect.
- Consecutive requests were served with different Vercel request IDs, so an in-memory limiter would
  not be an application-level contract across executions.
- Vercel's official [request-header contract](https://vercel.com/docs/headers/request-headers) states
  that `x-forwarded-for` carries the public client IP, that Vercel overwrites it when a proxy is in
  front to prevent IP spoofing, and that `x-vercel-forwarded-for` and `x-real-ip` mirror that value.
  This is a platform capability basis for a direct Vercel deployment, not proof that this Express
  app currently extracts or validates the value.
- The current backend app/config has no explicit trusted-ingress identity or proxy trust
  configuration, and the claim route has no durable source limiter. Health and CORS success therefore
  do not pass the post-implementation application gate.

Gate B1 is therefore verified for the documented direct Vercel path, while **Gate B2 remains open**.
No hosted claim POST, pairing consumption, attempt increment, or external state mutation was
performed in this preflight. Amendment A is now accepted and the local increment is implemented;
the next increment is the disposable hosted readback against a reviewed deployment before any
claim-path enablement.

### Local implementation result — 2026-09-04

The accepted increment is implemented in the active `saas-boilerplate/` and project-controlled
client surfaces:

- `backend/src/modules/connectors/pairing-source.ts` accepts exactly one valid
  `x-vercel-forwarded-for` value and HMACs it; missing, repeated, comma-separated, invalid, and
  weak-secret cases fail closed.
- `backend/src/modules/connectors/pairing-rate-limit.ts` and the Prisma migration add an atomic
  PostgreSQL source bucket with a 30-per-10-minute budget and bounded `Retry-After`.
- `pairing.service.ts` resolves by `pairing_id`, atomically records wrong attempts, preserves the
  valid-after-five boundary, and keeps exact duplicate replay tokenless.
- The Dashboard displays the public pairing ID beside the short code; the active Local Connector
  requires and submits both values. The retired `runtime/cloud-receiver/` remains untouched.
- Focused tests cover strict old-body rejection, terminal and concurrent attempt boundaries,
  source-header parsing, HMAC rotation, rate-limit response, restart replay, and the existing
  delivery/consent/event/acknowledgement consumers.

Local evidence on the disposable `reentry_closure` PostgreSQL database:

```text
npm run db:migrate -w backend
npm run type-check
npm test -w backend -- --runInBand <pairing, restart, delivery, event, acknowledgement, consent suites>
npm test  # runtime/local-connector
```

The migration reported no pending work after applying the new table, backend/frontend type checks
passed, the focused backend suites passed (39 tests across pairing and downstream consumers), and
the Local Connector suite passed (49 tests, 12 opt-in hosted suites skipped). A production
configuration probe exits non-zero when the source HMAC secret is absent. Gate B2 remains open: the
current hosted preview still needs a reviewed deployment with the production HMAC secret and a
disposable hosted readback; no hosted mutation was made by this local increment.

## 6. Reopen condition

Reopen for changed code entropy, request identity, attempt semantics, rate-limit scope, replay,
terminal response, or evidence that deployment-layer controls differ from the accepted design.
