# ADR-GAME-0038: Treat the Merged Re-entry Source as the CP-14 Baseline

- Status: Accepted
- Date: 2026-09-04
- Scope: Sleepless Kingdom CP-14 source topology and live-integration boundary

## Context

Earlier CP-14 records were written before the Re-entry implementation was merged into the outer
repository. They describe Eddy's branch as a pending source handoff and can be read as if another
branch merge is still required.

The current outer `main` already contains the Game-facing `reentry-core`, Host SDK, Local Connector,
and `reentry-cloud-web-app` source. The Full-Integration cloud web app was added in commit
`870ccfc`; the current `main` is the shared development baseline. No additional Eddy branch merge is
required for the Game-facing source.

The Cloud Receiver backend is intentionally a separate `saas-boilerplate` repository and deployment
boundary. The isolated Vercel Preview built from Receiver commit
`0195a9846024c4f65c62d3922069970ad1b96b92` is an integration target, not a new source tree to merge
into the Game repository.

## Decision

1. Treat the current outer `main` as the accepted source baseline for the Game-facing Core, Host SDK,
   and Local Connector code. CP-14 must not wait for another Eddy branch merge.
2. Reinterpret the CP-14 “handoff” as a compatibility and runtime-readback packet: exact source
   commits, package exports and versions, Receiver endpoint, database/migration state, environment
   boundary, and the observed protocol/error behavior.
3. Implement only the Game-owned adapter behind the existing `ReentryDeliveryPort`. The adapter may
   consume the merged SDK/Core/Connector source and the selected external Receiver Preview, but it
   must not copy, fork, or silently alter the external Receiver or Connector state machines.
4. Keep source availability, package provenance, deployment state, and end-to-end behavior as separate
   claims. A merged source tree or a successful `202` proves neither Connector claim, Agent activation,
   page action, Host effect, nor acknowledgement.
5. Keep the existing local stub evidence valid as preparation. Close CP-14 only after the Game adapter
   and the strongest available external trace are verified; record any unavailable Agent/session or
   effect boundary explicitly rather than simulating it.

## Consequences

- Current status and roadmap wording must say “merged source; runtime integration open” instead of
  “waiting for Eddy's branch handoff”.
- Historical pre-merge tasks remain useful evidence of their earlier decision point, but must carry a
  supersession note so they are not used as current branch instructions.
- The next implementation work is Game-to-Receiver adaptation and cross-runtime conformance against
  the isolated Preview. Production promotion remains a separate later gate.

## Non-goals

This decision does not change the `SK-MVP-0.2` event, identity, lease, consent, or effect contracts;
it does not promote the Preview, modify the old Production alias, or claim a live Agent/Re-entry
effect before the corresponding trace exists.
