# SK-TASK-006: CP-06 Clock and Recovery Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-06`
- Owner: Game owner
- Current increment: Cross-functional CP-06 clock/recovery audit and deterministic fixture vectors are prepared; integer authoritative time and the bounded recovery outcome are accepted inputs, and no runtime code has started.
- Next gate: The preparation and local clock/recovery proof are consumed by the next separately registered CP-07 deterministic world fixture implementation task; it must preserve the recovered integer boundary, seed/version/fingerprint, and accepted event order.

## Identity

- Task ID: `SK-TASK-006`
- Date: 2026-09-02
- Risk profile: `Assured`

## Objective

Prepare the smallest coherent contract and fixture package for the authoritative world clock,
same-second due-work ordering, worker restart recovery, bounded downtime catch-up, and wall-clock
failure handling. The package must expose the CP-05 fields CP-06 needs without choosing SQL or adding
a second runtime authority.

## Scope

- In scope: the CP-06 portion of [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md) and [`../Scenarios/06-cp06-clock-recovery-fixtures.md`](../Scenarios/06-cp06-clock-recovery-fixtures.md).
- In scope: cross-checks for `world_time`, `wall_time`, `client_time`, integer milestone boundaries,
  `world_snapshot` replay, active next-due work, event revisions, bounded recovery, and CP-04 drain.
- Out of scope: persistence schema implementation, clock runtime, movement, extraction, combat,
  WebSocket, Canvas, WebMCP, external Agent delivery, hosted deployment, or changing `SK-MVP-0.2`.

## Authority and assumptions

- `SK-MVP-0.2`, CP-05, CP-04, and the world-clock mechanism remain authoritative.
- The normal fixture recovery gap is five world seconds; it exercises the accepted bounded recovery
  path rather than defining the maximum.
- `MAX_RECOVERY_WORLD_SECONDS = 300` is the accepted G2/CP-06 default. A gap of 301 seconds returns
  `RECOVERY_LIMIT_EXCEEDED`, preserves durable truth, closes the world mutation gate, and remains
  observable without claiming a recovered world.
- CP-05 must expose active work identity and next-due world time either in current rows or in the
  `world_snapshot` scheduler projection; CP-06 must not reconstruct it from the browser.

## Success and verification

- The audit names every CP-05 -> CP-06 field and failure boundary needed for restart, including the
  integer `world_time` representation and the bounded recovery outcome.
- The scenario pack covers positive, negative, boundary, crash, replay, clock-anomaly, browser-absent,
  lease/cooldown, and shutdown cases.
- Documentation links, English-only rules, task shape, and scenario references pass the game validator.

## Closure and reopen condition

This task is `verified` at `specified` scope. Reopen it if CP-05 cannot provide durable active work,
if the clock unit or phase order changes, if the 300-second budget cannot remain bounded, or if runtime
evidence requires a new authority or contract version.
