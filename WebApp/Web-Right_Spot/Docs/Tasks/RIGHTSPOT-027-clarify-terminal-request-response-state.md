# RIGHTSPOT-027: Make terminal Viewing Request response state-accurate

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant action clarity and judge-facing workflow truthfulness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** Closed `RIGHTSPOT-026`; `RS-FLOW-12` tenant confirmation; `RS-FLOW-13` tenant decline;
`RS-FLOW-14` proposal expiry; and the accepted terminal-state vocabulary

## Task control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2`
- Owner: Main RightSpot thread
- Current increment: Make the tenant request response card distinguish an actionable proposal from a
  recorded terminal outcome.
- Execution posture: `CLOSED`
- Evidence status: `CLOSED_VERIFIED` after Builder Red→Green, Main scope/runtime checks, independent
  persistent verification, browser smoke, and canonical documentation reconciliation.
- Next gate: Return to the Main-thread cross-layer audit. Reopen only if a later audit reproduces a
  regression or the repair requires a boundary outside this Task.

## Verified problem

The tenant request dashboard intentionally renders the agent's sent response after a proposal reaches
`VIEWING_CONFIRMED`, `TENANT_DECLINED`, or `EXPIRED`. The server projection preserves that historical
response and its proposal deadline so the tenant can understand what happened.

The current `TenantResponse` component, however, infers presentation only from the response kind:

```tsx
<TenantResponse response={data.request.response} expiresAt={data.request.proposalExpiresAt} />
```

For every retained `SLOT_PROPOSAL`, it renders `Action needed` and `Respond by`, even when the
authoritative request is already terminal. The same card therefore tells a tenant that action is
needed while the request dashboard simultaneously says that there is no tenant action to take.
`EXPIRED` is particularly misleading because the displayed deadline is already past.

This is a real cross-layer presentation defect, not a speculative style preference:

1. `confirmViewing` changes the request to `VIEWING_CONFIRMED` but retains `sentResponse`.
2. `declineViewing` changes the request to `TENANT_DECLINED` but retains `sentResponse`.
3. `evaluateExpiry` changes the request to `EXPIRED` but retains `sentResponse` and
   `proposalExpiresAt`.
4. `readTenantProjection` maps those retained values into the tenant DTO.
5. `TenantResponse` maps every retained `SLOT_PROPOSAL` to the same actionable badge and deadline
   label, regardless of request state.
6. The parent dashboard separately renders a no-action read-only message for all three terminal
   states.

The current state vocabulary and terminal semantics are correct. The defect is that the UI does not
consume the state when presenting a retained response.

## Bounded objective

Make the existing tenant response card truthful for all states that can carry a response:

1. Pass the authoritative request state into the response presentation.
2. Show `Action needed` and `Respond by` only while the request is `SLOT_PROPOSED` and tenant
   confirmation or decline is actually available.
3. Present `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED` as recorded terminal outcomes,
   without an actionable badge or a misleading response deadline.
4. Preserve the existing `AGENT_DECLINED` response presentation as a completed agent decision.
5. Keep the existing state heading, guidance, confirm/decline controls, read-only note, timeline,
   listing link, tenant-safe projection, and refresh behavior coherent with the revised card.
6. Add a focused UI contract regression covering the complete response/state matrix and the absence
   of actionable deadline language in terminal states.

This is a presentation-only repair. No workflow transition, API payload, DTO shape, persistence rule,
role/privacy boundary, Favourite behavior, authentication, external integration, or design-system
rewrite is authorized.

## Accepted presentation contract

The implementation may use equivalent wording only if it preserves the following semantic contract.
Exact copy should be kept stable once the Work Order starts so the focused regression remains
falsifiable.

| Request state | Response kind | Response heading | Badge | Deadline |
|---|---|---|---|---|
| `SLOT_PROPOSED` | `SLOT_PROPOSAL` | `A viewing slot was proposed` | `Action needed` | Show `Respond by` |
| `VIEWING_CONFIRMED` | `SLOT_PROPOSAL` | `Viewing slot confirmed` | `Decision recorded` | Do not show `Respond by` |
| `TENANT_DECLINED` | `SLOT_PROPOSAL` | `Viewing proposal declined` | `Decision recorded` | Do not show `Respond by` |
| `EXPIRED` | `SLOT_PROPOSAL` | `Viewing proposal expired` | `Closed` | Do not show `Respond by` |
| `AGENT_DECLINED` | `AGENT_DECLINE` | `The agent declined this request` | `Response received` | No deadline |

