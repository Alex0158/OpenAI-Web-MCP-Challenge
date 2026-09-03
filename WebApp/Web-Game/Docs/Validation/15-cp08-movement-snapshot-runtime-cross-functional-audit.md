# CP-08 Movement and Full Snapshot Runtime Cross-Functional Audit

## Review control

- Status: BOUNDED FIRST INCREMENT REVIEW COMPLETE; BROADER CP-08 REMAINS OPEN
- Date: 2026-09-02
- Scope: `SK-TASK-022`, schema version 2 player state, adjacent-tile movement, full scoped
  `client_snapshot`, and handoffs to CP-06, CP-07, CP-09, CP-12, CP-13, and CP-14
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decision: [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)
- Task: [`../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md`](../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md)
- Evidence: [`../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)

## Verdict

The first bounded CP-08 increment is coherent and locally `runtime_verified`. It keeps position and
exploration in the existing world-scoped player aggregate, uses the CP-05 transaction for the player
revision, event, and idempotency boundary, consumes the CP-07 persisted fixture, and builds a full
player-scoped snapshot without exposing another player's private state or a hidden map payload.
The schema v1-to-v2 migration is explicit and transactional.

The result is intentionally narrower than the CP-08 checkpoint. It does not claim a running command
queue, 100 ms continuous movement, fractional interpolation, pathfinding, terrain payloads, soldier
sensors, visible resource/monster projections, browser input, WebSocket delivery, delta frames,
reconnect status UI, or any later mission/gameplay behavior.

## 1. Authority and identity checks

| Boundary | Verified disposition | Handoff or residual |
|---|---|---|
| World identity | `move_player` and `client_snapshot` require a world row and load the CP-07 fixture by that `world_id`; no new world or manifest is invented. | Default-world bootstrap remains CP-16. |
| Player identity | The player row is keyed by `(world_id, player_id)` and the opaque binding must match before movement or snapshot reads. | Live authentication and binding issuance remain CP-13/CP-16. |
| Coordinate authority | Integer `position_x`/`position_y` and `explored_cells_json` live on the player aggregate; no browser or second projection table can commit position. | Continuous fractional representation must remain process-local and be designed before transport. |
| Shelter ownership | The snapshot resolves the shelter through the player relation and filters soldiers to that shelter. | Mission and field soldier ownership are later CP-09 rules. |
| Fixture geometry | Bounds and blocked cells come from the validated persisted CP-07 manifest. | The accepted open-grid fixture has no blocked cells, so terrain-block coverage is deferred. |

## 2. Mutation, event, and retry checks

- A valid adjacent move changes exactly one player row, increments its revision once, and writes one
  `PlayerMoved` Domain Event through `commitTransition`.
- The event is player-scoped, carries the accepted integer `from` and `to` coordinates, and is linked
  to the command idempotency key. The contract event vocabulary now includes `PlayerMoved`.
- A stale expected revision cannot overwrite the newer position. SQLite transaction serialization
  provides the same revision gate when two direct service calls race.
- A repeated key returns the original event and original destination even after a later move. A reused
  key with a different request is a typed `DUPLICATE_COMMAND`; no second movement or event appears.
- A blocked boundary input is rejected before mutation and leaves the row unchanged. Because the CP-08
  fixture's walkability is immutable in this increment, the lack of a rejected idempotency row cannot
  turn the same key into a different accepted command. Terrain mutation must reopen this policy.

## 3. Time and lifecycle checks

- The command attaches the persisted server `world_time`; the input contains no client or wall-clock
  time. Snapshot reads do not advance world time.
- The first increment does not call the CP-06 clock callback or claim any due-work processing. The
  worker-owned clock and recovery boundary remain the only time authority.
- Close/reopen retains player position, exploration, event history, fixture identity, and schema
  metadata. The migration applies only the explicit version 1 to version 2 path and rolls back on SQL
  failure; unknown, newer, or incomplete shapes still fail visibly.
- The migration defaults a legacy CP-05 player to `(0,0)` and an empty exploration set. This is safe
  for the earlier implementation because CP-05 had no player movement; a database containing a later
  gameplay state must use a separately reviewed migration.

## 4. Visibility and projection checks

- A full snapshot carries the contract version, world time, current revisions, player scope, the
  player's position and explored cells, the owned shelter, five owned soldiers, map dimensions, and
  permitted causal event metadata.
- `clientSnapshotId` is derived from the canonical current projection and world event cursor. Full
  snapshots have `full = true` and `baseClientSnapshotId = null`, so reconnect can replace local
  projection state instead of merging unknown state.
- The snapshot deliberately omits the opaque binding, all other player/shelter private rows, and a
  hidden-map payload. It does not use errors or absent records as a visibility side channel.
- Resource, monster, terrain, sensor, and remote-player projections are not silently inferred. They
  require their owning visibility and pathfinding decisions in later increments.

## 5. Cross-checkpoint handoffs

| Consumer | Safe input now | Must not infer yet |
|---|---|---|
| CP-06 clock/recovery | Persisted integer `world_time` and one store transaction | Continuous movement from browser time or synthetic callbacks |
| CP-07 fixture | Stable map dimensions, shelter anchors, seed/version/fingerprint, and route metadata | A client position or regenerated fixture as restart authority |
| CP-09 missions | Player/shelter identity and a stable authoritative coordinate seam | Soldier movement, arrival, home-anchor changes, or role dispatch |
| CP-12 Canvas | Full snapshot shape, player/shelter actors, explored cells, and revision keys | Hidden map, local state mutation, or interpolation before a transport/cadence gate |
| CP-13 WebMCP | A future read surface can reuse the same scoped snapshot service | Tool capability, authentication, or arbitrary player/binding selection |
| CP-14 Re-entry | A future continuation can reread current snapshot state | A movement event as an Agent wake; routine movement remains non-eligible |

## 6. Failure and UX review

- Wrong owner, missing world/player, malformed command, stale revision, duplicate key, and blocked
  boundary each have a typed visible outcome; no fallback server or client correction hides failure.
- Snapshot corruption in position, exploration, event identity, or shelter manifest returns
  `RECOVERY_REQUIRED` rather than silently substituting a coordinate.
- A full projection is deterministic for the same persisted state and event cursor. The first increment
  has no browser UI, so keyboard affordance, reconnect status, stale-frame messaging, and interpolation
  remain unverified product UX.

## 7. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P1 | Direct service calls are not yet routed through a worker command queue, so a concurrently advancing clock could make a stale world-time read fail with `WORLD_TIME_REGRESSION`. | Accepted residual; the next CP-08 increment must bind commands and reads to the worker-owned queue before claiming live cadence. |
| P1 | Blocked movement is rejected before `commitTransition`, so its idempotency outcome is not persisted. | Accepted for immutable open-grid G2 first slice; reopen when terrain or walkability can change between retries. |
| P2 | Full snapshots currently include no visible resource, monster, terrain, or remote-player actor. | Intentional scope boundary; CP-08 visibility/sensor increment owns the allowlist and tests. |
| P2 | Snapshot read is a sequence of store reads rather than one worker-serialized read transaction. | Acceptable for the no-clock local seam; full reconnect consistency belongs to the worker/realtime increment. |
| P2 | Position is an integer tile for this increment, while the accepted contract still requires later process-local fractional interpolation. | Explicitly recorded in ADR-GAME-0013; no fractional state is persisted or overclaimed. |

No finding blocks closure of the bounded first increment. The P1/P2 items are named next gates rather
than hidden contradictions.

## Closure disposition

`SK-TASK-022` may close as `runtime_verified` for the local adjacent-tile movement and full snapshot
boundary after its evidence is synchronized. The broader CP-08 roadmap item remains `IN PROGRESS`.
The next task must be separately registered for worker-serialized 100 ms movement, process-local
interpolation, visible terrain/actor policy, and measured realtime transport before browser two-session
or WebSocket claims are made.
