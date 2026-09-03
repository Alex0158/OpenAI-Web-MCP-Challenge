# SK-EVID-010: CP-07 World Fixture Runtime Verification

## Identity

- Evidence ID: `SK-EVID-010`
- Related task, issue, or decision: `SK-TASK-021`, `ADR-GAME-0010`, `ADR-GAME-0012`
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: `Codex primary session; 2026-09-02`

## Exact identity under test

- Source state: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`; CP-07 source, tests, and documentation changes are intentionally uncommitted.
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.18.0` selected through `/Users/alex/.nvm/versions/node/v24.18.0/bin`, npm `11.17.0`, Next.js `16.3.4`, TypeScript `7.0.2`, and built-in `node:sqlite`.
- Fixture world and seed: `fixture-world-a` and `fixture-world-b` reset fixtures plus `sleepless-mvp-01` / `g2-fixture-1`; each database is file-backed in a temporary directory and removed by the test.
- Environment and configuration: local macOS process; no browser, secrets, external Receiver, WebMCP adapter, hosted database, or public service.

## Objective and claim boundary

- Behavior under test: deterministic G2 manifest generation, canonical fingerprinting, geometry and placement invariants, world-scoped identity rows, atomic fixture creation, duplicate/reset isolation, CP-06 clock handoff, and close/reopen manifest validation.
- Claim this evidence may support: the named local fixture and persistence boundary produces and reloads the accepted deterministic two-player G2 setup under isolated file-backed worlds.
- Claims this evidence cannot support: procedural terrain, pathfinding, movement, fog or hidden-state filtering, missions, extraction, combat, authentication, default-world bootstrap, browser/client projections, WebMCP discovery, external Agent delivery, hosted continuity, load, balance, or Hackathon submission readiness.

## Preconditions and fixture

- Starting state: CP-06 clock/recovery and CP-05 file-backed persistence seams are locally verified; the CP-07 Red harness intentionally imports the absent fixture module before Green implementation.
- Synthetic identities and seeded actors: `player-a`/`player-b`, `shelter-a`/`shelter-b`, five soldier IDs per shelter, four Wood/Rock node IDs, and `monster-seeded-01`.
- Real, fake, and stubbed boundaries: actual Node.js `node:sqlite`, `PersistenceStore`, `WorldClock`, and fixture module are used; player bindings and no-path terrain are synthetic fixture inputs.

## Execution

- Exact commands:
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp07`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp06`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp05`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp04`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run typecheck`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run build`
  - `python3 scripts/test_validate_game_docs.py`
  - `python3 scripts/validate_game_docs.py --root . --report`
  - `git diff --check -- WebApp/Web-Game`
- Expected result: CP-07 fixture vectors and affected CP-06/CP-05/CP-04 checks pass; invalid creation leaves no partial rows; close/reopen returns the same manifest and fingerprint.
- Actual result: 5 CP-07 tests passed; 8 CP-06 tests passed; 26 CP-05 tests passed; 5 CP-04 tests passed; TypeScript typecheck, Next.js production build, 21 documentation self-tests, the full documentation validator, and `git diff --check` passed.
- Status: `pass`
- Output location: bounded command output and assertions were read in the local session; temporary databases were removed by the fixtures; no raw logs, credentials, or runtime databases were committed.

## Assertions

- Determinism: same accepted seed/version produces byte-equivalent manifest data and a stable 64-character fingerprint; unsupported seed/version fails with typed `INVALID_INPUT`.
- Geometry: the 128 × 128 fixture contains shelters 96 tiles apart, mirrored Wood/Rock nodes in the inclusive 14–20-tile band outside the 12-tile protected radius, an in-bounds seeded monster, and a route that intentionally visits the Rock threat cell while initial records remain non-overlapping.
- Identity and state: exactly two players, two shelters, ten `AT_SHELTER` soldiers, four 20-unit nodes, and one `PATROL` monster persist under each `world_id`; canonical IDs and revisions remain stable.
- Atomicity and reset: invalid snapshot insertion rolls back all fixture rows; duplicate world creation returns `DUPLICATE_COMMAND`; two reset worlds retain independent event history and row counts.
- Clock and restart: a fixture accepts the CP-06 integer clock at world time zero, advances through the same persistence seam, and `loadPersistedG2Fixture` reloads the manifest and matching world seed/version/fingerprint after close/reopen without regenerating it.

## Analysis and closure

- Failure classification: the initial Red proof failed because the fixture module did not exist, as intended. Green implementation then required explicit player/shelter list reads and a persisted-loader validation seam; focused tests were rerun after each correction.
- Intentionally unrun: terrain/pathfinding, live player join/authentication, hidden-state client projection, missions, extraction, combat, event-driven scheduler replay, default process world bootstrap, external Agent handoff, hosted deployment, performance load, and the full repository suite. These are later gates or outside the registered task.
- Limitations and residual risk: the fixture uses an explicit open-grid preset; positions and route metadata are carried by the server-owned snapshot manifest while current CP-05 relational rows carry identity/state/quantity. The default worker has no automatic world bootstrap yet.
- Invalidation triggers: changes to `SK-MVP-0.2`, ADR-GAME-0010/0012, fixture coordinates or route, persistence schema, clock/worker ownership, Node/SQLite baseline, seed/version, or the named CP-07 sources/tests.
- Exact conclusion: CP-07 is `runtime_verified` for the local deterministic fixture and world-scoped persistence boundary. Later checkpoints still own movement, visibility, gameplay, page, Agent, and hosted claims.
