# SK-EVID-039: CP-16 Local Causal Slice Before Agent Gates

## Identity

- Evidence ID: `SK-EVID-039`
- Related task, issue, or decision: [`SK-TASK-050`](../Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md), [`SK-ISSUE-006`](../Issues/resolved/SK-ISSUE-006-cp11-cargo-loss-signal-eligibility-gap.md), `SK-MVP-0.2`
- Evidence class: `slice-chain`
- Ladder level: `4` — real worker, file-backed fixture, combat persistence, scoped projection, and rollback readback; no browser or external adapter
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: verification ran on the working tree on `main` at `HEAD 8b1cc8a`; task-owned changes
  are uncommitted. Later unrelated RightSpot documentation commits may advance `main`; no commit,
  push, deployment, or hosted environment was used for this evidence
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Persistence schema: version `8`; migration `cp06-004`
- Runtime versions: Node.js `v24.13.1`, npm `11.8.0`, TypeScript `7.0.2`, `tsx` `4.23.13`,
  Next.js `16.3.4`, React `19.2.8`, and `ws` `8.21.3`
- Fixture world and seed: fresh `cp16-local-causal-world` created from the accepted
  `sleepless-mvp-01` G2 fixture manifest; players `player-a`/`binding-a` and
  `player-b`/`binding-b`; seeded `node-rock-a`, `monster-seeded-01`, and `soldier-a-01`
- Environment and configuration: worker-owned clock and phase coordinator, explicit `advance` calls,
  fresh temporary file-backed SQLite database, a server-owned local grant provider in the positive
  branch, and no browser/Agent/Thread/Receiver/Connector process

## Objective and claim boundary

- Behavior under test: A terminal gatherer loss persists the accepted combat/death/respawn/reissue
  event chain and, when a valid server-owned grant is present, atomically creates one coalesced
  pending Agent Signal and outbox row through the existing persistence authority. A no-grant path
  stays history-only.
- Claim this evidence may support: the named CP-16 pre-Agent local causal slice, the repaired
  combat-to-signal eligibility seam, transaction rollback at the signal boundary, duplicate signal
  identity preservation, and Player B's scoped local readback.
- Claims this evidence cannot support: positive page-bound WebMCP discovery/invocation, a live
  Receiver or Local Connector handoff, Codex Thread wake, fresh page reread, force recall, two
  independent browser contexts, hosted continuity, production identity, or judge reproduction.

## Preconditions and fixture

- Starting state: Fresh file-backed world at `world_time = 0`; all five soldiers for Player A and
  five for Player B are resident; no missions, cargo, encounters, signals, or deliveries exist.
- Synthetic identities and seeded actors: `player-a` owns `shelter-a` and `soldier-a-01`; `player-b`
  owns `shelter-b`; the gatherer uses `PICKAXE` tier 1 against `node-rock-a`.
- Real, fake, and stubbed boundaries: Persistence, worker, phase coordinator, combat, cargo, and
  projection are real local code. World-time progression is an explicit trusted worker advance.
  The grant is a test-owned server policy seam, not a browser-authored credential or external
  service. No external delivery or page capability is stubbed as success.

## Execution

| Replayable command or procedure | Expected result | Actual result | Status |
|---|---|---|---|
| `npm run test:cp16-local` under Node 24 | Grant branch, rollback branch, and no-grant/private branch pass | 3 tests passed; terminal loss reached world time 24; one pending slot/outbox appeared only with the explicit grant | **pass** |
| `node node_modules/tsx/dist/cli.mjs --test tests/cp11-combat.test.ts tests/cp11-reissue.test.ts tests/cp11-hunter.test.ts` | Existing CP-11 combat, reissue, and Hunter boundaries remain green | 21 tests passed | **pass** |
| `npm run typecheck` under Node 24 | Typed provider/input seam and existing contracts compile | Passed | **pass** |

## Assertions

- Player-visible state: The local projection boundary remains server-derived; Player A's terminal
  mission is `WAITING_REVIEW`, the attempt is `TERMINAL`, the soldier is `AT_SHELTER`, and Player B's
  full snapshot contains neither A's `CargoLostToMonster` nor `SoldierDied` event.
- Command and failure contract: The existing worker command/gateway identity and role lock remain
  unchanged. A signal-boundary injected failure returns typed `INJECTED_FAILURE` and is retryable at
  the same world boundary.
- Persistence, event, and outbox state: The positive branch records one `CargoLostToMonster`, zero
  exposed cargo, one `agent_signal_slot` with `status = pending`, grant `cp16-local-grant-v1`,
  action `force_recall_soldier`, `eligible_event_count = 1`, event type `CargoLostToMonster`, and
  one matching pending `outbox_delivery` row for `shelter-a`/`binding-a`. The no-grant branch records
  the event but no signal or delivery.
- Exactly-once settlement after duplicate delivery and replay: Replaying the terminal combat
  idempotency key returns `duplicate = true` and preserves the same signal identity; an additional
  worker advance creates no second event or signal.
- Ownership denial, stale revision, restart, and reconnect: The provider rejects a mismatched shelter
  before persistence; Player B's slot remains null and its scoped snapshot excludes A's events.
  Restart/reconnect and independent browser claims remain outside this evidence and are not implied.

## Analysis and closure

- Failure classification: `product` — the pre-fix absence of a combat-to-signal handoff was a real
  cross-module implementation gap, resolved by the smallest compatible provider seam.
- Limitations and residual risk: The local provider proves only the game-side atomic boundary. It
  deliberately does not create an external wake, inspect WebMCP, implement recall, or simulate a
  second browser context. Positive capability remains under `SK-ISSUE-001`; live delivery remains an
  external dependency.
- Invalidation triggers: Changes to `SK-MVP-0.2`, signal eligibility/coalescing, event ordering,
  schema version, worker phase authority, fixture seed, Node runtime, or the external handoff contract.
- Exact conclusion: `SK-TASK-050` is **slice-verified** for the pre-Agent local causal slice. The
  event, state, cargo, signal, and outbox path is atomic under an explicit server-owned grant, the
  no-grant path is silent, replay is idempotent, and scope isolation holds; full CP-16/G2 remains open.
