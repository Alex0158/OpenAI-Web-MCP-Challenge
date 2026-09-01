# RIGHTSPOT-013: Establish the Operations Insights profile authority

**Type:** `architecture`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the next substantial RightSpot demonstration increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0011; the accepted local MVP; the read-only review evidence in `RIGHTSPOT-010`
without treating that proposal as canonical authority

## Task Control

- Type: `architecture`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Define the smallest authoritative, deterministic Operations Insights profile that can
  later support a manual read-only dashboard and page-authored WebMCP queries without weakening the
  existing relay workflow, privacy boundary, or reset contract.
- Current increment: `RS-WO-013-01` returned `READY_FOR_REVIEW`; the main thread accepted its bounded
  profile direction with the revisions recorded in ADR-RS-0012 and registered `RIGHTSPOT-015` for the
  first authority/persistence implementation slice.
- Next gate: `RIGHTSPOT-015` must implement and independently verify the Operations profile authority
  and reset boundary before any Operations projection consumer, route, API, UI, or WebMCP work begins.
- Execution posture: `REVIEWED_ACCEPTED_CLOSED`; this task is independent of the closed Field Desk lane,
  the closed `RIGHTSPOT-011` relay-only seam, and the unresolved Favourite/Information Request
  proposals.

## Why this task exists

The `RIGHTSPOT-010` proposal identifies Agent Operations Insights as a meaningful future RightSpot
product line, but the current relay fixture is intentionally a one-request snapshot and cannot
truthfully support a multi-record operations report. `RIGHTSPOT-011` now provides a verified pure
projection over the existing `WorkflowState`, but it is a reusable seam rather than a complete
Operations data authority. This task converts the proposal into an exact decision boundary before
cross-layer implementation begins.

## Working direction to challenge

The Advisor must test, refine, or reject these working assumptions rather than silently treat them as
accepted product truth:

- Preserve the existing relay profile and its tenant-to-agent Viewing Request Happy Path unchanged.
- Treat Operations Insights as a separate, read-first product surface, with manual controls required
  before any Agent/WebMCP interaction.
- Use an application-owned deterministic Operations profile or equivalent governed authority instead
  of hard-coded dashboard counts, an external BI service, or a disconnected fake reporting database.
- Keep the first query families narrow: upcoming viewings and listing pipeline. Favourite and
  Information Request signals remain unavailable until `RIGHTSPOT-008` and `RIGHTSPOT-009` are jointly
  reviewed and accepted.
- Keep external authentication, outbound communication, Cloud Receiver, WebMCP registration, and
  Re-entry integration out of this architecture proposal.

## RS-WO-013-01 — Define the Operations profile authority and implementation boundary

**Role:** Architecture/Data Authority Advisor  
**Status:** `ASSIGNED`  
**Parallelization:** `READ_ONLY_ADVISORY` — may run beside the active Field Desk evidence lane and
the verified Operations seam with no source write set.  
**Risk profile:** `High` for later implementation because the decision crosses data authority,
persistence, reset, time semantics, privacy, API, and UI boundaries; `Standard` for this read-only
proposal.  
**Supporting worker:** Multi-agent Architecture/Data Advisor `01a05dee-3fea-7561-9076-54bdd053f647`
(`Pauli`).  
**Source baseline:** `0f6cc8ebd7e27e9fe2241c5138873c103b136b58` on `main`, captured immediately before
dispatch. The collaborator-owned dirty and untracked paths listed in current status remain outside this
read-only Work Order.  
**Ownership:** The Advisor may inspect and execute bounded read-only checks only. The main thread owns
the decision, ADR, task updates, implementation, integration, and closure.

### Required read set

- `/Users/alex/.codex/AGENTS.md`, `/Users/alex/OpenAI-WebMCP/AGENTS.md`, and
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`.
- RightSpot `RUNBOOK.md`, `Docs/00-current-status.md`, `Docs/01-product-definition.md`,
  `Docs/02-requirements.md`, `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, and `Docs/06-validation-and-evidence.md`.
- ADR-RS-0001 through ADR-RS-0011, especially the relay workflow, source-ownership, UI, auth, and
  bounded Operations projection decisions.
