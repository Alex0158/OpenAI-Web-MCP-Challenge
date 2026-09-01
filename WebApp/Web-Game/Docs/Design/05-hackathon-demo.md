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
5. Re-entry Core delivers a bounded continuation to the bound Agent.
6. The Agent returns to the canonical shelter page and discovers fresh WebMCP tools.
7. The Agent reads the current report and either prepares a safer route, recalls another squad, or
   proposes migration.
8. The player sees the proposed effect and remains responsible for the consequential action.

A second optional beat is shelter breach: field soldiers become roaming monsters and the Agent helps
rebuild the damaged shelter using the event history.
