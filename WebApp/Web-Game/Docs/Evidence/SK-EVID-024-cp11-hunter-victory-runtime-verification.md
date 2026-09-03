# SK-EVID-024: CP-11 Hunter Victory and Return Runtime Verification

## Identity

- Task: [`SK-TASK-035`](../Tasks/SK-TASK-035-cp11-hunter-victory-and-return.md)
- Checkpoint: `CP-11` seeded HUNTER victory and return
- Evidence level: `4` — local file-backed process runtime with restart and durable replay
- Date: `2026-09-02`
- Source: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit or push claim)

## Environment

- Application root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Node.js: `v26.5.0` (the reproducible project baseline remains Node 24.x; this record names the
  runtime actually executed)
- npm: `11.17.0`
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Persistence: temporary or file-backed SQLite with WAL and foreign keys enabled
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`, world `cp11-hunter-world`

## Executed checks

| Command | Result |
|---|---|
| `npm run test:cp11-hunter` | **6 passed** — HUNTER dispatch/arrival, formula, five-round victory, zero-cargo return settlement, validation/idempotency, single-target reservation, rollback, and file-backed restart |
| `npm run test:cp11` | **7 passed** — CP-11 GATHERER contact, deterministic loss, cargo deletion, respawn, rollback, uniqueness, restart, and zero-cargo regression |
| `npm run test:cp09` | **15 passed** — dispatch and route predecessor regression |
| `npm run test:cp10` | **44 passed** — extraction, cadence, contest, return, and cargo predecessor regression |
| `npm run test:cp10-deposit` | **16 passed** — deposit and coin-settlement predecessor regression |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build |
| `python3 scripts/test_validate_game_docs.py` | **21 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed** — 0 findings before closure-document updates |

The first focused Red run failed at module loading because the new Hunter resolver export was absent.
After the typed resolver, role-aware handlers, and persistence branches were added, the focused suite
turned green. The final command results above are the closure checks.

## Runtime proof

The local worker dispatches `soldier-a-01` as a tier-one `HUNTER` with `SWORD` against the server-owned
`monster-seeded-01`. The route is derived from shelter `(16,64)` to the fixture target `(48,64)` and
stores `ON_RECALL`; a Hunter arrival reaches `WORKING` without an extraction due marker. A second active
Hunter cannot reserve the same seeded monster, while a changed duplicate request, incompatible loadout,
wrong target, wrong owner, or stale revision fails before partial state.

At world time `22`, the patrol reaches the Hunter's target cell and one contact transaction locks the
encounter. The deterministic formula produces Hunter-first `18` damage and monster `9` damage. Rounds
one through four leave the Hunter at `64` HP and the monster at `8`; round five is a lethal first strike,
so the monster does not receive a second strike. The terminal combat transaction commits
`BattleRoundResolved`, `EncounterResolved`, and `MonsterDefeated` in that order, changes the monster row
from `PATROL` to `DEAD`, clears mission encounter linkage, and moves the active mission and attempt to
`RETURNING`. The same soldier remains `FIELD` with `HUNTER`/`SWORD`; no cargo, coin, death, respawn, or
third-resource effect is emitted.

The return handler reverses the committed route and reaches the exact home anchor at world time `37`.
The deposit handler then commits an empty `CargoDeposited` settlement with `settlementReason =
HUNTER_VICTORY`, zero quantity, zero capacity, and zero coin delta. It emits no `CoinsCredited`, releases
the same soldier to `AT_SHELTER`, completes the mission, and terminalizes the attempt. A failure injected
after terminal state mutation leaves encounter, monster, mission, attempt, soldier, events, and cursor
unchanged; retrying the same round key succeeds. Reopening the same SQLite file after victory preserves
the `DEAD` monster and completes the return exactly once without duplicate terminal events.

## Claim boundary

This is local level-4 evidence for the named worker-owned HUNTER dispatch, deterministic victory,
monster deactivation, route-preserving return, and zero-cargo settlement. It does not prove the default
all-phase scheduler, browser/Canvas UX, WebMCP registration, Agent Signal or Re-entry delivery, hosted
continuity, production identity, PvP/siege, automatic danger-cell reissue, repeated-death review,
monster drops, or judge reproducibility.
