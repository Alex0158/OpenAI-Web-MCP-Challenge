# SK-TASK-078: CP-17 Production Identity and Hosted Admission

## Task Control

- Lifecycle state: `in_progress`
- Closure type: `hosted_verified`
- Checkpoint: `CP-17`
- Owner: Game owner
- Current increment: The owner-approved Railway persistent-volume + SQLite + Clerk direction is implemented at the local production-like boundary, the minimal invite-only Clerk client admission shell is contract-verified, and the first Railway project, service, Volume, domain, and non-secret production configuration have been provisioned and read back. No Game deployment or Clerk secret has been applied.
- Next gate: Supply the Clerk Production verification material and two fixed provider subjects, deploy
  the exact Game source, then record project/plan, mount, public URL, Clerk session issuance, restart,
  backup, and rollback readback before any hosted claim.

## Identity

- Task ID: `SK-TASK-078`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: This task crosses production identity, player/shelter/world scope, HTTP and WebSocket admission, default-world bootstrap, durable hosted storage, process supervision, secrets, restart recovery, and the hosted evidence boundary.

## Objective

Implement and prove the production admission boundary for the two-player hackathon world: two
manually provisioned, invite-only Clerk identities resolve to stable Game players on one Railway-hosted
authoritative world, while unauthenticated, unknown, cross-player, degraded, and fixture-only paths
fail closed. The first MVP store is SQLite on one Railway persistent volume; PostgreSQL remains a
future adapter decision rather than an implementation prerequisite.

The target is one supervised Node.js 24 service with the existing page/worker authority, one attached
Railway volume mounted at an explicit database path, and Clerk Production invite-only authentication.
The provider topology is recorded in [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md);
external account, secret, domain, and deploy changes remain a later gate.

## Success and non-goals

- Success: Exactly two pre-created accounts are admitted as `player-a` and `player-b`; public signup,
  anonymous gameplay, and client-selected player identity are unavailable.
- Success: A server-side mapping binds the verified provider subject to one Game `player_id`,
  `shelter_id`, and `world_id`. The mapping is used consistently by page requests, typed HTTP
  commands, and the `/realtime` WebSocket upgrade; no browser input can replace it.
- Success: Both independent identities can reconnect to the same durable world and retain their
  player/shelter scope. A valid Player A command cannot mutate Player B, and an unknown or revoked
  identity produces a typed admission failure without a state change.
- Success: Production startup has one idempotent default-world provisioning path, never reseeds a
  non-empty store, and does not enable `LOCAL_FIXTURE_MODE` or fixture cookies in production.
- Success: The selected host keeps one authoritative worker alive without a browser, preserves the
  existing world-clock and event/outbox contracts across ordinary restart, and exposes truthful
  liveness, readiness, world-readiness, degraded admission, HTTPS URL, and WebSocket behavior.
- Success: A redacted hosted evidence packet proves the two-identity scope, browser absence, one valid
  and one rejected command, restart continuity, and same-world readback at the strongest level that
  was actually executed.
- Non-goals: Public registration, password recovery or account lifecycle product work, more than two
  demo players, social login expansion, multi-tenant worlds, role/permission redesign, gameplay-rule
  changes, combat/economy changes, scaling to multiple world writers, Redis or a service split without
  measured need, or public submission claims before the hosted evidence gate.
- Non-goals: Eddy's Cloud Receiver/Local Connector, Re-entry Core, RightSpot, `mvp/`, WebMCP dynamic
  action, Agent activation, external delivery acknowledgement, or any provider write before the
  separate deployment authority is granted.

## Scope and authority

- In scope: `app/` auth boundary and sign-in/admission presentation; `src/server/config.ts`,
  `src/server/entrypoint.ts`, `src/server/runtime.ts`, `src/server/health.ts`,
  `src/server/realtime-wire.ts`, `src/server/fixture-session.ts`, the production session resolver,
  `src/server/game-session.ts`, `src/server/production-bootstrap.ts`,
  `src/client/game-bootstrap.ts`, the default-world bootstrap seam, hosted-store configuration/migrations, focused auth/identity/
  bootstrap/restart tests, deployment manifest and environment contract, and task/evidence/validation
  updates owned by the Game tree.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, Eddy-owned Receiver/Local Connector/Host SDK,
  external provider projects beyond the owner-authorized Railway resource preflight, external
  credentials, DNS or TLS writes, provider billing, and unrelated dirty files.
- Allowed actions at registration: read, edit, write, and run local checks in the Game tree. The owner
  later authorized the selected Railway project/service/Volume/domain preflight; secret creation, source
  deployment, and external handoff remain separate gates after the host/topology ADR.
