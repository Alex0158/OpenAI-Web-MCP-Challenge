# ADR-GAME-0029: CP-12 Local Fixture Session Boundary

**Status:** ACCEPTED; CP-12 LOCAL RUNTIME VERIFIED  
**Date:** 2026-09-02  
**Scope:** [`SK-TASK-038`](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md)  
**Challenge:** [`../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md`](../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md) and [`ADR-GAME-0028-cp12-client-projection-read-model.md`](ADR-GAME-0028-cp12-client-projection-read-model.md)

## Context

CP-08 already proves a server-injected realtime session resolver and an entrypoint-owned WebSocket
adapter. CP-12 now proves the additive `client_snapshot` projection and deterministic Canvas/semantic
consumer, but the canonical page still receives `null` because the default process intentionally has no
identity resolver. The next useful proof is one real local page-to-worker-to-first-frame path. The
production identity, hosted authentication, periodic scheduler, and external Agent capabilities remain
open and must not be smuggled into this presentation increment.

## Decision question

How can a local browser obtain a server-bound fixture scope for the first full snapshot while keeping
the browser a projection consumer and keeping the production path unsupported until real identity is
accepted?

## Options considered

### Option A — Injected resolver only

Keep the resolver entirely in the test or custom entrypoint dependency. This has the smallest blast
radius and preserves the existing boundary, but the canonical page cannot start a local session without
test harness setup and does not provide a useful browser proof.

### Option B — Explicit local fixture bootstrap (recommended)

Add one non-production-only fixture session adapter that maps fixed opaque handles to the existing
fixture bindings, validates or seeds only an explicitly empty fixture store, and composes with the
existing entrypoint resolver. The page opens `/realtime`, receives the first full frame, and renders it
through the existing projection client. Unknown sessions, production mode, mismatched stores, and stale
connections fail visibly. No player id is accepted from client input, no authentication schema is
persisted, and no scheduler or state-changing command is added. Before accepting that frame, the page
receives its expected `worldId`/`playerId`/`shelterId` from the same server-side resolver (through a
server-rendered fixture context or an explicit read-only bootstrap response); the first frame cannot
establish its own scope. The hub creates `connectionId` only while opening the socket, so the page
performs a two-phase transport bind: it validates the first full frame against the pre-bound scope and
then records that server-issued id for later sequence/resync correlation. The id never establishes
identity or authorizes a command.

### Option C — Production identity now

Introduce a real identity provider, public session issuance, and hosted security policy before the G2
slice is proven. This may be needed later, but it expands identity, operations, threat, deployment, and
review scope beyond CP-12 and cannot be inferred from local fixture evidence.

## Proposed boundary

If the owner accepts Option B:

1. fixture mode is explicit and limited to `development`/`test`; the default and all production paths
   remain visibly unsupported without a supplied resolver;
2. the server maps only fixed opaque fixture handles to `player-a`/`player-b` and never trusts a
   client-selected player id;
3. the accepted `sleepless-mvp-01` world and existing player bindings remain the sole fixture data;
4. one entrypoint constructs one worker, gateway, hub, resolver, and page transport; Next routes do not
   construct or import a mutable worker;
5. the canonical page obtains expected scope from that resolver before accepting a frame; because the
   hub creates `connectionId` during connect, the page's transport validates the first full frame against
   that pre-bound scope and then records the server-issued id for subsequent sequence/resync checks. A
   first frame never becomes a new identity authority, and the id is never command authority;
6. the first full `client_snapshot` and explicit resync use the existing server sequence/projection
   validators; a stale or closed channel is visible and cannot authorize a mutation; and
7. the closure claim is local `runtime_verified` for one initial frame. Two-browser G2, production
   identity, continuous scheduler, WebMCP, Re-entry, hosted, and judge claims remain open.

## Implementation shape under this boundary

The smallest concrete path after acceptance is an entrypoint-owned `GET /api/local-fixture/bootstrap`
read boundary, enabled only by an explicit `development`/`test` fixture flag. With no cookie it issues
one fixed opaque default handle; an unknown cookie fails visibly. The response exposes only the
server-derived expected scope and contract version, while the same pure token-to-context resolver is
used by the WebSocket admission path. It does not expose the raw binding, accept a player id, mutate
game state, or start a second worker.

