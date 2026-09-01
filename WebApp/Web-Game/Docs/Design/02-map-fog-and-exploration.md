# Map, Fog, and Exploration

**Status:** Working design

The map opens as fog. The player avatar uses ordinary directional movement (W-A-S-D or an equivalent
control scheme) to reveal cells and learn the world from direct experience. Revealed map knowledge belongs to the player and does not grant
unlimited real-time visibility of enemy shelters.

The presentation should distinguish:

- explored terrain;
- current player position;
- shelter detection radius;
- soldier sensor radius;
- resource nodes;
- monster patrol and pursuit markers;
- last-known enemy shelter positions; and
- a migrating shelter's concealed current position.

A last-known position should show when it was observed and how reliable it is. A stale marker is an
intelligence clue, not a guaranteed target.
