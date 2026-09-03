# SK-TASK-058: CP-13 Page Tool Proposal Independent Review

## Task Control

- Lifecycle state: `verified`
- Closure type: `answered`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The review is complete and the owner has decided all six questions; the dispositions are recorded in [`Validation/69`](../Validation/69-cp13-page-tool-proposal-independent-review.md) section 6a.
- Next gate: The R-01, R-02, R-03, R-04, and R-05 amendments are accepted in Validation/64; the
  server recall transition is now runtime-verified under SK-TASK-060 and SK-EVID-046, while CP-13
  page implementation is tracked in SK-TASK-061. The adapter capability gate is satisfied for the
  disposable page under SK-EVID-045.

## Identity

- Task ID: `SK-TASK-058`
- Date: 2026-09-03
- Risk profile: `Standard`
- Reason for profile: Read-only review of a document and current source, plus one non-mutating
  payload measurement against a temporary fixture database. It changes no contract, code, or claim,
  but it feeds a decision on a competition-gate checkpoint.

## Objective

Give the owner an independent basis for the accept, amend, or reject decision that
[`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md) requires, by checking the
proposal's load-bearing claims against current source and the accepted contract rather than accepting
them on the document's own terms.

## Success and non-goals

- Success: Each load-bearing claim is verified or falsified against a named source line, current
  source file, or an executed measurement.
- Success: Findings separate scope-honesty issues, unresolved external dependencies, and undelivered
  parts of the proposal's own plan, and each carries a concrete amendment.
- Success: The parts of the proposal that are correct are recorded explicitly so that an amendment
  does not degrade them.
- Non-goals: Editing the proposal, accepting or rejecting it, implementing CP-13, running a capability
  probe, or changing `SK-MVP-0.2`.

## Scope and authority

- In scope: [`../Validation/69-cp13-page-tool-proposal-independent-review.md`](../Validation/69-cp13-page-tool-proposal-independent-review.md)
  and this record.
- Out of scope: `Docs/Validation/64`, every other main-thread document, `src/`, `tests/`,
  `package.json`, and all runtime files. A temporary fixture database under the system temporary
  directory was created and removed by the measurement; no tracked file was written.
- Allowed actions: read, write the two task-owned documents, run one read-only measurement, run the
  documentation validator.
- Revalidate when: `Validation/64` changes, M09-08 is decided, the gateway gains a recall method, or
  the `client_snapshot` shape changes.

## Owning authority

- Proposal under review: [`../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md)
- Owning task: [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md)
- Normative contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#8-commands-and-page-tools)
- Open recall decision: [`../Scenarios/09-cp09-mission-role-return-fixtures.md`](../Scenarios/09-cp09-mission-role-return-fixtures.md)
- Capability gate: [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- Companion diagnostic: [`../Validation/68-cp13-webmcp-capability-differential-diagnostic.md`](../Validation/68-cp13-webmcp-capability-differential-diagnostic.md)

## Findings summary

| ID | Finding | Class |
|---|---|---|
| R-01 | "Reuse the existing gateway" understates the work; no recall method or recall transition exists | Scope honesty |
| R-02 | The one mutation depends on M09-08, an explicitly open contract decision the proposal never mentions | Unresolved dependency |
| R-03 | `inspect_client_snapshot` is unbounded while history is bounded; measured 6,693 bytes now, ~300 KB upper bound | Bound gap |
| R-04 | The contract names `NOT_OWNER`; the proposal uses `OWNERSHIP_DENIED`; both exist in source | Naming split |
| R-05 | The document requires a W13-01 to W13-08 mapping and delivers five of eight; the three recall vectors are absent | Undelivered plan |

Recommendation: accept the design direction, amend before it becomes canonical, and promote the
proposal's WebMCP draft finding into `SK-ISSUE-001` independently of the decision.

## Evidence status

- Verified: `WorkerCommandGateway` exposes six methods and none is a recall; `ON_RECALL` exists only
  as a return-policy enum value in `mission-service.ts`; `IN_COMBAT` appears in zero source files;
  `ClientMissionNextAction` exists in `world-projection.ts`; `OWNERSHIP_DENIED` appears in seven
  source files and `NOT_OWNER` in three; the proposal references five of the eight W13 vectors.
- Verified by measurement: the initial full `client_snapshot` serializes to 6,693 bytes with 49
  explored cells and zero blocked cells, at 18 bytes per coordinate pair.
- Inferred: the ~300 KB upper bound assumes full exploration of the 128 × 128 map and linear growth
  of `exploredCells`; it is an upper bound, not an observed value.
- Unknown: whether the owner intends `inspect_client_snapshot` to serve an Agent or only to mirror the
  page contract; whether M09-08 will be resolved before or after CP-13.

## Verification and closure target

- Minimum verification: ladder level 1 for the document cross-references, plus one level 2 measurement
  for R-03.
- Closure target: `answered`. The CP-13 decision itself closes under `SK-TASK-053`.
- Reopen trigger: any amendment to `Validation/64`, a decision on M09-08, or a change to the
  `client_snapshot` payload shape.

## Explicit non-claim

This review produces an opinion supported by source checks and one measurement. It is not a decision,
not an amendment, and not capability evidence. It does not establish that CP-13 can proceed.
