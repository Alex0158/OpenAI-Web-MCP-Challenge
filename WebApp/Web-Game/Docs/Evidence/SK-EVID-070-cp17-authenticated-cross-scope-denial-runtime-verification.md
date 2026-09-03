# SK-EVID-070: CP-17 Authenticated Cross-Scope Denial Runtime Verification

## Identity

- Evidence ID: `SK-EVID-070`
- Related task, contract, and decision: [`SK-TASK-079`](../Tasks/SK-TASK-079-cp17-authenticated-cross-scope-denial-rehearsal.md), [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for the local production-like HTTP entrypoint, real SQLite persistence, Clerk-mode server resolver, strict command envelope, and bidirectional no-mutation readback; no hosted or real-provider session claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD d0abe3e` (`docs(game): record browser-free hosted continuity`), with the task-owned CP-17 test, package script, evidence, validation, and index changes in this closure
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Database and world: fresh temporary SQLite database, world `cp17-cross-scope-world`, the real `ensureProductionWorld` seed with Player A/`shelter-a` and Player B/`shelter-b`
- Server configuration: `GAME_AUTH_PROVIDER=clerk`, `LOCAL_FIXTURE_MODE` unset, `AUTONOMOUS_WORLD_MODE` unset, `GAME_WORLD_ID=cp17-cross-scope-world`; one real local `createEntrypoint` HTTP listener
- Deterministic identities: server-side test resolver maps `subject-a` to `player-a` and `subject-b` to `player-b`; token verification is a deterministic test double, so no Clerk production token or browser credential is used

## Objective and claim boundary

- Behavior under test: A valid authenticated Player A or Player B reaches the production-like command path, attempts to assign the other player's soldier, and receives the existing privacy-preserving ownership rejection without changing gameplay state.
- Claim this evidence may support: The local Clerk-mode resolver derives scope from the authenticated subject; the strict assign-mission envelope carries no player/shelter/world authority fields; the real HTTP entrypoint and mission service reject both cross-scope directions as `403`/`NOT_OWNER`; the world, shelters, soldiers, resource nodes, missions, attempts, and Domain Events remain unchanged; rejected identities are durable and an exact retry remains a rejection; and a client-supplied `player_id` is rejected before the worker runs.
- Claims this evidence cannot support: Real Clerk session issuance, hosted cross-scope denial, arbitrary authenticated requests against Railway, WebSocket command parity, rollback/read-restore execution, Cloud Receiver or Local Connector delivery, WebMCP dynamic action, Agent wake, or `hosted_verified` closure.

## Preconditions and boundary classification

- Starting state: CP-17 production-like admission already derives `worldId`/`playerId`/`shelterId` from the server session and maps ownership failure to the fixed `NOT_OWNER` result; existing CP-12/CP-17 suites cover the lower-level parser and persistence cases.
- Real boundaries: `createEntrypoint`, runtime config, HTTP routing, `createClerkGameSessionResolver`, `ensureProductionWorld`, `PersistenceStore`, strict command parsing, `WorkerCommandGateway`, `MissionService`, and Node's local `fetch` client.
- Test doubles: The Clerk token verifier and subject-to-player map are deterministic local doubles; Next's page handler is a no-op because this test targets the Game HTTP command route. No production bypass, extra endpoint, cookie read, or client-selected scope is introduced.
- Isolation: The database is created in a temporary directory and removed by the test after the entrypoint is shut down. No hosted world, Railway Volume, or owner-authenticated browser session is touched.

## Replayable procedure and result

| Step | Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|---|
| 1 | Create a fresh SQLite world and start the real entrypoint with `GAME_AUTH_PROVIDER=clerk`, no fixture mode, and the deterministic two-subject resolver | The process becomes ready and both subjects bootstrap to their server-derived scopes | HTTP bootstrap returned `200`; `subject-a` resolved to `player-a`/`shelter-a`, and `subject-b` resolved to `player-b`/`shelter-b` | **pass** |
| 2 | Send Player A's valid command envelope naming `soldier-b-01` and `node-wood-b` with the A session cookie | The server rejects the foreign soldier without revealing target state | HTTP `403`; exact result was `effect=rejected`, `error_code=NOT_OWNER`, empty `current_entity_revisions` | **pass** |
| 3 | Send Player B's valid command envelope naming `soldier-a-01` and `node-wood-a` with the B session cookie | The reverse direction is rejected by the same privacy-preserving contract | HTTP `403`; exact result was `effect=rejected`, `error_code=NOT_OWNER`, empty `current_entity_revisions` | **pass** |
| 4 | Compare the world, shelters, soldiers, resource nodes, missions, mission attempts, and Domain Events before and after both requests | No gameplay, economy, resource, mission, soldier, or event mutation occurs | The complete state digest was unchanged; only the expected durable rejected idempotency records were created | **pass** |
| 5 | Read both rejected idempotency keys and resend the exact A-to-B envelope | Rejection identity is durable and retry does not create a second effect | Both keys read `outcome=rejected`; the exact retry returned the same `403` body and the state digest stayed unchanged | **pass** |
| 6 | Add a client-supplied `player_id=player-b` field to an otherwise valid A envelope | Client-selected authority is rejected by the strict envelope before the worker runs | HTTP `400` with `ASSIGN_SOLDIER_MISSION_COMMAND_INVALID`; the state digest stayed unchanged | **pass** |

Exact command used:

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp17-cross-scope
```

Observed result: `1` test, `1` pass, `0` failures, duration approximately `223 ms`.

## Affected transitive checks

| Command | Result |
|---|---|
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run typecheck` | **pass**; TypeScript emitted no errors |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp17-admission` | **pass**; 4 tests passed |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp12-dispatch` | **pass**; 31 tests passed, including strict envelope, ownership, idempotency, and rejection replay cases |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp13-page-tools` | **pass**; 9 tests passed |
| `python3 scripts/test_validate_game_docs.py` | **pass**; 22 validator tests passed |
| `python3 scripts/validate_game_docs.py --root . --report` | **known repository finding**; the validator reported only the pre-existing collaborator-owned `SK-TASK-076` missing `Next gate`; this task did not alter that file |

## Cross-functional chain check

```text
authenticated subject
  -> server-derived player/shelter/world scope
  -> strict assign-mission envelope
  -> HTTP admission and WorkerCommandGateway
  -> soldier/shelter ownership predicate
  -> typed NOT_OWNER rejection
  -> durable rejected idempotency record
  -> unchanged world, mission, economy, and event state
```

Both directions traversed the same chain. The client-selected identity field was stopped at the
envelope boundary, before the worker or persistence mutation path.

## Analysis and closure

- Result: The named local production-like cross-scope denial slice is runtime-verified at ladder level 4.
- Hosted gate: The same assertion was not sent to Railway. The supported browser automation surface can
  read and operate the signed-in page but does not expose an arbitrary authenticated request client, and
  reading Clerk cookies or adding a production test bypass would invalidate the evidence. The hosted row
  therefore remains open under [`SK-TASK-079`](../Tasks/SK-TASK-079-cp17-authenticated-cross-scope-denial-rehearsal.md).
- Recovery gate: No live rollback or read-restore was executed; the previously hash-verified backup
  remains an operational artifact, not proof of restore success.
- Exact conclusion: Local authenticated scope denial, durable no-mutation behavior, stable rejection
  replay, and strict client-authority rejection pass. This record must not be used to claim hosted
  denial or full CP-17 closure.

## Invalidation triggers

Reopen this evidence if the Clerk subject map, session resolver, command envelope, mission ownership
predicate, idempotency schema, HTTP route, WebSocket command surface, hosted test seam, or CP-17
deployment/source identity changes.
