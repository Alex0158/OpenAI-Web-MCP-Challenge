# SK-TASK-038: CP-12 Local Fixture Session and Initial Realtime Frame

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: The owner-accepted explicit non-production fixture bootstrap, shared store, server-derived scope, pre-bound first-frame client path, and canonical page wiring are implemented and locally runtime-verified at level 4.
- Next gate: Keep browser hydration/two-browser, production identity, scheduler, WebMCP, Re-entry, and hosted claims in their later checkpoint gates; any change to this boundary reopens the task.

## Identity

- Task ID: `SK-TASK-038`
- Date: `2026-09-02`
- Risk profile: `Assured`
- Reason for profile: The increment crosses page bootstrap, session binding, entrypoint composition, WebSocket admission, worker snapshot reads, and browser failure states. A wrong choice could expose another player's state or create a second identity/worker authority.

## Objective

Give the canonical page one explicit, development-only fixture session path to receive its first
server-bound `client_snapshot` through the existing entrypoint, worker gateway, snapshot hub, and wire
adapter, without accepting a client-selected player or claiming production identity.

## Success and non-goals

- Success: An explicitly enabled local fixture mode validates or creates only the accepted seeded world,
  maps a fixed opaque fixture session to one server-owned player scope, and rejects unknown or
  production requests visibly.
- Success: The page and `/realtime` upgrade use the same server-resolved context; the first full frame
  passes the existing sequence and projection validators and reaches the Canvas/semantic surface. The
  page receives expected scope from the shared server resolver before accepting a frame; because the
  server creates `connectionId` during connect, the transport validates the first frame against that
  scope and then binds the id only as transport correlation. It never self-binds player scope from the
  first frame.
- Success: Missing session, worker-not-ready, stale/closed connection, malformed frame, and unsupported
  capability states remain explicit; no browser value becomes world authority.
- Success: The focused session/wire/projection tests, typecheck, build, and documentation gates support
  a bounded `runtime_verified` claim for the local composition only.
- Non-goals: Production authentication or identity provider, public session issuance, arbitrary player
  selection, a new persistence schema, default all-phase scheduler, periodic snapshot publisher,
  state-changing browser controls, WebMCP, Agent Signal/Re-entry delivery, external services, hosted
  continuity, two-player G2 story closure, final art, or performance claims.

## Scope and authority

- In scope: A local fixture session resolver/boot path, explicit development/test configuration,
  entrypoint composition, first-frame client connection lifecycle, the minimum page wiring needed to
  consume an accepted frame, focused tests, and linked task/decision/scenario/evidence updates.
- Anticipated code owners: `src/server/entrypoint.ts`, `src/server/realtime-wire.ts`, a new
  `src/server/fixture-session.ts` or equivalent single resolver module, `src/client/realtime-projection.ts`,
  the smallest client connection adapter, `app/page.tsx`, `package.json`, and task-owned tests.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, external Receiver/Connector, mutable worker
  singletons in Next routes, production credentials, and unrelated dirty work.
- Allowed actions: Read/edit scoped game files, add focused tests and English documentation, install
  safe dependencies only when a measured local capability requires them, and run the minimum affected
  checks. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: the proposed resolver accepts a client player id, the fixture mode can run in
  production, bootstrap changes the `SK-MVP-0.2` identity/snapshot contract, a second worker/store is
  introduced, or the page needs a state-changing command to display the first frame.

## Owning authority

