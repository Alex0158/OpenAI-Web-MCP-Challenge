# CP-10 Deposit and Coin Settlement Pre-Implementation Challenge

## Identity

- Challenge for: `SK-TASK-033`
- Promoted decision: [`ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)
- Status: `accepted`
- Owner and approver: Game owner; Codex engineering recommendation within the accepted G2 contract
- Date: 2026-09-02

## Decision question

How should an active G2 gatherer settle exposed Wood/Rock cargo after the durable home crossing so
that cargo is removed, shelter coins are credited exactly once, the soldier becomes resident, and a
later dispatch remains possible without mixing settlement with movement, combat, or Agent delivery?

## Objective and binding constraints

- Real objective: turn one valid `DEPOSITING` mission attempt into one auditable shelter settlement
  and resident handoff, preserving the exact cargo provenance and all prior event history.
- The worker owns world time, mission and soldier identity, shelter ownership, cargo contents,
  conversion values, revisions, event order, and idempotency. A client, browser, WebMCP action, or
  Agent cannot provide cargo, a shelter id, a coin amount, or an arrival position.
- The state mutation, cargo removal, event append, wallet credit, and idempotency result commit in
  one SQLite transaction. A failed transaction leaves `DEPOSITING`, cargo, coins, revisions, cursor,
  and retry identity unchanged.
- Keep `SK-MVP-0.2`, the existing `movement -> deposit -> contact -> extraction -> combat ->
  settlement -> timers` order, Wood at one coin per unit, Rock at three coins per unit, and the
  existing `CargoDeposited` and `CoinsCredited` vocabulary. No schema, event-version, or contract
  version change is justified by this boundary.
- A zero-cargo contest loser may still reach `DEPOSITING`; it must complete as a resident with a
  zero-value `CargoDeposited` record and must not manufacture a positive coin event.

## Evidence and challenge

- **Verified facts:** CP-10 creates provenance-linked cargo with one equal-weight slot per unit;
  cargo remains exposed through `RETURNING` and `DEPOSITING`; the home crossing is atomic and leaves
  the soldier `FIELD`; the shelter wallet is still unchanged; and the persistence schema already has
  `shelter.coins`, revisions, Domain Events, and idempotency records.
- **Verified chain:** [`SK-TASK-032`](../Tasks/SK-TASK-032-cp10-return-navigation-and-home-crossing.md)
  proves `RETURNING -> DEPOSITING` and explicitly defers cargo removal, coin credit, and resident
  release to this boundary.
- **Assumption:** The G2 deposit handler is worker-invoked, not a new public command. It can process
  every due `DEPOSITING` attempt in deterministic `(home-crossing-world-time, mission_attempt_id)`
  order and use the same handler seam used by prior CP-10 tests.
- **Contradiction found:** The current dispatch implementation rejects an existing `mission_id`,
  while the accepted mission chain says a resident gatherer can receive another assignment after a
  successful deposit. Settlement therefore must release the active attempt and include a minimal
  resident-row reuse compatibility change, or the contradiction must remain a separately registered
  blocker before browser gameplay is exposed. The selected path includes the compatibility change;
  it does not add automatic target reselection.
- **Unknowns:** Future mixed typed cargo weights, combat or loot at a shelter boundary, ledger
  pagination, multi-worker settlement ordering, and the final automatic reissue policy remain
  outside this task.
- **Falsifiers:** A consumer requires per-unit cargo rows, a different conversion table is accepted,
  a shelter can move before this attempt settles, a combat transaction can own the same cargo at the
  same boundary, or a new schema/event/contract version becomes necessary. Any falsifier reopens
  this challenge before code changes.

## Cross-functional surfaces

| Surface | In this task | Explicitly deferred |
|---|---|---|
| Mission and soldier lifecycle | `DEPOSITING -> AT_SHELTER`; attempt becomes terminal history; soldier `FIELD -> AT_SHELTER`; active attempt is released; role/tool are cleared from the resident row | Automatic reissue, combat death/respawn, siege, migration |
| Economy and ownership | Read all active-attempt cargo, validate provenance, remove it once, credit the soldier's owning shelter with the fixed Wood/Rock table | Weighted capacity, gold, loot transfer, production balance, ledger pagination |
| Persistence | One transaction over cargo, shelter, soldier, mission, attempt, Domain Events, and idempotency with expected revisions | SQL schema migration, second worker, hosted locking |
| Clock and order | Deposit runs after movement/home crossing at the current authoritative world time; delayed retries keep the original logical work identity | New phase order, wall-clock policy, respawn timers |
| Events | `CargoDeposited` first; `CoinsCredited` second only when `coinDelta > 0`; both shelter-visible and causal to one work id | New event vocabulary, Agent eligibility, Re-entry wake |
| Dispatch compatibility | Allow a completed resident mission row with no active attempt to be reused and revisioned by the existing server dispatch path, preserving old attempts | New public command, automatic fresh-target selection, dispatch redesign |
| UI/API | No new browser input; later snapshots can show deposit result and resident state | Canvas, dashboard, WebMCP, Re-entry, hosted wire |

## Failure modes examined

| Failure | Impact | Detection | Prevention or remediation |
|---|---|---|---|
| Duplicate effect on redelivery | Cargo disappears or coins increase twice | Stable attempt/home-crossing work key and idempotency replay | Return the stored result and event ids without rereading a completed effect as new |
| Lost or reordered event | Wallet and history disagree | Assert event cursor, causal id, and ordered event ids | Append `CargoDeposited` before `CoinsCredited` in the same transaction |
| Stale revision accepted | Concurrent settlement or wallet update overwrites state | Expected mission, attempt, soldier, shelter, and cargo revisions | Typed `STALE_REVISION`/`RECOVERY_REQUIRED`; no partial mutation |
| Race at a shelter boundary | Combat, another deposit, or a later dispatch touches the same soldier/cargo | Re-read active linkage and revisions inside the transaction | One worker phase order; reject a non-`DEPOSITING` or non-owned aggregate |
| Authority leaking into the client | Forged cargo, shelter, arrival, or coin value | Ignore client quantity/position and compare event payload with server-derived values | Worker-only service and server-derived shelter/cargo aggregate |
| Unbounded catch-up after downtime | A delayed handler mints repeated settlement effects | One due settlement per attempt and stable logical work key | Process the durable `DEPOSITING` boundary once; leave a failed boundary retryable |
| Hidden fallback masking a capability failure | Corrupt cargo is silently dropped or a zero value is treated as success | Validate every cargo row and require a typed outcome | `RECOVERY_REQUIRED` with no deletion, credit, or fabricated replacement |

Additional checks cover negative/zero cargo, integer overflow, wrong shelter visibility, malformed
provenance, a mission/attempt mismatch, a duplicate with a changed request, rollback after each
mutation stage, restart before settlement, and dispatch after a successful resident handoff.

## Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Minimal: settle cargo and coins only | Small code change | Leaves the soldier or mission active and can strand a resident behind the current mission-id rejection | Low | Medium | Deposit transaction proof, but the post-deposit player path remains invalid |
| Conservative: atomic settlement plus resident release and mission-row reuse | Completes the normal loop and preserves attempt history | Touches the existing dispatch write path and requires a revisioned reuse test | Medium | High | Deposit, zero-cargo, duplicate/stale/rollback/restart, and redispatch proof |
| Expanded: settle, automatically select a fresh target, and reissue every repeatable mission | Higher idle income | Adds target selection, sensing, route planning, node availability, and potentially an automatic loop before CP-11/12 | High | Low | New contract and scheduler/reissue evidence |

## Decision

- **Selected option:** Conservative atomic settlement plus resident release and inactive mission-row
  reuse.
- **Reason and trade-off:** It closes the actual cargo-to-coins player loop while keeping all
  authoritative effects in one transaction. Reusing the current mission row avoids a schema change
  and keeps `mission_attempt_id` as the history identity; a new dispatch increments the mission
  revision and creates a fresh attempt. The extra dispatch compatibility check is smaller and safer
  than silently leaving a known dead end. Automatic target selection and reissue remain separate.
- **Settlement state:** The mission row becomes `state = COMPLETED`, `phase = AT_SHELTER`, clears
  `active_attempt_id`, work, role, tool, target, return policy, and due markers; the attempt becomes
  `state = COMPLETED`, `phase = TERMINAL` while retaining its route, target, role, tool, and cargo
  history; the soldier becomes `AT_SHELTER` with null role/tool and no work id; the shelter coins
  increase by the server-derived delta.
- **Cargo and events:** Validate every cargo row for the active attempt, soldier, Wood/Rock type,
  positive quantity, equal capacity usage, and source provenance before deleting it. Emit one
  shelter-visible `CargoDeposited` event with the complete pre-delete item list and total coin delta.
  Emit `CoinsCredited` only for a positive delta, with previous/new wallet balance and the cargo event
  id. A zero-cargo settlement emits `CargoDeposited` with zero totals and no `CoinsCredited` event.
- **Identity and retry:** Derive `depositWorkId = mission-deposit:<mission_attempt_id>:<home_crossing_world_time>`
  from durable state. The idempotency request contains the logical attempt and crossing time, not the
  current execution world time, so a delayed retry can replay the same result. Event ids are stable
  per attempt/crossing; a changed binding or request is `DUPLICATE_COMMAND`.
- **Rejected alternatives:** The minimal option is rejected because it leaves a known dispatch dead
  end. The expanded option is rejected because target choice and automatic reissue are separate
  product decisions owned by later work. A client-supplied cargo or coin value is rejected because
  it violates server authority.
- **Required contract changes:** None to `SK-MVP-0.2`, schema version, or event version. Update the
  owning mechanics/chain wording only to record the exact settlement and resident-row reuse boundary.

## Verification and recovery

- **Minimum meaningful verification:** Red/Green focused tests for Wood and Rock totals, mixed rows,
  zero cargo, exact event order, duplicate replay, changed-request rejection, stale revisions,
  wrong shelter visibility, malformed provenance, overflow, injected rollback, delayed boundary,
  restart replay, and dispatch after the resident handoff. Then the affected CP-04 through CP-10
  aggregate, Node 24 typecheck/build, dependency dry-run, documentation gates, and scoped diff.
- **Recovery path:** A transaction failure leaves the durable `DEPOSITING` state and all cargo
  available for the same logical retry. A malformed or cross-owner row is a typed recovery fault,
  never an automatic cargo discard. A wallet revision conflict retries from the fresh shelter state.
- **Reopen or supersession trigger:** Combat or loot at home, moving shelters, weighted cargo, a
  ledger schema, automatic post-deposit reissue, multi-worker ownership, a new event/schema/contract
  version, a public/WebMCP command, or hosted default scheduler composition.
