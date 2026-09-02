# RIGHTSPOT-026: Clarify the existing Viewing Request status notice

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P2` for judge-facing UI clarity and truthful state communication
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** Closed `RIGHTSPOT-025`; `RS-FLOW-03` listing detail; `RS-FLOW-05` draft ownership;
`RS-FLOW-06` explicit submission; and the accepted Viewing Request state vocabulary

## Task control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2`
- Owner: Main RightSpot thread
- Current increment: Replace the listing-detail same-listing request notice with grammatical,
  state-truthful copy for every non-draft request state.
- Execution posture: `CLOSED`
- Evidence status: `CLOSED_VERIFIED` after Red→Green, exact-path review, full direct suite, typecheck,
  production build, live submitted-listing smoke, independent persistent verification, and canonical
  documentation writeback; the underlying workflow/API behavior is unchanged.
- Next gate: Return to the Main-thread cross-layer audit. Reopen only if a later audit reproduces a
  regression or the repair requires a boundary outside this Task.

## Verified problem

On `/tenant/listings/listing-primary`, when the tenant already has a non-draft request for the same
listing, `src/ui/tenant/tenant-listing-page.tsx` renders:

```text
This listing already has a request submitted request
The submitted request is read-only here.
```

The heading is grammatically broken because the state label is interpolated between `a` and `request`.
The copy is also not state-truthful for `AGENT_REVIEWING`, `SLOT_PROPOSED`, `VIEWING_CONFIRMED`,
`AGENT_DECLINED`, `TENANT_DECLINED`, or `EXPIRED`; those states are not all accurately described as
"submitted". The issue is visible on a primary tenant path, but it does not block the authoritative
request workflow or expose private data.

## Bounded objective

Make the existing same-listing notice clear and truthful without changing business behavior:

1. Every non-draft request state has a grammatical heading and a human-readable current-status
   explanation.
