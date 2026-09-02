# RightSpot Development Roadmap

**Role:** Big-picture implementation, validation, and closure roadmap for the RightSpot child application  
**Status:** Phase 5 is complete for the accepted local MVP, and the earlier Phase 6 post-MVP closure increment
is complete. A subsequent page-entry audit registered the bounded implementation defect `RIGHTSPOT-021`,
which entered and completed bounded implementation through dispatched `RS-WO-021-01` and independent
verification `RS-WO-021-02`. The joint review of
`RS-WO-008-01` and `RS-WO-009-01` accepted ADR-RS-0013 for the
bounded Favourite increment, deferred the PII-sensitive Information Request boundary, and registered
`RIGHTSPOT-020`; its initial serial contract/data Work Order `RS-WO-020-01` and follow-up
`RS-WO-020-01R` relation-version continuity repair are independently verified, with the repair frozen at
`adfd37e`. The disjoint tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` were dispatched,
adopted into Main at product commit `c29e80d`, passed dependency-complete typecheck, full-suite `121/121`,
production-build checks, and `RS-WO-020-04` independent verification at Main `c977ea4`. The fresh-reset
browser Verifier `RS-WO-020-05` returned `VERIFIED` against Main `f49e1ca`, closing the bounded increment.
`RS-WO-005-01` has passed corrected independent verification and is integrated at local product
commit `27f5391`; `RS-WO-007-01` is accepted as a read-only UI decomposition and `RS-WO-007-02` has
passed final independent browser verification and is integrated at product commit `89a50c7` after
two recorded procedural blocks were corrected. The tenant and agent role slices were independently
verified and integrated at product commits `5abdaf3` and `a2f6a19`; `RS-WO-007-08` passed as the
integrated cross-role regression check and `RIGHTSPOT-007` is closed. `RS-WO-011-01` passed independent
verification and is integrated at product commit `7ff0fbd`; its read-model seam remains separate from
any future consumer. `RS-WO-013-01` returned `READY_FOR_REVIEW`, its bounded authority decision is
accepted in ADR-RS-0012, and `RIGHTSPOT-013` is closed. `RS-WO-015-04` passed fresh independent
verification and the complete Operations authority is integrated at `e7f30d5`; `RIGHTSPOT-015` is
closed. Main-thread `RIGHTSPOT-017-01` reached `ASSET_GATE_READY`; `RS-WO-017-02` passed independent
verification and is integrated at `b7369bd`. `RS-WO-016-01` passed persistent re-gate, bounded repair,
fresh independent verification, and is integrated at `edd7575`; `RS-WO-017-03` passed persistent re-gate,
independent verification, and is integrated at `2a53917`, followed by the verified integrated browser
gate `RS-WO-017-04`. The earlier transient candidates and failed 016 candidate remain process evidence
only in their Task Files and named local-only archive refs; their physical Worktrees have been removed.
Exact path/hash and browser evidence are recorded in their Task Files. The earlier verifier's unrelated persistent-fixture residual (`65/66`) was resolved by
a separate test-only isolation correction and current full suites. `RIGHTSPOT-014` is closed after its
read-only proposal review. `RIGHTSPOT-018` is independently verified, integrated at `5eef037`, and
closed; `RIGHTSPOT-019` is independently verified, integrated at `6f52686`, and closed after its
bounded browser/form regression passed. Their write sets do not overlap the Operations or media lanes. The
prior out-of-scope tracked verifier mutation remains preserved in the owning Task File; its physical
verifier Worktree is no longer present.
**Owner:** Main RightSpot thread  
**As of:** 2026-09-02, Europe/London

**Physical workspace:** The canonical Main Worktree remains the only source authority. The stopped,
short-lived `RS-WO-020-02` and `RS-WO-020-03` candidate Worktrees were adopted into Main and retired after
exact-path review. Their historical snapshots remain in the owning Task File records; no candidate
Worktree is an active source or writer.

**Current gate:** None for the accepted local MVP. `RS-WO-002-13` is integrated at product commit
`3765747`, repaired `RS-WO-002-12` is integrated at `9348aa5`, `RS-WO-002-14` passed direct combined
cross-role verification, and `RS-WO-002-15` passed the isolated browser walkthrough. The closure record
is [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md). For the active post-MVP
lane, `RS-WO-007-04`/`05` have passed independent verification and are integrated, and the fresh
integrated-source Field Desk regression `RS-WO-007-08` also passed; `RIGHTSPOT-007` is closed. The
verified `RS-WO-011` seam is integrated, and the Operations authority is integrated at `e7f30d5`.
`RS-WO-016-01` is independently verified and integrated at `edd7575`; `RS-WO-017-03` is independently
verified and integrated at `2a53917`, and its integrated browser gate `RS-WO-017-04` is verified.
`RS-WO-017-02` is independently verified and integrated at `b7369bd`.
`RS-WO-018-01` is independently verified, integrated at `5eef037`, and closed. `RS-WO-019-01` is
independently verified, integrated at `6f52686`, and closed after its bounded browser/form regression passed.
Prior
verifier Worktree metadata mutations remain preserved in the owning Task File and are not product
source; their physical verifier Worktrees are no longer present.

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
- `RIGHTSPOT-002` is closed for the accepted local MVP. Post-MVP work is admitted only through
  separately bounded Task Files with accepted scope and an explicit next gate; their Work Orders
  remain in those files and this roadmap is not their live queue.
- The foundation package, runtime code, tests, and local reset/health composition now exist as an
  independently verified local baseline; no deployment configuration or Hackathon integration exists.
- The accepted local baseline is Next.js App Router, React, TypeScript, Node.js 24, and SQLite.
  Cloud Receiver, WebMCP, Redis, WebRTC media/signaling, and external services remain deferred.
- The current physical state is one Worktree: canonical Main. The stopped `RS-WO-020-02` and
  `RS-WO-020-03` UI candidates were adopted into Main and their physical Worktrees were retired after
  exact-path review; their task records remain as historical evidence.

## 3. Roadmap milestones

| Phase | Intended outcome | Entry or closure gate | State |
|---|---|---|---|
| 0. Product and Backbone baseline | Establish the rental thesis, one shared Viewing Request, role boundaries, MVP rules, and logical modular-monolith boundary | Accepted RightSpot decisions and reconciled core documents | Complete through `RIGHTSPOT-001` |
| 1. Implementation readiness | Resolve and record the foundation toolchain, runtime, SQLite/reset, health-route, source-boundary, and verification profile | Main-thread decision gate complete and the first Builder Work Order is ready; the Node.js baseline situation is explicitly recorded | Complete |
| 2. Runnable foundation | Create one local application composition with the accepted stack, server-side SQLite foundation, deterministic reset metadata, and reproducible commands | Builder output reconciled and independently verified | Complete; first Verifier attempt was procedurally blocked, corrected rerun verified |
| 3. Authoritative workflow core | Implement the Viewing Request state machine, availability lifecycle, role projections, version checks, audit facts, and explicit failures | Domain and Backbone checks pass without a browser or external service | Complete; post-repair source `6e70c9f` independently verified |
| 4. Ordinary human application loop | Deliver tenant discovery/request submission, agent queue/review/response, and tenant confirmation/decline as one coherent UI flow | Local tenant-to-agent Happy Path is reproducible from reset | Complete; `RS-WO-002-14` passed independent direct cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough against integrated source `9348aa50b63e3f4f46e77238ad370670383d9d6` |
| 5. Validation and closure | Complete focused domain checks, role/privacy and stale-state checks, browser walkthrough, evidence reconciliation, and development closure record | Main thread confirms the closure evidence and non-claims | Complete; closure record reconciled and `RIGHTSPOT-002` closed |
| 6. Post-MVP product refinement | Resolve high-impact navigation friction, strengthen visual credibility, and add a truthful Operations foundation without changing relay workflow authority | Each bounded candidate is independently verified and integrated before the next shared-surface change | Closure increment complete; `RS-WO-005-01` integrated at `27f5391`; `RIGHTSPOT-007` closed after `RS-WO-007-08` integrated regression; `RS-WO-011-01`/`02` verified and integrated at `7ff0fbd` as a server-only relay seam; `RIGHTSPOT-013` and `RIGHTSPOT-014` closed with their accepted decisions; `RIGHTSPOT-015` closed at `e7f30d5`; `RS-WO-016-01` independently verified and integrated at `edd7575`; `RS-WO-017-02` integrated at `b7369bd`; `RS-WO-017-03` independently verified and integrated at `2a53917`, with `RS-WO-017-04` browser verification complete; `RS-WO-018-01` integrated and closed at `5eef037`; and `RS-WO-019-01` integrated and closed at `6f52686` after browser/form regression |
| 7. Optional Hackathon integration | Add only the separately selected page capability, continuation adapter, Cloud Receiver boundary, deployment, or judge evidence that the ordinary app proves necessary | Ordinary refinement is stable and a new explicit integration decision exists | Deferred; not scheduled |

### 3.1 Current next route

The accepted local MVP and the bounded `RIGHTSPOT-020` Favourite/listing-interest increment are complete.
The page-entry audit registered `RIGHTSPOT-021` as a bounded implementation route: restore a
persistent tenant navigation entry to the existing `/tenant/requests` dashboard. `RS-WO-021-01`
returned `READY_FOR_VERIFICATION` after changing only its declared two product paths, and independent
`RS-WO-021-02` returned `VERIFIED` against the frozen serialized canonical Main Worktree source. The
bounded parent gate is closed for its declared acceptance matrix. A subsequent Main-thread browser
audit found a `P2` residual at `320–342px`, where the third tenant navigation link is initially
clipped until the links container is scrolled. Main selected the existing `320px` support floor and
registered `RIGHTSPOT-022` as a separate CSS-only responsive repair. `RS-WO-022-01` returned
`READY_FOR_VERIFICATION` in persistent supporting task `01a0602e-e947-7231-bf6f-37ed685681e2`; Main
froze the exact CSS candidate at local product commit `f0dbd99`, and assigned independent
`RS-WO-022-02` verification to persistent supporting task `01a06039-6eea-7033-aaf8-ae34c69aebe7`.
No implementation Worktree is open.
The independent static verification `RS-WO-020-04` and fresh-reset browser verification `RS-WO-020-05`
are reconciled in the owning Task File; the `RS-WO-021-01` implementation and `RS-WO-021-02`
independent verification gates are closed:

1. Kept the reviewed documentation/procedure baseline and unrelated collaborator changes separate.
2. Implemented only the accepted bounded Favourite direction through `RIGHTSPOT-020`; the
   `RS-WO-020-01R` relation-version continuity repair is independently verified before UI consumption.
3. Dispatched tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` in parallel with their
   declared disjoint paths; adopt both candidates into Main and serialize shared navigation, listing-card/
   detail integration, and global CSS.
