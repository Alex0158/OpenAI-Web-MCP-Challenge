# Core Concept and Competition Thesis

**Status:** Working competition thesis  
**Owner:** Blueprint module  
**Decision boundary:** The outer application-selection ADR remains pending

## Core concept

Re-entry Core is demonstrated as a player-governed continuation of a living game world. The player
sets a mission in a canonical page. The backend commits a typed event when the world changes the
mission's situation. A delivery policy can coalesce eligible events into one bounded Agent Signal;
it never pauses the world or turns the Codex Thread into an event stream consumer. A continuation
adapter can return the bound Agent to that page. The Agent
reads the current shelter, soldiers, cargo, threats, and mission history, discovers the page-bound
WebMCP tools that are valid now, performs one bounded action, and stops where human judgment belongs.

## Problem solved

A normal game notification says that something happened. It does not preserve an actionable,
authoritative continuation context. A generic Agent prompt says what to do next without proving that
the world state is current or that the action belongs to the same user and shelter.

Sleepless Kingdom gives the continuation a durable object (the shelter and its missions), a causal
event (attack, death, breach, return, resource threshold, or migration), and a visible action
surface (the live game dashboard and WebMCP tools).

## Advantages

- The value of re-entry is legible: the world changed while the player was away.
- The same player doctrine persists across time; the Agent is not handed an unrelated new request.
- The game supplies rich causal evidence for why a decision is needed.
- WebMCP tools can be narrow and page-bound: inspect current state, review a mission, set a policy,
  recall a squad, start migration, or prepare a siege.
- Human play remains valid when WebMCP is unavailable; the Agent is an additional continuation path.
- The magical shelter and corrupted soldiers give the world a memorable consequence model.

## Mechanism boundary

WebMCP is the page action surface. Re-entry Core owns consent, typed event acceptance, delivery,
private context activation, canonical-page return, fresh state, and the human boundary. The game
backend remains authoritative for ownership, permissions, state transitions, combat, and irreversible
consequences.

## Candidate comparison boundary

The concept-only discussion gives this game the stronger re-entry demonstration thesis than the
RightSpot candidate: a backend event changes a living world that the same player's Agent must read
and continue from, rather than starting an unrelated request. This is a working competition thesis,
not an outer application-selection decision; both application concepts remain separate until the
selection authority accepts one.

## Desired result

A judge should be able to see one continuous narrative:

```text
player assigns a gatherer
-> world continues while the page is unattended
-> gatherer is ambushed and loses cargo
-> backend commits a typed event
-> Agent re-enters the same shelter page
-> Agent reads the death report and current threats
-> Agent executes one bounded recall action when the live revision permits it
-> otherwise the page shows a typed stale or already-completed result
-> player remains responsible for the consequential choice
```
