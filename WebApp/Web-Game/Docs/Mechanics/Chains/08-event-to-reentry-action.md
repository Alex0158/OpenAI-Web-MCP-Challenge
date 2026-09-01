# Chain C08: Event to Re-entry Action

**Status:** G2 Re-entry boundary accepted; runtime delivery is unverified

## Trigger and outcome

A meaningful game event changes a player's situation while the page is unattended. The chain ends in
a fresh canonical-page read and one bounded Agent action or a visible human decision boundary.

## Ordered flow

1. An atomic mechanism commits `CargoLostToMonster` while the page is unattended.
2. `M19` checks the user's grant, one-pending-continuation rule, dedupe state, 60-world-second
   cooldown, and available bounded recall action.
3. The game writes an opaque binding, event id, world time, entity versions, causal type, and bounded
   continuation hint to the durable outbox.
4. The outer Re-entry Core Receiver accepts or rejects the event and the adapter activates the bound
   private Agent context.
5. The Agent returns to the canonical shelter page and rereads current shelter, missions, threats,
   cargo, and event history.
6. The page exposes current permission-checked WebMCP tools. The Agent rereads current state and
   executes the bounded `force_recall_soldier` action under the accepted grant.
7. The backend validates the command, commits or rejects it, and displays the result and human
   consequence boundary.

## Failure branches

- No grant, duplicate event, or unavailable action updates history without waking the Agent.
- Receiver delivery fails; the outbox remains retryable without repeating game state.
- The page is stale or tools changed; the Agent rereads and receives a typed failure.
- A high-consequence action stops at human approval rather than bypassing the game rule.

## Open decisions

- post-G2 continuation eligibility and grant scope;
- exact production tool authority levels and event payload fields; and
- future delivery dedupe and continuation policy.

## Invariants and evidence

An event is a state change, not a prompt. WebMCP is a page action surface, not scheduler or game
authority. Proof must show event commit, delivery, page return, fresh tool discovery, command result,
and human boundary. Candidate events beyond the accepted G2 event and exact production eligibility
remain `OPEN`.

## Related mechanisms

- [`../detail-19-reentry-event-hook.md`](../detail-19-reentry-event-hook.md);
- [`../../Engineering/05-api-and-webmcp.md`](../../Engineering/05-api-and-webmcp.md); and
- [`../../Design/Capabilities/07-event-driven-agent-continuation.md`](../../Design/Capabilities/07-event-driven-agent-continuation.md).