4. Froze the integrated product source at `c29e80d`; `RS-WO-020-04` independently verified Main `c977ea4`,
   and the two temporary UI Worktrees were retired after Main adoption at the first safe checkpoint-scoped
   opportunity.
5. Reconcile the bounded `RS-WO-020-05` fresh-reset browser evidence against frozen Main `f49e1ca`; it
   passed and closed `RIGHTSPOT-020`. Do not infer deployment, production, or external-integration claims
   from this local browser gate.
6. Keep the reviewed `RIGHTSPOT-009` Information Request proposal deferred until contact/PII authority,
   retention, erasure, and agent-access decisions are accepted; it must not enter `RIGHTSPOT-020`.
7. Keep `RIGHTSPOT-006` outside the implementation lane until the explicit external credential and
   local-origin gate is authorized. It is a separate high-risk lane and must not block ordinary product
   progress.
8. Review `RIGHTSPOT-010` later, after its proposal is dispositioned and the product value of an
   Operations or WebMCP surface is explicitly selected. Its proposal does not authorize WebMCP or
   dashboard implementation.
9. Keep `RIGHTSPOT-012` as a non-blocking, read-only audit lane. It may identify follow-on work but
   does not itself constitute a product implementation milestone.

Only an explicitly selected, implementation-ready Task opens a new code Work Order or temporary
Worktree. Each accepted output is integrated into Main and its physical Worktree is retired at the
first safe checkpoint-scoped opportunity under the orchestration Runbook. `RIGHTSPOT-021` is closed
for its bounded repair and verification. Main selected the existing `320px` floor and registered
in-progress `RIGHTSPOT-022`; its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION` and Main
froze the exact CSS candidate at product commit `f0dbd99`. Independent `RS-WO-022-02` verification is
assigned to persistent supporting task `01a06039-6eea-7033-aaf8-ae34c69aebe7`; no implementation
Worktree is open. `RIGHTSPOT-006`, `RIGHTSPOT-010`, and
`RIGHTSPOT-012` remain separate credential, decision, or read-only audit gates and do not reopen
`RIGHTSPOT-020`. Local Git closure for the prior `RIGHTSPOT-021` increment is recorded at `66615d0`.

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

The previously admitted post-MVP increments, including `RIGHTSPOT-005` and `RIGHTSPOT-007`, are
closed historical work rather than the current implementation queue. The current next route is the
decision-first sequence in [Section 3.1](#31-current-next-route). It does not reopen the accepted
MVP closure or authorize external authentication, WebMCP, Cloud Receiver, deployment, or
commercial-marketplace scope by itself.

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
