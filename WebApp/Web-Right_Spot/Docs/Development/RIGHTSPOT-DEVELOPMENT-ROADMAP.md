# RightSpot Development Roadmap

**Role:** Big-picture implementation, validation, and closure roadmap for the RightSpot child application  
**Status:** Phase 5 is complete for the accepted local MVP. Phase 6 post-MVP refinement is active:
`RS-WO-005-01` has passed corrected independent verification and is integrated at local product
commit `27f5391`; `RS-WO-007-01` is accepted as a read-only UI decomposition and `RS-WO-007-02` has
passed final independent browser verification and is integrated at product commit `89a50c7` after
two recorded procedural blocks were corrected. The tenant and agent role slices were independently
verified and integrated at product commits `5abdaf3` and `a2f6a19`; `RS-WO-007-08` is assigned as the
integrated cross-role regression check. `RS-WO-011-01` is concurrently implementing the accepted bounded
Operations read-model seam in an isolated Worktree. The prior out-of-scope tracked verifier mutation
remains preserved.
**Owner:** Main RightSpot thread  
**As of:** 2026-09-01, Europe/London

**Current gate:** None for the accepted local MVP. `RS-WO-002-13` is integrated at product commit
`3765747`, repaired `RS-WO-002-12` is integrated at `9348aa5`, `RS-WO-002-14` passed direct combined
cross-role verification, and `RS-WO-002-15` passed the isolated browser walkthrough. The closure record
is [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md). For the active post-MVP
lane, `RS-WO-007-04`/`05` have passed independent verification and are integrated; only the fresh
integrated-source Field Desk regression gate remains. Prior verifier Worktree metadata mutations
remain preserved and are not product source.

## 1. Roadmap purpose and authority

This document carries the RightSpot development roadmap: the major phases, milestone outcomes,
entry gates, and explicit deferrals needed to move the ordinary application from accepted design
to a verified demonstration host.

It does not own product behavior, durable architecture decisions, task lifecycle, or runtime truth.
Those remain with the RightSpot product/domain documents, ADRs, `Docs/Tasks/`, current code/tests,
and runtime evidence respectively. The RightSpot Thread Orchestration Pilot Runbook defines how a
bounded increment may be delegated; it is not a roadmap or active-task register.

## 2. Current baseline

- The rental-only product thesis, primary tenant-to-agent workflow, business rules, logical
  Backbone, and implementation stack are accepted working baselines.
- `RIGHTSPOT-001` established the product thesis and Backbone boundary and is closed.
- `RIGHTSPOT-002` is closed for the accepted local MVP. Post-MVP work is admitted only through the
  separately bounded `RIGHTSPOT-005`, `RIGHTSPOT-007`, and accepted `RIGHTSPOT-011` Task Files; their Work Orders remain in
  those files and this roadmap is not their live queue.
- The foundation package, runtime code, tests, and local reset/health composition now exist as an
  independently verified local baseline; no deployment configuration or Hackathon integration exists.
- The accepted local baseline is Next.js App Router, React, TypeScript, Node.js 24, and SQLite.
  Cloud Receiver, WebMCP, Redis, WebRTC media/signaling, and external services remain deferred.

## 3. Roadmap milestones

| Phase | Intended outcome | Entry or closure gate | State |
|---|---|---|---|
| 0. Product and Backbone baseline | Establish the rental thesis, one shared Viewing Request, role boundaries, MVP rules, and logical modular-monolith boundary | Accepted RightSpot decisions and reconciled core documents | Complete through `RIGHTSPOT-001` |
| 1. Implementation readiness | Resolve and record the foundation toolchain, runtime, SQLite/reset, health-route, source-boundary, and verification profile | Main-thread decision gate complete and the first Builder Work Order is ready; the Node.js baseline situation is explicitly recorded | Complete |
| 2. Runnable foundation | Create one local application composition with the accepted stack, server-side SQLite foundation, deterministic reset metadata, and reproducible commands | Builder output reconciled and independently verified | Complete; first Verifier attempt was procedurally blocked, corrected rerun verified |
| 3. Authoritative workflow core | Implement the Viewing Request state machine, availability lifecycle, role projections, version checks, audit facts, and explicit failures | Domain and Backbone checks pass without a browser or external service | Complete; post-repair source `6e70c9f` independently verified |
| 4. Ordinary human application loop | Deliver tenant discovery/request submission, agent queue/review/response, and tenant confirmation/decline as one coherent UI flow | Local tenant-to-agent Happy Path is reproducible from reset | Complete; `RS-WO-002-14` passed independent direct cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough against integrated source `9348aa50b63e3f4f46e77238ad370670383d9d6` |
| 5. Validation and closure | Complete focused domain checks, role/privacy and stale-state checks, browser walkthrough, evidence reconciliation, and development closure record | Main thread confirms the closure evidence and non-claims | Complete; closure record reconciled and `RIGHTSPOT-002` closed |
| 6. Post-MVP product refinement | Resolve high-impact navigation friction and implement the accepted Field Desk visual foundation without changing workflow authority | Each bounded candidate is independently verified and integrated before the next shared-surface change | Active; `RS-WO-005-01` integrated at `27f5391`; `RS-WO-007-02` verified/integrated at `89a50c7`, tenant and agent slices independently verified/integrated at `5abdaf3`/`a2f6a19`; `RS-WO-007-08` is assigned for integrated regression; `RS-WO-011-01` is an isolated Operations read-model seam |
| 7. Optional Hackathon integration | Add only the separately selected page capability, continuation adapter, Cloud Receiver boundary, deployment, or judge evidence that the ordinary app proves necessary | Ordinary refinement is stable and a new explicit integration decision exists | Deferred; not scheduled |