- Identity and snapshot contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership) and [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract)
- Process and route ownership: [`../Engineering/02-system-architecture.md`](../Engineering/02-system-architecture.md), [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md), and [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Existing realtime boundary: [`../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)
- Existing projection boundary: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Proposed choice and challenge: [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md) and [`../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md`](../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md)
- Constraining scenario: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md) and [`../Scenarios/16-cp16-local-vertical-slice-fixtures.md`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md)

## Evidence status

- Verified: CP-08's server-injected realtime resolver and CP-12's server-owned projection remain the
  predecessor boundaries. This task now verifies the additive local fixture resolver, explicit
  development/test flag, empty-or-exact-store admission, one entrypoint-owned store/worker/gateway,
  entrypoint bootstrap response, shared cookie context, pre-bound first-frame validation, and canonical
  page connection path. The result is bounded to the process-runtime claim in [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md).
- Unknown: Browser hydration, Canvas pixels, accessibility tree, keyboard interaction, reconnect UX,
  two simultaneous browser sessions, production identity, default scheduler, WebMCP, Re-entry, and
  hosted continuity remain open. The bootstrap boundary remains server-owned and page rendering cannot
  write the cookie. A need for a new hello/ticket message or a state-changing first-frame command
  reopens the wire decision.

## Owner decision record

- Decision: **Accepted Option B — explicit local fixture bootstrap.**
- Accepted on: `2026-09-02`.
- Authority: Owner instruction accepting Option B; the accepted boundary is recorded in [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md) and [`Validation/43`](../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md).
- Constraint: This acceptance authorizes only the bounded CP-12 local implementation described by the proposal. It does not authorize production identity, hosted continuity, WebMCP/Re-entry delivery, scheduler work, or state-changing browser controls.

## Implementation result

- Date: `2026-09-02`.
- Implementation: `src/server/fixture-session.ts` owns the fixed opaque handles, exact cookie parsing,
  persisted fixture admission, and server-derived shelter context; `src/server/entrypoint.ts` owns the
  explicit bootstrap boundary and one shared store/worker/gateway; the client bootstrap/projection path
  validates the expected scope before binding the server-issued connection id; `LiveGameProjection`
  wires the read-only page path without commands or retries.
- `npm run test:cp12-fixture`: 10 passed, 0 failed.
- `./node_modules/.bin/tsx --test tests/*.test.ts`: 178 passed, 0 failed.
- `npm run test:cp12-projection`: 5 passed, 0 failed; `npm run test:cp08-realtime`: 6 passed, 0 failed; `npm run test:cp08-wire`: 8 passed, 0 failed.
- `npm run typecheck`: passed; `npm run build`: passed.
- `python3 scripts/test_validate_game_docs.py`: 22 passed, 0 failed; `python3 scripts/validate_game_docs.py --root . --report`: passed after synchronization.
- `npx tsx /tmp/sleepless-kingdom-cp12-smoke.mts`: passed with page HTTP 200, bootstrap HTTP 200,
  `sleepless-mvp-01`/`player-a`/`shelter-a` payload, matching `client_snapshot` first frame, accepted
  projection, and post-validation connection-id binding.
- `git diff --check -- WebApp/Web-Game`: passed.
- Claim limit: these results support only the named local level-4 process-runtime boundary. They do not
  prove browser hydration or pixels, two-browser delivery, production identity, hosted continuity,
  WebMCP, Re-entry, scheduler, or judge reproduction. Full evidence and cross-functional review are in
  [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md) and
  [`Validation/45`](../Validation/45-cp12-local-fixture-session-runtime-cross-functional-audit.md).

## Contract proof and implementation notes

The Red proof was run before implementation and failed with the expected missing-module error. The
Green/Refactor result now covers fixed-slot scope isolation, production-disabled fixture mode,
missing/unknown/malformed session, empty or mismatched fixture store, one shared worker admission,
first-frame scope validation followed by two-phase connection-id binding, sequence/replacement,
readiness, method/error responses, and explicit stale/unsupported UI. No scheduler, command control,
or production auth fallback was added.

### Candidate Red proof matrix after acceptance

This matrix is a preparation aid for the accepted boundary. It is not a second task or an authority
change:

| Surface | Smallest positive proof | Required negative or boundary proof |
|---|---|---|
| Fixture session resolver | No-cookie request receives the fixed default session and server-derived scope; each known opaque handle resolves to its intended fixture player and shelter | Unknown, malformed, duplicated, or incorrectly named cookies fail; a query/body `player_id` cannot change the resolved scope |
| Configuration and production gate | Explicit fixture mode is admitted in `development`/`test` | Disabled mode, `production`, and invalid flag values remain visibly unsupported and do not issue a cookie |
| Fixture persistence | An empty store is seeded once and an exact single `sleepless-mvp-01` store loads through manifest/snapshot recovery | Extra world, mismatched world, missing snapshot, partial fixture, duplicate start, and concurrent preparation fail without overwrite or a second store |
| Entrypoint readiness | The one shared store is prepared before the one worker starts; a ready bootstrap response is uncached and carries only capability, contract version, and server-derived scope | `starting`/`degraded`/`draining`/`stopped`/`failed` states return typed non-success; Next is not allowed to handle the fixture path; preparation failure closes the store |
| First-frame projection | A valid full frame matching the pre-bound scope is accepted and binds its server-issued connection id | Malformed, foreign-scope, invalid-sequence, or closed-channel frames never bind an id; an unbound client cannot issue resync; later frames enforce id and monotonic replacement rules |
| Page-to-wire composition | The bootstrap scope and WebSocket resolver context are identical and one full frame reaches the existing Canvas/semantic projection | Bootstrap failure, socket failure, stale state, and unsupported capability remain visible; no automatic retry loop or state-changing command is triggered |

## Verification and closure target

- Minimum verification completed: focused CP-12 session/client tests plus CP-08 wire regression and
  CP-12 projection tests; the available aggregate; `npm run typecheck`, `npm run build`, both game
  documentation validators; and one real local process smoke. No browser automation was run.
- Closure result: `runtime_verified` for one local fixture session and first full frame. This task does
  not claim the level-5 two-browser G2 story, genuine WebMCP, Re-entry, hosted continuity, or scheduler.
- Rollback or remediation: disable the explicit fixture mode and retain the existing visibly unsupported
  default when any scope, production-gating, or frame-sequence invariant fails. Revert only task-owned
  uncommitted paths; do not reset or clean unrelated work.
- Reopen trigger: any production path can issue fixture identity, any request can choose a player,
  bootstrap creates a second authority, the first frame is accepted without server scope/sequence
  validation, a foreign-scope first frame binds a connection id, a stale connection hides the
  limitation, a new hello/ticket wire message is required, or a new contract/version is required.
