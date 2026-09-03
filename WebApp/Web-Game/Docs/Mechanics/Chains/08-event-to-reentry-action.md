# Chain C08: Event to Re-entry Action

**Status:** G2 Re-entry boundary accepted; runtime delivery is unverified

## Trigger and outcome

A meaningful game event changes a player's situation while the page is unattended. The chain ends in
a fresh canonical-page read and one bounded Agent action or a visible human decision boundary.

## Ordered flow

1. An atomic mechanism commits `CargoLostToMonster` while the page is unattended.
2. `M19` checks the user's grant, event eligibility, one-pending-signal rule, dedupe state,
   60-world-second G2 continuation cooldown, and available bounded recall action.
3. The game appends the Domain Event and creates or updates one coalesced Agent Signal with an opaque
   binding, signal identity, causal `world_event_cursor` range, eligible event count/types/severity,
   world time, entity versions, and bounded continuation hint in the durable delivery records. The
   logical coalescing slot is authoritative for that summary; the outbox record tracks transport
   attempts only. The cursor range is the page-read window, not a claim that every cursor is eligible
   for notification.
4. The outer Re-entry Core Receiver accepts or rejects the Agent Signal and the adapter activates the
   bound private Agent context. A retry reuses the same signal identity.
5. The Local Connector sends at most one coalesced wake-up to the bound Codex Thread. If the Thread is
   already running, the Connector holds the merged context until the next safe turn boundary.
6. The Agent returns to the canonical shelter page and rereads current shelter, missions, threats,
   cargo, the event digest, and event history.
7. The page exposes current permission-checked WebMCP tools. The Agent executes the bounded
   `force_recall_soldier` action under the accepted grant when the live revision permits it.
8. The backend validates the command against current state, commits or rejects it, and displays the
   typed result and human consequence boundary. The world never waits for the Agent.

## Failure branches

- No grant, duplicate event, or unavailable action updates history without waking the Agent.
- Receiver delivery fails; the outbox remains retryable without repeating game state.
- A burst of routine events is retained in the Domain Event log but does not create Agent Signals.
- Multiple actionable events merge into one pending or in-flight signal and never become per-event
  Codex Thread messages.
- Events arriving after Receiver handoff accumulate in the delivery slot's deferred cursor and wait for
  the next signal rather than creating a second wake-up.
- A critical event raises the merged severity without interrupting an active Thread turn.
- The page is stale or tools changed; the Agent rereads and receives a typed failure.
- The world has advanced before the command arrives; the server returns a typed live-state failure
  rather than a silent no-op.
- A high-consequence action stops at human approval rather than bypassing the game rule.

## Open decisions

- post-G2 continuation eligibility and grant scope;
- exact production tool authority levels and event payload fields; and
- post-G2 delivery eligibility, aggregation, and continuation policy.

## Invariants and evidence

An event is a state change, not a prompt. WebMCP is a page action surface, not scheduler or game
authority. Proof must show event commit, delivery, page return, fresh tool discovery, command result,
and human boundary. Candidate events beyond the accepted G2 event and exact production eligibility
remain `OPEN`.

## Related mechanisms

- [`../detail-19-reentry-event-hook.md`](../detail-19-reentry-event-hook.md);
- [`../../Engineering/05-api-and-webmcp.md`](../../Engineering/05-api-and-webmcp.md); and
- [`../../Design/Capabilities/07-event-driven-agent-continuation.md`](../../Design/Capabilities/07-event-driven-agent-continuation.md).
