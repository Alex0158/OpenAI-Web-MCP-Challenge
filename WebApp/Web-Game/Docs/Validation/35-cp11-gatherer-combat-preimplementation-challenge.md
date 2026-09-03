# CP-11 Gatherer Combat and Cargo-Loss Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-034`
- Promoted decision: [`ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation under the delegated implementation scope
- Date: 2026-09-02

## Decision question

What is the smallest durable implementation that can lock the seeded monster to one active GATHERER,
resolve one deterministic combat round per integer world second, destroy exposed cargo on a monster
kill, and respawn the same soldier without creating a second encounter or a second soldier?

## Objective and binding constraints

- CP-11 owns the server-side contact, encounter, deterministic PvE resolution, and monster-caused
  cargo-loss boundary. CP-08 supplies derived positions and the clock; CP-09 supplies the role, tool,
  route, and mission attempt; CP-10 supplies exposed cargo and the separate deposit transaction.
- The worker remains the only authority for contact, HP, round order, cargo destruction, mission
  lifecycle, soldier lifecycle, event order, revisions, and idempotency. A browser, page projection,
  WebMCP action, Agent Signal, or test fixture cannot submit a position, HP, damage, or outcome.
- Contact uses the inclusive Euclidean engagement radius of `1.0` tile. The seeded monster follows its
  fixture patrol lane. A GATHERER is eligible only while its active attempt is `WORKING` and no other
  encounter owns it.
- The accepted G2 formula is `max(1, attack + weapon_power + matchup_bonus - defense)` with higher
  `initiative_speed` first and ascending `entity_id` as the tie-break. There are no random rolls or
  hidden modifiers in this increment.
- The existing clock order remains `movement -> deposit -> contact -> extraction -> combat -> settlement
  -> timers`. Contact is locked before extraction at a same-second boundary; combat resolves later in
  its own phase. A locked or resolving encounter blocks extraction without moving cargo or coins.
- A monster-caused death destroys only field cargo. The monster remains in its normal `PATROL` state;
  it receives no coin, resource, or cargo reward. The soldier keeps the same `soldier_id`, respawns at
  its shelter, and the failed attempt remains durable history.

## Evidence and falsifiers

### Verified predecessor facts

- CP-08/09 derive field positions from durable world time and route data; the browser does not own a
  soldier coordinate.
- CP-10 stores provenance-linked Wood/Rock cargo until an exact home crossing and atomically deposits
  it. Deposit runs before contact in the accepted phase order, so a valid `DEPOSITING` attempt cannot be
  killed by the field combat handler at the same boundary.
- The current persistence layer already provides revisions, Domain Events, idempotency records, and one
  transaction for state plus event. It does not yet persist encounter participants, HP, or round state.

### Falsifiers that would reopen this challenge

- A combat round needs actor health outside the encounter and no single durable owner can be selected.
- The seeded route cannot produce a reachable contact without changing the accepted fixture, protected
  start, or sensor/contact values.
- A second worker can claim the same participant without an atomic uniqueness or revision boundary.
- Cargo must be transferred or credited during this monster branch, or a combat transaction must own a
  home-boundary deposit.
- A required public command, WebMCP tool, Re-entry action, hosted scheduler, or contract/event version
  change is discovered before this local worker boundary can be proven.

## Cross-functional surfaces

| Surface | In this increment | Explicitly deferred |
|---|---|---|
| Position and targeting | Derive the seeded monster patrol position and the active GATHERER work position; lock at inclusive contact | Monster target switching, pursuit/retreat tuning, player/shelter targeting, production species |
| Encounter persistence | Add structured participant, HP, round, contact-cell, due-time, and terminal-cause fields; enforce one active encounter per participant | Encounter history UI, party aggregation, PvP/siege, multi-worker fairness beyond the transaction boundary |
| Mission and extraction | Attach encounter status to the mission; contact before extraction; stop extraction while locked/resolving | Hunter dispatch, automatic target selection, manual recall during combat, reissue route planning |
| Combat | One round at a time with accepted formula, initiative, HP, exact event payload, and terminal result | Randomness, critical hits, retreat, balance tuning, hunter victory |
| Death and cargo | Atomically destroy active-attempt cargo, terminalize the attempt, respawn the same soldier at home, and keep the monster normal | One-budget danger-cell reissue, repeated-death stop, breach corruption, PvP loot |
| Economy and signals | No coins or third resource; emit `CargoLostToMonster` with causal identity for later CP-14 consumption | Deposit, coin credit, outbox delivery, Re-entry wake, external Receiver/Connector |
| UI and capability | Preserve event payloads needed for a later dashboard explanation | Canvas, dashboard, browser, WebMCP, hosted runtime |

## Failure modes challenged

| Failure | Prevention or observable result |
|---|---|
| Two contact paths lock one soldier or monster | A transaction plus partial unique active-participant indexes; the losing attempt receives a typed conflict and no second encounter |
| Contact and extraction use the wrong same-second order | Contact runs before extraction and stores a blocking encounter status; extraction re-reads that status |
| Duplicate or concurrent round deals damage twice | Stable encounter/round idempotency key, expected revisions, and a stored result replay |
| Crash after cargo deletion or before respawn | Cargo deletion, mission/attempt/soldier/encounter changes, events, and idempotency commit in one SQLite transaction |
| Malformed or cross-attempt cargo is silently discarded | Validate every active-attempt cargo row; return `RECOVERY_REQUIRED` before mutation |
| Monster death branch rewards the wrong party | The monster-loss branch emits cargo destruction only and leaves the monster `PATROL` |
| A stale or forged client chooses HP, position, or damage | The service derives all combat inputs from server configuration, fixture, and durable state |
| A reissued/old attempt writes after respawn | Clear active linkage and require encounter, mission, attempt, and soldier revisions in the terminal transaction |
| Restart replays a terminal outcome | Stable terminal work identity and durable encounter state return the original result without a second event or deletion |

## Alternatives

| Option | Benefit | Risk and decision |
|---|---|---|
| Encode HP and participants in `work_id` or event JSON | No schema migration | Hides authority, prevents safe queries/uniqueness, and makes restart and extraction blocking unverifiable; rejected |
| Resolve the whole fight in the contact handler | Smallest code path | Violates one-round-per-world-second, prevents readable intermediate state, and weakens restart evidence; rejected |
| Add health columns to every soldier and monster now | Easy projection later | Expands the actor schema and all existing fixture/read paths before a consumer needs it; deferred |
| Add a structured encounter record with mission linkage | One durable owner for participants, HP, rounds, and cause; one migration | Requires schema-v5 migration and focused compatibility checks; selected |
| Add contact, combat, hunter victory, reissue, and UI together | Faster apparent feature count | Creates multiple unfinished cross-module contracts and hides which boundary failed; rejected |

## Selected path

1. Advance the local schema to version 5 (`cp11-001`) with structured encounter fields and mission
   encounter linkage. Existing schema 1–4 files migrate transactionally; no old event or contract
   version is silently coerced.
2. Add a worker-owned contact service that derives positions from the fixture and durable mission state,
   inserts one `LOCKED` encounter, attaches it to the mission, and sets its first combat due marker to
   the locking world second. The contact event payload records participants and the integer danger cell.
3. Add a worker-owned combat service that claims due locked/resolving encounters in deterministic
   `(next_due_world_time, encounter_id)` order and commits exactly one round per invocation. HP and round
   number live in the encounter row until terminal settlement.
4. For the first terminal branch, a defeated GATHERER causes one transaction containing the final round,
   `EncounterResolved`, `CargoLostToMonster`, `SoldierDied`, and `SoldierRespawned`; it clears the active
   mission linkage, leaves the attempt as terminal history, destroys only validated exposed cargo, and
   leaves the monster `PATROL`. The resident mission is available for a later explicit dispatch; automatic
   reissue is a separate follow-on task.
5. Keep the existing CP-10 deposit transaction unchanged. Combat never credits coins, never deposits
   cargo, and never calls the external Re-entry boundary.

## Verification and recovery

- TDD Red proofs must cover contact lock, same-second extraction blocking, formula/initiative, one round
  per boundary, intermediate HP, gatherer death, zero and mixed cargo loss, duplicate/stale/ownership
  rejection, one-participant conflict, rollback, delayed/restart replay, monster normal-state retention,
  and no coin/third-resource effect.
- Minimum closure is local process-runtime level 4 for the named gatherer branch: isolated file-backed
  world, fixture seed, clock phase handlers, restart between rounds and after terminal settlement, and
  exact event/cursor/state readback. It does not prove browser, WebMCP, Re-entry, hosted, Hunter, PvP,
  or automatic scheduler behavior.
- A failed transaction leaves the encounter, active attempt, soldier, and cargo unchanged and retryable
  with the same logical round key. A malformed durable row enters a visible recovery error; no fallback
  drops cargo or invents HP.

## Reopen triggers

Reopen before implementation if the contract changes the formula/cadence/contact boundary, if contact
requires a new authority or external service, if the schema migration cannot preserve existing worlds,
if deposit and combat can both own the same cargo at one boundary, or if the first trace requires Hunter,
PvP, reissue, breach, browser, WebMCP, Re-entry, or hosted behavior.