The terminal card may retain the slot reference and tenant-facing note as historical information.
It must not imply that the tenant can still confirm, decline, or respond to the proposal. The parent
dashboard remains the source of the action boundary: only `SLOT_PROPOSED` renders the decision
controls.

## Work Order

### RS-WO-027-01 — Repair terminal response presentation

**Role:** Persistent supporting Builder → Main integration → persistent independent Verifier  
**Status:** `INTEGRATED`  
**Execution state:** `INTEGRATED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_SINGLE_SURFACE` — one tenant component and one focused UI contract test  
**Execution profile:** `Fast` — existing DTO/state presentation only; no server contract change  
**Supporting Builder task/thread:** `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` on host `local`  
**Independent Verifier task/thread:** `01a060a8-6f2d-7141-98d0-385483a9104f` on host `local`; its prior `RIGHTSPOT-026` assignment is closed and this is a new `RS-WO-027-01` verification turn.  
**Dispatch acknowledgement:** Builder prompt was sent once; the existing identity-matched Verifier was reassigned once after the candidate freeze.  
**Dispatch source identity:** canonical repository `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`,
`main@81ee4392d173d796e404101818b741c0b64b861b`; Node `v24.20.0`, npm `11.19.0`; only physical
Worktree is canonical Main.  
**Next gate:** Complete. The Verifier returned `VERIFIED/PASS`; Main reconciled the evidence and
integrated the bounded candidate into the canonical Main Worktree.

### Independent verification result — 2026-09-02

The existing persistent Verifier task `01a060a8-6f2d-7141-98d0-385483a9104f` completed the new
`RS-WO-027-01` verification turn after the Builder returned `READY_FOR_VERIFICATION` and Main's
independent static/runtime checks passed. It verified the exact frozen candidate identity:

- `src/ui/tenant/tenant-request-page.tsx` — `aed6e456d6c607d3b91228ba2d3af237bdda77f46cb7ca4b1ae7a7fdbe97c434`
- `tests/ui/tenant-terminal-response-presentation.test.ts` — `8e80771c78d69604cce9c4133deba1e95571706bc319c361649a7695c869e1ab`

The Verifier returned `VERIFIED/PASS` read-only. Focused coverage passed `3/3`, the relevant
domain/application/views/API/tenant suite passed `48/48`, and the full direct suite passed `132/132`
across 27 test files. Pinned-runtime typecheck and production build passed; pre/post-build tracked
diff digest and all candidate/read/build-input hashes remained unchanged. Scoped diff, whitespace,
and project-language checks passed. A safe isolated-port browser smoke confirmed the existing tenant
`REQUEST_SUBMITTED` dashboard and listing handoff with zero confirm/decline controls, zero deadline,
and zero console warnings/errors; it performed no workflow mutation. Terminal-state browser mutation
was intentionally skipped because the pure state matrix and cross-layer transition/projection suites
cover it without disturbing the shared demo fixture.

No workflow, API, DTO, projection, persistence, privacy, auth, CSS, dependency, external integration,
deployment, WebMCP, Cloud Receiver, WebRTC, or parent-product claim is made. The exact two-path
candidate is integrated into the canonical Main Worktree; the remaining RightSpot dirty state belongs
to pre-existing or separately recorded work and is not part of this closure.

### Process incident and re-baseline — 2026-09-02

After the Builder prompt was acknowledged, Main updated only the lifecycle/evidence wording in
`Docs/07-business-flows-and-scenarios.md` from the pre-dispatch finding state to the assigned state.
Because the initial Work Order listed that mixed canonical document as a whole-file read input, the
Builder correctly detected a hash change (`b4c685...` → `74fc47...`) and stopped before any remaining
checks. Main classified the change as an intentional process-only writeback: no flow contract,
acceptance criterion, runtime, dependency, or product authority changed. The same Builder identity was
re-baselined once with the clarified boundary and resumed; no duplicate dispatch or code rework was
created. The durable prevention rule is now recorded in the orchestration Runbook: mixed canonical
files must declare immutable semantic sections separately from Main-owned lifecycle/evidence sections,
and validation must not use an undifferentiated whole-file hash lock.

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `src/shared/contracts/workflow-api.ts`
- `src/server/domain/workflow.ts`
- `src/server/domain/projections.ts`
- `src/server/application/workflow-views.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md`
- `Docs/Tasks/RIGHTSPOT-026-clarify-listing-request-status-notice.md`
- Existing tenant UI/domain/application/API tests required to understand response retention

