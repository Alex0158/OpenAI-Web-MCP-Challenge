# SK-EVID-066: CP-17 Player One Hosted Session, Command, and Realtime Runtime Verification

## Identity

- Evidence ID: `SK-EVID-066`
- Related task, issue, or decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-EVID-065`](SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `hosted`
- Ladder level: `4`
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, HEAD `5594397`; hosted deployment `218112db-21b0-4c49-8758-50e02dc6352c` runs the exact Game source supplied to Railway, with unrelated collaborator-owned working-tree changes preserved
- Contract version: `SK-MVP-0.2`
- Runtime versions: Railway Node.js `v24.19.0`; Codex In-app Browser authenticated context on `https://game.sleepless-kingdom.com`
- Fixture world and seed: no fixture cookie or fixture mode; `GAME_DB_PATH=/data/world.sqlite`, `LOCAL_FIXTURE_MODE=0`, and `AUTONOMOUS_WORLD_MODE=1`
- Environment and configuration: Railway project `sleepless-kingdom`, production `game` service, `game-data` Volume at `/data`; Clerk Production invite-only identity `player1` mapped by the server to `player-a`

## Objective and claim boundary

- Behavior under test: Prove one real Clerk Production session reaches the hosted Game, receives a server-derived Player A projection, submits one valid GATHERER command, and observes worker-owned extraction, deposit, and realtime snapshot progression.
- Claim this evidence may support: One authenticated Player A browser journey, one accepted server command, one bounded gatherer mission from dispatch through deposit, authoritative event readback, and advancing hosted realtime snapshots in the named deployment.
- Claims this evidence cannot support: Player B admission, two-session isolation, cross-player denial, a directly captured WebSocket handshake, browser-free progression, restart/Volume continuity, backup/restore, rollback, Cloud Receiver/Local Connector delivery, WebMCP dynamic action, judge reproduction, or `hosted_verified` closure.

## Preconditions and fixture

- Starting state: [`SK-EVID-065`](SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md) proved the public Railway/Clerk entry surface and recorded the rotated secret and custom-domain certificate.
- Synthetic identities and seeded actors: No synthetic identity was used. The owner logged into the pre-created `player1` account; the password was not read, recorded, or transmitted by Codex.
- Real, fake, and stubbed boundaries: Clerk session presentation, hosted Game page, server bootstrap, HTTP command path, worker, SQLite-backed world, and realtime projection were real hosted boundaries. No fixture resolver, fixture cookie, local transport stub, or client-selected player identity was used.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Open the canonical Game URL after the owner completes `player1` sign-in | The signed-in shell exposes the player session and authoritative Game projection | The page showed `Player 1`, visible username `player1`, `Connection: READY`, `Realtime capability: supported`, `WebMCP: registered`, and a server snapshot at world time `2763` | **pass** |
| Leave the authenticated page connected for 1.4 seconds and compare two authoritative snapshot readbacks | The server-owned world clock advances without a page-local clock | World time advanced from `2821` to `2822`; connection remained ready and no new browser errors were observed | **pass** |
| Select `soldier-a-01` and `Wood — node-wood-a`, then click `Dispatch gatherer` | One valid command is accepted and the mission is reconciled from the authoritative snapshot | The page reported `Dispatch accepted. Mission reconciled from the authoritative snapshot`; `soldier-a-01` entered `TRAVELLING`/`WORKING` as `GATHERER` with `AXE` targeting `node-wood-a` | **pass** |
| Wait for the worker to process the mission and reread the hosted projection | Extraction, return, and deposit complete once; cargo is no longer exposed after settlement | At world time `2846`, `soldier-a-01` was `AT_SHELTER` with `cargo 0/5`; causal history showed five `CargoExtracted` records and one `CargoDeposited`, and Coins read `5` | **pass** |

## Assertions

- Player-visible state: The authenticated shell identifies `player1` as Player 1 and renders the same server snapshot through the map, mission status, economy, and causal-history surfaces.
- Command and failure contract: The ordinary UI submitted one typed GATHERER command using the current authoritative selection; the page accepted the server result and resynced before showing the settled mission.
- Persistence, event, and outbox state: The hosted projection exposed the ordered extraction/deposit outcome and settled wallet value in one running worker interval; no restart or durable replay was attempted.
- Exactly-once settlement after duplicate delivery and replay: not exercised.
- Ownership denial, stale revision, restart, and reconnect: not exercised; Player B and cross-scope checks remain open.

## Analysis and closure

- Failure classification: `unknown` for all unexecuted second-identity and recovery rows; no failure occurred in the single Player A journey.
- Limitations and residual risk: This is one authenticated hosted session. The UI's ready/realtime state and successful command prove the named page-to-worker path, but they do not replace a two-context admission rehearsal or a direct WebSocket, no-browser, restart, backup, and rollback readback.
- Invalidation triggers: Source or contract change, Railway deployment replacement, Clerk instance/key/origin change, Volume replacement, auth/session mapping change, or a changed canonical URL.
- Exact conclusion: One Player A hosted session, one valid GATHERER command, and one extraction-to-deposit realtime journey are verified at a bounded hosted level-4 scope. CP-17 remains `in_progress`; this record does not claim two-player hosted closure or `hosted_verified`.
