# RIGHTSPOT-032: Expose the selected proposal time in the tenant response

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P1` for primary tenant decision clarity  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `ADR-RS-0008`, `04-domain-and-data-model.md`, `05-api-and-integration-contracts.md`, and the response-state presentation rules in `07-business-flows-and-scenarios.md`

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1` — the tenant can reach the proposal decision controls without seeing the
  date/time of the slot that the agent selected.
- Owner: Main RightSpot thread
- Current increment: Completed the minimum tenant-safe selected-slot detail in the authoritative tenant
  projection and its proposal/retained terminal-response presentation.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `CLOSED_VERIFIED`; contract review, focused TDD Red→Green implementation, complete
  static checks, and fresh isolated browser evidence passed on the canonical Main Worktree.
- Next gate: No task-local gate remains; continue with the next Main-thread cross-layer audit and
  register only a newly reproduced bounded gap.
- Dependencies: None blocking; the task must preserve the accepted workflow and privacy contracts.

## Verified problem

The tenant response contract currently carries only the opaque `slotId` inside a `SLOT_PROPOSAL`
response. The tenant request projection does not resolve that identifier to the selected slot's
authoritative `startsAt` and `endsAt`, although the same slot facts are available to the agent
projection.

This was reproduced against the local Main application after resetting the fixture to generation
`24`:

- the tenant submitted a request with a preferred time rendered as `18 September 2026, 10:00`;
- the agent explicitly sent a proposal for `slot-primary-2`;
- the authoritative slot facts were `2026-09-04T14:00:00.000Z` to
  `2026-09-04T14:30:00.000Z`, rendered in the existing Europe/London contract as
  `4 September 2026, 15:00–15:30`;
- `/tenant/requests` showed the tenant's own preferred time, `Slot reference slot-primary-2`, the
  agent note, deadline, and decision controls, but did not show `4 September 2026` or the proposed
  time range; and
- the isolated browser session had no application console or route error. The local screenshot is
  retained at `var/test/audit-proposal-missing-slot.png` as generated evidence and is not product
  source.

The two different times make the omission materially misleading: the tenant is asked to confirm or
decline a proposal without being shown what they are confirming. This is a business-flow and
projection-completeness defect, not merely visual polish. It also affects the retained response
shown after confirmation, tenant decline, or expiry, where the historical selected time remains
useful even though the action and deadline must disappear.

## Bounded objective

1. Resolve the sent proposal's selected slot from the authoritative workflow state and expose only
   its tenant-safe start/end facts in the tenant request view.
2. Render the proposed time distinctly from the tenant's preferred times while preserving the
   existing proposal deadline and explicit decision controls in `SLOT_PROPOSED`.
3. Render the recorded selected time for `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED`
   responses without restoring an action or an expired deadline.
4. Preserve the existing response note, timeline, request version/generation, London-time display,
   role/privacy boundary, and state-machine behavior.
5. Make a missing, mismatched, or orphaned selected-slot relation fail through the existing
   authoritative error boundary rather than falling back to the tenant's preferred time, an
   invented date, or an opaque slot ID as if it were sufficient detail.

## Accepted behavior and boundary

- The tenant-safe contract adds one dedicated optional `viewingSlot` value on `TenantRequestDto`
  and its internal tenant projection. It contains exactly `startsAt` and `endsAt` ISO timestamps;
  do not model it as a reusable `Pick<AvailabilitySlot, ...>` that could later carry status or
  holder fields.
- `viewingSlot` is present only when the retained response is a `SLOT_PROPOSAL`; it is omitted for
  `AGENT_DECLINE`, a request without a response, and all other response kinds.
- The selected slot is resolved by `sentResponse.slotId` against the authoritative workflow state
  for the request's listing. It is not taken from client input, the agent's private projection, or
  the tenant's `preferredTimes`.
- `SLOT_PROPOSED` shows a clear proposed viewing date/time, the existing tenant-facing note, the
  existing deadline, and the existing confirm/decline actions.
- `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED` show the retained historical viewing time
  when available, but remain terminal and do not show `Action needed`, confirm/decline controls, or
  a past `Respond by` deadline.
