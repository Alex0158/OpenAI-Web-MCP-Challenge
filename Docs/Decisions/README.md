# Decision Register

**Role:** DECISION index  
**Status:** Current through ADR-0015  
**Last updated:** 2026-08-31

This directory records accepted durable choices and their consequences. A decision record owns
only the surface named in that record. Current implementation and evidence state remain owned by
`Docs/Core/00-current-status.md`, `Docs/Core/05-validation-and-evidence.md`, current code, tests,
and runtime evidence.

## Current decisions

| ID | Status | Decision surface |
|---|---|---|
| [ADR-0001](ADR-0001-select-tenderrelay.md) | Superseded by ADR-0002 | Historical TenderRelay selection |
| [ADR-0002](ADR-0002-separate-mechanism-from-demo-app.md) | Accepted | Separate the selected mechanism from the unselected Host application |
| [ADR-0003](ADR-0003-freeze-p0-technical-validation-mvp.md) | Accepted | Freeze the P0 technical-validation contract |
| [ADR-0004](ADR-0004-separate-event-protocol-from-agent-transport.md) | Partially superseded by ADR-0006 and ADR-0007 | Separate the event protocol from Agent transport |
| [ADR-0005](ADR-0005-run-additive-durable-enrollment-spike.md) | Accepted | Authorize the additive durable-enrollment service-contract spike |
| [ADR-0006](ADR-0006-establish-reentry-core-development-baseline.md) | Accepted | Establish Re-entry Core, freeze MVP references, and select the Receiver/Connector topology |
| [ADR-0007](ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md) | Accepted | Freeze the v0.1 protocol and Host SDK kernel |
| [ADR-0008](ADR-0008-freeze-receiver-authority-and-durable-reservation.md) | Accepted | Freeze Receiver authority and durable reservation |
| [ADR-0009](ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md) | Accepted | Freeze Connector lease and effect acknowledgement |
| [ADR-0010](ADR-0010-freeze-receiver-http-and-connector-transport.md) | Accepted | Freeze Receiver HTTP and outbound Connector transport |
| [ADR-0011](ADR-0011-freeze-agent-adapter-activation-boundary.md) | Accepted | Freeze the Agent Adapter activation boundary |
| [ADR-0012](ADR-0012-freeze-domain-neutral-conformance-profile.md) | Accepted | Freeze the domain-neutral conformance profile |
| [ADR-0013](ADR-0013-freeze-receiver-grant-control-and-revocation.md) | Accepted | Freeze Receiver Grant inspection, revocation, and race semantics |
| [ADR-0014](ADR-0014-freeze-private-managed-context-binding-resolution.md) | Accepted | Freeze private managed-context binding resolution |
| [ADR-0015](ADR-0015-adopt-modular-mechanism-documentation.md) | Accepted | Adopt modular mechanism documentation and canonical content-density rules |

## Decision rules

Create a new ADR before changing the core mechanism, authority model, process topology, reference
freeze, or application selection. An ADR does not prove implementation, deployment, or runtime
behavior. Supersede an earlier decision explicitly; do not silently rewrite its historical
context.

The next application-selection decision should use a new ADR. It must specialize the
application-neutral Core without promoting a supporting scenario or research recommendation into
product truth by location alone.
