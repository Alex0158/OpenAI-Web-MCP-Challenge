# SK-EVID-063: CP-17 Railway Resource Provisioning Preflight

## Identity

- Evidence ID: `SK-EVID-063`
- Related task, issue, or decision: [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md), [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `static`
- Ladder level: `1`
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, source snapshot `f4ddfe4` with the evidence-only refresh in `9ffe446`; CP-17 implementation is committed locally and has not been used to claim a hosted deployment
- Contract version: `SK-MVP-0.2`
- Runtime versions: Railway MCP readback; no Game process or browser runtime was started
- Fixture world and seed: none; no database was created or opened by the hosted service
- Environment and configuration: Railway workspace `Chon Wang Wong(Alex)'s Projects`, project `sleepless-kingdom`, environment `production`

## Objective and claim boundary

- Behavior under test: Provision the smallest Railway resource topology accepted by `ADR-GAME-0037`: one Game service, one persistent Volume, one generated HTTPS service domain, and production-safe non-secret configuration.
- Claim this evidence may support: The named Railway project, production environment, `game` service, `game-data` Volume mounted at `/data`, generated service domain, service start/health/restart/sleep settings, and eight non-secret production variables existed at the readback time.
- Claims this evidence cannot support: A successful build or deployment, service health, Clerk session issuance, identity mapping, world bootstrap, SQLite persistence, restart catch-up, backup/restore, WebSocket behavior, Re-entry delivery, or judge reproduction.

## Preconditions and fixture

- Starting state: Railway account was authenticated; read-only discovery showed no existing Sleepless Kingdom/Game project among the seven accessible projects.
- Synthetic identities and seeded actors: none. No Clerk secret, JWT key, or player subject was created or stored.
- Real, fake, and stubbed boundaries: Railway project/service/Volume/domain and configuration readbacks were real provider state; the Game source and Clerk admission remained undeployed.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Create project `sleepless-kingdom` in the personal workspace | One production environment is returned | Project `1665d76d-5b6b-45cc-a555-161cdd2c1e01`; environment `6f1f545d-5fcc-4d01-b4b8-f7d7abda914e` | **pass** |
| Create empty service `game` in production | One service exists without an accidental second database or replica | Service `a6ba17a4-7e9e-4878-9028-477673cb4ed1`; no deployment exists | **pass** |
| Create and attach `game-data` Volume at `/data` | The one service has one persistent mount | Volume `8a1b1250-b360-425f-9525-91a173476418` attached to `game` at `/data` | **pass** |
| Configure service | The next deployment uses the intended process boundary | `npm run start`, healthcheck `/api/health` (30s), restart policy `ALWAYS`, sleep disabled, one `us-west2` replica | **pass** |
| Set non-secret production variables with deploy skipped | Production fails closed until identity secrets exist | `NODE_ENV=production`, `HOST=0.0.0.0`, `GAME_DB_PATH=/data/world.sqlite`, `GAME_AUTH_PROVIDER=clerk`, `AUTONOMOUS_WORLD_MODE=1`, `LOCAL_FIXTURE_MODE=0`, `GAME_WORLD_ID=sleepless-mvp-01`, and the generated HTTPS party were present by name | **pass** |
| Generate and list service domain | One stable HTTPS endpoint is available for later Clerk authorized-party and browser checks | `https://game-production-a0f1.up.railway.app` | **pass** |
| Read project status and latest deployment | Hosted runtime should be observable before claiming deployment | Service has no latest deployment and no runtime status | **gated** |

## Assertions

- Player-visible state: not applicable; no hosted page was served.
- Command and failure contract: not exercised; production command admission remains gated on Clerk credentials.
- Persistence, event, and outbox state: not exercised; the Volume is provisioned but no Game database exists.
- Exactly-once settlement after duplicate delivery and replay: not exercised.
- Ownership denial, stale revision, restart, and reconnect: not exercised.

## Analysis and closure

- Failure classification: `environment` for the missing Clerk Production credentials and fixed subject bindings required by the fail-closed production config; no application failure was observed because no deployment was attempted.
- Limitations and residual risk: Railway plan, region suitability, deployment source/build identity, Clerk instance and session issuance, secret presence, Volume backup/restore, process restart, HTTP/1.1 WebSocket upgrade, and hosted world continuity remain unknown. The local CP-17 implementation is committed in `14df10a` and `f4ddfe4` but is not deployed.
- Invalidation triggers: Project/service/Volume replacement, canonical URL change, service configuration change, provider plan/region change, source commit change, or any Clerk identity/contract change.
- Exact conclusion: The accepted Railway resource topology is provisioned and read back at ladder level 1. The Game remains undeployed and cannot claim hosted continuity until Clerk Production credentials and the two fixed provider subjects are supplied, the CP-17 source is deployed, and the hosted acceptance matrix passes.
