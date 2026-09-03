# SK-EVID-040: CP-12 Autonomous Realtime Snapshot Publication

## Identity

- Evidence ID: `SK-EVID-040`
- Related task or decision: [`SK-TASK-051`](../Tasks/SK-TASK-051-cp12-autonomous-realtime-snapshot-publication.md), [`ADR-GAME-0034`](../Decisions/ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md), `SK-MVP-0.2`
- Evidence class: `process-runtime`
- Ladder level: `4` — real local worker, file-backed fixture, authenticated WebSocket, and scoped full-frame projection; no hosted or external adapter
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main` at `HEAD 2771a7d`; task-owned game source/tests/records are uncommitted and remain mixed with pre-existing workspace changes. No commit, push, deployment, or hosted environment was used.
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Persistence schema: version `8`, including the accepted autonomous server-time anchor migration
- Runtime versions: Node.js `v24.13.1`, npm `11.8.0`, TypeScript `7.0.2`, `tsx` `4.23.13`, Next.js `16.3.4`, React `19.2.8`, and `ws` `8.21.3`
- Fixture world and seed: fresh temporary file-backed store prepared by the local `sleepless-mvp-01` G2 fixture; authenticated `player-a`/`fixture-binding-a` scope; the fixture also contains the symmetric Player B scope
- Configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `AUTONOMOUS_WORLD_MODE=1`, ephemeral HTTP port, and a fresh temporary `world.sqlite`. The autonomous wakeup is stopped after startup so the explicit worker advance remains deterministic; the worker was still composed through the autonomous lifecycle path.

## Objective and claim boundary

- Behavior under test: A successful worker-owned advance notifies the entrypoint-owned realtime adapter, which requests a changed full `client_snapshot` through the existing FIFO gateway and delivers it to a ready authenticated connection. Equal automatic content is suppressed, latest progress is bounded, and lifecycle/failure state remains explicit.
- Claim this evidence may support: one explicitly enabled local worker-to-page automatic full-snapshot publication seam, its per-connection sequence/scope/coalescing behavior, and clean local drain.
- Claims this evidence cannot support: a default continuously advancing world, hosted continuity, public-load fan-out capacity, independent browser identities, production authentication, positive WebMCP discovery/invocation, Re-entry delivery, Receiver/Connector handoff, Agent Thread wake, or judge reproduction.

## Preconditions and fixture

- Starting state: Fresh fixture at world time `0`; the first connection receives sequence `1` and Player A's seeded position `(16,64)`.
- Synthetic identities and actors: server-resolved Player A scope; the worker's real gateway and clock; no client-selected world, player, or binding.
- Real, fake, and stubbed boundaries: WorldWorker, WorldClock, autonomous scheduler construction, entrypoint, RealtimeWireAdapter, RealtimeSnapshotHub, gateway, SQLite fixture, and `ws` sink are real local code. Unit publication cases use a deterministic in-memory gateway/sink to hold reads and inject failures. No external Agent or transport is stubbed as a successful result.

## Execution

| Replayable command or procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Pre-change `npm run test:cp12-publication` under Node 24 | The new contract cases fail against the connect/resync-only implementation | Five Red failures: `publishCurrentSnapshots()` and `onAdvance()` were absent | **pass (expected Red)** |
| `npm run test:cp12-publication` | Changed/equal, empty-pump and latest coalescing, slow/fast isolation, settled-drain and connect-time progress, explicit-during-automatic and explicit-during-resync races, sink failure/recovery/visibility, scope, close/drain joining, worker observer, custom adapter, and wire cases pass | 24 tests passed (19 contract cases and 5 wire cases) | **pass** |
| `npm run test:cp08` | Existing movement/snapshot projection remains green | 4 tests passed | **pass** |
| `npm run test:cp08-realtime` | Existing connect/resync/privacy/lifecycle behavior remains green | 6 tests passed | **pass** |
| `npm run test:cp08-wire` | Existing authenticated wire and entrypoint lifecycle remain green | 8 tests passed | **pass** |
| `npm run test:cp08-cadence` and `npm run test:cp08-gateway` | Worker cadence and FIFO command/read boundaries remain green | 5 and 7 tests passed | **pass** |
| `npm run test:cp06-autonomous-runtime` and `npm run test:cp06-autonomous` | Autonomous recovery, overlap, fault, and drain predecessors remain green | 3 and 8 tests passed | **pass** |
| `npm run test:cp12-keyboard` and `npm run test:cp12-reconnect` | Existing client reconciliation and reconnect behavior remains green | 6 and 3 tests passed | **pass** |
| `npm run typecheck` | All source and focused tests compile under the pinned toolchain | Passed | **pass** |
| `npm run build` | Optimized Next.js build succeeds | Next.js `16.3.4` build completed successfully | **pass** |
| File-backed wire procedure with `AUTONOMOUS_WORLD_MODE=1`: bootstrap Player A, connect WebSocket, set one right movement intent, call the captured worker's `advance(300)`, and wait without sending `resync_request` | The page receives sequence `2` with authoritative Player A position `x=17` | Received one unsolicited full frame with sequence `2`, position `(17,64)`, and the correct server scope; shutdown completed cleanly | **pass** |

## Assertions

- Player-visible state: The existing `RealtimeProjectionClient`/socket path accepts the unsolicited full replacement; no client timer, optimistic movement, second renderable ingress, or new snapshot field was introduced.
- Command and failure contract: The worker observer is invoked only after `tick()` succeeds. A failed tick produces no observer notification; automatic gateway failures are contained at the connection boundary and are visible as a typed wire error before wire close in the tested real-sink case. Sink-failure notification is best effort because it uses the same transport, and all failures leave the worker advance independent.
- Projection content and sequence: A changed deterministic `clientSnapshotId` sends the next full frame; equal automatic content sends no frame; explicit resync still sends an unchanged full frame. A sink failure does not consume a sequence; the next delivered frame uses the next sequence.
- Coalescing and lifecycle: Progress arriving during a held read or connect/resync operation produces one trailing latest read; each connection keeps one publication operation and one pending mode, with explicit recovery subsuming automatic dirtiness. A slow connection cannot delay another connection's admission, and a wake in the drain-settlement window is re-admitted. Closing/draining prevents new reads/sends and cursor/state resurrection, joins already-started close work, and does not claim to retract an accepted sink operation.
- Ownership and privacy: Automatic reads use each connection's immutable server-bound context. A and B receive their own snapshot ids in the scoped unit case; no client frame can select a different scope.
- Entrypoint composition: The real local adapter is wired once before worker start. An injected adapter without the optional publication method remains a no-claim path and receives no hidden fallback.

## Analysis and closure

- Failure classification: `product` — the prior local autonomous page could not observe successful worker progress without a manual resync; the smallest observer-plus-bounded-publisher seam closes that gap.
- Limitations and residual risk: Automatic publication performs one scoped gateway read per ready connection per successful worker wake, even when content is unchanged; public fan-out budgets, hosted topology, and default autonomous admission remain later operations gates. The wire proof pauses the scheduler and explicitly advances the worker, so it does not independently claim wall-clock scheduler delivery.
- Invalidation triggers: Changes to `SK-MVP-0.2`, `client_snapshot` or sequence semantics, worker/clock lifecycle, gateway ordering, scheduler cadence, WebSocket admission, fixture seed, runtime versions, or the CP-12/CP-06 authority decisions.
- Exact conclusion: `SK-TASK-051` is **runtime-verified** for one explicitly enabled local worker and authenticated local realtime connections. The automatic full-snapshot path is changed-content aware, latest-coalesced, scope-safe, and drain-safe; hosted/default continuity, WebMCP, Re-entry, independent-browser, public-load, and judge claims remain open.
