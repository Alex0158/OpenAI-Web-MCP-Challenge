# RightSpot Development Roadmap

**Role:** Big-picture implementation, validation, and closure roadmap for the RightSpot child application  
**Status:** Phase 3 complete — authoritative workflow domain core independently verified; the Phase 4 persistence/application boundary is independently verified against frozen source `28105e4d`; `RS-WO-002-05` discovery API candidate is frozen at T2 code commit `de169ce` pending independent verification; the ordinary human application loop is not started
**Owner:** Main RightSpot thread  
**As of:** 2026-09-01, Europe/London

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
- `RIGHTSPOT-002` is the single pending parent implementation task. Its current Work Order is
  recorded inside that Task File; it is not split into a collection of future parent tasks.
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
| 4. Ordinary human application loop | Deliver tenant discovery/request submission, agent queue/review/response, and tenant confirmation/decline as one coherent UI flow | Local tenant-to-agent Happy Path is reproducible from reset | `RS-WO-002-04` persistence/application boundary independently verified at T2 source `28105e4d` (candidate `68bbc69`); `RS-WO-002-05` tenant entry/listing discovery API Builder delivered and frozen at T2 code commit `de169ce`, verification pending; `RS-WO-002-06` Architecture Advisor gated; UI not started |
| 5. Validation and closure | Complete focused domain checks, role/privacy and stale-state checks, browser walkthrough, evidence reconciliation, and development closure record | Main thread confirms the closure evidence and non-claims | Not started |
| 6. Optional Hackathon integration | Add only the separately selected page capability, continuation adapter, Cloud Receiver boundary, deployment, or judge evidence that the ordinary app proves necessary | Ordinary loop is stable and a new explicit integration decision exists | Deferred; not scheduled |

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

## 5. Current next gate

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
identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. The next gate is the
assigned `RS-WO-002-05` tenant entry and listing discovery API slice; its candidate is frozen at T2 code
commit `de169ce` and is awaiting independent verification. The read-only `RS-WO-002-06`
Architecture Advisor may run in parallel to propose bounded tenant/agent interface slices, but the
main thread must review and record exact ownership and contract boundaries before opening any UI
Builder. This does not authorize opening the full API/UI surface as one assignment. The
user-authorized Side Chat process lane is not product-source drift.
Do not turn the full parent Task into one worker assignment or pre-create downstream role assignments.
