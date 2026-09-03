# CP-12 Local Fixture Session and Initial Frame Pre-Implementation Challenge

**Status:** ACCEPTED; IMPLEMENTATION VERIFIED FOR THE NAMED LOCAL BOUNDARY  
**Date:** 2026-09-02  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-038`](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md)  
**Proposed decision:** [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)  
**Purpose:** Decide how a local page can receive one real server-bound fixture snapshot while production identity remains an open boundary.

## Decision question

What is the smallest safe local session/bootstrap boundary that lets the canonical page receive its
first `client_snapshot` through the existing one-process entrypoint and `/realtime` adapter, without
letting the browser choose a player, adding a second authority, or implying production authentication?

## Objective and binding constraints

- Real objective: make the CP-12 projection observable in the canonical page through the actual local
  server, worker gateway, snapshot hub, and WebSocket wire.
- Non-negotiables: the worker owns identity, world time, visibility, and state; the browser consumes a
  replaceable projection; one entrypoint owns one worker/store; `player_id` is never trusted from a
  query, body, or frame; and the default production path remains visibly unsupported until real
  identity exists.
- Contract: preserve `SK-MVP-0.2`; do not change persisted identity, event, revision, or snapshot
  semantics in this task.
- Human boundary: no state-changing command is needed to show the first frame, and no fixture path may
  bypass future WebMCP/Re-entry or human review controls.

## Evidence and challenge

### Verified facts

1. `RealtimeWireAdapter` accepts a server-injected `RealtimeSessionResolver`; it does not parse a
   player id from client input.
2. Existing CP-08 tests use a cookie resolver for `fixture-a` and `fixture-b`, prove cross-scope
   rejection, and prove entrypoint composition when a resolver is supplied.
3. The default `main()` creates the worker without a resolver, so `/realtime` is intentionally
   `REALTIME_UNAVAILABLE` today.
4. `ClientSnapshotService` needs an existing persisted fixture world and returns only the bound player's
   scope. `createAndPersistG2Fixture` is the accepted deterministic seed helper.
5. CP-12's page currently renders a null/unsupported state and its projection model rejects invalid
   scope, sequence, lifecycle, cargo, explored geometry, and foreign actors.

### Feasibility readback

- Next 16 exposes request cookies asynchronously in Server Components, while cookie writes belong in a
  Server Function or Route Handler. The existing custom Node server can also set an owned `Set-Cookie`
  header before handing a request to Next. A bootstrap must use one of these explicit server boundaries;
  it must not mutate cookies during page rendering.
- The existing entrypoint has one HTTP request boundary and passes the same `IncomingMessage` to the
  `/realtime` resolver. `WorldWorkerModule.start()` opens the configured store but does not seed a world;
  any fixture seed must happen before that worker starts, on the same store, and must reject a non-empty or
  mismatched world rather than silently reseeding it.
- `RealtimeProjectionClient` requires `worldId`, `playerId`, and `shelterId` before it can accept a
  frame. The first `client_snapshot` therefore cannot establish its own expected scope: doing so would
  remove the independent scope-isolation check. The page transport must receive a server-derived expected
  scope before constructing the client, using the same resolver/token mapping as the WebSocket path, and
  must never expose the raw binding to the browser.
- The hub generates `connectionId` inside `connect()` and includes it in the first
  `client_snapshot`; the browser cannot know that transport correlation value before opening the socket.
  This does not change identity authority. The smallest compatible page lifecycle is therefore a
  two-phase client binding: obtain the expected world/player/shelter scope from the shared resolver,
  validate the first full frame against that scope and the existing projection rules, then bind its
  server-issued `connectionId` only for subsequent sequence and resync checks. A new hello frame,
  connection ticket, or client-selected id would be a broader wire decision and is not assumed here.
- `RealtimeSnapshotHub` sends a full frame on connect or explicit resync only. This confirms that the
  first-frame increment does not need a timer or a periodic publisher.

### Implementation-readiness refinements inside Option B

The following details are implementation defaults inside the recommended boundary; they do not accept
the proposal or authorize code:

- **One session map, two consumers.** The concrete fixture resolver should return one internal
  `FixtureSessionContext` containing the base `worldId`/`playerId`/`binding` used by the WebSocket path
  plus the server-derived `shelterId` needed by the bootstrap response. The hub consumes the base
  context and ignores the extra field; the bootstrap response reads the same resolved object. A second
  player-to-shelter map in the page or route is not acceptable.
- **Provable store admission.** Checking only `getWorld(expectedWorldId)` is insufficient: it would
  allow an unrelated world to coexist with a newly inserted fixture. The persistence adapter used by
  fixture startup therefore needs one read-only world-id inventory (for example, `listWorldIds()`),
  or an equivalent proof. Creation is allowed only when that inventory is empty; loading is allowed
  only when it contains exactly `sleepless-mvp-01` and `loadPersistedG2Fixture` validates the stored
  manifest and snapshot. Extra worlds, a mismatched world, a missing snapshot, or a partial fixture are
  typed startup failures. No request may seed or overwrite the store.
- **Startup ownership and ordering.** In fixture mode the entrypoint must own one shared
  `PersistenceStore`, open and seed or validate it before the worker is started, and inject that same
  instance into the one `WorldWorkerModule`; the worker's idempotent `open()` remains the lifecycle
  owner and its `stop()` closes the store. The fixture HTTP route never constructs a worker or store.
  If a test injects a custom worker that cannot accept the shared store, fixture mode must be disabled
  or rejected explicitly rather than silently creating a second store. A seed failure closes the
  pre-opened store before startup reports failure.
- **Readiness and response boundary.** The entrypoint intercepts the bootstrap path before Next. It
  serves it only after the registry is `ready`; `starting`, `degraded`, `draining`, `stopped`, and
  `failed` states return a typed non-success response. Disabled or production fixture mode remains a
  visible unsupported response. A successful response is JSON with `Cache-Control: no-store` and
  `Vary: Cookie`, and contains only capability, contract version, and server-derived scope. Cookie
  parsing is exact by name and value; malformed or unknown cookies fail and are never replaced.
- **Explicit first-frame lifecycle.** Keep the current strict connection-id path for existing callers,
  and add an explicit pre-bound-scope client construction path rather than inventing a fake id. That
  path validates frame shape, projection, expected scope, and sequence first; only a valid first frame
  binds its server-issued `connectionId`. Before binding, a malformed or foreign frame becomes visible
  stale/invalid and cannot issue a resync request because no trusted correlation id exists. After
  binding, the existing connection-id, monotonic-sequence, and full-replacement rules apply unchanged.
  A new hello frame, ticket registry, or automatic retry loop remains out of scope.
- **Predecessor compatibility.** CP-08's accepted rule that its injected test fixture does not issue
  or persist production credentials remains intact: the proposed cookie is only a local opaque handle,
  is not a credential or authentication claim, and is issued by the explicit non-production entrypoint
  adapter rather than by the wire adapter. CP-12's prior projection increment remains a null/unsupported
  read model until this task is accepted and verified; this proposal is additive and does not rewrite
  that earlier closure.

### Concrete implementation candidate after acceptance

The recommended Option B can be implemented with one explicit local HTTP bootstrap boundary rather
than page-render mutation or a second Next route-owned worker:

1. The entrypoint handles `GET /api/local-fixture/bootstrap` only when an explicit fixture flag is
   enabled in `development` or `test`. It issues a session cookie only when no cookie exists, using a
   fixed opaque default handle; an unknown handle fails visibly and is never silently replaced.
2. The response returns only `capability`, `contractVersion`, and the server-derived
   `worldId`/`playerId`/`shelterId` expected by the page. The raw binding and any credential-like value
   stay server-side. The same pure token-to-context resolver is called by this response and by the
   `/realtime` upgrade path; no duplicated map is allowed.
3. The fixture bootstrap runs before the one worker becomes ready. It may create the accepted
   `sleepless-mvp-01` fixture only when the database is provably empty, loads and validates it when the
   expected world already exists, and rejects a non-empty or mismatched store. It never overwrites a
   world, starts another store authority, or changes the gameplay contract.
4. The page fetches this read-only response, constructs its transport with the returned expected scope,
   and opens `/realtime` with the browser-managed cookie. It performs no state-changing command and no
   automatic retry loop in this increment. A missing/unknown session, unavailable runtime, malformed
   first frame, or closed socket becomes the existing visible unsupported/stale state.
5. The transport validates the first frame's full projection and expected scope before recording its
   server-issued connection id for later sequence/resync correlation. If that two-phase binding cannot
   be expressed without weakening the accepted validator, this candidate reopens the wire decision
   instead of adding an unreviewed hello frame or ticket registry.

### Assumptions

- A local-only opaque cookie or equivalent server-issued fixture token can be used as an adapter input
  without becoming a production authentication scheme.
- The accepted `sleepless-mvp-01` seed and the existing two-player fixture are sufficient for the first
  frame; default-world seeding should remain explicit and must not overwrite an existing database.
- Initial connect and explicit resync are enough for this increment; a periodic publisher and all-phase
  scheduler belong to later gates.

### Unknowns and falsifiers

| Unknown | Falsifier that changes the decision |
|---|---|
| How a local browser obtains a fixture session | It requires public credentials, an external identity provider, or a client-selected player id |
| Where fixture bootstrap runs | It needs a second worker/store, mutates an existing non-fixture world, or runs in production |
| How the page obtains expected scope before the first frame | It can only infer player scope from the first frame, duplicates token-to-player mapping in separate authorities, or requires client-selected player data |
| How the page learns the transport connection id | It requires a new hello/ticket wire message, accepts a client-selected id, or cannot validate the first frame's scope before binding |
| Whether the first frame is enough | CP-12 acceptance requires periodic scheduler behavior or a state-changing command in this same increment |
| Cookie/token policy | The value contains a binding, prompt, credential, or raw Agent context rather than an opaque fixture handle |
| Bootstrap endpoint composition | It needs page-render cookie mutation, a second mutable worker/store, an implicit retry loop, or a duplicated token-to-context map |

## Failure modes examined

| Failure | Impact | Detection | Prevention or remediation |
|---|---|---|---|
| Client sends `player-a` in query/body/frame | Cross-player projection or command scope | Negative resolver and wire tests | Ignore client-selected ids; resolve only a fixed server-side fixture token |
| Fixture mode enabled in production | Fake identity becomes a public auth bypass | Config and production-mode tests | Require explicit non-production mode; default to unsupported |
| Empty or mismatched database is silently reseeded | Existing world data is overwritten or forked | Store identity/recovery assertions | Seed only an empty, explicit fixture path; return typed recovery failure otherwise |
| Page and WebSocket use different contexts | HUD and commands describe different players | Context identity assertion | One resolver and one entrypoint-owned context for both paths |
| Client self-binds scope from the first frame | Scope-isolation evidence is lost and a wrong server frame can look valid | Client initialization and foreign-scope tests | Obtain expected scope from the shared server resolver before frame acceptance |
| Client cannot know `connectionId` before the first frame | The page either cannot construct the current validator or weakens first-frame validation | First-frame lifecycle tests | Validate server scope first, then bind the frame id as transport correlation; do not add a new wire kind without a separate decision |
| A second worker/store is created by a page route | Divergent time, events, or snapshots | Process instance/gateway composition test | Keep worker construction in entrypoint; routes remain adapters |
| First frame bypasses validation | Hidden state or stale actor reaches Canvas | Malformed/scope/sequence tests | Reuse `RealtimeProjectionClient` and fail visibly |
| Connection closes during connect | Blank or falsely current page | Close/stale state test | Show `STALE`/unsupported state and require a full replacement before future commands |
| Fixture bootstrap is treated as production readiness | False hosted or identity claim | Evidence claim review | Bound closure to local runtime only and list production identity as unknown |
| Adding a timer to make the page look live | World authority and cadence drift | Code review and task scope check | No scheduler or periodic publisher in this increment |
| Unknown session is silently reset to the default | A stale or forged browser can appear as the wrong fixture player | Bootstrap negative test and response readback | Return a typed auth/bootstrap failure; issue the default handle only when no cookie is present |

## Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Injected resolver only | Smallest server seam and strong authority boundary | Canonical page still cannot start itself; browser proof remains test-harness-only | Low | High | Existing wire tests plus composition readback |
| Explicit local fixture bootstrap (recommended) | One reproducible page-to-frame path and clear unsupported production state | Adds a small dev-only session/config surface and fixture startup rules | Medium | High | Red/Green server, wire, page, and production-gating tests |
| Production identity now | Broadest eventual usability | Changes identity, security, operations, and hosted scope before G2 evidence | High | Low | New auth decision, threat review, hosted proof, and contract impact |

## Decision

- Recommended option: **Explicit local fixture bootstrap**, subject to owner approval.
- Proposed shape: a fixed server-side mapping of two opaque local fixture handles to the existing
  `player-a`/`player-b` bindings; an explicit non-production flag; no client player id; no persisted
  authentication schema; one entrypoint-owned worker and resolver; and one initial full frame plus
  explicit resync through the existing adapter. The canonical page must obtain a server-derived expected
  scope before constructing `RealtimeProjectionClient` (through a server-rendered fixture context or an
  explicit read-only bootstrap response); the first frame cannot be its scope authority. Because the
  server creates `connectionId` during connect, the page may bind that id only after the first frame has
  passed the pre-bound scope and projection checks; it remains transport correlation, never identity or
  command authority.
- Rejected for this increment: resolver-only composition does not expose the canonical page, while
  production identity would expand CP-12 into an unreviewed security and deployment project.
- Non-goals: scheduler, periodic frames, state mutation, WebMCP, Agent delivery, Re-entry, hosted
  claims, and the complete two-player story.
- Owner decision: **Accepted Option B — explicit local fixture bootstrap** on `2026-09-02`; implementation is verified for the named local boundary in [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md) and [`Validation/45`](45-cp12-local-fixture-session-runtime-cross-functional-audit.md).
  Implementation is authorized only within the bounded CP-12 scope above; production identity,
  hosted continuity, WebMCP/Re-entry delivery, scheduler work, and state-changing browser controls
  remain out of scope.

## Verification and recovery

- If accepted, use contract-first TDD: Red scope/production/fixture/frame tests; Green smallest local
  resolver, first-frame two-phase binding, and page consumer; Refactor only after green; then focused
  regressions and the task closure gates. The tests must prove that a foreign-scope first frame is
  rejected before any connection id is bound and that subsequent frames enforce the bound id.
- Minimum meaningful verification is one real local process with one server-bound fixture session and
  one full frame, plus explicit unknown/production/stale/sequence failures, an empty/matching/mismatch
  store bootstrap check, and a bootstrap-to-WebSocket context identity assertion. Level-5 two-browser
  and level-6 capability claims remain separate.
- Recovery is to disable the fixture mode and preserve the current null/unsupported page if the
  browser, configuration, or store cannot satisfy the boundary. A need for production auth, a new
  contract version, or another process returns to this challenge and requires a new decision.