- The proposal-only `RIGHTSPOT-010` task and adjacent `RIGHTSPOT-008`/`RIGHTSPOT-009` proposals;
  distinguish their owner direction and recommendations from accepted authority.
- Existing `WorkflowState`, domain types, workflow/application services, SQLite foundation and
  snapshot/reset code, route handlers, session/role resolution, tests, and current fixture behavior.
- The integrated `src/server/domain/operations-projection.ts` seam and its focused tests.
- The outer challenge/Core documents only to confirm claim and integration boundaries; do not redefine
  the outer Core.

### Required proposal contents

Return an evidence-backed English proposal that clearly labels verified facts, inference,
recommendation, assumption, unresolved decision, and non-goal. It must cover:

1. **Profile isolation:** compare a profile selector over one application, separate authoritative
   state in one SQLite database, separate profile database files, and other bounded alternatives. State
   how the relay profile remains unchanged and how role/session/assignment checks remain shared.
2. **Authority and persistence:** define the smallest source of truth for multiple listings, multiple
   Viewing Requests or appointment facts, availability slots, listing lifecycle/publication history,
   and Operations metadata. State whether `RS-WO-011` can be reused directly, adapted, or must remain
   relay-only. Do not invent history that current records cannot support.
3. **Time and lifecycle semantics:** define deterministic `asOf`, Europe/London handling, publication
   age, open/unavailable/archived/let-agreed meaning, proposed versus confirmed viewing derivation,
   stale data/freshness, relisting identity, and explicit missing-authority behavior.
4. **Fixture and reset contract:** recommend the smallest credible multi-record dataset, generation
   behavior, reset/reopen atomicity, clean-room reproduction, and how Operations data coexists with
   the existing one-request relay fixture without fabricated zero metrics.
5. **First-release query boundary:** select the smallest manual read-only result contract for
   upcoming viewings and listing pipeline; specify caps, exact counts, filters, drill-down identity,
   empty/error/stale states, and the conditions under which 008/009 signals are unavailable.
6. **Privacy and authorization:** define agent portfolio/listing scope, tenant/private-field
   omissions, object-level checks, enumeration limits, neutral failures, and the rule that natural
   language cannot widen server authority.
7. **Future consumer seams:** propose the serial/parallel sequence for profile authority, projection,
   transport, manual page, navigation, and later WebMCP. Give exact likely path ownership, shared-file
   conflicts, rollback boundaries, focused tests, browser evidence, and stop conditions.
8. **Alternatives and decision register:** compare direct current-state reads, governed projections,
   expanded relay fixtures, separate Operations profiles, charts versus tables, manual versus
   Agent-only interaction, and WebMCP now versus after manual verification.

### Forbidden actions

- Do not edit source, tests, fixtures, dependencies, configuration, database files, assets, generated
  output, canonical documents, task files, Git metadata, or the main checkout.
- Do not create an ADR, implementation task, Work Order, branch, commit, push, deployment, route, API,
  UI, WebMCP registration, or external service configuration.
- Do not add or infer Favourite/Information Request semantics, tenant identity, contact data,
  notification consent, historical events, occupancy facts, or synthetic counts as accepted truth.
- Do not claim that the verified `RS-WO-011` seam proves a dashboard, Operations profile, WebMCP
  capability, deployment, or business outcome.
- Do not use browser automation or mutate runtime state merely to manufacture evidence.

### Return gate

Return `READY_FOR_REVIEW` or `BLOCKED` with the observed source identity, fact/assumption split,
profile and authority recommendation, time/lifecycle rules, fixture/reset plan, first query boundary,
privacy matrix, exact future decomposition, unresolved decisions, alternatives, and claim limits. Stop
after the report; the main thread owns all acceptance and follow-on dispatch.

## Closure gate

Close this task only after the main thread reviews `RS-WO-013-01` and records a durable decision and
next bounded implementation gate, or explicitly defers/rejects Operations Insights with its residual
risk and reopen condition. A proposal alone does not authorize implementation.

## Reopen condition

Reopen this task if the relay fixture must serve as the Operations source, a new listing/request/
appointment lifecycle is requested, profile reset cannot remain deterministic, 008/009 signals become
part of the first query set, or WebMCP is proposed before a truthful manual result surface exists.
