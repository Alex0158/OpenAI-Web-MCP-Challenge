# RightSpot — Current Status

**Role:** Canonical current status for the RightSpot child application  
**As of:** 2026-09-01, Europe/London  
**Stage:** MVP scope, business-rules, Backbone, and implementation-stack baseline; runnable foundation,
workflow-core, the `RS-WO-002-04` persistence/application boundary, the `RS-WO-002-05` tenant
entry/listing discovery API, and the `RS-WO-002-07` workflow HTTP/DTO boundary independently verified;
`RS-WO-002-06` Architecture Advisor reviewed and incorporated with revisions; ADR-RS-0008 accepted;
`RS-WO-002-08` shared shell is integrated at product commit `006d2fd` after process re-baseline commit
`8b77bdd`; `RS-WO-002-09` UI/UX review is integrated as bounded guidance; `RS-WO-002-10` Architecture
Advisor decomposition is accepted; `RS-WO-002-11` candidate `f1f83c7` passed independent verification
and is integrated at product commit `6a0b4b8`; `RS-WO-002-13` agent role-page candidate passed
independent verification and is integrated at product commit `3765747`; `RS-WO-002-12` tenant role-page
verification is checkpoint-locally blocked by an out-of-scope tracked verifier Worktree mutation
**Working product:** RightSpot — rental workflow / Rental Marketplace Relay
**Current active Work Order:** `RS-WO-002-12` tenant discovery/request candidate remains frozen at
`eb1d62e1b33a045e683f64ba3d28930e9444cd25`; its first verifier run was checkpoint-locally blocked
by a tracked `.gitignore` mutation adding `.gstack/` outside the exact nine-path candidate, and the
same verifier identity is now rerunning from a clean Worktree while the original evidence is preserved.
The
`RS-WO-002-13` agent candidate was independently verified and integrated at product commit `3765747`.
Exact Worktrees and supporting-task identities remain recorded in the parent Task File.
**Implementation:** Foundation Builder returned `READY_FOR_VERIFICATION`; the first `RS-WO-002-02` verification attempt was procedurally blocked by an out-of-scope OS temp artifact, then the corrected bounded rerun returned `VERIFIED` against the unchanged source/runtime identity; `RS-WO-002-03` found and repaired a listing-version guard defect in commit `6e70c9f`, and fresh independent verification returned `VERIFIED` against that frozen source; `RS-WO-002-04` candidate adoption completed at T2 commit `68bbc69`; its first dedicated Verifier attempt stopped before source checks because the dispatch prompt described the Worktree root incorrectly, then one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`; `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION` with the required runtime, focused `35/35` checks, production build, and local API smoke passing; the candidate was integrated at T2 code commit `de169ce`, and a dedicated Verifier independently returned `VERIFIED` against clean snapshot `bc3bc42`; the read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`, and the main thread accepted its decomposition with revisions in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification with foundation `6/6`, focused `9/9`, full direct `50/50`, build, HTTP, role/privacy, conflict, and no-mutation evidence and was integrated at product commit `f700ba9`; `RS-WO-002-08` is integrated at product commit `006d2fd` after a localized generated-output boundary incident was re-baselined in process commit `8b77bdd`; both originate from reviewed baseline `c758634`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`, its exact four-path candidate passed dedicated independent verification, and the main thread integrated it at product commit `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are the next disjoint role-page Builder slices

**Latest role-page disposition:** `RS-WO-002-13` passed independent verification and was integrated
at product commit `3765747`. `RS-WO-002-12` remains frozen and unintegrated while its same-identity
verifier recovery rerun uses a clean Worktree; the original tracked `.gitignore` mutation adding
`.gstack/` outside the declared nine-path scope remains preserved for separate ownership handling.
The parent remains `in_progress`.

## 1. Executive status

RightSpot is the first working application target for this main thread. The existing outer
candidate material is sufficient to establish a product hypothesis, a primary workflow, initial
role boundaries, and a draft Backbone. It is not sufficient to claim that the final application
has been formally selected, validated, implemented, or integrated with the outer Re-entry Core.

