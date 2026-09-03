# SK-EVID-023: CP-11 Gatherer Combat Runtime Verification

## Identity

- Task: [`SK-TASK-034`](../Tasks/SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md)
- Checkpoint: `CP-11` first GATHERER monster-loss increment
- Evidence level: `4` — local file-backed process runtime with restart and durable replay
- Date: `2026-09-02`
- Source: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit or push claim)

## Environment

- Application root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Node.js: `v26.5.0` (the project reproducible baseline remains Node 24.x; this evidence names the
  runtime actually executed)
- npm: `11.17.0`
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Persistence: temporary file-backed SQLite with WAL and foreign keys enabled
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`, world `cp11-combat-world`

## Executed checks

| Command | Result |
|---|---|
| `npm run test:cp11` | **7 passed** — contact lock, formula/initiative, malformed cargo recovery, contact rollback, one-monster participant protection, restart/terminal replay, and zero-cargo loss |
| `npm run test:cp09` | **15 passed** — dispatch and route predecessor regression |
| `npm run test:cp10` | **44 passed** — extraction, cadence, contest, return, and cargo predecessor regression |
| `npm run test:cp10-deposit` | **16 passed** — deposit and coin-settlement predecessor regression |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build |
| `python3 scripts/test_validate_game_docs.py` | **21 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed** — 0 findings after correcting one pre-existing status link |

The first Red run of `tests/cp11-combat.test.ts` failed because the implementation module did not yet
exist. The focused suite turned green after the contract, persistence migration, contact service,
combat rules, terminal transaction, and extraction guard were implemented.

## Runtime proof

The worker advances the fixture from dispatch through route arrival and four exposed Rock units. At
world time `15`, the patrol reaches `(34,64)`, the inclusive `1.0`-tile contact locks the active
GATHERER before extraction, and the combat phase resolves round one in the same boundary. Each later
integer world second resolves one round. The accepted values produce monster-first damage of `10` to
the GATHERER and `6` to the monster while both remain alive.

At round `10`, the GATHERER reaches zero HP. One SQLite transaction commits the final round,
`EncounterResolved`, `CargoLostToMonster`, `SoldierDied`, and `SoldierRespawned`; deletes the four
validated exposed Rock units; clears mission and attempt encounter linkage; returns the same
`soldier-a-01` to `AT_SHELTER`; leaves the encounter as `RESOLVED`; and leaves the seeded monster in
`PATROL`. The shelter wallet remains at zero.

The suite also proves that malformed cargo returns `RECOVERY_REQUIRED` without changing the active
encounter, mission linkage, or cargo; an injected contact failure rolls back the world time and all
rows; two same-cell gatherers cannot claim the monster twice; duplicate contact and round keys replay
their stored results; restart resumes from the persisted due marker; and empty cargo emits a zero-loss
explanation without manufacturing a reward.

## Claim boundary

This is local level-4 evidence for the named worker-owned GATHERER monster-loss path. It does not
prove Hunter victory, automatic danger-cell reissue, repeated-death review, PvP or siege, actor-wide
health, browser or Canvas UX, WebMCP capability registration, Re-entry delivery, the default all-phase
scheduler, hosted continuity, or judge reproducibility. Those remain separate tasks and evidence gates.
