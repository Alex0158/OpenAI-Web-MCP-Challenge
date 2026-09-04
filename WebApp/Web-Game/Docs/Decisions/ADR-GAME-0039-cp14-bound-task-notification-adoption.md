# ADR-GAME-0039: Adopt Bound-Task Notification Continuation for CP-14

- Status: Accepted scoped product adoption; implementation gates open
- Date: 2026-09-04
- Scope: Sleepless Kingdom CP-14 selected-product Re-entry behavior
- Authority: Outer [`ADR-0046`](../../../../Docs/Decisions/ADR-0046-restore-bound-task-notification-continuation.md)

## Context

The outer project accepted ADR-0046 to restore the original Re-entry value: a later authorized
notification returns to the same enrolled Agent task, where the Agent rereads the live page and
decides what to do. The previous CP-14 preparation still described a fresh Codex session and an
effect-backed acknowledgement as the preferred product route. Those descriptions are retained as
historical or compatibility evidence, but they must not guide the selected Game integration.

This decision scopes the accepted outer product target to the Game without changing the Game's
simulation, signal eligibility, or page-command authority. It records the boundary that the next
implementation must satisfy; it does not claim that task binding, notification handoff, or the
standing Host SDK is already implemented.

## Decision

1. **Selected continuation.** CP-14 targets one informed standing Consent, one Receiver Grant, and
   repeated eligible `CargoLostToMonster` notifications delivered to the same enrolled Agent task.
   The world clock, missions, combat, cargo, cooldown, coalescing, and current G2 eligibility remain
   unchanged.
2. **Private task binding.** Enrollment must create a trusted, restart-safe association between the
   approved Receiver authority and the selected existing task. The Connector/Agent Adapter owns the
   raw task locator privately. Game, Receiver Event data, browser state, page tools, logs, and prompts
   may carry only the approved opaque/correlation values and bounded notification context.
   Missing, wrong-owner, retired, or unavailable bindings fail visibly; no fresh-task fallback or
   task search is permitted.
3. **Notification boundary.** Game publication acceptance, Receiver queue acceptance, trusted
   notification handoff, actual Agent wake, page read, optional Game action, and any action result
   remain separate observations. A `202`, a generic transport `accepted`, a process exit, or Agent
   narration cannot be relabelled as a completed Game effect or as proof of Browser/WebMCP use.
4. **Agent discretion.** After returning to the authenticated canonical page and reading current
   state, the Agent may choose a permitted action, no action, or a human decision. The existing
   `force_recall_soldier` capability remains bounded by the Game's server ownership, revision,
   idempotency, and human checks; a notification does not require that command and no-command is not
   a fabricated success.
5. **Receipt ownership.** The Game must not wait for an Agent turn or Game effect to settle a
   notification. The exact trusted handoff receipt, response-loss recovery, busy-task policy, and
   deduplication belong to the TASK-029/TASK-035 integration contract. Until that contract is
   accepted, the existing Game publication port and its labelled local stub remain unchanged.
6. **Protocol and package gate.** The recurring path remains additive protocol-v0.2 standing
   authorization. The public `@4xeoz/re-entry-sdk` package currently exposes only the reviewed v0.1
   server surface, so CP-14 must not install NPM `latest` as a standing adapter or import the private
   Core signer directly. An exact versioned standing-capable Host SDK, compatible Connector artifact,
   accepted enrollment/session route, and designated Receiver ref are required before adapter code.
7. **Evidence boundary.** A fresh-session preview and effect-backed v0.2 trace remain valid only for
   their named compatibility scopes. They cannot close the selected bound-task notification target.
   The first selected-product trace must separate notification handoff and Agent wake, demonstrate a
   deliberate no-command branch, and then show a later eligible signal reusing the same Consent,
   Grant, and task.

## Cross-functional contract

| Boundary | CP-14 rule | Owner/gate |
| --- | --- | --- |
| Game signal | Preserve `CargoLostToMonster`, existing cooldown, coalescing, durable event history, and `ReentryDeliveryPort`. | Game contract and [`ADR-GAME-0009`](ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md) |
| Standing authority | One Consent/Grant may authorize repeated ordered signals with one-active backpressure and explicit revocation/expiry. | Outer ADR-0043/0046; exact Receiver/Host SDK handoff |
| Task identity | Resolve the existing task through a private Adapter binding; never copy a raw locator or fall back to a new task. | [`TASK-035`](../../../../Docs/Tasks/TASK-035-bind-existing-agent-task-during-enrollment.md) |
| Notification settlement | Settle at a trusted handoff boundary, independent of Agent completion, no action, interruption, or Game effects. | [`TASK-029`](../../../../Docs/Tasks/TASK-029-settle-connector-notification-delivery.md) |
| Page and action | Read the live authenticated page and genuine WebMCP capability before deciding; any command keeps normal server checks. | [`TASK-034`](../../../../Docs/Tasks/TASK-034-verify-connector-browser-webmcp-route.md), CP-13 Game contract |
| Package/source | Pin exact Receiver ref, Core source, Host SDK/Connector artifact, exports, integrity, Node floor, and conformance command. | [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md) |

## Implementation gates

No Game adapter Red run is admitted until the external handoff supplies the exact standing-capable
Host SDK and enrollment/session contract. Once supplied, the implementation sequence is:

1. reconcile `SK-TASK-076`, Validation/89, current status, seam map, and affected contract wording
   with this scoped adoption;
2. add a server-only binding/sequence mapper behind the existing Game port and write focused Red
   tests for accepted, duplicate, unknown, wrong-scope, revoked, expired, out-of-order, and
   one-active outcomes;
3. implement the smallest typed transport using the exact reviewed artifact, with no Game-side
   claim/ACK, second queue, per-event Thread message, hidden retry, or credential transport;
4. verify trusted notification handoff and actual same-task wake separately, then verify page read,
   optional action/no-action/interruption, restart, burst, replay, and revocation claims at their own
   evidence levels.

## Alternatives and consequences

- **Fresh session:** retained as a simpler preview path, but it does not demonstrate the accepted
  conversation-continuity value and is not the selected CP-14 route.
- **Effect-backed completion:** retained for compatibility evidence, but it would incorrectly make
  the Receiver supervise Game work and misclassify deliberate no-action or interruption as failure.
- **Current local stub only:** remains the safe pre-handoff boundary; it proves Game publication
  mechanics but cannot prove external notification or same-task wake.

The selected route demonstrates Re-entry's continuity advantage and keeps the real-time Game
simulation independent of Agent latency. It adds private task enrollment and a trusted handoff
receipt to the cross-team work. Those additions must be implemented in their owning Connector/Adapter
and protocol tasks rather than hidden inside the Game or inferred from a queue response.

## Reopen triggers

Reopen this scoped adoption if the supported runtime cannot preserve the bound-task identity, if
private task custody would require a new exposed authority, if the notification handoff cannot be
made distinct from Agent execution, if Game cooldown/eligibility must change, or if a proposed
fallback would create a new task, leak a locator, or require the Receiver to monitor Game effects.
