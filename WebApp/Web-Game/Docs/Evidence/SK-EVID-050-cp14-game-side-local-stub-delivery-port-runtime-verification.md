# SK-EVID-050: CP-14 Game-Side Local-Stub Delivery Port Runtime Verification

## Identity

- Evidence ID: `SK-EVID-050`
- Related task: [`SK-TASK-062`](../Tasks/SK-TASK-062-cp14-game-side-local-stub-delivery-port.md)
- Evidence class: `contract`
- Ladder level: `2` — focused game-side boundary tests with a file-backed SQLite fixture
- Executor and date: Codex, 2026-09-03, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 970a839` (game changes uncommitted; no stage, commit,
  push, deploy, or external communication)
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime: Node.js `v24.20.0`, `tsx v4.23.13`, TypeScript `7.0.2`, file-backed SQLite fixtures
- Fixture world and seed: `cp14-delivery-port-world`, `sleepless-mvp-01`
- Environment: fresh temporary database per test; Player A, shelter A, opaque binding `binding-a`;
  injected local transport only; no Receiver, Local Connector, Codex Thread, browser, WebMCP call,
  hosted process, credential, or production database

## Objective and claim boundary

- Behavior under test: the game-side `ReentryDeliveryPort` selects one pending or expired delivery,
  claims it with an explicit wall-time lease, maps the current durable signal slot to a bounded
  envelope, and records accepted, retryable, or terminal transport outcomes through the existing store
  transitions.
- Claim this evidence may support: the named local candidate-selector and transport-neutral port
  behavior, including signal identity preservation, lease reclaim, deferred coalescing, typed outcome
  mapping, and no gameplay mutation.
- Claims this evidence cannot support: Cloud Receiver or Local Connector delivery, Agent wake, active
  Thread scheduling, dynamic WebMCP recall, independent browser isolation, hosted continuity, or judge
  reproduction.

## Preconditions and fixture

- Starting state: a newly created file-backed world at `world_time = 0`, Player A and shelter A at
  revision 0, and no signal or outbox record.
- Stimulus: commit one or more `CargoLostToMonster` events with the accepted CP-14 eligibility grant;
  invoke `pumpOnce` with explicit wall-time values and lease identities.
- Real, fake, and stubbed boundaries: `PersistenceStore`, schema, transaction, and port code are real
  local implementation; transport is an injected labelled stub; world time is persisted and never
  advanced by delivery; wall-time lease values are test inputs.

## Execution

| Replayable command | Result | Claim this supports |
|---|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test --test-timeout=5000 tests/cp14-reentry-delivery-port.test.ts` | **Passed 5/5** | One-shot envelope/acknowledgement, retry and expired-lease reclaim, deferred cursor folding, transport exception retry, malformed fail-closed behavior, terminal rejection, and no gameplay mutation |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test --test-timeout=5000 tests/cp14-signal-policy.test.ts` | **Passed 11/11** | Existing R14-02 through R14-05 durable coalescing, cooldown, retry, acknowledgement, ownership, and stale-lease contract |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-local` | **Passed 3/3** | Existing server-owned terminal loss, signal/outbox atomicity, rollback, replay, no-grant silence, and local shelter scope |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | **Passed** | TypeScript consistency for the current game tree and port/test sources |
| `python3 scripts/test_validate_game_docs.py` | **Passed 22/22** | Documentation validator behavior |
| `python3 scripts/validate_game_docs.py --root . --report` | **Passed**; `0 of 62` non-terminal task records after closure | Task/document shape, links, language, lifecycle, and issue consistency |

## Assertions

- Selection: `pumpOnce` returns `idle` after acknowledgement and delivers no second envelope; the
  read-only candidate query chooses pending records or expired in-flight records only.
- Envelope: contract version, world/shelter scope, opaque binding, signal identity, grant, bounded
  action, cursor range, eligible count/types/severity, and latest-event metadata are copied from the
  durable slot. No prompt or credential field is introduced.
- Delivery lifecycle: accepted maps to one acknowledgement and one `ContinuationDelivered` event;
  retryable outcomes return the slot to pending with the same signal identity; terminal outcomes settle
  the slot without a gameplay event; an expired lease is reclaimed with a new lease identity.
- Coalescing: an event arriving while the transport is in flight updates the existing deferred window;
  it does not create a second signal, and the deferred context folds into the next post-cooldown slot.
- Failure and authority: transport exceptions become an explicit `TRANSPORT_EXCEPTION` retry; an
  unknown transport shape raises typed `INVALID_INPUT` and leaves the lease in flight for later reclaim;
  world time, shelter coins, missions, soldiers, cargo, and page state do not change.
- Higher boundaries: external transport, Agent grant delivery, dynamic page recall, browser identity,
  hosted persistence, and judge reproduction were intentionally not run.

## Analysis and closure

- Failure classification: `none` for the named local port scope; the first Red run correctly failed
  because the implementation module did not yet exist, then the focused Green run passed.
- Limitations and residual risk: the injected transport does not prove Eddy's endpoint, serialization,
  acknowledgement, active-Thread backpressure, or hosted liveness. The port currently accepts only the
  bounded fields already present in `SignalSlotRecord`; page revisions remain a later reread concern.
- Invalidation triggers: any change to `ADR-GAME-0009`, `SK-MVP-0.2` section 7, signal/outbox schema,
  lease semantics, candidate ordering, or Eddy's delivered transport contract.
- Exact conclusion: `SK-TASK-062` is runtime-verified at ladder level 2 for the named local game-side
  delivery port and labelled transport stub. The external Receiver/Connector and Agent/Re-entry gates
  remain open.
