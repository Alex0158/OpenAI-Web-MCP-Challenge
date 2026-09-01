# Capability: Event-Driven Agent Continuation

**Status:** Target integration; runtime proof is absent

## Goal

Let a user-authorized Agent return after a meaningful backend event, reread the living game state, and
prepare or execute one bounded next action through the current page.

## Entry and visible state

The user grants eligible future continuation conditions. A domain event such as soldier death, cargo
loss, attack, breach, migration completion, return, or a resource threshold can become a continuation
candidate. The Agent sees an opaque binding, current page state, mission history, threats, and current
WebMCP tools after re-entry.

## Actions and outcomes

The Agent can inspect, review, recall, set a bounded defense posture, or prepare migration/siege
according to the final authority matrix. The backend validates all commands and returns the new version,
causal result, or typed failure. High-consequence actions stop at the designed human boundary.

## Boundaries

The game backend remains authoritative. Events do not carry prompts or credentials. WebMCP is a page
action surface, not the scheduler, Receiver, private Agent context, or combat authority. The game stays
playable by humans when the continuation path is unavailable.

## Dependencies

- Mechanics: M19 and all event-producing mechanisms;
- Logic: [`../../Mechanics/Chains/08-event-to-reentry-action.md`](../../Mechanics/Chains/08-event-to-reentry-action.md);
- Engineering: [`../../Engineering/05-api-and-webmcp.md`](../../Engineering/05-api-and-webmcp.md); and
- Product thesis: [`../../Blueprint/02-core-concept-and-competition-thesis.md`](../../Blueprint/02-core-concept-and-competition-thesis.md).