### Worker write set

- `src/ui/tenant/tenant-request-page.tsx`
- `tests/ui/tenant-terminal-response-presentation.test.ts` (new focused regression)

### Main documentation writeback set

- This Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- `RUNBOOK.md` only if the new state-aware presentation or audit rule changes a durable procedure

### Forbidden and generated sets

**Forbidden:** server/domain/application/persistence code, API contracts, DTO shapes, state
transitions, role/privacy projection logic, listing/Favourite/session/auth code, shared CSS, assets,
package files, Git metadata, outer Web-Game files, and unrelated collaborator work.  

**Generated/local-only:** `.next/`, browser state, server logs, and test-owned databases under the
RightSpot package's permitted test paths.

### TDD and acceptance

1. **Red:** the focused regression must fail against the current `TenantResponse` behavior because a
   retained slot proposal in at least one terminal state still produces `Action needed` and/or
   `Respond by`.
2. **Green:** pass request state to the existing response card and make the smallest state-aware
   presentation mapping that satisfies the accepted matrix.
3. **Refactor:** only behavior-preserving local cleanup after Green; do not introduce a general
   content framework or change unrelated status labels.
4. The focused regression covers `SLOT_PROPOSED`, `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`,
   and `AGENT_DECLINED`, including both actionable and terminal deadline rules.
5. Existing tenant UI/API/domain/application tests, typecheck, production build, and scoped diff
   checks pass under Node `v24.20.0` / npm `11.19.0`.
6. A browser check confirms the current submitted primary request remains usable and that the
   `SLOT_PROPOSED` action controls are unchanged. Terminal mutation may be covered by the focused
   state contract when performing it in the shared demo fixture would disturb the owner's session.
7. The candidate changes only the declared tenant component and focused test. If the accepted
   contract cannot be represented with existing DTO data, stop and redesign the Task rather than
   changing the server contract opportunistically.

### Builder return gate

Return `READY_FOR_VERIFICATION` with:

- exact source identity and package/runtime identity;
- focused Red and Green outputs;
- full relevant test, typecheck, build, and `git diff --check` results;
- exact changed paths and diff summary;
- browser evidence and explicitly skipped terminal mutation evidence;
- confirmation that no server, DTO, workflow, privacy, auth, dependency, or external integration
  behavior changed;
- residual risks, non-goals, and the frozen-source handoff for the independent Verifier.

### Stop conditions

Stop and report to Main if:

- a response/state combination not represented by the accepted contract is observed;
- the repair requires a new field, state, transition, API, or route;
- the worker would need to modify shared CSS or another worker's file;
- terminal response data is missing and cannot be presented truthfully without changing projection
  authority;
- tests can pass only by weakening the state or privacy boundary;
- another collaborator changes the read set or the frozen source during execution.

## Non-goals

- Do not change the Viewing Request state machine or terminal semantics.
- Do not remove historical response data from the tenant projection.
- Do not add notifications, chat, contact/PII, scheduler, external auth, WebMCP, Cloud Receiver,
  WebRTC, payment, lease, or deployment behavior.
- Do not rewrite all tenant copy, redesign the Field Desk, or normalize every status label in this
  Task.
- Do not claim a real-world viewing appointment from `VIEWING_CONFIRMED`.

## Closure gate

Close only when the accepted response/state matrix is implemented with a focused Red→Green
regression, relevant checks and browser evidence pass, an independent persistent Verifier confirms
the frozen candidate, the exact change is integrated into the canonical Main Worktree, and the flow,
validation, status, roadmap, Task index, and any affected Runbook wording are reconciled.

## Reopen condition

Reopen or replace this Task if the response/state mismatch reveals a server projection inconsistency,
requires changing terminal workflow semantics, needs a new API/DTO field, crosses the tenant/agent
privacy boundary, or expands beyond the existing tenant request dashboard response card.
