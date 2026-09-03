# SK-EVID-043: CP-12 Server-Owned Continuous Movement Intent

## Identity

- Evidence ID: `SK-EVID-043`
- Related task, decision, and challenge: [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md), [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md), [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — real local worker/cadence, file-backed SQLite fixture, authenticated local WebSocket, server-bound session ownership, and client lifecycle controller; no hosted or external adapter
- Executor and date: Codex, 2026-09-03, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD e7be681a79f4b12f87d5ed80034c5dc92f67e7bc`; Task057 source, tests, and records are uncommitted and remain mixed with pre-existing workspace changes. No commit, push, deployment, or hosted environment was used.
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; the continuous-intent increment adds no persistence schema, event vocabulary, or snapshot-shape revision
- Persistence and fixture: schema `8`; fresh file-backed SQLite stores created per test from the `sleepless-mvp-01` G2 fixture, with `player-a`/`binding-a`, `player-b`/`binding-b`, and the deterministic 128 × 128 map
- Runtime versions: Node.js `v24.13.1`, npm `11.8.0`, TypeScript `7.0.2`, `tsx` `4.23.13`, Next.js `16.3.4`, React `19.2.8`, and `ws` `8.21.3`
- Environment and configuration: local macOS process, explicit worker advances for deterministic traces, one-shot WebSocket command frames, no browser timer, no periodic control stream, no lease/heartbeat, no external Agent, and no WebMCP adapter

## Objective and claim boundary

- Behavior under test: Option B from `ADR-GAME-0036`: a strict server-bound start/replacement/stop frame sets the existing worker-owned 100 ms movement intent, the worker alone performs integer crossings, complete `client_snapshot` frames remain the only renderable position ingress, and connection/lifecycle or competing mutations stop the intent.
- Claim this evidence may support: the named local server-to-page implementation of frame parsing, command identity/idempotency, connection owner supersession, same-owner stale fail-stop, stale safety release, blocked terminal failure, move/dispatch safety stop, worker fault/stop cleanup, runtime-admission rejection on established connections, client single-flight lifecycle, authenticated wire delegation, automatic local worker progress, and hard connection-close revocation.
- Claims this evidence cannot support: wall-clock autonomous scheduler throughput, hosted or production continuity, public capacity, independent browser identity, production authentication, positive WebMCP discovery/invocation, Re-entry delivery, Receiver/Connector/Thread handoff, mobile device feel, or judge reproduction.

## Preconditions and fixture

- Starting state: each case opens a new file-backed store and persists the accepted G2 fixture at `world_time = 0`; no client-selected world, player, shelter, or connection scope is accepted.
- Synthetic identities and seeded actors: `player-a`/`binding-a` and `player-b`/`binding-b`; the runtime wire cases resolve Player A from the server-side session resolver and use opaque owner tokens equal to the server-issued connection id.
- Real, fake, and stubbed boundaries: `PersistenceStore`, `PlayerMovementService`, `PlayerMovementCadenceService`, `WorkerCommandGateway`, `WorldWorkerModule`, `WorldClock`, `RealtimeSnapshotHub`, `RealtimeWireAdapter`, `ws`, and the file-backed fixture are real local code. Client controller tests use an injected send function; no external transport is stubbed as success.

## Execution

| Replayable command or procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Pre-change Red run for `tests/cp12-server-movement-intent.test.ts` | New frame, ownership, lifecycle, and worker composition cases fail before the seam exists | The task-owned cases were introduced as Red against the prior connect/resync-only boundary, then implemented | **pass (expected Red)** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-intent` | Strict frames, owner races, stale/blocked safety, worker lifecycle, client controller, wire delegation, runtime-admission rejection, and real worker cadence pass | 13 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp08-cadence` | Existing 100 ms cadence, stale/replacement/stop, boundary, and restart behavior remains green | 5 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp08-gateway` | FIFO, close, direct move, advance, and full-snapshot ordering remains green | 7 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp08-wire` | Authenticated entrypoint wire and unsupported/admission behavior remains green | 8 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp08-realtime` | Realtime connect/resync/privacy/failure/close behavior remains green | 6 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-publication` | Automatic full-snapshot publication, coalescing, failure isolation, and drain behavior remains green | 24 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-keyboard` | Existing discrete keyboard/button and presentation fallback boundaries remain green | 13 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-fixture` | Fixture bootstrap, scope, and entrypoint configuration boundaries remain green | 10 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-reconnect` | Reconnect, stale scope, and focus lifecycle behavior remains green | 3 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-projection` | Server-derived projection and semantic state remain green | 5 tests passed, 0 failed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run typecheck` | Source and tests compile under the pinned Node 24 toolchain | Passed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run build` | Optimized Next.js build succeeds with the page wiring | Completed successfully | **pass** |
| `python3 scripts/test_validate_game_docs.py` | Documentation validator self-tests remain green | 22 tests passed | **pass** |
| `python3 scripts/validate_game_docs.py --root . --report` | Task, decision, evidence, validation, and relative-link records are internally consistent | Passed after Evidence043 and Validation71 were added; non-terminal tasks remain the separate CP-13 gates | **pass** |

### Real local wire trace

1. Persist a fresh `sleepless-mvp-01` fixture and start a real `WorldWorkerModule` with its gateway and `WorldClock`.
2. Attach a real `RealtimeWireAdapter` and `ws` client. The first full snapshot resolves Player A at `(16,64)`, revision `0`.
3. Send one `movement_intent_command` `start/right` frame using the accepted revision. The adapter returns one metadata-only `movement_intent_result` with `effect = intent_set`; no position is taken from that result.
4. Call the real worker `advance(100)` three times. The worker cadence crosses one tile, and a full snapshot read returns Player A at `(17,64)`.
5. Close the WebSocket, wait for the close callback, then advance the same worker three more times. The position remains `(17,64)`, proving the closed connection owner cannot cross again.
6. The test stops the worker and removes its temporary SQLite directory. The worker-fault case separately clears the active intent before three subsequent advances, and the blocked-edge case emits one terminal `MOVEMENT_BLOCKED` failure without a retry loop.

## Assertions

- Player-visible state: Position changes only through worker cadence and the existing full `client_snapshot`; command-result frames contain metadata and never a position. A successful local trace moves Player A from `(16,64)` to `(17,64)` after three 100 ms advances and stops at the connection boundary.
- Command and failure contract: The shared parser rejects client scope/query/unknown fields and equal command/idempotency identities. Start/replacement/stop results carry typed effect, duplicate, owner status, contract version, and current player revision; invalid or unknown client results require recovery.
- Persistence, event, and outbox state: Existing `PlayerMoved`/revision/idempotency transactions and snapshot schema are reused. The safety-stop marker is process-local command bookkeeping through the existing store and creates no new domain event, cargo, mission, combat, coin, or outbox effect.
- Exactly-once settlement after duplicate delivery and replay: Command idempotency remains separate from cadence crossing identity. Duplicate command replay returns the stored metadata and does not reactivate or clear a later intent; each worker crossing uses its own derived crossing identity.
- Ownership denial, stale revision, restart, and reconnect: A newer owner supersedes an older one; an old stop/close cannot clear the newer owner. Same-owner stale replacement fail-stops the old direction, explicit stop uses the current revision as a safety release, worker fault/stop clears process-local intents, and reconnect requires a fresh explicit start.

## Analysis and closure

- Failure classification: `product` — the prior page hold was round-trip bound and the realtime close path did not own a movement stop; the smallest accepted server-intent seam closes those cross-module gaps while preserving existing authorities.
- Limitations and residual risk: The trace uses explicit worker advances and a local `ws` client; it does not measure unpaused scheduler throughput, production latency, hosted process replacement, public fan-out, or independent browser profiles. Blur/hidden remains best effort by the accepted no-lease MVP policy. The process-local closed-owner tombstone set is bounded only by process lifetime and should be revisited if connection churn becomes a public-scale concern.
- Invalidation triggers: Changes to `SK-MVP-0.2`, the worker/cadence due-work order, movement or mission mutation gate, realtime session resolver, frame/result schema, snapshot sequence/shape, connection lifecycle, fixture seed, persistence schema, or Node/runtime versions.
- Exact conclusion: **`SK-TASK-057` is runtime-verified for the named local server-owned continuous-intent worker-to-page scope. Option B is implemented with one-shot WebSocket commands, server-issued connection ownership, worker-only movement, full-snapshot-only rendering, stale/blocked/competing-mutation safety stops, worker lifecycle cleanup, and hard close revocation. Hosted continuity, independent browsers, WebMCP, Re-entry, production identity, and judge claims remain open.**
