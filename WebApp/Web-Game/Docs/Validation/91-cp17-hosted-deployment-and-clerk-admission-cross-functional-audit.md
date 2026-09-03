# CP-17 Hosted Deployment and Clerk Admission Cross-Functional Audit

**Status:** BOUNDED HOSTED DEPLOYMENT VERIFIED; FULL CP-17 REMAINS OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Does the deployed Railway/Clerk boundary now provide a truthful public Game entry point without
weakening the server-authoritative or invite-only contract?

**Verdict:** Yes for the bounded deployment surface. Railway runs the exact Game source with the
production Volume and returns the existing ready health contract on both generated and custom HTTPS
origins. Clerk Production DNS, SSL, and JWKS are live, the hosted page loads the invite-only
Username/Password modal, and the superseded secret was revoked after rotation. This is a level-4
hosted process and entry-surface result; it is not `hosted_verified` because authenticated two-player
scope, command/WebSocket admission, no-browser progression, durable restart, and recovery have not
yet been executed.

## Evidence reviewed

- [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md): Railway deployment `218112db-21b0-4c49-8758-50e02dc6352c`, public health readback, Clerk CLI `complete` status, JWKS `200`, browser sign-in modal, secret rotation, and old-key revocation.
- [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md): accepted one-service/one-Volume Railway topology and pre-deployment configuration.
- [`SK-EVID-064`](../Evidence/SK-EVID-064-cp17-clerk-client-admission-contract.md): local Clerk client gate and production missing-key behavior.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one supervised Node process, one SQLite writer, one persistent Volume, and two invite-only identities.
- Railway runtime logs: Node `v24.19.0`, `/data` mount, `npm run start`, and `SUCCESS` deployment state.
- Clerk production status: `dns=complete`, `ssl=complete`, `mail=complete`, no pending DNS records, and the expected production instance ID in the JWKS response.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | Railway deployment and custom Game certificate are valid | The canonical `game.sleepless-kingdom.com` origin can serve the health contract over HTTPS | Keep the custom origin as the canonical `CLERK_AUTHORIZED_PARTIES` value and preserve generated-domain fallback only as an operational readback, not an auth shortcut |
| Resolved | Clerk custom domain initially stayed in DNS/SSL pending until all five CNAMEs were present and the provider check completed | Clerk Frontend API could not load while certificate issuance was incomplete | The three email CNAMEs are now present; this does not enable email sign-in, and Clerk CLI reports complete provisioning |
| Resolved | A new named Clerk secret was installed before the replacement deployment and the old `default` key was deleted | Backend secret rotation no longer depends on a possibly exposed key | Keep secret values only in Railway/Clerk secret surfaces; never copy them into docs, logs, or chat |
| High | The hosted browser was verified only to the signed-out Username/Password modal | Clerk script and presentation are proven, but provider session issuance and server subject mapping are still unproven | Run one clean Player A sign-in and one clean Player B sign-in, then capture redacted session/bootstrap readback |
| High | No authenticated HTTP command or `/realtime` upgrade was exercised | Page reachability does not prove server-derived scope, cross-player denial, or WebSocket parity | Execute the A1-A10 hosted admission rows with both identities and a deliberate cross-scope attempt |
| High | No browser-free progression, restart, or SQLite readback was executed | A ready process does not prove continuous world time, durable bootstrap, event/outbox replay, or reconnect continuity | Stop/preserve the first failure during a no-browser interval, service restart, and same-volume readback |
| Medium | Railway plan/region, backup receipt, rollback artifact, and replica readback were not included in this run | Operational continuity and recovery claims remain incomplete | Record the provider settings and a disposable backup/restore or schema-compatible rollback rehearsal before closure |
| Medium | The external Eddy Receiver/Local Connector handoff remains separate | A public Game URL cannot be treated as Agent delivery or Re-entry proof | Bind the final canonical origin only after `SK-TASK-076` accepts the exact protocol-v0.2 handoff |

## Cross-functional chain check

```text
Clerk Production DNS/SSL/JWKS
  -> Clerk client script and invite-only sign-in surface
  -> server session verification and provider-subject map
  -> server-derived player/shelter/world scope
  -> HTTP command and /realtime admission
  -> worker-owned world time and SQLite Volume
  -> restart/reconnect/backup continuity
  -> Eddy binding and Re-entry delivery
```

The first two links are verified by this audit. The remaining links remain explicitly gated. No
client-provided player, shelter, world, fixture cookie, browser heartbeat, or generated fallback was
used to turn a missing link into apparent success. The custom Game origin and Clerk Frontend API are
both under the same root domain, while the server remains the authority for Game ownership and world
scope.

## Minimum next verification

Use two clean browser contexts or an equivalent provider-supported isolation method. For each
pre-created account, prove Clerk session issuance, `/api/game/bootstrap`, one valid command, one
cross-scope rejection, and `/realtime` admission. Then leave the browser disconnected while the
worker advances, restart the Railway service, read back the same world/cursor/Volume state, and
record the recovery/rollback receipt. Keep the first unauthenticated or persistence failure intact;
do not enable fixture mode or add a second scheduler.

## Claim limits and reopen triggers

This audit supports the bounded hosted deployment and public entry-surface result at ladder level 4.
It does not support `hosted_verified`, authenticated two-player gameplay, continuous-world
continuity, WebMCP dynamic action, Re-entry, Eddy delivery, or judge reproduction. Reopen if the
canonical origin, Clerk instance/key, Railway deployment, Volume, process topology, auth contract,
or external Receiver binding changes.
