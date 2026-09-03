# SK-EVID-068: CP-17 Independent Contexts and Concurrent Hosted Runtime Verification

## Identity

- Evidence ID: `SK-EVID-068`
- Related task, issue, or decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-EVID-065`](SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md), [`SK-EVID-066`](SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md), [`SK-EVID-067`](SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `hosted`
- Ladder level: `5`
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, HEAD `5594397`; hosted deployment `218112db-21b0-4c49-8758-50e02dc6352c` runs the exact Game source supplied to Railway, with unrelated collaborator-owned working-tree changes preserved
- Contract version: `SK-MVP-0.2`
- Runtime versions: Railway Node.js `v24.19.0`; Player A in a user-owned Chrome extension tab and Player B in the Codex In-app Browser
- Fixture world and seed: no fixture cookie or fixture mode; `GAME_DB_PATH=/data/world.sqlite`, `LOCAL_FIXTURE_MODE=0`, and `AUTONOMOUS_WORLD_MODE=1`
- Environment and configuration: Railway project `sleepless-kingdom`, production `game` service, `game-data` Volume at `/data`; Clerk Production `player1` mapped to `player-a` and `player2` mapped to `player-b`

## Objective and claim boundary

- Behavior under test: Prove two independently authenticated browser contexts can remain connected to the same hosted world while each receives only its server-derived scope, submits a valid command, observes worker settlement, and receives advancing realtime snapshots.
- Claim this evidence may support: Two simultaneous authenticated page sessions, distinct Player A/Player B and shelter scopes, two concurrent accepted GATHERER commands, worker extraction/deposit readback in each scope, and shared hosted world-clock/realtime progression in the named deployment.
- Claims this evidence cannot support: A deliberately forged cross-player command denial, a directly captured WebSocket handshake or typed upgrade failure, browser-free progression, restart/Volume continuity, backup/restore, rollback, Cloud Receiver/Local Connector delivery, WebMCP dynamic action, judge reproduction, or `hosted_verified` closure.

## Preconditions and fixture

- Starting state: [`SK-EVID-065`](SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md) proved the deployed Railway/Clerk entry surface; [`SK-EVID-066`](SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md) and [`SK-EVID-067`](SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md) proved the two single-player slices.
- Synthetic identities and seeded actors: No synthetic identity was used. The owner supplied the two browser sign-ins; passwords were entered by the owner and were not read, recorded, or transmitted by Codex.
- Real, fake, and stubbed boundaries: Chrome and the Codex In-app Browser, Clerk sessions, hosted Game bootstrap, HTTP command path, worker, SQLite-backed world, event history, and realtime projections were real hosted boundaries. No fixture resolver, fixture cookie, local transport stub, or client-selected player identity was used.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Keep the owner-authenticated `player1` page in Chrome and `player2` page in the Codex In-app Browser at the canonical Game URL | Two different browser contexts expose their own signed-in account surfaces | Chrome showed `Player 1` / `player1`; the Codex Browser showed `Player 2` / `player2`; both pages reported `Connection: READY` and `Realtime capability: supported` | **pass** |
| Read both authoritative projections at the same interval | Each context has its own server-derived shelter and does not expose the opposite shelter | Player A showed `shelter-a` and no `shelter-b`; Player B showed `shelter-b` and no `shelter-a`; both were observing world time `3778` | **pass** |
| Select `soldier-a-02`/`node-wood-a` in Chrome and `soldier-b-02`/`node-wood-b` in the Codex Browser, then dispatch both commands together | Each command is admitted against its current scope and does not block the other scope | Both pages reported `Dispatch accepted. Mission reconciled from the authoritative snapshot` at world time `3799`; the soldiers entered `TRAVELLING` as GATHERERs with `AXE` tools and their own resource targets | **pass** |
| Wait for both workers and reread both projections | Each mission extracts, returns, deposits, and releases its own soldier | At world time `3819`, `soldier-a-02` and `soldier-b-02` were both `AT_SHELTER` with `cargo 0/5`; each causal history included the extraction sequence and a new `CargoDeposited`; Player A Coins read `15` and Player B Coins read `10` | **pass** |
| Compare realtime snapshots from both contexts across 1.4 seconds | Both connections remain ready and receive the same advancing world clock | Player A and Player B advanced from world time `3857` to `3859`; both stayed `Connection: READY`, and neither browser produced a new error in the observation window | **pass** |
| Read browser capability banners | Capability claims remain browser-specific and do not alter gameplay authority | Codex Browser reported `WebMCP: registered`; Chrome reported `WebMCP: unsupported` while its human controls remained available | **pass** |

## Assertions

- Player-visible state: Two simultaneous pages identify different accounts and render distinct server-derived shelters, soldiers, resources, and causal history.
- Command and failure contract: Each ordinary UI command was submitted against its own current snapshot and accepted without a cross-context mutation. A deliberately wrong-scope request was not sent.
- Persistence, event, and outbox state: Both workers exposed ordered extraction/deposit outcomes and wallet changes in the hosted projection; restart and durable replay were not attempted.
- Exactly-once settlement after duplicate delivery and replay: not exercised.
- Ownership denial, stale revision, restart, and reconnect: not exercised; cross-scope rejection and recovery remain open.

## Analysis and closure

- Failure classification: `unknown` for deliberate denial and recovery rows; no failure occurred in the concurrent two-context slice.
- Limitations and residual risk: Realtime readiness and private projections establish a strong two-context slice, but they do not prove that a forged command is rejected, that the wire upgrade has the expected typed failure behavior, or that the same state survives browser absence and service restart.
- Invalidation triggers: Source or contract change, Railway deployment replacement, Clerk instance/key/origin change, Volume replacement, auth/session mapping change, or a changed canonical URL.
- Exact conclusion: Two independently authenticated browser contexts completed scoped commands, worker settlement, and shared realtime progression at hosted ladder level 5. CP-17 remains `in_progress`; this record does not claim cross-player denial, recovery continuity, or `hosted_verified`.
