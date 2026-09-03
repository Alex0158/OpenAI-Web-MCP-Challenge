# CP-11 Hunter Victory and Return Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-035`](../Tasks/SK-TASK-035-cp11-hunter-victory-and-return.md)
- Evidence: [`SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
- Governing decision: [`ADR-GAME-0026-cp11-hunter-victory-and-return.md`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md)
- Challenge: [`37-cp11-hunter-victory-preimplementation-challenge.md`](37-cp11-hunter-victory-preimplementation-challenge.md)
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL LEVEL-4 SCOPE**

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Dispatch and identity | The gateway accepts a resident soldier and the server derives the route to the seeded monster. HUNTER/SWORD tier one, `ON_RECALL`, target identity, and expected revision are checked before state mutation. | Accepted; positive, invalid, stale, ownership, changed-duplicate, and replay vectors pass. |
| Target reservation and contact | Only one active HUNTER attempt may reserve `monster-seeded-01`; the check is repeated in the transactional store. Contact still uses the existing inclusive one-tile Euclidean rule and active encounter indexes. | Accepted for the single seeded threat; reservation releases with terminal mission completion, while broader multi-role target arbitration remains outside this task. |
| World clock and order | `movement -> deposit -> contact -> extraction -> combat` lets a Hunter arrive without arming extraction, then contact and resolve one round per integer world second. Victory starts return only after combat commits. | Accepted and covered by the focused runtime trace. |
| Formula and history | HUNTER values are server-derived: `18` damage, `9` received, initiative `5` before monster `4`; the lethal first strike on round five suppresses the second strike and leaves `64` HP. Typed round payloads preserve actor names and role/tool. | Accepted; the pure formula vector and complete five-round event sequence pass. |
| Persistence and atomic victory | One transaction changes encounter to `RESOLVED`, monster to `DEAD`, clears encounter linkage, keeps the same field soldier, moves mission/attempt to `RETURNING`, and writes the ordered terminal events. | Accepted; injected post-state failure rolls back every row, revision, event, cursor, and idempotency effect. |
| Return and settlement | The immutable outbound route is reversed and the exact home anchor is crossed before settlement. An empty Hunter deposit emits `CargoDeposited` with `HUNTER_VICTORY`, zero totals, and no coin event. | Accepted; return position, home crossing, zero-cargo settlement, and resident release pass. |
| Restart and idempotency | A file-backed restart preserves the dead monster and active return. Stable contact, round, home, and deposit keys prevent duplicate effects. | Accepted for the local SQLite worker boundary; no hosted scheduler claim is made. |
| Economy and human consequences | Hunter victory creates no cargo, coin, death, respawn, or third-resource effect. Gatherer loss remains unchanged and still destroys only exposed cargo. | Accepted; CP-11 Gatherer regression and wallet/cargo assertions pass. |
| UI, WebMCP, and Re-entry | Events retain role, tool, formula, HP, cause, and settlement reason for a future dashboard. No browser projection, capability registration, Agent Signal, or Re-entry delivery is invoked here. | Deferred to CP-12 through CP-14; no external capability claim. |

## Invariants rechecked

- A resident soldier has one active mission and one role-locked loadout; the soldier identity is not
  replaced by a victory.
- A seeded monster has at most one active Hunter reservation and at most one active encounter; its
  resolved `DEAD` row remains queryable and is excluded from future targeting.
- HP, damage, initiative, target, route, world time, revisions, and terminal cause come from durable
  server state rather than browser input.
- A Hunter arrival has no extraction due marker, and a victory cannot mint cargo or coins.
- Victory, return movement, home crossing, and settlement are separate ordered boundaries; no step
  teleports the soldier or bypasses the clock.
- State, events, revisions, and idempotency commit atomically and roll back together on injected
  failure.
- A duplicate key replays its stored result; changed requests and stale or foreign ownership fail
  visibly without partial state.
- The existing GATHERER contact, loss, cargo deletion, respawn, restart, and rollback behavior remains
  green under the same CP-11 package.

## Residual risks and reopen triggers

Automatic danger-cell reissue, repeated-death review, monster drops, pursuit/retreat, PvP/siege, party
aggregation, broader multi-role target arbitration, default scheduler composition, dashboard/UI,
WebMCP capability, Agent Signal/Re-entry delivery, hosted continuity, production identity, and judge
reproduction remain unverified. Reopen this disposition if target discovery, reservation ownership,
combat formula, event vocabulary, monster lifecycle, return semantics, settlement owner, schema, or
contract version changes, or if the default scheduler must own this transaction.
