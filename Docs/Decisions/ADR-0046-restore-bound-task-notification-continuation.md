# ADR-0046: Restore Bound-Task, Notification-Only Continuation

**Status:** Accepted product target; implementation and protocol transition open  
**Date:** 2026-09-03  
**Decision owner:** Project owner  
**Implementation owners:** Re-entry Core, Receiver, Connector/Adapter, Host SDK, and Game owners

## Context and decision basis

The project owner explicitly reaffirmed the original existing-task design after reviewing the
difference between that target and the fresh-session preview. Sleepless Kingdom exists to make
Re-entry Core's continuity advantage visible, not to replace it with unrelated event-triggered
Agent sessions or a Receiver-managed Game job runner.

WR-07 and ADR-0014 already require intended-context resolution. ADR-0026 deliberately omitted
existing-task mapping for a local preview. The current CLI selects that preview; its older queue
adapter accepts a manually configured task and creates an in-memory binding on first activation,
not during enrollment. The active Receiver's Consent selects a Connector, not a Codex task.
ADR-0043 additionally allowed fresh sessions and retained effect-backed acknowledgement, creating
a mismatch between the original product intent, later wording, and the current executable route.

This is both a restoration of existing-task continuity and a deliberate change to the selected
product's delivery-completion boundary. It is not evidence that either change is implemented.

## Accepted product behavior

1. One informed standing Consent authorizes repeated in-scope notifications. Ending a page session,
   Agent turn, or Connector connection does not itself revoke the relationship. Grant lifetime,
   credential renewal, and exact public controls remain separately governed by TASK-027/TASK-033;
   this decision does not accept every detail of the pending lifetime proposal.
2. Enrollment must establish an explicit, trusted local association between the approved Grant and
   the user's selected existing Agent task. The Adapter owns durable private binding custody.
   Receiver authority chooses the eligible account/device; neither that device nor the Manifest is
   itself a task binding. Raw platform task locators must not enter the Host, Receiver, Event,
   Agent prompt, logs, or tracked evidence. First capture, owner verification, persistence, and
   recovery are implementation gates, not assumed capabilities.
3. Later authorized Events notify that same task. Missing, wrong-owner, retired, or unavailable
   bindings fail visibly. Do not search for another task, reconstruct a replacement conversation,
   or silently create a fresh session. Intentional rebinding requires a trusted user-controlled
   operation; it is not a fallback and must not widen the Grant.
4. The notification explains its verified trigger and canonical return location. It is bounded
   context, not a system prompt, a new user instruction, or an order to execute a Game command.
   It cannot override the user's previously agreed strategy, current website permissions, safety
   rules, or the human boundary. Same-task identity does not promise infinite conversation memory;
   if required strategy is unavailable, the Agent must not invent it.
5. The Agent returns to the correct authenticated canonical page, reads current state, discovers
   current genuine WebMCP tools, and judges what to do under the user's strategy. It may choose a
   permitted action, no action, or a necessary human decision. A rejected Game command still returns
   its typed rejection; choosing not to call a command is not a fabricated successful mutation.
6. Receiver responsibility ends at the specified trusted notification-handoff boundary. It does not
   monitor Agent business progress, demand a Game effect, or retry because the Agent was interrupted,
   chose no action, or did not finish. Business effects remain independently observable Game facts,
   useful for demonstration and verification but not delivery-completion authority.
7. Delivery confirmation proves only that handoff boundary, not a real Agent turn, Browser access,
   WebMCP use, or completed business work. Generic adapter `accepted`, process exit, and Agent
   narration do not become trusted delivery proof by renaming them. The concrete receipt,
   correlation, deduplication, response-loss recovery, and unknown-outcome rules must be specified
   and verified before switching the product route.
8. Notification backlog and task execution are different states. Bound pending work and burst
   coalescing must avoid flooding an already busy task; task scheduling belongs to the Adapter/runtime,
   not a Receiver monitor of Game completion. Exact busy/coalescing semantics require the route's
   integration contract. Do not keep a notification slot occupied until a Game action finishes.
