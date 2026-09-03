# SK-EVID-028: CP-12 Local Fixture Session and Initial Frame Runtime Verification

## Identity

- Evidence ID: `SK-EVID-028`
- Related task and decision: [`SK-TASK-038`](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md); [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — local file-backed entrypoint, built Next page, bootstrap response, WebSocket first frame, and projection acceptance
- Executor and date: Codex, 2026-09-02

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no contract or persistence schema revision
- Runtime versions: Node.js `v26.5.0`; npm `11.17.0`; TypeScript `7.0.2`; React `19.2.8`; Next.js `16.3.4`; `ws` `8.21.3`
- Fixture world and seed: `sleepless-mvp-01`, the accepted G2 fixture; task-local SQLite database at `/tmp/sleepless-kingdom-cp12-runtime-UWhoG5/actual-world.sqlite`
- Configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `PORT=0`; the smoke creates the real `next({ dev: false })` application and the CP-04 entrypoint-owned worker/store/gateway
- External boundaries: no production identity provider, browser automation, WebMCP capability, Agent Signal, Re-entry Core, credential, external service, or hosted process

## Objective and claim boundary

- Behavior under test: The owner-accepted Option B path prepares one explicit non-production fixture
  session, serves a server-derived scope through the entrypoint-owned bootstrap boundary, uses the same
  opaque-cookie resolver for `/realtime`, validates the first full `client_snapshot` against that
  scope, and binds the server-issued connection id only after acceptance.
- Claim this evidence may support: local level-4 process-runtime verification that the built page,
  shared file-backed store, worker gateway, fixture bootstrap, cookie boundary, WebSocket first frame,
  and pre-bound projection client compose for `player-a` in `sleepless-mvp-01`.
- Claims this evidence cannot support: browser hydration or pixel output, accessibility-tree or
  keyboard behavior, two-browser interaction, continuous scheduler cadence, production authentication,
  hosted continuity, WebMCP discovery/invocation, Agent Signal/Re-entry delivery, deployment health,
  production performance, or judge reproduction.

## Preconditions and fixture

- Starting state: A task-local database path is used. An empty store is seeded once with exactly the
  accepted two-player fixture; a subsequent preparation path loads and validates the same world rather
  than reseeding it.
- Server-owned session contexts: `fixture-v1-alpha` resolves to `player-a`/`shelter-a` and
  `fixture-v1-beta` resolves to `player-b`/`shelter-b`; raw bindings remain server-side.
- Real, fake, and stubbed boundaries: the persistence store, fixture generator/recovery loader, worker,
  gateway, HTTP server, Next production application, WebSocket adapter, and projection validator are
  real local code. No external identity or capability is stubbed as success. The initial HTTP page
  check verifies server-rendered shell text; it does not execute a browser.

## TDD and execution

The first contract run was intentionally Red: before the fixture module existed,
`npx tsx --test tests/cp12-fixture-session.test.ts` failed with the expected
`ERR_MODULE_NOT_FOUND` for `src/server/fixture-session`. The implementation then followed the
contract-first Green/Refactor loop and the closure checks below.

| Replayable command or procedure | Result |
|---|---|
| `npm run test:cp12-fixture` | **10 passed, 0 failed** — configuration and production gate, exact bootstrap parser, empty/restart store admission, cookie/session negatives, pre-bound first-frame lifecycle, ready HTTP bootstrap, method/unknown-session errors, shared-context WebSocket frame, readiness, non-shared-store rejection, and disabled/production unsupported behavior |
| `./node_modules/.bin/tsx --test tests/*.test.ts` | **178 passed, 0 failed** — CP-04 through CP-12 available aggregate, including all predecessor authority, persistence, clock, movement, mission, extraction, settlement, combat, reissue, wire, projection, visual, and fixture tests |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build compiles and mounts the canonical page shell |
| `python3 scripts/test_validate_game_docs.py` | **22 passed, 0 failed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed after the evidence/audit records and task status are synchronized** |
| `git diff --check -- WebApp/Web-Game` | **passed** — no whitespace errors in the game scope |
| `npx tsx /tmp/sleepless-kingdom-cp12-smoke.mts` | **passed** — one real local entrypoint with built Next page and task-local file-backed fixture store; output is recorded below |

## Process smoke result

The smoke procedure starts the real entrypoint with `NODE_ENV=test` and `LOCAL_FIXTURE_MODE=1`,
requests `/`, requests the entrypoint-owned bootstrap endpoint, forwards the issued cookie to a real
`ws://` upgrade, and feeds the first frame into `RealtimeProjectionClient.fromServerScope`:

```json
{"pageStatus":200,"bootstrapStatus":200,"payload":{"capability":"supported","contractVersion":"SK-MVP-0.2","worldId":"sleepless-mvp-01","playerId":"player-a","shelterId":"shelter-a"},"frameKind":"client_snapshot","framePlayer":"player-a","accepted":{"accepted":true,"reason":"ACCEPTED"},"connectionIdBound":true}
```

The result proves that the page request, server-derived bootstrap scope, cookie-authenticated wire
upgrade, full first frame, scope validation, and post-validation connection-id binding refer to the
same fixture player. It does not prove browser hydration, drawing pixels, or a second live session.

## Assertions

- **Identity and privacy:** The browser cannot select a player through a query, body, frame, unknown
  cookie, malformed cookie, or duplicate cookie. The bootstrap payload contains only capability,
  contract version, world id, player id, and shelter id; it never exposes the raw binding.
- **Persistence and admission:** An empty store is seeded once; exactly one `sleepless-mvp-01` world
  is loaded on restart; an extra or mismatched world fails with `FIXTURE_STORE_NOT_EMPTY` and is not
  overwritten. The entrypoint creates one `PersistenceStore` and proves the worker exposes that same
  instance before enabling realtime.
- **Readiness and HTTP boundary:** The endpoint is entrypoint-owned, `GET`-only, uncached, varies on
  `Cookie`, issues a handle only for an absent cookie, returns typed not-ready/degraded/closed states,
  and stays visibly unsupported when disabled or in production.
- **Realtime and projection:** The WebSocket adapter uses the same resolver and gateway as bootstrap.
  The projection client validates frame shape, full snapshot scope, and sequence before binding the
  server-issued connection id; a foreign first frame cannot bind it, and an unbound client cannot issue
  a resync request.
- **Lifecycle and failure:** A worker-start delay keeps bootstrap non-ready until the worker is ready;
  a non-shared custom worker is rejected before listener creation; shutdown drains the adapter, listener,
  worker, and shared store. No automatic retry loop, scheduler, command, or second authority is added.

## Analysis and closure

- Failure classification: `evidence`; the expected Red proof and all Green/closure checks completed
  without a product, test, fixture, or environment failure in the named scope.
- Limitations and residual risk: the task-local process smoke does not execute a real browser DOM or
  Canvas surface, does not exercise two browser cookies concurrently, and does not prove ongoing world
  cadence. The local opaque handle is an adapter input, not authentication; default scheduler,
  production identity, WebMCP, Re-entry, and hosted continuity remain open.
- Invalidation triggers: changes to the entrypoint lifecycle, fixture admission or seed, persistence
  schema/contract, resolver cookie policy, realtime frame shape, projection validator, Next/React/ws
  runtime, or the fixture seed invalidate this evidence. A browser hydration or two-player claim needs
  a new evidence record at the appropriate ladder level.
- Exact conclusion: **SK-TASK-038 is locally runtime-verified at level 4 for the named non-production
  fixture bootstrap, shared store/worker/gateway composition, server-derived session scope, and one
  accepted realtime first frame. Browser hydration, two-browser G2, production identity, scheduler,
  WebMCP, Re-entry, hosted, and judge claims remain separate gates.**