The current task is to turn the candidate into a coherent ordinary web application while keeping
its product truth and architecture inside this folder. The first product slice is the one-sided
tenant-to-agent relay. The reciprocal agent-to-tenant leg remains optional.

The latest brainstorm establishes the intended application baseline: a stable but deliberately
bounded rental Web app that can later host the Hackathon integration. It is not intended to be a
complete commercial marketplace. The first build should prioritize a working human flow over
production-grade breadth or exhaustive edge-case coverage.

The accepted implementation baseline is Next.js App Router with React and TypeScript, running on
Node.js 24 with SQLite as the initial durable store. WebRTC is a future Remote Viewing seam, not a
first-phase media implementation; Redis is explicitly deferred.

The current MVP baseline is rental-only with two synthetic roles, a small seeded listing catalogue,
one primary demonstration listing, one Viewing Request, and a complete ordinary UI loop: tenant
discovery and submission, agent queue review and response, then tenant confirmation or decline. Only
the primary tenant-to-agent handoff needs a later automatic continuation demonstration; the tenant's
final response can remain a normal application action.

## 2. State matrix

| Surface | Current state | Boundary |
|---|---|---|
| Product name | **Working name: RightSpot** | Confirmed by the main-thread owner; brand details remain open |
| Candidate source | **Rental Marketplace Relay** | Extracted from outer scenario material |
| Preferred candidate set | **RightSpot and Sleepless Kingdom** | RightSpot is the current development target; outer formal selection remains pending |
| Product thesis | **Provisional** | MVP scope accepted; user/problem and workflow value still need validation |
| Primary slice | **MVP BUSINESS-RULES BASELINE** | Tenant request → agent review → slot proposal/decline → tenant response |
| Human application shell | **AGENT ROLE PAGE INTEGRATED; TENANT ROLE PAGE VERIFICATION RECOVERY IN PROGRESS** | Workflow HTTP/DTO transport is integrated at `f700ba9`; shared demo-session shell is integrated at `006d2fd`; shared authenticated role-page frame is integrated at `6a0b4b8`; agent queue/response UI is integrated at `3765747`; tenant discovery/request UI remains frozen and unintegrated pending the same verifier's clean rerun |
| Domain model | **MVP BUSINESS-RULES BASELINE** | Viewing Request, Listing, Availability, roles, transitions, and audit boundaries |
| Backbone | **LOGICAL BASELINE** | Modular-monolith responsibility is defined and remains the application authority |
| Implementation stack | **FOUNDATION VERIFIED** | Next.js App Router, React, TypeScript, Node.js 24, and SQLite; the runnable foundation passed the corrected independent verification contract, without claiming product-flow or deployment readiness |
| Foundation runtime readiness | **PREPARED / VERIFIED** | Exact arm64 Node.js `v24.20.0` is prepared outside the repository and passed version, npm, archive-checksum, and `node:sqlite` smoke checks; the default shell remains `v26.5.0`, and the Builder used the exact target runtime |
| Realtime / WebRTC | **DEFERRED FEATURE SEAM** | Future Remote Viewing is possible without making WebRTC or signaling an MVP dependency |
| Delegated development | **EXPERIMENTAL PILOT — TASK-OWNED** | `RS-WO-002-01` returned `READY_FOR_VERIFICATION`; corrected `RS-WO-002-02` rerun returned `VERIFIED`; `RS-WO-002-03` bounded repair commit `6e70c9f` passed fresh independent verification; `RS-WO-002-04` candidate `68bbc69` passed dedicated verification against frozen source `28105e4d`; `RS-WO-002-05` candidate is frozen at T2 code commit `de169ce` and passed dedicated independent verification against snapshot `bc3bc42`; `RS-WO-002-06` returned `READY_FOR_REVIEW` and its accepted/revised decomposition is recorded in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification and is integrated at `f700ba9`; `RS-WO-002-08` is integrated at `006d2fd` after process re-baseline `8b77bdd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are the accepted disjoint role-page Builder slices being dispatched |
| Cloud Receiver | **Not a first-phase dependency** | Future integration boundary only |
| WebMCP | **Not a first-phase design center** | Later Hackathon integration boundary |
| Runtime / deployment | **Not started** | No service, hosting, credentials, or public URL |
| Evidence | **FOUNDATION + DOMAIN CORE + PERSISTENCE/APPLICATION BOUNDARY + DISCOVERY API + WORKFLOW TRANSPORT + SHARED ROLE FRAME VERIFIED** | The workflow transport candidate passed independent verification at frozen `d71fe3e` with foundation `6/6`, focused `9/9`, full direct `50/50`, build, built-server HTTP, role/error/privacy/conflict, and no-mutation evidence and is integrated at `f700ba9`; the shared shell candidate passed independent HTTP/browser/accessibility verification at `52a8f101` and is integrated at `006d2fd`; the shared role-frame candidate `f1f83c7` passed independent verification and is integrated at `6a0b4b8`; role-page UI/browser walkthrough, deployment, and complete product-flow evidence remain open |

## 3. Confirmed working inputs

- Two roles are central: tenant and property agent.
- The shared business object is a Viewing Request.
- The candidate has a natural later transition: a tenant submits a request and the agent must
  review it.
- The agent needs a management-console view of the current request and synthetic availability.
- The consequential agent response must remain a visible human decision.
- The first slice should use a small synthetic listing catalogue, one primary listing, one tenant,
  one property agent, one request, and deterministic reset.
- The normal app should support tenant login, listing search/filter, listing detail, Viewing Request
  submission, tenant dashboard, agent queue, request review, availability review, a visible
  proposal/decline decision, and a tenant response to a proposed slot.
- The initial fixture should contain enough seeded listing variety for the discovery UI, while the
  judged flow uses the primary listing, one tenant, one agent, and one request.
- Rental-only is the current MVP decision; buying is deferred rather than implemented as a second
  workflow.
- Favourites, bounded proposal notes, and small listing-status controls are supporting features,
  not blockers for the primary relay.
- The tenant's final confirmation or decline is an ordinary application action; it is not a second
  automatic continuation requirement.
- The first judged consequence boundary is the agent's explicit proposal or decline send action;
  tenant confirmation or decline completes the normal application loop.
- The accepted implementation stack is Next.js App Router, React, TypeScript, Node.js 24, and
  SQLite. Vite is not added as a second frontend framework.
- Redis is not required for the MVP and is deferred until a concrete multi-instance, queue,
  presence, or realtime fan-out requirement exists.
- WebRTC is positioned as a possible future Remote Viewing capability. The MVP preserves ownership
  and module boundaries for it but does not implement camera, microphone, signaling, STUN, TURN, or
  media-session behavior.
- Payment, lease signing, real identity documents, live property data, external calendars, and
  broad marketplace features are outside the first slice.

## 4. Open decisions

- What exact user pain and audience will RightSpot validate?
- What deployment profile should host the accepted local contracts, and what later integration
  transport is actually necessary?
- Whether the local MVP snapshot should later be replaced by a normalized production schema and
  migration strategy.
- What accessibility and responsive layout baseline should the application use?
- Which future Hackathon integration is necessary after the ordinary product loop works?

## 5. Next gate

The immediate gate is to complete the same-identity tenant verifier recovery rerun for candidate
`eb1d62e` from the clean Worktree. The agent candidate `169cb95d` has already passed independent
verification and is integrated at product commit `3765747`; the tenant and agent slices use the verified
shared frame at `6a0b4b8` and stable transport, listing, and DTO boundaries.

The first `RS-WO-002-02` result is recorded as a procedural `BLOCKED`, and the corrected rerun is
now `VERIFIED` against the unchanged source/runtime identity. The bounded `RS-WO-002-03` domain-core
implementation and projection-isolation repair were independently checked against frozen commit
`a60001e`; the bounded Repairer completed the exact two-path repair in `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` was initially held because its prompt was appended to the persisted `RS-WO-002-01` supporting thread. The main thread reconstructed the exact three-path candidate and adopted it at T2 commit `68bbc69`. The first dedicated Verifier dispatch then stopped before source checks because the prompt incorrectly expected a nested `WebMCP_Challenge` directory inside the detached Worktree; one corrected follow-up to the same identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. The parent execution posture is now `PROGRESSING`, not globally blocked: `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION`, its exact 14-path candidate was integrated at T2 code commit `de169ce`, and its dedicated independent Verifier returned `VERIFIED` against canonical snapshot `bc3bc42`. The read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`; the main thread accepted its decomposition with revisions and froze the ordinary workflow HTTP/DTO contract in ADR-RS-0008. `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification, including foundation `6/6`, focused `9/9`, full direct `50/50`, build, built-server HTTP, role/privacy/conflict, and no-mutation evidence, and is integrated at product commit `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at product commit `6a0b4b8`. The next gate is to complete the assigned disjoint tenant and agent role-page Work Orders `RS-WO-002-12` and `RS-WO-002-13`, then independently verify and integrate each before the cross-role browser walkthrough. The user-authorized Side Chat learning file and process-only Runbook writeback are classified separately and are not product source drift. Do not claim complete product-flow or parent closure from this checkpoint alone.
The authoritative role-page disposition is tenant verifier recovery for `RS-WO-002-12`, after
`RS-WO-002-13` passed independent verification and was integrated at `3765747`. The eventual
implementation remains
without Cloud Receiver, WebMCP, Redis, or WebRTC media
dependencies.

