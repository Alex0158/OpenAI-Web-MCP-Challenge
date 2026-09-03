# ADR-GAME-0009: Re-entry Delivery and Thread Backpressure

**Status:** ACCEPTED DELIVERY POLICY; Re-entry runtime delivery remains unverified  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Supersedes:** The Re-entry delivery timing concern in `ADR-GAME-0006`; it does not change the
accepted bounded action or human consequence boundary.

## Context

The game is a continuously advancing world. A backend event must be able to bring an Agent back to
the canonical page, but the Agent is not the simulation clock and a Codex Thread is not an event
stream consumer. High-frequency events such as repeated shelter attacks, movement updates, or combat
rounds can otherwise create a relay storm:

```text
domain event -> Cloud Receiver -> Local Connector -> repeated Codex Thread messages
```

The earlier proposal for a fixed gameplay Re-entry Window would avoid one timing race by holding a
soldier at the shelter. That would make the world wait for an Agent and would weaken the real-time
game contract. A different solution is required: preserve real-time state transitions, keep the full
domain history, and regulate only the derived Agent notification path.

## Decision

Adopt the following policy for the `SK-MVP-0.2` Re-entry delivery revision.

### 1. Domain events and Agent Signals are different artifacts

- A **Domain Event** is an authoritative, state-changing record. Every committed gameplay transition
  keeps its globally unique event id, monotonically increasing `world_event_cursor`, causal order,
  entity revision, and typed payload in the durable event log. The cursor is scoped to one `world_id`
  and is allocated in the same transaction as the state change.
- An **Agent Signal** is a derived delivery envelope. It is not game authority and is not a replacement
  for the event log. It may reference a `world_event_cursor` range and summarize many Domain Events.
  The range is a page-read window; it may include routine events that are visible in history but are
  not counted as eligible signal events.
- The Cloud Receiver receives eligible Agent Signals, not an unbounded stream of raw simulation ticks.
- The Agent returns to the page and reads the current authoritative `client_snapshot` projection and
  recent permitted events before deciding. A signal never carries a prompt, credential, hidden state,
  or authoritative command outcome.

### 2. The game never waits for Re-entry

The world clock, movement, combat, cargo settlement, death, respawn, mission reissue, and all other
game rules continue immediately. There is no fixed post-event gameplay grace period and no
`WAITING_REVIEW` hold for Agent latency. A late command is evaluated against the live entity revision
and receives a typed result such as `STALE_REENTRY_CONTEXT`, `ALREADY_AT_SHELTER`, or
`STALE_REVISION`.

### 3. Route notifications by meaning

The delivery policy classifies events before a signal is created:

- **Routine:** movement, world ticks, ordinary combat rounds, and repeated projection changes do not
  wake the Agent.
- **Actionable:** an event such as `CargoLostToMonster` creates or updates one coalesced signal for
  the bound shelter and Agent context.
- **Critical:** when enabled by the current product contract, a transition such as `ShelterBreached`
  raises the severity of an existing signal or creates one signal when no signal is pending. It does
  not interrupt an active Agent turn or create duplicate wake-ups. `ShelterBreached` remains outside
  G2 eligibility.

The current G2 eligibility remains unchanged: only `CargoLostToMonster` can create a continuation,
with the accepted one-continuation-per-shelter rule and 60-world-second product cooldown.
The cooldown gates creation of a new wake, not Domain Event retention. A qualifying event that arrives
while a delivery slot is already pending or in flight may merge into that slot; when no slot is active,
an event inside the cooldown remains in history without creating a wake. The accepted G2 policy is
history-only suppression for that case: the event does not enter the active or deferred Signal window
and is not folded into a later Signal after cooldown expiry. The Agent rereads canonical page history
when it needs the complete sequence; a Signal is a bounded notification summary.

### 4. Coalesce before and after the Receiver boundary

For each opaque continuation binding and shelter:

- at most one outgoing Agent wake is pending or in flight at a time;
- subsequent eligible events merge into the pending context as an eligible event count,
  `world_event_cursor` range, event types, highest severity, latest event, and latest world time;
- after a signal has been handed to the Receiver, later events accumulate in the same delivery slot's
  deferred cursor rather than creating a second outgoing signal; the deferred cursor is folded into the
  next signal only after the current delivery is acknowledged or terminally rejected;
- an eligible event that arrives during the cooldown with no pending or in-flight delivery remains
  durable history only and is not carried into a later Signal;
- a retry reuses the same signal identity and cannot create a second wake;
- the Local Connector never sends one Codex Thread message per event;
- while the Thread is running, the Connector holds one coalesced pending context and delivers it only
  at the next safe turn boundary; and
- once a signal is acknowledged or terminally rejected, a later coalesced context may create the next
  signal.

This is notification backpressure, not gameplay throttling. It protects the Agent transport without
dropping the authoritative Domain Events.

### 5. The page remains the reasoning surface

The delivered signal tells the Agent that the world changed and where to read. The Agent then uses
page-bound WebMCP inspection tools to obtain current state, event history, permissions, and revisions.
The server validates every consequential command. The Agent may succeed, lose the race, or receive an
unsupported-capability result; all outcomes are visible and auditable.

## Alternatives considered

### Relay every Domain Event

This preserves raw detail but turns the Codex Thread into an event consumer, creates duplicate
reasoning work, and can prevent the original task from progressing. Rejected.

### Fixed gameplay Re-entry Window

Holding a soldier or the world for a number of seconds makes the action easier to demonstrate but
changes real-time semantics and creates a new balance exploit. Rejected.

### Drop high-frequency Domain Events

This reduces volume but destroys causal history and can make replay, settlement, and recovery
incorrect. Rejected.

### Backend-only rate limit

A time limit before the Receiver helps, but it does not stop repeated Connector messages when the
Thread is already running. Rejected as the sole control; retained only as an optional measured
transport safety setting outside the game contract.

## Consequences

The G2 world remains genuinely real-time, and the Re-entry demonstration shows the intended loop:
event, Agent return, current-page read, typed decision, and server result. High-frequency simulation
can continue without flooding the Cloud Receiver or Codex Thread. The implementation needs a small
signal aggregation and Connector dispatch state, plus dashboard evidence for event counts and
delivery status. Domain-event retention and long-term production compaction remain separate
operations decisions.

## Verification obligations

The Re-entry slice must prove:

1. a burst of routine events creates no Agent Signal;
2. multiple actionable events create one coalesced signal with the correct `world_event_cursor` range
   and eligible event count;
3. a running Thread receives no per-event message;
4. events arriving after handoff remain in the deferred cursor and become part of one later signal;
5. a duplicate delivery reuses the signal identity and has no second game effect;
6. a critical event raises severity without bypassing the active-turn boundary; and
7. a late WebMCP command returns a typed live-state result rather than a silent no-op; and
8. an eligible event inside an acknowledged cooldown remains readable in history but is absent from
   the later Signal summary.

## Reopen triggers

Reopen this ADR if runtime evidence shows that a coalesced signal loses a causal event, the Connector
can still enqueue unbounded Thread messages, a critical transition cannot be surfaced at the next safe
boundary, or the accepted G2 action requires a gameplay grace period to be demonstrable.