Before the worker is marked ready, the fixture path creates the accepted `sleepless-mvp-01` world only
when the configured database is provably empty, otherwise loads and validates the matching world and
rejects a non-empty or mismatched store. The page consumes the bootstrap response, opens `/realtime`
with the browser-managed cookie, and performs no automatic retry loop or state-changing command in this
increment.

The hub's server-issued `connectionId` is unavailable until connect. The page transport therefore
validates the first full frame against the pre-bound scope before recording that id for later
sequence/resync correlation. A foreign or malformed first frame cannot bind an id; if this two-phase
operation would weaken the accepted projection validator, the task reopens the wire decision rather
than adding an unreviewed hello frame or ticket registry.

### Implementation-readiness constraints

These are the smallest implementation defaults if Option B is accepted. They narrow the composition
without changing the game contract or accepting a production identity decision:

1. The fixture resolver owns one internal context containing the base realtime scope and its
   server-derived shelter id. The WebSocket adapter receives the base context, while the read-only
   bootstrap response reads the shelter id from that same resolution. Neither route nor browser keeps
   a second player-to-shelter map.
2. Fixture startup uses a read-only world-id inventory in the persistence adapter. It creates the
   accepted `sleepless-mvp-01` fixture only for an empty inventory, and loads it only when the inventory
   contains exactly that world and `loadPersistedG2Fixture` validates its manifest and snapshot. An
   extra world, mismatch, missing snapshot, or partial fixture fails startup; request handling never
   seeds, overwrites, or repairs the database.
3. The entrypoint creates one shared `PersistenceStore` in fixture mode, performs the seed or load
   before `WorldWorkerModule.start()`, and injects that same instance into the one worker. A custom
   worker used by a test must accept that store explicitly or fixture mode is rejected; a route may
   not create a second worker/store. If preparation fails, the pre-opened store is closed before the
   typed startup failure is returned.
4. The entrypoint owns `GET /api/local-fixture/bootstrap` before handing other requests to Next. The
   route is admitted only in `ready`, returns a typed non-success state while the runtime is starting or
   degraded, and remains visibly unsupported when disabled or running in production. Successful JSON
   is uncached (`Cache-Control: no-store`, `Vary: Cookie`) and exposes only capability, contract
   version, and server-derived world/player/shelter scope. Exact cookie parsing rejects malformed or
   unknown values instead of falling back to the default.
5. The client keeps the existing strict constructor for already-bound callers and adds a clearly
   pre-bound-scope path. Its first-frame operation validates the full projection and expected scope,
   then binds the server-issued connection id only after success. No unbound client can issue a
   resync request, and later frames retain the existing id and monotonic-sequence checks. This avoids
   a fake id, a new hello/ticket wire kind, and an automatic retry loop.

## Consequences

- Positive: CP-12 can be observed through the real page and existing wire without changing the game
  contract or creating a second authority.
- Positive: The fixture path is easy to remove or replace when production identity is decided.
- Cost: A small configuration/session surface and explicit local setup must be documented and tested.
- Cost: The page transport needs a small two-phase lifecycle extension because the server-issued
  connection id is unavailable before the first frame. Adding a hello/ticket frame would be a separate
  wire decision and is not part of this boundary.
- Positive: A single read-only bootstrap response gives the page its expected scope and leaves the
  WebSocket as the existing projection-only transport.
- Limitation: The local page has no automatic reconnect or second-player selector in this increment;
  browser two-session demonstration remains a later checkpoint.
- Limitation: A local fixture handle is not authentication and cannot support a hosted or production
  claim. The page may show a first frame without proving ongoing world cadence.

## Reopen triggers

Reopen this proposal if fixture mode can run in production, a client can choose or infer another
player's scope, bootstrap overwrites a non-empty or mismatched world, a second worker/store appears, a
new persisted identity schema or contract version is required, a timer is needed for acceptance, the
two-phase first-frame bind cannot preserve scope/sequence validation, a new hello/ticket wire message is
needed, or the page must perform a state-changing command before the first frame is valid.

## Owner decision

Accepted Option B by the owner on `2026-09-02`. This authorizes only the bounded CP-12
non-production local fixture bootstrap and first-frame implementation described above. Production
identity, hosted continuity, WebMCP/Re-entry delivery, scheduler work, state-changing browser controls,
and the level-5 two-player story remain outside this decision.