- Revalidate when: `SK-TASK-077` changes its host decision fields, the selected provider changes
  process/storage/WebSocket semantics, Clerk SDK or session verification semantics change, the Game
  contract or identity vocabulary changes, the canonical URL/session path changes, or Eddy's handoff
  requires a different hosted identity boundary.

## Owning authority

- Hosted operations and proof gate: [`Engineering/06-operations-and-hosting.md`](../Engineering/06-operations-and-hosting.md)
- Target stack and process boundary: [`Engineering/01-tech-stack.md`](../Engineering/01-tech-stack.md)
- Checkpoint scope and dependency: [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Normative Game contract: [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md), especially server-derived scope, snapshot, command, and persistence boundaries
- Existing runtime/auth seams: [`ADR-GAME-0011`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md), and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Host-neutral predecessor and acceptance matrix: [`SK-TASK-017`](SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md), [`SK-TASK-077`](SK-TASK-077-cp17-host-decision-and-deployment-preflight.md), and [`Scenario 17`](../Scenarios/17-cp17-hosted-continuity-fixtures.md)
- Required durable choice before provider mutation: [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md) records the owner-accepted MVP topology. It does not turn local proof into hosted truth.

## Proposed identity and deployment boundary

| Boundary | Required behavior | Forbidden shortcut |
|---|---|---|
| Account admission | Clerk Production invite-only instance with exactly two manually provisioned accounts mapped to stable Game players | Public signup, anonymous fallback, or deriving a player from a cookie supplied by the client |
| Provider subject map | Persist and validate `provider_subject -> player_id -> shelter_id/world_id` on the server | Passing `player_id`, `shelter_id`, `world_id`, or Agent binding from page input |
| HTTP commands | Verify the Clerk session before entering the existing worker gateway and return a typed rejection on missing, unknown, revoked, stale, or degraded admission | Running a command under fixture scope or mutating state before identity resolution |
| WebSocket upgrade | Verify the same server-side identity boundary before `/realtime` admission; derive scope once per connection and recheck runtime admission at message handling | Treating a fixture handle, connection id, or page URL as authentication |
| World bootstrap | Provision the named default world once, idempotently, before readiness; preserve it across restart | Reseeding every boot, choosing a world from browser input, or reporting ready with no world |
| Process topology | One supervised Node.js 24 process owns page, worker, command gateway, health, and the one world authority; one replica for the MVP | Browser heartbeat, serverless timer, unmeasured split, or multiple writers |
| Store and recovery | SQLite database on one Railway persistent volume preserves schema, snapshot, event log, outbox, clock anchor, and fixed identity map; restart resumes the same world | Ephemeral disk, multiple writers/replicas, silent data reset, or incompatible rollback |
| Public boundary | Stable HTTPS canonical URL, truthful `live`/`ready`/world-readiness, supported WebSocket upgrade, redacted logs, and explicit degraded rejection | Claiming hosted gameplay from a build log or a page that only polls |

The provider-specific ADR must confirm these fields against current official runtime contracts before
any provider mutation. Clerk verifies the external session; the Game database remains the authority for
Game ownership and world scope. The Cloud Receiver binding and Agent session are separate external
boundaries and are not inferred from the Clerk subject.

## Railway provider fact readback

The following provider facts were checked against official Railway documentation on 2026-09-03 and
are the basis for the MVP topology; they are platform facts, not proof of our account or deployment:

- Railway volumes expose a mounted absolute path to the running service, while files outside the
  volume are ephemeral. A relative application path must be mounted under the service's `/app` path
  if it is to persist. See [Using Volumes](https://docs.railway.com/volumes) and [Services](https://docs.railway.com/services).
- Railway documents that volume backups include SQLite databases and support manual or scheduled
  Daily/Weekly/Monthly backups. See [Volume Backups](https://docs.railway.com/volumes/backups).
- A volume is one-service storage and cannot be used with multiple replicas; attached-volume
  redeploys can incur brief downtime. This is why the MVP uses one process and one replica. See
  [Volume Reference](https://docs.railway.com/volumes/reference).
- Railway supports WebSockets over HTTP/1.1 upgrade and exempts established WebSocket connections
  from normal request duration/inactivity limits, while reconnect logic is still required. See
  [SSE vs WebSockets](https://docs.railway.com/guides/sse-vs-websockets) and [Networking limits](https://docs.railway.com/networking/public-networking/specs-and-limits).
- Railway's restart policy supports `Always`, `On Failure`, and `Never`, with plan limitations;
  the actual selected plan and policy remain deployment evidence. See [Restart Policy](https://docs.railway.com/deployments/restart-policy).

These facts support Railway plus a persistent SQLite volume for a two-player single-writer MVP. They
do not prove that a Railway project, volume, plan, public URL, Clerk instance, credentials, or backup
restore has been configured.

## Evidence status

- Verified: The current entrypoint disables fixture mode in production and the production-like Clerk
  composition now provisions a named world before readiness, resolves server-side identity, and uses
  the same scope for HTTP and `/realtime`.
- Verified: The local `ws` adapter exposes the server-owned session-resolver seam, while the fixture
  session and its cookie remain explicitly non-production. Local evidence still cannot claim hosted
  storage, a public endpoint, default-world continuity on Railway, or hosted gameplay.
- Verified: [`SK-TASK-077`](SK-TASK-077-cp17-host-decision-and-deployment-preflight.md) is the active
  CP-17 host-neutral preflight; it names the process, store, bootstrap, identity, health, realtime,
  URL, secret, backup, and rollback fields and forbids provider-by-assumption deployment.
- Verified: The accepted Railway resources now exist in one production environment: project
  `sleepless-kingdom` (`1665d76d-5b6b-45cc-a555-161cdd2c1e01`), service `game`
  (`a6ba17a4-7e9e-4878-9028-477673cb4ed1`), Volume `game-data`
  (`8a1b1250-b360-425f-9525-91a173476418`) mounted at `/data`, and service domain
  `https://game-production-a0f1.up.railway.app`; the readback is recorded in
  [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md).
- Verified: The Railway service is configured for `npm run start`, `/api/health`, `ALWAYS` restart,
  sleep disabled, one replica, and production-safe non-secret variables. Railway reports no latest
  deployment because the Game source has not yet been uploaded.
- Verified locally: `@clerk/nextjs@7.9.0` provides the App Router `ClerkProvider`, invite-only signed-out
  Sign in branch, signed-in UserButton/Game branch, and explicit missing-production-key state; the
  presentation contract passed in [`SK-EVID-064`](../Evidence/SK-EVID-064-cp17-clerk-client-admission-contract.md).
- Verified locally: `ensureProductionWorld` seeds a named world once, the Clerk resolver accepts only
  the configured two subjects and derives Player/Shelter/binding scope, and the production-like
  entrypoint serves `/api/game/bootstrap`, `/realtime`, and the existing typed move command without
  fixture cookies.
- Verified locally: Production Clerk configuration fails closed when the durable database path,
  autonomous worker flag, verification key, or either fixed subject binding is absent; the world cannot
  be accidentally hosted as a browser-driven or non-progressing process.
- Verification readback (2026-09-03, Node `v24.20.0`): `npm run test:cp17-admission` passed 4/4;
  `npm run typecheck`, `npm run build`, `npm run test:cp04` (6/6), `npm run test:cp12-fixture`
  (10/10), `npm run test:cp12-dispatch` (31/31), `npm run test:cp13-page-tools` (9/9), the
  documentation self-tests (22/22), and the documentation validator all passed. These are local
  production-like results and do not claim Railway or Clerk hosted operation.
- Inferred: Railway plus one persistent SQLite volume and Clerk Production invite-only admission are
  the smallest coherent two-account demonstration topology because they preserve the existing long-
  running Node/page/worker boundary without a new database adapter.
- Unknown: The provider plan and final region readback, source/build identity, Clerk production
  instance configuration, publishable/secret values and fixed subject bindings, exact hosted cookie issuance,
  exact SDK/version, subject-map persistence shape, Volume backup/restore, runtime health, restart
  catch-up, WebSocket proxy behavior, rate limits, and Eddy's final hosted session/binding handoff.
- Claim limit: Registering this task proves only that the work is bounded and actionable. It does not
  prove authentication, a hosted endpoint, always-on gameplay, Cloud Receiver delivery, or judge
  reproduction.

## Hosted preflight readback

The first provider resource setup is intentionally separated from deployment. Railway project
`sleepless-kingdom` uses the `production` environment with one `game` service and one `game-data`
Volume mounted at `/data`; the generated endpoint is
`https://game-production-a0f1.up.railway.app`. The service has a `/api/health` check, `ALWAYS`
restart policy, sleep disabled, one replica, and the production fail-closed non-secret configuration.
No source upload, build, deployment, Clerk secret, or database write has occurred. The readback and
claim boundary are recorded in [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md).

## Smallest reversible action

Keep Clerk credentials outside tracked files and add them only through Railway's secret variable
surface after the owner supplies or provisions the two invite-only identities. Deploy only the exact
Game source after the secrets are present; if any hosted fact fails, preserve the first failure and
return to this verified local seam rather than enabling fixture mode or adding a hidden fallback.

## TDD and verification budget

The implementation must use the Game test runbook's Red -> Green -> Refactor loop at each coherent
boundary. Start with focused contract tests for missing/unknown/revoked identity, exact A/B mapping,
cross-player rejection, HTTP/WebSocket parity, reconnect scope, production fixture exclusion, and
idempotent bootstrap. Add only the smallest transitive CP-17 checks required by the changed contract;
do not use a full-suite run as a substitute for hosted evidence.

## Implementation route

1. Use [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md) as
   the accepted MVP topology and keep the actual project, plan, volume, URL, and Clerk values in a
   deployment-only record.
2. Keep the server-side identity map and resolver behind the existing HTTP and WebSocket seams. Keep
   provider subjects, Game identities, and future Receiver bindings distinct and secret-free.
3. Keep the idempotent production world bootstrap and local production-like rehearsal. Prove that a
   second start preserves the world, clock, event cursor, outbox, and identity map.
4. Deploy only after the separate deployment gate is satisfied. Exercise two clean browser identities,
   one valid command, one cross-scope rejection, browser absence, restart catch-up, reconnect, and
   degraded admission against the exact canonical URL.
5. Record redacted evidence and update current status, the seam map, and the task before closure. Bind
   the hosted URL to Eddy only after the Game's own hosted identity and continuity gates pass.

## Minimum implementation acceptance matrix

| Row | Stimulus | Required result |
|---|---|---|
| A1 | Empty persistent SQLite store starts with Clerk mode | Exactly one named world is seeded before readiness; no fixture cookie is issued |
| A2 | Same store starts again | Same world, snapshot, seed, and identity bindings are loaded; no second world or reset |
| A3 | Missing, malformed, invalid, or URL-carried credential | Typed `401` admission failure; no store mutation |
| A4 | Verified token maps to an unknown or revoked Game subject | Typed `403` rejection; no store mutation (a revoked/invalid session token remains the `401` case in A3) |
| A5 | Valid subject A and valid subject B | Each receives only its server-derived `world_id`, `player_id`, `shelter_id`, and binding |
| A6 | Valid HTTP move or mission command | Existing gateway commits only under the resolved scope and returns the current contract version |
| A7 | Client-selected player/world/shelter fields | No client field is read for authority; cross-scope mutation is rejected or targets the resolved owner only |
| A8 | WebSocket upgrade with each valid/invalid session | Same admission and scope as HTTP; first `client_snapshot` is server-derived |
| A9 | Fixture route or fixture cookie in production mode | Fixture endpoint remains unavailable and no fixture identity is accepted |
| A10 | Worker runs with no browser and ordinary restart | Worker lifecycle remains browser-independent; hosted proof still requires Railway readback |

Rows A1-A9 are covered by the focused local Node 24 contract/process test. Row A10 is a hosted
rehearsal row and remains open until the actual Railway service and volume are exercised.

## Verification and closure target

- Minimum verification now: focused Node 24 admission tests, typecheck, task/index link readback,
  English-only scan of changed artifacts, and the Game documentation validators.
- Implementation verification: focused Node 24 contract tests and a local production-like process
  rehearsal for resolver, bootstrap, health, WebSocket admission, restart, and scope isolation.
- Hosted verification: CP-17 Scenario 17 at ladder level 7 with the actual provider, durable store,
  two clean identities, browser absence, restart, rollback/recovery receipt, and claim-bound evidence.
- Closure target: `hosted_verified`; if only the identity contract or local rehearsal is proven, close
  at the evidence level actually reached and leave hosted continuity open.
- Rollback or remediation: keep the last verified artifact and durable database receipt, mark the
  process not ready or degraded when identity/store/worker authority is unavailable, and roll back only
  to a schema-compatible build. Never fall back to fixture cookies, anonymous gameplay, reseeding, or a
  second world authority.

## Reopen condition

Reopen this task if the provider cannot satisfy the host-neutral acceptance matrix, Clerk admission
cannot remain invite-only and server-derived, a client can select or cross into another Game player,
the world can reseed or pause without a browser, the page and worker resolve different worlds, a
WebSocket proxy drops the accepted scope, restart duplicates or loses effects, secrets enter artifacts,
the canonical URL/session path changes, or Eddy's accepted handoff requires a different identity or
human-consequence boundary.
