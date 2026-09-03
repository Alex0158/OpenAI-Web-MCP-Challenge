# SK-EVID-025: CP-11 Danger-Cell Reissue and Anti-Loop Runtime Verification

## Identity

- Task: [`SK-TASK-036`](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md)
- Checkpoint: `CP-11` danger-cell reissue and typed anti-loop review
- Evidence level: `4` — local file-backed process runtime with migration, rollback, and restart
- Date: `2026-09-02`
- Source: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit or push claim)
- Contract: `SK-MVP-0.2`; schema `6`; migration `cp11-002`

## Environment

- Application root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Node.js: `v26.5.0` (the reproducible project baseline remains Node 24.x; this record names the
  runtime actually executed)
- npm: `11.17.0`
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Persistence: temporary and file-backed SQLite with WAL and foreign keys enabled
- Fixture: seed `sleepless-mvp-01`, generation `g2-fixture-1`, world `cp11-reissue-world`
- Route walkability version: the fixture's server-owned `mapFingerprint`

## Executed checks

| Command | Result |
|---|---|
| `./node_modules/.bin/tsx --test tests/cp11-reissue.test.ts` | **8 passed** — planner detour, fixed Rock no-route review, positive reissue, repeated-death stop, manual reset, schema-v5 migration, atomic rollback, deposit reset, and target exclusion |
| `npm run test:cp11` | **7 passed** — GATHERER contact, deterministic loss, cargo deletion, same-identity respawn, rollback, duplicate/restart, and the fixed-fixture review regression |
| `npm run test:cp11-hunter` | **6 passed** — HUNTER dispatch, deterministic victory, monster deactivation, return/settlement, reservation, rollback, and restart predecessor regression |
| `npm run test:cp09` | **15 passed** — dispatch and route-arrival predecessor regression |
| `npm run test:cp10` | **44 passed** — extraction, cadence, contest, return, and cargo predecessor regression |
| `npm run test:cp10-deposit` | **16 passed** — deposit, coin settlement, retry, restart, and mission-row reuse predecessor regression |
| `./node_modules/.bin/tsx --test tests/*.test.ts` | **163 passed, 0 failed** — explicit local aggregate across the available test files |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build |
| `python3 scripts/test_validate_game_docs.py` | **21 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed** — 0 findings after closure-document updates |

The repository has no `npm test` script; the explicit `tsx` aggregate is the recorded local suite
command. No command above starts a hosted worker or proves a browser capability.

## Runtime proof

The Red proof established the missing schema, route, and terminal-transaction boundary before the
production change was completed. The Green implementation keeps the existing worker-owned combat
transaction as the only owner of death settlement and adds only the accepted CP-11 fields and
outcome.

The fixed Rock trace dispatches `soldier-a-01` as a tier-one `GATHERER` with `PICKAXE` to
`node-rock-a`. At world time `24`, the seeded engagement records danger cell `(34,64)`, which is the
target cell. The forbidden Chebyshev-one neighbourhood therefore contains the target, so the server
does not fabricate a detour or reuse the old route. One transaction deletes the four exposed cargo
units, records `CargoLostToMonster`, terminalizes the old attempt with `GATHERER_LOST`, respawns the
same soldier at the shelter, consumes the budget from `1` to `0`, and commits
`MissionReissued { outcome: WAITING_REVIEW, reason: NO_SAFE_REISSUE_ROUTE }`. The six terminal events
remain ordered as `BattleRoundResolved`, `EncounterResolved`, `CargoLostToMonster`, `SoldierDied`,
`SoldierRespawned`, and `MissionReissued`.

A separate reachable-target planner fixture proves the positive branch without changing the fixed
world geometry. Breadth-first search uses the server-owned dimensions, blocked cells, map fingerprint,
danger cell, Chebyshev-one exclusion, and fixed neighbour order `right, down, left, up`; every waypoint
is adjacent and outside the forbidden set. The first loss creates one fresh attempt with the same
soldier, role, tool, target, home anchor, and return policy, leaves the mission `TRAVELLING` with budget
`0`, and records the route and danger cell. A second monster loss before deposit creates no third
attempt and ends at `WAITING_REVIEW / REPEATED_MONSTER_DEATH`.

The migration vector removes the schema-v6 columns from a file-backed schema-v5 database, reopens it,
and verifies the transactional `cp11-002` migration, default budget, nullable metadata, and terminal
cause. The rollback vector injects failure after state mutation and verifies that world time, encounter,
cargo, mission budget, events, cursor, and idempotency remain unchanged before retry. Duplicate combat,
stale, ownership, and changed-request guards retain their predecessor behavior. Manual dispatch from
review and a successful deposit both clear review metadata and reset the next chain's budget to `1`.

## Claim boundary

This is local level-4 evidence for the named worker-owned schema migration, deterministic route
planner, same-identity GATHERER reissue, typed review stops, reset semantics, atomic cargo/death/event
settlement, rollback, idempotency, and file-backed restart. The positive deposit branch uses a
controlled test fixture to disable the seeded monster after the reissue; it proves persistence and
settlement compatibility, not a new production monster rule.

It does not prove HUNTER loss policy, PvP or siege, the default all-phase scheduler, browser/Canvas UX,
page-bound WebMCP registration or invocation, Agent Signal or Re-entry delivery, production identity,
hosted continuity, deployment, performance at population scale, or judge reproduction.

## Freshness and invalidation

This record is invalidated by a change to the CP-11 combat transaction, mission or attempt schema,
route geometry or map fingerprint, danger-cell rounding or exclusion rule, event vocabulary, world-clock
ordering, contract version, runtime/dependency versions, fixture seed, or any later task that moves the
reissue owner to another worker or external service.
