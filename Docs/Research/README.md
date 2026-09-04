# Research Index

**Role:** SUPPORTING research and bounded evidence index  
**Status:** Current tracked index through Research 27  
**Last updated:** 2026-09-03

Research can change a decision or verification plan, but it does not control current product truth
or select an application. Accepted durable choices belong in `Docs/Decisions/`; current status and
proof claims belong in `Docs/Core/00-current-status.md` and
`Docs/Core/05-validation-and-evidence.md`.

## Platform, continuation, and runtime evidence

- [Research 01](01-agent-continuation-adapter-audit.md): exact-context continuation and adapter boundary.
- [Research 02](02-p0-runtime-probe-log.md): P0 component and runtime probe log.
- [Research 03](03-site-tools-runtime-availability-audit.md): Site Tool availability and client prerequisites.
- [Research 04](04-platform-bridge-decision.md): private controlled bridge and public-contract boundary.
- [Research 07](07-supported-reentry-transport-and-heartbeat-spike.md): supported transport and scheduled re-entry evidence.
- [Research 09](09-heartbeat-business-viability-and-bounded-use.md): scheduled-pull runtime and economics boundary.
- [Research 11](11-platform-durability-and-cold-start-audit.md): platform durability and cold-start protocol.
- [Research 14](14-clean-context-webmcp-portability-smoke.md): same-environment clean-context WebMCP evidence.
- [Research 15](15-sol-terra-webmcp-model-variation-smoke.md): bounded model-variation smoke.
- [Research 16](16-scheduled-pull-unit-economics-and-transport-kill-model.md): transport economics and kill model.
- [Research 18](18-receiver-queue-and-wake-adapter-architecture-review.md): Receiver queue and wake-adapter architecture.
- [Research 19](19-app-server-desktop-browser-join-verdict.md): failed standalone App Server/Desktop Browser joins.
- [Research 20](20-workspace-agents-trigger-and-webmcp-boundary.md): Workspace Agent trigger and WebMCP boundary.

## Product value, topology, and integration

- [Research 05](05-distributed-topology-and-hard-coupling-risk-review.md): distributed topology and coupling risks.
- [Research 06](06-continuity-value-and-alternative-kill-tests.md): continuity value and alternative controls.
- [Research 08](08-review-05-adjudication-and-p1-trust-delivery-plan.md): adjudication of Research 05 and trust/delivery gates.
- [Research 10](10-post-h1-unknowns-and-validation-roadmap.md): post-H1 unknowns and validation roadmap.
- [Research 12](12-product-value-kill-test-preregistration.md): product-value kill-test preregistration.
- [Research 13](13-exact-task-vs-capsule-method-calibration.md): exact-task versus bounded-capsule calibration.
- [Research 17](17-mvp1-mvp2-comparative-integration-review.md): MVP1/MVP2 comparative integration review.
- [Research 21](21-cloud-receiver-local-connector-candidate-topology.md): Cloud Receiver and outbound Local Connector precursor analysis.
- [Research 22](22-mvp2-selective-integration-provenance.md): MVP2 selective-reuse provenance.
- [Research 23](23-three-candidate-competition-app-selection-review.md): historical preserved
  comparison of the original three application candidates; its earlier ranking is superseded by
  the current Sleepless Kingdom and Rental Marketplace Relay shortlist.
- [Research 24](24-cloud-receiver-2-saas-boilerplate-study.md): static review of the cloned SaaS
  boilerplate and the open Cloud Receiver 2 adaptation boundary.
- [Research 25](25-until-revoked-standing-lifetime-proposal.md): proposed explicit no-scheduled-expiry
  authority, clock separation, version/storage alternatives, invalidation and implementation gates;
  not an accepted contract.
- [Research 26](26-pairing-claim-abuse-fence-proposal.md): proposed pairing identity, durable
  per-pair/source abuse controls, terminal failure, replay, concurrency, and rollout boundary;
  not an accepted contract.
- [Research 27](27-notification-handoff-profile-proposal.md): proposed additive notification-handoff
  profile, trusted private task inbox, exact receipt/replay semantics, and cross-module acceptance
  matrix; not an accepted contract.

## Maintenance rules

1. Give each new research record an explicit status and claim boundary.
2. Add it to this index only when it is tracked and reviewable.
3. Record conflicts rather than silently reconciling them into current truth.
4. Promote a durable choice only through an accepted ADR and update the owning Core surface.
5. Move reproducible experiment artifacts to `Experiments/` or the owning evidence location; do
   not turn this directory into a mutable runtime log store.
