# Cloud Receiver 2 — SaaS Boilerplate Study

**Role:** SUPPORTING research and implementation-preparation record
**Status:** Static review complete; the requested minimal Cloud Receiver 2 auth slice is implemented
in the nested `saas-boilerplate/` clone; the full Receiver protocol remains out of scope
**Reviewed:** 2026-09-02
**Source:** [`4xeoz/saas-boilerplate`](../../saas-boilerplate/) at commit `e6eb759`
**Authority:** Existing Re-entry Core, Mechanisms, Decisions, Tasks, and Development records remain authoritative.

## 1. Conclusion

The SaaS boilerplate is a good candidate for the Cloud Receiver 2 console and service shell, but it
is not a replacement for Re-entry Core. The safe rebuild boundary is:

```text
SaaS boilerplate shell
  -> account session, organization console, HTTP lifecycle, configuration, health, and relational persistence

explicit Cloud Receiver adapter
  -> Host authentication, consent, Grant, event, delivery, Connector, and Core authority

Re-entry Core
  -> Manifest, Grant, event, lease, acknowledgement, replay, and human-boundary semantics
```

This record documents what the cloned source actually provides and a staged adaptation path. It does
not accept a new architecture, change current product truth, or implement Cloud Receiver 2.

### Product-manager summary

The boilerplate supplies the web product frame, login/session plumbing, a dashboard layout, a
Postgres-backed service, operational health checks, and Docker packaging. It deliberately does not
understand organizations, Connectors, Host signing, consent, delivery, or re-entry. Cloud Receiver 2
should use the boilerplate to make those capabilities operable and visible while keeping the
security-sensitive continuation authority in the existing Receiver boundary.

## 2. Source and review boundary

- Clone location: [`saas-boilerplate/`](../../saas-boilerplate/).
- Upstream: `https://github.com/4xeoz/saas-boilerplate.git`.
- Reviewed source commit: `e6eb759 Rebuild boilerplate: Drizzle, versioned API, crash-safe error handling`.
- The clone is a separate Git repository and was clean after cloning.
- No dependency installation, database startup, application run, or behavior change was performed
  during this review.
- The clone's source is evidence for this study; its module READMEs are not assumed current when
  they contradict the code at the reviewed commit.
- Links to files removed during the later v2 rebuild use immutable GitHub permalinks at reviewed
  commit `e6eb759`; current paths continue to use the local clone.

The current project remains a dirty collaborator workspace. Existing changes were preserved and no
existing Cloud Receiver, `mvp/`, reference, or collaborator-owned file was modified for this study.

## 3. What the boilerplate contains

| Surface | Current implementation | Candidate Cloud Receiver 2 use |
|---|---|---|
| Root workspace | npm workspaces for `shared`, `backend`, and `frontend`; `concurrently` runs both apps | A single repository and local development entry point |
| Backend shell | Express 4, TypeScript, Passport, Drizzle ORM, `pg`, Zod, Helmet, CORS, cookies, rate limiting | HTTP/control-plane shell and operational lifecycle |
| Backend modules | `authentication`, `users`, and `system-health` with route/service separation | Replace generic user behavior with account, organization, Host, Connector, consent, event, and delivery modules |
| Database | PostgreSQL with Drizzle schema/migration; `UserAccount` and `RefreshToken` tables | Candidate relational persistence layer; Receiver tables must remain explicit and separately owned |
| Auth | Google OAuth, JWT access cookie, hashed rotating refresh tokens, bearer-token fallback | Console identity only; not a substitute for Host, Connector, or consent credentials |
| Authorization | `user`, `admin`, and `superadmin` rank checks | Possible console administration primitive, subject to a new authority decision |
| API contract | `/v1` routes, deprecated unversioned aliases, `{ success, data }` / `{ success, error, message }` envelopes | Useful shell convention only; Receiver protocol mapping must preserve its exact error and authority semantics |
| Frontend | Next.js App Router, React 19, Tailwind 4, React Query provider, theme state, dashboard layout, UI primitives | Console and account-facing experience |
| Frontend auth | Cookie-presence middleware, `/auth/me`, single-flight refresh, logout proxy | Browser session UX; backend remains the authentication authority |
| Operations | Config validation, crash-safe async handlers, DB-aware readiness, liveness, graceful shutdown, Docker healthchecks | Candidate operational baseline, with Receiver-specific route names and readiness dependencies |
| Shared package | TypeScript declarations only: API envelopes, roles, and `PublicUser` | Share API types only; keep runtime protocol values and authority logic out of this package |