2. `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, `SLOT_PROPOSED`, `VIEWING_CONFIRMED`, `AGENT_DECLINED`,
   `TENANT_DECLINED`, and `EXPIRED` do not reuse inaccurate "submitted" copy.
3. The notice continues to explain the one-request/read-only boundary and links to the existing
   `/tenant/requests` dashboard.
4. Drafts continue to render the existing editor; requests targeting another listing continue to
   render the existing one-request boundary.
5. The fix is presentation-only: no state transition, API payload, persistence, role boundary,
   Favourite behavior, authentication, CSS system, external integration, or fallback is introduced.

## Work Order

### RS-WO-026-01 — Repair listing-detail request-status notice

**Role:** Main-thread Builder → independent persistent Verifier (sequential checkpoints)
**Pre-dispatch status:** `MAIN_BUILDER_COMPLETE`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread
**Parallelization:** `SERIAL_SINGLE_SURFACE` — one tenant component and its focused UI contract test
**Execution profile:** `Fast` — presentation copy/state mapping only; no server or data contract
**Dispatch state:** Main implementation completed against `main@81ee4392d173d796e404101818b741c0b64b861b`; exact
candidate paths were frozen and independently verified by persistent supporting task
`01a060a8-6f2d-7141-98d0-385483a9104f` (`local`).
**Next gate:** Complete. Main reconciled the passing evidence and closed this Work Order and Task.

### Acceptance criteria

1. The rendered same-listing notice contains no duplicate noun construction such as `request ...
   request`.
2. Each non-draft state has an explicit, grammatical, state-accurate heading/status message.
3. The `/tenant/requests` action remains present and its purpose is clear.
4. The current request editor and another-listing branch remain unchanged in behavior.
5. A focused regression covers the complete accepted non-draft state vocabulary, and the existing
   tenant UI/API/domain suite remains green.
6. A browser inspection of the submitted primary fixture confirms the corrected visible copy and no
   console error; no terminal-state browser mutation is required when the pure state-copy contract
   is covered by the focused regression.
7. The exact diff is limited to the declared tenant listing component and focused UI test, unless a
   test-only helper extraction is required and explicitly recorded before implementation.

### Accepted copy contract

The same-listing notice uses the following existing state vocabulary. The heading and supporting copy
must remain grammatical and must not describe every state as merely "submitted":

| State | Heading | Supporting copy |
|---|---|---|
| `REQUEST_SUBMITTED` | `Viewing Request already submitted` | `The request has been sent to the property agent. Open the request dashboard to follow its status.` |
| `AGENT_REVIEWING` | `Viewing Request is under review` | `The property agent is reviewing this request. Open the request dashboard for the latest status.` |
| `SLOT_PROPOSED` | `Viewing Request has a proposed viewing` | `Review the proposed time and make your decision from the request dashboard.` |
| `VIEWING_CONFIRMED` | `Viewing Request is confirmed` | `The proposed viewing is confirmed. Open the request dashboard to review the completed request.` |
| `TENANT_DECLINED` | `Viewing Request was declined by you` | `You declined the proposed viewing. Open the request dashboard to review the completed request.` |
| `AGENT_DECLINED` | `Viewing Request was declined by the agent` | `The property agent declined this request. Open the request dashboard to review the response.` |
| `EXPIRED` | `Viewing Request has expired` | `The proposal deadline passed before a tenant decision. Open the request dashboard to review the completed request.` |

`TENANT_DRAFT` continues to use the existing editor and is not rendered by this notice contract. The
dashboard link remains the single handoff for the current request state and permitted action.

## Source identity and boundaries

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch/HEAD at registration: `main` / `81ee4392d173d796e404101818b741c0b64b861b`
- Runtime: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node `v24.20.0`,
  npm `11.19.0`
- Worktree: canonical Main only; no implementation Worktree is open
- Generated/local-only output: `.next/`, browser state, server logs, and `var/test/*.sqlite`

The Main Worktree is intentionally dirty with existing RightSpot documentation and protected source,
plus unrelated outer Web-Game work. Use path-scoped identity. Do not clean, reset, delete, or stage
unrelated work.

### Mutable scope

- **Worker/Main write set:** `src/ui/tenant/tenant-listing-page.tsx` and
  `tests/ui/tenant-listing-request-notice.test.ts`.
- **Main documentation writeback:** this Task File, `Docs/Tasks/README.md`,
  `Docs/00-current-status.md`, `Docs/07-business-flows-and-scenarios.md`, validation/evidence,
  roadmap, and any required Runbook wording.
- **Forbidden set:** server/domain/application/persistence code, API contracts, DTO shapes, state
  transitions, listing/Favourite/session/auth code, shared CSS, assets, package files, Git metadata,
  outer Web-Game files, and user-owned reference artifacts.
- **Generated set:** `.next/`, browser state, server logs, and test-owned databases.

If the truthful copy requires a new state, server field, workflow transition, or broader surface,
stop and redesign the Task. Do not solve the problem by hiding the notice or by hardcoding one state
as if it applied to all states.

## TDD and verification

1. **Red:** add a focused UI contract regression that fails against the current interpolated copy and
   proves all accepted non-draft states receive explicit truthful notice content.
2. **Green:** make the smallest presentation-only copy/state mapping change. Preserve the existing
   draft editor, one-request boundary, dashboard link, and request state values.
3. **Refactor:** only behavior-preserving local cleanup after Green; no new design system or content
   abstraction beyond what the focused test needs.
4. Run the focused test, full RightSpot direct suite, typecheck, production build, scoped diff checks,
   and a browser check of the submitted primary listing detail under Node `v24.20.0`.
5. Main Builder evidence for this candidate: focused test `2/2`, full direct suite `129/129`,
   `npm run typecheck`, `npm run build`, scoped `git diff --check`, and browser smoke all passed under
   Node `v24.20.0` / npm `11.19.0`. The browser showed `Viewing Request already submitted` with the
   accepted supporting copy on the submitted primary listing; no workflow mutation was performed.
6. Exact implementation paths are `src/ui/tenant/tenant-listing-page.tsx` and
   `tests/ui/tenant-listing-request-notice.test.ts`; their post-Builder SHA-256 values are
   `57c0dbeffeaa3c275efa46d05bfc7565e77247e10c6a44e13b5f0c5ea214cc9c` and
   `9027e014ad4755bf977c1097790012bfa8b695406135f0a336a4556d11ede391` respectively.
7. Independent persistent Verifier `01a060a8-6f2d-7141-98d0-385483a9104f` independently returned
   `VERIFIED/PASS` against the frozen source. It confirmed the seven-state contract, preserved draft
   and another-listing boundaries, exact path scope, all checks, live copy, zero console warnings/errors,
   and no workflow mutation. It did not repair, commit, push, deploy, or claim external integration.
8. Main completed exact-path review and canonical documentation writeback. The only verification
   side-effect was Next tool-maintained `next-env.d.ts` normalization back to the identical HEAD
   content; no residual diff remained and no manual restore/edit/commit was performed.

## Non-goals and stop conditions

- Do not alter the Viewing Request state machine, transition semantics, API, DTO, persistence, or
  tenant/agent privacy boundary.
- Do not add a new route, notification, chat, contact/PII surface, new state, external service, or
  CSS redesign.
- Do not turn this polish defect into a general copy rewrite or product-scope expansion.
- Stop for any scope expansion or if a state cannot be represented truthfully using existing data.

## Closure gate

Close only when the existing listing-detail notice is grammatical and state-truthful for every accepted
non-draft state, the dashboard handoff remains usable, Red/Green/full checks and browser evidence pass,
the persistent Verifier returns `PASS`, and the exact change plus residual non-claims are reconciled
into the canonical Main Worktree and core documents.

## Reopen condition

Reopen or replace this Task if the copy requires new workflow semantics, a new API/DTO field, a new
state, a role/privacy decision, or a surface outside the tenant listing-detail notice.