9. Preserve authenticated Consent, Host signatures/scope, Event identity, target isolation,
   bounded delivery attempts, secret custody, and explicit revocation. Unknown handoff is neither
   success nor permission for blind resend. Revocation fences subsequent authorized delivery; it
   cannot retract a notification already handed over or undo an Agent's completed work.

## Scope of supersession and compatibility

This decision supersedes the **selected-product target** that requires Host-effect-backed delivery
completion in ADR-0009, ADR-0038, ADR-0043, and ADR-0045. It supersedes ADR-0043's fresh-session
sufficiency for the selected Game route. ADR-0026 remains a separately labelled local preview,
never selected-product continuity evidence. ADR-0014's private custody and intended-context rule
remain in force; the selected product must now implement their missing enrollment integration.

It does **not** change signed objects, HTTP routes, stored rows, protocol versions, or tests in
the retained v0.1/v0.2 effect-backed implementations. In particular, an existing `effect_token`
must not be fabricated or reused as a notification receipt, and an existing ACK route must not
silently acquire a different meaning. Those exact compatibility profiles retain their normative
contracts and evidence until an explicit versioned transition is accepted and implemented under
TASK-029. ADR-0044's pinned conformance requirement remains in force for every retained profile.

This decision does not select a supported Codex API, change the Game's approved first event or
command envelope, migrate production data, publish a package, deploy, or authorize unrelated
work in the Game deployment task. `CargoLostToMonster` remains the first selected signal;
idle-soldier redispatch remains an illustration, not an added Game capability.

## Smallest faithful Game proof

The selected acceptance trace must show:

1. A user and Agent establish an observable strategy in one existing task.
2. One informed Consent and trusted local binding associate that task with the approved workflow.
3. The page/turn ends; the authoritative world later emits an in-scope Game signal.
4. Receiver and Connector deliver the correlated notification to that same task without a new
   manual user message. Notification handoff and actual Agent wake are recorded separately.
5. The Agent reads the correct player's live page and genuine WebMCP capabilities, then makes a
   strategy-consistent decision. Include an allowed-action trace and a deliberate no-command
   trace; neither must manufacture a Game effect to settle notification delivery.
6. A later eligible signal uses the same Consent, Grant, and task. Connector restart preserves
   binding; replay does not produce uncontrolled duplicate notifications. Test interrupted work
   and a busy-task burst without monitoring Game completion or replaying already delivered notices.
7. Explicit revocation blocks subsequent delivery; wrong-task and wrong-player cases fail closed.

The action trace still needs independent Game-state evidence to claim a mutation. The no-command
trace proves discretion, not mutation. Deployment alone, a green effect-backed fixture, or a fresh
CLI process cannot satisfy this selected-product gate.

## Alternatives and trade-offs

- **Selected:** existing-task notification continuation preserves the strategy conversation and
  keeps the Receiver application-neutral; it requires real private binding and handoff recovery.
- **Retained preview only:** fresh sessions simplify process startup but do not demonstrate the
  approved conversation-continuity target.
- **Rejected product direction:** waiting for Game effects makes the Receiver a business-work
  supervisor and makes legitimate no-action or interrupted turns look like delivery failure.

## Execution and reopen gates

- TASK-035 owns trusted private existing-task enrollment and restart-safe binding.
- TASK-029 owns the explicit notification receipt/protocol transition and convergence proof.
- TASK-034 owns actual same-task wake and authenticated Browser/WebMCP evidence, not the old
  fresh-child Browser-handoff prerequisite.
- TASK-033 owns standing product adoption and the repeated faithful Game trace; the Game owner
  reconciles its scoped CP-14 documents before integration.

Reopen this product decision only with an explicit owner decision if a supported runtime cannot
preserve the bound-task target, or if the proposed transport requires materially different custody,
authority, privacy, or user consequences. Do not solve such a blocker by silently narrowing the demo.
