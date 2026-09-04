# CP-14 Bound-Task Notification Adoption Readback

**Status:** VERIFIED DOCUMENTATION RECONCILIATION; IMPLEMENTATION GATES OPEN  
**Date:** 2026-09-04  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Evidence:** [`SK-EVID-077`](../Evidence/SK-EVID-077-cp14-bound-task-notification-adoption-readback.md)  
**Decision:** [`ADR-GAME-0039`](../Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md)

## Audit question

Does the Game CP-14 boundary reflect the accepted same-task notification product target without
changing real-time gameplay or claiming external runtime proof?

## Findings

| Boundary | Current disposition | Required follow-up |
| --- | --- | --- |
| Product target | Accepted by outer ADR-0046 and scoped in ADR-GAME-0039: one standing Consent/Grant, repeated eligible notifications, same existing task, Agent discretion, and notification-handoff settlement. | Implement only after the exact external handoff; preserve no-action and interruption as valid downstream outcomes. |
| Game simulation | Existing world clock, `CargoLostToMonster` eligibility, 60-world-second cooldown, coalescing, durable history, and local publication lease remain unchanged. | No gameplay or signal-schema change is part of this reconciliation. |
| Task identity | Raw task locator belongs to private Connector/Adapter custody; Game and Receiver use opaque/correlation values only. | TASK-035 must provide trusted enrollment, restart recovery, wrong-owner denial, and no fresh-task fallback. |
| Notification receipt | Queue acceptance, trusted handoff, Agent wake, page read, optional command, and Game effect are distinct. | TASK-029 must accept the receipt/unknown/busy/replay contract before Game settlement wording changes. |
| Runtime package | Public `@4xeoz/re-entry-sdk` remains v0.1-only on the reviewed server surface; private Core standing signer is reference-only. | Obtain an exact versioned standing Host SDK, compatible Connector, Receiver ref, and enrollment/session contract. |
| Documentation state | ADR-GAME-0039 and the seam map are updated. Collaborator-owned CP-14 task/audit/status files still require owner reconciliation before code. | Reconcile those files as one bounded documentation increment; do not overwrite dirty work. |

## Cross-functional risk review

- Treating a fresh Codex session as the selected route would lose the continuity value the hackathon
  demonstration is meant to show.
- Treating an effect ACK as delivery completion would make legitimate Agent no-action and interruption
  look like failures and would make the Receiver monitor Game business work.
- Putting a task locator in the Event, prompt, URL, or page tools would cross the privacy and authority
  boundary and make wrong-task delivery difficult to fence.
- Changing the Game port before the receipt contract is accepted could silently reinterpret a local
  publication ACK as notification proof.

## Decision and next gate

The selected product direction is coherent with the existing real-time Game and WebMCP page model;
the unresolved work is an external capability and contract handoff, not a gameplay redesign. Keep
CP-14 implementation pending. Once the handoff is exact, start with focused adapter Red tests and
then prove notification handoff, same-task wake, page read, optional action/no-action, restart,
backpressure, replay, and revocation separately.

## Claim limits

This audit is static documentation evidence. It includes no Game runtime, Receiver database,
Connector process, Browser, WebMCP, hosted, or judge verification.
