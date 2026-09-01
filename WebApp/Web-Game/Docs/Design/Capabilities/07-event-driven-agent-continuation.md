# Capability: Event-Driven Agent Continuation

**Status:** G2 boundary accepted; runtime proof is absent

## Goal

Let a user-authorized Agent return after a meaningful backend event, reread the living game state, and
execute one bounded next action through the current page. In G2, that action is the accepted
`force_recall_soldier` command.

## Entry and visible state

The user grants eligible future continuation conditions. In G2, only `CargoLostToMonster` can create a
continuation. The Agent sees an opaque binding, current page state, mission history, threats, and
current WebMCP tools after re-entry.

## Actions and outcomes

The Agent can inspect and execute the bounded `force_recall_soldier` action under the accepted grant.
The backend validates the command and returns the new version, causal result, or typed failure; an
unsupported capability is reported visibly and leaves the human dashboard usable.
Migration, siege, destructive upgrades, and irreversible recovery stop at the designed human boundary.

## Boundaries

The game backend remains authoritative. Events do not carry prompts or credentials. WebMCP is a page
action surface, not the scheduler, Receiver, private Agent context, or combat authority. The game stays
playable by humans when the continuation path is unavailable.

## Dependencies

- Mechanics: M19 and all event-producing mechanisms;
- Logic: [`../../Mechanics/Chains/08-event-to-reentry-action.md`](../../Mechanics/Chains/08-event-to-reentry-action.md);
- Engineering: [`../../Engineering/05-api-and-webmcp.md`](../../Engineering/05-api-and-webmcp.md); and
- Product thesis: [`../../Blueprint/02-core-concept-and-competition-thesis.md`](../../Blueprint/02-core-concept-and-competition-thesis.md).
