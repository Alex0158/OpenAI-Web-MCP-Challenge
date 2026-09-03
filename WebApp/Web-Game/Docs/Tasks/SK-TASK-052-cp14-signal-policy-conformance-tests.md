# SK-TASK-052: CP-14 Agent Signal Policy Conformance Tests

## Task Control

- Lifecycle state: `verified`
- Closure type: `contract_verified`
- Checkpoint: `CP-14`
- Owner: Game owner
- Current increment: The primary session adopted the R14-02 through R14-05 conformance suite and the history-only cooldown policy against the current persistence seam.
- Next gate: CP-14 live delivery remains gated by the external Receiver/Connector handoff; no live delivery or Agent claim follows from this contract-test closure. The canonical game-page four-read capability is separately verified under SK-EVID-049, while dynamic recall and Agent grant delivery remain open.

## Identity

- Task ID: `SK-TASK-052`
- Date: 2026-09-02
- Risk profile: `Standard`
- Reason for profile: Test-only, additive, and reversible. It adds no runtime behavior, touches no
  existing file, and cannot change gameplay, identity, settlement, or the Re-entry authority.

## Objective

Cover the CP-14 Agent Signal notification policy at the worker-owned persistence seam before CP-14
implementation begins, so that the coalescing, deferred-cursor, cooldown, and retry rules are locked
against the written contract rather than discovered during CP-14.

## Success and non-goals

- Success: Every assertion is derived from `SK-MVP-0.2` section 7, the CP-14 scenario vectors, and
  `ADR-GAME-0009`, not from reading the implementation. The selected history-only cooldown policy is
  recorded as an explicit contract rule rather than an implementation characterization.
- Success: The suite runs green against the current seam, and the complete existing suite set remains
  green and the project type-checks.
- Success: No existing runtime or unrelated test file is modified. `package.json` is deliberately
  left untouched because it is a shared file the main thread edits; the run command is recorded below
  instead. Primary adoption may update the owning contract, ADR, issue, task, and evidence records.
- Non-goals: Implementing CP-14, contacting the Receiver, Local Connector, or a Codex Thread, exposing
  a WebMCP surface, changing `SK-MVP-0.2`, or claiming that CP-14 is complete.

## Scope and authority

- In scope: `tests/cp14-signal-policy.test.ts` only, plus this record, `SK-ISSUE-007`, and the
  evidence record.
- Out of scope: `src/`, every existing test, `package.json`, and any file the main thread is editing.
- Allowed actions: read, write the one new test file, run tests locally.
- Revalidate when: `SK-MVP-0.2` section 7, `ADR-GAME-0009`, the `agent_signal_slot` schema, or the
  delivery API changes.

## Owning authority

- Normative policy: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope)
- Accepted delivery decision: [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Vectors: [`../Scenarios/14-cp14-reentry-adapter-fixtures.md`](../Scenarios/14-cp14-reentry-adapter-fixtures.md)
- Preparation pack: [`SK-TASK-014`](SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md)
- External delivery gate:

## Coverage

| Vector | Assertion source | Result |
|---|---|---|
| R14-02 routine suppression, no grant | Contract section 7 notification policy | Pass |
| R14-02 ineligible event type with a grant supplied | "The current G2 eligibility remains `CargoLostToMonster` only" | Pass |
| R14-02 grant bound to a shelter the binding does not own | Ownership boundary; typed `OWNERSHIP_DENIED` | Pass |
| R14-03 burst merges into one signal identity | "later events merge into its eligible event count, cursor range, event types, highest severity, latest event, and latest world time" | Pass |
| R14-03 highest severity is retained and never de-escalated | "highest severity" | Pass |
| R14-03 post-handoff events accumulate in the deferred cursor | "after handoff to the Receiver, later events accumulate in the delivery slot's deferred cursor" | Pass |
| R14-04 event inside the cooldown with no active slot creates no wake | "an event inside the cooldown with no active slot remains visible in history without creating a wake" | Pass |
| R14-04 cooldown expiry issues a new signal identity | Cooldown gates wake creation; cooldown-period events are history-only | Pass |
| R14-05 retryable failure returns to pending under the same identity | "a retry reuses the same signal identity" | Pass |
| R14-05 acknowledgement appends one `ContinuationDelivered`; a repeat returns the stored outcome | Contract section 7 and `SK-TASK-005` | Pass |
| R14-05 a stale lease cannot settle a newer attempt | `SK-TASK-005` lease ownership rule | Pass |

Not covered, and deliberately so: R14-01 is already covered end to end by
`tests/cp16-local-causal-slice.test.ts`; R14-06, R14-07, and R14-08 need a Connector boundary or a
live page and remain gated by the live page-tool implementation and external Receiver/Connector handoff.

## Verification and closure target

- Command: `npx tsx --test tests/cp14-signal-policy.test.ts`
- Result under primary review: 11 of 11 pass. `npm run typecheck`, the documentation validator
  self-tests, and the project documentation validator also pass. The direct `npx tsx` command is
  retained as the task's reproducible gate; no package script is added in this test-only increment.
- Source state observed: outer `HEAD b4c5a8a` with the uncommitted game tree;
  `src/server/persistence/store.ts` and `types.ts` at 22:15:23, `schema.ts` at 21:11:46 local time.
  The main thread was editing other modules during this window, so this result is bound to that
  observed seam state.
- Minimum verification: ladder level 2, contract-level only.
- Closure target: `contract_verified` for the named worker-owned persistence seam.
- Reopen trigger: any change to the section 7 notification policy, the `agent_signal_slot` schema,
  the delivery API, or a new event-volume/Agent-UX requirement that changes the selected cooldown
  summary behavior.

## Primary review

- The primary session reviewed all eleven assertions against `SK-MVP-0.2` section 7, the R14-02
  through R14-05 fixtures, and `ADR-GAME-0009`. Routine suppression, ownership denial, burst and
  deferred coalescing, retry identity, acknowledgement idempotency, and stale-lease rejection are
  contract-derived and remain within the worker-owned persistence boundary.
- The R14-04 cooldown-period case is accepted under B: the event remains durable but is deliberately
  excluded from the next signal summary; `SK-ISSUE-007` is resolved as a specification clarification.
- Primary evidence is recorded in [`SK-EVID-041`](../Evidence/SK-EVID-041-cp14-signal-policy-conformance-contract-verification.md).

## Explicit non-claim

Passing this suite proves that the persistence seam matches the written signal policy at ladder level
2. It does not prove that CP-14 works, that a Receiver accepts a signal, that an Agent wakes, that a
page exposes a tool, or that any external delivery occurs.
