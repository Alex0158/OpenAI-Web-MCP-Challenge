# SK-EVID-065: CP-17 Hosted Deployment and Clerk Domain Runtime Verification

## Identity

- Evidence ID: `SK-EVID-065`
- Related task, issue, or decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `hosted`
- Ladder level: `4`
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, HEAD `5594397`, with the pre-existing collaborator-owned documentation and `next-env.d.ts` working-tree changes preserved; deployment ID `218112db-21b0-4c49-8758-50e02dc6352c` was built from the exact Game working tree supplied to Railway
- Contract version: `SK-MVP-0.2`
- Runtime versions: Railway runtime Node.js `v24.19.0`; local Railway/Clerk CLI Node.js `v24.13.1`; Codex In-app Browser session for the hosted page
- Fixture world and seed: no fixture cookie or fixture mode; the hosted service was configured with `GAME_DB_PATH=/data/world.sqlite`, `LOCAL_FIXTURE_MODE=0`, and `AUTONOMOUS_WORLD_MODE=1`
- Environment and configuration: Railway project `sleepless-kingdom`, production environment, one `game` service, `game-data` Volume at `/data`; Clerk Production instance `ins_3IpEnUbze5gSxLafutN3bNweJ0t`; canonical Game origin `https://game.sleepless-kingdom.com`

## Objective and claim boundary

- Behavior under test: Deploy the production-like Game source with the owner-approved Railway single-writer topology, activate the Clerk Production custom domain, and prove the public health, Clerk JWKS, and signed-out admission surfaces are reachable over HTTPS.
- Claim this evidence may support: The named Railway deployment reached `SUCCESS`; the Railway generated and custom Game domains returned the ready health contract; the Clerk Production custom domain completed DNS/SSL/mail provisioning; the hosted page loaded the Clerk invite-only sign-in modal; the new secret was installed through Railway's secret variable surface and the superseded `default` secret was revoked.
- Claims this evidence cannot support: A successful password sign-in or Clerk session cookie, two independent authenticated browser identities, authenticated HTTP/WebSocket commands, no-browser worker progression, SQLite/world persistence across restart, backup/restore, rollback, Cloud Receiver/Local Connector delivery, WebMCP dynamic action, judge reproduction, or `hosted_verified` closure.

## Preconditions and fixture

- Starting state: Railway resources and non-secret production variables were already read back under [`SK-EVID-063`](SK-EVID-063-cp17-railway-resource-provisioning-preflight.md). The owner had created the two invite-only Clerk Production usernames (`player1` and `player2`) and completed the provider verification step.
- Synthetic identities and seeded actors: No synthetic auth identity was used. The Clerk Production instance contains the two owner-provisioned usernames; their password values were never read or written to project artifacts.
- Real, fake, and stubbed boundaries: Railway deployment, persistent Volume attachment, Namecheap DNS, Clerk Production domain/API key state, Clerk JWKS, and the hosted browser page were real boundaries. No fixture resolver, fixture cookie, fake provider, or local transport stub was used for the hosted checks.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Set `CLERK_SECRET_KEY` by piping the newly rotated Clerk key through stdin to `railway variable set ... --skip-deploys` | The secret variable is replaced without printing its value | Railway returned `{"keys":["CLERK_SECRET_KEY"],"set":true}`; the value was not emitted | **pass** |
| Deploy the exact Game source with `railway up --detach --json --message "rotate Clerk production secret"` | One production deployment builds and starts the supervised service | Deployment `218112db-21b0-4c49-8758-50e02dc6352c` reached `SUCCESS`; build completed and runtime logs showed volume mount, container start, and `npm run start` | **pass** |
| Read Railway status and custom-domain status | The latest service is successful and the custom domain has propagated DNS and a valid certificate | `game` latest deployment is `SUCCESS`; `game.sleepless-kingdom.com` is verified with `CERTIFICATE_STATUS_TYPE_VALID` and propagated CNAME | **pass** |
| `curl -sS -i https://game-production-a0f1.up.railway.app/api/health` and `curl -sS -i https://game.sleepless-kingdom.com/api/health` | Both public origins return the process health contract | Both returned HTTP `200` with `status=ready`, `live=true`, `ready=true`, and Node `v24.19.0` | **pass** |
| Add the three Clerk email DNS CNAMEs required by Clerk's production provisioning check and run `npx clerk deploy status --wait` | Clerk reports complete DNS, SSL, and mail provisioning | `complete=true`, `state=complete`, `dns=complete`, `ssl=complete`, `mail=complete`, and no pending DNS records | **pass** |
| `curl -sS -i https://clerk.sleepless-kingdom.com/.well-known/jwks.json` | The production Frontend API custom domain serves the instance JWKS over valid TLS | HTTP `200`; response identified Clerk instance `ins_3IpEnUbze5gSxLafutN3bNweJ0t` | **pass** |
| Open `https://game.sleepless-kingdom.com` in the Codex In-app Browser and select `Sign in to play` | The hosted page shows the invite-only Clerk sign-in surface without a client-selected Game identity | Page title `Sleepless Kingdom`; the Username/Password modal rendered; a fresh post-certificate load produced no new browser error | **pass** |
| Delete the superseded Clerk `default` secret after the new deployment | Only the named rotated consumer key remains active | The Clerk API-key list retained `railway-production-2026-09-03` and no longer listed `default`; no key value was recorded | **pass** |

## Assertions

- Player-visible state: The public page is reachable and presents the intended invite-only sign-in modal. A password was not entered during this run, so no signed-in Game surface is asserted.
- Command and failure contract: No authenticated command was sent. The deployment retained production configuration and did not enable fixture admission.
- Persistence, event, and outbox state: The `/data` Volume was attached and the process reported ready; world bootstrap, event cursor, outbox, and SQLite replay were not read back from a restart rehearsal.
- Exactly-once settlement after duplicate delivery and replay: not exercised.
- Ownership denial, stale revision, restart, and reconnect: not exercised; two-identity scope, command denial, WebSocket admission, and reconnect remain the next hosted checks.

## Analysis and closure

- Failure classification: `unknown` for the unexecuted authenticated and recovery rows; no deployment, TLS, DNS, or page-load failure remained after certificate provisioning.
- Limitations and residual risk: The browser smoke test stopped at the sign-in form because credentials were intentionally not handled by Codex. Hosted worker progression without a browser, durable world identity after restart, backup/restore, rollback, two-session isolation, and the Eddy handoff still require a separate controlled rehearsal.
- Invalidation triggers: Railway deployment replacement, source or contract change, environment-variable change, Clerk domain/key rotation, DNS/TLS change, Volume replacement, or a changed canonical origin.
- Exact conclusion: The production Game endpoint, Railway runtime health, Clerk Production DNS/SSL/JWKS surface, invite-only sign-in UI, secret rotation, and old-key revocation are verified at a bounded hosted level-4 scope. CP-17 remains `in_progress`; this record does not claim authenticated hosted gameplay or `hosted_verified` closure.