## 4. Repository map

### 4.1 Backend

| Path | Responsibility | Cloud Receiver 2 disposition |
|---|---|---|
| [`backend/src/app.ts`](../../saas-boilerplate/backend/src/app.ts) | Express middleware, CORS, cookies, Passport, route mounts, 404, and error handler | Reuse the lifecycle shape; replace generic mounts and tighten logging, request limits, and route policy |
| [`backend/src/index.ts`](../../saas-boilerplate/backend/src/index.ts) | Listener startup, hourly refresh-token cleanup, signal handling, pool drain | Reuse graceful shutdown pattern; replace cleanup with Receiver-specific maintenance only when required |
| [`backend/src/routes/index.ts`](../../saas-boilerplate/backend/src/routes/index.ts) | Versioned router, health routes, deprecated aliases | Use one explicit Receiver API version; avoid carrying an alias that obscures protocol migration |
| [`backend/src/config/config.ts`](../../saas-boilerplate/backend/src/config/config.ts) | Zod environment parsing and production startup checks | Reuse fail-fast validation; define separate names and minimums for every Receiver credential |
| [`backend/src/db/schema.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/db/schema.ts) | Drizzle `UserAccount` and `RefreshToken` tables | Replace or isolate generic tables from Receiver-owned identity, device, consent, and delivery state |
| [`backend/src/db/index.ts`](../../saas-boilerplate/backend/src/db/index.ts) | One `pg` pool, idle-client error listener, Drizzle instance | Reuse pool discipline; verify transaction and locking behavior for atomic Receiver transitions |
| [`backend/src/db/migrate.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/db/migrate.ts) | Runtime Drizzle migration runner | Reuse only after the migration ownership and deployment order are accepted |
| [`backend/src/lib/async-handler.ts`](../../saas-boilerplate/backend/src/lib/async-handler.ts) | Converts rejected handler promises into Express errors | Reuse as a baseline invariant |
| [`backend/src/lib/response-helpers.ts`](../../saas-boilerplate/backend/src/lib/response-helpers.ts) | Success/error envelope builders | Adapt only if the exact Receiver HTTP contract permits an envelope; never hide typed failures |
| [`backend/src/middleware/logger.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/middleware/logger.ts) | Optional request debugging and JWT inspection | Do not carry into production Receiver traffic without a secret-free logging redesign |
| [`backend/src/middleware/rateLimiter.ts`](../../saas-boilerplate/backend/src/middleware/rateLimiter.ts) | Auth and public-write rate limiters | Recalculate limits per endpoint, identity, and abuse consequence; current public-write limiter has no consumer |
| [`backend/src/middleware/requireRole.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/middleware/requireRole.ts) | Rank-based console role check | Keep separate from Grant, Host signature, Connector, and consent authorization |
| [`backend/src/middleware/validate.ts`](../../saas-boilerplate/backend/src/middleware/validate.ts) | Zod body validation that replaces `req.body` with parsed data | Reuse pattern for bounded control-plane inputs; add tests and route consumers before relying on it |
| [`backend/src/modules/authentication/`](../../saas-boilerplate/backend/src/modules/authentication/) | Google OAuth, JWT guard, profile, refresh, and logout | Rework around the accepted Cloud Receiver account/session model |
| [`backend/src/modules/users/`](../../saas-boilerplate/backend/src/modules/users/) | User lookup, Google account linking, public-user projection, admin list | Replace with explicit account and organization ownership; do not use generic user rows as Receiver authority |
| [`backend/src/modules/system-health/`](../../saas-boilerplate/backend/src/modules/system-health/) | DB-aware readiness and process liveness | Reuse distinction and map to `/healthz` and `/readyz` or an accepted equivalent |

