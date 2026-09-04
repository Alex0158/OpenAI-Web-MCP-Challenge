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

## Package and protocol readback

The 2026-09-04 package readback resolves an otherwise ambiguous term in this decision:

- The public registry package `@4xeoz/re-entry-sdk` currently resolves `latest` to `0.3.2` at
  GitHub `gitHead=928debcbe6ed8fda9d165ac17318fd30a57f0361`. Its public server exports are
  `createHostSdk`, `createReentry`, and the v0.1 control/event surface; it has no standing-v0.2
  server export.
- The merged checkout at [`runtime/host-sdk`](../../../../runtime/host-sdk/package.json) currently
  identifies as `0.3.1` and exposes the same v0.1 Host SDK entrypoints. Its source is the exact
  Game-facing baseline, but its package version does not by itself prove registry equivalence.
- The private [`reentry-core`](../../../../reentry-core/package.json) checkout exports
  `StandingReentryHostSdk` as a reference signer, while the active Receiver exposes v0.2 Event,
  claim, and acknowledgement routes. Receiver-owned standing Consent enrollment is not a public
  route yet.

Therefore the Game adapter must pin an exact reviewed Host SDK artifact when it enters code. It may
use the Core standing reference for contract evidence, but it must not silently direct-import that
reference or treat the registry `latest` package as standing-capable. A versioned standing-capable
Host SDK release plus the Receiver's accepted enrollment contract remains the CP-14 implementation
gate. The NPM package is a discoverable release surface, not proof that the recurring v0.2 path is
available.

The executed package/provenance readback and its claim limits are recorded in
[`SK-EVID-075`](../Evidence/SK-EVID-075-cp14-host-sdk-package-provenance-readback.md) and
[`Validation/101`](../Validation/101-cp14-host-sdk-package-provenance-readback.md).

The selected Receiver candidate's exact ref and Core source-pin readback are recorded in
[`SK-EVID-076`](../Evidence/SK-EVID-076-cp14-receiver-standing-source-pin-readback.md) and
[`Validation/102`](../Validation/102-cp14-receiver-standing-source-pin-readback.md). This closes
source-integrity evidence only; it does not designate a production handoff or close the SDK,
enrollment, or Game-adapter gate.

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

## Current owner amendment — 2026-09-04

For the current hackathon increment, [ADR-GAME-0040](ADR-GAME-0040-cp14-owner-authorized-cross-stack-implementation.md)
and outer [TASK-036](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md)
supersede only the implementation-ownership part of Decision 3: the current project team may
implement the exact shared Core, Host SDK, Local Connector, and Receiver changes at the outer
repository boundary. The Game child still owns only its adapter and Game-side persistence, and the
Receiver remains a separate repository/deployment boundary. All source, protocol, runtime, and
hosted-readback gates in this decision remain in force.