## 5.1 Current Work Order boundary

`RS-WO-002-10` returned `READY_FOR_REVIEW` with no source mutation, and the main thread accepted its
decomposition. `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`; T2 review froze the exact
four-path candidate at `f1f83c7`, dedicated verification returned `VERIFIED`, and the main thread
integrated it at `6a0b4b8`. `RS-WO-002-12` and `RS-WO-002-13` were the two disjoint role-page
implementation slices; their exact dispatch identities and Worktrees are recorded in the parent
Task File; tenant task `01a05ba2-34d4-7613-892d-c0776203073c` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui`, and agent task
`01a05ba2-3d53-7bd3-934c-6238237576fd` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui`; the tenant candidate
`eb1d62e1b33a045e683f64ba3d28930e9444cd25` remains frozen and unintegrated after verifier task
`01a05bb1-c38b-7a91-95aa-49475a057e43` stopped on the verifier Worktree's out-of-scope tracked
`.gitignore` mutation adding `.gstack/`. The agent candidate `169cb95d60d4d91c8cd89ef4b722f6fc379db97f`
passed verifier task `01a05bae-de91-7252-b5ce-4a6a729441dd` and is integrated at product commit
`3765747`; its verifier Worktree is `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier`.

The parent `RIGHTSPOT-002` remains `in_progress`; the foundation Builder stopped after returning
`READY_FOR_VERIFICATION`, the first `RS-WO-002-02` attempt was `BLOCKED` on a procedure boundary,
and its corrected rerun is `VERIFIED` against the unchanged exact target Node.js runtime and
execution manifest. `RS-WO-002-03` Builder and bounded Repairer returned `READY_FOR_VERIFICATION`,
and T2 source is frozen at `a60001e`; the Verifier found a listing-version guard defect and the
bounded Repairer completed it in post-repair commit `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` candidate adoption is complete for the three-path persistence/application boundary at T2 commit `68bbc69`; its first dedicated Verifier attempt was procedurally blocked before source checks by an incorrect nested-root path in the dispatch prompt, and one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` discovery is independently verified against T2 code commit `de169ce` from snapshot `bc3bc42`. The `RS-WO-002-06` Advisor's read-only proposal is integrated into ADR-RS-0008 and the admitted Work Orders. `RS-WO-002-07` workflow transport is independently verified at `d71fe3e` and integrated at `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` is integrated at `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are assigned in parallel from the reviewed baseline, with exact task identities and Worktrees recorded in the parent Task File. Builder, Verifier, Repairer, and Integrator remain sequential checkpoints within each Work Order; the Side Chat process lane remains separate from product-source writes. The main thread owns evidence writeback, Git closure, and dispatch.

## 6. Non-claims

RightSpot currently does not claim a validated rental business, production-ready marketplace,
selected Agent runtime, Cloud Receiver compatibility, WebMCP proof, WebRTC Remote Viewing,
Redis-backed distributed operation, live deployment, or Hackathon submission readiness.
