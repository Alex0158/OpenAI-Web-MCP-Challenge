# SK-EVID-026: CP-12 Client Projection and Accessible Mission Row Runtime Verification

## Identity

- Evidence ID: `SK-EVID-026`
- Related task and decision: [`SK-TASK-037`](../Tasks/SK-TASK-037-cp12-client-projection-and-mission-row.md); [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — local file-backed worker runtime plus pure client projection and build boundary
- Executor and date: Codex, 2026-09-02

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit or push claim)
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v26.5.0`; npm `11.17.0`; TypeScript `7.0.2`; Next.js `16.3.4`; temporary file-backed SQLite with WAL and foreign keys
- Fixture world and seed: `cp12-projection-world`, seed `sleepless-mvp-01`, generation `g2-fixture-1`
- Environment and configuration: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`; server-created worker and gateway; no external Receiver, Codex Thread, browser capability, credential, or hosted service

## Objective and claim boundary

- Behavior under test: The existing server-owned `client_snapshot` read model exposes only the bound player's accepted Wood/Rock and mission projection, and a pure client model produces a deterministic Canvas command list and semantic mission rows with explicit degraded states.
- Claim this evidence may support: local level-4 verification of the named CP-12 projection joins, scope/privacy, server-derived travelling/returning positions, resident/active/review mission rows, deterministic draw commands, accessibility text, malformed-frame rejection, and build/type compatibility.
- Claims this evidence cannot support: browser or Canvas-pixel behavior, keyboard input, interpolation, live session/bootstrap, real WebMCP registration or invocation, Agent Signal/Re-entry delivery, default scheduler composition, hosted continuity, deployment, production performance, or judge reproduction.

## Preconditions and fixture

- Starting state: A fresh file-backed G2 fixture with two players, two protected shelters at `(16,64)` and `(112,64)`, five starter soldiers per shelter, symmetric Wood/Rock nodes, and the seeded monster.
- Synthetic identities and seeded actors: `player-a`/`binding-a`, `player-b`/`binding-b`, `shelter-a`, `shelter-b`, `soldier-a-01` through `soldier-a-05`, `soldier-b-01` through `soldier-b-05`, `node-wood-a`, `node-rock-a`, and `monster-seeded-01`.
- Real, fake, and stubbed boundaries: The worker, gateway, persistence store, mission services, world clock, and combat services are real local code. World time is advanced explicitly by the test worker. The page receives a null snapshot because live session/bootstrap is intentionally outside this task. No external capability or hosted process is stubbed as success.

## Execution

| Replayable command | Result |
|---|---|
| `npm run test:cp12-projection` | **5 passed** — sensed Wood/Rock and resident row, active gatherer route position, returning Hunter reverse route and terminal encounter, owner privacy/review state, deterministic commands/accessibility/null/stale/unsupported/invalid/malformed states |
| `npm run test:cp08` | **4 passed** — movement authority, migration, ownership/stale rejection, and predecessor full snapshot scope |
| `npm run test:cp08-realtime` | **6 passed** — full replacement, sequence, scope, stale, lifecycle, and invalid frame predecessor boundary |
| `npm run test:cp08-wire` | **8 passed** — authenticated local wire upgrade, payload rejection, resolver admission, and drain lifecycle |
| `npm run test:cp09` | **15 passed** — dispatch, role lock, route milestone, ordering, duplicate, stale, ownership, and restart predecessor boundary |
| `npm run test:cp10` | **44 passed** — extraction, cadence, contested node, return navigation, and cargo predecessor boundaries |
| `npm run test:cp10-deposit` | **16 passed** — deposit, Wood/Rock coin settlement, retry, rollback, restart, and mission reuse |
| `npm run test:cp11` | **7 passed** — gatherer contact, deterministic combat, cargo loss, respawn, rollback, duplicate, and restart |
| `npm run test:cp11-hunter` | **6 passed** — Hunter dispatch, victory, monster deactivation, return/settlement, reservation, rollback, and restart |
| `./node_modules/.bin/tsx --test tests/cp11-reissue.test.ts` | **8 passed** — danger-cell route, no-route/repeated-death review, reset, migration, rollback, deposit reset, and restart |
| `./node_modules/.bin/tsx --test tests/*.test.ts` | **168 passed, 0 failed** — explicit local aggregate across all available test files |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build mounts the projection page shell |
| `python3 scripts/test_validate_game_docs.py` | **21 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed** after Task-037 closure; expected terminal-task count is recorded with the synchronized docs |

