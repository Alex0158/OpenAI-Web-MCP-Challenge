# CP-10 Wood/Rock Economy Fixtures

**Status:** First extraction/cargo boundary runtime-verified under `SK-TASK-029`; recurring cadence and capacity/target-depleted return handoff are runtime-verified under `SK-TASK-030`; same-worker contested-node outcome is runtime-verified under `SK-TASK-031`; return-navigation/home crossing is runtime-verified under `SK-TASK-032`; deposit and settlement are runtime-verified under `SK-TASK-033`  
**Checkpoint:** CP-10  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Task:** [SK-TASK-033](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md); predecessor: [SK-TASK-032](../Tasks/SK-TASK-032-cp10-return-navigation-and-home-crossing.md); parent preparation: [SK-TASK-010](../Tasks/SK-TASK-010-cp10-economy-preimplementation-pack.md)  
**Purpose:** Prepare the authoritative Wood/Rock extraction, five-slot cargo, automatic return, shelter deposit, and coin settlement boundary.

These vectors are preparation inputs and observable outcomes. E10-01, the first extraction ordering,
provenance, duplicate, failure, migration, and restart portions are runtime-covered by SK-TASK-029;
E10-02 and E10-03 are verified under SK-TASK-030; the same-node contest vectors are runtime-covered
by SK-TASK-031 and [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md). The
remaining vectors are still preparation-only. E10-10 is now runtime-covered by SK-TASK-032 and
[`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md). E10-06 is runtime-covered by SK-TASK-033 and
[`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md), with cross-functional review in
[`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md). They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-09 and CP-05.
- Owning authority: detail-11-resource-extraction-cargo-and-deposit.md, detail-14-loot-reward-and-atomic-transfer.md, Chains/02-dispatch-to-deposit.md, and contract sections 5 and 7.
- Cross-functional handoff: CP-09 commits role/tool/target/attempt; CP-08 commits arrival; CP-11 may destroy or transfer exposed cargo; CP-12 renders risk; CP-22 may later extend tool yield.
- Scope: Atomic node/cargo/deposit preparation, Wood/Rock values, capacity and depletion fixtures, duplicate settlement checks, and CP-09/11/12/14/22 handoffs.
- Non-goals: SQL schema, worker code, movement, missions, combat, PvP loot, upgrades, gold, crafting, weighted cargo, production balance, WebMCP, Re-entry delivery, or hosted deployment.

## Evidence classification

- Verified inputs: Five equal-weight slots, one unit every two world seconds, 20 units per node, 30-second respawn, Wood at one coin, Rock at three coins, no coin before deposit, and atomic node/cargo/deposit ownership.
- Preparation inference: One ledger boundary with cargo revision and deposit idempotency is the lowest-risk G2 implementation; reservation and weighted capacity should wait for evidence.
- Open fields: partial extraction and final-slot semantics, simultaneous extraction ordering, node reservation or no-reservation policy, future tool-tier yield and typed weights, deposit history pagination and ledger projection.

## Vectors

### E10-01 — Valid extraction

**Given:** A gatherer has a valid role, tool, target, route, and current revisions.  
**When:** An extraction milestone is due.  
**Then:** One node unit decrements, one cargo unit is added to the same mission attempt, one event is committed, and no coin exists.

### E10-02 — Capacity starts return

**Given:** A gatherer has four slots and one available node unit.  
**When:** The fifth extraction settles.  
**Then:** Capacity reaches five exactly and the mission enters RETURNING once; a sixth unit cannot be added.

### E10-03 — Partial node depletion

**Given:** A node has fewer units than the remaining cargo capacity.  
**When:** The last available unit is extracted.  
**Then:** The node reaches zero, the node timer is scheduled once, and the mission receives the accepted target-depleted return handoff with partial cargo.

### E10-04 — Duplicate extraction retry

**Given:** A due milestone is retried with the same logical identity after commit.  
**When:** The worker handles the retry.  
**Then:** The original result is returned and quantity, cargo, revision, and event cursor do not advance twice.

### E10-05 — Two soldiers contest the final unit

**Given:** Two valid attempts address a node with one remaining unit.  
**When:** Both milestones are serialized at the same world boundary.  
**Then:** The lower mission-attempt id receives the unit; the other atomically enters `RETURNING` with
`TARGET_DEPLETED`, preserves exposed cargo, and emits no second depletion event. A node that was
already empty before the boundary with no cargo remains a typed `TARGET_UNAVAILABLE` outcome.

### E10-06 — Deposit exactly once

**Given:** A returning soldier reaches the authoritative home anchor with exposed Wood or Rock.  
**When:** Deposit commits and is then retried.  
**Then:** Validated cargo is removed once, Wood and Rock convert at one and three coins per unit, the
soldier returns to `AT_SHELTER`, the completed attempt remains history, and a duplicate retry returns
the original result without a second deletion, credit, revision, cursor, or event. A zero-cargo
attempt emits zero-value `CargoDeposited` and no positive `CoinsCredited` event.

### E10-10 — Return reaches home before deposit

**Given:** A full or target-depleted gatherer is `RETURNING` with a persisted route, home anchor, and exposed cargo.  
**When:** The movement phase reaches the derived return due boundary.  
**Then:** The reversed route reaches the exact home anchor, one `MissionHomeReached` event commits
`RETURNING → DEPOSITING`, the soldier identity and cargo remain unchanged, and no coin or cargo removal
occurs before the later deposit phase.

### E10-07 — Death before deposit

**Given:** A field soldier carries cargo and dies before home crossing.  
**When:** CP-11 settles the combat result.  
**Then:** Only exposed cargo is destroyed or transferred according to the owning combat rule; no deposit or coin is created.

### E10-08 — Restart at extraction boundary

**Given:** The worker stops before or after an extraction/deposit transaction.  
**When:** The world restarts from the durable snapshot and event cursor.  
**Then:** The committed boundary replays once and the abandoned boundary remains retryable without a second effect.

### E10-09 — Stale role or tool

**Given:** A mission record has a committed loadout while the client submits a changed tool.  
**When:** The next extraction is evaluated.  
**Then:** The server reads the mission loadout, rejects an invalid capability, and never grants the client-selected yield.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- partial extraction and final-slot semantics;
- node reservation or multi-worker fairness policy beyond the verified same-worker order;
- future tool-tier yield and typed weights;
- deposit history pagination and ledger projection;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
