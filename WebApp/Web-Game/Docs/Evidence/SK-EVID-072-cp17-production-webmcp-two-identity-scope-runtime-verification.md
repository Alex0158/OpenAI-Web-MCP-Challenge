# SK-EVID-072: CP-17 Production-like WebMCP Two-identity Scope Runtime Verification

## Identity

- Evidence ID: `SK-EVID-072`
- Related task, contract, and evidence: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), [`SK-EVID-071`](SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for the local production-like HTTP entrypoint, real SQLite persistence, Clerk-mode resolver, and both server-derived page-tool scopes; no real-provider, hosted, or external Agent claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD 084748f` (`test(game): prove production webmcp admission scope`), with the task-owned CP-17 admission test extended in this closure
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Database and world: fresh temporary SQLite database, world `cp17-world`, seeded by the real `ensureProductionWorld` path
- Server configuration: `GAME_AUTH_PROVIDER=clerk`, `LOCAL_FIXTURE_MODE` unset, `GAME_WORLD_ID=cp17-world`; one real local `createEntrypoint` HTTP listener
- Deterministic identities: the resolver maps `subject-a` to `player-a`/`shelter-a` and `subject-b` to `player-b`/`shelter-b`; token verification is a deterministic local test double

## Objective and claim boundary

- Behavior under test: both admitted Clerk-mode subjects can use the same page-tool route, but each read is bound to its own server-derived world/player/shelter scope.
- Claim this evidence may support: Player A and Player B both receive private `inspect_shelter_state` reads from the production-like entrypoint; Player B's read does not expose Player A's shelter identity; and the strict page-tool input boundary continues to reject client-selected identity before worker execution.
- Claims this evidence cannot support: real Clerk session issuance, hosted page-tool execution, canonical browser WebMCP registration, dynamic recall, Agent activation, Re-entry delivery, Cloud Receiver or Local Connector acknowledgement, rollback/read-restore, or `hosted_verified` closure.

## Preconditions and boundary classification

- Starting state: [`SK-EVID-071`](SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md) verifies Player A's local production-like page-tool admission and client-authority rejection; the CP-17 resolver and fixture exclusion are already covered by the same focused process test.
- Real boundaries: `createEntrypoint`, runtime config, HTTP routing, `createClerkGameSessionResolver`, `ensureProductionWorld`, `PersistenceStore`, strict page-tool parsing, `WorkerCommandGateway`, and Node's local `fetch` client.
- Test doubles: the Clerk verifier, subject map, and Next page handler are deterministic local doubles. No provider credential, fixture cookie, production-only endpoint, or client-supplied scope is used.
- Isolation: a temporary SQLite database is removed after shutdown. No Railway service, hosted world, or authenticated browser session is touched.

## Replayable procedure and result

| Step | Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|---|
| 1 | Start the production-like Clerk entrypoint with both fixed subjects and a fresh named world | Both subjects are admitted against one world with distinct server-derived scopes | Bootstrap and resolver setup completed; Player A and Player B mappings were `player-a`/`shelter-a` and `player-b`/`shelter-b` | **pass** |
| 2 | POST `inspect_shelter_state` with the Player A session cookie and empty input | Player A receives only the A scope and shelter identity | HTTP `200`; scope was `cp17-world`/`player-a`/`shelter-a`; shelter identity was `shelter-a`/`player-a` | **pass** |
| 3 | POST the same read with the Player B session cookie and empty input | Player B receives only the B scope and shelter identity | HTTP `200`; scope was `cp17-world`/`player-b`/`shelter-b`; shelter identity was `shelter-b`/`player-b` | **pass** |
| 4 | Inspect the Player B page-tool response for Player A's shelter identifier | A private read cannot leak the opposite shelter through the shared route | The serialized Player B response did not contain `shelter-a` | **pass** |
| 5 | Add `player_id=player-b` to Player A's read input | Client-selected authority is rejected before the worker path | HTTP `400` with `{error_code:"PAGE_TOOL_INPUT_INVALID"}` | **pass** |

Exact command used:

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp17-admission
```

Observed result: `4` tests, `4` pass, `0` failures, duration approximately `228 ms`.

## Affected transitive checks

| Command | Result |
|---|---|
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run typecheck` | **pass**; TypeScript emitted no errors |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run test:cp13-page-tools` | **pass**; 9 tests passed, including page HTTP scope, parser, registrar, and continuation-gated recall behavior |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" python3 scripts/test_validate_game_docs.py` | **pass**; 22 validator tests passed |
| `env PATH="/opt/homebrew/opt/node@24/bin:$PATH" python3 scripts/validate_game_docs.py --root . --report` | **known repository finding**; the validator reported only the pre-existing collaborator-owned `SK-TASK-076` missing `Next gate`; no finding named this increment's files |

## Cross-functional chain check

```text
subject-a / subject-b
  -> server player/shelter/world mapping
  -> one page-tool HTTP route
  -> strict input contract
  -> one worker gateway
  -> private A/B read projection
```

Both identities use one authority path and one world writer. The test does not add a second queue,
clock, identity resolver, or page route; it verifies isolation at the existing boundary.

## Analysis and closure

- Result: The named local production-like two-identity WebMCP page-tool scope slice is runtime-verified at ladder level 4.
- Hosted gate: No request was sent to Railway. The result does not prove hosted page-tool execution or hosted browser registration.
- Agent gate: No genuine Agent, Cloud Receiver, Local Connector, or Re-entry wake was involved. This is a direct local HTTP contract check.
- Exact conclusion: Both fixed Clerk-mode subjects receive their own page-tool read scope through the same entrypoint, and the opposite shelter is not exposed. Hosted denial, rollback/read-restore, dynamic Agent action, and full CP-17 closure remain open.

## Invalidation triggers

Reopen this evidence if the subject map, session resolver, page-tool route or input contract, private
projection, persistence schema, runtime version, canonical origin, or CP-17 source/deployment identity
changes.
