# SK-EVID-071: CP-17 Production-like WebMCP Page-tool Admission Runtime Verification

## Identity

- Evidence ID: `SK-EVID-071`
- Related task, contract, and decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for the local production-like HTTP entrypoint, real SQLite persistence, Clerk-mode server resolver, and page-tool admission; no real-provider, hosted, or external Agent claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD 4a71866` (`test(game): prove cp17 cross-scope denial`), with the task-owned CP-17 admission test extended in this closure
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Database and world: fresh temporary SQLite database, world `cp17-world`, seeded by the real `ensureProductionWorld` path
- Server configuration: `GAME_AUTH_PROVIDER=clerk`, `LOCAL_FIXTURE_MODE` unset, `GAME_WORLD_ID=cp17-world`; one real local `createEntrypoint` HTTP listener
- Deterministic identity: the test resolver maps `subject-a` to `player-a`/`shelter-a` and verifies the cookie subject through a deterministic local test double; no Clerk production credential or browser cookie is used

## Objective and claim boundary

- Behavior under test: an authenticated Clerk-mode session reaches the existing page-tool execution route, receives a read scoped to the server-derived player/shelter/world, and cannot add a client-selected player identity to the read input.
- Claim this evidence may support: the production-like entrypoint applies the same server-derived Clerk session scope to WebMCP page-tool reads; `inspect_shelter_state` returns Player A's private scope and shelter identity; cache-sensitive page responses carry `Cache-Control: no-store` and `Vary: Cookie`; and a client-supplied `player_id` is rejected by the strict page-tool parser before the worker gateway runs.
- Claims this evidence cannot support: real Clerk session issuance, hosted page-tool execution, canonical browser WebMCP registration, dynamic recall exposure, Agent activation, Re-entry delivery, Cloud Receiver or Local Connector acknowledgement, rollback/read-restore, or `hosted_verified` closure.

## Preconditions and boundary classification

- Starting state: CP-17 local production-like bootstrap, identity resolver, HTTP command, WebSocket scope, and fixture exclusion are already covered by the focused admission test; CP-13 owns the page-tool schema and gateway behavior.
- Real boundaries: `createEntrypoint`, runtime config, HTTP routing, `createClerkGameSessionResolver`, `ensureProductionWorld`, `PersistenceStore`, strict `parsePageToolExecutionRequest`, `WorkerCommandGateway`, and Node's local `fetch` client.
- Test doubles: the Clerk token verifier, subject map, and Next page handler are deterministic local doubles. The page-tool request uses the existing route constant and does not add a production-only endpoint, fixture cookie, or scope override.
- Isolation: the database is created in a temporary directory and removed after the entrypoint shuts down. No Railway service, hosted world, or owner-authenticated browser session is touched.

## Replayable procedure and result

| Step | Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|---|
| 1 | Start the real entrypoint with Clerk mode, a fresh SQLite store, no fixture mode, and the deterministic two-subject resolver | The process becomes ready and the Player A cookie bootstraps to the server-derived scope | Bootstrap returned `200` with `worldId=cp17-world`, `playerId=player-a`, and `shelterId=shelter-a` | **pass** |
| 2 | POST `{tool:"inspect_shelter_state",input:{}}` to `PAGE_TOOLS_EXECUTE_PATH` with the Player A Clerk session cookie | The read succeeds through the production-like admission path | HTTP `200`; `tool=inspect_shelter_state`; response scope was `cp17-world`/`player-a`/`shelter-a`; shelter identity was `shelter-a`/`player-a`; continuation was `null` | **pass** |
| 3 | Inspect the response headers from the authenticated read | The private response is not cacheable across identities | `Cache-Control: no-store` and `Vary: Cookie` were present | **pass** |
| 4 | POST the same read with `input:{player_id:"player-b"}` | Client-selected authority is rejected before the worker path | HTTP `400` with `{error_code:"PAGE_TOOL_INPUT_INVALID"}` | **pass** |
| 5 | Request the fixture bootstrap route in the same production-like process | Production-like mode does not accept the fixture route as an alternate identity | HTTP `503` with `{error_code:"LOCAL_FIXTURE_UNAVAILABLE"}` | **pass** |

Exact command used:

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp17-admission
```

Observed result: `4` tests, `4` pass, `0` failures, duration approximately `223 ms`.

## Affected transitive checks

| Command | Result |
|---|---|
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run typecheck` | **pass**; TypeScript emitted no errors |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp13-page-tools` | **pass**; 9 tests passed, including page HTTP scope, parser, registrar, and continuation-gated recall behavior |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" python3 scripts/test_validate_game_docs.py` | **pass**; 22 validator tests passed |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" python3 scripts/validate_game_docs.py --root . --report` | **known repository finding**; the validator reported only the pre-existing collaborator-owned `SK-TASK-076` missing `Next gate`; no finding named this increment's files |

## Cross-functional chain check

```text
Clerk subject
  -> server-derived player/shelter/world scope
  -> page-tool HTTP admission
  -> strict page-tool request parser
  -> WorkerCommandGateway.inspectShelterState
  -> private page-tool read envelope
```

The client-selected `player_id` field stops at the strict parser and cannot replace the resolver
scope. The route remains the existing shared page-tool path; no second identity authority or fixture
fallback is introduced.

## Analysis and closure

- Result: The named local production-like WebMCP page-tool admission slice is runtime-verified at ladder level 4.
- Hosted gate: No request was sent to Railway. This record does not prove hosted page-tool execution or hosted WebMCP registration.
- Agent gate: No genuine Agent, Cloud Receiver, Local Connector, or Re-entry wake was involved. The read is a direct local HTTP contract check.
- Exact conclusion: CP-17's server-derived Clerk admission now has direct local page-tool read coverage and strict client-authority rejection. Existing hosted denial, rollback/read-restore, dynamic Agent action, and full CP-17 closure remain open.

## Invalidation triggers

Reopen this evidence if the Clerk subject map, session resolver, page-tool route or input contract,
scope envelope, persistence schema, worker gateway, runtime version, canonical origin, or CP-17
deployment/source identity changes.
