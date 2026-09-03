# SK-ISSUE-007: Cooldown-Period Eligible Events Are Absent From the Next Signal

## Identity

- Issue ID: `SK-ISSUE-007`
- Title: The contract does not say whether eligible events that occur inside the cooldown are counted in the next Agent Signal
- State: `resolved`
- Priority: `P2`
- Type: specification clarification
- Owner and registered date: Game owner, 2026-09-02

## Problem and impact

- Observed behavior: When a signal slot is `acknowledged` and an eligible `CargoLostToMonster` commits
  while `world_time < cooldown_until_world_time`, the signal upsert returns early. The Domain Event is
  durable in the event log, but it is recorded in neither the active window nor the deferred window.
  When the cooldown later expires, the next signal's `eligible_event_count` and cursor range cover
  only the reopening event.
- Expected behavior: The owner-selected B policy is history-only suppression. `SK-MVP-0.2` section 7
  guarantees that such an event remains visible in history without creating a wake, and now explicitly
  states that it is not added to the active or deferred Signal window and is not folded into a later
  Signal after cooldown expiry. The deferred-cursor rule remains scoped to events arriving after
  handoff to the Receiver.
- Impact: If several losses occur inside one cooldown, the Agent's signal reports an eligible count of
  one. The cursor range is documented as "a page-read window" and the Agent must reread the canonical
  page before acting, so authoritative state is not at risk. The risk is that the signal's summary
  understates what happened and could shape the Agent's judgement of severity or urgency.

## Evidence

- Verified: `tests/cp14-signal-policy.test.ts`, test
  "R14-04: after the cooldown a new signal excludes history-only cooldown events", demonstrates the
  accepted behavior against the current seam. The same test confirms all three Domain Events remain
  durable and readable.
- Verified: the early return is in the `acknowledged` / `terminally_rejected` branch of the signal
  upsert in `src/server/persistence/store.ts`, before any deferred-window write.
- Inferred: the implementation is consistent with the clarified contract and needs no runtime or
  schema change.

## Ownership and dependencies

- Owning document: [`../../Engineering/09-mvp-contract-sheet.md`](../../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope)
  and [`../../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Related: [`SK-TASK-052`](../../Tasks/SK-TASK-052-cp14-signal-policy-conformance-tests.md),
  [`SK-TASK-014`](../../Tasks/SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md), and the
  CP-14 vectors in [`../../Scenarios/14-cp14-reentry-adapter-fixtures.md`](../../Scenarios/14-cp14-reentry-adapter-fixtures.md)

## Plan and gates

- Next smallest action: None; the selected B answer is reconciled in `SK-MVP-0.2`, `ADR-GAME-0009`,
  and the R14-04 test, and this record is preserved in the resolved issue history.
- Challenge or decision required: The owner selected option (b): deliberately exclude cooldown-period
  events from later Signal summaries while retaining them in canonical history.
- Stop or escalation condition: Reopen before changing the behavior if event volume, Agent UX, or a
  future Signal envelope requires a complete cooldown-window summary.
- Verification required for closure: The former implementation characterization is now a contract-derived assertion
  in `tests/cp14-signal-policy.test.ts` and passes with the updated contract records.

## Resolution

- Change and remediation: Option (b) is selected. The contract and `ADR-GAME-0009` now state that
  an eligible event accepted during an acknowledged cooldown is durable history only: it creates no
  wake, does not enter the active or deferred Signal window, and is not folded into the next Signal.
  The R14-04 implementation characterization is converted to a contract assertion. No runtime or schema change is
  required.
- Evidence: [`SK-EVID-041`](../../Evidence/SK-EVID-041-cp14-signal-policy-conformance-contract-verification.md)
  and [`SK-TASK-052`](../../Tasks/SK-TASK-052-cp14-signal-policy-conformance-tests.md).
- Exact closure label: `specified`.
- Residual risk and owner: The Signal summary can understate event volume during cooldown; the
  canonical page history remains authoritative and the Agent must reread it before acting. Owned by
  the Game owner.
- Reopen trigger: Any change to the cooldown rule, the Agent Signal envelope, or G2 event eligibility.