### 4.2 Frontend

| Path | Responsibility | Candidate Cloud Receiver 2 disposition |
|---|---|---|
| [`frontend/app/page.tsx`](../../saas-boilerplate/frontend/app/page.tsx) | Public landing/sign-in page | Replace with the Receiver product entry point and explicit account/Connector roles |
| [`frontend/app/dashboard/page.tsx`](../../saas-boilerplate/frontend/app/dashboard/page.tsx) | Minimal protected dashboard | Replace with organizations, Host keys, Connector devices, consent, and delivery views |
| [`frontend/components/layout/AppLayout.tsx`](../../saas-boilerplate/frontend/components/layout/AppLayout.tsx) | Sidebar, account display, navigation, logout, theme | Reuse layout and UI primitives; remove links whose pages do not exist and avoid presenting unsupported flows |
| [`frontend/lib/UserContext.tsx`](../../saas-boilerplate/frontend/lib/UserContext.tsx) | Client account state and logout | Reuse only for console session state; do not use client state as authorization evidence |
| [`frontend/lib/api/client.ts`](../../saas-boilerplate/frontend/lib/api/client.ts) | Cookie fetch, refresh single-flight, retry-once, response parsing | Reuse mechanics after correcting endpoint prefixes, error extraction, and security logging |
| [`frontend/app/api/logout/route.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/frontend/app/api/logout/route.ts) | Next route proxies cookies and logout response | Review multi-cookie forwarding and keep browser session/logout semantics distinct from Connector revocation |
| [`frontend/middleware.ts`](../../saas-boilerplate/frontend/middleware.ts) | Redirects when access or refresh cookie is present | Keep only as a UX guard; valid identity and permission remain backend decisions |
| [`frontend/next.config.ts`](../../saas-boilerplate/frontend/next.config.ts) | Standalone build and Google avatar image allowlist | Reuse build shape; update allowed origins and public runtime configuration deliberately |

### 4.3 Packaging and operations

- [`package.json`](../../saas-boilerplate/package.json) defines the workspace and combined development
  command.
- [`docker-compose.yml`](../../saas-boilerplate/docker-compose.yml) starts PostgreSQL, backend, and
  frontend with dependency healthchecks, loopback-only published ports, memory limits, and rotated
  JSON logs.
- [`backend/Dockerfile`](../../saas-boilerplate/backend/Dockerfile) builds TypeScript, copies Drizzle
  migrations, and runs `entrypoint.sh` as a non-root user.
- [`frontend/Dockerfile`](../../saas-boilerplate/frontend/Dockerfile) builds with a
  `NEXT_PUBLIC_BACKEND_URL` build argument and runs the Next standalone server as a non-root user.
- [`backend/entrypoint.sh`](../../saas-boilerplate/backend/entrypoint.sh) runs migrations before the
  backend listener starts.

These are useful patterns, not deployment evidence for Cloud Receiver 2. The current project still
has separate deployment, identity, storage, TLS, recovery, and external-readback gates.

## 5. Actual backend behavior

### 5.1 Startup and request flow

```text
container start
  -> node dist/db/migrate.js
  -> node dist/index.js
  -> createApp()
       -> Helmet
       -> one configured CORS origin + credentials
       -> JSON body parser + cookie parser
       -> Passport initialization and strategy registration
       -> root routes (/ and /health)
       -> current /v1 router
       -> deprecated unversioned router
       -> 404 envelope
       -> four-argument 500 error handler
```

All route modules are expected to wrap asynchronous work in `asyncHandler`. The wrapper forwards a
rejected promise to Express instead of allowing an Express 4 async rejection to become an unhandled
process failure.

### 5.2 HTTP surface

| HTTP path at the reviewed commit | Auth/role | Meaning |
|---|---|---|
| `GET /` | Public | Plain-text backend-running response |
| `GET /health` | Public | Readiness-style check; executes `SELECT 1` and returns `503` with `DB_UNAVAILABLE` when the database is unreachable |
| `GET /health/live` | Public | Liveness-style check; does not touch the database |
| `GET /v1/auth/google` | Public, rate-limited | Starts Google OAuth |
| `GET /v1/auth/google/callback` | Google callback | Links or creates the user, sets cookies, and redirects to the frontend dashboard |
| `POST /v1/auth/refresh` | Refresh cookie, rate-limited | Rotates the refresh token and sets a new access/refresh pair |
| `GET /v1/auth/me` | JWT cookie or bearer token | Reads the current user from the database and returns a public projection |
| `POST /v1/auth/logout` | No JWT guard | Revokes the presented refresh token and clears both cookies |
| `GET /v1/users` | JWT + `admin` minimum | Lists up to 100 public users, newest first |
| `/auth/*` and `/users` | Same handlers, deprecated | Unversioned compatibility aliases with `Deprecation` and `Warning` headers |

Health is deliberately outside `/v1`. The unversioned compatibility mount is broad; it also exposes
the auth and users routers at their old paths. Cloud Receiver 2 should not inherit this path ambiguity
without an explicit migration reason.

### 5.3 Session and credential flow

```text
Google callback
  -> userService.findOrCreateByGoogleProfile()
  -> JWT access token: sub + username, default 15-minute expiry
  -> random refresh token, SHA-256 hash stored in RefreshToken
  -> httpOnly token + refresh_token cookies

Frontend request returns 401
  -> one shared POST /auth/refresh promise
  -> successful refresh retries the original request once
  -> refresh failure throws "Session expired"
```

Cookie defaults are `httpOnly`, `sameSite: "lax"`, `path: "/"`, and `secure` in production. An
optional `COOKIE_DOMAIN` is required when the API and frontend are on separate subdomains. The JWT
strategy reads the access cookie first and then an `Authorization: Bearer` header, re-queries the user
by `sub`, and attaches the current database-backed public user to `req.user`.

Refresh-token reuse revokes all still-live refresh tokens for that user and clears both cookies. The
current code revokes the old token and inserts the new token in separate operations without an
explicit transaction or compare-and-set fence; concurrent refresh requests therefore need a focused
race test before this pattern is trusted for Receiver credentials.

### 5.4 Data model

The current Drizzle schema contains only two tables:

```text
UserAccount
  id, email, displayName, avatarUrl, role, googleSubjectId, createdAt, updatedAt

RefreshToken
  id, userId, tokenHash, expiresAt, revokedAt, createdAt
```

The schema uses PostgreSQL table and column names explicitly, UUID application defaults, a foreign
key from refresh tokens to users, and indexes for user ownership, token expiry, and account creation.
It does not contain organizations, Host keys, Host subjects, consent sessions, Grants, events,
Connector identities, delivery leases, attempts, acknowledgements, or managed-context bindings.

## 6. Actual frontend behavior

```text
Next middleware sees a protected path
  -> if neither token nor refresh_token cookie exists, redirect to /
  -> otherwise allow the request through

UserProvider mounts without initialUser
  -> apiFetch("/auth/me")
  -> backend validates the token and returns PublicUser
  -> any failure clears client user state

AppLayout
  -> while loading, show spinner
  -> without user, client-side redirect to /
  -> with user, render sidebar and page
```

The middleware checks only cookie presence. It does not verify signatures, expiry, account status,
organization membership, or Receiver authority. The backend is the actual authentication boundary.
The React Query provider is installed, but the reviewed frontend contains no feature query using it.
The settings and notifications links are protected in middleware and rendered in navigation, but no
corresponding pages are present in the reviewed tree.

The API client has a useful single-flight refresh mechanism, but it reads the backend URL from a
build-time public environment variable and defaults to `http://localhost:4000`. The logout proxy
forwards the backend's `Set-Cookie` header through one Next response header; multiple-cookie behavior
must be verified before using it for several Receiver session or revocation cookies.

## 7. Verified source/documentation drift and adaptation risks

These are observations from the reviewed commit, not new product decisions.

| Severity | Finding | Evidence | Cloud Receiver 2 implication |
|---|---|---|---|
| High | Frontend middleware logs all cookies | [`frontend/middleware.ts`](../../saas-boilerplate/frontend/middleware.ts) calls `req.cookies.getAll()` in `console.log` | Remove before any environment that carries session or Connector-adjacent credentials |
| High | JWT guard logs authentication info and the authenticated public user | [`backend/src/modules/authentication/passport.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/modules/authentication/passport.ts) logs `info` and `user` | Design secret-free, identity-minimized logs; do not copy this behavior into Receiver ingress |
| High | Debug request logging can inspect bodies and decoded bearer payloads | [`backend/src/middleware/logger.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/middleware/logger.ts) | Keep disabled by default and replace with bounded correlation/error codes before production use |
| High | Refresh rotation is not visibly atomic | [`backend/src/modules/authentication/auth.controller.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/modules/authentication/auth.controller.ts) reads, then updates, then inserts | Add transaction/serialization semantics or explicitly accept a narrower console-session claim; never reuse it for Grant or Connector authority without proof |
| Medium | The authentication README documents a `POST /dev-mode` endpoint and `devMode`, but the reviewed routes, controller, schema, and shared type do not contain them | [`backend/src/modules/authentication/README.md`](../../saas-boilerplate/backend/src/modules/authentication/README.md), [`backend/src/modules/authentication/auth.routes.ts`](../../saas-boilerplate/backend/src/modules/authentication/auth.routes.ts), [`shared/index.d.ts`](../../saas-boilerplate/shared/index.d.ts) | Treat code at the pinned commit as source of truth; refresh module docs before reuse |
| Medium | The users README describes Prisma and `toggleDevMode`, while the code uses Drizzle and has no such method | [`backend/src/modules/users/README.md`](../../saas-boilerplate/backend/src/modules/users/README.md), [`backend/src/modules/users/user.service.ts`](../../saas-boilerplate/backend/src/modules/users/user.service.ts) | Do not copy stale module documentation or infer a missing account capability |
| Medium | The system-health README presents one generic health endpoint, while code distinguishes DB-aware `/health` and DB-free `/health/live` | [`backend/src/modules/system-health/README.md`](../../saas-boilerplate/backend/src/modules/system-health/README.md), [`backend/src/modules/system-health/health.routes.ts`](../../saas-boilerplate/backend/src/modules/system-health/health.routes.ts) | Preserve the readiness/liveness distinction and document the exact Receiver route names |
| Medium | The root README advertises Zod request validation and public-write rate limiting, but the reviewed routes do not consume `validateBody` or `publicWriteRateLimiter` | [`backend/src/middleware/validate.ts`](../../saas-boilerplate/backend/src/middleware/validate.ts), [`backend/src/middleware/rateLimiter.ts`](../../saas-boilerplate/backend/src/middleware/rateLimiter.ts), route files | A helper existing is not proof that an endpoint is protected; test each Receiver input and limiter at the route |
| Medium | Logout has no JWT guard and revokes only the supplied refresh token; an access token remains valid until expiry | [`backend/src/modules/authentication/auth.routes.ts`](../../saas-boilerplate/backend/src/modules/authentication/auth.routes.ts), [`backend/src/modules/authentication/auth.controller.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/modules/authentication/auth.controller.ts) | Keep console logout separate from immediate revocation of Host, Connector, or consent credentials |
| Medium | A development token script prints a seven-day JWT | [`backend/src/scripts/mint-token.ts`](https://github.com/4xeoz/saas-boilerplate/blob/e6eb759/backend/src/scripts/mint-token.ts) | Keep development-only tooling out of production package and deployment paths |
| Low | Frontend navigation contains protected `/settings` and `/notifications` routes without pages | [`frontend/components/layout/AppLayout.tsx`](../../saas-boilerplate/frontend/components/layout/AppLayout.tsx), [`frontend/middleware.ts`](../../saas-boilerplate/frontend/middleware.ts) | Replace generic navigation with only implemented, evidence-backed Receiver views |

## 8. Proposed Cloud Receiver 2 boundary

This is a working proposal for the next architecture decision, not accepted canonical behavior.

```text
                         signed Manifest/Event
Host backend  ----------------------------------------------+
   owns business truth, keys, and effect verification         |
                                                               v
Browser console -- account session --> SaaS/Next + Express control shell
Browser consent -- one-time bounded token --------------------+
                                                               |
Connector ----- outbound poll/claim/ack -----------------------+
                                                               v
                         Cloud Receiver adapter
                               |
                               +--> Re-entry Core authority
                               +--> Receiver-owned relational state
                               +--> operational readiness and audit-safe logs
```

Boundary rules to carry into the ADR review:

1. The Host retains business truth, Host signing-key custody, business-effect verification, and
   organization scope.
2. The browser receives only the minimum short-lived consent material needed for a user gesture; it
   does not receive organization keys, Host private keys, Connector bearer credentials, or private
   managed-context locators.
3. The Connector is an outbound client. It can claim and acknowledge authorized delivery but cannot
   create Grants, reinterpret Host events, or widen a continuation scope.
4. Re-entry Core remains the authority for Manifest, consent/Grant, event, replay, delivery lease,
   acknowledgement, and human-boundary semantics.
5. Console account sessions, organization API keys, Host signing keys, consent tokens, and Connector
   credentials are separate credential classes with separate storage, rotation, revocation, and
   log-redaction rules.
6. A Cloud Receiver HTTP response must distinguish accepted event, queued delivery, activation,
   Host effect, and acknowledgement. A successful HTTP response alone is not workflow success.

### Candidate module map

The following names describe responsibilities, not files to create yet:

```text
backend/src/modules/
  authentication/     console account session and identity
  organizations/      account-owned organization and API-key control
  host-integration/   public Host-key registration and signed Host ingress
  connectors/         account pairing, device authorization, token verification, and delivery target
  consent/            Re-entry-owned consent session and opaque binding handoff
  receiver/           explicit adapter to Core Grant/event/delivery authorities
  system-health/      liveness, readiness, and bounded operational diagnostics
```

The adapter should be the only backend layer that composes HTTP input with Core authority ports. A
generic `UserService` must not become a second Receiver authority by convenience.

## 9. Data adaptation map

The boilerplate's two-table schema is insufficient for the current Cloud Receiver contract. The
existing project has already documented a broader native relational model; any move from the current
Prisma preview to Drizzle is a durable persistence decision and requires an accepted ADR and
migration plan.

| Responsibility | Existing Cloud Receiver concept | Boilerplate gap |
|---|---|---|
| Console identity | Re-entry account, session, organization, API key | `UserAccount` has no organization or account-session model equivalent to current Receiver needs |
| Connector control | Connector, pairing request/session, device authorization, delivery target | No device or token lifecycle tables |
| Host trust | Organization-scoped Host signing key and Host subject link | No public-key registration or subject binding |
| Consent | Challenge, consent session, decision, opaque binding | No consent or browser handoff state |
| Receiver authority | Grant, event, replay/acceptance record | No protocol state or signature/replay model |
| Delivery | Delivery, state, lease, attempt, effect attestation, acknowledgement | No queue, lease, attempt, or acknowledgement model |
| Compatibility | Legacy snapshot/backfill state if retained | No migration boundary for existing Receiver preview data |

Minimum persistence questions before implementation:

- Will one Postgres database hold console and Receiver tables, with ownership and access separated by
  module, or will persistence remain split?
- Will Drizzle replace the current Prisma adapter, or will the boilerplate be used only for the
  console while the Receiver adapter retains its current persistence path?
- Which transitions require one database transaction, advisory lock, compare-and-set, or an outbox?
- Which values are stored as hashes/digests only, and which public values may be returned to a Host or
  browser?
- What is the migration and rollback path for existing preview state without deleting the retained
  snapshot table prematurely?

## 10. Staged rebuild plan

### Stage 0 — Accept the boundary

Create or update the owning ADR before behavior changes. Decide whether the boilerplate is:

- the new Cloud Receiver repository base;
- only the console shell;
- a vendored reference; or
- a temporary migration workspace.

The decision must also name the persistence owner, process topology, identity model, and route
versioning policy. Until then, this study remains supporting research.

### Stage 1 — Documentation and source placement

Reconcile the boilerplate README and module READMEs against the pinned code. Record the exact
Cloud Receiver 2 file layout, ownership, non-goals, and source-of-truth links. No behavior change is
needed for this stage.

### Stage 2 — Shell extraction

Retain the narrow operational patterns that already have real consumers: configuration validation,
async error forwarding, DB pool error handling, health/readiness, graceful shutdown, Docker build
shape, and explicit API versioning. Remove or replace generic routes, unsafe logs, unused helpers, and
stale UI navigation as part of a bounded implementation task.

### Stage 3 — Console identity and control plane

Implement only the accepted account/session, organization, Host-key, and Connector control flows.
Keep console authentication separate from Host organization credentials, consent tokens, and
Connector credentials. Add focused replay, revocation, expiry, ownership, and cross-account tests.

### Stage 4 — Core adapter and persistence

Map versioned HTTP inputs to existing Core authority interfaces. Make the persistence mapping explicit
and prove duplicate, conflicting, stale, revoked, and storage-failure behavior. Do not duplicate
protocol logic inside Express controllers.

### Stage 5 — Connector delivery

Add the outbound claim/lease/acknowledgement path and prove one authorized Connector, stale-worker
fencing, lease expiry, acknowledgement loss, and bounded retry behavior. A generic background queue is
not a substitute for the current delivery contract.

### Stage 6 — Console and consent UX

Replace the generic Next landing/dashboard with the smallest real Receiver console. Keep browser
consent presentation separate from the account dashboard and preserve the human decision boundary.

### Stage 7 — Deployment and external proof

Only after local, process, and runtime checks pass should the exact source, configuration, database
migration, HTTPS ingress, identity, recovery, and external readback be verified. A successful Docker
build or health response does not prove a deployed Cloud Receiver.

## 11. Verification plan for the eventual implementation

This research record remains a static architecture study. The nested clone now has focused evidence
for its bounded auth slice; before a full Cloud Receiver 2 implementation is called complete, the
minimum evidence ladder should include:

1. Static: pinned source tree, reconciled docs, explicit module ownership, and secret-free package
   surface.
2. Focused: account/session, organization ownership, Host-key verification, consent, event, delivery,
   revocation, and persistence tests.
3. Aggregate: boilerplate/backend typecheck, frontend lint/build, Receiver Core verification, and the
   complete Cloud Receiver test suite on Node 24.
4. Process: independent Host, Receiver, Connector, restart, stale-worker, and shutdown checks.
5. Runtime: real local HTTP, browser consent, outbound Connector, database restart/migration, and
   visible Host-effect evidence.
6. External: deployment identity, HTTPS, configuration, durable restart, and clean-environment
   readback.

No stronger claim follows from this document. In particular, this study does not prove the full Cloud
Receiver 2 protocol, production readiness, public deployment, a supported Agent wake path,
Browser/WebMCP join, selected application value, judge reproduction, or submission.

## 12. Next gate

The boilerplate is now accepted as the Cloud Receiver 2 base for the bounded first slice in
`saas-boilerplate/`: Prisma persistence, separate user/developer email-password accounts, and
separate pages. Its README and Prisma schema are authoritative for that nested clone. Any future
Receiver protocol, organization, connector, consent, or cross-layer behavior still needs its own
decision record before implementation.
