# SK-TASK-079: CP-17 Authenticated Cross-Scope Denial Rehearsal

## Task Control

- Lifecycle state: `in_progress`
- Closure type: `hosted_verified`
- Checkpoint: `CP-17`
- Owner: Game owner
- Current increment: The dedicated production-like Clerk-mode HTTP regression test now proves both Player A to Player B and Player B to Player A foreign-soldier commands return the fixed 403 / NOT_OWNER response, leave the world/economy/mission/event projections unchanged, persist a rejected idempotency identity, replay the same rejection, and reject a client-supplied player_id before worker execution. The result is recorded under [SK-EVID-070](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md) and [Validation/96](../Validation/96-cp17-authenticated-cross-scope-denial-runtime-cross-functional-audit.md). A disposable read-restore compatibility rehearsal also passes through the real PersistenceStore against the hash-verified CP-17 backup, with the result recorded under [SK-EVID-073](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md) and [Validation/99](../Validation/99-cp17-read-restore-compatibility-cross-functional-audit.md); it does not claim a provider-level rollback. A 2026-09-04 signed-in browser probe confirms the supported page-evaluation context cannot provide an arbitrary authenticated request seam without reading credentials or adding a bypass.
- Next gate: Exercise the same bidirectional denial against the hosted service only if an approved authenticated request seam can preserve the real Clerk sessions. If the supported browser surface cannot provide that seam, keep the hosted row explicitly open; do not read credentials or add a production bypass. The local read-restore compatibility rehearsal is verified under [SK-EVID-073](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md); provider-level rollback remains optional and separately gated.

## Identity

- Task ID: `SK-TASK-079`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This is an authorization and persistence boundary that crosses Clerk-derived
  identity, command parsing, worker admission, mission ownership, event/idempotency records, hosted
  sessions, and the CP-17 claim ladder. The intended code change is small, but a false positive would
  undermine the game's privacy and fairness claims.

## Objective

Prove, with a real command path, that Player A and Player B can each be authenticated while a command
that names the other player's soldier is rejected as a typed ownership failure and leaves the target
player's state unchanged.

## Success and non-goals

- Success: Player A → Player B and Player B → Player A mission-command attempts return HTTP `403` with
  the existing privacy-preserving `NOT_OWNER` result shape.
- Success: The rejected request creates no mission, mission attempt, soldier revision, wallet change,
  Domain Event, or cross-shelter projection; the rejection identity is durable and an exact retry
  returns the same rejection without a second effect.
- Success: A client-supplied `player_id`, `shelter_id`, `world_id`, binding, route, or target override
  cannot select authority; strict envelopes reject such extra fields before the worker runs.
- Success: If a supported authenticated hosted seam exists, the same bidirectional result and no-change
  readback are captured against `game.sleepless-kingdom.com`. If no such seam exists, the hosted row
  remains explicitly gated rather than being simulated.
- Non-goals: Changing the ownership model, adding roles or permissions, exposing another player's
  data for testing, adding a production test endpoint, weakening Clerk admission, changing gameplay
  or economy rules, touching Eddy's Receiver/Connector, or claiming `hosted_verified` from local tests.

## Scope and authority

- In scope: `src/server/entrypoint.ts`, `src/server/game-session.ts`, `src/server/mission-service.ts`,
  `src/server/persistence/store.ts`, the strict assign-mission command envelope, the production-like
  entrypoint test harness, and Game-owned task/evidence/validation indexes.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, Cloud Receiver/Local Connector implementation,
  Clerk account lifecycle, production secrets, Railway topology, and collaborator-owned CP-14 files.
- Allowed actions: Read, edit, write, run focused tests, run the approved hosted readback, commit
  Game-owned files, and leave any unsupported hosted seam as a named residual gate.
- Revalidate when: The command envelope, server session resolver, mission ownership predicate,
  idempotency schema, HTTP route, WebSocket command surface, Clerk mapping, or hosted test tooling
  changes.

## Owning authority

- Owning task: [`SK-TASK-078`](SK-TASK-078-cp17-production-identity-and-hosted-admission.md)
- Owning contract: [`Engineering/09-mvp-contract-sheet.md#8-commands-and-page-tools`](../Engineering/09-mvp-contract-sheet.md#8-commands-and-page-tools)
- Security and hosting boundary: [`Engineering/06-operations-and-hosting.md`](../Engineering/06-operations-and-hosting.md)
- Governing decision: [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Prior hosted scope evidence: [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md)

## Evidence status

- Verified locally: The server derives the Game scope from the authenticated subject; the assign
  mission envelope has no identity fields; `MissionService` checks the player binding and soldier's
  shelter before mutation; the HTTP adapter maps ownership failure to `403`/`NOT_OWNER`.
- Verified locally: The task-owned Clerk-mode HTTP test exercises both cross-scope directions through
  the real entrypoint and confirms unchanged world, shelter, soldier, resource, mission, attempt,
  and event state, durable rejected retries, and strict rejection of client-selected `player_id`.
- Verified locally: A fresh disposable copy of the hash-verified CP-17 backup opens through the real
  PersistenceStore, passes schema and snapshot/event recovery validation, exposes the expected world,
  identity, shelter, mission, attempt, resource, and event records, and leaves the source hash unchanged
  under [SK-EVID-073](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md).
- Verified hosted: Positive independent Player A/Player B projections and scoped commands pass under
  [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md).
- Verified boundary (2026-09-04): The signed-in Codex In-app Browser exposes the live Game UI and
  capability banner, but its page-evaluation context has no callable `fetch`; no approved arbitrary
  authenticated request seam is available. No request, credential, or Game mutation was performed.
- Unknown: A deliberately forged authenticated hosted command and its typed no-mutation readback;
  direct browser automation cannot invent or inspect Clerk credentials, and the current supported
  browser surface does not expose an arbitrary authenticated request client.

## Smallest reversible action

Create one fresh temporary SQLite world and one production-like Clerk resolver with deterministic test
subjects. Send exactly two cross-scope assign-mission requests through the HTTP entrypoint, inspect
both player scopes and the event/idempotency records, then run the focused test. For hosted proof,
stop if the only route would require reading cookies, injecting a production bypass, or mutating the
live world beyond the rejected requests.

## Verification and closure target

- Minimum verification: Node 24 focused bidirectional HTTP test, strict envelope test, typecheck,
  affected documentation validation, and the disposable Node 24 read-restore compatibility rehearsal;
  hosted level 7 only if an approved authenticated seam is available.
- Closure target: `hosted_verified` for the full task; local `runtime_verified` evidence is a valid
  intermediate result and does not close the CP-17 hosted gate.
- Rollback or remediation: Rejected requests must be transactionally side-effect free. The local
  read-restore compatibility rehearsal passed on a disposable copy; any provider-level rollback
  must use a separate, approved reversible procedure and fresh evidence. Railway Volume Backup
  restore is not a disposable rehearsal: it stages a replacement volume in the same project and
  environment, requires a reviewed deploy that redeploys the service, and can remove backups newer
  than the selected restore point ([Railway Volume Backups](https://docs.railway.com/volumes/backups)).
  If a test or hosted attempt mutates state unexpectedly, stop, preserve the first failure, restore
  from the verified pre-test copy where safe, and do not retry with a broader bypass.
- Reopen trigger: Any successful cross-scope mutation, leakage of another shelter's projection,
  non-durable rejection, duplicate rejection effect, identity mismatch, or change in the supported
  hosted session seam.