## Runtime proof

1. The initial projection contains only the two Wood/Rock nodes sensed by `shelter-a`, reports
   availability and observation time, omits exact node quantity, and emits five resident mission
   rows with `AT_SHELTER`/`DISPATCH` and empty cargo.
2. Dispatching `soldier-a-01` as a tier-one `GATHERER` with `AXE` to `node-wood-a`, then advancing
   one worker second, produces the persisted route and a server-derived position of `(19,64)` in
   `TRAVELLING`; the soldier actor and soldier row agree without a client coordinate input.
3. Dispatching `soldier-a-02` as a `HUNTER` with `SWORD` to the seeded monster, advancing through the
   five-round victory, produces a `RETURNING` row at `(48,64)` and then `(45,64)` one world second
   later on the validated reversed route. The resolved `MONSTER_DEFEATED` context remains visible and
   no cargo or coin settlement is invented.
4. Dispatching the seeded Rock gatherer and advancing through the fixed danger-cell contact produces
   an owner-only `WAITING_REVIEW` row with `NO_SAFE_REISSUE_ROUTE`, budget `0`, `GATHERER_LOST`, and
   the latest role/tool metadata. Player B's snapshot contains none of Player A's mission, soldier,
   shelter, or binding identifiers.
5. Repeating the same valid snapshot produces the same ordered draw commands. The semantic row names
   phase, role, tool, target, cargo/risk, next action, and cause/review. Null, stale, unsupported, and
   malformed lifecycle/coordinate frames resolve to explicit non-ready states with no mission rows.

## Assertions

- Player-visible state: The pure model exposes `READY`, `STALE`, `WAITING_FOR_SNAPSHOT`, and
  `INVALID_FRAME` explicitly; the component keeps shelter, world time, mission rows, event history,
  and capability status readable.
- Command and failure contract: No CP-12 state-changing command was added. Scope, lifecycle, route,
  cargo, coordinate, revision, and capability data are validated before draw commands are produced.
- Persistence, event, and outbox state: Projection reads existing persisted records only; the focused
  vectors confirm mission/combat/deposit/reissue event history remains owned by the predecessor
  transactions.
- Exactly-once settlement after duplicate delivery and replay: CP-08 through CP-11 predecessor suites
  pass in the aggregate; the projection itself is pure and cannot settle or replay a domain effect.
- Ownership denial, stale revision, restart, and reconnect: CP-08 through CP-11 scope, stale, restart,
  and idempotency vectors pass; CP-12 separately rejects foreign soldier actors and invalid frames.

## Analysis and closure

- Failure classification: `evidence` boundary reviewed; no product, test, fixture, or environment
  failure remained after the projection hardening and focused rerun.
- Limitations and residual risk: The page is intentionally mounted with no live snapshot. Browser
  session/bootstrap, Canvas pixel inspection, keyboard path, interpolation, obstacle fixture, final
  art, WebMCP, Re-entry, hosted continuity, deployment, and performance claims remain unknown.
- Invalidation triggers: Any change to the `client_snapshot` shape or scope, contract/schema version,
  route/time derivation, mission lifecycle, visibility rule, realtime replacement validator, fixture
  seed, runtime dependency, or later task that moves projection authority invalidates this record.
- Exact conclusion: **SK-TASK-037 is runtime-verified for the local server projection, pure client
  model, deterministic placeholder renderer, semantic mission/status surface, and named predecessor
  regressions at level 4. CP-12's live browser and capability gates remain open.**

