# CP-11 Gatherer Combat Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-034`](../Tasks/SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md)
- Evidence: [`SK-EVID-023-cp11-gatherer-combat-runtime-verification.md`](../Evidence/SK-EVID-023-cp11-gatherer-combat-runtime-verification.md)
- Governing decision: [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md)
- Challenge: [`35-cp11-gatherer-combat-preimplementation-challenge.md`](35-cp11-gatherer-combat-preimplementation-challenge.md)
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL LEVEL-4 SCOPE**

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| World clock and order | `movement -> deposit -> contact -> extraction -> combat` lets a same-second seeded contact suppress extraction before any new cargo is minted; combat owns one round per integer world second. | Accepted and covered by the focused runtime trace. |
| Position and targeting | The server derives the seeded patrol lane and the working GATHERER target position. Contact uses inclusive Euclidean distance `<= 1.0` and persists the integer danger cell. | Accepted; no client position or HP input is trusted. |
| Persistence and migration | Schema v5 / `cp11-001` stores participants, HP, round, due marker, engagement cell, terminal cause, and mission linkage. Schema 1–4 migration remains transactional and shape-checked. | Accepted; predecessor migration suites pass. |
| Concurrency and identity | Partial active-participant indexes, `BEGIN IMMEDIATE`, expected revisions, and stable contact/round keys prevent duplicate claims and duplicate effects. | Accepted for the local SQLite worker boundary. |
| Extraction and cargo | The extraction handler re-reads coherent encounter linkage and skips a locked/resolving attempt. Terminal monster loss validates every active-attempt cargo row before deletion. | Accepted; malformed and zero-cargo cases are covered. |
| Death and mission lifecycle | Gatherer loss atomically terminalizes the encounter, mission, and attempt, deletes exposed cargo, emits ordered causal events, and respawns the same soldier at its shelter. | Accepted; no coin or monster reward is created. |
| Economy and signals | `CargoLostToMonster` is emitted with shelter visibility for a later signal/Re-entry consumer; this transaction does not call outbox, Agent Signal, or Re-entry delivery. | Accepted and explicitly deferred to CP-14. |
| UI and capability | Event payloads retain formula, participants, HP, cargo, and cause for a future dashboard. No browser, Canvas, WebMCP, or hosted claim is made. | Accepted as a future projection input. |

## Invariants rechecked

- One active encounter can own a soldier and a monster; resolved history remains queryable.
- HP and damage are server-derived from the accepted deterministic formula and initiative values.
- A locked/resolving encounter cannot produce extraction or coin settlement.
- A monster killing a gatherer destroys only validated exposed cargo and leaves the monster in `PATROL`.
- The soldier identity survives death; the completed mission row can be manually reused later.
- State, events, cargo deletion, revisions, and idempotency are one transaction and roll back together.
- A duplicate key replays its stored result; a malformed row fails visibly with `RECOVERY_REQUIRED`.

## Residual risks and reopen triggers

Hunter victory and sword loadout, danger-cell reissue, repeated-death review, PvP/siege, party
aggregation, monster pursuit/retreat tuning, dashboard projection, Agent Signal/Re-entry delivery,
default scheduler composition, browser capability, hosted continuity, and judge reproduction remain
unverified. Reopen this disposition if any of those surfaces must own the first terminal transaction,
if the event or schema contract changes, or if a new persistence owner for HP or cargo is introduced.