## 4. Roadmap operating rules

- The roadmap stays at milestone level. It must not become a catalogue of every future click,
  implementation file, or child-thread message.
- Register only the next actionable parent Task when its boundary and gate are known. Do not create
  placeholder parent tasks for all later roadmap phases.
- Put the lifecycle, current increment, dependency, next gate, and any active Work Orders in the
  owning Task File. A Work Order is an execution brief under that parent, not a second project
  lifecycle; Builder, Verifier, Repairer, and Integrator are sequential checkpoints of the same
  bounded outcome. Multiple active Work Orders are allowed only across explicit independent
  dependency chains with disjoint ownership; the roadmap must not become their live queue.
- Create a separate Development record only when a material implementation, verification, or
  closure increment needs durable evidence/history beyond the Task File; never use it as a second
  live task queue.
- Keep the main thread as the authority for scope, architecture, canonical writeback, integration,
  and closure. A roadmap milestone is a target, not evidence that its implementation has started.

## 5. Current closure

There is no active implementation gate for the accepted local MVP. `RS-WO-002-14` passed direct
combined cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough from a
fresh database against integrated source `9348aa50b63e3f4f46e77238ad370670383d9d6`. The durable
evidence is recorded in [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md), and
`RIGHTSPOT-002` is closed. Future work requires a new explicit scope decision.

The current post-MVP scope is now explicitly admitted: `RIGHTSPOT-005` addresses verified
role-aware post-login navigation, and `RIGHTSPOT-007` implements the accepted Field Desk direction
starting with a shared CSS foundation. These increments do not reopen the accepted MVP closure or
authorize external authentication, WebMCP, Cloud Receiver, deployment, or commercial-marketplace
scope.

### Historical execution chronology

The first `RS-WO-002-02` attempt is recorded as a procedural block, and the corrected output-boundary
rerun is independently verified against the unchanged source/runtime identity. The verified
foundation is committed as `b06bd85`; `RS-WO-002-03` Builder and a bounded projection-isolation
repair returned `READY_FOR_VERIFICATION`, and the T2 source is frozen at `a60001e`. Its independent
Verifier found a bounded listing-version guard defect; the Repairer corrected it in `6e70c9f` within the
domain workflow and focused domain test paths. Fresh independent verification returned `VERIFIED` against
post-repair source `6e70c9f`. `RS-WO-002-04` now defines the bounded persistence/application integration
checkpoint; the main thread reconstructed and adopted its exact three-path candidate at T2 source
`68bbc69`. Its first dedicated independent Verifier attempt stopped before source checks because the
dispatch prompt described the Worktree root incorrectly; one corrected follow-up to the same
identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` is
independently verified at T2 code commit `de169ce` from canonical snapshot `bc3bc42`. The read-only
`RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`; the main thread accepted its
decomposition with revisions and froze the ordinary workflow HTTP/DTO contract in ADR-RS-0008. The
direct `RS-WO-002-14` combined cross-role verification passed; at that historical checkpoint the
remaining gate was the isolated browser walkthrough and closure-evidence review. Repaired tenant candidate
`52cba87c` is integrated at product commit `9348aa5`, and the agent role-page candidate `169cb95d` is
integrated at product commit `3765747`. Both use the integrated workflow transport `f700ba9`, shared
shell `006d2fd`, and shared role frame `6a0b4b8`. `RS-WO-002-08` reached product
integration after a generated-output boundary incident was re-baselined in process commit `8b77bdd`;
`RS-WO-002-09` UI/UX review is integrated as guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW`
and its role-page split is accepted; `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`, candidate
`f1f83c7` passed dedicated verification and is integrated at `6a0b4b8`. `RS-WO-002-13` passed dedicated
verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final
independent verification and is integrated at `9348aa5`. `RS-WO-002-14` now validates the combined
tenant and agent path. The tenant and agent pages must retain disjoint
route/component/test ownership, consume the existing HTTP/DTO boundary, and remain separately
verifiable before their outputs are coupled. The integrated shell and transport do not authorize
opening the full API/UI surface as one assignment. The user-authorized Side Chat process lane is not
product-source drift. Do not turn the full parent Task into one worker assignment or pre-create
downstream role assignments.
