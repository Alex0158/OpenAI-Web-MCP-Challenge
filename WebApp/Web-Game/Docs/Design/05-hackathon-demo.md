# Hackathon Demo Narrative

**Status:** Target demonstration

The preferred demonstration is one causal re-entry story:

1. Two players enter one seeded 128 × 128 map with shelters at least 80 tiles apart; each has five
   soldiers and nearby Wood and Rock nodes.
2. Player A assigns one gatherer to a resource route while Player B remains visible as a separate
   world participant.
3. Player A leaves the page while the world continues and the gatherer encounters the seeded monster.
4. The backend commits a typed event with mission, location, tool, cargo, and death cause; only the
   unbanked cargo is destroyed.
5. The delivery policy retains the causal Domain Events and sends one coalesced Agent Signal to the
   bound Agent without pausing the world or relaying every event.
6. The Agent returns to the canonical shelter page and discovers fresh WebMCP tools.
7. The Agent reads the current report and executes the bounded `force_recall_soldier` action when the
   live revision permits it; an unavailable capability, stale command, or already-completed transition
   produces a visible typed result.
8. The player sees the action result and remains responsible for migration, siege, upgrades, and
   other consequential actions outside the G2 grant.

A second optional beat is shelter breach: field soldiers become roaming monsters and the Agent helps
rebuild the damaged shelter using the event history.

## Rehearsal authority

The step-by-step local rehearsal, branch handling, evidence packet, and claim limits are owned by
[`Scenarios/16-cp16-local-vertical-slice-fixtures.md`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md)
and its preparation task. This narrative remains a target story until CP-14 delivery, CP-15
cross-boundary verification, and the CP-16 level-5 slice are runtime-verified. An unavailable WebMCP
adapter or external Receiver/Connector is shown as an explicit limitation rather than silently
replaced by a simulated success.