- `AGENT_DECLINED` remains a response without a viewing slot.
- The existing `slotId` may remain as a technical reference for compatibility, but it must not be
  the only tenant-facing representation of a proposal time.
- The tenant receives no slot status, `heldByRequestId`, other availability slots, agent internal
  review note, tenant identity/contact data, or persistence metadata beyond the existing
  tenant-safe contract.
- No new state transition, persistence schema, scheduler, notification, authentication, dependency,
  external integration, or WebMCP/Cloud Receiver/WebRTC/Redis behavior is part of this task.

## Work Order

### RS-WO-032-01 — Restore tenant-visible selected viewing time

**Role:** Main-thread Builder → focused TDD verification → full regression → browser verification → documentation closure  
**Status:** `CLOSED_VERIFIED`  
**Execution state:** `CLOSED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_RESPONSE_CONTRACT` — the domain projection, DTO mapper/parser,
and tenant response component form one shared contract; no parallel writer is admitted.  
**Execution profile:** `Standard` — one bounded tenant projection contract, one tenant component,
new regression tests, and synchronized documentation; no API state-machine or persistence redesign.

### Required read set

- `src/server/domain/types.ts`
- `src/server/domain/projections.ts`
- `src/server/application/workflow-views.ts`
- `src/server/persistence/workflow-store.ts`
- `src/shared/contracts/workflow-api.ts`
- `src/ui/tenant/tenant-api.ts`
- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant.module.css`
- `src/ui/agent/agent-request-page.tsx` — authoritative comparison for selected-slot rendering
- `tests/application/workflow-views.test.ts`
- `tests/api/workflow.test.ts`
- `tests/ui/tenant-terminal-response-presentation.test.ts`
- `Docs/Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md`
- `Docs/04-domain-and-data-model.md`
- `Docs/05-api-and-integration-contracts.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/07-business-flows-and-scenarios.md`
- `RUNBOOK.md`

### Main write set

- `src/server/domain/types.ts` — tenant projection selected-slot type only
- `src/server/domain/projections.ts` — authoritative selected-slot resolution and relation guard only
- `src/server/application/workflow-views.ts` — tenant-safe view mapping only
- `src/shared/contracts/workflow-api.ts` — tenant-safe DTO type only
- `src/ui/tenant/tenant-api.ts` — parser/type validation for the added tenant-safe value only
- `src/ui/tenant/tenant-request-page.tsx` — proposed/retained viewing-time presentation only
- `tests/application/tenant-viewing-slot-projection.test.ts` — new projection regression contract
- `tests/ui/tenant-proposed-viewing-time.test.ts` — new rendered/source presentation contract
- `Docs/Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md` — accepted tenant DTO
  contract synchronization only
- `Docs/04-domain-and-data-model.md` — tenant projection contract update only
- `Docs/05-api-and-integration-contracts.md` — tenant DTO contract update only
- this Task File and the remaining registered documentation reconciliation paths below

### Forbidden set

- Agent DTOs/projections or agent UI behavior, except read-only comparison during review
- `src/server/domain/workflow.ts` state transitions, slot lifecycle semantics, or audit behavior
- persistence schema, fixture contents, reset semantics, database recovery, or new dependencies
- tenant preferred-time editing, request submission/decision commands, route/auth/session behavior,
  listing discovery/detail loading, favourites, navigation, global CSS, media, or Operations
- Information Request, external authentication, live chat, notification, WebMCP, Cloud Receiver,
  WebRTC, Redis, deployment, or commercial marketplace behavior
- exposing slot status/holder/internal notes or all availability to the tenant
- modifying existing test files unless the Work Order review proves a type-only adjustment is
  unavoidable; prefer the two new regression files above
- browser state, server logs, generated output, Git metadata, Worktree lifecycle, and unrelated
  collaborator changes

### Generated/local-only set

`.next/`, `var/test/`, isolated browser session state, server logs, and disposable fixture database
state are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Before product source changes, the new contracts must fail against the registered baseline by
proving that:

1. a tenant projection for a sent slot proposal currently lacks the selected slot's authoritative
   start/end detail;
2. proposal and terminal tenant response presentation require the selected viewing-time value and
   keep the tenant's preferred time distinct; and
3. an absent, wrong-listing, or otherwise mismatched selected-slot relation cannot silently produce
   a successful tenant response view.

Recorded result: the new projection and presentation contracts failed against the pre-change
baseline because the tenant projection had no selected-slot time and the tenant page had no
tenant-safe time prop/render path. The focused command was the two new Work Order test files; the
expected failures were captured before product source changes. The malformed-relation domain checks
also established the required visible failure boundary.

### Green

Implement the smallest authoritative resolution and tenant-safe DTO/UI mapping. Keep response state
presentation driven by the existing `tenantResponsePresentation` rules, so terminal states retain
history but no longer regain an action or deadline. Use the existing Europe/London formatter and
existing error boundary for an invalid authoritative relation. No fallback or guessed time is
allowed. The Green implementation now resolves the selected slot in the tenant projection, maps only
`startsAt`/`endsAt`, and blocks the tenant action/deadline path with visible copy if an incomplete
proposal payload reaches the client without that value.

### Refactor

Remove duplication only after the focused contract is green. Keep the selected-slot type and mapping
named clearly, preserve the exact write set, and ensure the agent/private projection is unchanged.

## Closure evidence

The Work Order passed and closed on 2026-09-02:

- focused Red→Green contracts passed for projection resolution, missing/wrong-listing relation
  failures, terminal selected-time retention, tenant-safe parser filtering, and incomplete-proposal
  action blocking;
- pinned complete `npm test` passed `143/143` across `32` authored test files;
- pinned `npm run test:foundation` passed `6/6`; `npm run typecheck`, `npm run build`, and
  `git diff --check` passed;
- exact source review confirmed the declared tenant projection/DTO/parser/UI boundary only, with no
  agent/private projection, workflow transition, persistence, or deferred integration change;
- fresh isolated browser evidence at fixture generation `25` showed the selected
  `4 Sept 2026, 15:00–15:30` separately from the tenant's `18 Sept 2026, 10:00` preference before
  confirmation, then retained the recorded time in `VIEWING_CONFIRMED` without `Action needed`,
  `Respond by`, or decision controls;
- tenant response JSON exposed only `startsAt`/`endsAt` under `viewingSlot`, with no slot status,
  holder, internal note, or other private field; missing/mismatched relation tests failed visibly;
- `/api/health` returned `{"ok":true,"service":"rightspot"}`; the canonical Main Worktree remained
  the only product source authority and no implementation Worktree was opened; and
- `Docs/04`, `Docs/05`, ADR-RS-0008, `Docs/06`, `Docs/07`, the Task index, Current Status, Roadmap,
  Audit, and Runbook were reconciled to the closed disposition.

## Verification and closure gate

Under the pinned Node.js `v24.20.0` / npm `11.19.0` runtime:

1. Both new focused contracts pass after their recorded Red result.
2. The complete `npm test` suite passes, with the updated count recorded rather than assumed.
3. `npm run test:foundation`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
4. A fresh browser proposal shows the agent-selected date/time separately from tenant preferences.
5. A terminal response shows the retained selected time without action/deadline language.
6. No tenant response contains slot status, holder, agent internal note, other availability, or
   guessed data.
7. Existing request transitions, conflict feedback, slot release, role guards, and privacy tests
   remain green.
8. The current Main Worktree is the only product source authority; no implementation Worktree is
   required for this serial Work Order.
9. All canonical documents agree on the open/closed disposition and the resulting non-claims.

## Stop and reopen conditions

Stop and report `BLOCKED` if the correction requires a persistence/schema migration, a workflow
state-machine change, a new public role or identity rule, a new dependency, or an API contract that
cannot remain tenant-safe. Do not widen this task to all availability, slot booking, calendar
coordination, listing-detail loading, or agent UI.

Reopen if the tenant still cannot see the selected proposal time, if tenant preferences are shown as
the proposed time, if terminal states regain an action or expired deadline, if a missing relation is
silently replaced with a fallback, or if private slot/agent data crosses the projection boundary.
