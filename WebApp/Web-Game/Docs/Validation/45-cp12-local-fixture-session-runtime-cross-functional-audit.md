# CP-12 Local Fixture Session Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-038`](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md)
- Evidence: [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md)
- Governing decision: [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Predecessor decisions: [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md) and [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Owning specifications: [`02-system-architecture.md`](../Engineering/02-system-architecture.md), [`05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md), [`09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md), and [`12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
- Contract: `SK-MVP-0.2`; no contract, identity, or persistence schema revision
- Source state: `main`, `HEAD 4224f3a`, uncommitted working tree
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL LEVEL-4 CP-12 FIXTURE SESSION AND INITIAL FRAME**

## Audit objective

Check that the owner-accepted explicit local fixture bootstrap closes the page-to-first-frame
composition without weakening server authority, scope isolation, persistence admission, lifecycle
readiness, or the CP-12 projection boundary. This audit reviews the code, focused and aggregate tests,
typecheck, build, documentation validators, and the real local process smoke recorded in SK-EVID-028.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Identity and configuration | `LOCAL_FIXTURE_MODE` is an explicit boolean flag. Only `development` and `test` admit the adapter; the default and `production` remain visibly unsupported. Invalid flag values fail configuration rather than being coerced. | Accepted; no production identity or credential claim is introduced. |
| Fixture persistence admission | Startup inventories world ids before seeding. An empty store creates exactly `sleepless-mvp-01`; an exact single matching world loads through manifest/snapshot recovery; an extra, mismatched, partial, or unrecoverable store fails without overwrite. | Accepted; the fixture path does not repair or reseed a non-empty world. |
| Store and worker authority | Fixture mode creates one entrypoint-owned `PersistenceStore`, prepares it before worker readiness, injects it into the one worker, and checks object identity. A worker without the shared store is rejected before listener creation. | Accepted; no route-owned worker, store, or mutable singleton is added. |
| Gateway and realtime composition | The entrypoint creates one snapshot hub and `ws` no-server adapter over the same worker gateway. The fixture resolver is the only session resolver in this mode; custom realtime injection is rejected to prevent divergent context. | Accepted; CP-08 wire and lifecycle contracts remain additive and unchanged. |
| HTTP bootstrap boundary | The entrypoint intercepts `GET /api/local-fixture/bootstrap` before Next. `POST` returns 405 with `Allow: GET`; readiness, degraded, draining, stopped, and failed states return typed 503 responses. | Accepted; Next rendering cannot mutate the session or create an authority. |
| Cache and response privacy | Ready bootstrap responses use `Cache-Control: no-store`, `Vary: Cookie`, JSON content type, and content length. The payload contains only capability, contract version, world id, player id, and shelter id; the raw binding is server-side. | Accepted; a browser cache cannot cross player scopes. |
| Session resolver | The resolver maps two fixed opaque handles to the persisted `player-a`/`shelter-a` and `player-b`/`shelter-b` contexts. An absent cookie receives the default handle; malformed, duplicate, unknown, or incorrectly shaped values fail and are never replaced. Query `player_id` is ignored. | Accepted for local fixture use; the handle is not authentication. |
| WebSocket admission | `/realtime` receives the browser-managed cookie and resolves the same context used by bootstrap. A query `player_id` cannot change the context; missing or unknown sessions remain wire authorization failures. | Accepted; no client-selected player scope enters the hub or gateway. |
| First-frame lifecycle | The browser creates `RealtimeProjectionClient.fromServerScope` from bootstrap, validates frame shape, full snapshot, expected contract/world/player/shelter scope, and sequence, then binds the server-issued connection id only after success. | Accepted; a foreign first frame cannot establish identity or correlation. |
| Projection and resync | Existing strict bound callers remain unchanged. The pre-bound client rejects invalid or foreign frames as stale, cannot request resync before a trusted connection id exists, and applies the existing monotonic full-replacement rules after binding. | Accepted; no hello frame, ticket registry, or fake connection id was added. |
| Page and UI boundary | `LiveGameProjection` is a small client wrapper that performs one read-only bootstrap fetch, opens the same-origin socket, feeds frames to the projection validator, and renders the existing Canvas/semantic `GameProjection`. It adds no command, scheduler, retry loop, or client authority. | Accepted for process composition; browser hydration and pixel evidence remain open. |
| Failure UX | Bootstrap failure, socket error, closed channel, malformed frame, unsupported capability, and not-ready startup remain explicit in the existing status/capability model. A successful frame is the only path to `READY`. | Accepted; no false success is shown when the live path is unavailable. |
| Lifecycle and shutdown | Bootstrap is not ready while the worker starts. Shutdown drains realtime, closes the HTTP listener, stops the worker, and closes the shared fixture store through the existing entrypoint orchestration. | Accepted; local process lifecycle is covered, hosted restart remains separate. |
| Contract and predecessor compatibility | `SK-MVP-0.2`, persisted identity, snapshot shape, world clock, event cursor, idempotency, CP-08 wire, and CP-12 projection contracts are unchanged. The fixture path is additive and opt-in. | Accepted; changes to those contracts require a new decision/evidence record. |
| Documentation and claims | Task, ADR, Challenge, architecture, API, operations, roadmap, scenario, evidence index, validation index, and the new evidence/audit records describe the same local-only scope and limitations. | Accepted after both documentation validators pass. |

## Invariants rechecked

- The worker and domain store remain the sole authority for world identity, time, visibility, entities,
  revisions, events, and state transitions.
- Bootstrap and WebSocket admission share one resolver and one prepared store; no page or route keeps a
  second player-to-shelter map.
- No request query, body, frame, cookie fallback, or browser payload can select an arbitrary player.
- Empty-store creation is explicit and one-time; existing non-fixture data is preserved by rejection.
- A first frame must pass independent server-derived scope and projection validation before its
  connection id is recorded. The id is transport correlation only.
- Full snapshot replacement and sequence checks remain the only accepted projection update path; no
  merge, local reward, command replay, or timer is introduced.
- Domain Events, Agent Signals, WebMCP, Re-entry, and scheduler behavior are untouched by this local
  session adapter.
- The page remains a normal human-facing projection consumer when the fixture flag or realtime
  capability is unavailable.

## Verification disposition

The focused CP-12 session suite (10 tests), the available repository aggregate (178 tests), typecheck,
production build, documentation self-tests, full documentation validator, and one real local process
smoke all pass in the named source state. The process smoke returned HTTP 200 for the built page and
bootstrap, a server-derived `player-a` scope, a `client_snapshot` first frame for `player-a`, accepted
projection state, and a bound connection id. This supports only the level-4 local process claim in
SK-EVID-028; it does not upgrade the result to browser, capability, hosted, or judge evidence.

## Residual risks and reopen triggers

- Browser hydration, actual Canvas pixels, accessibility tree, keyboard input, and two simultaneous
  browser sessions remain unverified. They belong to the later CP-12/CP-16 slice gates.
- The local opaque handle is not authentication and must never be enabled in production or hosted
  routing. A production identity provider needs a new identity/security decision.
- The page has no automatic reconnect or periodic publisher in this increment. A requirement for
  continuous frames or Agent wakeups reopens the scheduler and Re-entry boundaries.
- Reopen this audit if a second worker/store appears, fixture startup overwrites existing data, a client
  can choose or infer another player, a raw binding reaches the browser, a first frame bypasses scope
  validation, a new wire message is required, or any production/hosted/WebMCP/Re-entry claim is made
  from this evidence.
