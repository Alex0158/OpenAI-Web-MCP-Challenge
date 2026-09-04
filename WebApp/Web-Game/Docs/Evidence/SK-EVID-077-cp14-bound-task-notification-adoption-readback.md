# SK-EVID-077: CP-14 Bound-Task Notification Adoption Readback

- Evidence ID: `SK-EVID-077`
- Evidence class: `static`
- Date: 2026-09-04
- Task: [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
- Decision: [`ADR-GAME-0039`](../Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md)
- Audit: [`Validation/103`](../Validation/103-cp14-bound-task-notification-adoption-readback.md)

## Question

Has the accepted outer bound-task notification target been scoped into the Game's CP-14 contract,
and which existing Game behavior must remain unchanged while the external handoff is pending?

## Source and decision identity

- Outer authority: [`ADR-0046`](../../../../Docs/Decisions/ADR-0046-restore-bound-task-notification-continuation.md),
  read from the clean tracked decision file at outer `main` commit `f4b8492`.
- Game scope: new [`ADR-GAME-0039`](../Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md),
  with the source-topology/provenance boundary retained in [`ADR-GAME-0038`](../Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md).
- Current implementation surfaces read back: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md),
  [`ReentryDeliveryPort`](../../src/server/reentry-delivery-port.ts), and the CP-14 seam map.
- Working-tree condition: the outer repository contains unrelated collaborator edits; no such file
  was overwritten or treated as accepted runtime evidence by this increment.

## Executed readback

1. Read ADR-0046's accepted product behavior: one standing Consent, private same-task binding,
   Agent discretion, trusted notification-handoff completion, and no Receiver dependency on Game
   effects.
2. Compared those rules with the Game's accepted cooldown/coalescing policy, local publication port,
   CP-14 task, and seam map. The Game-side simulation and G2 `CargoLostToMonster` eligibility remain
   compatible; fresh-session/effect-backed wording is a selected-product mismatch.
3. Recorded the scoped adoption in ADR-GAME-0039 and updated the Game decision index and seam map.
   No gameplay, schema, package, Receiver, Connector, deployment, or browser code changed.

## Result

**Verified:** the selected Game boundary now names same-task notification continuation and keeps
publication acceptance, notification handoff, Agent wake, page action, and optional Game effect
separate. The local Game port remains the pre-handoff transport boundary.

## Claim boundary and next gate

This evidence proves a documentation-level cross-functional reconciliation only. It does not prove
private task enrollment, same-task wake, notification receipt, standing Host SDK availability,
Receiver release/deployment, Connector claim, Browser/WebMCP access, or a two-signal hosted trace.

The next gate is the exact external standing-capable SDK/Connector and enrollment/session handoff.
After it arrives, reconcile the collaborator-owned CP-14 task/audit/status wording before writing the
server-only adapter Red test. Do not change Game eligibility or use a fresh-task fallback to bypass
the gate.
