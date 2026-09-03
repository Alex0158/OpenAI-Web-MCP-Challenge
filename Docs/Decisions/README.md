# Decision Register

**Role:** DECISION index  
**Status:** Accepted decisions current through ADR-0046; ADR-0034 remains pending approval
**Last updated:** 2026-09-03

This directory records accepted durable choices and their consequences. A decision record owns
only the surface named in that record. Current implementation and evidence state remain owned by
`Docs/Core/00-current-status.md`, `Docs/Core/05-validation-and-evidence.md`, current code, tests,
and runtime evidence.

## Current decisions

ADR-0046 controls selected-product existing-task notification behavior. The retained effect-backed
profiles in ADR-0009/0038/0043/0045 remain normative for their unchanged code and compatibility tests;
their product-completion requirement and ADR-0043's fresh-session sufficiency are superseded.
ADR-0026 remains a separately labelled preview, not the selected product route.

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
| [ADR-0016](ADR-0016-adopt-unified-task-authority.md) | Accepted | Adopt one unified lifecycle authority for pending work, problems, defects, and investigations |
| [ADR-0017](ADR-0017-adopt-project-engineering-governance-baseline.md) | Accepted | Adopt the project-wide engineering authority, native enforcement baseline, Node 24 closure runtime, and always-run CI |
| [ADR-0018](ADR-0018-adopt-collaborative-source-of-truth-and-change-gates.md) | Accepted | Adopt collaborative authority checks, canonical writeback, and Git synchronization gates |
| [ADR-0019](ADR-0019-establish-stage-one-cloud-receiver-shell.md) | Historical; runtime superseded by ADR-0032 | Establish the loopback-only Stage 1 Cloud Receiver process shell and operational boundary |
| [ADR-0020](ADR-0020-adopt-browser-assisted-connector-pairing.md) | Historical; Receiver portion superseded by ADR-0032 | Adopt browser-assisted Connector pairing and explicit Host-user mapping for the local preview |
| [ADR-0021](ADR-0021-adopt-local-host-key-registration-event-preview.md) | Historical; runtime superseded by ADR-0032 | Adopt local Host-key registration and signed event-ingress proof for the Re-entry preview |
| [ADR-0022](ADR-0022-adopt-local-consent-session-preview.md) | Historical; Receiver portion superseded by ADR-0032 | Adopt the local consent-session HTTP and Host SDK preview |
| [ADR-0023](ADR-0023-adopt-application-review-sample-host.md) | Accepted | Adopt a bounded application-review sample Host without selecting the final product |
| [ADR-0024](ADR-0024-adopt-email-password-preview-auth.md) | Historical; console superseded by ADR-0032 | Use email and password for the local Re-entry console preview |
| [ADR-0025](ADR-0025-adopt-local-codex-queue-adapter-preview.md) | Superseded for invocation choice | Historical Codex queue adapter preview |
| [ADR-0026](ADR-0026-start-fresh-local-codex-session-preview.md) | Accepted local preview | Start a fresh Codex session with validated continuation context |
| [ADR-0027](ADR-0027-adopt-macos-codex-discovery-and-connector-readiness.md) | Accepted local preview | Discover Codex and preflight the Local Connector on macOS |
| [ADR-0028](ADR-0028-adopt-account-first-connector-authorization.md) | Historical; Receiver implementation superseded by ADR-0032; enrollment also superseded by ADR-0030 | Authorize Connector devices from a Re-entry account and move consent to a Re-entry-owned surface |
| [ADR-0029](ADR-0029-adopt-supabase-prisma-runtime-persistence.md) | Historical; hosted runtime superseded by ADR-0032 | Use Supabase PostgreSQL and Prisma to persist hosted runtime state |
| [ADR-0030](ADR-0030-adopt-dashboard-issued-connector-pairing-code.md) | Historical; Receiver implementation superseded by ADR-0032 | Let the signed-in Re-entry dashboard create the one-time Connector pairing code |
| [ADR-0031](ADR-0031-adopt-native-relational-cloud-schema.md) | Historical; hosted runtime superseded by ADR-0032 | Replace opaque runtime snapshots with a native relational Cloud Receiver schema |
| [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md) | Accepted | Retire the current Cloud Receiver runtime and hosted preview; preserve reusable Core and integration contracts |
| [ADR-0033](ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md) | Accepted for pairing increment only | Adopt the replacement `saas-boilerplate/` base and authorize only the Cloud Receiver v2 pairing red-test gate |
| [ADR-0035](ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md) | Accepted for Feature 2 only | Add Consent, Target, Grant status, and the private configured-authority revocation fence; public Grant routes and Event work remain gated |
| [ADR-0036](ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md) | Accepted for Feature 3 only | Add signed Host Event ingress and atomic pending-delivery creation; Delivery Claim, Acknowledgement, public Grant routes, and deployment remain gated |
| [ADR-0037](ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md) | Accepted for Feature 4 only | Add bounded target-scoped Delivery Claim and lease behavior; exhaustion remains the same empty `204` as no work; Acknowledgement and protocol changes remain gated |
| [ADR-0038](ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md) | Accepted for Feature 5 local v2 implementation only | Add effect-backed Delivery Acknowledgement with injected Host-effect authority and durable replay |
| [ADR-0039](ADR-0039-adopt-cloud-receiver-v2-transport-operations.md) | Accepted for Feature 6 local v2 implementation only | Harden v2 HTTP bounds, errors, health, readiness, and redacted operations without changing protocol routes |
| [ADR-0040](ADR-0040-adopt-connector-self-disconnection.md) | Accepted for active v2 and Local Connector | Add replay-safe Connector self-disconnection, remote-first local cleanup, and a disconnected dashboard projection |
| [ADR-0041](ADR-0041-adopt-simple-consented-continuation-facade.md) | Accepted | Add a simple server-only SDK facade, consented instruction delivery, and the minimum developer self-service control plane |
| [ADR-0042](ADR-0042-select-sleepless-kingdom-host-application.md) | Accepted | Select Sleepless Kingdom as the first Host application and challenge-demo carrier while preserving the external continuation and evidence gates |
| [ADR-0043](ADR-0043-adopt-standing-authorization-v0.2.md) | Accepted | Add a versioned non-consumable standing Grant with ordered repeatable signals, one-active backpressure, and explicit revocation |
| [ADR-0044](ADR-0044-allow-conforming-receiver-implementations.md) | Accepted | Keep one normative Receiver authority model while permitting independently implemented Receivers only behind pinned black-box conformance and exact-source release gates |
| [ADR-0045](ADR-0045-adopt-standing-transport-profile-v0.2.md) | Accepted | Add explicit v0.2 Host, HTTP, Connector, and Agent Adapter dispatch without changing or downgrading v0.1 |
| [ADR-0046](ADR-0046-restore-bound-task-notification-continuation.md) | Accepted product target; implementation/transition open | Restore existing-task continuity and notification-only settlement; preserve exact retained effect-backed profiles until explicit transition |

## Pending approval

| ID | Status | Decision surface |
|---|---|---|
| [ADR-0034](ADR-0034-propose-organization-grant-control-amendment.md) | Proposed — approval required | Decide whether ADR-0013 should authorize organization-level public Grant inspection/revocation or keep that surface outside the accepted v2 authority |

## Decision rules

Create a new ADR before changing the core mechanism, authority model, process topology, reference
freeze, application selection, or project-wide engineering or collaboration control. An ADR does
not prove implementation, deployment, or runtime behavior. Supersede an earlier decision explicitly;
do not silently rewrite its historical context.

ADR-0042 is the accepted application-selection decision. A future application change requires a new
ADR that explicitly supersedes it; supporting scenarios or research recommendations never become
product truth by location alone.
